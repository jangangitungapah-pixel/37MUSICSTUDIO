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
} from 'firebase/firestore';
import {
  firestoreDb,
  isFirebaseConfigured,
} from '../lib/firebase.js';
import {
  DEFAULT_STUDIO_ID,
  getDefaultStudioSettings,
  SETTINGS_SCHEMA_VERSION,
  settingsSectionKeys,
} from './adminSettingsDefaults.js';
import {
  isSettingsSectionKey,
  settingsSectionMeta,
  validateSettingsSection,
  validateStudioSettings,
} from './adminSettingsSchema.js';

const STUDIO_SETTINGS_COLLECTION = 'studioSettings';
const SETTINGS_AUDIT_LOGS_COLLECTION = 'settingsAuditLogs';
const STUDIO_SETTINGS_STORAGE_KEY = 'thirty-seven-admin-studio-settings';
const SETTINGS_AUDIT_LOGS_STORAGE_KEY = 'thirty-seven-admin-settings-audit-logs';
const SETTINGS_CHANGED_EVENT = 'admin-settings:changed';
const SETTINGS_AUDIT_CHANGED_EVENT = 'admin-settings-audit:changed';
const MAX_SETTINGS_AUDIT_LOGS = 160;

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function canUseFirestore() {
  return Boolean(isFirebaseConfigured && firestoreDb);
}

function cloneValue(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
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

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function normalizeActor(actor) {
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

function normalizeArrayValue(value, fallback) {
  return Array.isArray(value) ? cloneValue(value) : cloneValue(fallback);
}

function normalizeObjectValue(value, fallback) {
  if (!isPlainObject(value)) {
    return cloneValue(fallback);
  }

  if (Object.keys(fallback).length === 0) {
    return cloneValue(value);
  }

  return Object.fromEntries(
    Object.entries(fallback).map(([key, defaultChildValue]) => [
      key,
      normalizeKnownShape(defaultChildValue, value[key]),
    ]),
  );
}

function normalizeKnownShape(defaultValue, sourceValue) {
  if (Array.isArray(defaultValue)) {
    return normalizeArrayValue(sourceValue, defaultValue);
  }

  if (isPlainObject(defaultValue)) {
    return normalizeObjectValue(sourceValue, defaultValue);
  }

  if (typeof defaultValue === 'boolean') {
    return typeof sourceValue === 'boolean' ? sourceValue : defaultValue;
  }

  if (typeof defaultValue === 'number') {
    return safeNumber(sourceValue, defaultValue);
  }

  if (typeof defaultValue === 'string') {
    return safeString(sourceValue, defaultValue);
  }

  return sourceValue ?? defaultValue;
}

function getUnknownKeys(source, allowedKeys) {
  if (!isPlainObject(source)) {
    return [];
  }

  const allowed = new Set(allowedKeys);

  return Object.keys(source).filter((key) => !allowed.has(key));
}

function getSettingsDocRef() {
  return doc(firestoreDb, STUDIO_SETTINGS_COLLECTION, DEFAULT_STUDIO_ID);
}

function getSettingsAuditLogsCollection() {
  return collection(firestoreDb, SETTINGS_AUDIT_LOGS_COLLECTION);
}

function getSettingsAuditLogsQuery() {
  return query(
    getSettingsAuditLogsCollection(),
    orderBy('at', 'desc'),
    limit(MAX_SETTINGS_AUDIT_LOGS),
  );
}

function readStudioSettingsFromStorage() {
  if (!canUseBrowserStorage()) {
    return getDefaultStudioSettings();
  }

  try {
    const rawValue = window.localStorage.getItem(STUDIO_SETTINGS_STORAGE_KEY);

    if (!rawValue) {
      return getDefaultStudioSettings();
    }

    return normalizeStudioSettings(JSON.parse(rawValue));
  } catch {
    return getDefaultStudioSettings();
  }
}

function writeStudioSettingsToStorage(settings) {
  if (!canUseBrowserStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      STUDIO_SETTINGS_STORAGE_KEY,
      JSON.stringify(settings),
    );
  } catch {
    // Local settings persistence is best-effort when Firestore is not configured.
  }
}

function readSettingsAuditLogsFromStorage() {
  if (!canUseBrowserStorage()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(SETTINGS_AUDIT_LOGS_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map((entry) => normalizeSettingsAuditLog(entry))
      .filter(Boolean)
      .sort(compareSettingsAuditLogs)
      .slice(0, MAX_SETTINGS_AUDIT_LOGS);
  } catch {
    return [];
  }
}

function writeSettingsAuditLogsToStorage(logs) {
  if (!canUseBrowserStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      SETTINGS_AUDIT_LOGS_STORAGE_KEY,
      JSON.stringify(logs.slice(0, MAX_SETTINGS_AUDIT_LOGS)),
    );
  } catch {
    // Local settings audit persistence is best-effort when Firestore is not configured.
  }
}

function emitStudioSettings(settings) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(SETTINGS_CHANGED_EVENT, {
      detail: {
        settings,
      },
    }),
  );
}

