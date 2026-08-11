import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';

const Violations = () => {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadViolations = async () => {
    try {
      setLoading(true);
      const res = await api.violations.list();
      setViolations(res.data);
    } catch (err) {
      setError('Failed to fetch violations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadViolations();
  }, []);

  if (loading) return <div className="main-content"><p className="text-muted">Loading violations data...</p></div>;

  const activeViolations = violations.filter(v => v.status === 'Active');
  const resolvedViolations = violations.filter(v => v.status === 'Resolved');

  return (
    <div className="main-content">
      <h1>My Parking Violations</h1>
      <p className="text-muted">Monitor safety/compatibility flags issued by computer vision scanner. Unresolved items block future bookings.</p>

      {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderLeft: '4px solid var(--color-danger)', color: 'var(--color-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>{error}</div>}

      {/* Warning Box if there are active violations */}
      {activeViolations.length > 0 && (
        <div style={{ display: 'flex', gap: '1rem', padding: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
          <ShieldAlert size={36} color="var(--color-danger)" style={{ flexShrink: 0 }} />
          <div>
            <h3 style={{ color: 'var(--color-danger)', margin: 0 }}>Action Required: Outstanding Violations</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Your account has active violations. Please move your vehicle immediately or visit the payment booth to avoid towing.
            </p>
          </div>
        </div>
      )}

      {/* Active Violations Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2>Active Infractions ({activeViolations.length})</h2>
        {activeViolations.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem 0', color: 'var(--color-success)' }}>
            <CheckCircle size={22} />
            <span>Great! No active parking violations registered on your vehicles.</span>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Plate Number</th>
                  <th>Slot / Lane</th>
                  <th>Violation Type</th>
                  <th>Reported Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeViolations.map(v => (
                  <tr key={v._id}>
                    <td><strong>{v.registrationNumber}</strong></td>
                    <td>{v.slotId?.slotNumber || 'Unknown'}</td>
                    <td>
                      <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{v.type}</span>
                    </td>
                    <td>{new Date(v.timestamp).toLocaleString()}</td>
                    <td>
                      <span className="badge badge-danger">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* History of resolved violations */}
      <div className="card">
        <h2>Resolved History ({resolvedViolations.length})</h2>
        {resolvedViolations.length === 0 ? (
          <p className="text-muted" style={{ padding: '1rem 0' }}>No past violation logs.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Plate Number</th>
                  <th>Slot / Lane</th>
                  <th>Violation Type</th>
                  <th>Reported Time</th>
                  <th>Resolved Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {resolvedViolations.map(v => (
                  <tr key={v._id}>
                    <td>{v.registrationNumber}</td>
                    <td>{v.slotId?.slotNumber || 'N/A'}</td>
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

export default Violations;
