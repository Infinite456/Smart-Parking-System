const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAnalytics,
  updatePricingRule,
  toggleEmergencyMode,
  updateSlotStatus,
  simulateArrival,
  getPricingRules,
  createPricingRule,
  updatePricingRuleById,
  deletePricingRule,
  simulateCameraScan
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Make all routes in this file Admin only
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAnalytics);
router.put('/pricing', updatePricingRule);
router.get('/pricing/:facilityId', getPricingRules);
router.post('/pricing', createPricingRule);
router.put('/pricing/:id', updatePricingRuleById);
router.delete('/pricing/:id', deletePricingRule);
router.post('/simulate-scan', simulateCameraScan);
router.put('/emergency-mode', toggleEmergencyMode);
router.put('/slots/:id', updateSlotStatus);
router.post('/slots/:id/simulate-arrival', simulateArrival);

module.exports = router;
