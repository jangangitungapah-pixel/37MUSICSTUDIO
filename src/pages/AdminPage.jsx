import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  Headphones,
  LockKeyhole,
  Mic,
  Music,
  Radio,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
} from 'lucide-react';
import { cn } from '../lib/cn.js';

const DEV_AUTH_STORAGE_KEY = 'thirty-seven-dev-auth';

const adminNavItems = [
  {
    key: 'overview',
    label: 'Overview',
    helper: 'Studio pulse',
    icon: Headphones,
  },
  {
    key: 'booking',
    label: 'Booking',
    helper: 'Incoming sessions',
    icon: Radio,
  },
  {
    key: 'schedule',
    label: 'Schedule',
    helper: 'Calendar board',
    icon: Calendar,
  },
  {
    key: 'recording',
    label: 'Recording',
    helper: 'Session tracker',
    icon: Mic,
  },
  {
    key: 'clients',
    label: 'Clients',
    helper: 'Musician list',
    icon: Users,
  },
  {
    key: 'settings',
    label: 'Settings',
    helper: 'Studio controls',
    icon: SlidersHorizontal,
  },
];

const shellStats = [
  {
    label: 'Portal status',
    value: 'Shell only',
  },
  {
    label: 'Navigation',
    value: '6 modules',
  },
  {
    label: 'Theme system',
    value: 'Token based',
  },
];

function navigateTo(pathname) {
  if (typeof window === 'undefined') return;

  window.history.pushState({}, '', pathname);
  window.dispatchEvent(new Event('popstate'));
}

function clearDevAccess() {
  if (typeof window === 'undefined') return;

  window.sessionStorage.removeItem(DEV_AUTH_STORAGE_KEY);
  navigateTo('/login');
}

function AdminLockedState() {
  return (
    <section
      className="grid min-h-[62vh] content-center gap-6 py-4"
      aria-labelledby="admin-locked-title"
    >
      <div className="grid max-w-2xl gap-4">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-studio-accent">
          Admin Access
        </p>

        <h1
          className="m-0 text-[clamp(3rem,7vw,6rem)] font-semibold leading-[0.94] tracking-[-0.075em] text-[var(--ui-text-strong)]"
          id="admin-locked-title"
        >
          Masuk dulu untuk buka admin.
        </h1>

        <p className="m-0 max-w-xl leading-8 text-[var(--ui-text-main)]">
          Halaman admin masih mode developing. Gunakan akses dev dari halaman login untuk membuka portal admin awal.
        </p>

        <a
          className="inline-flex min-h-12 w-fit items-center justify-center rounded-full [background:var(--ui-primary-bg)] px-6 text-sm font-semibold tracking-[-0.01em] text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
          href="/login"
        >
          Ke halaman login
        </a>
      </div>
    </section>
  );
}

function NavButton({
  collapsed = false,
  icon: Icon,
  isActive,
  itemKey,
  label,
  helper,
  onSelect,
  variant = 'sidebar',
}) {
  const isBottomBar = variant === 'bottom';

  if (isBottomBar) {
    return (
      <button
        aria-label={label}
        aria-pressed={isActive}
        className={cn(
          'grid min-w-0 flex-1 place-items-center gap-1 rounded-2xl px-2 py-2 text-[0.66rem] font-semibold tracking-[-0.015em] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25',
          isActive
            ? 'bg-[var(--ui-control-hover)] text-studio-accent shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]'
            : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-control)] hover:text-[var(--ui-text-strong)]',
        )}
        type="button"
        onClick={() => onSelect(itemKey)}
      >
        <Icon size={18} strokeWidth={2.25} aria-hidden="true" />
        <span className="max-w-full truncate">{label}</span>
      </button>
    );
  }

  return (
    <button
      aria-label={collapsed ? label : undefined}
      aria-pressed={isActive}
      className={cn(
        'group grid min-h-12 w-full items-center gap-3 rounded-2xl border px-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25',
        collapsed ? 'grid-cols-1 justify-items-center' : 'grid-cols-[2.25rem_minmax(0,1fr)]',
        isActive
          ? 'border-studio-accent/35 bg-[var(--ui-control-hover)] text-[var(--ui-text-strong)] shadow-[var(--ui-shadow-control)] ring-1 ring-studio-accent/15'
          : 'border-transparent bg-transparent text-[var(--ui-text-main)] hover:border-[var(--ui-border)] hover:bg-[var(--ui-control)] hover:text-[var(--ui-text-strong)]',
      )}
      title={collapsed ? label : undefined}
      type="button"
      onClick={() => onSelect(itemKey)}
    >
      <span
        className={cn(
          'grid size-9 place-items-center rounded-xl border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] transition',
          isActive ? 'text-studio-accent' : 'text-[var(--ui-text-soft)] group-hover:text-studio-accent',
        )}
      >
        <Icon size={17} strokeWidth={2.25} aria-hidden="true" />
      </span>

      {!collapsed ? (
        <span className="grid min-w-0 gap-0.5">
          <span className="truncate text-sm font-semibold">{label}</span>
          <span className="truncate text-xs font-medium text-[var(--ui-text-muted)]">{helper}</span>
        </span>
      ) : null}
    </button>
  );
}

