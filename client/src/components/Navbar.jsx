import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Car, LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout, isAuthenticated, isAdmin } = useContext(AuthContext);

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar">
      <div className="nav-brand" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
        <Car size={28} style={{ stroke: 'url(#brand-grad)' }} />
        <span>PARKAI</span>
      </div>

      <div className="nav-links">
        {isAdmin ? (
          <>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`nav-link btn-secondary ${activeTab === 'dashboard' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`nav-link btn-secondary ${activeTab === 'map' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Parking Map
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`nav-link btn-secondary ${activeTab === 'pricing' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Pricing Rules
            </button>
            <button
              onClick={() => setActiveTab('emergency')}
              className={`nav-link btn-secondary ${activeTab === 'emergency' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Emergency Mode
            </button>
            <button
              onClick={() => setActiveTab('violations')}
              className={`nav-link btn-secondary ${activeTab === 'violations' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Violations
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`nav-link btn-secondary ${activeTab === 'dashboard' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('finder')}
              className={`nav-link btn-secondary ${activeTab === 'finder' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Find Parking
            </button>
            <button
              onClick={() => setActiveTab('ev')}
              className={`nav-link btn-secondary ${activeTab === 'ev' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              EV Charging
            </button>
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`nav-link btn-secondary ${activeTab === 'vehicles' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              My Vehicles
            </button>
            <button
              onClick={() => setActiveTab('violations')}
              className={`nav-link btn-secondary ${activeTab === 'violations' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Violations
            </button>
          </>
        )}
      </div>

      <div className="nav-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
          <UserIcon size={18} />
          <span>{user?.name}</span>
          {isAdmin && <span className="badge badge-danger" style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>Admin</span>}
        </div>
        
        <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem' }}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>

      {/* SVG Gradient definition for logo */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </svg>
    </nav>
  );
};

export default Navbar;
