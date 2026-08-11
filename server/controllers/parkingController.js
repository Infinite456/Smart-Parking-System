const ParkingFacility = require('../models/ParkingFacility');
const ParkingSlot = require('../models/ParkingSlot');
const { recommendSlots } = require('../services/recommendationService');
const { calculateDynamicPrice } = require('../services/pricingService');

// @desc    Get all parking facilities
// @route   GET /api/parking
// @access  Private
exports.getFacilities = async (req, res) => {
  try {
    const facilities = await ParkingFacility.find();
    res.status(200).json({ success: true, count: facilities.length, data: facilities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get parking slots of a facility (along with current pricing)
// @route   GET /api/parking/:facilityId/slots
// @access  Private
exports.getSlots = async (req, res) => {
  try {
    const { facilityId } = req.params;
    
    // Fetch slots
    const slots = await ParkingSlot.find({ facilityId });
    
    // Fetch dynamic pricing details for normal and EV slots
    const standardPricing = await calculateDynamicPrice(facilityId, false);
    const evPricing = await calculateDynamicPrice(facilityId, true);

    const data = slots.map(slot => {
      const pricing = slot.isEV ? evPricing : standardPricing;
      return {
        ...slot.toObject(),
        currentPrice: pricing.price,
        pricingExplanation: pricing.reason
      };
    });

    res.status(200).json({
      success: true,
      count: slots.length,
      pricing: {
        standard: standardPricing,
        ev: evPricing
      },
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get AI parking slot recommendation
// @route   GET /api/parking/:facilityId/recommend
// @access  Private
exports.getRecommendation = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { vehicleId } = req.query;

    if (!vehicleId) {
      return res.status(400).json({ success: false, message: 'Please provide a vehicleId parameter' });
    }

    const recommendation = await recommendSlots(facilityId, vehicleId);
    
    // If recommendation has slot, attach current price
    if (recommendation.recommended) {
      const pricing = await calculateDynamicPrice(facilityId, recommendation.recommended.slot.isEV);
      recommendation.recommended.currentPrice = pricing.price;
      recommendation.recommended.pricingExplanation = pricing.reason;
    }

    res.status(200).json({ success: true, data: recommendation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
