import React, { useState, useEffect, useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';

// Unauthenticated views
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';

// Authenticated Driver views
import UserDashboard from './pages/UserDashboard';
import ParkingFinder from './pages/ParkingFinder';
import EVCharging from './pages/EVCharging';
import Vehicles from './pages/Vehicles';
import Violations from './pages/Violations';

// Authenticated Admin/Operator views
import AdminDashboard from './pages/AdminDashboard';
import AdminMap from './pages/AdminMap';
import AdminPricing from './pages/AdminPricing';
import AdminEmergency from './pages/AdminEmergency';
import AdminViolations from './pages/AdminViolations';

function AppContent() {
  const { isAuthenticated, isAdmin, loading } = useContext(AuthContext);
  const [unauthView, setUnauthView] = useState('landing');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Automatically reset tab to 'dashboard' when auth state changes (login/logout)
  useEffect(() => {
    setActiveTab('dashboard');
    if (!isAuthenticated) {
      setUnauthView('landing');
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="auth-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="pulsing-glow" style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', margin: '0 auto 1.5rem' }}></div>
          <h2>Loading PARKAI...</h2>
          <p className="text-muted">Initializing secure connection...</p>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated Route Wrapper
  if (!isAuthenticated) {
    switch (unauthView) {
      case 'login':
        return <Login onNavigate={setUnauthView} />;
      case 'register':
        return <Register onNavigate={setUnauthView} />;
      case 'landing':
      default:
        return <LandingPage onNavigate={setUnauthView} />;
    }
  }

  // 2. Authenticated Routes (Driver vs Admin)
  const renderPage = () => {
    if (isAdmin) {
      switch (activeTab) {
        case 'map':
          return <AdminMap />;
        case 'pricing':
          return <AdminPricing />;
        case 'emergency':
          return <AdminEmergency />;
        case 'violations':
          return <AdminViolations />;
        case 'dashboard':
        default:
          return <AdminDashboard setActiveTab={setActiveTab} />;
      }
    } else {
      switch (activeTab) {
        case 'finder':
          return <ParkingFinder setActiveTab={setActiveTab} />;
        case 'ev':
          return <EVCharging setActiveTab={setActiveTab} />;
        case 'vehicles':
          return <Vehicles />;
        case 'violations':
          return <Violations />;
        case 'dashboard':
        default:
          return <UserDashboard setActiveTab={setActiveTab} />;
      }
    }
  };

  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
