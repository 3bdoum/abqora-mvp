const express = require('express');
const { registerUser, loginUser, currentUser, linkStudent, getLinkedStudents } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, currentUser);
router.post('/link-student', protect, linkStudent);
router.get('/linked-students', protect, getLinkedStudents);

module.exports = router;
