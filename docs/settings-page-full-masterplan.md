# SETTINGS.MASTERPLAN - Advanced Settings Page for 37 Music Studio

Dokumen ini adalah kontrak arsitektur untuk membangun halaman Settings lanjutan di 37 Music Studio / Studio OS Admin. Fase ini adalah SETTINGS.MASTERPLAN: hanya membuat rencana, tidak membuat route, tidak mengubah source aplikasi, tidak mengubah CSS, tidak mengubah dependency, dan tidak menerapkan Firestore rules.

## 1. Ringkasan Besar

Settings harus menjadi Control Center untuk seluruh Studio OS. Halaman ini bukan preference page kecil, tetapi control room studio: tempat owner/admin mengatur identitas bisnis, perilaku operasional, default booking, kebijakan billing, pembukuan, inventory, CRM, tampilan, keamanan, data, health, feature flags, dan audit.

Settings harus powerful tetapi aman. Setiap perubahan hanya boleh mengatur default, validasi, template, policy, konfigurasi modul, visibility fitur, dan perilaku masa depan. Settings tidak boleh diam-diam mengubah histori booking, invoice lunas, transaksi billing, catatan pembukuan, customer, stock inventory, atau data lama lain tanpa migration flow eksplisit.

Setiap perubahan Settings harus bisa diaudit. Implementasi masa depan harus menyimpan siapa aktornya, kapan berubah, section apa yang berubah, key apa yang berubah, dan ringkasan before/after. Settings juga harus modular per section supaya future Codex run bisa mengerjakan satu area tanpa memecah area lain.

Prinsip UI utama tetap satu komponen, dua palet warna: dark mode dan light mode berbagi DOM, layout, spacing, ukuran, posisi, visibility, dan struktur yang sama. Perbedaan tema hanya warna, background, border, surface, shadow, dan contrast.

## 2. Goals

Settings harus memungkinkan admin mengontrol:

- studio profile
- operational hours
- booking rules
- pricing/packages
- billing/POS
- bookkeeping
- inventory and maintenance
- customer/CRM
- notification templates
- appearance/UI
- security/admin policy
- data/export/import
- system health
- feature flags
- audit logs

Tujuan akhirnya adalah membuat semua modul Studio OS punya pusat kendali yang konsisten, aman, dan bisa dikembangkan bertahap.

## 3. Non-Goals

Settings tidak boleh:

- change historical bookings automatically
- change paid invoices automatically
- rewrite bookkeeping history automatically
- delete records massal
- mutate inventory stock automatically
- enforce real security only from client UI
- introduce CSS layout branch for dark/light
- add aggressive mobile overflow/transform hacks
- add new dependencies unless future phase explicitly needs it

Security note: client-side roles hanya kontrol tampilan dan UX. Real security harus memakai Firestore rules, custom claims, Cloud Functions, atau backend validation pada fase berikutnya.

## 4. Future Route and Files

Planned route:

- `/admin/settings`

Planned files:

- `src/pages/settingsadmin.jsx`
- `src/services/adminSettingsRepository.js`
- `src/services/adminSettingsDefaults.js`
- `src/services/adminSettingsSchema.js`
- optional `src/services/adminSettingsValidation.js`
- optional `src/services/adminSettingsExport.js`

Planned collections:

- `studioSettings`
- `settingsAuditLogs`

Planned nav item:

```js
{
  key: 'settings',
  label: 'Settings',
  helper: 'Kontrol aplikasi',
  icon: Settings2,
  path: '/admin/settings'
}
```

Recommended nav order:

- Booking
- Billing
- Pembukuan
- Customers
- Inventory
- Audit
- Settings

Mobile rules:

- Keep first 4 items in bottom nav.
- Settings should appear in More menu.
- Do not break bottom nav fixed behavior.

## 5. Page Layout Plan

Desktop layout:

- Page header memakai `AdminPageHeader`.
- Command bar memakai `AdminCommandBar` untuk search, export, import, dan status.
- Left section rail untuk navigasi section Settings.
- Main settings panel untuk editor section aktif.
- Right status/health rail optional untuk diagnostics, last saved, source, dan validation summary.
- Sticky save bar muncul saat draft berubah.

