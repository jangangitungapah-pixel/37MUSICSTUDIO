# Client Inbox Responsive Layout Audit

Generated at: `2026-06-11T06:10:52.268Z`

## Scope

Audit ini hanya membaca struktur repo dan membuat dokumentasi. Tidak ada perubahan UI, logic, data model, route, auth, Firebase/API/storage, handler, atau behavior user-facing.

## Screenshot Findings From Visual Review

- Hero section patah saat area konten menyempit karena sidebar aktif.
- Title `Client Inbox` terlalu agresif untuk viewport sempit.
- Metric cards terlalu tinggi/kosong di narrow layout.
- Mailbox tabs horizontal mulai clipping, terutama item `Semua Pesan`.
- Search input terlihat clipping secara vertikal.
- Empty state terlalu besar untuk kondisi mobile/narrow.
- Layer glass/border cukup ramai dan perlu hierarchy yang lebih tenang.

## Repo Scan Summary

- Total readable files scanned: **163**
- Candidate files with relevant score: **133**
- Primary text candidates: **15**
- Style/responsive candidates: **20**

## Framework / Tooling Hints

- React terdeteksi dari package.json.
- Vite terdeteksi dari package.json.
- Tailwind CSS terdeteksi dari package.json.
- Vite React plugin terdeteksi.
- lucide-react terdeteksi untuk icon.
- framer-motion terdeteksi untuk animasi.
- File konfigurasi Vite ditemukan.
- Struktur src/pages terdeteksi.

## Package Scripts

- `dev`: `vite`
- `online`: `concurrently "vite --host" "npx untun@latest tunnel http://localhost:5173"`
- `build`: `vite build`
- `lint`: `eslint .`
- `test`: `vitest run`
- `preview`: `vite preview`

## Top Candidate Files

| Rank | Score | File | Primary Hits | Style Hits | Responsive Hits | Risk Hits |
|---:|---:|---|---:|---:|---:|---:|
| 1 | 10578 | `src/pages/ClientMessagesPage.css` | 0 | 3149 | 286 | 535 |
| 2 | 6891 | `src/pages/CalendarPage.css` | 0 | 1807 | 194 | 1070 |
| 3 | 5576 | `src/pages/LandingPage.css` | 0 | 1368 | 283 | 898 |
| 4 | 4908 | `src/pages/CustomersPage.css` | 0 | 837 | 419 | 1551 |
| 5 | 3811 | `src/pages/ClientPortal.css` | 0 | 766 | 342 | 815 |
| 6 | 2587 | `src/pages/ClientMessagesInboxPolish.css` | 0 | 790 | 46 | 89 |
| 7 | 2585 | `src/pages/ClientMessagesInbox.css` | 0 | 735 | 77 | 190 |
| 8 | 2486 | `src/pages/FinancePage.css` | 0 | 333 | 202 | 1075 |
| 9 | 2271 | `src/styles/flat-minimal-system.css` | 0 | 505 | 94 | 561 |
| 10 | 2044 | `src/pages/BillingPage.css` | 0 | 215 | 273 | 845 |
| 11 | 2038 | `src/pages/SettingsPage.css` | 0 | 254 | 247 | 774 |
| 12 | 1982 | `src/pages/DashboardPage.css` | 0 | 309 | 202 | 643 |
| 13 | 1800 | `src/components/Sidebar.css` | 0 | 239 | 145 | 786 |
| 14 | 1753 | `src/pages/PublicCalendarPage.css` | 0 | 327 | 116 | 528 |
| 15 | 1657 | `src/pages/GalleryPage.css` | 0 | 157 | 217 | 744 |
| 16 | 1515 | `docs/phase-3-admin-inbox-anchor-inspection.md` | 44 | 323 | 0 | 0 |
| 17 | 1490 | `src/index.css` | 0 | 383 | 51 | 235 |
| 18 | 1308 | `src/pages/ClientMessagesPage.jsx` | 28 | 316 | 0 | 0 |
| 19 | 996 | `src/components/BookingForm.css` | 0 | 150 | 84 | 371 |
| 20 | 876 | `src/pages/StaffPage.css` | 0 | 103 | 77 | 405 |
| 21 | 673 | `src/pages/PublicGalleryPage.css` | 0 | 112 | 61 | 207 |
| 22 | 591 | `src/pages/ClientMessageCenterPage.jsx` | 7 | 161 | 0 | 0 |
| 23 | 448 | `src/pages/CalendarPage.jsx` | 0 | 144 | 1 | 2 |
| 24 | 445 | `scripts/audit-client-inbox-layout.cjs` | 22 | 41 | 13 | 14 |
| 25 | 425 | `src/pages/InventoryPage.css` | 0 | 75 | 29 | 134 |

## Primary Text Matches

### `docs/phase-3-admin-inbox-anchor-inspection.md`

  - Line 265: `Client Inbox` → `253 \|           <h1 id="messagesHeroTitle">Client Inbox</h1>`
  - Line 263: `37 ADMIN INBOX` → `251 \|             37 Admin Inbox`
  - Line 115: `MAILBOX` → `109 \|   const mailboxCounts = useMemo(() => {`
  - Line 274: `MAILBOX` → `262 \|             <strong>{isLoaded ? mailboxCounts.open : '...'}</strong>`
  - Line 730: `MAILBOX` → `109 \|   const mailboxCounts = useMemo(() => {`
  - Line 27: `Dibalas` → `\| Tandai Dibalas preserved \| YES \| 490 \| `Tandai Dibalas` \|`
  - Line 27: `Dibalas` → `\| Tandai Dibalas preserved \| YES \| 490 \| `Tandai Dibalas` \|`
  - Line 97: `Dibalas` → `91 \|   { key: 'replied', label: 'Dibalas', description: 'Sudah difollow up', icon: Reply },`
  - Line 187: `Dibalas` → `215 \|       message: 'Pesan ditandai sudah dibalas.',`
  - Line 227: `Dibalas` → `215 \|       message: 'Pesan ditandai sudah dibalas.',`
  - Line 307: `Dibalas` → `455 \|                   placeholder="Tulis catatan internal. Contoh: Sudah dibalas via WA, client minta Sabtu malam."`
  - Line 342: `Dibalas` → `490 \|                     Tandai Dibalas`
  - Line 392: `Dibalas` → `455 \|                   placeholder="Tulis catatan internal. Contoh: Sudah dibalas via WA, client minta Sabtu malam."`
  - Line 427: `Dibalas` → `490 \|                     Tandai Dibalas`
  - Line 486: `Dibalas` → `455 \|                   placeholder="Tulis catatan internal. Contoh: Sudah dibalas via WA, client minta Sabtu malam."`
  - Line 521: `Dibalas` → `490 \|                     Tandai Dibalas`
  - Line 578: `Dibalas` → `490 \|                     Tandai Dibalas`
  - Line 603: `Dibalas` → `## Tandai Dibalas Context`
  - Line 606: `Dibalas` → `Needle: `Tandai Dibalas``
  - Line 630: `Dibalas` → `490 \|                     Tandai Dibalas`

### `src/pages/ClientMessagesPage.jsx`

  - Line 306: `Client Inbox` → `<h1 id="messagesHeroTitle">Client Inbox</h1>`
  - Line 338: `Client Inbox` → `<section className="messages-inbox-shell" aria-label="Professional client inbox">`
  - Line 304: `37 ADMIN INBOX` → `37 Admin Inbox`
  - Line 131: `MAILBOX` → `const mailboxCounts = useMemo(() => {`
  - Line 315: `MAILBOX` → `<strong>{isLoaded ? mailboxCounts.open : '...'}</strong>`
  - Line 320: `MAILBOX` → `<strong>{isLoaded ? mailboxCounts.replied : '...'}</strong>`
  - Line 325: `MAILBOX` → `<strong>{isLoaded ? mailboxCounts.done : '...'}</strong>`
  - Line 339: `MAILBOX` → `<aside className="inbox-sidebar" aria-label="Mailbox navigation">`
  - Line 341: `MAILBOX` → `<span>Mailbox</span>`
  - Line 342: `MAILBOX` → `<strong>{mailboxCounts.all}</strong>`
  - Line 361: `MAILBOX` → `<em>{mailboxCounts[key]}</em>`
  - Line 407: `Tidak ada pesan cocok` → `<strong>Tidak ada pesan cocok.</strong>`
  - Line 445: `Pilih pesan untuk dibaca` → `<strong>Pilih pesan untuk dibaca.</strong>`
  - Line 62: `Dibalas` → `if (normalized === 'replied') return 'Dibalas';`
  - Line 113: `Dibalas` → `{ key: 'replied', label: 'Dibalas', description: 'Sudah difollow up', icon: Reply },`
  - Line 239: `Dibalas` → `message: 'Pesan ditandai sudah dibalas.',`
  - Line 319: `Dibalas` → `<span>Dibalas</span>`
  - Line 611: `Dibalas` → `Tandai Dibalas`
  - Line 61: `Selesai` → `if (normalized === 'done') return 'Selesai';`
  - Line 112: `Selesai` → `{ key: 'open', label: 'Inbox', description: 'Belum selesai', icon: Inbox },`

### `src/pages/ClientMessageCenterPage.jsx`

  - Line 39: `Dibalas` → `if (normalized === 'replied') return 'Dibalas Admin';`
  - Line 83: `Dibalas` → `{ key: 'replied', label: 'Dibalas' },`
  - Line 268: `Dibalas` → `<span>Dibalas</span>`
  - Line 38: `Selesai` → `if (normalized === 'done') return 'Selesai';`
  - Line 84: `Selesai` → `{ key: 'done', label: 'Selesai' },`
  - Line 277: `Selesai` → `<span>Selesai</span>`
  - Line 237: `Semua Pesan` → `Kirim pertanyaan booking, invoice, jadwal, atau kebutuhan recording. Semua pesan tersimpan rapi di akun client kamu.`

### `scripts/audit-client-inbox-layout.cjs`

  - Line 43: `Client Inbox` → `'Client Inbox',`
  - Line 391: `Client Inbox` → `'# Client Inbox Responsive Layout Audit',`
  - Line 402: `Client Inbox` → `'- Title `Client Inbox` terlalu agresif untuk viewport sempit.',`
  - Line 582: `Client Inbox` → `console.log('🔎 PHASE 1 — Audit Client Inbox layout dimulai...');`
  - Line 44: `37 ADMIN INBOX` → `'37 ADMIN INBOX',`
  - Line 45: `MAILBOX` → `'MAILBOX',`
  - Line 61: `MAILBOX` → `'mailbox',`
  - Line 404: `MAILBOX` → `'- Mailbox tabs horizontal mulai clipping, terutama item `Semua Pesan`.',`
  - Line 562: `MAILBOX` → `'- Desktop normal: hero, mailbox, inbox list, detail panel tetap rapi.',`
  - Line 564: `MAILBOX` → `'- Tablet width: mailbox tidak clipping.',`
  - Line 46: `Tidak ada pesan cocok` → `'Tidak ada pesan cocok',`
  - Line 47: `Pilih pesan untuk dibaca` → `'Pilih pesan untuk dibaca',`
  - Line 48: `Dibalas` → `'Dibalas',`
  - Line 49: `Selesai` → `'Selesai',`
  - Line 51: `Selesai` → `'Belum selesai',`
  - Line 650: `Selesai` → `console.log('✅ Audit selesai.');`
  - Line 50: `Semua Pesan` → `'Semua Pesan',`
  - Line 404: `Semua Pesan` → `'- Mailbox tabs horizontal mulai clipping, terutama item `Semua Pesan`.',`
  - Line 51: `Belum selesai` → `'Belum selesai',`
  - Line 52: `Sudah difollow up` → `'Sudah difollow up',`

### `src/pages/ClientDashboardPage.jsx`

  - Line 60: `Dibalas` → `if (normalized === 'replied') return 'Dibalas';`
  - Line 61: `Selesai` → `if (normalized === 'done') return 'Selesai';`

### `docs/admin-customer-reply-phase-1-audit.md`

  - Line 82: `Dibalas` → `\| Mark replied action exists \| YES \| 490 \| `Tandai Dibalas` \|`
  - Line 83: `Selesai` → `\| Mark done action exists \| YES \| 61 \| `Selesai` \|`

### `scripts/phase-3-admin-inbox-wire-reply.cjs`

  - Line 209: `Dibalas` → `const oldText = "Tulis catatan internal. Contoh: Sudah dibalas via WA, client minta Sabtu malam.";`
  - Line 228: `Dibalas` → `verifyContains(content, "Tandai Dibalas", "mark replied action preserved");`
  - Line 229: `Selesai` → `verifyContains(content, "Selesai", "done action preserved");`

### `scripts/phase-5-admin-reply-history-visibility.cjs`

  - Line 224: `Dibalas` → `verifyContains(content, "Tandai Dibalas", "mark replied action preserved");`
  - Line 225: `Selesai` → `verifyContains(content, "Selesai", "done action preserved");`

### `src/pages/DashboardPage.jsx`

  - Line 159: `Selesai` → `toast.success(`Servis ${item.name} selesai! Kondisi diatur ke Excellent.`);`
  - Line 1054: `Selesai` → `title="Tandai Selesai Servis"`
  - Line 1055: `Selesai` → `aria-label={`Selesaikan servis untuk ${item.name}`}`

### `scripts/phase-3-hotfix-admin-reply-anchor.cjs`

  - Line 139: `Dibalas` → `'placeholder="Tulis catatan internal. Contoh: Sudah dibalas via WA, client minta Sabtu malam."',`
  - Line 182: `Dibalas` → `verifyContains(content, "Tandai Dibalas", "mark replied action preserved");`
  - Line 206: `Dibalas` → `verifyContains(content, "Tandai Dibalas", "existing mark replied action");`
  - Line 183: `Selesai` → `verifyContains(content, "Selesai", "done action preserved");`

### `src/pages/SettingsPage.jsx`

  - Line 420: `Selesai` → `toast.success(`Restore selesai. ${writes.length} dokumen diproses.`);`

### `src/pages/CustomersPage.jsx`

  - Line 495: `Selesai` → `toast.success('Sinkron customer selesai', {`

### `src/pages/GalleryPage.jsx`

  - Line 532: `Selesai` → `<span>{isReorderActive ? 'Selesai Susun' : 'Susun Urutan'}</span>`

### `src/pages/ClientBillingPage.jsx`

  - Line 366: `Selesai` → `<small>{totals.activeBills} invoice masih perlu diselesaikan.</small>`
  - Line 378: `Selesai` → `<p>{totals.activeBills > 0 ? totals.activeBills + " invoice masih perlu diselesaikan." : "Semua invoice yang tercatat sudah aman."}</p>`

### `src/pages/MaintenancePage.jsx`

  - Line 281: `Selesai` → `done: { label: 'Selesai', color: '#4CAF50', icon: <CheckCircle size={12} /> },`
  - Line 320: `Selesai` → `<span className="stat-label">Selesai</span>`
  - Line 574: `Selesai` → `{ value: 'done', label: 'Selesai', icon: <CheckCircle size={14} /> },`
  - Line 673: `Selesai` → `{ value: 'done', label: 'Selesai', icon: <CheckCircle size={14} /> },`


## Style / Responsive Matches

### `src/pages/ClientMessagesPage.css`

