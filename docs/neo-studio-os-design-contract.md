# Neo Studio OS Design Contract

Tanggal dibuat: 2026-06-13T07:47:28.525Z

## Direction yang dipilih

Project 37 Music Studio akan memakai arah visual:

**Neo Studio OS**

Arah ini mengutamakan UI admin yang premium, bersih, solid, scalable, dan nyaman dipakai harian. Visual boleh tetap punya karakter studio, tapi tidak boleh mengorbankan readability, hierarchy, atau kecepatan operasional.

## Prinsip utama

1. Satu komponen, dua palet warna.
2. Struktur DOM, layout, spacing, size, dan posisi harus sama untuk dark dan light mode.
3. Dark/light hanya boleh mengubah token warna, surface, border, ring, shadow, dan kontras.
4. Hindari layout branching berdasarkan theme.
5. Tidak ada page yang punya gaya visual sendiri-sendiri tanpa alasan kuat.
6. Komponen admin harus terasa seperti satu sistem operasi internal studio.
7. Decorative glow boleh ada, tapi hemat dan tidak boleh mengganggu data.

## Karakter visual

Neo Studio OS harus terasa:

- premium
- tenang
- solid
- editorial
- studio-grade
- cepat dibaca
- tidak ramai
- tidak terlalu glassy
- tidak terlalu cyber
- tidak seperti template dashboard generik

## Palette direction

### Accent roles

| Accent | Fungsi |
|---|---|
| Pink / studio accent | Primary action, destructive action, urgent alert |
| Cyan | Ready, success, information, active support state |
| Purple | Schedule, maintenance, secondary workflow |
| Neutral | Surface, border, text, table, shell |

### Surface rule

Gunakan surface solid untuk area kerja utama.

| Area | Surface target |
|---|---|
| Page background | atmospheric base, bukan panel |
| Sidebar | solid-soft, tidak terlalu transparan |
| Card/panel | solid token surface |
| Table row | subtle surface, border tipis |
| Drawer/modal | solid base, bukan gradient page |
| Input/dropdown | control token |
| Hover state | control-hover token |

## Token contract

Token yang harus dijaga dan diperkuat di phase berikutnya:

```txt
--ui-bg-base
--ui-bg-page
--ui-text-strong
--ui-text-main
--ui-text-muted
--ui-text-soft
--ui-border
--ui-border-strong
--ui-control
--ui-control-hover
--ui-glass
--ui-glass-soft
--ui-primary-bg
--ui-primary-text
--ui-secondary-bg
--ui-secondary-text
--ui-shadow-soft
--ui-shadow-control
--ui-ring
```

## Layout contract

### Admin shell

Admin shell harus menjadi fondasi semua halaman admin.

Target:

- desktop: sidebar kiri + content kanan
- mobile: content satu kolom + bottom navigation
- content width konsisten
- spacing antar halaman konsisten
- top page rhythm konsisten

Tidak boleh:

- tiap halaman punya shell sendiri
- sidebar berubah struktur karena theme
- mobile dan desktop menjadi dua app berbeda
- padding page berbeda ekstrem antar halaman

### Page structure target

Setiap halaman admin idealnya punya struktur:

```txt
PageShell
  PageHeader
  CommandBar
  Priority/Status Rail optional
  MainContent
  Drawer/Modal optional
```

## Component contract

### Buttons

Primary button:

- hanya untuk aksi utama
- maksimal 1 primary button di satu command area
- memakai --ui-primary-bg dan --ui-primary-text

Secondary button:

- untuk action pendukung
- surface memakai --ui-control atau --ui-secondary-bg
- tidak bersaing visual dengan primary

Danger button:

- destructive action
- pakai accent pink secara hemat

### Cards / panels

Target:

- border tipis
- shadow halus
- radius konsisten
- tidak terlalu transparan
- spacing internal stabil

Tidak boleh:

- card terlalu banyak glow
- card terlalu banyak nested border
- surface gradient terlalu ramai

### Tables / ledgers

Target:

