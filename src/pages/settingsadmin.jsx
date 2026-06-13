import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useOutletContext } from 'react-router';
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Boxes,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  CreditCard,
  Database,
  FileClock,
  Flag,
  Gauge,
  LockKeyhole,
  Paintbrush,
  ReceiptText,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import { isFirebaseConfigured } from '../lib/firebase.js';
import { useTheme } from '../theme/ThemeProvider.jsx';
import {
  AdminBadge,
  AdminButton,
  AdminPageShell,
  AdminPanel,
} from '../components/admin/AdminPrimitives.jsx';
import {
  adminSettingsRepository,
  validateStudioSettings,
} from '../services/adminSettingsRepository.js';

const settingsSections = [
  {
    key: 'studioProfile',
    label: 'Studio Profile',
    helper: 'Identitas bisnis, logo, kontak, timezone, locale, dan currency.',
    icon: Building2,
    phase: 'SETTINGS.5',
    risk: 'Low',
    tone: 'cyan',
  },
  {
    key: 'operationalPolicy',
    label: 'Operational Policy',
    helper: 'Jam operasional, holiday, slot, buffer, dan batas advance booking.',
    icon: CalendarClock,
    phase: 'SETTINGS.6',
    risk: 'Medium',
    tone: 'purple',
  },
  {
    key: 'bookingPolicy',
    label: 'Booking Policy',
    helper: 'Default booking, overlap, deposit, cancellation, dan no-show.',
    icon: ClipboardCheck,
    phase: 'SETTINGS.6',
    risk: 'High',
    tone: 'accent',
  },
  {
    key: 'pricingPolicy',
    label: 'Pricing & Packages',
    helper: 'Rate, paket, add-on, pajak, fee, dan discount policy.',
    icon: ReceiptText,
    phase: 'SETTINGS.7',
    risk: 'High',
    tone: 'accent',
  },
  {
    key: 'billingPolicy',
    label: 'Billing/POS',
    helper: 'Invoice prefix, receipt, payment method, POS, dan sync boundary.',
    icon: CreditCard,
    phase: 'SETTINGS.7',
    risk: 'Critical',
    tone: 'accent',
  },
  {
    key: 'bookkeepingPolicy',
    label: 'Bookkeeping',
    helper: 'Akun, kategori, import billing, closing, dan void-only safety.',
    icon: WalletCards,
    phase: 'SETTINGS.8',
    risk: 'Critical',
    tone: 'accent',
  },
  {
    key: 'inventoryPolicy',
    label: 'Inventory & Maintenance',
    helper: 'Kategori aset, low stock, stock movement reason, dan maintenance.',
    icon: Boxes,
    phase: 'SETTINGS.9',
    risk: 'High',
    tone: 'purple',
  },
  {
    key: 'customerPolicy',
    label: 'Customer / CRM',
    helper: 'Required fields, duplicate warning, tags, levels, dan retention.',
    icon: UsersRound,
    phase: 'SETTINGS.10',
    risk: 'Medium',
    tone: 'purple',
  },
  {
    key: 'notificationPolicy',
    label: 'Notifications',
    helper: 'Template in-app dan WhatsApp; email/push tetap future.',
    icon: Bell,
    phase: 'SETTINGS.11',
    risk: 'Medium',
    tone: 'purple',
  },
  {
    key: 'appearancePolicy',
    label: 'Appearance / UI',
    helper: 'Theme default, density, privacy mask, dan print theme.',
    icon: Paintbrush,
    phase: 'SETTINGS.5',
    risk: 'Medium',
    tone: 'cyan',
  },
  {
    key: 'securityPolicy',
    label: 'Security / Admin Policy',
    helper: 'Role labels, sensitive action rules, dan security boundaries.',
    icon: LockKeyhole,
    phase: 'SETTINGS.13',
    risk: 'Critical',
    tone: 'accent',
  },
  {
    key: 'dataPolicy',
    label: 'Data Management',
    helper: 'Export/import, backup, local fallback status, dan danger zone.',
    icon: Database,
    phase: 'SETTINGS.12',
    risk: 'Critical',
    tone: 'accent',
  },
  {
    key: 'systemPolicy',
    label: 'System Health',
    helper: 'Firebase, Auth, Firestore, subscriptions, version, dan diagnostics.',
    icon: Gauge,
    phase: 'SETTINGS.3',
    risk: 'Low',
    tone: 'cyan',
  },
  {
    key: 'featureFlags',
    label: 'Feature Flags',
    helper: 'Toggle visibility fitur tanpa menghapus data yang sudah ada.',
    icon: Flag,
    phase: 'SETTINGS.14',
    risk: 'High',
    tone: 'purple',
  },
  {
    key: 'settingsAudit',
    label: 'Settings Audit',
    helper: 'Riwayat perubahan Settings, actor, section, changed keys, dan diff.',
    icon: FileClock,
    phase: 'SETTINGS.15',
    risk: 'High',
    tone: 'purple',
  },
];

const guardItems = [
  'Settings write pada SETTINGS.6 hanya Studio Profile, Appearance, Operational, dan Booking Policy per section.',
  'Tidak ada CSS baru atau dependency baru.',
  'Dark/light tetap memakai DOM dan layout yang sama.',
  'Financial delete harus menuju void-only sebelum editor Bookkeeping aktif.',
  'Client-side role UI bukan real security.',
];

function getRiskTone(risk) {
  if (risk === 'Critical' || risk === 'High') {
    return 'accent';
  }

  if (risk === 'Medium') {
    return 'purple';
  }

  return 'cyan';
}

function SettingsSectionCard({ section }) {
  const SectionIcon = section.icon;
  const isEditableNow = ['studioProfile', 'appearancePolicy', 'operationalPolicy', 'bookingPolicy'].includes(section.key);

  return (
    <AdminPanel as="article" className="grid min-w-0 gap-2 p-2.5" variant="flat">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent ring-1 ring-[var(--ui-ring)]">
          <SectionIcon size={15} strokeWidth={2.35} aria-hidden="true" />
        </span>

        <div className="grid min-w-0 flex-1 gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="m-0 min-w-0 text-sm font-semibold tracking-[-0.03em] text-[var(--ui-text-strong)]">
              {section.label}
            </h2>
            <AdminBadge tone={getRiskTone(section.risk)}>{section.risk}</AdminBadge>
          </div>

          <p className="m-0 line-clamp-2 text-[0.72rem] font-medium leading-5 text-[var(--ui-text-muted)]">
            {section.helper}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-[var(--ui-border)] pt-2">
        <AdminBadge tone={section.tone}>{section.phase}</AdminBadge>
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-soft)]">
          {isEditableNow ? 'Editable now' : 'Read-only map'}
        </span>
      </div>
    </AdminPanel>
  );
}

function SystemStatusCard({ item }) {
  const ItemIcon = item.icon;

  return (
    <AdminPanel className="grid min-w-0 gap-1.5 p-2.5" variant="solid">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="truncate text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
          {item.label}
        </span>
        <AdminBadge className="size-7 shrink-0 justify-center px-0" tone={item.tone}>
          <ItemIcon size={13} strokeWidth={2.35} aria-hidden="true" />
        </AdminBadge>
      </div>

      <strong className="truncate text-base font-semibold leading-tight tracking-[-0.035em] text-[var(--ui-text-strong)]">
        {item.value}
      </strong>

      <p className="m-0 line-clamp-2 text-[0.7rem] font-medium leading-4 text-[var(--ui-text-muted)]">
        {item.helper}
      </p>
    </AdminPanel>
  );
}

