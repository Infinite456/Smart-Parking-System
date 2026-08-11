import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Trash2, ShieldAlert, Car, Zap, X, AlertTriangle } from 'lucide-react';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [type, setType] = useState('Car');
  const [size, setSize] = useState('medium');
  const [isEV, setIsEV] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100);

  // Custom Confirmation Dialog State
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const res = await api.vehicles.list();
      setVehicles(res.data);
    } catch (err) {
      setError('Failed to fetch vehicle list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!registrationNumber.trim()) {
      setError('Please provide a registration / license plate number.');
      return;
    }

    try {
      const res = await api.vehicles.add({
        registrationNumber: registrationNumber.toUpperCase().trim(),
        type,
        size,
        isEV,
        batteryLevel: isEV ? batteryLevel : 100
      });

      if (res.success) {
        setSuccess('Vehicle registered successfully!');
        setRegistrationNumber('');
        setType('Car');
        setSize('medium');
        setIsEV(false);
        setBatteryLevel(100);
        loadVehicles();
      }
    } catch (err) {
      setError(err.message || 'Failed to register vehicle.');
    }
  };

  const handleTriggerDelete = (vehicle) => {
    setError('');
    setSuccess('');
    setVehicleToDelete(vehicle);
  };

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    
    setError('');
    setSuccess('');
    const id = vehicleToDelete._id;
    const plate = vehicleToDelete.registrationNumber;
    
    // Close modal first
    setVehicleToDelete(null);

    try {
      const res = await api.vehicles.remove(id);
      if (res.success) {
        setSuccess(`Vehicle ${plate} removed successfully.`);
        loadVehicles();
      }
    } catch (err) {
      setError(err.message || `Failed to remove vehicle ${plate}.`);
    }
  };

  if (loading) return <div className="main-content"><p className="text-muted">Loading your vehicles...</p></div>;

  return (
    <div className="main-content" style={{ position: 'relative' }}>
      <h1>My Garage</h1>
      <p className="text-muted">Register and manage your personal vehicles to customize AI slot scoring compatibility.</p>

      {success && <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderLeft: '4px solid var(--color-success)', color: 'var(--color-success)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>{success}</div>}
      {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderLeft: '4px solid var(--color-danger)', color: 'var(--color-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Vehicles list */}
        <div className="card">
          <h2>Registered Vehicles ({vehicles.length})</h2>
          {vehicles.length === 0 ? (
            <p className="text-muted" style={{ padding: '1.5rem 0' }}>No vehicles registered yet. Use the form on the right to register your first vehicle.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {vehicles.map(v => (
                <div key={v._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', padding: '0.65rem', borderRadius: 'var(--radius-md)' }}>
                      <Car size={22} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '0.5px' }}>{v.registrationNumber}</h3>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                        <span className="badge badge-primary" style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>{v.type}</span>
                        <span className="badge badge-success" style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>Size: {v.size}</span>
                        {v.isEV && <span className="badge badge-ev" style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '2px' }}><Zap size={8} /> EV</span>}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleTriggerDelete(v)}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                    title="Remove Vehicle"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add vehicle form */}
        <div className="card">
          <h2>Register Vehicle</h2>
          <form onSubmit={handleAddVehicle} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Registration / License Plate Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="MH-12-AB-1234"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Vehicle Type</label>
              <select
                className="form-input"
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  // Autofill default size based on type
                  if (e.target.value === 'Motorcycle') setSize('small');
                  else if (e.target.value === 'Car') setSize('medium');
                  else if (e.target.value === 'SUV' || e.target.value === 'Van') setSize('large');
                }}
              >
                <option value="Motorcycle">Motorcycle</option>
                <option value="Car">Car</option>
                <option value="SUV">SUV</option>
                <option value="Van">Van</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Vehicle Size Category</label>
              <select
                className="form-input"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              >
                <option value="small">Small (Motorcycle, Hatchback)</option>
                <option value="medium">Medium (Sedan, Cross-over)</option>
                <option value="large">Large (SUV, Van, Minibus)</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.5rem 0' }}>
              <input
                type="checkbox"
                id="isEV"
                checked={isEV}
                onChange={(e) => setIsEV(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="isEV" style={{ cursor: 'pointer', fontWeight: 500 }}>
                This is an Electric Vehicle (EV)
              </label>
            </div>

            {isEV && (
              <div className="form-group" style={{ marginBottom: 0, animation: 'slideDown 0.2s ease-out' }}>
                <label className="form-label">Current Battery Charge Level (%)</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  max="100"
                  value={batteryLevel}
                  onChange={(e) => setBatteryLevel(parseInt(e.target.value))}
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              <Plus size={16} />
              <span>Add Vehicle</span>
            </button>
          </form>
        </div>
      </div>

      {/* --- CUSTOM CONFIRMATION DELETE MODAL --- */}
      {vehicleToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div className="card text-center" style={{ width: '100%', maxWidth: '420px', padding: '2rem', border: '1px solid rgba(239, 68, 68, 0.3)', backgroundColor: 'var(--bg-secondary)', animation: 'zoomIn 0.2s ease-out' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', marginBottom: '1.25rem' }}>
              <AlertTriangle size={28} />
            </div>
            
            <h2 style={{ fontSize: '1.3rem', color: 'white', marginBottom: '0.5rem' }}>Remove Vehicle?</h2>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.75rem' }}>
              Are you sure you want to remove vehicle <strong>{vehicleToDelete.registrationNumber}</strong> from your garage? This cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setVehicleToDelete(null)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteVehicle}
                className="btn btn-danger"
                style={{ flex: 1 }}
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