- table menjadi pusat data
- header readable
- row height konsisten
- actions tidak mendominasi
- badge ringkas
- horizontal overflow hanya jika benar-benar diperlukan

### Drawers

Target:

- overlay konsisten
- surface solid
- header/body/footer konsisten
- footer action jelas
- mobile tidak sesak
- tidak pakai background page gradient sebagai surface drawer

### Dropdown

Target:

- custom dropdown button + listbox
- token-based
- style konsisten dengan Customers
- native select tidak dipakai untuk admin UI utama

## Page-specific direction

### Booking

Fokus:

- jadwal
- status pembayaran
- booking action
- calendar/session rhythm

Gaya:

- operational but calm

### Customers

Fokus:

- CRM
- relationship
- follow-up
- payment attention

Gaya:

- clean, human, premium

### Inventory

Fokus:

- asset ledger
- condition
- stock
- maintenance
- priority

Gaya:

- data-ledger, compact, low-noise

### Audit

Fokus:

- chronological trust log
- who did what
- clarity

Gaya:

- log stream, precise, minimal

### Login

Fokus:

- secure entry
- brand
- trust

Gaya:

- elegant gateway, not flashy

## Rewrite boundaries

UI overhaul boleh mengubah:

- visual hierarchy
- spacing
- layout composition
- component className
- token usage
- shared component extraction
- page shell rhythm
- typography scale
- card/table/drawer visual structure

UI overhaul tidak boleh mengubah tanpa konfirmasi eksplisit:

- Firestore collection names
- data model
- auth behavior
- route path
- booking submit/update/delete logic
- customer filtering logic
- inventory CRUD/import/export logic
- audit logging behavior
- Firebase security assumptions
- user-facing business rules

## Phase roadmap

### UI-OVERHAUL.0

Lock Neo Studio OS design contract.

### UI-OVERHAUL.1

Rewrite global token system in tailwind.css.

Target:

- stronger neutral foundation
- less glass opacity
- better light/dark parity
- consistent surface depth
- keep existing token names where possible

### UI-OVERHAUL.2

Rewrite Admin Shell.

Target:

- cleaner sidebar
- better page width
- consistent content rhythm
- mobile bottom bar polish

### UI-OVERHAUL.3

Create shared admin component primitives.

Target candidate components:

- AdminPageShell
- AdminPageHeader
- AdminCommandBar
- AdminPanel
- AdminButton
- AdminBadge
- AdminDrawer
- AdminDropdown
- AdminTableShell

### UI-OVERHAUL.4

Rewrite Booking page UI.

### UI-OVERHAUL.5

Rewrite Customers page UI.

### UI-OVERHAUL.6

Rewrite Inventory page UI.

### UI-OVERHAUL.7

Rewrite Audit page UI.

### UI-OVERHAUL.8

Mobile consistency pass.

### UI-OVERHAUL.9

Final visual QA and dead CSS cleanup.

## Current snapshot

| Signal | Value |
|---|---:|
| admin-mobile-shell usage | 1 |
| --ui-bg-page usage in CSS | 2 |
| inventory bg-black/60 overlay usage | 5 |
| --ui-glass-soft usage in CSS | 3 |
| native select usage in inventory | 0 |
| --ui-control usage in CSS | 6 |
| --ui-control-hover usage in CSS | 2 |

## Acceptance criteria untuk seluruh overhaul

1. Lint pass.
2. Test pass.
3. Build pass.
4. Dark/light tidak mengubah layout.
5. Semua halaman admin terasa satu keluarga visual.
6. Tidak ada native select baru di halaman admin utama.
7. Tidak ada drawer yang memakai page gradient sebagai surface.
8. Tidak ada hardcoded text color penting yang melawan token.
9. Mobile tidak horizontal overflow.
10. Primary action di tiap halaman jelas.

## Catatan implementasi

Mulai UI-OVERHAUL.1, perubahan harus dilakukan phase-by-phase. Jangan rewrite semua halaman dalam satu commit besar.
