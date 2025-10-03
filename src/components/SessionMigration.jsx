import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { buildApiUrl } from '../config';

/**
 * Session Migration Component
 * Automatically clears old authentication data when security updates are detected
 */
const SessionMigration = () => {
  const { logout } = useAuth();

  useEffect(() => {
    // Check if we have old tokens that might be invalid
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (token || refreshToken) {
      // Test the token by making a simple request
      fetch(buildApiUrl('/api/auth/profile'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (response.status === 401) {
          // Token is invalid - clear all auth data
          console.log('🔐 Security update detected - clearing old authentication data');
          
          // Clear all authentication data
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          sessionStorage.clear();
          
          // Call logout to update auth context
          logout();
          
          // Show user-friendly message
          console.log('🔐 Security update: Please log in again for enhanced protection');
        }
      })
      .catch(error => {
        console.log('🔐 Security update detected - clearing authentication data');
        localStorage.clear();
        sessionStorage.clear();
        logout();
      });
    }
  }, [logout]);

  return null; // This component doesn't render anything
};

export default SessionMigration;

