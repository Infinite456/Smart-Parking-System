import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Car, Lock, Mail, ArrowLeft } from 'lucide-react';

const Login = ({ onNavigate }) => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // AuthContext handles redirecting state by updating authentication state
      // We will let App.jsx decide the screen based on state
    } catch (err) {
      setError(err.message || 'Invalid email or password');
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
          <h2>Welcome Back</h2>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Sign in to reserve slots and manage parking sessions.</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} className="text-muted" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
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

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          <span className="text-muted">Don't have an account? </span>
          <button onClick={() => onNavigate('register')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}>
            Register here
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
