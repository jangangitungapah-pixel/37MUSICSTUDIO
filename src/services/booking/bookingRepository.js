import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { BOOKING_COLLECTION } from '../../entities/booking/booking.constants';
import { removeBookingIdFromPayload } from '../../entities/booking/booking.mapper';
import { deletePublicBookingInBatch, setPublicBookingInBatch } from './publicBookingRepository';

export const bookingsRef = collection(db, BOOKING_COLLECTION);

export const createBooking = async (bookingData) => {
  const batch = writeBatch(db);
  batch.set(doc(bookingsRef, bookingData.id.toString()), bookingData);
  setPublicBookingInBatch(batch, bookingData);
  await batch.commit();
};

export const createBookings = async (bookingData) => {
  const batch = writeBatch(db);
  bookingData.forEach((booking) => {
    batch.set(doc(bookingsRef, booking.id.toString()), booking);
    setPublicBookingInBatch(batch, booking);
  });
  await batch.commit();
};

export const deleteBookingById = async (id) => {
  const batch = writeBatch(db);
  batch.delete(doc(bookingsRef, id.toString()));
  deletePublicBookingInBatch(batch, id);
  await batch.commit();
};

export const updateBookingStatusById = async (id, newStatus, booking) => {
  const batch = writeBatch(db);
  batch.update(doc(bookingsRef, id.toString()), { status: newStatus });
  if (booking) setPublicBookingInBatch(batch, { ...booking, status: newStatus });
  await batch.commit();
};

export const updateBookingById = async (id, updatedBookingData) => {
  const batch = writeBatch(db);
  batch.update(doc(bookingsRef, id.toString()), removeBookingIdFromPayload(updatedBookingData));
  if (updatedBookingData?.id) setPublicBookingInBatch(batch, updatedBookingData);
  await batch.commit();
};
