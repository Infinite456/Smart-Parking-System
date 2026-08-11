const mongoose = require('mongoose');

const ParkingFacilitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a facility name'],
    trim: true,
  },
  location: {
    type: String,
    required: [true, 'Please add a location/address'],
    trim: true,
  },
  totalSlots: {
    type: Number,
    required: [true, 'Please add total capacity of slots'],
  },
  operatingHours: {
    type: String,
    default: '24/7',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ParkingFacility', ParkingFacilitySchema);
