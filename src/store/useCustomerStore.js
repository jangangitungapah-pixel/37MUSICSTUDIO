import { create } from 'zustand';
import { db } from '../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { format, subDays } from 'date-fns';
import { useDemoStore } from './useDemoStore';

export const useCustomerStore = create((set, get) => {
  const customersRef = collection(db, 'customers');
  let realCustomers = [];

  onSnapshot(customersRef, (snapshot) => {
    realCustomers = snapshot.docs.map(doc => doc.data());
    if (!useDemoStore.getState().isDemoMode) {
      set({ customers: realCustomers, isLoaded: true });
    } else {
      set({ isLoaded: true });
    }
  });

  useDemoStore.subscribe((demoState) => {
    if (demoState.isDemoMode) {
      set({ customers: demoState.demoCustomers });
    } else {
      set({ customers: realCustomers });
    }
  });

  return {
    customers: [],
    isLoaded: false,
    
    addCustomer: async (newCustomer) => {
      const id = Date.now();
      const customerData = { 
        ...newCustomer, 
        id, 
        joinDate: format(new Date(), 'yyyy-MM-dd'),
        totalBookings: 0,
        totalHours: 0,
        totalSpent: 0,
        lastBooking: '-'
      };
      set((state) => ({ customers: [...state.customers, customerData] }));
      await setDoc(doc(customersRef, id.toString()), customerData);
    },

    updateCustomer: async (id, updatedData) => {
      set((state) => ({
        customers: state.customers.map(c => c.id === id ? { ...c, ...updatedData } : c)
      }));
      await updateDoc(doc(customersRef, id.toString()), updatedData);
    },

    deleteCustomer: async (id) => {
      set((state) => ({ customers: state.customers.filter(c => c.id !== id) }));
      await deleteDoc(doc(customersRef, id.toString()));
    },

    incrementBookingCount: async (name, bookingData = {}) => {
      const state = get();
      const customer = state.customers.find(c => c.name.toLowerCase() === name.toLowerCase());
      
      if (customer) {
        // Customer exists — increment stats
        const updatedData = { 
          totalBookings: customer.totalBookings + 1, 
          totalHours: (customer.totalHours || 0) + (bookingData.duration || 0),
          totalSpent: (customer.totalSpent || 0) + (bookingData.totalPrice || 0),
          lastBooking: format(new Date(), 'yyyy-MM-dd'),
          status: 'Active'
        };
        // Update phone if customer had none but booking has one
        if (!customer.phone && bookingData.phone) {
          updatedData.phone = bookingData.phone;
        }
        set((state) => ({
          customers: state.customers.map(c => c.id === customer.id ? { ...c, ...updatedData } : c)
        }));
        await updateDoc(doc(customersRef, customer.id.toString()), updatedData);
      } else {
        // Customer doesn't exist — auto-create
        const id = Date.now();
        const newCustomer = {
          id,
          name: name.trim(),
          phone: bookingData.phone || '',
          email: '',
          instagram: '',
          address: '',
          status: 'Active',
          notes: '',
          joinDate: format(new Date(), 'yyyy-MM-dd'),
          totalBookings: 1,
          totalHours: bookingData.duration || 0,
          totalSpent: bookingData.totalPrice || 0,
          lastBooking: format(new Date(), 'yyyy-MM-dd')
        };
        set((state) => ({ customers: [...state.customers, newCustomer] }));
        await setDoc(doc(customersRef, id.toString()), newCustomer);
      }
    },

    getStats: () => {
      const state = get();
      const total = state.customers.length;
      const active = state.customers.filter(c => c.status === 'Active').length;
      const inactive = state.customers.filter(c => c.status === 'Inactive').length;
      const totalBookingsAll = state.customers.reduce((sum, c) => sum + c.totalBookings, 0);
      const totalHoursAll = state.customers.reduce((sum, c) => sum + (c.totalHours || 0), 0);
      const totalRevenueAll = state.customers.reduce((sum, c) => sum + c.totalSpent, 0);
      return { total, active, inactive, totalBookingsAll, totalHoursAll, totalRevenueAll };
    }
  };
});
