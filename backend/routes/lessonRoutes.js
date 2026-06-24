const express = require('express');
const {
    getLessonsByCourse,
    getLessonById,
    createLesson,
    updateLesson,
} = require('../controllers/lessonController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/course/:courseId', protect, getLessonsByCourse);
router.get('/:id', protect, getLessonById);
router.post('/', protect, createLesson);
router.put('/:id', protect, updateLesson);

module.exports = router;
