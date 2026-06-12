import {
  useMemo,
  useState,
  } from 'react';
import { Link,
  useOutletContext,
  useSearchParams } from 'react-router';
import {
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  ChevronDown,
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
  Copy,
  MessageCircle,
  AlertTriangle,
  BadgeCheck,
  Banknote,
  ReceiptText,
} from 'lucide-react';
import { cn } from '../lib/cn.js';

const customerStatusFilters = [
  {
    key: 'all',
    label: 'All',
  },
  {
    key: 'needsReview',
    label: 'Needs review',
  },
  {
    key: 'unpaid',
    label: 'Unpaid',
  },
  {
    key: 'missingPhone',
    label: 'Missing phone',
  },
  {
    key: 'clean',
    label: 'Clean',
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
    key: 'attention',
    label: 'Needs attention',
  },
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
    key: 'unpaid',
    label: 'Highest unpaid',
  },
  {
    key: 'revenue',
    label: 'Highest revenue',
  },
  {
    key: 'name',
    label: 'Name A-Z',
  },
];

const customerCommunicationTemplates = [
  {
    helper: 'Follow-up sisa pembayaran customer.',
    key: 'payment',
    label: 'Payment',
  },
  {
    helper: 'Reminder jadwal booking berikutnya.',
    key: 'reminder',
    label: 'Reminder',
  },
  {
    helper: 'Ucapan terima kasih setelah sesi.',
    key: 'thankYou',
    label: 'Thank you',
  },
  {
    helper: 'Ajak customer lama booking lagi.',
    key: 'reactivation',
    label: 'Reactivate',
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

function prettifyCustomerName(name) {
  return String(name || 'Unknown customer')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCustomerInitials(name) {
  const cleanName = prettifyCustomerName(name);

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

function normalizePhoneDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeWhatsappNumber(value) {
  const digits = normalizePhoneDigits(value);

  if (!digits) {
    return '';
  }

  if (digits.startsWith('62')) {
    return digits;
  }

  if (digits.startsWith('0')) {
    return '62' + digits.slice(1);
  }

  return digits;
}

function getCustomerPhoneValue(customer) {
  const phone = String(customer?.phone || '').trim();

  return phone && phone !== '-' ? phone : '';
}

function getCustomerBoardQuery(customer) {
  return getCustomerPhoneValue(customer) || customer?.name || '';
}

function getCustomerPrimaryBooking(customer) {
  return customer?.nextBooking || customer?.lastBooking || null;
}

function getCustomerPrimaryBookingLabel(customer) {
  if (customer?.nextBooking) {
    return 'Next booking';
  }

  if (customer?.lastBooking) {
    return 'Last booking';
  }

  return 'Booking';
}

function createBookingSummaryLine(booking, fallback = 'Belum ada booking tercatat') {
  if (!booking) {
    return fallback;
  }

  return [
    booking.sessionType || booking.title || 'Studio session',
    formatDateLabel(booking.dateKey),
    booking.time || '-',
    (booking.durationHours || 1) + ' jam',
    formatCurrency(booking.totalPrice),
    getPaymentLabel(booking.status),
  ].join(' • ');
}

function createCustomerSummaryText(customer) {
  if (!customer) {
    return '';
  }

  const pendingRevenue = Math.max(0, Number(customer.pendingRevenue) || 0);
  const lines = [
    '37 Music Studio - Customer Summary',
    'Nama: ' + customer.name,
    'Telepon: ' + (getCustomerPhoneValue(customer) || 'Belum tersedia'),
    'Total booking: ' + customer.totalBookings + ' sesi',
    'Favorite session: ' + customer.favoriteSession,
    'Revenue: ' + formatCurrency(customer.totalRevenue),
    'Terkumpul: ' + formatCurrency(customer.paidRevenue),
    'Sisa bayar: ' + formatCurrency(pendingRevenue),
    'Last booking: ' + createBookingSummaryLine(customer.lastBooking),
    'Next booking: ' + createBookingSummaryLine(customer.nextBooking, 'Belum ada jadwal mendatang'),
    'Data quality: ' + (customer.dataQuality?.label || 'Clean'),
  ];

  return lines.join('\n');
}

function getDefaultCustomerMessageTemplate(customer) {
  const pendingRevenue = Math.max(0, Number(customer?.pendingRevenue) || 0);

  if (pendingRevenue > 0) {
    return 'payment';
  }

  if (customer?.nextBooking) {
    return 'reminder';
  }

  if ((Number(customer?.totalBookings) || 0) > 1 && !customer?.nextBooking) {
    return 'reactivation';
  }

  return 'thankYou';
}

function getCustomerCommunicationTemplateMeta(templateKey) {
  return customerCommunicationTemplates.find((template) => template.key === templateKey) || customerCommunicationTemplates[0];
}

function createCustomerWhatsappMessage(customer, templateKey = getDefaultCustomerMessageTemplate(customer)) {
  if (!customer) {
    return '';
  }

  const selectedTemplate = getCustomerCommunicationTemplateMeta(templateKey).key;
  const greetingName = customer.name || 'Kak';
  const lastBooking = customer.lastBooking;
  const nextBooking = customer.nextBooking;
  const pendingRevenue = Math.max(0, Number(customer.pendingRevenue) || 0);

  if (selectedTemplate === 'payment') {
    return [
      'Halo ' + greetingName + ', kami dari 37 Music Studio.',
      '',
      'Kami ingin follow-up sisa pembayaran booking studio.',
      lastBooking ? 'Booking terakhir: ' + createBookingSummaryLine(lastBooking) : 'Booking terakhir belum tercatat lengkap.',
      'Sisa pembayaran tercatat: ' + formatCurrency(pendingRevenue) + '.',
      '',
      'Boleh kami bantu konfirmasi metode pelunasannya?',
      'Terima kasih.',
    ].join('\n');
  }

  if (selectedTemplate === 'reminder') {
    return [
      'Halo ' + greetingName + ', kami dari 37 Music Studio.',
      '',
      'Kami mau mengingatkan jadwal booking studio berikutnya.',
      nextBooking ? 'Jadwal: ' + createBookingSummaryLine(nextBooking) : 'Jadwal berikutnya belum tercatat.',
      '',
      'Mohon konfirmasi kehadirannya ya. Terima kasih.',
    ].join('\n');
  }

  if (selectedTemplate === 'thankYou') {
    return [
      'Halo ' + greetingName + ', kami dari 37 Music Studio.',
      '',
      'Terima kasih sudah booking studio bersama kami.',
      lastBooking ? 'Sesi terakhir: ' + createBookingSummaryLine(lastBooking) : 'Semoga sesi kemarin berjalan lancar.',
      '',
      'Kalau butuh jadwal latihan atau recording lagi, kami siap bantu cek slot.',
    ].join('\n');
  }

  return [
    'Halo ' + greetingName + ', kami dari 37 Music Studio.',
    '',
    'Kami ingin menyapa kembali dan bantu cek slot studio untuk jadwal berikutnya.',
    lastBooking ? 'Terakhir booking: ' + createBookingSummaryLine(lastBooking) : 'Belum ada booking terakhir yang tercatat.',
    '',
    'Kalau ada rencana latihan, recording, atau review mix, kabari kami ya.',
  ].join('\n');
}

function getPaymentProgress(customer) {
  const totalRevenue = Math.max(0, Number(customer?.totalRevenue) || 0);
  const paidRevenue = Math.max(0, Number(customer?.paidRevenue) || 0);

  if (!totalRevenue) {
    return 0;
  }

  return Math.min(100, Math.round((paidRevenue / totalRevenue) * 100));
}

function getPaymentHealthLabel(customer) {
  const totalRevenue = Math.max(0, Number(customer?.totalRevenue) || 0);
  const pendingRevenue = Math.max(0, Number(customer?.pendingRevenue) || 0);
  const paidRevenue = Math.max(0, Number(customer?.paidRevenue) || 0);

  if (!totalRevenue) {
    return 'Belum ada transaksi';
  }

  if (pendingRevenue <= 0) {
    return 'Lunas semua';
  }

  if (paidRevenue > 0) {
    return 'Ada sisa bayar';
  }

  return 'Belum ada pembayaran';
}

function getPaymentHealthClass(customer) {
  const pendingRevenue = Math.max(0, Number(customer?.pendingRevenue) || 0);
  const paidRevenue = Math.max(0, Number(customer?.paidRevenue) || 0);

  if (pendingRevenue <= 0) {
    return 'border-studio-cyan/35 bg-studio-cyan/10 text-studio-cyan';
  }

  if (paidRevenue > 0) {
    return 'border-studio-purple/35 bg-studio-purple/10 text-studio-purple';
  }

  return 'border-studio-accent/35 bg-studio-accent/10 text-studio-accent';
}

function normalizeCustomerNameKey(name) {
  return normalizeCustomerValue(prettifyCustomerName(name));
}

function getCustomerPhoneDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function getCustomerQualityClass(level) {
  if (level === 'clean') {
    return 'border-studio-cyan/35 bg-studio-cyan/10 text-studio-cyan ring-studio-cyan/15';
  }

  if (level === 'warning') {
    return 'border-studio-purple/35 bg-studio-purple/10 text-studio-purple ring-studio-purple/15';
  }

  return 'border-studio-accent/35 bg-studio-accent/10 text-studio-accent ring-studio-accent/15';
}

function getCustomerDataQuality(customer, duplicateNameCounts = new Map()) {
  const issues = [];
  const phoneDigits = getCustomerPhoneDigits(customer?.phone);
  const nameKey = normalizeCustomerNameKey(customer?.name);
  const duplicateCount = nameKey ? duplicateNameCounts.get(nameKey) || 0 : 0;
  const pendingRevenue = Math.max(0, Number(customer?.pendingRevenue) || 0);
  const paidRevenue = Math.max(0, Number(customer?.paidRevenue) || 0);

  if (!phoneDigits) {
    issues.push({
      helper: 'Nomor kontak belum tersedia, follow-up customer akan lebih sulit.',
      key: 'missing-phone',
      label: 'No phone',
      severity: 'critical',
    });
  } else if (phoneDigits.length < 9) {
    issues.push({
      helper: 'Nomor terlihat terlalu pendek, sebaiknya dicek ulang.',
      key: 'short-phone',
      label: 'Phone check',
      severity: 'critical',
    });
  }

  if (duplicateCount > 1) {
    issues.push({
      helper: 'Ada customer lain dengan nama mirip. Pastikan ini bukan data dobel.',
      key: 'duplicate-name',
      label: 'Duplicate name',
      severity: 'critical',
    });
  }

  if (pendingRevenue > 0) {
    issues.push({
      helper: paidRevenue > 0
        ? 'Customer masih punya sisa pembayaran dari histori booking.'
        : 'Belum ada pembayaran terkumpul dari histori booking customer ini.',
      key: 'unpaid-balance',
      label: 'Unpaid',
      severity: 'warning',
    });
  }

  const hasCritical = issues.some((issue) => issue.severity === 'critical');
  const hasWarning = issues.some((issue) => issue.severity === 'warning');
  const level = hasCritical ? 'critical' : hasWarning ? 'warning' : 'clean';

  return {
    helper: level === 'clean'
      ? 'Data kontak dan pembayaran terlihat aman.'
      : issues[0]?.helper || 'Data customer perlu dicek.',
    issueCount: issues.length,
    issues,
    label: level === 'clean' ? 'Clean' : level === 'warning' ? 'Attention' : 'Needs review',
    level,
  };
}

function buildCustomersFromBookings(bookings, today = new Date()) {
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const customerMap = new Map();

  bookings.forEach((booking) => {
    const key = createCustomerKey(booking);
    const date = parseDateKey(booking.dateKey);
    const customerName = prettifyCustomerName(booking.customerName);
    const current = customerMap.get(key) || {
      id: key,
      initials: getCustomerInitials(customerName),
      name: customerName,
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
      dataQuality: {
        helper: 'Data belum dihitung.',
        issueCount: 0,
        issues: [],
        label: 'Clean',
        level: 'clean',
      },
    };

    const normalizedBooking = {
      ...booking,
      customerName,
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

  const normalizedCustomers = Array.from(customerMap.values()).map((customer) => {
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

  const duplicateNameCounts = normalizedCustomers.reduce((counts, customer) => {
    const nameKey = normalizeCustomerNameKey(customer.name);

    if (!nameKey) {
      return counts;
    }

    counts.set(nameKey, (counts.get(nameKey) || 0) + 1);
    return counts;
  }, new Map());

  return normalizedCustomers.map((customer) => ({
    ...customer,
    dataQuality: getCustomerDataQuality(customer, duplicateNameCounts),
  }));
}

function getFilteredCustomers(customers, searchTerm, statusFilter, sortMode) {
  const normalizedSearch = normalizeCustomerValue(searchTerm);

  return customers
    .filter((customer) => {
      const matchesSearch = !normalizedSearch || customer.searchable.includes(normalizedSearch);
      const quality = customer.dataQuality || {
        issues: [],
        level: 'clean',
      };
      const issues = Array.isArray(quality.issues) ? quality.issues : [];
      const hasIssue = (issueKey) => issues.some((issue) => issue.key === issueKey);
      const hasUnpaid = Math.max(0, Number(customer.pendingRevenue) || 0) > 0;
      const matchesSegment = (() => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'needsReview') return quality.level !== 'clean';
        if (statusFilter === 'unpaid') return hasUnpaid;
        if (statusFilter === 'missingPhone') return hasIssue('missing-phone') || hasIssue('short-phone');
        if (statusFilter === 'clean') return quality.level === 'clean';

        return customer.status === statusFilter;
      })();

      return matchesSearch && matchesSegment;
    })
    .sort((a, b) => {
      if (sortMode === 'name') {
        return a.name.localeCompare(b.name);
      }

      if (sortMode === 'totalBookings') {
        return b.totalBookings - a.totalBookings;
      }

      if (sortMode === 'revenue') {
        return b.totalRevenue - a.totalRevenue;
      }

      if (sortMode === 'unpaid') {
        return b.pendingRevenue - a.pendingRevenue;
      }

      if (sortMode === 'attention') {
        const severityRank = {
          critical: 3,
          warning: 2,
          clean: 1,
        };
        const aQuality = a.dataQuality || {
          issueCount: 0,
          level: 'clean',
        };
        const bQuality = b.dataQuality || {
          issueCount: 0,
          level: 'clean',
        };
        const aRank = severityRank[aQuality.level] || 0;
        const bRank = severityRank[bQuality.level] || 0;

        if (aRank !== bRank) {
          return bRank - aRank;
        }

        if ((aQuality.issueCount || 0) !== (bQuality.issueCount || 0)) {
          return (bQuality.issueCount || 0) - (aQuality.issueCount || 0);
        }

        return b.pendingRevenue - a.pendingRevenue;
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

function getCustomerQualityStats(customers) {
  return customers.reduce(
    (stats, customer) => {
      const quality = customer.dataQuality || {
        issues: [],
        level: 'clean',
      };
      const issues = Array.isArray(quality.issues) ? quality.issues : [];
      const hasIssue = (issueKey) => issues.some((issue) => issue.key === issueKey);

      stats.total += 1;

      if (quality.level === 'clean') {
        stats.clean += 1;
      } else {
        stats.needsReview += 1;
      }

      if (Math.max(0, Number(customer.pendingRevenue) || 0) > 0) {
        stats.unpaid += 1;
      }

      if (hasIssue('missing-phone') || hasIssue('short-phone')) {
        stats.missingPhone += 1;
      }

      return stats;
    },
    {
      clean: 0,
      missingPhone: 0,
      needsReview: 0,
      total: 0,
      unpaid: 0,
    },
  );
}

function CustomerHero({
  activeCustomer,
  stats,
}) {
  const activeLabel = activeCustomer ? activeCustomer.name : stats.totalCustomers + ' customers';
  const activeHelper = activeCustomer
    ? activeCustomer.totalBookings + ' booking • ' + activeCustomer.favoriteSession
    : 'Data booking real Firestore';

  return (
    <header className="customer-page-header flex flex-wrap items-end justify-between gap-3 rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-3 py-3 ring-1 ring-[var(--ui-ring)] sm:px-4">
      <div className="grid gap-1">
        <h1 className="m-0 text-2xl font-semibold tracking-[-0.055em] text-[var(--ui-text-strong)] sm:text-3xl">
          Customer List
        </h1>

        <p className="m-0 text-xs font-medium leading-5 text-[var(--ui-text-muted)] sm:text-sm">
          Kontak, status, dan shortcut booking dari data real.
        </p>
      </div>

      <div className="customer-page-active grid min-w-[9.5rem] gap-0.5 rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 py-2 text-right ring-1 ring-[var(--ui-ring)]">
        <span className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
          Active
        </span>

        <strong className="truncate text-sm font-semibold tracking-[-0.03em] text-[var(--ui-text-strong)]">
          {activeLabel}
        </strong>

        <span className="truncate text-[0.68rem] font-medium text-[var(--ui-text-muted)]">
          {activeHelper}
        </span>
      </div>
    </header>
  );
}

function MetricStrip({
  stats,
}) {
  const items = [
    {
      icon: UsersRound,
      label: 'Customers',
      value: stats.totalCustomers,
    },
    {
      icon: CheckCircle2,
      label: 'Returning',
      value: stats.returningCustomers,
    },
    {
      icon: CalendarClock,
      label: 'Upcoming',
      value: stats.upcomingCustomers,
    },
    {
      icon: CreditCard,
      label: 'Revenue',
      value: formatCurrency(stats.totalRevenue),
    },
  ];

  return (
    <section className="customer-summary-strip grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Customer summary">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <article
            className="flex min-h-14 items-center justify-between gap-2 rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-3 py-2 ring-1 ring-[var(--ui-ring)]"
            key={item.label}
          >
            <span className="inline-flex min-w-0 items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.11em] text-[var(--ui-text-muted)]">
              <Icon className="shrink-0 text-studio-accent" size={13} strokeWidth={2.35} aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </span>

            <strong className="shrink-0 text-sm font-semibold tracking-[-0.035em] text-[var(--ui-text-strong)]">
              {item.value}
            </strong>
          </article>
        );
      })}
    </section>
  );
}

function ToolbarSelect({
  icon: Icon,
  label,
  options,
  value,
  onChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((item) => item.key === value) || options[0];

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <label
      className="relative grid gap-1.5 text-sm font-semibold text-[var(--ui-text-main)]"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      {label}
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex min-h-12 w-full items-center gap-3 rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 text-left text-sm font-semibold text-[var(--ui-text-strong)] ring-1 ring-[var(--ui-ring)] transition hover:bg-[var(--ui-control-hover)] focus-visible:border-studio-accent/55 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
        type="button"
        onClick={() => setIsOpen((currentOpen) => !currentOpen)}
      >
        {Icon ? (
          <Icon className="shrink-0 text-[var(--ui-text-muted)]" size={17} strokeWidth={2.35} aria-hidden="true" />
        ) : null}

        <span className="min-w-0 flex-1 truncate">
          {selectedOption.label}
        </span>

        <ChevronDown
          className={cn(
            'shrink-0 text-[var(--ui-text-muted)] transition-transform',
            isOpen ? 'rotate-180' : '',
          )}
          size={16}
          strokeWidth={2.35}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-64 overflow-auto rounded-[1.25rem] border border-[var(--ui-border-strong)] bg-[var(--ui-bg-base)] p-1.5 shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] backdrop-blur-2xl"
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option.key === value;

            return (
              <button
                aria-selected={isSelected}
                className={cn(
                  'flex min-h-10 w-full items-center justify-between gap-3 rounded-2xl px-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20',
                  isSelected
                    ? 'bg-[var(--ui-control-hover)] text-studio-accent'
                    : 'text-[var(--ui-text-main)] hover:bg-[var(--ui-control)] hover:text-[var(--ui-text-strong)]',
                )}
                key={option.key}
                role="option"
                type="button"
                onClick={() => handleSelect(option.key)}
              >
                <span className="truncate">
                  {option.label}
                </span>

                {isSelected ? (
                  <span className="size-2 rounded-full bg-studio-accent" aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </label>
  );
}

function CustomerAttentionStrip({
  activeFilter,
  stats,
  onFilterChange,
}) {
  const items = [
    {
      icon: UsersRound,
      key: 'all',
      label: 'All',
      value: stats.total,
    },
    {
      icon: AlertTriangle,
      key: 'needsReview',
      label: 'Review',
      value: stats.needsReview,
    },
    {
      icon: CreditCard,
      key: 'unpaid',
      label: 'Unpaid',
      value: stats.unpaid,
    },
    {
      icon: Phone,
      key: 'missingPhone',
      label: 'No phone',
      value: stats.missingPhone,
    },
    {
      icon: BadgeCheck,
      key: 'clean',
      label: 'Clean',
      value: stats.clean,
    },
  ];

  return (
    <section className="customer-attention-strip -mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1" aria-label="Customer attention filters">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeFilter === item.key;

        return (
          <button
            aria-pressed={isActive}
            className={cn(
              'inline-flex min-h-9 shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 text-xs font-semibold ring-1 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20',
              isActive
                ? 'border-studio-accent/45 bg-studio-accent/12 text-studio-accent ring-studio-accent/20'
                : 'border-[var(--ui-border)] bg-[var(--ui-control)] text-[var(--ui-text-main)] ring-[var(--ui-ring)] hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)]',
            )}
            key={item.key}
            type="button"
            onClick={() => onFilterChange(item.key)}
          >
            <Icon size={13} strokeWidth={2.35} aria-hidden="true" />
            <span>{item.label}</span>
            <strong className="rounded-full bg-[var(--ui-glass-soft)] px-1.5 py-0.5 text-[0.68rem] leading-none text-[var(--ui-text-strong)]">
              {item.value}
            </strong>
          </button>
        );
      })}
    </section>
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
    <section className="customer-toolbar-slim grid gap-2 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-2 ring-1 ring-[var(--ui-ring)]">
      <label className="grid gap-1 text-xs font-semibold text-[var(--ui-text-main)]">
        <span className="sr-only">Search customer</span>

        <span className="flex min-h-10 items-center gap-2 rounded-[0.95rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 ring-1 ring-[var(--ui-ring)] focus-within:border-studio-accent/55 focus-within:ring-4 focus-within:ring-studio-accent/20">
          <Search className="shrink-0 text-[var(--ui-text-muted)]" size={15} strokeWidth={2.35} aria-hidden="true" />
          <input
            className="w-full border-0 bg-transparent text-xs font-semibold text-[var(--ui-text-strong)] outline-none placeholder:text-[var(--ui-text-soft)]"
            placeholder="Cari nama, nomor HP, atau tipe sesi..."
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          {searchTerm ? (
            <button
              aria-label="Clear customer search"
              className="grid size-7 shrink-0 place-items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-[var(--ui-secondary-text)] transition hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)]"
              type="button"
              onClick={() => onSearchChange('')}
            >
              <X size={13} strokeWidth={2.35} aria-hidden="true" />
            </button>
          ) : null}
        </span>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <ToolbarSelect
          icon={ListFilter}
          label="Segment"
          options={customerStatusFilters}
          value={statusFilter}
          onChange={onStatusFilterChange}
        />

        <ToolbarSelect
          icon={History}
          label="Sort"
          options={customerSortOptions}
          value={sortMode}
          onChange={onSortChange}
        />
      </div>

      <div className="text-xs font-semibold text-[var(--ui-text-muted)]">
        <span className="text-[var(--ui-text-strong)]">{resultCount}</span> customer
      </div>
    </section>
  );
}

function CustomerFilterSummary({
  resultCount,
  searchTerm,
  sortMode,
  statusFilter,
  onResetFilters,
  onSearchChange,
  onSortChange,
  onStatusFilterChange,
}) {
  const cleanSearchTerm = String(searchTerm || '').trim();
  const statusLabel = customerStatusFilters.find((item) => item.key === statusFilter)?.label || statusFilter;
  const sortLabel = customerSortOptions.find((item) => item.key === sortMode)?.label || sortMode;
  const activeItems = [
    cleanSearchTerm
      ? {
        key: 'search',
        label: 'Search',
        value: cleanSearchTerm,
        onClear: () => onSearchChange(''),
      }
      : null,
    statusFilter !== 'all'
      ? {
        key: 'segment',
        label: 'Segment',
        value: statusLabel,
        onClear: () => onStatusFilterChange('all'),
      }
      : null,
    sortMode !== 'attention'
      ? {
        key: 'sort',
        label: 'Sort',
        value: sortLabel,
        onClear: () => onSortChange('attention'),
      }
      : null,
  ].filter(Boolean);

  if (!activeItems.length) {
    return null;
  }

  return (
    <section className="customer-filter-summary flex flex-wrap items-center justify-between gap-2 rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-2 ring-1 ring-[var(--ui-ring)]" aria-label="Active customer filters">
      <div className="flex min-w-0 flex-wrap gap-1.5">
        {activeItems.map((item) => (
          <span
            className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-2.5 text-xs font-semibold text-[var(--ui-text-main)] ring-1 ring-[var(--ui-ring)]"
            key={item.key}
          >
            <span className="text-[var(--ui-text-muted)]">
              {item.label}
            </span>

            <strong className="max-w-[9.5rem] truncate text-[var(--ui-text-strong)]">
              {item.value}
            </strong>

            <button
              aria-label={'Clear ' + item.label}
              className="grid size-5 place-items-center rounded-full bg-[var(--ui-secondary-bg)] text-[var(--ui-secondary-text)] transition hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
              type="button"
              onClick={item.onClear}
            >
              <X size={11} strokeWidth={2.35} aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-[var(--ui-text-muted)]">
          <span className="text-[var(--ui-text-strong)]">{resultCount}</span> hasil
        </span>

        <button
          className="inline-flex min-h-8 items-center justify-center rounded-full border border-studio-accent/35 bg-studio-accent/10 px-3 text-xs font-semibold text-studio-accent ring-1 ring-studio-accent/15 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
          type="button"
          onClick={onResetFilters}
        >
          Reset
        </button>
      </div>
    </section>
  );
}

function CustomerStatusBadge({ status }) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em]',
        getStatusClass(status),
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {getStatusLabel(status)}
    </span>
  );
}

function CustomerQualityBadge({
  quality,
}) {
  const safeQuality = quality || {
    issueCount: 0,
    label: 'Clean',
    level: 'clean',
  };

  return (
    <span className={cn('inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.11em] ring-1', getCustomerQualityClass(safeQuality.level))}>
      {safeQuality.level === 'clean' ? (
        <BadgeCheck size={12} strokeWidth={2.35} aria-hidden="true" />
      ) : (
        <AlertTriangle size={12} strokeWidth={2.35} aria-hidden="true" />
      )}
      {safeQuality.issueCount > 0 ? safeQuality.issueCount + ' issue' : safeQuality.label}
    </span>
  );
}

function CustomerQualityPanel({
  customer,
}) {
  const quality = customer?.dataQuality || getCustomerDataQuality(customer, new Map());
  const issues = Array.isArray(quality.issues) ? quality.issues : [];

  return (
    <section className={cn('customer-quality-compact grid gap-3 rounded-[1.35rem] border p-3 ring-1', getCustomerQualityClass(quality.level))} aria-label="Customer data quality">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.16em]">
            Data quality
          </span>

          <strong className="text-base font-semibold tracking-[-0.035em] text-[var(--ui-text-strong)]">
            {quality.label}
          </strong>
        </div>

        {quality.level === 'clean' ? (
          <BadgeCheck size={20} strokeWidth={2.35} aria-hidden="true" />
        ) : (
          <AlertTriangle size={20} strokeWidth={2.35} aria-hidden="true" />
        )}
      </div>

      {issues.length > 0 ? (
        <div className="grid gap-2">
          {issues.map((issue) => (
            <div className="grid gap-0.5 rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-3" key={issue.key}>
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-strong)]">
                {issue.label}
              </span>

              <span className="text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
                {issue.helper}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="m-0 text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
          {quality.helper}
        </p>
      )}
    </section>
  );
}

function CustomerSelectionEmptyState({
  hasCustomers,
  onSelectFirst,
}) {
  if (!hasCustomers) {
    return null;
  }

  return (
    <aside className="customer-selection-empty hidden rounded-[1.5rem] border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] p-5 shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] backdrop-blur-2xl xl:grid xl:sticky xl:top-4">
      <div className="grid gap-4">
        <span className="grid size-12 place-items-center rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent">
          <UsersRound size={22} strokeWidth={2.35} aria-hidden="true" />
        </span>

        <div className="grid gap-2">
          <h2 className="m-0 text-xl font-semibold tracking-[-0.045em] text-[var(--ui-text-strong)]">
            Pilih customer.
          </h2>

          <p className="m-0 text-sm font-medium leading-6 text-[var(--ui-text-muted)]">
            Detail customer akan muncul di sini. Klik salah satu row di kiri untuk melihat kontak, payment, dan histori booking.
          </p>
        </div>

        <button
          className="inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-full [background:var(--ui-primary-bg)] px-4 text-sm font-semibold text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
          type="button"
          onClick={onSelectFirst}
        >
          Pilih teratas
          <ArrowUpRight size={14} strokeWidth={2.35} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}

function CustomerStatePanel({
  actionHref = '',
  actionLabel = '',
  icon: Icon = UsersRound,
  message,
  title,
  tone = 'neutral',
}) {
  const isWarning = tone === 'warning';

  return (
    <section className={cn(
      'customer-state-panel grid gap-4 rounded-[1.35rem] border p-5 text-center ring-1',
      isWarning
        ? 'border-studio-accent/35 bg-studio-accent/10 text-studio-accent ring-studio-accent/15'
        : 'border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] text-[var(--ui-text-main)] ring-[var(--ui-ring)]',
    )}>
      <span className="mx-auto grid size-12 place-items-center rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-control)]">
        <Icon size={22} strokeWidth={2.35} aria-hidden="true" />
      </span>

      <div className="mx-auto grid max-w-md gap-2">
        <h2 className="m-0 text-xl font-semibold tracking-[-0.045em] text-[var(--ui-text-strong)]">
          {title}
        </h2>

        <p className="m-0 text-sm font-medium leading-6 text-[var(--ui-text-muted)]">
          {message}
        </p>
      </div>

      {actionHref && actionLabel ? (
        <Link
          className="mx-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-full [background:var(--ui-primary-bg)] px-4 text-sm font-semibold text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
          to={actionHref}
        >
          {actionLabel}
          <ArrowUpRight size={14} strokeWidth={2.35} aria-hidden="true" />
        </Link>
      ) : null}
    </section>
  );
}

function CustomerErrorNotice({
  message,
}) {
  if (!message) {
    return null;
  }

  return (
    <section className="customer-error-notice flex items-start gap-3 rounded-[1.1rem] border border-studio-accent/35 bg-studio-accent/10 p-3 text-studio-accent ring-1 ring-studio-accent/15" role="status">
      <AlertTriangle className="mt-0.5 shrink-0" size={17} strokeWidth={2.35} aria-hidden="true" />

      <div className="grid gap-0.5">
        <strong className="text-sm font-semibold tracking-[-0.025em]">
          Data customer memakai fallback.
        </strong>

        <span className="text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
          {message}
        </span>
      </div>
    </section>
  );
}

function CustomerLoadingState() {
  return (
    <section className="customer-loading-state grid gap-3 rounded-[1.35rem] border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] p-4 ring-1 ring-[var(--ui-ring)]" aria-label="Loading customer data">
      <div className="flex items-center gap-3">
        <span className="grid size-10 animate-pulse place-items-center rounded-[0.95rem] bg-[var(--ui-control)]" />
        <div className="grid flex-1 gap-2">
          <span className="h-3 w-36 animate-pulse rounded-full bg-[var(--ui-control)]" />
          <span className="h-2.5 w-52 max-w-full animate-pulse rounded-full bg-[var(--ui-control)]" />
        </div>
      </div>

      <div className="grid gap-2">
        {[0, 1, 2].map((item) => (
          <div className="grid gap-2 rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-3" key={item}>
            <span className="h-3 w-40 animate-pulse rounded-full bg-[var(--ui-control)]" />
            <span className="h-2.5 w-full animate-pulse rounded-full bg-[var(--ui-control)]" />
          </div>
        ))}
      </div>
    </section>
  );
}

function CustomerList({
  customers,
  hasActiveFilters = false,
  selectedCustomerId,
  onResetFilters = () => {},
  onSelectCustomer,
}) {
  if (!customers.length) {
    return (
      <section className="grid min-h-80 place-items-center rounded-[2rem] border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] p-8 text-center shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)]">
        <div className="grid max-w-md justify-items-center gap-3">
          <span className="grid size-14 place-items-center rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent">
            <UsersRound size={24} strokeWidth={2.2} aria-hidden="true" />
          </span>

          <h2 className="m-0 text-2xl font-semibold tracking-[-0.055em] text-[var(--ui-text-strong)]">
            Customer tidak ditemukan.
          </h2>

          <p className="m-0 text-sm leading-7 text-[var(--ui-text-muted)]">
            {hasActiveFilters
              ? 'Tidak ada customer yang cocok dengan filter aktif. Reset filter untuk melihat semua customer.'
              : 'Customer belum tersedia dari data booking real.'}
          </p>

          {hasActiveFilters ? (
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-studio-accent/35 bg-studio-accent/10 px-4 text-sm font-semibold text-studio-accent ring-1 ring-studio-accent/15 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
              type="button"
              onClick={onResetFilters}
            >
              Reset filter
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="customer-list-shell customer-desktop-list overflow-hidden rounded-[1.5rem] border border-[var(--ui-border-strong)] bg-[color-mix(in_srgb,var(--ui-glass)_72%,transparent)] ring-1 ring-[var(--ui-ring)] backdrop-blur-xl sm:rounded-[1.75rem]">
      <div className="hidden grid-cols-[minmax(230px,1.35fr)_minmax(138px,0.75fr)_minmax(116px,0.58fr)_minmax(116px,0.58fr)_minmax(122px,0.58fr)_minmax(156px,0.68fr)] border-b border-[var(--ui-border-strong)] px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)] lg:grid">
        <span>Customer</span>
        <span>Contact</span>
        <span>Total</span>
        <span>Last</span>
        <span>Status</span>
        <span className="text-right">Action</span>
      </div>

      <div className="grid">
        {customers.map((customer) => {
          const isSelected = selectedCustomerId === customer.id;
          const lastBookingLabel = customer.lastBooking
            ? formatDateLabel(customer.lastBooking.dateKey)
            : '-';

          return (
            <article
              className={cn(
                'customer-card-row customer-desktop-row grid gap-2 border-b border-[var(--ui-border)] px-3 py-3 last:border-b-0 sm:px-4 sm:py-3.5 lg:grid-cols-[minmax(245px,1.38fr)_minmax(145px,0.74fr)_minmax(112px,0.54fr)_minmax(112px,0.54fr)_minmax(118px,0.58fr)_minmax(142px,0.62fr)] lg:items-center',
                isSelected
                  ? 'customer-card-row-selected border-studio-accent/35 bg-studio-accent/10 ring-1 ring-studio-accent/20'
                  : 'bg-transparent hover:bg-[var(--ui-glass-soft)]',
              )}
              key={customer.id}
            >
              <div className="customer-card-head flex min-w-0 items-start justify-between gap-2 lg:contents">
                <button
                  className="customer-card-person flex min-w-0 flex-1 items-center gap-2.5 rounded-[1.1rem] text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 sm:gap-3"
                  type="button"
                  onClick={() => onSelectCustomer(customer)}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-[1rem] [background:var(--ui-primary-bg)] text-xs font-semibold tracking-[-0.03em] text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-control)] sm:size-11">
                    {customer.initials}
                  </span>

                  <span className="grid min-w-0 gap-0.5">
                    <strong className="truncate text-[0.95rem] font-semibold tracking-[-0.035em] text-[var(--ui-text-strong)]">
                      {customer.name}
                    </strong>
                    <span className="truncate text-xs font-medium text-[var(--ui-text-muted)]">
                      Favorit: {customer.favoriteSession}
                    </span>
                  </span>
                </button>

                <div className="customer-card-badges flex shrink-0 flex-wrap justify-end gap-1.5 lg:hidden">
                  <CustomerQualityBadge quality={customer.dataQuality} />
                  <CustomerStatusBadge status={customer.status} />
                </div>
              </div>

              <div className="customer-card-mobile-meta flex flex-wrap gap-1.5 text-xs font-semibold text-[var(--ui-text-muted)] lg:hidden">
                <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-2 py-1">
                  {customer.phone}
                </span>
                <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-2 py-1">
                  {customer.totalBookings} sesi
                </span>
                <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-2 py-1">
                  Last {lastBookingLabel}
                </span>
              </div>

              <div className="customer-card-contact hidden items-center gap-2 text-sm font-semibold text-[var(--ui-text-main)] lg:flex">
                <Phone className="shrink-0 text-[var(--ui-text-muted)]" size={14} strokeWidth={2.35} aria-hidden="true" />
                <span className="truncate">{customer.phone}</span>
              </div>

              <div className="customer-card-total hidden gap-0.5 lg:grid">
                <strong className="text-sm font-semibold text-[var(--ui-text-strong)]">
                  {customer.totalBookings} sesi
                </strong>
                <span className="text-xs font-medium text-[var(--ui-text-muted)]">
                  {formatCurrency(customer.totalRevenue)}
                </span>
              </div>

              <div className="customer-card-last hidden gap-0.5 lg:grid">
                <strong className="text-sm font-semibold text-[var(--ui-text-strong)]">
                  {lastBookingLabel}
                </strong>
                <span className="text-xs font-medium text-[var(--ui-text-muted)]">
                  {customer.lastBooking?.time || '-'}
                </span>
              </div>

              <div className="customer-card-desktop-status hidden lg:block">
                <CustomerStatusBadge status={customer.status} />
              </div>

              <div className="customer-card-actions flex items-center justify-between gap-2 lg:justify-end">
                <button
                  className="inline-flex min-h-9 items-center justify-center rounded-full border border-transparent px-2.5 text-sm font-semibold text-[var(--ui-text-muted)] transition hover:bg-[var(--ui-control)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
                  type="button"
                  onClick={() => onSelectCustomer(customer)}
                >
                  Detail
                </button>

                <Link
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-3 text-sm font-semibold text-[var(--ui-secondary-text)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
                  to={'/admin/bookings?customer=' + encodeURIComponent(getCustomerBoardQuery(customer))}
                >
                  Board
                  <ArrowUpRight size={14} strokeWidth={2.35} aria-hidden="true" />
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
    <div className="grid gap-1 border-t border-[var(--ui-border)] py-3 first:border-t-0">
      <span className="inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-[var(--ui-text-muted)]">
        <Icon size={13} strokeWidth={2.35} aria-hidden="true" />
        {label}
      </span>

      <strong className="text-base font-semibold tracking-[-0.035em] text-[var(--ui-text-strong)]">
        {value}
      </strong>
    </div>
  );
}

function BookingSummaryCard({
  actionHref = '',
  actionLabel = 'Open board',
  booking,
  emptyLabel = 'Belum ada data',
  label,
}) {
  if (!booking) {
    return (
      <div className="customer-session-card-compact grid gap-1 rounded-[0.9rem] border border-dashed border-[var(--ui-border-strong)] bg-[var(--ui-glass-soft)] p-2 ring-1 ring-[var(--ui-ring)]">
        <span className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
          {label}
        </span>

        <strong className="text-xs font-semibold text-[var(--ui-text-muted)]">
          {emptyLabel}
        </strong>
      </div>
    );
  }

  return (
    <div className="customer-session-card-compact grid gap-2 rounded-[0.9rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-2 ring-1 ring-[var(--ui-ring)]">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
          {label}
        </span>

        {actionHref ? (
          <Link
            className="inline-flex min-h-7 items-center justify-center gap-1 rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-2 text-[0.58rem] font-semibold text-[var(--ui-secondary-text)] ring-1 ring-[var(--ui-ring)] transition hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
            to={actionHref}
          >
            {actionLabel}
            <ArrowUpRight size={10} strokeWidth={2.35} aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      <div className="grid gap-0.5">
        <strong className="text-xs font-semibold text-[var(--ui-text-strong)]">
          {booking.sessionType || booking.title || 'Studio session'}
        </strong>

        <span className="text-[0.68rem] font-medium leading-4 text-[var(--ui-text-muted)]">
          {formatDateLabel(booking.dateKey)} • {booking.time || '-'} • {booking.durationHours || 1} jam
        </span>
      </div>

      <span className="w-fit rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-2 py-0.5 text-[0.56rem] font-semibold uppercase tracking-[0.09em] text-[var(--ui-text-main)]">
        {getPaymentLabel(booking.status)}
      </span>
    </div>
  );
}

function CustomerPaymentSummary({
  customer,
}) {
  const paymentProgress = getPaymentProgress(customer);

  return (
    <section className="customer-payment-compact grid gap-2 rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-2 ring-1 ring-[var(--ui-ring)]" aria-label="Customer payment summary">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-studio-accent">
          Payment
        </span>

        <span className={cn('rounded-full border px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.1em]', getPaymentHealthClass(customer))}>
          {getPaymentHealthLabel(customer)}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ui-secondary-bg)] ring-1 ring-[var(--ui-ring)]">
        <div
          className="h-full rounded-full bg-studio-cyan"
          style={{ width: paymentProgress + '%' }}
        />
      </div>

      <div className="customer-payment-mini-grid grid grid-cols-3 gap-1">
        <div className="grid gap-0.5 rounded-[0.7rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-2">
          <span className="text-[0.52rem] font-semibold uppercase tracking-[0.1em] text-[var(--ui-text-muted)]">
            Total
          </span>
          <strong className="text-[0.68rem] font-semibold text-[var(--ui-text-strong)]">
            {formatCurrency(customer.totalRevenue)}
          </strong>
        </div>

        <div className="grid gap-0.5 rounded-[0.7rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-2">
          <span className="text-[0.52rem] font-semibold uppercase tracking-[0.1em] text-[var(--ui-text-muted)]">
            Paid
          </span>
          <strong className="text-[0.68rem] font-semibold text-[var(--ui-text-strong)]">
            {formatCurrency(customer.paidRevenue)}
          </strong>
        </div>

        <div className="grid gap-0.5 rounded-[0.7rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-2">
          <span className="text-[0.52rem] font-semibold uppercase tracking-[0.1em] text-[var(--ui-text-muted)]">
            Sisa
          </span>
          <strong className="text-[0.68rem] font-semibold text-[var(--ui-text-strong)]">
            {formatCurrency(customer.pendingRevenue)}
          </strong>
        </div>
      </div>
    </section>
  );
}

function getCustomerHistoryStats(customer) {
  const bookings = Array.isArray(customer?.bookings) ? customer.bookings : [];

  return bookings.reduce(
    (stats, booking) => {
      stats.total += 1;

      if (booking.status === 'paid') {
        stats.paid += 1;
      } else if (booking.status === 'dp') {
        stats.dp += 1;
      } else {
        stats.pending += 1;
      }

      if (Number(booking.remainingPayment) > 0) {
        stats.unpaid += 1;
        stats.unpaidAmount += Number(booking.remainingPayment) || 0;
      }

      return stats;
    },
    {
      dp: 0,
      paid: 0,
      pending: 0,
      total: 0,
      unpaid: 0,
      unpaidAmount: 0,
    },
  );
}

function getHistoryFilterOptions(customer) {
  const stats = getCustomerHistoryStats(customer);

  return [
    {
      count: stats.total,
      key: 'all',
      label: 'All',
    },
    {
      count: stats.unpaid,
      key: 'unpaid',
      label: 'Unpaid',
    },
    {
      count: stats.pending,
      key: 'pending',
      label: 'Pending',
    },
    {
      count: stats.dp,
      key: 'dp',
      label: 'DP',
    },
    {
      count: stats.paid,
      key: 'paid',
      label: 'Lunas',
    },
  ];
}

function getFilteredCustomerBookings(customer, filter) {
  const bookings = Array.isArray(customer?.bookings) ? customer.bookings : [];

  if (filter === 'unpaid') {
    return bookings.filter((booking) => Number(booking.remainingPayment) > 0);
  }

  if (filter === 'pending' || filter === 'dp' || filter === 'paid') {
    return bookings.filter((booking) => booking.status === filter);
  }

  return bookings;
}

function getBookingStatusTone(status) {
  if (status === 'paid') {
    return 'border-studio-cyan/35 bg-studio-cyan/10 text-studio-cyan ring-studio-cyan/15';
  }

  if (status === 'dp') {
    return 'border-studio-purple/35 bg-studio-purple/10 text-studio-purple ring-studio-purple/15';
  }

  return 'border-studio-accent/35 bg-studio-accent/10 text-studio-accent ring-studio-accent/15';
}

function CustomerHistoryCard({
  booking,
}) {
  const hasRemainingPayment = Number(booking.remainingPayment) > 0;

  return (
    <article
      className={cn(
        'customer-history-card-compact grid gap-2 rounded-[0.95rem] border p-2 ring-1',
        hasRemainingPayment
          ? 'border-studio-accent/35 bg-studio-accent/10 ring-studio-accent/15'
          : 'border-[var(--ui-border)] bg-[var(--ui-control)] ring-[var(--ui-ring)]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="grid min-w-0 gap-0.5">
          <strong className="truncate text-xs font-semibold text-[var(--ui-text-strong)]">
            {booking.sessionType || booking.title || 'Studio session'}
          </strong>

          <span className="text-[0.68rem] font-medium leading-4 text-[var(--ui-text-muted)]">
            {formatDateLabel(booking.dateKey)} • {booking.time || '-'} • {booking.durationHours || 1} jam
          </span>
        </div>

        <span className={cn('rounded-full border px-2 py-0.5 text-[0.56rem] font-semibold uppercase tracking-[0.09em] ring-1', getBookingStatusTone(booking.status))}>
          {getPaymentLabel(booking.status)}
        </span>
      </div>

      <div className="customer-history-money-grid grid grid-cols-3 gap-1">
        <div className="grid gap-0.5 rounded-[0.65rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-1.5">
          <span className="text-[0.48rem] font-semibold uppercase tracking-[0.09em] text-[var(--ui-text-muted)]">
            Total
          </span>
          <strong className="text-[0.58rem] font-semibold text-[var(--ui-text-strong)]">
            {formatCurrency(booking.totalPrice)}
          </strong>
        </div>

        <div className="grid gap-0.5 rounded-[0.65rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-1.5">
          <span className="text-[0.48rem] font-semibold uppercase tracking-[0.09em] text-[var(--ui-text-muted)]">
            Paid
          </span>
          <strong className="text-[0.58rem] font-semibold text-[var(--ui-text-strong)]">
            {formatCurrency(booking.dpAmount)}
          </strong>
        </div>

        <div className="grid gap-0.5 rounded-[0.65rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-1.5">
          <span className="text-[0.48rem] font-semibold uppercase tracking-[0.09em] text-[var(--ui-text-muted)]">
            Sisa
          </span>
          <strong className={cn('text-[0.58rem] font-semibold', hasRemainingPayment ? 'text-studio-accent' : 'text-[var(--ui-text-strong)]')}>
            {formatCurrency(booking.remainingPayment)}
          </strong>
        </div>
      </div>

      {booking.notes ? (
        <p className="m-0 rounded-[0.7rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-1.5 text-[0.64rem] font-medium leading-4 text-[var(--ui-text-muted)]">
          {booking.notes}
        </p>
      ) : null}
    </article>
  );
}

function CustomerDetailPanel({
  customer,
  onClose,
}) {
  const [copyStatus, setCopyStatus] = useState('idle');
  const [summaryCopyStatus, setSummaryCopyStatus] = useState('idle');
  const [templateCopyStatus, setTemplateCopyStatus] = useState('idle');
  const [selectedTemplate, setSelectedTemplate] = useState(() => getDefaultCustomerMessageTemplate(customer));
  const [historyFilter, setHistoryFilter] = useState('all');
  const phoneValue = getCustomerPhoneValue(customer);
  const phoneDigits = normalizePhoneDigits(phoneValue);
  const whatsappNumber = normalizeWhatsappNumber(phoneValue);
  const boardQuery = getCustomerBoardQuery(customer);
  const boardHref = '/admin/bookings?customer=' + encodeURIComponent(boardQuery);
  const phoneHref = phoneDigits ? 'tel:' + phoneDigits : '';
  const primaryBooking = getCustomerPrimaryBooking(customer);
  const primaryBookingLabel = getCustomerPrimaryBookingLabel(customer);
  const primaryBookingShortLabel = customer?.nextBooking ? 'Next' : customer?.lastBooking ? 'Last' : 'Booking';
  const customerSummaryText = createCustomerSummaryText(customer);
  const templateMeta = getCustomerCommunicationTemplateMeta(selectedTemplate);
  const whatsappMessage = createCustomerWhatsappMessage(customer, selectedTemplate);
  const whatsappHref = whatsappNumber ? 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(whatsappMessage) : '';
  const historyStats = getCustomerHistoryStats(customer);
  const historyFilterOptions = getHistoryFilterOptions(customer);
  const filteredHistoryBookings = getFilteredCustomerBookings(customer, historyFilter);

  const resetActionStatus = (setter) => {
    if (typeof window !== 'undefined') {
      window.setTimeout(() => setter('idle'), 2200);
    }
  };

  const handleCopyPhone = async () => {
    if (!phoneValue || typeof navigator === 'undefined' || !navigator.clipboard) {
      setCopyStatus('error');
      resetActionStatus(setCopyStatus);
      return;
    }

    try {
      await navigator.clipboard.writeText(phoneValue);
      setCopyStatus('copied');
      resetActionStatus(setCopyStatus);
    } catch (_error) {
      setCopyStatus('error');
      resetActionStatus(setCopyStatus);
    }
  };

  const handleCopySummary = async () => {
    if (!customerSummaryText || typeof navigator === 'undefined' || !navigator.clipboard) {
      setSummaryCopyStatus('error');
      resetActionStatus(setSummaryCopyStatus);
      return;
    }

    try {
      await navigator.clipboard.writeText(customerSummaryText);
      setSummaryCopyStatus('copied');
      resetActionStatus(setSummaryCopyStatus);
    } catch (_error) {
      setSummaryCopyStatus('error');
      resetActionStatus(setSummaryCopyStatus);
    }
  };

  const handleCopyTemplate = async () => {
    if (!whatsappMessage || typeof navigator === 'undefined' || !navigator.clipboard) {
      setTemplateCopyStatus('error');
      resetActionStatus(setTemplateCopyStatus);
      return;
    }

    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setTemplateCopyStatus('copied');
      resetActionStatus(setTemplateCopyStatus);
    } catch (_error) {
      setTemplateCopyStatus('error');
      resetActionStatus(setTemplateCopyStatus);
    }
  };

  if (!customer) {
    return (
      <aside className="customer-detail-compact grid min-h-[360px] content-center justify-items-center gap-4 rounded-[2rem] border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] p-6 text-center shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] backdrop-blur-2xl">
        <span className="grid size-14 place-items-center rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent">
          <UserRound size={24} strokeWidth={2.2} aria-hidden="true" />
        </span>

        <div className="grid gap-2">
          <h2 className="m-0 text-2xl font-semibold tracking-[-0.055em] text-[var(--ui-text-strong)]">
            Pilih customer.
          </h2>

          <p className="m-0 text-sm leading-7 text-[var(--ui-text-muted)]">
            Detail customer akan tampil di sini, termasuk riwayat booking, ringkasan payment, dan shortcut kontak.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="customer-detail-compact grid gap-3 rounded-[1.65rem] border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] p-3 shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] backdrop-blur-2xl sm:gap-4 sm:rounded-[2rem] sm:p-5 xl:sticky xl:top-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-13 shrink-0 place-items-center rounded-[1.15rem] [background:var(--ui-primary-bg)] text-sm font-semibold tracking-[-0.03em] text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-control)]">
            {customer.initials}
          </span>

          <div className="grid min-w-0 gap-1">
            <CustomerStatusBadge status={customer.status} />
            <h2 className="m-0 truncate text-2xl font-semibold tracking-[-0.06em] text-[var(--ui-text-strong)]">
              {customer.name}
            </h2>
            <span className="text-sm font-semibold text-[var(--ui-text-muted)]">
              {phoneValue || 'Nomor belum tersedia'}
            </span>
          </div>
        </div>

        <button
          aria-label="Close customer detail"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-[var(--ui-secondary-text)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25"
          type="button"
          onClick={onClose}
        >
          <X size={16} strokeWidth={2.35} aria-hidden="true" />
        </button>
      </div>

      <CustomerQualityPanel customer={customer} />

      <div className="customer-actions-compact grid grid-cols-3 gap-1.5 sm:grid-cols-3">
        {phoneHref ? (
          <a
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-4 text-sm font-semibold text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
            href={phoneHref}
          >
            <Phone size={15} strokeWidth={2.35} aria-hidden="true" />
            Call
          </a>
        ) : (
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-4 text-sm font-semibold text-[var(--ui-text-muted)] opacity-60"
            disabled
            type="button"
          >
            <Phone size={15} strokeWidth={2.35} aria-hidden="true" />
            Call
          </button>
        )}

        {whatsappHref ? (
          <a
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-studio-cyan/35 bg-studio-cyan/10 px-4 text-sm font-semibold text-studio-cyan ring-1 ring-studio-cyan/15 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-cyan/20"
            href={whatsappHref}
            rel="noreferrer"
            target="_blank"
          >
            <MessageCircle size={15} strokeWidth={2.35} aria-hidden="true" />
            WhatsApp
          </a>
        ) : (
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-4 text-sm font-semibold text-[var(--ui-text-muted)] opacity-60"
            disabled
            type="button"
          >
            <MessageCircle size={15} strokeWidth={2.35} aria-hidden="true" />
            WhatsApp
          </button>
        )}

        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-4 text-sm font-semibold text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!phoneValue}
          type="button"
          onClick={handleCopyPhone}
        >
          <Copy size={15} strokeWidth={2.35} aria-hidden="true" />
          {copyStatus === 'copied' ? 'Copied' : copyStatus === 'error' ? 'Gagal' : 'Copy HP'}
        </button>

        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-4 text-sm font-semibold text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
          type="button"
          onClick={handleCopySummary}
        >
          <Copy size={15} strokeWidth={2.35} aria-hidden="true" />
          {summaryCopyStatus === 'copied' ? 'Copied' : summaryCopyStatus === 'error' ? 'Gagal' : 'Summary'}
        </button>

        {primaryBooking ? (
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-4 text-sm font-semibold text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
            to={boardHref}
          >
            <CalendarClock size={15} strokeWidth={2.35} aria-hidden="true" />
            {primaryBookingShortLabel}
          </Link>
        ) : null}

        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full [background:var(--ui-primary-bg)] px-4 text-sm font-semibold text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
          to={boardHref}
        >
          Board
          <ArrowUpRight size={15} strokeWidth={2.35} aria-hidden="true" />
        </Link>
      </div>

      <div className="customer-whatsapp-template customer-template-panel grid gap-2 rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-3 ring-1 ring-[var(--ui-ring)]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
            Message template
          </span>

          <span className="rounded-full border border-studio-cyan/35 bg-studio-cyan/10 px-2 py-0.5 text-[0.56rem] font-semibold uppercase tracking-[0.1em] text-studio-cyan">
            {templateMeta.label}
          </span>
        </div>

        <div className="customer-template-options -mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Customer message templates">
          {customerCommunicationTemplates.map((template) => {
            const isActive = selectedTemplate === template.key;

            return (
              <button
                aria-pressed={isActive}
                className={cn(
                  'inline-flex min-h-8 shrink-0 snap-start items-center rounded-full border px-2.5 text-[0.58rem] font-semibold uppercase tracking-[0.09em] ring-1 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20',
                  isActive
                    ? 'border-studio-accent/45 bg-studio-accent/10 text-studio-accent ring-studio-accent/20'
                    : 'border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-[var(--ui-secondary-text)] ring-[var(--ui-ring)] hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)]',
                )}
                key={template.key}
                type="button"
                onClick={() => setSelectedTemplate(template.key)}
              >
                {template.label}
              </button>
            );
          })}
        </div>

        <p className="m-0 line-clamp-4 whitespace-pre-line rounded-[0.9rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-2 text-xs font-medium leading-5 text-[var(--ui-text-main)]">
          {whatsappMessage}
        </p>

        <button
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-3 text-xs font-semibold text-[var(--ui-secondary-text)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
          type="button"
          onClick={handleCopyTemplate}
        >
          <Copy size={13} strokeWidth={2.35} aria-hidden="true" />
          {templateCopyStatus === 'copied' ? 'Template copied' : templateCopyStatus === 'error' ? 'Copy gagal' : 'Copy template'}
        </button>
      </div>

      <div className="customer-detail-summary-compact grid grid-cols-2 gap-1.5 rounded-[0.95rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-1.5 ring-1 ring-[var(--ui-ring)]">
        <div className="grid gap-0.5 rounded-[0.75rem] bg-[var(--ui-control)] px-2 py-1.5">
          <span className="text-[0.52rem] font-semibold uppercase tracking-[0.1em] text-[var(--ui-text-muted)]">
            Total
          </span>
          <strong className="text-xs font-semibold text-[var(--ui-text-strong)]">
            {customer.totalBookings} sesi
          </strong>
        </div>

        <div className="grid gap-0.5 rounded-[0.75rem] bg-[var(--ui-control)] px-2 py-1.5">
          <span className="text-[0.52rem] font-semibold uppercase tracking-[0.1em] text-[var(--ui-text-muted)]">
            Favorite
          </span>
          <strong className="truncate text-xs font-semibold text-[var(--ui-text-strong)]">
            {customer.favoriteSession}
          </strong>
        </div>

        <div className="grid gap-0.5 rounded-[0.75rem] bg-[var(--ui-control)] px-2 py-1.5">
          <span className="text-[0.52rem] font-semibold uppercase tracking-[0.1em] text-[var(--ui-text-muted)]">
            Last
          </span>
          <strong className="text-xs font-semibold text-[var(--ui-text-strong)]">
            {customer.lastBooking ? formatDateLabel(customer.lastBooking.dateKey) : '-'}
          </strong>
        </div>

        <div className="grid gap-0.5 rounded-[0.75rem] bg-[var(--ui-control)] px-2 py-1.5">
          <span className="text-[0.52rem] font-semibold uppercase tracking-[0.1em] text-[var(--ui-text-muted)]">
            Next
          </span>
          <strong className="truncate text-xs font-semibold text-[var(--ui-text-strong)]">
            {customer.nextBooking ? formatDateLabel(customer.nextBooking.dateKey) : 'Belum ada'}
          </strong>
        </div>
      </div>

      <CustomerPaymentSummary customer={customer} />

      <div className="customer-session-grid-compact grid gap-3 sm:grid-cols-2">
        <BookingSummaryCard
          actionHref={boardHref}
          actionLabel="Open"
          booking={customer.lastBooking}
          emptyLabel="Belum ada booking terakhir"
          label="Last session"
        />

        <BookingSummaryCard
          actionHref={boardHref}
          actionLabel="Open"
          booking={customer.nextBooking}
          emptyLabel="Belum ada jadwal mendatang"
          label="Next session"
        />
      </div>

      <div className="customer-history-compact grid gap-3">
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-studio-accent">
              Booking history
            </span>

            <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-[var(--ui-text-muted)] ring-1 ring-[var(--ui-ring)]">
              {filteredHistoryBookings.length} / {customer.bookings.length} sesi
            </span>
          </div>

          <div className="customer-history-summary-compact grid gap-1.5 rounded-[0.95rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-1.5 ring-1 ring-[var(--ui-ring)]">
            <div className="grid grid-cols-2 gap-1">
              <div className="grid gap-0.5 rounded-[0.75rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-2 py-1.5">
                <span className="text-[0.5rem] font-semibold uppercase tracking-[0.1em] text-[var(--ui-text-muted)]">
                  Unpaid
                </span>
                <strong className="text-[0.64rem] font-semibold text-studio-accent">
                  {historyStats.unpaid} • {formatCurrency(historyStats.unpaidAmount)}
                </strong>
              </div>

              <div className="grid gap-0.5 rounded-[0.75rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-2 py-1.5">
                <span className="text-[0.5rem] font-semibold uppercase tracking-[0.1em] text-[var(--ui-text-muted)]">
                  Paid
                </span>
                <strong className="text-[0.64rem] font-semibold text-[var(--ui-text-strong)]">
                  {historyStats.paid}/{historyStats.total} sesi
                </strong>
              </div>
            </div>

            <div className="-mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
              {historyFilterOptions.map((option) => {
                const isActive = historyFilter === option.key;

                return (
                  <button
                    aria-pressed={isActive}
                    className={cn(
                      'inline-flex min-h-8 shrink-0 snap-start items-center justify-center gap-1.5 rounded-full border px-2.5 text-[0.58rem] font-semibold uppercase tracking-[0.09em] ring-1 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20',
                      isActive
                        ? 'border-studio-accent/45 bg-studio-accent/10 text-studio-accent ring-studio-accent/20'
                        : 'border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-[var(--ui-secondary-text)] ring-[var(--ui-ring)] hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)]',
                    )}
                    key={option.key}
                    type="button"
                    onClick={() => setHistoryFilter(option.key)}
                  >
                    {option.label}
                    <span className="rounded-full bg-[var(--ui-control)] px-1.5 py-0.5 text-[0.62rem]">
                      {option.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid max-h-[28rem] gap-2 overflow-auto pr-0 sm:pr-1">
          {filteredHistoryBookings.length > 0 ? (
            filteredHistoryBookings.map((booking) => (
              <CustomerHistoryCard
                booking={booking}
                key={booking.id}
              />
            ))
          ) : (
            <div className="grid min-h-28 place-items-center rounded-[1.15rem] border border-dashed border-[var(--ui-border-strong)] bg-[var(--ui-glass-soft)] p-4 text-center ring-1 ring-[var(--ui-ring)]">
              <p className="m-0 text-sm font-medium leading-6 text-[var(--ui-text-muted)]">
                Tidak ada booking pada filter history ini.
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export function CustomerAdmin() {
  const adminContext = useOutletContext() || {};
  const {
    bookingLoadError = '',
    isBookingsReady = true,
    manualBookings = [],
  } = adminContext;
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortMode, setSortMode] = useState('attention');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const bookings = useMemo(
    () => manualBookings,
    [manualBookings],
  );
  const customers = useMemo(() => buildCustomersFromBookings(bookings), [bookings]);
  const stats = useMemo(() => getCustomerStats(customers), [customers]);
  const qualityStats = useMemo(() => getCustomerQualityStats(customers), [customers]);
  const filteredCustomers = useMemo(
    () => getFilteredCustomers(customers, searchTerm, statusFilter, sortMode),
    [customers, searchTerm, sortMode, statusFilter],
  );
  const selectedCustomer = useMemo(
    () => selectedCustomerId
      ? customers.find((customer) => customer.id === selectedCustomerId) || null
      : null,
    [customers, selectedCustomerId],
  );
  const hasActiveCustomerFilters = Boolean(String(searchTerm || '').trim()) || statusFilter !== 'all' || sortMode !== 'attention';

  const resetCustomerFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortMode('attention');
  };
  const hasBookingData = bookings.length > 0;
  const shouldShowEmptyBookings = isBookingsReady && !hasBookingData;
  const shouldShowLoading = !isBookingsReady;

  const handleSelectCustomer = (customer) => {
    setSelectedCustomerId(customer.id);
  };

  const handleSelectFirstCustomer = () => {
    const firstCustomer = filteredCustomers[0];

    if (firstCustomer) {
      setSelectedCustomerId(firstCustomer.id);
    }
  };

  return (
    <section className="customer-mobile-workspace grid gap-3 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-1 sm:gap-4 md:pb-4 md:pt-2" aria-labelledby="customer-admin-title">
      <div className="sr-only" id="customer-admin-title">
        Customer admin workspace
      </div>

      <CustomerHero activeCustomer={selectedCustomer} stats={stats} />

      <MetricStrip stats={stats} />

      <CustomerAttentionStrip
        activeFilter={statusFilter}
        stats={qualityStats}
        onFilterChange={setStatusFilter}
      />

      <CustomerToolbar
        resultCount={filteredCustomers.length}
        searchTerm={searchTerm}
        sortMode={sortMode}
        statusFilter={statusFilter}
        onSearchChange={setSearchTerm}
        onSortChange={setSortMode}
        onStatusFilterChange={setStatusFilter}
      />

      <CustomerFilterSummary
        resultCount={filteredCustomers.length}
        searchTerm={searchTerm}
        sortMode={sortMode}
        statusFilter={statusFilter}
        onResetFilters={resetCustomerFilters}
        onSearchChange={setSearchTerm}
        onSortChange={setSortMode}
        onStatusFilterChange={setStatusFilter}
      />

      <CustomerErrorNotice message={bookingLoadError} />

      {shouldShowLoading ? (
        <CustomerLoadingState />
      ) : shouldShowEmptyBookings ? (
        <CustomerStatePanel
          actionHref="/admin/bookings"
          actionLabel="Buat booking"
          icon={UsersRound}
          message="Customer akan otomatis muncul setelah ada booking real dari Firestore. Buat booking pertama dari halaman booking board."
          title="Belum ada customer."
        />
      ) : (
        <div className="customer-desktop-content-grid grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,390px)] xl:items-start">
          <CustomerList
            customers={filteredCustomers}
            hasActiveFilters={hasActiveCustomerFilters}
            selectedCustomerId={selectedCustomer?.id || ''}
            onResetFilters={resetCustomerFilters}
            onSelectCustomer={handleSelectCustomer}
          />

          {selectedCustomer ? (
            <CustomerDetailPanel
              key={selectedCustomer.id}
              customer={selectedCustomer}
              onClose={() => setSelectedCustomerId(null)}
            />
          ) : (
            <CustomerSelectionEmptyState
              hasCustomers={filteredCustomers.length > 0}
              onSelectFirst={handleSelectFirstCustomer}
            />
          )}
        </div>
      )}
    </section>
  );
}