Mobile layout:

- Page header compact.
- Search settings input di atas section.
- Horizontal section tabs.
- Current section card stack.
- Sticky bottom save bar di atas admin bottom nav.
- Kontrol lebih compact tetapi tetap readable.
- Tidak boleh ada horizontal page overflow.

Main UI zones:

- Header
- Search/settings command bar
- Section navigator
- Section editor
- Unsaved changes bar
- System status cards
- Audit preview
- Danger zone

## 6. Global UX Rules for Settings

- Edit selalu masuk local draft dulu.
- Validate sebelum save.
- Save per section, bukan setiap keystroke.
- Section punya action discard changes.
- Dirty state harus jelas.
- Last saved timestamp ditampilkan.
- Actor/admin email ditampilkan.
- Setiap save menulis audit log.
- Jika Firestore unavailable, tampilkan fallback/local mode secara eksplisit.
- Dangerous actions disabled sampai confirmation lengkap.
- Dangerous actions butuh two-step confirmation.
- Imported JSON harus schema validated.
- Optimistic UI hanya setelah payload valid dan normalized.
- Error harus readable dalam bahasa Indonesia.

Dangerous action examples: reset settings, import settings JSON, clear local fallback cache, unlock closed bookkeeping month, dan perubahan security policy besar.

## 7. Settings Sections Overview Table

| Section | Purpose | Future data key | Risk level | First implementation phase |
| --- | --- | --- | --- | --- |
| Studio Profile | Identitas bisnis dan metadata studio | `studioProfile` | Low | SETTINGS.4 |
| Operational Policy | Jam operasional dan availability | `operationalPolicy` | Medium | SETTINGS.6 |
| Booking Policy | Default booking, validasi, cancellation, no-show | `bookingPolicy` | High | SETTINGS.6 |
| Pricing & Packages | Rate, paket, add-on, pajak, discount | `pricingPolicy` | High | SETTINGS.7 |
| Billing/POS | Invoice, receipt, payment method, POS behavior | `billingPolicy` | Critical | SETTINGS.7 |
| Bookkeeping | Akun, kategori, import, closing, void-only | `bookkeepingPolicy` | Critical | SETTINGS.8 |
| Inventory & Maintenance | Kategori asset, stock warning, maintenance | `inventoryPolicy` | High | SETTINGS.9 |
| Customer / CRM | Field rules, tags, duplicate warning, retention | `customerPolicy` | Medium | SETTINGS.10 |
| Notifications | Template in-app, WhatsApp, email/push future | `notificationPolicy` | Medium | SETTINGS.11 |
| Appearance / UI | Theme, density, privacy mask, print theme | `appearancePolicy` | Medium | SETTINGS.5 |
| Security / Admin Policy | Role labels, admin policy, confirmation rules | `securityPolicy` | Critical | SETTINGS.13 |
| Data Management | Export/import, backup, local fallback, danger zone | `dataPolicy` | Critical | SETTINGS.12 |
| System Health | Diagnostics, Firebase/Auth/Firestore/local status | `systemPolicy` | Low | SETTINGS.3 |
| Feature Flags | Safe visibility toggles for modules | `featureFlags` | High | SETTINGS.14 |
| Settings Audit | Audit log viewer for settings changes | `settingsAudit` | High | SETTINGS.15 |

## 8. Studio Profile Section

Purpose: control business identity.

Fields:

- `studioName`
- `legalName`
- `address`
- `city`
- `province`
- `country`
- `phone`
- `whatsapp`
- `email`
- `website`
- `instagram`
- `tiktok`
- `youtube`
- `logoUrl`
- `receiptLogoUrl`
- `invoiceLogoUrl`
- `timezone`
- `locale`
- `currency`
- `taxId` optional
- `businessRegistration` optional

Default example:

```js
{
  studioName: "37 Music Studio",
  timezone: "Asia/Jakarta",
  locale: "id-ID",
  currency: "IDR"
}
```

Impacts:

- invoice
- receipt
- reports
- print layouts
- admin header
- future public booking page

Validation:

