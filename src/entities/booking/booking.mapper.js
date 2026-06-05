import { BOOKING_STATUS, BOOKING_TYPE } from './booking.constants';

export const toPublicBooking = (booking) => ({
  id: Number(booking.id),
  date: booking.date,
  hour: Number(booking.hour),
  duration: Number(booking.duration),
  status: booking.status || BOOKING_STATUS.pending,
  type: booking.type || BOOKING_TYPE.booking,
});

export const normalizeBookingDoc = (docSnap) => {
  const data = docSnap.data();
  return {
    id: data.id ?? (Number(docSnap.id) || docSnap.id),
    ...data,
  };
};

export const removeBookingIdFromPayload = (booking) => {
  const payload = { ...booking };
  delete payload.id;
  return payload;
};
