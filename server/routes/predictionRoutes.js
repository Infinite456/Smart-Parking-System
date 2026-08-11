const express = require('express');
const router = express.Router();
const { getPredictions } = require('../controllers/predictionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/:facilityId', getPredictions);

module.exports = router;
