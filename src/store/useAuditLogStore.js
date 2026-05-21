import { create } from 'zustand';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, limit, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import { useDemoStore } from './useDemoStore';

const normalizeLogDoc = (docSnap) => ({
  id: docSnap.id,
  ...docSnap.data(),
});

export const useAuditLogStore = create((set, get) => {
  const auditRef = collection(db, 'auditLogs');
  let realLogs = [];
  let unsubscribeLogs = null;

  onAuthStateChanged(auth, (user) => {
    if (unsubscribeLogs) {
      unsubscribeLogs();
      unsubscribeLogs = null;
    }

    if (!user || user.isAnonymous) {
      realLogs = [];
      set({ logs: [], isLoaded: true, error: null });
      return;
    }

    unsubscribeLogs = onSnapshot(
      query(auditRef, orderBy('createdAt', 'desc'), limit(80)),
      (snapshot) => {
        realLogs = snapshot.docs.map(normalizeLogDoc);
        if (!useDemoStore.getState().isDemoMode) {
          set({ logs: realLogs, isLoaded: true, error: null });
        } else {
          set({ isLoaded: true, error: null });
        }
      },
      (error) => {
        console.error('Error loading audit logs:', error);
        set({ logs: [], isLoaded: true, error: error.message });
      }
    );
  });

  useDemoStore.subscribe((demoState) => {
    if (demoState.isDemoMode) {
      set({ logs: [] });
    } else {
      set({ logs: realLogs });
    }
  });

  return {
    logs: [],
    isLoaded: false,
    error: null,

    addLog: async ({ action, entityType, entityId, summary, metadata = {} }) => {
      const user = auth.currentUser;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const payload = {
        id,
        action,
        entityType,
        entityId: entityId?.toString?.() || entityId || '',
        summary,
        metadata,
        actorUid: user?.uid || 'local',
        actorName: user?.displayName || user?.email || 'System',
        actorEmail: user?.email || '',
        createdAt: new Date().toISOString(),
      };

      set((state) => ({ logs: [payload, ...state.logs].slice(0, 80) }));
      if (useDemoStore.getState().isDemoMode) return payload;

      try {
        await setDoc(doc(auditRef, id), payload);
      } catch (error) {
        console.warn('Audit log write skipped:', error);
      }
      return payload;
    },

    getRecentForEntity: (entityType, entityId) => get().logs.filter((log) => (
      log.entityType === entityType && log.entityId === entityId?.toString?.()
    )),
  };
});
