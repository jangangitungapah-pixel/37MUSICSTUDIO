import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  firebaseAuth,
  isFirebaseConfigured,
} from '../lib/firebase.js';

function createUnauthenticatedState(errorMessage = '') {
  return {
    errorMessage,
    isAuthenticated: false,
    isReady: true,
    user: null,
  };
}

function serializeFirebaseUser(user) {
  if (!user) {
    return null;
  }

  return {
    displayName: user.displayName || '',
    email: user.email || '',
    emailVerified: Boolean(user.emailVerified),
    uid: user.uid,
  };
}

export function getAdminAuthErrorMessage(error) {
  const code = error?.code || '';

  if (code === 'auth/invalid-email') {
    return 'Format email admin belum valid.';
  }

  if (code === 'auth/user-disabled') {
    return 'Akun admin ini sedang dinonaktifkan.';
  }

  if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'Email atau kata sandi belum cocok.';
  }

  if (code === 'auth/too-many-requests') {
    return 'Terlalu banyak percobaan login. Tunggu sebentar lalu coba lagi.';
  }

  if (code === 'auth/operation-not-allowed') {
    return 'Email/Password Auth belum diaktifkan di Firebase Console.';
  }

  if (code === 'auth/network-request-failed') {
    return 'Koneksi ke Firebase gagal. Cek internet atau coba beberapa saat lagi.';
  }

  return 'Login Firebase gagal. Cek email, password, dan konfigurasi Firebase.';
}

export function subscribeAdminAuth(callback) {
  if (!isFirebaseConfigured || !firebaseAuth) {
    callback(createUnauthenticatedState('Firebase belum dikonfigurasi.'));

    return () => {};
  }

  return onAuthStateChanged(
    firebaseAuth,
    (user) => {
      callback({
        errorMessage: '',
        isAuthenticated: Boolean(user),
        isReady: true,
        user: serializeFirebaseUser(user),
      });
    },
    (error) => {
      callback(createUnauthenticatedState(getAdminAuthErrorMessage(error)));
    },
  );
}

export async function signInAdmin({
  email,
  password,
}) {
  if (!isFirebaseConfigured || !firebaseAuth) {
    throw new Error('Firebase belum dikonfigurasi.');
  }

  const credential = await signInWithEmailAndPassword(
    firebaseAuth,
    String(email || '').trim(),
    String(password || ''),
  );

  return serializeFirebaseUser(credential.user);
}

export async function signOutAdmin() {
  if (!isFirebaseConfigured || !firebaseAuth) {
    return;
  }

  await signOut(firebaseAuth);
}

export const adminAuthRepository = {
  getAdminAuthErrorMessage,
  signInAdmin,
  signOutAdmin,
  subscribeAdminAuth,
};
