import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { initiateSocketConnection, disconnectSocket } from '../services/socket';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if token exists in localStorage on startup
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Connect socket
          initiateSocketConnection();
        } catch (err) {
          console.error('Failed to parse stored user profile', err);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.login({ email, password });
      if (res.success) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        
        // Initialize Socket Connection
        initiateSocketConnection();
        
        setLoading(false);
        return res.user;
      }
    } catch (err) {
      setError(err.message || 'Login failed');
      setLoading(false);
      throw err;
    }
  };

  const register = async (name, email, password, phone, role = 'user') => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.register({ name, email, password, phone, role });
      if (res.success) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        
        // Initialize Socket Connection
        initiateSocketConnection();
        
        setLoading(false);
        return res.user;
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    
    // Disconnect Socket
    disconnectSocket();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
