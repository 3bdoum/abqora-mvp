const Progress = require('../models/progressModel');
const Course = require('../models/courseModel');
const Quiz = require('../models/quizModel');
const Certificate = require('../models/certificateModel');
const User = require('../models/userModel');
const Lesson = require('../models/lessonModel');
const ProgressAuditLog = require('../models/progressAuditLogModel');
const { getLessonState, getOrCreateLessonProgress } = require('../utils/progressAccess');
const { canManageStudent } = require('../utils/teacherAccess');
const { isObjectId } = require('../utils/validation');

const getCertificateUrl = (certificateId) => {
    const certificatePath = `/certificate?id=${encodeURIComponent(certificateId)}`;
    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
        return certificatePath;
    }

    return `${frontendUrl.replace(/\/$/, '')}${certificatePath}`;
};

const getProgressByCourse = async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'هذا المسار متاح للطلاب فقط' });
        }
        if (!isObjectId(req.params.courseId)) {
            return res.status(400).json({ message: 'معرّف الدورة غير صالح' });
        }
        const progress = await Progress.findOne({ user: req.user.id, course: req.params.courseId })
            .populate('completedLessons')
            .populate('lessonProgress.lesson')
            .populate('quizResults.quiz');
        res.json(progress || { enrolled: false, completedLessons: [], lessonProgress: [], quizResults: [] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateLessonProgress = async (req, res) => {
    try {
        const { courseId, lessonId } = req.body;
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'الطلاب فقط يمكنهم إرسال طلب إكمال' });
        }
        if (!isObjectId(courseId) || !isObjectId(lessonId)) {
            return res.status(400).json({ message: 'بيانات الدرس غير صالحة' });
        }

        const [course, lesson, progress] = await Promise.all([
            Course.findById(courseId).populate({ path: 'lessons', options: { sort: { order: 1 } } }),
            Lesson.findById(lessonId),
            Progress.findOne({ user: req.user._id, course: courseId }),
        ]);
        if (!course || !lesson || String(lesson.course) !== String(courseId)) {
            return res.status(400).json({ message: 'الدرس لا ينتمي إلى هذه الدورة' });
        }
        if (!progress) {
            return res.status(403).json({ message: 'سجّل في الدورة أولاً' });
        }
        if (lesson.isPlaceholder) {
            return res.status(400).json({
                message: 'هذا الدرس ما زال بانتظار إعداد الشرح ورابط التطبيق العملي ولا يمكن إرساله للإكمال بعد'
            });
        }
        const currentState = getLessonState({ lessons: course.lessons, lesson, progress });
        if (currentState === 'locked') {
            return res.status(403).json({ message: 'لا يمكن تجاوز ترتيب الدروس' });
        }
        if (currentState === 'completed' || currentState === 'awaiting_approval') {
            return res.json({ progress, studentState: currentState });
        }

        const entry = getOrCreateLessonProgress(progress, lesson._id);
        const fromStatus = entry.status;
        entry.status = lesson.requiresApproval ? 'awaiting_approval' : 'completed';
        entry.submittedAt = new Date();
        entry.updatedAt = new Date();
        if (!lesson.requiresApproval) {
            entry.completedAt = new Date();
            progress.completedLessons.addToSet(lesson._id);
        }
        await progress.save();

        await ProgressAuditLog.create({
            actor: req.user._id,
            student: req.user._id,
            course: course._id,
            lesson: lesson._id,
            action: 'submitted',
            fromStatus,
            toStatus: entry.status,
        });

        return res.json({ progress, studentState: entry.status });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const updateQuizProgress = async (req, res) => {
    res.status(410).json({ message: 'يرجى استخدام مسار تسليم الاختبار لتسجيل الدرجة بشكل آمن' });
};

const completeCourse = async (req, res) => {
    res.status(410).json({ message: 'استخدم مسار التحقق من الشهادة؛ لا يمكن تعيين الإكمال من العميل' });
};

// Get progress for a linked student (Parent)
const getStudentProgress = async (req, res) => {
    try {
        const { studentId, courseId } = req.params;

        // Parent validation
        if (req.user.role === 'parent') {
            const parent = await User.findById(req.user.id);
            const hasLinkedStudent = parent.children.some((childId) => childId.toString() === studentId);
            if (!hasLinkedStudent) {
                return res.status(403).json({ message: 'غير مصرح للوصول لبيانات هذا الطالب' });
            }
        } else if (req.user.role === 'teacher') {
            if (!(await canManageStudent(req.user, studentId))) {
                return res.status(403).json({ message: 'هذا الطالب غير معيّن لهذا المعلم' });
            }
        } else if (req.user.role !== 'admin' && String(req.user.id) !== studentId) {
            return res.status(403).json({ message: 'غير مصرح' });
        }

        const progress = await Progress.findOne({ user: studentId, course: courseId })
            .populate('completedLessons')
            .populate('lessonProgress.lesson')
            .populate('quizResults.quiz');
            
        res.json(progress || { completedLessons: [], quizResults: [] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Check eligibility and generate certificate (Student)
const checkOrCreateCertificate = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.user.id;
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'طلب الشهادة متاح للطلاب فقط' });
        }
        if (!isObjectId(courseId)) {
            return res.status(400).json({ message: 'معرّف الدورة غير صالح' });
        }

        const course = await Course.findById(courseId).populate('lessons');
        if (!course) {
            return res.status(404).json({ message: 'الدورة غير موجودة' });
        }

        const progress = await Progress.findOne({ user: userId, course: courseId });
        if (!progress) {
            return res.status(400).json({ message: 'لا يوجد تقدم مسجل لهذه الدورة بعد' });
        }

        // Check if all lessons are completed
        const allLessonIds = course.lessons.map((l) => l._id.toString());
        const completedLessonIds = progress.completedLessons.map((l) => l.toString());
        const allLessonsCompleted = allLessonIds.every((id) => completedLessonIds.includes(id));

        if (!allLessonsCompleted) {
            return res.status(400).json({ message: 'يجب إكمال جميع الدروس أولاً قبل طلب الشهادة' });
        }

        // Check quizzes passing threshold (70%)
        const quizzes = await Quiz.find({ lesson: { $in: course.lessons } });
        let allQuizzesPassed = true;
        let quizFeedback = [];

        for (const quiz of quizzes) {
            const result = progress.quizResults.find(
                (r) => r.quiz && r.quiz.toString() === quiz._id.toString()
            );
            const passingPct = quiz.passingScore || 70;
            if (!result) {
                allQuizzesPassed = false;
                quizFeedback.push(`الاختبار "${quiz.title}" لم يتم إكماله.`);
            } else {
                const scorePct = (result.score / result.total) * 100;
                if (scorePct < passingPct) {
                    allQuizzesPassed = false;
                    quizFeedback.push(
                        `الاختبار "${quiz.title}" لم يجتز درجة النجاح المطلوبة (${passingPct}%). لقد حصلت على ${scorePct.toFixed(0)}%.`
                    );
                }
            }
        }

        if (!allQuizzesPassed) {
            return res.status(400).json({
                message: 'لم يتم اجتياز جميع الاختبارات بالنسبة المطلوبة للشهادة',
                details: quizFeedback,
            });
        }

        // Create or return existing certificate
        let certificate = await Certificate.findOne({ user: userId, course: courseId });
        if (!certificate) {
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
            const certificateId = `ABQ-${dateStr}-${randomHex}`;

            certificate = await Certificate.create({
                user: userId,
                course: courseId,
                certificateId,
            });

            // Save certificateUrl to progress
            progress.certificateUrl = getCertificateUrl(certificate.certificateId);
            await progress.save();
        }

        res.json(certificate);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProgressByCourse,
    updateLessonProgress,
    updateQuizProgress,
    completeCourse,
    getStudentProgress,
    checkOrCreateCertificate,
};
