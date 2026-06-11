import {
  useMemo,
  useState,
} from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  History,
  ListFilter,
  Phone,
  Search,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { cn } from '../lib/cn.js';
import { createAdminBookingSnapshot } from './bookingadmin.jsx';

const customerStatusFilters = [
  {
    key: 'all',
    label: 'All',
  },
  {
    key: 'upcoming',
    label: 'Upcoming',
  },
  {
    key: 'returning',
    label: 'Returning',
  },
  {
    key: 'new',
    label: 'New',
  },
];

const customerSortOptions = [
  {
    key: 'lastBooking',
    label: 'Last booking',
  },
  {
    key: 'nextBooking',
    label: 'Next booking',
  },
  {
    key: 'totalBookings',
    label: 'Most booked',
  },
  {
    key: 'name',
    label: 'Name A-Z',
  },
];

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(Math.max(0, Number(value) || 0));
}

function parseDateKey(value) {
  const parts = String(value || '').split('-').map(Number);

  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return new Date();
  }

  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function formatDateLabel(value) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parseDateKey(value));
}

function normalizeCustomerValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function createCustomerKey(booking) {
  return (
    normalizeCustomerValue(booking.phone) ||
    normalizeCustomerValue(booking.customerName) ||
    booking.id
  );
}

function getCustomerInitials(name) {
  const cleanName = String(name || 'Customer').trim();

  return cleanName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getStatusLabel(status) {
  if (status === 'upcoming') return 'Upcoming';
  if (status === 'returning') return 'Returning';
  return 'New';
}

function getStatusClass(status) {
  if (status === 'upcoming') {
    return 'border-studio-cyan/35 bg-studio-cyan/12 text-studio-cyan';
  }

  if (status === 'returning') {
    return 'border-studio-purple/35 bg-studio-purple/12 text-studio-purple';
  }

  return 'border-studio-accent/35 bg-studio-accent/12 text-studio-accent';
}

function getPaymentLabel(status) {
  if (status === 'paid') return 'Lunas';
  if (status === 'dp') return 'DP';
  return 'Pending';
}

function buildCustomersFromBookings(bookings, today = new Date()) {
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const customerMap = new Map();

  bookings.forEach((booking) => {
    const key = createCustomerKey(booking);
    const date = parseDateKey(booking.dateKey);
    const current = customerMap.get(key) || {
      id: key,
      initials: getCustomerInitials(booking.customerName),
      name: booking.customerName || 'Unknown customer',
      phone: booking.phone || '-',
      totalBookings: 0,
      totalRevenue: 0,
      paidRevenue: 0,
      pendingRevenue: 0,
      bookings: [],
      lastBooking: null,
      nextBooking: null,
      favoriteSession: '-',
      status: 'new',
      searchable: '',
    };

    const normalizedBooking = {
      ...booking,
      parsedDate: date,
    };

    current.bookings.push(normalizedBooking);
    current.totalBookings += 1;
    current.totalRevenue += Number(booking.totalPrice) || 0;
    current.paidRevenue += Number(booking.dpAmount) || 0;
    current.pendingRevenue += Number(booking.remainingPayment) || 0;

    if (!current.lastBooking || date > current.lastBooking.parsedDate) {
      current.lastBooking = normalizedBooking;
    }

    if (date >= todayStart && (!current.nextBooking || date < current.nextBooking.parsedDate)) {
      current.nextBooking = normalizedBooking;
    }

    customerMap.set(key, current);
  });

  return Array.from(customerMap.values()).map((customer) => {
    const sessionCounts = customer.bookings.reduce((counts, booking) => {
      const session = booking.sessionType || booking.title || 'Session';
      counts[session] = (counts[session] || 0) + 1;

      return counts;
    }, {});

    const favoriteSession = Object.entries(sessionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
    const status = customer.nextBooking ? 'upcoming' : customer.totalBookings > 1 ? 'returning' : 'new';

    return {
      ...customer,
      bookings: customer.bookings.sort((a, b) => b.parsedDate - a.parsedDate),
      favoriteSession,
      status,
      searchable: [
        customer.name,
        customer.phone,
        favoriteSession,
        customer.bookings.map((booking) => booking.sessionType).join(' '),
      ]
        .map(normalizeCustomerValue)
        .join(' '),
    };
  });
}

function getFilteredCustomers(customers, searchTerm, statusFilter, sortMode) {
  const normalizedSearch = normalizeCustomerValue(searchTerm);

  return customers
    .filter((customer) => {
      const matchesSearch = !normalizedSearch || customer.searchable.includes(normalizedSearch);
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortMode === 'name') {
        return a.name.localeCompare(b.name);
      }

      if (sortMode === 'totalBookings') {
        return b.totalBookings - a.totalBookings;
      }

      if (sortMode === 'nextBooking') {
        const aDate = a.nextBooking?.parsedDate?.getTime() || Number.MAX_SAFE_INTEGER;
        const bDate = b.nextBooking?.parsedDate?.getTime() || Number.MAX_SAFE_INTEGER;

        return aDate - bDate;
      }

      return (b.lastBooking?.parsedDate?.getTime() || 0) - (a.lastBooking?.parsedDate?.getTime() || 0);
    });
}

function getCustomerStats(customers) {
  return {
    totalCustomers: customers.length,
    returningCustomers: customers.filter((customer) => customer.totalBookings > 1).length,
    upcomingCustomers: customers.filter((customer) => Boolean(customer.nextBooking)).length,
    totalRevenue: customers.reduce((sum, customer) => sum + customer.totalRevenue, 0),
  };
}

function CustomerHero({
  activeCustomer,
  stats,
}) {
  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] p-5 shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] backdrop-blur-2xl sm:p-7">
      <div className="pointer-events-none absolute -right-24 -top-32 size-72 rounded-full bg-studio-accent/16 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 size-72 rounded-full bg-studio-cyan/14 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)] lg:items-end">
        <div className="grid gap-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-studio-accent ring-1 ring-[var(--ui-ring)]">
            <Sparkles size={14} strokeWidth={2.35} aria-hidden="true" />
            Customer Directory
          </div>

          <div className="grid gap-3">
            <h1 className="m-0 max-w-4xl text-[clamp(2.55rem,6vw,5.9rem)] font-semibold leading-[0.94] tracking-[-0.075em] text-[var(--ui-text-strong)]">
              Customer list dari histori booking studio.
            </h1>

            <p className="m-0 max-w-2xl text-[clamp(0.98rem,1.25vw,1.12rem)] leading-8 text-[var(--ui-text-main)]">
              Halaman ini mengelompokkan customer dari data booking admin, jadi admin bisa melihat kontak, total booking, status, dan langsung lompat ke booking board yang sudah difilter.
            </p>
          </div>
        </div>

        <div className="grid gap-3 rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-4 shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ui-text-muted)]">
            Active customer
          </span>

          <strong className="text-2xl font-semibold tracking-[-0.055em] text-[var(--ui-text-strong)]">
            {activeCustomer ? activeCustomer.name : stats.totalCustomers + ' customers'}
          </strong>

          <span className="text-sm leading-6 text-[var(--ui-text-muted)]">
            {activeCustomer
              ? activeCustomer.totalBookings + ' booking tercatat, favorit sesi ' + activeCustomer.favoriteSession + '.'
              : 'Pilih customer untuk membuka detail ringkas dan riwayat booking.'}
          </span>
        </div>
      </div>
    </header>
  );
}

