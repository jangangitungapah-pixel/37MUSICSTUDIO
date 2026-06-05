import { collection, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { PUBLIC_BOOKING_COLLECTION } from '../../entities/booking/booking.constants';
import { toPublicBooking } from '../../entities/booking/booking.mapper';

export const publicBookingsRef = collection(db, PUBLIC_BOOKING_COLLECTION);

export const setPublicBookingInBatch = (batch, booking) => {
  batch.set(doc(publicBookingsRef, booking.id.toString()), toPublicBooking(booking));
};

export const deletePublicBookingInBatch = (batch, id) => {
  batch.delete(doc(publicBookingsRef, id.toString()));
};

export const mirrorPublicBooking = async (booking) => {
  if (!booking?.id || !auth.currentUser || auth.currentUser.isAnonymous) return;
  await setDoc(doc(publicBookingsRef, booking.id.toString()), toPublicBooking(booking));
};
