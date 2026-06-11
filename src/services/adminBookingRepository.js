import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  firestoreDb,
  isFirebaseConfigured,
} from '../lib/firebase.js';

const ADMIN_MANUAL_BOOKINGS_STORAGE_KEY = 'thirty-seven-admin-manual-bookings';
const BOOKINGS_COLLECTION = 'bookings';
const DEFAULT_STUDIO_ID = 'main-studio';

const bookingStatusValues = new Set(['pending', 'dp', 'paid']);

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function canUseFirestore() {
  return Boolean(isFirebaseConfigured && firestoreDb);
}

function safeString(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function safeNumber(value, fallback = 0) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function normalizeTimestampValue(value, fallback) {
  if (!value) {
    return fallback;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }

  return fallback;
}

function getToneByStatus(status) {
  if (status === 'paid') return 'cyan';
  if (status === 'dp') return 'purple';

  return 'accent';
}

function getBookingsCollection() {
  return collection(firestoreDb, BOOKINGS_COLLECTION);
}

function getStudioBookingsQuery() {
  return query(
    getBookingsCollection(),
    where('studioId', '==', DEFAULT_STUDIO_ID),
  );
}

function compareBookings(a, b) {
  const dateCompare = String(a.dateKey || '').localeCompare(String(b.dateKey || ''));

  if (dateCompare !== 0) {
    return dateCompare;
  }

  return String(a.time || '').localeCompare(String(b.time || ''));
}

function createFirestorePayload(booking) {
  return {
    ...booking,
    updatedAt: serverTimestamp(),
  };
}

export function normalizeAdminBooking(booking) {
  if (!booking || typeof booking !== 'object') {
    return null;
  }

  const nowIso = new Date().toISOString();
  const id = safeString(booking.id);
  const customerName = safeString(booking.customerName);
  const dateKey = safeString(booking.dateKey);
  const time = safeString(booking.time);

  if (!id || !customerName || !dateKey || !time) {
    return null;
  }

  const sessionType = safeString(booking.sessionType || booking.title, 'Latihan Band');
  const status = bookingStatusValues.has(booking.status) ? booking.status : 'pending';

  return {
    customerName,
    createdAt: normalizeTimestampValue(booking.createdAt, nowIso),
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
    studioId: safeString(booking.studioId, DEFAULT_STUDIO_ID),
    time,
    title: safeString(booking.title || sessionType, sessionType),
    tone: safeString(booking.tone, getToneByStatus(status)),
    totalPrice: Math.max(0, safeNumber(booking.totalPrice)),
    updatedAt: normalizeTimestampValue(booking.updatedAt, nowIso),
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
      .filter(Boolean)
      .sort(compareBookings);
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
    // Local persistence is best-effort when Firestore is not configured.
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

function subscribeLocalManualBookings(callback) {
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

export function subscribeManualBookings(callback) {
  if (!canUseFirestore()) {
    return subscribeLocalManualBookings(callback);
  }

  const unsubscribe = onSnapshot(
    getStudioBookingsQuery(),
    (snapshot) => {
      const bookings = snapshot.docs
        .map((documentSnapshot) => normalizeAdminBooking({
          id: documentSnapshot.id,
          ...documentSnapshot.data(),
        }))
        .filter(Boolean)
        .sort(compareBookings);

      callback(bookings);
    },
    (error) => {
      console.error('Firestore booking subscription failed.', error);
      callback(readManualBookingsFromStorage());
    },
  );

  return unsubscribe;
}

export async function createManualBooking(booking) {
  const normalizedBooking = normalizeAdminBooking(booking);

  if (!normalizedBooking) {
    return null;
  }

  if (canUseFirestore()) {
    const bookingRef = doc(getBookingsCollection(), normalizedBooking.id);

    await setDoc(
      bookingRef,
      createFirestorePayload(normalizedBooking),
      { merge: true },
    );

    return normalizedBooking;
  }

  const currentBookings = readManualBookingsFromStorage();
  const nextBookings = currentBookings.some((item) => item.id === normalizedBooking.id)
    ? currentBookings.map((item) => (item.id === normalizedBooking.id ? normalizedBooking : item))
    : [...currentBookings, normalizedBooking];

  const sortedBookings = nextBookings.sort(compareBookings);

  writeManualBookingsToStorage(sortedBookings);
  emitManualBookings(sortedBookings);

  return normalizedBooking;
}

export async function clearManualBookings() {
  if (canUseFirestore()) {
    const snapshot = await getDocs(getStudioBookingsQuery());

    await Promise.all(snapshot.docs.map((documentSnapshot) => deleteDoc(documentSnapshot.ref)));

    return [];
  }

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
