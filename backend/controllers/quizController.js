const Quiz = require('../models/quizModel');
const Lesson = require('../models/lessonModel');
const Progress = require('../models/progressModel');

const getQuizByLesson = async (req, res) => {
    const quiz = await Quiz.findOne({ lesson: req.params.lessonId });
    if (!quiz) {
        return res.status(404).json({ message: 'الاختبار غير موجود' });
    }
    res.json(quiz);
};

const submitQuiz = async (req, res) => {
    const { quizId, answers } = req.body;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
        return res.status(404).json({ message: 'الاختبار غير موجود' });
    }

    const lesson = await Lesson.findById(quiz.lesson);
    if (!lesson) {
        return res.status(400).json({ message: 'درس الاختبار غير موجود' });
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
