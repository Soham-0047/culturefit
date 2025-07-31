import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  bio?: string;
  avatar?: string | null;
  tier?: string;
  memberSince: string;
}

interface UserPreferences {
  culturalProfile?: any;
  settings?: {
    notifications?: boolean;
    publicProfile?: boolean;
    aiInsights?: boolean;
  };
}

interface UserAnalytics {
  stats: any;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  userPreferences: UserPreferences | null;
  userAnalytics: UserAnalytics | null;
  favorites: any[];
  recommendations: any[];
  loading: boolean;
  error: string | null;
}

// JWT Token Management
const TOKEN_KEY = 'culturesense_token';

const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

const createAuthHeaders = (): HeadersInit => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    userPreferences: null,
    userAnalytics: null,
    favorites: [],
    recommendations: [],
    loading: true,
    error: null,
  });

  const API_BASE_URL = import.meta.env.VITE_APP_BACKEND_URL;

  // Extract token from URL (for OAuth callback)
  const extractTokenFromUrl = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      console.log('🔑 Token found in URL, storing...');
      setToken(token);
      
      // Clean URL by removing token parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('token');
      window.history.replaceState({}, document.title, newUrl.toString());
      
      return token;
    }
    
    return null;
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch user profile first (most critical)
      let profile, preferences, analytics, favoritesData, recommendationsData;

      try {
        const profileRes = await fetch(`${API_BASE_URL}/auth/status`, { 
          headers: createAuthHeaders()
        });
        
        if (!profileRes.ok) {
          if (profileRes.status === 401 || profileRes.status === 403) {
            // Token is invalid, remove it
            removeToken();
            throw new Error('Authentication token expired');
          }
          throw new Error(`Profile fetch failed: ${profileRes.status}`);
        }
        
        const profileData = await profileRes.json();
        profile = profileData.user;
      } catch (profileError) {
        console.error('Profile error:', profileError);
        throw profileError; // Re-throw to handle in outer catch
      }

      // Fetch preferences with fallback
      try {
        const preferencesRes = await fetch(`${API_BASE_URL}/auth/preferences`, { 
          headers: createAuthHeaders()
        });
        
        if (preferencesRes.ok) {
          preferences = await preferencesRes.json();
        } else {
          throw new Error('Preferences not found');
        }
      } catch (prefError) {
        console.error('Preferences error:', prefError);
        // Set default preferences
        preferences = {
          culturalProfile: {},
          settings: {
            notifications: true,
            publicProfile: false,
            aiInsights: true
          }
        };
      }

      // Fetch optional data (non-critical)
      try {
        const analyticsRes = await fetch(`${API_BASE_URL}/user/analytics`, { 
          headers: createAuthHeaders()
        });
        analytics = analyticsRes.ok ? await analyticsRes.json() : { stats: {} };
      } catch (analyticsError) {
        console.error('Analytics error:', analyticsError);
        analytics = { stats: {} };
      }

      try {
        const favoritesRes = await fetch(`${API_BASE_URL}/user/favorites`, { 
          headers: createAuthHeaders()
        });
        favoritesData = favoritesRes.ok ? await favoritesRes.json() : [];
      } catch (favError) {
        console.error('Favorites error:', favError);
        favoritesData = [];
      }

      try {
        const recommendationsRes = await fetch(`${API_BASE_URL}/user/recommendations`, { 
          headers: createAuthHeaders()
        });
        recommendationsData = recommendationsRes.ok ? await recommendationsRes.json() : [];
      } catch (recError) {
        console.error('Recommendations error:', recError);
        recommendationsData = [];
      }

      // Update state with all fetched data
      setAuthState({
        isAuthenticated: true,
        user: profile,
        userPreferences: preferences,
        userAnalytics: analytics,
        favorites: favoritesData,
        recommendations: recommendationsData,
        loading: false,
        error: null,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching user data:', err);
      
      // Clear token if authentication failed
      if (errorMessage.includes('token') || errorMessage.includes('Authentication')) {
        removeToken();
      }
      
      // Set unauthenticated state
      setAuthState({
        isAuthenticated: false,
        user: null,
        userPreferences: null,
        userAnalytics: null,
        favorites: [],
        recommendations: [],
        loading: false,
        error: errorMessage,
      });
    }
  }, [API_BASE_URL]);

  const checkAuthStatus = useCallback(async () => {
    try {
      console.log('🔍 Checking auth status...');
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      // First check if there's a token in the URL (OAuth callback)
      const urlToken = extractTokenFromUrl();
      
      // Get token from storage or URL
      const token = urlToken || getToken();
      
      if (!token) {
        console.log('❌ No token found');
        setAuthState({
          isAuthenticated: false,
          user: null,
          userPreferences: null,
          userAnalytics: null,
          favorites: [],
          recommendations: [],
          loading: false,
          error: null,
        });
        return;
      }

      // Use public status endpoint that doesn't require auth
      const response = await fetch(`${API_BASE_URL}/auth/status/public`, {
        method: 'GET',
        headers: createAuthHeaders()
      });

      console.log('📡 Auth status response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Auth status data:', data);
        
        if (data.authenticated) {
          console.log('✅ User is authenticated');
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: true,
            user: data.user,
            loading: false,
            error: null,
          }));
          
          // Fetch additional user data
          await fetchUserData();
        } else {
          console.log('❌ User is not authenticated');
          removeToken(); // Clear invalid token
          setAuthState({
            isAuthenticated: false,
            user: null,
            userPreferences: null,
            userAnalytics: null,
            favorites: [],
            recommendations: [],
            loading: false,
            error: null,
          });
        }
      } else {
        console.error('❌ Auth status check failed:', response.status);
        
        if (response.status === 401 || response.status === 403) {
          removeToken(); // Clear invalid token
        }
        
        setAuthState({
          isAuthenticated: false,
          user: null,
          userPreferences: null,
          userAnalytics: null,
          favorites: [],
          recommendations: [],
          loading: false,
          error: `Failed to check authentication status: ${response.status}`,
        });
      }
    } catch (error) {
      console.error('❌ Network error during auth check:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        userPreferences: null,
        userAnalytics: null,
        favorites: [],
        recommendations: [],
        loading: false,
        error: 'Network error occurred',
      });
    }
  }, [API_BASE_URL, extractTokenFromUrl, fetchUserData]);

  const logout = useCallback(async () => {
    try {
      // Call backend logout endpoint (optional with JWT)
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: createAuthHeaders()
      });
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API fails
    }

    // Clear local token and state
    removeToken();
    setAuthState({
      isAuthenticated: false,
      user: null,
      userPreferences: null,
      userAnalytics: null,
      favorites: [],
      recommendations: [],
      loading: false,
      error: null,
    });
    
    // Redirect to home page
    window.location.href = '/';
  }, [API_BASE_URL]);

  const refreshUser = useCallback(() => {
    fetchUserData();
  }, [fetchUserData]);

  const updateUserPreferences = useCallback((newPreferences: Partial<UserPreferences>) => {
    setAuthState(prev => ({
      ...prev,
      userPreferences: {
        ...prev.userPreferences,
        ...newPreferences
      }
    }));
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    setAuthState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null
    }));
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return {
    ...authState,
    logout,
    refreshUser,
    checkAuthStatus,
    fetchUserData,
    updateUserPreferences,
    updateUser,
    // Utility functions for other components
    getToken,
    createAuthHeaders,
  };
};