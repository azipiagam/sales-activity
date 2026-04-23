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

export const consumeTokenFromUrl = async () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  console.log('[consumeTokenFromUrl] token from URL:', token ? 'ADA' : 'TIDAK ADA');

  if (token) {
    localStorage.setItem('token', token);

    params.delete('token');
    const newSearch = params.toString();
    const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
    window.history.replaceState({}, '', newUrl);

    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/auth/me`;
      console.log('[consumeTokenFromUrl] fetching:', apiUrl);

      const res = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      console.log('[consumeTokenFromUrl] /auth/me status:', res.status);

      if (res.ok) {
        const user = await res.json();
        console.log('[consumeTokenFromUrl] user data:', user);
        localStorage.setItem('sales', JSON.stringify(user));
      } else {
        const errText = await res.text();
        console.error('[consumeTokenFromUrl] /auth/me error response:', errText);
      }
    } catch (e) {
      console.error('[consumeTokenFromUrl] fetch failed:', e);
    }

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

