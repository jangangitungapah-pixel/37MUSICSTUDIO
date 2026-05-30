import { create } from 'zustand';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  signInAnonymously
} from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, doc, getDoc, updateDoc } from 'firebase/firestore';

const DEFAULT_ADMIN_EMAIL = 'admin@37musicstudio.local';

export const useAuthStore = create((set, get) => {
  // Setup listener
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (user.isAnonymous) {
        set({ user, userProfile: null, isAuthLoaded: true });
        return;
      }

      try {
        // Fetch additional profile data from Firestore
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data();

          // Auto-migration: if staff has custom permissions array but lacks 'gallery' permission,
          // automatically append it in Firestore and local state.
          if (profileData.role === 'staff' && Array.isArray(profileData.permissions)) {
            if (!profileData.permissions.includes('gallery')) {
              const updatedPermissions = [...profileData.permissions, 'gallery'];
              profileData.permissions = updatedPermissions;
              updateDoc(docRef, { permissions: updatedPermissions }).catch((err) => {
                console.error("Error migrating gallery permission in Firestore:", err);
              });
            }
          }

          set({ user, userProfile: profileData, isAuthLoaded: true });
        } else {
          set({ user, userProfile: null, isAuthLoaded: true });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
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

        // If it's a username (no @), look up the email
        if (!loginEmail.includes('@')) {
          const docRef = doc(db, 'usernames', loginEmail);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            loginEmail = docSnap.data().email;
          } else {
             // Let it fail naturally in signInWithEmailAndPassword or throw early
             throw new Error('auth/user-not-found');
          }
        }

        await signInWithEmailAndPassword(auth, loginEmail, password);
        set({ loading: false });
      } catch (error) {
        // Humanize common errors
        let msg = error.message;
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          msg = 'Username/email atau password salah.';
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
        // 1. Check if username is taken
        const usersRef = collection(db, 'users');
        const qUsername = query(usersRef, where('username', '==', username));
        const usernameSnap = await getDocs(qUsername);
        
        if (!usernameSnap.empty) {
          throw new Error("Username sudah digunakan. Silakan pilih username lain.");
        }

        // 2. Create Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 3. Set displayName
        await updateProfile(user, { displayName: username });

        // 4. Save profile to Firestore
        const newProfile = {
          uid: user.uid,
          email: email,
          username: username,
          phone: phone || '',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', user.uid), newProfile);

        // State will be updated by onAuthStateChanged, but we can set loading false
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

    updateUserProfile: async (newUsername, newPhone) => {
      set({ loading: true, error: null });
      try {
        const { user, userProfile } = get();
        if (!user) throw new Error("Tidak ada user yang sedang login.");

        // Check if username is taken by someone else
        if (newUsername !== userProfile?.username) {
          const usersRef = collection(db, 'users');
          const qUsername = query(usersRef, where('username', '==', newUsername));
          const usernameSnap = await getDocs(qUsername);
          
          if (!usernameSnap.empty && usernameSnap.docs[0].id !== user.uid) {
            throw new Error("Username sudah digunakan oleh orang lain.");
          }
        }

        // Update Firebase Auth Profile
        if (newUsername !== user.displayName) {
          await updateProfile(user, { displayName: newUsername });
        }

        // Update Firestore Profile
        const docRef = doc(db, 'users', user.uid);
        await updateDoc(docRef, {
          username: newUsername,
          phone: newPhone
        });

        // Update local state
        set((state) => ({
          user: { ...state.user, displayName: newUsername }, // Force re-render for auth user
          userProfile: { ...state.userProfile, username: newUsername, phone: newPhone },
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
        if (!user) throw new Error("Tidak ada user yang sedang login.");
        
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
        if (!user) throw new Error("Tidak ada user yang sedang login.");

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

