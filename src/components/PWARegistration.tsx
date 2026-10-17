'use client';

import { useEffect } from 'react';

/**
 * PWARegistration
 * Silently registers the Service Worker in the background for offline caching
 * and browser-level PWA support.
 * Does NOT display any banner or popup asking the user to install.
 */
export const PWARegistration: React.FC = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker active in background, scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });
    }
  }, []);

  // Zero in-page installation prompts or popups
  return null;
};
