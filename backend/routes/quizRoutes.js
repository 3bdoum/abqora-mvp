const express = require('express');
const { getQuizByLesson, submitQuiz } = require('../controllers/quizController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/lesson/:lessonId', protect, getQuizByLesson);
router.post('/submit', protect, submitQuiz);

module.exports = router;
