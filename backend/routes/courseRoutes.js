const express = require('express');
const { getCourses, getCourseById, createCourse } = require('../controllers/courseController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/', protect, getCourses);
router.get('/:id', protect, getCourseById);
router.post('/', protect, createCourse);

module.exports = router;
