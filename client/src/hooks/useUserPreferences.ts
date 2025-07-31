import { useState, useEffect } from 'react';
import axios from 'axios';
import { api } from '@/utils/api';

interface UseUserPreferencesReturn {
  hasPreferences: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("culturetoken"); // or use getToken()
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const useUserPreferences = (): UseUserPreferencesReturn => {
  const [hasPreferences, setHasPreferences] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: any = await api.get('/auth/preferences');

      const preferences = await response.json();
      const hasAnyPreferences =
        preferences &&
        ((preferences.categories?.length > 0 && !preferences.categories.includes("all")) ||
          preferences.favoriteGenres?.length > 0 ||
          preferences.culturalTags?.length > 0 ||
          preferences.moodPreferences?.length > 0);

      setHasPreferences(hasAnyPreferences);
    } catch (err: any) {
      console.error("Error fetching preferences:", err.response?.status, err.response?.data);

      if (err.response?.status === 404) {
        setHasPreferences(false);
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Unauthorized: Please log in again");
      } else {
        setError("Failed to fetch user preferences");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  return {
    hasPreferences,
    loading,
    error,
    refetch: fetchPreferences,
  };
};
