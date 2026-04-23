/**
 * Auth Utilities
 * Helper functions untuk authentication
 */

import { notifyAuthUpdated } from './authEvents';

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

  if (token) {
    localStorage.setItem('token', token);

    params.delete('token');
    const newSearch = params.toString();
    const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
    window.history.replaceState({}, '', newUrl);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      if (res.ok) {
        const user = await res.json();
        localStorage.setItem('sales', JSON.stringify(user));
        notifyAuthUpdated();
      }
    } catch (e) {
      console.error('Failed to fetch user after token handoff', e);
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

