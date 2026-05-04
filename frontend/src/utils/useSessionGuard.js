import { useEffect, useRef } from 'react';
import { logout } from './auth';

const POLL_INTERVAL = 5_000;
const STATUS_URL = `${import.meta.env.VITE_CENTRAL_PORTAL_API_URL || 'https://pilargroup.id'}/api/auth/status`;

function getStoredToken() {
  return localStorage.getItem('token') || null;
}

function getStoredCv() {
  const cv = localStorage.getItem('token_cv');
  return cv !== null ? Number(cv) : null;
}

function handleExpired() {
  logout();
  if (import.meta.env.VITE_MOCK_AUTH !== 'true') {
    window.location.href = import.meta.env.VITE_CENTRAL_PORTAL_URL || 'https://pilargroup.id/login';
  }
}

export function useSessionGuard() {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (import.meta.env.VITE_MOCK_AUTH === 'true') return;

    const token = getStoredToken();
    if (!token) return;

    const check = async () => {
      try {
        const res = await fetch(STATUS_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          handleExpired();
          return;
        }

        if (!res.ok) return;

        const data = await res.json();

        if (!data.valid) {
          handleExpired();
          return;
        }

        const storedCv = getStoredCv();
        if (data.token_version !== undefined) {
          if (storedCv === null || Number(storedCv) !== Number(data.token_version)) {
            handleExpired();
          }
        }

      } catch {
        // network error sementara, skip
      }
    };

    check();
    intervalRef.current = setInterval(check, POLL_INTERVAL);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        check();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}