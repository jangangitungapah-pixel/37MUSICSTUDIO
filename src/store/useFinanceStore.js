import { create } from 'zustand';
import { db, auth } from '../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useDemoStore } from './useDemoStore';
import { useAuditLogStore } from './useAuditLogStore';

export const useFinanceStore = create((set) => {
  const financeRef = collection(db, 'finances');
  let realTransactions = [];
  let unsubscribeFinance = null;

  onAuthStateChanged(auth, (user) => {
    if (unsubscribeFinance) {
      unsubscribeFinance();
      unsubscribeFinance = null;
    }

    if (!user || user.isAnonymous) {
      realTransactions = [];
      set({ transactions: [], isLoaded: true });
      return;
    }

    unsubscribeFinance = onSnapshot(financeRef, (snapshot) => {
      realTransactions = snapshot.docs.map(doc => doc.data());
      if (!useDemoStore.getState().isDemoMode) {
        set({ transactions: realTransactions, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    }, (error) => {
      console.error('Error loading finances:', error);
      set({ transactions: [], isLoaded: true, error: error.message });
    });
  });

  useDemoStore.subscribe((demoState) => {
    if (demoState.isDemoMode) {
      set({ transactions: demoState.demoTransactions });
    } else {
      set({ transactions: realTransactions });
    }
  });

  return {
    transactions: [],
    isLoaded: false,
    
    addTransaction: async (newTx) => {
      const id = Date.now();
      const txData = { ...newTx, id, isManual: true };
      set((state) => ({ transactions: [...state.transactions, txData] }));
      if (useDemoStore.getState().isDemoMode) return;
      await setDoc(doc(financeRef, id.toString()), txData);
      await useAuditLogStore.getState().addLog({
        action: 'finance_create',
        entityType: 'finance',
        entityId: id,
        summary: `${txData.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${txData.description} dicatat`,
        metadata: { amount: txData.amount, category: txData.category, type: txData.type },
      });
    },

    deleteTransaction: async (id) => {
      set((state) => ({ transactions: state.transactions.filter(t => t.id !== id) }));
      if (useDemoStore.getState().isDemoMode) return;
      await deleteDoc(doc(financeRef, id.toString()));
      await useAuditLogStore.getState().addLog({
        action: 'finance_delete',
        entityType: 'finance',
        entityId: id,
        summary: 'Transaksi pembukuan dihapus',
      });
    }
  };
});
