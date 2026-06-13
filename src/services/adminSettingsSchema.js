import {
  DEFAULT_STUDIO_ID,
  SETTINGS_SCHEMA_VERSION,
  settingsSectionKeys,
} from './adminSettingsDefaults.js';

export const settingsSectionMeta = {
  studioProfile: { label: 'Studio Profile', risk: 'Low' },
  operationalPolicy: { label: 'Operational Policy', risk: 'Medium' },
  bookingPolicy: { label: 'Booking Policy', risk: 'High' },
  pricingPolicy: { label: 'Pricing & Packages', risk: 'High' },
  billingPolicy: { label: 'Billing/POS', risk: 'Critical' },
  bookkeepingPolicy: { label: 'Bookkeeping', risk: 'Critical' },
  inventoryPolicy: { label: 'Inventory & Maintenance', risk: 'High' },
  customerPolicy: { label: 'Customer / CRM', risk: 'Medium' },
  notificationPolicy: { label: 'Notifications', risk: 'Medium' },
  appearancePolicy: { label: 'Appearance / UI', risk: 'Medium' },
  securityPolicy: { label: 'Security / Admin Policy', risk: 'Critical' },
  dataPolicy: { label: 'Data Management', risk: 'Critical' },
  systemPolicy: { label: 'System Health', risk: 'Low' },
  featureFlags: { label: 'Feature Flags', risk: 'High' },
};

const supportedTimezones = new Set(['Asia/Jakarta']);
const supportedCurrencies = new Set(['IDR']);
const supportedLocales = new Set(['id-ID']);
const supportedThemeModes = new Set(['dark', 'light', 'system']);
const supportedDensityModes = new Set(['comfortable', 'compact']);
const supportedDeleteModes = new Set(['void-only']);
const supportedNumberingResetModes = new Set(['monthly', 'yearly', 'never']);
const supportedPaymentStatuses = new Set(['unpaid', 'dp', 'paid']);
const supportedBookingStatuses = new Set(['pending', 'dp', 'paid']);

