import {
  collection,
  deleteDoc,
  doc,
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

const INVENTORY_ITEMS_COLLECTION = 'inventoryItems';
const INVENTORY_ACTIVITY_LOGS_COLLECTION = 'inventoryActivityLogs';
const DEFAULT_STUDIO_ID = 'main-studio';
const INVENTORY_ITEMS_STORAGE_KEY = 'thirty-seven-admin-inventory-items';

const inventoryStatusValues = new Set(['ready', 'low', 'maintenance', 'retired']);

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

function normalizeInventoryActor(actor) {
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

function getInventoryItemsCollection() {
  return collection(firestoreDb, INVENTORY_ITEMS_COLLECTION);
}

function getInventoryActivityLogsCollection() {
  return collection(firestoreDb, INVENTORY_ACTIVITY_LOGS_COLLECTION);
}

function getStudioInventoryItemsQuery() {
  return query(
    getInventoryItemsCollection(),
    where('studioId', '==', DEFAULT_STUDIO_ID),
  );
}

function compareInventoryItems(firstItem, secondItem) {
  const categoryCompare = String(firstItem.category || '').localeCompare(String(secondItem.category || ''));

  if (categoryCompare !== 0) {
    return categoryCompare;
  }

  return String(firstItem.name || '').localeCompare(String(secondItem.name || ''));
}

function getComputedInventoryStatus(item) {
  const rawStatus = safeString(item.status, 'ready');

  if (rawStatus === 'maintenance' || rawStatus === 'retired') {
    return rawStatus;
  }

  const quantity = Math.max(0, safeNumber(item.quantity));
  const minQuantity = Math.max(0, safeNumber(item.minQuantity));

  if (minQuantity > 0 && quantity < minQuantity) {
    return 'low';
  }

  return inventoryStatusValues.has(rawStatus) ? rawStatus : 'ready';
}

function createFirestorePayload(item, actor) {
  return {
    ...item,
    studioId: DEFAULT_STUDIO_ID,
    updatedAt: serverTimestamp(),
    updatedBy: normalizeInventoryActor(actor),
  };
}

export function normalizeInventoryItem(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const nowIso = new Date().toISOString();
  const id = safeString(item.id);
  const name = safeString(item.name);

  if (!id || !name) {
    return null;
  }

  const normalizedItem = {
    category: safeString(item.category, 'General'),
    condition: safeString(item.condition, 'Good'),
    createdAt: normalizeTimestampValue(item.createdAt, nowIso),
    createdBy: normalizeInventoryActor(item.createdBy),
    id,
    lastChecked: safeString(item.lastChecked),
    location: safeString(item.location, 'Studio'),
    minQuantity: Math.max(0, safeNumber(item.minQuantity)),
    name,
    nextMaintenance: safeString(item.nextMaintenance),
    notes: safeString(item.notes),
    quantity: Math.max(0, safeNumber(item.quantity)),
    source: safeString(item.source, 'admin'),
    status: safeString(item.status, 'ready'),
    studioId: safeString(item.studioId, DEFAULT_STUDIO_ID),
    updatedAt: normalizeTimestampValue(item.updatedAt, nowIso),
    updatedBy: normalizeInventoryActor(item.updatedBy),
    valueEstimate: Math.max(0, safeNumber(item.valueEstimate)),
  };

  return {
    ...normalizedItem,
    status: getComputedInventoryStatus(normalizedItem),
  };
}

function readInventoryItemsFromStorage() {
  if (!canUseBrowserStorage()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(INVENTORY_ITEMS_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map((item) => normalizeInventoryItem(item))
      .filter(Boolean)
      .sort(compareInventoryItems);
  } catch {
    return [];
  }
}

function writeInventoryItemsToStorage(items) {
  if (!canUseBrowserStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      INVENTORY_ITEMS_STORAGE_KEY,
      JSON.stringify(items),
    );
  } catch {
    // Local persistence is best-effort when Firestore is not configured.
  }
}

function emitInventoryItems(items) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent('admin-inventory:changed', {
      detail: {
        items,
      },
    }),
  );
}

function subscribeLocalInventoryItems(callback) {
  const emitCurrentValue = () => {
    callback(readInventoryItemsFromStorage());
  };

  emitCurrentValue();

  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleChange = () => {
    emitCurrentValue();
  };

  window.addEventListener('storage', handleChange);
  window.addEventListener('admin-inventory:changed', handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener('admin-inventory:changed', handleChange);
  };
}

