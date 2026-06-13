import {
  useMemo,
  useState,
  } from 'react';
import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from 'react-router';
import {
  ArrowUpRight,
  CalendarClock,
  ChevronDown,
  CheckCircle2,
  CreditCard,
  Download,
  History,
  ListFilter,
  Phone,
  Printer,
  Search,
  Tags,
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
import {
  AdminBadge,
  AdminButton,
  AdminCommandBar,
  AdminPageHeader,
  AdminPageShell,
  AdminPanel,
} from '../components/admin/AdminPrimitives.jsx';

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
    label: 'Attention',
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

const customerTagOptions = [
  {
    key: 'vip',
    label: 'VIP',
  },
  {
    key: 'band',
    label: 'Band',
  },
  {
    key: 'recording',
    label: 'Recording',
  },
  {
    key: 'followUp',
    label: 'Follow-up',
  },
  {
    key: 'highValue',
    label: 'High value',
  },
  {
    key: 'watchlist',
    label: 'Watchlist',
  },
];

const CUSTOMER_NOTES_STORAGE_KEY = 'thirty-seven-customer-notes-v1';

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

function getCustomerDetailPath(customer) {
  return '/admin/customers/' + encodeURIComponent(customer?.id || '');
}

function findCustomerByRouteId(customers, routeCustomerId) {
  const decodedId = decodeURIComponent(String(routeCustomerId || ''));

  return (Array.isArray(customers) ? customers : []).find((customer) => customer.id === decodedId) || null;
}

function normalizeCustomerNoteDraft(value) {
  const source = value && typeof value === 'object' ? value : {};
  const tags = Array.isArray(source.tags)
    ? source.tags.filter((tag) => customerTagOptions.some((option) => option.key === tag))
    : [];

  return {
    note: String(source.note || ''),
    tags: Array.from(new Set(tags)),
    updatedAt: String(source.updatedAt || ''),
  };
}

function readCustomerNotesStore() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {};
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(CUSTOMER_NOTES_STORAGE_KEY) || '{}');

    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function getStoredCustomerNote(customerId) {
  const store = readCustomerNotesStore();

  return normalizeCustomerNoteDraft(store[String(customerId || '')]);
}

function writeStoredCustomerNote(customerId, draft) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  const key = String(customerId || '').trim();

  if (!key) {
    return;
  }

  const normalizedDraft = normalizeCustomerNoteDraft(draft);
  const shouldRemove = !normalizedDraft.note.trim() && normalizedDraft.tags.length === 0;
  const nextStore = {
    ...readCustomerNotesStore(),
  };

  if (shouldRemove) {
    delete nextStore[key];
  } else {
    nextStore[key] = {
      ...normalizedDraft,
      updatedAt: new Date().toISOString(),
    };
  }

  window.localStorage.setItem(CUSTOMER_NOTES_STORAGE_KEY, JSON.stringify(nextStore));
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

function getCustomerQuickActionIntent(customer, templateMeta) {
  const pendingRevenue = Math.max(0, Number(customer?.pendingRevenue) || 0);
  const hasPhone = Boolean(getCustomerPhoneValue(customer));
  const templateLabel = templateMeta?.label || 'Message';

  if (!hasPhone) {
    return {
      helper: 'Nomor customer belum tersedia. Simpan nomor dulu agar WhatsApp dan call bisa dipakai.',
      label: 'Need phone',
      tone: 'warning',
    };
  }

  if (pendingRevenue > 0) {
    return {
      helper: 'Sisa bayar ' + formatCurrency(pendingRevenue) + '. Prioritaskan WhatsApp follow-up payment.',
      label: 'Payment follow-up',
      tone: 'accent',
    };
  }

  if (customer?.nextBooking) {
    return {
      helper: 'Customer punya jadwal mendatang. Kirim reminder atau cek booking board.',
      label: 'Booking reminder',
      tone: 'cyan',
    };
  }

  if ((Number(customer?.totalBookings) || 0) > 1) {
    return {
      helper: 'Customer returning. Gunakan template ' + templateLabel + ' untuk jaga relasi dan dorong booking ulang.',
      label: 'Retention',
      tone: 'purple',
    };
  }

  return {
    helper: 'Customer baru atau riwayat masih ringan. Kirim pesan singkat atau buka board untuk follow-up.',
    label: templateLabel,
    tone: 'neutral',
  };
}

