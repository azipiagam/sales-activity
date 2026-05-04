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
    console.log('[SessionGuard-TP] mounted')
    
    if (import.meta.env.VITE_MOCK_AUTH === 'true') {
      console.log('[SessionGuard-TP] skipped mock')
      return
    }

    const token = getStoredToken();
    console.log('[SessionGuard-TP] token exists:', Boolean(token))
    
    if (!token) return;

    const check = async () => {
      console.log('[SessionGuard-TP] checking...')
      try {
        const res = await fetch(STATUS_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('[SessionGuard-TP] status:', res.status)

        if (res.status === 401) {
          console.log('[SessionGuard-TP] 401 → handleExpired')
          handleExpired();
          return;
        }

        if (!res.ok) return;

        const data = await res.json();
        console.log('[SessionGuard-TP] data:', data)

        if (!data.valid) {
          console.log('[SessionGuard-TP] invalid → handleExpired')
          handleExpired();
          return;
        }

        const storedCv = getStoredCv();
        if (data.token_version !== undefined) {
          if (storedCv === null || Number(storedCv) !== Number(data.token_version)) {
            console.log('[SessionGuard-TP] cv mismatch → handleExpired')
            handleExpired();
          }
        }

      } catch(e) {
        console.log('[SessionGuard-TP] error:', e)
      }
    };

    check();
    intervalRef.current = setInterval(check, 5_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        check();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      console.log('[SessionGuard-TP] unmounted')
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}