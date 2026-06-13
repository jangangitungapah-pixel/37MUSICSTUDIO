import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Link,
  useOutletContext,
} from 'react-router';
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  History,
  ReceiptText,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { cn } from '../lib/cn.js';
import {
  AdminBadge,
  AdminButton,
  AdminCommandBar,
  AdminPageHeader,
  AdminPageShell,
  AdminPanel,
} from '../components/admin/AdminPrimitives.jsx';
import { adminBookingRepository } from '../services/adminBookingRepository.js';

const actionFilters = [
  {
    key: 'all',
    label: 'Semua',
  },
  {
    key: 'create',
    label: 'Create',
  },
  {
    key: 'edit',
    label: 'Edit',
  },
  {
    key: 'paid',
    label: 'Paid',
  },
  {
    key: 'delete',
    label: 'Delete',
  },
];

const actionToneClasses = {
  create: 'border-studio-cyan/35 bg-studio-cyan/10 text-studio-cyan ring-studio-cyan/15',
  delete: 'border-studio-accent/35 bg-studio-accent/10 text-studio-accent ring-studio-accent/15',
  edit: 'border-studio-purple/35 bg-studio-purple/10 text-studio-purple ring-studio-purple/15',
  paid: 'border-studio-cyan/35 bg-studio-cyan/10 text-studio-cyan ring-studio-cyan/15',
};

