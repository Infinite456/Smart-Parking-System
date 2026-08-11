const API_BASE = 'http://localhost:5000/api';

/**
 * Utility wrapper around native fetch to handle common headers, auth tokens,
 * and error responses for Express endpoints.
 */
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong with the request');
  }

  return data;
};

const api = {
  auth: {
    register: (userData) => request('/auth/register', { method: 'POST', body: userData }),
    login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  },
  users: {
    getProfile: () => request('/users/profile'),
    updateProfile: (profileData) => request('/users/profile', { method: 'PUT', body: profileData }),
  },
  vehicles: {
    list: () => request('/vehicles'),
    add: (vehicleData) => request('/vehicles', { method: 'POST', body: vehicleData }),
    update: (id, vehicleData) => request(`/vehicles/${id}`, { method: 'PUT', body: vehicleData }),
    remove: (id) => request(`/vehicles/${id}`, { method: 'DELETE' }),
  },
  parking: {
    listFacilities: () => request('/parking'),
    getSlots: (facilityId) => request(`/parking/${facilityId}/slots`),
    getRecommendation: (facilityId, vehicleId) => request(`/parking/${facilityId}/recommend?vehicleId=${vehicleId}`),
  },
  reservations: {
    create: (reservationData) => request('/reservations', { method: 'POST', body: reservationData }),
    list: () => request('/reservations'),
    cancel: (id) => request(`/reservations/${id}/cancel`, { method: 'PUT' }),
  },
  sessions: {
    start: (sessionData) => request('/sessions/start', { method: 'POST', body: sessionData }),
    end: (slotId) => request('/sessions/end', { method: 'POST', body: { slotId } }),
  },
  predictions: {
    getForecast: (facilityId) => request(`/predictions/${facilityId}`),
  },
  violations: {
    list: () => request('/violations'),
    simulate: () => request('/violations/simulate', { method: 'POST' }),
    resolve: (id) => request(`/violations/${id}/resolve`, { method: 'PUT' }),
  },
  ev: {
    listSlots: () => request('/ev/charging-slots'),
    reserveSlot: (evBookingData) => request('/ev/reserve', { method: 'POST', body: evBookingData }),
  },
  admin: {
    getDashboard: () => request('/admin/dashboard'),
    getAnalytics: () => request('/admin/analytics'),
    updatePricing: (pricingData) => request('/admin/pricing', { method: 'PUT', body: pricingData }),
    toggleEmergency: (emergencyData) => request('/admin/emergency-mode', { method: 'PUT', body: emergencyData }),
  }
};

export default api;
