const mongoose = require('mongoose');

const ParkingSessionSchema = new mongoose.Schema({
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
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
  },
  entryTime: {
    type: Date,
    default: Date.now,
    required: true,
  },
  exitTime: {
    type: Date,
  },
  duration: {
    type: Number, // in minutes
  },
  amount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['Active', 'Completed'],
    default: 'Active',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ParkingSession', ParkingSessionSchema);