**Responsive signals:**

  - Line 307: `@media` → `@media (max-width: 900px) {`
  - Line 317: `@media` → `@media (max-width: 560px) {`
  - Line 602: `@media` → `@media (max-width: 900px) {`
  - Line 620: `@media` → `@media (max-width: 560px) {`
  - Line 939: `@media` → `@media (max-width: 1100px) {`
  - Line 950: `@media` → `@media (max-width: 900px) {`
  - Line 960: `@media` → `@media (max-width: 640px) {`
  - Line 1074: `@media` → `@media (hover: hover) and (pointer: fine) {`
  - Line 1234: `@media` → `@media (hover: hover) and (pointer: fine) {`
  - Line 1371: `@media` → `@media (hover: hover) and (pointer: fine) {`
  - Line 1494: `@media` → `@media (max-width: 1180px) {`
  - Line 1504: `@media` → `@media (max-width: 920px) {`
  - Line 1531: `@media` → `@media (max-width: 640px) {`
  - Line 1567: `@media` → `@media (prefers-reduced-motion: reduce) {`
  - Line 1963: `@media` → `@media (max-width: 900px) {`
  - Line 1978: `@media` → `@media (max-width: 560px) {`
  - Line 2025: `@media` → `@media (prefers-reduced-motion: reduce) {`
  - Line 2146: `@media` → `@media (hover: none), (pointer: coarse) {`
  - Line 2174: `@media` → `@media (max-width: 768px) {`
  - Line 2220: `@media` → `@media (max-width: 430px) {`

**Potential clipping/density risks:**

  - Line 173: `overflow: hidden` → `overflow: hidden;`
  - Line 242: `overflow: hidden` → `overflow: hidden;`
  - Line 462: `overflow: hidden` → `overflow: hidden;`
  - Line 467: `overflow: hidden` → `overflow: hidden;`
  - Line 686: `overflow: hidden` → `overflow: hidden;`
  - Line 786: `overflow: hidden` → `overflow: hidden;`
  - Line 1026: `overflow: hidden` → `overflow: hidden;`
  - Line 1216: `overflow: hidden` → `overflow: hidden;`
  - Line 1762: `overflow: hidden` → `overflow: hidden;`
  - Line 1798: `overflow: hidden` → `overflow: hidden;`
  - Line 2316: `overflow: hidden` → `overflow: hidden;`
  - Line 2440: `overflow: hidden` → `overflow: hidden;`
  - Line 2467: `overflow: hidden` → `overflow: hidden;`
  - Line 2491: `overflow: hidden` → `overflow: hidden;`
  - Line 2543: `overflow: hidden` → `overflow: hidden;`
  - Line 2827: `overflow: hidden` → `overflow: hidden;`
  - Line 2951: `overflow: hidden` → `overflow: hidden;`
  - Line 2966: `overflow: hidden` → `overflow: hidden;`
  - Line 3287: `overflow: hidden` → `overflow: hidden;`
  - Line 3319: `overflow: hidden` → `overflow: hidden;`

### `src/pages/CalendarPage.css`

**Responsive signals:**

  - Line 1257: `@media` → `@media (max-width: 768px) {`
  - Line 1287: `@media` → `@media (max-width: 1024px) {`
  - Line 1302: `@media` → `@media (max-width: 768px) {`
  - Line 1502: `@media` → `@media (max-width: 768px) {`
  - Line 1810: `@media` → `@media (max-width: 600px) {`
  - Line 1816: `@media` → `@media (max-width: 480px) {`
  - Line 1847: `@media` → `@media (max-width: 360px) {`
  - Line 1867: `@media` → `@media (max-width: 700px) {`
  - Line 2041: `@media` → `@media (max-width: 1024px) {`
  - Line 2051: `@media` → `@media (max-width: 768px) {`
  - Line 2817: `@media` → `@media (max-width: 768px) {`
  - Line 2998: `@media` → `@media (max-width: 480px) {`
  - Line 3191: `@media` → `@media (max-width: 768px) {`
  - Line 3422: `@media` → `@media (max-width: 768px) {`
  - Line 3501: `@media` → `@media (max-width: 768px) {`
  - Line 3564: `@media` → `@media (max-width: 768px) {`
  - Line 3901: `@media` → `@media (max-width: 420px) {`
  - Line 4272: `@media` → `@media (max-width: 768px) {`
  - Line 4578: `@media` → `@media (max-width: 1120px) {`
  - Line 4608: `@media` → `@media (max-width: 768px) {`

**Potential clipping/density risks:**

  - Line 142: `overflow: hidden` → `overflow: hidden;`
  - Line 167: `overflow: hidden` → `overflow: hidden !important;`
  - Line 376: `overflow: hidden` → `overflow: hidden;`
  - Line 384: `overflow: hidden` → `overflow: hidden;`
  - Line 733: `overflow: hidden` → `overflow: hidden !important;`
  - Line 993: `overflow: hidden` → `overflow: hidden;`
  - Line 1142: `overflow: hidden` → `overflow: hidden;`
  - Line 1152: `overflow: hidden` → `overflow: hidden;`
  - Line 1207: `overflow: hidden` → `overflow: hidden; pointer-events: none;`
  - Line 1212: `overflow: hidden` → `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`
  - Line 1221: `overflow: hidden` → `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`
  - Line 1589: `overflow: hidden` → `overflow: hidden;`
  - Line 1774: `overflow: hidden` → `overflow: hidden !important;`
  - Line 1996: `overflow: hidden` → `overflow: hidden;`
  - Line 2001: `overflow: hidden` → `overflow: hidden;`
  - Line 2314: `overflow: hidden` → `overflow: hidden;`
  - Line 2820: `overflow: hidden` → `overflow: hidden;`
  - Line 3210: `overflow: hidden` → `overflow: hidden !important;`
  - Line 3457: `overflow: hidden` → `overflow: hidden !important;`
  - Line 3529: `overflow: hidden` → `overflow: hidden !important;`

### `src/pages/LandingPage.css`

**Responsive signals:**

  - Line 1391: `@media` → `@media (prefers-reduced-motion: reduce) {`
  - Line 1404: `@media` → `@media (min-width: 520px) {`
  - Line 1415: `@media` → `@media (min-width: 768px) {`
  - Line 1593: `@media` → `@media (min-width: 1120px) {`
  - Line 1604: `@media` → `@media (max-width: 380px) {`
  - Line 2080: `@media` → `@media (min-width: 768px) {`
  - Line 2092: `@media` → `@media (max-width: 767px) {`
  - Line 2175: `@media` → `@media (min-width: 768px) {`
  - Line 2183: `@media` → `@media (max-width: 767px) {`
  - Line 2432: `@media` → `@media (min-width: 768px) {`
  - Line 2443: `@media` → `@media (max-width: 767px) {`
  - Line 2520: `@media` → `@media (max-width: 767px) {`
  - Line 2535: `@media` → `@media (min-width: 768px) {`
  - Line 2567: `@media` → `@media (min-width: 1200px) {`
  - Line 2581: `@media` → `@media (min-width: 768px) and (max-height: 760px) {`
  - Line 2604: `@media` → `@media (max-width: 767px) {`
  - Line 2618: `@media` → `@media (max-width: 380px) {`
  - Line 2865: `@media` → `@media (max-width: 767px) {`
  - Line 2958: `@media` → `@media (max-width: 767px) {`
  - Line 3038: `@media` → `@media (max-width: 767px) {`

**Potential clipping/density risks:**

  - Line 124: `overflow: hidden` → `overflow: hidden;`
  - Line 149: `overflow: hidden` → `overflow: hidden;`
  - Line 519: `overflow: hidden` → `overflow: hidden;`
  - Line 952: `overflow: hidden` → `overflow: hidden;`
  - Line 963: `overflow: hidden` → `overflow: hidden;`
  - Line 1282: `overflow: hidden` → `overflow: hidden;`
  - Line 2656: `overflow: hidden` → `overflow: hidden !important;`
  - Line 3528: `overflow: hidden` → `overflow: hidden;`
  - Line 3586: `overflow: hidden` → `overflow: hidden;`
  - Line 5524: `overflow: hidden` → `overflow: hidden !important;`
  - Line 5692: `overflow: hidden` → `overflow: hidden !important;`
  - Line 5892: `overflow: hidden` → `overflow: hidden;`
  - Line 6011: `overflow: hidden` → `overflow: hidden !important;`
  - Line 6466: `overflow: hidden` → `overflow: hidden;`
  - Line 6548: `overflow: hidden` → `overflow: hidden;`
  - Line 6826: `overflow: hidden` → `overflow: hidden;`
  - Line 6877: `overflow: hidden` → `overflow: hidden;`
  - Line 7075: `overflow: hidden` → `overflow: hidden !important;`
  - Line 156: `white-space: nowrap` → `white-space: nowrap;`
  - Line 656: `white-space: nowrap` → `white-space: nowrap;`

### `src/pages/CustomersPage.css`

**Responsive signals:**

  - Line 1236: `@media` → `@media (max-width: 768px) {`
  - Line 1324: `@media` → `@media (max-width: 480px) {`
  - Line 1334: `@media` → `@media (max-width: 360px) {`
  - Line 1718: `@media` → `@media (max-width: 768px) {`
  - Line 1761: `@media` → `@media (max-width: 768px) {`
  - Line 1870: `@media` → `@media (max-width: 480px) {`
  - Line 1964: `@media` → `@media (max-width: 768px) {`
  - Line 2183: `@media` → `@media (max-width: 720px) {`
  - Line 2273: `@media` → `@media (max-width: 720px) {`
  - Line 2564: `@media` → `@media (hover: hover) and (pointer: fine) {`
  - Line 2701: `@media` → `@media (max-width: 920px) {`
  - Line 2742: `@media` → `@media (max-width: 640px) {`
  - Line 2777: `@media` → `@media (max-width: 420px) {`
  - Line 2789: `@media` → `@media (prefers-reduced-motion: reduce) {`
  - Line 2800: `@media` → `@media (hover: none), (pointer: coarse) {`
  - Line 2897: `@media` → `@media (hover: hover) and (pointer: fine) {`
  - Line 3101: `@media` → `@media (max-width: 860px) {`
  - Line 3139: `@media` → `@media (max-width: 620px) {`
  - Line 3180: `@media` → `@media (max-width: 380px) {`
  - Line 3190: `@media` → `@media (hover: none), (pointer: coarse) {`

**Potential clipping/density risks:**

  - Line 28: `overflow: hidden` → `overflow: hidden;`
  - Line 79: `overflow: hidden` → `overflow: hidden;`
  - Line 116: `overflow: hidden` → `overflow: hidden;`
  - Line 138: `overflow: hidden` → `overflow: hidden;`
  - Line 145: `overflow: hidden` → `overflow: hidden;`
  - Line 246: `overflow: hidden` → `overflow: hidden;`
  - Line 403: `overflow: hidden` → `overflow: hidden;`
  - Line 421: `overflow: hidden` → `overflow: hidden;`
  - Line 478: `overflow: hidden` → `overflow: hidden;`
  - Line 943: `overflow: hidden` → `overflow: hidden;`
  - Line 1119: `overflow: hidden` → `overflow: hidden;`
  - Line 1164: `overflow: hidden` → `overflow: hidden;`
  - Line 1641: `overflow: hidden` → `overflow: hidden;`
  - Line 2069: `overflow: hidden` → `overflow: hidden;`
  - Line 2209: `overflow: hidden` → `overflow: hidden;`
  - Line 2249: `overflow: hidden` → `overflow: hidden;`
  - Line 2358: `overflow: hidden` → `overflow: hidden;`
  - Line 3222: `overflow: hidden` → `overflow: hidden;`
  - Line 3276: `overflow: hidden` → `overflow: hidden;`
  - Line 3353: `overflow: hidden` → `overflow: hidden;`

### `src/pages/ClientPortal.css`

**Responsive signals:**

  - Line 488: `@media` → `@media (max-width: 900px) {`
  - Line 503: `@media` → `@media (max-width: 560px) {`
  - Line 1219: `@media` → `@media (max-width: 980px) {`
  - Line 1234: `@media` → `@media (max-width: 560px) {`
  - Line 1451: `@media` → `@media (max-width: 560px) {`
  - Line 1586: `@media` → `@media (max-width: 1100px) {`
  - Line 1604: `@media` → `@media (max-width: 860px) {`
  - Line 1705: `@media` → `@media (max-width: 560px) {`
  - Line 2008: `@media` → `@media (max-width: 380px) {`
  - Line 2027: `@media` → `@media (display-mode: standalone) {`
  - Line 2039: `@media` → `@media (prefers-reduced-motion: reduce) {`
  - Line 2343: `@media` → `@media (max-width: 980px) {`
  - Line 2354: `@media` → `@media (max-width: 560px) {`
  - Line 2478: `@media` → `@media (max-width: 720px) {`
  - Line 2717: `@media` → `@media (max-width: 980px) {`
  - Line 2724: `@media` → `@media (max-width: 560px) {`
  - Line 2817: `@media` → `@media (max-width: 720px) {`
  - Line 2846: `@media` → `@media (max-width: 380px) {`
  - Line 3109: `@media` → `@media (max-width: 980px) {`
  - Line 3117: `@media` → `@media (max-width: 560px) {`

**Potential clipping/density risks:**

  - Line 28: `overflow: hidden` → `overflow: hidden;`
  - Line 215: `overflow: hidden` → `overflow: hidden;`
  - Line 515: `overflow: hidden` → `overflow: hidden;`
  - Line 860: `overflow: hidden` → `overflow: hidden;`
  - Line 1737: `overflow: hidden` → `overflow: hidden;`
  - Line 1749: `overflow: hidden` → `overflow: hidden;`
  - Line 1836: `overflow: hidden` → `overflow: hidden;`
  - Line 1880: `overflow: hidden` → `overflow: hidden;`
  - Line 2109: `overflow: hidden` → `overflow: hidden;`
  - Line 2770: `overflow: hidden` → `overflow: hidden;`
  - Line 4298: `overflow: hidden` → `overflow: hidden;`
  - Line 4328: `overflow: hidden` → `overflow: hidden;`
  - Line 4562: `overflow: hidden` → `overflow: hidden;`
  - Line 4692: `overflow: hidden` → `overflow: hidden;`
  - Line 5043: `overflow: hidden` → `overflow: hidden;`
  - Line 5174: `overflow: hidden` → `overflow: hidden;`
  - Line 5286: `overflow: hidden` → `overflow: hidden;`
  - Line 5441: `overflow: hidden` → `overflow: hidden;`
  - Line 5729: `overflow: hidden` → `overflow: hidden;`
  - Line 5751: `overflow: hidden` → `overflow: hidden;`

### `src/pages/ClientMessagesInboxPolish.css`

