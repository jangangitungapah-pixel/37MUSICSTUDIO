# Billing / POS Plan - 37 Music Studio

Generated for: 37 Music Studio admin app  
Direction: Neo Studio OS  
Phase: BILLING.0  
Status: Planning contract only

---

## 1. Purpose

Halaman Billing / POS menjadi pusat operasional untuk invoice, pembayaran booking, transaksi manual, receipt, dan riwayat pembayaran.

Target utama:

- membuat invoice dari booking;
- menerima pembayaran DP dan pelunasan;
- membuat transaksi manual / walk-in;
- mencetak invoice atau receipt;
- mencatat history pembayaran;
- menghubungkan billing ke Booking, Customer, Audit, dan nanti Inventory.

---

## 2. UI Direction

Billing wajib mengikuti Neo Studio OS:

- satu struktur komponen untuk dark dan light mode;
- warna dan surface mengikuti token CSS;
- tidak membuat layout branch berdasarkan theme;
- compact, solid, premium, mudah dibaca;
- tidak terlalu banyak chip;
- tidak card di dalam card secara berlebihan;
- mobile-first untuk transaksi cepat.

---

## 3. Route Target

Route:

```txt
/admin/billing
```

Page file:

```txt
src/pages/billingadmin.jsx
```

Nav label:

```txt
Billing
Invoices & POS
```

---

## 4. MVP Scope

Fitur awal:

- Billing route dan nav item;
- Billing page shell;
- summary rail;
- billing queue dari booking pending / DP;
- create invoice dari booking;
- mark paid;
- mark DP;
- payment method;
- transaction history;
- print receipt HTML;
- audit log untuk create dan payment update.

---

## 5. Deferred Scope

Tidak masuk fase awal:

- refund;
- void transaction;
- split payment;
- payment gateway real QRIS;
- tax / pajak;
- cashier shift open / close;
- multi cashier;
- stock auto reduce dari inventory;
- PDF generator;
- offline cashier mode;
- complex discount / promo engine.

---

## 6. Main Flow

### Booking-based invoice

```txt
Booking pending / DP
→ Create invoice
→ Review invoice
→ Select payment method
→ Mark DP / Paid
→ Update billing transaction
→ Optional sync to booking payment status
→ Record audit
→ Print receipt
```

Rules:

- invoice dari booking memakai booking sebagai source awal;
- bookingId harus disimpan;
- total mengikuti durasi booking dan harga studio;
- perubahan pembayaran wajib tercatat di Audit;
- sync balik ke booking hanya dilakukan pada fase yang dikonfirmasi.

### Manual POS / walk-in

```txt
New POS
→ Add manual item
→ Qty
→ Price
→ Discount optional
→ Payment method
→ Save transaction
→ Print receipt
```

Manual POS fase awal belum wajib mengurangi inventory stock.

---

## 7. Data Model Draft

Collection utama:

```txt
billingTransactions
```

Draft shape:

```js
{
  id: string,
  invoiceNumber: string,

  sourceType: 'booking' | 'manual',
  bookingId: string,
  customerId: string,
  customerName: string,
  phone: string,

  items: [
    {
      id: string,
      name: string,
      category: string,
      qty: number,
      unitPrice: number,
      subtotal: number,
      inventoryItemId: string
    }
  ],

  subtotal: number,
  discountAmount: number,
  totalAmount: number,
  paidAmount: number,
  remainingAmount: number,

  paymentStatus: 'unpaid' | 'dp' | 'paid',
  paymentMethod: 'cash' | 'transfer' | 'qris' | 'debit' | 'other',

  notes: string,

  createdAt: string,
  updatedAt: string,
  createdBy: {
    uid: string,
    email: string,
    displayName: string
  },
  updatedBy: {
    uid: string,
    email: string,
    displayName: string
  }
}
```

---

## 8. Audit Actions Draft

```txt
billing.create
billing.update
billing.pay
billing.print
billing.manual_create
billing.booking_invoice_create
```

Deferred:

```txt
billing.void
billing.refund
billing.inventory_sync
```

