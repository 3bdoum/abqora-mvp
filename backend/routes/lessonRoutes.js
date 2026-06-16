const express = require('express');
const { getLessonsByCourse, getLessonById, createLesson } = require('../controllers/lessonController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/course/:courseId', protect, getLessonsByCourse);
router.get('/:id', protect, getLessonById);
router.post('/', protect, createLesson);

module.exports = router;
