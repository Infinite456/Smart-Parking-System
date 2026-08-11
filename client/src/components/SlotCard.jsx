import React, { useState } from 'react';
import { Calendar, Clock, Compass, Tag, Zap, AlertOctagon } from 'lucide-react';

const SlotCard = ({ slot, onReserve, vehicles, userReservations, userActiveSessions }) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [hours, setHours] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!slot) {
    return (
      <div className="card text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px' }}>
        <p className="text-muted">Click a slot on the parking map to view details, current price, and reservation options.</p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available': return <span className="badge badge-success">Available</span>;
      case 'Occupied': return <span className="badge badge-danger">Occupied</span>;
      case 'Reserved': return <span className="badge badge-warning">Reserved</span>;
      case 'EV Charging': return <span className="badge badge-ev">EV Charging</span>;
      case 'Maintenance': return <span className="badge badge-maintenance">Maintenance</span>;
      case 'Emergency Restricted': return <span className="badge badge-danger" style={{ animation: 'pulse-emergency 1s infinite alternate' }}>🚨 Emergency Restricted</span>;
      default: return null;
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      setError('Please select a vehicle to reserve parking.');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + parseInt(hours) * 60 * 60 * 1000);
      
      await onReserve({
        vehicleId: selectedVehicleId,
        facilityId: slot.facilityId,
        slotId: slot._id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });
    } catch (err) {
      setError(err.message || 'Failed to book slot');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if slot is reservable
  const isReservable = slot.status === 'Available' || (slot.isEV && slot.status === 'Available');

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      <div className="flex-between">
        <h3 style={{ margin: 0 }}>Slot {slot.slotNumber}</h3>
        {getStatusBadge(slot.status)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Tag size={16} className="text-muted" />
          <span>Price: <strong style={{ color: 'var(--color-warning)' }}>₹{slot.currentPrice || 40}/hour</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={16} className="text-muted" />
          <span>Vehicle Class: <strong style={{ textTransform: 'capitalize' }}>{slot.vehicleType} ({slot.vehicleSize})</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Compass size={16} className="text-muted" />
          <span>Distance: <strong>{Math.round(Math.sqrt(slot.coordinates.x ** 2 + slot.coordinates.y ** 2))} meters</strong> from entrance</span>
        </div>
        {slot.isEV && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-ev)' }}>
            <Zap size={16} />
            <span>EV Charging Port Available</span>
          </div>
        )}
      </div>

      <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)' }} />

      {slot.pricingExplanation && (
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--color-text-muted)', borderLeft: '3px solid var(--color-warning)' }}>
          <strong>Dynamic Pricing Reason:</strong><br />
          {slot.pricingExplanation}
        </div>
      )}

      {isReservable ? (
        <form onSubmit={handleBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4>Quick Reservation</h4>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Select Vehicle</label>
            <select
              className="form-input"
              value={selectedVehicleId}
              onChange={(e) => {
                setSelectedVehicleId(e.target.value);
                setError('');
              }}
              required
            >
              <option value="">-- Choose Vehicle --</option>
              {vehicles?.map(v => (
                <option key={v._id} value={v._id}>
                  {v.registrationNumber} ({v.type} - {v.isEV ? 'EV' : 'ICE'})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Reservation Duration</label>
            <select
              className="form-input"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            >
              <option value="1">1 Hour (Est. ₹{(slot.currentPrice || 40) * 1})</option>
              <option value="2">2 Hours (Est. ₹{(slot.currentPrice || 40) * 2})</option>
              <option value="3">3 Hours (Est. ₹{(slot.currentPrice || 40) * 3})</option>
              <option value="5">5 Hours (Est. ₹{(slot.currentPrice || 40) * 5})</option>
              <option value="8">8 Hours (Est. ₹{(slot.currentPrice || 40) * 8})</option>
            </select>
          </div>

          {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

          <button
            type="submit"
            className={`btn ${slot.isEV ? 'btn-ev' : 'btn-primary'}`}
            disabled={isSubmitting || vehicles?.length === 0}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {isSubmitting ? 'Processing Booking...' : 'Reserve Slot Now'}
          </button>
          
          {vehicles?.length === 0 && (
            <p className="text-muted" style={{ fontSize: '0.75rem', textAlign: 'center' }}>
              ⚠️ You must add a vehicle in the "My Vehicles" tab before making reservations.
            </p>
          )}
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <AlertOctagon size={28} color={slot.status === 'Emergency Restricted' ? 'var(--color-danger)' : 'var(--color-text-muted)'} />
          <h4 style={{ margin: 0 }}>Reservation Unavailable</h4>
          <p className="text-muted" style={{ fontSize: '0.8rem' }}>
            {slot.status === 'Emergency Restricted' 
              ? '🚨 This slot is restricted as part of an active emergency escape route corridor. Reservations are blocked.' 
              : `This slot is currently ${slot.status.toLowerCase()} and cannot be reserved at this time.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default SlotCard;
