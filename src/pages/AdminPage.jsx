import {
  useEffect,
  useMemo,
  useState,
  } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  } from 'react-router';
import {
  ArrowRight,
  LockKeyhole,
  Menu,
  Radio,
  ReceiptText,
  UsersRound,
  SlidersHorizontal,
  Moon,
  Sun,
  History,
  Boxes,
} from 'lucide-react';
import { cn } from '../lib/cn.js';
import { useTheme } from '../theme/ThemeProvider.jsx';
import { adminAuthRepository } from '../services/adminAuthRepository.js';
import { adminBookingRepository } from '../services/adminBookingRepository.js';
import { adminBillingRepository } from '../services/adminBillingRepository.js';

const initialAdminAuthState = {
  errorMessage: '',
  isAuthenticated: false,
  isReady: false,
  user: null,
};

const adminThemeSwitchStates = {
  dark: {
    ariaLabel: 'Switch to light mode',
    checked: true,
    knobClass: 'translate-x-8',
    knobIcon: Moon,
    trackHintClass: 'bg-studio-cyan/16',
  },
  light: {
    ariaLabel: 'Switch to dark mode',
    checked: false,
    knobClass: 'translate-x-0',
    knobIcon: Sun,
    trackHintClass: 'bg-studio-accent/14',
  },
};

const adminNavItems = [
  {
    key: 'bookings',
    label: 'Booking',
    helper: 'Jadwal sesi',
    icon: Radio,
    path: '/admin/bookings',
  },
  {
    key: 'billing',
    label: 'Billing',
    helper: 'Invoice & POS',
    icon: ReceiptText,
    path: '/admin/billing',
  },
  {
    key: 'customers',
    label: 'Customers',
    helper: 'Direktori customer',
    icon: UsersRound,
    path: '/admin/customers',
  },
  
  {
    key: 'inventory',
    label: 'Inventory',
    helper: 'Gear & aset',
    icon: Boxes,
    path: '/admin/inventory',
  },
{
    key: 'audit',
    label: 'Audit',
    helper: 'Riwayat aksi',
    icon: History,
    path: '/admin/audit',
  },
];

async function signOutAdmin(navigate) {
  await adminAuthRepository.signOutAdmin();
  navigate('/login', { replace: true });
}

function getActiveAdminItem(pathname) {
  return (
    adminNavItems.find((item) => (
      pathname === item.path || pathname.startsWith(item.path + '/')
    )) || adminNavItems[0]
  );
}

function AdminLockedState() {
  return (
    <section
      className="admin-locked-state grid min-h-[62vh] content-center gap-6 py-4"
      aria-labelledby="admin-locked-title"
    >
      <div className="grid max-w-2xl gap-4">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-studio-accent">
          Akses Admin
        </p>

        <h1
          className="m-0 max-w-[11ch] text-[clamp(2.65rem,6vw,5rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-[var(--ui-text-strong)]"
          id="admin-locked-title"
        >
          Masuk dulu untuk buka admin.
        </h1>

        <p className="m-0 max-w-xl leading-8 text-[var(--ui-text-main)]">
          Halaman admin membutuhkan sesi Firebase Auth. Login dulu untuk membuka portal jadwal, billing, customer, inventory, dan audit.
        </p>

        <Link
          className="inline-flex min-h-12 w-fit items-center justify-center rounded-full [background:var(--ui-primary-bg)] px-6 text-sm font-semibold tracking-[-0.01em] text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
          to="/login"
        >
          Ke halaman login
        </Link>
      </div>
    </section>
  );
}

function AdminAuthLoadingState() {
  return (
    <section
      className="admin-locked-state grid min-h-[62vh] content-center gap-5 py-4"
      aria-labelledby="admin-auth-loading-title"
    >
      <div className="grid max-w-2xl gap-3">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-studio-accent">
          Autentikasi Admin
        </p>

        <h1
          className="m-0 max-w-[12ch] text-[clamp(2.65rem,6vw,5rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-[var(--ui-text-strong)]"
          id="admin-auth-loading-title"
        >
          Mengecek akses admin.
        </h1>

        <p className="m-0 max-w-xl leading-8 text-[var(--ui-text-main)]">
          Portal sedang memvalidasi sesi Firebase Auth sebelum membuka Studio OS.
        </p>
      </div>
    </section>
  );
}

