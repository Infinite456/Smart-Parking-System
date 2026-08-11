const mongoose = require('mongoose');

const PricingRuleSchema = new mongoose.Schema({
  facilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingFacility',
    required: true,
  },
  occupancyRange: {
    min: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    max: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  priceMultiplier: {
    type: Number,
    required: true,
    default: 1.0,
  },
  hourlyRate: {
    type: Number,
    required: true,
    default: 40,
  },
  evSurcharge: {
    type: Number,
    required: true,
    default: 10,
  },
  peakSurcharge: {
    type: Number,
    required: true,
    default: 15,
  },
  peakHour: {
    type: Boolean,
    default: false,
  },
  vehicleMotorcycleMultiplier: {
    type: Number,
    required: true,
    default: 0.8,
  },
  vehicleCarMultiplier: {
    type: Number,
    required: true,
    default: 1.0,
  },
  vehicleSUVMultiplier: {
    type: Number,
    required: true,
    default: 1.2,
  },
  vehicleVanMultiplier: {
    type: Number,
    required: true,
    default: 1.3,
  },
  durationThreshold: {
    type: Number,
    required: true,
    default: 4,
  },
  durationMultiplier: {
    type: Number,
    required: true,
    default: 0.9,
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('PricingRule', PricingRuleSchema);
