import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

vi.mock('../lib/firebase.js', () => ({
  firestoreDb: null,
  isFirebaseConfigured: false,
}));

import {
  DEFAULT_STUDIO_ID,
  getDefaultStudioSettings,
  SETTINGS_SCHEMA_VERSION,
} from './adminSettingsDefaults.js';
import {
  validateSettingsSection,
  validateStudioSettings,
} from './adminSettingsSchema.js';
import {
  exportStudioSettingsJson,
  importStudioSettingsJson,
  normalizeSettingsAuditLog,
  normalizeSettingsSection,
  normalizeStudioSettings,
  updateStudioSettingsSection,
} from './adminSettingsRepository.js';

function createLocalStorageStub() {
  const store = new Map();

  return {
    clear: () => store.clear(),
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    removeItem: (key) => store.delete(key),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
  };
}

describe('admin settings defaults and normalization', () => {
  it('returns a fresh default object for each call', () => {
    const first = getDefaultStudioSettings();
    const second = getDefaultStudioSettings();

    first.studioProfile.studioName = 'Changed';

    expect(second.studioProfile.studioName).toBe('37 Music Studio');
    expect(second.id).toBe(DEFAULT_STUDIO_ID);
    expect(second.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
  });

  it('normalizes partial settings with default sections and trimmed values', () => {
    const normalized = normalizeStudioSettings({
      unknownRoot: true,
      studioProfile: {
        studioName: '  37 Music Studio HQ  ',
      },
    });

    expect(normalized.unknownRoot).toBeUndefined();
    expect(normalized.studioProfile.studioName).toBe('37 Music Studio HQ');
    expect(normalized.studioProfile.currency).toBe('IDR');
    expect(normalized.billingPolicy.autoSyncBookingPayment).toBe(false);
    expect(normalized.bookkeepingPolicy.deleteMode).toBe('void-only');
    expect(normalized.featureFlags.enableDataExport).toBe(true);
  });

  it('normalizes a single section without accepting unknown section names', () => {
    const section = normalizeSettingsSection('billingPolicy', {
      invoicePrefix: ' BILL ',
      autoSyncBookingPayment: true,
    });

    expect(section.invoicePrefix).toBe('BILL');
    expect(section.autoSyncBookingPayment).toBe(true);
    expect(section.allowPartialPayment).toBe(true);
    expect(normalizeSettingsSection('unknown', {})).toBeNull();
  });
});

describe('admin settings validation', () => {
  it('validates the default settings object', () => {
    const result = validateStudioSettings(getDefaultStudioSettings());

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects unsafe bookkeeping delete modes', () => {
    const section = normalizeSettingsSection('bookkeepingPolicy', {
      ...getDefaultStudioSettings().bookkeepingPolicy,
      deleteMode: 'hard-delete',
    });
    const result = validateSettingsSection('bookkeepingPolicy', section);

    expect(result.isValid).toBe(false);
    expect(result.errors.join(' ')).toContain('void-only');
  });

  it('rejects invalid studio profile basics', () => {
    const section = normalizeSettingsSection('studioProfile', {
      ...getDefaultStudioSettings().studioProfile,
      currency: 'USD',
      email: 'not-email',
      studioName: '',
    });
    const result = validateSettingsSection('studioProfile', section);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

describe('admin settings import/export and audit normalization', () => {
  it('exports normalized settings JSON', () => {
    const exported = exportStudioSettingsJson({
      studioProfile: {
        studioName: '37 Music Studio',
      },
    });
    const parsed = JSON.parse(exported);

    expect(parsed.id).toBe(DEFAULT_STUDIO_ID);
    expect(parsed.studioProfile.currency).toBe('IDR');
  });

  it('imports valid JSON and warns about unknown fields', () => {
    const payload = {
      ...getDefaultStudioSettings(),
      unknownRoot: true,
    };
    const result = importStudioSettingsJson(JSON.stringify(payload));

    expect(result.errors).toEqual([]);
    expect(result.settings.id).toBe(DEFAULT_STUDIO_ID);
    expect(result.warnings.some((warning) => warning.includes('unknownRoot'))).toBe(true);
  });

  it('rejects schemaVersion mismatches during import', () => {
    const result = importStudioSettingsJson(JSON.stringify({
      ...getDefaultStudioSettings(),
      schemaVersion: 99,
    }));

    expect(result.settings).toBeNull();
    expect(result.errors.join(' ')).toContain('schemaVersion');
  });

  it('normalizes audit logs and rejects invalid section names', () => {
    const log = normalizeSettingsAuditLog({
      action: 'settings.update',
      section: 'billingPolicy',
      changedKeys: ['invoicePrefix'],
    });

    expect(log.action).toBe('settings.update');
    expect(log.section).toBe('billingPolicy');
    expect(log.changedKeys).toEqual(['invoicePrefix']);
    expect(normalizeSettingsAuditLog({ action: 'settings.update', section: 'missing' })).toBeNull();
  });
});

describe('admin settings local fallback update', () => {
  const originalWindow = global.window;
  const originalCustomEvent = global.CustomEvent;

  beforeEach(() => {
    global.CustomEvent = class CustomEvent {
      constructor(type, options = {}) {
        this.detail = options.detail;
        this.type = type;
      }
    };

    global.window = {
      addEventListener: () => {},
      dispatchEvent: () => true,
      localStorage: createLocalStorageStub(),
      removeEventListener: () => {},
    };
  });

  afterEach(() => {
    global.window = originalWindow;
    global.CustomEvent = originalCustomEvent;
  });

  it('updates a valid section locally and records a settings audit log', async () => {
    const nextSettings = await updateStudioSettingsSection(
      'studioProfile',
      {
        ...getDefaultStudioSettings().studioProfile,
        studioName: '37 Music Studio HQ',
      },
      {
        email: 'owner@example.com',
        uid: 'owner-1',
      },
    );

    const storedSettings = JSON.parse(window.localStorage.getItem('thirty-seven-admin-studio-settings'));
    const storedAudit = JSON.parse(window.localStorage.getItem('thirty-seven-admin-settings-audit-logs'));

    expect(nextSettings.studioProfile.studioName).toBe('37 Music Studio HQ');
    expect(storedSettings.studioProfile.studioName).toBe('37 Music Studio HQ');
    expect(storedAudit[0].action).toBe('settings.update');
    expect(storedAudit[0].section).toBe('studioProfile');
    expect(storedAudit[0].by.email).toBe('owner@example.com');
  });
});