function NavButton({
  collapsed = false,
  icon: Icon,
  isActive,
  label,
  helper,
  to,
  variant = 'sidebar',
}) {
  const isBottomBar = variant === 'bottom';

  if (isBottomBar) {
    return (
      <NavLink
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'admin-bottom-nav-item group relative grid min-w-0 flex-1 place-items-center gap-1 overflow-hidden rounded-[0.95rem] px-1.5 py-1.5 text-[0.62rem] font-semibold tracking-[-0.01em] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20',
          isActive
            ? 'is-active bg-[var(--ui-control-hover)] text-[var(--ui-text-strong)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]'
            : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-control)] hover:text-[var(--ui-text-strong)]',
        )}
        to={to}
      >
        <span
          className={cn(
            'admin-bottom-nav-icon grid size-7 place-items-center rounded-[0.8rem] transition',
            isActive ? 'text-studio-accent' : 'text-[var(--ui-text-soft)] group-hover:text-studio-accent',
          )}
        >
          <Icon size={17} strokeWidth={2.25} aria-hidden="true" />
        </span>
        <span className="admin-bottom-nav-label max-w-full truncate">{label}</span>
      </NavLink>
    );
  }

  return (
    <NavLink
      aria-label={collapsed ? label : undefined}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'admin-sidebar-nav-item group relative grid min-h-11 w-full items-center gap-2 overflow-hidden rounded-[0.95rem] border px-2.5 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20',
        collapsed ? 'grid-cols-1 justify-items-center' : 'grid-cols-[2rem_minmax(0,1fr)]',
        isActive
          ? 'is-active border-studio-accent/32 bg-[var(--ui-control-hover)] text-[var(--ui-text-strong)] shadow-[var(--ui-shadow-control)] ring-1 ring-studio-accent/14'
          : 'border-transparent bg-transparent text-[var(--ui-text-main)] hover:border-[var(--ui-border)] hover:bg-[var(--ui-control)] hover:text-[var(--ui-text-strong)]',
      )}
      title={collapsed ? label : undefined}
      to={to}
    >
      <span
        className={cn(
          'admin-sidebar-nav-icon grid size-8 place-items-center rounded-[0.8rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] transition',
          isActive ? 'text-studio-accent' : 'text-[var(--ui-text-soft)] group-hover:text-studio-accent',
        )}
      >
        <Icon size={16} strokeWidth={2.25} aria-hidden="true" />
      </span>

      {!collapsed ? (
        <span className="grid min-w-0 gap-0.5">
          <span className="truncate text-sm font-semibold">{label}</span>
          <span className="truncate text-[0.7rem] font-medium text-[var(--ui-text-muted)]">{helper}</span>
        </span>
      ) : null}
    </NavLink>
  );
}

