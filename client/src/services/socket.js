const SOCKET_URL = 'http://localhost:5000';
import { io } from 'socket.io-client';

let socket = null;

export const initiateSocketConnection = () => {
  if (socket) return socket;
  
  socket = io(SOCKET_URL, {
    autoConnect: false,
  });
  
  console.log('Connecting to Socket.IO...');
  socket.connect();
  
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('Disconnecting Socket.IO...');
    socket.disconnect();
    socket = null;
  }
};

export const joinFacilityRoom = (facilityId) => {
  if (socket) {
    socket.emit('join_facility', facilityId);
    console.log(`Socket joined facility room: ${facilityId}`);
  }
};

export const leaveFacilityRoom = (facilityId) => {
  if (socket) {
    socket.emit('leave_facility', facilityId);
    console.log(`Socket left facility room: ${facilityId}`);
  }
};

export const subscribeToSlotUpdates = (callback) => {
  if (!socket) return;
  socket.on('slot_updated', (data) => {
    callback(data);
  });
};

export const unsubscribeFromSlotUpdates = () => {
  if (socket) {
    socket.off('slot_updated');
  }
};

export const subscribeToGlobalSlotUpdates = (callback) => {
  if (!socket) return;
  socket.on('global_slot_updated', (data) => {
    callback(data);
  });
};

export const subscribeToEmergencyToggled = (callback) => {
  if (!socket) return;
  socket.on('emergency_mode_toggled', (data) => {
    callback(data);
  });
};

export const unsubscribeFromEmergencyToggled = () => {
  if (socket) {
    socket.off('emergency_mode_toggled');
  }
};

export const subscribeToSystemAlerts = (callback) => {
  if (!socket) return;
  socket.on('system_alert', (data) => {
    callback(data);
  });
};

export const unsubscribeFromSystemAlerts = () => {
  if (socket) {
    socket.off('system_alert');
  }
};
