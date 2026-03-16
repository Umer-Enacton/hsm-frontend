// Service Worker for Firebase Cloud Messaging
// This file should be placed in the public folder

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAKMID99sj04_W69T3YNbAOCWb4HbBanhk",
  authDomain: "homefixcare-77e15.firebaseapp.com",
  projectId: "homefixcare-77e15",
  storageBucket: "homefixcare-77e15.firebasestorage.app",
  messagingSenderId: "333578967874",
  appId: "1:333578967874:web:676b964bdcadd259bf46db",
  measurementId: "G-SXDFRGBWWF"
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('📱 Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    tag: payload.data?.notificationId || 'default',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const actionUrl = event.notification.data?.actionUrl || '/';
  console.log('Notification clicked, navigating to:', actionUrl);

  event.waitUntil(
    clients.openWindow(actionUrl)
  );
});

console.log('🔔 Firebase Messaging Service Worker loaded');
