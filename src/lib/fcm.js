import { messaging, db } from '../firebase';
import { getToken } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const VAPID_KEY = 'BBjF-mKugsTkSM_-ufwmtxVJyQp3CXUgppwTkMjud30c3iPXd87eI7myETlfjcsvID_crwq4thli8_iQCprq8eY';
const LOCAL_STORAGE_KEY = 'current_fcm_token';

/**
 * Request notification permission, register FCM token, and save it to the user's Firestore document.
 * @param {string} userId - The Firebase UID of the logged-in user.
 * @returns {Promise<string|null>} FCM registration token, or null if unsuccessful/not supported.
 */
export const registerFCMToken = async (userId) => {
  if (!userId) return null;

  if (!('Notification' in window)) {
    console.warn('[FCM] Notifications are not supported in this browser.');
    return null;
  }

  // If permission not granted, we can't get token
  if (Notification.permission !== 'granted') {
    console.warn('[FCM] Notification permission is not granted. Current state:', Notification.permission);
    return null;
  }

  try {
    // Get active service worker registration from workbox/PWA
    const registration = await navigator.serviceWorker.ready;
    
    // Retrieve FCM registration token using PWA service worker and VAPID key
    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: VAPID_KEY
    });

    if (token) {
      console.log('[FCM] Token retrieved successfully:', token);
      
      // Store token in localStorage to identify this session's token
      localStorage.setItem(LOCAL_STORAGE_KEY, token);

      // Save/append token to users/{userId} doc in Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token)
      });
      
      console.log('[FCM] Token successfully registered in Firestore.');
      return token;
    } else {
      console.warn('[FCM] No registration token returned.');
    }
  } catch (error) {
    console.error('[FCM] Error during FCM token registration:', error);
  }
  return null;
};

/**
 * Remove the current FCM token from the user's Firestore document and clean up local storage.
 * @param {string} userId - The Firebase UID of the logging out user.
 */
export const unregisterFCMToken = async (userId) => {
  const token = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!token || !userId) return;

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      fcmTokens: arrayRemove(token)
    });
    
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    console.log('[FCM] Token successfully unregistered from Firestore.');
  } catch (error) {
    console.error('[FCM] Error during FCM token unregistration:', error);
  }
};
