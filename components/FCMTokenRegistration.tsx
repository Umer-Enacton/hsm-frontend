'use client';

import { useEffect, useState, useRef } from 'react';
import { getFCMToken } from '@/lib/firebase';
import { api, API_ENDPOINTS } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth-utils';

/**
 * FCM Token Registration Component
 * Registers the device token for push notifications
 *
 * This component:
 * 1. Requests notification permission from user
 * 2. Gets FCM token from Firebase
 * 3. Sends token to backend for storage
 * 4. Runs once on mount
 */
export function FCMTokenRegistration() {
  const [registrationStatus, setRegistrationStatus] = useState<string>('idle');
  const hasRegistered = useRef(false);

  useEffect(() => {
    // Prevent multiple registrations
    if (hasRegistered.current) return;
    hasRegistered.current = true;

    let mounted = true;
    let retryTimer: NodeJS.Timeout;

    const registerFCMToken = async (retryCount = 0) => {
      // Only register if user is authenticated
      if (!isAuthenticated()) {
        console.log('⏸️ FCM: User not authenticated, skipping token registration');
        if (mounted) setRegistrationStatus('not-authenticated');
        return;
      }

      try {
        if (mounted) setRegistrationStatus('requesting-permission');

        // Check if notifications are supported
        if (!('Notification' in window)) {
          console.log('❌ FCM: This browser does not support notifications');
          if (mounted) setRegistrationStatus('not-supported');
          return;
        }

        // Check current permission status
        const currentPermission = Notification.permission;
        console.log(`🔔 FCM: Current permission status: ${currentPermission}`);

        if (currentPermission === 'denied') {
          console.log('❌ FCM: Notification permission denied by user');
          if (mounted) setRegistrationStatus('denied');
          return;
        }

        // Get FCM token (this will request permission if needed)
        if (mounted) setRegistrationStatus('getting-token');
        const token = await getFCMToken();

        if (!token) {
          console.log('⚠️ FCM: Push notifications not available (in-app notifications will still work)');
          if (mounted) setRegistrationStatus('push-unavailable');
          return;
        }

        console.log('✅ FCM: Token received:', token.substring(0, 20) + '...');

        // Send token to backend
        if (mounted) setRegistrationStatus('registering');
        await api.post(API_ENDPOINTS.DEVICE_TOKEN_REGISTER, {
          token,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
          },
        });

        if (mounted) {
          console.log('✅ FCM: Token registered successfully with backend');
          setRegistrationStatus('registered');
        }

      } catch (error: any) {
        console.error('❌ FCM token registration error:', error);

        if (mounted) {
          setRegistrationStatus('error');

          // Retry logic for network errors
          if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
            const maxRetries = 3;
            if (retryCount < maxRetries) {
              const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
              console.log(`🔄 FCM: Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
              retryTimer = setTimeout(() => registerFCMToken(retryCount + 1), delay);
            }
          }
        }
      }
    };

    // Initial registration attempt
    registerFCMToken();

    return () => {
      mounted = false;
      clearTimeout(retryTimer);
    };
  }, []); // Empty dependency array - run once on mount

  // Debug info in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔔 FCM Registration Status:', registrationStatus);
  }

  return null;
}
