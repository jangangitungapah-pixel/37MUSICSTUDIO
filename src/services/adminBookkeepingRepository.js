import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  firestoreDb,
  isFirebaseConfigured,
} from '../lib/firebase.js';

const ADMIN_BOOKKEEPING_ENTRIES_STORAGE_KEY = 'thirty-seven-admin-bookkeeping-entries';
const ADMIN_BOOKKEEPING_AUDIT_LOGS_STORAGE_KEY = 'thirty-seven-admin-bookkeeping-audit-logs';
const BOOKKEEPING_ENTRIES_COLLECTION = 'bookkeepingEntries';
const BOOKKEEPING_AUDIT_LOGS_COLLECTION = 'bookkeepingAuditLogs';
const DEFAULT_STUDIO_ID = 'main-studio';

const bookkeepingTypeValues = new Set(['income', 'expense', 'transfer']);
const bookkeepingDirectionValues = new Set(['in', 'out', 'neutral']);
const bookkeepingPaymentMethodValues = new Set(['cash', 'transfer', 'qris', 'debit', 'other']);
const bookkeepingSourceTypeValues = new Set(['manual', 'billing', 'inventory', 'adjustment']);

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

function createLocalId(prefix) {
  return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

function normalizeBookkeepingActor(actor) {
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

function normalizeBookkeepingType(value) {
  const normalizedValue = safeString(value, 'income');

  return bookkeepingTypeValues.has(normalizedValue) ? normalizedValue : 'income';
}

function normalizeBookkeepingDirection(direction, type) {
  const normalizedDir = safeString(direction);

  if (bookkeepingDirectionValues.has(normalizedDir)) {
    return normalizedDir;
  }

  // Fallback derivation based on type
  if (type === 'expense') {
    return 'out';
  }

  if (type === 'transfer') {
    return 'neutral';
  }

  return 'in';
}

function normalizeBookkeepingPaymentMethod(value) {
  const normalizedValue = safeString(value, 'cash');

  return bookkeepingPaymentMethodValues.has(normalizedValue) ? normalizedValue : 'cash';
}

function normalizeBookkeepingSourceType(value) {
  const normalizedValue = safeString(value, 'manual');

  return bookkeepingSourceTypeValues.has(normalizedValue) ? normalizedValue : 'manual';
}

function compareBookkeepingEntries(a, b) {
  const firstTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
  const secondTime = new Date(b.createdAt || b.updatedAt || 0).getTime();

  if (firstTime !== secondTime) {
    return secondTime - firstTime;
  }

  return String(b.id || '').localeCompare(String(a.id || ''));
}

function compareBookkeepingAuditLogs(a, b) {
  const firstTime = new Date(a.at || a.recordedAt || 0).getTime();
  const secondTime = new Date(b.at || b.recordedAt || 0).getTime();

  if (firstTime !== secondTime) {
    return secondTime - firstTime;
  }

  return String(b.id || '').localeCompare(String(a.id || ''));
}

export function normalizeBookkeepingEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const nowIso = new Date().toISOString();
  const id = safeString(entry.id, createLocalId('bookkeeping'));
  const type = normalizeBookkeepingType(entry.type);
  const direction = normalizeBookkeepingDirection(entry.direction, type);
  const date = safeString(entry.date, nowIso.slice(0, 10));

  return {
    id,
    studioId: safeString(entry.studioId, DEFAULT_STUDIO_ID),
    type,
    direction,
    date,
    transactionAt: normalizeTimestampValue(entry.transactionAt, nowIso),
    categoryId: safeString(entry.categoryId, 'other'),
    categoryName: safeString(entry.categoryName, 'Lain-lain'),
    accountId: safeString(entry.accountId, 'cash'),
    accountName: safeString(entry.accountName, 'Cash'),
    paymentMethod: normalizeBookkeepingPaymentMethod(entry.paymentMethod),
    description: safeString(entry.description, 'Transaksi manual'),
    amount: Math.max(0, safeNumber(entry.amount)),
    sourceType: normalizeBookkeepingSourceType(entry.sourceType),
    sourceId: safeString(entry.sourceId),
    sourceLabel: safeString(entry.sourceLabel),
    notes: safeString(entry.notes),
    createdAt: normalizeTimestampValue(entry.createdAt, nowIso),
    updatedAt: normalizeTimestampValue(entry.updatedAt, nowIso),
    createdBy: normalizeBookkeepingActor(entry.createdBy),
    updatedBy: normalizeBookkeepingActor(entry.updatedBy),
  };
}

export function normalizeBookkeepingAuditLog(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const nowIso = new Date().toISOString();
  const action = safeString(entry.action);

  if (!action) {
    return null;
  }

  const snapshot = entry.entrySnapshot && typeof entry.entrySnapshot === 'object'
    ? entry.entrySnapshot
    : {};

  return {
    action,
    at: normalizeTimestampValue(entry.at, nowIso),
    by: normalizeBookkeepingActor(entry.by),
    id: safeString(entry.id, createLocalId('bookkeeping-audit')),
    label: safeString(entry.label, action),
    recordedAt: normalizeTimestampValue(entry.recordedAt, normalizeTimestampValue(entry.at, nowIso)),
    source: safeString(entry.source, 'admin'),
    studioId: safeString(entry.studioId, DEFAULT_STUDIO_ID),
    entryId: safeString(entry.entryId || snapshot.id),
    entrySnapshot: {
      amount: Math.max(0, safeNumber(snapshot.amount)),
      categoryName: safeString(snapshot.categoryName),
      description: safeString(snapshot.description),
      paymentMethod: normalizeBookkeepingPaymentMethod(snapshot.paymentMethod),
      type: normalizeBookkeepingType(snapshot.type),
      accountId: safeString(snapshot.accountId),
    },
  };
}

function getBookkeepingEntriesCollection() {
  return collection(firestoreDb, BOOKKEEPING_ENTRIES_COLLECTION);
}

function getBookkeepingAuditLogsCollection() {
  return collection(firestoreDb, BOOKKEEPING_AUDIT_LOGS_COLLECTION);
}

function getStudioBookkeepingEntriesQuery() {
  return query(
    getBookkeepingEntriesCollection(),
    where('studioId', '==', DEFAULT_STUDIO_ID),
    orderBy('createdAt', 'desc'),
    limit(160),
  );
}

function getBookkeepingAuditLogsQuery() {
  return query(
    getBookkeepingAuditLogsCollection(),
    orderBy('at', 'desc'),
    limit(160),
  );
}

function createBookkeepingFirestorePayload(entry) {
  return {
    ...entry,
    updatedAt: serverTimestamp(),
  };
}

function readBookkeepingEntriesFromStorage() {
  if (!canUseBrowserStorage()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(ADMIN_BOOKKEEPING_ENTRIES_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map((entry) => normalizeBookkeepingEntry(entry))
      .filter(Boolean)
      .sort(compareBookkeepingEntries);
  } catch {
    return [];
  }
}

function writeBookkeepingEntriesToStorage(entries) {
  if (!canUseBrowserStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      ADMIN_BOOKKEEPING_ENTRIES_STORAGE_KEY,
      JSON.stringify(entries),
    );
  } catch {
    // local fallback
  }
}

function readBookkeepingAuditLogsFromStorage() {
  if (!canUseBrowserStorage()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(ADMIN_BOOKKEEPING_AUDIT_LOGS_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map((entry) => normalizeBookkeepingAuditLog(entry))
      .filter(Boolean)
      .sort(compareBookkeepingAuditLogs);
  } catch {
    return [];
  }
}

function writeBookkeepingAuditLogsToStorage(entries) {
  if (!canUseBrowserStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      ADMIN_BOOKKEEPING_AUDIT_LOGS_STORAGE_KEY,
      JSON.stringify(entries),
    );
  } catch {
    // local fallback
  }
}

function emitBookkeepingEntries(entries) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent('admin-bookkeeping-entries:changed', {
      detail: {
        entries,
      },
    }),
  );
}

