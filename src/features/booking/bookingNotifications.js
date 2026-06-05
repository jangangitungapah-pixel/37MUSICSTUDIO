import { normalizeBookingDoc } from '../../entities/booking/booking.mapper';

export const notifyBookingChanges = (changes, { addNotification, localActionIds }) => {
  changes.forEach((change) => {
    const booking = normalizeBookingDoc(change.doc);

    if (change.type === 'added' && !localActionIds.has(booking.id)) {
      addNotification({
        type: 'booking',
        title: 'Booking Baru',
        message: `${booking.band || 'Pelanggan'} - ${booking.date}, ${booking.hour}.00-${booking.hour + booking.duration}.00 (${booking.duration} jam)`,
      });
    }

    if (change.type === 'modified' && !localActionIds.has(booking.id)) {
      addNotification({
        type: 'warning',
        title: 'Booking Diperbarui',
        message: `${booking.band || 'Pelanggan'} - ${booking.date}, ${booking.hour}.00-${booking.hour + booking.duration}.00 (Status: ${booking.status})`,
      });
    }

    if (change.type === 'removed' && !localActionIds.has(booking.id)) {
      addNotification({
        type: 'warning',
        title: 'Booking Dihapus',
        message: `${booking.band || 'Pelanggan'} - ${booking.date} telah dihapus oleh pengguna lain`,
      });
    }

    if (localActionIds.has(booking.id)) localActionIds.delete(booking.id);
  });
};
