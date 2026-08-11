const express = require('express');
const router = express.Router();
const {
  getFacilities,
  getSlots,
  getRecommendation
} = require('../controllers/parkingController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getFacilities);

router.route('/:facilityId/slots')
  .get(getSlots);

router.route('/:facilityId/recommend')
  .get(getRecommendation);

module.exports = router;
