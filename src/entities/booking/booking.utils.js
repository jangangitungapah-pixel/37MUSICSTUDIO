export const createBookingId = () => Date.now();

export const withGeneratedBookingId = (booking, id = createBookingId()) => ({
  ...booking,
  id,
});

export const withGeneratedBookingIds = (bookings, baseId = createBookingId()) => (
  bookings.map((booking, index) => ({
    ...booking,
    id: booking.id || baseId + index,
  }))
);
