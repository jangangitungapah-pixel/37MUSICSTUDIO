# 37 Music Studio

Aplikasi web/PWA untuk manajemen operasional studio musik: landing page publik, kalender booking, request booking pelanggan, dashboard admin, pelanggan, inventory, billing, finance, staff, galeri, export laporan, dan push notification.

## Ringkasan stack

- React + Vite
- React Router
- Zustand untuk state management
- Firebase Auth, Firestore, Hosting, dan optional Cloud Messaging
- Vite PWA / Workbox
- Vitest untuk unit test
- ESLint untuk quality gate
- ExcelJS dan React PDF untuk export laporan

## Arah UI design

Kiblat visual terbaru adalah **Modern Flat Minimalist — Premium Studio Ops UI**.

Prinsip utamanya:

- Surface solid dan ringan, bukan glass blur berat.
- Border 1px halus untuk struktur visual.
- Shadow tipis hanya untuk hierarki, bukan efek spatial/neon.
- Accent pink/rose dipakai hemat untuk CTA, active state, dan highlight penting.
- Motion ringan dan cepat, terutama aman untuk smartphone.
- Mobile-first performance: ambient blob, backdrop blur, glow, dan hover berat dimatikan.

Layer override utama ada di:

```txt
src/styles/flat-minimal-system.css
```

File ini di-import paling akhir di `src/main.jsx` supaya bisa menggeser visual system lama tanpa membongkar semua page sekaligus.

## Fitur utama

- Landing page publik untuk promosi studio
- Kalender publik untuk cek slot dan kirim request booking
- Dashboard admin/staff berbasis role dan permission
- Booking management dengan status pending, DP, confirmed, maintenance, dan cancelled
- Data pelanggan, inventory alat, finance, billing, staff, dan galeri
- Export workbook dashboard multi-sheet
- PWA dengan service worker dan manifest
- Push notification opsional via Firebase Cloud Messaging

## Prasyarat lokal

Gunakan Node.js versi 22 atau lebih baru, lalu install dependency dengan npm.

```bash
npm ci
```

## Setup environment

Salin file template environment:

```bash
cp .env.example .env
```

Isi nilai Firebase dari Firebase Console > Project settings > General > Your apps > Web app.

Minimal variable yang wajib diisi:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Opsional:

```bash
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_VAPID_KEY=
VITE_ALLOWED_HOSTS=
```

> Jangan commit file `.env` asli. File `.gitignore` sudah mengecualikan `.env`.

## Menjalankan project

```bash
npm run dev
```

Buka URL yang diberikan Vite, biasanya `http://localhost:5173`.

Untuk expose dev server lewat tunnel:

```bash
npm run online
```

## Quality gate lokal

Sebelum push atau deploy, jalankan:

```bash
npm run lint
npm test
npm run build
```

## Firebase setup checklist

### Authentication

Aktifkan provider berikut di Firebase Console:

- Email/Password untuk admin dan staff
- Anonymous Auth untuk akses kalender publik

### Firestore

Deploy rules:

```bash
firebase deploy --only firestore:rules
```

Rules utama ada di:

```txt
firestore.rules
```

Desain data penting:

- `bookings` menyimpan booking lengkap dan hanya boleh diakses admin/staff.
- `publicBookings` menyimpan data booking minimal untuk kalender publik.
- `bookingRequests` menyimpan request dari pelanggan.
- `users` menyimpan profile, role, permission, dan FCM token.

### Hosting

Build lalu deploy:

```bash
npm run build
firebase deploy --only hosting
```

Konfigurasi hosting ada di:

```txt
firebase.json
```

### Push notification opsional

Untuk Web Push / FCM:

1. Buka Firebase Console.
2. Masuk Project settings > Cloud Messaging.
3. Buat atau salin Web Push certificate key.
4. Isi ke `.env` sebagai `VITE_FIREBASE_VAPID_KEY`.
5. Pastikan service worker PWA aktif dari build production.

Catatan: pengiriman notifikasi lintas device idealnya memakai Cloud Functions/Admin SDK, bukan hanya client-side.

## CI

Repo ini punya GitHub Actions workflow di:

```txt
.github/workflows/ci.yml
```

Workflow menjalankan:

- `npm ci`
- `npm run lint`
- `npm test`
- `npm run build`

CI berjalan pada pull request ke `main` dan push ke branch tertentu.

## Struktur folder penting

```txt
src/
  components/     Komponen reusable dan shell admin
  pages/          Halaman public/admin
  store/          Zustand stores dan integrasi Firestore
  lib/            Helper domain, finance, export, FCM
  hooks/          Custom hooks
  styles/         Styling global dan overhaul UI
firestore.rules   Security rules Firestore
firebase.json     Firebase Hosting + Firestore config
.env.example      Template environment lokal/production
```

## Catatan audit kualitas

Status repo saat ini sudah layak untuk MVP/internal use, tetapi sebelum production penuh sebaiknya lanjutkan perbaikan berikut:

- Tambah test untuk booking overlap, permission, auth flow, billing, dan Firestore rules.
- Pindahkan operasi sensitif seperti reset password staff ke backend/Cloud Functions.
- Pecah store besar menjadi service/repository layer agar lebih mudah dirawat.
- Pastikan semua schema konsisten antara public form, store, notification, dan admin UI.
- Tambahkan monitoring error production.

## Script npm

```bash
npm run dev       # menjalankan Vite dev server
npm run online    # menjalankan Vite host + tunnel
npm run build     # build production
npm run lint      # lint source code
npm test          # menjalankan Vitest
npm run preview   # preview hasil build
```
