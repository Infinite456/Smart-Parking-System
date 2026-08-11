const express = require('express');
const router = express.Router();
const { getChargingSlots, reserveEVChargingSlot } = require('../controllers/evController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/charging-slots', getChargingSlots);
router.post('/reserve', reserveEVChargingSlot);

module.exports = router;