function AdminThemeControls({ collapsed = false }) {
  const { density, mode, toggleDensity, toggleMode } = useTheme();
  const themeSwitch = adminThemeSwitchStates[mode] || adminThemeSwitchStates.dark;
  const ThemeSwitchIcon = themeSwitch.knobIcon;

  return (
    <div
      className={cn(
        'grid gap-2 border-t border-[var(--ui-border)] pt-3',
        collapsed ? 'justify-items-center' : '',
      )}
      aria-label="Admin theme controls"
    >
      <button
        aria-label="Toggle density"
        className={cn(
          'min-h-10 items-center gap-2 rounded-[1.05rem] border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-xs font-semibold text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20',
          collapsed ? 'grid w-10 place-items-center px-0' : 'inline-flex justify-center px-3',
        )}
        type="button"
        onClick={toggleDensity}
      >
        <SlidersHorizontal size={14} strokeWidth={2.25} aria-hidden="true" />
        {!collapsed ? <span>Kepadatan: {density}</span> : null}
      </button>

      <button
        aria-checked={themeSwitch.checked}
        aria-label={themeSwitch.ariaLabel}
        className={cn(
          'admin-theme-switch group relative h-10 items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] p-1 shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20',
          mode === 'dark' ? 'is-dark' : 'is-light',
          collapsed ? 'inline-flex w-[72px]' : 'inline-flex w-full',
        )}
        role="switch"
        title={themeSwitch.ariaLabel}
        type="button"
        onClick={toggleMode}
      >
        <span className="sr-only">{themeSwitch.ariaLabel}</span>

        <span className="admin-theme-switch-icon admin-theme-switch-icon-sun absolute left-2 grid size-6 place-items-center text-[var(--ui-text-soft)] transition group-hover:text-studio-accent">
          <Sun size={13} aria-hidden="true" />
        </span>

        <span className="admin-theme-switch-icon admin-theme-switch-icon-moon absolute right-2 grid size-6 place-items-center text-[var(--ui-text-soft)] transition group-hover:text-studio-cyan">
          <Moon size={13} aria-hidden="true" />
        </span>

        <span
          className={cn(
            'admin-theme-switch-knob relative z-10 grid size-8 place-items-center rounded-full [background:var(--ui-primary-bg)] text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition-transform duration-300 ease-out',
            themeSwitch.knobClass,
          )}
          aria-hidden="true"
        >
          <ThemeSwitchIcon size={15} strokeWidth={2.35} />
        </span>

        <span
          className={cn(
            'admin-theme-switch-glow pointer-events-none absolute inset-1 rounded-full blur-md transition-opacity duration-300',
            themeSwitch.trackHintClass,
          )}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

function AdminSidebar({
  activePath,
  collapsed,
  onLogout,
  onToggleCollapse,
}) {
  return (
    <aside
      className={cn(
        'admin-sidebar sticky top-2.5 hidden max-h-[calc(100vh-1rem)] self-start overflow-hidden rounded-[1.35rem] border border-[var(--ui-border)] bg-[var(--ui-glass)] p-2 shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] md:grid',
        collapsed ? 'is-collapsed w-[76px]' : 'is-expanded w-[264px]',
      )}
      aria-label="Admin desktop navigation"
    >
      <div className={cn('admin-sidebar-inner grid min-h-0 gap-2 overflow-y-auto', collapsed ? 'justify-items-center' : '')}>
        <div
          className={cn(
            'admin-sidebar-brand flex min-h-12 items-center gap-2 rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-1.5 shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]',
            collapsed ? 'justify-center' : 'justify-between',
          )}
        >
          <Link
            className={cn('min-w-0 items-center gap-2', collapsed ? 'hidden' : 'flex')}
            to="/"
            aria-label="Back to 37 Music Studio landing"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-md [background:var(--ui-primary-bg)] text-xs font-semibold tracking-[-0.04em] text-[var(--ui-primary-text)]">
              37
            </span>

            <span className="grid min-w-0 gap-0">
              <strong className="truncate text-sm font-semibold tracking-[-0.025em] text-[var(--ui-text-strong)]">
                Studio OS
              </strong>
              <small className="truncate text-[0.68rem] font-medium text-[var(--ui-text-muted)]">
                Konsol admin
              </small>
            </span>
          </Link>

          <button
            aria-label={collapsed ? 'Expand admin sidebar' : 'Collapse admin sidebar'}
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-md border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] text-[var(--ui-text-main)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-studio-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20',
              collapsed ? '' : 'ml-auto',
            )}
            type="button"
            onClick={onToggleCollapse}
          >
            <ArrowRight
              className={cn('transition-transform duration-300', collapsed ? '' : 'rotate-180')}
              size={16}
              strokeWidth={2.35}
              aria-hidden="true"
            />
          </button>
        </div>

        <div className={cn('admin-sidebar-section grid gap-1.5', collapsed ? 'justify-items-center' : '')}>
          {!collapsed ? (
            <div className="flex items-center justify-between gap-2 px-2 pt-1">
              <span className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-soft)]">
                Modul
              </span>
              <span className="rounded-md border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-1.5 py-0.5 text-[0.58rem] font-semibold text-[var(--ui-text-muted)]">
                {adminNavItems.length}
              </span>
            </div>
          ) : null}

          <nav className="grid gap-1" aria-label="Admin modules">
            {adminNavItems.map((item) => (
              <NavButton
                collapsed={collapsed}
                helper={item.helper}
                icon={item.icon}
                isActive={activePath === item.path || activePath.startsWith(item.path + '/')}
                key={item.key}
                label={item.label}
                to={item.path}
              />
            ))}
          </nav>
        </div>

        <div className={cn('admin-sidebar-section mt-auto grid gap-2', collapsed ? 'justify-items-center' : '')}>
          {!collapsed ? (
            <div className="px-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-soft)]">
              Tampilan
            </div>
          ) : null}

          <AdminThemeControls collapsed={collapsed} />

          <button
            aria-label="Keluar dari akses admin"
            className={cn(
              'admin-sidebar-logout grid min-h-10 items-center gap-2 rounded-[0.95rem] border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-2.5 text-xs font-semibold text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20',
              collapsed ? 'w-10 grid-cols-1 justify-items-center px-0' : 'w-full grid-cols-[1.75rem_minmax(0,1fr)] text-left',
            )}
            type="button"
            onClick={onLogout}
          >
            <LockKeyhole size={15} strokeWidth={2.25} aria-hidden="true" />
            {!collapsed ? <span>Keluar</span> : null}
          </button>
        </div>
      </div>
    </aside>
  );
}

