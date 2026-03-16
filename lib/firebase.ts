/**
 * Firebase Configuration for FCM Push Notifications
 * Project: HomeFixCare
 */

'use client';

import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  deleteToken,
  Messaging,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAKMID99sj04_W69T3YNbAOCWb4HbBanhk",
  authDomain: "homefixcare-77e15.firebaseapp.com",
  projectId: "homefixcare-77e15",
  storageBucket: "homefixcare-77e15.firebasestorage.app",
  messagingSenderId: "333578967874",
  appId: "1:333578967874:web:676b964bdcadd259bf46db",
  measurementId: "G-SXDFRGBWWF",
};

// Initialize Firebase app (safe for SSR)
export const firebaseApp = initializeApp(firebaseConfig);

// Lazy messaging instance - only initialized when needed
let messagingInstance: Messaging | null = null;

/**
 * Get messaging instance (lazy initialization)
 */
function getMessagingInstance(): Messaging {
  if (!messagingInstance) {
    messagingInstance = getMessaging(firebaseApp);
  }
  return messagingInstance;
}

// VAPID Key - From Firebase Console > Project Settings > Cloud Messaging > Web Configuration
const VAPID_KEY =
  "BCqcj2F75WnO85j-ColyMrX7kUuatq0i8nm42b79FdK6bhs_MjW_AIomwmRkTQbemYuvHl3V0wucrJLAblFNphk";

/**
 * Request notification permission and get FCM token
 * @returns Promise<string | null> - FCM token or null if denied/error
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    if (!("Notification" in window)) {
      console.log("❌ FCM: This browser does not support notifications");
      return null;
    }

    const permission = await Notification.requestPermission();
    console.log("🔔 FCM: Permission status:", permission);

    if (permission !== "granted") {
      console.log("❌ FCM: Notification permission denied");
      return null;
    }

    console.log("🔔 FCM: Getting token with VAPID key...");
    console.log(
      "🔔 FCM: VAPID key (first 20 chars):",
      VAPID_KEY.substring(0, 20) + "...",
    );

    // Check if service worker is ready
    if (!navigator.serviceWorker) {
      console.error("❌ FCM: Service workers not supported");
      return null;
    }

    // Get existing registration or register the service worker
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      console.log("🔔 FCM: Registering service worker...");
      try {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
        });
        console.log("✅ FCM: Service worker registered:", registration.scope);
      } catch (error) {
        console.error("❌ FCM: Failed to register service worker:", error);
        return null;
      }
    } else {
      console.log("✅ FCM: Service worker found:", registration.scope);
    }

    const messaging = getMessagingInstance();
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.error("❌ FCM: No token returned");
      return null;
    }

    console.log("✅ FCM: Token received:", token.substring(0, 20) + "...");
    return token;
  } catch (error: any) {
    console.error("❌ FCM: Error getting token:", error.message);
    console.error("❌ FCM: Full error:", error);

    // Helpful error messages
    if (error.message?.includes("push service")) {
      console.error(
        "💡 FCM: Push service error - VAPID key may be invalid or not configured in Firebase Console",
      );
      console.error(
        "💡 FCM: Go to Firebase Console > Project Settings > Cloud Messaging > Web Configuration",
      );
      console.error(
        '💡 FCM: Click "Generate key pair" and update VAPID_KEY in firebase.ts',
      );
    }

    if (error.message?.includes("service worker")) {
      console.error(
        "💡 FCM: Service worker issue - make sure firebase-messaging-sw.js is in /public folder",
      );
    }

    return null;
  }
};

/**
 * Listen for foreground FCM messages
 * @returns Function - Unsubscribe function to stop listening
 */
export const onMessageListener = () => {
  const messaging = getMessagingInstance();

  // Return a function that sets up the listener and returns unsubscribe
  // This allows the caller to receive messages and later unsubscribe
  const setupMessageHandler = (callback: (payload: any) => void) => {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("📱 FCM: Foreground message received:", payload);
      callback(payload);
    });
    return unsubscribe;
  };

  return setupMessageHandler;
};

/**
 * Delete FCM token (for logout)
 */
export const deleteFCMToken = async (): Promise<void> => {
  try {
    const messaging = getMessagingInstance();
    await deleteToken(messaging);
    console.log("✅ FCM: Token deleted");
  } catch (error) {
    console.error("❌ FCM: Error deleting token:", error);
  }
};
