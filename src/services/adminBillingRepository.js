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

const ADMIN_BILLING_TRANSACTIONS_STORAGE_KEY = 'thirty-seven-admin-billing-transactions';
const ADMIN_BILLING_AUDIT_LOGS_STORAGE_KEY = 'thirty-seven-admin-billing-audit-logs';
const BILLING_TRANSACTIONS_COLLECTION = 'billingTransactions';
const BILLING_AUDIT_LOGS_COLLECTION = 'billingAuditLogs';
const DEFAULT_STUDIO_ID = 'main-studio';

const billingSourceTypeValues = new Set(['booking', 'manual']);
const billingPaymentStatusValues = new Set(['unpaid', 'dp', 'paid']);
const billingPaymentMethodValues = new Set(['cash', 'transfer', 'qris', 'debit', 'other']);

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

function normalizeBillingActor(actor) {
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

function normalizeBillingSourceType(value) {
  const normalizedValue = safeString(value, 'manual');

  return billingSourceTypeValues.has(normalizedValue) ? normalizedValue : 'manual';
}

function normalizeBillingPaymentStatus(value) {
  const normalizedValue = safeString(value, 'unpaid');

  if (normalizedValue === 'pending') {
    return 'unpaid';
  }

  return billingPaymentStatusValues.has(normalizedValue) ? normalizedValue : 'unpaid';
}

function normalizeBillingPaymentMethod(value) {
  const normalizedValue = safeString(value, 'cash');

  return billingPaymentMethodValues.has(normalizedValue) ? normalizedValue : 'cash';
}

function normalizeBillingItem(item, index = 0) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const name = safeString(item.name || item.title);
  const qty = Math.max(1, safeNumber(item.qty, 1));
  const unitPrice = Math.max(0, safeNumber(item.unitPrice || item.price));
  const subtotal = Math.max(0, safeNumber(item.subtotal, qty * unitPrice));

  if (!name) {
    return null;
  }

  return {
    category: safeString(item.category, 'service'),
    id: safeString(item.id, 'billing-item-' + index),
    inventoryItemId: safeString(item.inventoryItemId),
    name,
    qty,
    subtotal,
    unitPrice,
  };
}

function normalizeBillingItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item, index) => normalizeBillingItem(item, index))
    .filter(Boolean);
}

function getCalculatedSubtotal(items) {
  return items.reduce((sum, item) => sum + Math.max(0, safeNumber(item.subtotal)), 0);
}

function compareBillingTransactions(a, b) {
  const firstTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
  const secondTime = new Date(b.createdAt || b.updatedAt || 0).getTime();

  if (firstTime !== secondTime) {
    return secondTime - firstTime;
  }

  return String(b.id || '').localeCompare(String(a.id || ''));
}

function compareBillingAuditLogs(a, b) {
  const firstTime = new Date(a.at || a.recordedAt || 0).getTime();
  const secondTime = new Date(b.at || b.recordedAt || 0).getTime();

  if (firstTime !== secondTime) {
    return secondTime - firstTime;
  }

  return String(b.id || '').localeCompare(String(a.id || ''));
}

function createInvoiceNumber(transaction) {
  const dateKey = safeString(transaction.createdAt || new Date().toISOString()).slice(0, 10).replace(/-/g, '');
  const seed = safeString(transaction.bookingId || transaction.customerId || transaction.id || Date.now()).slice(-6).toUpperCase();

  return 'INV-' + dateKey + '-' + seed;
}

export function normalizeBillingTransaction(transaction) {
  if (!transaction || typeof transaction !== 'object') {
    return null;
  }

  const nowIso = new Date().toISOString();
  const id = safeString(transaction.id, createLocalId('billing'));
  const sourceType = normalizeBillingSourceType(transaction.sourceType);
  const paymentStatus = normalizeBillingPaymentStatus(transaction.paymentStatus || transaction.status);
  const items = normalizeBillingItems(transaction.items);
  const calculatedSubtotal = getCalculatedSubtotal(items);
  const subtotal = Math.max(0, safeNumber(transaction.subtotal, calculatedSubtotal));
  const discountAmount = Math.max(0, safeNumber(transaction.discountAmount));
  const totalAmount = Math.max(0, safeNumber(transaction.totalAmount, subtotal - discountAmount));
  const paidAmount = paymentStatus === 'paid'
    ? Math.max(totalAmount, safeNumber(transaction.paidAmount, totalAmount))
    : Math.max(0, safeNumber(transaction.paidAmount));
  const remainingAmount = paymentStatus === 'paid'
    ? 0
    : Math.max(0, safeNumber(transaction.remainingAmount, totalAmount - paidAmount));

  return {
    bookingId: safeString(transaction.bookingId),
    createdAt: normalizeTimestampValue(transaction.createdAt, nowIso),
    createdBy: normalizeBillingActor(transaction.createdBy),
    customerId: safeString(transaction.customerId),
    customerName: safeString(transaction.customerName, 'Walk-in customer'),
    discountAmount,
    id,
    invoiceNumber: safeString(transaction.invoiceNumber, createInvoiceNumber({
      ...transaction,
      id,
      createdAt: normalizeTimestampValue(transaction.createdAt, nowIso),
    })),
    items,
    notes: safeString(transaction.notes),
    paidAmount,
    paymentMethod: normalizeBillingPaymentMethod(transaction.paymentMethod),
    paymentStatus,
    phone: safeString(transaction.phone),
    remainingAmount,
    sourceType,
    studioId: safeString(transaction.studioId, DEFAULT_STUDIO_ID),
    subtotal,
    totalAmount,
    updatedAt: normalizeTimestampValue(transaction.updatedAt, nowIso),
    updatedBy: normalizeBillingActor(transaction.updatedBy),
  };
}

