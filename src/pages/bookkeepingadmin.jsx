import { useMemo } from 'react';
import { useOutletContext } from 'react-router';
import {
  BookOpenCheck,
  CalendarDays,
  CircleDollarSign,
  FileText,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import {
  AdminBadge,
  AdminButton,
  AdminCommandBar,
  AdminPageHeader,
  AdminPageShell,
  AdminPanel,
} from '../components/admin/AdminPrimitives.jsx';

function formatBookkeepingCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(Math.max(0, Number(value) || 0));
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
    <AdminPanel className="bookkeeping-summary-card grid gap-3 p-4" variant="flat">
      <div className="flex items-start justify-between gap-3">
        <span className="grid min-w-0 gap-1">
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
            {label}
          </span>
          <strong className="text-2xl font-semibold leading-none tracking-[-0.055em] text-[var(--ui-text-strong)] sm:text-3xl">
            {value}
          </strong>
        </span>

        <AdminBadge tone={tone}>
          <Icon size={15} strokeWidth={2.35} aria-hidden="true" />
        </AdminBadge>
      </div>

      <p className="m-0 text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
        {helper}
      </p>
    </AdminPanel>
  );
}

function BookkeepingComingSoonPanel() {
  return (
    <AdminPanel className="grid gap-4 p-4 sm:p-5" variant="solid">
      <div className="grid gap-2">
        <AdminBadge tone="purple">
          BOOKKEEPING.1
        </AdminBadge>

        <h2 className="m-0 text-2xl font-semibold tracking-[-0.05em] text-[var(--ui-text-strong)]">
          Shell pembukuan sudah siap.
        </h2>

        <p className="m-0 max-w-3xl text-sm leading-6 text-[var(--ui-text-main)]">
          Fase ini baru menambahkan route, navigasi, dan layout awal. Data pembukuan,
          repository Firestore, input income/expense, import Billing, dan laporan akan
          masuk di fase berikutnya.
        </p>
      </div>

      <div className="grid gap-2 rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-3 ring-1 ring-[var(--ui-ring)] sm:grid-cols-3">
        <div className="grid gap-1">
          <span className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
            Berikutnya
          </span>
          <strong className="text-sm font-semibold text-[var(--ui-text-strong)]">
            BOOKKEEPING.2 Repository
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
            Tidak sync otomatis
          </strong>
        </div>
      </div>
    </AdminPanel>
  );
}

export function BookkeepingAdmin() {
  const adminContext = useOutletContext() || {};
  const {
    billingLoadError = '',
    billingTransactions = [],
    isBillingReady = false,
  } = adminContext;

  const billingSnapshot = useMemo(
    () => getBillingSnapshot(billingTransactions),
    [billingTransactions],
  );
  const currentMonthLabel = useMemo(() => getCurrentMonthLabel(), []);

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
            <AdminBadge icon={WalletCards} tone={isBillingReady ? 'cyan' : 'purple'}>
              {isBillingReady ? 'Billing terbaca' : 'Loading billing'}
            </AdminBadge>
            {billingLoadError ? (
              <AdminBadge tone="accent">
                Fallback billing
              </AdminBadge>
            ) : null}
          </>
        )}
        title="Pembukuan"
      />

      <AdminCommandBar className="bookkeeping-command-bar gap-2 p-2 sm:p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <AdminBadge icon={BookOpenCheck} tone="strong">
            Ledger read-only shell
          </AdminBadge>
          <AdminBadge icon={FileText} tone="purple">
            Plan ready
          </AdminBadge>
        </div>

        <AdminButton disabled icon={CircleDollarSign} variant="primary">
          Tambah catatan
        </AdminButton>
      </AdminCommandBar>

      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan pembukuan">
        <BookkeepingSummaryCard
          helper="Akan dihitung dari bookkeepingEntries pada BOOKKEEPING.3."
          icon={TrendingUp}
          label="Pemasukan"
          tone="cyan"
          value={formatBookkeepingCurrency(billingSnapshot.paid)}
        />
        <BookkeepingSummaryCard
          helper="Manual expense aktif mulai BOOKKEEPING.4."
          icon={TrendingDown}
          label="Pengeluaran"
          tone="accent"
          value={formatBookkeepingCurrency(0)}
        />
        <BookkeepingSummaryCard
          helper="Profit bersih sementara dari billing paid."
          icon={CircleDollarSign}
          label="Profit"
          tone="strong"
          value={formatBookkeepingCurrency(billingSnapshot.paid)}
        />
        <BookkeepingSummaryCard
          helper={billingSnapshot.remaining > 0 ? 'Masih ada tagihan belum lunas.' : 'Belum ada piutang terbaca.'}
          icon={WalletCards}
          label="Piutang"
          tone="purple"
          value={formatBookkeepingCurrency(billingSnapshot.remaining)}
        />
      </section>

      <BookkeepingComingSoonPanel />
    </AdminPageShell>
  );
}