- `studioName` required.
- `currency` MVP hanya `IDR`.
- `timezone` harus valid.
- `email` optional, tetapi jika diisi harus valid.
- `phone` dan `whatsapp` harus di-trim.

## 9. Operational Policy Section

Purpose: control studio availability.

Fields:

- `weeklyHours` per day
- `holidayDates`
- `blackoutDates`
- `specialOpenDates`
- `slotMinutes`
- `bufferMinutes`
- `minLeadMinutes`
- `maxAdvanceDays`
- `gracePeriodMinutes`
- `defaultSessionDurationMinutes`
- `allowBookingOutsideHours`
- `showClosedDaysInCalendar`

Example:

```js
operationalPolicy: {
  timezone: "Asia/Jakarta",
  weeklyHours: {
    monday: { open: true, start: "10:00", end: "22:00" },
    tuesday: { open: true, start: "10:00", end: "22:00" },
    wednesday: { open: true, start: "10:00", end: "22:00" },
    thursday: { open: true, start: "10:00", end: "22:00" },
    friday: { open: true, start: "10:00", end: "23:00" },
    saturday: { open: true, start: "09:00", end: "23:00" },
    sunday: { open: true, start: "09:00", end: "22:00" }
  },
  slotMinutes: 60,
  bufferMinutes: 0,
  minLeadMinutes: 60,
  maxAdvanceDays: 45,
  gracePeriodMinutes: 15
}
```

Impacts:

- booking calendar
- booking form
- selected slot panel
- availability warning
- future public booking page

Boundary:

- Applies to new bookings only.
- Old bookings remain unchanged.
- If booking exists outside new hours, show warning not auto-delete.

Validation:

- close time after open time
- `slotMinutes` minimum 15
- `bufferMinutes` cannot be negative
- `maxAdvanceDays` reasonable

## 10. Booking Policy Section

Purpose: control booking behavior.

Fields:

- `allowOverlap`
- `requireCustomerName`
- `requireCustomerPhone`
- `requireCustomerEmail`
- `requireDeposit`
- `defaultDepositType`
- `defaultDepositAmount`
- `defaultBookingStatus`
- `defaultPaymentStatus`
- `autoCancelUnpaid`
- `autoCancelAfterMinutes`
- `cancellationAllowed`
- `cancellationCutoffHours`
- `noShowEnabled`
- `noShowThresholdMinutes`
- `statusColorMapping`
- `bookingReminderEnabled`
- `bookingNoteRequired`
- `operatorNoteRequired`
- `customerSourceRequired`

Example:

```js
bookingPolicy: {
  allowOverlap: false,
  requireCustomerPhone: true,
  requireDeposit: false,
  defaultBookingStatus: "pending",
  defaultPaymentStatus: "unpaid",
  cancellationAllowed: true,
  cancellationCutoffHours: 3,
  noShowEnabled: false,
  noShowThresholdMinutes: 30
}
```

Impacts:

- booking form validation
- calendar warning
- booking detail modal
- audit messages
- selected slot panel
- future public booking

Boundary:

- Do not retroactively change existing booking statuses.
- Do not auto-cancel anything until background job/system is explicitly implemented.

## 11. Pricing & Packages Section

Purpose: control rates and commercial rules.

Fields:

- `defaultHourlyRate`
- `weekendHourlyRate`
- `peakHourRate`
- `offPeakRate`
- `overtimeRate`
- `minimumDurationMinutes`
- `roundingMode`
- `taxEnabled`
- `taxRate`
- `serviceFeeEnabled`
- `serviceFeeType`
- `serviceFeeAmount`
- `discountEnabled`
- `maxManualDiscount`
- `packages`
- `addOns`
- `bundleOffers`

Package shape:

```js
{
  id,
  name,
  type: "hourly" | "fixed" | "bundle",
  price,
  durationMinutes,
  active,
  category,
  description
}
```

Add-on shape:

```js
{
  id,
  name,
  price,
  active,
  taxable,
  description
}
```

Impacts:

- booking price suggestion
- invoice draft
- manual POS
- receipt
- revenue report
- customer detail spend summary

Validation:

- rates cannot be negative
- package name required
- package price cannot be negative
- duration minimum 15 minutes
- tax rate 0 to 100