function emitSettingsAuditLogs(logs) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(SETTINGS_AUDIT_CHANGED_EVENT, {
      detail: {
        logs,
      },
    }),
  );
}

function subscribeLocalStudioSettings(callback) {
  const emitCurrentValue = () => {
    callback(readStudioSettingsFromStorage());
  };

  emitCurrentValue();

  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleChange = () => {
    emitCurrentValue();
  };

  window.addEventListener('storage', handleChange);
  window.addEventListener(SETTINGS_CHANGED_EVENT, handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener(SETTINGS_CHANGED_EVENT, handleChange);
  };
}

function subscribeLocalSettingsAuditLogs(callback) {
  const emitCurrentValue = () => {
    callback(readSettingsAuditLogsFromStorage());
  };

  emitCurrentValue();

  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleChange = () => {
    emitCurrentValue();
  };

  window.addEventListener('storage', handleChange);
  window.addEventListener(SETTINGS_AUDIT_CHANGED_EVENT, handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener(SETTINGS_AUDIT_CHANGED_EVENT, handleChange);
  };
}

function compareSettingsAuditLogs(firstLog, secondLog) {
  const firstTime = new Date(firstLog.at || 0).getTime();
  const secondTime = new Date(secondLog.at || 0).getTime();

  if (firstTime !== secondTime) {
    return secondTime - firstTime;
  }

  return String(secondLog.id || '').localeCompare(String(firstLog.id || ''));
}

