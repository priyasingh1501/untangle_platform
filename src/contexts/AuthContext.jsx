import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { buildApiUrl } from '../config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const fetchUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔍 No token found, skipping profile fetch');
        setLoading(false);
        return;
      }
      
      console.log('🔍 Fetching profile with token:', token.substring(0, 20) + '...');
      const response = await axios.get(buildApiUrl('/api/auth/profile'));
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      console.error('Error status:', error?.response?.status);
      console.error('Error data:', error?.response?.data);
      
      // If unauthorized, try to refresh token once before logging out
      if (error?.response?.status === 401) {
        console.log('🔍 401 error, attempting token refresh...');
        try {
          const refreshResult = await refreshToken();
          if (refreshResult.success) {
            console.log('🔍 Token refresh successful, retrying profile fetch');
            const retryResponse = await axios.get(buildApiUrl('/api/auth/profile'));
            setUser(retryResponse.data.user);
          } else {
            console.log('🔍 Token refresh failed, logging out');
            logout();
          }
        } catch (refreshError) {
          console.error('Profile fetch: token refresh failed:', refreshError);
          logout();
        }
      } else {
        // For non-401 errors, just log out
        console.log('🔍 Non-401 error, logging out');
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  }, []);

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token, fetchUserProfile]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(buildApiUrl('/api/auth/login'), { email, password });
      
      console.log('🔍 Login response:', response.data);
      
      // Extract tokens with multiple fallback strategies
      const responseData = response.data;
      let accessToken = null;
      let refreshToken = null;
      
      // Strategy 1: Direct token field
      if (responseData.token) {
        accessToken = responseData.token;
        console.log('🔍 Found token in responseData.token');
      }
      
      // Strategy 2: tokens.accessToken
      if (!accessToken && responseData.tokens?.accessToken) {
        accessToken = responseData.tokens.accessToken;
        console.log('🔍 Found token in responseData.tokens.accessToken');
      }
      
      // Strategy 3: tokens.token
      if (!accessToken && responseData.tokens?.token) {
        accessToken = responseData.tokens.token;
        console.log('🔍 Found token in responseData.tokens.token');
      }
      
      // Get refresh token
      if (responseData.tokens?.refreshToken) {
        refreshToken = responseData.tokens.refreshToken;
        console.log('🔍 Found refresh token');
      }
      
      console.log('🔍 Final accessToken:', accessToken);
      console.log('🔍 Final refreshToken:', refreshToken);
      
      // Validate we have a token
      if (!accessToken) {
        console.error('❌ No access token found in response:', responseData);
        throw new Error('No access token received from server');
      }
      
      // Store tokens immediately
      localStorage.setItem('token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // Update state
      setToken(accessToken);
      setUser(responseData.user);
      
      console.log('🔍 Token stored in localStorage:', localStorage.getItem('token'));
      console.log('🔍 Refresh token stored:', localStorage.getItem('refreshToken'));
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error);
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(buildApiUrl('/api/auth/register'), userData);
      
      const { token: newToken, user: newUser, tokens } = response.data;
      const accessToken = newToken || tokens?.accessToken || tokens?.token;
      const refreshToken = tokens?.refreshToken;
      
      setToken(accessToken);
      setUser(newUser);
      localStorage.setItem('token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const updateProfile = async (updates) => {
    try {
      const response = await axios.put(buildApiUrl('/api/auth/profile'), updates);
      setUser(response.data.user);
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.put(buildApiUrl('/api/auth/change-password'), { currentPassword, newPassword });
      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, message };
    }
  };


  const refreshToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        logout();
        return { success: false };
      }

      const response = await axios.post(buildApiUrl('/api/auth/refresh'), {
        refreshToken: storedRefreshToken
      });
      
      const { tokens } = response.data;
      const newToken = tokens.accessToken || tokens.token;
      const newRefreshToken = tokens.refreshToken;
      
      setToken(newToken);
      localStorage.setItem('token', newToken);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return { success: false };
    }
  };

  // Add axios interceptor for automatic token refresh and security updates
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && token) {
          // Check if this is a security update (token validation error)
          const isSecurityUpdate = error.response?.data?.message?.includes('Invalid access token') ||
                                   error.response?.data?.code === 'INVALID_TOKEN';
          
          if (isSecurityUpdate) {
            // Security update: Clear all auth data and redirect to login
            console.log('🔐 Security update detected - clearing authentication data');
            logout();
            toast.info('🔐 Security update: Please log in again for enhanced protection');
            return Promise.reject(error);
          }
          
          // Regular token expiration: try to refresh
          const refreshResult = await refreshToken();
          if (refreshResult.success) {
            // Retry the original request with the new token
            const originalRequest = error.config;
            const newToken = localStorage.getItem('token');
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axios(originalRequest);
          } else {
            // Refresh failed, logout user
            logout();
            toast.error('Session expired. Please log in again.');
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [token, logout, refreshToken]);

  const value = {
    user,
    loading,
    token,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshToken,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
