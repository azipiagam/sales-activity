import { useState, useEffect } from 'react';
import { getSales, isAuthenticated } from './auth';
import { AUTH_UPDATED_EVENT } from './authEvents';

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