Boundary:

- Price changes affect new invoice drafts only.
- Old invoices remain unchanged.
- If old invoice has old price, preserve snapshot.

## 12. Billing/POS Section

Purpose: control invoices, receipts, payment methods, and POS behavior.

Fields:

- `invoicePrefix`
- `receiptPrefix`
- `numberingReset`: monthly/yearly/never
- `nextInvoiceNumber` preview
- `defaultDueDays`
- `defaultInvoiceStatus`
- `paymentMethods`
- `receiptFooter`
- `invoiceTerms`
- `printPaperSize`
- `showLogoOnReceipt`
- `showOperatorOnReceipt`
- `showCustomerPhoneOnReceipt`
- `autoCreateInvoiceFromBooking`
- `autoSyncBookingPayment`
- `allowPartialPayment`
- `allowOverpayment`
- `roundingMode`
- `defaultPOSCategory`

Important defaults:

- `autoCreateInvoiceFromBooking: false`
- `autoSyncBookingPayment: false`
- `allowPartialPayment: true`

Payment method shape:

```js
{
  id,
  label,
  active,
  accountId,
  requiresReference,
  iconKey
}
```

Impacts:

- Billing page
- POS page
- receipt print
- booking payment preview
- customer billing history
- bookkeeping import suggestions

Boundary:

- `autoSyncBookingPayment` must default false.
- If enabled later, it needs anti-double-update guard and audit log.
- No invoice number reuse.
- Paid invoice should not be edited without explicit adjustment flow.

## 13. Bookkeeping Section

Purpose: control accounts, categories, import rules, closing periods, and financial safety.

Fields:

- `accounts`
- `incomeCategories`
- `expenseCategories`
- `transferCategories`
- `paymentMethodAccountMapping`
- `autoImportBilling`
- `requireReviewBeforeImport`
- `allowEditImportedEntry`
- `deleteMode`
- `voidReasonRequired`
- `monthlyClosingEnabled`
- `monthlyClosingDay`
- `lockedMonths`
- `openingBalanceByAccount`
- `defaultIncomeAccount`
- `defaultExpenseAccount`
- `defaultBillingIncomeCategory`
- `defaultPOSIncomeCategory`
- `defaultMaintenanceExpenseCategory`

Important defaults:

- `autoImportBilling: false`
- `requireReviewBeforeImport: true`
- `allowEditImportedEntry: false`
- `deleteMode: "void-only"`
- `monthlyClosingEnabled: false`

Account shape:

```js
{
  id,
  name,
  type: "cash" | "bank" | "ewallet" | "other",
  active,
  openingBalance,
  colorTone
}
```

Category shape:

```js
{
  id,
  name,
  type: "income" | "expense" | "transfer",
  active,
  reportGroup,
  colorTone
}
```

Impacts:

- bookkeeping ledger
- reports
- billing import suggestions
- POS mapping
- monthly profit/loss
- cashflow

Critical boundary:

- Financial records should not be hard-deleted.
- Existing repository currently has hard delete behavior through `deleteBookkeepingEntry` and Firestore `deleteDoc`. Future implementation must harden it to `void-only` before enabling advanced delete controls.
- Closed months must not be edited without unlock flow and audit log.

Validation:

- at least one active account
- at least one income category
- at least one expense category
- billing auto import requires payment mapping
- monthly close day 1 to 31
- opening balance cannot be NaN

## 14. Inventory & Maintenance Section

Purpose: control inventory behavior, asset categories, stock warnings, and maintenance rules.

Fields:

- `assetCategories`
- `consumableCategories`
- `conditionLabels`
- `lowStockThresholdDefault`
- `allowNegativeStock`
- `requireStockMovementReason`
- `maintenanceReminderDays`
- `defaultMaintenanceIntervalDays`
- `warrantyReminderDays`
- `requireMaintenanceNotes`
- `assetCodePrefix`
- `depreciationEnabled`
- `depreciationMethod`
- `maintenanceStatusLabels`

Impacts:

- inventory form
- low stock alerts
- maintenance scheduler
- asset detail drawer
- audit trail
- future expense mapping to bookkeeping

