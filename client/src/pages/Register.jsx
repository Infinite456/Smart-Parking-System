import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Car, Lock, Mail, User, Phone, ArrowLeft } from 'lucide-react';

const Register = ({ onNavigate }) => {
  const { register } = useContext(AuthContext);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(name, email, password, phone, role);
    } catch (err) {
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <button onClick={() => onNavigate('landing')} className="btn btn-secondary" style={{ marginBottom: '2rem', padding: '0.5rem 1rem' }}>
        <ArrowLeft size={16} />
        <span>Home</span>
      </button>

      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
            <Car size={36} />
          </div>
          <h2>Create Account</h2>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Join the Smart City Parking Network.</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} className="text-muted" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} className="text-muted" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} className="text-muted" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} className="text-muted" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Account Role</label>
            <select
              className="form-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">User (Standard Vehicle Driver)</option>
              <option value="admin">Admin (System Administrator)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          <span className="text-muted">Already have an account? </span>
          <button onClick={() => onNavigate('login')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
