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
    if (isFirstLoad) {
      // First load — just set data, no notifications
      isFirstLoad = false;
      set({ bookings: snapshot.docs.map(doc => doc.data()), isLoaded: true });
      return;
    }

    const { addNotification } = useNotificationStore.getState();

    snapshot.docChanges().forEach((change) => {
      const b = change.doc.data();
      
      if (change.type === 'added' && !localActionIds.has(b.id)) {
        addNotification({
          type: 'booking',
          title: 'Booking Baru',
          message: `${b.band} — ${b.date}, ${b.hour}.00–${b.hour + b.duration}.00 (${b.duration} jam)`
        });
      }
      
      if (change.type === 'removed' && !localActionIds.has(b.id)) {
        addNotification({
          type: 'warning',
          title: 'Booking Dihapus',
          message: `${b.band} — ${b.date} telah dihapus oleh pengguna lain`
        });
      }

      // If the server confirmed our local action, we can safely remove it from the ignore list
      if (localActionIds.has(b.id)) {
        localActionIds.delete(b.id);
      }
    });

    set({ bookings: snapshot.docs.map(doc => doc.data()), isLoaded: true });
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

