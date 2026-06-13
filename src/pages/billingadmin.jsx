import { useMemo, useState } from 'react';
import {
  Banknote,
  CreditCard,
  Plus,
  Printer,
  ReceiptText,
  Search,
  WalletCards,
} from 'lucide-react';
import { useOutletContext } from 'react-router';
import {
  AdminBadge,
  AdminButton,
  AdminCommandBar,
  AdminPageHeader,
  AdminPageShell,
  AdminPanel,
} from '../components/admin/AdminPrimitives.jsx';

const billingStatusFilters = [
  {
    key: 'all',
    label: 'All',
  },
  {
    key: 'pending',
    label: 'Pending',
  },
  {
    key: 'dp',
    label: 'DP',
  },
  {
    key: 'paid',
    label: 'Paid',
  },
];

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(Math.max(0, Number(value) || 0));
}

function getBookingCustomerName(booking) {
  return String(booking?.customerName || booking?.title || 'Walk-in customer').trim();
}

function getBookingTotal(booking) {
  return Number(booking?.totalPrice || 0);
}

function getBookingPaidAmount(booking) {
  if (booking?.status === 'paid') {
    return getBookingTotal(booking);
  }

  return Number(booking?.dpAmount || 0);
}

function getBookingRemainingAmount(booking) {
  if (booking?.status === 'paid') {
    return 0;
  }

  if (Number.isFinite(Number(booking?.remainingPayment))) {
    return Math.max(0, Number(booking.remainingPayment));
  }

  return Math.max(0, getBookingTotal(booking) - getBookingPaidAmount(booking));
}

function getBillingStatusLabel(status) {
  if (status === 'paid') return 'Paid';
  if (status === 'dp') return 'DP active';
  return 'Pending';
}

function getBillingStatusTone(status) {
  if (status === 'paid') return 'cyan';
  if (status === 'dp') return 'purple';
  return 'accent';
}

function createBillingQueueFromBookings(bookings) {
  return (Array.isArray(bookings) ? bookings : [])
    .filter((booking) => booking?.status !== 'paid')
    .map((booking) => ({
      bookingId: booking.id || '',
      customerName: getBookingCustomerName(booking),
      dateKey: booking.dateKey || '',
      invoiceNumber: 'DRAFT-' + String(booking.id || booking.dateKey || Date.now()).slice(-6).toUpperCase(),
      paidAmount: getBookingPaidAmount(booking),
      remainingAmount: getBookingRemainingAmount(booking),
      sourceLabel: 'Booking',
      status: booking.status || 'pending',
      time: booking.time || '',
      totalAmount: getBookingTotal(booking),
    }));
}

function getBillingSummary(queue, bookings) {
  const paidBookings = (Array.isArray(bookings) ? bookings : []).filter((booking) => booking?.status === 'paid');
  const dpActive = queue.filter((item) => item.status === 'dp').length;
  const pending = queue.filter((item) => item.status !== 'dp').length;
  const paidToday = paidBookings.reduce((sum, booking) => sum + getBookingTotal(booking), 0);
  const revenueToday = paidToday + queue.reduce((sum, item) => sum + item.paidAmount, 0);

  return {
    dpActive,
    paidToday,
    pending,
    revenueToday,
  };
}

function BillingSummaryRail({ summary }) {
  const items = [
    {
      icon: Banknote,
      label: 'Paid today',
      tone: 'cyan',
      value: formatCurrency(summary.paidToday),
    },
    {
      icon: ReceiptText,
      label: 'Pending',
      tone: 'accent',
      value: summary.pending,
    },
    {
      icon: WalletCards,
      label: 'DP active',
      tone: 'purple',
      value: summary.dpActive,
    },
    {
      icon: CreditCard,
      label: 'Revenue',
      tone: 'neutral',
      value: formatCurrency(summary.revenueToday),
    },
  ];

  return (
    <section className="billing-summary-rail grid gap-2 sm:grid-cols-4" aria-label="Billing summary">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <AdminPanel
            as="article"
            className="grid min-h-16 gap-2 p-3"
            key={item.label}
            variant="flat"
          >
            <span className="inline-flex min-w-0 items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
              <Icon className="shrink-0 text-studio-accent" size={14} strokeWidth={2.35} aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </span>

            <strong className="truncate text-base font-semibold tracking-[-0.045em] text-[var(--ui-text-strong)]">
              {item.value}
            </strong>
          </AdminPanel>
        );
      })}
    </section>
  );
}

