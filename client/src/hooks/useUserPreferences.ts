import { useState, useEffect } from 'react';
import axios from 'axios';

interface UseUserPreferencesReturn {
  hasPreferences: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useUserPreferences = (): UseUserPreferencesReturn => {
  const [hasPreferences, setHasPreferences] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${import.meta.env.VITE_APP_BACKEND_URL}/auth/preferences`, {
        withCredentials: true
      });
      
      // Check if user has any preferences set
      const preferences = response.data;
      const hasAnyPreferences = preferences && (
        (preferences.categories && preferences.categories.length > 0 && !preferences.categories.includes('all')) ||
        (preferences.favoriteGenres && preferences.favoriteGenres.length > 0) ||
        (preferences.culturalTags && preferences.culturalTags.length > 0) ||
        (preferences.moodPreferences && preferences.moodPreferences.length > 0)
      );
      
      setHasPreferences(hasAnyPreferences);
    } catch (err: any) {
      // If we get a 404 or similar error, it means no preferences exist
      if (err.response?.status === 404) {
        setHasPreferences(false);
      } else {
        setError('Failed to fetch user preferences');
        console.error('Error fetching preferences:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  const refetch = () => {
    fetchPreferences();
  };

  return {
    hasPreferences,
    loading,
    error,
    refetch
  };
};