const express = require('express');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const {
    listStudents,
    getStudentCourses,
    getStudentCourse,
    updateStudentLesson,
    listAiTutorExchanges,
} = require('../controllers/teacherController');

const router = express.Router();
router.use(protect, authorizeRoles('teacher', 'admin'));
router.get('/students', listStudents);
router.get('/ai-tutor', listAiTutorExchanges);
router.get('/students/:studentId/courses', getStudentCourses);
router.get('/students/:studentId/courses/:courseId', getStudentCourse);
router.patch('/students/:studentId/lessons/:lessonId', updateStudentLesson);

module.exports = router;
