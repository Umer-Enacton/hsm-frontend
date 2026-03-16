'use client';

import { useEffect } from 'react';

export function ServiceWorkerProvider() {
  useEffect(() => {
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    }
  }, []);

  return null;
}
