const Violation = require('../models/Violation');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const ParkingSlot = require('../models/ParkingSlot');
const socketService = require('../services/socketService');

// @desc    Get violations (all for admin, user-specific for user)
// @route   GET /api/violations
// @access  Private
exports.getViolations = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query = { userId: req.user.id };
    }

    const violations = await Violation.find(query)
      .populate('userId', 'name email phone')
      .populate('vehicleId')
      .populate('slotId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: violations.length, data: violations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Simulate/Trigger a random violation
// @route   POST /api/violations/simulate
// @access  Private (Admin only)
exports.simulateViolation = async (req, res) => {
  try {
    // 1. Grab random user, vehicle, slot
    const users = await User.find({ role: 'user' });
    const vehicles = await Vehicle.find();
    const slots = await ParkingSlot.find({ status: { $ne: 'Maintenance' } });

    if (users.length === 0 || vehicles.length === 0 || slots.length === 0) {
      return res.status(400).json({ success: false, message: 'Seeded database users, vehicles, and slots are required for simulation' });
    }

    const randomUser = users[Math.floor(Math.random() * users.length)];
    // Find a vehicle belonging to this user
    let randomVehicle = vehicles.find(v => v.userId.toString() === randomUser._id.toString());
    if (!randomVehicle) {
      randomVehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
    }
    const randomSlot = slots[Math.floor(Math.random() * slots.length)];

    const violationTypes = [
      'Overlapping Parking',
      'Wrong Vehicle Compatibility',
      'Emergency Zone Parking',
      'Unauthorized EV Charging Slot',
      'Exceeded Reservation Duration'
    ];

    const chosenType = violationTypes[Math.floor(Math.random() * violationTypes.length)];

    // 2. Create violation
    const violation = await Violation.create({
      userId: randomUser._id,
      vehicleId: randomVehicle._id,
      registrationNumber: randomVehicle.registrationNumber,
      slotId: randomSlot._id,
      type: chosenType,
      timestamp: new Date(),
      status: 'Active'
    });

    // Optionally set slot state to Occupied or Restricted to reflect violation
    randomSlot.status = 'Occupied';
    await randomSlot.save();

    // Broadcast updates
    socketService.broadcastSlotUpdate(randomSlot.facilityId, randomSlot);
    socketService.broadcastAlert(
      'danger', 
      `🚨 Violation Detected: Vehicle ${randomVehicle.registrationNumber} flagged for '${chosenType}' at Slot ${randomSlot.slotNumber}`
    );

    res.status(201).json({ success: true, data: violation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resolve violation
// @route   PUT /api/violations/:id/resolve
// @access  Private (Admin only)
exports.resolveViolation = async (req, res) => {
  try {
    const violation = await Violation.findById(req.params.id);
    if (!violation) {
      return res.status(404).json({ success: false, message: 'Violation not found' });
    }

    violation.status = 'Resolved';
    violation.resolvedAt = new Date();
    await violation.save();

    // Free the slot associated with this violation if it was occupied
    if (violation.slotId) {
      const slot = await ParkingSlot.findById(violation.slotId);
      if (slot && slot.status === 'Occupied') {
        slot.status = 'Available';
        await slot.save();
        socketService.broadcastSlotUpdate(slot.facilityId, slot);
      }
    }

    socketService.broadcastAlert('info', `Violation for vehicle ${violation.registrationNumber} resolved.`);

    res.status(200).json({ success: true, data: violation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
