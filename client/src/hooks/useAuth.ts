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

  const API_BASE_URL = import.meta.env.VITE_APP_BACKEND_URL

  const fetchUserData = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      // First check authentication status
      const authCheck = await fetch(`${API_BASE_URL}/auth/status`, { 
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!authCheck.ok) {
        throw new Error('Not authenticated. Please log in.');
      }

      // Fetch user profile first (most critical)
      let profile, preferences, analytics, favoritesData, recommendationsData;

      try {
        const profileRes = await fetch(`${API_BASE_URL}/auth/profile`, { 
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!profileRes.ok) {
          const errorText = await profileRes.text();
          console.error('Profile fetch error:', errorText);
          throw new Error(`Profile fetch failed: ${profileRes.status}`);
        }
        
        const profileData = await profileRes.json();
        profile = profileData.user;
      } catch (profileError) {
        console.error('Profile error:', profileError);
        // Set default profile if fetch fails
        profile = {
          id: 'guest',
          email: '',
          name: 'Cultural Explorer',
          bio: 'Welcome to your cultural journey',
          avatar: null,
          tier: 'Explorer',
          memberSince: new Date().toISOString()
        };
      }

      // Fetch preferences with fallback
      try {
        const preferencesRes = await fetch(`${API_BASE_URL}/auth/preferences`, { 
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
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
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        analytics = analyticsRes.ok ? await analyticsRes.json() : { stats: {} };
      } catch (analyticsError) {
        console.error('Analytics error:', analyticsError);
        analytics = { stats: {} };
      }

      try {
        const favoritesRes = await fetch(`${API_BASE_URL}/user/favorites`, { 
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        favoritesData = favoritesRes.ok ? await favoritesRes.json() : [];
      } catch (favError) {
        console.error('Favorites error:', favError);
        favoritesData = [];
      }

      try {
        const recommendationsRes = await fetch(`${API_BASE_URL}/user/recommendations`, { 
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
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
      
      // Set minimal fallback data so component still renders
      setAuthState({
        isAuthenticated: false,
        user: {
          id: 'guest',
          email: '',
          name: 'Guest User',
          bio: 'Please log in to view your profile',
          avatar: null,
          tier: 'Guest',
          memberSince: new Date().toISOString()
        },
        userPreferences: {
          culturalProfile: {},
          settings: {
            notifications: true,
            publicProfile: false,
            aiInsights: true
          }
        },
        userAnalytics: { stats: {} },
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
      
      const response = await fetch(`${API_BASE_URL}/auth/status`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Auth status response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Auth status data:', data);
        
        // Fix: Check for 'isAuthenticated' not 'authenticated'
        if (data.isAuthenticated) {
          console.log('✅ User is authenticated');
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: true,
            user: data.user,
            loading: false,
            error: null,
          }));
          
          // Optionally fetch additional user data
          if (data.user) {
            // You already have basic user data, but you might want to fetch more
            await fetchUserData();
          }
        } else {
          console.log('❌ User is not authenticated');
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
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
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
  }, [API_BASE_URL, fetchUserData]);

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
          userPreferences: null,
          userAnalytics: null,
          favorites: [],
          recommendations: [],
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
  };
};