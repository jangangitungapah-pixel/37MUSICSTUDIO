import { BOOKING_STATUS, BOOKING_TYPE } from './booking.constants';

const getDurationBase = (booking, duration, pricePerHour, nextData = {}) => {
  if (booking.type === BOOKING_TYPE.recording) {
    return nextData.sessionPrice || booking.sessionPrice || 0;
  }

  return Number(duration || 0) * Number(pricePerHour || 0);
};

export const recalculateBookingPaymentForDurationChange = (existingBooking, data, pricePerHour) => {
  const newData = { ...data };

  if (
    newData.duration === undefined ||
    newData.duration === existingBooking.duration ||
    existingBooking.status === BOOKING_STATUS.maintenance
  ) {
    return newData;
  }

  const oldDuration = existingBooking.duration;
  const newDuration = newData.duration;

  let paidAmount = 0;
  const oldBase = getDurationBase(existingBooking, oldDuration, pricePerHour);

  if (existingBooking.status === BOOKING_STATUS.confirmed) {
    paidAmount = oldBase - (existingBooking.discountAmount || 0);
  } else if (existingBooking.status === BOOKING_STATUS.dp) {
    paidAmount = existingBooking.dpAmount || 0;
  }

  const newBase = getDurationBase(existingBooking, newDuration, pricePerHour, newData);
  const newTotalPrice = newBase - (existingBooking.discountAmount || 0);

  if (paidAmount > 0) {
    if (paidAmount >= newTotalPrice) {
      newData.status = BOOKING_STATUS.confirmed;
      newData.dpAmount = 0;
    } else {
      newData.status = BOOKING_STATUS.dp;
      newData.dpAmount = paidAmount;
    }
  }

  return newData;
};
