import { create } from 'zustand';
import { db } from '../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { format, addDays } from 'date-fns';
import { useSettingsStore } from './useSettingsStore';
import { useNotificationStore } from './useNotificationStore';
import { useDemoStore } from './useDemoStore';

// Track IDs of bookings added/deleted locally to suppress self-notifications
const localActionIds = new Set();

export const useBookingStore = create((set, get) => {
  const bookingsRef = collection(db, 'bookings');
  let isFirstLoad = true;
  let realBookings = [];

  onSnapshot(bookingsRef, (snapshot) => {
    realBookings = snapshot.docs.map(doc => doc.data());

    // In demo mode, don't overwrite demo data with real Firebase data
    if (useDemoStore.getState().isDemoMode) {
      set({ isLoaded: true });
      return;
    }

    if (isFirstLoad) {
      isFirstLoad = false;
      set({ bookings: realBookings, isLoaded: true });
      return;
    }

    const { addNotification } = useNotificationStore.getState();
    snapshot.docChanges().forEach((change) => {
      const b = change.doc.data();
      if (change.type === 'added' && !localActionIds.has(b.id)) {
        addNotification({ type: 'booking', title: 'Booking Baru', message: `${b.band} — ${b.date}, ${b.hour}.00–${b.hour + b.duration}.00 (${b.duration} jam)` });
      }
      if (change.type === 'removed' && !localActionIds.has(b.id)) {
        addNotification({ type: 'warning', title: 'Booking Dihapus', message: `${b.band} — ${b.date} telah dihapus oleh pengguna lain` });
      }
      if (localActionIds.has(b.id)) localActionIds.delete(b.id);
    });

    set({ bookings: realBookings, isLoaded: true });
  });

  // React to demo mode toggle
  useDemoStore.subscribe((demoState) => {
    if (demoState.isDemoMode) {
      set({ bookings: demoState.demoBookings });
    } else {
      set({ bookings: realBookings });
    }
  });

  return {
    bookings: [],
    isLoaded: false,
    
    addBooking: async (newBooking) => {
      const id = Date.now();
      const bookingData = { ...newBooking, id };
      localActionIds.add(id); // Mark as local
      set((state) => ({ bookings: [...state.bookings, bookingData] }));
      await setDoc(doc(bookingsRef, id.toString()), bookingData);
    },

    deleteBooking: async (id) => {
      localActionIds.add(id); // Mark as local
      set((state) => ({ bookings: state.bookings.filter(b => b.id !== id) }));
      await deleteDoc(doc(bookingsRef, id.toString()));
    },

    updateBookingStatus: async (id, newStatus) => {
      localActionIds.add(id); // Mark as local
      set((state) => ({
        bookings: state.bookings.map(b => b.id === id ? { ...b, status: newStatus } : b)
      }));
      await updateDoc(doc(bookingsRef, id.toString()), { status: newStatus });
    },

    updateBooking: async (id, data) => {
      localActionIds.add(id); // Mark as local
      
      let updatedBookingData = { ...data };
      
      set((state) => {
        const newBookings = state.bookings.map(b => {
          if (b.id !== id) return b;
          
          let newData = { ...data };
          
          // Auto-recalculate financial status if duration changed
          if (newData.duration !== undefined && newData.duration !== b.duration && b.status !== 'maintenance') {
             const currentPricePerHour = useSettingsStore.getState().pricePerHour;
             const oldDuration = b.duration;
             const newDuration = newData.duration;
             
             // Calculate how much was already paid
             let paidAmount = 0;
             const oldBase = b.type === 'recording' ? (b.sessionPrice || 0) : (oldDuration * currentPricePerHour);
             
             if (b.status === 'confirmed') {
                paidAmount = oldBase - (b.discountAmount || 0);
             } else if (b.status === 'dp') {
                paidAmount = b.dpAmount || 0;
             }
             
             const newBase = b.type === 'recording' ? (newData.sessionPrice || b.sessionPrice || 0) : (newDuration * currentPricePerHour);
             const newTotalPrice = newBase - (b.discountAmount || 0);
             
             if (paidAmount > 0) {
                if (paidAmount >= newTotalPrice) {
                   // They paid MORE or EXACTLY the new total price
                   newData.status = 'confirmed';
                   newData.dpAmount = 0;
                } else {
                   // They paid LESS than the new total price
                   newData.status = 'dp';
                   newData.dpAmount = paidAmount;
                }
             }
          }
          
          updatedBookingData = { ...b, ...newData }; // Save merged object for Firestore
          return updatedBookingData;
        });
        return { bookings: newBookings };
      });
      
      // Update Firestore with the calculated final data
      // We strip the ID from the payload to avoid overwriting the document ID
      const payload = { ...updatedBookingData };
      delete payload.id;
      await updateDoc(doc(bookingsRef, id.toString()), payload);
    },

    getMonthlyStats: (monthDate) => {
      const state = get();
      const currentPricePerHour = useSettingsStore.getState().pricePerHour;
      const monthStr = format(monthDate, 'yyyy-MM');
      const monthBookings = state.bookings.filter(b => b.date.startsWith(monthStr));
      const totalBookings = monthBookings.length;
      const totalHours = monthBookings.reduce((sum, b) => sum + b.duration, 0);
      
      let totalRevenue = 0;
      let totalPaidFull = 0;
      
      monthBookings.forEach(b => {
        if (b.status !== 'maintenance') {
          const base = b.type === 'recording' ? (b.sessionPrice || 0) : (b.duration * currentPricePerHour);
          const finalPrice = base - (b.discountAmount || 0);
          totalRevenue += finalPrice;
          
          if (b.status === 'confirmed') {
            totalPaidFull += finalPrice;
          }
        }
      });
      
      const totalDpReceived = monthBookings.reduce((sum, b) => sum + (b.dpAmount || 0), 0);
      const confirmed = monthBookings.filter(b => b.status === 'confirmed').length;
      const dp = monthBookings.filter(b => b.status === 'dp').length;
      const pending = monthBookings.filter(b => b.status === 'pending').length;
      return { totalBookings, totalHours, totalRevenue, totalDpReceived, totalPaidFull, confirmed, dp, pending };
    }
  };
});

