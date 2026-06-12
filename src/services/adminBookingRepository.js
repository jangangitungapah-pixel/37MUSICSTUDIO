import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  limit,
  orderBy,
} from 'firebase/firestore';
import {
  firestoreDb,
  isFirebaseConfigured,
} from '../lib/firebase.js';

const ADMIN_MANUAL_BOOKINGS_STORAGE_KEY = 'thirty-seven-admin-manual-bookings';
const BOOKINGS_COLLECTION = 'bookings';
const BOOKING_AUDIT_LOGS_COLLECTION = 'bookingAuditLogs';
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

function normalizeAuditActor(actor) {
  if (!actor || typeof actor !== 'object') {
    return {
      displayName: 'Admin',
      email: '',
      uid: '',
    };
  }

  const email = safeString(actor.email);
  const displayName = safeString(actor.displayName || actor.name || email, 'Admin');

  return {
    displayName,
    email,
    uid: safeString(actor.uid),
  };
}

function normalizeAuditEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const nowIso = new Date().toISOString();
  const action = safeString(entry.action);
  const at = normalizeTimestampValue(entry.at, nowIso);

  if (!action || !at) {
    return null;
  }

  return {
    action,
    at,
    by: normalizeAuditActor(entry.by),
    id: safeString(entry.id, 'audit-' + Date.now()),
    label: safeString(entry.label, action),
  };
}

function normalizeAuditTrail(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => normalizeAuditEntry(entry))
    .filter(Boolean)
    .slice(-24);
}

function normalizeBookingAuditLog(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const nowIso = new Date().toISOString();
  const bookingId = safeString(entry.bookingId);
  const action = safeString(entry.action);

  if (!bookingId || !action) {
    return null;
  }

  const snapshot = entry.bookingSnapshot && typeof entry.bookingSnapshot === 'object'
    ? entry.bookingSnapshot
    : {};

  return {
    action,
    at: normalizeTimestampValue(entry.at, nowIso),
    bookingId,
    id: safeString(entry.id, 'audit-log-' + Date.now()),
    bookingSnapshot: {
      customerName: safeString(snapshot.customerName),
      dateKey: safeString(snapshot.dateKey),
      phone: safeString(snapshot.phone),
      sessionType: safeString(snapshot.sessionType || snapshot.title),
      status: safeString(snapshot.status),
      time: safeString(snapshot.time),
      totalPrice: Math.max(0, safeNumber(snapshot.totalPrice)),
    },
    by: normalizeAuditActor(entry.by),
    label: safeString(entry.label, action),
    recordedAt: normalizeTimestampValue(entry.recordedAt, normalizeTimestampValue(entry.at, nowIso)),
    source: safeString(entry.source, 'admin'),
    studioId: safeString(entry.studioId, DEFAULT_STUDIO_ID),
  };
}

function getToneByStatus(status) {
  if (status === 'paid') return 'cyan';
  if (status === 'dp') return 'purple';

  return 'accent';
}

function getBookingsCollection() {
  return collection(firestoreDb, BOOKINGS_COLLECTION);
}

function getBookingAuditLogsCollection() {
  return collection(firestoreDb, BOOKING_AUDIT_LOGS_COLLECTION);
}

function getBookingAuditLogsQuery() {
  return query(
    getBookingAuditLogsCollection(),
    orderBy('at', 'desc'),
    limit(120),
  );
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

function compareAuditLogs(a, b) {
  const firstTime = new Date(a.at || a.recordedAt || 0).getTime();
  const secondTime = new Date(b.at || b.recordedAt || 0).getTime();

  if (firstTime !== secondTime) {
    return secondTime - firstTime;
  }

  return String(b.id || '').localeCompare(String(a.id || ''));
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
    auditTrail: normalizeAuditTrail(booking.auditTrail),
    customerName,
    createdAt: normalizeTimestampValue(booking.createdAt, nowIso),
    createdBy: normalizeAuditActor(booking.createdBy),
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
    lastAction: safeString(booking.lastAction),
    lastActionAt: normalizeTimestampValue(booking.lastActionAt, nowIso),
    lastActionLabel: safeString(booking.lastActionLabel),
    updatedAt: normalizeTimestampValue(booking.updatedAt, nowIso),
    updatedBy: normalizeAuditActor(booking.updatedBy),
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

export function subscribeManualBookings(callback, onError = () => {}) {
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
      onError(error);
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

export async function updateManualBooking(booking) {
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

export async function deleteManualBooking(bookingId) {
  const normalizedBookingId = safeString(bookingId);

  if (!normalizedBookingId) {
    return false;
  }

  if (canUseFirestore()) {
    const bookingRef = doc(getBookingsCollection(), normalizedBookingId);

    await deleteDoc(bookingRef);

    return true;
  }

  const currentBookings = readManualBookingsFromStorage();
  const nextBookings = currentBookings.filter((booking) => booking.id !== normalizedBookingId);

  writeManualBookingsToStorage(nextBookings);
  emitManualBookings(nextBookings);

  return true;
}

export function subscribeBookingAuditLogs(callback, onError = () => {}) {
  if (!canUseFirestore()) {
    callback([]);

    return () => {};
  }

  const unsubscribe = onSnapshot(
    getBookingAuditLogsQuery(),
    (snapshot) => {
      const auditLogs = snapshot.docs
        .map((documentSnapshot) => normalizeBookingAuditLog({
          id: documentSnapshot.id,
          ...documentSnapshot.data(),
        }))
        .filter(Boolean)
        .sort(compareAuditLogs);

      callback(auditLogs);
    },
    (error) => {
      console.error('Firestore booking audit log subscription failed.', error);
      onError(error);
      callback([]);
    },
  );

  return unsubscribe;
}

export async function recordBookingAuditLog(entry) {
  const normalizedLog = normalizeBookingAuditLog(entry);

  if (!normalizedLog) {
    return null;
  }

  if (canUseFirestore()) {
    await addDoc(
      getBookingAuditLogsCollection(),
      {
        ...normalizedLog,
        recordedAt: serverTimestamp(),
      },
    );
  }

  return normalizedLog;
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
  deleteManualBooking,
  normalizeAdminBooking,
  recordBookingAuditLog,
  subscribeBookingAuditLogs,
  subscribeManualBookings,
  updateManualBooking,
};
