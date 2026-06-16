const express = require('express');
const { getProgressByCourse, updateLessonProgress, updateQuizProgress, completeCourse, getStudentProgress, checkOrCreateCertificate } = require('../controllers/progressController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/:courseId', protect, getProgressByCourse);
router.post('/lesson', protect, updateLessonProgress);
router.post('/quiz', protect, updateQuizProgress);
router.post('/complete', protect, completeCourse);
router.get('/student/:studentId/:courseId', protect, getStudentProgress);
router.post('/verify-certificate', protect, checkOrCreateCertificate);

module.exports = router;
