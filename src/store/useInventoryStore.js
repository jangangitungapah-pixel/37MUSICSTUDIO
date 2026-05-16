import { create } from 'zustand';
import { db } from '../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { format, subDays, addDays } from 'date-fns';

const today = new Date();

export const useInventoryStore = create((set, get) => {
  const inventoryRef = collection(db, 'inventory');
  const categoriesRef = doc(db, 'config', 'inventoryCategories');
  
  onSnapshot(inventoryRef, (snapshot) => {
    const data = snapshot.docs.map(doc => doc.data());
    set({ inventory: data, isLoaded: true });
  });

  onSnapshot(categoriesRef, (docSnap) => {
    if (docSnap.exists()) {
      set({ categories: docSnap.data().list });
    } else {
      const initialCategories = ['Drum', 'Amps', 'Microphones', 'Accessories'];
      setDoc(categoriesRef, { list: initialCategories });
      set({ categories: initialCategories });
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
      await setDoc(categoriesRef, { list: newCategories }, { merge: true });
    },

    removeCategory: async (cat) => {
      const state = get();
      const newCategories = state.categories.filter(c => c !== cat);
      set({ categories: newCategories });
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
      await setDoc(doc(inventoryRef, id.toString()), itemData);
    },

    updateEquipment: async (id, updatedData) => {
      set((state) => ({
        inventory: state.inventory.map(item => item.id === id ? { ...item, ...updatedData } : item)
      }));
      await updateDoc(doc(inventoryRef, id.toString()), updatedData);
    },

    deleteEquipment: async (id) => {
      set((state) => ({ inventory: state.inventory.filter(item => item.id !== id) }));
      await deleteDoc(doc(inventoryRef, id.toString()));
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

      return { total, totalQty, excellent, good, needsRepair, broken, serviceNeeded };
    }
  };
});
