import { useState, useEffect } from 'react';
import { getSales, isAuthenticated } from './auth';

// Custom event untuk trigger re-render ketika sales data berubah
const AUTH_UPDATED_EVENT = 'auth:updated';

export const notifyAuthUpdated = () => {
  window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
};

export const useAuth = () => {
  const [sales, setSales] = useState(() => getSales());

  useEffect(() => {
    const handleUpdate = () => {
      setSales(getSales());
    };

    window.addEventListener(AUTH_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(AUTH_UPDATED_EVENT, handleUpdate);
  }, []);

  return { sales, isAuthenticated: isAuthenticated() };
};