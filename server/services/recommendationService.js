const ParkingSlot = require('../models/ParkingSlot');
const Vehicle = require('../models/Vehicle');

/**
 * Calculates a recommendation score for each available slot in a facility
 * based on vehicle specifications, distance, congestion, EV status, and pricing.
 */
const recommendSlots = async (facilityId, vehicleId) => {
  // 1. Fetch vehicle details
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new Error('Vehicle not found');
  }

  // 2. Fetch all slots for this facility
  const slots = await ParkingSlot.find({ facilityId });
  if (!slots || slots.length === 0) {
    return { recommended: null, alternatives: [], message: 'No slots found in this facility' };
  }

  const availableSlots = slots.filter(slot => slot.status === 'Available' || (slot.isEV && slot.status === 'Available'));
  
  if (availableSlots.length === 0) {
    return { recommended: null, alternatives: [], message: 'No available parking slots at this facility' };
  }

  // Helper to check size compatibility
  // Slot size: small, medium, large
  // Vehicle size: small (motorcycle, small car), medium (standard car), large (SUV, Van)
  const isSizeCompatible = (slotSize, vehicleSize) => {
    if (slotSize === 'large') return true;
    if (slotSize === 'medium' && (vehicleSize === 'medium' || vehicleSize === 'small')) return true;
    if (slotSize === 'small' && vehicleSize === 'small') return true;
    return false;
  };

  // Helper to check type compatibility
  const isTypeCompatible = (slotType, vehicleType) => {
    if (slotType === 'All') return true;
    return slotType.toLowerCase() === vehicleType.toLowerCase();
  };

  // 3. Compute scores for each available slot
  const scoredSlots = availableSlots.map(slot => {
    // A. Compatibility Check
    const typeCompat = isTypeCompatible(slot.vehicleType, vehicle.type);
    const sizeCompat = isSizeCompatible(slot.vehicleSize, vehicle.size);
    
    if (!typeCompat || !sizeCompat) {
      return { slot, score: 0, reasons: ['Incompatible size or type'] };
    }

    // B. Distance Score (Entrance assumed at coordinates 0,0)
    // Scale Euclidean distance: smaller is better
    const dist = Math.sqrt(Math.pow(slot.coordinates.x, 2) + Math.pow(slot.coordinates.y, 2));
    const maxDist = 200; // Expected max coordinate distance
    const distScore = Math.max(0, 1 - dist / maxDist);

    // C. EV Requirement Score
    let evScore = 1.0;
    if (vehicle.isEV) {
      // If vehicle is EV, we prefer EV slots
      evScore = slot.isEV ? 1.0 : 0.4;
    } else {
      // If vehicle is not EV, we penalize EV slots to prevent blocking chargers (ICEing)
      evScore = slot.isEV ? 0.0 : 1.0;
    }

    if (evScore === 0.0) {
      return { slot, score: 0, reasons: ['Reserved for EV charging'] };
    }

    // D. Congestion Score (Density of occupied slots within 40 coordinate units)
    const nearbySlots = slots.filter(s => {
      if (s._id.toString() === slot._id.toString()) return false;
      const d = Math.sqrt(Math.pow(s.coordinates.x - slot.coordinates.x, 2) + Math.pow(s.coordinates.y - slot.coordinates.y, 2));
      return d < 40;
    });

    let congestionScore = 1.0;
    if (nearbySlots.length > 0) {
      const occupiedNearby = nearbySlots.filter(s => s.status !== 'Available').length;
      congestionScore = 1 - (occupiedNearby / nearbySlots.length);
    }

    // E. Price Score (EV slots or premium spots might be priced slightly higher, not currently dynamic in DB but conceptually represented here)
    // Let's assume EV charging slots have a base price multiplier of 1.2
    const priceFactor = slot.isEV ? 1.2 : 1.0;
    const priceScore = 1 / priceFactor;

    // Weights: Distance (30%), EV Needs (30%), Congestion (20%), Price (20%)
    const totalScore = (distScore * 0.35) + (evScore * 0.35) + (congestionScore * 0.15) + (priceScore * 0.15);

    // Generate explanations
    const reasons = [];
    if (distScore > 0.7) reasons.push('it is close to the entrance');
    else if (distScore > 0.4) reasons.push('it has a moderate walking distance');
    else reasons.push('it is in a quieter outer zone');

    if (slot.isEV && vehicle.isEV) reasons.push('offers active EV charging access');
    if (congestionScore > 0.7) reasons.push('is in a low traffic section');
    if (!slot.isEV) reasons.push('offers standard cost-effective rates');

    return {
      slot,
      score: totalScore,
      reasons,
      distance: Math.round(dist)
    };
  });

  // Filter out incompatible slots (score == 0) and sort by score descending
  const validRecommendations = scoredSlots
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (validRecommendations.length === 0) {
    return { recommended: null, alternatives: [], message: 'No compatible parking slots found for your vehicle.' };
  }

  // Format the primary recommendation
  const primary = validRecommendations[0];
  
  // Format details text
  let explanation = `Slot ${primary.slot.slotNumber} is recommended because `;
  if (primary.reasons.length > 0) {
    explanation += primary.reasons.join(', ') + '.';
  } else {
    explanation += 'it is fully compatible with your vehicle and currently available.';
  }

  // Formatting alternatives (up to 3)
  const alternatives = validRecommendations.slice(1, 4).map(item => ({
    slot: item.slot,
    distance: item.distance,
    score: Math.round(item.score * 100),
    isEV: item.slot.isEV
  }));

  return {
    recommended: {
      slot: primary.slot,
      distance: primary.distance,
      score: Math.round(primary.score * 100),
      explanation
    },
    alternatives,
    message: 'Success'
  };
};

module.exports = {
  recommendSlots
};
