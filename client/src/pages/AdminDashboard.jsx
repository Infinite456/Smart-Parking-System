import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DashboardStats from '../components/DashboardStats';
import AnalyticsCharts from '../components/AnalyticsCharts';
import { subscribeToSystemAlerts, unsubscribeFromSystemAlerts } from '../services/socket';
import { Play, ShieldAlert, Sparkles, Plus, AlertCircle, RefreshCw } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [logs, setLogs] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const resStats = await api.admin.getDashboard();
      const resAnalytics = await api.admin.getAnalytics();
      
      setStats(resStats.stats);
      setAnalytics(resAnalytics.data);
    } catch (err) {
      setError('Failed to fetch admin stats. Ensure the backend server and MongoDB are online.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to alerts via socket
    subscribeToSystemAlerts((alert) => {
      setLogs(prev => [alert, ...prev].slice(0, 10)); // Keep last 10 logs
      // Auto-reload stats on updates
      api.admin.getDashboard().then(res => setStats(res.stats)).catch(() => null);
    });

    return () => {
      unsubscribeFromSystemAlerts();
    };
  }, []);

  const handleSimulateViolation = async () => {
    setError('');
    setSuccess('');
    setIsSimulating(true);
    try {
      const res = await api.violations.simulate();
      if (res.success) {
        setSuccess(`🚨 Automated Camera scanner flagged vehicle ${res.data.registrationNumber} for "${res.data.type}"!`);
        loadData();
      }
    } catch (err) {
      setError(err.message || 'Simulation failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  if (loading) return <div className="main-content"><p className="text-muted">Loading Admin dashboard...</p></div>;

  return (
    <div className="main-content">
      <div className="flex-between" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1>City Operator Dashboard</h1>
          <p className="text-muted">Real-time smart-city parking occupancy, dynamic revenues, and safety corridor status.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={handleSimulateViolation}
            className="btn btn-secondary"
            style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)', display: 'flex', gap: '0.5rem' }}
            disabled={isSimulating}
          >
            <ShieldAlert size={16} />
            <span>{isSimulating ? 'Scanning...' : 'Simulate Camera Scan'}</span>
          </button>
          
          <button onClick={loadData} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem' }}>
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {success && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--color-danger)', color: 'var(--color-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 600 }}>{success}</div>}
      {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderLeft: '4px solid var(--color-danger)', color: 'var(--color-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>{error}</div>}

      {/* Live Statistics Cards */}
      <DashboardStats stats={stats} />

      {/* Live Dispatch Logs */}
      {logs.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>System Dispatch Feed (Real-Time Websocket)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.8rem' }}>
            {logs.map((log, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                <span className="text-muted">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span style={{ color: log.alertType === 'danger' ? 'var(--color-danger)' : log.alertType === 'success' ? 'var(--color-success)' : 'white' }}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart Visualizations */}
      <AnalyticsCharts data={analytics} />
    </div>
  );
};

export default AdminDashboard;
