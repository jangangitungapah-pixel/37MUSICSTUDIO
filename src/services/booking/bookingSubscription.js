import { onSnapshot } from 'firebase/firestore';
import { normalizeBookingDoc } from '../../entities/booking/booking.mapper';
import { bookingsRef } from './bookingRepository';
import { mirrorPublicBooking, publicBookingsRef } from './publicBookingRepository';

export const subscribeToBookings = (user, { onData, onError }) => {
  if (!user) {
    onData({ bookings: [], changes: [], isPublicReader: false });
    return null;
  }

  const isPublicReader = user.isAnonymous;
  const activeRef = isPublicReader ? publicBookingsRef : bookingsRef;

  return onSnapshot(activeRef, (snapshot) => {
    const bookings = snapshot.docs.map(normalizeBookingDoc);

    if (!isPublicReader) {
      snapshot.docChanges().forEach((change) => {
        if (change.type !== 'removed') {
          mirrorPublicBooking(normalizeBookingDoc(change.doc)).catch((error) => {
            console.error('Error mirroring public booking:', error);
          });
        }
      });
    }

    onData({ bookings, changes: snapshot.docChanges(), isPublicReader });
  }, onError);
};
