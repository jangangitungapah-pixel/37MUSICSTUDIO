# Settings Page Local Audit

Generated at: 2026-06-13T23:06:07.969Z

## Git Status

```text
M .firebase/logs/vsce-debug.log
 M node_modules/.vite/vitest/da39a3ee5e6b4b0d3255bfef95601890afd80709/results.json
 M src/pages/settingsadmin.jsx
?? scripts/add-settings-operational-booking-editors.cjs
?? scripts/audit-settings-page-phase-state.cjs
```

## Latest Commits

```text
6b4d61d feat: implement admin settings management system with schema validation, repository, and UI page
05ba001 feat: add phase 60m script for guaranteed customer sync on approve
16dbbfc docs: create advanced settings page masterplan
90d0b45 chore: add Firebase VSCE debug logs
8688512 feat: implement admin bookkeeping page, reusable primitives, and secure firestore collections
b583458 feat: implement administrative bookkeeping page and associated repository logic
2ffb22b feat: implement billing import suggestions with anti-double-count guard and audit logs
c758010 feat: implement manual bookkeeping drawer with validation, edit, delete, and audit trail
285047d feat: implement bookkeeping dashboard and ledger read model
83ac9a8 feat: add bookkeeping repository service
```

## Editor Phase Detection

| Section | Editor Function | Save Call | Phase Ready |
| --- | --- | --- | --- |
| `appearancePolicy` ✅ Ada ❌ Belum ada ❌ Belum ready |
| `operationalPolicy` ✅ Ada ❌ Belum ada ❌ Belum ready |
| `bookingPolicy` ✅ Ada ❌ Belum ada ❌ Belum ready |
| `pricingPolicy` ❌ Belum ada ❌ Belum ada ❌ Belum ready |
| `billingPolicy` ❌ Belum ada ❌ Belum ada ❌ Belum ready |

## Phase Readiness

- SETTINGS.5 Appearance ready: ❌ No
- SETTINGS.6 Operational + Booking ready: ❌ No
- SETTINGS.7 Pricing + Billing ready: ❌ No

## Recommended Next Phase

**SETTINGS.5 - Appearance / UI Editor**

## Repository Checks

| Check | Status |
| --- | --- |
| updateStudioSettingsSection tersedia | ✅ Ada |
| settingsAuditLogs tersedia | ✅ Ada |
| studioSettings/main-studio tersedia | ❌ Belum ada |
| fallback localStorage tersedia | ✅ Ada |

## Safety Checks

| Check | Status |
| --- | --- |
| autoSyncBookingPayment default false terdeteksi | ✅ Ada |
| deleteMode void-only terdeteksi | ✅ Ada |
| Masterplan menyebut SETTINGS.7 | ✅ Ada |
| Repository test tersedia untuk update section | ✅ Ada |

### Pricing Defaults

Section object: ✅ Ada

| Key | Status |
| --- | --- |
| `defaultHourlyRate` | ✅ Ada |
| `weekendHourlyRate` | ✅ Ada |
| `peakHourRate` | ✅ Ada |
| `offPeakRate` | ✅ Ada |
| `overtimeRate` | ✅ Ada |
| `minimumDurationMinutes` | ✅ Ada |
| `roundingMode` | ✅ Ada |
| `taxEnabled` | ✅ Ada |
| `taxRate` | ✅ Ada |
| `serviceFeeEnabled` | ✅ Ada |
| `serviceFeeType` | ✅ Ada |
| `serviceFeeAmount` | ✅ Ada |
| `discountEnabled` | ✅ Ada |
| `maxManualDiscount` | ✅ Ada |
| `packages` | ✅ Ada |
| `addOns` | ✅ Ada |
| `bundleOffers` | ✅ Ada |

Missing keys: tidak ada.

### Pricing Schema

Section object: ✅ Ada

