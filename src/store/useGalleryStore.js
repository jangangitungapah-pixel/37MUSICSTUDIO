import { create } from 'zustand';
import { db, storage } from '../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { format } from 'date-fns';
import { useDemoStore } from './useDemoStore';
import { useAuditLogStore } from './useAuditLogStore';

// ── ImgBB upload (gratis, cukup 1 API key) ─────────────────────────
const uploadToImgBB = async (blobOrBase64) => {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
  if (!apiKey) throw new Error('VITE_IMGBB_API_KEY belum diset di .env');

  const formData = new FormData();
  if (blobOrBase64 instanceof Blob) {
    formData.append('image', blobOrBase64, 'photo.jpg');
  } else {
    // base64 string — strip data:image/...;base64, prefix
    const base64 = blobOrBase64.includes(',') ? blobOrBase64.split(',')[1] : blobOrBase64;
    formData.append('image', base64);
  }

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Upload ImgBB gagal (${res.status})`);
  }
  const data = await res.json();
  if (!data.success) throw new Error('Upload ImgBB tidak berhasil');
  return data.data.url;  // permanent CDN URL
};

export const useGalleryStore = create((set, get) => {
  const galleryRef = collection(db, 'gallery');
  const albumsRef = collection(db, 'albums');
  
  let realGallery = [];
  let realAlbums = [];
  const markListenerReady = (loadedKey) => {
    set({ [loadedKey]: true });
  };

  // Firestore Realtime Listener for Photos
  onSnapshot(galleryRef, (snapshot) => {
    realGallery = snapshot.docs.map(doc => doc.data());
    // Sort by order first, then chronologically (newest first)
    realGallery.sort((a, b) => {
      const orderA = a.order ?? 999999;
      const orderB = b.order ?? 999999;
      if (orderA !== orderB) return orderA - orderB;
      const dateA = a.createdAt || '';
      const dateB = b.createdAt || '';
      const idA = String(a.id || '');
      const idB = String(b.id || '');
      return dateB.localeCompare(dateA) || idB.localeCompare(idA);
    });
    
    if (!useDemoStore.getState().isDemoMode) {
      set({ gallery: realGallery, isLoaded: true });
    } else {
      set({ isLoaded: true });
    }
  }, () => markListenerReady('isLoaded'));

  // Firestore Realtime Listener for Albums
  onSnapshot(albumsRef, (snapshot) => {
    realAlbums = snapshot.docs.map(doc => doc.data());
    realAlbums.sort((a, b) => {
      const dateA = a.createdAt || '';
      const dateB = b.createdAt || '';
      const idA = String(a.id || '');
      const idB = String(b.id || '');
      return dateB.localeCompare(dateA) || idB.localeCompare(idA);
    });
    
    if (!useDemoStore.getState().isDemoMode) {
      set({ albums: realAlbums, isAlbumsLoaded: true });
    } else {
      set({ isAlbumsLoaded: true });
    }
  }, () => markListenerReady('isAlbumsLoaded'));

  // Subscribe to Demo Mode changes
  useDemoStore.subscribe((demoState) => {
    if (demoState.isDemoMode) {
      set({
        gallery: [...demoState.demoGallery].sort((a, b) => {
          const orderA = a.order ?? 999999;
          const orderB = b.order ?? 999999;
          if (orderA !== orderB) return orderA - orderB;
          const dateA = a.createdAt || '';
          const dateB = b.createdAt || '';
          const idA = String(a.id || '');
          const idB = String(b.id || '');
          return dateB.localeCompare(dateA) || idB.localeCompare(idA);
        }),
        albums: [...demoState.demoAlbums].sort((a, b) => {
          const dateA = a.createdAt || '';
          const dateB = b.createdAt || '';
          const idA = String(a.id || '');
          const idB = String(b.id || '');
          return dateB.localeCompare(dateA) || idB.localeCompare(idA);
        }),
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
      let finalUrl = newPhoto.url || '';
      const isBase64 = typeof finalUrl === 'string' && finalUrl.startsWith('data:image/');

      if (!useDemoStore.getState().isDemoMode) {
        if (newPhoto.file instanceof Blob) {
          // Upload blob ke ImgBB — gratis, cukup API key
          finalUrl = await uploadToImgBB(newPhoto.file);
        } else if (typeof finalUrl === 'string' && finalUrl.startsWith('data:image/')) {
          // URL tab: base64 — upload ke ImgBB juga
          finalUrl = await uploadToImgBB(finalUrl);
        }
        // Jika sudah URL eksternal (https://...), simpan langsung
      } else if (newPhoto.file instanceof Blob) {
        // Demo mode: temporary object URL
        finalUrl = URL.createObjectURL(newPhoto.file);
      }

      // Exclude `file` (Blob) — hanya dipakai untuk upload, tidak disimpan ke Firestore
      const { file: _fileBlob, ...photoFields } = newPhoto;
      const photoData = {
        ...photoFields,
        url: finalUrl,
        id,
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        showOnLandingPage: newPhoto.showOnLandingPage ?? true,
        showToCustomer: newPhoto.showToCustomer ?? true,
        albumId: newPhoto.albumId ?? '',
        order: newPhoto.order ?? 999999,
      };

      set((state) => {
        const updated = [photoData, ...state.gallery];
        updated.sort((a, b) => {
          const orderA = a.order ?? 999999;
          const orderB = b.order ?? 999999;
          if (orderA !== orderB) return orderA - orderB;
          const dateA = a.createdAt || '';
          const dateB = b.createdAt || '';
          const idA = String(a.id || '');
          const idB = String(b.id || '');
          return dateB.localeCompare(dateA) || idB.localeCompare(idA);
        });
        return { gallery: updated };
      });

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

      // Delete from Firebase Storage if it's stored there
      if (photoToDelete?.url && photoToDelete.url.includes('firebasestorage.googleapis.com')) {
        try {
          const storageRef = ref(storage, `gallery/${id}.jpg`);
          await deleteObject(storageRef);
        } catch (err) {
          console.error('Failed to delete file from Firebase Storage:', err);
        }
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
