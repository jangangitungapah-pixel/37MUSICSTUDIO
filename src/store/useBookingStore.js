import { create } from 'zustand';
import { db } from '../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { format, addDays } from 'date-fns';
import { useSettingsStore } from './useSettingsStore';
import { useNotificationStore } from './useNotificationStore';

// Track IDs of bookings added/deleted locally to suppress self-notifications
const localActionIds = new Set();

export const useBookingStore = create((set, get) => {
  const bookingsRef = collection(db, 'bookings');
  let isFirstLoad = true;

  onSnapshot(bookingsRef, (snapshot) => {
    const newData = snapshot.docs.map(doc => doc.data());
    
    if (isFirstLoad) {
      // First load — just set data, no notifications
      isFirstLoad = false;
      set({ bookings: newData, isLoaded: true });
      return;
    }

    const oldData = get().bookings;
    const oldIds = new Set(oldData.map(b => b.id));
    const newIds = new Set(newData.map(b => b.id));

    // Detect added bookings (remote only)
    const addedBookings = newData.filter(b => !oldIds.has(b.id) && !localActionIds.has(b.id));
    // Detect deleted bookings (remote only)
    const deletedBookings = oldData.filter(b => !newIds.has(b.id) && !localActionIds.has(b.id));

    const { addNotification } = useNotificationStore.getState();

    addedBookings.forEach(b => {
      addNotification({
        type: 'booking',
        title: 'Booking Baru',
        message: `${b.band} — ${b.date}, ${b.hour}.00–${b.hour + b.duration}.00 (${b.duration} jam)`
      });
    });

    deletedBookings.forEach(b => {
      addNotification({
        type: 'warning',
        title: 'Booking Dihapus',
        message: `${b.band} — ${b.date} telah dihapus oleh pengguna lain`
      });
    });

    // Clean up local action IDs after processing
    localActionIds.clear();

    set({ bookings: newData, isLoaded: true });
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
      set((state) => ({
        bookings: state.bookings.map(b => b.id === id ? { ...b, ...data } : b)
      }));
      await updateDoc(doc(bookingsRef, id.toString()), data);
    },

    getMonthlyStats: (monthDate) => {
      const state = get();
      const currentPricePerHour = useSettingsStore.getState().pricePerHour;
      const monthStr = format(monthDate, 'yyyy-MM');
      const monthBookings = state.bookings.filter(b => b.date.startsWith(monthStr));
      const totalBookings = monthBookings.length;
      const totalHours = monthBookings.reduce((sum, b) => sum + b.duration, 0);
      const totalRevenue = totalHours * currentPricePerHour;
      const totalDpReceived = monthBookings.reduce((sum, b) => sum + (b.dpAmount || 0), 0);
      const totalPaidFull = monthBookings
        .filter(b => b.status === 'confirmed')
        .reduce((sum, b) => sum + (b.duration * currentPricePerHour), 0);
      const confirmed = monthBookings.filter(b => b.status === 'confirmed').length;
      const dp = monthBookings.filter(b => b.status === 'dp').length;
      const pending = monthBookings.filter(b => b.status === 'pending').length;
      return { totalBookings, totalHours, totalRevenue, totalDpReceived, totalPaidFull, confirmed, dp, pending };
    }
  };
});

