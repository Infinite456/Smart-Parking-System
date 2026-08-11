const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const ParkingSlot = require('../models/ParkingSlot');
const Reservation = require('../models/Reservation');
const ParkingSession = require('../models/ParkingSession');
const Violation = require('../models/Violation');
const EVChargingSession = require('../models/EVChargingSession');
const PricingRule = require('../models/PricingRule');
const socketService = require('../services/socketService');

// @desc    Get Admin Live Dashboard Statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
exports.getDashboardStats = async (req, res) => {
  try {
    const totalSlotsCount = await ParkingSlot.countDocuments();
    const occupiedCount = await ParkingSlot.countDocuments({ status: 'Occupied' });
    const reservedCount = await ParkingSlot.countDocuments({ status: 'Reserved' });
    const evChargingCount = await ParkingSlot.countDocuments({ status: 'EV Charging' });
    const maintenanceCount = await ParkingSlot.countDocuments({ status: 'Maintenance' });
    const emergencyCount = await ParkingSlot.countDocuments({ status: 'Emergency Restricted' });
    
    const activeUsersCount = await User.countDocuments({ role: 'user' });
    const activeSessionsCount = await ParkingSession.countDocuments({ status: 'Active' });
    const activeViolationsCount = await Violation.countDocuments({ status: 'Active' });

    // Calculate revenue
    const sessionsRevenue = await ParkingSession.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const reservationRevenue = await Reservation.aggregate([
      { $match: { status: { $in: ['Completed', 'Active', 'Pending'] } } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);

    const totalRevenue = (sessionsRevenue[0]?.total || 0) + (reservationRevenue[0]?.total || 0);

    const occupancyRate = totalSlotsCount > 0 
      ? Math.round(((occupiedCount + reservedCount + evChargingCount) / totalSlotsCount) * 100) 
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalSlots: totalSlotsCount,
        availableSlots: totalSlotsCount - occupiedCount - reservedCount - evChargingCount - maintenanceCount - emergencyCount,
        occupiedSlots: occupiedCount,
        reservedSlots: reservedCount,
        evChargingSlots: evChargingCount,
        maintenanceSlots: maintenanceCount,
        emergencySlots: emergencyCount,
        occupancyRate,
        activeUsers: activeUsersCount,
        activeSessions: activeSessionsCount,
        activeViolations: activeViolationsCount,
        revenue: totalRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Admin Analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
exports.getAnalytics = async (req, res) => {
  try {
    // 1. Revenue over past 7 days
    const past7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    // Mock data for analytics so charts populate immediately with beautiful curves
    const revenueAnalytics = past7Days.map((day, idx) => ({
      date: day.substring(5), // MM-DD
      revenue: 400 + idx * 150 + Math.floor(Math.random() * 200),
      sessions: 15 + idx * 3 + Math.floor(Math.random() * 5)
    }));

    // 2. Occupancy peak hours distribution (hourly averages, e.g., 24 data points)
    const peakHoursData = [
      { hour: '12 AM', occupancy: 20 },
      { hour: '2 AM', occupancy: 15 },
      { hour: '4 AM', occupancy: 12 },
      { hour: '6 AM', occupancy: 22 },
      { hour: '8 AM', occupancy: 65 },
      { hour: '10 AM', occupancy: 85 },
      { hour: '12 PM', occupancy: 70 },
      { hour: '2 PM', occupancy: 75 },
      { hour: '4 PM', occupancy: 80 },
      { hour: '6 PM', occupancy: 92 },
      { hour: '8 PM', occupancy: 75 },
      { hour: '10 PM', occupancy: 40 }
    ];

    // 3. Violations count by category
    const violationCategories = await Violation.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    const violationsData = violationCategories.map(v => ({
      name: v._id,
      value: v.count
    }));

    // If empty, supply default categories
    if (violationsData.length === 0) {
      violationsData.push(
        { name: 'Overlapping Parking', value: 3 },
        { name: 'Wrong Vehicle Compatibility', value: 2 },
        { name: 'Emergency Zone Parking', value: 1 },
        { name: 'Unauthorized EV Charging Slot', value: 4 },
        { name: 'Exceeded Reservation Duration', value: 5 }
      );
    }

    // 4. EV charging demand forecast vs occupancy
    const evChargingDemandData = peakHoursData.map(d => ({
      hour: d.hour,
      occupancy: d.occupancy,
      evDemand: Math.round(d.occupancy * 0.75) // 75% of overall capacity demand typically is EV load
    }));

    res.status(200).json({
      success: true,
      data: {
        revenueAnalytics,
        peakHoursData,
        violationsData,
        evChargingDemandData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Configure Pricing Rules
// @route   PUT /api/admin/pricing
// @access  Private (Admin only)
exports.updatePricingRule = async (req, res) => {
  try {
    const { facilityId, minOccupancy, maxOccupancy, priceMultiplier } = req.body;

    if (!facilityId || minOccupancy === undefined || maxOccupancy === undefined || !priceMultiplier) {
      return res.status(400).json({ success: false, message: 'Please provide facilityId, occupancy range bounds, and price multiplier' });
    }

    // Upsert the rule
    let rule = await PricingRule.findOne({
      facilityId,
      'occupancyRange.min': minOccupancy,
      'occupancyRange.max': maxOccupancy
    });

    if (rule) {
      rule.priceMultiplier = priceMultiplier;
      await rule.save();
    } else {
      rule = await PricingRule.create({
        facilityId,
        occupancyRange: { min: minOccupancy, max: maxOccupancy },
        priceMultiplier,
        active: true
      });
    }

    socketService.broadcastAlert('info', `Pricing rules updated: occupancy ${minOccupancy}-${maxOccupancy}% multiplier set to ${priceMultiplier}x`);

    res.status(200).json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle Emergency Mode
// @route   PUT /api/admin/emergency-mode
// @access  Private (Admin only)
exports.toggleEmergencyMode = async (req, res) => {
  try {
    const { facilityId, isActive } = req.body;

    if (!facilityId || isActive === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide facilityId and isActive state' });
    }

    // Find slots in this facility that form the Emergency Corridor (Slots starting with B-01 to B-08)
    const emergencyCorridorNumbers = ['B-01', 'B-02', 'B-03', 'B-04', 'B-05', 'B-06', 'B-07', 'B-08'];
    
    // Find these slots
    const slots = await ParkingSlot.find({
      facilityId,
      slotNumber: { $in: emergencyCorridorNumbers }
    });

    const affectedSlotIds = slots.map(s => s._id);

    if (isActive) {
      // 1. Temporarily restrict normal access
      await ParkingSlot.updateMany(
        { _id: { $in: affectedSlotIds } },
        { status: 'Emergency Restricted' }
      );

      // 2. Alert users if there is an active session on these slots!
      const activeSessionsOnEmergencySlots = await ParkingSession.find({
        slotId: { $in: affectedSlotIds },
        status: 'Active'
      }).populate('vehicleId');

      if (activeSessionsOnEmergencySlots.length > 0) {
        activeSessionsOnEmergencySlots.forEach(async (sess) => {
          // Fire violation warning!
          await Violation.create({
            userId: sess.userId,
            vehicleId: sess.vehicleId._id,
            registrationNumber: sess.vehicleId.registrationNumber,
            slotId: sess.slotId,
            type: 'Emergency Zone Parking',
            status: 'Active'
          });

          socketService.broadcastAlert('danger', `🚨 Violation Alert: Vehicle ${sess.vehicleId.registrationNumber} is occupying an Emergency restricted corridor (Slot)!`);
        });
      }

      // 3. Cancel any pending reservations on these slots
      await Reservation.updateMany(
        { slotId: { $in: affectedSlotIds }, status: 'Pending' },
        { status: 'Cancelled' }
      );

      socketService.broadcastEmergencyMode(
        facilityId,
        true,
        '🚨 Emergency Corridor Active — Slots B-01 to B-08 are restricted.',
        emergencyCorridorNumbers
      );
    } else {
      // Deactivate Emergency Mode - Restore affected slots back to Available
      await ParkingSlot.updateMany(
        { _id: { $in: affectedSlotIds }, status: 'Emergency Restricted' },
        { status: 'Available' }
      );

      socketService.broadcastEmergencyMode(
        facilityId,
        false,
        'Emergency Corridor Clear — Parking slots B-01 to B-08 restored for reservation.',
        emergencyCorridorNumbers
      );
    }

    // Refetch slots to trigger map reload in frontend
    const updatedSlots = await ParkingSlot.find({ facilityId });
    updatedSlots.forEach(slot => {
      socketService.broadcastSlotUpdate(facilityId, slot);
    });

    res.status(200).json({
      success: true,
      message: isActive ? 'Emergency Mode Activated' : 'Emergency Mode Deactivated',
      restrictedSlots: emergencyCorridorNumbers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Slot Status
// @route   PUT /api/admin/slots/:id
// @access  Private (Admin only)
exports.updateSlotStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const slot = await ParkingSlot.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }
    socketService.broadcastSlotUpdate(slot.facilityId, slot);
    res.status(200).json({ success: true, data: slot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Simulate Arrival (check-in user)
// @route   POST /api/admin/slots/:id/simulate-arrival
// @access  Private (Admin only)
exports.simulateArrival = async (req, res) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }
    
    // Check if slot is already occupied
    if (slot.status === 'Occupied' || slot.status === 'EV Charging') {
      return res.status(400).json({ success: false, message: 'Slot is already occupied' });
    }

    // Grab a random driver user & vehicle to assign
    const user = await User.findOne({ role: 'user' });
    const vehicle = await Vehicle.findOne({ userId: user._id });

    if (!user) {
      return res.status(400).json({ success: false, message: 'No registered driver user found to assign to simulation' });
    }

    // Start parking session
    const session = await ParkingSession.create({
      userId: user._id,
      vehicleId: vehicle ? vehicle._id : undefined,
      slotId: slot._id,
      entryTime: new Date(),
      status: 'Active'
    });

    slot.status = slot.isEV ? 'EV Charging' : 'Occupied';
    await slot.save();

    socketService.broadcastSlotUpdate(slot.facilityId, slot);
    socketService.broadcastAlert('success', `Simulated arrival on Slot ${slot.slotNumber}`);

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all pricing rules for a facility
// @route   GET /api/admin/pricing/:facilityId
// @access  Private (Admin only)
exports.getPricingRules = async (req, res) => {
  try {
    const rules = await PricingRule.find({ facilityId: req.params.facilityId });
    res.status(200).json({ success: true, count: rules.length, data: rules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new pricing rule
// @route   POST /api/admin/pricing
// @access  Private (Admin only)
exports.createPricingRule = async (req, res) => {
  try {
    const {
      facilityId,
      name,
      minOccupancy,
      maxOccupancy,
      priceMultiplier,
      hourlyRate,
      evSurcharge,
      peakSurcharge,
      vehicleMotorcycleMultiplier,
      vehicleCarMultiplier,
      vehicleSUVMultiplier,
      vehicleVanMultiplier,
      durationThreshold,
      durationMultiplier
    } = req.body;

    if (!facilityId || minOccupancy === undefined || maxOccupancy === undefined || priceMultiplier === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide facilityId, occupancy range, and price multiplier' });
    }

    const rule = await PricingRule.create({
      facilityId,
      name: name || `Rule ${minOccupancy}-${maxOccupancy}%`,
      occupancyRange: { min: minOccupancy, max: maxOccupancy },
      priceMultiplier,
      hourlyRate: hourlyRate !== undefined ? hourlyRate : 40,
      evSurcharge: evSurcharge !== undefined ? evSurcharge : 10,
      peakSurcharge: peakSurcharge !== undefined ? peakSurcharge : 15,
      vehicleMotorcycleMultiplier: vehicleMotorcycleMultiplier !== undefined ? vehicleMotorcycleMultiplier : 0.8,
      vehicleCarMultiplier: vehicleCarMultiplier !== undefined ? vehicleCarMultiplier : 1.0,
      vehicleSUVMultiplier: vehicleSUVMultiplier !== undefined ? vehicleSUVMultiplier : 1.2,
      vehicleVanMultiplier: vehicleVanMultiplier !== undefined ? vehicleVanMultiplier : 1.3,
      durationThreshold: durationThreshold !== undefined ? durationThreshold : 4,
      durationMultiplier: durationMultiplier !== undefined ? durationMultiplier : 0.9,
      active: true
    });

    socketService.broadcastAlert('info', `New pricing rule created: ${minOccupancy}-${maxOccupancy}% occupancy multiplier set to ${priceMultiplier}x`);
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a pricing rule by ID
// @route   PUT /api/admin/pricing/:id
// @access  Private (Admin only)
exports.updatePricingRuleById = async (req, res) => {
  try {
    const {
      name,
      minOccupancy,
      maxOccupancy,
      priceMultiplier,
      hourlyRate,
      evSurcharge,
      peakSurcharge,
      vehicleMotorcycleMultiplier,
      vehicleCarMultiplier,
      vehicleSUVMultiplier,
      vehicleVanMultiplier,
      durationThreshold,
      durationMultiplier,
      active
    } = req.body;

    let rule = await PricingRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Pricing rule not found' });
    }

    if (name !== undefined) rule.name = name;
    if (minOccupancy !== undefined) rule.occupancyRange.min = minOccupancy;
    if (maxOccupancy !== undefined) rule.occupancyRange.max = maxOccupancy;
    if (priceMultiplier !== undefined) rule.priceMultiplier = priceMultiplier;
    if (hourlyRate !== undefined) rule.hourlyRate = hourlyRate;
    if (evSurcharge !== undefined) rule.evSurcharge = evSurcharge;
    if (peakSurcharge !== undefined) rule.peakSurcharge = peakSurcharge;
    if (vehicleMotorcycleMultiplier !== undefined) rule.vehicleMotorcycleMultiplier = vehicleMotorcycleMultiplier;
    if (vehicleCarMultiplier !== undefined) rule.vehicleCarMultiplier = vehicleCarMultiplier;
    if (vehicleSUVMultiplier !== undefined) rule.vehicleSUVMultiplier = vehicleSUVMultiplier;
    if (vehicleVanMultiplier !== undefined) rule.vehicleVanMultiplier = vehicleVanMultiplier;
    if (durationThreshold !== undefined) rule.durationThreshold = durationThreshold;
    if (durationMultiplier !== undefined) rule.durationMultiplier = durationMultiplier;
    if (active !== undefined) rule.active = active;

    await rule.save();

    socketService.broadcastAlert('info', `Pricing rule updated: ${rule.occupancyRange.min}-${rule.occupancyRange.max}% occupancy multiplier set to ${rule.priceMultiplier}x`);
    res.status(200).json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a pricing rule
// @route   DELETE /api/admin/pricing/:id
// @access  Private (Admin only)
exports.deletePricingRule = async (req, res) => {
  try {
    const rule = await PricingRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Pricing rule not found' });
    }

    await rule.deleteOne();
    socketService.broadcastAlert('info', `Pricing rule deleted`);
    res.status(200).json({ success: true, message: 'Pricing rule removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Simulate ANPR Camera / License Plate Scan
// @route   POST /api/admin/simulate-scan
// @access  Private (Admin only)
exports.simulateCameraScan = async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    if (vehicles.length === 0) {
      return res.status(400).json({ success: false, message: 'No registered vehicles in the database for simulation.' });
    }

    const randType = Math.random();
    let selectedPlate = '';
    let matchedVehicle = null;

    if (randType < 0.6) {
      matchedVehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
      selectedPlate = matchedVehicle.registrationNumber;
    } else if (randType < 0.8) {
      selectedPlate = `DL-03-NC-${Math.floor(1000 + Math.random() * 9000)}`;
    } else {
      selectedPlate = `XX-${Math.floor(10 + Math.random() * 90)}-YY-${Math.floor(100 + Math.random() * 900)}`;
    }

    if (!matchedVehicle) {
      matchedVehicle = await Vehicle.findOne({ registrationNumber: selectedPlate });
    }

    const isRegistered = !!matchedVehicle;
    let hasReservation = false;
    let activeReservation = null;
    let activeSession = null;
    let slotNumber = 'N/A';
    let actionProcessed = 'None';
    let resultMessage = 'Vehicle detected but not recognized.';

    if (isRegistered) {
      const ParkingSession = require('../models/ParkingSession');
      activeSession = await ParkingSession.findOne({
        vehicleId: matchedVehicle._id,
        status: 'Active'
      });

      if (activeSession) {
        const slot = await ParkingSlot.findById(activeSession.slotId);
        slotNumber = slot ? slot.slotNumber : 'N/A';
        
        activeSession.status = 'Completed';
        activeSession.exitTime = new Date();
        const durationHours = Math.ceil((activeSession.exitTime - activeSession.entryTime) / (1000 * 60 * 60)) || 1;
        activeSession.amount = durationHours * 40;
        await activeSession.save();

        if (slot) {
          slot.status = 'Available';
          await slot.save();
          socketService.broadcastSlotUpdate(slot.facilityId, slot);
        }

        const activeRes = await Reservation.findOne({
          vehicleId: matchedVehicle._id,
          status: 'Active'
        });
        if (activeRes) {
          activeRes.status = 'Completed';
          await activeRes.save();
        }

        actionProcessed = 'Exit';
        resultMessage = `Check-out processed for vehicle ${selectedPlate}. Slot ${slotNumber} is now available. Fee: ₹${activeSession.amount}.`;
        socketService.broadcastAlert('success', `📹 Camera Scan: Vehicle ${selectedPlate} checked out from Slot ${slotNumber}`);
      } else {
        const startWindow = new Date(Date.now() - 60 * 60 * 1000);
        const endWindow = new Date(Date.now() + 60 * 60 * 1000);
        activeReservation = await Reservation.findOne({
          vehicleId: matchedVehicle._id,
          status: 'Pending',
          startTime: { $gte: startWindow, $lte: endWindow }
        });

        if (activeReservation) {
          hasReservation = true;
          const slot = await ParkingSlot.findById(activeReservation.slotId);
          slotNumber = slot ? slot.slotNumber : 'N/A';

          const ParkingSession = require('../models/ParkingSession');
          activeSession = await ParkingSession.create({
            userId: matchedVehicle.userId,
            vehicleId: matchedVehicle._id,
            slotId: activeReservation.slotId,
            entryTime: new Date(),
            status: 'Active'
          });

          activeReservation.status = 'Active';
          await activeReservation.save();

          if (slot) {
            slot.status = slot.isEV ? 'EV Charging' : 'Occupied';
            await slot.save();
            socketService.broadcastSlotUpdate(slot.facilityId, slot);
          }

          actionProcessed = 'Entry';
          resultMessage = `Check-in processed for vehicle ${selectedPlate}. Guided to reserved Slot ${slotNumber}.`;
          socketService.broadcastAlert('success', `📹 Camera Scan: Vehicle ${selectedPlate} checked into Slot ${slotNumber}`);
        } else {
          actionProcessed = 'None';
          resultMessage = `Vehicle ${selectedPlate} registered but has no active reservation at this facility. Access denied.`;
          socketService.broadcastAlert('warning', `📹 Camera Scan: Vehicle ${selectedPlate} attempted access without reservation.`);
        }
      }
    } else {
      actionProcessed = 'None';
      resultMessage = `Vehicle with plate ${selectedPlate} is not registered in the system database.`;
      socketService.broadcastAlert('warning', `📹 Camera Scan: Unrecognized vehicle ${selectedPlate} detected.`);
    }

    res.status(200).json({
      success: true,
      data: {
        plate: selectedPlate,
        recognized: isRegistered,
        registered: isRegistered,
        hasReservation,
        slotNumber,
        actionProcessed,
        message: resultMessage
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