function AdminBottomBar({
  activePath,
  onLogout,
}) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const mobileItems = adminNavItems.filter((item) => item.key !== 'audit').slice(0, 4);
  const isAuditActive = activePath === '/admin/audit' || activePath.startsWith('/admin/audit/');

  useEffect(() => {
    setIsMoreOpen(false);
  }, [activePath]);

  return (
    <>
      <AdminMobileMoreMenu
        activePath={activePath}
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        onLogout={onLogout}
      />

      <nav
        className="admin-mobile-bottom-bar fixed inset-x-3 bottom-3 z-40 grid rounded-[1.35rem] border border-[var(--ui-border)] bg-[var(--ui-glass)] p-1.5 shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] backdrop-blur-xl md:hidden"
        aria-label="Admin mobile navigation"
      >
        <div className="admin-mobile-bottom-track flex items-stretch gap-1">
          {mobileItems.map((item) => (
            <NavButton
              icon={item.icon}
              isActive={activePath === item.path || activePath.startsWith(item.path + '/')}
              key={item.key}
              label={item.label}
              to={item.path}
              variant="bottom"
            />
          ))}

          <button
            aria-expanded={isMoreOpen}
            aria-label="Buka menu lainnya"
            className={cn(
              'admin-bottom-nav-item admin-bottom-more-button group relative grid min-w-0 flex-1 place-items-center gap-1 overflow-hidden rounded-[0.95rem] px-1.5 py-1.5 text-[0.62rem] font-semibold tracking-[-0.01em] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20',
              isMoreOpen || isAuditActive
                ? 'is-active bg-[var(--ui-control-hover)] text-[var(--ui-text-strong)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]'
                : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-control)] hover:text-[var(--ui-text-strong)]',
            )}
            type="button"
            onClick={() => setIsMoreOpen((current) => !current)}
          >
            <span
              className={cn(
                'admin-bottom-nav-icon grid size-7 place-items-center rounded-[0.8rem] transition',
                isMoreOpen || isAuditActive ? 'text-studio-accent' : 'text-[var(--ui-text-soft)] group-hover:text-studio-accent',
              )}
            >
              <Menu size={17} strokeWidth={2.25} aria-hidden="true" />
            </span>
            <span className="admin-bottom-nav-label max-w-full truncate">Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
}

