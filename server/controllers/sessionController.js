const ParkingSession = require('../models/ParkingSession');
const ParkingSlot = require('../models/ParkingSlot');
const Reservation = require('../models/Reservation');
const EVChargingSession = require('../models/EVChargingSession');
const { calculateDynamicPrice } = require('../services/pricingService');
const socketService = require('../services/socketService');

// @desc    Start a parking session (check-in)
// @route   POST /api/sessions/start
// @access  Private
exports.startSession = async (req, res) => {
  try {
    const { vehicleId, slotId, reservationId } = req.body;

    if (!vehicleId || !slotId) {
      return res.status(400).json({ success: false, message: 'Please provide vehicleId and slotId' });
    }

    // Check if slot exists
    const slot = await ParkingSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Parking slot not found' });
    }

    if (slot.status === 'Occupied') {
      return res.status(400).json({ success: false, message: 'Slot is already occupied' });
    }

    // Check if there is already an active session for this slot
    const activeSession = await ParkingSession.findOne({ slotId, status: 'Active' });
    if (activeSession) {
      return res.status(400).json({ success: false, message: 'An active session already exists for this slot' });
    }

    // Start session
    const session = await ParkingSession.create({
      userId: req.user.id,
      vehicleId,
      slotId,
      reservationId: reservationId || undefined,
      entryTime: new Date(),
      status: 'Active'
    });

    // Update reservation if check-in is linked to one
    if (reservationId) {
      await Reservation.findByIdAndUpdate(reservationId, { status: 'Active' });
    }

    // Update slot status to Occupied
    slot.status = 'Occupied';
    await slot.save();

    // If it's an EV, conceptually start an EV Charging session too!
    if (slot.isEV) {
      await EVChargingSession.create({
        userId: req.user.id,
        vehicleId,
        slotId,
        startTime: new Date(),
        batteryBefore: Math.floor(Math.random() * 41) + 20, // Simulated low start level (20-60%)
        status: 'Charging'
      });
      // Set slot to EV Charging status
      slot.status = 'EV Charging';
      await slot.save();
    }

    // Broadcast update via Socket
    socketService.broadcastSlotUpdate(slot.facilityId, slot);
    socketService.broadcastAlert('success', `Vehicle checked into Slot ${slot.slotNumber}`);

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    End a parking session (check-out)
// @route   POST /api/sessions/end
// @access  Private
exports.endSession = async (req, res) => {
  try {
    const { slotId } = req.body;

    if (!slotId) {
      return res.status(400).json({ success: false, message: 'Please provide slotId' });
    }

    // Find active session
    const session = await ParkingSession.findOne({ slotId, status: 'Active', userId: req.user.id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'No active session found for this slot' });
    }

    const slot = await ParkingSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    const exitTime = new Date();
    const entryTime = new Date(session.entryTime);
    
    // Calculate duration in minutes
    const durationMs = exitTime - entryTime;
    const durationMin = Math.max(1, Math.round(durationMs / (1000 * 60))); // at least 1 minute

    // Calculate total hours (rounded up)
    const hours = Math.ceil(durationMin / 60);

    // Calculate hourly price based on dynamic pricing engine
    const pricing = await calculateDynamicPrice(slot.facilityId, slot.isEV, session.vehicleId, hours, entryTime);
    
    const finalAmount = pricing.price * hours;

    // Update Session
    session.exitTime = exitTime;
    session.duration = durationMin;
    session.amount = finalAmount;
    session.status = 'Completed';
    await session.save();

    // If reservation exists, update it to Completed
    if (session.reservationId) {
      await Reservation.findByIdAndUpdate(session.reservationId, { status: 'Completed' });
    }

    // If there was an EV Charging session, complete it
    const chargingSession = await EVChargingSession.findOne({ slotId, status: 'Charging', userId: req.user.id });
    if (chargingSession) {
      chargingSession.endTime = exitTime;
      chargingSession.batteryAfter = Math.min(100, chargingSession.batteryBefore + Math.round(durationMin * 0.8)); // 0.8% charge per min
      chargingSession.status = 'Completed';
      await chargingSession.save();
    }

    // Update slot status back to Available
    slot.status = 'Available';
    await slot.save();

    // Broadcast updates
    socketService.broadcastSlotUpdate(slot.facilityId, slot);
    socketService.broadcastAlert('info', `Vehicle checked out of Slot ${slot.slotNumber}. Fee: ₹${finalAmount}`);

    res.status(200).json({
      success: true,
      data: {
        session,
        durationMinutes: durationMin,
        amount: finalAmount,
        pricePerHour: pricing.price,
        billingExplanation: pricing.reason
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
