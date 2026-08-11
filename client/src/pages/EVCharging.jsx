import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, ShieldAlert, Sparkles, Plus, Clock, Battery, Lock, Car, Hammer, CheckCircle2 } from 'lucide-react';

const EVCharging = ({ setActiveTab }) => {
  const [chargingSlots, setChargingSlots] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [hours, setHours] = useState('2');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadEVData = async () => {
    try {
      const res = await api.ev.listSlots();
      setChargingSlots(res.data);
      setAnalytics(res.analytics);

      const resVehicles = await api.vehicles.list();
      // Filter EVs only
      const evs = resVehicles.data.filter(v => v.isEV);
      setVehicles(evs);
      
      if (res.data.length > 0) {
        setSelectedSlotId(res.data[0]._id);
      }
      if (evs.length > 0) {
        setSelectedVehicleId(evs[0]._id);
      }
    } catch (err) {
      setError('Failed to fetch EV charging data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEVData();
  }, []);

  const handleEVBooking = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    if (!selectedSlotId || !selectedVehicleId) {
      setError('Please select a charging slot and vehicle.');
      setIsSubmitting(false);
      return;
    }

    try {
      const slot = chargingSlots.find(s => s._id === selectedSlotId);
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + parseInt(hours) * 60 * 60 * 1000);

      const res = await api.ev.reserveSlot({
        vehicleId: selectedVehicleId,
        facilityId: slot.facilityId._id,
        slotId: selectedSlotId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });

      if (res.success) {
        setSuccess(`EV Charging slot ${slot.slotNumber} reserved successfully! View ticket on your Dashboard.`);
        loadEVData();
      }
    } catch (err) {
      setError(err.message || 'Failed to book EV charger.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="main-content"><p className="text-muted">Loading EV charging networks...</p></div>;

  // Format Recharts data for 24h demand
  const chartData = analytics?.demandForecast24h?.map((val, hr) => ({
    hour: hr === 0 ? '12 AM' : hr === 12 ? '12 PM' : hr > 12 ? `${hr - 12} PM` : `${hr} AM`,
    demand: val
  })) || [];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Available':
        return <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />;
      case 'Reserved':
        return <Lock size={18} style={{ color: 'var(--color-warning)' }} />;
      case 'Occupied':
        return <Car size={18} style={{ color: 'white' }} />;
      case 'EV Charging':
        return <Zap size={18} style={{ color: 'var(--color-ev)' }} className="pulse-ev-icon" />;
      case 'Maintenance':
      case 'Emergency Restricted':
        return <Hammer size={18} style={{ color: 'var(--color-text-muted)' }} />;
      default:
        return <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Available': return 'slot-available';
      case 'Reserved': return 'slot-reserved';
      case 'Occupied': return 'slot-occupied';
      case 'EV Charging': return 'slot-ev';
      case 'Maintenance':
      case 'Emergency Restricted':
        return 'slot-maintenance';
      default: return 'slot-available';
    }
  };

  return (
    <div className="main-content">
      <h1>EV Charging Panel</h1>
      <p className="text-muted">Locate high-speed charging ports, view load forecasts, and schedule EV parking.</p>

      {success && <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderLeft: '4px solid var(--color-success)', color: 'var(--color-success)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>{success}</div>}
      {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderLeft: '4px solid var(--color-danger)', color: 'var(--color-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>{error}</div>}

      {/* EV Live Metrics */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-ev)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
            <Zap size={24} />
          </div>
          <div>
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>Total EV Ports</span>
            <h3 style={{ fontSize: '1.75rem', margin: '0.25rem 0 0' }}>{analytics?.totalEVChargers}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
            <Battery size={24} />
          </div>
          <div>
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>Available Ports</span>
            <h3 style={{ fontSize: '1.75rem', margin: '0.25rem 0 0' }}>{analytics?.availableEVChargers}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: 'var(--color-warning)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
            <Sparkles size={24} />
          </div>
          <div>
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>Active Charge Load</span>
            <h3 style={{ fontSize: '1.75rem', margin: '0.25rem 0 0' }}>{analytics?.utilizationRate}%</h3>
          </div>
        </div>
      </div>

      {/* Locate EV Charger visualizer row */}
      <div className="card" style={{ marginBottom: '2.5rem' }}>
        <h2>Locate EV Chargers</h2>
        <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '-0.5rem', marginBottom: '1.5rem' }}>
          Select a charger bay from the visual layout below to load it directly into the scheduler form.
        </p>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }}></span> Available
          </span>
          <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-warning)' }}></span> Reserved
          </span>
          <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'white' }}></span> Occupied
          </span>
          <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-ev)' }}></span> Charging
          </span>
          <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-text-muted)' }}></span> Out of Service
          </span>
        </div>

        {/* Grid visualizer */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '1rem' }}>
          {chargingSlots.map(slot => {
            const isSelected = selectedSlotId === slot._id;
            const statusClass = getStatusClass(slot.status);
            
            return (
              <div
                key={slot._id}
                onClick={() => setSelectedSlotId(slot._id)}
                className={`parking-slot-wrapper`}
                style={{ cursor: 'pointer' }}
              >
                <div
                  className={`parking-slot-box ${statusClass}`}
                  style={{
                    width: '100%',
                    height: '100px',
                    justifyContent: 'center',
                    borderWidth: '2px',
                    borderColor: isSelected ? 'white' : undefined,
                    boxShadow: isSelected ? '0 0 12px rgba(6, 182, 212, 0.4)' : undefined,
                    transform: isSelected ? 'scale(1.03)' : undefined,
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ position: 'absolute', top: '6px', right: '6px' }}>
                    {getStatusIcon(slot.status)}
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: 800 }}>{slot.slotNumber}</span>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{slot.status}</span>
                  <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{slot.facilityId?.name || 'Smart Hub'}</span>
                </div>
                
                {/* CSS Tooltip Bubble */}
                <div className="slot-tooltip-bubble">
                  <div style={{ fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2px', marginBottom: '4px' }}>Port {slot.slotNumber}</div>
                  <div>Status: {slot.status}</div>
                  <div>Dimension: {slot.vehicleSize}</div>
                  <div>Charger: DC 150kW High-Speed</div>
                  <div>Rate: ₹50/hour</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Forecast Chart & Reservation Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', alignItems: 'start', marginBottom: '3rem' }}>
        {/* Load forecast chart */}
        <div className="card">
          <h3>24-Hour Projected EV Charging Station Load</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Peak charging loads occur around corporate arrival/departure windows (8 AM - 6 PM).</p>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorEVDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="hour" stroke="#475569" />
                <YAxis stroke="#475569" />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', color: '#f1f5f9' }} />
                <Area type="monotone" dataKey="demand" name="Port Load (%)" stroke="var(--color-ev)" fillOpacity={1} fill="url(#colorEVDemand)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charger Booking Box */}
        <div className="card">
          <h3>Schedule Charger</h3>
          {vehicles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>You have no electric vehicles registered in your garage.</p>
              <button onClick={() => setActiveTab('vehicles')} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>Add EV Car</button>
            </div>
          ) : (
            <form onSubmit={handleEVBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Choose EV Slot</label>
                <select
                  className="form-input"
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                >
                  {chargingSlots.map(s => (
                    <option key={s._id} value={s._id}>
                      Slot {s.slotNumber} ({s.status}) - {s.facilityId?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Select EV Vehicle</label>
                <select
                  className="form-input"
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                >
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>
                      {v.registrationNumber} ({v.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Charging Duration</label>
                <select
                  className="form-input"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                >
                  <option value="1">1 Hour</option>
                  <option value="2">2 Hours</option>
                  <option value="4">4 Hours</option>
                  <option value="6">6 Hours</option>
                </select>
              </div>

              <button type="submit" className="btn btn-ev" style={{ width: '100%', marginTop: '0.5rem' }} disabled={isSubmitting}>
                {isSubmitting ? 'Scheduling Charging...' : 'Reserve Charger Now'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EVCharging;
