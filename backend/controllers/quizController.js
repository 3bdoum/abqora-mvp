const Quiz = require('../models/quizModel');
const Lesson = require('../models/lessonModel');
const Progress = require('../models/progressModel');
const Course = require('../models/courseModel');
const { getLessonState } = require('../utils/progressAccess');
const { isObjectId } = require('../utils/validation');

const ensureQuizAccess = async (user, lesson) => {
    if (user.role !== 'student') return ['teacher', 'admin'].includes(user.role);
    const [course, progress] = await Promise.all([
        Course.findById(lesson.course).populate({ path: 'lessons', options: { sort: { order: 1 } } }),
        Progress.findOne({ user: user._id, course: lesson.course }),
    ]);
    if (!course || !progress) return false;
    return getLessonState({ lessons: course.lessons, lesson, progress }) !== 'locked';
};

const getQuizByLesson = async (req, res) => {
    if (!isObjectId(req.params.lessonId)) {
        return res.status(400).json({ message: 'معرّف الدرس غير صالح' });
    }
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: 'الدرس غير موجود' });
    if (!(await ensureQuizAccess(req.user, lesson))) {
        return res.status(403).json({ message: 'لا يمكن الوصول إلى اختبار درس مقفل' });
    }
    const quiz = await Quiz.findOne({ lesson: req.params.lessonId });
    if (!quiz) {
        return res.status(404).json({ message: 'الاختبار غير موجود' });
    }
    res.json(quiz);
};

const submitQuiz = async (req, res) => {
    const { quizId, answers } = req.body;
    if (req.user.role !== 'student' || !isObjectId(quizId) || !Array.isArray(answers)) {
        return res.status(400).json({ message: 'بيانات الاختبار غير صالحة' });
    }
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
        return res.status(404).json({ message: 'الاختبار غير موجود' });
    }

    const lesson = await Lesson.findById(quiz.lesson);
    if (!lesson) {
        return res.status(400).json({ message: 'درس الاختبار غير موجود' });
    }
    if (!(await ensureQuizAccess(req.user, lesson))) {
        return res.status(403).json({ message: 'لا يمكن إرسال اختبار درس مقفل' });
    }

    let score = 0;
    quiz.questions.forEach((question, index) => {
        if (answers[index] === question.correctIndex) {
            score += 1;
        }
    });

    const result = {
        quiz: quiz._id,
        score,
        total: quiz.questions.length,
        completedAt: new Date(),
    };

    let progress = await Progress.findOne({ user: req.user.id, course: lesson.course });
    if (!progress) {
        progress = new Progress({
            user: req.user.id,
            course: lesson.course,
            completedLessons: [],
            quizResults: []
        });
    }

    const existingResultIndex = progress.quizResults.findIndex(
        (r) => r.quiz && r.quiz.toString() === quizId
    );

    const quizResultObj = {
        quiz: quiz._id,
        score,
        total: quiz.questions.length,
        completedAt: new Date()
    };

    if (existingResultIndex > -1) {
        progress.quizResults[existingResultIndex] = quizResultObj;
    } else {
        progress.quizResults.push(quizResultObj);
    }

    await progress.save();

    res.json({ score, total: quiz.questions.length });
};

module.exports = { getQuizByLesson, submitQuiz };