Boundary:

- Changing low stock threshold updates warnings, not stock values.
- Settings must not mutate stock quantities.
- Maintenance settings should not auto-create expenses unless explicitly integrated later.

## 15. Customer / CRM Section

Purpose: control customer data requirements, tags, duplicate detection, and customer behavior.

Fields:

- `requirePhone`
- `requireEmail`
- `allowDuplicatePhone`
- `duplicateDetectionMode`
- `defaultCustomerSource`
- `customerTags`
- `customerLevels`
- `allowCustomerNotes`
- `dataRetentionMonths`
- `birthdayReminderEnabled`
- `inactiveCustomerAfterDays`
- `showSpendingSummary`
- `showBillingHistory`

Customer tag shape:

```js
{
  id,
  label,
  colorTone,
  active
}
```

Impacts:

- customer form
- booking form
- customer list
- customer detail
- billing history
- CRM filters

Boundary:

- Do not merge duplicates automatically.
- Duplicate detection should warn first.
- Data retention policy must not delete records without explicit confirmed job.

## 16. Notifications Section

Purpose: control templates and notification behavior.

Channels:

- `inApp`
- `whatsappTemplate`
- `email` future
- `push` future

Fields:

- `bookingReminderEnabled`
- `bookingReminderBeforeMinutes`
- `bookingReminderTemplate`
- `invoiceReminderEnabled`
- `invoiceReminderAfterDays`
- `invoiceReminderTemplate`
- `paymentReceivedTemplate`
- `bookingCancelledTemplate`
- `lowStockAlertEnabled`
- `maintenanceAlertEnabled`
- `dailySummaryEnabled`
- `dailySummaryTime`
- `operatorMentionEnabled`
- `whatsappTemplateMode`

Template variables:

- `{{customerName}}`
- `{{studioName}}`
- `{{bookingDate}}`
- `{{bookingTime}}`
- `{{invoiceNumber}}`
- `{{amount}}`
- `{{paymentMethod}}`
- `{{studioWhatsapp}}`

Boundary:

- Do not implement FCM/push in early Settings.
- WhatsApp should be manual template/copy/open link first.
- Actual automated sending requires backend/Cloud Functions.

## 17. Appearance / UI Section

Purpose: control global app look and admin preferences.

Fields:

- `defaultTheme`
- `defaultDensity`
- `allowUserOverride`
- `compactTables`
- `reducedMotion`
- `financialPrivacyMask`
- `defaultAdminRoute`
- `sidebarDefaultCollapsed`
- `mobileBottomNavBehavior`
- `showCommandBarHints`
- `showAdvancedBadges`
- `dashboardDensity`
- `tableRowDensity`
- `receiptPrintTheme`

Important:

- `ThemeProvider` currently stores local mode/density only in `thirty-seven-theme-preferences`.
- Global appearance settings must not unexpectedly override local user preferences.

Rules:

- one component, two palettes
- same layout for dark/light
- no branching layout by theme
- reduced motion can reduce animation intensity, not remove critical UI

Impact:

- admin shell
- all pages
- tables
- cards
- print layouts
- future dashboard

## 18. Security / Admin Policy Section

Purpose: plan admin access and sensitive action policy.

Fields:

- `allowedAdminEmails`
- `roleLabels`
- `requireVerifiedEmail`
- `sensitiveActionConfirmation`
- `requireReasonForDangerousAction`
- `auditSettingsChanges`
- `sessionWarningText`
- `maxFailedLoginDisplayOnly`
- `ownerEmail`
- `emergencyContact`

Roles:

- Owner
- Manager
- Operator
- Viewer

Role capability matrix:

| Role | Capability |
| --- | --- |
| Owner | all settings, billing, bookkeeping, inventory, users, danger zone |
| Manager | booking, billing, customer, inventory, reports, limited settings |
| Operator | booking, customer, limited billing, no danger zone |
| Viewer | read-only reports, no writes |

Critical note: client-side role UI is not real security. Real enforcement must use Firestore rules, custom claims, or backend.

## 19. Data Management Section

Purpose: control export/import, backup, and local fallback data.

Actions:

