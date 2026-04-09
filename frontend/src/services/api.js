/**
 * API Configuration
 */
const getApiBaseUrl = () => {
  // Production: always use env variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Fallback for development
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  const isDev = host === 'localhost' || host.startsWith('192.168') || host.startsWith('10.');
  const port = isDev ? ':8000' : '';
  
  return `${protocol}//${host}${port}/api`;
};

const API_BASE_URL = getApiBaseUrl();

export const getApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

export const getBaseUrl = () => API_BASE_URL;

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(getApiUrl(endpoint), config);
    return response;
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
};

export default API_BASE_URL;