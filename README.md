# 37 Music Studio

Fresh rebuild untuk aplikasi operasional 37 Music Studio.

## Phase 2

Fondasi UI sekarang dibuat **Tailwind-first**.

Yang sudah tersedia:

- React + Vite
- Tailwind v4 via `@tailwindcss/vite`
- Satu CSS entry utama: `src/styles/tailwind.css`
- ThemeProvider untuk dark/light mode
- Density mode: comfortable / compact
- ThemeContainer dengan utility class Tailwind
- Preview page Tailwind untuk hero, card, panel, input, select, dan button
- Vitest smoke test untuk token tema

## Command

```bash
npm install
npm run lint
npm test
npm run build
```

## Prinsip UI

- Tailwind utility-first sebagai gaya utama
- CSS custom hanya untuk token global, base reset, dan custom variant dark
- Komponen ke depan wajib reusable dan Tailwind-first
