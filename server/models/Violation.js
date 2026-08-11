const mongoose = require('mongoose');

const ViolationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
  },
  registrationNumber: {
    type: String,
    required: [true, 'Please provide the registration number of the vehicle'],
    uppercase: true,
    trim: true,
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSlot',
  },
  type: {
    type: String,
    enum: [
      'Overlapping Parking',
      'Wrong Vehicle Compatibility',
      'Emergency Zone Parking',
      'Unauthorized EV Charging Slot',
      'Exceeded Reservation Duration',
    ],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Active', 'Resolved'],
    default: 'Active',
  },
  resolvedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Violation', ViolationSchema);
