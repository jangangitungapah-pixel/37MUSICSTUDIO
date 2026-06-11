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
  Radio,
  UsersRound,
  SlidersHorizontal,
  Moon,
  Sun,
} from 'lucide-react';
import { cn } from '../lib/cn.js';
import { useTheme } from '../theme/ThemeProvider.jsx';
import { adminBookingRepository } from '../services/adminBookingRepository.js';

const DEV_AUTH_STORAGE_KEY = 'thirty-seven-dev-auth';

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
    helper: 'Incoming sessions',
    icon: Radio,
    path: '/admin/bookings',
  },
  {
    key: 'customers',
    label: 'Customers',
    helper: 'Client directory',
    icon: UsersRound,
    path: '/admin/customers',
  },
];

function clearDevAccess(navigate) {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(DEV_AUTH_STORAGE_KEY);
  }

  navigate('/login');
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
          'grid min-w-0 flex-1 place-items-center gap-1 rounded-2xl px-2 py-2 text-[0.66rem] font-semibold tracking-[-0.015em] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25',
          isActive
            ? 'bg-[var(--ui-control-hover)] text-studio-accent shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]'
            : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-control)] hover:text-[var(--ui-text-strong)]',
        )}
        to={to}
      >
        <Icon size={18} strokeWidth={2.25} aria-hidden="true" />
        <span className="max-w-full truncate">{label}</span>
      </NavLink>
    );
  }

  return (
    <NavLink
      aria-label={collapsed ? label : undefined}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group grid min-h-12 w-full items-center gap-3 rounded-2xl border px-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25',
        collapsed ? 'grid-cols-1 justify-items-center' : 'grid-cols-[2.25rem_minmax(0,1fr)]',
        isActive
          ? 'border-studio-accent/35 bg-[var(--ui-control-hover)] text-[var(--ui-text-strong)] shadow-[var(--ui-shadow-control)] ring-1 ring-studio-accent/15'
          : 'border-transparent bg-transparent text-[var(--ui-text-main)] hover:border-[var(--ui-border)] hover:bg-[var(--ui-control)] hover:text-[var(--ui-text-strong)]',
      )}
      title={collapsed ? label : undefined}
      to={to}
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
          'min-h-10 items-center gap-2 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-sm font-semibold text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25',
          collapsed ? 'grid w-11 place-items-center px-0' : 'inline-flex justify-center px-3',
        )}
        type="button"
        onClick={toggleDensity}
      >
        <SlidersHorizontal size={15} strokeWidth={2.25} aria-hidden="true" />
        {!collapsed ? <span>Density: {density}</span> : null}
      </button>

      <button
        aria-checked={themeSwitch.checked}
        aria-label={themeSwitch.ariaLabel}
        className={cn(
          'group relative h-10 items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] p-1 shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25',
          collapsed ? 'inline-flex w-[76px]' : 'inline-flex w-full',
        )}
        role="switch"
        title={themeSwitch.ariaLabel}
        type="button"
        onClick={toggleMode}
      >
        <span className="sr-only">{themeSwitch.ariaLabel}</span>

        <span className="absolute left-2 grid size-6 place-items-center text-[var(--ui-text-soft)] transition group-hover:text-studio-accent">
          <Sun size={14} aria-hidden="true" />
        </span>

        <span className="absolute right-2 grid size-6 place-items-center text-[var(--ui-text-soft)] transition group-hover:text-studio-cyan">
          <Moon size={14} aria-hidden="true" />
        </span>

        <span
          className={cn(
            'relative z-10 grid size-8 place-items-center rounded-full [background:var(--ui-primary-bg)] text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition-transform duration-300 ease-out',
            themeSwitch.knobClass,
          )}
          aria-hidden="true"
        >
          <ThemeSwitchIcon size={16} strokeWidth={2.35} />
        </span>

        <span
          className={cn(
            'pointer-events-none absolute inset-1 rounded-full blur-md transition-opacity duration-300',
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
        'sticky top-4 hidden self-start overflow-hidden rounded-[2rem] border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] p-3 shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] backdrop-blur-2xl md:grid',
        collapsed ? 'w-[88px]' : 'w-[292px]',
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
          <Link
            className={cn('min-w-0 items-center gap-3', collapsed ? 'hidden' : 'flex')}
            to="/"
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
                Routed portal shell
              </small>
            </span>
          </Link>

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
              isActive={activePath === item.path || activePath.startsWith(item.path + '/')}
              key={item.key}
              label={item.label}
              to={item.path}
            />
          ))}
        </nav>

        <AdminThemeControls collapsed={collapsed} />

        <div className={cn('border-t border-[var(--ui-border)] pt-3', collapsed ? 'grid justify-items-center' : '')}>
          <button
            aria-label="Logout development access"
            className={cn(
              'grid min-h-11 items-center gap-3 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-3 text-sm font-semibold text-[var(--ui-secondary-text)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25',
              collapsed ? 'w-11 grid-cols-1 justify-items-center px-0' : 'w-full grid-cols-[2rem_minmax(0,1fr)] text-left',
            )}
            type="button"
            onClick={onLogout}
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
  activePath,
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
            isActive={activePath === item.path || activePath.startsWith(item.path + '/')}
            key={item.key}
            label={item.label}
            to={item.path}
            variant="bottom"
          />
        ))}
      </div>
    </nav>
  );
}

export function AdminPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [manualBookings, setManualBookings] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = adminBookingRepository.subscribeManualBookings(setManualBookings);

    return unsubscribe;
  }, []);

  const hasDevAccess =
    typeof window !== 'undefined' &&
    window.sessionStorage.getItem(DEV_AUTH_STORAGE_KEY) === 'true';

  const activeItem = useMemo(
    () => getActiveAdminItem(location.pathname),
    [location.pathname],
  );
  const adminOutletContext = useMemo(
    () => ({
      activeItem,
      addManualBooking: async (booking) => {
        await adminBookingRepository.createManualBooking(booking);
      },
      manualBookings,
    }),
    [activeItem, manualBookings],
  );

  if (!hasDevAccess) {
    return <AdminLockedState />;
  }

  return (
    <section
      className="grid gap-4 pb-24 pt-0 md:grid-cols-[auto_minmax(0,1fr)] md:gap-5 md:pb-4"
      aria-labelledby="admin-shell-title"
    >
      <AdminSidebar
        activePath={location.pathname}
        collapsed={isSidebarCollapsed}
        onLogout={() => clearDevAccess(navigate)}
        onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
      />

      <div className="grid min-w-0 gap-0">
        <div className="sr-only" id="admin-shell-title">
          37 Music Studio Admin Shell
        </div>

        <Outlet context={adminOutletContext} />
      </div>

      <AdminBottomBar activePath={location.pathname} />
    </section>
  );
}
