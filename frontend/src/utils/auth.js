/**
 * Auth Utilities
 * Helper functions untuk authentication
 */

/**
 * Get token from localStorage
 * @returns {string|null} 
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Get sales data from localStorage
 * @returns {object|null} 
 */
export const getSales = () => {
  const salesStr = localStorage.getItem('sales');
  if (salesStr) {
    try {
      return JSON.parse(salesStr);
    } catch (e) {
      return null;
    }
  }
  return null;
};

/**
 * Check if user is authenticated
 * @returns {boolean} True jika user sudah login
 */
// utils/auth.js

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Baca ?token= dari URL, simpan ke localStorage, lalu bersihkan URL
export const consumeTokenFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (token) {
    localStorage.setItem('token', token);

    // Bersihkan ?token= dari URL tanpa reload
    params.delete('token');
    const newSearch = params.toString();
    const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
    window.history.replaceState({}, '', newUrl);

    return token;
  }

  return null;
};

/**
 * Logout user - clear token dan sales data
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('sales');
};

