const User = require('../models/User');
const Vehicle = require('../models/Vehicle');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user vehicles
// @route   GET /api/vehicles
// @access  Private
exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ userId: req.user.id });
    res.status(200).json({ success: true, count: vehicles.length, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add new vehicle
// @route   POST /api/vehicles
// @access  Private
exports.addVehicle = async (req, res) => {
  try {
    const { registrationNumber, type, size, isEV, batteryLevel } = req.body;

    // Check if vehicle registration number already exists
    const vehicleExists = await Vehicle.findOne({ registrationNumber });
    if (vehicleExists) {
      return res.status(400).json({ success: false, message: 'Vehicle already registered' });
    }

    const vehicle = await Vehicle.create({
      userId: req.user.id,
      registrationNumber,
      type,
      size,
      isEV: isEV || false,
      batteryLevel: batteryLevel || 100,
    });

    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update vehicle details
// @route   PUT /api/vehicles/:id
// @access  Private
exports.updateVehicle = async (req, res) => {
  try {
    let vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Make sure vehicle belongs to user
    if (vehicle.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to update this vehicle' });
    }

    const { registrationNumber, type, size, isEV, batteryLevel } = req.body;

    vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { registrationNumber, type, size, isEV, batteryLevel },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Make sure vehicle belongs to user
    if (vehicle.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this vehicle' });
    }

    // Prevent deletion if associated with active/pending reservations
    const Reservation = require('../models/Reservation');
    const activeReservation = await Reservation.findOne({
      vehicleId: req.params.id,
      status: { $in: ['Pending', 'Active'] }
    });

    if (activeReservation) {
      return res.status(400).json({
        success: false,
        message: 'This vehicle cannot be deleted because it is currently associated with an active or pending reservation.'
      });
    }

    await vehicle.deleteOne();

    res.status(200).json({ success: true, message: 'Vehicle removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
