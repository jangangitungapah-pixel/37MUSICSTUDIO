# BOOKKEEPING.0 - Halaman Pembukuan 37 Music Studio

## Tujuan

Halaman Pembukuan menjadi pusat pencatatan kas, pemasukan, pengeluaran, profit, dan laporan keuangan 37 Music Studio.

Pembukuan berada di atas Billing/POS. Billing membuat invoice dan transaksi customer, sedangkan Pembukuan mencatat arus uang dan laporan usaha.

## Route dan file

- Route: `/admin/bookkeeping`
- Page: `src/pages/bookkeepingadmin.jsx`
- Repository: `src/services/adminBookkeepingRepository.js`
- Collections:
  - `bookkeepingEntries`
  - `bookkeepingAuditLogs`

## Nav

- Label: Pembukuan
- Helper: Kas & laporan

## MVP Scope

1. Route/nav shell.
2. Repository Firestore + local fallback.
3. Dashboard summary.
4. Ledger read model.
5. Manual income/expense drawer.
6. Billing import suggestion.
7. Print/export laporan sederhana.

## Summary Cards

- Total pemasukan
- Total pengeluaran
- Profit bersih
- Saldo kas
- Piutang belum lunas
- Transaksi bulan ini

## Filters

- Periode
- Jenis transaksi
- Kategori
- Akun kas
- Metode pembayaran
- Search

## Ledger Columns

- Tanggal
- Tipe
- Kategori
- Deskripsi
- Akun
- Metode
- Masuk
- Keluar
- Saldo berjalan
- Sumber
- Aksi

## Entry Model

```js
{
  id: "bookkeeping-...",
  studioId: "main-studio",
  type: "income" | "expense" | "transfer",
  direction: "in" | "out" | "neutral",
  date: "2026-06-13",
  transactionAt: "2026-06-13T15:00:00.000Z",
  categoryId: "studio_revenue",
  categoryName: "Pendapatan Studio",
  accountId: "cash",
  accountName: "Cash",
  paymentMethod: "cash" | "transfer" | "qris" | "debit" | "other",
  description: "Booking Arief Music",
  amount: 120000,
  sourceType: "manual" | "billing" | "inventory" | "adjustment",
  sourceId: "billing-...",
  sourceLabel: "INV-20260613-001",
  notes: "",
  createdAt: "...",
  updatedAt: "...",
  createdBy: {},
  updatedBy: {}
}
```

## Audit Actions

- `bookkeeping.create`
- `bookkeeping.update`
- `bookkeeping.delete`
- `bookkeeping.import_billing`
- `bookkeeping.print`

## Firestore Rules Draft

```js
match /bookkeepingEntries/{entryId} {
  allow read, create, update: if isAdmin();
  allow delete: if false;
}

match /bookkeepingAuditLogs/{auditLogId} {
  allow read, create: if isAdmin();
  allow update, delete: if false;
}
```

## Boundaries

Pembukuan tidak boleh mengubah booking, status payment booking, billing transaction langsung, inventory stock, customer model, auth, atau route lain.

Pembukuan boleh membaca billingTransactions dan membuat bookkeepingEntries serta bookkeepingAuditLogs.

## Roadmap

1. BOOKKEEPING.0 plan
2. BOOKKEEPING.1 route/nav shell
3. BOOKKEEPING.2 repository
4. BOOKKEEPING.3 dashboard/read model
5. BOOKKEEPING.4 manual income/expense
6. BOOKKEEPING.5 billing import suggestion
7. BOOKKEEPING.6 reports
8. BOOKKEEPING.7 export/print
9. BOOKKEEPING.8 mobile polish
10. BOOKKEEPING.9 final QA
