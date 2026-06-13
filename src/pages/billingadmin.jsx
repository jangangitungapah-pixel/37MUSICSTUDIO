import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AlertTriangle,
  Banknote,
  CreditCard,
  FilePlus2,
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
  AdminDrawer,
  AdminPageHeader,
  AdminPageShell,
  AdminPanel,
} from '../components/admin/AdminPrimitives.jsx';
import { adminBillingRepository } from '../services/adminBillingRepository.js';

const billingStatusFilters = [
  {
    key: 'all',
    label: 'All',
  },
  {
    key: 'unpaid',
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

const billingPaymentMethodOptions = [
  {
    key: 'cash',
    label: 'Cash',
  },
  {
    key: 'transfer',
    label: 'Transfer',
  },
  {
    key: 'qris',
    label: 'QRIS',
  },
  {
    key: 'debit',
    label: 'Debit',
  },
  {
    key: 'other',
    label: 'Other',
  },
];

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(Math.max(0, Number(value) || 0));
}

function normalizeSearchValue(value) {
  return String(value || '').trim().toLowerCase();
}

function getTodayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function createLocalInvoiceSeed(value) {
  return String(value || Date.now())
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(-6)
    .toUpperCase();
}

function createInvoiceNumberFromDraft(draft, createdAt) {
  const dateKey = String(createdAt || new Date().toISOString()).slice(0, 10).replace(/-/g, '');
  const seed = createLocalInvoiceSeed(draft.bookingId || draft.invoiceNumber || Date.now());

  return 'INV-' + dateKey + '-' + seed;
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

function getBillingSourceLabel(sourceType) {
  if (sourceType === 'manual') {
    return 'Manual POS';
  }

  return 'Booking';
}

function normalizeBillingActor(actor) {
  if (!actor || typeof actor !== 'object') {
    return {
      displayName: 'Admin',
      email: '',
      uid: '',
    };
  }

  const email = String(actor.email || '').trim();
  const displayName = String(actor.displayName || actor.name || email || 'Admin').trim();

  return {
    displayName,
    email,
    uid: String(actor.uid || '').trim(),
  };
}

function clampPaymentAmount(value, totalAmount) {
  const parsedValue = Number(value);
  const safeValue = Number.isFinite(parsedValue) ? parsedValue : 0;
  const safeTotal = Math.max(0, Number(totalAmount) || 0);

  return Math.min(safeTotal, Math.max(0, safeValue));
}

function getPaymentStatusFromAmount(paidAmount, totalAmount) {
  const safeTotal = Math.max(0, Number(totalAmount) || 0);
  const safePaid = clampPaymentAmount(paidAmount, safeTotal);

  if (safeTotal > 0 && safePaid >= safeTotal) {
    return 'paid';
  }

  if (safePaid > 0) {
    return 'dp';
  }

  return 'unpaid';
}

function createBillingQueueFromTransactions(transactions) {
  return (Array.isArray(transactions) ? transactions : []).map((transaction) => ({
    bookingId: transaction.bookingId || '',
    createdAt: transaction.createdAt || '',
    customerName: transaction.customerName || 'Walk-in customer',
    dateKey: String(transaction.createdAt || '').slice(0, 10),
    id: transaction.id || '',
    invoiceNumber: transaction.invoiceNumber || transaction.id || 'Invoice',
    paidAmount: Number(transaction.paidAmount) || 0,
    remainingAmount: Number(transaction.remainingAmount) || 0,
    sourceLabel: getBillingSourceLabel(transaction.sourceType),
    sourceType: transaction.sourceType || 'manual',
    status: transaction.paymentStatus || 'unpaid',
    time: String(transaction.createdAt || '').slice(11, 16),
    totalAmount: Number(transaction.totalAmount) || 0,
    transactionSnapshot: transaction,
    type: 'transaction',
  }));
}

function createDraftQueueFromBookings(bookings, transactions) {
  const existingBookingIds = new Set(
    (Array.isArray(transactions) ? transactions : [])
      .map((transaction) => transaction.bookingId)
      .filter(Boolean),
  );

  return (Array.isArray(bookings) ? bookings : [])
    .filter((booking) => booking?.status !== 'paid')
    .filter((booking) => !existingBookingIds.has(booking?.id))
    .map((booking) => {
      const status = booking.status === 'dp' ? 'dp' : 'unpaid';

      return {
        bookingId: booking.id || '',
        bookingSnapshot: booking,
        createdAt: booking.createdAt || '',
        customerName: getBookingCustomerName(booking),
        dateKey: booking.dateKey || '',
        durationHours: Math.max(1, Number(booking.durationHours) || 1),
        invoiceNumber: 'DRAFT-' + createLocalInvoiceSeed(booking.id || booking.dateKey || Date.now()),
        notes: String(booking.notes || '').trim(),
        paidAmount: getBookingPaidAmount(booking),
        phone: String(booking.phone || '').trim(),
        remainingAmount: getBookingRemainingAmount(booking),
        sessionType: String(booking.sessionType || booking.title || 'Studio session').trim(),
        sourceLabel: 'Booking draft',
        sourceType: 'booking',
        status,
        time: booking.time || '',
        totalAmount: getBookingTotal(booking),
        type: 'draft',
      };
    });
}

function createBillingQueue(bookings, transactions) {
  return [
    ...createBillingQueueFromTransactions(transactions),
    ...createDraftQueueFromBookings(bookings, transactions),
  ].sort((firstItem, secondItem) => {
    const firstTime = new Date(firstItem.createdAt || firstItem.dateKey || 0).getTime();
    const secondTime = new Date(secondItem.createdAt || secondItem.dateKey || 0).getTime();

    if (firstTime !== secondTime) {
      return secondTime - firstTime;
    }

    return String(secondItem.invoiceNumber || '').localeCompare(String(firstItem.invoiceNumber || ''));
  });
}

function getBillingSummary(queue) {
  const todayKey = getTodayDateKey();
  const transactions = queue.filter((item) => item.type === 'transaction');
  const paidToday = transactions
    .filter((item) => item.status === 'paid' && String(item.createdAt || '').startsWith(todayKey))
    .reduce((sum, item) => sum + item.totalAmount, 0);
  const revenueToday = transactions
    .filter((item) => String(item.createdAt || '').startsWith(todayKey))
    .reduce((sum, item) => sum + item.paidAmount, 0);

  return {
    dpActive: queue.filter((item) => item.status === 'dp').length,
    paidToday,
    pending: queue.filter((item) => item.status === 'unpaid').length,
    revenueToday,
    transactions: transactions.length,
  };
}

function createInvoiceItemsFromDraft(draft) {
  const durationHours = Math.max(1, Number(draft.durationHours) || 1);
  const totalAmount = Math.max(0, Number(draft.totalAmount) || 0);

  return [
    {
      category: 'studio_booking',
      id: 'booking-session',
      inventoryItemId: '',
      name: draft.sessionType || 'Studio session',
      qty: durationHours,
      subtotal: totalAmount,
      unitPrice: durationHours > 0 ? Math.round(totalAmount / durationHours) : totalAmount,
    },
  ];
}

function createBillingTransactionFromDraft(draft, actor) {
  const createdAt = new Date().toISOString();
  const totalAmount = Math.max(0, Number(draft.totalAmount) || 0);
  const paidAmount = Math.max(0, Number(draft.paidAmount) || 0);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const paymentStatus = paidAmount >= totalAmount && totalAmount > 0
    ? 'paid'
    : paidAmount > 0
      ? 'dp'
      : 'unpaid';
  const normalizedActor = normalizeBillingActor(actor);

  return {
    bookingId: draft.bookingId || '',
    createdAt,
    createdBy: normalizedActor,
    customerId: draft.bookingId || '',
    customerName: draft.customerName || 'Walk-in customer',
    discountAmount: 0,
    id: draft.bookingId ? 'billing-booking-' + draft.bookingId : 'billing-' + Date.now(),
    invoiceNumber: createInvoiceNumberFromDraft(draft, createdAt),
    items: createInvoiceItemsFromDraft(draft),
    notes: draft.notes || 'Invoice dibuat dari booking draft.',
    paidAmount,
    paymentMethod: paidAmount > 0 ? 'other' : 'cash',
    paymentStatus,
    phone: draft.phone || '',
    remainingAmount,
    sourceType: 'booking',
    subtotal: totalAmount,
    totalAmount,
    updatedAt: createdAt,
    updatedBy: normalizedActor,
  };
}

function createUpdatedPaymentTransaction(item, paymentForm, actor, options = {}) {
  const baseTransaction = item?.transactionSnapshot && typeof item.transactionSnapshot === 'object'
    ? item.transactionSnapshot
    : {};
  const totalAmount = Math.max(0, Number(baseTransaction.totalAmount ?? item?.totalAmount) || 0);
  const paidAmount = options.markPaid
    ? totalAmount
    : clampPaymentAmount(paymentForm.paidAmount, totalAmount);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const paymentStatus = getPaymentStatusFromAmount(paidAmount, totalAmount);
  const updatedAt = new Date().toISOString();
  const updatedBy = normalizeBillingActor(actor);

  return {
    ...baseTransaction,
    id: baseTransaction.id || item?.id || '',
    invoiceNumber: baseTransaction.invoiceNumber || item?.invoiceNumber || '',
    paidAmount,
    paymentMethod: paymentForm.paymentMethod || baseTransaction.paymentMethod || 'cash',
    paymentStatus,
    remainingAmount,
    totalAmount,
    updatedAt,
    updatedBy,
  };
}

function getQueueItemKey(item) {
  return item.type + '-' + (item.id || item.bookingId || item.invoiceNumber);
}

function createPaymentFormFromItem(item) {
  return {
    paidAmount: String(Math.max(0, Number(item?.paidAmount) || 0)),
    paymentMethod: item?.transactionSnapshot?.paymentMethod || 'cash',
  };
}

function createEmptyManualPosForm() {
  return {
    customerName: '',
    itemName: 'Studio walk-in session',
    notes: '',
    paidAmount: '0',
    paymentMethod: 'cash',
    phone: '',
    qty: '1',
    unitPrice: '0',
  };
}

function getManualPosFormTotals(form) {
  const qty = Math.max(1, Number(form?.qty) || 1);
  const unitPrice = Math.max(0, Number(form?.unitPrice) || 0);
  const totalAmount = Math.max(0, qty * unitPrice);
  const paidAmount = clampPaymentAmount(form?.paidAmount, totalAmount);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  return {
    paidAmount,
    paymentStatus: getPaymentStatusFromAmount(paidAmount, totalAmount),
    qty,
    remainingAmount,
    totalAmount,
    unitPrice,
  };
}

function createManualPosTransactionFromForm(form, actor) {
  const createdAt = new Date().toISOString();
  const totals = getManualPosFormTotals(form);
  const normalizedActor = normalizeBillingActor(actor);
  const itemName = String(form?.itemName || 'Manual POS item').trim() || 'Manual POS item';
  const customerName = String(form?.customerName || 'Walk-in customer').trim() || 'Walk-in customer';
  const transactionId = 'billing-manual-' + Date.now();

  return {
    bookingId: '',
    createdAt,
    createdBy: normalizedActor,
    customerId: '',
    customerName,
    discountAmount: 0,
    id: transactionId,
    invoiceNumber: createInvoiceNumberFromDraft(
      {
        bookingId: transactionId,
        invoiceNumber: transactionId,
      },
      createdAt,
    ),
    items: [
      {
        category: 'manual_pos',
        id: 'manual-pos-item',
        inventoryItemId: '',
        name: itemName,
        qty: totals.qty,
        subtotal: totals.totalAmount,
        unitPrice: totals.unitPrice,
      },
    ],
    notes: String(form?.notes || '').trim(),
    paidAmount: totals.paidAmount,
    paymentMethod: form?.paymentMethod || 'cash',
    paymentStatus: totals.paymentStatus,
    phone: String(form?.phone || '').trim(),
    remainingAmount: totals.remainingAmount,
    sourceType: 'manual',
    subtotal: totals.totalAmount,
    totalAmount: totals.totalAmount,
    updatedAt: createdAt,
    updatedBy: normalizedActor,
  };
}

function escapeReceiptHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character] || character));
}