function AdminSidebar({
  activeNav,
  collapsed,
  onSelectNav,
  onToggleCollapse,
}) {
  return (
    <aside
      className={cn(
        'sticky top-6 hidden self-start overflow-hidden rounded-[2rem] border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] p-3 shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] backdrop-blur-2xl md:grid',
        collapsed ? 'w-[88px]' : 'w-[276px]',
      )}
      aria-label="Admin desktop navigation"
    >
      <div className={cn('grid gap-4', collapsed ? 'justify-items-center' : '')}>
        <div
          className={cn(
            'flex min-h-14 items-center gap-3 rounded-[1.35rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-2 shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]',
            collapsed ? 'justify-center' : 'justify-between',
          )}
        >
          <a
            className={cn('min-w-0 items-center gap-3', collapsed ? 'hidden' : 'flex')}
            href="/"
            aria-label="Back to 37 Music Studio landing"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl [background:var(--ui-primary-bg)] text-sm font-semibold tracking-[-0.04em] text-[var(--ui-primary-text)]">
              37
            </span>

            <span className="grid min-w-0 gap-0.5">
              <strong className="truncate text-sm font-semibold tracking-[-0.025em] text-[var(--ui-text-strong)]">
                Admin Studio
              </strong>
              <small className="truncate text-xs font-medium text-[var(--ui-text-muted)]">
                Portal shell
              </small>
            </span>
          </a>

          <button
            aria-label={collapsed ? 'Expand admin sidebar' : 'Collapse admin sidebar'}
            className={cn(
              'grid size-10 shrink-0 place-items-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] text-[var(--ui-text-main)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-studio-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25',
              collapsed ? '' : 'ml-auto',
            )}
            type="button"
            onClick={onToggleCollapse}
          >
            <ArrowRight
              className={cn('transition-transform duration-300', collapsed ? '' : 'rotate-180')}
              size={17}
              strokeWidth={2.35}
              aria-hidden="true"
            />
          </button>
        </div>

        <nav className="grid gap-1.5" aria-label="Admin modules">
          {adminNavItems.map((item) => (
            <NavButton
              collapsed={collapsed}
              helper={item.helper}
              icon={item.icon}
              isActive={activeNav === item.key}
              itemKey={item.key}
              key={item.key}
              label={item.label}
              onSelect={onSelectNav}
            />
          ))}
        </nav>

        <div className={cn('border-t border-[var(--ui-border)] pt-3', collapsed ? 'grid justify-items-center' : '')}>
          <button
            aria-label="Logout development access"
            className={cn(
              'grid min-h-11 items-center gap-3 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-3 text-sm font-semibold text-[var(--ui-secondary-text)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25',
              collapsed ? 'w-11 grid-cols-1 justify-items-center px-0' : 'w-full grid-cols-[2rem_minmax(0,1fr)] text-left',
            )}
            type="button"
            onClick={clearDevAccess}
          >
            <LockKeyhole size={16} strokeWidth={2.25} aria-hidden="true" />
            {!collapsed ? <span>Logout dev</span> : null}
          </button>
        </div>
      </div>
    </aside>
  );
}

function AdminBottomBar({
  activeNav,
  onSelectNav,
}) {
  const mobileItems = adminNavItems.slice(0, 5);

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 grid rounded-[1.5rem] border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] p-1.5 shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] backdrop-blur-2xl md:hidden"
      aria-label="Admin mobile navigation"
    >
      <div className="flex items-stretch gap-1">
        {mobileItems.map((item) => (
          <NavButton
            icon={item.icon}
            isActive={activeNav === item.key}
            itemKey={item.key}
            key={item.key}
            label={item.label}
            onSelect={onSelectNav}
            variant="bottom"
          />
        ))}
      </div>
    </nav>
  );
}