function StatCard({
  helper,
  icon: Icon,
  label,
  value,
}) {
  return (
    <article className="grid gap-3 rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-4 shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
          {label}
        </span>

        <span className="grid size-9 place-items-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent">
          <Icon size={17} strokeWidth={2.35} aria-hidden="true" />
        </span>
      </div>

      <strong className="text-2xl font-semibold tracking-[-0.055em] text-[var(--ui-text-strong)]">
        {value}
      </strong>

      <span className="text-sm leading-6 text-[var(--ui-text-muted)]">
        {helper}
      </span>
    </article>
  );
}

function CustomerToolbar({
  resultCount,
  searchTerm,
  sortMode,
  statusFilter,
  onSearchChange,
  onSortChange,
  onStatusFilterChange,
}) {
  return (
    <section className="grid gap-3 rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-3 shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
      <label className="grid gap-1.5 text-sm font-semibold text-[var(--ui-text-main)]">
        Search customer
        <span className="flex min-h-12 items-center gap-3 rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 ring-1 ring-[var(--ui-ring)] focus-within:border-studio-accent/55 focus-within:ring-4 focus-within:ring-studio-accent/20">
          <Search className="shrink-0 text-[var(--ui-text-muted)]" size={17} strokeWidth={2.35} aria-hidden="true" />
          <input
            className="w-full border-0 bg-transparent text-sm font-semibold text-[var(--ui-text-strong)] outline-none placeholder:text-[var(--ui-text-soft)]"
            placeholder="Cari nama, nomor HP, atau tipe sesi..."
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          {searchTerm ? (
            <button
              aria-label="Clear customer search"
              className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-[var(--ui-secondary-text)] transition hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)]"
              type="button"
              onClick={() => onSearchChange('')}
            >
              <X size={14} strokeWidth={2.35} aria-hidden="true" />
            </button>
          ) : null}
        </span>
      </label>

      <label className="grid gap-1.5 text-sm font-semibold text-[var(--ui-text-main)]">
        Status
        <span className="flex min-h-12 items-center gap-3 rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 ring-1 ring-[var(--ui-ring)]">
          <ListFilter className="shrink-0 text-[var(--ui-text-muted)]" size={17} strokeWidth={2.35} aria-hidden="true" />
          <select
            className="w-full min-w-[150px] border-0 bg-transparent text-sm font-semibold text-[var(--ui-text-strong)] outline-none"
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
          >
            {customerStatusFilters.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </span>
      </label>

      <label className="grid gap-1.5 text-sm font-semibold text-[var(--ui-text-main)]">
        Sort
        <span className="flex min-h-12 items-center gap-3 rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 ring-1 ring-[var(--ui-ring)]">
          <History className="shrink-0 text-[var(--ui-text-muted)]" size={17} strokeWidth={2.35} aria-hidden="true" />
          <select
            className="w-full min-w-[160px] border-0 bg-transparent text-sm font-semibold text-[var(--ui-text-strong)] outline-none"
            value={sortMode}
            onChange={(event) => onSortChange(event.target.value)}
          >
            {customerSortOptions.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </span>
      </label>

      <div className="text-sm font-semibold text-[var(--ui-text-muted)] lg:col-span-3">
        Menampilkan <span className="text-[var(--ui-text-strong)]">{resultCount}</span> customer.
      </div>
    </section>
  );
}

