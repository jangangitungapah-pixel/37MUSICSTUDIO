import { create } from 'zustand';
import { db } from '../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { useDemoStore } from './useDemoStore';
import { useAuditLogStore } from './useAuditLogStore';

export const useGalleryStore = create((set, get) => {
  const galleryRef = collection(db, 'gallery');
  const albumsRef = collection(db, 'albums');
  
  let realGallery = [];
  let realAlbums = [];

  // Firestore Realtime Listener for Photos
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

  // Firestore Realtime Listener for Albums
  onSnapshot(albumsRef, (snapshot) => {
    realAlbums = snapshot.docs.map(doc => doc.data());
    realAlbums.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
    
    if (!useDemoStore.getState().isDemoMode) {
      set({ albums: realAlbums, isAlbumsLoaded: true });
    } else {
      set({ isAlbumsLoaded: true });
    }
  });

  // Subscribe to Demo Mode changes
  useDemoStore.subscribe((demoState) => {
    if (demoState.isDemoMode) {
      set({
        gallery: [...demoState.demoGallery].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id),
        albums: [...demoState.demoAlbums].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id),
        isLoaded: true,
        isAlbumsLoaded: true
      });
    } else {
      set({ gallery: realGallery, albums: realAlbums });
    }
  });

  return {
    gallery: [],
    albums: [],
    isLoaded: false,
    isAlbumsLoaded: false,

    addPhoto: async (newPhoto) => {
      const id = Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      const photoData = {
        ...newPhoto,
        id,
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        showOnLandingPage: newPhoto.showOnLandingPage ?? true,
        showToCustomer: newPhoto.showToCustomer ?? true,
        albumId: newPhoto.albumId ?? '',
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
    },

    // Album Actions
    addAlbum: async (newAlbum) => {
      const id = 'album_' + Date.now();
      const albumData = {
        ...newAlbum,
        id,
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      };

      set((state) => ({ albums: [albumData, ...state.albums] }));

      if (useDemoStore.getState().isDemoMode) {
        useDemoStore.setState((prev) => ({
          demoAlbums: [albumData, ...prev.demoAlbums]
        }));
        return;
      }

      await setDoc(doc(albumsRef, id), albumData);
      await useAuditLogStore.getState().addLog({
        action: 'album_create',
        entityType: 'album',
        entityId: id,
        summary: `Album "${albumData.name}" dibuat`,
      });
    },

    updateAlbum: async (id, updatedFields) => {
      set((state) => ({
        albums: state.albums.map(album => album.id === id ? { ...album, ...updatedFields } : album)
      }));

      if (useDemoStore.getState().isDemoMode) {
        useDemoStore.setState((prev) => ({
          demoAlbums: prev.demoAlbums.map(album => album.id === id ? { ...album, ...updatedFields } : album)
        }));
        return;
      }

      await updateDoc(doc(albumsRef, id), updatedFields);
      await useAuditLogStore.getState().addLog({
        action: 'album_update',
        entityType: 'album',
        entityId: id,
        summary: `Album "${updatedFields.name || 'Tanpa Nama'}" diperbarui`,
      });
    },

    deleteAlbum: async (id) => {
      const albumToDelete = get().albums.find(album => album.id === id);
      const name = albumToDelete?.name || 'Tanpa Nama';

      // 1. Remove album
      set((state) => ({ albums: state.albums.filter(album => album.id !== id) }));

      // 2. Clear albumId from photos in local state
      set((state) => ({
        gallery: state.gallery.map(photo => photo.albumId === id ? { ...photo, albumId: '' } : photo)
      }));

      if (useDemoStore.getState().isDemoMode) {
        useDemoStore.setState((prev) => ({
          demoAlbums: prev.demoAlbums.filter(album => album.id !== id),
          demoGallery: prev.demoGallery.map(photo => photo.albumId === id ? { ...photo, albumId: '' } : photo)
        }));
        return;
      }

      // Delete from Firestore
      await deleteDoc(doc(albumsRef, id));

      // Reset albumId for photos belonging to this album in Firestore
      const photosToReset = get().gallery.filter(photo => photo.albumId === id);
      for (const photo of photosToReset) {
        await updateDoc(doc(galleryRef, photo.id.toString()), { albumId: '' });
      }

      await useAuditLogStore.getState().addLog({
        action: 'album_delete',
        entityType: 'album',
        entityId: id,
        summary: `Album "${name}" dihapus`,
      });
    }
  };
});