- export settings JSON
- import settings JSON
- export booking data
- export billing data
- export bookkeeping data
- export customer data
- export inventory data
- export audit logs
- view local fallback status
- clear local fallback cache
- reset settings to default
- create backup snapshot

Danger Zone:

- reset settings to default
- clear local fallback cache
- import settings JSON
- unlock closed bookkeeping month

Danger rules:

- two-step confirmation
- type confirmation text
- show summary before action
- audit log required
- no mass Firestore delete

Validation:

- imported JSON must match `schemaVersion`
- imported JSON must be normalized
- unknown keys ignored or shown as warning
- never execute imported JS/code

## 20. System Health Section

Purpose: show live system diagnostics.

Cards:

- Firebase configured
- Auth ready
- Firestore status
- Booking subscription status
- Billing subscription status
- Bookkeeping subscription status
- Settings subscription status
- localStorage availability
- app version
- environment mode
- last sync time
- active admin email
- route health
- feature flags loaded

Health states:

- ready
- degraded
- local fallback
- offline
- error

Actions:

- refresh diagnostics
- copy diagnostic report
- open troubleshooting guide future

## 21. Feature Flags Section

Purpose: turn experimental/advanced modules on/off safely.

Flags:

```js
{
  enableBookkeepingReports,
  enableBillingImportToBookkeeping,
  enableInventoryMaintenanceScheduler,
  enableCustomerBillingHistory,
  enablePushNotifications,
  enablePublicBookingPage,
  enableAdvancedRoles,
  enableDataExport,
  enableSettingsAuditPanel,
  enableReceiptLogo,
  enablePricingPackages,
  enableOperationalHoursValidation
}
```

Rules:

- Flags can hide/show features.
- Flags must not delete or mutate old data.
- Turning off a feature hides controls but preserves data.
- Turning on a feature may require settings validation first.

## 22. Settings Audit Section

Purpose: track all Settings changes.

Show:

- recent changes
- section
- changed keys
- actor
- timestamp
- before/after summary
- source: firestore/local
- filter by section/action/admin
- export audit future

Audit action types:

- `settings.create`
- `settings.update`
- `settings.import`
- `settings.reset`
- `settings.feature_flag_update`
- `settings.danger_action`
- `settings.unlock_month`
- `settings.clear_local_cache`

## 23. Proposed Data Model

```js
{
  id: "main-studio",
  schemaVersion: 1,
  studioId: "main-studio",

  studioProfile: {
    studioName: "37 Music Studio",
    legalName: "",
    address: "",
    city: "",
    province: "",
    country: "Indonesia",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    logoUrl: "",
    receiptLogoUrl: "",
    invoiceLogoUrl: "",
    timezone: "Asia/Jakarta",
    locale: "id-ID",
    currency: "IDR",
    taxId: "",
    businessRegistration: ""
  },

  operationalPolicy: {},
  bookingPolicy: {},
  pricingPolicy: {},
  billingPolicy: {},
  bookkeepingPolicy: {},
  inventoryPolicy: {},
  customerPolicy: {},
  notificationPolicy: {},
  appearancePolicy: {},
  securityPolicy: {},
  dataPolicy: {},
  systemPolicy: {},
  featureFlags: {},

  createdAt: "...",
  updatedAt: "...",
  updatedBy: {
    uid: "",
    email: "",
    displayName: ""
  }
}
```

Storage target: `studioSettings/main-studio`.

## 24. Proposed Settings Audit Model

```js
{
  id: "settings-audit-...",
  studioId: "main-studio",
  action: "settings.update",
  section: "billingPolicy",
  label: "Billing settings updated",
  before: {},
  after: {},
  changedKeys: [],
  at: "...",
  by: {
    uid: "",
    email: "",
    displayName: ""
  },
  source: "admin-settings",
  schemaVersion: 1
}
```

Storage target: `settingsAuditLogs`.

## 25. Future Repository Plan

Future file: `src/services/adminSettingsRepository.js`.

Exports:

