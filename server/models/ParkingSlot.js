const mongoose = require('mongoose');

const ParkingSlotSchema = new mongoose.Schema({
  facilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingFacility',
    required: true,
  },
  slotNumber: {
    type: String,
    required: [true, 'Please add a slot number (e.g. A-10)'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['Available', 'Occupied', 'Reserved', 'EV Charging', 'Maintenance', 'Emergency Restricted'],
    default: 'Available',
  },
  vehicleType: {
    type: String,
    enum: ['Motorcycle', 'Car', 'SUV', 'Van', 'All'],
    default: 'All',
  },
  vehicleSize: {
    type: String,
    enum: ['small', 'medium', 'large'],
    default: 'medium',
  },
  isEV: {
    type: Boolean,
    default: false,
  },
  isAccessible: {
    type: Boolean,
    default: false,
  },
  coordinates: {
    x: {
      type: Number,
      required: true,
    },
    y: {
      type: Number,
      required: true,
    },
  },
}, {
  timestamps: true,
});

// Set an index for quick lookup on facility and status
ParkingSlotSchema.index({ facilityId: 1, status: 1 });
ParkingSlotSchema.index({ facilityId: 1, slotNumber: 1 }, { unique: true });

module.exports = mongoose.model('ParkingSlot', ParkingSlotSchema);
