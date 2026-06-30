const express = require('express');
const {
    chatWithTutor,
    getTutorHistory,
    chatWithPublicAssistant,
    createSupportRequest,
    listPublicConversations,
    updatePublicConversationReview,
    listSupportRequests,
    updateSupportRequest,
} = require('../controllers/aiTutorController');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/public-chat', chatWithPublicAssistant);
router.post('/support-requests', createSupportRequest);
router.post('/tutor', protect, chatWithTutor);
router.get('/tutor/:lessonId', protect, getTutorHistory);

router.get('/public-conversations', protect, authorizeRoles('admin'), listPublicConversations);
router.patch('/public-conversations/:id', protect, authorizeRoles('admin'), updatePublicConversationReview);
router.get('/support-requests', protect, authorizeRoles('admin'), listSupportRequests);
router.patch('/support-requests/:id', protect, authorizeRoles('admin'), updateSupportRequest);

module.exports = router;