**Responsive signals:**

  - Line 502: `@media` → `@media (max-width: 1220px) {`
  - Line 508: `@media` → `@media (max-width: 1040px) {`
  - Line 541: `@media` → `@media (max-width: 760px) {`
  - Line 610: `@media` → `@media (max-width: 480px) {`
  - Line 14: `clamp(` → `padding: clamp(12px, 2vw, 22px) !important;`
  - Line 41: `clamp(` → `padding: clamp(18px, 2.5vw, 28px) !important;`
  - Line 80: `clamp(` → `font-size: clamp(2.2rem, 5.2vw, 4.75rem) !important;`
  - Line 91: `clamp(` → `font-size: clamp(0.88rem, 1.2vw, 0.98rem) !important;`
  - Line 126: `clamp(` → `font-size: clamp(1.8rem, 3.2vw, 2.7rem) !important;`
  - Line 133: `clamp(` → `min-height: clamp(620px, calc(100vh - 240px), 780px) !important;`
  - Line 370: `clamp(` → `font-size: clamp(1.05rem, 1.6vw, 1.35rem) !important;`
  - Line 38: `minmax(` → `grid-template-columns: minmax(0, 1.35fr) minmax(280px, 420px) !important;`
  - Line 38: `minmax(` → `grid-template-columns: minmax(0, 1.35fr) minmax(280px, 420px) !important;`
  - Line 98: `minmax(` → `grid-template-columns: repeat(3, minmax(0, 1fr)) !important;`
  - Line 135: `minmax(` → `grid-template-columns: 230px minmax(300px, 0.86fr) minmax(360px, 1.16fr) !important;`
  - Line 135: `minmax(` → `grid-template-columns: 230px minmax(300px, 0.86fr) minmax(360px, 1.16fr) !important;`
  - Line 196: `minmax(` → `grid-template-columns: 34px minmax(0, 1fr) auto !important;`
  - Line 281: `minmax(` → `grid-template-columns: 38px minmax(0, 1fr) !important;`
  - Line 353: `minmax(` → `grid-template-columns: minmax(0, 1fr) auto !important;`
  - Line 392: `minmax(` → `grid-template-columns: repeat(3, minmax(0, 1fr)) !important;`

**Potential clipping/density risks:**

  - Line 43: `overflow: hidden` → `overflow: hidden !important;`
  - Line 139: `overflow: hidden` → `overflow: hidden !important;`
  - Line 155: `overflow: hidden` → `overflow: hidden !important;`
  - Line 9: `height:` → `min-height: 100% !important;`
  - Line 61: `height:` → `min-height: 30px !important;`
  - Line 82: `height:` → `line-height: 0.94 !important;`
  - Line 93: `height:` → `line-height: 1.55 !important;`
  - Line 104: `height:` → `min-height: 112px !important;`
  - Line 127: `height:` → `line-height: 0.9 !important;`
  - Line 133: `height:` → `min-height: clamp(620px, calc(100vh - 240px), 780px) !important;`
  - Line 150: `height:` → `min-height: 0 !important;`
  - Line 166: `height:` → `min-height: 42px !important;`
  - Line 184: `height:` → `height: 32px !important;`
  - Line 195: `height:` → `min-height: 54px !important;`
  - Line 212: `height:` → `height: 34px !important;`
  - Line 229: `height:` → `height: 24px !important;`
  - Line 260: `height:` → `min-height: 40px !important;`
  - Line 280: `height:` → `min-height: 86px !important;`
  - Line 302: `height:` → `height: 38px !important;`
  - Line 346: `height:` → `min-height: 21px !important;`

### `src/pages/ClientMessagesInbox.css`

**Responsive signals:**

  - Line 696: `@media` → `@media (max-width: 1180px) {`
  - Line 702: `@media` → `@media (max-width: 980px) {`
  - Line 744: `@media` → `@media (max-width: 680px) {`
  - Line 946: `@media` → `@media (max-width: 680px) {`
  - Line 1287: `@media` → `@media (max-width: 980px) {`
  - Line 1324: `@media` → `@media (max-width: 680px) {`
  - Line 998: `container-type` → `container-type: inline-size;`
  - Line 1091: `@container` → `@container (max-width: 980px) {`
  - Line 1203: `@container` → `@container (max-width: 560px) {`
  - Line 13: `clamp(` → `gap: clamp(16px, 2.4vw, 28px);`
  - Line 15: `clamp(` → `padding: clamp(20px, 3.2vw, 34px);`
  - Line 31: `clamp(` → `font-size: clamp(3.2rem, 6.8vw, 6.2rem);`
  - Line 75: `clamp(` → `font-size: clamp(2rem, 4vw, 3.1rem);`
  - Line 478: `clamp(` → `font-size: clamp(1.18rem, 2vw, 1.6rem);`
  - Line 1005: `clamp(` → `padding: clamp(18px, 2.4vw, 28px);`
  - Line 1015: `clamp(` → `font-size: clamp(2.7rem, 7cqi, 5.6rem);`
  - Line 1023: `clamp(` → `font-size: clamp(0.86rem, 1.5cqi, 1rem);`
  - Line 1040: `clamp(` → `font-size: clamp(1.9rem, 4cqi, 2.8rem);`
  - Line 1102: `clamp(` → `font-size: clamp(2.4rem, 8cqi, 4.1rem);`
  - Line 1224: `clamp(` → `font-size: clamp(2.1rem, 13cqi, 3.2rem);`

**Potential clipping/density risks:**

  - Line 10: `overflow: hidden` → `overflow: hidden;`
  - Line 99: `overflow: hidden` → `overflow: hidden;`
  - Line 239: `overflow: hidden` → `overflow: hidden;`
  - Line 363: `overflow: hidden` → `overflow: hidden;`
  - Line 416: `overflow: hidden` → `overflow: hidden;`
  - Line 531: `overflow: hidden` → `overflow: hidden;`
  - Line 859: `overflow: hidden` → `overflow: hidden;`
  - Line 365: `white-space: nowrap` → `white-space: nowrap;`
  - Line 533: `white-space: nowrap` → `white-space: nowrap;`
  - Line 864: `position: absolute` → `position: absolute;`
  - Line 32: `height:` → `line-height: 0.88;`
  - Line 43: `height:` → `line-height: 1.62;`
  - Line 53: `height:` → `min-height: 128px;`
  - Line 76: `height:` → `line-height: 0.9;`
  - Line 85: `height:` → `min-height: min(720px, calc(100vh - 220px));`
  - Line 106: `height:` → `min-height: 0;`
  - Line 121: `height:` → `min-height: 50px;`
  - Line 138: `height:` → `height: 34px;`
  - Line 155: `height:` → `min-height: 58px;`
  - Line 186: `height:` → `height: 38px;`

### `src/pages/FinancePage.css`

**Responsive signals:**

  - Line 668: `@media` → `@media (max-width: 1280px) {`
  - Line 674: `@media` → `@media (max-width: 1024px) {`
  - Line 688: `@media` → `@media (max-width: 768px) {`
  - Line 759: `@media` → `@media (max-width: 480px) {`
  - Line 797: `@media` → `@media print {`
  - Line 1145: `@media` → `@media (min-width: 1025px) {`
  - Line 1219: `@media` → `@media (min-width: 1200px) {`
  - Line 1226: `@media` → `@media (min-width: 1440px) {`
  - Line 1570: `@media` → `@media (max-width: 768px) {`
  - Line 1703: `@media` → `@media (max-width: 480px) {`
  - Line 2105: `@media` → `@media (hover: none) {`
  - Line 2118: `@media` → `@media (max-width: 768px) {`
  - Line 2192: `@media` → `@media (max-width: 480px) {`
  - Line 2213: `@media` → `@media (prefers-reduced-motion: reduce) {`
  - Line 2537: `@media` → `@media (max-width: 1100px) {`
  - Line 2570: `@media` → `@media (max-width: 768px) {`
  - Line 2648: `@media` → `@media (max-width: 420px) {`
  - Line 2670: `@media` → `@media (hover: none) {`
  - Line 3082: `@media` → `@media (min-width: 769px) and (max-width: 1199px) {`
  - Line 3098: `@media` → `@media (max-width: 768px) {`

**Potential clipping/density risks:**

  - Line 131: `overflow: hidden` → `overflow: hidden;`
  - Line 216: `overflow: hidden` → `overflow: hidden;`
  - Line 234: `overflow: hidden` → `overflow: hidden;`
  - Line 361: `overflow: hidden` → `overflow: hidden;`
  - Line 382: `overflow: hidden` → `overflow: hidden;`
  - Line 536: `overflow: hidden` → `overflow: hidden;`
  - Line 1132: `overflow: hidden` → `overflow: hidden;`
  - Line 1265: `overflow: hidden` → `overflow: hidden;`
  - Line 1453: `overflow: hidden` → `overflow: hidden;`
  - Line 1792: `overflow: hidden` → `overflow: hidden;`
  - Line 2156: `overflow: hidden` → `overflow: hidden;`
  - Line 2307: `overflow: hidden` → `overflow: hidden;`
  - Line 2633: `overflow: hidden` → `overflow: hidden;`
  - Line 2702: `overflow: hidden` → `overflow: hidden;`
  - Line 2810: `overflow: hidden` → `overflow: hidden;`
  - Line 3016: `overflow: hidden` → `overflow: hidden;`
  - Line 3361: `overflow: hidden` → `overflow: hidden;`
  - Line 3437: `overflow: hidden` → `overflow: hidden;`
  - Line 3519: `overflow: hidden` → `overflow: hidden;`
  - Line 3600: `overflow: hidden` → `overflow: hidden;`

### `src/styles/flat-minimal-system.css`

**Responsive signals:**

  - Line 667: `@media` → `@media (prefers-reduced-motion: reduce) {`
  - Line 679: `@media` → `@media (max-width: 1024px) {`
  - Line 825: `@media` → `@media (max-width: 480px) {`
  - Line 1075: `@media` → `@media (hover: hover) and (pointer: fine) and (min-width: 1025px) {`
  - Line 1324: `@media` → `@media (max-width: 1024px) {`
  - Line 1423: `@media` → `@media (max-width: 480px) {`
  - Line 1809: `@media` → `@media (max-width: 1200px) {`
  - Line 1824: `@media` → `@media (max-width: 768px) {`
  - Line 1898: `@media` → `@media (max-width: 480px) {`
  - Line 2078: `@media` → `@media (min-width: 769px) {`
  - Line 2567: `@media` → `@media (max-width: 1024px) {`
  - Line 2658: `@media` → `@media (max-width: 768px) {`
  - Line 2729: `@media` → `@media (max-width: 480px) {`
  - Line 3136: `@media` → `@media (max-width: 1024px) {`
  - Line 3184: `@media` → `@media (max-width: 640px) {`
  - Line 3651: `@media` → `@media (max-width: 1024px) {`
  - Line 3699: `@media` → `@media (max-width: 640px) {`
  - Line 4028: `@media` → `@media (max-width: 1024px) {`
  - Line 4081: `@media` → `@media (max-width: 640px) {`
  - Line 4414: `@media` → `@media (max-width: 768px) {`

**Potential clipping/density risks:**

  - Line 1045: `overflow: hidden` → `overflow: hidden !important;`
  - Line 1226: `overflow: hidden` → `overflow: hidden !important;`
  - Line 1300: `overflow: hidden` → `overflow: hidden !important;`
  - Line 1479: `overflow: hidden` → `overflow: hidden !important;`
  - Line 1941: `overflow: hidden` → `overflow: hidden !important;`
  - Line 2002: `overflow: hidden` → `overflow: hidden !important;`
  - Line 2398: `overflow: hidden` → `overflow: hidden !important;`
  - Line 2798: `overflow: hidden` → `overflow: hidden !important;`
  - Line 3013: `overflow: hidden` → `overflow: hidden !important;`
  - Line 3062: `overflow: hidden` → `overflow: hidden !important;`
  - Line 3077: `overflow: hidden` → `overflow: hidden !important;`
  - Line 3083: `overflow: hidden` → `overflow: hidden !important;`
  - Line 3247: `overflow: hidden` → `overflow: hidden !important;`
  - Line 3495: `overflow: hidden` → `overflow: hidden !important;`
  - Line 3566: `overflow: hidden` → `overflow: hidden !important;`
  - Line 3581: `overflow: hidden` → `overflow: hidden !important;`
  - Line 3587: `overflow: hidden` → `overflow: hidden !important;`
  - Line 3764: `overflow: hidden` → `overflow: hidden !important;`
  - Line 4164: `overflow: hidden` → `overflow: hidden !important;`
  - Line 4612: `overflow: hidden` → `overflow: hidden !important;`

### `src/pages/BillingPage.css`

**Responsive signals:**

  - Line 707: `@media` → `@media (max-width: 768px) {`
  - Line 761: `@media` → `@media (max-width: 480px) {`
  - Line 769: `@media` → `@media (max-width: 360px) {`
  - Line 790: `@media` → `@media (max-width: 992px) {`
  - Line 1549: `@media` → `@media (max-width: 900px) {`
  - Line 1554: `@media` → `@media (max-width: 600px) {`
  - Line 1582: `@media` → `@media (max-width: 480px) {`
  - Line 1590: `@media` → `@media print {`
  - Line 1819: `@media` → `@media (max-width: 768px) {`
  - Line 2122: `@media` → `@media (max-width: 768px) {`
  - Line 2235: `@media` → `@media (max-width: 480px) {`
  - Line 2253: `@media` → `@media (max-width: 360px) {`
  - Line 2555: `@media` → `@media (max-width: 1100px) {`
  - Line 2569: `@media` → `@media (max-width: 768px) {`
  - Line 2668: `@media` → `@media (hover: none) {`
  - Line 2677: `@media` → `@media (prefers-reduced-motion: reduce) {`
  - Line 3016: `@media` → `@media (max-width: 1024px) {`
  - Line 3027: `@media` → `@media (max-width: 768px) {`
  - Line 3084: `@media` → `@media (max-width: 420px) {`
  - Line 3112: `@media` → `@media (hover: none) {`

**Potential clipping/density risks:**

  - Line 34: `overflow: hidden` → `overflow: hidden;`
  - Line 166: `overflow: hidden` → `overflow: hidden;`
  - Line 240: `overflow: hidden` → `overflow: hidden;`
  - Line 283: `overflow: hidden` → `overflow: hidden;`
  - Line 347: `overflow: hidden` → `overflow: hidden;`
  - Line 376: `overflow: hidden` → `overflow: hidden;`
  - Line 607: `overflow: hidden` → `overflow: hidden;`
  - Line 809: `overflow: hidden` → `overflow: hidden;`
  - Line 1736: `overflow: hidden` → `overflow: hidden;`
  - Line 2298: `overflow: hidden` → `overflow: hidden;`
  - Line 2403: `overflow: hidden` → `overflow: hidden;`
  - Line 2454: `overflow: hidden` → `overflow: hidden;`
  - Line 2610: `overflow: hidden` → `overflow: hidden;`
  - Line 2924: `overflow: hidden` → `overflow: hidden;`
  - Line 3292: `overflow: hidden` → `overflow: hidden;`
  - Line 3345: `overflow: hidden` → `overflow: hidden;`
  - Line 3546: `overflow: hidden` → `overflow: hidden;`
  - Line 3614: `overflow: hidden` → `overflow: hidden;`
  - Line 3664: `overflow: hidden` → `overflow: hidden;`
  - Line 3927: `overflow: hidden` → `overflow: hidden !important;`

### `src/pages/SettingsPage.css`

**Responsive signals:**

  - Line 694: `@media` → `@media (max-width: 900px) {`
  - Line 700: `@media` → `@media (max-width: 768px) {`
  - Line 777: `@media` → `@media (max-width: 480px) {`
  - Line 818: `@media` → `@media (max-width: 360px) {`
  - Line 1012: `@media` → `@media (max-width: 768px) {`
  - Line 1017: `@media` → `@media (max-width: 480px) {`
  - Line 1155: `@media` → `@media (max-width: 768px) {`
  - Line 1259: `@media` → `@media (max-width: 768px) {`
  - Line 1415: `@media` → `@media (max-width: 480px) {`
  - Line 1688: `@media` → `@media (max-width: 980px) {`
  - Line 1698: `@media` → `@media (max-width: 768px) {`
  - Line 1777: `@media` → `@media (max-width: 420px) {`
  - Line 1791: `@media` → `@media (hover: none) {`
  - Line 1797: `@media` → `@media (prefers-reduced-motion: reduce) {`
  - Line 2066: `@media` → `@media (max-width: 1100px) {`
  - Line 2080: `@media` → `@media (max-width: 768px) {`
  - Line 2194: `@media` → `@media (max-width: 420px) {`
  - Line 2215: `@media` → `@media (hover: none) {`
  - Line 2221: `@media` → `@media (prefers-reduced-motion: reduce) {`
  - Line 2282: `@media` → `@media (max-width: 768px) {`

