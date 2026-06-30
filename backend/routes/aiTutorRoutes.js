const express = require('express');
const { chatWithTutor, getTutorHistory, chatWithPublicAssistant } = require('../controllers/aiTutorController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/public-chat', chatWithPublicAssistant);
router.post('/tutor', protect, chatWithTutor);
router.get('/tutor/:lessonId', protect, getTutorHistory);

module.exports = router;
