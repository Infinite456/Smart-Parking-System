const express = require('express');
const router = express.Router();
const { startSession, endSession } = require('../controllers/sessionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/start', startSession);
router.post('/end', endSession);

module.exports = router;
