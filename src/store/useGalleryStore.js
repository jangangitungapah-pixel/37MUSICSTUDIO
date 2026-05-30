import { create } from 'zustand';
import { db } from '../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { useDemoStore } from './useDemoStore';
import { useAuditLogStore } from './useAuditLogStore';

export const useGalleryStore = create((set, get) => {
  const galleryRef = collection(db, 'gallery');
  let realGallery = [];

  // Firestore Realtime Listener
  onSnapshot(galleryRef, (snapshot) => {
    realGallery = snapshot.docs.map(doc => doc.data());
    // Sort chronologically (newest first)
    realGallery.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
    
    if (!useDemoStore.getState().isDemoMode) {
      set({ gallery: realGallery, isLoaded: true });
    } else {
      set({ isLoaded: true });
    }
  });

  // Subscribe to Demo Mode changes
  useDemoStore.subscribe((demoState) => {
    if (demoState.isDemoMode) {
      set({
        gallery: [...demoState.demoGallery].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
      });
    } else {
      set({ gallery: realGallery });
    }
  });

  return {
    gallery: [],
    isLoaded: false,

    addPhoto: async (newPhoto) => {
      const id = Date.now();
      const photoData = {
        ...newPhoto,
        id,
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        showOnLandingPage: newPhoto.showOnLandingPage ?? true,
        showToCustomer: newPhoto.showToCustomer ?? true,
      };

      set((state) => ({ gallery: [photoData, ...state.gallery] }));

      if (useDemoStore.getState().isDemoMode) {
        // Keep in demo store state so it persists during demo session
        useDemoStore.setState((prev) => ({
          demoGallery: [photoData, ...prev.demoGallery]
        }));
        return;
      }

      await setDoc(doc(galleryRef, id.toString()), photoData);
      await useAuditLogStore.getState().addLog({
        action: 'gallery_create',
        entityType: 'gallery',
        entityId: id,
        summary: `Foto galeri "${photoData.caption || 'Tanpa Keterangan'}" ditambahkan`,
      });
    },

    updatePhoto: async (id, updatedFields) => {
      set((state) => ({
        gallery: state.gallery.map(photo => photo.id === id ? { ...photo, ...updatedFields } : photo)
      }));

      if (useDemoStore.getState().isDemoMode) {
        useDemoStore.setState((prev) => ({
          demoGallery: prev.demoGallery.map(photo => photo.id === id ? { ...photo, ...updatedFields } : photo)
        }));
        return;
      }

      await updateDoc(doc(galleryRef, id.toString()), updatedFields);
      await useAuditLogStore.getState().addLog({
        action: 'gallery_update',
        entityType: 'gallery',
        entityId: id,
        summary: `Status/keterangan foto galeri diperbarui`,
        metadata: updatedFields
      });
    },

    deletePhoto: async (id) => {
      const photoToDelete = get().gallery.find(photo => photo.id === id);
      const caption = photoToDelete?.caption || 'Tanpa Keterangan';

      set((state) => ({ gallery: state.gallery.filter(photo => photo.id !== id) }));

      if (useDemoStore.getState().isDemoMode) {
        useDemoStore.setState((prev) => ({
          demoGallery: prev.demoGallery.filter(photo => photo.id !== id)
        }));
        return;
      }

      await deleteDoc(doc(galleryRef, id.toString()));
      await useAuditLogStore.getState().addLog({
        action: 'gallery_delete',
        entityType: 'gallery',
        entityId: id,
        summary: `Foto galeri "${caption}" dihapus`,
      });
    }
  };
});
