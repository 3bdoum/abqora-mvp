const Progress = require('../models/progressModel');
const Course = require('../models/courseModel');
const Quiz = require('../models/quizModel');
const Certificate = require('../models/certificateModel');
const User = require('../models/userModel');

const getProgressByCourse = async (req, res) => {
    try {
        const progress = await Progress.findOne({ user: req.user.id, course: req.params.courseId })
            .populate('completedLessons')
            .populate('quizResults.quiz');
        res.json(progress || { completedLessons: [], quizResults: [] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateLessonProgress = async (req, res) => {
    try {
        const { courseId, lessonId } = req.body;
        const progress = await Progress.findOneAndUpdate(
            { user: req.user.id, course: courseId },
            { $addToSet: { completedLessons: lessonId } },
            { upsert: true, new: true }
        );
        res.json(progress);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateQuizProgress = async (req, res) => {
    try {
        const { courseId, quizId, score, total } = req.body;
        
        let progress = await Progress.findOne({ user: req.user.id, course: courseId });
        if (!progress) {
            progress = new Progress({
                user: req.user.id,
                course: courseId,
                completedLessons: [],
                quizResults: []
            });
        }

        const existingResultIndex = progress.quizResults.findIndex(
            (r) => r.quiz && r.quiz.toString() === quizId
        );

        const quizResultObj = {
            quiz: quizId,
            score,
            total,
            completedAt: new Date()
        };

        if (existingResultIndex > -1) {
            progress.quizResults[existingResultIndex] = quizResultObj;
        } else {
            progress.quizResults.push(quizResultObj);
        }

        await progress.save();
        res.json(progress);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const completeCourse = async (req, res) => {
    try {
        const { courseId, certificateUrl } = req.body;
        const progress = await Progress.findOneAndUpdate(
            { user: req.user.id, course: courseId },
            { certificateUrl },
            { new: true }
        );
        res.json(progress);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get progress for a linked student (Parent)
const getStudentProgress = async (req, res) => {
    try {
        const { studentId, courseId } = req.params;

        // Parent validation
        if (req.user.role === 'parent') {
            const parent = await User.findById(req.user.id);
            if (!parent.children.includes(studentId)) {
                return res.status(403).json({ message: 'غير مصرح للوصول لبيانات هذا الطالب' });
            }
        } else if (req.user.role !== 'admin' && req.user.id !== studentId) {
            return res.status(403).json({ message: 'غير مصرح' });
        }

        const progress = await Progress.findOne({ user: studentId, course: courseId })
            .populate('completedLessons')
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
            progress.certificateUrl = `/certificate/${certificate.certificateId}`;
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
