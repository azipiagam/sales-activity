/**
 * API Configuration
 * Base configuration untuk API calls
 */

const API_BASE_URL = 'http://localhost:8000/api';

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

