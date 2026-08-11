import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ParkingMap from '../components/ParkingMap';
import { subscribeToSlotUpdates, unsubscribeFromSlotUpdates, joinFacilityRoom, leaveFacilityRoom } from '../services/socket';
import { ShieldAlert, AlertOctagon, CheckCircle } from 'lucide-react';

const AdminEmergency = () => {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [slots, setSlots] = useState([]);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isToggling, setIsToggling] = useState(false);

  const loadFacilities = async () => {
    try {
      setLoading(true);
      const res = await api.parking.listFacilities();
      setFacilities(res.data);
      if (res.data.length > 0) {
        setSelectedFacilityId(res.data[0]._id);
      }
    } catch (err) {
      setError('Failed to load facilities.');
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async () => {
    if (!selectedFacilityId) return;
    try {
      const res = await api.parking.getSlots(selectedFacilityId);
      setSlots(res.data);
      
      // Determine if emergency mode is active by scanning for restricted slots
      const emergencySlotsCount = res.data.filter(s => s.status === 'Emergency Restricted').length;
      setIsEmergencyActive(emergencySlotsCount > 0);
    } catch (err) {
      setError('Failed to fetch slot states.');
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
    });

    return () => {
      if (selectedFacilityId) {
        leaveFacilityRoom(selectedFacilityId);
      }
      unsubscribeFromSlotUpdates();
    };
  }, [selectedFacilityId]);

  const handleToggleEmergencyMode = async () => {
    setError('');
    setSuccess('');
    setIsToggling(true);

    const nextState = !isEmergencyActive;

    try {
      const res = await api.admin.toggleEmergency({
        facilityId: selectedFacilityId,
        isActive: nextState
      });

      if (res.success) {
        setIsEmergencyActive(nextState);
        setSuccess(nextState 
          ? '🚨 EMERGENCY MODE ACTIVATED. Safety corridor restricted. Live alerts broadcasted.'
          : 'Emergency Corridor Cleared. Slots restored to standard booking.'
        );
        loadSlots();
      }
    } catch (err) {
      setError(err.message || 'Failed to toggle Emergency Mode.');
    } finally {
      setIsToggling(false);
    }
  };

  if (loading) return <div className="main-content"><p className="text-muted">Loading safety logs...</p></div>;

  return (
    <div className="main-content">
      <h1>Safety & Emergency Route Management</h1>
      <p className="text-muted">Instantly clear egress corridors (slots B-01 to B-08) for first responders in case of fires or evacuation events.</p>

      {success && (
        <div style={{
          backgroundColor: isEmergencyActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.15)',
          borderLeft: `4px solid ${isEmergencyActive ? 'var(--color-danger)' : 'var(--color-success)'}`,
          color: isEmergencyActive ? 'var(--color-danger)' : 'var(--color-success)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          fontWeight: 600
        }}>
          {success}
        </div>
      )}
      {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderLeft: '4px solid var(--color-danger)', color: 'var(--color-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Visual Map */}
        <div className="card">
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Select Facility to View</label>
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
            selectedSlotId={null}
            onSelectSlot={() => {}}
          />
        </div>

        {/* Control Box */}
        <div className="card" style={{
          border: isEmergencyActive ? '2px solid var(--color-danger)' : '1px solid var(--border-color)',
          backgroundColor: isEmergencyActive ? 'rgba(239, 68, 68, 0.02)' : 'var(--bg-card)'
        }}>
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <ShieldAlert size={48} color={isEmergencyActive ? 'var(--color-danger)' : 'var(--color-text-muted)'} style={{ marginBottom: '1rem' }} />
            <h2>Safety Corridor Gate</h2>
            <p className="text-muted" style={{ fontSize: '0.9rem', margin: '0.5rem 0 1.5rem' }}>
              Toggling this switch updates slots B-01 to B-08 to "Emergency Restricted". Standard reservations will be blocked, and parked cars will be flagged.
            </p>

            <button
              onClick={handleToggleEmergencyMode}
              className={`btn ${isEmergencyActive ? 'btn-secondary' : 'btn-danger'}`}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.1rem',
                boxShadow: isEmergencyActive ? 'none' : '0 0 15px rgba(239, 68, 68, 0.4)',
                border: isEmergencyActive ? '1px solid var(--color-danger)' : 'none',
                color: isEmergencyActive ? 'var(--color-danger)' : 'white'
              }}
              disabled={isToggling}
            >
              {isToggling 
                ? 'Processing safety path...' 
                : isEmergencyActive 
                  ? '⚠️ Clear Corridor (Normal Operation)' 
                  : '🚨 ACTIVATE EMERGENCY CORRIDOR'
              }
            </button>
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '1.5rem 0' }} />

          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
              <AlertOctagon size={16} color="var(--color-warning)" />
              Egress Path Details:
            </h4>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li><strong>Affected Slots:</strong> B-01, B-02, B-03, B-04, B-05, B-06, B-07, B-08.</li>
              <li><strong>Egress Route:</strong> Directly adjacent to the East Fire Evacuation Gate.</li>
              <li><strong>Automatic Warnings:</strong> Fired via Socket.IO instantly to all active dashboards.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEmergency;
