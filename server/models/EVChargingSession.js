const mongoose = require('mongoose');

const EVChargingSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSlot',
    required: true,
  },
  startTime: {
    type: Date,
    default: Date.now,
    required: true,
  },
  endTime: {
    type: Date,
  },
  batteryBefore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  batteryAfter: {
    type: Number,
    min: 0,
    max: 100,
  },
  status: {
    type: String,
    enum: ['Charging', 'Completed'],
    default: 'Charging',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('EVChargingSession', EVChargingSessionSchema);