- `getDefaultStudioSettings`
- `normalizeStudioSettings`
- `normalizeSettingsSection`
- `validateSettingsSection`
- `subscribeStudioSettings`
- `updateStudioSettingsSection`
- `recordSettingsAuditLog`
- `subscribeSettingsAuditLogs`
- `exportStudioSettingsJson`
- `importStudioSettingsJson`

Repository requirements:

- Firestore + localStorage fallback
- no hard delete
- idempotent normalizers
- schemaVersion handling
- migration helper for future schemaVersion
- always audit changes
- never save invalid section
- never execute imported content

Storage keys:

- `thirty-seven-admin-studio-settings`
- `thirty-seven-admin-settings-audit-logs`

Collections:

- `studioSettings`
- `settingsAuditLogs`

Document:

- `studioSettings/main-studio`

## 26. Firestore Rules Draft

Draft only. Do not apply in SETTINGS.0.

```js
match /studioSettings/{studioId} {
  allow read: if isAdmin();
  allow create, update: if isAdmin();
  allow delete: if false;
}

match /settingsAuditLogs/{auditLogId} {
  allow read, create: if isAdmin();
  allow update, delete: if false;
}
```

Future advanced roles require:

- custom claims
- role documents
- backend validation
- stricter rules

## 27. Validation Rules

Validation examples:

- studioName required
- timezone valid
- currency MVP IDR
- close time after open time
- slotMinutes >= 15
- maxAdvanceDays > 0
- defaultHourlyRate >= 0
- overtimeRate >= 0
- package names unique
- invoicePrefix required
- receiptPrefix required
- at least one payment method active
- autoImportBilling requires account mapping
- at least one bookkeeping account active
- deleteMode must be void-only for financial safety
- monthlyClosingDay between 1 and 31
- lowStockThreshold >= 0
- requireVerifiedEmail cannot be enforced only on UI
- imported JSON schemaVersion must match or migrate
- unknown imported fields must not crash app

## 28. Integration Boundaries Per Module

Booking:

- Can provide defaults and validation.
- Cannot rewrite historical bookings.

Billing:

- Can provide invoice prefix/payment methods.
- Cannot rewrite paid invoices.

Bookkeeping:

- Can provide categories/accounts/import policy.
- Cannot hard delete financial records.

Inventory:

- Can provide thresholds/categories.
- Cannot mutate stock.

Customer:

- Can provide field rules/tags.
- Cannot merge or delete customers automatically.

Theme/UI:

- Can provide global defaults.
- Cannot branch layout by theme.

Security:

- Can display policies.
- Cannot pretend client-only role checks are real security.

Data:

- Can export/import settings.
- Cannot mass delete Firestore.

## 29. Implementation Roadmap

SETTINGS.0 Masterplan document

- create `docs/settings-page-full-masterplan.md`

SETTINGS.1 Route/nav shell

- add `/admin/settings`
- add Settings nav item
- create `settingsadmin.jsx` read-only shell
- show section map and system cards
- no writes

SETTINGS.2 Repository/default schema

- create `adminSettingsRepository.js`
- defaults, normalizer, validator
- Firestore + local fallback
- settings audit log
- no integration yet

SETTINGS.3 Settings dashboard/read model

- subscribe settings
- show current settings
- show system health
- show dirty state shell
- no risky integrations

SETTINGS.4 Studio Profile editor

- edit studio profile
- save section
- audit log
- validation

SETTINGS.5 Appearance editor

- default theme/density policy
- local override explanation
- no theme layout branch

SETTINGS.6 Operational + Booking editor

- operating hours
- booking rules
- validation
- integrate only warnings/defaults for new bookings

SETTINGS.7 Pricing + Billing editor

- packages
- rates
- invoice prefix
- receipt footer
- payment methods
- integrate into billing draft/POS

SETTINGS.8 Bookkeeping editor

- accounts
- categories
- payment mapping
- auto import policy
- require void-only hardening first

SETTINGS.9 Inventory editor

- categories
- thresholds
- maintenance settings

SETTINGS.10 Customer/CRM editor

- required fields
- tags
- duplicate warning policy

SETTINGS.11 Notification templates

- in-app and WhatsApp template only
- push future disabled

SETTINGS.12 Data management

- export settings
- import settings
- backup
- local fallback status
- danger zone

