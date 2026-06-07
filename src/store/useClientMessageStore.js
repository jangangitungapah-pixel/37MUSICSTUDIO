import { create } from 'zustand';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useNotificationStore } from './useNotificationStore';

const normalizeMessageDoc = (docSnap) => ({
  id: docSnap.id,
  ...docSnap.data(),
});

const sortMessages = (items) => [...items].sort((a, b) => {
  const aTime = a.updatedAt || a.createdAt || '';
  const bTime = b.updatedAt || b.createdAt || '';
  return String(bTime).localeCompare(String(aTime));
});

export const useClientMessageStore = create((set, get) => {
  const messagesRef = collection(db, 'clientMessages');
  let unsubscribeMessages = null;

  const subscribeForUser = async (user) => {
    if (unsubscribeMessages) {
      unsubscribeMessages();
      unsubscribeMessages = null;
    }

    if (!user || user.isAnonymous) {
      set({ messages: [], isLoaded: true, error: null });
      return;
    }

    set({ isLoaded: false, error: null });

    let activeQuery = query(messagesRef, where('clientUid', '==', user.uid));

    try {
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const role = userSnap.exists() ? userSnap.data()?.role : 'client';

      if (role === 'admin' || role === 'staff') {
        activeQuery = messagesRef;
      }
    } catch {
      activeQuery = query(messagesRef, where('clientUid', '==', user.uid));
    }

    unsubscribeMessages = onSnapshot(
      activeQuery,
      (snapshot) => {
        const nextMessages = sortMessages(snapshot.docs.map(normalizeMessageDoc));
        set({ messages: nextMessages, isLoaded: true, error: null });
      },
      (error) => {
        console.error('Error loading client messages:', error);
        set({ messages: [], isLoaded: true, error: error.message });
      }
    );
  };

  onAuthStateChanged(auth, subscribeForUser);

  return {
    messages: [],
    isLoaded: false,
    error: null,

    addMessage: async (message) => {
      const user = auth.currentUser;

      if (!user || user.isAnonymous) {
        throw new Error('Login client diperlukan untuk mengirim pesan.');
      }

      const id = Date.now().toString();
      const now = new Date().toISOString();

      const payload = {
        id,
        clientUid: user.uid,
        clientEmail: user.email || '',
        clientName: user.displayName || '',
        message: String(message?.message || '').trim(),
        subject: String(message?.subject || 'Pesan dari Client Portal').trim(),
        clientPhone: String(message?.clientPhone || '').trim(),
        source: 'client-dashboard',
        status: 'open',
        priority: message?.priority || 'normal',
        direction: 'client_to_admin',
        isReadByAdmin: false,
        isReadByClient: true,
        createdAt: now,
        updatedAt: now,
        ...message,
      };

      if (!payload.message) {
        throw new Error('Isi pesan tidak boleh kosong.');
      }

      set((state) => ({
        messages: sortMessages([payload, ...state.messages]),
      }));

      await setDoc(doc(messagesRef, id), payload);

      useNotificationStore.getState().addNotification({
        type: 'customer',
        title: 'Pesan terkirim',
        message: 'Pesan kamu sudah masuk ke admin studio.',
      });

      return payload;
    },

    updateMessageStatus: async (id, status, data = {}) => {
      const payload = {
        status,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        messages: state.messages.map((message) => (
          message.id === id ? { ...message, ...payload } : message
        )),
      }));

      await updateDoc(doc(messagesRef, id.toString()), payload);
    },

    markMessageReadByAdmin: async (id) => {
      await get().updateMessageStatus(id, 'open', {
        isReadByAdmin: true,
        readByAdminAt: new Date().toISOString(),
      });
    },

    getOpenMessages: () => get().messages.filter((message) => message.status !== 'done'),
  };
});
