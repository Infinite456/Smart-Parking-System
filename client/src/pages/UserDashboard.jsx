import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Play, Square, Compass, Clock, CreditCard, ShieldAlert, Zap, AlertTriangle } from 'lucide-react';
import { subscribeToSystemAlerts, unsubscribeFromSystemAlerts } from '../services/socket';

const UserDashboard = ({ setActiveTab }) => {
  const { user } = useContext(AuthContext);
  const [reservations, setReservations] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [activeCharging, setActiveCharging] = useState(null);
  const [violations, setViolations] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [alerts, setAlerts] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch user specific data
      const resReservations = await api.reservations.list();
      const userVehicles = await api.vehicles.list();
      const resViolations = await api.violations.list();
      
      // Separate active vs past reservations
      setReservations(resReservations.data.filter(r => r.status === 'Pending'));
      setViolations(resViolations.data.filter(v => v.status === 'Active'));

      // Fetch active sessions and check EV charging status
      const resFacilities = await api.parking.listFacilities();
      if (resFacilities.data.length > 0) {
        const slots = await api.parking.getSlots(resFacilities.data[0]._id);
        
        // Find if this user has active sessions or charging
        const evData = await api.ev.listSlots();
        const activeChg = evData.activeSessions?.find(s => s.userId === user.id || s.userId?._id === user.id);
        setActiveCharging(activeChg || null);

        // Fetch completed reservation history
        const historyRes = await fetch('http://localhost:5000/api/reservations', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json()).catch(() => ({data: []}));

        setHistory(historyRes.data?.filter(r => r.status === 'Completed' || r.status === 'Cancelled') || []);
        
        // Check active parking session in local storage
        const actSessions = [];
        const savedActiveSession = localStorage.getItem('active_session_slot');
        if (savedActiveSession) {
          const slotObj = slots.data.find(s => s._id === savedActiveSession);
          if (slotObj && (slotObj.status === 'Occupied' || slotObj.status === 'EV Charging')) {
            actSessions.push({
              slotId: slotObj,
              entryTime: localStorage.getItem('active_session_time') || new Date().toISOString(),
              vehicleId: userVehicles.data[0] || null
            });
          } else {
            localStorage.removeItem('active_session_slot');
            localStorage.removeItem('active_session_time');
          }
        }
        setActiveSessions(actSessions);
      }
      
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen to real-time alerts
    subscribeToSystemAlerts((alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 5)); // Keep last 5
      // Refresh dashboard states
      fetchData();
    });

    return () => {
      unsubscribeFromSystemAlerts();
    };
  }, []);

  const handleCheckIn = async (reservation) => {
    setError('');
    setMessage('');
    try {
      const res = await api.sessions.start({
        vehicleId: reservation.vehicleId._id,
        slotId: reservation.slotId._id,
        reservationId: reservation._id
      });
      
      if (res.success) {
        localStorage.setItem('active_session_slot', reservation.slotId._id);
        localStorage.setItem('active_session_time', new Date().toISOString());
        setMessage(`Successfully checked into Slot ${reservation.slotId.slotNumber}! Parking Session started.`);
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async (session) => {
    setError('');
    setMessage('');
    try {
      const res = await api.sessions.end(session.slotId._id);
      if (res.success) {
        localStorage.removeItem('active_session_slot');
        localStorage.removeItem('active_session_time');
        setMessage(`Checked out! Total fee: ₹${res.data.amount} for ${res.data.durationMinutes} minutes. Slot cleared.`);
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Check-out failed');
    }
  };

  const handleCancelReservation = async (reservationId) => {
    setError('');
    setMessage('');
    try {
      const res = await api.reservations.cancel(reservationId);
      if (res.success) {
        setMessage('Reservation cancelled successfully. The slot has been released.');
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to cancel reservation');
    }
  };

  if (loading) return <div className="main-content"><p className="text-muted">Loading your driver dashboard...</p></div>;

  return (
    <div className="main-content">
      {/* Alert notifications */}
      {alerts.length > 0 && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderLeft: '4px solid var(--color-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          <strong style={{ color: 'var(--color-danger)' }}>📢 Live Dispatch Alert:</strong> {alerts[0].message}
        </div>
      )}

      {/* Greeting Header */}
      <div className="flex-between" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1>Hello, {user?.name}</h1>
          <p className="text-muted">Manage your registered vehicles, active parking, charging, and view receipts.</p>
        </div>
        <button onClick={() => setActiveTab('finder')} className="btn btn-primary" style={{ padding: '0.8rem 1.8rem', fontSize: '1rem' }}>
          <Compass size={18} />
          <span>Find Parking & Reserve</span>
        </button>
      </div>

      {message && <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderLeft: '4px solid var(--color-success)', color: 'var(--color-success)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>{message}</div>}
      {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderLeft: '4px solid var(--color-danger)', color: 'var(--color-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>{error}</div>}

      {/* Violations Warning Banner */}
      {violations.length > 0 && (
        <div className="emergency-banner" style={{ marginBottom: '2rem' }}>
          <ShieldAlert size={28} />
          <div>
            <strong>Active Parking Violation Detected:</strong> You have been flagged for <strong>"{violations[0].type}"</strong> at slot <strong>{violations[0].slotId?.slotNumber || 'N/A'}</strong>. Please resolve immediately.
          </div>
          <button onClick={() => setActiveTab('violations')} className="btn btn-secondary" style={{ color: 'white', borderColor: 'white', marginLeft: 'auto' }}>
            View Action Details
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="user-dashboard-grid">
        {/* Left: Active Reservations & Parking Sessions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Active Parking Sessions Card */}
          <div className="card">
            <h2>Active Parking Ticket</h2>
            {activeSessions.length === 0 ? (
              <p className="text-muted" style={{ padding: '1rem 0' }}>No active parking session. When you arrive at your reserved slot, tap "Check-in" below to start your session.</p>
            ) : (
              activeSessions.map((session, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Slot {session.slotId?.slotNumber} ({session.slotId?.isEV ? 'EV Charging' : 'Standard'})</h3>
                    <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      Vehicle: <strong>{session.vehicleId?.registrationNumber}</strong> | Checked-in: {new Date(session.entryTime).toLocaleTimeString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>Elapsed</span>
                      <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        {Math.round((new Date() - new Date(session.entryTime)) / (1000 * 60))} mins
                      </div>
                    </div>
                    <button
                      onClick={() => handleCheckOut(session)}
                      className="btn btn-danger"
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      <Square size={16} />
                      <span>Check-out & Pay</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pending Reservations Card */}
          <div className="card">
            <h2>Upcoming Reservations</h2>
            {reservations.length === 0 ? (
              <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
                <p className="text-muted" style={{ marginBottom: '1rem' }}>No upcoming parking reservations.</p>
                <button onClick={() => setActiveTab('finder')} className="btn btn-secondary">Reserve a slot</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reservations.map(res => (
                  <div key={res._id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className="badge badge-warning" style={{ marginBottom: '0.5rem' }}>Reserved Slot {res.slotId?.slotNumber}</span>
                      <p style={{ margin: 0, fontWeight: 500 }}>{res.facilityId?.name}</p>
                      <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                        Vehicle: {res.vehicleId?.registrationNumber} | Timing: {new Date(res.startTime).toLocaleTimeString()} - {new Date(res.endTime).toLocaleTimeString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        onClick={() => handleCheckIn(res)}
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
                        disabled={activeSessions.length > 0}
                      >
                        <Play size={14} />
                        <span>Check-In</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to cancel this reservation?')) {
                            handleCancelReservation(res._id);
                          }
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: EV charging and history */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* EV Charging Status Card */}
          <div className="card">
            <h2>EV Charging Panel</h2>
            {activeCharging ? (
              <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.05)', border: '1px solid var(--color-ev)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-ev)', fontWeight: 600, marginBottom: '0.5rem' }}>
                  <Zap size={18} />
                  <span>Actively Charging...</span>
                </div>
                <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}>Vehicle: <strong>{activeCharging.vehicleId?.registrationNumber || 'EV'}</strong></p>
                <div style={{ margin: '1rem 0' }}>
                  <div className="flex-between" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span>Battery Status</span>
                    <span>Charging (Est. 80%)</span>
                  </div>
                  <div style={{ backgroundColor: '#1f2937', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: 'var(--color-ev)', width: '80%', height: '100%', borderRadius: '5px' }}></div>
                  </div>
                </div>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>Charging at a rate of 0.8% per minute. Check-out completes billing.</span>
              </div>
            ) : (
              <div style={{ padding: '1rem 0', textAlign: 'center' }}>
                <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>No active EV charging session detected.</p>
                <button onClick={() => setActiveTab('ev')} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>Locate EV Chargers</button>
              </div>
            )}
          </div>

          {/* Booking History Card */}
          <div className="card">
            <h2>Recent Receipts</h2>
            {history.length === 0 ? (
              <p className="text-muted">No completed parking receipts found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {history.slice(0, 4).map(h => (
                  <div key={h._id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>Slot {h.slotId?.slotNumber || 'Slot'}</p>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>{new Date(h.startTime || h.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 600, color: 'white' }}>₹{h.price}</span>
                      <div style={{ fontSize: '0.7rem' }}>
                        {h.status === 'Cancelled' ? (
                          <span style={{ color: 'var(--color-danger)' }}>Cancelled</span>
                        ) : (
                          <span style={{ color: 'var(--color-success)' }}>Paid</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
