const express = require('express');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const {
    listStudents,
    getStudentCourses,
    getStudentCourse,
    updateStudentLesson,
} = require('../controllers/teacherController');

const router = express.Router();
router.use(protect, authorizeRoles('teacher', 'admin'));
router.get('/students', listStudents);
router.get('/students/:studentId/courses', getStudentCourses);
router.get('/students/:studentId/courses/:courseId', getStudentCourse);
router.patch('/students/:studentId/lessons/:lessonId', updateStudentLesson);

module.exports = router;