function BillingCommandBar({
  searchTerm,
  statusFilter,
  visibleCount,
  onSearchChange,
  onStatusFilterChange,
}) {
  return (
    <AdminCommandBar className="billing-command-bar gap-2 p-2 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
      <label className="grid gap-1 text-xs font-semibold text-[var(--ui-text-main)]">
        <span className="sr-only">Search invoice or customer</span>

        <span className="flex min-h-11 items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 ring-1 ring-[var(--ui-ring)] focus-within:border-studio-accent/55 focus-within:ring-4 focus-within:ring-studio-accent/20">
          <Search className="shrink-0 text-[var(--ui-text-muted)]" size={15} strokeWidth={2.35} aria-hidden="true" />
          <input
            className="w-full border-0 bg-transparent text-sm font-semibold text-[var(--ui-text-strong)] outline-none placeholder:text-[var(--ui-text-soft)]"
            placeholder="Cari invoice / customer..."
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </span>
      </label>

      <div className="grid grid-cols-4 gap-1 rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-1 ring-1 ring-[var(--ui-ring)]">
        {billingStatusFilters.map((item) => (
          <button
            aria-pressed={statusFilter === item.key}
            className={
              statusFilter === item.key
                ? 'min-h-9 rounded-full bg-[var(--ui-control-hover)] px-3 text-xs font-semibold text-studio-accent shadow-[var(--ui-shadow-control)]'
                : 'min-h-9 rounded-full px-3 text-xs font-semibold text-[var(--ui-text-muted)] transition hover:bg-[var(--ui-control)] hover:text-[var(--ui-text-strong)]'
            }
            key={item.key}
            type="button"
            onClick={() => onStatusFilterChange(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <AdminBadge className="min-h-10 justify-center px-3" icon={ReceiptText} tone="strong">
        {visibleCount} draft
      </AdminBadge>
    </AdminCommandBar>
  );
}

function BillingQueue({ queue }) {
  if (!queue.length) {
    return (
      <AdminPanel className="grid min-h-48 place-items-center p-6 text-center" variant="flat">
        <div className="grid max-w-md gap-2">
          <span className="mx-auto grid size-12 place-items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent ring-1 ring-[var(--ui-ring)]">
            <ReceiptText size={20} strokeWidth={2.35} aria-hidden="true" />
          </span>

          <h2 className="m-0 text-xl font-semibold tracking-[-0.045em] text-[var(--ui-text-strong)]">
            Belum ada draft invoice.
          </h2>

          <p className="m-0 text-sm leading-6 text-[var(--ui-text-muted)]">
            Booking pending atau DP akan muncul di sini sebagai draft billing pada fase berikutnya.
          </p>
        </div>
      </AdminPanel>
    );
  }

  return (
    <AdminPanel className="billing-queue grid gap-2 p-2" variant="flat">
      {queue.map((item) => (
        <article
          className="grid gap-3 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-3 ring-1 ring-[var(--ui-ring)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
          key={item.bookingId || item.invoiceNumber}
        >
          <div className="grid min-w-0 gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <AdminBadge tone={getBillingStatusTone(item.status)}>
                {getBillingStatusLabel(item.status)}
              </AdminBadge>
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
                {item.invoiceNumber}
              </span>
            </div>

            <strong className="truncate text-base font-semibold tracking-[-0.04em] text-[var(--ui-text-strong)]">
              {item.customerName}
            </strong>

            <span className="text-xs font-medium text-[var(--ui-text-muted)]">
              {item.sourceLabel} • {item.dateKey || 'No date'} • {item.time || 'No time'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-right sm:min-w-[18rem]">
            <span className="grid gap-1">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">Total</span>
              <strong className="truncate text-sm font-semibold text-[var(--ui-text-strong)]">{formatCurrency(item.totalAmount)}</strong>
            </span>
            <span className="grid gap-1">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">Paid</span>
              <strong className="truncate text-sm font-semibold text-[var(--ui-text-strong)]">{formatCurrency(item.paidAmount)}</strong>
            </span>
            <span className="grid gap-1">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">Sisa</span>
              <strong className="truncate text-sm font-semibold text-[var(--ui-text-strong)]">{formatCurrency(item.remainingAmount)}</strong>
            </span>
          </div>
        </article>
      ))}
    </AdminPanel>
  );
}

export function BillingAdmin() {
  const adminContext = useOutletContext() || {};
  const { manualBookings = [] } = adminContext;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const queue = useMemo(
    () => createBillingQueueFromBookings(manualBookings),
    [manualBookings],
  );

  const filteredQueue = useMemo(() => {
    const normalizedSearch = String(searchTerm || '').trim().toLowerCase();

    return queue.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesSearch = !normalizedSearch ||
        item.customerName.toLowerCase().includes(normalizedSearch) ||
        item.invoiceNumber.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [queue, searchTerm, statusFilter]);

  const summary = useMemo(
    () => getBillingSummary(queue, manualBookings),
    [manualBookings, queue],
  );

  return (
    <AdminPageShell className="billing-admin-workspace gap-3 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-1 sm:gap-4 md:pb-4 md:pt-2" width="wide">
      <div className="sr-only" id="billing-admin-title">
        Billing admin workspace
      </div>

      <AdminPageHeader
        description="Kelola invoice booking, pembayaran, dan transaksi POS studio."
        eyebrow="Studio billing"
        meta={(
          <>
            <AdminBadge icon={ReceiptText} tone="strong">
              Draft shell
            </AdminBadge>
            <AdminBadge icon={WalletCards} tone="cyan">
              Read only
            </AdminBadge>
          </>
        )}
        title="Billing studio"
      />

      <BillingSummaryRail summary={summary} />

      <BillingCommandBar
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        visibleCount={filteredQueue.length}
        onSearchChange={setSearchTerm}
        onStatusFilterChange={setStatusFilter}
      />

      <BillingQueue queue={filteredQueue} />

      <AdminPanel className="grid gap-3 p-4" variant="flat">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-studio-accent">
              Next phase
            </span>
            <strong className="text-base font-semibold text-[var(--ui-text-strong)]">
              Repository service + invoice draft
            </strong>
          </div>

          <div className="flex flex-wrap gap-2">
            <AdminButton disabled icon={Plus} size="sm" variant="primary">
              New POS
            </AdminButton>
            <AdminButton disabled icon={Printer} size="sm" variant="secondary">
              Print
            </AdminButton>
          </div>
        </div>

        <p className="m-0 text-sm leading-6 text-[var(--ui-text-muted)]">
          BILLING.1 hanya menambahkan route, nav, dan read-only shell. Firestore write, create invoice, payment flow, dan receipt print masuk fase berikutnya.
        </p>
      </AdminPanel>
    </AdminPageShell>
  );
}
