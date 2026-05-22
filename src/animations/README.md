# 37MUSICSTUDIO Animation System

Sistem animasi ini dibangun menggunakan `framer-motion` dengan prinsip performa, konsistensi, dan *premium aesthetics* (smooth & modern).

## Struktur
- `easings.js`: Berisi bezier curves (contoh: smooth, snappy, elegant).
- `transitions.js`: Konfigurasi durasi dan tipe spring (contoh: defaultTransition, modalTransition).
- `variants.js`: Definisi animasi kompleks yang reusable (contoh: fadeUp, blurUp, modalVariants).
- `hover.js`: Efek hover & tap micro-interaction (contoh: buttonHover, cardHover).
- `viewport.js`: Konfigurasi scroll reveal (contoh: onceViewport).
- `presets.js`: Preset siap pakai hasil gabungan dari file-file di atas (contoh: sectionPreset, cardPreset).

## Cara Penggunaan

### 1. Menggunakan Presets Langsung
Cara paling mudah adalah dengan meng-import presets dari `@/animations` atau relative import.

```jsx
import { motion } from 'framer-motion';
import { cardPreset, buttonPreset } from '../animations';

// Untuk card
<motion.div className="card" {...cardPreset}>
  Isi Card
</motion.div>

// Untuk button
<motion.button className="btn" {...buttonPreset}>
  Klik Saya
</motion.button>
```

### 2. Menggunakan Komponen Wrapper (Disarankan)
Gunakan komponen wrapper yang sudah dibuat di `src/components/animation/` agar tidak perlu import konfigurasi berulang kali.

```jsx
import MotionCard from '../components/animation/MotionCard';
import MotionSection from '../components/animation/MotionSection';

// Scroll Reveal
<MotionSection direction="up" delay={0.2}>
  <h2>Judul Bagian</h2>
</MotionSection>

// Interactive Card
<MotionCard interactive>
  <p>Isi dari card dengan efek hover premium.</p>
</MotionCard>
```

### 3. Menggunakan List & Stagger
Untuk daftar item (menu, grid kartu), gunakan `MotionList` dan `MotionListItem`.

```jsx
import { MotionList, MotionListItem } from '../components/animation/MotionList';

<MotionList>
  <MotionListItem>Item 1</MotionListItem>
  <MotionListItem>Item 2</MotionListItem>
  <MotionListItem>Item 3</MotionListItem>
</MotionList>
```

## Aturan Konsistensi & Performa
1. **Performa Pertama:** Animasi diutamakan menggunakan `opacity` dan `transform` (`x`, `y`, `scale`, `rotate`). Sebisa mungkin hindari menggerakkan `width`, `height`, `top`, `left`.
2. **Blur secara bijak:** `blurIn` dan `blurUp` sangat elegan, namun mahal secara performa. Gunakan hanya pada elemen Hero atau Modal, bukan untuk list ratusan baris.
3. **Responsive & Accessibility:** Komponen yang menggunakan animasi harus tetap bisa beroperasi meski motion dimatikan. Hook `useAppMotion` di `src/hooks/useAppMotion.js` otomatis mereduksi animasi jika user memilih preferensi *Reduced Motion* pada perangkat mereka.
4. **Tailwind vs Motion:** Jika hanya butuh hover perubahan warna background/teks, gunakan Vanilla CSS di `index.css`. Gunakan sistem animasi ini untuk transform (scale, y lift, physics spring), stagger layout, dan modal/page transitions.
