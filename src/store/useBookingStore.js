import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { recalculateBookingPaymentForDurationChange } from '../entities/booking/booking.pricing';
import { getBookingMonthlyStats } from '../entities/booking/booking.stats';
import { withGeneratedBookingId, withGeneratedBookingIds } from '../entities/booking/booking.utils';
import { notifyBookingChanges } from '../features/booking/bookingNotifications';
import {
  createBooking,
  createBookings,
  deleteBookingById,
  updateBookingById,
  updateBookingStatusById,
} from '../services/booking/bookingRepository';
import { subscribeToBookings } from '../services/booking/bookingSubscription';
import { useAuditLogStore } from './useAuditLogStore';
import { useDemoStore } from './useDemoStore';
import { useNotificationStore } from './useNotificationStore';
import { useSettingsStore } from './useSettingsStore';

const localActionIds = new Set();

export const useBookingStore = create((set, get) => {
  let isFirstLoad = true;
  let realBookings = [];
  let unsubscribeBookings = null;

  const handleSubscribeToBookings = (user) => {
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

    unsubscribeBookings = subscribeToBookings(user, {
      onData: ({ bookings: nextBookings, changes, isPublicReader }) => {
        realBookings = nextBookings;

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
          notifyBookingChanges(changes, { addNotification, localActionIds });
        }

        set({ bookings: realBookings, isLoaded: true, error: null });
      },
      onError: (error) => {
        console.error('Error loading bookings:', error);
        realBookings = [];
        set({ bookings: [], isLoaded: true, error: error.message });
      },
    });
  };

  onAuthStateChanged(auth, handleSubscribeToBookings);

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
      const bookingData = withGeneratedBookingId(newBooking);
      const { id } = bookingData;

      if (useDemoStore.getState().isDemoMode) {
        set((state) => ({ bookings: [...state.bookings, bookingData] }));
        return;
      }

      localActionIds.add(id);

      try {
        await createBooking(bookingData);
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
      const bookingData = withGeneratedBookingIds(newBookings);

      if (useDemoStore.getState().isDemoMode) {
        set((state) => ({ bookings: [...state.bookings, ...bookingData] }));
        return bookingData;
      }

      bookingData.forEach((booking) => localActionIds.add(booking.id));

      try {
        await createBookings(bookingData);
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
        await deleteBookingById(id);
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
        await updateBookingStatusById(id, newStatus, booking);
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
        await updateBookingById(id, { ...booking, ...data });
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

        const currentPricePerHour = useSettingsStore.getState().pricePerHour;
        const newData = recalculateBookingPaymentForDurationChange(existingBooking, data, currentPricePerHour);
        const updatedBookingData = { ...existingBooking, ...newData };

        await updateBookingById(id, updatedBookingData);
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
      return getBookingMonthlyStats(state.bookings, monthDate, currentPricePerHour);
    },
  };
});
