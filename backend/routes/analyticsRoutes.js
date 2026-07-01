const express = require('express');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const { trackPublicEvent, getAdminAnalyticsSummary } = require('../controllers/analyticsController');

const router = express.Router();

router.post('/public-event', trackPublicEvent);
router.get('/admin/summary', protect, authorizeRoles('admin'), getAdminAnalyticsSummary);

module.exports = router;