function createLocalId(prefix) {
  return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

function getChangedKeys(beforeSection, afterSection) {
  const beforeValue = isPlainObject(beforeSection) ? beforeSection : {};
  const afterValue = isPlainObject(afterSection) ? afterSection : {};
  const keys = new Set([...Object.keys(beforeValue), ...Object.keys(afterValue)]);

  return Array.from(keys).filter((key) => (
    JSON.stringify(beforeValue[key]) !== JSON.stringify(afterValue[key])
  ));
}

function createValidationError(result) {
  const error = new Error(result.errors.join(' '));

  error.validation = result;

  return error;
}

export function normalizeSettingsSection(sectionKey, sectionValue) {
  if (!isSettingsSectionKey(sectionKey)) {
    return null;
  }

  const defaults = getDefaultStudioSettings()[sectionKey];

  return normalizeKnownShape(defaults, sectionValue);
}

export function normalizeStudioSettings(settings) {
  const defaults = getDefaultStudioSettings();
  const source = isPlainObject(settings) ? settings : {};
  const nowIso = new Date().toISOString();
  const normalizedSettings = {
    id: DEFAULT_STUDIO_ID,
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    studioId: DEFAULT_STUDIO_ID,
  };

  settingsSectionKeys.forEach((sectionKey) => {
    normalizedSettings[sectionKey] = normalizeSettingsSection(sectionKey, source[sectionKey]);
  });

  normalizedSettings.createdAt = normalizeTimestampValue(source.createdAt, defaults.createdAt);
  normalizedSettings.updatedAt = normalizeTimestampValue(source.updatedAt, defaults.updatedAt || nowIso);
  normalizedSettings.updatedBy = normalizeActor(source.updatedBy);

  return normalizedSettings;
}

export function normalizeSettingsAuditLog(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const action = safeString(entry.action);
  const section = safeString(entry.section);

  if (!action || (section && !isSettingsSectionKey(section))) {
    return null;
  }

  const nowIso = new Date().toISOString();

  return {
    action,
    after: isPlainObject(entry.after) ? cloneValue(entry.after) : {},
    at: normalizeTimestampValue(entry.at, nowIso),
    before: isPlainObject(entry.before) ? cloneValue(entry.before) : {},
    by: normalizeActor(entry.by),
    changedKeys: Array.isArray(entry.changedKeys)
      ? entry.changedKeys.map((key) => safeString(key)).filter(Boolean)
      : [],
    id: safeString(entry.id, createLocalId('settings-audit')),
    label: safeString(entry.label, action),
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    section,
    source: safeString(entry.source, 'admin-settings'),
    studioId: DEFAULT_STUDIO_ID,
  };
}

export function subscribeStudioSettings(callback, onError = () => {}) {
  if (!canUseFirestore()) {
    return subscribeLocalStudioSettings(callback);
  }

  const unsubscribe = onSnapshot(
    getSettingsDocRef(),
    (snapshot) => {
      const nextSettings = snapshot.exists()
        ? normalizeStudioSettings({
          id: snapshot.id,
          ...snapshot.data(),
        })
        : getDefaultStudioSettings();

      callback(nextSettings);
    },
    (error) => {
      console.error('Firestore settings subscription failed.', error);
      onError(error);
      callback(readStudioSettingsFromStorage());
    },
  );

  return unsubscribe;
}

export async function updateStudioSettingsSection(sectionKey, sectionValue, actor) {
  const normalizedSection = normalizeSettingsSection(sectionKey, sectionValue);

  if (!normalizedSection) {
    throw new Error(`Unknown settings section: ${sectionKey}`);
  }

  const validation = validateSettingsSection(sectionKey, normalizedSection);

  if (!validation.isValid) {
    throw createValidationError(validation);
  }

  const currentSettings = readStudioSettingsFromStorage();
  const nowIso = new Date().toISOString();
  const normalizedActor = normalizeActor(actor);
  const nextSettings = normalizeStudioSettings({
    ...currentSettings,
    [sectionKey]: normalizedSection,
    createdAt: currentSettings.createdAt || nowIso,
    updatedAt: nowIso,
    updatedBy: normalizedActor,
  });

  if (canUseFirestore()) {
    await setDoc(
      getSettingsDocRef(),
      {
        ...nextSettings,
        updatedAt: serverTimestamp(),
        updatedBy: normalizedActor,
      },
      { merge: true },
    );
  } else {
    writeStudioSettingsToStorage(nextSettings);
    emitStudioSettings(nextSettings);
  }

  await recordSettingsAuditLog({
    action: 'settings.update',
    after: normalizedSection,
    before: currentSettings[sectionKey],
    by: normalizedActor,
    changedKeys: getChangedKeys(currentSettings[sectionKey], normalizedSection),
    label: `${settingsSectionMeta[sectionKey]?.label || sectionKey} settings updated`,
    section: sectionKey,
    source: 'admin-settings',
  });

  return nextSettings;
}

export async function recordSettingsAuditLog(entry) {
  const normalizedLog = normalizeSettingsAuditLog(entry);

  if (!normalizedLog) {
    return null;
  }

  if (canUseFirestore()) {
    await addDoc(
      getSettingsAuditLogsCollection(),
      {
        ...normalizedLog,
        at: serverTimestamp(),
      },
    );

    return normalizedLog;
  }

  const nextLogs = [
    normalizedLog,
    ...readSettingsAuditLogsFromStorage(),
  ]
    .sort(compareSettingsAuditLogs)
    .slice(0, MAX_SETTINGS_AUDIT_LOGS);

  writeSettingsAuditLogsToStorage(nextLogs);
  emitSettingsAuditLogs(nextLogs);

  return normalizedLog;
}

export function subscribeSettingsAuditLogs(callback, onError = () => {}) {
  if (!canUseFirestore()) {
    return subscribeLocalSettingsAuditLogs(callback);
  }

  const unsubscribe = onSnapshot(
    getSettingsAuditLogsQuery(),
    (snapshot) => {
      const logs = snapshot.docs
        .map((documentSnapshot) => normalizeSettingsAuditLog({
          id: documentSnapshot.id,
          ...documentSnapshot.data(),
        }))
        .filter(Boolean)
        .sort(compareSettingsAuditLogs)
        .slice(0, MAX_SETTINGS_AUDIT_LOGS);

      callback(logs);
    },
    (error) => {
      console.error('Firestore settings audit subscription failed.', error);
      onError(error);
      callback(readSettingsAuditLogsFromStorage());
    },
  );

  return unsubscribe;
}

export function exportStudioSettingsJson(settings = readStudioSettingsFromStorage()) {
  const normalizedSettings = normalizeStudioSettings(settings);
  const validation = validateStudioSettings(normalizedSettings);

  if (!validation.isValid) {
    throw createValidationError(validation);
  }

  return JSON.stringify(normalizedSettings, null, 2);
}

export function importStudioSettingsJson(jsonText) {
  let parsedValue;

  try {
    parsedValue = JSON.parse(String(jsonText || ''));
  } catch {
    return {
      errors: ['Imported settings JSON tidak valid.'],
      settings: null,
      warnings: [],
    };
  }

  if (!isPlainObject(parsedValue)) {
    return {
      errors: ['Imported settings JSON harus object.'],
      settings: null,
      warnings: [],
    };
  }

  const knownTopLevelKeys = [
    'id',
    'schemaVersion',
    'studioId',
    ...settingsSectionKeys,
    'createdAt',
    'updatedAt',
    'updatedBy',
  ];
  const warnings = getUnknownKeys(parsedValue, knownTopLevelKeys)
    .map((key) => `Unknown imported field ignored: ${key}`);

  if (parsedValue.schemaVersion !== SETTINGS_SCHEMA_VERSION) {
    return {
      errors: [`schemaVersion harus ${SETTINGS_SCHEMA_VERSION} atau dimigrasikan dulu.`],
      settings: null,
      warnings,
    };
  }

  const normalizedSettings = normalizeStudioSettings(parsedValue);
  const validation = validateStudioSettings(normalizedSettings);

  return {
    errors: validation.errors,
    settings: validation.isValid ? normalizedSettings : null,
    warnings: [...warnings, ...validation.warnings],
  };
}

export {
  getDefaultStudioSettings,
  validateSettingsSection,
  validateStudioSettings,
};

export const adminSettingsRepository = {
  exportStudioSettingsJson,
  getDefaultStudioSettings,
  importStudioSettingsJson,
  normalizeSettingsAuditLog,
  normalizeSettingsSection,
  normalizeStudioSettings,
  recordSettingsAuditLog,
  subscribeSettingsAuditLogs,
  subscribeStudioSettings,
  updateStudioSettingsSection,
  validateSettingsSection,
};