function formatReceiptDate(value) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date());
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getReceiptItemsFromItem(item) {
  const transactionItems = item?.transactionSnapshot?.items;

  if (Array.isArray(transactionItems) && transactionItems.length) {
    return transactionItems.map((lineItem, index) => ({
      name: String(lineItem.name || 'Billing item').trim(),
      qty: Math.max(1, Number(lineItem.qty) || 1),
      subtotal: Math.max(0, Number(lineItem.subtotal) || 0),
      unitPrice: Math.max(0, Number(lineItem.unitPrice) || 0),
      key: String(lineItem.id || index),
    }));
  }

  return [
    {
      key: 'single',
      name: item?.sourceLabel || 'Studio transaction',
      qty: 1,
      subtotal: Math.max(0, Number(item?.totalAmount) || 0),
      unitPrice: Math.max(0, Number(item?.totalAmount) || 0),
    },
  ];
}

function createReceiptHtmlFromItem(item) {
  const items = getReceiptItemsFromItem(item);
  const itemRows = items.map((lineItem) => [
    '<tr>',
    '<td>',
    escapeReceiptHtml(lineItem.name),
    '<small>Qty ',
    escapeReceiptHtml(lineItem.qty),
    ' x ',
    escapeReceiptHtml(formatCurrency(lineItem.unitPrice)),
    '</small>',
    '</td>',
    '<td>',
    escapeReceiptHtml(formatCurrency(lineItem.subtotal)),
    '</td>',
    '</tr>',
  ].join('')).join('');
  const invoiceNumber = escapeReceiptHtml(item?.invoiceNumber || 'Invoice');
  const customerName = escapeReceiptHtml(item?.customerName || 'Walk-in customer');
  const sourceLabel = escapeReceiptHtml(item?.sourceLabel || 'Billing');
  const statusLabel = escapeReceiptHtml(getBillingStatusLabel(item?.status));
  const createdAt = escapeReceiptHtml(formatReceiptDate(item?.createdAt || new Date().toISOString()));
  const totalAmount = escapeReceiptHtml(formatCurrency(item?.totalAmount));
  const paidAmount = escapeReceiptHtml(formatCurrency(item?.paidAmount));
  const remainingAmount = escapeReceiptHtml(formatCurrency(item?.remainingAmount));

  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    '<title>37 Music Studio Receipt</title>',
    '<style>',
    '*{box-sizing:border-box}',
    'body{margin:0;background:#f4f4f5;color:#111827;font-family:Inter,Arial,sans-serif}',
    '.receipt{width:100%;max-width:420px;margin:0 auto;background:#fff;min-height:100vh;padding:24px}',
    '.brand{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #e5e7eb;padding-bottom:16px}',
    '.logo{display:grid;place-items:center;width:44px;height:44px;border-radius:16px;background:#111827;color:#fff;font-weight:800;letter-spacing:-.05em}',
    'h1{margin:0;font-size:20px;letter-spacing:-.04em}',
    'p{margin:0;color:#6b7280;font-size:12px;line-height:1.6}',
    '.meta{display:grid;gap:8px;margin:18px 0;padding:14px;border:1px solid #e5e7eb;border-radius:18px;background:#fafafa}',
    '.meta-row{display:flex;justify-content:space-between;gap:12px;font-size:12px}',
    '.meta-row strong{text-align:right;color:#111827}',
    'table{width:100%;border-collapse:collapse;margin-top:12px}',
    'td{padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:12px;vertical-align:top}',
    'td:last-child{text-align:right;font-weight:700;color:#111827}',
    'small{display:block;margin-top:3px;color:#6b7280;font-size:10px}',
    '.totals{display:grid;gap:8px;margin-top:16px;padding-top:12px}',
    '.total-row{display:flex;justify-content:space-between;gap:12px;font-size:13px}',
    '.total-row.grand{font-size:18px;font-weight:800;letter-spacing:-.04em}',
    '.footer{margin-top:24px;text-align:center;border-top:1px dashed #d1d5db;padding-top:16px}',
    '@media print{body{background:#fff}.receipt{max-width:none;min-height:auto;padding:0}.no-print{display:none}}',
    '</style>',
    '</head>',
    '<body>',
    '<main class="receipt">',
    '<section class="brand">',
    '<div>',
    '<h1>37 Music Studio</h1>',
    '<p>Receipt / Invoice</p>',
    '</div>',
    '<div class="logo">37</div>',
    '</section>',
    '<section class="meta">',
    '<div class="meta-row"><span>Invoice</span><strong>',
    invoiceNumber,
    '</strong></div>',
    '<div class="meta-row"><span>Customer</span><strong>',
    customerName,
    '</strong></div>',
    '<div class="meta-row"><span>Source</span><strong>',
    sourceLabel,
    '</strong></div>',
    '<div class="meta-row"><span>Status</span><strong>',
    statusLabel,
    '</strong></div>',
    '<div class="meta-row"><span>Date</span><strong>',
    createdAt,
    '</strong></div>',
    '</section>',
    '<table>',
    '<tbody>',
    itemRows,
    '</tbody>',
    '</table>',
    '<section class="totals">',
    '<div class="total-row grand"><span>Total</span><strong>',
    totalAmount,
    '</strong></div>',
    '<div class="total-row"><span>Paid</span><strong>',
    paidAmount,
    '</strong></div>',
    '<div class="total-row"><span>Remaining</span><strong>',
    remainingAmount,
    '</strong></div>',
    '</section>',
    '<section class="footer">',
    '<p>Terima kasih sudah menggunakan 37 Music Studio.</p>',
    '<p>Generated from Studio OS Billing.</p>',
    '</section>',
    '</main>',
    '</body>',
    '</html>',
  ].join('');
}

