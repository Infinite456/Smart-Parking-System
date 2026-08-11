import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ParkingMap from '../components/ParkingMap';
import { subscribeToSlotUpdates, unsubscribeFromSlotUpdates, joinFacilityRoom, leaveFacilityRoom } from '../services/socket';
import { Hammer, AlertOctagon, RefreshCw, ToggleLeft, ToggleRight, Check } from 'lucide-react';

const AdminMap = () => {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadFacilities = async () => {
    try {
      setLoading(true);
      const res = await api.parking.listFacilities();
      setFacilities(res.data);
      if (res.data.length > 0) {
        setSelectedFacilityId(res.data[0]._id);
      }
    } catch (err) {
      setError('Failed to fetch facilities.');
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async () => {
    if (!selectedFacilityId) return;
    try {
      const res = await api.parking.getSlots(selectedFacilityId);
      setSlots(res.data);
      setSelectedSlot(null);
    } catch (err) {
      setError('Failed to fetch slots list.');
    }
  };

  useEffect(() => {
    loadFacilities();
  }, []);

  useEffect(() => {
    loadSlots();

    if (selectedFacilityId) {
      joinFacilityRoom(selectedFacilityId);
    }

    subscribeToSlotUpdates((updatedSlot) => {
      setSlots(prev => prev.map(s => s._id === updatedSlot._id ? { ...s, ...updatedSlot } : s));
      setSelectedSlot(prev => prev?._id === updatedSlot._id ? { ...prev, ...updatedSlot } : prev);
    });

    return () => {
      if (selectedFacilityId) {
        leaveFacilityRoom(selectedFacilityId);
      }
      unsubscribeFromSlotUpdates();
    };
  }, [selectedFacilityId]);

  const handleChangeSlotStatus = async (status) => {
    if (!selectedSlot) return;
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Direct call to patch/put slot status
      // We will update in backend using a generic post/put request
      const res = await fetch(`http://localhost:5000/api/parking/slots/${selectedSlot._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      }).catch(() => null);

      // In server.js we don't have direct PUT /api/parking/slots/:id route, let's look at controllers.
      // Wait, we can implement the route in server side, or we can write a quick endpoint to toggle status.
      // Let's create an endpoint in userRoutes or parkingRoutes to edit slot status or call it directly.
      // Actually, let's implement a PUT /api/parking/slots/:id route in our server.
      // Wait! Let's double check if we have that endpoint. In server, we didn't write PUT /api/parking/slots/:id yet.
      // Let's check parkingRoutes.js. In parkingRoutes.js we had:
      // router.route('/').get(getFacilities);
      // router.route('/:facilityId/slots').get(getSlots);
      // router.route('/:facilityId/recommend').get(getRecommendation);
      // We didn't add the edit slots endpoint. Let's add it! It's very simple.
      // We can implement slot status editing inside the adminController or parkingController.
      // Let's call standard fetch to update slots.
      // Let's write an endpoint PUT /api/parking/slots/:id in server. We can add this route to parkingRoutes.js!
      // First let's write client code that hits:
      // `PUT /api/parking/slots/${selectedSlot._id}`
      const updateRes = await fetch(`http://localhost:5000/api/admin/slots/${selectedSlot._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      const data = await updateRes.json();
      
      if (data.success) {
        setSuccess(`Slot ${selectedSlot.slotNumber} set to status "${status}"`);
        loadSlots();
      } else {
        setError(data.message || 'Failed to update slot status.');
      }
    } catch (err) {
      setError('Error communicating with server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateArrival = async () => {
    if (!selectedSlot) return;
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      // Simulate vehicle arrival (sets status to occupied, start session)
      const usersRes = await fetch('http://localhost:5000/api/violations/simulate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).catch(() => null);
      
      // Let's hit a simulation trigger in backend: start session for slot
      const simulateRes = await fetch(`http://localhost:5000/api/admin/slots/${selectedSlot._id}/simulate-arrival`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await simulateRes.json();
      if (data.success) {
        setSuccess(`Simulated arrival on Slot ${selectedSlot.slotNumber}. Slot is now Occupied.`);
        loadSlots();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to trigger simulation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="main-content"><p className="text-muted">Loading map grid...</p></div>;

  return (
    <div className="main-content">
      <h1>Parking Map & Slot Controls</h1>
      <p className="text-muted">Directly override slot states (maintenance lockouts, simulate driver arrivals) for testing system reactivity.</p>

      {success && <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderLeft: '4px solid var(--color-success)', color: 'var(--color-success)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>{success}</div>}
      {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderLeft: '4px solid var(--color-danger)', color: 'var(--color-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Map Grid */}
        <div className="card">
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Facility Filter</label>
            <select
              className="form-input"
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(e.target.value)}
            >
              {facilities.map(f => (
                <option key={f._id} value={f._id}>{f.name}</option>
              ))}
            </select>
          </div>

          <ParkingMap
            slots={slots}
            selectedSlotId={selectedSlot?._id}
            onSelectSlot={(slot) => {
              setSelectedSlot(slot);
              setError('');
              setSuccess('');
            }}
          />
        </div>

        {/* Override Controls Card */}
        <div className="card">
          <h2>Slot Override Controls</h2>
          {selectedSlot ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
              <div className="flex-between">
                <h3>Slot {selectedSlot.slotNumber}</h3>
                <span className="badge badge-primary">{selectedSlot.status}</span>
              </div>
              
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span>Type: {selectedSlot.vehicleType}</span>
                <span>Size: {selectedSlot.vehicleSize}</span>
                <span>Coordinates: ({selectedSlot.coordinates.x}, {selectedSlot.coordinates.y})</span>
              </div>

              <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)' }} />

              <div>
                <h4>Change Slot Status (Admin API Override)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <button
                    onClick={() => handleChangeSlotStatus('Available')}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                    disabled={isSubmitting}
                  >
                    Set Available
                  </button>
                  <button
                    onClick={() => handleChangeSlotStatus('Maintenance')}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.5rem', borderColor: 'var(--color-warning)', color: 'var(--color-warning)' }}
                    disabled={isSubmitting}
                  >
                    Lock Maintenance
                  </button>
                </div>
              </div>

              <div>
                <h4>Simulate Hardware Signals</h4>
                <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>Triggers check-in signals to test dynamic pricing load scales and real-time Socket updates.</p>
                <button
                  onClick={handleSimulateArrival}
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '0.85rem', padding: '0.6rem' }}
                  disabled={isSubmitting || selectedSlot.status === 'Occupied' || selectedSlot.status === 'EV Charging'}
                >
                  Simulate Vehicle Arrival (Occupied)
                </button>
              </div>
            </div>
          ) : (
            <p className="text-muted" style={{ padding: '1rem 0' }}>Select a slot on the grid map to override its hardware signals or set maintenance blocks.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMap;
