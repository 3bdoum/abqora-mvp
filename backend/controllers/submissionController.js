const Submission = require('../models/submissionModel');
const Lesson = require('../models/lessonModel');
const Course = require('../models/courseModel');
const Progress = require('../models/progressModel');
const TeacherStudentAssignment = require('../models/teacherStudentAssignmentModel');
const { getLessonState } = require('../utils/progressAccess');
const { canManageStudent } = require('../utils/teacherAccess');
const { cleanText, isObjectId, isSafeExternalUrl } = require('../utils/validation');

// Submit a project (Student)
const submitProject = async (req, res) => {
    try {
        const { lessonId, projectUrl, description } = req.body;
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'التسليم متاح للطلاب فقط' });
        }
        if (!isObjectId(lessonId) || !projectUrl || !description) {
            return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
        }
        if (!isSafeExternalUrl(projectUrl)) {
            return res.status(400).json({ message: 'يجب أن يكون رابط المشروع آمناً ويبدأ بـ https' });
        }

        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'الدرس غير موجود' });
        }

        const [course, progress] = await Promise.all([
            Course.findById(lesson.course).populate({ path: 'lessons', options: { sort: { order: 1 } } }),
            Progress.findOne({ user: req.user._id, course: lesson.course }),
        ]);
        if (!progress || getLessonState({ lessons: course.lessons, lesson, progress }) === 'locked') {
            return res.status(403).json({ message: 'لا يمكن التسليم لدرس مقفل' });
        }

        // Check if there is an existing submission for this lesson by the student
        let submission = await Submission.findOne({ user: req.user.id, lesson: lessonId });
        if (submission) {
            submission.projectUrl = projectUrl.trim();
            submission.description = cleanText(description, 1500);
            submission.status = 'pending';
            submission.feedback = '';
            await submission.save();
        } else {
            submission = await Submission.create({
                user: req.user.id,
                lesson: lessonId,
                projectUrl: projectUrl.trim(),
                description: cleanText(description, 1500),
                status: 'pending',
            });
        }

        res.status(201).json(submission);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get submissions (Student gets their own, Admin gets all)
const getSubmissions = async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            const submissions = await Submission.find()
                .populate('user', 'name email')
                .populate('lesson', 'title course')
                .sort('-createdAt');
            return res.json(submissions);
        } else if (req.user.role === 'teacher') {
            const assignments = await TeacherStudentAssignment.find({ teacher: req.user._id, active: true });
            const submissions = await Submission.find({ user: { $in: assignments.map((item) => item.student) } })
                .populate('user', 'name email')
                .populate('lesson', 'title course')
                .sort('-createdAt');
            return res.json(submissions);
        } else if (req.user.role === 'student') {
            const submissions = await Submission.find({ user: req.user.id })
                .populate('lesson', 'title')
                .sort('-createdAt');
            return res.json(submissions);
        } else {
            return res.status(403).json({ message: 'غير مصرح' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Review a submission (assigned teacher or admin)
const reviewSubmission = async (req, res) => {
    try {
        if (!['teacher', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'غير مصرح للقيام بهذا الإجراء' });
        }

        const { status, feedback } = req.body;
        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'حالة غير صالحة' });
        }

        const submission = await Submission.findById(req.params.id);
        if (!submission) {
            return res.status(404).json({ message: 'التقديم غير موجود' });
        }

        if (!(await canManageStudent(req.user, submission.user))) {
            return res.status(403).json({ message: 'هذا الطالب غير معيّن لهذا المعلم' });
        }

        submission.status = status;
        submission.feedback = cleanText(feedback, 500);
        await submission.save();

        res.json(submission);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { submitProject, getSubmissions, reviewSubmission };