function AdminHeader({
  activeItem,
}) {
  return (
    <header className="grid gap-5 border-b border-[var(--ui-border-strong)] pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-studio-accent ring-1 ring-[var(--ui-ring)]">
          <Sparkles size={14} strokeWidth={2.35} aria-hidden="true" />
          Admin Portal
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-4 text-sm font-semibold text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25"
            href="/"
          >
            Kembali
          </a>

          <button
            className="inline-flex min-h-10 items-center justify-center rounded-full [background:var(--ui-primary-bg)] px-4 text-sm font-semibold text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
            type="button"
            onClick={clearDevAccess}
          >
            Logout dev
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,340px)] lg:items-end">
        <div className="grid gap-3">
          <h1 className="m-0 max-w-[760px] text-[clamp(2.5rem,6vw,5.7rem)] font-semibold leading-[0.94] tracking-[-0.075em] text-[var(--ui-text-strong)]">
            Portal admin studio, siap diisi modul.
          </h1>

          <p className="m-0 max-w-2xl text-[clamp(0.98rem,1.25vw,1.12rem)] leading-8 text-[var(--ui-text-main)]">
            Ini cangkang dashboard awal untuk 37 Music Studio. Navigasi sudah disiapkan, konten masih placeholder ringan, dan semua warna mengikuti token theme yang sudah ada.
          </p>
        </div>

        <div className="grid gap-2 rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-4 ring-1 ring-[var(--ui-ring)]">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-studio-accent">
            Active module
          </span>
          <strong className="text-2xl font-semibold tracking-[-0.05em] text-[var(--ui-text-strong)]">
            {activeItem.label}
          </strong>
          <span className="text-sm leading-6 text-[var(--ui-text-muted)]">
            {activeItem.helper}. Modul ini belum punya fitur final, baru penanda area kerja.
          </span>
        </div>
      </div>
    </header>
  );
}

function AdminContent({
  activeItem,
}) {
  const ActiveIcon = activeItem.icon;

  return (
    <section className="grid gap-6 py-6" aria-labelledby="admin-shell-content-title">
      <div className="grid gap-4 lg:grid-cols-3">
        {shellStats.map((item) => (
          <div
            className="grid gap-1 border-y border-[var(--ui-border)] py-4 lg:border-y-0 lg:border-l lg:px-5 lg:first:border-l-0"
            key={item.label}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ui-text-muted)]">
              {item.label}
            </span>
            <strong className="text-xl font-semibold tracking-[-0.045em] text-[var(--ui-text-strong)]">
              {item.value}
            </strong>
          </div>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] p-5 shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] backdrop-blur-2xl sm:p-7">
        <div className="pointer-events-none absolute -right-24 -top-28 size-60 rounded-full bg-studio-accent/16 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 size-64 rounded-full bg-studio-cyan/14 blur-3xl" aria-hidden="true" />

        <div className="relative z-10 grid min-h-[360px] content-center justify-items-center gap-5 text-center">
          <div className="grid size-16 place-items-center rounded-[1.35rem] border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]">
            <ActiveIcon size={28} strokeWidth={2.1} aria-hidden="true" />
          </div>

          <div className="grid max-w-xl gap-3">
            <h2
              className="m-0 text-[clamp(2rem,5vw,4.4rem)] font-semibold leading-[0.95] tracking-[-0.07em] text-[var(--ui-text-strong)]"
              id="admin-shell-content-title"
            >
              {activeItem.label} belum diisi.
            </h2>

            <p className="m-0 text-base leading-8 text-[var(--ui-text-main)]">
              Area ini sengaja kosong dulu supaya tiap halaman admin bisa dibangun bertahap tanpa merusak landing page, login page, routing, atau theme system.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2.5">
            <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 py-2 text-xs font-semibold text-[var(--ui-text-main)] ring-1 ring-[var(--ui-ring)]">
              Desktop sidebar ready
            </span>
            <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 py-2 text-xs font-semibold text-[var(--ui-text-main)] ring-1 ring-[var(--ui-ring)]">
              Mobile bottom bar ready
            </span>
            <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 py-2 text-xs font-semibold text-[var(--ui-text-main)] ring-1 ring-[var(--ui-ring)]">
              Theme token ready
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AdminPage() {
  const [activeNav, setActiveNav] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const hasDevAccess =
    typeof window !== 'undefined' &&
    window.sessionStorage.getItem(DEV_AUTH_STORAGE_KEY) === 'true';

  const activeItem = useMemo(
    () => adminNavItems.find((item) => item.key === activeNav) || adminNavItems[0],
    [activeNav],
  );

  if (!hasDevAccess) {
    return <AdminLockedState />;
  }

  return (
    <section
      className="grid gap-6 pb-24 pt-2 md:grid-cols-[auto_minmax(0,1fr)] md:gap-6 md:pb-4"
      aria-labelledby="admin-shell-title"
    >
      <AdminSidebar
        activeNav={activeNav}
        collapsed={isSidebarCollapsed}
        onSelectNav={setActiveNav}
        onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
      />

      <div className="grid min-w-0 gap-0">
        <AdminHeader activeItem={activeItem} />

        <div className="sr-only" id="admin-shell-title">
          37 Music Studio Admin Shell
        </div>

        <AdminContent activeItem={activeItem} />
      </div>

      <AdminBottomBar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
      />
    </section>
  );
}
