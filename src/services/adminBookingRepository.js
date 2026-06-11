const ADMIN_MANUAL_BOOKINGS_STORAGE_KEY = 'thirty-seven-admin-manual-bookings';

const bookingStatusValues = new Set(['pending', 'dp', 'paid']);

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function safeString(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function safeNumber(value, fallback = 0) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function getToneByStatus(status) {
  if (status === 'paid') return 'cyan';
  if (status === 'dp') return 'purple';

  return 'accent';
}

export function normalizeAdminBooking(booking) {
  if (!booking || typeof booking !== 'object') {
    return null;
  }

  const id = safeString(booking.id);
  const customerName = safeString(booking.customerName);
  const dateKey = safeString(booking.dateKey);
  const time = safeString(booking.time);

  if (!id || !customerName || !dateKey || !time) {
    return null;
  }

  const sessionType = safeString(booking.sessionType || booking.title, 'Latihan Band');
  const status = bookingStatusValues.has(booking.status) ? booking.status : 'pending';
  const nowIso = new Date().toISOString();

  return {
    customerName,
    createdAt: safeString(booking.createdAt, nowIso),
    dateKey,
    dpAmount: Math.max(0, safeNumber(booking.dpAmount)),
    durationHours: Math.max(1, safeNumber(booking.durationHours, 1)),
    id,
    notes: safeString(booking.notes),
    phone: safeString(booking.phone),
    remainingPayment: Math.max(0, safeNumber(booking.remainingPayment)),
    sessionType,
    source: safeString(booking.source, 'admin'),
    status,
    studioId: safeString(booking.studioId, 'main-studio'),
    time,
    title: safeString(booking.title || sessionType, sessionType),
    tone: safeString(booking.tone, getToneByStatus(status)),
    totalPrice: Math.max(0, safeNumber(booking.totalPrice)),
    updatedAt: safeString(booking.updatedAt, nowIso),
  };
}

function readManualBookingsFromStorage() {
  if (!canUseBrowserStorage()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(ADMIN_MANUAL_BOOKINGS_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map((booking) => normalizeAdminBooking(booking))
      .filter(Boolean);
  } catch (_error) {
    return [];
  }
}

function writeManualBookingsToStorage(bookings) {
  if (!canUseBrowserStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      ADMIN_MANUAL_BOOKINGS_STORAGE_KEY,
      JSON.stringify(bookings),
    );
  } catch (_error) {
    // Local persistence is best-effort until Firestore is connected.
  }
}

function emitManualBookings(bookings) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent('admin-bookings:changed', {
      detail: {
        bookings,
      },
    }),
  );
}

export function subscribeManualBookings(callback) {
  const emitCurrentValue = () => {
    callback(readManualBookingsFromStorage());
  };

  emitCurrentValue();

  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleChange = () => {
    emitCurrentValue();
  };

  window.addEventListener('storage', handleChange);
  window.addEventListener('admin-bookings:changed', handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener('admin-bookings:changed', handleChange);
  };
}

export async function createManualBooking(booking) {
  const normalizedBooking = normalizeAdminBooking(booking);

  if (!normalizedBooking) {
    return null;
  }

  const currentBookings = readManualBookingsFromStorage();
  const nextBookings = currentBookings.some((item) => item.id === normalizedBooking.id)
    ? currentBookings.map((item) => (item.id === normalizedBooking.id ? normalizedBooking : item))
    : [...currentBookings, normalizedBooking];

  writeManualBookingsToStorage(nextBookings);
  emitManualBookings(nextBookings);

  return normalizedBooking;
}

export async function clearManualBookings() {
  writeManualBookingsToStorage([]);
  emitManualBookings([]);

  return [];
}

export const adminBookingRepository = {
  clearManualBookings,
  createManualBooking,
  normalizeAdminBooking,
  subscribeManualBookings,
};
