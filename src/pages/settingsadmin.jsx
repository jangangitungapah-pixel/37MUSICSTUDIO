import { useMemo } from 'react';
import { useOutletContext } from 'react-router';
import {
  BadgeCheck,
  Bell,
  Boxes,
  Building2,
  CalendarClock,
  ClipboardCheck,
  CreditCard,
  Database,
  Eye,
  FileClock,
  Flag,
  Gauge,
  LockKeyhole,
  Paintbrush,
  ReceiptText,
  Settings2,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import {
  AdminBadge,
  AdminCommandBar,
  AdminPageHeader,
  AdminPageShell,
  AdminPanel,
} from '../components/admin/AdminPrimitives.jsx';

const settingsSections = [
  {
    key: 'studioProfile',
    label: 'Studio Profile',
    helper: 'Identitas bisnis, logo, kontak, timezone, locale, dan currency.',
    icon: Building2,
    phase: 'SETTINGS.4',
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

const systemCards = [
  {
    label: 'Route shell',
    value: 'Active',
    helper: '/admin/settings sudah terdaftar sebagai shell read-only.',
    icon: Settings2,
    tone: 'cyan',
  },
  {
    label: 'Write path',
    value: 'Off',
    helper: 'Belum ada save, import, reset, atau mutasi Firestore.',
    icon: ShieldCheck,
    tone: 'strong',
  },
  {
    label: 'Repository',
    value: 'Pending',
    helper: 'adminSettingsRepository.js baru dibuat di SETTINGS.2.',
    icon: Database,
    tone: 'neutral',
  },
  {
    label: 'Audit',
    value: 'Planned',
    helper: 'settingsAuditLogs disiapkan untuk fase repository.',
    icon: FileClock,
    tone: 'purple',
  },
];

const guardItems = [
  'Tidak ada settings write pada SETTINGS.1.',
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

  return (
    <AdminPanel as="article" className="grid gap-3 p-3" variant="flat">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent ring-1 ring-[var(--ui-ring)]">
          <SectionIcon size={17} strokeWidth={2.35} aria-hidden="true" />
        </span>

        <div className="grid min-w-0 flex-1 gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="m-0 min-w-0 text-base font-semibold tracking-[-0.04em] text-[var(--ui-text-strong)]">
              {section.label}
            </h2>
            <AdminBadge tone={getRiskTone(section.risk)}>{section.risk}</AdminBadge>
          </div>

          <p className="m-0 text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
            {section.helper}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-[var(--ui-border)] pt-3">
        <AdminBadge tone={section.tone}>{section.phase}</AdminBadge>
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-soft)]">
          Read-only map
        </span>
      </div>
    </AdminPanel>
  );
}

function SystemStatusCard({ item }) {
  const ItemIcon = item.icon;

  return (
    <AdminPanel className="grid gap-2 p-3" variant="solid">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
          {item.label}
        </span>
        <AdminBadge className="size-8 justify-center px-0" tone={item.tone}>
          <ItemIcon size={14} strokeWidth={2.35} aria-hidden="true" />
        </AdminBadge>
      </div>

      <strong className="text-xl font-semibold leading-none tracking-[-0.055em] text-[var(--ui-text-strong)]">
        {item.value}
      </strong>

      <p className="m-0 text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
        {item.helper}
      </p>
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

  return (
    <AdminPageShell className="settings-admin-workspace gap-3 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-1 md:pb-4 md:pt-2" width="wide">
      <div className="sr-only" id="settings-admin-title">
        Settings control center shell
      </div>

      <AdminPageHeader
        description="Shell read-only untuk memetakan Control Center Studio OS sebelum repository dan editor Settings dibuat."
        eyebrow="SETTINGS.1"
        meta={(
          <>
            <AdminBadge icon={Eye} tone="strong">
              Read-only shell
            </AdminBadge>
            <AdminBadge icon={BadgeCheck} tone={readinessSummary.tone}>
              {readinessSummary.readyCount}/{readinessSummary.totalCount} read models ready
            </AdminBadge>
            <AdminBadge icon={UsersRound} tone="neutral">
              {adminUser?.email || 'Admin session'}
            </AdminBadge>
          </>
        )}
        title="Settings"
      />

      <AdminCommandBar className="gap-2 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="grid gap-1">
          <strong className="text-sm font-semibold tracking-[-0.02em] text-[var(--ui-text-strong)]">
            Route/nav shell aktif
          </strong>
          <span className="text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
            Halaman ini hanya menampilkan roadmap section, guard, dan status sistem awal. Editor, schema, dan Firestore writes dimulai di fase berikutnya.
          </span>
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          <AdminBadge icon={Settings2} tone="strong">/admin/settings</AdminBadge>
          <AdminBadge icon={ShieldCheck} tone="cyan">No writes</AdminBadge>
        </div>
      </AdminCommandBar>

      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Settings shell status">
        {systemCards.map((item) => (
          <SystemStatusCard item={item} key={item.label} />
        ))}
      </section>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <section className="grid gap-2" aria-labelledby="settings-section-map-title">
          <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
            <div className="grid gap-1">
              <h2 className="m-0 text-xl font-semibold tracking-[-0.055em] text-[var(--ui-text-strong)]" id="settings-section-map-title">
                Section map
              </h2>
              <p className="m-0 text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
                Semua section dari masterplan ditampilkan sebagai kontrak visual tanpa field editor.
              </p>
            </div>

            <AdminBadge tone="neutral">{settingsSections.length} sections</AdminBadge>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            {settingsSections.map((section) => (
              <SettingsSectionCard key={section.key} section={section} />
            ))}
          </div>
        </section>

        <aside className="grid gap-3" aria-label="Settings shell guard rail">
          <AdminPanel className="grid gap-3" variant="default">
            <div className="flex items-start justify-between gap-3">
              <div className="grid gap-1">
                <h2 className="m-0 text-lg font-semibold tracking-[-0.045em] text-[var(--ui-text-strong)]">
                  Guard rail
                </h2>
                <p className="m-0 text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
                  Batas aman fase shell sebelum Settings bisa menyimpan data.
                </p>
              </div>
              <AdminBadge className="size-8 justify-center px-0" tone="accent">
                <ShieldCheck size={14} strokeWidth={2.35} aria-hidden="true" />
              </AdminBadge>
            </div>

            <div className="grid gap-2">
              {guardItems.map((item) => (
                <div
                  className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] p-2 text-xs font-semibold leading-5 text-[var(--ui-text-main)] ring-1 ring-[var(--ui-ring)]"
                  key={item}
                >
                  <span className="grid size-6 place-items-center rounded-md bg-[var(--ui-glass-soft)] text-studio-cyan">
                    <ShieldCheck size={13} strokeWidth={2.35} aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel className="grid gap-3" variant="flat">
            <div className="flex items-start justify-between gap-3">
              <div className="grid gap-1">
                <h2 className="m-0 text-lg font-semibold tracking-[-0.045em] text-[var(--ui-text-strong)]">
                  Read model status
                </h2>
                <p className="m-0 text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
                  Status ini hanya orientasi shell; Settings belum punya subscription sendiri.
                </p>
              </div>
              <AdminBadge className="size-8 justify-center px-0" tone="purple">
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
