import React, { useState } from 'react';
import { Compass, Calendar, Car, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';

const LandingPage = ({ onNavigate }) => {
  const [searchLocation, setSearchLocation] = useState('downtown');
  const [searchType, setSearchType] = useState('Car');

  const handleSearch = (e) => {
    e.preventDefault();
    // Redirect to login to perform authenticated reservation search
    onNavigate('login');
  };

  const scrollToSearch = () => {
    const searchSection = document.getElementById('search-section');
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-wrapper" style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Navbar */}
      <nav className="navbar" style={{ padding: '1rem 2rem', background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
        <div className="nav-brand" style={{ gap: '0.5rem', fontSize: '1.25rem' }}>
          <Car size={24} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 800, letterSpacing: '0.05em' }}>PARKAI</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', fontWeight: 600 }}>
          <span onClick={scrollToSearch} style={{ cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Find Parking</span>
          <span onClick={() => {
            const howItWorks = document.getElementById('how-it-works');
            if (howItWorks) howItWorks.scrollIntoView({ behavior: 'smooth' });
          }} style={{ cursor: 'pointer', color: 'var(--color-text-secondary)' }}>How It Works</span>
        </div>
        <div>
          <button onClick={() => onNavigate('login')} className="btn btn-secondary" style={{ padding: '0.45rem 1.25rem', borderRadius: '30px', fontSize: '0.85rem' }}>
            Sign In
          </button>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <header style={{ textAlign: 'center', padding: '5rem 1.5rem 3.5rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1.25rem', color: 'white' }}>
          Smart Parking. <span style={{ background: 'linear-gradient(135deg, #3b82f6, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Made Simple.</span>
        </h1>
        <p className="text-muted" style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', maxWidth: '580px', margin: '0 auto 2.5rem', lineHeight: '1.6' }}>
          Find available parking faster with real-time availability and intelligent recommendations.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={scrollToSearch} className="btn btn-primary" style={{ padding: '0.75rem 2rem', borderRadius: '30px', fontSize: '0.95rem' }}>
            Find Parking
          </button>
          <button onClick={() => onNavigate('login')} className="btn btn-secondary" style={{ padding: '0.75rem 2rem', borderRadius: '30px', fontSize: '0.95rem' }}>
            Sign In
          </button>
        </div>

        <div style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Need to register a vehicle?{' '}
          <span onClick={() => onNavigate('register')} style={{ color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
            Register here
          </span>
        </div>

        {/* Minimal Hero Visual */}
        <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ 
            background: 'rgba(31, 41, 55, 0.4)', 
            border: '1px solid var(--border-color)', 
            borderRadius: 'var(--radius-md)', 
            padding: '1.25rem 2rem', 
            display: 'inline-flex', 
            gap: '1.5rem',
            alignItems: 'center',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-success)', boxShadow: '0 0 8px var(--color-success-glow)' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--border-color)' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--border-color)' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', boxShadow: '0 0 8px var(--color-primary-glow)' }}></div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-color)', height: '20px' }}></div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={14} style={{ color: 'var(--color-ev)' }} />
              B-04 Recommended Spot
            </span>
          </div>
        </div>
      </header>

      {/* 3. Find Parking Search Section */}
      <section id="search-section" style={{ padding: '3rem 1.5rem', maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center', letterSpacing: '-0.01em' }}>
            Find Your Parking Spot
          </h2>
          
          <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            {/* Desktop Horizontal Row Layout / Mobile Vertical Stack */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'row', 
              gap: '1rem', 
              flexWrap: 'wrap',
              alignItems: 'end'
            }}>
              
              <div className="form-group" style={{ flex: '1 1 240px', marginBottom: 0 }}>
                <label className="form-label">Location</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} className="text-muted" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <select 
                    className="form-input" 
                    style={{ paddingLeft: '38px', height: '46px', appearance: 'none', background: 'rgba(0,0,0,0.3)' }}
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                  >
                    <option value="downtown">Downtown Smart Parking Hub</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
                <label className="form-label">Date & Time</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} className="text-muted" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="datetime-local" 
                    className="form-input" 
                    style={{ paddingLeft: '38px', height: '46px', background: 'rgba(0,0,0,0.3)' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ flex: '1 1 180px', marginBottom: 0 }}>
                <label className="form-label">Vehicle Size</label>
                <select 
                  className="form-input" 
                  style={{ height: '46px', background: 'rgba(0,0,0,0.3)' }}
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                >
                  <option value="Car">Car (Medium)</option>
                  <option value="SUV">SUV (Large)</option>
                  <option value="Motorcycle">Motorcycle (Small)</option>
                  <option value="Van">Van (Large)</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ 
                  height: '46px', 
                  padding: '0 2rem', 
                  flex: '1 1 150px',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                Search Parking
              </button>

            </div>
          </form>
        </div>
      </section>

      {/* 4. Live Parking Availability statistics panel */}
      <section style={{ padding: '1rem 1.5rem 3rem', maxWidth: '800px', width: '100%', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(31, 41, 55, 0.2)',
          overflow: 'hidden'
        }}>
          
          <div style={{ textAlign: 'center', padding: '1.5rem', borderRight: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }}></div>
              1,248
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginTop: '0.25rem' }}>Available</div>
          </div>

          <div style={{ textAlign: 'center', padding: '1.5rem', borderRight: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }}></div>
              632
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginTop: '0.25rem' }}>Occupied</div>
          </div>

          <div style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              1,880
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginTop: '0.25rem' }}>Total Spaces</div>
          </div>

        </div>
      </section>

      {/* 5. How It Works Section */}
      <section id="how-it-works" style={{ padding: '4rem 1.5rem', maxWidth: '900px', width: '100%', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2.5rem' }}>How It Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
          
          <div style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>01 — SEARCH</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Find Parking</h3>
            <p className="text-muted" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Find available parking near your destination instantly.</p>
          </div>

          <div style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-ev)', marginBottom: '0.5rem' }}>02 — CHOOSE</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Select Best Spot</h3>
            <p className="text-muted" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Select the optimal slot recommended by our AI engine.</p>
          </div>

          <div style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-success)', marginBottom: '0.5rem' }}>03 — PARK</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Arrive & Navigate</h3>
            <p className="text-muted" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Navigate directly to your reserved spot and park safely.</p>
          </div>

        </div>
      </section>

      {/* 6. Final CTA Banner */}
      <section style={{ padding: '4rem 1.5rem', maxWidth: '800px', width: '100%', margin: '0 auto', textAlign: 'center' }}>
        <div className="card" style={{ 
          background: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent)',
          padding: '3rem 2rem',
          borderColor: 'rgba(59, 130, 246, 0.1)'
        }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            Find your parking spot faster.
          </h2>
          <p className="text-muted" style={{ fontSize: '0.95rem', marginBottom: '2rem' }}>
            Real-time parking availability, all in one place.
          </p>
          <button onClick={scrollToSearch} className="btn btn-primary" style={{ padding: '0.75rem 2.25rem', borderRadius: '30px' }}>
            Find Parking
          </button>
        </div>
      </section>

      {/* 7. Minimal Footer */}
      <footer style={{ 
        borderTop: '1px solid var(--border-color)', 
        backgroundColor: 'var(--bg-secondary)', 
        padding: '3rem 2rem 2rem',
        marginTop: 'auto'
      }}>
        <div style={{ 
          maxWidth: '1000px', 
          margin: '0 auto', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid rgba(255,255,255,0.03)'
        }}>
          <div className="nav-brand" style={{ gap: '0.5rem', fontSize: '1.15rem' }}>
            <Car size={20} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 800, letterSpacing: '0.05em' }}>PARKAI</span>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem', fontWeight: 600 }}>
            <span onClick={scrollToSearch} style={{ cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Find Parking</span>
            <span onClick={() => onNavigate('login')} style={{ cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Sign In</span>
            <span onClick={() => onNavigate('register')} style={{ cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Register Vehicle</span>
            <span onClick={() => alert('Support contact: support@parkai.com')} style={{ cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Help / Contact</span>
          </div>
        </div>
        
        <div style={{ 
          maxWidth: '1000px', 
          margin: '1.5rem auto 0', 
          textAlign: 'center', 
          fontSize: '0.8rem', 
          color: 'var(--color-text-muted)' 
        }}>
          <p>© 2026 PARKAI Parking Platform. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