function getCustomerQuickActionToneClass(tone) {
  if (tone === 'warning') {
    return 'border-studio-purple/35 bg-studio-purple/10 text-studio-purple';
  }

  if (tone === 'accent') {
    return 'border-studio-accent/35 bg-studio-accent/10 text-studio-accent';
  }

  if (tone === 'cyan') {
    return 'border-studio-cyan/35 bg-studio-cyan/10 text-studio-cyan';
  }

  if (tone === 'purple') {
    return 'border-studio-purple/35 bg-studio-purple/10 text-studio-purple';
  }

  return 'border-[var(--ui-border)] bg-[var(--ui-control)] text-[var(--ui-text-muted)]';
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
      label: 'No HP',
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

function getCustomerCrmMeta(customer) {
  const draft = getStoredCustomerNote(customer?.id);
  const tags = Array.isArray(draft.tags) ? draft.tags : [];
  const tagLabels = tags
    .map((tagKey) => customerTagOptions.find((tag) => tag.key === tagKey)?.label || tagKey)
    .filter(Boolean);
  const note = String(draft.note || '').trim();

  return {
    crmHasNote: Boolean(note),
    crmNote: note,
    crmNotePreview: note ? note.replace(/\s+/g, ' ').slice(0, 90) : '',
    crmTagLabels: tagLabels,
    crmTags: tags,
  };
}

function attachCustomerCrmMeta(customers) {
  return (Array.isArray(customers) ? customers : []).map((customer) => {
    const crmMeta = getCustomerCrmMeta(customer);
    const crmSearch = [
      crmMeta.crmNote,
      crmMeta.crmTagLabels.join(' '),
    ]
      .map(normalizeCustomerValue)
      .join(' ');

    return {
      ...customer,
      ...crmMeta,
      searchable: [customer.searchable, crmSearch].filter(Boolean).join(' '),
    };
  });
}

function getCustomerTagStats(customers) {
  const counts = new Map();

  (Array.isArray(customers) ? customers : []).forEach((customer) => {
    const tags = Array.isArray(customer.crmTags) ? customer.crmTags : [];

    tags.forEach((tagKey) => {
      counts.set(tagKey, (counts.get(tagKey) || 0) + 1);
    });
  });

  return customerTagOptions
    .map((tag) => ({
      ...tag,
      count: counts.get(tag.key) || 0,
    }))
    .filter((tag) => tag.count > 0);
}


function escapeCsvValue(value) {
  const text = String(value ?? '');

  if (/[",\n\r]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }

  return text;
}

function escapePrintHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getCustomerExportDateLabel(value) {
  return value?.dateKey ? formatDateLabel(value.dateKey) : '';
}

function getCustomerExportRows(customers) {
  return (Array.isArray(customers) ? customers : []).map((customer) => {
    const localNote = getStoredCustomerNote(customer.id);
    const tags = Array.isArray(localNote.tags) ? localNote.tags : [];
    const tagLabels = tags
      .map((tagKey) => customerTagOptions.find((tag) => tag.key === tagKey)?.label || tagKey)
      .join(', ');

    return {
      favoriteSession: customer.favoriteSession || '',
      lastBooking: getCustomerExportDateLabel(customer.lastBooking),
      name: customer.name || '',
      nextBooking: getCustomerExportDateLabel(customer.nextBooking),
      note: localNote.note || '',
      paidRevenue: formatCurrency(customer.paidRevenue),
      pendingRevenue: formatCurrency(customer.pendingRevenue),
      phone: getCustomerPhoneValue(customer) || '',
      quality: customer.dataQuality?.label || 'Clean',
      status: customer.status || '',
      tags: tagLabels,
      totalBookings: customer.totalBookings || 0,
      totalRevenue: formatCurrency(customer.totalRevenue),
    };
  });
}

function createCustomersCsv(customers) {
  const headers = [
    'Name',
    'Phone',
    'Status',
    'Quality',
    'Total bookings',
    'Total revenue',
    'Paid revenue',
    'Remaining',
    'Favorite session',
    'Last booking',
    'Next booking',
    'Tags',
    'Local note',
  ];

  const rows = getCustomerExportRows(customers).map((customer) => [
    customer.name,
    customer.phone,
    customer.status,
    customer.quality,
    customer.totalBookings,
    customer.totalRevenue,
    customer.paidRevenue,
    customer.pendingRevenue,
    customer.favoriteSession,
    customer.lastBooking,
    customer.nextBooking,
    customer.tags,
    customer.note,
  ]);

  return [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map(escapeCsvValue).join(',')),
  ].join('\n');
}

function createCustomerExportFilename() {
  const stamp = new Date().toISOString().slice(0, 10);

  return '37-music-customers-' + stamp + '.csv';
}

function downloadCustomerCsv(customers) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  const csvContent = '\uFEFF' + createCustomersCsv(customers);
  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = createCustomerExportFilename();
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  window.URL.revokeObjectURL(url);

  return true;
}

function createCustomerPrintRows(customers) {
  return getCustomerExportRows(customers)
    .map((customer) => (
      '<tr>' +
        '<td><strong>' + escapePrintHtml(customer.name) + '</strong><br /><span>' + escapePrintHtml(customer.favoriteSession) + '</span></td>' +
        '<td>' + escapePrintHtml(customer.phone || '-') + '</td>' +
        '<td>' + escapePrintHtml(customer.status) + '<br /><span>' + escapePrintHtml(customer.quality) + '</span></td>' +
        '<td>' + escapePrintHtml(customer.totalBookings) + '</td>' +
        '<td>' + escapePrintHtml(customer.totalRevenue) + '<br /><span>Sisa ' + escapePrintHtml(customer.pendingRevenue) + '</span></td>' +
        '<td>' + escapePrintHtml(customer.lastBooking || '-') + '</td>' +
        '<td>' + escapePrintHtml(customer.nextBooking || '-') + '</td>' +
        '<td>' + escapePrintHtml(customer.tags || '-') + '</td>' +
      '</tr>'
    ))
    .join('');
}

function createCustomerPrintDocument(customers) {
  const generatedAt = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const rows = createCustomerPrintRows(customers);
  const totalCustomers = Array.isArray(customers) ? customers.length : 0;

  return '<!doctype html>' +
    '<html lang="id">' +
    '<head>' +
      '<meta charset="utf-8" />' +
      '<meta name="viewport" content="width=device-width, initial-scale=1" />' +
      '<title>37 Music Studio Customer List</title>' +
      '<style>' +
        '*{box-sizing:border-box}' +
        'body{margin:0;background:#fff;color:#111827;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:1.45}' +
        '.page{padding:28px}' +
        '.header{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;border-bottom:2px solid #111827;padding-bottom:16px;margin-bottom:18px}' +
        'h1{margin:0;font-size:26px;letter-spacing:-.04em}' +
        'p{margin:4px 0 0;color:#4b5563}' +
        '.badge{border:1px solid #d1d5db;border-radius:999px;padding:8px 12px;font-weight:700;text-align:right}' +
        'table{width:100%;border-collapse:collapse}' +
        'th{background:#111827;color:#fff;text-align:left;font-size:10px;letter-spacing:.08em;text-transform:uppercase;padding:9px 8px}' +
        'td{border-bottom:1px solid #e5e7eb;padding:9px 8px;vertical-align:top}' +
        'td span{color:#6b7280;font-size:11px}' +
        '@media print{.page{padding:14mm}.header{break-after:avoid}tr{break-inside:avoid}}' +
      '</style>' +
    '</head>' +
    '<body>' +
      '<main class="page">' +
        '<section class="header">' +
          '<div>' +
            '<h1>37 Music Studio Customer List</h1>' +
            '<p>Generated ' + escapePrintHtml(generatedAt) + '</p>' +
          '</div>' +
          '<div class="badge">' + escapePrintHtml(totalCustomers) + ' customers<br /><span>Filtered contact sheet</span></div>' +
        '</section>' +
        '<table>' +
          '<thead>' +
            '<tr>' +
              '<th>Customer</th>' +
              '<th>Phone</th>' +
              '<th>Status</th>' +
              '<th>Booking</th>' +
              '<th>Revenue</th>' +
              '<th>Last</th>' +
              '<th>Next</th>' +
              '<th>Tags</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</main>' +
    '</body>' +
    '</html>';
}

function printCustomerList(customers) {
  if (typeof window === 'undefined') {
    return false;
  }

  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=800');

  if (!printWindow) {
    return false;
  }

  printWindow.document.open();
  printWindow.document.write(createCustomerPrintDocument(customers));
  printWindow.document.close();
  printWindow.focus();

  window.setTimeout(() => {
    printWindow.print();
  }, 250);

  return true;
}


function CustomerHero() {
  return (
    <AdminPageHeader
      description="Kontak, histori booking, tag CRM, dan follow-up pembayaran."
      eyebrow="Studio CRM"
      title="Customer list"
    />
  );
}

function MetricStrip({
  stats,
}) {
  const compactItems = [
    {
      icon: UsersRound,
      label: 'Customers',
      toneClass: 'text-studio-accent',
      value: stats.totalCustomers,
    },
    {
      icon: CheckCircle2,
      label: 'Returning',
      toneClass: 'text-studio-purple',
      value: stats.returningCustomers,
    },
    {
      icon: CalendarClock,
      label: 'Upcoming',
      toneClass: 'text-studio-cyan',
      value: stats.upcomingCustomers,
    },
  ];

  return (
    <section className="customer-summary-strip customer-summary-compact" aria-label="Customer summary">
      <AdminPanel className="customer-summary-rail grid gap-2 p-2.5 sm:p-3" variant="flat">
        <div className="customer-summary-main grid grid-cols-3 gap-1.5">
          {compactItems.map((item) => {
            const Icon = item.icon;

            return (
              <article
                className="customer-summary-pill grid min-w-0 gap-1 rounded-[0.95rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-2.5 py-2 ring-1 ring-[var(--ui-ring)]"
                key={item.label}
              >
                <span className="inline-flex min-w-0 items-center gap-1.5 text-[0.56rem] font-semibold uppercase tracking-[0.11em] text-[var(--ui-text-muted)]">
                  <Icon className={cn('shrink-0', item.toneClass)} size={12} strokeWidth={2.35} aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </span>

                <strong className="justify-self-end text-sm font-semibold leading-none tracking-[-0.04em] text-[var(--ui-text-strong)]">
                  {item.value}
                </strong>
              </article>
            );
          })}
        </div>

        <article className="customer-summary-revenue flex min-w-0 items-center justify-between gap-3 rounded-[0.95rem] border border-[var(--ui-border)] bg-[var(--ui-bg-base)] px-3 py-2 ring-1 ring-[var(--ui-ring)]">
          <span className="inline-flex min-w-0 items-center gap-2 text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
            <CreditCard className="shrink-0 text-[var(--ui-text-muted)]" size={13} strokeWidth={2.35} aria-hidden="true" />
            Revenue
          </span>

          <strong className="min-w-0 truncate text-right text-sm font-semibold leading-none tracking-[-0.04em] text-[var(--ui-text-strong)] sm:text-base">
            {formatCurrency(stats.totalRevenue)}
          </strong>
        </article>
      </AdminPanel>
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

function CustomerTagFilterStrip({
  activeTagFilter,
  stats,
  onTagFilterChange,
}) {
  const tagItems = Array.isArray(stats) ? stats : [];
  const totalTagged = tagItems.reduce((sum, tag) => sum + tag.count, 0);

  if (!tagItems.length) {
    return null;
  }

  return (
    <AdminPanel className="customer-tag-filter-strip flex snap-x gap-1.5 overflow-x-auto p-2" aria-label="Customer CRM tag filters" variant="flat">
      <button
        aria-pressed={activeTagFilter === 'all'}
        className={cn(
          'inline-flex min-h-9 shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 text-xs font-semibold ring-1 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20',
          activeTagFilter === 'all'
            ? 'border-studio-accent/45 bg-studio-accent/12 text-studio-accent ring-studio-accent/20'
            : 'border-[var(--ui-border)] bg-[var(--ui-control)] text-[var(--ui-text-main)] ring-[var(--ui-ring)] hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)]',
        )}
        type="button"
        onClick={() => onTagFilterChange('all')}
      >
        <Tags size={13} strokeWidth={2.35} aria-hidden="true" />
        <span>Tags</span>
        <strong className="rounded-full bg-[var(--ui-glass-soft)] px-1.5 py-0.5 text-[0.68rem] leading-none text-[var(--ui-text-strong)]">
          {totalTagged}
        </strong>
      </button>

      {tagItems.map((tag) => {
        const isActive = activeTagFilter === tag.key;

        return (
          <button
            aria-pressed={isActive}
            className={cn(
              'inline-flex min-h-9 shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 text-xs font-semibold ring-1 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20',
              isActive
                ? 'border-studio-accent/45 bg-studio-accent/12 text-studio-accent ring-studio-accent/20'
                : 'border-[var(--ui-border)] bg-[var(--ui-control)] text-[var(--ui-text-main)] ring-[var(--ui-ring)] hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)]',
            )}
            key={tag.key}
            type="button"
            onClick={() => onTagFilterChange(tag.key)}
          >
            <span>{tag.label}</span>
            <strong className="rounded-full bg-[var(--ui-glass-soft)] px-1.5 py-0.5 text-[0.68rem] leading-none text-[var(--ui-text-strong)]">
              {tag.count}
            </strong>
          </button>
        );
      })}
    </AdminPanel>
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
    <AdminCommandBar className="customer-toolbar-slim customer-toolbar-compact grid gap-2 p-2 lg:grid-cols-[minmax(0,1fr)_minmax(13rem,0.28fr)_minmax(13rem,0.28fr)] lg:items-end">
      <div className="customer-toolbar-search-row grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center lg:col-span-1">
        <label className="grid gap-1 text-xs font-semibold text-[var(--ui-text-main)]">
          <span className="sr-only">Search customer</span>

          <span className="customer-toolbar-search-control flex min-h-11 items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 ring-1 ring-[var(--ui-ring)] focus-within:border-studio-accent/55 focus-within:ring-4 focus-within:ring-studio-accent/20">
            <Search className="shrink-0 text-[var(--ui-text-muted)]" size={15} strokeWidth={2.35} aria-hidden="true" />
            <input
              className="w-full border-0 bg-transparent text-sm font-semibold text-[var(--ui-text-strong)] outline-none placeholder:text-[var(--ui-text-soft)]"
              placeholder="Cari customer..."
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
                <X size={13} strokeWidth={2.35} aria-hidden="true" />
              </button>
            ) : null}
          </span>
        </label>

        <span className="customer-toolbar-result-chip inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-3 text-xs font-semibold text-[var(--ui-secondary-text)] ring-1 ring-[var(--ui-ring)]">
          <UsersRound size={13} strokeWidth={2.35} aria-hidden="true" />
          {resultCount}
        </span>
      </div>

      <div className="customer-toolbar-select-row grid grid-cols-2 gap-2 lg:contents">
        <div className="customer-toolbar-select-shell">
          <ToolbarSelect
            icon={ListFilter}
            label="Segment"
            options={customerStatusFilters}
            value={statusFilter}
            onChange={onStatusFilterChange}
          />
        </div>

        <div className="customer-toolbar-select-shell">
          <ToolbarSelect
            icon={History}
            label="Sort"
            options={customerSortOptions}
            value={sortMode}
            onChange={onSortChange}
          />
        </div>
      </div>
    </AdminCommandBar>
  );
}

function CustomerExportPanel({
  customers,
  totalCustomers,
}) {
  const [exportStatus, setExportStatus] = useState('idle');
  const [printStatus, setPrintStatus] = useState('idle');
  const hasCustomers = Array.isArray(customers) && customers.length > 0;
  const visibleLabel = (customers?.length || 0) + ' / ' + totalCustomers + ' customer';

  const resetStatus = (setter) => {
    if (typeof window !== 'undefined') {
      window.setTimeout(() => setter('idle'), 2200);
    }
  };

  const handleExportCsv = () => {
    const didDownload = hasCustomers && downloadCustomerCsv(customers);

    setExportStatus(didDownload ? 'done' : 'error');
    resetStatus(setExportStatus);
  };

  const handlePrintList = () => {
    const didPrint = hasCustomers && printCustomerList(customers);

    setPrintStatus(didPrint ? 'done' : 'error');
    resetStatus(setPrintStatus);
  };

  return (
    <AdminPanel className="customer-export-panel flex flex-wrap items-center justify-between gap-3 p-3" aria-label="Customer export and print" variant="flat">
      <div className="grid gap-0.5">
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
          Export
        </span>

        <strong className="text-sm font-semibold text-[var(--ui-text-strong)]">
          {visibleLabel}
        </strong>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <AdminButton
          disabled={!hasCustomers}
          icon={Download}
          size="sm"
          variant="secondary"
          onClick={handleExportCsv}
        >
          {exportStatus === 'done' ? 'Done' : exportStatus === 'error' ? 'Empty' : 'CSV'}
        </AdminButton>

        <AdminButton
          disabled={!hasCustomers}
          icon={Printer}
          size="sm"
          variant="secondary"
          onClick={handlePrintList}
        >
          {printStatus === 'done' ? 'Opened' : printStatus === 'error' ? 'Empty' : 'Print'}
        </AdminButton>
      </div>
    </AdminPanel>
  );
}

function CustomerFilterSummary({
  resultCount,
  searchTerm,
  sortMode,
  statusFilter,
  tagFilter = 'all',
  onResetFilters,
  onSearchChange,
  onSortChange,
  onStatusFilterChange,
  onTagFilterChange = () => {},
}) {
  const cleanSearchTerm = String(searchTerm || '').trim();
  const statusLabel = customerStatusFilters.find((item) => item.key === statusFilter)?.label || statusFilter;
  const sortLabel = customerSortOptions.find((item) => item.key === sortMode)?.label || sortMode;
  const tagLabel = customerTagOptions.find((item) => item.key === tagFilter)?.label || tagFilter;
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
    tagFilter !== 'all'
      ? {
        key: 'tag',
        label: 'Tag',
        value: tagLabel,
        onClear: () => onTagFilterChange('all'),
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

function CustomerNotesPanel({
  noteDraft,
  noteSaveStatus,
  onClear,
  onNoteChange,
  onSave,
  onToggleTag,
}) {
  const hasContent = Boolean(noteDraft.note.trim()) || noteDraft.tags.length > 0;

  return (
    <section className="customer-notes-panel grid gap-2 rounded-[1.1rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-3 ring-1 ring-[var(--ui-ring)]" aria-label="Customer internal notes">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
          Internal notes
        </span>

        <span className={cn(
          'rounded-full border px-2 py-0.5 text-[0.54rem] font-semibold uppercase tracking-[0.1em]',
          hasContent
            ? 'border-studio-cyan/35 bg-studio-cyan/10 text-studio-cyan'
            : 'border-[var(--ui-border)] bg-[var(--ui-control)] text-[var(--ui-text-muted)]',
        )}>
          {hasContent ? 'Local saved' : 'Optional'}
        </span>
      </div>

      <div className="customer-notes-tags -mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1" aria-label="Customer tags">
        {customerTagOptions.map((tag) => {
          const isActive = noteDraft.tags.includes(tag.key);

          return (
            <button
              aria-pressed={isActive}
              className={cn(
                'inline-flex min-h-8 shrink-0 snap-start items-center rounded-full border px-2.5 text-[0.58rem] font-semibold uppercase tracking-[0.09em] ring-1 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20',
                isActive
                  ? 'border-studio-accent/45 bg-studio-accent/10 text-studio-accent ring-studio-accent/20'
                  : 'border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-[var(--ui-secondary-text)] ring-[var(--ui-ring)] hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)]',
              )}
              key={tag.key}
              type="button"
              onClick={() => onToggleTag(tag.key)}
            >
              {tag.label}
            </button>
          );
        })}
      </div>

      <textarea
        aria-label="Catatan internal customer"
        className="min-h-20 resize-y rounded-[0.9rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-2 text-xs font-medium leading-5 text-[var(--ui-text-main)] outline-none ring-1 ring-[var(--ui-ring)] placeholder:text-[var(--ui-text-soft)] focus:border-studio-accent/55 focus:ring-4 focus:ring-studio-accent/20"
        placeholder="Contoh: suka booking malam, prefer studio A, perlu follow-up DP..."
        value={noteDraft.note}
        onChange={(event) => onNoteChange(event.target.value)}
      />

      <div className="flex items-center justify-between gap-2">
        <button
          className="inline-flex min-h-8 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-3 text-xs font-semibold text-[var(--ui-secondary-text)] ring-1 ring-[var(--ui-ring)] transition hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!hasContent}
          type="button"
          onClick={onClear}
        >
          Clear
        </button>

        <button
          className="inline-flex min-h-8 items-center justify-center rounded-full [background:var(--ui-primary-bg)] px-3 text-xs font-semibold text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
          type="button"
          onClick={onSave}
        >
          {noteSaveStatus === 'saved' ? 'Saved' : noteSaveStatus === 'cleared' ? 'Cleared' : noteSaveStatus === 'error' ? 'Save failed' : 'Save local'}
        </button>
      </div>
    </section>
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

function getCustomerInsightToneClass(tone) {
  if (tone === 'accent') {
    return 'border-studio-accent/35 bg-studio-accent/10 text-studio-accent ring-studio-accent/15';
  }

  if (tone === 'cyan') {
    return 'border-studio-cyan/35 bg-studio-cyan/10 text-studio-cyan ring-studio-cyan/15';
  }

  if (tone === 'purple') {
    return 'border-studio-purple/35 bg-studio-purple/10 text-studio-purple ring-studio-purple/15';
  }

  return 'border-[var(--ui-border)] bg-[var(--ui-control)] text-[var(--ui-text-muted)] ring-[var(--ui-ring)]';
}

function CustomerInsightCard({
  actionLabel = 'Select',
  customer = null,
  helper,
  icon: Icon,
  label,
  tone = 'neutral',
  value,
  onSelectCustomer,
}) {
  return (
    <article className="customer-insight-card grid gap-2 rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-3 ring-1 ring-[var(--ui-ring)]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
            {label}
          </span>

          <strong className="truncate text-lg font-semibold tracking-[-0.055em] text-[var(--ui-text-strong)]">
            {value}
          </strong>
        </div>

        <span className={cn('grid size-9 shrink-0 place-items-center rounded-[0.85rem] border ring-1', getCustomerInsightToneClass(tone))}>
          <Icon size={16} strokeWidth={2.35} aria-hidden="true" />
        </span>
      </div>

      <p className="m-0 line-clamp-2 text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
        {helper}
      </p>

      {customer ? (
        <button
          className="inline-flex min-h-8 w-fit items-center justify-center gap-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-3 text-xs font-semibold text-[var(--ui-secondary-text)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
          type="button"
          onClick={() => onSelectCustomer(customer)}
        >
          {actionLabel}
          <ArrowUpRight size={12} strokeWidth={2.35} aria-hidden="true" />
        </button>
      ) : null}
    </article>
  );
}

function CustomerInsightPanel({
  customers,
  filteredCustomers,
  qualityStats,
  stats,
  onSelectCustomer,
}) {
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const visibleCustomers = Array.isArray(filteredCustomers) ? filteredCustomers : safeCustomers;
  const topRevenueCustomer = [...safeCustomers].sort((a, b) => b.totalRevenue - a.totalRevenue)[0] || null;
  const unpaidCustomers = safeCustomers
    .filter((customer) => Math.max(0, Number(customer.pendingRevenue) || 0) > 0)
    .sort((a, b) => b.pendingRevenue - a.pendingRevenue);
  const topUnpaidCustomer = unpaidCustomers[0] || null;
  const upcomingCustomer = [...safeCustomers]
    .filter((customer) => customer.nextBooking)
    .sort((a, b) => {
      const firstTime = a.nextBooking?.parsedDate?.getTime() || Number.MAX_SAFE_INTEGER;
      const secondTime = b.nextBooking?.parsedDate?.getTime() || Number.MAX_SAFE_INTEGER;

      return firstTime - secondTime;
    })[0] || null;
  const reviewCustomer = safeCustomers.find((customer) => customer.dataQuality?.level !== 'clean') || null;
  const totalUnpaidAmount = unpaidCustomers.reduce((sum, customer) => sum + (Number(customer.pendingRevenue) || 0), 0);
  const visibleLabel = visibleCustomers.length + ' visible dari ' + safeCustomers.length;

  return (
    <section className="customer-insight-panel hidden gap-3 xl:grid" aria-label="Customer desktop insights">
      <div className="flex items-end justify-between gap-4">
        <div className="grid gap-1">
          <span className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-studio-accent">
            Customer insights
          </span>

          <h2 className="m-0 text-xl font-semibold tracking-[-0.055em] text-[var(--ui-text-strong)]">
            Follow-up board
          </h2>
        </div>

        <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 py-1 text-xs font-semibold text-[var(--ui-text-muted)] ring-1 ring-[var(--ui-ring)]">
          {visibleLabel}
        </span>
      </div>

      <div className="customer-insight-grid grid gap-2 2xl:grid-cols-2">
        <CustomerInsightCard
          actionLabel="Open customer"
          customer={topRevenueCustomer}
          helper={topRevenueCustomer ? topRevenueCustomer.name + ' menyumbang revenue terbesar dari histori booking.' : 'Belum ada customer dengan revenue.'}
          icon={Banknote}
          label="Top revenue"
          tone="cyan"
          value={topRevenueCustomer ? formatCurrency(topRevenueCustomer.totalRevenue) : formatCurrency(stats.totalRevenue)}
          onSelectCustomer={onSelectCustomer}
        />

        <CustomerInsightCard
          actionLabel="Follow-up"
          customer={topUnpaidCustomer}
          helper={topUnpaidCustomer ? topUnpaidCustomer.name + ' punya sisa pembayaran terbesar.' : 'Tidak ada sisa pembayaran aktif.'}
          icon={CreditCard}
          label="Unpaid focus"
          tone={topUnpaidCustomer ? 'accent' : 'cyan'}
          value={formatCurrency(totalUnpaidAmount)}
          onSelectCustomer={onSelectCustomer}
        />

        <CustomerInsightCard
          actionLabel="Send reminder"
          customer={upcomingCustomer}
          helper={upcomingCustomer?.nextBooking ? upcomingCustomer.name + ' punya jadwal ' + formatDateLabel(upcomingCustomer.nextBooking.dateKey) + '.' : 'Belum ada upcoming booking.'}
          icon={CalendarClock}
          label="Next reminder"
          tone={upcomingCustomer ? 'purple' : 'neutral'}
          value={upcomingCustomer ? formatDateLabel(upcomingCustomer.nextBooking.dateKey) : 'No schedule'}
          onSelectCustomer={onSelectCustomer}
        />

        <CustomerInsightCard
          actionLabel="Review"
          customer={reviewCustomer}
          helper={reviewCustomer ? reviewCustomer.name + ': ' + (reviewCustomer.dataQuality?.helper || 'Data perlu dicek.') : 'Semua customer terlihat clean.'}
          icon={reviewCustomer ? AlertTriangle : BadgeCheck}
          label="Data quality"
          tone={reviewCustomer ? 'accent' : 'cyan'}
          value={(qualityStats.needsReview || 0) + ' review'}
          onSelectCustomer={onSelectCustomer}
        />
      </div>
    </section>
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
          const crmTagLabels = Array.isArray(customer.crmTagLabels) ? customer.crmTagLabels : [];
          const visibleCrmTags = crmTagLabels.slice(0, 2);
          const hiddenCrmTagCount = Math.max(0, crmTagLabels.length - visibleCrmTags.length);
          const hasCrmMeta = crmTagLabels.length > 0 || customer.crmHasNote;

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

                    {hasCrmMeta ? (
                      <span className="customer-card-crm-meta flex min-w-0 flex-wrap gap-1">
                        {visibleCrmTags.map((tagLabel) => (
                          <span className="rounded-full border border-studio-cyan/30 bg-studio-cyan/10 px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.08em] text-studio-cyan" key={tagLabel}>
                            {tagLabel}
                          </span>
                        ))}

                        {hiddenCrmTagCount > 0 ? (
                          <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.08em] text-[var(--ui-text-muted)]">
                            +{hiddenCrmTagCount}
                          </span>
                        ) : null}

                        {customer.crmHasNote ? (
                          <span className="rounded-full border border-studio-purple/30 bg-studio-purple/10 px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.08em] text-studio-purple">
                            Note
                          </span>
                        ) : null}
                      </span>
                    ) : null}
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
                {customer.crmHasNote ? (
                  <span className="max-w-full truncate rounded-full border border-studio-purple/30 bg-studio-purple/10 px-2 py-1 text-studio-purple">
                    Note {customer.crmNotePreview}
                  </span>
                ) : null}
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



function getCustomerActivityToneClass(tone) {
  if (tone === 'accent') {
    return 'border-studio-accent/35 bg-studio-accent/10 text-studio-accent ring-studio-accent/15';
  }

  if (tone === 'cyan') {
    return 'border-studio-cyan/35 bg-studio-cyan/10 text-studio-cyan ring-studio-cyan/15';
  }

  if (tone === 'purple') {
    return 'border-studio-purple/35 bg-studio-purple/10 text-studio-purple ring-studio-purple/15';
  }

  return 'border-[var(--ui-border)] bg-[var(--ui-control)] text-[var(--ui-text-muted)] ring-[var(--ui-ring)]';
}

function createBookingActivityItem(booking) {
  const hasRemainingPayment = Number(booking.remainingPayment) > 0;
  const paymentLabel = getPaymentLabel(booking.status);
  const tone = hasRemainingPayment
    ? 'accent'
    : booking.status === 'paid'
      ? 'cyan'
      : booking.status === 'dp'
        ? 'purple'
        : 'neutral';

  return {
    chips: [
      (booking.durationHours || 1) + ' jam',
      paymentLabel,
      hasRemainingPayment ? 'Sisa ' + formatCurrency(booking.remainingPayment) : '',
    ].filter(Boolean),
    helper: 'Total ' + formatCurrency(booking.totalPrice) + ' • Paid ' + formatCurrency(booking.dpAmount),
    icon: ReceiptText,
    id: 'booking-' + booking.id,
    sortTime: booking.parsedDate?.getTime?.() || parseDateKey(booking.dateKey).getTime(),
    timeLabel: formatDateLabel(booking.dateKey) + ' • ' + (booking.time || '-'),
    title: booking.sessionType || booking.title || 'Studio session',
    tone,
    typeLabel: paymentLabel,
  };
}

function createCustomerActivityItems(customer, filteredHistoryBookings, noteDraft) {
  const items = [];
  const quality = customer?.dataQuality || getCustomerDataQuality(customer, new Map());
  const noteText = String(noteDraft?.note || '').trim();
  const tagLabels = (Array.isArray(noteDraft?.tags) ? noteDraft.tags : [])
    .map((tagKey) => customerTagOptions.find((tag) => tag.key === tagKey)?.label || tagKey)
    .filter(Boolean);

  if (noteText || tagLabels.length > 0) {
    items.push({
      chips: tagLabels.slice(0, 4),
      helper: noteText || 'Customer punya tag CRM lokal.',
      icon: Tags,
      id: 'crm-note',
      sortTime: Number.MAX_SAFE_INTEGER,
      timeLabel: 'Local CRM',
      title: tagLabels.length ? tagLabels.join(', ') : 'Internal note',
      tone: 'purple',
      typeLabel: 'Note',
    });
  }

  if (quality?.level && quality.level !== 'clean') {
    items.push({
      chips: (quality.issues || []).slice(0, 3).map((issue) => issue.label),
      helper: quality.helper || 'Data customer perlu dicek.',
      icon: AlertTriangle,
      id: 'quality-check',
      sortTime: Number.MAX_SAFE_INTEGER - 1,
      timeLabel: 'Data quality',
      title: quality.label || 'Needs review',
      tone: 'accent',
      typeLabel: 'Review',
    });
  }

  const bookingItems = (Array.isArray(filteredHistoryBookings) ? filteredHistoryBookings : [])
    .map(createBookingActivityItem)
    .sort((firstItem, secondItem) => secondItem.sortTime - firstItem.sortTime);

  return [...items, ...bookingItems];
}

function CustomerActivityTimelineCard({
  item,
}) {
  const Icon = item.icon;

  return (
    <article className="customer-activity-item grid grid-cols-[auto_minmax(0,1fr)] gap-2">
      <div className="customer-activity-rail grid justify-items-center">
        <span className={cn('grid size-8 place-items-center rounded-full border ring-1', getCustomerActivityToneClass(item.tone))}>
          <Icon size={14} strokeWidth={2.35} aria-hidden="true" />
        </span>
        <span className="customer-activity-line mt-1 h-full w-px bg-[var(--ui-border)]" aria-hidden="true" />
      </div>

      <div className="grid gap-1 rounded-[0.95rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-2 ring-1 ring-[var(--ui-ring)]">
        <div className="flex items-start justify-between gap-2">
          <div className="grid min-w-0 gap-0.5">
            <span className="text-[0.54rem] font-semibold uppercase tracking-[0.11em] text-[var(--ui-text-muted)]">
              {item.typeLabel}
            </span>

            <strong className="truncate text-xs font-semibold text-[var(--ui-text-strong)]">
              {item.title}
            </strong>
          </div>

          <span className="shrink-0 rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-2 py-0.5 text-[0.55rem] font-semibold text-[var(--ui-text-muted)]">
            {item.timeLabel}
          </span>
        </div>

        <p className="m-0 text-[0.66rem] font-medium leading-4 text-[var(--ui-text-muted)]">
          {item.helper}
        </p>

        {item.chips.length ? (
          <div className="flex flex-wrap gap-1">
            {item.chips.map((chip) => (
              <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-2 py-0.5 text-[0.52rem] font-semibold uppercase tracking-[0.08em] text-[var(--ui-text-main)]" key={chip}>
                {chip}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function CustomerActivityTimeline({
  customer,
  filteredHistoryBookings,
  historyFilter,
  historyFilterOptions,
  historyStats,
  noteDraft,
  onHistoryFilterChange,
}) {
  const activityItems = createCustomerActivityItems(customer, filteredHistoryBookings, noteDraft);

  return (
    <section className="customer-activity-timeline grid gap-2" aria-label="Customer activity timeline">
      <div className="flex items-center justify-between gap-3">
        <div className="grid gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-studio-accent">
            Activity timeline
          </span>

          <span className="text-[0.68rem] font-medium text-[var(--ui-text-muted)]">
            Booking, payment, notes, dan quality signal.
          </span>
        </div>

        <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-[var(--ui-text-muted)] ring-1 ring-[var(--ui-ring)]">
          {activityItems.length} item
        </span>
      </div>

      <div className="customer-activity-summary grid grid-cols-2 gap-1 rounded-[0.95rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-1.5 ring-1 ring-[var(--ui-ring)]">
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

      <div className="customer-activity-filter -mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
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
              onClick={() => onHistoryFilterChange(option.key)}
            >
              {option.label}
              <span className="rounded-full bg-[var(--ui-control)] px-1.5 py-0.5 text-[0.62rem]">
                {option.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="customer-activity-list grid max-h-[28rem] gap-2 overflow-auto pr-0 sm:pr-1">
        {activityItems.length > 0 ? (
          activityItems.map((item) => (
            <CustomerActivityTimelineCard item={item} key={item.id} />
          ))
        ) : (
          <div className="grid min-h-28 place-items-center rounded-[1.15rem] border border-dashed border-[var(--ui-border-strong)] bg-[var(--ui-glass-soft)] p-4 text-center ring-1 ring-[var(--ui-ring)]">
            <p className="m-0 text-sm font-medium leading-6 text-[var(--ui-text-muted)]">
              Tidak ada activity pada filter timeline ini.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function normalizeBillingCustomerName(value) {
  return normalizeCustomerValue(prettifyCustomerName(value));
}

function getCustomerBillingHistory(customer, billingTransactions = []) {
  if (!customer || !Array.isArray(billingTransactions)) {
    return {
      count: 0,
      invoices: [],
      lastInvoice: null,
      outstandingAmount: 0,
      totalAmount: 0,
      totalPaid: 0,
    };
  }

  const customerPhoneDigits = normalizePhoneDigits(customer.phone);
  const customerNameKey = normalizeBillingCustomerName(customer.name);
  const bookingIds = new Set(
    (Array.isArray(customer.bookings) ? customer.bookings : [])
      .map((booking) => booking.id)
      .filter(Boolean),
  );

  const invoices = billingTransactions
    .filter((transaction) => {
      if (!transaction || typeof transaction !== 'object') {
        return false;
      }

      const transactionPhoneDigits = normalizePhoneDigits(transaction.phone);
      const transactionNameKey = normalizeBillingCustomerName(transaction.customerName);
      const bookingMatch = transaction.bookingId && bookingIds.has(transaction.bookingId);
      const phoneMatch = customerPhoneDigits && transactionPhoneDigits && customerPhoneDigits === transactionPhoneDigits;
      const nameMatch = customerNameKey && transactionNameKey && customerNameKey === transactionNameKey;

      return Boolean(bookingMatch || phoneMatch || nameMatch);
    })
    .sort((firstItem, secondItem) => {
      const firstTime = new Date(firstItem.createdAt || firstItem.updatedAt || 0).getTime();
      const secondTime = new Date(secondItem.createdAt || secondItem.updatedAt || 0).getTime();

      if (firstTime !== secondTime) {
        return secondTime - firstTime;
      }

      return String(secondItem.id || '').localeCompare(String(firstItem.id || ''));
    });

  return {
    count: invoices.length,
    invoices,
    lastInvoice: invoices[0] || null,
    outstandingAmount: invoices.reduce((sum, invoice) => sum + Math.max(0, Number(invoice.remainingAmount) || 0), 0),
    totalAmount: invoices.reduce((sum, invoice) => sum + Math.max(0, Number(invoice.totalAmount) || 0), 0),
    totalPaid: invoices.reduce((sum, invoice) => sum + Math.max(0, Number(invoice.paidAmount) || 0), 0),
  };
}

function getBillingInvoiceStatusLabel(status) {
  if (status === 'paid') return 'Paid';
  if (status === 'dp') return 'DP';

  return 'Pending';
}

function getBillingInvoiceTone(status) {
  if (status === 'paid') return 'cyan';
  if (status === 'dp') return 'purple';

  return 'accent';
}

function formatBillingInvoiceDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function CustomerBillingHistoryPanel({
  billingHistory,
}) {
  const history = billingHistory || {
    count: 0,
    invoices: [],
    lastInvoice: null,
    outstandingAmount: 0,
    totalAmount: 0,
    totalPaid: 0,
  };
  const recentInvoices = history.invoices.slice(0, 4);

  return (
    <section className="customer-billing-history-panel grid gap-2" aria-label="Customer billing history">
      <div className="flex items-center justify-between gap-3">
        <div className="grid gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-studio-accent">
            Billing history
          </span>

          <span className="text-[0.68rem] font-medium text-[var(--ui-text-muted)]">
            Invoice, paid amount, dan outstanding dari Billing/POS.
          </span>
        </div>

        <AdminBadge icon={ReceiptText} tone={history.outstandingAmount > 0 ? 'accent' : 'cyan'}>
          {history.count} invoice
        </AdminBadge>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-[0.95rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-1.5 ring-1 ring-[var(--ui-ring)]">
        <div className="grid gap-0.5 rounded-[0.75rem] bg-[var(--ui-control)] px-2 py-1.5">
          <span className="text-[0.5rem] font-semibold uppercase tracking-[0.1em] text-[var(--ui-text-muted)]">
            Paid
          </span>
          <strong className="truncate text-[0.64rem] font-semibold text-[var(--ui-text-strong)]">
            {formatCurrency(history.totalPaid)}
          </strong>
        </div>

        <div className="grid gap-0.5 rounded-[0.75rem] bg-[var(--ui-control)] px-2 py-1.5">
          <span className="text-[0.5rem] font-semibold uppercase tracking-[0.1em] text-[var(--ui-text-muted)]">
            Outstanding
          </span>
          <strong className="truncate text-[0.64rem] font-semibold text-studio-accent">
            {formatCurrency(history.outstandingAmount)}
          </strong>
        </div>

        <div className="grid gap-0.5 rounded-[0.75rem] bg-[var(--ui-control)] px-2 py-1.5">
          <span className="text-[0.5rem] font-semibold uppercase tracking-[0.1em] text-[var(--ui-text-muted)]">
            Total
          </span>
          <strong className="truncate text-[0.64rem] font-semibold text-[var(--ui-text-strong)]">
            {formatCurrency(history.totalAmount)}
          </strong>
        </div>
      </div>

      {recentInvoices.length ? (
        <div className="grid gap-1.5">
          {recentInvoices.map((invoice) => (
            <article className="grid gap-2 rounded-[0.95rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-2 ring-1 ring-[var(--ui-ring)]" key={invoice.id || invoice.invoiceNumber}>
              <div className="flex items-start justify-between gap-2">
                <div className="grid min-w-0 gap-0.5">
                  <strong className="truncate text-xs font-semibold text-[var(--ui-text-strong)]">
                    {invoice.invoiceNumber || 'Invoice'}
                  </strong>
                  <span className="text-[0.62rem] font-medium text-[var(--ui-text-muted)]">
                    {formatBillingInvoiceDate(invoice.createdAt)} • {invoice.sourceType === 'manual' ? 'Manual POS' : 'Booking'}
                  </span>
                </div>

                <AdminBadge tone={getBillingInvoiceTone(invoice.paymentStatus)}>
                  {getBillingInvoiceStatusLabel(invoice.paymentStatus)}
                </AdminBadge>
              </div>

              <div className="grid grid-cols-3 gap-1 text-right">
                <span className="grid gap-0.5">
                  <span className="text-[0.5rem] font-semibold uppercase tracking-[0.09em] text-[var(--ui-text-muted)]">Total</span>
                  <strong className="truncate text-[0.62rem] font-semibold text-[var(--ui-text-strong)]">{formatCurrency(invoice.totalAmount)}</strong>
                </span>
                <span className="grid gap-0.5">
                  <span className="text-[0.5rem] font-semibold uppercase tracking-[0.09em] text-[var(--ui-text-muted)]">Paid</span>
                  <strong className="truncate text-[0.62rem] font-semibold text-[var(--ui-text-strong)]">{formatCurrency(invoice.paidAmount)}</strong>
                </span>
                <span className="grid gap-0.5">
                  <span className="text-[0.5rem] font-semibold uppercase tracking-[0.09em] text-[var(--ui-text-muted)]">Sisa</span>
                  <strong className="truncate text-[0.62rem] font-semibold text-studio-accent">{formatCurrency(invoice.remainingAmount)}</strong>
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid min-h-24 place-items-center rounded-[1.15rem] border border-dashed border-[var(--ui-border-strong)] bg-[var(--ui-glass-soft)] p-4 text-center ring-1 ring-[var(--ui-ring)]">
          <p className="m-0 text-sm font-medium leading-6 text-[var(--ui-text-muted)]">
            Belum ada invoice billing yang cocok dengan customer ini.
          </p>
        </div>
      )}
    </section>
  );
}

function CustomerDetailPanel({
  billingTransactions = [],
  customer,
  onClose,
  onCrmChange = () => {},
}) {
  const [copyStatus, setCopyStatus] = useState('idle');
  const [summaryCopyStatus, setSummaryCopyStatus] = useState('idle');
  const [templateCopyStatus, setTemplateCopyStatus] = useState('idle');
  const [selectedTemplate, setSelectedTemplate] = useState(() => getDefaultCustomerMessageTemplate(customer));
  const [customerNoteDraft, setCustomerNoteDraft] = useState(() => getStoredCustomerNote(customer.id));
  const [noteSaveStatus, setNoteSaveStatus] = useState('idle');
  const [historyFilter, setHistoryFilter] = useState('all');
  const phoneValue = getCustomerPhoneValue(customer);
  const phoneDigits = normalizePhoneDigits(phoneValue);
  const whatsappNumber = normalizeWhatsappNumber(phoneValue);
  const boardQuery = getCustomerBoardQuery(customer);
  const boardHref = '/admin/bookings?customer=' + encodeURIComponent(boardQuery);
  const phoneHref = phoneDigits ? 'tel:' + phoneDigits : '';
  const primaryBooking = getCustomerPrimaryBooking(customer);
  const primaryBookingShortLabel = customer?.nextBooking ? 'Next' : customer?.lastBooking ? 'Last' : 'Booking';
  const customerSummaryText = createCustomerSummaryText(customer);
  const templateMeta = getCustomerCommunicationTemplateMeta(selectedTemplate);
  const quickActionIntent = getCustomerQuickActionIntent(customer, templateMeta);
  const whatsappMessage = createCustomerWhatsappMessage(customer, selectedTemplate);
  const whatsappHref = whatsappNumber ? 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(whatsappMessage) : '';
  const historyStats = getCustomerHistoryStats(customer);
  const historyFilterOptions = getHistoryFilterOptions(customer);
  const filteredHistoryBookings = getFilteredCustomerBookings(customer, historyFilter);
  const customerBillingHistory = getCustomerBillingHistory(customer, billingTransactions);

  const resetActionStatus = (setter) => {
    if (typeof window !== 'undefined') {
      window.setTimeout(() => setter('idle'), 2200);
    }
  };

  const resetNoteSaveStatus = () => {
    if (typeof window !== 'undefined') {
      window.setTimeout(() => setNoteSaveStatus('idle'), 2200);
    }
  };

  const handleCustomerNoteChange = (note) => {
    setCustomerNoteDraft((current) => ({
      ...current,
      note,
    }));
    setNoteSaveStatus('idle');
  };

  const handleCustomerTagToggle = (tagKey) => {
    setCustomerNoteDraft((current) => {
      const tags = Array.isArray(current.tags) ? current.tags : [];
      const nextTags = tags.includes(tagKey)
        ? tags.filter((tag) => tag !== tagKey)
        : [...tags, tagKey];

      return {
        ...current,
        tags: nextTags,
      };
    });
    setNoteSaveStatus('idle');
  };

  const handleSaveCustomerNote = () => {
    try {
      writeStoredCustomerNote(customer.id, customerNoteDraft);
      onCrmChange();
      setNoteSaveStatus('saved');
      resetNoteSaveStatus();
    } catch {
      setNoteSaveStatus('error');
      resetNoteSaveStatus();
    }
  };

  const handleClearCustomerNote = () => {
    const emptyDraft = normalizeCustomerNoteDraft({});

    try {
      setCustomerNoteDraft(emptyDraft);
      writeStoredCustomerNote(customer.id, emptyDraft);
      onCrmChange();
      setNoteSaveStatus('cleared');
      resetNoteSaveStatus();
    } catch {
      setNoteSaveStatus('error');
      resetNoteSaveStatus();
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
    } catch {
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
    } catch {
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
    } catch {
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

      <CustomerNotesPanel
        noteDraft={customerNoteDraft}
        noteSaveStatus={noteSaveStatus}
        onClear={handleClearCustomerNote}
        onNoteChange={handleCustomerNoteChange}
        onSave={handleSaveCustomerNote}
        onToggleTag={handleCustomerTagToggle}
      />

      <section className="customer-quick-actions-panel grid gap-2 rounded-[1.1rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-2 ring-1 ring-[var(--ui-ring)]" aria-label="Customer quick actions">
        <div className="flex items-start justify-between gap-2">
          <div className="grid gap-0.5">
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
              Quick action
            </span>

            <strong className="text-sm font-semibold tracking-[-0.035em] text-[var(--ui-text-strong)]">
              {quickActionIntent.label}
            </strong>
          </div>

          <span className={cn('rounded-full border px-2 py-0.5 text-[0.54rem] font-semibold uppercase tracking-[0.1em]', getCustomerQuickActionToneClass(quickActionIntent.tone))}>
            {templateMeta.label}
          </span>
        </div>

        <p className="m-0 rounded-[0.85rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-2 text-[0.68rem] font-medium leading-5 text-[var(--ui-text-muted)]">
          {quickActionIntent.helper}
        </p>

        <div className="customer-quick-primary grid grid-cols-2 gap-1.5">
          {whatsappHref ? (
            <a
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[0.9rem] border border-studio-cyan/35 bg-studio-cyan/10 px-3 text-sm font-semibold text-studio-cyan ring-1 ring-studio-cyan/15 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-cyan/20"
              href={whatsappHref}
              rel="noreferrer"
              target="_blank"
            >
              <MessageCircle size={15} strokeWidth={2.35} aria-hidden="true" />
              WhatsApp
            </a>
          ) : (
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[0.9rem] border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-3 text-sm font-semibold text-[var(--ui-text-muted)] opacity-60"
              disabled
              type="button"
            >
              <MessageCircle size={15} strokeWidth={2.35} aria-hidden="true" />
              No HP
            </button>
          )}

          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[0.9rem] [background:var(--ui-primary-bg)] px-3 text-sm font-semibold text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
            to={boardHref}
          >
            Board
            <ArrowUpRight size={15} strokeWidth={2.35} aria-hidden="true" />
          </Link>
        </div>

        <div className="customer-quick-secondary grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {phoneHref ? (
            <a
              className="customer-quick-secondary-action inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-3 text-xs font-semibold text-[var(--ui-secondary-text)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
              href={phoneHref}
            >
              <Phone size={13} strokeWidth={2.35} aria-hidden="true" />
              Call
            </a>
          ) : (
            <button
              className="customer-quick-secondary-action inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-3 text-xs font-semibold text-[var(--ui-text-muted)] opacity-60"
              disabled
              type="button"
            >
              <Phone size={13} strokeWidth={2.35} aria-hidden="true" />
              Call
            </button>
          )}

          <button
            className="customer-quick-secondary-action inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-3 text-xs font-semibold text-[var(--ui-secondary-text)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!phoneValue}
            type="button"
            onClick={handleCopyPhone}
          >
            <Copy size={13} strokeWidth={2.35} aria-hidden="true" />
            {copyStatus === 'copied' ? 'Copied' : copyStatus === 'error' ? 'Gagal' : 'Copy HP'}
          </button>

          <button
            className="customer-quick-secondary-action inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-3 text-xs font-semibold text-[var(--ui-secondary-text)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
            type="button"
            onClick={handleCopySummary}
          >
            <Copy size={13} strokeWidth={2.35} aria-hidden="true" />
            {summaryCopyStatus === 'copied' ? 'Copied' : summaryCopyStatus === 'error' ? 'Gagal' : 'Summary'}
          </button>

          {primaryBooking ? (
            <Link
              className="customer-quick-secondary-action inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-3 text-xs font-semibold text-[var(--ui-secondary-text)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
              to={boardHref}
            >
              <CalendarClock size={13} strokeWidth={2.35} aria-hidden="true" />
              {primaryBookingShortLabel}
            </Link>
          ) : (
            <button
              className="customer-quick-secondary-action inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-3 text-xs font-semibold text-[var(--ui-text-muted)] opacity-60"
              disabled
              type="button"
            >
              <CalendarClock size={13} strokeWidth={2.35} aria-hidden="true" />
              Booking
            </button>
          )}
        </div>
      </section>

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

        <div
          aria-label="Preview template WhatsApp"
          className="customer-template-preview m-0 whitespace-pre-line rounded-[0.9rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-2 pr-3 text-xs font-medium leading-5 text-[var(--ui-text-main)]"
          role="region"
          tabIndex={0}
        >
          {whatsappMessage}
        </div>

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

      <CustomerBillingHistoryPanel billingHistory={customerBillingHistory} />

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

      <CustomerActivityTimeline
        customer={customer}
        filteredHistoryBookings={filteredHistoryBookings}
        historyFilter={historyFilter}
        historyFilterOptions={historyFilterOptions}
        historyStats={historyStats}
        noteDraft={customerNoteDraft}
        onHistoryFilterChange={setHistoryFilter}
      />
    </aside>
  );
}

export function CustomerDetailAdmin() {
  const adminContext = useOutletContext() || {};
  const {
    billingTransactions = [],
    bookingLoadError = '',
    isBookingsReady = true,
    manualBookings = [],
  } = adminContext;
  const {
    customerId = '',
  } = useParams();
  const navigate = useNavigate();
  const [crmRefreshKey, setCrmRefreshKey] = useState(0);

  const bookings = useMemo(
    () => manualBookings,
    [manualBookings],
  );
  const baseCustomers = useMemo(() => buildCustomersFromBookings(bookings), [bookings]);
  const customers = useMemo(
    () => attachCustomerCrmMeta(baseCustomers),
    [baseCustomers, crmRefreshKey],
  );
  const selectedCustomer = useMemo(
    () => findCustomerByRouteId(customers, customerId),
    [customerId, customers],
  );
  const hasBookingData = bookings.length > 0;
  const shouldShowEmptyBookings = isBookingsReady && !hasBookingData;
  const shouldShowLoading = !isBookingsReady;

  const handleCustomerCrmChange = () => {
    setCrmRefreshKey((currentKey) => currentKey + 1);
  };

  const handleBackToCustomers = () => {
    navigate('/admin/customers');
  };

  return (
    <section className="customer-detail-route-shell grid gap-3 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-1 sm:gap-4 md:pb-4 md:pt-2" aria-labelledby="customer-detail-route-title">
      <div className="customer-detail-route-header flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <span className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-studio-accent">
            Customer profile
          </span>

          <h1 className="m-0 text-2xl font-semibold tracking-[-0.055em] text-[var(--ui-text-strong)] sm:text-3xl" id="customer-detail-route-title">
            {selectedCustomer ? selectedCustomer.name : 'Detail customer'}
          </h1>

          <p className="m-0 text-xs font-medium leading-5 text-[var(--ui-text-muted)] sm:text-sm">
            Halaman detail khusus untuk CRM, notes, payment, template, dan timeline.
          </p>
        </div>

        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-4 text-sm font-semibold text-[var(--ui-secondary-text)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
          type="button"
          onClick={handleBackToCustomers}
        >
          Kembali ke list
        </button>
      </div>

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
      ) : selectedCustomer ? (
        <CustomerDetailPanel
          key={selectedCustomer.id}
          billingTransactions={billingTransactions}
          customer={selectedCustomer}
          onClose={handleBackToCustomers}
          onCrmChange={handleCustomerCrmChange}
        />
      ) : (
        <CustomerStatePanel
          actionHref="/admin/customers"
          actionLabel="Kembali ke customers"
          icon={UsersRound}
          message="Customer ini tidak ditemukan di data booking yang sedang aktif. Bisa jadi filter data berubah atau booking asalnya sudah dihapus."
          title="Customer tidak ditemukan."
          tone="warning"
        />
      )}
    </section>
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
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [sortMode, setSortMode] = useState('attention');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [crmRefreshKey, setCrmRefreshKey] = useState(0);

  const bookings = useMemo(
    () => manualBookings,
    [manualBookings],
  );
  const baseCustomers = useMemo(() => buildCustomersFromBookings(bookings), [bookings]);
  const customers = useMemo(
    () => attachCustomerCrmMeta(baseCustomers),
    [baseCustomers, crmRefreshKey],
  );
  const stats = useMemo(() => getCustomerStats(customers), [customers]);
  const qualityStats = useMemo(() => getCustomerQualityStats(customers), [customers]);
  const tagStats = useMemo(() => getCustomerTagStats(customers), [customers]);
  const filteredCustomers = useMemo(
    () => getFilteredCustomers(customers, searchTerm, statusFilter, sortMode)
      .filter((customer) => tagFilter === 'all' || (Array.isArray(customer.crmTags) && customer.crmTags.includes(tagFilter))),
    [customers, searchTerm, sortMode, statusFilter, tagFilter],
  );
  const selectedCustomer = useMemo(
    () => selectedCustomerId
      ? customers.find((customer) => customer.id === selectedCustomerId) || null
      : null,
    [customers, selectedCustomerId],
  );
  const hasActiveCustomerFilters = Boolean(String(searchTerm || '').trim()) || statusFilter !== 'all' || tagFilter !== 'all' || sortMode !== 'attention';

  const resetCustomerFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTagFilter('all');
    setSortMode('attention');
  };
  const hasBookingData = bookings.length > 0;
  const shouldShowEmptyBookings = isBookingsReady && !hasBookingData;
  const shouldShowLoading = !isBookingsReady;

  const handleSelectCustomer = (customer) => {
    setSelectedCustomerId(customer.id);
    navigate(getCustomerDetailPath(customer));
  };

  return (
    <AdminPageShell className="customer-mobile-workspace gap-3 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-1 sm:gap-4 md:pb-4 md:pt-2" width="wide">
      <div className="sr-only" id="customer-admin-title">
        Customer admin workspace
      </div>

      <CustomerHero activeCustomer={selectedCustomer} stats={stats} />

      <MetricStrip stats={stats} />


      <CustomerTagFilterStrip
        activeTagFilter={tagFilter}
        stats={tagStats}
        onTagFilterChange={setTagFilter}
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
        tagFilter={tagFilter}
        onResetFilters={resetCustomerFilters}
        onSearchChange={setSearchTerm}
        onSortChange={setSortMode}
        onStatusFilterChange={setStatusFilter}
        onTagFilterChange={setTagFilter}
      />

      <CustomerExportPanel
        customers={filteredCustomers}
        totalCustomers={customers.length}
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
        <div className="customer-directory-content-grid grid gap-3">
          <CustomerList
            customers={filteredCustomers}
            hasActiveFilters={hasActiveCustomerFilters}
            selectedCustomerId={selectedCustomer?.id || ''}
            onResetFilters={resetCustomerFilters}
            onSelectCustomer={handleSelectCustomer}
          />

          <CustomerInsightPanel
            customers={customers}
            filteredCustomers={filteredCustomers}
            qualityStats={qualityStats}
            stats={stats}
            onSelectCustomer={handleSelectCustomer}
          />
        </div>
      )}
    </AdminPageShell>
  );
}