**Potential clipping/density risks:**

  - Line 139: `overflow: hidden` → `overflow: hidden;`
  - Line 171: `overflow: hidden` → `overflow: hidden;`
  - Line 338: `overflow: hidden` → `overflow: hidden;`
  - Line 732: `overflow: hidden` → `overflow: hidden;`
  - Line 744: `overflow: hidden` → `overflow: hidden;`
  - Line 1490: `overflow: hidden` → `overflow: hidden;`
  - Line 1736: `overflow: hidden` → `overflow: hidden;`
  - Line 1889: `overflow: hidden` → `overflow: hidden;`
  - Line 2046: `overflow: hidden` → `overflow: hidden;`
  - Line 2357: `overflow: hidden` → `overflow: hidden;`
  - Line 2545: `overflow: hidden` → `overflow: hidden;`
  - Line 2753: `overflow: hidden` → `overflow: hidden;`
  - Line 2885: `overflow: hidden` → `overflow: hidden;`
  - Line 2962: `overflow: hidden` → `overflow: hidden;`
  - Line 3179: `overflow: hidden` → `overflow: hidden;`
  - Line 3504: `overflow: hidden` → `overflow: hidden;`
  - Line 3604: `overflow: hidden` → `overflow: hidden;`
  - Line 3688: `overflow: hidden` → `overflow: hidden;`
  - Line 4099: `overflow: hidden` → `overflow: hidden;`
  - Line 4212: `overflow: hidden` → `overflow: hidden;`

### `src/pages/DashboardPage.css`

**Responsive signals:**

  - Line 14: `@media` → `@media (max-width: 768px) {`
  - Line 825: `@media` → `@media (max-width: 1400px) {`
  - Line 833: `@media` → `@media (max-width: 1024px) {`
  - Line 838: `@media` → `@media (max-width: 768px) {`
  - Line 852: `@media` → `@media (max-width: 480px) {`
  - Line 866: `@media` → `@media (max-width: 360px) {`
  - Line 954: `@media` → `@media (max-width: 768px) {`
  - Line 1315: `@media` → `@media (max-width: 1100px) {`
  - Line 1329: `@media` → `@media (max-width: 768px) {`
  - Line 1581: `@media` → `@media (max-width: 480px) {`
  - Line 1605: `@media` → `@media (max-width: 375px) {`
  - Line 1620: `@media` → `@media (max-width: 360px) {`
  - Line 1931: `@media` → `@media (max-width: 768px) {`
  - Line 2337: `@media` → `@media (max-width: 1180px) {`
  - Line 2354: `@media` → `@media (max-width: 768px) {`
  - Line 2432: `@media` → `@media (max-width: 430px) {`
  - Line 2880: `@media` → `@media (max-width: 1180px) {`
  - Line 2890: `@media` → `@media (max-width: 768px) {`
  - Line 2952: `@media` → `@media (max-width: 430px) {`
  - Line 3580: `@media` → `@media (max-width: 1180px) {`

**Potential clipping/density risks:**

  - Line 38: `overflow: hidden` → `overflow: hidden;`
  - Line 296: `overflow: hidden` → `overflow: hidden;`
  - Line 374: `overflow: hidden` → `overflow: hidden;`
  - Line 468: `overflow: hidden` → `overflow: hidden;`
  - Line 638: `overflow: hidden` → `overflow: hidden;`
  - Line 789: `overflow: hidden` → `overflow: hidden;`
  - Line 971: `overflow: hidden` → `overflow: hidden;`
  - Line 1116: `overflow: hidden` → `overflow: hidden;`
  - Line 1434: `overflow: hidden` → `overflow: hidden;`
  - Line 1590: `overflow: hidden` → `overflow: hidden;`
  - Line 1706: `overflow: hidden` → `overflow: hidden !important;`
  - Line 1996: `overflow: hidden` → `overflow: hidden !important;`
  - Line 2440: `overflow: hidden` → `overflow: hidden;`
  - Line 2474: `overflow: hidden` → `overflow: hidden !important;`
  - Line 2735: `overflow: hidden` → `overflow: hidden !important;`
  - Line 3005: `overflow: hidden` → `overflow: hidden !important;`
  - Line 3124: `overflow: hidden` → `overflow: hidden !important;`
  - Line 3154: `overflow: hidden` → `overflow: hidden;`
  - Line 3352: `overflow: hidden` → `overflow: hidden;`
  - Line 3437: `overflow: hidden` → `overflow: hidden;`

### `src/components/Sidebar.css`

**Responsive signals:**

  - Line 554: `@media` → `@media (max-width: 1024px) {`
  - Line 1027: `@media` → `@media (max-width: 1024px) {`
  - Line 1285: `@media` → `@media (max-width: 380px) {`
  - Line 1601: `@media` → `@media (max-width: 1024px) {`
  - Line 1648: `@media` → `@media (max-width: 480px) {`
  - Line 1678: `@media` → `@media (max-width: 1024px) {`
  - Line 1943: `@media` → `@media (max-width: 420px) {`
  - Line 2006: `@media` → `@media (max-width: 1024px) {`
  - Line 2072: `@media` → `@media (max-width: 1024px) {`
  - Line 2189: `@media` → `@media (max-width: 420px) {`
  - Line 2255: `@media` → `@media (max-width: 1024px) {`
  - Line 2469: `@media` → `@media (max-width: 420px) {`
  - Line 2508: `@media` → `@media (max-width: 1024px) {`
  - Line 2542: `@media` → `@media (max-width: 1024px) {`
  - Line 2581: `@media` → `@media (max-width: 1024px) {`
  - Line 2840: `@media` → `@media (max-width: 420px) {`
  - Line 2875: `@media` → `@media (max-width: 1024px) {`
  - Line 2917: `@media` → `@media (max-width: 1024px) {`
  - Line 3415: `@media` → `@media (max-width: 420px) {`
  - Line 3472: `@media` → `@media (max-width: 360px) {`

**Potential clipping/density risks:**

  - Line 83: `overflow: hidden` → `overflow: hidden;`
  - Line 180: `overflow: hidden` → `overflow: hidden;`
  - Line 286: `overflow: hidden` → `overflow: hidden;`
  - Line 389: `overflow: hidden` → `overflow: hidden;`
  - Line 404: `overflow: hidden` → `overflow: hidden;`
  - Line 515: `overflow: hidden` → `overflow: hidden;`
  - Line 1097: `overflow: hidden` → `overflow: hidden;`
  - Line 1192: `overflow: hidden` → `overflow: hidden;`
  - Line 1429: `overflow: hidden` → `overflow: hidden;`
  - Line 1795: `overflow: hidden` → `overflow: hidden !important;`
  - Line 1935: `overflow: hidden` → `overflow: hidden !important;`
  - Line 2086: `overflow: hidden` → `overflow: hidden !important;`
  - Line 2106: `overflow: hidden` → `overflow: hidden !important;`
  - Line 2278: `overflow: hidden` → `overflow: hidden !important;`
  - Line 2336: `overflow: hidden` → `overflow: hidden !important;`
  - Line 2418: `overflow: hidden` → `overflow: hidden !important;`
  - Line 2608: `overflow: hidden` → `overflow: hidden !important;`
  - Line 2700: `overflow: hidden` → `overflow: hidden !important;`
  - Line 2789: `overflow: hidden` → `overflow: hidden !important;`
  - Line 2934: `overflow: hidden` → `overflow: hidden !important;`

### `src/pages/PublicCalendarPage.css`

**Responsive signals:**

  - Line 71: `@media` → `@media (prefers-reduced-motion: reduce) {`
  - Line 236: `@media` → `@media (max-width: 1023px) {`
  - Line 250: `@media` → `@media (max-width: 640px) {`
  - Line 499: `@media` → `@media (max-width: 1023px) {`
  - Line 506: `@media` → `@media (max-width: 640px) {`
  - Line 554: `@media` → `@media (max-width: 640px) {`
  - Line 784: `@media` → `@media (max-width: 374px) {`
  - Line 1024: `@media` → `@media (max-width: 1023px) {`
  - Line 1051: `@media` → `@media (max-width: 640px) {`
  - Line 1223: `@media` → `@media (max-width: 1023px) {`
  - Line 1233: `@media` → `@media (max-width: 640px) {`
  - Line 1447: `@media` → `@media (max-width: 1023px) {`
  - Line 1462: `@media` → `@media (max-width: 640px) {`
  - Line 1594: `@media` → `@media (max-width: 640px) {`
  - Line 1810: `@media` → `@media (max-width: 1023px) {`
  - Line 1833: `@media` → `@media (max-width: 640px) {`
  - Line 1942: `@media` → `@media (max-width: 640px) {`
  - Line 2425: `@media` → `@media (max-width: 720px) {`
  - Line 2504: `@media` → `@media (max-width: 390px) {`
  - Line 2563: `@media` → `@media (max-width: 720px) {`

**Potential clipping/density risks:**

  - Line 94: `overflow: hidden` → `overflow: hidden !important;`
  - Line 825: `overflow: hidden` → `overflow: hidden;`
  - Line 1309: `overflow: hidden` → `overflow: hidden !important;`
  - Line 1521: `overflow: hidden` → `overflow: hidden !important;`
  - Line 1707: `overflow: hidden` → `overflow: hidden;`
  - Line 1804: `overflow: hidden` → `overflow: hidden;`
  - Line 2351: `overflow: hidden` → `overflow: hidden;`
  - Line 405: `white-space: nowrap` → `white-space: nowrap !important;`
  - Line 714: `white-space: nowrap` → `white-space: nowrap !important;`
  - Line 871: `white-space: nowrap` → `white-space: nowrap !important;`
  - Line 1304: `white-space: nowrap` → `white-space: nowrap !important;`
  - Line 2353: `white-space: nowrap` → `white-space: nowrap;`
  - Line 2706: `white-space: nowrap` → `white-space: nowrap !important;`
  - Line 454: `position: absolute` → `position: absolute;`
  - Line 843: `position: absolute` → `position: absolute;`
  - Line 1391: `position: absolute` → `position: absolute;`
  - Line 1543: `position: absolute` → `position: absolute;`
  - Line 1634: `position: absolute` → `position: absolute;`
  - Line 1767: `position: absolute` → `position: absolute;`
  - Line 1776: `position: absolute` → `position: absolute;`

### `src/pages/GalleryPage.css`

**Responsive signals:**

  - Line 717: `@media` → `@media (min-width: 1025px) {`
  - Line 1536: `@media` → `@media (max-width: 1100px) {`
  - Line 1548: `@media` → `@media (max-width: 768px) {`
  - Line 1589: `@media` → `@media (max-width: 480px) {`
  - Line 1768: `@media` → `@media (max-width: 768px) {`
  - Line 1799: `@media` → `@media (max-width: 768px) {`
  - Line 2073: `@media` → `@media (max-width: 980px) {`
  - Line 2079: `@media` → `@media (max-width: 768px) {`
  - Line 2146: `@media` → `@media (max-width: 390px) {`
  - Line 2427: `@media` → `@media (max-width: 820px) {`
  - Line 2433: `@media` → `@media (max-width: 768px) {`
  - Line 2510: `@media` → `@media (max-width: 430px) {`
  - Line 2782: `@media` → `@media (max-width: 920px) {`
  - Line 2802: `@media` → `@media (max-width: 768px) {`
  - Line 2858: `@media` → `@media (max-width: 430px) {`
  - Line 2879: `@media` → `@media (max-width: 360px) {`
  - Line 3281: `@media` → `@media (max-width: 1180px) {`
  - Line 3287: `@media` → `@media (max-width: 900px) {`
  - Line 3293: `@media` → `@media (max-width: 768px) {`
  - Line 3361: `@media` → `@media (max-width: 520px) {`

**Potential clipping/density risks:**

  - Line 11: `overflow: hidden` → `overflow: hidden;`
  - Line 76: `overflow: hidden` → `overflow: hidden;`
  - Line 120: `overflow: hidden` → `overflow: hidden;`
  - Line 298: `overflow: hidden` → `overflow: hidden;`
  - Line 393: `overflow: hidden` → `overflow: hidden;`
  - Line 401: `overflow: hidden` → `overflow: hidden;`
  - Line 496: `overflow: hidden` → `overflow: hidden;`
  - Line 574: `overflow: hidden` → `overflow: hidden;`
  - Line 1082: `overflow: hidden` → `overflow: hidden;`
  - Line 1144: `overflow: hidden` → `overflow: hidden;`
  - Line 1285: `overflow: hidden` → `overflow: hidden;`
  - Line 1309: `overflow: hidden` → `overflow: hidden;`
  - Line 1871: `overflow: hidden` → `overflow: hidden;`
  - Line 2122: `overflow: hidden` → `overflow: hidden;`
  - Line 2187: `overflow: hidden` → `overflow: hidden;`
  - Line 2463: `overflow: hidden` → `overflow: hidden;`
  - Line 2561: `overflow: hidden` → `overflow: hidden;`
  - Line 2882: `overflow: hidden` → `overflow: hidden;`
  - Line 2946: `overflow: hidden` → `overflow: hidden;`
  - Line 3207: `overflow: hidden` → `overflow: hidden;`

### `docs/phase-3-admin-inbox-anchor-inspection.md`

**Responsive signals:**

- Tidak ada responsive signal.

**Potential clipping/density risks:**

- Tidak ada risk signal.

### `src/index.css`

**Responsive signals:**

  - Line 267: `@media` → `@media (max-width: 1024px) {`
  - Line 281: `@media` → `@media (max-width: 480px) {`
  - Line 290: `@media` → `@media (max-width: 360px) {`
  - Line 299: `@media` → `@media (max-width: 1024px) {`
  - Line 2298: `@media` → `@media (max-width: 1024px) {`
  - Line 2326: `@media` → `@media (min-width: 1025px) {`
  - Line 2332: `@media` → `@media (max-width: 1024px) {`
  - Line 2415: `@media` → `@media (max-width: 1024px) {`
  - Line 3011: `@media` → `@media (max-width: 767px) {`
  - Line 3104: `@media` → `@media (max-width: 767px) {`
  - Line 3397: `@media` → `@media (max-width: 560px) {`
  - Line 3436: `@media` → `@media (display-mode: standalone) {`
  - Line 3451: `@media` → `@media (min-width: 769px) {`
  - Line 3475: `@media` → `@media (min-width: 769px) and (max-width: 1024px) {`
  - Line 3599: `@media` → `@media (min-width: 769px) {`
  - Line 3614: `@media` → `@media (min-width: 769px) and (max-width: 1180px) {`
  - Line 3621: `@media` → `@media (max-width: 768px) {`
  - Line 2173: `clamp(` → `width: clamp(220px, 24vw, 320px);`
  - Line 2181: `clamp(` → `width: clamp(280px, 32vw, 420px);`
  - Line 3580: `clamp(` → `padding: clamp(1rem, 2vw, 1.6rem) !important;`

