const express = require('express');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const {
    getPublicHomeAds,
    listAds,
    createAd,
    updateAd,
    deleteAd,
} = require('../controllers/advertisementController');

const router = express.Router();

router.get('/public/home', getPublicHomeAds);

router.use(protect, authorizeRoles('admin'));
router.get('/', listAds);
router.post('/', createAd);
router.put('/:id', updateAd);
router.delete('/:id', deleteAd);

module.exports = router;
