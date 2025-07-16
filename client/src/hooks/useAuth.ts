import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  preferences?: any;
  culturalProfile?: any;
  memberSince: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });

  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://your-backend-domain.com/api'
    : 'http://localhost:5000/api';

  const checkAuthStatus = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(`${API_BASE_URL}/auth/status`, {
        method: 'GET',
        credentials: 'include', // Important for cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAuthState({
          isAuthenticated: data.authenticated,
          user: data.user,
          loading: false,
          error: null,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: 'Failed to check authentication status',
        });
      }
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: 'Network error occurred',
      });
    }
  }, [API_BASE_URL]);

  const logout = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: null,
        });
        
        // Redirect to home page or login page
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [API_BASE_URL]);

  const refreshUser = useCallback(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return {
    ...authState,
    logout,
    refreshUser,
    checkAuthStatus,
  };
};