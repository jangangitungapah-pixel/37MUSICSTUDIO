import { create } from 'zustand';
import { db } from '../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { format, addDays } from 'date-fns';
import { useDemoStore } from './useDemoStore';
import { useAuditLogStore } from './useAuditLogStore';

const today = new Date();

export const useInventoryStore = create((set, get) => {
  const inventoryRef = collection(db, 'inventory');
  const categoriesRef = doc(db, 'config', 'inventoryCategories');
  let realInventory = [];
  let realCategories = [];

  onSnapshot(inventoryRef, (snapshot) => {
    realInventory = snapshot.docs.map(doc => doc.data());
    if (!useDemoStore.getState().isDemoMode) {
      set({ inventory: realInventory, isLoaded: true });
    } else {
      set({ isLoaded: true });
    }
  });

  onSnapshot(categoriesRef, (docSnap) => {
    if (useDemoStore.getState().isDemoMode) return;
    if (docSnap.exists()) {
      realCategories = docSnap.data().list;
      set({ categories: realCategories });
    } else {
      const initialCategories = ['Drum', 'Amps', 'Microphones', 'Accessories'];
      setDoc(categoriesRef, { list: initialCategories });
      realCategories = initialCategories;
      set({ categories: initialCategories });
    }
  });

  useDemoStore.subscribe((demoState) => {
    if (demoState.isDemoMode) {
      set({
        inventory: demoState.demoInventory,
        categories: ['Drum', 'Amps', 'Microphones', 'Accessories'],
      });
    } else {
      set({ inventory: realInventory, categories: realCategories });
    }
  });

  return {
    inventory: [],
    categories: [],
    isLoaded: false,
    
    addCategory: async (newCat) => {
      const trimmed = newCat.trim();
      const state = get();
      if (!trimmed || state.categories.includes(trimmed)) return;
      
      const newCategories = [...state.categories, trimmed];
      set({ categories: newCategories });
      if (useDemoStore.getState().isDemoMode) return;
      await setDoc(categoriesRef, { list: newCategories }, { merge: true });
    },

    removeCategory: async (cat) => {
      const state = get();
      const newCategories = state.categories.filter(c => c !== cat);
      set({ categories: newCategories });
      if (useDemoStore.getState().isDemoMode) return;
      await setDoc(categoriesRef, { list: newCategories }, { merge: true });
    },

    addEquipment: async (newItem) => {
      const id = Date.now();
      const itemData = { 
        ...newItem, 
        id,
        qty: newItem.qty || 1,
        lastServiced: newItem.lastServiced || format(new Date(), 'yyyy-MM-dd'),
        nextService: newItem.nextService || format(addDays(new Date(), 90), 'yyyy-MM-dd')
      };
      set((state) => ({ inventory: [...state.inventory, itemData] }));
      if (useDemoStore.getState().isDemoMode) return;
      await setDoc(doc(inventoryRef, id.toString()), itemData);
      await useAuditLogStore.getState().addLog({
        action: 'inventory_create',
        entityType: 'inventory',
        entityId: id,
        summary: `Inventaris ${itemData.name} ditambahkan`,
      });
    },

    updateEquipment: async (id, updatedData) => {
      set((state) => ({
        inventory: state.inventory.map(item => item.id === id ? { ...item, ...updatedData } : item)
      }));
      if (useDemoStore.getState().isDemoMode) return;
      await updateDoc(doc(inventoryRef, id.toString()), updatedData);
      await useAuditLogStore.getState().addLog({
        action: 'inventory_update',
        entityType: 'inventory',
        entityId: id,
        summary: 'Inventaris diperbarui',
        metadata: updatedData,
      });
    },

    deleteEquipment: async (id) => {
      set((state) => ({ inventory: state.inventory.filter(item => item.id !== id) }));
      if (useDemoStore.getState().isDemoMode) return;
      await deleteDoc(doc(inventoryRef, id.toString()));
      await useAuditLogStore.getState().addLog({
        action: 'inventory_delete',
        entityType: 'inventory',
        entityId: id,
        summary: 'Inventaris dihapus',
      });
    },

    getStats: () => {
      const state = get();
      const total = state.inventory.length;
      const totalQty = state.inventory.reduce((sum, i) => sum + (i.qty || 1), 0);
      const excellent = state.inventory.filter(i => i.condition === 'Excellent').length;
      const good = state.inventory.filter(i => i.condition === 'Good').length;
      const needsRepair = state.inventory.filter(i => i.condition === 'Needs Repair').length;
      const broken = state.inventory.filter(i => i.condition === 'Broken').length;
      
      const _7DaysFromNow = new Date(today);
      _7DaysFromNow.setDate(_7DaysFromNow.getDate() + 7);
      const serviceNeeded = state.inventory.filter(i => new Date(i.nextService) <= _7DaysFromNow).length;

      return { total, totalItems: total, totalQty, excellent, good, needsRepair, broken, serviceNeeded };
    }
  };
});