function AdminMobileMoreMenu({
  activePath,
  isOpen,
  onClose,
  onLogout,
}) {
  const { mode, toggleMode } = useTheme();
  const themeSwitch = adminThemeSwitchStates[mode] || adminThemeSwitchStates.dark;
  const ThemeSwitchIcon = themeSwitch.knobIcon;
  const auditItem = adminNavItems.find((item) => item.key === 'audit');
  const AuditIcon = auditItem?.icon;

  if (!isOpen) return null;

  return (
    <div
      className="admin-mobile-more-menu fixed z-50 grid gap-1 rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-glass)] p-1 shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] backdrop-blur-xl md:hidden"
      aria-label="Admin mobile more menu"
    >
      {auditItem && AuditIcon ? (
        <NavLink
          className={cn(
            'admin-mobile-more-item grid min-h-10 grid-cols-[2rem_minmax(0,1fr)] items-center gap-2 rounded-[0.95rem] border px-2 text-left text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20',
            activePath === auditItem.path || activePath.startsWith(auditItem.path + '/')
              ? 'is-active border-studio-accent/25 bg-studio-accent/10 text-[var(--ui-text-strong)]'
              : 'border-transparent bg-transparent text-[var(--ui-text-main)] hover:bg-[var(--ui-control)]',
          )}
          to={auditItem.path}
          onClick={onClose}
        >
          <span className="grid size-8 place-items-center rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent">
            <AuditIcon size={15} strokeWidth={2.35} aria-hidden="true" />
          </span>
          <span className="grid min-w-0">
            <span className="truncate">{auditItem.label}</span>
            <span className="truncate text-[0.65rem] font-medium text-[var(--ui-text-muted)]">{auditItem.helper}</span>
          </span>
        </NavLink>
      ) : null}

      <button
        aria-checked={themeSwitch.checked}
        aria-label={themeSwitch.ariaLabel}
        className={cn(
          'admin-mobile-more-item admin-mobile-theme-switch relative grid min-h-10 grid-cols-[minmax(0,1fr)_5.2rem] items-center gap-2 rounded-[0.95rem] border border-transparent bg-transparent px-2 text-left text-xs font-semibold text-[var(--ui-text-main)] transition hover:bg-[var(--ui-control)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20',
          mode === 'dark' ? 'is-dark' : 'is-light',
        )}
        role="switch"
        title={themeSwitch.ariaLabel}
        type="button"
        onClick={toggleMode}
      >
        <span className="sr-only">{themeSwitch.ariaLabel}</span>
        <span>Tema</span>
        <span className="admin-mobile-theme-track" aria-hidden="true">
          <span className="admin-mobile-theme-icon admin-mobile-theme-icon-sun">
            <Sun size={13} strokeWidth={2.35} />
          </span>
          <span className="admin-mobile-theme-icon admin-mobile-theme-icon-moon">
            <Moon size={13} strokeWidth={2.35} />
          </span>
          <span className="admin-mobile-theme-knob">
            <ThemeSwitchIcon size={14} strokeWidth={2.35} />
          </span>
        </span>
      </button>

      <button
        aria-label="Logout admin access"
        className="admin-mobile-more-item admin-mobile-logout-button grid min-h-10 grid-cols-[2rem_minmax(0,1fr)] items-center gap-2 rounded-[0.95rem] border border-transparent bg-transparent px-2 text-left text-xs font-semibold text-[var(--ui-text-main)] transition hover:bg-[var(--ui-control)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
        type="button"
        onClick={onLogout}
      >
        <span className="grid size-8 place-items-center rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent">
          <LockKeyhole size={14} strokeWidth={2.35} aria-hidden="true" />
        </span>
        <span>Keluar</span>
      </button>
    </div>
  );
}

function AdminWorkspaceBar({
  activeItem,
  adminUser,
  onLogout,
}) {
  const ActiveIcon = activeItem.icon;

  return (
    <header className="admin-workspace-bar hidden min-w-0 items-center justify-between gap-3 rounded-[1.35rem] border border-[var(--ui-border)] bg-[linear-gradient(135deg,var(--ui-glass),var(--ui-glass-soft))] px-4 py-3 shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] md:flex">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent ring-1 ring-[var(--ui-ring)]">
          <ActiveIcon size={17} strokeWidth={2.35} aria-hidden="true" />
        </span>

        <span className="grid min-w-0 gap-0">
          <strong className="truncate text-sm font-semibold tracking-[-0.02em] text-[var(--ui-text-strong)]">
            {activeItem.label}
          </strong>
          <span className="truncate text-[0.72rem] font-medium text-[var(--ui-text-muted)]">
            {activeItem.helper}
          </span>
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <span className="max-w-[260px] truncate rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 py-2 text-xs font-semibold text-[var(--ui-text-muted)] ring-1 ring-[var(--ui-ring)]">
          {adminUser?.email || 'Sesi admin'}
        </span>

        <button
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-3 text-xs font-semibold text-[var(--ui-secondary-text)] ring-1 ring-[var(--ui-ring)] transition hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
          type="button"
          onClick={onLogout}
        >
          <LockKeyhole size={14} strokeWidth={2.25} aria-hidden="true" />
          Keluar
        </button>
      </div>
    </header>
  );
}

