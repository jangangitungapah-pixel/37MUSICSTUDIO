import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyDyd_OUnPDzmuAyzL6pMfGlB7CRuwllnfc",
  authDomain: "music-studio-2.firebaseapp.com",
  projectId: "music-studio-2",
  storageBucket: "music-studio-2.firebasestorage.app",
  messagingSenderId: "389184621786",
  appId: "1:389184621786:web:9ec5e184e8b83b4310e9e3",
  measurementId: "G-EXPKHETX17"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