function formatSettingsTimestamp(value) {
  if (!value) {
    return 'Belum tersimpan';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getSettingsSourceLabel(errorMessage) {
  if (errorMessage) {
    return 'Local fallback';
  }

  return isFirebaseConfigured ? 'Firestore' : 'Local fallback';
}

function SettingsPageHeader({
  adminUser,
  readinessSummary,
  settings,
  settingsErrorMessage,
}) {
  return (
    <header className="grid gap-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-3 ring-1 ring-[var(--ui-ring)] md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="grid min-w-0 gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <AdminBadge icon={Settings2} tone="strong">/admin/settings</AdminBadge>
          <AdminBadge icon={Save} tone="cyan">Profile + UI + Booking rules</AdminBadge>
          <AdminBadge icon={Database} tone={settingsErrorMessage ? 'purple' : 'cyan'}>
            {getSettingsSourceLabel(settingsErrorMessage)}
          </AdminBadge>
        </div>

        <div className="grid min-w-0 gap-1">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-studio-accent">
            SETTINGS.4
          </span>
          <h1 className="m-0 text-3xl font-semibold leading-none tracking-[-0.045em] text-[var(--ui-text-strong)] md:text-4xl">
            Settings
          </h1>
          <p className="m-0 max-w-3xl text-sm font-medium leading-6 text-[var(--ui-text-muted)]">
            Edit profil studio, appearance, jam operasional, dan booking policy tanpa mengubah data historis.
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap gap-2 md:justify-end">
        <AdminBadge icon={BadgeCheck} tone={readinessSummary.tone}>
          {readinessSummary.readyCount}/{readinessSummary.totalCount} read models
        </AdminBadge>
        <AdminBadge icon={Clock3} tone="neutral">
          {formatSettingsTimestamp(settings.updatedAt)}
        </AdminBadge>
        <AdminBadge icon={UsersRound} tone="neutral">
          {adminUser?.email || 'Admin session'}
        </AdminBadge>
      </div>
    </header>
  );
}

function SettingsSnapshotPanel({ settings, validation }) {
  const profile = settings.studioProfile;
  const billing = settings.billingPolicy;
  const bookkeeping = settings.bookkeepingPolicy;
  const appearance = settings.appearancePolicy;
  const operational = settings.operationalPolicy;

  const snapshotItems = [
    {
      label: 'Studio',
      value: profile.studioName,
      helper: `${profile.timezone} / ${profile.locale} / ${profile.currency}`,
      tone: 'cyan',
    },
    {
      label: 'Booking slot',
      value: `${operational.slotMinutes} menit`,
      helper: `Advance ${operational.maxAdvanceDays} hari, lead ${operational.minLeadMinutes} menit`,
      tone: 'purple',
    },
    {
      label: 'Billing sync',
      value: billing.autoSyncBookingPayment ? 'On' : 'Off',
      helper: 'autoSyncBookingPayment default aman tetap off.',
      tone: billing.autoSyncBookingPayment ? 'accent' : 'cyan',
    },
    {
      label: 'Financial delete',
      value: bookkeeping.deleteMode,
      helper: 'Pembukuan harus void-only sebelum editor aktif.',
      tone: bookkeeping.deleteMode === 'void-only' ? 'cyan' : 'accent',
    },
    {
      label: 'Appearance',
      value: `${appearance.defaultTheme} / ${appearance.defaultDensity}`,
      helper: 'Global default tidak memaksa user override lokal.',
      tone: 'purple',
    },
    {
      label: 'Validation',
      value: validation.isValid ? 'Valid' : 'Needs review',
      helper: validation.isValid ? 'Semua section default/read model valid.' : validation.errors[0],
      tone: validation.isValid ? 'cyan' : 'accent',
    },
  ];

  return (
    <AdminPanel className="grid gap-3 p-3" variant="default">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h2 className="m-0 text-base font-semibold tracking-[-0.035em] text-[var(--ui-text-strong)]">
            Settings snapshot
          </h2>
          <p className="m-0 text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
            Ringkasan `studioSettings/main-studio` untuk sanity check operator.
          </p>
        </div>
        <AdminBadge icon={Database} tone="strong">
          schema v{settings.schemaVersion}
        </AdminBadge>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {snapshotItems.map((item) => (
          <div
            className="grid min-w-0 gap-1 rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] p-2.5 ring-1 ring-[var(--ui-ring)]"
            key={item.label}
          >
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
              {item.label}
            </span>
            <strong className="truncate text-sm font-semibold tracking-[-0.02em] text-[var(--ui-text-strong)]">
              {item.value}
            </strong>
            <span className="line-clamp-2 text-[0.72rem] font-medium leading-5 text-[var(--ui-text-muted)]">
              {item.helper}
            </span>
          </div>
        ))}
      </div>
    </AdminPanel>
  );
}

function StudioProfileField({
  className = '',
  label,
  name,
  type = 'text',
  value,
  onChange,
}) {
  return (
    <label className={`grid min-w-0 gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)] ${className}`}>
      {label}
      <input
        className="min-h-10 w-full min-w-0 rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 text-sm font-semibold normal-case tracking-normal text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition placeholder:text-[var(--ui-text-soft)] focus:border-studio-accent/55 focus:ring-4 focus:ring-studio-accent/20"
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
      />
    </label>
  );
}

function StudioProfileGroup({ children, title }) {
  return (
    <section className="grid gap-3 border-t border-[var(--ui-border)] pt-3 first:border-t-0 first:pt-0">
      <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
        {title}
      </h3>
      {children}
    </section>
  );
}

function StudioProfileEditor({
  draft,
  isDirty,
  isSaving,
  lastSavedAt,
  saveError,
  saveStatus,
  validation,
  onChange,
  onDiscard,
  onSave,
}) {
  const safeDraft = draft || adminSettingsRepository.getDefaultStudioSettings().studioProfile;
  const canSave = isDirty && !isSaving && validation.isValid;

  return (
    <AdminPanel className="grid gap-3 p-3" variant="default">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div className="grid gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="m-0 text-base font-semibold tracking-[-0.035em] text-[var(--ui-text-strong)]">
              Studio Profile editor
            </h2>
            <AdminBadge tone={isDirty ? 'purple' : 'cyan'}>
              {isDirty ? 'Draft changed' : 'Clean'}
            </AdminBadge>
            <AdminBadge tone={validation.isValid ? 'cyan' : 'accent'}>
              {validation.isValid ? 'Valid' : 'Needs review'}
            </AdminBadge>
          </div>

          <p className="m-0 text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
            Save hanya mengubah `studioProfile`; booking, billing, pembukuan, customer, dan inventory tetap read-only.
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap gap-2 md:justify-end">
          <AdminButton
            className="min-w-[6.5rem]"
            disabled={!isDirty || isSaving}
            icon={RotateCcw}
            size="sm"
            variant="secondary"
            onClick={onDiscard}
          >
            Discard
          </AdminButton>
          <AdminButton
            className="min-w-[7.5rem]"
            disabled={!canSave}
            icon={Save}
            size="sm"
            variant="primary"
            onClick={onSave}
          >
            {isSaving ? 'Saving...' : 'Save profile'}
          </AdminButton>
        </div>
      </div>

      {validation.errors.length > 0 ? (
        <div className="rounded-md border border-studio-accent/30 bg-studio-accent/10 p-3 text-xs font-semibold leading-5 text-studio-accent">
          {validation.errors[0]}
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-md border border-studio-accent/30 bg-studio-accent/10 p-3 text-xs font-semibold leading-5 text-studio-accent">
          {saveError}
        </div>
      ) : null}

      {saveStatus === 'saved' ? (
        <div className="rounded-md border border-studio-cyan/30 bg-studio-cyan/10 p-3 text-xs font-semibold leading-5 text-studio-cyan">
          Studio Profile tersimpan. Audit log Settings ikut dicatat.
        </div>
      ) : null}

      <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
        <div className="grid min-w-0 gap-3">
          <StudioProfileGroup title="Identity">
            <div className="grid min-w-0 gap-3 md:grid-cols-12">
              <StudioProfileField className="md:col-span-4" label="Studio name" name="studioName" value={safeDraft.studioName} onChange={onChange} />
              <StudioProfileField className="md:col-span-4" label="Legal name" name="legalName" value={safeDraft.legalName} onChange={onChange} />
              <StudioProfileField className="md:col-span-4" label="Email" name="email" type="email" value={safeDraft.email} onChange={onChange} />
              <StudioProfileField className="md:col-span-12" label="Address" name="address" value={safeDraft.address} onChange={onChange} />
              <StudioProfileField className="md:col-span-4" label="City" name="city" value={safeDraft.city} onChange={onChange} />
              <StudioProfileField className="md:col-span-4" label="Province" name="province" value={safeDraft.province} onChange={onChange} />
              <StudioProfileField className="md:col-span-4" label="Country" name="country" value={safeDraft.country} onChange={onChange} />
            </div>
          </StudioProfileGroup>

          <StudioProfileGroup title="Contact and channels">
            <div className="grid min-w-0 gap-3 md:grid-cols-12">
              <StudioProfileField className="md:col-span-4" label="Phone" name="phone" value={safeDraft.phone} onChange={onChange} />
              <StudioProfileField className="md:col-span-4" label="WhatsApp" name="whatsapp" value={safeDraft.whatsapp} onChange={onChange} />
              <StudioProfileField className="md:col-span-4" label="Website" name="website" value={safeDraft.website} onChange={onChange} />
              <StudioProfileField className="md:col-span-3" label="Instagram" name="instagram" value={safeDraft.instagram} onChange={onChange} />
              <StudioProfileField className="md:col-span-3" label="TikTok" name="tiktok" value={safeDraft.tiktok} onChange={onChange} />
              <StudioProfileField className="md:col-span-3" label="YouTube" name="youtube" value={safeDraft.youtube} onChange={onChange} />
            </div>
          </StudioProfileGroup>

          <StudioProfileGroup title="Locale and legal">
            <div className="grid min-w-0 gap-3 md:grid-cols-12">
              <StudioProfileField className="md:col-span-3" label="Timezone" name="timezone" value={safeDraft.timezone} onChange={onChange} />
              <StudioProfileField className="md:col-span-3" label="Locale" name="locale" value={safeDraft.locale} onChange={onChange} />
              <StudioProfileField className="md:col-span-3" label="Currency" name="currency" value={safeDraft.currency} onChange={onChange} />
              <StudioProfileField className="md:col-span-6" label="Tax ID" name="taxId" value={safeDraft.taxId} onChange={onChange} />
              <StudioProfileField className="md:col-span-6" label="Business reg." name="businessRegistration" value={safeDraft.businessRegistration} onChange={onChange} />
            </div>
          </StudioProfileGroup>
        </div>

        <aside className="grid min-w-0 gap-3">
          <div className="grid gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] p-3 ring-1 ring-[var(--ui-ring)]">
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
              Save state
            </span>
            <strong className="text-sm font-semibold text-[var(--ui-text-strong)]">
              {isSaving ? 'Saving profile...' : saveStatus === 'saved' ? 'Saved' : isDirty ? 'Unsaved draft' : 'No draft changes'}
            </strong>
            <span className="text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
              Last saved: {formatSettingsTimestamp(lastSavedAt)}
            </span>
          </div>

          <div className="grid gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-3 ring-1 ring-[var(--ui-ring)]">
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
              Boundary
            </span>
            <p className="m-0 text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
              Field ini tidak mengubah histori transaksi dan tidak membuka write path untuk section finansial.
            </p>
          </div>
        </aside>
      </div>
    </AdminPanel>
  );
}

function AppearanceChoiceField({
  helper = '',
  label,
  name,
  options,
  value,
  onChange,
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
      {label}
      <select
        className="min-h-10 w-full min-w-0 rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 text-sm font-semibold normal-case tracking-normal text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition focus:border-studio-accent/55 focus:ring-4 focus:ring-studio-accent/20"
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
      >
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      {helper ? (
        <span className="text-[0.68rem] font-medium normal-case leading-5 tracking-normal text-[var(--ui-text-soft)]">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

function AppearanceToggleField({
  helper,
  label,
  name,
  checked,
  onChange,
}) {
  return (
    <button
      aria-checked={checked}
      className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] p-3 text-left ring-1 ring-[var(--ui-ring)] transition hover:bg-[var(--ui-control-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
      role="switch"
      type="button"
      onClick={() => onChange(name, !checked)}
    >
      <span className="grid min-w-0 gap-1">
        <span className="text-xs font-semibold tracking-[-0.01em] text-[var(--ui-text-strong)]">
          {label}
        </span>
        <span className="text-[0.7rem] font-medium leading-5 text-[var(--ui-text-muted)]">
          {helper}
        </span>
      </span>
      <span
        className={`relative h-7 w-12 rounded-full border ring-1 transition ${
          checked
            ? 'border-studio-cyan/30 bg-studio-cyan/18 ring-studio-cyan/16'
            : 'border-[var(--ui-border)] bg-[var(--ui-glass-soft)] ring-[var(--ui-ring)]'
        }`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-1 grid size-5 place-items-center rounded-full bg-[var(--ui-bg-base)] shadow-[var(--ui-shadow-control)] transition-transform ${
            checked ? 'translate-x-6 text-studio-cyan' : 'translate-x-1 text-[var(--ui-text-soft)]'
          }`}
        />
      </span>
    </button>
  );
}

function AppearancePolicyEditor({
  draft,
  isDirty,
  isSaving,
  lastSavedAt,
  localDensityMode,
  localThemeMode,
  saveError,
  saveStatus,
  validation,
  onChange,
  onDiscard,
  onSave,
}) {
  const safeDraft = draft || adminSettingsRepository.getDefaultStudioSettings().appearancePolicy;
  const canSave = isDirty && !isSaving && validation.isValid;

  const themeOptions = [
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
    { value: 'system', label: 'System preference' },
  ];

  const densityOptions = [
    { value: 'comfortable', label: 'Comfortable' },
    { value: 'compact', label: 'Compact' },
  ];

  const routeOptions = [
    { value: '/admin/bookings', label: 'Booking' },
    { value: '/admin/billing', label: 'Billing' },
    { value: '/admin/bookkeeping', label: 'Pembukuan' },
    { value: '/admin/customers', label: 'Customers' },
    { value: '/admin/inventory', label: 'Inventory' },
    { value: '/admin/audit', label: 'Audit' },
    { value: '/admin/settings', label: 'Settings' },
  ];

  const bottomNavOptions = [
    { value: 'fixed', label: 'Fixed bottom bar' },
    { value: 'compact', label: 'Compact bottom bar' },
  ];

  const printThemeOptions = [
    { value: 'default', label: 'Default receipt' },
    { value: 'minimal', label: 'Minimal receipt' },
    { value: 'studio', label: 'Studio branded' },
  ];

  return (
    <AdminPanel className="grid gap-3 p-3" variant="default">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div className="grid gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="m-0 text-base font-semibold tracking-[-0.035em] text-[var(--ui-text-strong)]">
              Appearance / UI editor
            </h2>
            <AdminBadge tone={isDirty ? 'purple' : 'cyan'}>
              {isDirty ? 'Draft changed' : 'Clean'}
            </AdminBadge>
            <AdminBadge tone={validation.isValid ? 'cyan' : 'accent'}>
              {validation.isValid ? 'Valid' : 'Needs review'}
            </AdminBadge>
          </div>

          <p className="m-0 text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
            Save hanya mengubah appearancePolicy. ThemeProvider lokal tetap aman memakai preferensi device/browser user.
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap gap-2 md:justify-end">
          <AdminButton
            className="min-w-[6.5rem]"
            disabled={!isDirty || isSaving}
            icon={RotateCcw}
            size="sm"
            variant="secondary"
            onClick={onDiscard}
          >
            Discard
          </AdminButton>
          <AdminButton
            className="min-w-[8rem]"
            disabled={!canSave}
            icon={Save}
            size="sm"
            variant="primary"
            onClick={onSave}
          >
            {isSaving ? 'Saving...' : 'Save appearance'}
          </AdminButton>
        </div>
      </div>

      {validation.errors.length > 0 ? (
        <div className="rounded-md border border-studio-accent/30 bg-studio-accent/10 p-3 text-xs font-semibold leading-5 text-studio-accent">
          {validation.errors[0]}
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-md border border-studio-accent/30 bg-studio-accent/10 p-3 text-xs font-semibold leading-5 text-studio-accent">
          {saveError}
        </div>
      ) : null}

      {saveStatus === 'saved' ? (
        <div className="rounded-md border border-studio-cyan/30 bg-studio-cyan/10 p-3 text-xs font-semibold leading-5 text-studio-cyan">
          Appearance policy tersimpan. Tidak ada perubahan otomatis ke preferensi lokal user.
        </div>
      ) : null}

      <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
        <div className="grid min-w-0 gap-3">
          <section className="grid gap-3 border-t border-[var(--ui-border)] pt-3 first:border-t-0 first:pt-0">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
              Global defaults
            </h3>

            <div className="grid min-w-0 gap-3 md:grid-cols-12">
              <div className="md:col-span-4">
                <AppearanceChoiceField
                  helper="Default global untuk user baru. Tidak memaksa user lama."
                  label="Default theme"
                  name="defaultTheme"
                  options={themeOptions}
                  value={safeDraft.defaultTheme}
                  onChange={onChange}
                />
              </div>
              <div className="md:col-span-4">
                <AppearanceChoiceField
                  helper="Default global untuk density admin."
                  label="Default density"
                  name="defaultDensity"
                  options={densityOptions}
                  value={safeDraft.defaultDensity}
                  onChange={onChange}
                />
              </div>
              <div className="md:col-span-4">
                <AppearanceChoiceField
                  helper="Halaman admin awal setelah login atau redirect."
                  label="Default admin route"
                  name="defaultAdminRoute"
                  options={routeOptions}
                  value={safeDraft.defaultAdminRoute}
                  onChange={onChange}
                />
              </div>
            </div>
          </section>

          <section className="grid gap-3 border-t border-[var(--ui-border)] pt-3">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
              Tables, dashboard, and privacy
            </h3>

            <div className="grid min-w-0 gap-3 md:grid-cols-12">
              <div className="md:col-span-4">
                <AppearanceChoiceField
                  helper="Density default untuk dashboard cards."
                  label="Dashboard density"
                  name="dashboardDensity"
                  options={densityOptions}
                  value={safeDraft.dashboardDensity}
                  onChange={onChange}
                />
              </div>
              <div className="md:col-span-4">
                <AppearanceChoiceField
                  helper="Density default untuk table row."
                  label="Table row density"
                  name="tableRowDensity"
                  options={densityOptions}
                  value={safeDraft.tableRowDensity}
                  onChange={onChange}
                />
              </div>
              <div className="md:col-span-4">
                <AppearanceChoiceField
                  helper="Tema receipt print untuk fase Billing berikutnya."
                  label="Receipt print theme"
                  name="receiptPrintTheme"
                  options={printThemeOptions}
                  value={safeDraft.receiptPrintTheme}
                  onChange={onChange}
                />
              </div>
            </div>

            <div className="grid min-w-0 gap-2 md:grid-cols-2">
              <AppearanceToggleField
                checked={safeDraft.compactTables}
                helper="Preferensi global untuk tabel lebih padat di halaman data."
                label="Compact tables"
                name="compactTables"
                onChange={onChange}
              />
              <AppearanceToggleField
                checked={safeDraft.financialPrivacyMask}
                helper="Rencana mask nominal uang untuk mode privasi finansial."
                label="Financial privacy mask"
                name="financialPrivacyMask"
                onChange={onChange}
              />
              <AppearanceToggleField
                checked={safeDraft.showCommandBarHints}
                helper="Tampilkan hint kecil pada command bar admin."
                label="Show command bar hints"
                name="showCommandBarHints"
                onChange={onChange}
              />
              <AppearanceToggleField
                checked={safeDraft.showAdvancedBadges}
                helper="Tampilkan badge advanced seperti source, schema, dan phase."
                label="Show advanced badges"
                name="showAdvancedBadges"
                onChange={onChange}
              />
            </div>
          </section>

          <section className="grid gap-3 border-t border-[var(--ui-border)] pt-3">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
              Motion and navigation
            </h3>

            <div className="grid min-w-0 gap-3 md:grid-cols-12">
              <div className="md:col-span-6">
                <AppearanceChoiceField
                  helper="Mobile bottom nav tetap aman. Tidak menambah CSS overflow/transform baru."
                  label="Mobile bottom nav"
                  name="mobileBottomNavBehavior"
                  options={bottomNavOptions}
                  value={safeDraft.mobileBottomNavBehavior}
                  onChange={onChange}
                />
              </div>
              <div className="md:col-span-6">
                <AppearanceToggleField
                  checked={safeDraft.sidebarDefaultCollapsed}
                  helper="Default sidebar desktop collapsed untuk sesi baru/future integration."
                  label="Sidebar default collapsed"
                  name="sidebarDefaultCollapsed"
                  onChange={onChange}
                />
              </div>
            </div>

            <div className="grid min-w-0 gap-2 md:grid-cols-2">
              <AppearanceToggleField
                checked={safeDraft.allowUserOverride}
                helper="User tetap boleh punya preferensi lokal mode dan density."
                label="Allow user override"
                name="allowUserOverride"
                onChange={onChange}
              />
              <AppearanceToggleField
                checked={safeDraft.reducedMotion}
                helper="Kurangi intensitas motion tanpa mengubah struktur layout."
                label="Reduced motion"
                name="reducedMotion"
                onChange={onChange}
              />
            </div>
          </section>
        </div>

        <aside className="grid min-w-0 gap-3">
          <div className="grid gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] p-3 ring-1 ring-[var(--ui-ring)]">
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
              Local preference
            </span>
            <strong className="text-sm font-semibold text-[var(--ui-text-strong)]">
              {localThemeMode} / {localDensityMode}
            </strong>
            <span className="text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
              Ini dibaca dari ThemeProvider lokal. Editor ini tidak memanggil setMode atau setDensity.
            </span>
          </div>

          <div className="grid gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-3 ring-1 ring-[var(--ui-ring)]">
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
              Save state
            </span>
            <strong className="text-sm font-semibold text-[var(--ui-text-strong)]">
              {isSaving ? 'Saving appearance...' : saveStatus === 'saved' ? 'Saved' : isDirty ? 'Unsaved draft' : 'No draft changes'}
            </strong>
            <span className="text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
              Last saved: {formatSettingsTimestamp(lastSavedAt)}
            </span>
          </div>

          <div className="grid gap-2 rounded-md border border-studio-cyan/20 bg-studio-cyan/10 p-3 text-xs font-semibold leading-5 text-studio-cyan ring-1 ring-studio-cyan/10">
            <span>one component, two palettes</span>
            <span className="font-medium text-[var(--ui-text-muted)]">
              Dark/light hanya beda token warna, bukan layout, DOM, spacing, visibility, atau struktur.
            </span>
          </div>
        </aside>
      </div>
    </AdminPanel>
  );
}

function parseSettingsList(value) {
  return String(value || '')
    .split(/[\\n,]/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function PolicyNumberField({
  helper = '',
  label,
  min = 0,
  name,
  step = 1,
  value,
  onChange,
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
      {label}
      <input
        className="min-h-10 w-full min-w-0 rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 text-sm font-semibold normal-case tracking-normal text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition placeholder:text-[var(--ui-text-soft)] focus:border-studio-accent/55 focus:ring-4 focus:ring-studio-accent/20"
        min={min}
        name={name}
        step={step}
        type="number"
        value={value ?? 0}
        onChange={(event) => onChange(name, Number(event.target.value))}
      />
      {helper ? (
        <span className="text-[0.68rem] font-medium normal-case leading-5 tracking-normal text-[var(--ui-text-soft)]">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

function PolicyTextAreaField({
  helper = '',
  label,
  name,
  value,
  onChange,
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
      {label}
      <textarea
        className="min-h-[5.5rem] w-full min-w-0 resize-y rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 py-2 text-sm font-semibold normal-case tracking-normal text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition placeholder:text-[var(--ui-text-soft)] focus:border-studio-accent/55 focus:ring-4 focus:ring-studio-accent/20"
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
      />
      {helper ? (
        <span className="text-[0.68rem] font-medium normal-case leading-5 tracking-normal text-[var(--ui-text-soft)]">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

function WeeklyHoursEditor({
  weeklyHours,
  onChange,
}) {
  const weekDays = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  return (
    <section className="grid gap-2">
      {weekDays.map((item) => {
        const day = weeklyHours?.[item.key] || { open: false, start: '10:00', end: '22:00' };

        return (
          <div
            className="grid min-w-0 gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] p-2.5 ring-1 ring-[var(--ui-ring)] md:grid-cols-[minmax(0,1.1fr)_9rem_9rem] md:items-center"
            key={item.key}
          >
            <AppearanceToggleField
              checked={Boolean(day.open)}
              helper={day.open ? 'Hari aktif untuk jadwal studio.' : 'Hari ini dianggap tutup.'}
              label={item.label}
              name={item.key + '.open'}
              onChange={(_name, checked) => onChange(item.key, 'open', checked)}
            />

            <label className="grid min-w-0 gap-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
              Start
              <input
                className="min-h-10 rounded-md border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-3 text-sm font-semibold normal-case tracking-normal text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] disabled:opacity-50"
                disabled={!day.open}
                type="time"
                value={day.start || '10:00'}
                onChange={(event) => onChange(item.key, 'start', event.target.value)}
              />
            </label>

            <label className="grid min-w-0 gap-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
              End
              <input
                className="min-h-10 rounded-md border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-3 text-sm font-semibold normal-case tracking-normal text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] disabled:opacity-50"
                disabled={!day.open}
                type="time"
                value={day.end || '22:00'}
                onChange={(event) => onChange(item.key, 'end', event.target.value)}
              />
            </label>
          </div>
        );
      })}
    </section>
  );
}

function OperationalPolicyEditor({
  draft,
  isDirty,
  isSaving,
  lastSavedAt,
  saveError,
  saveStatus,
  validation,
  onChange,
  onDiscard,
  onListChange,
  onSave,
  onWeeklyHoursChange,
}) {
  const safeDraft = draft || adminSettingsRepository.getDefaultStudioSettings().operationalPolicy;
  const canSave = isDirty && !isSaving && validation.isValid;

  const timezoneOptions = [
    { value: 'Asia/Jakarta', label: 'Asia/Jakarta' },
  ];

  return (
    <AdminPanel className="grid gap-3 p-3" variant="default">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div className="grid gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="m-0 text-base font-semibold tracking-[-0.035em] text-[var(--ui-text-strong)]">
              Operational Policy editor
            </h2>
            <AdminBadge tone={isDirty ? 'purple' : 'cyan'}>
              {isDirty ? 'Draft changed' : 'Clean'}
            </AdminBadge>
            <AdminBadge tone={validation.isValid ? 'cyan' : 'accent'}>
              {validation.isValid ? 'Valid' : 'Needs review'}
            </AdminBadge>
          </div>

          <p className="m-0 text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
            Save hanya mengubah operationalPolicy. Booking lama tidak dihapus, tidak digeser, dan tidak diubah otomatis.
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap gap-2 md:justify-end">
          <AdminButton
            className="min-w-[6.5rem]"
            disabled={!isDirty || isSaving}
            icon={RotateCcw}
            size="sm"
            variant="secondary"
            onClick={onDiscard}
          >
            Discard
          </AdminButton>
          <AdminButton
            className="min-w-[8rem]"
            disabled={!canSave}
            icon={Save}
            size="sm"
            variant="primary"
            onClick={onSave}
          >
            {isSaving ? 'Saving...' : 'Save operational'}
          </AdminButton>
        </div>
      </div>

      {validation.errors.length > 0 ? (
        <div className="rounded-md border border-studio-accent/30 bg-studio-accent/10 p-3 text-xs font-semibold leading-5 text-studio-accent">
          {validation.errors[0]}
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-md border border-studio-accent/30 bg-studio-accent/10 p-3 text-xs font-semibold leading-5 text-studio-accent">
          {saveError}
        </div>
      ) : null}

      {saveStatus === 'saved' ? (
        <div className="rounded-md border border-studio-cyan/30 bg-studio-cyan/10 p-3 text-xs font-semibold leading-5 text-studio-cyan">
          Operational policy tersimpan. Efek integrasi ke Booking baru akan dilakukan di fase khusus.
        </div>
      ) : null}

      <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
        <div className="grid min-w-0 gap-3">
          <section className="grid gap-3 border-t border-[var(--ui-border)] pt-3 first:border-t-0 first:pt-0">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
              Schedule rules
            </h3>

            <div className="grid min-w-0 gap-3 md:grid-cols-12">
              <div className="md:col-span-3">
                <AppearanceChoiceField
                  helper="Timezone MVP untuk seluruh jadwal studio."
                  label="Timezone"
                  name="timezone"
                  options={timezoneOptions}
                  value={safeDraft.timezone}
                  onChange={onChange}
                />
              </div>
              <div className="md:col-span-3">
                <PolicyNumberField helper="Minimal 15 menit." label="Slot minutes" min={15} name="slotMinutes" value={safeDraft.slotMinutes} onChange={onChange} />
              </div>
              <div className="md:col-span-3">
                <PolicyNumberField helper="Jeda antar sesi." label="Buffer minutes" min={0} name="bufferMinutes" value={safeDraft.bufferMinutes} onChange={onChange} />
              </div>
              <div className="md:col-span-3">
                <PolicyNumberField helper="Batas booking sebelum jam sesi." label="Lead minutes" min={0} name="minLeadMinutes" value={safeDraft.minLeadMinutes} onChange={onChange} />
              </div>
              <div className="md:col-span-3">
                <PolicyNumberField helper="Berapa hari ke depan booking boleh dibuat." label="Max advance days" min={1} name="maxAdvanceDays" value={safeDraft.maxAdvanceDays} onChange={onChange} />
              </div>
              <div className="md:col-span-3">
                <PolicyNumberField helper="Toleransi keterlambatan." label="Grace minutes" min={0} name="gracePeriodMinutes" value={safeDraft.gracePeriodMinutes} onChange={onChange} />
              </div>
              <div className="md:col-span-3">
                <PolicyNumberField helper="Durasi default saat booking baru." label="Default session" min={15} name="defaultSessionDurationMinutes" value={safeDraft.defaultSessionDurationMinutes} onChange={onChange} />
              </div>
            </div>

            <div className="grid min-w-0 gap-2 md:grid-cols-2">
              <AppearanceToggleField
                checked={safeDraft.allowBookingOutsideHours}
                helper="Jika aktif nanti booking baru boleh dibuat di luar jam buka dengan warning."
                label="Allow outside hours"
                name="allowBookingOutsideHours"
                onChange={onChange}
              />
              <AppearanceToggleField
                checked={safeDraft.showClosedDaysInCalendar}
                helper="Tampilkan hari tutup pada calendar agar operator tetap punya konteks."
                label="Show closed days"
                name="showClosedDaysInCalendar"
                onChange={onChange}
              />
            </div>
          </section>

          <section className="grid gap-3 border-t border-[var(--ui-border)] pt-3">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
              Weekly hours
            </h3>
            <WeeklyHoursEditor weeklyHours={safeDraft.weeklyHours} onChange={onWeeklyHoursChange} />
          </section>

          <section className="grid gap-3 border-t border-[var(--ui-border)] pt-3">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
              Calendar exceptions
            </h3>

            <div className="grid min-w-0 gap-3 md:grid-cols-3">
              <PolicyTextAreaField
                helper="Pisahkan dengan koma atau baris baru. Format disarankan YYYY-MM-DD."
                label="Holiday dates"
                name="holidayDates"
                value={(safeDraft.holidayDates || []).join(', ')}
                onChange={onListChange}
              />
              <PolicyTextAreaField
                helper="Tanggal blackout tidak boleh dipakai untuk booking baru di fase integrasi."
                label="Blackout dates"
                name="blackoutDates"
                value={(safeDraft.blackoutDates || []).join(', ')}
                onChange={onListChange}
              />
              <PolicyTextAreaField
                helper="Tanggal buka khusus di luar pola weekly hours."
                label="Special open dates"
                name="specialOpenDates"
                value={(safeDraft.specialOpenDates || []).join(', ')}
                onChange={onListChange}
              />
            </div>
          </section>
        </div>

        <aside className="grid min-w-0 gap-3">
          <div className="grid gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] p-3 ring-1 ring-[var(--ui-ring)]">
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
              Booking safety
            </span>
            <strong className="text-sm font-semibold text-[var(--ui-text-strong)]">
              New bookings only
            </strong>
            <span className="text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
              Policy ini tidak mengubah booking lama. Integrasi enforcement masuk fase terpisah.
            </span>
          </div>

          <div className="grid gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-3 ring-1 ring-[var(--ui-ring)]">
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
              Save state
            </span>
            <strong className="text-sm font-semibold text-[var(--ui-text-strong)]">
              {isSaving ? 'Saving operational...' : saveStatus === 'saved' ? 'Saved' : isDirty ? 'Unsaved draft' : 'No draft changes'}
            </strong>
            <span className="text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
              Last saved: {formatSettingsTimestamp(lastSavedAt)}
            </span>
          </div>
        </aside>
      </div>
    </AdminPanel>
  );
}

function BookingPolicyEditor({
  draft,
  isDirty,
  isSaving,
  lastSavedAt,
  saveError,
  saveStatus,
  validation,
  onChange,
  onDiscard,
  onSave,
}) {
  const safeDraft = draft || adminSettingsRepository.getDefaultStudioSettings().bookingPolicy;
  const canSave = isDirty && !isSaving && validation.isValid;

  const bookingStatusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'dp', label: 'DP' },
    { value: 'paid', label: 'Paid' },
  ];

  const paymentStatusOptions = [
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'dp', label: 'DP' },
    { value: 'paid', label: 'Paid' },
  ];

  const depositTypeOptions = [
    { value: 'fixed', label: 'Fixed amount' },
    { value: 'percentage', label: 'Percentage' },
  ];

  return (
    <AdminPanel className="grid gap-3 p-3" variant="default">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div className="grid gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="m-0 text-base font-semibold tracking-[-0.035em] text-[var(--ui-text-strong)]">
              Booking Policy editor
            </h2>
            <AdminBadge tone={isDirty ? 'purple' : 'cyan'}>
              {isDirty ? 'Draft changed' : 'Clean'}
            </AdminBadge>
            <AdminBadge tone={validation.isValid ? 'cyan' : 'accent'}>
              {validation.isValid ? 'Valid' : 'Needs review'}
            </AdminBadge>
          </div>

          <p className="m-0 text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
            Save hanya mengubah bookingPolicy. Tidak ada booking lama yang berubah status, payment, atau jadwalnya.
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap gap-2 md:justify-end">
          <AdminButton
            className="min-w-[6.5rem]"
            disabled={!isDirty || isSaving}
            icon={RotateCcw}
            size="sm"
            variant="secondary"
            onClick={onDiscard}
          >
            Discard
          </AdminButton>
          <AdminButton
            className="min-w-[8rem]"
            disabled={!canSave}
            icon={Save}
            size="sm"
            variant="primary"
            onClick={onSave}
          >
            {isSaving ? 'Saving...' : 'Save booking'}
          </AdminButton>
        </div>
      </div>

      {validation.errors.length > 0 ? (
        <div className="rounded-md border border-studio-accent/30 bg-studio-accent/10 p-3 text-xs font-semibold leading-5 text-studio-accent">
          {validation.errors[0]}
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-md border border-studio-accent/30 bg-studio-accent/10 p-3 text-xs font-semibold leading-5 text-studio-accent">
          {saveError}
        </div>
      ) : null}

      {saveStatus === 'saved' ? (
        <div className="rounded-md border border-studio-cyan/30 bg-studio-cyan/10 p-3 text-xs font-semibold leading-5 text-studio-cyan">
          Booking policy tersimpan. Enforcement ke booking baru akan masuk phase integrasi.
        </div>
      ) : null}

      <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
        <div className="grid min-w-0 gap-3">
          <section className="grid gap-3 border-t border-[var(--ui-border)] pt-3 first:border-t-0 first:pt-0">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
              Defaults
            </h3>

            <div className="grid min-w-0 gap-3 md:grid-cols-12">
              <div className="md:col-span-4">
                <AppearanceChoiceField
                  helper="Status booking default untuk booking baru."
                  label="Default booking status"
                  name="defaultBookingStatus"
                  options={bookingStatusOptions}
                  value={safeDraft.defaultBookingStatus}
                  onChange={onChange}
                />
              </div>
              <div className="md:col-span-4">
                <AppearanceChoiceField
                  helper="Status payment default untuk booking baru."
                  label="Default payment"
                  name="defaultPaymentStatus"
                  options={paymentStatusOptions}
                  value={safeDraft.defaultPaymentStatus}
                  onChange={onChange}
                />
              </div>
              <div className="md:col-span-4">
                <AppearanceChoiceField
                  helper="Jenis deposit default saat deposit diwajibkan."
                  label="Deposit type"
                  name="defaultDepositType"
                  options={depositTypeOptions}
                  value={safeDraft.defaultDepositType}
                  onChange={onChange}
                />
              </div>
              <div className="md:col-span-4">
                <PolicyNumberField helper="Nominal atau persentase sesuai deposit type." label="Deposit amount" min={0} name="defaultDepositAmount" value={safeDraft.defaultDepositAmount} onChange={onChange} />
              </div>
            </div>

            <div className="grid min-w-0 gap-2 md:grid-cols-2">
              <AppearanceToggleField
                checked={safeDraft.allowOverlap}
                helper="Jika aktif nanti booking overlap bisa dibuat. Default aman sebaiknya off."
                label="Allow overlap"
                name="allowOverlap"
                onChange={onChange}
              />
              <AppearanceToggleField
                checked={safeDraft.requireDeposit}
                helper="Booking baru bisa diwajibkan punya DP di fase integrasi."
                label="Require deposit"
                name="requireDeposit"
                onChange={onChange}
              />
            </div>
          </section>

          <section className="grid gap-3 border-t border-[var(--ui-border)] pt-3">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
              Required customer fields
            </h3>

            <div className="grid min-w-0 gap-2 md:grid-cols-2">
              <AppearanceToggleField
                checked={safeDraft.requireCustomerName}
                helper="Nama customer wajib untuk booking baru."
                label="Require customer name"
                name="requireCustomerName"
                onChange={onChange}
              />
              <AppearanceToggleField
                checked={safeDraft.requireCustomerPhone}
                helper="Nomor telepon wajib untuk booking baru."
                label="Require customer phone"
                name="requireCustomerPhone"
                onChange={onChange}
              />
              <AppearanceToggleField
                checked={safeDraft.requireCustomerEmail}
                helper="Email customer wajib jika fase CRM mengaktifkannya."
                label="Require customer email"
                name="requireCustomerEmail"
                onChange={onChange}
              />
              <AppearanceToggleField
                checked={safeDraft.customerSourceRequired}
                helper="Source customer wajib dipilih."
                label="Require customer source"
                name="customerSourceRequired"
                onChange={onChange}
              />
            </div>
          </section>

          <section className="grid gap-3 border-t border-[var(--ui-border)] pt-3">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
              Cancellation and no-show
            </h3>

            <div className="grid min-w-0 gap-3 md:grid-cols-12">
              <div className="md:col-span-4">
                <PolicyNumberField helper="Jam sebelum sesi untuk batas cancel." label="Cancel cutoff hours" min={0} name="cancellationCutoffHours" value={safeDraft.cancellationCutoffHours} onChange={onChange} />
              </div>
              <div className="md:col-span-4">
                <PolicyNumberField helper="Menit setelah jadwal untuk tanda no-show." label="No-show threshold" min={0} name="noShowThresholdMinutes" value={safeDraft.noShowThresholdMinutes} onChange={onChange} />
              </div>
              <div className="md:col-span-4">
                <PolicyNumberField helper="Belum dieksekusi otomatis pada phase ini." label="Auto cancel minutes" min={0} name="autoCancelAfterMinutes" value={safeDraft.autoCancelAfterMinutes} onChange={onChange} />
              </div>
            </div>

            <div className="grid min-w-0 gap-2 md:grid-cols-2">
              <AppearanceToggleField
                checked={safeDraft.cancellationAllowed}
                helper="Mengatur policy cancel untuk booking baru."
                label="Cancellation allowed"
                name="cancellationAllowed"
                onChange={onChange}
              />
              <AppearanceToggleField
                checked={safeDraft.noShowEnabled}
                helper="Hanya policy. Belum ada auto mutation booking."
                label="No-show policy"
                name="noShowEnabled"
                onChange={onChange}
              />
              <AppearanceToggleField
                checked={safeDraft.autoCancelUnpaid}
                helper="Policy saja. Tidak menjalankan auto cancel di phase ini."
                label="Auto cancel unpaid"
                name="autoCancelUnpaid"
                onChange={onChange}
              />
            </div>
          </section>

          <section className="grid gap-3 border-t border-[var(--ui-border)] pt-3">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
              Notes and operator guard
            </h3>

            <div className="grid min-w-0 gap-2 md:grid-cols-2">
              <AppearanceToggleField
                checked={safeDraft.bookingNoteRequired}
                helper="Catatan booking wajib diisi jika aktif."
                label="Require booking note"
                name="bookingNoteRequired"
                onChange={onChange}
              />
              <AppearanceToggleField
                checked={safeDraft.operatorNoteRequired}
                helper="Catatan operator wajib untuk aksi tertentu di fase lanjutan."
                label="Require operator note"
                name="operatorNoteRequired"
                onChange={onChange}
              />
              <AppearanceToggleField
                checked={safeDraft.bookingReminderEnabled}
                helper="Policy reminder. Template dan channel ada di Notifications."
                label="Booking reminder"
                name="bookingReminderEnabled"
                onChange={onChange}
              />
            </div>
          </section>
        </div>

        <aside className="grid min-w-0 gap-3">
          <div className="grid gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] p-3 ring-1 ring-[var(--ui-ring)]">
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
              Historical safety
            </span>
            <strong className="text-sm font-semibold text-[var(--ui-text-strong)]">
              No old booking mutation
            </strong>
            <span className="text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
              Settings ini hanya tersimpan sebagai policy. Enforcement ke Booking dibuat terpisah dan wajib audit.
            </span>
          </div>

          <div className="grid gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-3 ring-1 ring-[var(--ui-ring)]">
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
              Save state
            </span>
            <strong className="text-sm font-semibold text-[var(--ui-text-strong)]">
              {isSaving ? 'Saving booking policy...' : saveStatus === 'saved' ? 'Saved' : isDirty ? 'Unsaved draft' : 'No draft changes'}
            </strong>
            <span className="text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
              Last saved: {formatSettingsTimestamp(lastSavedAt)}
            </span>
          </div>
        </aside>
      </div>
    </AdminPanel>
  );
}



function SettingsAuditPreview({ logs, errorMessage, isReady }) {
  const visibleLogs = logs.slice(0, 4);

  return (
    <AdminPanel className="grid gap-3 p-3" variant="flat">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <h2 className="m-0 text-base font-semibold tracking-[-0.035em] text-[var(--ui-text-strong)]">
            Audit preview
          </h2>
          <p className="m-0 text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
            Membaca `settingsAuditLogs`; panel filter penuh tetap untuk SETTINGS.15.
          </p>
        </div>
        <AdminBadge className="size-7 shrink-0 justify-center px-0" tone={errorMessage ? 'accent' : isReady ? 'purple' : 'neutral'}>
          <FileClock size={14} strokeWidth={2.35} aria-hidden="true" />
        </AdminBadge>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-studio-accent/30 bg-studio-accent/10 p-3 text-xs font-semibold leading-5 text-studio-accent">
          {errorMessage}
        </div>
      ) : !isReady ? (
        <div className="rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] p-3 text-xs font-semibold text-[var(--ui-text-muted)]">
          Memuat audit Settings...
        </div>
      ) : visibleLogs.length > 0 ? (
        <div className="grid gap-2">
          {visibleLogs.map((log) => (
            <div
              className="grid gap-1 rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] p-2 ring-1 ring-[var(--ui-ring)]"
              key={log.id}
            >
              <div className="flex min-w-0 items-center justify-between gap-2">
                <strong className="truncate text-xs font-semibold text-[var(--ui-text-strong)]">
                  {log.label || log.action}
                </strong>
                <AdminBadge tone="neutral">{log.changedKeys.length} keys</AdminBadge>
              </div>
              <span className="text-[0.68rem] font-medium leading-5 text-[var(--ui-text-muted)]">
                {log.section || 'settings'} / {formatSettingsTimestamp(log.at)} / {log.by?.email || 'Admin'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] p-3 text-xs font-semibold leading-5 text-[var(--ui-text-muted)]">
          Belum ada settingsAuditLogs. Ini normal selama belum ada save Settings.
        </div>
      )}
    </AdminPanel>
  );
}

export function SettingsAdmin() {
  const {
    adminUser = null,
    billingLoadError = '',
    bookingLoadError = '',
    bookkeepingLoadError = '',
    isBillingReady = false,
    isBookingsReady = false,
    isBookkeepingReady = false,
  } = useOutletContext() || {};
  const { density: localDensityMode, mode: localThemeMode } = useTheme();
  const [settingsState, setSettingsState] = useState({
    auditErrorMessage: '',
    auditLogs: [],
    isAuditReady: false,
    isSettingsReady: false,
    settings: adminSettingsRepository.getDefaultStudioSettings(),
    settingsErrorMessage: '',
  });
  const [studioProfileDraft, setStudioProfileDraft] = useState(null);
  const [studioProfileSaveState, setStudioProfileSaveState] = useState({
    errorMessage: '',
    isSaving: false,
    status: 'idle',
  });
  const [appearancePolicyDraft, setAppearancePolicyDraft] = useState(null);
  const [appearancePolicySaveState, setAppearancePolicySaveState] = useState({
    errorMessage: '',
    isSaving: false,
    status: 'idle',
  });
  const [operationalPolicyDraft, setOperationalPolicyDraft] = useState(null);
  const [operationalPolicySaveState, setOperationalPolicySaveState] = useState({
    errorMessage: '',
    isSaving: false,
    status: 'idle',
  });
  const [bookingPolicyDraft, setBookingPolicyDraft] = useState(null);
  const [bookingPolicySaveState, setBookingPolicySaveState] = useState({
    errorMessage: '',
    isSaving: false,
    status: 'idle',
  });
  const currentStudioProfileRef = useRef(settingsState.settings.studioProfile);
  const currentAppearancePolicyRef = useRef(settingsState.settings.appearancePolicy);
  const currentOperationalPolicyRef = useRef(settingsState.settings.operationalPolicy);
  const currentBookingPolicyRef = useRef(settingsState.settings.bookingPolicy);

  useEffect(() => {
    setSettingsState((current) => ({
      ...current,
      isSettingsReady: false,
      settingsErrorMessage: '',
    }));

    const unsubscribe = adminSettingsRepository.subscribeStudioSettings(
      (settings) => {
        setSettingsState((current) => ({
          ...current,
          isSettingsReady: true,
          settings,
        }));
      },
      (error) => {
        setSettingsState((current) => ({
          ...current,
          isSettingsReady: true,
          settingsErrorMessage: error?.message || 'Settings memakai fallback lokal.',
        }));
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    setSettingsState((current) => ({
      ...current,
      auditErrorMessage: '',
      isAuditReady: false,
    }));

    const unsubscribe = adminSettingsRepository.subscribeSettingsAuditLogs(
      (auditLogs) => {
        setSettingsState((current) => ({
          ...current,
          auditLogs,
          isAuditReady: true,
        }));
      },
      (error) => {
        setSettingsState((current) => ({
          ...current,
          auditErrorMessage: error?.message || 'Settings audit memakai fallback lokal.',
          isAuditReady: true,
        }));
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const nextProfile = settingsState.settings.studioProfile;

    setStudioProfileDraft((currentDraft) => {
      const previousProfile = currentStudioProfileRef.current;
      const draftWasDirty = currentDraft
        ? JSON.stringify(currentDraft) !== JSON.stringify(previousProfile)
        : false;

      return draftWasDirty ? currentDraft : nextProfile;
    });
    currentStudioProfileRef.current = nextProfile;
  }, [settingsState.settings.studioProfile]);

  useEffect(() => {
    const nextAppearancePolicy = settingsState.settings.appearancePolicy;

    setAppearancePolicyDraft((currentDraft) => {
      const previousAppearancePolicy = currentAppearancePolicyRef.current;
      const draftWasDirty = currentDraft
        ? JSON.stringify(currentDraft) !== JSON.stringify(previousAppearancePolicy)
        : false;

      return draftWasDirty ? currentDraft : nextAppearancePolicy;
    });
    currentAppearancePolicyRef.current = nextAppearancePolicy;
  }, [settingsState.settings.appearancePolicy]);

  useEffect(() => {
    const nextOperationalPolicy = settingsState.settings.operationalPolicy;

    setOperationalPolicyDraft((currentDraft) => {
      const previousOperationalPolicy = currentOperationalPolicyRef.current;
      const draftWasDirty = currentDraft
        ? JSON.stringify(currentDraft) !== JSON.stringify(previousOperationalPolicy)
        : false;

      return draftWasDirty ? currentDraft : nextOperationalPolicy;
    });
    currentOperationalPolicyRef.current = nextOperationalPolicy;
  }, [settingsState.settings.operationalPolicy]);

  useEffect(() => {
    const nextBookingPolicy = settingsState.settings.bookingPolicy;

    setBookingPolicyDraft((currentDraft) => {
      const previousBookingPolicy = currentBookingPolicyRef.current;
      const draftWasDirty = currentDraft
        ? JSON.stringify(currentDraft) !== JSON.stringify(previousBookingPolicy)
        : false;

      return draftWasDirty ? currentDraft : nextBookingPolicy;
    });
    currentBookingPolicyRef.current = nextBookingPolicy;
  }, [settingsState.settings.bookingPolicy]);

  const readinessSummary = useMemo(() => {
    const readyCount = [isBookingsReady, isBillingReady, isBookkeepingReady].filter(Boolean).length;

    return {
      readyCount,
      totalCount: 3,
      tone: readyCount === 3 ? 'cyan' : 'purple',
    };
  }, [isBillingReady, isBookingsReady, isBookkeepingReady]);

  const dataReadStates = [
    {
      label: 'Settings read model',
      ready: settingsState.isSettingsReady,
      error: settingsState.settingsErrorMessage,
    },
    {
      label: 'Settings audit logs',
      ready: settingsState.isAuditReady,
      error: settingsState.auditErrorMessage,
    },
    {
      label: 'Booking read model',
      ready: isBookingsReady,
      error: bookingLoadError,
    },
    {
      label: 'Billing read model',
      ready: isBillingReady,
      error: billingLoadError,
    },
    {
      label: 'Bookkeeping read model',
      ready: isBookkeepingReady,
      error: bookkeepingLoadError,
    },
  ];
  const settingsValidation = useMemo(
    () => validateStudioSettings(settingsState.settings),
    [settingsState.settings],
  );
  const safeStudioProfileDraft = studioProfileDraft || settingsState.settings.studioProfile;
  const isStudioProfileDirty = useMemo(
    () => JSON.stringify(safeStudioProfileDraft) !== JSON.stringify(settingsState.settings.studioProfile),
    [safeStudioProfileDraft, settingsState.settings.studioProfile],
  );
  const studioProfileValidation = useMemo(
    () => adminSettingsRepository.validateSettingsSection('studioProfile', safeStudioProfileDraft),
    [safeStudioProfileDraft],
  );
  const handleStudioProfileChange = (name, value) => {
    setStudioProfileDraft((currentDraft) => ({
      ...(currentDraft || settingsState.settings.studioProfile),
      [name]: value,
    }));
    setStudioProfileSaveState({
      errorMessage: '',
      isSaving: false,
      status: 'idle',
    });
  };
  const handleDiscardStudioProfile = () => {
    setStudioProfileDraft(settingsState.settings.studioProfile);
    setStudioProfileSaveState({
      errorMessage: '',
      isSaving: false,
      status: 'idle',
    });
  };
  const handleSaveStudioProfile = async () => {
    const validation = adminSettingsRepository.validateSettingsSection('studioProfile', safeStudioProfileDraft);

    if (!validation.isValid) {
      setStudioProfileSaveState({
        errorMessage: validation.errors[0] || 'Studio Profile belum valid.',
        isSaving: false,
        status: 'error',
      });
      return;
    }

    setStudioProfileSaveState({
      errorMessage: '',
      isSaving: true,
      status: 'saving',
    });

    try {
      const nextSettings = await adminSettingsRepository.updateStudioSettingsSection(
        'studioProfile',
        safeStudioProfileDraft,
        adminUser,
      );
      setStudioProfileDraft(nextSettings.studioProfile);
      setStudioProfileSaveState({
        errorMessage: '',
        isSaving: false,
        status: 'saved',
      });
    } catch (error) {
      setStudioProfileSaveState({
        errorMessage: error?.validation?.errors?.[0] || error?.message || 'Studio Profile gagal disimpan.',
        isSaving: false,
        status: 'error',
      });
    }
  };
  const safeAppearancePolicyDraft = appearancePolicyDraft || settingsState.settings.appearancePolicy;
  const isAppearancePolicyDirty = useMemo(
    () => JSON.stringify(safeAppearancePolicyDraft) !== JSON.stringify(settingsState.settings.appearancePolicy),
    [safeAppearancePolicyDraft, settingsState.settings.appearancePolicy],
  );
  const appearancePolicyValidation = useMemo(
    () => adminSettingsRepository.validateSettingsSection('appearancePolicy', safeAppearancePolicyDraft),
    [safeAppearancePolicyDraft],
  );
  const safeOperationalPolicyDraft = operationalPolicyDraft || settingsState.settings.operationalPolicy;
  const isOperationalPolicyDirty = useMemo(
    () => JSON.stringify(safeOperationalPolicyDraft) !== JSON.stringify(settingsState.settings.operationalPolicy),
    [safeOperationalPolicyDraft, settingsState.settings.operationalPolicy],
  );
  const operationalPolicyValidation = useMemo(
    () => adminSettingsRepository.validateSettingsSection('operationalPolicy', safeOperationalPolicyDraft),
    [safeOperationalPolicyDraft],
  );
  const safeBookingPolicyDraft = bookingPolicyDraft || settingsState.settings.bookingPolicy;
  const isBookingPolicyDirty = useMemo(
    () => JSON.stringify(safeBookingPolicyDraft) !== JSON.stringify(settingsState.settings.bookingPolicy),
    [safeBookingPolicyDraft, settingsState.settings.bookingPolicy],
  );
  const bookingPolicyValidation = useMemo(
    () => adminSettingsRepository.validateSettingsSection('bookingPolicy', safeBookingPolicyDraft),
    [safeBookingPolicyDraft],
  );
  const hasSettingsDraft = isStudioProfileDirty || isAppearancePolicyDirty || isOperationalPolicyDirty || isBookingPolicyDirty;
  const handleAppearancePolicyChange = (name, value) => {
    setAppearancePolicyDraft((currentDraft) => ({
      ...(currentDraft || settingsState.settings.appearancePolicy),
      [name]: value,
    }));
    setAppearancePolicySaveState({
      errorMessage: '',
      isSaving: false,
      status: 'idle',
    });
  };
  const handleDiscardAppearancePolicy = () => {
    setAppearancePolicyDraft(settingsState.settings.appearancePolicy);
    setAppearancePolicySaveState({
      errorMessage: '',
      isSaving: false,
      status: 'idle',
    });
  };
  const handleSaveAppearancePolicy = async () => {
    const validation = adminSettingsRepository.validateSettingsSection('appearancePolicy', safeAppearancePolicyDraft);

    if (!validation.isValid) {
      setAppearancePolicySaveState({
        errorMessage: validation.errors[0] || 'Appearance Policy belum valid.',
        isSaving: false,
        status: 'error',
      });
      return;
    }

    setAppearancePolicySaveState({
      errorMessage: '',
      isSaving: true,
      status: 'saving',
    });

    try {
      const nextSettings = await adminSettingsRepository.updateStudioSettingsSection(
        'appearancePolicy',
        safeAppearancePolicyDraft,
        adminUser,
      );
      setAppearancePolicyDraft(nextSettings.appearancePolicy);
      setAppearancePolicySaveState({
        errorMessage: '',
        isSaving: false,
        status: 'saved',
      });
    } catch (error) {
      setAppearancePolicySaveState({
        errorMessage: error?.validation?.errors?.[0] || error?.message || 'Appearance Policy gagal disimpan.',
        isSaving: false,
        status: 'error',
      });
    }
  };
  const handleOperationalPolicyChange = (name, value) => {
    setOperationalPolicyDraft((currentDraft) => ({
      ...(currentDraft || settingsState.settings.operationalPolicy),
      [name]: value,
    }));
    setOperationalPolicySaveState({
      errorMessage: '',
      isSaving: false,
      status: 'idle',
    });
  };
  const handleOperationalWeeklyHoursChange = (dayKey, fieldName, value) => {
    setOperationalPolicyDraft((currentDraft) => {
      const baseDraft = currentDraft || settingsState.settings.operationalPolicy;
      const currentDay = baseDraft.weeklyHours?.[dayKey] || { open: false, start: '10:00', end: '22:00' };

      return {
        ...baseDraft,
        weeklyHours: {
          ...baseDraft.weeklyHours,
          [dayKey]: {
            ...currentDay,
            [fieldName]: value,
          },
        },
      };
    });
    setOperationalPolicySaveState({
      errorMessage: '',
      isSaving: false,
      status: 'idle',
    });
  };
  const handleOperationalPolicyListChange = (name, value) => {
    handleOperationalPolicyChange(name, parseSettingsList(value));
  };
  const handleDiscardOperationalPolicy = () => {
    setOperationalPolicyDraft(settingsState.settings.operationalPolicy);
    setOperationalPolicySaveState({
      errorMessage: '',
      isSaving: false,
      status: 'idle',
    });
  };
  const handleSaveOperationalPolicy = async () => {
    const validation = adminSettingsRepository.validateSettingsSection('operationalPolicy', safeOperationalPolicyDraft);

    if (!validation.isValid) {
      setOperationalPolicySaveState({
        errorMessage: validation.errors[0] || 'Operational Policy belum valid.',
        isSaving: false,
        status: 'error',
      });
      return;
    }

    setOperationalPolicySaveState({
      errorMessage: '',
      isSaving: true,
      status: 'saving',
    });

    try {
      const nextSettings = await adminSettingsRepository.updateStudioSettingsSection(
        'operationalPolicy',
        safeOperationalPolicyDraft,
        adminUser,
      );
      setOperationalPolicyDraft(nextSettings.operationalPolicy);
      setOperationalPolicySaveState({
        errorMessage: '',
        isSaving: false,
        status: 'saved',
      });
    } catch (error) {
      setOperationalPolicySaveState({
        errorMessage: error?.validation?.errors?.[0] || error?.message || 'Operational Policy gagal disimpan.',
        isSaving: false,
        status: 'error',
      });
    }
  };
  const handleBookingPolicyChange = (name, value) => {
    setBookingPolicyDraft((currentDraft) => ({
      ...(currentDraft || settingsState.settings.bookingPolicy),
      [name]: value,
    }));
    setBookingPolicySaveState({
      errorMessage: '',
      isSaving: false,
      status: 'idle',
    });
  };
  const handleDiscardBookingPolicy = () => {
    setBookingPolicyDraft(settingsState.settings.bookingPolicy);
    setBookingPolicySaveState({
      errorMessage: '',
      isSaving: false,
      status: 'idle',
    });
  };
  const handleSaveBookingPolicy = async () => {
    const validation = adminSettingsRepository.validateSettingsSection('bookingPolicy', safeBookingPolicyDraft);

    if (!validation.isValid) {
      setBookingPolicySaveState({
        errorMessage: validation.errors[0] || 'Booking Policy belum valid.',
        isSaving: false,
        status: 'error',
      });
      return;
    }

    setBookingPolicySaveState({
      errorMessage: '',
      isSaving: true,
      status: 'saving',
    });

    try {
      const nextSettings = await adminSettingsRepository.updateStudioSettingsSection(
        'bookingPolicy',
        safeBookingPolicyDraft,
        adminUser,
      );
      setBookingPolicyDraft(nextSettings.bookingPolicy);
      setBookingPolicySaveState({
        errorMessage: '',
        isSaving: false,
        status: 'saved',
      });
    } catch (error) {
      setBookingPolicySaveState({
        errorMessage: error?.validation?.errors?.[0] || error?.message || 'Booking Policy gagal disimpan.',
        isSaving: false,
        status: 'error',
      });
    }
  };
  const systemCards = useMemo(() => [
    {
      label: 'Settings source',
      value: getSettingsSourceLabel(settingsState.settingsErrorMessage),
      helper: settingsState.settingsErrorMessage || (isFirebaseConfigured ? 'Membaca studioSettings dari Firestore.' : 'Firebase belum configured; memakai local fallback.'),
      icon: Database,
      tone: settingsState.settingsErrorMessage ? 'purple' : 'cyan',
    },
    {
      label: 'Validation',
      value: settingsValidation.isValid ? 'Valid' : 'Review',
      helper: settingsValidation.isValid ? 'Current settings melewati validator schema.' : settingsValidation.errors[0],
      icon: settingsValidation.isValid ? CheckCircle2 : AlertTriangle,
      tone: settingsValidation.isValid ? 'cyan' : 'accent',
    },
    {
      label: 'Dirty state',
      value: hasSettingsDraft ? 'Draft' : 'Clean',
      helper: hasSettingsDraft ? 'Ada perubahan Settings belum disimpan.' : 'Tidak ada draft perubahan.',
      icon: ShieldCheck,
      tone: hasSettingsDraft ? 'purple' : 'strong',
    },
    {
      label: 'Audit logs',
      value: settingsState.isAuditReady ? String(settingsState.auditLogs.length) : 'Loading',
      helper: settingsState.auditErrorMessage || 'Preview settingsAuditLogs aktif.',
      icon: FileClock,
      tone: settingsState.auditErrorMessage ? 'accent' : 'purple',
    },
  ], [
    settingsState.auditErrorMessage,
    settingsState.auditLogs.length,
    settingsState.isAuditReady,
    settingsState.settingsErrorMessage,
    settingsValidation,
    hasSettingsDraft,
  ]);

  return (
    <AdminPageShell className="settings-admin-workspace gap-2.5 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-1 md:gap-3 md:pb-4 md:pt-2" width="wide">
      <div className="sr-only" id="settings-admin-title">
        Settings control center shell
      </div>

      <SettingsPageHeader
        adminUser={adminUser}
        readinessSummary={readinessSummary}
        settings={settingsState.settings}
        settingsErrorMessage={settingsState.settingsErrorMessage}
      />

      <section className="grid grid-cols-2 gap-2 xl:grid-cols-4" aria-label="Settings shell status">
        {systemCards.map((item) => (
          <SystemStatusCard item={item} key={item.label} />
        ))}
      </section>

      <StudioProfileEditor
        draft={safeStudioProfileDraft}
        isDirty={isStudioProfileDirty}
        isSaving={studioProfileSaveState.isSaving}
        lastSavedAt={settingsState.settings.updatedAt}
        saveError={studioProfileSaveState.errorMessage}
        saveStatus={studioProfileSaveState.status}
        validation={studioProfileValidation}
        onChange={handleStudioProfileChange}
        onDiscard={handleDiscardStudioProfile}
        onSave={handleSaveStudioProfile}
      />

      <AppearancePolicyEditor
        draft={safeAppearancePolicyDraft}
        isDirty={isAppearancePolicyDirty}
        isSaving={appearancePolicySaveState.isSaving}
        lastSavedAt={settingsState.settings.updatedAt}
        localDensityMode={localDensityMode}
        localThemeMode={localThemeMode}
        saveError={appearancePolicySaveState.errorMessage}
        saveStatus={appearancePolicySaveState.status}
        validation={appearancePolicyValidation}
        onChange={handleAppearancePolicyChange}
        onDiscard={handleDiscardAppearancePolicy}
        onSave={handleSaveAppearancePolicy}
      />

      <OperationalPolicyEditor
        draft={safeOperationalPolicyDraft}
        isDirty={isOperationalPolicyDirty}
        isSaving={operationalPolicySaveState.isSaving}
        lastSavedAt={settingsState.settings.updatedAt}
        saveError={operationalPolicySaveState.errorMessage}
        saveStatus={operationalPolicySaveState.status}
        validation={operationalPolicyValidation}
        onChange={handleOperationalPolicyChange}
        onDiscard={handleDiscardOperationalPolicy}
        onListChange={handleOperationalPolicyListChange}
        onSave={handleSaveOperationalPolicy}
        onWeeklyHoursChange={handleOperationalWeeklyHoursChange}
      />

      <BookingPolicyEditor
        draft={safeBookingPolicyDraft}
        isDirty={isBookingPolicyDirty}
        isSaving={bookingPolicySaveState.isSaving}
        lastSavedAt={settingsState.settings.updatedAt}
        saveError={bookingPolicySaveState.errorMessage}
        saveStatus={bookingPolicySaveState.status}
        validation={bookingPolicyValidation}
        onChange={handleBookingPolicyChange}
        onDiscard={handleDiscardBookingPolicy}
        onSave={handleSaveBookingPolicy}
      />

      <SettingsSnapshotPanel
        settings={settingsState.settings}
        validation={settingsValidation}
      />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <section className="order-last grid gap-2 xl:order-none" aria-labelledby="settings-section-map-title">
          <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
            <div className="grid gap-1">
              <h2 className="m-0 text-lg font-semibold tracking-[-0.045em] text-[var(--ui-text-strong)]" id="settings-section-map-title">
                Section map
              </h2>
              <p className="m-0 text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
                Studio Profile, Appearance, Operational, dan Booking Policy punya editor aktif; section lain tetap kontrak visual read-only.
              </p>
            </div>

            <AdminBadge tone="neutral">{settingsSections.length} sections</AdminBadge>
          </div>

          <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
            {settingsSections.map((section) => (
              <SettingsSectionCard key={section.key} section={section} />
            ))}
          </div>
        </section>

        <aside className="order-first grid gap-3 xl:order-none xl:sticky xl:top-3" aria-label="Settings shell guard rail">
          <SettingsAuditPreview
            errorMessage={settingsState.auditErrorMessage}
            isReady={settingsState.isAuditReady}
            logs={settingsState.auditLogs}
          />

          <AdminPanel className="grid gap-3 p-3" variant="default">
            <div className="flex items-start justify-between gap-3">
              <div className="grid gap-1">
                <h2 className="m-0 text-base font-semibold tracking-[-0.035em] text-[var(--ui-text-strong)]">
                  Guard rail
                </h2>
                <p className="m-0 text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
                  Batas aman write path Settings.
                </p>
              </div>
              <AdminBadge className="size-7 shrink-0 justify-center px-0" tone="accent">
                <ShieldCheck size={14} strokeWidth={2.35} aria-hidden="true" />
              </AdminBadge>
            </div>

            <div className="grid gap-2">
              {guardItems.map((item) => (
                <div
                  className="grid grid-cols-[1.35rem_minmax(0,1fr)] items-start gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] p-2 text-[0.72rem] font-semibold leading-5 text-[var(--ui-text-main)] ring-1 ring-[var(--ui-ring)]"
                  key={item}
                >
                  <span className="grid size-5 place-items-center rounded-md bg-[var(--ui-glass-soft)] text-studio-cyan">
                    <ShieldCheck size={12} strokeWidth={2.35} aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel className="grid gap-3 p-3" variant="flat">
            <div className="flex items-start justify-between gap-3">
              <div className="grid gap-1">
                <h2 className="m-0 text-base font-semibold tracking-[-0.035em] text-[var(--ui-text-strong)]">
                  Read models
                </h2>
                <p className="m-0 text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
                  Settings read model dan audit sudah aktif; editor baru tersedia untuk Studio Profile.
                </p>
              </div>
              <AdminBadge className="size-7 shrink-0 justify-center px-0" tone="purple">
                <Gauge size={14} strokeWidth={2.35} aria-hidden="true" />
              </AdminBadge>
            </div>

            <div className="grid gap-2">
              {dataReadStates.map((item) => (
                <div
                  className="grid gap-1 rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] p-2 ring-1 ring-[var(--ui-ring)]"
                  key={item.label}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--ui-text-strong)]">{item.label}</span>
                    <AdminBadge tone={item.error ? 'accent' : item.ready ? 'cyan' : 'neutral'}>
                      {item.error ? 'Degraded' : item.ready ? 'Ready' : 'Loading'}
                    </AdminBadge>
                  </div>
                  {item.error ? (
                    <span className="text-[0.68rem] font-medium leading-5 text-studio-accent">{item.error}</span>
                  ) : null}
                </div>
              ))}
            </div>
          </AdminPanel>
        </aside>
      </div>
    </AdminPageShell>
  );
}
