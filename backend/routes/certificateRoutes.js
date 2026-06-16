const express = require('express');
const { getCertificate } = require('../controllers/certificateController');

const router = express.Router();

router.get('/:certificateId', getCertificate);

module.exports = router;
