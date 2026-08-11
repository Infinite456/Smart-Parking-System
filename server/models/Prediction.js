const mongoose = require('mongoose');

const PredictionSchema = new mongoose.Schema({
  facilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingFacility',
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
  predictedOccupancy: {
    type: Number, // percentage, e.g. 75.5 for 75.5%
    required: true,
    min: 0,
    max: 100,
  },
  predictedAvailableSlots: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

// Composite index for fast lookup of predictions over time
PredictionSchema.index({ facilityId: 1, timestamp: 1 });

module.exports = mongoose.model('Prediction', PredictionSchema);
