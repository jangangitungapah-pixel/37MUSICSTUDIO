import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import {
  BookOpenCheck,
  CalendarDays,
  CircleDollarSign,
  FileText,
  TrendingDown,
  TrendingUp,
  WalletCards,
  Search,
} from 'lucide-react';
import {
  AdminBadge,
  AdminButton,
  AdminCommandBar,
  AdminPageHeader,
  AdminPageShell,
  AdminPanel,
  AdminDropdown,
  AdminTableShell,
  AdminDrawer,
} from '../components/admin/AdminPrimitives.jsx';

const standardCategories = [
  { key: 'all', label: 'Semua Kategori' },
  { key: 'studio_rent', label: 'Sewa Studio' },
  { key: 'gear_rent', label: 'Sewa Gear/Alat' },
  { key: 'pos_sale', label: 'Penjualan POS' },
  { key: 'maintenance', label: 'Perawatan Alat' },
  { key: 'utilities', label: 'Listrik & Internet' },
  { key: 'salary', label: 'Gaji & Staff' },
  { key: 'marketing', label: 'Pemasaran' },
  { key: 'other', label: 'Lain-lain' },
];

const standardAccounts = [
  { key: 'all', label: 'Semua Akun' },
  { key: 'cash', label: 'Cash' },
  { key: 'transfer', label: 'Bank Transfer' },
  { key: 'qris', label: 'QRIS' },
  { key: 'debit', label: 'Debit' },
  { key: 'other', label: 'Lainnya' },
];

const periodFilters = [
  { key: 'month', label: 'Bulan Ini' },
  { key: '30days', label: '30 Hari Terakhir' },
  { key: 'all', label: 'Semua' },
];

const typeFilters = [
  { key: 'all', label: 'Semua Tipe' },
  { key: 'income', label: 'Masuk (Income)' },
  { key: 'expense', label: 'Keluar (Expense)' },
  { key: 'transfer', label: 'Transfer' },
];

const incomeCategories = [
  { key: 'studio_rent', label: 'Sewa Studio' },
  { key: 'gear_rent', label: 'Sewa Gear/Alat' },
  { key: 'pos_sale', label: 'Penjualan POS' },
  { key: 'other', label: 'Lain-lain (Pendapatan)' },
];

const expenseCategories = [
  { key: 'maintenance', label: 'Perawatan Alat' },
  { key: 'utilities', label: 'Listrik & Internet' },
  { key: 'salary', label: 'Gaji & Staff' },
  { key: 'marketing', label: 'Pemasaran' },
  { key: 'other', label: 'Lain-lain (Pengeluaran)' },
];

const transferCategories = [
  { key: 'transfer', label: 'Transfer Internal' },
];

function formatBookkeepingCurrency(value, allowNegative = false) {
  const num = Number(value) || 0;
  const val = allowNegative ? num : Math.max(0, num);
  return new Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(val);
}