**Potential clipping/density risks:**

  - Line 224: `overflow: hidden` → `overflow: hidden;`
  - Line 1044: `overflow: hidden` → `overflow: hidden !important;`
  - Line 1084: `overflow: hidden` → `overflow: hidden;`
  - Line 1247: `overflow: hidden` → `overflow: hidden !important;`
  - Line 1722: `overflow: hidden` → `overflow: hidden;`
  - Line 2389: `overflow: hidden` → `overflow: hidden;`
  - Line 2643: `overflow: hidden` → `overflow: hidden;`
  - Line 2802: `overflow: hidden` → `overflow: hidden !important;`
  - Line 3457: `overflow: hidden` → `overflow: hidden !important;`
  - Line 3514: `overflow: hidden` → `overflow: hidden !important;`
  - Line 3537: `overflow: hidden` → `overflow: hidden !important;`
  - Line 3625: `overflow: hidden` → `overflow: hidden !important;`
  - Line 1006: `white-space: nowrap` → `white-space: nowrap !important;`
  - Line 1086: `white-space: nowrap` → `white-space: nowrap;`
  - Line 1747: `white-space: nowrap` → `white-space: nowrap;`
  - Line 1845: `white-space: nowrap` → `white-space: nowrap;`
  - Line 2570: `white-space: nowrap` → `white-space: nowrap;`
  - Line 1286: `position: absolute` → `position: absolute !important;`
  - Line 2394: `position: absolute` → `position: absolute;`
  - Line 2443: `position: absolute` → `position: absolute;`

### `src/pages/ClientMessagesPage.jsx`

**Responsive signals:**

- Tidak ada responsive signal.

**Potential clipping/density risks:**

- Tidak ada risk signal.

### `src/components/BookingForm.css`

**Responsive signals:**

  - Line 464: `@media` → `@media (max-width: 480px) {`
  - Line 490: `@media` → `@media (max-width: 360px) {`
  - Line 512: `@media` → `@media (max-width: 768px) {`
  - Line 1103: `@media` → `@media (max-width: 768px) {`
  - Line 1210: `@media` → `@media (max-width: 420px) {`
  - Line 1624: `@media` → `@media (max-width: 768px) {`
  - Line 1671: `@media` → `@media (max-width: 768px) {`
  - Line 1745: `@media` → `@media (hover: none), (pointer: coarse) {`
  - Line 1759: `@media` → `@media (prefers-reduced-motion: reduce) {`
  - Line 1888: `@media` → `@media (max-width: 768px) {`
  - Line 2101: `@media` → `@media (max-width: 768px) {`
  - Line 2140: `@media` → `@media (max-width: 520px) {`
  - Line 2457: `@media` → `@media (max-width: 768px) {`
  - Line 2636: `@media` → `@media (max-width: 768px) {`
  - Line 2656: `@media` → `@media (max-width: 768px) {`
  - Line 2765: `@media` → `@media (max-width: 420px) {`
  - Line 2791: `@media` → `@media (max-width: 768px) {`
  - Line 2814: `@media` → `@media (max-width: 420px) {`
  - Line 722: `clamp(` → `font-size: clamp(1.05rem, 2vw, 1.34rem) !important;`
  - Line 1365: `clamp(` → `font-size: clamp(1.65rem, 3vw, 2.25rem) !important;`

**Potential clipping/density risks:**

  - Line 199: `overflow: hidden` → `overflow: hidden;`
  - Line 382: `overflow: hidden` → `overflow: hidden;`
  - Line 591: `overflow: hidden` → `overflow: hidden !important;`
  - Line 628: `overflow: hidden` → `overflow: hidden !important;`
  - Line 718: `overflow: hidden` → `overflow: hidden !important;`
  - Line 818: `overflow: hidden` → `overflow: hidden !important;`
  - Line 926: `overflow: hidden` → `overflow: hidden !important;`
  - Line 1027: `overflow: hidden` → `overflow: hidden !important;`
  - Line 1906: `overflow: hidden` → `overflow: hidden !important;`
  - Line 1927: `overflow: hidden` → `overflow: hidden !important;`
  - Line 1944: `overflow: hidden` → `overflow: hidden !important;`
  - Line 1952: `overflow: hidden` → `overflow: hidden !important;`
  - Line 1976: `overflow: hidden` → `overflow: hidden !important;`
  - Line 1982: `overflow: hidden` → `overflow: hidden !important;`
  - Line 1990: `overflow: hidden` → `overflow: hidden !important;`
  - Line 2045: `overflow: hidden` → `overflow: hidden !important;`
  - Line 2058: `overflow: hidden` → `overflow: hidden !important;`
  - Line 2063: `overflow: hidden` → `overflow: hidden !important;`
  - Line 2165: `overflow: hidden` → `overflow: hidden !important;`
  - Line 2238: `overflow: hidden` → `overflow: hidden !important;`

### `src/pages/StaffPage.css`

**Responsive signals:**

  - Line 319: `@media` → `@media (max-width: 640px) {`
  - Line 385: `@media` → `@media (max-width: 768px) {`
  - Line 562: `@media` → `@media (max-width: 980px) {`
  - Line 574: `@media` → `@media (max-width: 640px) {`
  - Line 778: `@media` → `@media (max-width: 1100px) {`
  - Line 784: `@media` → `@media (max-width: 760px) {`
  - Line 798: `@media` → `@media (max-width: 640px) {`
  - Line 1068: `@media` → `@media (min-width: 1280px) {`
  - Line 1074: `@media` → `@media (max-width: 760px) {`
  - Line 1119: `@media` → `@media (max-width: 480px) {`
  - Line 1369: `@media` → `@media (min-width: 760px) {`
  - Line 1375: `@media` → `@media (min-width: 1120px) {`
  - Line 1381: `@media` → `@media (max-width: 680px) {`
  - Line 1623: `@media` → `@media (min-width: 1120px) {`
  - Line 1630: `@media` → `@media (max-width: 760px) {`
  - Line 1901: `@media` → `@media (max-width: 760px) {`
  - Line 1986: `@media` → `@media (max-width: 480px) {`
  - Line 2010: `@media` → `@media (max-width: 900px) {`
  - Line 2024: `@media` → `@media (max-width: 760px) {`
  - Line 2385: `@media` → `@media (max-width: 430px) {`

**Potential clipping/density risks:**

  - Line 155: `overflow: hidden` → `overflow: hidden;`
  - Line 412: `overflow: hidden` → `overflow: hidden;`
  - Line 638: `overflow: hidden` → `overflow: hidden;`
  - Line 851: `overflow: hidden` → `overflow: hidden;`
  - Line 1025: `overflow: hidden` → `overflow: hidden;`
  - Line 1150: `overflow: hidden` → `overflow: hidden;`
  - Line 1458: `overflow: hidden` → `overflow: hidden;`
  - Line 1668: `overflow: hidden` → `overflow: hidden;`
  - Line 2407: `overflow: hidden` → `overflow: hidden;`
  - Line 2421: `overflow: hidden` → `overflow: hidden;`
  - Line 2627: `overflow: hidden` → `overflow: hidden;`
  - Line 2777: `overflow: hidden` → `overflow: hidden !important;`
  - Line 2811: `overflow: hidden` → `overflow: hidden !important;`
  - Line 2829: `overflow: hidden` → `overflow: hidden !important;`
  - Line 2843: `overflow: hidden` → `overflow: hidden !important;`
  - Line 2876: `overflow: hidden` → `overflow: hidden !important;`
  - Line 519: `white-space: nowrap` → `white-space: nowrap;`
  - Line 1065: `white-space: nowrap` → `white-space: nowrap;`
  - Line 2630: `white-space: nowrap` → `white-space: nowrap;`
  - Line 2779: `white-space: nowrap` → `white-space: nowrap !important;`


## Likely Class Names From Top Candidates

### `src/pages/ClientMessagesPage.css`

- `active`
- `compact`
- `disabled`
- `is-done`
- `is-error`
- `is-open`
- `is-replied`
- `message-action-btn`
- `message-actions`
- `message-body`
- `message-card`
- `message-card-actions-zone`
- `message-card-compose`
- `message-card-header`
- `message-card-shell`
- `message-card-top`
- `message-client-avatar`
- `message-client-copy`
- `message-meta-grid`
- `message-reply-box`
- `message-reply-note`
- `message-status-pill`
- `message-subject-line`
- `message-ticket`
- `message-ticket-id`
- `messages-alert`
- `messages-board`
- `messages-command-strip`
- `messages-control-deck`
- `messages-empty`
- `messages-empty-orbit`
- `messages-filter-tabs`
- `messages-hero`
- `messages-hero-main`
- `messages-hero-orbit`
- `messages-kicker`
- `messages-list`
- `messages-page`
- `messages-search`
- `messages-state-card`
- `messages-summary-card`
- `messages-summary-grid`
- `messages-toolbar`
- `messages-toolbar-controls`
- `messages-toolbar-copy`
- `primary`
- `status-cyan`
- `status-gold`
- `status-green`
- `tone-gold`
- `tone-green`
- `whatsapp`

### `src/pages/CalendarPage.css`

- `active`
- `all`
- `ambient-orb`
- `app-page-actions`
- `app-page-actions-buttons`
- `app-page-header`
- `app-page-header-left`
- `app-page-subtitle`
- `app-page-title`
- `app-search`
- `app-search-clear`
- `app-search-icon`
- `app-search-input`
- `app-search-lg`
- `app-smart-panel`
- `app-stat-card`
- `app-stat-grid`
- `blocked-cell`
- `blurred`
- `booked-cell`
- `booking-band-name`
- `booking-customer`
- `booking-detail-popup`
- `booking-detail-portal-container`
- `booking-info`
- `booking-meta-row`
- `booking-recording`
- `booking-time-label`
- `booking-title`
- `booking-vip`
- `breakdown-item`
- `breakdown-items`
- `btn-danger`
- `btn-primary`
- `btn-secondary`
- `cal-header`
- `cal-header-icon`
- `cal-header-left`
- `cal-header-right`
- `cal-panel-toggle`
- `cal-request-actions`
- `cal-request-chip`
- `cal-request-info`
- `cal-request-panel`
- `cal-slot-chip`
- `cal-slot-list`
- `cal-smart-alert`
- `cal-smart-icon`
- `cal-smart-panel`
- `cal-smart-summary`
- `calendar-ambient-bg`
- `calendar-container`
- `calendar-drag-preview`
- `calendar-header-actions`
- `calendar-header-icon`
- `calendar-header-search`
- `calendar-interaction-lock`
- `calendar-main-content`
- `calendar-mobile-filter`
- `calendar-move-lock`
- `calendar-new-btn`
- `calendar-overview`
- `calendar-page`
- `calendar-page-header`
- `calendar-print-btn`
- `calendar-request-strip`
- `calendar-resize-lock`
- `calendar-shell`
- `calendar-stat-card`
- `calendar-stat-data`
- `calendar-stat-icon`
- `calendar-stat-label`
- `calendar-stat-legend`
- `calendar-stat-legend-item`
- `calendar-stat-value`
- `calendar-stats-grid`
- `calendar-strip-content`
- `calendar-strip-header`
- `calendar-timeline-grid`
- `calendar-timeline-wrapper`

### `src/pages/LandingPage.css`

- `align-left`
- `booking-flow-section`
- `brand-text`
- `btn-large`
- `btn-primary`
- `experience-card`
- `experience-grid`
- `experience-icon`
- `experience-label`
- `experience-section`
- `featured`
- `flow-copy`
- `flow-panel`
- `flow-step`
- `flow-steps`
- `footer-bottom`
- `footer-brand`
- `footer-contact`
- `footer-contact-link`
- `footer-content`
- `footer-map`
- `footer-social`
- `gallery-actions`
- `gallery-lightbox-overlay`
- `gallery-pro-board`
- `gallery-pro-bottom`
- `gallery-pro-copy`
- `gallery-pro-cta`
- `gallery-pro-cta-modern`
- `gallery-pro-kicker`
- `gallery-pro-photo`
- `gallery-pro-photo-featured`
- `gallery-pro-photo-label`
- `gallery-pro-photo-shade`
- `gallery-pro-photo-shade-clean`
- `gallery-pro-section`
- `gallery-pro-shell`
- `gallery-pro-source`
- `gallery-pro-visual`
- `hero-actions`
- `hero-background`
- `hero-copy`
- `hero-google-login`
- `hero-kicker`
- `hero-login-alt`
- `hero-login-badge`
- `hero-login-divider`
- `hero-login-error`
- `hero-login-eye`
- `hero-login-field`
- `hero-login-foot`
- `hero-login-footnote`
- `hero-login-form`
- `hero-login-input`
- `hero-login-panel`
- `hero-login-perks`
- `hero-login-security-note`
- `hero-login-submit`
- `hero-login-top`
- `hero-login-visual-value`
- `hero-native-eye`
- `hero-native-field`
- `hero-radix-eye`
- `hero-radix-field`
- `hero-scrim`
- `hero-section`
- `hero-session`
- `hero-session-grid`
- `hero-session-main`
- `hero-shell`
- `hero-subtitle`
- `hero-title`
- `hero-trust-strip`
- `landing-container`
- `landing-footer`
- `landing-gallery-card`
- `landing-gallery-grid`
- `landing-gallery-media`
- `landing-gallery-overlay`
- `landing-gallery-section`

### `src/pages/CustomersPage.css`

- `action-col`
- `active`
- `app-page-actions`
- `app-page-header`
- `app-page-subtitle`
- `app-page-title`
- `app-panel`
- `app-search`
- `app-search-clear`
- `app-search-icon`
- `app-search-input`
- `app-search-md`
- `app-smart-panel`
- `app-table-toolbar`
- `app-table-toolbar-left`
- `app-table-toolbar-right`
- `app-table-toolbar-subtitle`
- `app-table-toolbar-title`
- `app-table-wrapper`
- `booking-badge`
- `bookings`
- `btn-edit-full`
- `btn-primary`
- `btn-secondary`
- `cancelled`
- `cf-actions`
- `cf-avatar-preview`
- `cf-field`
- `cf-identity-section`
- `cf-input`
- `cf-input-prefixed`
- `cf-label`
- `cf-name-field`
- `cf-prefix`
- `cf-prefix-input`
- `cf-radio`
- `cf-required`
- `cf-row`
- `cf-section`
- `cf-section-title`
- `cf-status-card`
- `cf-status-cards`
- `cf-status-dot`
- `cf-status-row`
- `cf-textarea`
- `cf-toggle-switch`
- `cf-toggle-thumb`
- `cf-vip-label`
- `cf-vip-sub`
- `cf-vip-toggle`
- `client-app-badge`
- `client-link-action-card`
- `client-link-action-head`
- `client-link-action-section`
- `client-link-card`
- `client-link-danger-btn`
- `client-link-detail-section`
- `client-link-empty`
- `client-link-suggestion`
- `client-link-suggestions`
- `close-btn`
- `confirmed`
- `contact-info`
- `contact-item`
- `customer-avatar`
- `customer-backfill-btn`
- `customer-booking-item`
- `customer-booking-timeline`
- `customer-detail-panel`
- `customer-form`
- `customer-info`
- `customer-name`
- `customer-name-cell`
- `customer-note`
- `customer-pro-card`
- `customer-pro-form-section`
- `customer-pro-tags`
- `customers-container`
- `customers-content-area`
- `customers-page`

### `src/pages/ClientPortal.css`

