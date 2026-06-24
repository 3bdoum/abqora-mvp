const User = require('../models/userModel');
const Course = require('../models/courseModel');
const Lesson = require('../models/lessonModel');
const Progress = require('../models/progressModel');
const Quiz = require('../models/quizModel');
const TeacherStudentAssignment = require('../models/teacherStudentAssignmentModel');
const ProgressAuditLog = require('../models/progressAuditLogModel');
const { canManageStudent } = require('../utils/teacherAccess');
const {
    findLessonProgress,
    getLessonState,
    getOrCreateLessonProgress,
    serializeCourseProgress,
} = require('../utils/progressAccess');
const { isObjectId, cleanText } = require('../utils/validation');

const requireStudentAccess = async (req, res, studentId) => {
    if (!isObjectId(studentId)) {
        res.status(400).json({ message: 'معرّف الطالب غير صالح' });
        return false;
    }
    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
        res.status(404).json({ message: 'الطالب غير موجود' });
        return false;
    }
    if (!(await canManageStudent(req.user, studentId))) {
        res.status(403).json({ message: 'هذا الطالب غير معيّن لهذا المعلم' });
        return false;
    }
    return student;
};

const listStudents = async (req, res) => {
    try {
        let students;
        if (req.user.role === 'admin') {
            students = await User.find({ role: 'student' }).select('name email ageGroup').sort('name');
        } else {
            const assignments = await TeacherStudentAssignment.find({
                teacher: req.user._id,
                active: true,
            }).populate('student', 'name email ageGroup');
            students = assignments.map((assignment) => assignment.student).filter(Boolean);
        }
        return res.json(students);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const hasLessonVideos = (lesson) => Boolean(
    lesson.videoUrls?.some((video) => video.url?.trim()) || lesson.videoUrl?.trim()
);

const buildCourseView = (course, progress, quizLessonIds = new Set()) => ({
    ...course.toObject(),
    progress: serializeCourseProgress(course, progress),
    lessons: course.lessons.map((lesson) => {
        const entry = findLessonProgress(progress, lesson._id);
        return {
            ...lesson.toObject(),
            studentState: getLessonState({ lessons: course.lessons, lesson, progress }),
            accessOverride: entry?.accessOverride || 'default',
            feedback: entry?.feedback || '',
            submittedAt: entry?.submittedAt || null,
            contentReady: {
                hasVideos: hasLessonVideos(lesson),
                hasCodeOrgLink: Boolean(lesson.codeOrgLink?.trim()),
                hasQuiz: quizLessonIds.has(String(lesson._id)),
            },
        };
    }),
});

const getQuizLessonIds = async (courses) => {
    const lessonIds = courses.flatMap((course) => course.lessons.map((lesson) => lesson._id));
    const quizzes = await Quiz.find({ lesson: { $in: lessonIds } }).select('lesson');
    return new Set(quizzes.map((quiz) => String(quiz.lesson)));
};

const getStudentCourses = async (req, res) => {
    try {
        const student = await requireStudentAccess(req, res, req.params.studentId);
        if (!student) return;

        const progressList = await Progress.find({ user: student._id });
        const courseIds = progressList.map((progress) => progress.course);
        const courses = await Course.find({ _id: { $in: courseIds } }).populate({
            path: 'lessons',
            options: { sort: { order: 1 } }
        });
        const progressMap = new Map(progressList.map((progress) => [String(progress.course), progress]));
        const quizLessonIds = await getQuizLessonIds(courses);
        return res.json({
            student,
            courses: courses.map((course) => buildCourseView(course, progressMap.get(String(course._id)), quizLessonIds)),
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getStudentCourse = async (req, res) => {
    try {
        const { studentId, courseId } = req.params;
        const student = await requireStudentAccess(req, res, studentId);
        if (!student) return;
        if (!isObjectId(courseId)) return res.status(400).json({ message: 'معرّف الدورة غير صالح' });

        const [course, progress, audit] = await Promise.all([
            Course.findById(courseId).populate({ path: 'lessons', options: { sort: { order: 1 } } }),
            Progress.findOne({ user: studentId, course: courseId }),
            ProgressAuditLog.find({ student: studentId, course: courseId })
                .populate('actor', 'name role')
                .populate('lesson', 'title stableId order')
                .sort('-createdAt')
                .limit(100),
        ]);
        if (!course || !progress) return res.status(404).json({ message: 'تسجيل الدورة غير موجود' });
        const quizLessonIds = await getQuizLessonIds([course]);

        return res.json({ student, course: buildCourseView(course, progress, quizLessonIds), audit });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const updateStudentLesson = async (req, res) => {
    try {
        const { studentId, lessonId } = req.params;
        const student = await requireStudentAccess(req, res, studentId);
        if (!student) return;
        if (!isObjectId(lessonId)) return res.status(400).json({ message: 'معرّف الدرس غير صالح' });

        const action = cleanText(req.body.action, 30);
        const note = cleanText(req.body.feedback, 500);
        if (!['approve', 'reject', 'unlock', 'relock'].includes(action)) {
            return res.status(400).json({ message: 'الإجراء المطلوب غير صالح' });
        }

        const lesson = await Lesson.findById(lessonId);
        if (!lesson) return res.status(404).json({ message: 'الدرس غير موجود' });
        const [course, progress] = await Promise.all([
            Course.findById(lesson.course).populate({ path: 'lessons', options: { sort: { order: 1 } } }),
            Progress.findOne({ user: studentId, course: lesson.course }),
        ]);
        if (!course || !progress) return res.status(404).json({ message: 'الطالب غير مسجل في هذه الدورة' });

        const entry = getOrCreateLessonProgress(progress, lesson._id);
        const fromStatus = getLessonState({ lessons: course.lessons, lesson, progress });
        let auditAction;

        if (action === 'approve') {
            if (entry.status !== 'awaiting_approval') {
                return res.status(409).json({ message: 'لا يوجد طلب إكمال بانتظار الموافقة لهذا الدرس' });
            }
            entry.status = 'completed';
            entry.accessOverride = 'default';
            entry.feedback = note;
            entry.reviewedAt = new Date();
            entry.reviewedBy = req.user._id;
            entry.completedAt = new Date();
            progress.completedLessons.addToSet(lesson._id);
            auditAction = 'approved';
        } else if (action === 'reject') {
            if (entry.status !== 'awaiting_approval') {
                return res.status(409).json({ message: 'لا يوجد طلب إكمال بانتظار المراجعة' });
            }
            entry.status = 'in_progress';
            entry.feedback = note;
            entry.reviewedAt = new Date();
            entry.reviewedBy = req.user._id;
            auditAction = 'rejected';
        } else if (action === 'unlock') {
            entry.accessOverride = 'unlocked';
            entry.feedback = note;
            auditAction = 'unlocked';
        } else {
            if (entry.status === 'completed') {
                return res.status(409).json({ message: 'لا يمكن إعادة قفل درس مكتمل دون إلغاء الإكمال' });
            }
            if (entry.status === 'awaiting_approval') {
                return res.status(409).json({ message: 'وافق على طلب الإكمال أو ارفضه قبل إعادة قفل الدرس' });
            }
            entry.accessOverride = 'locked';
            entry.feedback = note;
            auditAction = 'relocked';
        }

        entry.updatedAt = new Date();
        await progress.save();
        const toStatus = getLessonState({ lessons: course.lessons, lesson, progress });
        await ProgressAuditLog.create({
            actor: req.user._id,
            student: student._id,
            course: course._id,
            lesson: lesson._id,
            action: auditAction,
            fromStatus,
            toStatus,
            note,
        });

        return res.json({ message: 'تم تحديث حالة الدرس', studentState: toStatus });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = { listStudents, getStudentCourses, getStudentCourse, updateStudentLesson };