function getCurrentMonthLabel() {
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

function getBillingSnapshot(transactions) {
  return transactions.reduce((summary, transaction) => {
    const total = Number(transaction.total || transaction.totalAmount || 0) || 0;
    const paid = Number(transaction.paid || transaction.paidAmount || 0) || 0;
    const remaining = Number(transaction.remaining || transaction.remainingAmount || 0) || 0;
    const status = transaction.paymentStatus || transaction.status || 'unpaid';

    summary.total += total;
    summary.paid += paid;
    summary.remaining += remaining;

    if (status === 'paid') {
      summary.paidCount += 1;
    } else if (status === 'dp') {
      summary.dpCount += 1;
    } else {
      summary.unpaidCount += 1;
    }

    return summary;
  }, {
    dpCount: 0,
    paid: 0,
    paidCount: 0,
    remaining: 0,
    total: 0,
    unpaidCount: 0,
  });
}

function BookkeepingSummaryCard({
  helper,
  icon: Icon,
  label,
  tone = 'strong',
  value,
}) {
  return (
    <AdminPanel className="bookkeeping-summary-card grid gap-2.5 p-3.5" variant="flat">
      <div className="flex items-start justify-between gap-3">
        <span className="grid min-w-0 gap-0.5">
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
            {label}
          </span>
          <strong className="text-xl font-semibold leading-none tracking-[-0.05em] text-[var(--ui-text-strong)] sm:text-2xl">
            {value}
          </strong>
        </span>

        <AdminBadge tone={tone}>
          <Icon size={14} strokeWidth={2.35} aria-hidden="true" />
        </AdminBadge>
      </div>

      <p className="m-0 text-[0.68rem] font-medium leading-4 text-[var(--ui-text-muted)]">
        {helper}
      </p>
    </AdminPanel>
  );
}

function BookkeepingComingSoonPanel() {
  return (
    <AdminPanel className="grid gap-4 p-4 sm:p-5" variant="solid">
      <div className="grid gap-2">
        <AdminBadge tone="cyan">
          BOOKKEEPING.4
        </AdminBadge>

        <h2 className="m-0 text-2xl font-semibold tracking-[-0.05em] text-[var(--ui-text-strong)]">
          Pencatatan kas manual sudah aktif.
        </h2>

        <p className="m-0 max-w-3xl text-sm leading-6 text-[var(--ui-text-main)]">
          Fase ini telah mengaktifkan laci penambahan dan pengeditan transaksi kas secara manual.
          Setiap aktivitas transaksi akan tercatat secara akurat di log audit. Catatan otomatis
          dari Billing/POS terkunci demi integritas data.
        </p>
      </div>

      <div className="grid gap-2 rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-3 ring-1 ring-[var(--ui-ring)] sm:grid-cols-3">
        <div className="grid gap-1">
          <span className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
            Berikutnya
          </span>
          <strong className="text-sm font-semibold text-[var(--ui-text-strong)]">
            BOOKKEEPING.5 Billing import
          </strong>
        </div>

        <div className="grid gap-1">
          <span className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
            Collection
          </span>
          <strong className="text-sm font-semibold text-[var(--ui-text-strong)]">
            bookkeepingEntries
          </strong>
        </div>

        <div className="grid gap-1">
          <span className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
            Guard
          </span>
          <strong className="text-sm font-semibold text-[var(--ui-text-strong)]">
            Audit trail aktif
          </strong>
        </div>
      </div>
    </AdminPanel>
  );
}

function formatBookkeepingDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
  }).format(date);
}

