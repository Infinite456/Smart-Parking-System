const express = require('express');
const router = express.Router();
const { getViolations, resolveViolation, simulateViolation } = require('../controllers/violationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getViolations);

// Admin-only endpoints
router.post('/simulate', authorize('admin'), simulateViolation);
router.put('/:id/resolve', authorize('admin'), resolveViolation);

module.exports = router;
