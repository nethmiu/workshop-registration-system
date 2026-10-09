import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Login handler
  const login = async (email, password) => {
    const data = await authService.login(email, password);
    const { token: jwtToken, data: userData } = data;

    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));

    setToken(jwtToken);
    setUser(userData);
    return userData;
  };

  // Register handler
  const register = async (userDataInput) => {
    const data = await authService.register(userDataInput);
    const { token: jwtToken, data: userData } = data;

    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));

    setToken(jwtToken);
    setUser(userData);
    return userData;
  };

  // Logout handler
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  // Role verification helper
  const hasRole = useCallback(
    (...roles) => {
      if (!user || !user.role) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
    hasRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