| Key | Status |
| --- | --- |
| `defaultHourlyRate` | ✅ Ada |
| `weekendHourlyRate` | ✅ Ada |
| `peakHourRate` | ✅ Ada |
| `offPeakRate` | ✅ Ada |
| `overtimeRate` | ✅ Ada |
| `minimumDurationMinutes` | ✅ Ada |
| `roundingMode` | ❌ Belum ada |
| `taxEnabled` | ❌ Belum ada |
| `taxRate` | ✅ Ada |
| `serviceFeeEnabled` | ❌ Belum ada |
| `serviceFeeType` | ❌ Belum ada |
| `serviceFeeAmount` | ✅ Ada |
| `discountEnabled` | ❌ Belum ada |
| `maxManualDiscount` | ✅ Ada |
| `packages` | ✅ Ada |
| `addOns` | ❌ Belum ada |
| `bundleOffers` | ❌ Belum ada |

Missing keys: `roundingMode`, `taxEnabled`, `serviceFeeEnabled`, `serviceFeeType`, `discountEnabled`, `addOns`, `bundleOffers`

### Billing Defaults

Section object: ✅ Ada

| Key | Status |
| --- | --- |
| `invoicePrefix` | ✅ Ada |
| `receiptPrefix` | ✅ Ada |
| `numberingReset` | ✅ Ada |
| `nextInvoiceNumberPreview` | ✅ Ada |
| `defaultDueDays` | ✅ Ada |
| `defaultInvoiceStatus` | ✅ Ada |
| `paymentMethods` | ✅ Ada |
| `receiptFooter` | ✅ Ada |
| `invoiceTerms` | ✅ Ada |
| `printPaperSize` | ✅ Ada |
| `showLogoOnReceipt` | ✅ Ada |
| `showOperatorOnReceipt` | ✅ Ada |
| `showCustomerPhoneOnReceipt` | ✅ Ada |
| `autoCreateInvoiceFromBooking` | ✅ Ada |
| `autoSyncBookingPayment` | ✅ Ada |
| `allowPartialPayment` | ✅ Ada |
| `allowOverpayment` | ✅ Ada |
| `roundingMode` | ✅ Ada |
| `defaultPOSCategory` | ✅ Ada |

Missing keys: tidak ada.

### Billing Schema

Section object: ✅ Ada

| Key | Status |
| --- | --- |
| `invoicePrefix` | ✅ Ada |
| `receiptPrefix` | ✅ Ada |
| `numberingReset` | ✅ Ada |
| `nextInvoiceNumberPreview` | ❌ Belum ada |
| `defaultDueDays` | ❌ Belum ada |
| `defaultInvoiceStatus` | ❌ Belum ada |
| `paymentMethods` | ✅ Ada |
| `receiptFooter` | ❌ Belum ada |
| `invoiceTerms` | ❌ Belum ada |
| `printPaperSize` | ❌ Belum ada |
| `showLogoOnReceipt` | ❌ Belum ada |
| `showOperatorOnReceipt` | ❌ Belum ada |
| `showCustomerPhoneOnReceipt` | ❌ Belum ada |
| `autoCreateInvoiceFromBooking` | ❌ Belum ada |
| `autoSyncBookingPayment` | ❌ Belum ada |
| `allowPartialPayment` | ❌ Belum ada |
| `allowOverpayment` | ❌ Belum ada |
| `roundingMode` | ❌ Belum ada |
| `defaultPOSCategory` | ❌ Belum ada |

Missing keys: `nextInvoiceNumberPreview`, `defaultDueDays`, `defaultInvoiceStatus`, `receiptFooter`, `invoiceTerms`, `printPaperSize`, `showLogoOnReceipt`, `showOperatorOnReceipt`, `showCustomerPhoneOnReceipt`, `autoCreateInvoiceFromBooking`, `autoSyncBookingPayment`, `allowPartialPayment`, `allowOverpayment`, `roundingMode`, `defaultPOSCategory`

## Files Audited

- `src/pages/settingsadmin.jsx`
- `src/services/adminSettingsDefaults.js`
- `src/services/adminSettingsSchema.js`
- `src/services/adminSettingsRepository.js`
- `src/services/adminSettingsRepository.test.js`
- `docs/settings-page-full-masterplan.md`

## Notes

- Script ini hanya audit dan dokumentasi.
- Tidak mengubah halaman Settings.
- Tidak mengubah dependency.
- Tidak mengubah Firebase rules.
- Tidak menyentuh data booking, invoice, billing, bookkeeping, inventory, atau customer.
- Patch berikutnya harus mengikuti recommended next phase dari report ini.
