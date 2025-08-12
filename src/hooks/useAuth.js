// src/hooks/useAuth.js
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('therapyToken');
    setIsAuthenticated(!!token);
  }, []);

  const login = (token) => {
    localStorage.setItem('therapyToken', token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('therapyToken');
    setIsAuthenticated(false);
  };

  return { isAuthenticated, login, logout };
};