- `action`
- `active`
- `admin-entry-brand`
- `admin-entry-page`
- `admin-entry-shell`
- `admin-google-btn`
- `admin-input-wrap`
- `admin-login-alert`
- `admin-login-back-btn`
- `admin-login-bg`
- `admin-login-brand`
- `admin-login-brand-mark`
- `admin-login-card`
- `admin-login-card-header`
- `admin-login-card-icon`
- `admin-login-copy`
- `admin-login-footer`
- `admin-login-form`
- `admin-login-grid-bg`
- `admin-login-icon-btn`
- `admin-login-kicker`
- `admin-login-layout`
- `admin-login-modern`
- `admin-login-nav`
- `admin-login-nav-actions`
- `admin-login-or`
- `admin-login-orb`
- `admin-login-orb-cyan`
- `admin-login-orb-gold`
- `admin-login-proof`
- `admin-login-scroll-unlocked`
- `admin-login-shell`
- `admin-login-title`
- `admin-submit-btn`
- `badge-messages`
- `badge-profile`
- `client-action-card`
- `client-action-list`
- `client-action-panel`
- `client-activity-item`
- `client-activity-list`
- `client-activity-panel`
- `client-admin-reply-note`
- `client-admin-reply-stack`
- `client-alert`
- `client-ambient-bg`
- `client-billing-guide-card`
- `client-billing-guide-icon`
- `client-billing-guide-link`
- `client-billing-guide-strip`
- `client-billing-hero`
- `client-billing-list-panel`
- `client-billing-mini-grid`
- `client-billing-page`
- `client-billing-panel`
- `client-billing-priority-value`
- `client-billing-profile-card`
- `client-billing-search`
- `client-billing-stats`
- `client-billing-value`
- `client-blob`
- `client-blob-cyan`
- `client-blob-pink`
- `client-brand`
- `client-brand-mark`
- `client-dashboard-actions`
- `client-dashboard-copy`
- `client-dashboard-focus-layout`
- `client-dashboard-grid`
- `client-dashboard-hero`
- `client-dashboard-layout`
- `client-dashboard-nav`
- `client-dashboard-page`
- `client-dashboard-quick-stats`
- `client-dashboard-secondary-layout`
- `client-empty-icon`
- `client-empty-state`
- `client-ghost-btn`
- `client-google-btn`
- `client-google-mark`

### `src/pages/ClientMessagesInboxPolish.css`

- `inbox-action`
- `inbox-contact-strip`
- `inbox-detail-actions`
- `inbox-detail-avatar`
- `inbox-detail-empty`
- `inbox-detail-header`
- `inbox-detail-identity`
- `inbox-detail-panel`
- `inbox-detail-status`
- `inbox-folder-btn`
- `inbox-folder-icon`
- `inbox-folder-list`
- `inbox-list-toolbar`
- `inbox-message-list`
- `inbox-message-reader`
- `inbox-message-row`
- `inbox-reply-composer`
- `inbox-reply-note`
- `inbox-row-avatar`
- `inbox-row-main`
- `inbox-row-preview`
- `inbox-row-subject`
- `inbox-row-topline`
- `inbox-search`
- `inbox-sidebar`
- `inbox-sidebar-header`
- `inbox-sidebar-note`
- `inbox-status-dot`
- `is-active`
- `is-selected`
- `messages-inbox-hero`
- `messages-inbox-metrics`
- `messages-inbox-page`
- `messages-inbox-shell`
- `messages-inbox-titleblock`
- `messages-kicker`
- `messages-metric-card`
- `spinner`

### `src/pages/ClientMessagesInbox.css`

- `inbox-action`
- `inbox-admin-reply-history`
- `inbox-admin-reply-history-head`
- `inbox-contact-strip`
- `inbox-customer-reply-note`
- `inbox-detail-actions`
- `inbox-detail-avatar`
- `inbox-detail-empty`
- `inbox-detail-header`
- `inbox-detail-identity`
- `inbox-detail-label`
- `inbox-detail-panel`
- `inbox-detail-status`
- `inbox-folder-btn`
- `inbox-folder-copy`
- `inbox-folder-icon`
- `inbox-folder-list`
- `inbox-list-panel`
- `inbox-list-toolbar`
- `inbox-message-list`
- `inbox-message-reader`
- `inbox-message-row`
- `inbox-reply-composer`
- `inbox-reply-note`
- `inbox-row-avatar`
- `inbox-row-main`
- `inbox-row-preview`
- `inbox-row-subject`
- `inbox-row-topline`
- `inbox-search`
- `inbox-sidebar`
- `inbox-sidebar-header`
- `inbox-sidebar-note`
- `inbox-state-card`
- `inbox-status-dot`
- `is-active`
- `is-disabled`
- `is-selected`
- `messages-inbox-hero`
- `messages-inbox-metrics`
- `messages-inbox-page`
- `messages-inbox-shell`
- `messages-inbox-titleblock`
- `messages-kicker`
- `messages-metric-card`
- `primary`
- `status-cyan`
- `status-gold`
- `status-green`
- `success`
- `whatsapp`

### `src/pages/FinancePage.css`

- `action-cell`
- `action-col`
- `active`
- `app-page-actions`
- `app-page-header`
- `app-page-header-left`
- `app-page-subtitle`
- `app-page-title`
- `app-search`
- `app-search-clear`
- `app-search-icon`
- `app-search-input`
- `app-search-md`
- `app-stat-card`
- `app-table-toolbar`
- `app-table-toolbar-left`
- `app-table-toolbar-right`
- `app-table-toolbar-subtitle`
- `app-table-toolbar-title`
- `app-table-wrapper`
- `badge-value`
- `booking`
- `btn-primary`
- `btn-secondary`
- `cat-badge`
- `cf-error-message`
- `chart-8-container`
- `chart-card-header`
- `chart-header-month`
- `chart-header-title`
- `chart-legend`
- `chart-period-selector`
- `close-btn`
- `col-money`
- `daily-expense-list`
- `daily-expense-summary`
- `daily-expenses-panel`
- `desc-cell`
- `ellipse-41`
- `empty-state`
- `empty-state-icon-wrapper`
- `empty-state-subtitle`
- `empty-state-title`
- `expense`
- `expense-gradient`
- `finance-chart-card`
- `finance-charts-grid`
- `finance-content`
- `finance-empty-state`
- `finance-eyebrow`
- `finance-form`
- `finance-header-meta`
- `finance-insights-grid`
- `finance-layout-grid`
- `finance-main-col`
- `finance-page`
- `finance-sidebar-col`
- `finance-stat-card`
- `finance-stats`
- `finance-table`
- `finance-table-count`
- `finance-table-header`
- `finance-table-meta`
- `finance-table-subtitle`
- `finance-table-title`
- `finance-transaction-modal`
- `finance-transaction-modal-wrapper`
- `form-actions`
- `form-group`
- `form-input`
- `form-row`
- `form-textarea`
- `fw-bold`
- `hide-on-mobile`
- `hide-on-print`
- `icon-btn`
- `income`
- `income-gradient`
- `insight-grid-vals`
- `insight-item-header`

### `src/styles/flat-minimal-system.css`

- `active`
- `app-container`
- `app-page`
- `app-table`
- `app-table-wrapper`
- `auth-header-logo`
- `available`
- `badge`
- `bf-label`
- `billing-table-container`
- `bn-icon-wrapper`
- `bn-indicator`
- `bn-item`
- `bn-label`
- `booked`
- `booked-cell`
- `booking-band-name`
- `booking-detail-popup`
- `booking-info`
- `booking-meta-row`
- `booking-name`
- `booking-now-line`
- `booking-subtitle`
- `booking-time-label`
- `bottom-nav-bar`
- `bottom-nav-item`
- `bottom-sheet-grid`
- `bottom-sheet-header`
- `btn-primary`
- `btn-secondary`
- `calendar-header-icon`
- `calendar-main-content`
- `calendar-shell`
- `calendar-timeline-grid`
- `calendar-timeline-wrapper`
- `calendar-toolbar-right`
- `calendar-workspace`
- `calendar-workspace-toolbar`
- `card-header`
- `clock-details`
- `clock-status-live`
- `clock-time`
- `corner-label`
- `current-hour`
- `current-month`
- `current-time-line`
- `danger`
- `dash-action-toolbar`
- `dash-alert-chip`
- `dash-alerts-strip`
- `dash-greeting`
- `dash-greeting-icon`
- `dash-greeting-left`
- `dash-greeting-right`
- `dash-greeting-sub`
- `dash-greeting-title`
- `dash-live-clock-widget`
- `dash-smart-card`
- `dash-stat-card`
- `dash-stat-value`
- `dashboard-page`
- `data-table-container`
- `day-name`
- `day-number`
- `detail-body`
- `detail-footer`
- `detail-header`
- `empty-cell`
- `empty-row`
- `even-hour`
- `even-row`
- `filter-chip`
- `fluent-dialog`
- `gallery-lightbox-overlay`
- `glass-panel`
- `grid-corner-cell`
- `grid-header-cell`
- `hover-plus`
- `icon-btn`
- `info`

### `src/pages/BillingPage.css`

- `a4-mode`
- `action-col`
- `active`
- `all`
- `app-panel`
- `app-search`
- `app-search-clear`
- `app-search-icon`
- `app-search-input`
- `app-table-toolbar-right`
- `app-table-toolbar-subtitle`
- `app-table-toolbar-title`
- `billing-band-cell`
- `billing-command-kicker`
- `billing-command-main`
- `billing-command-pill`
- `billing-command-summary`
- `billing-command-top`
- `billing-content`
- `billing-control-actions`
- `billing-control-deck`
- `billing-control-filter`
- `billing-control-heading`
- `billing-control-search`
- `billing-metric-strip`
- `billing-mobile-card`
- `billing-mobile-deck`
- `billing-page`
- `billing-pos-shell`
- `billing-signal-chip`
- `billing-smart-btn`
- `billing-smart-empty`
- `billing-smart-item`
- `billing-smart-list`
- `billing-smart-main`
- `billing-smart-panel`
- `billing-stat-card`
- `billing-stats-bar`
- `billing-tab`
- `billing-table`
- `billing-table-compact`
- `billing-table-deck`
- `billing-tabs`
- `billing-toolbar`
- `billing-toolbar-signal-row`
- `billing-toolbar-title-stack`
- `billing-vip-badge`
- `bottom`
- `btn-sm-pay`
- `col-amt`
- `col-desc`
- `col-qty`
- `col-rate`
- `confirmed`
- `cp`
- `date`
- `deadline`
- `deadline-chip`
- `debt`
- `dl`
- `dp`
- `empty-state`
- `filter-dropdown-arrow`
- `filter-dropdown-container`
- `filter-dropdown-icon`
- `filter-dropdown-item`
- `filter-dropdown-label`
- `filter-dropdown-menu`
- `filter-dropdown-overlay`
- `filter-dropdown-toggle`
- `footer-brand`
- `footer-thanks`
- `format-btn`
- `grand-label`
- `grand-val`
- `has-debt`
- `hide-on-mobile`
- `icon-btn`
- `inv-band`
- `inv-id`

### `src/pages/SettingsPage.css`

- `active`
- `app-page-subtitle`
- `app-page-title`
- `app-panel`
- `backup-restore-actions`
- `backup-restore-card`
- `backup-restore-copy`
- `bf-input`
- `bf-label`
- `bf-row`
- `btn-danger`
- `btn-primary`
- `btn-secondary`
- `checked`
- `danger-zone`
- `dd-input-group`
- `dd-item-amount`
- `dd-item-hours`
- `dd-item-info`
- `default`
- `delete`
- `demo-badge-dot`
- `demo-badge-off`
- `demo-badge-text`
- `demo-chip-label`
- `demo-chip-value`
- `demo-info-item`
- `demo-info-list`
- `demo-mode-badge`
- `demo-mode-panel`
- `demo-stat-chip`
- `demo-stats-preview`
- `demo-toggle-card`
- `demo-toggle-desc`
- `demo-toggle-icon`
- `demo-toggle-left`
- `demo-toggle-title`
- `denied`
- `disabled`
- `duration-discount-desc`
- `duration-discount-empty`
- `duration-discount-form`
- `duration-discount-item`
- `duration-discount-list`
- `duration-discount-section`
- `duration-discount-title`
- `error`
- `granted`
- `highlight`
- `icon-btn`
- `idle`
- `m3-switch`
- `m3-switch-handle`
- `m3-switch-handle-shape`
- `m3-switch-icon`
- `mt-4`
- `nav-brand-icon`
- `nav-brand-info`
- `nav-brand-name`
- `nav-brand-sub`
- `notif-status-card`
- `notif-status-desc`
- `notif-status-dot`
- `notif-status-left`
- `notif-status-title`
- `notif-toggle`
- `off`
- `on`
- `panel-desc`
- `panel-header-icon`
- `panel-title`
- `preview-content`
- `preview-detail`
- `preview-label`
- `preview-name`
- `pricing-info-card`
- `pricing-info-grid`
- `pricing-info-label`
- `pricing-info-value`
- `reset-confirm-area`

### `src/pages/DashboardPage.css`

- `admin-dashboard-modern`
- `ambient-orb`
- `app-smart-grid`
- `app-smart-panel`
- `as-button`
- `blue`
- `bottom-nav-bar`
- `btn-primary`
- `btn-secondary`
- `chart-container`
- `chart-header`
- `chart-link-btn`
- `chart-sub`
- `chart-title`
- `clock-date`
- `clock-details`
- `clock-status-live`
- `clock-time`
- `close-btn`
- `compact`
- `confirmed`
- `danger`
- `dash-action-toolbar`
- `dash-alert-chip`
- `dash-alerts-strip`
- `dash-command-grid`
- `dash-command-head`
- `dash-command-panel`
- `dash-command-title`
- `dash-empty-state`
- `dash-greeting`
- `dash-greeting-icon`
- `dash-greeting-left`
- `dash-greeting-right`
- `dash-greeting-sub`
- `dash-greeting-title`
- `dash-icon-action`
- `dash-live-clock-widget`
- `dash-main-grid`
- `dash-mini-link`
- `dash-pill`
- `dash-slot-item`
- `dash-smart-card`
- `dash-smart-grid`
- `dash-stat-card`
- `dash-stat-label`
- `dash-stat-pills`
- `dash-stat-progress-bar`
- `dash-stat-progress-container`
- `dash-stat-progress-info`
- `dash-stat-sub`
- `dash-stat-top`
- `dash-stat-unit`
- `dash-stat-value`
- `dash-stats-grid`
- `dash-table-card`
- `dash-trend`
- `dash-upcoming`
- `dash-work-actions`
- `dash-work-empty`
- `dash-work-list`
- `dash-work-main`
- `dashboard-ambient-bg`
- `dashboard-page`
- `dashboard-quick-modal-wrapper`
- `donut-center-label`
- `donut-center-lbl`
- `donut-center-val`
- `donut-chart-wrapper`
- `down`
- `dp`
- `export-dashboard-btn`
- `form-actions`
- `form-group`
- `form-input`
- `form-row`
- `form-textarea`
- `green`
- `info`
- `inv-legend`


## CSS Context Around Important Terms

### `src/pages/ClientMessagesPage.css`

Line 3:
```
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@400;500;600;700;800&display=swap');

.messages-page {
  min-height: 100%;
  display: grid;
  gap: 18px;
  color: var(--text-primary);
  font-family: 'Space Grotesk', system-ui, sans-serif;
}

.messages-hero,
```

Line 5:
```
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@400;500;600;700;800&display=swap');

.messages-page {
  min-height: 100%;
  display: grid;
  gap: 18px;
  color: var(--text-primary);
  font-family: 'Space Grotesk', system-ui, sans-serif;
}

.messages-hero,
.messages-summary-card,
.messages-board,
```

