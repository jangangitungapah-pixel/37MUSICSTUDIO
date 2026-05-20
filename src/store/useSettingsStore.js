import { create } from 'zustand';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export const useSettingsStore = create((set) => {
  // Initialize listener
  const settingsRef = doc(db, 'config', 'settings');
  
  onSnapshot(settingsRef, (docSnap) => {
    if (docSnap.exists()) {
      set({ ...docSnap.data(), isLoaded: true });
    } else {
      // Default initial settings if database is empty
      const initialSettings = {
        studioName: '37 MUSIC STUDIO',
        studioAddress: 'Jl. Musik Indah No. 37, Jakarta',
        studioPhone: '0812-3456-7890',
        pricePerHour: 120000,
        durationDiscounts: [],
        recordingSessions: [
          { id: 'default-6h', name: 'Sesi Recording 6 Jam', hours: 6, price: 600000 }
        ],
      };
      setDoc(settingsRef, initialSettings);
      set({ ...initialSettings, isLoaded: true });
    }
  });

  return {
    isLoaded: false,
    studioName: 'Memuat...',
    studioAddress: 'Memuat...',
    studioPhone: 'Memuat...',
    pricePerHour: 120000,
    durationDiscounts: [],
    recordingSessions: [],
    
    updateSettings: async (newSettings) => {
      // Optimistic update
      set((state) => ({ ...state, ...newSettings }));
      // Save to Firebase
      await setDoc(settingsRef, newSettings, { merge: true });
    },
  };
});
