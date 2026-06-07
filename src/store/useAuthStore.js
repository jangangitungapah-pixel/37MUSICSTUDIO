import {
  create } from 'zustand';
import { auth,
  db } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { setDoc, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const DEFAULT_ADMIN_EMAIL = 'admin@37musicstudio.local';

export const useAuthStore = create((set, get) => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (user.isAnonymous) {
        set({ user, userProfile: null, isAuthLoaded: true });
        return;
      }

      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const profileData = docSnap.data();

          set({ user, userProfile: profileData, isAuthLoaded: true });

          if ('Notification' in window && Notification.permission === 'granted') {
            import('../lib/fcm')
              .then(({ registerFCMToken }) => {
                registerFCMToken(user.uid);
              })
              .catch((err) => {
                console.error('[FCM] Error loading FCM module:', err);
              });
          }
        } else {
          set({ user, userProfile: null, isAuthLoaded: true });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        set({ user, userProfile: null, isAuthLoaded: true });
      }
    } else {
      set({ user: null, userProfile: null, isAuthLoaded: true });
    }
  });

  return {
    user: null,
    userProfile: null,
    isAuthLoaded: false,
    loading: false,
    error: null,

    login: async (identifier, password) => {
      set({ loading: true, error: null });

      try {
        const normalizedIdentifier = identifier.trim().toLowerCase();
        let loginEmail = normalizedIdentifier === 'admin'
          ? DEFAULT_ADMIN_EMAIL
          : normalizedIdentifier;

        if (!loginEmail.includes('@')) {
          const docRef = doc(db, 'usernames', loginEmail);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            loginEmail = docSnap.data().email;
          } else {
            throw new Error('auth/user-not-found');
          }
        }

        await signInWithEmailAndPassword(auth, loginEmail, password);
        set({ loading: false });
      } catch (error) {
        let msg = error.message;

        if (
          error.code === 'auth/invalid-credential' ||
          error.code === 'auth/user-not-found' ||
          error.code === 'auth/wrong-password' ||
          error.message === 'auth/user-not-found'
        ) {
          msg = 'Username/email atau password salah.';
        }

        set({ error: msg, loading: false });
        throw error;
      }
    },


    loginWithGoogle: async () => {
      set({ loading: true, error: null });

      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        const credential = await signInWithPopup(auth, provider);
        const googleUser = credential.user;

        const docRef = doc(db, 'users', googleUser.uid);
        const docSnap = await getDoc(docRef);
        const now = new Date().toISOString();

        if (docSnap.exists()) {
          const existingProfile = docSnap.data();

          const nextProfile = {
            ...existingProfile,
            uid: googleUser.uid,
            email: googleUser.email || existingProfile.email || '',
            displayName: googleUser.displayName || existingProfile.displayName || existingProfile.username || '',
            photoURL: googleUser.photoURL || existingProfile.photoURL || '',
            provider: existingProfile.provider || 'google',
            lastLoginAt: now
          };

          await setDoc(docRef, nextProfile, { merge: true });

          set({
            user: googleUser,
            userProfile: nextProfile,
            loading: false
          });

          return nextProfile;
        }

        const email = String(googleUser.email || '').trim().toLowerCase();
        const fallbackUsername = email
          ? email.split('@')[0].replace(/[^a-z0-9._-]/g, '').slice(0, 24)
          : `client_${googleUser.uid.slice(0, 8)}`;

        const newProfile = {
          uid: googleUser.uid,
          email,
          username: fallbackUsername,
          displayName: googleUser.displayName || fallbackUsername,
          photoURL: googleUser.photoURL || '',
          phone: '',
          role: 'client',
          status: 'active',
          provider: 'google',
          linkedCustomerId: '',
          createdAt: now,
          lastLoginAt: now
        };

        await setDoc(docRef, newProfile, { merge: true });

        set({
          user: googleUser,
          userProfile: newProfile,
          loading: false
        });

        return newProfile;
      } catch (error) {
        let msg = error.message || 'Login Google gagal.';

        if (error.code === 'auth/popup-closed-by-user') {
          msg = 'Login Google dibatalkan.';
        }

        if (error.code === 'auth/popup-blocked') {
          msg = 'Popup Google diblokir browser. Izinkan popup lalu coba lagi.';
        }

        if (error.code === 'auth/account-exists-with-different-credential') {
          msg = 'Email ini sudah terdaftar dengan metode login lain. Masuk memakai email/password dulu.';
        }

        set({ error: msg, loading: false });
        throw error;
      }
    },

    loginGuest: async () => {
      set({ loading: true, error: null });

      try {
        await signInAnonymously(auth);
        set({ loading: false });
      } catch (error) {
        let msg = error.message;

        if (error.code === 'auth/operation-not-allowed') {
          msg = 'Fitur Tamu belum diaktifkan (Aktifkan Anonymous Auth di Firebase).';
        }

        set({ error: msg, loading: false });
        throw error;
      }
    },

    register: async (email, password, username, phone) => {
      set({ loading: true, error: null });

      try {
        const cleanEmail = email.trim().toLowerCase();
        const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');

        if (!cleanUsername) {
          throw new Error('Username wajib diisi.');
        }

        const usernameRef = doc(db, 'usernames', cleanUsername);
        const usernameDoc = await getDoc(usernameRef);

        if (usernameDoc.exists()) {
          throw new Error('Username sudah digunakan. Silakan pilih username lain.');
        }

        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: cleanUsername });

        const newProfile = {
          uid: user.uid,
          email: cleanEmail,
          username: cleanUsername,
          phone: phone || '',
          role: 'client',
          status: 'active',
          provider: 'password',
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', user.uid), newProfile);

        await setDoc(usernameRef, {
          uid: user.uid,
          email: cleanEmail
        });

        set({ loading: false });
      } catch (error) {
        let msg = error.message;

        if (error.code === 'auth/email-already-in-use') {
          msg = 'Email ini sudah terdaftar.';
        }

        set({ error: msg, loading: false });
        throw error;
      }
    },

        updateUserProfile: async (newUsername, newPhone, extraProfileData = {}) => {
      set({ loading: true, error: null });

      try {
        const { user, userProfile } = get();

        if (!user) {
          throw new Error('Tidak ada user yang sedang login.');
        }

        const cleanText = (value) => String(value || '').trim();
        const cleanNewUsername = cleanText(newUsername).toLowerCase().replace(/\s+/g, '');
        const cleanOldUsername = String(userProfile?.username || '').trim().toLowerCase().replace(/\s+/g, '');

        if (!cleanNewUsername) {
          throw new Error('Username wajib diisi.');
        }

        if (cleanNewUsername !== cleanOldUsername) {
          const usernameRef = doc(db, 'usernames', cleanNewUsername);
          const usernameSnap = await getDoc(usernameRef);

          if (usernameSnap.exists() && usernameSnap.data()?.uid !== user.uid) {
            throw new Error('Username sudah digunakan oleh orang lain.');
          }
        }

        if (cleanNewUsername !== user.displayName) {
          await updateProfile(user, { displayName: cleanNewUsername });
        }

        const professionalPatch = {
          projectName: cleanText(extraProfileData.projectName),
          clientType: cleanText(extraProfileData.clientType),
          primaryGenre: cleanText(extraProfileData.primaryGenre),
          mainNeed: cleanText(extraProfileData.mainNeed),
          memberCount: cleanText(extraProfileData.memberCount),
          preferredDuration: cleanText(extraProfileData.preferredDuration),
          preferredTime: cleanText(extraProfileData.preferredTime),
          preferredDays: cleanText(extraProfileData.preferredDays),
          socialLink: cleanText(extraProfileData.socialLink),
          gearNotes: cleanText(extraProfileData.gearNotes),
          invoiceName: cleanText(extraProfileData.invoiceName),
          paymentPreference: cleanText(extraProfileData.paymentPreference),
          clientLevel: cleanText(extraProfileData.clientLevel) || userProfile?.clientLevel || 'New',
        };

        const updatePayload = {
          username: cleanNewUsername,
          displayName: cleanNewUsername,
          phone: cleanText(newPhone),
          ...professionalPatch,
          profileUpdatedAt: new Date().toISOString(),
        };

        const docRef = doc(db, 'users', user.uid);
        await updateDoc(docRef, updatePayload);

        if (cleanNewUsername !== cleanOldUsername) {
          await setDoc(doc(db, 'usernames', cleanNewUsername), {
            uid: user.uid,
            email: user.email || userProfile?.email || ''
          });

          if (cleanOldUsername) {
            await deleteDoc(doc(db, 'usernames', cleanOldUsername)).catch((error) => {
              console.warn('[Auth] Could not delete old username mapping:', error);
            });
          }
        }

        set((state) => ({
          user: { ...state.user, displayName: cleanNewUsername },
          userProfile: { ...state.userProfile, ...updatePayload },
          loading: false
        }));
      } catch (error) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    updateUserPassword: async (newPassword) => {
      set({ loading: true, error: null });

      try {
        const { user } = get();

        if (!user) {
          throw new Error('Tidak ada user yang sedang login.');
        }

        await updatePassword(user, newPassword);
        set({ loading: false });
      } catch (error) {
        let msg = error.message;

        if (error.code === 'auth/requires-recent-login') {
          msg = 'Sesi Anda sudah terlalu lama. Silakan logout dan login kembali sebelum mengganti password.';
        }

        set({ error: msg, loading: false });
        throw error;
      }
    },

    completeRequiredPasswordChange: async (newPassword) => {
      set({ loading: true, error: null });

      try {
        const { user } = get();

        if (!user) {
          throw new Error('Tidak ada user yang sedang login.');
        }

        await updatePassword(user, newPassword);

        const passwordUpdatedAt = new Date().toISOString();

        await updateDoc(doc(db, 'users', user.uid), {
          requiresPasswordChange: false,
          passwordUpdatedAt
        });

        set((state) => ({
          userProfile: {
            ...state.userProfile,
            requiresPasswordChange: false,
            passwordUpdatedAt
          },
          loading: false
        }));
      } catch (error) {
        let msg = error.message;

        if (error.code === 'auth/requires-recent-login') {
          msg = 'Sesi Anda sudah terlalu lama. Silakan logout lalu login kembali sebelum mengganti password.';
        }

        set({ error: msg, loading: false });
        throw error;
      }
    },

    logout: async () => {
      set({ loading: true, error: null });

      try {
        const { user } = get();

        if (user && !user.isAnonymous) {
          try {
            const { unregisterFCMToken } = await import('../lib/fcm');
            await unregisterFCMToken(user.uid);
          } catch (err) {
            console.error('[FCM] Error unregistering token on logout:', err);
          }
        }

        await signOut(auth);
        set({ loading: false });
      } catch (error) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    clearError: () => set({ error: null })
  };
});
