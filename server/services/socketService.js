const socketIO = require('socket.io');

let io = null;

const init = (server) => {
  io = socketIO(server, {
    cors: {
      origin: '*', // Allow connections from any origin for development simplicity
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`\x1b[36m[Socket Connected] Socket ID: ${socket.id}\x1b[0m`);

    socket.on('join_facility', (facilityId) => {
      socket.join(facilityId);
      console.log(`Socket ${socket.id} joined facility room: ${facilityId}`);
    });

    socket.on('leave_facility', (facilityId) => {
      socket.leave(facilityId);
      console.log(`Socket ${socket.id} left facility room: ${facilityId}`);
    });

    socket.on('disconnect', () => {
      console.log(`\x1b[33m[Socket Disconnected] Socket ID: ${socket.id}\x1b[0m`);
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

// Broadcast updates for a specific parking slot
const broadcastSlotUpdate = (facilityId, slot) => {
  if (io) {
    io.to(facilityId.toString()).emit('slot_updated', slot);
    io.emit('global_slot_updated', { facilityId, slot });
    console.log(`[Socket Broadcast] Slot ${slot.slotNumber} updated to ${slot.status}`);
  }
};

// Broadcast facility occupancy changes
const broadcastOccupancyUpdate = (facilityId, data) => {
  if (io) {
    io.to(facilityId.toString()).emit('occupancy_updated', data);
    io.emit('global_occupancy_updated', { facilityId, ...data });
    console.log(`[Socket Broadcast] Facility ${facilityId} occupancy changed`);
  }
};

// Broadcast emergency mode activation/deactivation
const broadcastEmergencyMode = (facilityId, isActive, message, restrictedSlotNumbers = []) => {
  if (io) {
    io.emit('emergency_mode_toggled', { facilityId, isActive, message, restrictedSlotNumbers });
    console.log(`[Socket Broadcast] Emergency Mode ${isActive ? 'ACTIVATED' : 'DEACTIVATED'} for facility ${facilityId}`);
  }
};

// Broadcast a general alert (e.g. new violation, system warning)
const broadcastAlert = (alertType, message, data = {}) => {
  if (io) {
    io.emit('system_alert', { alertType, message, timestamp: new Date(), ...data });
    console.log(`[Socket Broadcast] Alert: ${message}`);
  }
};

module.exports = {
  init,
  getIO,
  broadcastSlotUpdate,
  broadcastOccupancyUpdate,
  broadcastEmergencyMode,
  broadcastAlert
};