export function normalizeBillingAuditLog(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const nowIso = new Date().toISOString();
  const action = safeString(entry.action);

  if (!action) {
    return null;
  }

  const snapshot = entry.transactionSnapshot && typeof entry.transactionSnapshot === 'object'
    ? entry.transactionSnapshot
    : {};

  return {
    action,
    at: normalizeTimestampValue(entry.at, nowIso),
    by: normalizeBillingActor(entry.by),
    id: safeString(entry.id, createLocalId('billing-audit')),
    label: safeString(entry.label, action),
    recordedAt: normalizeTimestampValue(entry.recordedAt, normalizeTimestampValue(entry.at, nowIso)),
    source: safeString(entry.source, 'admin'),
    studioId: safeString(entry.studioId, DEFAULT_STUDIO_ID),
    transactionId: safeString(entry.transactionId || snapshot.id),
    transactionSnapshot: {
      customerName: safeString(snapshot.customerName),
      invoiceNumber: safeString(snapshot.invoiceNumber),
      paymentMethod: normalizeBillingPaymentMethod(snapshot.paymentMethod),
      paymentStatus: normalizeBillingPaymentStatus(snapshot.paymentStatus || snapshot.status),
      remainingAmount: Math.max(0, safeNumber(snapshot.remainingAmount)),
      sourceType: normalizeBillingSourceType(snapshot.sourceType),
      totalAmount: Math.max(0, safeNumber(snapshot.totalAmount)),
    },
  };
}

function getBillingTransactionsCollection() {
  return collection(firestoreDb, BILLING_TRANSACTIONS_COLLECTION);
}

function getBillingAuditLogsCollection() {
  return collection(firestoreDb, BILLING_AUDIT_LOGS_COLLECTION);
}

function getStudioBillingTransactionsQuery() {
  return query(
    getBillingTransactionsCollection(),
    where('studioId', '==', DEFAULT_STUDIO_ID),
    orderBy('createdAt', 'desc'),
    limit(160),
  );
}

function getBillingAuditLogsQuery() {
  return query(
    getBillingAuditLogsCollection(),
    orderBy('at', 'desc'),
    limit(160),
  );
}

function createBillingFirestorePayload(transaction) {
  return {
    ...transaction,
    updatedAt: serverTimestamp(),
  };
}

function readBillingTransactionsFromStorage() {
  if (!canUseBrowserStorage()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(ADMIN_BILLING_TRANSACTIONS_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map((transaction) => normalizeBillingTransaction(transaction))
      .filter(Boolean)
      .sort(compareBillingTransactions);
  } catch {
    return [];
  }
}

function writeBillingTransactionsToStorage(transactions) {
  if (!canUseBrowserStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      ADMIN_BILLING_TRANSACTIONS_STORAGE_KEY,
      JSON.stringify(transactions),
    );
  } catch {
    // Local billing persistence is best-effort when Firestore is not configured.
  }
}

function readBillingAuditLogsFromStorage() {
  if (!canUseBrowserStorage()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(ADMIN_BILLING_AUDIT_LOGS_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map((entry) => normalizeBillingAuditLog(entry))
      .filter(Boolean)
      .sort(compareBillingAuditLogs);
  } catch {
    return [];
  }
}

function writeBillingAuditLogsToStorage(entries) {
  if (!canUseBrowserStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      ADMIN_BILLING_AUDIT_LOGS_STORAGE_KEY,
      JSON.stringify(entries),
    );
  } catch {
    // Local billing audit persistence is best-effort when Firestore is not configured.
  }
}

function emitBillingTransactions(transactions) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent('admin-billing-transactions:changed', {
      detail: {
        transactions,
      },
    }),
  );
}

function emitBillingAuditLogs(entries) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent('admin-billing-audit-logs:changed', {
      detail: {
        entries,
      },
    }),
  );
}

function subscribeLocalBillingTransactions(callback) {
  const emitCurrentValue = () => {
    callback(readBillingTransactionsFromStorage());
  };

  emitCurrentValue();

  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleChange = () => {
    emitCurrentValue();
  };

  window.addEventListener('storage', handleChange);
  window.addEventListener('admin-billing-transactions:changed', handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener('admin-billing-transactions:changed', handleChange);
  };
}

