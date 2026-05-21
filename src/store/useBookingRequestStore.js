import { create } from 'zustand';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { useDemoStore } from './useDemoStore';
import { useAuditLogStore } from './useAuditLogStore';

const normalizeRequestDoc = (docSnap) => ({
  id: docSnap.id,
  ...docSnap.data(),
});

export const useBookingRequestStore = create((set, get) => {
  const requestsRef = collection(db, 'bookingRequests');
  let realRequests = [];
  let unsubscribeRequests = null;

  onAuthStateChanged(auth, (user) => {
    if (unsubscribeRequests) {
      unsubscribeRequests();
      unsubscribeRequests = null;
    }

    if (!user || user.isAnonymous) {
      realRequests = [];
      set({ requests: [], isLoaded: true, error: null });
      return;
    }

    unsubscribeRequests = onSnapshot(
      requestsRef,
      (snapshot) => {
        realRequests = snapshot.docs.map(normalizeRequestDoc);
        if (!useDemoStore.getState().isDemoMode) {
          set({ requests: realRequests, isLoaded: true, error: null });
        } else {
          set({ isLoaded: true, error: null });
        }
      },
      (error) => {
        console.error('Error loading booking requests:', error);
        set({ requests: [], isLoaded: true, error: error.message });
      }
    );
  });

  useDemoStore.subscribe((demoState) => {
    if (demoState.isDemoMode) {
      set({ requests: [] });
    } else {
      set({ requests: realRequests });
    }
  });

  return {
    requests: [],
    isLoaded: false,
    error: null,

    addRequest: async (request) => {
      const id = Date.now().toString();
      const payload = {
        ...request,
        id,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      set((state) => ({ requests: [payload, ...state.requests] }));
      if (useDemoStore.getState().isDemoMode) return payload;

      await setDoc(doc(requestsRef, id), payload);
      return payload;
    },

    updateRequestStatus: async (id, status, data = {}) => {
      const payload = {
        status,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        requests: state.requests.map((request) => (
          request.id === id ? { ...request, ...payload } : request
        )),
      }));
      await useAuditLogStore.getState().addLog({
        action: `booking_request_${status}`,
        entityType: 'bookingRequest',
        entityId: id,
        summary: `Request booking ${status}`,
        metadata: payload,
      });

      if (useDemoStore.getState().isDemoMode) return;
      await updateDoc(doc(requestsRef, id.toString()), payload);
    },

    getPendingRequests: () => get().requests
      .filter((request) => request.status === 'pending')
      .sort((a, b) => (a.date || '').localeCompare(b.date || '') || Number(a.hour || 0) - Number(b.hour || 0)),
  };
});
