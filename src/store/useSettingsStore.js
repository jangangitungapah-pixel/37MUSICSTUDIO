import { create } from 'zustand';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const DEFAULT_SETTINGS = {
  studioName: '37 MUSIC STUDIO',
  studioAddress: 'Jl. Musik Indah No. 37, Jakarta',
  studioPhone: '0812-3456-7890',
  pricePerHour: 120000,
  durationDiscounts: [],
  recordingSessions: [
    { id: 'default-6h', name: 'Sesi Recording 6 Jam', hours: 6, price: 600000 }
  ],
};

export const useSettingsStore = create((set) => {
  // Initialize listener
  const settingsRef = doc(db, 'config', 'settings');
  
  onSnapshot(settingsRef, (docSnap) => {
    if (docSnap.exists()) {
      set({ ...docSnap.data(), isLoaded: true });
    } else {
      set({ ...DEFAULT_SETTINGS, isLoaded: true });
    }
  }, (error) => {
    console.error('Error loading studio settings:', error);
    set({ ...DEFAULT_SETTINGS, isLoaded: true, error: error.message });
  });

  return {
    isLoaded: false,
    error: null,
    ...DEFAULT_SETTINGS,
    
    updateSettings: async (newSettings) => {
      // Optimistic update
      set((state) => ({ ...state, ...newSettings }));
      // Save to Firebase
      await setDoc(settingsRef, newSettings, { merge: true });
    },
  };
});
