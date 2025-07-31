// utils/api.ts
const TOKEN_KEY = 'culturesense_token';
const API_BASE_URL = import.meta.env.VITE_APP_BACKEND_URL;

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export const createAuthHeaders = (): HeadersInit => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Generic API call function with automatic token handling
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...createAuthHeaders(),
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  // If token is invalid, remove it
  if (response.status === 401 || response.status === 403) {
    removeToken();
    // Optionally redirect to login
    if (window.location.pathname !== '/') {
      window.location.href = '/?auth=expired';
    }
  }

  if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  const message = errorData.message || response.statusText || 'Request failed';
  throw new Error(`${response.status}: ${message}`);
}

  return response;
};

// Convenience methods
const toQueryString = (params: Record<string, any>) => {
  const esc = encodeURIComponent;
  return Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${esc(k)}=${esc(v)}`)
    .join("&");
};

export const api = {
  get: (endpoint: string, options?: RequestInit & { params?: Record<string, any> }) => {
    const queryString = options?.params ? `?${toQueryString(options.params)}` : "";
    return apiCall(`${endpoint}${queryString}`, { method: 'GET', ...options });
  },
  post: (endpoint: string, data?: any, options?: RequestInit) =>
    apiCall(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),
  put: (endpoint: string, data?: any, options?: RequestInit) =>
    apiCall(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),
  delete: (endpoint: string, options?: RequestInit) =>
    apiCall(endpoint, { method: 'DELETE', ...options }),
};