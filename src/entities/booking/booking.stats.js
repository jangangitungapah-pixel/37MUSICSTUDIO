import { format } from 'date-fns';
import { BOOKING_STATUS, BOOKING_TYPE } from './booking.constants';

export const getBookingMonthlyStats = (bookings = [], monthDate, pricePerHour = 0) => {
  const monthStr = format(monthDate, 'yyyy-MM');
  const monthBookings = bookings.filter((booking) => (
    booking.date?.startsWith(monthStr) && booking.status !== BOOKING_STATUS.cancelled
  ));
  const totalBookings = monthBookings.length;
  const totalHours = monthBookings.reduce((sum, booking) => sum + booking.duration, 0);

  let totalRevenue = 0;
  let totalPaidFull = 0;

  monthBookings.forEach((booking) => {
    if (booking.status !== BOOKING_STATUS.maintenance) {
      const base = booking.type === BOOKING_TYPE.recording
        ? (booking.sessionPrice || 0)
        : (booking.duration * pricePerHour);
      const finalPrice = base - (booking.discountAmount || 0);
      totalRevenue += finalPrice;

      if (booking.status === BOOKING_STATUS.confirmed) {
        totalPaidFull += finalPrice;
      }
    }
  });

  const totalDpReceived = monthBookings.reduce((sum, booking) => sum + (booking.dpAmount || 0), 0);
  const confirmed = monthBookings.filter((booking) => booking.status === BOOKING_STATUS.confirmed).length;
  const dp = monthBookings.filter((booking) => booking.status === BOOKING_STATUS.dp).length;
  const pending = monthBookings.filter((booking) => booking.status === BOOKING_STATUS.pending).length;

  return { totalBookings, totalHours, totalRevenue, totalDpReceived, totalPaidFull, confirmed, dp, pending };
};
