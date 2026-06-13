import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import { cn } from '../lib/cn.js';
import ExcelJS from 'exceljs';
import {
  BookOpenCheck,
  CalendarDays,
  CircleDollarSign,
  FileText,
  TrendingDown,
  TrendingUp,
  WalletCards,
  Search,
  Check,
  Plus,
  Printer,
  Download,
  SlidersHorizontal,
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
    <AdminPanel className="bookkeeping-summary-card grid gap-1.5 p-2.5 sm:gap-2.5 sm:p-3.5" variant="flat">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <span className="grid min-w-0 gap-0.5">
          <span className="text-[0.58rem] sm:text-[0.62rem] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.16em] text-[var(--ui-text-muted)] truncate">
            {label}
          </span>
          <strong className="text-[0.88rem] xs:text-[0.98rem] sm:text-xl font-bold leading-none tracking-tight text-[var(--ui-text-strong)] sm:tracking-[-0.05em] sm:font-semibold">
            {value}
          </strong>
        </span>

        <AdminBadge tone={tone} className="shrink-0 max-h-7">
          <Icon size={13} strokeWidth={2.35} aria-hidden="true" />
        </AdminBadge>
      </div>

      <p className="m-0 text-[0.58rem] sm:text-[0.68rem] font-medium leading-normal text-[var(--ui-text-muted)] truncate">
        {helper}
      </p>
    </AdminPanel>
  );
}

// BookkeepingComingSoonPanel has been removed in BOOKKEEPING.7

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
  if (!entry) return '-';
  if (entry.transactionAt) {
    const date = new Date(entry.transactionAt);
    if (!Number.isNaN(date.getTime())) {
      const formattedDate = new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
      const formattedTime = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
      return `${formattedDate} ${formattedTime}`;
    }
  }
  return formatBookkeepingDate(entry.date);
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

function getTransferTargetAccountKey(entry) {
  if (!entry || entry.type !== 'transfer') return null;
  const targetMatch = (entry.notes || '').match(/Target Account: (.*)/);
  if (targetMatch && targetMatch[1]) {
    const targetLabel = targetMatch[1].trim();
    const found = standardAccounts.find((a) => a.label.toLowerCase() === targetLabel.toLowerCase());
    return found ? found.key : null;
  }
  return null;
}

