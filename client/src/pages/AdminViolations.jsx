import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldAlert, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import { subscribeToSystemAlerts, unsubscribeFromSystemAlerts } from '../services/socket';

const AdminViolations = () => {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isResolving, setIsResolving] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const loadViolations = async () => {
    try {
      setLoading(true);
      const res = await api.violations.list();
      setViolations(res.data);
    } catch (err) {
      setError('Failed to fetch infractions log.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadViolations();

    subscribeToSystemAlerts(() => {
      // Auto reload on new violations
      loadViolations();
    });

    return () => {
      unsubscribeFromSystemAlerts();
    };
  }, []);

  const handleResolve = async (id) => {
    setError('');
    setSuccess('');
    setIsResolving(id);
    try {
      const res = await api.violations.resolve(id);
      if (res.success) {
        setSuccess('Violation resolved. Associated parking slot released.');
        loadViolations();
      }
    } catch (err) {
      setError(err.message || 'Failed to resolve infraction.');
    } finally {
      setIsResolving('');
    }
  };

  const handleSimulate = async () => {
    setError('');
    setSuccess('');
    setIsSimulating(true);
    try {
      const res = await api.violations.simulate();
      if (res.success) {
        setSuccess(`🚨 Camera scanner generated infraction for vehicle ${res.data.registrationNumber}`);
        loadViolations();
      }
    } catch (err) {
      setError(err.message || 'Simulation failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  if (loading) return <div className="main-content"><p className="text-muted">Loading infractions panel...</p></div>;

  const active = violations.filter(v => v.status === 'Active');
  const resolved = violations.filter(v => v.status === 'Resolved');

  return (
    <div className="main-content">
      <div className="flex-between" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1>Security & Compliance Monitor</h1>
          <p className="text-muted">Manage real-time camera infractions (Wrong type compatibility, Emergency parking, Exceeded durations).</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={handleSimulate}
            className="btn btn-primary"
            style={{ backgroundColor: 'var(--color-danger)', color: 'white' }}
            disabled={isSimulating}
          >
            Trigger Random Infraction
          </button>
          
          <button onClick={loadViolations} className="btn btn-secondary">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {success && <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderLeft: '4px solid var(--color-success)', color: 'var(--color-success)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>{success}</div>}
      {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderLeft: '4px solid var(--color-danger)', color: 'var(--color-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>{error}</div>}

      {/* Active Violations card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2>Outstanding Violations ({active.length})</h2>
        {active.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem 0', color: 'var(--color-success)' }}>
            <CheckCircle size={22} />
            <span>Operational safety is 100%. No outstanding infractions.</span>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Vehicle Registration</th>
                  <th>Driver Name</th>
                  <th>Bay Location</th>
                  <th>Infraction Type</th>
                  <th>Timestamp</th>
                  <th>Operations</th>
                </tr>
              </thead>
              <tbody>
                {active.map(v => (
                  <tr key={v._id}>
                    <td><strong style={{ letterSpacing: '0.5px' }}>{v.registrationNumber}</strong></td>
                    <td>{v.userId?.name || 'Guest / Unregistered'}</td>
                    <td><strong>Slot {v.slotId?.slotNumber || 'N/A'}</strong></td>
                    <td>
                      <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{v.type}</span>
                    </td>
                    <td>{new Date(v.timestamp).toLocaleString()}</td>
                    <td>
                      <button
                        onClick={() => handleResolve(v._id)}
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: 'var(--color-success)' }}
                        disabled={isResolving === v._id}
                      >
                        {isResolving === v._id ? 'Resolving...' : 'Clear/Resolve'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolved history card */}
      <div className="card">
        <h2>Cleared Infractions History ({resolved.length})</h2>
        {resolved.length === 0 ? (
          <p className="text-muted" style={{ padding: '1rem 0' }}>No cleared records found.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Vehicle Plate</th>
                  <th>Bay Location</th>
                  <th>Infraction Type</th>
                  <th>Time Reported</th>
                  <th>Time Resolved</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {resolved.map(v => (
                  <tr key={v._id}>
                    <td>{v.registrationNumber}</td>
                    <td>Slot {v.slotId?.slotNumber || 'N/A'}</td>
                    <td>{v.type}</td>
                    <td>{new Date(v.timestamp).toLocaleDateString()}</td>
                    <td>{v.resolvedAt ? new Date(v.resolvedAt).toLocaleDateString() : 'Yes'}</td>
                    <td>
                      <span className="badge badge-success">Resolved</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminViolations;
