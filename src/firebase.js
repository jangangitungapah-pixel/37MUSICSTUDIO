import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging, isSupported as isMessagingSupported } from "firebase/messaging";

const env = import.meta.env;
const fallbackProjectId = "37musicstudio-local";

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "missing-firebase-api-key",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${fallbackProjectId}.firebaseapp.com`,
  projectId: env.VITE_FIREBASE_PROJECT_ID || fallbackProjectId,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: env.VITE_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000000000",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
};

export const isFirebaseConfigured = Boolean(
  env.VITE_FIREBASE_API_KEY &&
  env.VITE_FIREBASE_AUTH_DOMAIN &&
  env.VITE_FIREBASE_PROJECT_ID &&
  env.VITE_FIREBASE_APP_ID
);

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const messaging = await isMessagingSupported()
  .then((supported) => (supported ? getMessaging(app) : null))
  .catch(() => null);