function getEntryFlow(entry, activeAccount) {
  const amt = Number(entry.amount) || 0;
  if (!activeAccount || activeAccount === 'all') {
    if (entry.type === 'income') {
      return { type: 'income', amount: amt };
    }
    if (entry.type === 'expense') {
      return { type: 'expense', amount: amt };
    }
    return { type: 'neutral', amount: 0 };
  } else {
    if (entry.type === 'income' && entry.accountId === activeAccount) {
      return { type: 'income', amount: amt };
    }
    if (entry.type === 'expense' && entry.accountId === activeAccount) {
      return { type: 'expense', amount: amt };
    }
    if (entry.type === 'transfer') {
      const targetKey = getTransferTargetAccountKey(entry);
      if (entry.accountId === activeAccount) {
        return { type: 'expense', amount: amt };
      }
      if (targetKey === activeAccount) {
        return { type: 'income', amount: amt };
      }
    }
    return { type: 'neutral', amount: 0 };
  }
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

function BillingImportSuggestionsPanel({
  suggestions = [],
  onImport,
}) {
  return (
    <AdminPanel className="grid gap-3" variant="flat">
      <div className="flex items-center justify-between border-b border-[var(--ui-border)] pb-2.5">
        <h3 className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-[var(--ui-text-strong)] flex items-center gap-2">
          <WalletCards size={15} className="text-studio-accent" />
          Saran Impor Billing
        </h3>
        <AdminBadge tone="purple">
          {suggestions.length} Baru
        </AdminBadge>
      </div>

      {suggestions.length > 0 ? (
        <div className="grid gap-2 max-h-[460px] overflow-y-auto pr-1">
          {suggestions.map((item) => (
            <div
              className="grid gap-2 rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-3 ring-1 ring-[var(--ui-ring)]"
              key={item.id}
            >
              <div className="grid gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[var(--ui-text-muted)] truncate">
                    {item.invoiceNumber}
                  </span>
                  <span className="text-[0.58rem] font-semibold text-studio-cyan whitespace-nowrap bg-studio-cyan/10 border border-studio-cyan/20 rounded-md px-1.5 py-0.5">
                    {formatPaymentMethod(item.paymentMethod)}
                  </span>
                </div>
                <strong className="truncate text-xs font-semibold text-[var(--ui-text-strong)]">
                  {item.customerName}
                </strong>
                <span className="text-[0.62rem] text-[var(--ui-text-muted)] font-medium">
                  {formatBookkeepingDate(item.createdAt.slice(0, 10))}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1.5 border-t border-[var(--ui-border)]">
                <span className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
                  Diterima
                </span>
                <strong className="text-xs font-bold text-studio-cyan">
                  {formatBookkeepingCurrency(item.paidAmount)}
                </strong>
              </div>

              <AdminButton
                className="w-full min-h-8 text-xs mt-1"
                icon={Plus}
                size="sm"
                variant="soft"
                onClick={() => onImport(item)}
              >
                Impor Kas
              </AdminButton>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid min-h-[8rem] place-items-center text-center p-3">
          <div className="grid gap-1.5 justify-items-center">
            <span className="grid size-8 place-items-center rounded-full border border-studio-cyan/22 bg-studio-cyan/10 text-studio-cyan">
              <Check size={16} strokeWidth={2.5} />
            </span>
            <strong className="text-xs font-semibold text-[var(--ui-text-strong)]">
              Billing Terintegrasi
            </strong>
            <p className="m-0 text-[0.65rem] leading-4 text-[var(--ui-text-muted)] max-w-[200px]">
              Semua pembayaran invoice lunas/DP sudah masuk pembukuan.
            </p>
          </div>
        </div>
      )}
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

  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'reports'
  const [selectedReportMonth, setSelectedReportMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('month');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

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

  // Compute suggestion items for importing
  const billingImportSuggestions = useMemo(() => {
    const importedIds = new Set(
      bookkeepingEntries
        .filter((entry) => entry.sourceType === 'billing' && entry.sourceId)
        .map((entry) => entry.sourceId)
    );

    return billingTransactions.filter((transaction) => {
      const isPaidOrDp = transaction.paidAmount > 0;
      return isPaidOrDp && !importedIds.has(transaction.id);
    });
  }, [bookkeepingEntries, billingTransactions]);

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

  // Available months options computed dynamically
  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    monthsSet.add(currentMonthKey);
    bookkeepingEntries.forEach((entry) => {
      if (entry.date && entry.date.length >= 7) {
        monthsSet.add(entry.date.slice(0, 7));
      }
    });
    return Array.from(monthsSet).sort().reverse().map((mKey) => {
      const [year, month] = mKey.split('-');
      const date = new Date(Number(year), Number(month) - 1, 1);
      const label = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
      return { key: mKey, label };
    });
  }, [bookkeepingEntries]);

  // Report performance metrics calculations
  const reportMetrics = useMemo(() => {
    const monthEntries = bookkeepingEntries.filter(
      (entry) => entry.date && entry.date.startsWith(selectedReportMonth)
    );

    let totalIncome = 0;
    let totalExpense = 0;

    const incomeMap = {};
    const expenseMap = {};
    const methodMap = {};

    monthEntries.forEach((entry) => {
      const amt = Number(entry.amount) || 0;
      if (entry.type === 'income') {
        totalIncome += amt;
        incomeMap[entry.categoryName] = (incomeMap[entry.categoryName] || 0) + amt;
      } else if (entry.type === 'expense') {
        totalExpense += amt;
        expenseMap[entry.categoryName] = (expenseMap[entry.categoryName] || 0) + amt;
      }

      const methodLabel = formatPaymentMethod(entry.paymentMethod);
      methodMap[methodLabel] = (methodMap[methodLabel] || 0) + (entry.type === 'income' ? amt : -amt);
    });

    return {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      incomeCategories: Object.entries(incomeMap).map(([name, amount]) => ({ name, amount })),
      expenseCategories: Object.entries(expenseMap).map(([name, amount]) => ({ name, amount })),
      paymentMethods: Object.entries(methodMap).map(([name, amount]) => ({ name, amount })),
    };
  }, [bookkeepingEntries, selectedReportMonth]);

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
      const targetLabel = targetMatch[1].trim();
      const matchKey = standardAccounts.find((a) => a.label.toLowerCase() === targetLabel.toLowerCase())?.key || 'transfer';
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
        transactionAt: new Date(formDate + 'T12:00:00').toISOString(),
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

  const handleImportBillingTransaction = async (transaction) => {
    const actor = {
      displayName: adminUser?.displayName || adminUser?.email || 'Admin',
      email: adminUser?.email || '',
      uid: adminUser?.uid || '',
    };

    const entryId = 'bookkeeping-billing-' + transaction.id;

    let categoryId = 'studio_rent';
    let categoryName = 'Sewa Studio';

    if (transaction.items && transaction.items.length > 0) {
      const firstItemCategory = transaction.items[0].category;
      if (firstItemCategory === 'manual_pos' || firstItemCategory === 'service') {
        categoryId = 'pos_sale';
        categoryName = 'Penjualan POS';
      }
    }

    const cleanPaymentMethod = String(transaction.paymentMethod || 'cash').trim().toLowerCase();
    const matchedAccount = standardAccounts.find((a) => a.key === cleanPaymentMethod) || { key: 'cash', label: 'Cash' };
    const transactionAt = transaction.createdAt || new Date().toISOString();
    const transactionDate = new Date(transactionAt).toLocaleDateString('sv-SE');

    const payload = {
      amount: Number(transaction.paidAmount) || 0,
      categoryId,
      categoryName,
      createdAt: new Date().toISOString(),
      createdBy: actor,
      date: transactionDate,
      description: `Pembayaran Invoice ${transaction.invoiceNumber} - ${transaction.customerName}`,
      direction: 'in',
      id: entryId,
      notes: `Diimpor otomatis dari Invoice ${transaction.invoiceNumber}. Catatan invoice: ${transaction.notes || ''}`,
      paymentMethod: cleanPaymentMethod,
      sourceId: transaction.id,
      sourceLabel: transaction.invoiceNumber,
      sourceType: 'billing',
      studioId: 'main-studio',
      transactionAt,
      type: 'income',
      updatedAt: new Date().toISOString(),
      updatedBy: actor,
      accountId: matchedAccount.key,
      accountName: matchedAccount.label,
    };

    try {
      await createBookkeepingEntry(payload);
      await recordBookkeepingAuditLog({
        action: 'bookkeeping.import_billing',
        entryId: payload.id,
        entrySnapshot: payload,
        by: actor,
      });
    } catch (error) {
      console.error('Failed to import billing transaction.', error);
      alert('Gagal mengimpor transaksi billing.');
    }
  };

  const handleExportExcel = async () => {
    if (entriesWithRunningBalance.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Buku Besar');

      // Set grid lines visible
      worksheet.views = [{ showGridLines: true }];

      // Define styling constants
      const primaryColor = '111017'; // Dark Studio Night
      const accentColor = 'FF4A9B'; // Studio Accent Pink
      const zebraColor = 'F9F8FA'; // Subtle background striping
      const borderColor = 'E4E2E6'; // Light border color

      // 1. Title Block
      // Row 1: Merged Title
      worksheet.mergeCells('A1:K1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = '37 MUSIC STUDIO - BUKU BESAR';
      titleCell.font = { name: 'Plus Jakarta Sans', family: 4, size: 16, bold: true, color: { argb: 'FFFFFF' } };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: primaryColor }
      };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(1).height = 40;

      // Row 2: Sub-info
      worksheet.mergeCells('A2:K2');
      const infoCell = worksheet.getCell('A2');
      const dateStr = new Date().toLocaleDateString('id-ID', { dateStyle: 'long' });
      infoCell.value = `Dicetak pada: ${dateStr} • Studio OS Bookkeeping Report`;
      infoCell.font = { name: 'Plus Jakarta Sans', family: 4, size: 9, italic: true, color: { argb: '6B7280' } };
      infoCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(2).height = 20;

      // Leave A3 empty for spacing
      worksheet.getRow(3).height = 10;

      // 2. Table Headers (Row 4)
      const headers = [
        'Tanggal',
        'Tipe',
        'Kategori',
        'Deskripsi',
        'Akun',
        'Metode',
        'Masuk (IDR)',
        'Keluar (IDR)',
        'Saldo (IDR)',
        'Sumber',
        'Catatan'
      ];
      
      const headerRow = worksheet.getRow(4);
      headerRow.values = headers;
      headerRow.height = 26;

      headerRow.eachCell((cell) => {
        cell.font = { name: 'Plus Jakarta Sans', family: 4, size: 10, bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '1F1E26' } // Slightly lighter primary for header
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: '373540' } },
          left: { style: 'thin', color: { argb: '373540' } },
          bottom: { style: 'medium', color: { argb: primaryColor } },
          right: { style: 'thin', color: { argb: '373540' } }
        };
      });

      // 3. Write Data Rows
      let currentRowIndex = 5;
      
      entriesWithRunningBalance.forEach((entry, idx) => {
        const formattedDate = formatBookkeepingDateTime(entry);
        const flow = getEntryFlow(entry, accountFilter);
        const incomeVal = flow.type === 'income' ? flow.amount : 0;
        const expenseVal = flow.type === 'expense' ? flow.amount : 0;
        const sourceStr = formatSource(entry);
        const notesClean = (entry.notes || '');

        let typeLabel = 'Transfer';
        if (entry.type === 'income') typeLabel = 'Masuk';
        else if (entry.type === 'expense') typeLabel = 'Keluar';

        const rowValues = [
          formattedDate,
          typeLabel,
          entry.categoryName || '',
          entry.description || '',
          entry.accountName || '',
          formatPaymentMethod(entry.paymentMethod),
          incomeVal || null,
          expenseVal || null,
          entry.runningBalance,
          sourceStr,
          notesClean
        ];

        const row = worksheet.getRow(currentRowIndex);
        row.values = rowValues;
        row.height = 22;

        const isEven = idx % 2 === 0;

        // Apply cell stylings
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.font = { name: 'Plus Jakarta Sans', family: 4, size: 9.5, color: { argb: '111017' } };
          
          // Default Border
          cell.border = {
            top: { style: 'thin', color: { argb: borderColor } },
            left: { style: 'thin', color: { argb: borderColor } },
            bottom: { style: 'thin', color: { argb: borderColor } },
            right: { style: 'thin', color: { argb: borderColor } }
          };

          // Zebra Striping Fill
          if (isEven) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: zebraColor }
            };
          }

          // Alignment based on column
          if ([1, 2, 5, 6].includes(colNumber)) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else if ([7, 8, 9].includes(colNumber)) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFormat = '"Rp"#,##0;[Red]("-Rp"#,##0);"-"';
            
            if (colNumber === 7 && incomeVal > 0) {
              cell.font = { name: 'Plus Jakarta Sans', family: 4, size: 9.5, bold: true, color: { argb: '0E7490' } };
            } else if (colNumber === 8 && expenseVal > 0) {
              cell.font = { name: 'Plus Jakarta Sans', family: 4, size: 9.5, bold: true, color: { argb: 'BE185D' } };
            } else if (colNumber === 9) {
              const isProfit = entry.runningBalance >= 0;
              cell.font = { 
                name: 'Plus Jakarta Sans', 
                family: 4, 
                size: 9.5, 
                bold: true, 
                color: { argb: isProfit ? '0E7490' : 'BE185D' } 
              };
            }
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
          }
        });

        currentRowIndex++;
      });

      // 4. Totals Row
      const totalsRowIndex = currentRowIndex;
      const totalsRow = worksheet.getRow(totalsRowIndex);
      totalsRow.height = 24;

      let totalIncomeSum = 0;
      let totalExpenseSum = 0;
      entriesWithRunningBalance.forEach((entry) => {
        const flow = getEntryFlow(entry, accountFilter);
        if (flow.type === 'income') totalIncomeSum += flow.amount;
        if (flow.type === 'expense') totalExpenseSum += flow.amount;
      });

      const endingBalance = entriesWithRunningBalance[0]?.runningBalance ?? 0;

      const totalsValues = [];
      totalsValues[1] = 'TOTAL';
      totalsValues[7] = totalIncomeSum || null;
      totalsValues[8] = totalExpenseSum || null;
      totalsValues[9] = endingBalance;
      totalsRow.values = totalsValues;

      worksheet.mergeCells(`A${totalsRowIndex}:F${totalsRowIndex}`);

      totalsRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = { name: 'Plus Jakarta Sans', family: 4, size: 10, bold: true, color: { argb: '111017' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F1EEF4' }
        };

        cell.border = {
          top: { style: 'thin', color: { argb: '111017' } },
          bottom: { style: 'double', color: { argb: '111017' } },
          left: { style: 'thin', color: { argb: borderColor } },
          right: { style: 'thin', color: { argb: borderColor } }
        };

        if (colNumber >= 7 && colNumber <= 9) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFormat = '"Rp"#,##0;[Red]("-Rp"#,##0);"-"';
          
          if (colNumber === 7) cell.font = { name: 'Plus Jakarta Sans', family: 4, size: 10, bold: true, color: { argb: '0E7490' } };
          if (colNumber === 8) cell.font = { name: 'Plus Jakarta Sans', family: 4, size: 10, bold: true, color: { argb: 'BE185D' } };
          if (colNumber === 9) {
            const isProfit = endingBalance >= 0;
            cell.font = { 
              name: 'Plus Jakarta Sans', 
              family: 4, 
              size: 10, 
              bold: true, 
              color: { argb: isProfit ? '0E7490' : 'BE185D' } 
            };
          }
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });

      // 5. Auto-fit Column Widths
      worksheet.columns.forEach((column, colIdx) => {
        let maxLen = 0;
        
        column.eachCell({ includeEmpty: true }, (cell, rowIdx) => {
          if (rowIdx > 3) {
            const cellVal = cell.value;
            let valStr = '';
            
            if (cellVal instanceof Date) {
              valStr = cellVal.toISOString().slice(0, 10);
            } else if (cellVal && typeof cellVal === 'object' && cellVal.richText) {
              valStr = cellVal.richText.map(t => t.text).join('');
            } else if (cellVal !== null && cellVal !== undefined) {
              valStr = String(cellVal);
            }
            
            if ([7, 8, 9].includes(colIdx + 1) && typeof cellVal === 'number') {
              valStr = `Rp ${cellVal.toLocaleString('id-ID')}`;
            }

            if (valStr.length > maxLen) {
              maxLen = valStr.length;
            }
          }
        });

        column.width = Math.max(12, maxLen + 3);
      });

      // 6. Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      
      const fileDateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `Laporan_Buku_Besar_${fileDateStr}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Failed to export Excel report:', error);
      alert('Gagal mengekspor laporan ke Excel.');
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
      const flow = getEntryFlow(entry, accountFilter);
      if (flow.type === 'income') {
        cumulative += flow.amount;
      } else if (flow.type === 'expense') {
        cumulative -= flow.amount;
      }
      balanceMap[entry.id] = cumulative;
    });

    const sortedFiltered = [...filteredEntries].sort((a, b) => {
      const timeA = new Date(a.transactionAt || a.date || a.createdAt || 0).getTime();
      const timeB = new Date(b.transactionAt || b.date || b.createdAt || 0).getTime();
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return String(b.id || '').localeCompare(String(a.id || ''));
    });

    return sortedFiltered.map((entry) => ({
      ...entry,
      runningBalance: balanceMap[entry.id] ?? 0,
    }));
  }, [bookkeepingEntries, filteredEntries, accountFilter]);

  const summaryMetrics = useMemo(() => {
    let income = 0;
    let expense = 0;

    filteredEntries.forEach((entry) => {
      const flow = getEntryFlow(entry, accountFilter);
      if (flow.type === 'income') {
        income += flow.amount;
      } else if (flow.type === 'expense') {
        expense += flow.amount;
      }
    });

    const allTimeBalance = bookkeepingEntries.reduce((sum, entry) => {
      const flow = getEntryFlow(entry, accountFilter);
      if (flow.type === 'income') {
        return sum + flow.amount;
      }
      if (flow.type === 'expense') {
        return sum - flow.amount;
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
  }, [bookkeepingEntries, filteredEntries, accountFilter]);

  // Render variables for Monthly Reports breakdown shares
  const maxIncomeReport = useMemo(() => {
    return Math.max(...reportMetrics.incomeCategories.map((c) => c.amount), 1);
  }, [reportMetrics.incomeCategories]);

  const maxExpenseReport = useMemo(() => {
    return Math.max(...reportMetrics.expenseCategories.map((c) => c.amount), 1);
  }, [reportMetrics.expenseCategories]);

  return (
    <AdminPageShell className="bookkeeping-admin-workspace gap-2 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-0 md:gap-3 md:pb-3 md:pt-0" width="wide">
      <div className="sr-only" id="bookkeeping-admin-title">
        Pembukuan 37 Music Studio
      </div>

      <div className="print:hidden">
        <AdminPageHeader
          actions={(
            <>
              <AdminButton
                className="!rounded-full px-5"
                icon={Download}
                variant="secondary"
                onClick={handleExportExcel}
              >
                Ekspor Excel
              </AdminButton>

              <AdminButton
                className="!rounded-full px-5"
                icon={CircleDollarSign}
                variant="primary"
                onClick={handleAddNew}
              >
                Tambah catatan
              </AdminButton>
            </>
          )}
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
      </div>

      <section className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-6 print:hidden" aria-label="Ringkasan pembukuan">
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

      {/* Tab Navigation */}
      <div className="flex border-b border-[var(--ui-border)] pb-2.5 print:hidden">
        <div className="flex gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-1 ring-1 ring-[var(--ui-ring)]">
          <button
            aria-pressed={activeTab === 'ledger'}
            className={
              activeTab === 'ledger'
                ? 'min-h-9 rounded-full bg-[var(--ui-control-hover)] px-5 text-xs font-semibold text-studio-accent shadow-[var(--ui-shadow-control)]'
                : 'min-h-9 rounded-full px-5 text-xs font-semibold text-[var(--ui-text-muted)] transition hover:bg-[var(--ui-control)] hover:text-[var(--ui-text-strong)]'
            }
            type="button"
            onClick={() => setActiveTab('ledger')}
          >
            Buku Besar
          </button>
          <button
            aria-pressed={activeTab === 'reports'}
            className={
              activeTab === 'reports'
                ? 'min-h-9 rounded-full bg-[var(--ui-control-hover)] px-5 text-xs font-semibold text-studio-accent shadow-[var(--ui-shadow-control)]'
                : 'min-h-9 rounded-full px-5 text-xs font-semibold text-[var(--ui-text-muted)] transition hover:bg-[var(--ui-control)] hover:text-[var(--ui-text-strong)]'
            }
            type="button"
            onClick={() => setActiveTab('reports')}
          >
            Laporan Keuangan
          </button>
        </div>
      </div>

      {activeTab === 'ledger' ? (
        <div className="grid gap-2 md:gap-3">
          <AdminCommandBar className="bookkeeping-command-bar flex flex-col gap-3 p-2.5">
            {/* Main row: Search and Filter Toggle */}
            <div className="flex items-center gap-2 w-full">
              <label className="flex flex-1 min-h-11 items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-3.5 ring-1 ring-[var(--ui-ring)] focus-within:border-studio-accent/55 focus-within:ring-4 focus-within:ring-studio-accent/20">
                <Search className="shrink-0 text-[var(--ui-text-muted)]" size={15} strokeWidth={2.35} aria-hidden="true" />
                <input
                  className="w-full border-0 bg-transparent text-sm font-semibold text-[var(--ui-text-strong)] outline-none placeholder:text-[var(--ui-text-soft)]"
                  placeholder="Cari deskripsi, kategori, atau akun..."
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>

              {/* Toggle button on mobile, hidden on lg */}
              <AdminButton
                className="lg:hidden !rounded-full px-4 min-h-11 gap-1.5"
                icon={SlidersHorizontal}
                variant={showFilters ? 'primary' : 'secondary'}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filter
              </AdminButton>
            </div>

            {/* Filters panel: always visible on lg, collapsible on mobile */}
            <div className={cn(
              "w-full flex-col gap-3 lg:flex lg:flex-row lg:items-center lg:flex-wrap lg:gap-3",
              showFilters ? "flex pt-2.5 border-t border-[var(--ui-border)] lg:pt-0 lg:border-t-0" : "hidden lg:flex"
            )}>
              {/* Period Filter */}
              <div className="grid grid-cols-3 gap-0.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-0.5 ring-1 ring-[var(--ui-ring)] lg:inline-flex lg:w-auto">
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

              {/* Type Filter */}
              <div className="grid grid-cols-4 gap-0.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-0.5 ring-1 ring-[var(--ui-ring)] lg:inline-flex lg:w-auto">
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

              {/* Dropdowns */}
              <div className="grid grid-cols-2 gap-2 w-full lg:flex lg:w-auto lg:items-center">
                <AdminDropdown
                  className="min-w-0 lg:min-w-[150px]"
                  buttonClassName="!rounded-full px-4"
                  hideLabel
                  label="Kategori"
                  options={dynamicCategories}
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                />

                <AdminDropdown
                  className="min-w-0 lg:min-w-[150px]"
                  buttonClassName="!rounded-full px-4"
                  hideLabel
                  label="Akun"
                  options={dynamicAccounts}
                  value={accountFilter}
                  onChange={setAccountFilter}
                />
              </div>
            </div>
          </AdminCommandBar>

          <div className="grid gap-3 lg:grid-cols-[1fr_340px] lg:items-start md:gap-3.5">
            <div className="grid gap-2 min-w-0 md:gap-3">
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
                      {entriesWithRunningBalance.map((entry) => {
                        const flow = getEntryFlow(entry, accountFilter);
                        return (
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
                              {flow.type === 'income' ? formatBookkeepingCurrency(flow.amount) : '-'}
                            </td>
                            <td className="p-3.5 text-right font-bold text-studio-accent whitespace-nowrap">
                              {flow.type === 'expense' ? formatBookkeepingCurrency(flow.amount) : '-'}
                            </td>
                            <td className="p-3.5 text-right font-semibold text-[var(--ui-text-strong)] whitespace-nowrap">
                              {formatBookkeepingCurrency(entry.runningBalance, true)}
                            </td>
                            <td className="p-3.5 font-medium text-[var(--ui-text-muted)] whitespace-nowrap">
                              {formatSource(entry)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </AdminTableShell>
              ) : (
                <LedgerEmptyState hasEntries={bookkeepingEntries.length > 0} />
              )}
            </div>

            <BillingImportSuggestionsPanel
              suggestions={billingImportSuggestions}
              onImport={handleImportBillingTransaction}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-3.5">
          {/* Print Header */}
          <div className="hidden print:block text-center border-b border-[var(--ui-border-strong)] pb-5 mb-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--ui-text-strong)]">
              LAPORAN KEUANGAN BULANAN
            </h1>
            <p className="text-sm font-semibold text-[var(--ui-text-muted)] mt-1">
              37 Music Studio • Periode: {availableMonths.find((m) => m.key === selectedReportMonth)?.label || selectedReportMonth}
            </p>
          </div>

          {/* Month Selector Panel */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-3 ring-1 ring-[var(--ui-ring)] print:hidden">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[var(--ui-text-strong)] uppercase tracking-[0.1em]">
                Pilih Bulan Laporan:
              </span>
              <AdminDropdown
                className="min-w-[200px]"
                hideLabel
                options={availableMonths}
                value={selectedReportMonth}
                onChange={setSelectedReportMonth}
              />
            </div>

            <AdminButton
              icon={Printer}
              variant="secondary"
              onClick={() => window.print()}
            >
              Cetak Laporan
            </AdminButton>
          </div>

          {/* Monthly Metrics Summary */}
          <section className="grid grid-cols-3 gap-1.5 sm:gap-2" aria-label="Ringkasan bulan laporan">
            <AdminPanel className="grid gap-1 p-2.5 sm:gap-2 sm:p-4" variant="flat">
              <span className="text-[0.55rem] sm:text-[0.62rem] font-bold uppercase tracking-[0.1em] sm:tracking-[0.14em] text-[var(--ui-text-muted)] truncate">
                Pemasukan
              </span>
              <strong className="text-[0.82rem] xs:text-[0.92rem] sm:text-xl md:text-2xl font-bold tracking-tight text-studio-cyan whitespace-nowrap">
                {formatBookkeepingCurrency(reportMetrics.totalIncome)}
              </strong>
              <p className="m-0 text-[0.55rem] sm:text-[0.65rem] text-[var(--ui-text-muted)] font-medium hidden xs:block">
                Total kas masuk terbukukan.
              </p>
            </AdminPanel>
            <AdminPanel className="grid gap-1 p-2.5 sm:gap-2 sm:p-4" variant="flat">
              <span className="text-[0.55rem] sm:text-[0.62rem] font-bold uppercase tracking-[0.1em] sm:tracking-[0.14em] text-[var(--ui-text-muted)] truncate">
                Pengeluaran
              </span>
              <strong className="text-[0.82rem] xs:text-[0.92rem] sm:text-xl md:text-2xl font-bold tracking-tight text-studio-accent whitespace-nowrap">
                {formatBookkeepingCurrency(reportMetrics.totalExpense)}
              </strong>
              <p className="m-0 text-[0.55rem] sm:text-[0.65rem] text-[var(--ui-text-muted)] font-medium hidden xs:block">
                Total kas keluar terbukukan.
              </p>
            </AdminPanel>
            <AdminPanel className="grid gap-1 p-2.5 sm:gap-2 sm:p-4" variant="flat">
              <span className="text-[0.55rem] sm:text-[0.62rem] font-bold uppercase tracking-[0.1em] sm:tracking-[0.14em] text-[var(--ui-text-muted)] truncate">
                Laba Bersih
              </span>
              <strong className={`text-[0.82rem] xs:text-[0.92rem] sm:text-xl md:text-2xl font-bold tracking-tight whitespace-nowrap ${reportMetrics.netProfit >= 0 ? 'text-studio-cyan' : 'text-studio-accent'}`}>
                {formatBookkeepingCurrency(reportMetrics.netProfit, true)}
              </strong>
              <p className="m-0 text-[0.55rem] sm:text-[0.65rem] text-[var(--ui-text-muted)] font-medium hidden xs:block">
                Selisih pemasukan - pengeluaran.
              </p>
            </AdminPanel>
          </section>

          {/* Category breakdowns & Payment methods breakdowns */}
          <div className="grid gap-3.5 lg:grid-cols-[1fr_360px] lg:items-start">
            <div className="grid gap-3.5">
              {/* Income Categories Shares */}
              <AdminPanel className="grid gap-2.5 p-3 sm:gap-4 sm:p-4" variant="default">
                <h3 className="m-0 text-xs sm:text-sm font-semibold tracking-[-0.02em] text-[var(--ui-text-strong)] flex items-center gap-2 pb-2 border-b border-[var(--ui-border)]">
                  <TrendingUp size={16} className="text-studio-cyan" />
                  Rincian Kategori Pemasukan
                </h3>
                {reportMetrics.incomeCategories.length > 0 ? (
                  <div className="grid gap-3">
                    {reportMetrics.incomeCategories.map((cat) => {
                      const percentage = Math.round((cat.amount / reportMetrics.totalIncome) * 100) || 0;
                      const widthPercentage = Math.round((cat.amount / maxIncomeReport) * 100) || 0;
                      return (
                        <div key={cat.name} className="grid gap-1">
                          <div className="flex justify-between text-xs font-semibold text-[var(--ui-text-strong)]">
                            <span>{cat.name} ({percentage}%)</span>
                            <span>{formatBookkeepingCurrency(cat.amount)}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-[var(--ui-control)] overflow-hidden ring-1 ring-[var(--ui-ring)]">
                            <div
                              className="h-full rounded-full bg-studio-cyan"
                              style={{ width: `${widthPercentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="m-0 text-xs text-[var(--ui-text-muted)] font-medium py-2 text-center">
                    Tidak ada pemasukan tercatat di bulan ini.
                  </p>
                )}
              </AdminPanel>

              {/* Expense Categories Shares */}
              <AdminPanel className="grid gap-2.5 p-3 sm:gap-4 sm:p-4" variant="default">
                <h3 className="m-0 text-xs sm:text-sm font-semibold tracking-[-0.02em] text-[var(--ui-text-strong)] flex items-center gap-2 pb-2 border-b border-[var(--ui-border)]">
                  <TrendingDown size={16} className="text-studio-accent" />
                  Rincian Kategori Pengeluaran
                </h3>
                {reportMetrics.expenseCategories.length > 0 ? (
                  <div className="grid gap-3">
                    {reportMetrics.expenseCategories.map((cat) => {
                      const percentage = Math.round((cat.amount / reportMetrics.totalExpense) * 100) || 0;
                      const widthPercentage = Math.round((cat.amount / maxExpenseReport) * 100) || 0;
                      return (
                        <div key={cat.name} className="grid gap-1">
                          <div className="flex justify-between text-xs font-semibold text-[var(--ui-text-strong)]">
                            <span>{cat.name} ({percentage}%)</span>
                            <span>{formatBookkeepingCurrency(cat.amount)}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-[var(--ui-control)] overflow-hidden ring-1 ring-[var(--ui-ring)]">
                            <div
                              className="h-full rounded-full bg-studio-accent"
                              style={{ width: `${widthPercentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="m-0 text-xs text-[var(--ui-text-muted)] font-medium py-2 text-center">
                    Tidak ada pengeluaran tercatat di bulan ini.
                  </p>
                )}
              </AdminPanel>
            </div>

            {/* Cashflow by Payment Methods */}
            <AdminPanel className="grid gap-2.5 p-3 sm:gap-4 sm:p-4" variant="default">
              <h3 className="m-0 text-xs sm:text-sm font-semibold tracking-[-0.02em] text-[var(--ui-text-strong)] flex items-center gap-2 pb-2 border-b border-[var(--ui-border)]">
                <WalletCards size={16} className="text-studio-accent" />
                Arus Kas Metode Pembayaran
              </h3>
              {reportMetrics.paymentMethods.length > 0 ? (
                <div className="grid gap-3">
                  {reportMetrics.paymentMethods.map((pm) => {
                    const isPositive = pm.amount >= 0;
                    return (
                      <div
                        className="flex items-center justify-between rounded-lg border border-[var(--ui-border)] bg-[var(--ui-control)] p-3 ring-1 ring-[var(--ui-ring)]"
                        key={pm.name}
                      >
                        <span className="text-xs font-bold text-[var(--ui-text-strong)]">
                          {pm.name}
                        </span>
                        <div className="text-right">
                          <strong className={`text-xs font-bold ${isPositive ? 'text-studio-cyan' : 'text-studio-accent'}`}>
                            {isPositive ? '+' : ''}{formatBookkeepingCurrency(pm.amount, true)}
                          </strong>
                          <span className="block text-[0.58rem] font-semibold text-[var(--ui-text-muted)]">
                            Saldo bersih masuk
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="m-0 text-xs text-[var(--ui-text-muted)] font-medium py-2 text-center">
                  Tidak ada sirkulasi kas tercatat di bulan ini.
                </p>
              )}
            </AdminPanel>
          </div>
        </div>
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
        <div className="grid gap-2.5 sm:gap-4">
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

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <label className="grid gap-1 text-[0.68rem] font-semibold text-[var(--ui-text-muted)] uppercase tracking-[0.12em]">
              Tipe Transaksi
              <select
                disabled={isReadOnly || selectedEntry !== null}
                className="min-h-10 rounded-[0.95rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-2.5 text-xs font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition disabled:opacity-60 focus:border-studio-accent/55"
                value={formType}
                onChange={(e) => handleTypeChange(e.target.value)}
              >
                <option value="income">Masuk</option>
                <option value="expense">Keluar</option>
                <option value="transfer">Transfer</option>
              </select>
            </label>

            <label className="grid gap-1 text-[0.68rem] font-semibold text-[var(--ui-text-muted)] uppercase tracking-[0.12em]">
              Tanggal
              <input
                disabled={isReadOnly}
                className="min-h-10 rounded-[0.95rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-2.5 text-xs font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition disabled:opacity-60 focus:border-studio-accent/55"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <label className="grid gap-1 text-[0.68rem] font-semibold text-[var(--ui-text-muted)] uppercase tracking-[0.12em]">
              Kategori
              <select
                disabled={isReadOnly || formType === 'transfer'}
                className="min-h-10 rounded-[0.95rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-2.5 text-xs font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition disabled:opacity-60 focus:border-studio-accent/55"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-[0.68rem] font-semibold text-[var(--ui-text-muted)] uppercase tracking-[0.12em]">
              Metode
              <select
                disabled={isReadOnly || formType === 'transfer'}
                className="min-h-10 rounded-[0.95rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-2.5 text-xs font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition disabled:opacity-60 focus:border-studio-accent/55"
                value={formPaymentMethod}
                onChange={(e) => setFormPaymentMethod(e.target.value)}
              >
                {standardAccounts.filter((a) => a.key !== 'all').map((opt) => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <label className="grid gap-1 text-[0.68rem] font-semibold text-[var(--ui-text-muted)] uppercase tracking-[0.12em]">
              {formType === 'transfer' ? 'Kas Asal' : 'Akun Kas'}
              <select
                disabled={isReadOnly}
                className="min-h-10 rounded-[0.95rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-2.5 text-xs font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition disabled:opacity-60 focus:border-studio-accent/55"
                value={formAccount}
                onChange={(e) => setFormAccount(e.target.value)}
              >
                {standardAccounts.filter((a) => a.key !== 'all').map((opt) => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </label>

            {formType === 'transfer' ? (
              <label className="grid gap-1 text-[0.68rem] font-semibold text-[var(--ui-text-muted)] uppercase tracking-[0.12em]">
                Kas Tujuan
                <select
                  disabled={isReadOnly}
                  className="min-h-10 rounded-[0.95rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-2.5 text-xs font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition disabled:opacity-60 focus:border-studio-accent/55"
                  value={formTargetAccount}
                  onChange={(e) => setFormTargetAccount(e.target.value)}
                >
                  {standardAccounts.filter((a) => a.key !== 'all').map((opt) => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="grid gap-1 text-[0.68rem] font-semibold text-[var(--ui-text-muted)] uppercase tracking-[0.12em]">
                Nominal (IDR)
                <input
                  disabled={isReadOnly}
                  className="min-h-10 rounded-[0.95rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-2.5 text-xs font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition disabled:opacity-60 focus:border-studio-accent/55 placeholder:text-[var(--ui-text-soft)]"
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
            <label className="grid gap-1 text-[0.68rem] font-semibold text-[var(--ui-text-muted)] uppercase tracking-[0.12em]">
              Nominal Transfer (IDR)
              <input
                disabled={isReadOnly}
                className="min-h-10 rounded-[0.95rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-2.5 text-xs font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition disabled:opacity-60 focus:border-studio-accent/55 placeholder:text-[var(--ui-text-soft)]"
                placeholder="Contoh: 150000"
                type="number"
                min="1"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
              />
            </label>
          ) : null}

          <label className="grid gap-1 text-[0.68rem] font-semibold text-[var(--ui-text-muted)] uppercase tracking-[0.12em]">
            Deskripsi
            <input
              disabled={isReadOnly}
              className="min-h-10 rounded-[0.95rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-2.5 text-xs font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition disabled:opacity-60 focus:border-studio-accent/55 placeholder:text-[var(--ui-text-soft)]"
              placeholder={formType === 'transfer' ? 'Misal: Pemindahan kas bulanan' : 'Misal: Pembayaran Listrik bulanan'}
              type="text"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </label>

          <label className="grid gap-1 text-[0.68rem] font-semibold text-[var(--ui-text-muted)] uppercase tracking-[0.12em]">
            Catatan Tambahan
            <textarea
              disabled={isReadOnly}
              className="min-h-12 resize-none rounded-[0.95rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-2.5 py-1 text-xs font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition disabled:opacity-60 focus:border-studio-accent/55 placeholder:text-[var(--ui-text-soft)]"
              placeholder="Tambahkan informasi pelengkap..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </label>
        </div>
      </AdminDrawer>

    </AdminPageShell>
  );
}