Line 11:
```
  color: var(--text-primary);
  font-family: 'Space Grotesk', system-ui, sans-serif;
}

.messages-hero,
.messages-summary-card,
.messages-board,
.message-card,
.messages-empty,
.messages-alert {
  border: 1px solid rgba(255,255,255,0.10);
  background:
    radial-gradient(circle at 12% 0%, rgba(var(--accent-pink-rgb),0.075), transparent 44%),
```

Line 12:
```
  font-family: 'Space Grotesk', system-ui, sans-serif;
}

.messages-hero,
.messages-summary-card,
.messages-board,
.message-card,
.messages-empty,
.messages-alert {
  border: 1px solid rgba(255,255,255,0.10);
  background:
    radial-gradient(circle at 12% 0%, rgba(var(--accent-pink-rgb),0.075), transparent 44%),
    linear-gradient(180deg, rgba(255,255,255,0.060), rgba(255,255,255,0.014)),
```

Line 13:
```
}

.messages-hero,
.messages-summary-card,
.messages-board,
.message-card,
.messages-empty,
.messages-alert {
  border: 1px solid rgba(255,255,255,0.10);
  background:
    radial-gradient(circle at 12% 0%, rgba(var(--accent-pink-rgb),0.075), transparent 44%),
    linear-gradient(180deg, rgba(255,255,255,0.060), rgba(255,255,255,0.014)),
    rgba(17,21,31,0.88);
```

Line 14:
```

.messages-hero,
.messages-summary-card,
.messages-board,
.message-card,
.messages-empty,
.messages-alert {
  border: 1px solid rgba(255,255,255,0.10);
  background:
    radial-gradient(circle at 12% 0%, rgba(var(--accent-pink-rgb),0.075), transparent 44%),
    linear-gradient(180deg, rgba(255,255,255,0.060), rgba(255,255,255,0.014)),
    rgba(17,21,31,0.88);
  box-shadow:
```

Line 15:
```
.messages-hero,
.messages-summary-card,
.messages-board,
.message-card,
.messages-empty,
.messages-alert {
  border: 1px solid rgba(255,255,255,0.10);
  background:
    radial-gradient(circle at 12% 0%, rgba(var(--accent-pink-rgb),0.075), transparent 44%),
    linear-gradient(180deg, rgba(255,255,255,0.060), rgba(255,255,255,0.014)),
    rgba(17,21,31,0.88);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.080),
```

Line 16:
```
.messages-summary-card,
.messages-board,
.message-card,
.messages-empty,
.messages-alert {
  border: 1px solid rgba(255,255,255,0.10);
  background:
    radial-gradient(circle at 12% 0%, rgba(var(--accent-pink-rgb),0.075), transparent 44%),
    linear-gradient(180deg, rgba(255,255,255,0.060), rgba(255,255,255,0.014)),
    rgba(17,21,31,0.88);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.080),
    0 18px 44px rgba(0,0,0,0.22);
```

Line 29:
```
  -webkit-backdrop-filter: blur(18px) saturate(1.08);
  backdrop-filter: blur(18px) saturate(1.08);
}

.messages-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
  gap: 18px;
  align-items: end;
  padding: clamp(20px, 4vw, 30px);
  border-radius: 30px;
}

```

Line 30:
```
  backdrop-filter: blur(18px) saturate(1.08);
}

.messages-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
  gap: 18px;
  align-items: end;
  padding: clamp(20px, 4vw, 30px);
  border-radius: 30px;
}

.messages-kicker {
```

Line 31:
```
}

.messages-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
  gap: 18px;
  align-items: end;
  padding: clamp(20px, 4vw, 30px);
  border-radius: 30px;
}

.messages-kicker {
  width: fit-content;
```

Line 34:
```
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
  gap: 18px;
  align-items: end;
  padding: clamp(20px, 4vw, 30px);
  border-radius: 30px;
}

.messages-kicker {
  width: fit-content;
  min-height: 32px;
  display: inline-flex;
  align-items: center;
```

### `src/pages/CalendarPage.css`

Line 2:
```
/* ===================================================
   CALENDAR PAGE — 37 Music Studio
   Complete Premium Overhaul
   =================================================== */

/* ── Base Layout ── */
.calendar-page {
  position: relative;
  height: 100%;
}
```

Line 7:
```
   Complete Premium Overhaul
   =================================================== */

/* ── Base Layout ── */
.calendar-page {
  position: relative;
  height: 100%;
}

.calendar-main-content {
  display: flex;
  flex-direction: column;
  height: 100%;
```

Line 12:
```
  position: relative;
  height: 100%;
}

.calendar-main-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 18px;
  transition: filter 0.15s ease-in-out;
}

/* Disable global blur — backdrop-filter on overlays handles it */
```

Line 21:
```
  transition: filter 0.15s ease-in-out;
}

/* Disable global blur — backdrop-filter on overlays handles it */
.calendar-main-content.blurred {
  filter: none !important;
}

.calendar-main-content.panels-collapsed {
  gap: 12px;
}

/* calendar-shell is the main wrapper in JSX */
```

Line 25:
```
.calendar-main-content.blurred {
  filter: none !important;
}

.calendar-main-content.panels-collapsed {
  gap: 12px;
}

/* calendar-shell is the main wrapper in JSX */
.calendar-shell.blurred {
  filter: none !important; /* No blur on content — overlay handles it */
}

```

Line 29:
```
.calendar-main-content.panels-collapsed {
  gap: 12px;
}

/* calendar-shell is the main wrapper in JSX */
.calendar-shell.blurred {
  filter: none !important; /* No blur on content — overlay handles it */
}

.calendar-shell.panels-collapsed {
  gap: 12px;
}

```

Line 30:
```
  gap: 12px;
}

/* calendar-shell is the main wrapper in JSX */
.calendar-shell.blurred {
  filter: none !important; /* No blur on content — overlay handles it */
}

.calendar-shell.panels-collapsed {
  gap: 12px;
}

/* ── Header Icon (from inline styles) ── */
```

Line 34:
```
.calendar-shell.blurred {
  filter: none !important; /* No blur on content — overlay handles it */
}

.calendar-shell.panels-collapsed {
  gap: 12px;
}

/* ── Header Icon (from inline styles) ── */
.calendar-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
```

Line 39:
```
  gap: 12px;
}

/* ── Header Icon (from inline styles) ── */
.calendar-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(var(--accent-pink-rgb), 0.15), rgba(var(--accent-pink-rgb), 0.05));
  border: 1px solid rgba(var(--accent-pink-rgb), 0.22);
```

Line 77:
```
   VIEW SWITCHER
   ══════════════════════════════════════════ */
.view-switcher {
  display: flex;
  background: var(--glass-bg);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 3px;
  gap: 2px;
}

.view-btn {
  display: flex;
```

Line 180:
```
  -webkit-overflow-scrolling: touch !important;
}
.booking-detail-popup.mobile-sheet .detail-footer {
  flex-shrink: 0 !important;
  padding-bottom: calc(18px + env(safe-area-inset-bottom, 0px)) !important;
}
.booking-detail-popup.mobile-sheet::before {
  content: '';
  display: block;
  width: 36px;
  height: 4px;
  background: var(--border-light);
  border-radius: 2px;
```

Line 362:
```
.detail-footer .btn-secondary { flex: 1; justify-content: center; font-size: 0.82rem; }
.detail-close { color: var(--text-muted); }

/* ══════════════════════════════════════════
   CALENDAR LAYOUT
   ══════════════════════════════════════════ */
.calendar-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
}

```

### `src/pages/LandingPage.css`

Line 39:
```
  --landing-shadow-soft: 0 12px 30px rgba(0, 0, 0, 0.18);
  --landing-shadow-lift: 0 26px 62px rgba(0, 0, 0, 0.34);

  --nav-bg: rgba(17, 20, 28, 0.92);
  --hero-image-position: 24% center;
  --hero-text: #fffaf0;
  --hero-muted: rgba(255, 250, 240, 0.84);
  --hero-fade-mid: rgba(11, 13, 17, 0.58);

  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  overflow-x: clip;
```

Line 40:
```
  --landing-shadow-lift: 0 26px 62px rgba(0, 0, 0, 0.34);

  --nav-bg: rgba(17, 20, 28, 0.92);
  --hero-image-position: 24% center;
  --hero-text: #fffaf0;
  --hero-muted: rgba(255, 250, 240, 0.84);
  --hero-fade-mid: rgba(11, 13, 17, 0.58);

  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  overflow-x: clip;
  position: relative;
```

Line 41:
```

  --nav-bg: rgba(17, 20, 28, 0.92);
  --hero-image-position: 24% center;
  --hero-text: #fffaf0;
  --hero-muted: rgba(255, 250, 240, 0.84);
  --hero-fade-mid: rgba(11, 13, 17, 0.58);

  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  overflow-x: clip;
  position: relative;
  color: var(--landing-text);
```

Line 42:
```
  --nav-bg: rgba(17, 20, 28, 0.92);
  --hero-image-position: 24% center;
  --hero-text: #fffaf0;
  --hero-muted: rgba(255, 250, 240, 0.84);
  --hero-fade-mid: rgba(11, 13, 17, 0.58);

  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  overflow-x: clip;
  position: relative;
  color: var(--landing-text);
  background: var(--landing-bg-solid);
```

Line 47:
```

  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  overflow-x: clip;
  position: relative;
  color: var(--landing-text);
  background: var(--landing-bg-solid);
  font-family: 'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-tap-highlight-color: transparent;
}

.landing-container *,
```

Line 87:
```
  top: 0;
  left: 0;
  right: 0;
  z-index: 180;
  height: calc(66px + env(safe-area-inset-top, 0px));
  padding: env(safe-area-inset-top, 0px) 14px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--nav-bg);
  border-bottom: 1px solid var(--landing-line-soft);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.045),
```

Line 88:
```
  left: 0;
  right: 0;
  z-index: 180;
  height: calc(66px + env(safe-area-inset-top, 0px));
  padding: env(safe-area-inset-top, 0px) 14px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--nav-bg);
  border-bottom: 1px solid var(--landing-line-soft);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.045),
    0 12px 32px rgba(0, 0, 0, 0.22);
```

Line 106:
```
    box-shadow 180ms ease;
}

.landing-nav.scrolled {
  height: calc(60px + env(safe-area-inset-top, 0px));
}

.nav-brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  color: var(--landing-text);
```

Line 122:
```
.nav-brand-mark {
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  display: inline-grid;
  place-items: center;
  overflow: hidden;
  border-radius: 15px;
  border: 1px solid rgba(239, 197, 110, 0.34);
  background: rgba(255, 255, 255, 0.035);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 10px 24px rgba(0, 0, 0, 0.18);
```

Line 253:
```
}

.mobile-nav-menu {
  position: fixed;
  top: calc(70px + env(safe-area-inset-top, 0px));
  left: 12px;
  right: 12px;
  z-index: 190;
  display: grid;
  gap: 7px;
  padding: 10px;
  border-radius: 22px;
  border: 1px solid var(--landing-line);
```

Line 257:
```
  top: calc(70px + env(safe-area-inset-top, 0px));
  left: 12px;
  right: 12px;
  z-index: 190;
  display: grid;
  gap: 7px;
  padding: 10px;
  border-radius: 22px;
  border: 1px solid var(--landing-line);
  background: var(--landing-surface-strong);
  box-shadow: var(--landing-shadow);
  -webkit-backdrop-filter: blur(22px) saturate(1.08);
  backdrop-filter: blur(22px) saturate(1.08);
```

Line 292:
```
  color: #120f0a;
  background: var(--landing-gold);
}

/* ─── Auth panel ─────────────────────────────────────────────────────────── */

.nav-login-dropdown {
  position: fixed;
  top: calc(70px + env(safe-area-inset-top, 0px));
  left: 10px;
  right: 10px;
  z-index: 220;
  max-height: calc(100dvh - 86px - env(safe-area-inset-top, 0px));
```

### `src/pages/CustomersPage.css`

Line 16:
```
/* =============================================
   STATS BAR
   ============================================= */
.customers-page .stats-bar {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.customers-page .stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
```

Line 17:
```
   STATS BAR
   ============================================= */
.customers-page .stats-bar {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.customers-page .stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
```

Line 131:
```
  pointer-events: none;
}

/* =============================================
   CONTENT AREA (Table + Detail Panel)
   ============================================= */
.customers-content-area {
  flex: 1;
  display: flex;
  gap: 16px;
  min-height: 0;
  overflow: hidden;
}
```

Line 396:
```
  letter-spacing: 0.01em;
}

/* =============================================
   DETAIL PANEL
   ============================================= */
.customer-detail-panel {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideInPanel 0.28s cubic-bezier(0.16, 1, 0.3, 1);
```

Line 398:
```

/* =============================================
   DETAIL PANEL
   ============================================= */
.customer-detail-panel {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideInPanel 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

```

Line 404:
```
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideInPanel 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideInPanel {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* ── Detail Panel Header ── */
```

Line 407:
```
  overflow: hidden;
  animation: slideInPanel 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideInPanel {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* ── Detail Panel Header ── */
.detail-panel-header {
  padding: 18px 18px 14px;
  display: flex;
```

Line 412:
```
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* ── Detail Panel Header ── */
.detail-panel-header {
  padding: 18px 18px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
  position: relative;
```

Line 413:
```
  to   { opacity: 1; transform: translateX(0); }
}

/* ── Detail Panel Header ── */
.detail-panel-header {
  padding: 18px 18px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
```

Line 424:
```
  position: relative;
  overflow: hidden;
}

.detail-panel-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, var(--accent-cyan), var(--accent-pink));
  opacity: 0.6;
```

Line 471:
```
  opacity: 0.5;
  filter: blur(10px);
}

.detail-panel-header h3 {
  flex: 1;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
```

Line 482:
```
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-panel-close {
  flex-shrink: 0;
  margin-left: auto;
}

/* ── Detail Panel Body ── */
.detail-panel-body {
  flex: 1;
  overflow-y: auto;
```

### `src/pages/ClientPortal.css`

Line 15:
```

.client-portal-page {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
  padding: clamp(18px, 3vw, 34px);
  color: var(--text-primary);
  background:
    radial-gradient(circle at 12% 0%, rgba(var(--accent-pink-rgb), 0.16), transparent 34rem),
    radial-gradient(circle at 90% 0%, rgba(var(--accent-cyan-rgb), 0.10), transparent 30rem),
    var(--bg-dark);
}

```

Line 16:
```
.client-portal-page {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
  padding: clamp(18px, 3vw, 34px);
  color: var(--text-primary);
  background:
    radial-gradient(circle at 12% 0%, rgba(var(--accent-pink-rgb), 0.16), transparent 34rem),
    radial-gradient(circle at 90% 0%, rgba(var(--accent-cyan-rgb), 0.10), transparent 30rem),
    var(--bg-dark);
}

.client-ambient-bg {
```

Line 54:
```
  background: rgb(var(--accent-cyan-rgb));
}

.client-nav,
.client-hero-shell,
.client-rate-card,
.client-dashboard-hero,
.client-dashboard-grid,
.client-action-panel,
.admin-entry-shell {
  position: relative;
  z-index: 1;
}
```

Line 56:
```

.client-nav,
.client-hero-shell,
.client-rate-card,
.client-dashboard-hero,
.client-dashboard-grid,
.client-action-panel,
.admin-entry-shell {
  position: relative;
  z-index: 1;
}

.client-nav {
```

