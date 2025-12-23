/**
 * API Configuration
 * Base configuration untuk API calls
 */

/**
 * Get API base URL dynamically
 * Supports both localhost (dev) and IP address (mobile testing)
 */
const getApiBaseUrl = () => {
  // In development, use window.location.hostname
  // This allows localhost on desktop and IP on mobile devices
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  const port = ':8000'; // Laravel default port
  
  return `${protocol}//${host}${port}/api`;
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Get full API URL
 * @param {string} endpoint 
 * @returns {string} 
 */
export const getApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

/**
 * Get API base URL
 * @returns {string} 
 */
export const getBaseUrl = () => API_BASE_URL;

/**
 * authenticated API 
 * @param {string} endpoint 
 * @param {object} options 
 * @returns {Promise<Response>} 
 */
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

  return fetch(getApiUrl(endpoint), config);
};

