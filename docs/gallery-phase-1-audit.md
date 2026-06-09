# Gallery Phase 1 Audit

> Audit-only. Tidak mengubah GalleryPage.jsx, GalleryPage.css, store, route, auth, permission, atau PublicGalleryPage.

## File Map

| Status | Area | Catatan |
|---|---|---|
| ✅ | GalleryPage.jsx | File utama Gallery admin ditemukan. |
| ✅ | GalleryPage.css | Style Gallery admin ditemukan. |
| ✅ | SettingsPage.css | Acuan visual Settings ditemukan. |
| ✅ | SettingsPage.jsx | Markup command shell Settings ditemukan. |
| ✅ | Modal.jsx | Modal mendukung className untuk redesign modal bertahap. |
| ✅ | useGalleryStore.js | Store Gallery ditemukan dan tidak disentuh. |

## Gallery Architecture Map

| Status | Area | Catatan |
|---|---|---|
| ✅ | Header | Masih memakai app-page-header biasa. Phase 2 aman relayout ke gallery-command-shell. |
| ✅ | Primary actions | Kelola Album dan Tambah Foto tersedia. Handler wajib dipertahankan. |
| ✅ | Storage overview | gallery-overview-panel memakai MAX_PHOTOS_LIMIT. Target Phase 3. |
| ✅ | Toolbar | View toggle, bulk select, reorder, filter tab, dan search ada. Target Phase 4. |
| ✅ | Photos view | photo-masonry-grid dan photo-masonry-item ada. Target Phase 5. |
| ✅ | Albums view | album-grid, album-card, drilldown header ada. Target Phase 6. |
| ✅ | Upload modal | File/URL tab, dropzone, queue, toggles, album selector ada. Target Phase 7. |
| ✅ | Lightbox | Overlay, settings panel, caption edit, visibility, album selector, delete ada. Target Phase 8. |
| ✅ | Bulk actions | Floating bulk-action-bar ada. Clearance mobile perlu Phase 9. |

## Logic Guardrail

| Status | Area | Catatan |
|---|---|---|
| ✅ | useGalleryStore | CRUD photo dan album tersedia. |
| ✅ | Upload compression | canvas.toBlob anchor aman. |
| ✅ | Upload cleanup | Object URL cleanup masih ada. |
| ✅ | Drag reorder | Drag/drop reorder handler tersedia. |
| ✅ | Lightbox handlers | Toggle landing/customer, change album, delete photo tersedia. |
| ✅ | No route/store patch | Phase 1 fixed hanya audit. |

## Design Reference From Settings

| Status | Area | Catatan |
|---|---|---|
| ✅ | Command shell | settings-command-shell bisa diturunkan ke gallery-command-shell. |
| ✅ | Visual token | Gold, cyan, subtle pink, glass border, inner highlight tersedia. |
| ✅ | Typography | Settings memakai compact modern admin typography. |
| ✅ | Mobile clearance | Settings punya bottom nav clearance yang bisa diadaptasi ke Gallery. |
| ✅ | Tabs density | Settings nav/tab density cocok jadi acuan toolbar Gallery. |

## Risk Notes

| Status | Area | Catatan |
|---|---|---|
| ⚠️ | Inline style count | 42 inline style ditemukan di GalleryPage.jsx. Perlu dikurangi bertahap. |
| ⚠️ | Album modal | Banyak inline style. Lebih aman redesign di Phase 7. |
| ⚠️ | Toolbar mobile | Masih campuran inline flex/wrap. Perlu shell khusus di Phase 4. |
| ⚠️ | Album stacked effect | Efek pseudo 3D album berpotensi tinggi/berantakan di mobile. Polish di Phase 6. |
| ⚠️ | Bulk action bar | Floating bottom perlu clearance dengan bottom nav di Phase 9. |

## Metrics

- Inline style blocks di GalleryPage.jsx: 42
- Modal usage di GalleryPage.jsx: 2
- AnimatePresence usage di GalleryPage.jsx: 6
- motion.div usage di GalleryPage.jsx: 14

## Next Safe Patch

Phase 2 aman fokus ke header:

- Ubah wrapper header dari `app-page-header` menjadi `app-page-header gallery-command-shell`.
- Tambah struktur `gallery-command-top`, `gallery-command-copy`, `gallery-command-text`, `gallery-command-eyebrow`, `gallery-action-cluster`.
- Pertahankan handler `setIsAlbumModalOpen(true)` dan `handleOpenUploadModal`.
- Tambah CSS marker Phase 2 di GalleryPage.css.
