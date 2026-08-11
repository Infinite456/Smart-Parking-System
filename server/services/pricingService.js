const ParkingFacility = require('../models/ParkingFacility');
const ParkingSlot = require('../models/ParkingSlot');
const PricingRule = require('../models/PricingRule');

/**
 * Calculates the dynamic hourly price for parking in a specific facility/slot.
 * Returns the final hourly price and a user-friendly explanation of why it was adjusted.
 */
const calculateDynamicPrice = async (facilityId, isEVSlot = false, vehicleId = null, durationHours = 1, startTime = null) => {
  const defaultBaseRate = 40; // Default fallback base rate

  // 1. Fetch facility details
  const facility = await ParkingFacility.findById(facilityId);
  if (!facility) {
    return { price: defaultBaseRate, reason: 'Default pricing (Facility not found)' };
  }

  // 2. Count current occupancy
  const totalSlots = facility.totalSlots;
  const occupiedOrReservedCount = await ParkingSlot.countDocuments({
    facilityId,
    status: { $in: ['Occupied', 'Reserved', 'EV Charging'] }
  });

  const occupancyRate = totalSlots > 0 ? (occupiedOrReservedCount / totalSlots) * 100 : 0;

  // 3. Query all active pricing rules for this facility
  const activeRules = await PricingRule.find({ facilityId, active: true });
  
  // Find occupancy specific rule if exists
  const occupancyRule = activeRules.find(
    rule => !rule.peakHour && occupancyRate >= rule.occupancyRange.min && occupancyRate <= rule.occupancyRange.max
  );

  // Fallback to first rule or defaults
  const rule = occupancyRule || activeRules[0];

  const baseRate = rule ? (rule.hourlyRate || defaultBaseRate) : defaultBaseRate;
  const multiplier = occupancyRule ? (occupancyRule.priceMultiplier || 1.0) : 1.0;
  const evSurchargeAmount = rule ? (rule.evSurcharge !== undefined ? rule.evSurcharge : 10) : 10;
  const peakSurchargeAmount = rule ? (rule.peakSurcharge !== undefined ? rule.peakSurcharge : 15) : 15;
  
  const vehicleMotorcycleMultiplier = rule ? (rule.vehicleMotorcycleMultiplier !== undefined ? rule.vehicleMotorcycleMultiplier : 0.8) : 0.8;
  const vehicleCarMultiplier = rule ? (rule.vehicleCarMultiplier !== undefined ? rule.vehicleCarMultiplier : 1.0) : 1.0;
  const vehicleSUVMultiplier = rule ? (rule.vehicleSUVMultiplier !== undefined ? rule.vehicleSUVMultiplier : 1.2) : 1.2;
  const vehicleVanMultiplier = rule ? (rule.vehicleVanMultiplier !== undefined ? rule.vehicleVanMultiplier : 1.3) : 1.3;
  
  const durationThreshold = rule ? (rule.durationThreshold !== undefined ? rule.durationThreshold : 4) : 4;
  const durationMultiplier = rule ? (rule.durationMultiplier !== undefined ? rule.durationMultiplier : 0.9) : 0.9;

  // 4. Check peak hours
  const currentHour = startTime ? new Date(startTime).getHours() : new Date().getHours();
  const isPeakHour = (currentHour >= 8 && currentHour < 10) || (currentHour >= 17 && currentHour < 20);
  let peakSurcharge = 0;

  if (isPeakHour) {
    peakSurcharge = peakSurchargeAmount;
  }

  // 5. Check EV charger surcharge
  let evSurcharge = 0;
  if (isEVSlot) {
    evSurcharge = evSurchargeAmount;
  }

  // 6. Check vehicle type pricing
  let vehicleMultiplier = 1.0;
  let vehicleType = 'Car';
  if (vehicleId) {
    const Vehicle = require('../models/Vehicle');
    const vehicle = await Vehicle.findById(vehicleId);
    if (vehicle) {
      vehicleType = vehicle.type;
      if (vehicle.type === 'Motorcycle') vehicleMultiplier = vehicleMotorcycleMultiplier;
      else if (vehicle.type === 'Car') vehicleMultiplier = vehicleCarMultiplier;
      else if (vehicle.type === 'SUV') vehicleMultiplier = vehicleSUVMultiplier;
      else if (vehicle.type === 'Van') vehicleMultiplier = vehicleVanMultiplier;
    }
  }

  // 7. Check duration-based pricing
  let durationMultiplierApplied = 1.0;
  const duration = parseInt(durationHours) || 1;
  if (duration >= durationThreshold) {
    durationMultiplierApplied = durationMultiplier;
  }

  // Final Price Calculation
  const finalPrice = Math.round((baseRate * multiplier * vehicleMultiplier * durationMultiplierApplied) + peakSurcharge + evSurcharge);

  // Generate dynamic explanation reason
  let ruleReason = `Base rate: ₹${baseRate}/hr. Occupancy: ${Math.round(occupancyRate)}% (${multiplier}x).`;
  if (vehicleId) {
    ruleReason += ` Vehicle: ${vehicleType} (${vehicleMultiplier}x).`;
  }
  if (duration >= durationThreshold) {
    ruleReason += ` Long Stay Discount (${durationMultiplierApplied}x) for ${duration}h.`;
  }
  if (isPeakHour) {
    ruleReason += ` [Peak Hour Surcharge (+₹${peakSurcharge}/hr)]`;
  }
  if (isEVSlot) {
    ruleReason += ` [EV Charger Surcharge (+₹${evSurcharge}/hr)]`;
  }

  return {
    baseRate,
    occupancyRate: Math.round(occupancyRate),
    multiplier,
    peakSurcharge,
    evSurcharge,
    price: finalPrice,
    reason: ruleReason
  };
};

module.exports = {
  calculateDynamicPrice
};
