const express = require('express');
const { chatWithTutor, getTutorHistory } = require('../controllers/aiTutorController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/tutor', protect, chatWithTutor);
router.get('/tutor/:lessonId', protect, getTutorHistory);

module.exports = router;
