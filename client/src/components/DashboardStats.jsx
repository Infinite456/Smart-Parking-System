import React from 'react';
import { Layers, CheckCircle2, TrendingUp, Users, AlertCircle, ShieldAlert } from 'lucide-react';

const DashboardStats = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="dashboard-grid">
      {/* Occupancy Card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
          <Layers size={24} />
        </div>
        <div>
          <span className="text-muted" style={{ fontSize: '0.875rem' }}>Live Occupancy Rate</span>
          <h3 style={{ fontSize: '1.75rem', margin: '0.25rem 0 0' }}>{stats.occupancyRate}%</h3>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>{stats.occupiedSlots} / {stats.totalSlots} slots occupied</span>
        </div>
      </div>

      {/* Available Slots Card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
          <CheckCircle2 size={24} />
        </div>
        <div>
          <span className="text-muted" style={{ fontSize: '0.875rem' }}>Available Slots</span>
          <h3 style={{ fontSize: '1.75rem', margin: '0.25rem 0 0' }}>{stats.availableSlots}</h3>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>EV Chargers: {stats.evChargingSlots}</span>
        </div>
      </div>

      {/* Active Users Card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-ev)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
          <Users size={24} />
        </div>
        <div>
          <span className="text-muted" style={{ fontSize: '0.875rem' }}>Active Parkers</span>
          <h3 style={{ fontSize: '1.75rem', margin: '0.25rem 0 0' }}>{stats.activeSessions}</h3>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>Users Registered: {stats.activeUsers}</span>
        </div>
      </div>

      {/* Revenue Card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: 'var(--color-warning)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
          <TrendingUp size={24} />
        </div>
        <div>
          <span className="text-muted" style={{ fontSize: '0.875rem' }}>Total System Revenue</span>
          <h3 style={{ fontSize: '1.75rem', margin: '0.25rem 0 0' }}>₹{stats.revenue}</h3>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>From reservations & sessions</span>
        </div>
      </div>

      {/* System Alerts / Violations Card */}
      {stats.activeViolations > 0 && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(239, 68, 68, 0.5)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>Active Violations</span>
            <h3 style={{ fontSize: '1.75rem', margin: '0.25rem 0 0', color: 'var(--color-danger)' }}>{stats.activeViolations}</h3>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Requires administrative review</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardStats;