function createValidationResult(errors = [], warnings = []) {
  return {
    errors,
    isValid: errors.length === 0,
    warnings,
  };
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function isNonNegativeNumber(value) {
  return isFiniteNumber(value) && Number(value) >= 0;
}

function isPositiveNumber(value) {
  return isFiniteNumber(value) && Number(value) > 0;
}

function isValidEmail(value) {
  if (!value) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(String(value).trim());
}

function getTimeMinutes(value) {
  const match = String(value || '').match(/^(\d{2}):(\d{2})$/u);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

function validateStudioProfile(section) {
  const errors = [];

  if (!isNonEmptyString(section.studioName)) {
    errors.push('studioProfile.studioName wajib diisi.');
  }

  if (!supportedCurrencies.has(section.currency)) {
    errors.push('studioProfile.currency MVP harus IDR.');
  }

  if (!supportedTimezones.has(section.timezone)) {
    errors.push('studioProfile.timezone harus Asia/Jakarta untuk MVP.');
  }

  if (!supportedLocales.has(section.locale)) {
    errors.push('studioProfile.locale harus id-ID untuk MVP.');
  }

  if (!isValidEmail(section.email)) {
    errors.push('studioProfile.email tidak valid.');
  }

  return errors;
}

function validateWeeklyHours(weeklyHours) {
  if (!isPlainObject(weeklyHours)) {
    return ['operationalPolicy.weeklyHours harus object per hari.'];
  }

  return Object.entries(weeklyHours).flatMap(([dayKey, day]) => {
    if (!isPlainObject(day)) {
      return [`operationalPolicy.weeklyHours.${dayKey} harus object.`];
    }

    if (!day.open) {
      return [];
    }

    const start = getTimeMinutes(day.start);
    const end = getTimeMinutes(day.end);
    const errors = [];

    if (start === null) {
      errors.push(`operationalPolicy.weeklyHours.${dayKey}.start harus format HH:mm.`);
    }

    if (end === null) {
      errors.push(`operationalPolicy.weeklyHours.${dayKey}.end harus format HH:mm.`);
    }

    if (start !== null && end !== null && end <= start) {
      errors.push(`operationalPolicy.weeklyHours.${dayKey}.end harus setelah start.`);
    }

    return errors;
  });
}

function validateOperationalPolicy(section) {
  const errors = validateWeeklyHours(section.weeklyHours);

  if (!supportedTimezones.has(section.timezone)) {
    errors.push('operationalPolicy.timezone harus Asia/Jakarta untuk MVP.');
  }

  if (!isFiniteNumber(section.slotMinutes) || Number(section.slotMinutes) < 15) {
    errors.push('operationalPolicy.slotMinutes minimal 15.');
  }

  if (!isNonNegativeNumber(section.bufferMinutes)) {
    errors.push('operationalPolicy.bufferMinutes tidak boleh negatif.');
  }

  if (!isPositiveNumber(section.maxAdvanceDays)) {
    errors.push('operationalPolicy.maxAdvanceDays harus lebih dari 0.');
  }

  return errors;
}

function validateBookingPolicy(section) {
  const errors = [];

  if (!supportedBookingStatuses.has(section.defaultBookingStatus)) {
    errors.push('bookingPolicy.defaultBookingStatus tidak valid.');
  }

  if (!supportedPaymentStatuses.has(section.defaultPaymentStatus)) {
    errors.push('bookingPolicy.defaultPaymentStatus tidak valid.');
  }

  if (!isNonNegativeNumber(section.defaultDepositAmount)) {
    errors.push('bookingPolicy.defaultDepositAmount tidak boleh negatif.');
  }

  if (!isNonNegativeNumber(section.cancellationCutoffHours)) {
    errors.push('bookingPolicy.cancellationCutoffHours tidak boleh negatif.');
  }

  if (!isNonNegativeNumber(section.noShowThresholdMinutes)) {
    errors.push('bookingPolicy.noShowThresholdMinutes tidak boleh negatif.');
  }

  return errors;
}

function validatePricingPolicy(section) {
  const errors = [];

  [
    'defaultHourlyRate',
    'weekendHourlyRate',
    'peakHourRate',
    'offPeakRate',
    'overtimeRate',
    'serviceFeeAmount',
    'maxManualDiscount',
  ].forEach((key) => {
    if (!isNonNegativeNumber(section[key])) {
      errors.push(`pricingPolicy.${key} tidak boleh negatif.`);
    }
  });

  if (!isFiniteNumber(section.minimumDurationMinutes) || Number(section.minimumDurationMinutes) < 15) {
    errors.push('pricingPolicy.minimumDurationMinutes minimal 15.');
  }

  if (!isFiniteNumber(section.taxRate) || Number(section.taxRate) < 0 || Number(section.taxRate) > 100) {
    errors.push('pricingPolicy.taxRate harus 0 sampai 100.');
  }

  if (Array.isArray(section.packages)) {
    const packageNames = new Set();

    section.packages.forEach((item, index) => {
      if (!isPlainObject(item) || !isNonEmptyString(item.name)) {
        errors.push(`pricingPolicy.packages.${index}.name wajib diisi.`);
        return;
      }

      const normalizedName = item.name.trim().toLowerCase();

      if (packageNames.has(normalizedName)) {
        errors.push(`pricingPolicy.packages.${index}.name harus unik.`);
      }

      packageNames.add(normalizedName);

      if (!isNonNegativeNumber(item.price)) {
        errors.push(`pricingPolicy.packages.${index}.price tidak boleh negatif.`);
      }

      if (!isFiniteNumber(item.durationMinutes) || Number(item.durationMinutes) < 15) {
        errors.push(`pricingPolicy.packages.${index}.durationMinutes minimal 15.`);
      }
    });
  }

  return errors;
}

function validateBillingPolicy(section) {
  const errors = [];

  if (!isNonEmptyString(section.invoicePrefix)) {
    errors.push('billingPolicy.invoicePrefix wajib diisi.');
  }

  if (!isNonEmptyString(section.receiptPrefix)) {
    errors.push('billingPolicy.receiptPrefix wajib diisi.');
  }

  if (!supportedNumberingResetModes.has(section.numberingReset)) {
    errors.push('billingPolicy.numberingReset tidak valid.');
  }

  if (!Array.isArray(section.paymentMethods) || !section.paymentMethods.some((item) => item.active)) {
    errors.push('billingPolicy.paymentMethods minimal satu metode aktif.');
  }

  return errors;
}

function validateBookkeepingPolicy(section) {
  const errors = [];

  if (!supportedDeleteModes.has(section.deleteMode)) {
    errors.push('bookkeepingPolicy.deleteMode harus void-only.');
  }

  if (!Array.isArray(section.accounts) || !section.accounts.some((item) => item.active)) {
    errors.push('bookkeepingPolicy.accounts minimal satu akun aktif.');
  }

  if (!Array.isArray(section.incomeCategories) || !section.incomeCategories.some((item) => item.active)) {
    errors.push('bookkeepingPolicy.incomeCategories minimal satu kategori aktif.');
  }

  if (!Array.isArray(section.expenseCategories) || !section.expenseCategories.some((item) => item.active)) {
    errors.push('bookkeepingPolicy.expenseCategories minimal satu kategori aktif.');
  }

  if (!isFiniteNumber(section.monthlyClosingDay) || Number(section.monthlyClosingDay) < 1 || Number(section.monthlyClosingDay) > 31) {
    errors.push('bookkeepingPolicy.monthlyClosingDay harus 1 sampai 31.');
  }

  if (section.autoImportBilling && !isPlainObject(section.paymentMethodAccountMapping)) {
    errors.push('bookkeepingPolicy.autoImportBilling butuh paymentMethodAccountMapping.');
  }

  if (section.autoImportBilling && isPlainObject(section.paymentMethodAccountMapping)) {
    const hasMapping = Object.values(section.paymentMethodAccountMapping).some((value) => isNonEmptyString(value));

    if (!hasMapping) {
      errors.push('bookkeepingPolicy.autoImportBilling butuh minimal satu mapping akun.');
    }
  }

  return errors;
}

function validateInventoryPolicy(section) {
  const errors = [];

  if (!isNonNegativeNumber(section.lowStockThresholdDefault)) {
    errors.push('inventoryPolicy.lowStockThresholdDefault tidak boleh negatif.');
  }

  if (!isNonNegativeNumber(section.maintenanceReminderDays)) {
    errors.push('inventoryPolicy.maintenanceReminderDays tidak boleh negatif.');
  }

  if (!isPositiveNumber(section.defaultMaintenanceIntervalDays)) {
    errors.push('inventoryPolicy.defaultMaintenanceIntervalDays harus lebih dari 0.');
  }

  return errors;
}

function validateAppearancePolicy(section) {
  const errors = [];

  if (!supportedThemeModes.has(section.defaultTheme)) {
    errors.push('appearancePolicy.defaultTheme tidak valid.');
  }

  if (!supportedDensityModes.has(section.defaultDensity)) {
    errors.push('appearancePolicy.defaultDensity tidak valid.');
  }

  if (!supportedDensityModes.has(section.dashboardDensity)) {
    errors.push('appearancePolicy.dashboardDensity tidak valid.');
  }

  if (!supportedDensityModes.has(section.tableRowDensity)) {
    errors.push('appearancePolicy.tableRowDensity tidak valid.');
  }

  return errors;
}

function validateSecurityPolicy(section) {
  const errors = [];
  const warnings = [];

  if (section.requireVerifiedEmail) {
    warnings.push('securityPolicy.requireVerifiedEmail tidak boleh dianggap enforceable hanya dari UI.');
  }

  if (section.ownerEmail && !isValidEmail(section.ownerEmail)) {
    errors.push('securityPolicy.ownerEmail tidak valid.');
  }

  if (Array.isArray(section.allowedAdminEmails)) {
    section.allowedAdminEmails.forEach((email, index) => {
      if (!isValidEmail(email)) {
        errors.push(`securityPolicy.allowedAdminEmails.${index} tidak valid.`);
      }
    });
  }

  return { errors, warnings };
}

function validateDataPolicy(section) {
  const warnings = [];

  if (section.importEnabled) {
    warnings.push('dataPolicy.importEnabled tetap harus memakai schema validation sebelum save.');
  }

  return { errors: [], warnings };
}

function validateFeatureFlags(section) {
  const warnings = [];

  Object.entries(section).forEach(([key, value]) => {
    if (typeof value !== 'boolean') {
      warnings.push(`featureFlags.${key} sebaiknya boolean.`);
    }
  });

  return { errors: [], warnings };
}

export function isSettingsSectionKey(sectionKey) {
  return settingsSectionKeys.includes(sectionKey);
}

export function validateSettingsSection(sectionKey, sectionValue) {
  if (!isSettingsSectionKey(sectionKey)) {
    return createValidationResult([`Unknown settings section: ${sectionKey}`]);
  }

  if (!isPlainObject(sectionValue)) {
    return createValidationResult([`${sectionKey} harus object.`]);
  }

  if (sectionKey === 'studioProfile') {
    return createValidationResult(validateStudioProfile(sectionValue));
  }

  if (sectionKey === 'operationalPolicy') {
    return createValidationResult(validateOperationalPolicy(sectionValue));
  }

  if (sectionKey === 'bookingPolicy') {
    return createValidationResult(validateBookingPolicy(sectionValue));
  }

  if (sectionKey === 'pricingPolicy') {
    return createValidationResult(validatePricingPolicy(sectionValue));
  }

  if (sectionKey === 'billingPolicy') {
    return createValidationResult(validateBillingPolicy(sectionValue));
  }

  if (sectionKey === 'bookkeepingPolicy') {
    return createValidationResult(validateBookkeepingPolicy(sectionValue));
  }

  if (sectionKey === 'inventoryPolicy') {
    return createValidationResult(validateInventoryPolicy(sectionValue));
  }

  if (sectionKey === 'appearancePolicy') {
    return createValidationResult(validateAppearancePolicy(sectionValue));
  }

  if (sectionKey === 'securityPolicy') {
    const result = validateSecurityPolicy(sectionValue);
    return createValidationResult(result.errors, result.warnings);
  }

  if (sectionKey === 'dataPolicy') {
    const result = validateDataPolicy(sectionValue);
    return createValidationResult(result.errors, result.warnings);
  }

  if (sectionKey === 'featureFlags') {
    const result = validateFeatureFlags(sectionValue);
    return createValidationResult(result.errors, result.warnings);
  }

  return createValidationResult();
}

export function validateStudioSettings(settings) {
  if (!isPlainObject(settings)) {
    return createValidationResult(['settings harus object.']);
  }

  const errors = [];
  const warnings = [];

  if (settings.schemaVersion !== SETTINGS_SCHEMA_VERSION) {
    errors.push(`schemaVersion harus ${SETTINGS_SCHEMA_VERSION}.`);
  }

  if (settings.studioId !== DEFAULT_STUDIO_ID || settings.id !== DEFAULT_STUDIO_ID) {
    errors.push(`settings harus memakai studioId/id ${DEFAULT_STUDIO_ID}.`);
  }

  settingsSectionKeys.forEach((sectionKey) => {
    const result = validateSettingsSection(sectionKey, settings[sectionKey]);

    errors.push(...result.errors);
    warnings.push(...result.warnings);
  });

  return createValidationResult(errors, warnings);
}