export function AdminPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [manualBookings, setManualBookings] = useState([]);
  const [billingTransactions, setBillingTransactions] = useState([]);
  const [adminBookingsState, setAdminBookingsState] = useState({
    errorMessage: '',
    isReady: false,
  });
  const [adminBillingState, setAdminBillingState] = useState({
    errorMessage: '',
    isReady: false,
  });
  const [adminAuthState, setAdminAuthState] = useState(initialAdminAuthState);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => adminAuthRepository.subscribeAdminAuth(setAdminAuthState), []);

  useEffect(() => {
    if (!adminAuthState.isAuthenticated) {
      setManualBookings([]);
      setAdminBookingsState({
        errorMessage: '',
        isReady: false,
      });

      return undefined;
    }

    setAdminBookingsState({
      errorMessage: '',
      isReady: false,
    });

    const unsubscribe = adminBookingRepository.subscribeManualBookings(
      (bookings) => {
        setManualBookings(bookings);
        setAdminBookingsState((current) => ({
          ...current,
          isReady: true,
        }));
      },
      () => {
        setAdminBookingsState({
          errorMessage: 'Firestore belum bisa dibaca penuh. Customer ditampilkan dari fallback lokal jika tersedia.',
          isReady: true,
        });
      },
    );

    return unsubscribe;
  }, [adminAuthState.isAuthenticated]);

  useEffect(() => {
    if (!adminAuthState.isAuthenticated) {
      setBillingTransactions([]);
      setAdminBillingState({
        errorMessage: '',
        isReady: false,
      });

      return undefined;
    }

    setAdminBillingState({
      errorMessage: '',
      isReady: false,
    });

    const unsubscribe = adminBillingRepository.subscribeBillingTransactions(
      (transactions) => {
        setBillingTransactions(transactions);
        setAdminBillingState((current) => ({
          ...current,
          isReady: true,
        }));
      },
      () => {
        setAdminBillingState({
          errorMessage: 'Billing belum bisa dibaca penuh. Customer billing history memakai data kosong jika fallback tidak tersedia.',
          isReady: true,
        });
      },
    );

    return unsubscribe;
  }, [adminAuthState.isAuthenticated]);

  const activeItem = useMemo(
    () => getActiveAdminItem(location.pathname),
    [location.pathname],
  );
  const adminOutletContext = useMemo(
    () => ({
      activeItem,
      adminUser: adminAuthState.user,
      addManualBooking: async (booking) => {
        try {
          return await adminBookingRepository.createManualBooking(booking);
        } catch (error) {
          console.error('Failed to create admin booking.', error);
          throw error;
        }
      },
      deleteManualBooking: async (bookingId) => {
        try {
          await adminBookingRepository.deleteManualBooking(bookingId);
        } catch (error) {
          console.error('Failed to delete admin booking.', error);
          throw error;
        }
      },
      billingLoadError: adminBillingState.errorMessage,
      billingTransactions,
      isBillingReady: adminBillingState.isReady,
      bookingLoadError: adminBookingsState.errorMessage,
      isBookingsReady: adminBookingsState.isReady,
      manualBookings,
      recordBookingAuditLog: async (entry) => {
        try {
          await adminBookingRepository.recordBookingAuditLog(entry);
        } catch (error) {
          console.error('Failed to record booking audit log.', error);
        }
      },
      updateManualBooking: async (booking) => {
        try {
          await adminBookingRepository.updateManualBooking(booking);
        } catch (error) {
          console.error('Failed to update admin booking.', error);
          throw error;
        }
      },
    }),
    [activeItem, adminAuthState.user, adminBillingState, adminBookingsState, billingTransactions, manualBookings],
  );

  if (!adminAuthState.isReady) {
    return <AdminAuthLoadingState />;
  }

  if (!adminAuthState.isAuthenticated) {
    return <AdminLockedState />;
  }

  return (
    <section
      className="admin-shell mx-auto grid w-full max-w-[1480px] gap-2 pb-24 pt-0 md:grid-cols-[auto_minmax(0,1fr)] md:gap-3 md:pb-2"
      aria-labelledby="admin-shell-title"
    >
      <AdminSidebar
        activePath={location.pathname}
        collapsed={isSidebarCollapsed}
        onLogout={() => { void signOutAdmin(navigate); }}
        onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
      />

      <div className="admin-content-shell grid min-w-0 content-start gap-2">
        <div className="sr-only" id="admin-shell-title">
          37 Music Studio Admin Shell
        </div>

        <AdminWorkspaceBar
          activeItem={activeItem}
          adminUser={adminAuthState.user}
          onLogout={() => { void signOutAdmin(navigate); }}
        />

        <Outlet context={adminOutletContext} />
      </div>

      <AdminBottomBar
        activePath={location.pathname}
        onLogout={() => { void signOutAdmin(navigate); }}
      />
    </section>
  );
}
