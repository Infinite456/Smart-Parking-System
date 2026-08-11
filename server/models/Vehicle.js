const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  registrationNumber: {
    type: String,
    required: [true, 'Please add a registration number / license plate'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['Motorcycle', 'Car', 'SUV', 'Van'],
    required: [true, 'Please select a vehicle type'],
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'large'],
    required: [true, 'Please select a vehicle size'],
  },
  isEV: {
    type: Boolean,
    default: false,
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 100,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Vehicle', VehicleSchema);
