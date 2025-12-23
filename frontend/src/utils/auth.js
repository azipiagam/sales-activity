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
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Logout user - clear token dan sales data
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('sales');
};