function formatAuditTimestamp(value) {
  if (!value) {
    return '-';
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

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(Number(value) || 0);
}

function normalizeSearchText(value) {
  return String(value || '').trim().toLowerCase();
}

function getActionToneClass(action) {
  return actionToneClasses[action] || 'border-[var(--ui-border)] bg-[var(--ui-control)] text-[var(--ui-text-main)] ring-[var(--ui-ring)]';
}

function getActorLabel(log) {
  return log.by?.displayName || log.by?.email || 'Admin';
}

function getSnapshotCustomer(log) {
  return log.bookingSnapshot?.customerName || 'Booking';
}

function getSnapshotSession(log) {
  return log.bookingSnapshot?.sessionType || 'Studio session';
}

function getAuditTimeValue(log) {
  const date = new Date(log?.at || log?.recordedAt || 0);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function compareAuditLogsByTime(firstLog, secondLog) {
  const firstTime = getAuditTimeValue(firstLog);
  const secondTime = getAuditTimeValue(secondLog);

  if (firstTime !== secondTime) {
    return secondTime - firstTime;
  }

  return String(secondLog.id || '').localeCompare(String(firstLog.id || ''));
}

function createBookingAuditSnapshot(booking) {
  return {
    customerName: booking.customerName || booking.title || '',
    dateKey: booking.dateKey || '',
    phone: booking.phone || '',
    sessionType: booking.sessionType || booking.title || '',
    status: booking.status || '',
    time: booking.time || '',
    totalPrice: booking.totalPrice || 0,
  };
}

function createBookingAuditTrailLog(booking, entry, index) {
  return {
    action: entry.action || 'activity',
    at: entry.at || booking.updatedAt || booking.createdAt || '',
    bookingId: booking.id,
    bookingSnapshot: createBookingAuditSnapshot(booking),
    by: entry.by || booking.updatedBy || booking.createdBy || {},
    id: booking.id + ':' + (entry.id || entry.action || 'activity') + ':' + index,
    label: entry.label || entry.action || 'Booking activity',
    recordedAt: entry.at || booking.updatedAt || booking.createdAt || '',
    source: 'booking.auditTrail',
    studioId: booking.studioId || 'main-studio',
  };
}

function createBookingLastActionLog(booking) {
  if (!booking.lastAction) {
    return null;
  }

  return {
    action: booking.lastAction,
    at: booking.lastActionAt || booking.updatedAt || booking.createdAt || '',
    bookingId: booking.id,
    bookingSnapshot: createBookingAuditSnapshot(booking),
    by: booking.updatedBy || booking.createdBy || {},
    id: booking.id + ':last-action:' + booking.lastAction,
    label: booking.lastActionLabel || booking.lastAction,
    recordedAt: booking.lastActionAt || booking.updatedAt || booking.createdAt || '',
    source: 'booking.lastAction',
    studioId: booking.studioId || 'main-studio',
  };
}

function createBookingAuditTrailLogs(booking) {
  if (!booking || !booking.id) {
    return [];
  }

  const trail = Array.isArray(booking.auditTrail) ? booking.auditTrail : [];

  if (trail.length > 0) {
    return trail.map((entry, index) => createBookingAuditTrailLog(booking, entry, index));
  }

  const lastActionLog = createBookingLastActionLog(booking);

  return lastActionLog ? [lastActionLog] : [];
}

function mergeAuditLogs(bookingLogs, detachedLogs) {
  const seenIds = new Set();

  return [...bookingLogs, ...detachedLogs]
    .filter((log) => {
      const stableId = log.id || [
        log.bookingId,
        log.action,
        log.at,
        log.label,
      ].join(':');

      if (seenIds.has(stableId)) {
        return false;
      }

      seenIds.add(stableId);
      return true;
    })
    .sort(compareAuditLogsByTime);
}

function AuditMetric({
  helper,
  icon: Icon,
  label,
  tone = 'neutral',
  value,
}) {
  return (
    <AdminPanel className="grid gap-2 p-4" variant="flat">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
          {label}
        </span>

        {Icon ? (
          <AdminBadge className="size-8 justify-center px-0" icon={Icon} tone={tone}>
            <span className="sr-only">{label}</span>
          </AdminBadge>
        ) : null}
      </div>

      <strong className="text-3xl font-semibold leading-none tracking-[-0.07em] text-[var(--ui-text-strong)]">
        {value}
      </strong>

      <span className="text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
        {helper}
      </span>
    </AdminPanel>
  );
}

function AuditToolbar({
  actionFilter,
  onActionFilterChange,
  onSearchChange,
  searchQuery,
}) {
  return (
    <AdminCommandBar className="audit-toolbar gap-3 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <label className="flex min-h-11 items-center gap-3 rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] focus-within:border-studio-accent/55 focus-within:ring-4 focus-within:ring-studio-accent/20">
        <Search className="shrink-0 text-[var(--ui-text-muted)]" size={17} strokeWidth={2.35} aria-hidden="true" />
        <span className="sr-only">Cari audit log</span>
        <input
          className="min-w-0 flex-1 border-0 bg-transparent text-sm font-semibold text-[var(--ui-text-strong)] outline-none placeholder:text-[var(--ui-text-soft)]"
          placeholder="Cari customer, action, admin, booking ID..."
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <div className="flex min-w-0 flex-wrap gap-1.5">
        {actionFilters.map((item) => {
          const isActive = actionFilter === item.key;

          return (
            <button
              aria-pressed={isActive}
              className={cn(
                'min-h-9 rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.12em] ring-1 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20',
                isActive
                  ? 'border-studio-accent/35 bg-studio-accent/10 text-studio-accent ring-studio-accent/15'
                  : 'border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-[var(--ui-secondary-text)] ring-[var(--ui-ring)] hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)]',
              )}
              key={item.key}
              type="button"
              onClick={() => onActionFilterChange(item.key)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </AdminCommandBar>
  );
}

function AuditLogCard({
  log,
}) {
  const snapshot = log.bookingSnapshot || {};
  const customer = getSnapshotCustomer(log);
  const session = getSnapshotSession(log);
  const actionToneClass = getActionToneClass(log.action);
  const customerQuery = encodeURIComponent(customer);

  return (
    <AdminPanel as="article" className="audit-log-card grid gap-4 p-4 sm:p-5" variant="default">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div className="grid min-w-0 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.13em] ring-1', actionToneClass)}>
              {log.label || log.action}
            </span>

            <AdminBadge icon={Clock3} tone="neutral">
              {formatAuditTimestamp(log.at)}
            </AdminBadge>
          </div>

          <h2 className="m-0 truncate text-2xl font-semibold leading-tight tracking-[-0.055em] text-[var(--ui-text-strong)] sm:text-3xl">
            {customer}
          </h2>

          <p className="m-0 text-sm leading-6 text-[var(--ui-text-muted)]">
            {session} • {snapshot.dateKey || '-'} • {snapshot.time || '-'} • {snapshot.status || 'status kosong'}
          </p>
        </div>

        <AdminButton
          as={Link}
          className="w-fit"
          icon={ArrowUpRight}
          to={'/admin/bookings?customer=' + customerQuery}
          variant="primary"
        >
          Board
        </AdminButton>
      </div>

      <div className="grid gap-2 border-y border-[var(--ui-border)] py-3 sm:grid-cols-3">
        <div className="grid gap-1">
          <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
            <UserRound size={13} strokeWidth={2.35} aria-hidden="true" />
            Actor
          </span>
          <strong className="min-w-0 truncate text-sm font-semibold text-[var(--ui-text-strong)]">
            {getActorLabel(log)}
          </strong>
        </div>

        <div className="grid gap-1">
          <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
            <CalendarDays size={13} strokeWidth={2.35} aria-hidden="true" />
            Booking ID
          </span>
          <strong className="min-w-0 truncate text-sm font-semibold text-[var(--ui-text-strong)]">
            {log.bookingId}
          </strong>
        </div>

        <div className="grid gap-1">
          <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
            <ReceiptText size={13} strokeWidth={2.35} aria-hidden="true" />
            Total
          </span>
          <strong className="min-w-0 truncate text-sm font-semibold text-[var(--ui-text-strong)]">
            {formatCurrency(snapshot.totalPrice)}
          </strong>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
        <ShieldCheck size={14} strokeWidth={2.35} aria-hidden="true" />
        <span>
          Source: {log.source || 'admin'} • Studio: {log.studioId || 'main-studio'}
        </span>
      </div>
    </AdminPanel>
  );
}

function AuditEmptyState({
  hasLogs,
}) {
  return (
    <AdminPanel className="grid min-h-[20rem] place-items-center border-dashed p-6 text-center" variant="flat">
      <div className="grid max-w-md gap-3">
        <span className="mx-auto grid size-12 place-items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent ring-1 ring-[var(--ui-ring)]">
          <History size={20} strokeWidth={2.35} aria-hidden="true" />
        </span>

        <h2 className="m-0 text-2xl font-semibold tracking-[-0.05em] text-[var(--ui-text-strong)]">
          {hasLogs ? 'Filter belum menemukan log.' : 'Belum ada audit log.'}
        </h2>

        <p className="m-0 text-sm leading-6 text-[var(--ui-text-muted)]">
          {hasLogs
            ? 'Coba ubah keyword atau filter action untuk melihat aktivitas lain.'
            : 'Activity create/edit/paid dibaca dari auditTrail booking aktif. Log delete dibaca dari bookingAuditLogs karena booking-nya sudah dihapus.'}
        </p>
      </div>
    </AdminPanel>
  );
}

export function AuditAdmin() {
  const { adminUser = null, manualBookings = [] } = useOutletContext() || {};
  const [actionFilter, setActionFilter] = useState('all');
  const [detachedAuditLogs, setDetachedAuditLogs] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setIsLoading(true);

    const unsubscribe = adminBookingRepository.subscribeBookingAuditLogs(
      (nextLogs) => {
        setDetachedAuditLogs(nextLogs);
        setIsLoading(false);
      },
      () => {
        setErrorMessage('Audit log belum bisa dimuat. Cek koneksi, login Firebase, atau Firestore rules.');
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const bookingAuditTrailLogs = useMemo(
    () => manualBookings.flatMap((booking) => createBookingAuditTrailLogs(booking)),
    [manualBookings],
  );

  const auditLogs = useMemo(
    () => mergeAuditLogs(bookingAuditTrailLogs, detachedAuditLogs),
    [bookingAuditTrailLogs, detachedAuditLogs],
  );

  const filteredLogs = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery);

    return auditLogs.filter((log) => {
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const searchableText = normalizeSearchText([
        log.action,
        log.label,
        log.bookingId,
        log.by?.displayName,
        log.by?.email,
        log.bookingSnapshot?.customerName,
        log.bookingSnapshot?.phone,
        log.bookingSnapshot?.sessionType,
        log.bookingSnapshot?.status,
        log.bookingSnapshot?.dateKey,
        log.bookingSnapshot?.time,
      ].join(' '));

      return matchesAction && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [actionFilter, auditLogs, searchQuery]);

  const metrics = useMemo(() => {
    const totals = {
      create: 0,
      delete: 0,
      edit: 0,
      paid: 0,
    };

    for (const log of auditLogs) {
      if (Object.prototype.hasOwnProperty.call(totals, log.action)) {
        totals[log.action] += 1;
      }
    }

    return totals;
  }, [auditLogs]);

  return (
    <AdminPageShell className="audit-admin-workspace gap-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-1 md:pb-4 md:pt-2" width="wide">

      <AdminPageHeader
        actions={(
          <AdminButton
            as={Link}
            icon={ArrowUpRight}
            to="/admin/bookings"
            variant="secondary"
          >
            Kembali ke booking
          </AdminButton>
        )}
        description={`Monitor aktivitas booking dari auditTrail booking aktif dan bookingAuditLogs. Login aktif: ${adminUser?.email || 'admin'}.`}
        eyebrow="Audit viewer"
        meta={(
          <>
            <AdminBadge icon={History} tone="strong">
              {auditLogs.length} total logs
            </AdminBadge>
            <AdminBadge icon={Search} tone="neutral">
              {filteredLogs.length} visible
            </AdminBadge>
          </>
        )}
        title="Booking activity"
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Audit summary">
        <AuditMetric icon={ReceiptText} label="Create" value={metrics.create} helper="Booking dibuat" tone="cyan" />
        <AuditMetric icon={History} label="Edit" value={metrics.edit} helper="Booking diperbarui" tone="purple" />
        <AuditMetric icon={ShieldCheck} label="Paid" value={metrics.paid} helper="Ditandai lunas" tone="cyan" />
        <AuditMetric icon={CalendarDays} label="Delete" value={metrics.delete} helper="Log penghapusan" tone="accent" />
      </section>

<AuditToolbar
        actionFilter={actionFilter}
        searchQuery={searchQuery}
        onActionFilterChange={setActionFilter}
        onSearchChange={setSearchQuery}
      />

      {errorMessage ? (
        <div className="rounded-[1.35rem] border border-studio-accent/35 bg-studio-accent/10 px-4 py-3 text-sm font-semibold leading-6 text-[var(--ui-text-main)] ring-1 ring-studio-accent/15">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid min-h-[20rem] place-items-center rounded-[1.75rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-6 text-center ring-1 ring-[var(--ui-ring)]">
          <div className="grid gap-2">
            <strong className="text-xl font-semibold tracking-[-0.04em] text-[var(--ui-text-strong)]">
              Memuat audit log...
            </strong>
            <span className="text-sm text-[var(--ui-text-muted)]">
              Mengambil data dari Firestore.
            </span>
          </div>
        </div>
      ) : filteredLogs.length > 0 ? (
        <div className="grid gap-3">
          {filteredLogs.map((log) => (
            <AuditLogCard key={log.id || log.bookingId + log.at + log.action} log={log} />
          ))}
        </div>
      ) : (
        <AuditEmptyState hasLogs={auditLogs.length > 0} />
      )}
    </AdminPageShell>
  );
}