function CustomerStatusBadge({ status }) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em]',
        getStatusClass(status),
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {getStatusLabel(status)}
    </span>
  );
}

function CustomerList({
  customers,
  selectedCustomerId,
  onSelectCustomer,
}) {
  if (!customers.length) {
    return (
      <section className="grid min-h-80 place-items-center rounded-[2rem] border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] p-8 text-center shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)]">
        <div className="grid max-w-md gap-3 justify-items-center">
          <span className="grid size-14 place-items-center rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent">
            <UsersRound size={24} strokeWidth={2.2} aria-hidden="true" />
          </span>

          <h2 className="m-0 text-2xl font-semibold tracking-[-0.055em] text-[var(--ui-text-strong)]">
            Customer tidak ditemukan.
          </h2>

          <p className="m-0 text-sm leading-7 text-[var(--ui-text-muted)]">
            Coba ubah keyword pencarian atau reset filter status.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] backdrop-blur-2xl">
      <div className="hidden grid-cols-[minmax(220px,1.3fr)_minmax(150px,0.8fr)_minmax(150px,0.7fr)_minmax(150px,0.7fr)_minmax(130px,0.65fr)_auto] gap-0 border-b border-[var(--ui-border-strong)] bg-[var(--ui-glass-soft)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)] lg:grid">
        <span>Customer</span>
        <span>Contact</span>
        <span>Total booking</span>
        <span>Last booking</span>
        <span>Status</span>
        <span>Action</span>
      </div>

      <div className="grid">
        {customers.map((customer) => {
          const isSelected = selectedCustomerId === customer.id;

          return (
            <article
              className={cn(
                'grid gap-4 border-b border-[var(--ui-border)] p-4 last:border-b-0 lg:grid-cols-[minmax(220px,1.3fr)_minmax(150px,0.8fr)_minmax(150px,0.7fr)_minmax(150px,0.7fr)_minmax(130px,0.65fr)_auto] lg:items-center',
                isSelected ? 'bg-[var(--ui-control-hover)]' : 'bg-transparent hover:bg-[var(--ui-glass-soft)]',
              )}
              key={customer.id}
            >
              <button
                className="flex min-w-0 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
                type="button"
                onClick={() => onSelectCustomer(customer)}
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-[1.15rem] border border-[var(--ui-border)] [background:var(--ui-primary-bg)] text-sm font-semibold tracking-[-0.03em] text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-control)]">
                  {customer.initials}
                </span>

                <span className="grid min-w-0 gap-1">
                  <strong className="truncate text-base font-semibold tracking-[-0.035em] text-[var(--ui-text-strong)]">
                    {customer.name}
                  </strong>
                  <span className="truncate text-sm text-[var(--ui-text-muted)]">
                    Favorit: {customer.favoriteSession}
                  </span>
                </span>
              </button>

              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ui-text-main)]">
                <Phone size={15} strokeWidth={2.35} aria-hidden="true" />
                <span>{customer.phone}</span>
              </div>

              <div className="grid gap-0.5">
                <strong className="text-base font-semibold text-[var(--ui-text-strong)]">
                  {customer.totalBookings} sesi
                </strong>
                <span className="text-xs font-medium text-[var(--ui-text-muted)]">
                  {formatCurrency(customer.totalRevenue)}
                </span>
              </div>

              <div className="grid gap-0.5">
                <strong className="text-sm font-semibold text-[var(--ui-text-strong)]">
                  {customer.lastBooking ? formatDateLabel(customer.lastBooking.dateKey) : '-'}
                </strong>
                <span className="text-xs font-medium text-[var(--ui-text-muted)]">
                  {customer.lastBooking?.time || '-'}
                </span>
              </div>

              <CustomerStatusBadge status={customer.status} />

              <div className="flex flex-wrap gap-2 lg:justify-end">
                <button
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-4 text-sm font-semibold text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25"
                  type="button"
                  onClick={() => onSelectCustomer(customer)}
                >
                  Detail
                </button>

                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-full [background:var(--ui-primary-bg)] px-4 text-sm font-semibold text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
                  to={'/admin/bookings?customer=' + encodeURIComponent(customer.phone)}
                >
                  View bookings
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function DetailMetric({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="grid gap-1 rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-3 ring-1 ring-[var(--ui-ring)]">
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-[var(--ui-text-muted)]">
        <Icon size={14} strokeWidth={2.35} aria-hidden="true" />
        {label}
      </span>

      <strong className="text-base font-semibold tracking-[-0.035em] text-[var(--ui-text-strong)]">
        {value}
      </strong>
    </div>
  );
}

function CustomerDetailPanel({
  customer,
  onClose,
}) {
  if (!customer) {
    return (
      <aside className="grid min-h-[360px] content-center justify-items-center gap-4 rounded-[2rem] border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] p-6 text-center shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] backdrop-blur-2xl">
        <span className="grid size-14 place-items-center rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent">
          <UserRound size={24} strokeWidth={2.2} aria-hidden="true" />
        </span>

        <div className="grid gap-2">
          <h2 className="m-0 text-2xl font-semibold tracking-[-0.055em] text-[var(--ui-text-strong)]">
            Pilih customer.
          </h2>

          <p className="m-0 text-sm leading-7 text-[var(--ui-text-muted)]">
            Detail customer akan tampil di sini, termasuk riwayat booking dan shortcut ke booking board.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="grid gap-4 rounded-[2rem] border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] p-4 shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] backdrop-blur-2xl sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-14 shrink-0 place-items-center rounded-[1.25rem] border border-[var(--ui-border)] [background:var(--ui-primary-bg)] text-base font-semibold tracking-[-0.03em] text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-control)]">
            {customer.initials}
          </span>

          <div className="grid min-w-0 gap-1">
            <CustomerStatusBadge status={customer.status} />
            <h2 className="m-0 truncate text-2xl font-semibold tracking-[-0.06em] text-[var(--ui-text-strong)]">
              {customer.name}
            </h2>
            <span className="text-sm font-semibold text-[var(--ui-text-muted)]">
              {customer.phone}
            </span>
          </div>
        </div>

        <button
          aria-label="Close customer detail"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25"
          type="button"
          onClick={onClose}
        >
          <X size={16} strokeWidth={2.35} aria-hidden="true" />
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <DetailMetric
          icon={CalendarDays}
          label="Total booking"
          value={customer.totalBookings + ' sesi'}
        />
        <DetailMetric
          icon={CreditCard}
          label="Revenue"
          value={formatCurrency(customer.totalRevenue)}
        />
        <DetailMetric
          icon={Clock3}
          label="Last booking"
          value={customer.lastBooking ? formatDateLabel(customer.lastBooking.dateKey) : '-'}
        />
        <DetailMetric
          icon={CalendarClock}
          label="Next booking"
          value={customer.nextBooking ? formatDateLabel(customer.nextBooking.dateKey) : 'Belum ada'}
        />
      </div>

      <div className="grid gap-2 rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-3 ring-1 ring-[var(--ui-ring)]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-studio-accent">
            Booking history
          </span>

          <Link
            className="inline-flex min-h-9 items-center justify-center rounded-full [background:var(--ui-primary-bg)] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
            to={'/admin/bookings?customer=' + encodeURIComponent(customer.phone)}
          >
            View board
          </Link>
        </div>

        <div className="grid gap-2">
          {customer.bookings.slice(0, 5).map((booking) => (
            <div
              className="grid gap-2 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-3 ring-1 ring-[var(--ui-ring)]"
              key={booking.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-sm font-semibold text-[var(--ui-text-strong)]">
                  {booking.sessionType || booking.title}
                </strong>

                <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-2 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ui-text-main)]">
                  {getPaymentLabel(booking.status)}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-[var(--ui-text-muted)]">
                <span>{formatDateLabel(booking.dateKey)}</span>
                <span>{booking.time}</span>
                <span>{booking.durationHours} jam</span>
                <span>{formatCurrency(booking.totalPrice)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function CustomerAdmin() {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortMode, setSortMode] = useState('lastBooking');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const bookings = useMemo(() => createAdminBookingSnapshot(new Date()), []);
  const customers = useMemo(() => buildCustomersFromBookings(bookings), [bookings]);
  const stats = useMemo(() => getCustomerStats(customers), [customers]);
  const filteredCustomers = useMemo(
    () => getFilteredCustomers(customers, searchTerm, statusFilter, sortMode),
    [customers, searchTerm, sortMode, statusFilter],
  );
  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId) || filteredCustomers[0] || null,
    [customers, filteredCustomers, selectedCustomerId],
  );

  const handleSelectCustomer = (customer) => {
    setSelectedCustomerId(customer.id);
  };

  return (
    <section className="grid gap-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-1 md:pb-4 md:pt-2" aria-labelledby="customer-admin-title">
      <div className="sr-only" id="customer-admin-title">
        Customer admin workspace
      </div>

      <CustomerHero activeCustomer={selectedCustomer} stats={stats} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={UsersRound}
          label="Total customers"
          value={stats.totalCustomers}
          helper="Customer unik dari data booking."
        />
        <StatCard
          icon={CheckCircle2}
          label="Returning"
          value={stats.returningCustomers}
          helper="Customer dengan lebih dari satu booking."
        />
        <StatCard
          icon={CalendarClock}
          label="Upcoming"
          value={stats.upcomingCustomers}
          helper="Customer dengan jadwal mendatang."
        />
        <StatCard
          icon={CreditCard}
          label="Revenue"
          value={formatCurrency(stats.totalRevenue)}
          helper="Total nilai booking pada snapshot aktif."
        />
      </div>

      <CustomerToolbar
        resultCount={filteredCustomers.length}
        searchTerm={searchTerm}
        sortMode={sortMode}
        statusFilter={statusFilter}
        onSearchChange={setSearchTerm}
        onSortChange={setSortMode}
        onStatusFilterChange={setStatusFilter}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] xl:items-start">
        <CustomerList
          customers={filteredCustomers}
          selectedCustomerId={selectedCustomer?.id || ''}
          onSelectCustomer={handleSelectCustomer}
        />

        <CustomerDetailPanel
          customer={selectedCustomer}
          onClose={() => setSelectedCustomerId(null)}
        />
      </div>
    </section>
  );
}
