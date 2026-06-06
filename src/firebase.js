import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging, isSupported as isMessagingSupported } from "firebase/messaging";

const env = import.meta.env;
const fallbackProjectId = "37musicstudio-local";

const requiredFirebaseEnv = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(requiredFirebaseEnv).every(Boolean);

if (env.PROD && !isFirebaseConfigured) {
  throw new Error(
    "Firebase production environment variables are missing. Please configure VITE_FIREBASE_* before building/deploying."
  );
}

export const firebaseConfig = {
  apiKey: requiredFirebaseEnv.apiKey || "missing-firebase-api-key",
  authDomain: requiredFirebaseEnv.authDomain || `${fallbackProjectId}.firebaseapp.com`,
  projectId: requiredFirebaseEnv.projectId || fallbackProjectId,
  messagingSenderId: requiredFirebaseEnv.messagingSenderId || "000000000000",
  appId: requiredFirebaseEnv.appId || "1:000000000000:web:0000000000000000000000",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export const messaging = await isMessagingSupported()
  .then((supported) => (supported ? getMessaging(app) : null))
  .catch(() => null);
