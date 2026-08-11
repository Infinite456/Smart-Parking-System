const Reservation = require('../models/Reservation');
const ParkingSlot = require('../models/ParkingSlot');
const Vehicle = require('../models/Vehicle');
const { calculateDynamicPrice } = require('../services/pricingService');
const socketService = require('../services/socketService');

// @desc    Create a slot reservation
// @route   POST /api/reservations
// @access  Private
exports.createReservation = async (req, res) => {
  try {
    const { vehicleId, facilityId, slotId, startTime, endTime, paymentMethod, transactionId } = req.body;

    if (!vehicleId || !facilityId || !slotId || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Please provide all reservation fields' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    // 1. Fetch slot & check compatibility/status
    const slot = await ParkingSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Parking slot not found' });
    }

    if (slot.status === 'Maintenance') {
      return res.status(400).json({ success: false, message: 'This slot is currently under maintenance' });
    }

    if (slot.status === 'Emergency Restricted') {
      return res.status(400).json({ success: false, message: '🚨 This slot is restricted due to active emergency corridor' });
    }

    // 2. Validate vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // 3. Prevent Double Booking
    const overlappingReservation = await Reservation.findOne({
      slotId,
      status: { $in: ['Pending', 'Active'] },
      startTime: { $lt: end },
      endTime: { $gt: start }
    });

    if (overlappingReservation) {
      return res.status(400).json({
        success: false,
        message: 'This slot is already reserved during the requested time window'
      });
    }

    // 4. Calculate pricing
    const hours = Math.ceil((end - start) / (1000 * 60 * 60)) || 1;
    const pricing = await calculateDynamicPrice(facilityId, slot.isEV, vehicleId, hours, start);
    const totalPrice = pricing.price * hours;

    // 5. Create reservation
    const reservation = await Reservation.create({
      userId: req.user.id,
      vehicleId,
      facilityId,
      slotId,
      startTime: start,
      endTime: end,
      price: totalPrice,
      status: 'Pending',
      paymentStatus: paymentMethod && paymentMethod !== 'None' ? 'Paid' : 'Unpaid',
      paymentMethod: paymentMethod || 'None',
      transactionId: transactionId || ''
    });

    // 6. Update Slot status to Reserved
    slot.status = 'Reserved';
    await slot.save();

    // 7. Emit updates via Socket.IO
    socketService.broadcastSlotUpdate(facilityId, slot);
    socketService.broadcastAlert('info', `New reservation created for Slot ${slot.slotNumber} by user ${req.user.name}`);

    // Populate references for frontend display
    const populated = await Reservation.findById(reservation._id)
      .populate('vehicleId')
      .populate('slotId')
      .populate('facilityId');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get reservations (all for admin, user-specific for user)
// @route   GET /api/reservations
// @access  Private
exports.getReservations = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query = { userId: req.user.id };
    }

    const reservations = await Reservation.find(query)
      .populate('vehicleId')
      .populate('facilityId')
      .populate('slotId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reservations.length, data: reservations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel a reservation
// @route   PUT /api/reservations/:id/cancel
// @access  Private
exports.cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    // Make sure user owns reservation (or admin)
    if (reservation.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to cancel this reservation' });
    }

    if (reservation.status === 'Completed' || reservation.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: `Reservation already ${reservation.status}` });
    }

    // Cancel reservation
    reservation.status = 'Cancelled';
    await reservation.save();

    // Free the slot
    const slot = await ParkingSlot.findById(reservation.slotId);
    if (slot && slot.status === 'Reserved') {
      slot.status = 'Available';
      await slot.save();
      socketService.broadcastSlotUpdate(reservation.facilityId, slot);
    }

    socketService.broadcastAlert('info', `Reservation for Slot ${slot ? slot.slotNumber : ''} was cancelled`);

    res.status(200).json({ success: true, data: reservation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