function printBillingReceiptFromItem(item) {
  if (typeof window === 'undefined') {
    return false;
  }

  const printWindow = window.open('', '_blank', 'width=420,height=720');

  if (!printWindow) {
    return false;
  }

  printWindow.document.open();
  printWindow.document.write(createReceiptHtmlFromItem(item));
  printWindow.document.close();
  printWindow.focus();

  window.setTimeout(() => {
    printWindow.print();
  }, 150);

  return true;
}

function BillingSummaryRail({ summary }) {
  const items = [
    {
      icon: Banknote,
      label: 'Paid today',
      value: formatCurrency(summary.paidToday),
    },
    {
      icon: ReceiptText,
      label: 'Pending',
      value: summary.pending,
    },
    {
      icon: WalletCards,
      label: 'DP active',
      value: summary.dpActive,
    },
    {
      icon: CreditCard,
      label: 'Revenue',
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
        {visibleCount} item
      </AdminBadge>
    </AdminCommandBar>
  );
}

function BillingStatePanel({
  icon: Icon = ReceiptText,
  message,
  title,
  tone = 'default',
}) {
  return (
    <AdminPanel className="grid min-h-48 place-items-center p-6 text-center" variant="flat">
      <div className="grid max-w-md gap-2">
        <span className="mx-auto grid size-12 place-items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent ring-1 ring-[var(--ui-ring)]">
          <Icon size={20} strokeWidth={2.35} aria-hidden="true" />
        </span>

        <h2 className="m-0 text-xl font-semibold tracking-[-0.045em] text-[var(--ui-text-strong)]">
          {title}
        </h2>

        <p className={tone === 'warning' ? 'm-0 text-sm leading-6 text-studio-accent' : 'm-0 text-sm leading-6 text-[var(--ui-text-muted)]'}>
          {message}
        </p>
      </div>
    </AdminPanel>
  );
}

function PaymentMethodPills({
  value,
  onChange,
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label="Payment method">
      {billingPaymentMethodOptions.map((option) => {
        const isActive = option.key === value;

        return (
          <button
            aria-pressed={isActive}
            className={
              isActive
                ? 'min-h-10 rounded-full border border-studio-accent/35 bg-studio-accent/12 px-3 text-xs font-semibold text-studio-accent ring-1 ring-studio-accent/20'
                : 'min-h-10 rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 text-xs font-semibold text-[var(--ui-text-main)] ring-1 ring-[var(--ui-ring)] transition hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)]'
            }
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function BillingPaymentDrawer({
  isOpen,
  isSaving,
  paymentForm,
  saveError,
  selectedItem,
  onClose,
  onMarkPaid,
  onPaymentFormChange,
  onSavePayment,
}) {
  const totalAmount = Math.max(0, Number(selectedItem?.totalAmount) || 0);
  const paidAmount = clampPaymentAmount(paymentForm.paidAmount, totalAmount);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const nextStatus = getPaymentStatusFromAmount(paidAmount, totalAmount);

  return (
    <AdminDrawer
      actions={(
        <>
          <AdminButton disabled={isSaving} size="sm" variant="secondary" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton disabled={isSaving || totalAmount <= 0} icon={CreditCard} size="sm" variant="soft" onClick={onMarkPaid}>
            Mark paid
          </AdminButton>
          <AdminButton disabled={isSaving} icon={WalletCards} size="sm" variant="primary" onClick={onSavePayment}>
            {isSaving ? 'Saving...' : 'Save payment'}
          </AdminButton>
        </>
      )}
      description={selectedItem ? selectedItem.invoiceNumber + ' • ' + selectedItem.customerName : ''}
      isOpen={isOpen}
      title="Update payment"
      widthClass="max-w-lg"
      onClose={onClose}
    >
      <div className="grid gap-4">
        <AdminPanel className="grid gap-3 p-3" variant="flat">
          <div className="grid grid-cols-3 gap-2 text-center">
            <span className="grid gap-1 rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-2">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">Total</span>
              <strong className="truncate text-sm font-semibold text-[var(--ui-text-strong)]">{formatCurrency(totalAmount)}</strong>
            </span>
            <span className="grid gap-1 rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-2">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">Paid</span>
              <strong className="truncate text-sm font-semibold text-[var(--ui-text-strong)]">{formatCurrency(paidAmount)}</strong>
            </span>
            <span className="grid gap-1 rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-2">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">Sisa</span>
              <strong className="truncate text-sm font-semibold text-[var(--ui-text-strong)]">{formatCurrency(remainingAmount)}</strong>
            </span>
          </div>

          <AdminBadge tone={getBillingStatusTone(nextStatus)}>
            Next status: {getBillingStatusLabel(nextStatus)}
          </AdminBadge>
        </AdminPanel>

        <label className="grid gap-1.5 text-sm font-semibold text-[var(--ui-text-main)]">
          Amount paid
          <input
            className="min-h-12 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-4 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition placeholder:text-[var(--ui-text-soft)] focus:border-studio-accent/55 focus:ring-4 focus:ring-studio-accent/20"
            inputMode="numeric"
            min="0"
            step="1000"
            type="number"
            value={paymentForm.paidAmount}
            onChange={(event) => onPaymentFormChange({ paidAmount: event.target.value })}
          />
        </label>

        <div className="grid gap-1.5">
          <span className="text-sm font-semibold text-[var(--ui-text-main)]">Payment method</span>
          <PaymentMethodPills
            value={paymentForm.paymentMethod}
            onChange={(paymentMethod) => onPaymentFormChange({ paymentMethod })}
          />
        </div>

        {saveError ? (
          <AdminPanel className="p-3 text-sm font-semibold text-studio-accent" variant="flat">
            {saveError}
          </AdminPanel>
        ) : null}

        <p className="m-0 text-xs leading-5 text-[var(--ui-text-muted)]">
          Payment flow ini hanya update billingTransactions dan billingAuditLogs. Booking status belum disinkronkan pada fase ini.
        </p>
      </div>
    </AdminDrawer>
  );
}

function ManualPosDrawer({
  form,
  isOpen,
  isSaving,
  saveError,
  onClose,
  onFormChange,
  onSave,
}) {
  const totals = getManualPosFormTotals(form);
  const canSave = String(form?.itemName || '').trim() && totals.totalAmount > 0;

  return (
    <AdminDrawer
      actions={(
        <>
          <AdminButton disabled={isSaving} size="sm" variant="secondary" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton disabled={isSaving || !canSave} icon={Plus} size="sm" variant="primary" onClick={onSave}>
            {isSaving ? 'Saving...' : 'Save POS'}
          </AdminButton>
        </>
      )}
      description="Buat invoice manual untuk walk-in, overtime, atau item tambahan."
      isOpen={isOpen}
      title="New manual POS"
      widthClass="max-w-xl"
      onClose={onClose}
    >
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold text-[var(--ui-text-main)]">
            Customer
            <input
              className="min-h-12 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-4 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition placeholder:text-[var(--ui-text-soft)] focus:border-studio-accent/55 focus:ring-4 focus:ring-studio-accent/20"
              placeholder="Walk-in customer"
              type="text"
              value={form.customerName}
              onChange={(event) => onFormChange({ customerName: event.target.value })}
            />
          </label>

          <label className="grid gap-1.5 text-sm font-semibold text-[var(--ui-text-main)]">
            Phone
            <input
              className="min-h-12 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-4 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition placeholder:text-[var(--ui-text-soft)] focus:border-studio-accent/55 focus:ring-4 focus:ring-studio-accent/20"
              placeholder="Optional"
              type="tel"
              value={form.phone}
              onChange={(event) => onFormChange({ phone: event.target.value })}
            />
          </label>
        </div>

        <label className="grid gap-1.5 text-sm font-semibold text-[var(--ui-text-main)]">
          Item
          <input
            className="min-h-12 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-4 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition placeholder:text-[var(--ui-text-soft)] focus:border-studio-accent/55 focus:ring-4 focus:ring-studio-accent/20"
            placeholder="Studio walk-in session"
            type="text"
            value={form.itemName}
            onChange={(event) => onFormChange({ itemName: event.target.value })}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-semibold text-[var(--ui-text-main)]">
            Qty
            <input
              className="min-h-12 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-4 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition placeholder:text-[var(--ui-text-soft)] focus:border-studio-accent/55 focus:ring-4 focus:ring-studio-accent/20"
              inputMode="numeric"
              min="1"
              step="1"
              type="number"
              value={form.qty}
              onChange={(event) => onFormChange({ qty: event.target.value })}
            />
          </label>

          <label className="grid gap-1.5 text-sm font-semibold text-[var(--ui-text-main)]">
            Unit price
            <input
              className="min-h-12 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-4 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition placeholder:text-[var(--ui-text-soft)] focus:border-studio-accent/55 focus:ring-4 focus:ring-studio-accent/20"
              inputMode="numeric"
              min="0"
              step="1000"
              type="number"
              value={form.unitPrice}
              onChange={(event) => onFormChange({ unitPrice: event.target.value })}
            />
          </label>

          <label className="grid gap-1.5 text-sm font-semibold text-[var(--ui-text-main)]">
            Paid
            <input
              className="min-h-12 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-4 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition placeholder:text-[var(--ui-text-soft)] focus:border-studio-accent/55 focus:ring-4 focus:ring-studio-accent/20"
              inputMode="numeric"
              min="0"
              step="1000"
              type="number"
              value={form.paidAmount}
              onChange={(event) => onFormChange({ paidAmount: event.target.value })}
            />
          </label>
        </div>

        <AdminPanel className="grid gap-3 p-3" variant="flat">
          <div className="grid grid-cols-3 gap-2 text-center">
            <span className="grid gap-1 rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-2">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">Total</span>
              <strong className="truncate text-sm font-semibold text-[var(--ui-text-strong)]">{formatCurrency(totals.totalAmount)}</strong>
            </span>
            <span className="grid gap-1 rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-2">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">Paid</span>
              <strong className="truncate text-sm font-semibold text-[var(--ui-text-strong)]">{formatCurrency(totals.paidAmount)}</strong>
            </span>
            <span className="grid gap-1 rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-2">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">Sisa</span>
              <strong className="truncate text-sm font-semibold text-[var(--ui-text-strong)]">{formatCurrency(totals.remainingAmount)}</strong>
            </span>
          </div>

          <AdminBadge tone={getBillingStatusTone(totals.paymentStatus)}>
            Status: {getBillingStatusLabel(totals.paymentStatus)}
          </AdminBadge>
        </AdminPanel>

        <div className="grid gap-1.5">
          <span className="text-sm font-semibold text-[var(--ui-text-main)]">Payment method</span>
          <PaymentMethodPills
            value={form.paymentMethod}
            onChange={(paymentMethod) => onFormChange({ paymentMethod })}
          />
        </div>

        <label className="grid gap-1.5 text-sm font-semibold text-[var(--ui-text-main)]">
          Notes
          <textarea
            className="min-h-24 resize-none rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-4 py-3 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition placeholder:text-[var(--ui-text-soft)] focus:border-studio-accent/55 focus:ring-4 focus:ring-studio-accent/20"
            placeholder="Catatan transaksi..."
            value={form.notes}
            onChange={(event) => onFormChange({ notes: event.target.value })}
          />
        </label>

        {saveError ? (
          <AdminPanel className="p-3 text-sm font-semibold text-studio-accent" variant="flat">
            {saveError}
          </AdminPanel>
        ) : null}

        <p className="m-0 text-xs leading-5 text-[var(--ui-text-muted)]">
          Manual POS hanya membuat billingTransactions dan billingAuditLogs. Tidak mengurangi inventory stock pada fase ini.
        </p>
      </div>
    </AdminDrawer>
  );
}

function BillingQueue({
  creatingInvoiceKey,
  queue,
  onCreateInvoice,
  onOpenPayment,
  onPrintReceipt,
}) {
  if (!queue.length) {
    return (
      <BillingStatePanel
        message="Transaksi billing yang tersimpan dan booking pending / DP akan muncul di sini."
        title="Belum ada invoice aktif."
      />
    );
  }

  return (
    <AdminPanel className="billing-queue grid gap-2 p-2" variant="flat">
      {queue.map((item) => {
        const itemKey = getQueueItemKey(item);
        const isDraft = item.type === 'draft';
        const isCreating = creatingInvoiceKey === itemKey;

        return (
          <article
            className="grid gap-3 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-3 ring-1 ring-[var(--ui-ring)] lg:grid-cols-[minmax(0,1fr)_minmax(18rem,auto)_auto] lg:items-center"
            key={itemKey}
          >
            <div className="grid min-w-0 gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <AdminBadge tone={getBillingStatusTone(item.status)}>
                  {getBillingStatusLabel(item.status)}
                </AdminBadge>
                <AdminBadge tone={isDraft ? 'neutral' : 'cyan'}>
                  {isDraft ? 'Draft' : 'Saved'}
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

            <div className="grid grid-cols-3 gap-2 text-right">
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

            <div className="flex justify-end">
              {isDraft ? (
                <AdminButton
                  disabled={Boolean(creatingInvoiceKey)}
                  icon={FilePlus2}
                  size="sm"
                  variant="primary"
                  onClick={() => { onCreateInvoice(item); }}
                >
                  {isCreating ? 'Creating...' : 'Create invoice'}
                </AdminButton>
              ) : (
                <div className="flex flex-wrap justify-end gap-2">
                  <AdminButton icon={CreditCard} size="sm" variant="secondary" onClick={() => onOpenPayment(item)}>
                    Payment
                  </AdminButton>
                  <AdminButton icon={Printer} size="sm" variant="secondary" onClick={() => onPrintReceipt(item)}>
                    Print
                  </AdminButton>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </AdminPanel>
  );
}

function BillingNextPhasePanel({
  transactionCount,
  onOpenManualPos,
}) {
  return (
    <AdminPanel className="grid gap-3 p-4" variant="flat">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-studio-accent">
            Receipt print enabled
          </span>
          <strong className="text-base font-semibold text-[var(--ui-text-strong)]">
            {transactionCount} saved transaction
          </strong>
        </div>

        <div className="flex flex-wrap gap-2">
          <AdminButton icon={Plus} size="sm" variant="primary" onClick={onOpenManualPos}>
            New POS
          </AdminButton>
          <AdminButton disabled icon={Printer} size="sm" variant="secondary">
            Print
          </AdminButton>
        </div>
      </div>

      <p className="m-0 text-sm leading-6 text-[var(--ui-text-muted)]">
        BILLING.7 bisa print receipt HTML untuk saved invoice. Sync booking, inventory stock, dan PDF generator tetap ditahan.
      </p>
    </AdminPanel>
  );
}

export function BillingAdmin() {
  const adminContext = useOutletContext() || {};
  const {
    adminUser = null,
    manualBookings = [],
  } = adminContext;
  const [billingTransactions, setBillingTransactions] = useState([]);
  const [billingLoadError, setBillingLoadError] = useState('');
  const [createInvoiceError, setCreateInvoiceError] = useState('');
  const [creatingInvoiceKey, setCreatingInvoiceKey] = useState('');
  const [isBillingReady, setIsBillingReady] = useState(false);
  const [isManualPosOpen, setIsManualPosOpen] = useState(false);
  const [isManualPosSaving, setIsManualPosSaving] = useState(false);
  const [isPaymentSaving, setIsPaymentSaving] = useState(false);
  const [manualPosForm, setManualPosForm] = useState(createEmptyManualPosForm());
  const [manualPosSaveError, setManualPosSaveError] = useState('');
  const [paymentForm, setPaymentForm] = useState(createPaymentFormFromItem(null));
  const [paymentSaveError, setPaymentSaveError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaymentItem, setSelectedPaymentItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setIsBillingReady(false);
    setBillingLoadError('');

    const unsubscribe = adminBillingRepository.subscribeBillingTransactions(
      (transactions) => {
        setBillingTransactions(transactions);
        setIsBillingReady(true);
      },
      (error) => {
        setBillingLoadError(error?.message || 'Gagal membaca data billing.');
        setIsBillingReady(true);
      },
    );

    return unsubscribe;
  }, []);

  const queue = useMemo(
    () => createBillingQueue(manualBookings, billingTransactions),
    [billingTransactions, manualBookings],
  );

  const filteredQueue = useMemo(() => {
    const normalizedSearch = normalizeSearchValue(searchTerm);

    return queue.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesSearch = !normalizedSearch ||
        normalizeSearchValue(item.customerName).includes(normalizedSearch) ||
        normalizeSearchValue(item.invoiceNumber).includes(normalizedSearch) ||
        normalizeSearchValue(item.sourceLabel).includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [queue, searchTerm, statusFilter]);

  const summary = useMemo(
    () => getBillingSummary(queue),
    [queue],
  );

  const handleCreateInvoice = async (draft) => {
    if (!draft || draft.type !== 'draft' || creatingInvoiceKey) {
      return;
    }

    const itemKey = getQueueItemKey(draft);

    setCreateInvoiceError('');
    setCreatingInvoiceKey(itemKey);

    try {
      const transaction = createBillingTransactionFromDraft(draft, adminUser);
      const savedTransaction = await adminBillingRepository.createBillingTransaction(transaction);

      if (savedTransaction) {
        await adminBillingRepository.recordBillingAuditLog({
          action: 'billing.booking_invoice_create',
          by: normalizeBillingActor(adminUser),
          label: 'Invoice dibuat dari booking draft',
          source: 'admin',
          transactionId: savedTransaction.id,
          transactionSnapshot: savedTransaction,
        });
      }
    } catch (error) {
      console.error('Failed to create billing invoice from booking draft.', error);
      setCreateInvoiceError(error?.message || 'Gagal membuat invoice dari booking draft.');
    } finally {
      setCreatingInvoiceKey('');
    }
  };

  const handleOpenPayment = (item) => {
    if (!item || item.type !== 'transaction') {
      return;
    }

    setPaymentSaveError('');
    setSelectedPaymentItem(item);
    setPaymentForm(createPaymentFormFromItem(item));
  };

  const handleClosePayment = () => {
    if (isPaymentSaving) {
      return;
    }

    setPaymentSaveError('');
    setSelectedPaymentItem(null);
    setPaymentForm(createPaymentFormFromItem(null));
  };

  const handlePaymentFormChange = (patch) => {
    setPaymentForm((currentForm) => ({
      ...currentForm,
      ...patch,
    }));
  };

  const savePaymentUpdate = async (options = {}) => {
    if (!selectedPaymentItem || isPaymentSaving) {
      return;
    }

    setIsPaymentSaving(true);
    setPaymentSaveError('');

    try {
      const nextTransaction = createUpdatedPaymentTransaction(
        selectedPaymentItem,
        paymentForm,
        adminUser,
        options,
      );

      const savedTransaction = await adminBillingRepository.updateBillingTransaction(nextTransaction);

      if (savedTransaction) {
        await adminBillingRepository.recordBillingAuditLog({
          action: 'billing.pay',
          by: normalizeBillingActor(adminUser),
          label: 'Payment billing diperbarui',
          source: 'admin',
          transactionId: savedTransaction.id,
          transactionSnapshot: savedTransaction,
        });
      }

      setSelectedPaymentItem(null);
      setPaymentForm(createPaymentFormFromItem(null));
    } catch (error) {
      console.error('Failed to update billing payment.', error);
      setPaymentSaveError(error?.message || 'Gagal update payment billing.');
    } finally {
      setIsPaymentSaving(false);
    }
  };

  const handleSavePayment = () => savePaymentUpdate();
  const handleMarkPaid = () => savePaymentUpdate({ markPaid: true });

  const handleOpenManualPos = () => {
    setManualPosSaveError('');
    setManualPosForm(createEmptyManualPosForm());
    setIsManualPosOpen(true);
  };

  const handleCloseManualPos = () => {
    if (isManualPosSaving) {
      return;
    }

    setManualPosSaveError('');
    setManualPosForm(createEmptyManualPosForm());
    setIsManualPosOpen(false);
  };

  const handleManualPosFormChange = (patch) => {
    setManualPosForm((currentForm) => ({
      ...currentForm,
      ...patch,
    }));
  };

  const handleSaveManualPos = async () => {
    if (isManualPosSaving) {
      return;
    }

    setIsManualPosSaving(true);
    setManualPosSaveError('');

    try {
      const transaction = createManualPosTransactionFromForm(manualPosForm, adminUser);
      const savedTransaction = await adminBillingRepository.createBillingTransaction(transaction);

      if (savedTransaction) {
        await adminBillingRepository.recordBillingAuditLog({
          action: 'billing.manual_create',
          by: normalizeBillingActor(adminUser),
          label: 'Manual POS transaction dibuat',
          source: 'admin',
          transactionId: savedTransaction.id,
          transactionSnapshot: savedTransaction,
        });
      }

      setManualPosForm(createEmptyManualPosForm());
      setIsManualPosOpen(false);
    } catch (error) {
      console.error('Failed to create manual billing POS transaction.', error);
      setManualPosSaveError(error?.message || 'Gagal membuat transaksi POS manual.');
    } finally {
      setIsManualPosSaving(false);
    }
  };

  const handlePrintReceipt = async (item) => {
    if (!item || item.type !== 'transaction') {
      return;
    }

    const didPrint = printBillingReceiptFromItem(item);

    if (!didPrint) {
      setCreateInvoiceError('Popup print diblokir browser. Izinkan popup lalu coba lagi.');
      return;
    }

    try {
      await adminBillingRepository.recordBillingAuditLog({
        action: 'billing.print',
        by: normalizeBillingActor(adminUser),
        label: 'Receipt billing dicetak',
        source: 'admin',
        transactionId: item.id || item.transactionSnapshot?.id || '',
        transactionSnapshot: item.transactionSnapshot || item,
      });
    } catch (error) {
      console.error('Failed to record billing print audit log.', error);
    }
  };

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
              Manual POS
            </AdminBadge>
            <AdminBadge icon={WalletCards} tone="cyan">
              {isBillingReady ? 'Live' : 'Loading'}
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

      {createInvoiceError ? (
        <BillingStatePanel
          icon={AlertTriangle}
          message={createInvoiceError}
          title="Invoice gagal dibuat."
          tone="warning"
        />
      ) : null}

      {billingLoadError ? (
        <BillingStatePanel
          icon={AlertTriangle}
          message={billingLoadError}
          title="Billing read model bermasalah."
          tone="warning"
        />
      ) : !isBillingReady ? (
        <BillingStatePanel
          message="Membaca billingTransactions dari repository."
          title="Memuat data billing."
        />
      ) : (
        <BillingQueue
          creatingInvoiceKey={creatingInvoiceKey}
          queue={filteredQueue}
          onCreateInvoice={handleCreateInvoice}
          onOpenPayment={handleOpenPayment}
          onPrintReceipt={handlePrintReceipt}
        />
      )}

      <BillingNextPhasePanel
        transactionCount={billingTransactions.length}
        onOpenManualPos={handleOpenManualPos}
      />

      <BillingPaymentDrawer
        isOpen={Boolean(selectedPaymentItem)}
        isSaving={isPaymentSaving}
        paymentForm={paymentForm}
        saveError={paymentSaveError}
        selectedItem={selectedPaymentItem}
        onClose={handleClosePayment}
        onMarkPaid={handleMarkPaid}
        onPaymentFormChange={handlePaymentFormChange}
        onSavePayment={handleSavePayment}
      />

      <ManualPosDrawer
        form={manualPosForm}
        isOpen={isManualPosOpen}
        isSaving={isManualPosSaving}
        saveError={manualPosSaveError}
        onClose={handleCloseManualPos}
        onFormChange={handleManualPosFormChange}
        onSave={handleSaveManualPos}
      />
    </AdminPageShell>
  );
}