---

## 9. UI Structure Draft

Desktop:

```txt
Billing Hero
Billing Summary Rail
Command Bar
Billing Queue / Transaction List
Invoice Preview / Payment Drawer
Receipt Print
```

Mobile:

```txt
Hero compact
Summary rail compact
Search / filter
Billing queue cards
Bottom sheet invoice
Sticky payment action
Receipt view
```

---

## 10. Page Sections

### Hero

```txt
Billing studio
Kelola invoice booking, pembayaran, dan transaksi POS studio.
```

### Summary rail

```txt
Paid today
Pending
DP active
Revenue today
```

### Command bar

```txt
Search invoice/customer
Status filter
Date filter
+ New POS
```

### Billing queue

```txt
Invoice number
Customer
Source
Status
Total
Paid
Remaining
Payment method
Created at
Action
```

### Invoice drawer

```txt
Mark DP
Mark paid
Print receipt
Copy invoice text
Close
```

---

## 11. Integration Rules

### Booking

Billing boleh membaca booking untuk membuat invoice.

Billing hanya boleh mengubah payment/status booking setelah fase khusus dikonfirmasi.

Expected sync later:

```txt
billing paid
→ booking status paid
→ booking audit log
→ billing audit log
```

### Customer

Customer detail nanti dapat menampilkan:

```txt
total paid
outstanding
last invoice
billing history
```

### Inventory

Inventory sync ditunda sampai fase opsional.

### Audit

Setiap create invoice dan payment update harus menghasilkan audit entry.

---

## 12. Rewrite Boundaries

BILLING implementation tidak boleh mengubah ini tanpa konfirmasi eksplisit:

- existing booking submit handler;
- existing booking edit handler;
- existing booking delete handler;
- existing mark paid behavior;
- existing customer derivation logic;
- existing inventory CRUD;
- existing inventory stock movement logic;
- existing auth logic;
- existing route behavior di luar penambahan /admin/billing;
- existing Firestore collection names di luar billing collection baru;
- existing security assumptions.

---

## 13. Phase Roadmap

### BILLING.0

Create Billing / POS planning contract.

### BILLING.1

Add route and nav shell:

```txt
/admin/billing
src/pages/billingadmin.jsx
```

No Firestore writes yet.

### BILLING.2

Create repository service:

```txt
src/services/adminBillingRepository.js
```

Include local fallback and Firestore-ready shape.

### BILLING.3

Build Billing dashboard UI:

- hero;
- summary rail;
- command bar;
- queue cards/table;
- empty state.

### BILLING.4

Create invoice from booking:

- select booking;
- preview invoice;
- save transaction;
- no destructive booking sync yet unless confirmed.

### BILLING.5

Payment flow:

- mark DP;
- mark paid;
- payment method;
- update billing transaction;
- optional booking status sync if confirmed.

### BILLING.6

Manual POS transaction:

- manual item list;
- qty;
- price;
- discount;
- save transaction.

### BILLING.7

Receipt / invoice print:

- HTML print;
- copy invoice text;
- no PDF dependency yet.

### BILLING.8

Customer billing history:

- attach outstanding and revenue summary to customer detail.

### BILLING.9

Optional inventory sync:

- reduce stock;
- stock movement;
- inventory audit.

---

## 14. Acceptance Criteria

Billing MVP dianggap siap saat:

- route /admin/billing works;
- nav item exists;
- Billing page match Neo Studio OS;
- dark and light mode share same structure;
- invoice can be created from booking;
- payment status can be recorded;
- transaction can be printed;
- audit event is recorded;
- lint, test, and build pass.

---

## 15. Non-goals For MVP

Billing MVP bukan full accounting system.

Tidak wajib punya:

- tax reporting;
- journal ledger;
- payment gateway reconciliation;
- multi cashier closing;
- stock valuation;
- refund accounting;
- invoice PDF engine.

---

## 16. Implementation Note

Billing harus dibuat phase-by-phase.  
Setiap code phase wajib menjaga behavior existing kecuali ada konfirmasi eksplisit.
