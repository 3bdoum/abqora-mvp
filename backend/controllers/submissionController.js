const Submission = require('../models/submissionModel');
const Lesson = require('../models/lessonModel');

// Submit a project (Student)
const submitProject = async (req, res) => {
    try {
        const { lessonId, projectUrl, description } = req.body;
        if (!lessonId || !projectUrl || !description) {
            return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
        }

        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'الدرس غير موجود' });
        }

        // Check if there is an existing submission for this lesson by the student
        let submission = await Submission.findOne({ user: req.user.id, lesson: lessonId });
        if (submission) {
            submission.projectUrl = projectUrl;
            submission.description = description;
            submission.status = 'pending';
            submission.feedback = '';
            await submission.save();
        } else {
            submission = await Submission.create({
                user: req.user.id,
                lesson: lessonId,
                projectUrl,
                description,
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

// Review a submission (Admin)
const reviewSubmission = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
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

        submission.status = status;
        submission.feedback = feedback || '';
        await submission.save();

        res.json(submission);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { submitProject, getSubmissions, reviewSubmission };