export function subscribeInventoryItems(callback, onError = () => {}) {
  if (!canUseFirestore()) {
    return subscribeLocalInventoryItems(callback);
  }

  const unsubscribe = onSnapshot(
    getStudioInventoryItemsQuery(),
    (snapshot) => {
      const items = snapshot.docs
        .map((documentSnapshot) => normalizeInventoryItem({
          id: documentSnapshot.id,
          ...documentSnapshot.data(),
        }))
        .filter(Boolean)
        .sort(compareInventoryItems);

      callback(items);
    },
    (error) => {
      console.error('Firestore inventory subscription failed.', error);
      onError(error);
      callback(readInventoryItemsFromStorage());
    },
  );

  return unsubscribe;
}

export async function upsertInventoryItem(item, actor) {
  const normalizedItem = normalizeInventoryItem(item);

  if (!normalizedItem) {
    return null;
  }

  if (canUseFirestore()) {
    const inventoryItemRef = doc(getInventoryItemsCollection(), normalizedItem.id);

    await setDoc(
      inventoryItemRef,
      createFirestorePayload(normalizedItem, actor),
      { merge: true },
    );

    return normalizedItem;
  }

  const currentItems = readInventoryItemsFromStorage();
  const nextItems = currentItems.some((currentItem) => currentItem.id === normalizedItem.id)
    ? currentItems.map((currentItem) => (currentItem.id === normalizedItem.id ? normalizedItem : currentItem))
    : [...currentItems, normalizedItem];

  const sortedItems = nextItems.sort(compareInventoryItems);

  writeInventoryItemsToStorage(sortedItems);
  emitInventoryItems(sortedItems);

  return normalizedItem;
}

export async function deleteInventoryItem(itemId) {
  const normalizedItemId = safeString(itemId);

  if (!normalizedItemId) {
    return false;
  }

  if (canUseFirestore()) {
    const inventoryItemRef = doc(getInventoryItemsCollection(), normalizedItemId);

    await deleteDoc(inventoryItemRef);

    return true;
  }

  const currentItems = readInventoryItemsFromStorage();
  const nextItems = currentItems.filter((item) => item.id !== normalizedItemId);

  writeInventoryItemsToStorage(nextItems);
  emitInventoryItems(nextItems);

  return true;
}

export async function seedStarterInventoryItems(items, actor) {
  const normalizedItems = Array.isArray(items)
    ? items
      .map((item) => normalizeInventoryItem({
        ...item,
        source: 'starter-seed',
        studioId: DEFAULT_STUDIO_ID,
      }))
      .filter(Boolean)
    : [];

  if (normalizedItems.length === 0) {
    return [];
  }

  if (canUseFirestore()) {
    await Promise.all(normalizedItems.map((item) => {
      const inventoryItemRef = doc(getInventoryItemsCollection(), item.id);

      return setDoc(
        inventoryItemRef,
        {
          ...createFirestorePayload(item, actor),
          createdAt: serverTimestamp(),
          createdBy: normalizeInventoryActor(actor),
        },
        { merge: true },
      );
    }));

    return normalizedItems;
  }

  const sortedItems = normalizedItems.sort(compareInventoryItems);

  writeInventoryItemsToStorage(sortedItems);
  emitInventoryItems(sortedItems);

  return sortedItems;
}

export async function recordInventoryActivityLog(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const itemId = safeString(entry.itemId);

  if (!itemId) {
    return null;
  }

  const log = {
    action: safeString(entry.action, 'inventory-activity'),
    at: serverTimestamp(),
    by: normalizeInventoryActor(entry.by),
    itemId,
    itemName: safeString(entry.itemName),
    label: safeString(entry.label, 'Inventory activity'),
    source: safeString(entry.source, 'admin'),
    studioId: DEFAULT_STUDIO_ID,
  };

  if (canUseFirestore()) {
    await setDoc(
      doc(getInventoryActivityLogsCollection()),
      log,
      { merge: true },
    );
  }

  return log;
}

export const adminInventoryRepository = {
  deleteInventoryItem,
  normalizeInventoryItem,
  recordInventoryActivityLog,
  seedStarterInventoryItems,
  subscribeInventoryItems,
  upsertInventoryItem,
};