Line 57:
```
.client-nav,
.client-hero-shell,
.client-rate-card,
.client-dashboard-hero,
.client-dashboard-grid,
.client-action-panel,
.admin-entry-shell {
  position: relative;
  z-index: 1;
}

.client-nav {
  width: min(1180px, 100%);
```

Line 58:
```
.client-hero-shell,
.client-rate-card,
.client-dashboard-hero,
.client-dashboard-grid,
.client-action-panel,
.admin-entry-shell {
  position: relative;
  z-index: 1;
}

.client-nav {
  width: min(1180px, 100%);
  margin: 0 auto 28px;
```

Line 88:
```
.client-loader-logo {
  width: 42px;
  height: 42px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 950;
  background:
    radial-gradient(circle at 50% 0%, rgba(255,255,255,0.24), transparent 56%),
    linear-gradient(135deg, rgba(var(--accent-pink-rgb),0.96), rgba(var(--accent-pink-rgb),0.70));
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.20),
```

Line 145:
```
    inset 0 1px 0 rgba(255,255,255,0.18),
    0 12px 28px rgba(var(--accent-pink-rgb),0.22);
}

.client-hero-shell {
  width: min(1180px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(330px, 0.78fr);
  gap: clamp(18px, 4vw, 42px);
  align-items: center;
  min-height: min(760px, calc(100vh - 140px));
}
```

Line 148:
```

.client-hero-shell {
  width: min(1180px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(330px, 0.78fr);
  gap: clamp(18px, 4vw, 42px);
  align-items: center;
  min-height: min(760px, calc(100vh - 140px));
}

.client-hero-copy {
  display: grid;
```

Line 149:
```
.client-hero-shell {
  width: min(1180px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(330px, 0.78fr);
  gap: clamp(18px, 4vw, 42px);
  align-items: center;
  min-height: min(760px, calc(100vh - 140px));
}

.client-hero-copy {
  display: grid;
  gap: 20px;
```

Line 150:
```
  width: min(1180px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(330px, 0.78fr);
  gap: clamp(18px, 4vw, 42px);
  align-items: center;
  min-height: min(760px, calc(100vh - 140px));
}

.client-hero-copy {
  display: grid;
  gap: 20px;
}
```

Line 155:
```
  align-items: center;
  min-height: min(760px, calc(100vh - 140px));
}

.client-hero-copy {
  display: grid;
  gap: 20px;
}

.client-kicker {
  width: max-content;
  display: inline-flex;
  align-items: center;
```

### `src/pages/ClientMessagesInboxPolish.css`

Line 2:
```
/*
 * Professional inbox polish layer.
 * Purpose: win over older ClientMessagesPage.css rules without touching data flow.
 */

.messages-page.messages-inbox-page {
  width: min(100%, 1480px) !important;
  max-width: 1480px !important;
  min-height: 100% !important;
  display: flex !important;
```

Line 3:
```
/*
 * Professional inbox polish layer.
 * Purpose: win over older ClientMessagesPage.css rules without touching data flow.
 */

.messages-page.messages-inbox-page {
  width: min(100%, 1480px) !important;
  max-width: 1480px !important;
  min-height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
```

Line 6:
```
 * Professional inbox polish layer.
 * Purpose: win over older ClientMessagesPage.css rules without touching data flow.
 */

.messages-page.messages-inbox-page {
  width: min(100%, 1480px) !important;
  max-width: 1480px !important;
  min-height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 16px !important;
  margin: 0 auto !important;
  padding: clamp(12px, 2vw, 22px) !important;
```

Line 14:
```
  display: flex !important;
  flex-direction: column !important;
  gap: 16px !important;
  margin: 0 auto !important;
  padding: clamp(12px, 2vw, 22px) !important;
  padding-bottom: calc(28px + env(safe-area-inset-bottom, 0px)) !important;
  overflow-x: clip !important;
  color: var(--text-primary) !important;
  background:
    radial-gradient(circle at 8% -10%, rgba(var(--accent-cyan-rgb), 0.10), transparent 30%),
    radial-gradient(circle at 92% 0%, rgba(239, 197, 110, 0.08), transparent 28%) !important;
}

```

Line 15:
```
  flex-direction: column !important;
  gap: 16px !important;
  margin: 0 auto !important;
  padding: clamp(12px, 2vw, 22px) !important;
  padding-bottom: calc(28px + env(safe-area-inset-bottom, 0px)) !important;
  overflow-x: clip !important;
  color: var(--text-primary) !important;
  background:
    radial-gradient(circle at 8% -10%, rgba(var(--accent-cyan-rgb), 0.10), transparent 30%),
    radial-gradient(circle at 92% 0%, rgba(239, 197, 110, 0.08), transparent 28%) !important;
}

.messages-page.messages-inbox-page::before,
```

Line 16:
```
  gap: 16px !important;
  margin: 0 auto !important;
  padding: clamp(12px, 2vw, 22px) !important;
  padding-bottom: calc(28px + env(safe-area-inset-bottom, 0px)) !important;
  overflow-x: clip !important;
  color: var(--text-primary) !important;
  background:
    radial-gradient(circle at 8% -10%, rgba(var(--accent-cyan-rgb), 0.10), transparent 30%),
    radial-gradient(circle at 92% 0%, rgba(239, 197, 110, 0.08), transparent 28%) !important;
}

.messages-page.messages-inbox-page::before,
.messages-page.messages-inbox-page::after {
```

Line 23:
```
    radial-gradient(circle at 8% -10%, rgba(var(--accent-cyan-rgb), 0.10), transparent 30%),
    radial-gradient(circle at 92% 0%, rgba(239, 197, 110, 0.08), transparent 28%) !important;
}

.messages-page.messages-inbox-page::before,
.messages-page.messages-inbox-page::after {
  display: none !important;
}

.messages-page.messages-inbox-page *,
.messages-page.messages-inbox-page *::before,
.messages-page.messages-inbox-page *::after {
  box-sizing: border-box !important;
```

Line 24:
```
    radial-gradient(circle at 92% 0%, rgba(239, 197, 110, 0.08), transparent 28%) !important;
}

.messages-page.messages-inbox-page::before,
.messages-page.messages-inbox-page::after {
  display: none !important;
}

.messages-page.messages-inbox-page *,
.messages-page.messages-inbox-page *::before,
.messages-page.messages-inbox-page *::after {
  box-sizing: border-box !important;
  min-width: 0;
```

Line 28:
```
.messages-page.messages-inbox-page::after {
  display: none !important;
}

.messages-page.messages-inbox-page *,
.messages-page.messages-inbox-page *::before,
.messages-page.messages-inbox-page *::after {
  box-sizing: border-box !important;
  min-width: 0;
}

.messages-page.messages-inbox-page .messages-inbox-hero {
  width: 100% !important;
```

Line 29:
```
  display: none !important;
}

.messages-page.messages-inbox-page *,
.messages-page.messages-inbox-page *::before,
.messages-page.messages-inbox-page *::after {
  box-sizing: border-box !important;
  min-width: 0;
}

.messages-page.messages-inbox-page .messages-inbox-hero {
  width: 100% !important;
  display: grid !important;
```

Line 30:
```
}

.messages-page.messages-inbox-page *,
.messages-page.messages-inbox-page *::before,
.messages-page.messages-inbox-page *::after {
  box-sizing: border-box !important;
  min-width: 0;
}

.messages-page.messages-inbox-page .messages-inbox-hero {
  width: 100% !important;
  display: grid !important;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 420px) !important;
```

Line 35:
```
  box-sizing: border-box !important;
  min-width: 0;
}

.messages-page.messages-inbox-page .messages-inbox-hero {
  width: 100% !important;
  display: grid !important;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 420px) !important;
  align-items: stretch !important;
  gap: 16px !important;
  padding: clamp(18px, 2.5vw, 28px) !important;
  border-radius: 26px !important;
  overflow: hidden !important;
```

### `src/pages/ClientMessagesInbox.css`

Line 1:
```
/* Professional admin inbox layer for ClientMessagesPage. */

.messages-inbox-page {
  max-width: 1480px;
  gap: 18px;
}

.messages-inbox-hero {
  position: relative;
```

Line 3:
```
/* Professional admin inbox layer for ClientMessagesPage. */

.messages-inbox-page {
  max-width: 1480px;
  gap: 18px;
}

.messages-inbox-hero {
  position: relative;
  overflow: hidden;
  display: grid;
```

Line 8:
```
  max-width: 1480px;
  gap: 18px;
}

.messages-inbox-hero {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 460px);
  gap: clamp(16px, 2.4vw, 28px);
  align-items: end;
  padding: clamp(20px, 3.2vw, 34px);
  border: 1px solid rgba(255,255,255,0.105);
```

Line 11:
```

.messages-inbox-hero {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 460px);
  gap: clamp(16px, 2.4vw, 28px);
  align-items: end;
  padding: clamp(20px, 3.2vw, 34px);
  border: 1px solid rgba(255,255,255,0.105);
  border-radius: 30px;
  background:
    radial-gradient(circle at 12% 0%, rgba(var(--accent-cyan-rgb), 0.12), transparent 38%),
```

Line 12:
```
.messages-inbox-hero {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 460px);
  gap: clamp(16px, 2.4vw, 28px);
  align-items: end;
  padding: clamp(20px, 3.2vw, 34px);
  border: 1px solid rgba(255,255,255,0.105);
  border-radius: 30px;
  background:
    radial-gradient(circle at 12% 0%, rgba(var(--accent-cyan-rgb), 0.12), transparent 38%),
    radial-gradient(circle at 90% 4%, rgba(239,197,110,0.12), transparent 34%),
```

Line 13:
```
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 460px);
  gap: clamp(16px, 2.4vw, 28px);
  align-items: end;
  padding: clamp(20px, 3.2vw, 34px);
  border: 1px solid rgba(255,255,255,0.105);
  border-radius: 30px;
  background:
    radial-gradient(circle at 12% 0%, rgba(var(--accent-cyan-rgb), 0.12), transparent 38%),
    radial-gradient(circle at 90% 4%, rgba(239,197,110,0.12), transparent 34%),
    linear-gradient(180deg, rgba(255,255,255,0.074), rgba(255,255,255,0.024)),
```

Line 15:
```
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 460px);
  gap: clamp(16px, 2.4vw, 28px);
  align-items: end;
  padding: clamp(20px, 3.2vw, 34px);
  border: 1px solid rgba(255,255,255,0.105);
  border-radius: 30px;
  background:
    radial-gradient(circle at 12% 0%, rgba(var(--accent-cyan-rgb), 0.12), transparent 38%),
    radial-gradient(circle at 90% 4%, rgba(239,197,110,0.12), transparent 34%),
    linear-gradient(180deg, rgba(255,255,255,0.074), rgba(255,255,255,0.024)),
    rgba(14,18,27,0.78);
  box-shadow: 0 26px 70px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.08);
```

Line 28:
```
  -webkit-backdrop-filter: blur(22px) saturate(1.08);
  backdrop-filter: blur(22px) saturate(1.08);
}

.messages-inbox-titleblock h1 {
  margin: 0;
  font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
  font-size: clamp(3.2rem, 6.8vw, 6.2rem);
  line-height: 0.88;
  letter-spacing: 0.018em;
  text-transform: uppercase;
}

```

Line 31:
```

.messages-inbox-titleblock h1 {
  margin: 0;
  font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
  font-size: clamp(3.2rem, 6.8vw, 6.2rem);
  line-height: 0.88;
  letter-spacing: 0.018em;
  text-transform: uppercase;
}

.messages-inbox-titleblock p {
  max-width: 760px;
  margin: 12px 0 0;
```

Line 37:
```
  letter-spacing: 0.018em;
  text-transform: uppercase;
}

.messages-inbox-titleblock p {
  max-width: 760px;
  margin: 12px 0 0;
  color: var(--text-secondary);
  font-size: 1rem;
  font-weight: 650;
  line-height: 1.62;
}

```

Line 46:
```
  font-weight: 650;
  line-height: 1.62;
}

.messages-inbox-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.messages-metric-card {
  min-height: 128px;
  display: grid;
```

Line 47:
```
  line-height: 1.62;
}

.messages-inbox-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.messages-metric-card {
  min-height: 128px;
  display: grid;
  align-content: space-between;
```

### `src/pages/FinancePage.css`

Line 111:
```
  color: var(--accent-cyan);
}

.finance-stats {
  display: grid;
  grid-template-columns: minmax(260px, 1.25fr) repeat(2, minmax(220px, 1fr));
  gap: 12px;
}

.finance-insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
```

Line 112:
```
}

.finance-stats {
  display: grid;
  grid-template-columns: minmax(260px, 1.25fr) repeat(2, minmax(220px, 1fr));
  gap: 12px;
}

.finance-insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
}
```

Line 116:
```
  grid-template-columns: minmax(260px, 1.25fr) repeat(2, minmax(220px, 1fr));
  gap: 12px;
}

.finance-insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
}

.finance-charts-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.85fr);
```

Line 117:
```
  gap: 12px;
}

.finance-insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
}

.finance-charts-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.85fr);
  gap: 12px;
```

Line 118:
```
}

.finance-insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
}

.finance-charts-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.85fr);
  gap: 12px;
}
```

Line 122:
```
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
}

.finance-charts-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.85fr);
  gap: 12px;
}

.finance-chart-card {
  min-width: 0;
  padding: 18px;
```

Line 123:
```
  gap: 12px;
}

.finance-charts-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.85fr);
  gap: 12px;
}

.finance-chart-card {
  min-width: 0;
  padding: 18px;
  overflow: hidden;
```

Line 124:
```
}

.finance-charts-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.85fr);
  gap: 12px;
}

.finance-chart-card {
  min-width: 0;
  padding: 18px;
  overflow: hidden;
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.15), box-shadow 0.4s ease, border-color 0.4s ease !important;
```

Line 475:
```
  padding-bottom: 90px !important;
}

.mobile-ledger-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.07) !important;
  border-left-width: 4px !important;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03) !important;
```

Line 476:
```
}

.mobile-ledger-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.07) !important;
  border-left-width: 4px !important;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(10px);
```

Line 635:
```
  gap: 7px;
}

.finance-form .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.finance-form label {
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 700;
```

Line 636:
```
}

.finance-form .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.finance-form label {
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 700;
}
```


## Recommended Next Phase

### PHASE 2 — Fix Hero Responsive Layout

Target perubahan:

- Hero tidak lagi memaksa text dan metric cards dalam satu layout horizontal saat container sempit.
- Title pakai responsive `clamp()`.
- Metric cards jadi compact pada tablet/mobile.
- Description diberi max-width dan line-height yang lebih stabil.
- Tidak menyentuh data, handler, route, auth, atau business logic.

### Candidate Anchors To Verify Before Patch

- `src/pages/ClientMessagesPage.css`
- `src/pages/CalendarPage.css`
- `src/pages/LandingPage.css`
- `src/pages/CustomersPage.css`
- `src/pages/ClientPortal.css`
- `src/pages/ClientMessagesInboxPolish.css`
- `src/pages/ClientMessagesInbox.css`
- `src/pages/FinancePage.css`

## Manual QA Checklist

- Desktop normal: hero, mailbox, inbox list, detail panel tetap rapi.
- Desktop dengan sidebar expanded: hero tidak gepeng dan title tidak pecah brutal.
- Tablet width: mailbox tidak clipping.
- Mobile/PWA: search input tidak kepotong, tabs bisa discroll, tidak ada horizontal overflow liar.