function emitBookkeepingAuditLogs(entries) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent('admin-bookkeeping-audit-logs:changed', {
      detail: {
        entries,
      },
    }),
  );
}

function subscribeLocalBookkeepingEntries(callback) {
  const emitCurrentValue = () => {
    callback(readBookkeepingEntriesFromStorage());
  };

  emitCurrentValue();

  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleChange = () => {
    emitCurrentValue();
  };

  window.addEventListener('storage', handleChange);
  window.addEventListener('admin-bookkeeping-entries:changed', handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener('admin-bookkeeping-entries:changed', handleChange);
  };
}

function subscribeLocalBookkeepingAuditLogs(callback) {
  const emitCurrentValue = () => {
    callback(readBookkeepingAuditLogsFromStorage());
  };

  emitCurrentValue();

  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleChange = () => {
    emitCurrentValue();
  };

  window.addEventListener('storage', handleChange);
  window.addEventListener('admin-bookkeeping-audit-logs:changed', handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener('admin-bookkeeping-audit-logs:changed', handleChange);
  };
}

export function subscribeBookkeepingEntries(callback, onError = () => {}) {
  if (!canUseFirestore()) {
    return subscribeLocalBookkeepingEntries(callback);
  }

  const unsubscribe = onSnapshot(
    getStudioBookkeepingEntriesQuery(),
    (snapshot) => {
      const entries = snapshot.docs
        .map((docSnap) => normalizeBookkeepingEntry({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        .filter(Boolean)
        .sort(compareBookkeepingEntries);

      callback(entries);
    },
    (error) => {
      console.error('Firestore bookkeeping entry subscription failed.', error);
      onError(error);
      callback(readBookkeepingEntriesFromStorage());
    },
  );

  return unsubscribe;
}

export function subscribeBookkeepingAuditLogs(callback, onError = () => {}) {
  if (!canUseFirestore()) {
    return subscribeLocalBookkeepingAuditLogs(callback);
  }

  const unsubscribe = onSnapshot(
    getBookkeepingAuditLogsQuery(),
    (snapshot) => {
      const entries = snapshot.docs
        .map((docSnap) => normalizeBookkeepingAuditLog({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        .filter(Boolean)
        .sort(compareBookkeepingAuditLogs);

      callback(entries);
    },
    (error) => {
      console.error('Firestore bookkeeping audit log subscription failed.', error);
      onError(error);
      callback(readBookkeepingAuditLogsFromStorage());
    },
  );

  return unsubscribe;
}

export async function createBookkeepingEntry(entry) {
  const normalizedEntry = normalizeBookkeepingEntry(entry);

  if (!normalizedEntry) {
    return null;
  }

  if (canUseFirestore()) {
    const entryRef = doc(getBookkeepingEntriesCollection(), normalizedEntry.id);

    await setDoc(
      entryRef,
      createBookkeepingFirestorePayload(normalizedEntry),
      { merge: true },
    );

    return normalizedEntry;
  }

  const currentEntries = readBookkeepingEntriesFromStorage();
  const nextEntries = currentEntries.some((item) => item.id === normalizedEntry.id)
    ? currentEntries.map((item) => (item.id === normalizedEntry.id ? normalizedEntry : item))
    : [normalizedEntry, ...currentEntries];

  const sortedEntries = nextEntries.sort(compareBookkeepingEntries);

  writeBookkeepingEntriesToStorage(sortedEntries);
  emitBookkeepingEntries(sortedEntries);

  return normalizedEntry;
}

export async function updateBookkeepingEntry(entry) {
  const normalizedEntry = normalizeBookkeepingEntry(entry);

  if (!normalizedEntry) {
    return null;
  }

  if (canUseFirestore()) {
    const entryRef = doc(getBookkeepingEntriesCollection(), normalizedEntry.id);

    await setDoc(
      entryRef,
      createBookkeepingFirestorePayload(normalizedEntry),
      { merge: true },
    );

    return normalizedEntry;
  }

  const currentEntries = readBookkeepingEntriesFromStorage();
  const nextEntries = currentEntries.some((item) => item.id === normalizedEntry.id)
    ? currentEntries.map((item) => (item.id === normalizedEntry.id ? normalizedEntry : item))
    : [normalizedEntry, ...currentEntries];

  const sortedEntries = nextEntries.sort(compareBookkeepingEntries);

  writeBookkeepingEntriesToStorage(sortedEntries);
  emitBookkeepingEntries(sortedEntries);

  return normalizedEntry;
}

export async function recordBookkeepingAuditLog(entry) {
  const normalizedLog = normalizeBookkeepingAuditLog(entry);

  if (!normalizedLog) {
    return null;
  }

  if (canUseFirestore()) {
    await addDoc(
      getBookkeepingAuditLogsCollection(),
      {
        ...normalizedLog,
        recordedAt: serverTimestamp(),
      },
    );

    return normalizedLog;
  }

  const currentLogs = readBookkeepingAuditLogsFromStorage();
  const nextLogs = [normalizedLog, ...currentLogs].slice(0, 160).sort(compareBookkeepingAuditLogs);

  writeBookkeepingAuditLogsToStorage(nextLogs);
  emitBookkeepingAuditLogs(nextLogs);

  return normalizedLog;
}

export const adminBookkeepingRepository = {
  createBookkeepingEntry,
  normalizeBookkeepingAuditLog,
  normalizeBookkeepingEntry,
  recordBookkeepingAuditLog,
  subscribeBookkeepingAuditLogs,
  subscribeBookkeepingEntries,
  updateBookkeepingEntry,
};
