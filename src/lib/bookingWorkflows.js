import { format, addWeeks, addMonths } from 'date-fns';

export const getBookingTotal = (booking, pricePerHour = 0) => {
  if (!booking || booking.status === 'maintenance' || booking.status === 'cancelled') return 0;
  const base = booking.type === 'recording'
    ? Number(booking.sessionPrice || 0)
    : Number(booking.duration || 0) * Number(pricePerHour || 0);
  return Math.max(0, base + Number(booking.equipmentCost || 0) - Number(booking.discountAmount || 0));
};

export const getRemainingDue = (booking, pricePerHour = 0) => {
  if (!booking || booking.status === 'confirmed' || booking.status === 'maintenance' || booking.status === 'cancelled') return 0;
  return Math.max(0, getBookingTotal(booking, pricePerHour) - Number(booking.dpAmount || 0));
};

export const getDepositDeadlineStatus = (booking) => {
  if (!booking?.depositDeadline || booking.status === 'confirmed' || booking.status === 'cancelled' || booking.status === 'maintenance') {
    return { state: 'none', days: null, label: '' };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(`${booking.depositDeadline}T00:00:00`);
  if (Number.isNaN(deadline.getTime())) return { state: 'none', days: null, label: '' };
  const days = Math.ceil((deadline - today) / 86400000);
  if (days < 0) return { state: 'overdue', days, label: `${Math.abs(days)} hari lewat deadline` };
  if (days === 0) return { state: 'today', days, label: 'Deadline hari ini' };
  return { state: 'upcoming', days, label: `${days} hari lagi` };
};

export const hasBookingOverlap = (bookings = [], candidate, ignoreId = null) => (
  bookings.some((booking) => {
    if (booking.id === ignoreId || booking.status === 'cancelled') return false;
    if (booking.date !== candidate.date) return false;
    const start = Number(candidate.hour);
    const end = start + Number(candidate.duration || 1);
    const bookingStart = Number(booking.hour);
    const bookingEnd = bookingStart + Number(booking.duration || 1);
    return bookingStart < end && start < bookingEnd;
  })
);

export const buildRecurringBookings = (baseBooking, { frequency = 'weekly', count = 1 } = {}) => {
  const safeCount = Math.max(1, Math.min(24, Number(count) || 1));
  const groupId = `rec-${Date.now()}`;
  const baseId = baseBooking.id || Date.now();

  return Array.from({ length: safeCount }, (_, index) => {
    const sourceDate = new Date(`${baseBooking.date}T00:00:00`);
    const nextDate = frequency === 'monthly'
      ? addMonths(sourceDate, index)
      : addWeeks(sourceDate, index);

    return {
      ...baseBooking,
      id: index === 0 ? baseId : baseId + index,
      date: format(nextDate, 'yyyy-MM-dd'),
      recurringGroupId: groupId,
      recurringIndex: index + 1,
      recurringTotal: safeCount,
      recurringFrequency: frequency,
    };
  });
};
