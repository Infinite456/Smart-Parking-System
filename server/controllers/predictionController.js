const { getOccupancyPredictions } = require('../services/predictionService');

// @desc    Get facility occupancy predictions
// @route   GET /api/predictions/:facilityId
// @access  Private
exports.getPredictions = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const predictions = await getOccupancyPredictions(facilityId);
    
    res.status(200).json({
      success: true,
      count: predictions.length,
      data: predictions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