SETTINGS.13 Security policy display

- admin emails
- role labels
- capability matrix
- no true enforcement until rules/custom claims

SETTINGS.14 Feature flags

- UI toggles
- audit every flag change
- preserve data when off

SETTINGS.15 Settings audit panel

- show `settingsAuditLogs`
- filter/search
- diff summary

SETTINGS.16 Module integration QA

- validate all settings integration
- no historical mutation
- no CSS regression
- mobile safe

SETTINGS.17 Final hardening

- permission notes
- rules draft
- data migration guide
- full lint/test/build

## 30. Recommended MVP

Recommended MVP order:

1. SETTINGS.1 Route/nav shell
2. SETTINGS.2 Repository/default schema
3. SETTINGS.3 Dashboard/read model
4. SETTINGS.4 Studio Profile editor
5. SETTINGS.5 Appearance editor
6. SETTINGS.7 Billing/POS basics
7. SETTINGS.8 Bookkeeping accounts/categories

Why:

- high value
- low risk
- foundation for future modules
- avoids dangerous automation first

## 31. Risk Register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Settings accidentally mutates old data | Histori booking/billing/pembukuan berubah tanpa izin | Batasi Settings ke default/future behavior, migration eksplisit, audit wajib |
| Auto billing sync double updates booking | Revenue/status menjadi dobel atau salah | `autoSyncBookingPayment` default false, anti-double-update guard, audit log |
| Financial hard delete | Bukti transaksi hilang | Harden bookkeeping ke void-only sebelum advanced delete controls |
| Role UI mistaken for security | Admin policy terlihat aman tetapi bypassable | Tulis client UI sebagai display only, enforce lewat rules/custom claims/backend |
| Imported JSON corrupts settings | App gagal load atau policy rusak | Schema validation, normalizer, migration, ignore/warn unknown fields |
| Mobile scroll regression | Settings sulit dipakai di PWA mobile | Horizontal tabs, sticky save bar above bottom nav, no overflow hacks |
| Theme layout branching | Dark/light berbeda layout dan rawan bug | Enforce one component, two palettes |
| Firestore permission/index error | Settings tidak bisa load/save | Health state, readable error, local fallback, rules draft only |
| Local fallback divergence | Data local berbeda dengan Firestore | Show source, last sync, export backup, reconcile future phase |
| Feature flag hides data unexpectedly | User mengira data hilang | Turning off feature only hides controls, data preserved, warning copy |

## 32. QA Checklist

- [ ] npm run lint pass
- [ ] npm test pass
- [ ] npm run build pass
- [ ] no CSS changes in SETTINGS.0
- [ ] no route changes in SETTINGS.0
- [ ] no source logic changes in SETTINGS.0
- [ ] Settings plan created
- [ ] all required sections present
- [ ] no dark/light layout branching
- [ ] no destructive behavior planned without confirmation
- [ ] Firestore rules are draft only
- [ ] mobile bottom nav not touched
- [ ] settings changes future must be audited
- [ ] invalid settings cannot be saved
- [ ] local fallback planned
- [ ] Firebase not configured state planned
- [ ] imported JSON validation planned
- [ ] financial delete uses void-only plan

## 33. Catatan untuk Codex Fase Berikutnya

- Always inspect current source before patching.
- Use Node .cjs scripts.
- Be idempotent.
- Backup before write.
- Stop on missing anchors.
- Do not use brittle indentation anchors.
- Prefer scanner functions for function replacement.
- Do not rewrite entire files.
- Do not add CSS performance hacks.
- Run lint/test/build before commit.
- Commit per phase only.

## Guard Summary SETTINGS.0

- Tidak ada route `/admin/settings` yang dibuat pada fase ini.
- Tidak ada file `src/pages/settingsadmin.jsx` yang dibuat pada fase ini.
- Tidak ada file `src/services/adminSettingsRepository.js` yang dibuat pada fase ini.
- Tidak ada CSS yang diubah.
- Tidak ada dependency yang ditambah.
- Tidak ada `package.json` yang diubah.
- Tidak ada Firestore rules yang diterapkan.
- Tidak ada source logic yang berubah.