function subscribeLocalBillingAuditLogs(callback) {
  const emitCurrentValue = () => {
    callback(readBillingAuditLogsFromStorage());
  };

  emitCurrentValue();

  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleChange = () => {
    emitCurrentValue();
  };

  window.addEventListener('storage', handleChange);
  window.addEventListener('admin-billing-audit-logs:changed', handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener('admin-billing-audit-logs:changed', handleChange);
  };
}

export function subscribeBillingTransactions(callback, onError = () => {}) {
  if (!canUseFirestore()) {
    return subscribeLocalBillingTransactions(callback);
  }

  const unsubscribe = onSnapshot(
    getStudioBillingTransactionsQuery(),
    (snapshot) => {
      const transactions = snapshot.docs
        .map((documentSnapshot) => normalizeBillingTransaction({
          id: documentSnapshot.id,
          ...documentSnapshot.data(),
        }))
        .filter(Boolean)
        .sort(compareBillingTransactions);

      callback(transactions);
    },
    (error) => {
      console.error('Firestore billing transaction subscription failed.', error);
      onError(error);
      callback(readBillingTransactionsFromStorage());
    },
  );

  return unsubscribe;
}

export function subscribeBillingAuditLogs(callback, onError = () => {}) {
  if (!canUseFirestore()) {
    return subscribeLocalBillingAuditLogs(callback);
  }

  const unsubscribe = onSnapshot(
    getBillingAuditLogsQuery(),
    (snapshot) => {
      const entries = snapshot.docs
        .map((documentSnapshot) => normalizeBillingAuditLog({
          id: documentSnapshot.id,
          ...documentSnapshot.data(),
        }))
        .filter(Boolean)
        .sort(compareBillingAuditLogs);

      callback(entries);
    },
    (error) => {
      console.error('Firestore billing audit log subscription failed.', error);
      onError(error);
      callback(readBillingAuditLogsFromStorage());
    },
  );

  return unsubscribe;
}

export async function createBillingTransaction(transaction) {
  const normalizedTransaction = normalizeBillingTransaction(transaction);

  if (!normalizedTransaction) {
    return null;
  }

  if (canUseFirestore()) {
    const transactionRef = doc(getBillingTransactionsCollection(), normalizedTransaction.id);

    await setDoc(
      transactionRef,
      createBillingFirestorePayload(normalizedTransaction),
      { merge: true },
    );

    return normalizedTransaction;
  }

  const currentTransactions = readBillingTransactionsFromStorage();
  const nextTransactions = currentTransactions.some((item) => item.id === normalizedTransaction.id)
    ? currentTransactions.map((item) => (item.id === normalizedTransaction.id ? normalizedTransaction : item))
    : [normalizedTransaction, ...currentTransactions];

  const sortedTransactions = nextTransactions.sort(compareBillingTransactions);

  writeBillingTransactionsToStorage(sortedTransactions);
  emitBillingTransactions(sortedTransactions);

  return normalizedTransaction;
}

export async function updateBillingTransaction(transaction) {
  const normalizedTransaction = normalizeBillingTransaction(transaction);

  if (!normalizedTransaction) {
    return null;
  }

  if (canUseFirestore()) {
    const transactionRef = doc(getBillingTransactionsCollection(), normalizedTransaction.id);

    await setDoc(
      transactionRef,
      createBillingFirestorePayload(normalizedTransaction),
      { merge: true },
    );

    return normalizedTransaction;
  }

  const currentTransactions = readBillingTransactionsFromStorage();
  const nextTransactions = currentTransactions.some((item) => item.id === normalizedTransaction.id)
    ? currentTransactions.map((item) => (item.id === normalizedTransaction.id ? normalizedTransaction : item))
    : [normalizedTransaction, ...currentTransactions];

  const sortedTransactions = nextTransactions.sort(compareBillingTransactions);

  writeBillingTransactionsToStorage(sortedTransactions);
  emitBillingTransactions(sortedTransactions);

  return normalizedTransaction;
}

export async function recordBillingAuditLog(entry) {
  const normalizedLog = normalizeBillingAuditLog(entry);

  if (!normalizedLog) {
    return null;
  }

  if (canUseFirestore()) {
    await addDoc(
      getBillingAuditLogsCollection(),
      {
        ...normalizedLog,
        recordedAt: serverTimestamp(),
      },
    );

    return normalizedLog;
  }

  const currentLogs = readBillingAuditLogsFromStorage();
  const nextLogs = [normalizedLog, ...currentLogs].slice(0, 160).sort(compareBillingAuditLogs);

  writeBillingAuditLogsToStorage(nextLogs);
  emitBillingAuditLogs(nextLogs);

  return normalizedLog;
}

export const adminBillingRepository = {
  createBillingTransaction,
  normalizeBillingAuditLog,
  normalizeBillingTransaction,
  recordBillingAuditLog,
  subscribeBillingAuditLogs,
  subscribeBillingTransactions,
  updateBillingTransaction,
};
