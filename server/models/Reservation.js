const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
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
  facilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingFacility',
    required: true,
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSlot',
    required: true,
  },
  startTime: {
    type: Date,
    required: [true, 'Please add a reservation start time'],
  },
  endTime: {
    type: Date,
    required: [true, 'Please add a reservation end time'],
  },
  status: {
    type: String,
    enum: ['Pending', 'Active', 'Completed', 'Cancelled', 'Expired'],
    default: 'Pending',
  },
  price: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Paid', 'Failed'],
    default: 'Unpaid',
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Card', 'NetBanking', 'Wallet', 'Cash', 'None'],
    default: 'None',
  },
  transactionId: {
    type: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Reservation', ReservationSchema);
