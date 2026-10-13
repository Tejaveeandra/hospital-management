import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { refreshUserToken, logoutUser } from '../api/api';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes
const REFRESH_INTERVAL_MS = 14 * 60 * 1000;    // 14 Minutes

const SessionManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const lastActivityRef = useRef(Date.now());

  // Record user interaction (mouse, keyboard, scroll, touch)
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(ev => window.addEventListener(ev, updateActivity, { passive: true }));

    return () => {
      events.forEach(ev => window.removeEventListener(ev, updateActivity));
    };
  }, []);

  // 1. Inactivity Checker (Checks every 15 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('_raja_t');
      // If user is not logged in or on public auth routes, don't check
      if (!token || location.pathname === '/' || location.pathname === '/forgot-password' || location.pathname === '/lockout') {
        return;
      }

      const idleTime = Date.now() - lastActivityRef.current;
      if (idleTime >= INACTIVITY_TIMEOUT_MS) {
        console.warn('[SESSION] Inactivity timeout reached (15 minutes). Auto-logging out and revoking token...');
        clearInterval(interval);
        await logoutUser(false);
        navigate('/?reason=inactivity', { replace: true });
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [location.pathname, navigate]);

  // 2. Proactive Silent Refresh Timer (Every 14 minutes)
  useEffect(() => {
    const refreshTimer = setInterval(async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('_raja_t');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (token && refreshToken && location.pathname !== '/' && location.pathname !== '/forgot-password') {
        console.log('[SESSION] Performing scheduled 14-minute silent token refresh and rotation...');
        await refreshUserToken();
      }
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(refreshTimer);
  }, [location.pathname]);

  return null; // Silent background manager
};

export default SessionManager;
