import { create } from 'zustand';
import { db } from '../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';

export const useFinanceStore = create((set, get) => {
  const financeRef = collection(db, 'finances');
  
  onSnapshot(financeRef, (snapshot) => {
    const data = snapshot.docs.map(doc => doc.data());
    set({ transactions: data, isLoaded: true });
  });

  return {
    transactions: [],
    isLoaded: false,
    
    addTransaction: async (newTx) => {
      const id = Date.now();
      const txData = { ...newTx, id, isManual: true };
      set((state) => ({ transactions: [...state.transactions, txData] }));
      await setDoc(doc(financeRef, id.toString()), txData);
    },

    deleteTransaction: async (id) => {
      set((state) => ({ transactions: state.transactions.filter(t => t.id !== id) }));
      await deleteDoc(doc(financeRef, id.toString()));
    }
  };
});
