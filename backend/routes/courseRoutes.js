const express = require('express');
const { getCourses, getCourseById, enrollInCourse, createCourse } = require('../controllers/courseController');
const protect = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuthMiddleware');

const router = express.Router();
router.get('/', optionalAuth, getCourses);
router.get('/:id', protect, getCourseById);
router.post('/:id/enroll', protect, enrollInCourse);
router.post('/', protect, createCourse);

module.exports = router;
