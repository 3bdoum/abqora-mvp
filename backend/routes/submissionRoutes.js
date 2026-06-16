const express = require('express');
const { submitProject, getSubmissions, reviewSubmission } = require('../controllers/submissionController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, submitProject);
router.get('/', protect, getSubmissions);
router.put('/:id/review', protect, reviewSubmission);

module.exports = router;
