# Inventory UI Cleanup Audit

Tanggal audit: 2026-06-13T06:00:13.986Z

## Tujuan

Halaman Inventory sudah cukup fitur. Fokus berikutnya adalah merapikan UI tanpa menambah fitur baru dan tanpa mengubah logic data.

## Prinsip yang harus dijaga

1. Satu komponen, dua palet warna.
2. Dark mode dan light mode tidak boleh punya layout/DOM berbeda.
3. Perubahan theme hanya lewat token warna, surface, border, ring, shadow, dan kontras.
4. Tidak mengubah Firestore, auth, route, validation, submit/delete/update handler, search/filter logic inti, booking, customer, atau audit.
5. Patch UI harus kecil, idempotent, dan bisa diverifikasi.

## Snapshot struktur saat ini

- Jumlah function di inventory page: 71
- Drawer/panel terdeteksi: 6
- Strip/toolbar/board/hero terdeteksi: 7
- Native select tersisa: 0

### Feature block terdeteksi

- InventoryDashboardAlerts
- InventorySavedViews
- InventoryMaintenancePanel
- InventoryImportDrawer
- InventoryMaintenanceSchedulerDrawer
- InventoryStockMovementDrawer
- InventoryItemDetailDrawer
- InventoryFormPanel
- InventoryActivityTimeline

### Sinyal tombol toolbar

- Template
- Import
- CSV
- Print
- Add

## Audit token visual

| Token / pattern | Jumlah | Catatan |
|---|---:|---|
| bg-[var(--ui-bg-page)] | 0 | Idealnya tidak dipakai untuk modal/drawer/control karena ini page background. |
| bg-[var(--ui-bg-base)] | 6 | Cocok untuk surface solid drawer/modal. |
| bg-[var(--ui-control)] | 35 | Cocok untuk control/surface ringan. |
| bg-[var(--ui-control-hover)] | 26 | Cocok untuk input aktif/control solid. |
| bg-black/25 | 0 | Overlay lama, sebaiknya distandarkan. |
| bg-black/30 | 0 | Overlay lama, sebaiknya distandarkan. |
| bg-black/60 | 5 | Overlay solid yang sudah lebih aman. |
| native <select> | 0 | Harus 0 kalau dropdown sudah custom seperti Customers. |

## Masalah UI utama yang perlu dirapikan

### 1. Area atas terlalu ramai

Kemungkinan saat ini ada beberapa lapisan berturut-turut:

- Hero
- Overview strip
- Toolbar
- Dashboard alerts
- Smart views
- Watchlist
- Table

Ini membuat halaman terasa seperti panel cockpit, bukan halaman operasional yang cepat dibaca.

### 2. Toolbar terlalu banyak tombol

Tombol sekunder seperti Template, Import, CSV, dan Print sebaiknya tidak bersaing visual dengan Add. Add harus tetap jadi primary action.

### 3. Alert dan Smart Views overlap secara mental

Alert menjawab "apa yang urgent", Smart Views menjawab "mode kerja apa". Dua strip ini bisa digabung menjadi satu priority rail atau dibuat bertingkat lebih halus.

### 4. Table perlu jadi pusat halaman

Setelah fitur lengkap, table/ledger harus kembali jadi fokus utama. Badge status/condition/action jangan terlalu ramai.

### 5. Drawer harus seragam

Semua drawer harus punya:

- overlay sama
- surface sama
- header sama
- body spacing sama
- footer action sama
- input/dropdown token sama

## Rekomendasi phase berikutnya

### INV-UI.1: Compress inventory command area

Toolbar atas dirapihin. Search tetap utama, filter kategori/kondisi tetap terlihat, tombol sekunder seperti Template, Import, CSV, Print dipindah jadi compact action group.

### INV-UI.2: Merge alert and smart view strips

Alert strip dan Smart views digabung jadi satu priority rail supaya bagian atas halaman tidak terlalu penuh.

### INV-UI.3: Polish inventory ledger table

Table dibuat lebih lega, header lebih jelas, condition/status badge tidak numpuk, action button lebih tenang.

### INV-UI.4: Drawer visual consistency pass

Semua drawer pakai surface, backdrop, radius, footer, dan spacing yang konsisten.

### INV-UI.5: Mobile inventory cleanup

Mobile layout dibuat lebih spatial, tidak melebar, action mudah disentuh, dan drawer tidak terasa sesak.

## Target visual akhir

Halaman inventory harus terasa:

- lebih tenang
- lebih solid
- lebih padat tapi tidak sesak
- action utama jelas
- filter cepat tetap ada tapi tidak mendominasi
- dark/light tetap satu layout

## Catatan implementasi

Mulai dari INV-UI.1, patch harus fokus UI saja. Jangan tambah fitur baru dulu.