function formatBookkeepingDateTime(entry) {
  const dateStr = entry.date;
  const timeStr = entry.transactionAt
    ? new Date(entry.transactionAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : '';

  const formattedDate = formatBookkeepingDate(dateStr);
  return timeStr ? `${formattedDate} ${timeStr}` : formattedDate;
}

function formatPaymentMethod(method) {
  if (!method) return '-';
  const val = String(method).trim().toLowerCase();
  if (val === 'qris') return 'QRIS';
  return val.charAt(0).toUpperCase() + val.slice(1);
}

function formatSource(entry) {
  if (!entry) return 'Manual';
  const typeMap = {
    adjustment: 'Penyesuaian',
    billing: 'Billing',
    inventory: 'Inventory',
    manual: 'Manual',
  };
  const typeLabel = typeMap[entry.sourceType] || 'Manual';
  return entry.sourceLabel ? `${typeLabel} (${entry.sourceLabel})` : typeLabel;
}

function renderTypeBadge(type) {
  if (type === 'income') {
    return <AdminBadge tone="cyan">Masuk</AdminBadge>;
  }
  if (type === 'expense') {
    return <AdminBadge tone="accent">Keluar</AdminBadge>;
  }
  return <AdminBadge tone="purple">Transfer</AdminBadge>;
}

function LedgerEmptyState({ hasEntries }) {
  return (
    <AdminPanel className="grid min-h-[16rem] place-items-center border-dashed p-6 text-center" variant="flat">
      <div className="grid max-w-md gap-3">
        <span className="mx-auto grid size-12 place-items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent ring-1 ring-[var(--ui-ring)]">
          <BookOpenCheck size={20} strokeWidth={2.35} aria-hidden="true" />
        </span>

        <h2 className="m-0 text-xl font-semibold tracking-[-0.05em] text-[var(--ui-text-strong)]">
          {hasEntries ? 'Tidak ada catatan yang cocok.' : 'Belum ada catatan pembukuan.'}
        </h2>

        <p className="m-0 text-xs leading-5 text-[var(--ui-text-muted)]">
          {hasEntries
            ? 'Coba ubah keyword pencarian atau bersihkan filter untuk melihat data lainnya.'
            : 'Mulai catat kas masuk dan keluar studio untuk melihat laporan keuangan di sini.'}
        </p>
      </div>
    </AdminPanel>
  );
}

export function BookkeepingAdmin() {
  const adminContext = useOutletContext() || {};
  const {
    adminUser = null,
    billingLoadError = '',
    billingTransactions = [],
    isBillingReady = false,
    bookkeepingEntries = [],
    isBookkeepingReady = false,
    bookkeepingLoadError = '',
    createBookkeepingEntry,
    updateBookkeepingEntry,
    deleteBookkeepingEntry,
    recordBookkeepingAuditLog,
  } = adminContext;

  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('month');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');

  // Form states for the Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null); // null means CREATE mode
  const [formType, setFormType] = useState('income');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formCategory, setFormCategory] = useState('studio_rent');
  const [formAccount, setFormAccount] = useState('cash');
  const [formTargetAccount, setFormTargetAccount] = useState('transfer');
  const [formPaymentMethod, setFormPaymentMethod] = useState('cash');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const billingSnapshot = useMemo(
    () => getBillingSnapshot(billingTransactions),
    [billingTransactions],
  );
  const currentMonthLabel = useMemo(() => getCurrentMonthLabel(), []);

  const dynamicCategories = useMemo(() => {
    const categoriesMap = new Map();
    standardCategories.forEach((cat) => {
      if (cat.key !== 'all') {
        categoriesMap.set(cat.key, cat.label);
      }
    });
    bookkeepingEntries.forEach((entry) => {
      if (entry.categoryId && entry.categoryName) {
        categoriesMap.set(entry.categoryId, entry.categoryName);
      }
    });
    return [
      { key: 'all', label: 'Semua Kategori' },
      ...Array.from(categoriesMap.entries()).map(([key, label]) => ({ key, label })),
    ];
  }, [bookkeepingEntries]);

  const dynamicAccounts = useMemo(() => {
    const accountsMap = new Map();
    standardAccounts.forEach((acc) => {
      if (acc.key !== 'all') {
        accountsMap.set(acc.key, acc.label);
      }
    });
    bookkeepingEntries.forEach((entry) => {
      if (entry.accountId && entry.accountName) {
        accountsMap.set(entry.accountId, entry.accountName);
      }
    });
    return [
      { key: 'all', label: 'Semua Akun' },
      ...Array.from(accountsMap.entries()).map(([key, label]) => ({ key, label })),
    ];
  }, [bookkeepingEntries]);

  const categoryOptions = useMemo(() => {
    if (formType === 'income') return incomeCategories;
    if (formType === 'expense') return expenseCategories;
    return transferCategories;
  }, [formType]);

  const isReadOnly = useMemo(() => {
    return selectedEntry && selectedEntry.sourceType !== 'manual';
  }, [selectedEntry]);

  const handleTypeChange = (newType) => {
    setFormType(newType);
    if (newType === 'income') {
      setFormCategory('studio_rent');
      setFormPaymentMethod('cash');
    } else if (newType === 'expense') {
      setFormCategory('maintenance');
      setFormPaymentMethod('cash');
    } else {
      setFormCategory('transfer');
      setFormPaymentMethod('transfer');
    }
  };

  const handleAddNew = () => {
    setSelectedEntry(null);
    setFormType('income');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormCategory('studio_rent');
    setFormAccount('cash');
    setFormTargetAccount('transfer');
    setFormPaymentMethod('cash');
    setFormAmount('');
    setFormDescription('');
    setFormNotes('');
    setValidationError('');
    setIsDrawerOpen(true);
  };

  const handleRowClick = (entry) => {
    setSelectedEntry(entry);
    setFormType(entry.type);
    setFormDate(entry.date);
    setFormCategory(entry.categoryId);
    setFormAccount(entry.accountId);
    setFormPaymentMethod(entry.paymentMethod);
    setFormAmount(String(entry.amount));
    setFormDescription(entry.description);

    const targetMatch = entry.notes.match(/Target Account: (.*)/);
    if (targetMatch && targetMatch[1]) {
      const matchKey = standardAccounts.find((a) => a.label === targetMatch[1])?.key || 'transfer';
      setFormTargetAccount(matchKey);
      setFormNotes(entry.notes.replace(/\nTarget Account: .*/, ''));
    } else {
      setFormTargetAccount('transfer');
      setFormNotes(entry.notes);
    }

    setValidationError('');
    setIsDrawerOpen(true);
  };

  const handleSave = async () => {
    if (isSaving || isReadOnly) return;

    const amountVal = Number(formAmount);
    if (!formDescription.trim() && formType !== 'transfer') {
      setValidationError('Deskripsi wajib diisi.');
      return;
    }
    if (Number.isNaN(amountVal) || amountVal <= 0) {
      setValidationError('Nominal harus berupa angka dan lebih besar dari 0.');
      return;
    }
    if (formType === 'transfer' && formAccount === formTargetAccount) {
      setValidationError('Akun asal dan akun tujuan tidak boleh sama.');
      return;
    }

    setIsSaving(true);
    setValidationError('');

    try {
      const categoryName = categoryOptions.find((c) => c.key === formCategory)?.label || 'Lain-lain';
      const accountName = standardAccounts.find((a) => a.key === formAccount)?.label || 'Cash';
      const targetAccountName = standardAccounts.find((a) => a.key === formTargetAccount)?.label || 'Bank Transfer';

      let direction = 'in';
      if (formType === 'expense') direction = 'out';
      else if (formType === 'transfer') direction = 'neutral';

      const actor = {
        displayName: adminUser?.displayName || adminUser?.email || 'Admin',
        email: adminUser?.email || '',
        uid: adminUser?.uid || '',
      };

      const entryId = selectedEntry ? selectedEntry.id : 'bookkeeping-' + Date.now();
      const defaultDesc = formType === 'transfer' ? `Transfer: ${accountName} -> ${targetAccountName}` : 'Transaksi manual';
      const notesClean = formNotes.trim();
      const notesPayload = formType === 'transfer' ? `${notesClean}\nTarget Account: ${targetAccountName}` : notesClean;

      const payload = {
        amount: amountVal,
        categoryId: formCategory,
        categoryName,
        createdAt: selectedEntry ? selectedEntry.createdAt : new Date().toISOString(),
        createdBy: selectedEntry ? selectedEntry.createdBy : actor,
        date: formDate,
        description: formDescription.trim() || defaultDesc,
        direction,
        id: entryId,
        notes: notesPayload,
        paymentMethod: formPaymentMethod,
        sourceId: '',
        sourceLabel: '',
        sourceType: 'manual',
        studioId: 'main-studio',
        transactionAt: new Date(formDate).toISOString(),
        type: formType,
        updatedAt: new Date().toISOString(),
        updatedBy: actor,
        accountId: formAccount,
        accountName,
      };

      if (selectedEntry) {
        await updateBookkeepingEntry(payload);
        await recordBookkeepingAuditLog({
          action: 'bookkeeping.update',
          entryId,
          entrySnapshot: payload,
          by: actor,
        });
      } else {
        await createBookkeepingEntry(payload);
        await recordBookkeepingAuditLog({
          action: 'bookkeeping.create',
          entryId,
          entrySnapshot: payload,
          by: actor,
        });
      }

      setIsDrawerOpen(false);
    } catch (error) {
      console.error(error);
      setValidationError('Gagal menyimpan catatan keuangan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isSaving || isReadOnly || !selectedEntry) return;

    if (window.confirm('Apakah Anda yakin ingin menghapus catatan pembukuan ini?')) {
      setIsSaving(true);
      setValidationError('');

      try {
        const actor = {
          displayName: adminUser?.displayName || adminUser?.email || 'Admin',
          email: adminUser?.email || '',
          uid: adminUser?.uid || '',
        };

        await deleteBookkeepingEntry(selectedEntry.id);
        await recordBookkeepingAuditLog({
          action: 'bookkeeping.delete',
          entryId: selectedEntry.id,
          entrySnapshot: selectedEntry,
          by: actor,
        });

        setIsDrawerOpen(false);
      } catch (error) {
        console.error(error);
        setValidationError('Gagal menghapus catatan keuangan.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const filteredEntries = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    const today = new Date();
    const currentMonthPrefix = today.toISOString().slice(0, 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

    return bookkeepingEntries.filter((entry) => {
      if (periodFilter === 'month') {
        if (!entry.date || !entry.date.startsWith(currentMonthPrefix)) {
          return false;
        }
      } else if (periodFilter === '30days') {
        if (!entry.date || entry.date < thirtyDaysAgoStr) {
          return false;
        }
      }

      if (typeFilter !== 'all' && entry.type !== typeFilter) {
        return false;
      }

      if (categoryFilter !== 'all' && entry.categoryId !== categoryFilter) {
        return false;
      }

      if (accountFilter !== 'all' && entry.accountId !== accountFilter) {
        return false;
      }

      if (normalizedQuery) {
        const amountStr = String(entry.amount || '');
        const matchText = [
          entry.description,
          entry.categoryName,
          entry.accountName,
          entry.paymentMethod,
          entry.sourceLabel,
          entry.sourceType,
          amountStr,
        ].join(' ').toLowerCase();

        if (!matchText.includes(normalizedQuery)) {
          return false;
        }
      }

      return true;
    });
  }, [bookkeepingEntries, searchTerm, periodFilter, typeFilter, categoryFilter, accountFilter]);

  const entriesWithRunningBalance = useMemo(() => {
    const sortedChronological = [...bookkeepingEntries].sort((a, b) => {
      const timeA = new Date(a.transactionAt || a.date || a.createdAt || 0).getTime();
      const timeB = new Date(b.transactionAt || b.date || b.createdAt || 0).getTime();
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return String(a.id || '').localeCompare(String(b.id || ''));
    });

    let cumulative = 0;
    const balanceMap = {};
    sortedChronological.forEach((entry) => {
      if (entry.direction === 'in' || entry.type === 'income') {
        cumulative += Number(entry.amount) || 0;
      } else if (entry.direction === 'out' || entry.type === 'expense') {
        cumulative -= Number(entry.amount) || 0;
      }
      balanceMap[entry.id] = cumulative;
    });

    return filteredEntries.map((entry) => ({
      ...entry,
      runningBalance: balanceMap[entry.id] ?? 0,
    }));
  }, [bookkeepingEntries, filteredEntries]);

  const summaryMetrics = useMemo(() => {
    let income = 0;
    let expense = 0;

    filteredEntries.forEach((entry) => {
      if (entry.type === 'income') {
        income += Number(entry.amount) || 0;
      } else if (entry.type === 'expense') {
        expense += Number(entry.amount) || 0;
      }
    });

    const allTimeBalance = bookkeepingEntries.reduce((sum, entry) => {
      if (entry.direction === 'in' || entry.type === 'income') {
        return sum + (Number(entry.amount) || 0);
      }
      if (entry.direction === 'out' || entry.type === 'expense') {
        return sum - (Number(entry.amount) || 0);
      }
      return sum;
    }, 0);

    const today = new Date();
    const currentMonthPrefix = today.toISOString().slice(0, 7);
    const monthlyTransactionsCount = bookkeepingEntries.filter((entry) =>
      entry.date && entry.date.startsWith(currentMonthPrefix)
    ).length;

    return {
      income,
      expense,
      profit: income - expense,
      balance: allTimeBalance,
      monthlyCount: monthlyTransactionsCount,
    };
  }, [bookkeepingEntries, filteredEntries]);

  return (
    <AdminPageShell className="bookkeeping-admin-workspace gap-2 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-0 md:gap-3 md:pb-3 md:pt-0" width="wide">
      <div className="sr-only" id="bookkeeping-admin-title">
        Pembukuan 37 Music Studio
      </div>

      <AdminPageHeader
        description="Pantau kas masuk, kas keluar, profit, saldo, dan laporan keuangan studio."
        eyebrow="Studio finance"
        meta={(
          <>
            <AdminBadge icon={CalendarDays} tone="strong">
              {currentMonthLabel}
            </AdminBadge>
            <AdminBadge icon={BookOpenCheck} tone={isBookkeepingReady ? 'cyan' : 'purple'}>
              {isBookkeepingReady ? 'Repository terbaca' : 'Loading repository'}
            </AdminBadge>
            <AdminBadge icon={WalletCards} tone={isBillingReady ? 'cyan' : 'purple'}>
              {isBillingReady ? 'Billing terbaca' : 'Loading billing'}
            </AdminBadge>
            {bookkeepingLoadError || billingLoadError ? (
              <AdminBadge tone="accent">
                Fallback aktif
              </AdminBadge>
            ) : null}
          </>
        )}
        title="Pembukuan"
      />

      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" aria-label="Ringkasan pembukuan">
        <BookkeepingSummaryCard
          helper="Kas masuk periode aktif."
          icon={TrendingUp}
          label="Pemasukan"
          tone="cyan"
          value={formatBookkeepingCurrency(summaryMetrics.income)}
        />
        <BookkeepingSummaryCard
          helper="Kas keluar periode aktif."
          icon={TrendingDown}
          label="Pengeluaran"
          tone="accent"
          value={formatBookkeepingCurrency(summaryMetrics.expense)}
        />
        <BookkeepingSummaryCard
          helper="Profit bersih periode aktif."
          icon={CircleDollarSign}
          label="Profit"
          tone={summaryMetrics.profit >= 0 ? 'cyan' : 'accent'}
          value={formatBookkeepingCurrency(summaryMetrics.profit, true)}
        />
        <BookkeepingSummaryCard
          helper="Saldo kas all-time kumulatif."
          icon={WalletCards}
          label="Saldo Kas"
          tone="strong"
          value={formatBookkeepingCurrency(summaryMetrics.balance, true)}
        />
        <BookkeepingSummaryCard
          helper="Sisa tagihan invoice belum lunas."
          icon={WalletCards}
          label="Piutang"
          tone="purple"
          value={formatBookkeepingCurrency(billingSnapshot.remaining)}
        />
        <BookkeepingSummaryCard
          helper="Transaksi studio bulan ini."
          icon={FileText}
          label="Bulan Ini"
          tone="neutral"
          value={`${summaryMetrics.monthlyCount} Transaksi`}
        />
      </section>

      <AdminCommandBar className="bookkeeping-command-bar gap-2 p-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto_auto] lg:items-center">
        <label className="flex min-h-11 items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 ring-1 ring-[var(--ui-ring)] focus-within:border-studio-accent/55 focus-within:ring-4 focus-within:ring-studio-accent/20">
          <Search className="shrink-0 text-[var(--ui-text-muted)]" size={15} strokeWidth={2.35} aria-hidden="true" />
          <input
            className="w-full border-0 bg-transparent text-sm font-semibold text-[var(--ui-text-strong)] outline-none placeholder:text-[var(--ui-text-soft)]"
            placeholder="Cari deskripsi, kategori, atau akun..."
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>

        <div className="grid grid-cols-3 gap-0.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-0.5 ring-1 ring-[var(--ui-ring)] md:inline-flex">
          {periodFilters.map((item) => (
            <button
              aria-pressed={periodFilter === item.key}
              className={
                periodFilter === item.key
                  ? 'min-h-9 rounded-full bg-[var(--ui-control-hover)] px-3.5 text-xs font-semibold text-studio-accent shadow-[var(--ui-shadow-control)]'
                  : 'min-h-9 rounded-full px-3.5 text-xs font-semibold text-[var(--ui-text-muted)] transition hover:bg-[var(--ui-control)] hover:text-[var(--ui-text-strong)]'
              }
              key={item.key}
              type="button"
              onClick={() => setPeriodFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-0.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-0.5 ring-1 ring-[var(--ui-ring)] md:inline-flex">
          {typeFilters.map((item) => (
            <button
              aria-pressed={typeFilter === item.key}
              className={
                typeFilter === item.key
                  ? 'min-h-9 rounded-full bg-[var(--ui-control-hover)] px-3.5 text-xs font-semibold text-studio-accent shadow-[var(--ui-shadow-control)]'
                  : 'min-h-9 rounded-full px-3.5 text-xs font-semibold text-[var(--ui-text-muted)] transition hover:bg-[var(--ui-control)] hover:text-[var(--ui-text-strong)]'
              }
              key={item.key}
              type="button"
              onClick={() => setTypeFilter(item.key)}
            >
              {item.label.split(' ')[0]}
            </button>
          ))}
        </div>

        <AdminDropdown
          className="min-w-[150px]"
          hideLabel
          label="Kategori"
          options={dynamicCategories}
          value={categoryFilter}
          onChange={setCategoryFilter}
        />

        <AdminDropdown
          className="min-w-[130px]"
          hideLabel
          label="Akun"
          options={dynamicAccounts}
          value={accountFilter}
          onChange={setAccountFilter}
        />

        <AdminButton
          icon={CircleDollarSign}
          variant="primary"
          onClick={handleAddNew}
        >
          Tambah catatan
        </AdminButton>
      </AdminCommandBar>

      {entriesWithRunningBalance.length > 0 ? (
        <AdminTableShell minWidth="min-w-[960px]">
          <table className="w-full border-collapse text-left text-xs text-[var(--ui-text-main)]">
            <thead>
              <tr className="border-b border-[var(--ui-border-strong)] bg-[var(--ui-control)] text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Tipe</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Deskripsi</th>
                <th className="p-3.5">Akun</th>
                <th className="p-3.5">Metode</th>
                <th className="p-3.5 text-right">Masuk</th>
                <th className="p-3.5 text-right">Keluar</th>
                <th className="p-3.5 text-right">Saldo</th>
                <th className="p-3.5">Sumber</th>
              </tr>
            </thead>
            <tbody>
              {entriesWithRunningBalance.map((entry) => (
                <tr
                  className="border-b border-[var(--ui-border)] hover:bg-[var(--ui-control)] cursor-pointer"
                  key={entry.id}
                  onClick={() => handleRowClick(entry)}
                >
                  <td className="p-3.5 font-medium whitespace-nowrap">
                    {formatBookkeepingDateTime(entry)}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    {renderTypeBadge(entry.type)}
                  </td>
                  <td className="p-3.5 font-semibold text-[var(--ui-text-strong)] whitespace-nowrap">
                    {entry.categoryName}
                  </td>
                  <td className="p-3.5 max-w-[280px] truncate font-medium">
                    {entry.description}
                  </td>
                  <td className="p-3.5 font-semibold whitespace-nowrap">
                    {entry.accountName}
                  </td>
                  <td className="p-3.5 font-medium whitespace-nowrap">
                    {formatPaymentMethod(entry.paymentMethod)}
                  </td>
                  <td className="p-3.5 text-right font-bold text-studio-cyan whitespace-nowrap">
                    {entry.type === 'income' ? formatBookkeepingCurrency(entry.amount) : '-'}
                  </td>
                  <td className="p-3.5 text-right font-bold text-studio-accent whitespace-nowrap">
                    {entry.type === 'expense' ? formatBookkeepingCurrency(entry.amount) : '-'}
                  </td>
                  <td className="p-3.5 text-right font-semibold text-[var(--ui-text-strong)] whitespace-nowrap">
                    {formatBookkeepingCurrency(entry.runningBalance, true)}
                  </td>
                  <td className="p-3.5 font-medium text-[var(--ui-text-muted)] whitespace-nowrap">
                    {formatSource(entry)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableShell>
      ) : (
        <LedgerEmptyState hasEntries={bookkeepingEntries.length > 0} />
      )}

      <AdminDrawer
        actions={(
          <>
            {!isReadOnly && selectedEntry ? (
              <AdminButton
                disabled={isSaving}
                size="sm"
                variant="danger"
                onClick={handleDelete}
              >
                Hapus Catatan
              </AdminButton>
            ) : null}

            <AdminButton
              disabled={isSaving}
              size="sm"
              variant="secondary"
              onClick={() => setIsDrawerOpen(false)}
            >
              Batal
            </AdminButton>

            {!isReadOnly ? (
              <AdminButton
                disabled={isSaving}
                size="sm"
                variant="primary"
                onClick={handleSave}
              >
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </AdminButton>
            ) : (
              <AdminButton
                size="sm"
                variant="primary"
                onClick={() => setIsDrawerOpen(false)}
              >
                Tutup
              </AdminButton>
            )}
          </>
        )}
        description={selectedEntry ? `${selectedEntry.id} • ${formatSource(selectedEntry)}` : 'Catat transaksi kas masuk, keluar, atau transfer internal.'}
        isOpen={isDrawerOpen}
        title={selectedEntry ? (isReadOnly ? 'Detail Transaksi' : 'Edit Transaksi') : 'Tambah Catatan Kas'}
        widthClass="max-w-xl"
        onClose={() => setIsDrawerOpen(false)}
      >
        <div className="grid gap-4">
          {isReadOnly ? (
            <div className="rounded-[1.15rem] border border-studio-purple/32 bg-studio-purple/10 p-3.5 text-xs font-semibold leading-5 text-[var(--ui-text-strong)] ring-1 ring-studio-purple/14">
              Catatan otomatis dari {formatSource(selectedEntry)} bersifat read-only dan tidak dapat dimodifikasi di Pembukuan.
            </div>
          ) : null}

          {validationError ? (
            <div className="rounded-[1.15rem] border border-studio-accent/32 bg-studio-accent/10 p-3.5 text-xs font-semibold leading-5 text-studio-accent ring-1 ring-studio-accent/14">
              {validationError}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-[0.12em]">
              Tipe Transaksi
              <select
                disabled={isReadOnly || selectedEntry !== null}
                className="min-h-11 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition disabled:opacity-60 focus:border-studio-accent/55"
                value={formType}
                onChange={(e) => handleTypeChange(e.target.value)}
              >
                <option value="income">Pemasukan (Income)</option>
                <option value="expense">Pengeluaran (Expense)</option>
                <option value="transfer">Transfer Internal</option>
              </select>
            </label>

            <label className="grid gap-1.5 text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-[0.12em]">
              Tanggal
              <input
                disabled={isReadOnly}
                className="min-h-11 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition disabled:opacity-60 focus:border-studio-accent/55"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-[0.12em]">
              Kategori
              <select
                disabled={isReadOnly || formType === 'transfer'}
                className="min-h-11 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition disabled:opacity-60 focus:border-studio-accent/55"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-[0.12em]">
              Metode Pembayaran
              <select
                disabled={isReadOnly || formType === 'transfer'}
                className="min-h-11 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition disabled:opacity-60 focus:border-studio-accent/55"
                value={formPaymentMethod}
                onChange={(e) => setFormPaymentMethod(e.target.value)}
              >
                {standardAccounts.filter((a) => a.key !== 'all').map((opt) => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-[0.12em]">
              {formType === 'transfer' ? 'Akun Asal (From)' : 'Akun Kas'}
              <select
                disabled={isReadOnly}
                className="min-h-11 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition disabled:opacity-60 focus:border-studio-accent/55"
                value={formAccount}
                onChange={(e) => setFormAccount(e.target.value)}
              >
                {standardAccounts.filter((a) => a.key !== 'all').map((opt) => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </label>

            {formType === 'transfer' ? (
              <label className="grid gap-1.5 text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-[0.12em]">
                Akun Tujuan (To)
                <select
                  disabled={isReadOnly}
                  className="min-h-11 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition disabled:opacity-60 focus:border-studio-accent/55"
                  value={formTargetAccount}
                  onChange={(e) => setFormTargetAccount(e.target.value)}
                >
                  {standardAccounts.filter((a) => a.key !== 'all').map((opt) => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="grid gap-1.5 text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-[0.12em]">
                Nominal (IDR)
                <input
                  disabled={isReadOnly}
                  className="min-h-11 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition disabled:opacity-60 focus:border-studio-accent/55 placeholder:text-[var(--ui-text-soft)]"
                  placeholder="Contoh: 150000"
                  type="number"
                  min="1"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                />
              </label>
            )}
          </div>

          {formType === 'transfer' ? (
            <label className="grid gap-1.5 text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-[0.12em]">
              Nominal Transfer (IDR)
              <input
                disabled={isReadOnly}
                className="min-h-11 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition disabled:opacity-60 focus:border-studio-accent/55 placeholder:text-[var(--ui-text-soft)]"
                placeholder="Contoh: 150000"
                type="number"
                min="1"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
              />
            </label>
          ) : null}

          <label className="grid gap-1.5 text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-[0.12em]">
            Deskripsi
            <input
              disabled={isReadOnly}
              className="min-h-11 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition disabled:opacity-60 focus:border-studio-accent/55 placeholder:text-[var(--ui-text-soft)]"
              placeholder={formType === 'transfer' ? 'Misal: Pemindahan kas bulanan' : 'Misal: Pembayaran Listrik bulanan'}
              type="text"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-[0.12em]">
            Catatan Tambahan
            <textarea
              disabled={isReadOnly}
              className="min-h-20 resize-none rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 py-2 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition disabled:opacity-60 focus:border-studio-accent/55 placeholder:text-[var(--ui-text-soft)]"
              placeholder="Tambahkan informasi pelengkap..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </label>
        </div>
      </AdminDrawer>

      <BookkeepingComingSoonPanel />
    </AdminPageShell>
  );
}
