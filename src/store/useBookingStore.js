import { create } from 'zustand';
import { auth, db } from '../firebase';
import { collection, doc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { format } from 'date-fns';
import { useSettingsStore } from './useSettingsStore';
import { useNotificationStore } from './useNotificationStore';
import { useDemoStore } from './useDemoStore';
import { useAuditLogStore } from './useAuditLogStore';

const localActionIds = new Set();

const toPublicBooking = (booking) => ({
  id: Number(booking.id),
  date: booking.date,
  hour: Number(booking.hour),
  duration: Number(booking.duration),
  status: booking.status || 'pending',
  type: booking.type || 'booking',
});

const normalizeBookingDoc = (docSnap) => {
  const data = docSnap.data();
  return {
    id: data.id ?? (Number(docSnap.id) || docSnap.id),
    ...data,
  };
};

export const useBookingStore = create((set, get) => {
  const bookingsRef = collection(db, 'bookings');
  const publicBookingsRef = collection(db, 'publicBookings');
  let isFirstLoad = true;
  let realBookings = [];
  let unsubscribeBookings = null;

  const mirrorPublicBooking = async (booking) => {
    if (!booking?.id || !auth.currentUser || auth.currentUser.isAnonymous) return;
    await setDoc(doc(publicBookingsRef, booking.id.toString()), toPublicBooking(booking));
  };

  const subscribeToBookings = (user) => {
    if (unsubscribeBookings) {
      unsubscribeBookings();
      unsubscribeBookings = null;
    }

    isFirstLoad = true;

    if (!user) {
      realBookings = [];
      set({ bookings: [], isLoaded: true, error: null });
      return;
    }

    const isPublicReader = user.isAnonymous;
    const activeRef = isPublicReader ? publicBookingsRef : bookingsRef;

    unsubscribeBookings = onSnapshot(activeRef, (snapshot) => {
      realBookings = snapshot.docs.map(normalizeBookingDoc);

      if (!isPublicReader) {
        snapshot.docChanges().forEach((change) => {
          if (change.type !== 'removed') {
            mirrorPublicBooking(normalizeBookingDoc(change.doc)).catch((error) => {
              console.error('Error mirroring public booking:', error);
            });
          }
        });
      }

      if (useDemoStore.getState().isDemoMode) {
        set({ isLoaded: true, error: null });
        return;
      }

      if (isFirstLoad) {
        isFirstLoad = false;
        set({ bookings: realBookings, isLoaded: true, error: null });
        return;
      }

      if (!isPublicReader) {
        const { addNotification } = useNotificationStore.getState();
        snapshot.docChanges().forEach((change) => {
          const b = normalizeBookingDoc(change.doc);
          if (change.type === 'added' && !localActionIds.has(b.id)) {
            addNotification({
              type: 'booking',
              title: 'Booking Baru',
              message: `${b.band} - ${b.date}, ${b.hour}.00-${b.hour + b.duration}.00 (${b.duration} jam)`,
            });
          }
          if (change.type === 'removed' && !localActionIds.has(b.id)) {
            addNotification({
              type: 'warning',
              title: 'Booking Dihapus',
              message: `${b.band} - ${b.date} telah dihapus oleh pengguna lain`,
            });
          }
          if (localActionIds.has(b.id)) localActionIds.delete(b.id);
        });
      }

      set({ bookings: realBookings, isLoaded: true, error: null });
    }, (error) => {
      console.error('Error loading bookings:', error);
      realBookings = [];
      set({ bookings: [], isLoaded: true, error: error.message });
    });
  };

  onAuthStateChanged(auth, subscribeToBookings);

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
    error: null,

    addBooking: async (newBooking) => {
      const id = Date.now();
      const bookingData = { ...newBooking, id };

      if (useDemoStore.getState().isDemoMode) {
        set((state) => ({ bookings: [...state.bookings, bookingData] }));
        return;
      }

      localActionIds.add(id);

      try {
        const batch = writeBatch(db);
        batch.set(doc(bookingsRef, id.toString()), bookingData);
        batch.set(doc(publicBookingsRef, id.toString()), toPublicBooking(bookingData));
        await batch.commit();
        await useAuditLogStore.getState().addLog({
          action: 'booking_create',
          entityType: 'booking',
          entityId: id,
          summary: `Booking dibuat untuk ${bookingData.band || 'pelanggan'} pada ${bookingData.date}`,
          metadata: { date: bookingData.date, hour: bookingData.hour, status: bookingData.status },
        });
      } catch (error) {
        localActionIds.delete(id);
        throw error;
      }
    },

    addBookings: async (newBookings) => {
      const baseId = Date.now();
      const bookingData = newBookings.map((booking, index) => ({
        ...booking,
        id: booking.id || baseId + index,
      }));

      if (useDemoStore.getState().isDemoMode) {
        set((state) => ({ bookings: [...state.bookings, ...bookingData] }));
        return bookingData;
      }

      bookingData.forEach((booking) => localActionIds.add(booking.id));

      try {
        const batch = writeBatch(db);
        bookingData.forEach((booking) => {
          batch.set(doc(bookingsRef, booking.id.toString()), booking);
          batch.set(doc(publicBookingsRef, booking.id.toString()), toPublicBooking(booking));
        });
        await batch.commit();
        await useAuditLogStore.getState().addLog({
          action: 'booking_recurring_create',
          entityType: 'booking',
          entityId: bookingData[0]?.recurringGroupId || bookingData[0]?.id,
          summary: `${bookingData.length} booking berulang dibuat untuk ${bookingData[0]?.band || 'pelanggan'}`,
          metadata: { count: bookingData.length, firstDate: bookingData[0]?.date },
        });
        return bookingData;
      } catch (error) {
        bookingData.forEach((booking) => localActionIds.delete(booking.id));
        throw error;
      }
    },

    deleteBooking: async (id) => {
      if (useDemoStore.getState().isDemoMode) {
        set((state) => ({ bookings: state.bookings.filter((booking) => booking.id !== id) }));
        return;
      }

      localActionIds.add(id);

      try {
        const batch = writeBatch(db);
        batch.delete(doc(bookingsRef, id.toString()));
        batch.delete(doc(publicBookingsRef, id.toString()));
        await batch.commit();
        await useAuditLogStore.getState().addLog({
          action: 'booking_delete',
          entityType: 'booking',
          entityId: id,
          summary: `Booking ${id} dihapus`,
        });
      } catch (error) {
        localActionIds.delete(id);
        throw error;
      }
    },

    updateBookingStatus: async (id, newStatus) => {
      if (useDemoStore.getState().isDemoMode) {
        set((state) => ({
          bookings: state.bookings.map((booking) => (
            booking.id === id ? { ...booking, status: newStatus } : booking
          )),
        }));
        return;
      }

      localActionIds.add(id);

      try {
        const booking = get().bookings.find((b) => b.id === id);
        const batch = writeBatch(db);
        batch.update(doc(bookingsRef, id.toString()), { status: newStatus });
        if (booking) {
          batch.set(doc(publicBookingsRef, id.toString()), toPublicBooking({ ...booking, status: newStatus }));
        }
        await batch.commit();
        await useAuditLogStore.getState().addLog({
          action: 'booking_status_update',
          entityType: 'booking',
          entityId: id,
          summary: `Status booking diubah menjadi ${newStatus}`,
          metadata: { status: newStatus },
        });
      } catch (error) {
        localActionIds.delete(id);
        throw error;
      }
    },

    cancelBooking: async (id, reason = '') => {
      const cancelledAt = new Date().toISOString();
      const data = {
        status: 'cancelled',
        cancelReason: reason,
        cancelledAt,
      };

      if (useDemoStore.getState().isDemoMode) {
        set((state) => ({
          bookings: state.bookings.map((booking) => (
            booking.id === id ? { ...booking, ...data } : booking
          )),
        }));
        return;
      }

      localActionIds.add(id);
      try {
        const booking = get().bookings.find((b) => b.id === id);
        const batch = writeBatch(db);
        batch.update(doc(bookingsRef, id.toString()), data);
        if (booking) batch.set(doc(publicBookingsRef, id.toString()), toPublicBooking({ ...booking, ...data }));
        await batch.commit();
        await useAuditLogStore.getState().addLog({
          action: 'booking_cancel',
          entityType: 'booking',
          entityId: id,
          summary: `Booking ${booking?.band || id} dibatalkan`,
          metadata: { reason },
        });
      } catch (error) {
        localActionIds.delete(id);
        throw error;
      }
    },

    rescheduleBooking: async (id, { date, hour, reason = '' }) => {
      const booking = get().bookings.find((b) => b.id === id);
      if (!booking) throw new Error('Booking tidak ditemukan.');

      const rescheduleHistory = [
        ...(booking.rescheduleHistory || []),
        {
          fromDate: booking.date,
          fromHour: booking.hour,
          toDate: date,
          toHour: hour,
          reason,
          at: new Date().toISOString(),
        },
      ];

      await get().updateBooking(id, { date, hour: Number(hour), rescheduleHistory });
      await useAuditLogStore.getState().addLog({
        action: 'booking_reschedule',
        entityType: 'booking',
        entityId: id,
        summary: `Booking ${booking.band || id} dipindah ke ${date} ${hour}.00`,
        metadata: { fromDate: booking.date, fromHour: booking.hour, toDate: date, toHour: hour, reason },
      });
    },

    updateBooking: async (id, data) => {
      if (useDemoStore.getState().isDemoMode) {
        set((state) => ({
          bookings: state.bookings.map((booking) => (
            booking.id === id ? { ...booking, ...data } : booking
          )),
        }));
        return;
      }

      localActionIds.add(id);

      try {
        const existingBooking = get().bookings.find((b) => b.id === id);
        if (!existingBooking) throw new Error('Booking tidak ditemukan.');

        const newData = { ...data };

        if (newData.duration !== undefined && newData.duration !== existingBooking.duration && existingBooking.status !== 'maintenance') {
          const currentPricePerHour = useSettingsStore.getState().pricePerHour;
          const oldDuration = existingBooking.duration;
          const newDuration = newData.duration;

          let paidAmount = 0;
          const oldBase = existingBooking.type === 'recording'
            ? (existingBooking.sessionPrice || 0)
            : (oldDuration * currentPricePerHour);

          if (existingBooking.status === 'confirmed') {
            paidAmount = oldBase - (existingBooking.discountAmount || 0);
          } else if (existingBooking.status === 'dp') {
            paidAmount = existingBooking.dpAmount || 0;
          }

          const newBase = existingBooking.type === 'recording'
            ? (newData.sessionPrice || existingBooking.sessionPrice || 0)
            : (newDuration * currentPricePerHour);
          const newTotalPrice = newBase - (existingBooking.discountAmount || 0);

          if (paidAmount > 0) {
            if (paidAmount >= newTotalPrice) {
              newData.status = 'confirmed';
              newData.dpAmount = 0;
            } else {
              newData.status = 'dp';
              newData.dpAmount = paidAmount;
            }
          }
        }

        const updatedBookingData = { ...existingBooking, ...newData };
        const payload = { ...updatedBookingData };
        delete payload.id;

        const batch = writeBatch(db);
        batch.update(doc(bookingsRef, id.toString()), payload);
        batch.set(doc(publicBookingsRef, id.toString()), toPublicBooking(updatedBookingData));
        await batch.commit();
        await useAuditLogStore.getState().addLog({
          action: 'booking_update',
          entityType: 'booking',
          entityId: id,
          summary: `Booking ${updatedBookingData.band || id} diperbarui`,
          metadata: data,
        });
      } catch (error) {
        localActionIds.delete(id);
        throw error;
      }
    },

    getMonthlyStats: (monthDate) => {
      const state = get();
      const currentPricePerHour = useSettingsStore.getState().pricePerHour;
      const monthStr = format(monthDate, 'yyyy-MM');
      const monthBookings = state.bookings.filter((b) => b.date?.startsWith(monthStr) && b.status !== 'cancelled');
      const totalBookings = monthBookings.length;
      const totalHours = monthBookings.reduce((sum, b) => sum + b.duration, 0);

      let totalRevenue = 0;
      let totalPaidFull = 0;

      monthBookings.forEach((b) => {
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
      const confirmed = monthBookings.filter((b) => b.status === 'confirmed').length;
      const dp = monthBookings.filter((b) => b.status === 'dp').length;
      const pending = monthBookings.filter((b) => b.status === 'pending').length;
      return { totalBookings, totalHours, totalRevenue, totalDpReceived, totalPaidFull, confirmed, dp, pending };
    },
  };
});
