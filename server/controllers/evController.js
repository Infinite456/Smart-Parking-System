const ParkingSlot = require('../models/ParkingSlot');
const EVChargingSession = require('../models/EVChargingSession');
const Vehicle = require('../models/Vehicle');
const Reservation = require('../models/Reservation');
const { calculateDynamicPrice } = require('../services/pricingService');
const socketService = require('../services/socketService');

// @desc    Get all EV charging slots and their occupancy status
// @route   GET /api/ev/charging-slots
// @access  Private
exports.getChargingSlots = async (req, res) => {
  try {
    const slots = await ParkingSlot.find({ isEV: true }).populate('facilityId', 'name');
    
    // Count active charging sessions
    const activeSessions = await EVChargingSession.find({ status: 'Charging' }).populate('vehicleId');

    // Predict demand: count how many EV slots are currently occupied vs total EV slots
    const totalEVChargers = slots.length;
    const occupiedEVChargers = slots.filter(s => s.status === 'EV Charging' || s.status === 'Occupied' || s.status === 'Reserved').length;
    
    // Simulated historical EV demand curve for predictions (e.g. hourly load)
    const currentHour = new Date().getHours();
    // Peak EV charging demand usually matches workday parking (9 AM - 5 PM)
    const hourlyDemandPercentage = [
      10, 8, 5, 5, 12, 20, 35, 60, 85, 90, 80, 75, 70, 75, 80, 85, 90, 70, 50, 40, 30, 25, 15, 12
    ];

    res.status(200).json({
      success: true,
      count: slots.length,
      analytics: {
        totalEVChargers,
        occupiedEVChargers,
        availableEVChargers: totalEVChargers - occupiedEVChargers,
        utilizationRate: totalEVChargers > 0 ? Math.round((occupiedEVChargers / totalEVChargers) * 100) : 0,
        estimatedDemand: hourlyDemandPercentage[currentHour],
        demandForecast24h: hourlyDemandPercentage
      },
      data: slots,
      activeSessions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reserve an EV charging slot
// @route   POST /api/ev/reserve
// @access  Private
exports.reserveEVChargingSlot = async (req, res) => {
  try {
    const { vehicleId, facilityId, slotId, startTime, endTime } = req.body;

    if (!vehicleId || !slotId || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Please fill in all details' });
    }

    const slot = await ParkingSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    if (!slot.isEV) {
      return res.status(400).json({ success: false, message: 'Selected slot does not support EV charging' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    if (!vehicle.isEV) {
      return res.status(400).json({ success: false, message: 'Only registered Electric Vehicles (EVs) can book EV charging slots' });
    }

    // Call reservation creation logic
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Prevent double booking
    const overlapping = await Reservation.findOne({
      slotId,
      status: { $in: ['Pending', 'Active'] },
      startTime: { $lt: end },
      endTime: { $gt: start }
    });

    if (overlapping) {
      return res.status(400).json({ success: false, message: 'This charging slot is already reserved during the requested period' });
    }

    // Dynamic price calculation
    const hours = Math.ceil((end - start) / (1000 * 60 * 60)) || 1;
    const pricing = await calculateDynamicPrice(facilityId, true, vehicleId, hours, start);
    const totalPrice = pricing.price * hours;

    const reservation = await Reservation.create({
      userId: req.user.id,
      vehicleId,
      facilityId,
      slotId,
      startTime: start,
      endTime: end,
      price: totalPrice,
      status: 'Pending'
    });

    slot.status = 'Reserved';
    await slot.save();

    socketService.broadcastSlotUpdate(facilityId, slot);
    socketService.broadcastAlert('info', `EV Charging slot reserved: ${slot.slotNumber}`);

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
