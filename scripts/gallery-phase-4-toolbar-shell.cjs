// scripts/gallery-phase-4-toolbar-shell.cjs
// PHASE 4 - Toolbar, View Toggle, Filter Tabs, Search Relayout
// Scope:
// - Relayout toolbar only.
// - Preserve viewMode, activeTab, selectedAlbumFilter, searchQuery.
// - Preserve bulk select and reorder handlers.
// - Do not touch store/data model/routes/auth/PublicGalleryPage.
// - Do not touch grid/album/upload modal/lightbox/bulk bar implementation.

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const FILES = {
  galleryJsx: path.join(ROOT, 'src/pages/GalleryPage.jsx'),
  galleryCss: path.join(ROOT, 'src/pages/GalleryPage.css'),
  auditReport: path.join(ROOT, 'docs/gallery-phase-1-audit.md'),
};

const PHASE_MARKER_START = '/* === START GALLERY TOOLBAR PHASE 4 === */';
const PHASE_MARKER_END = '/* === END GALLERY TOOLBAR PHASE 4 === */';

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function assertFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`[PHASE 4] File wajib tidak ditemukan: ${label} -> ${path.relative(ROOT, filePath)}`);
  }

  if (!fs.statSync(filePath).isFile()) {
    throw new Error(`[PHASE 4] Path bukan file valid: ${label} -> ${path.relative(ROOT, filePath)}`);
  }
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function verifyContains(content, needle, label) {
  if (!content.includes(needle)) {
    throw new Error(`[PHASE 4] Anchor hilang: ${label}\nNeedle:\n${needle}`);
  }
}

function backup(filePath) {
  const backupPath = `${filePath}.bak-${nowStamp()}`;
  fs.copyFileSync(filePath, backupPath);
  console.log(`[PHASE 4] Backup dibuat: ${path.relative(ROOT, backupPath)}`);
}

function writeIfChanged(filePath, nextContent) {
  const prevContent = read(filePath);

  if (prevContent === nextContent) {
    console.log(`[PHASE 4] Tidak ada perubahan: ${path.relative(ROOT, filePath)}`);
    return false;
  }

  backup(filePath);
  fs.writeFileSync(filePath, nextContent, 'utf8');
  console.log(`[PHASE 4] Ditulis: ${path.relative(ROOT, filePath)}`);
  return true;
}

function stripMarkedBlock(content, startMarker, endMarker) {
  let next = content;

  while (next.includes(startMarker)) {
    const start = next.indexOf(startMarker);
    const end = next.indexOf(endMarker, start);

    if (end === -1) {
      throw new Error(`[PHASE 4] Marker penutup tidak ditemukan untuk ${startMarker}`);
    }

    const afterEnd = end + endMarker.length;
    const before = next.slice(0, start).replace(/\n{0,3}$/, '\n\n');
    const after = next.slice(afterEnd).replace(/^\n{0,3}/, '\n');
    next = before + after;
  }

  return next;
}

function replaceToolbarByLine(content) {
  const lines = content.split(/\r?\n/);

  const startIndex = lines.findIndex(line =>
    line.includes('{/* ── View Mode Toggle + Toolbar')
  );

  if (startIndex === -1) {
    throw new Error('[PHASE 4] Tidak menemukan komentar View Mode Toggle + Toolbar.');
  }

  const endIndex = lines.findIndex((line, index) =>
    index > startIndex && line.includes('{/* ══════════════════════════════════════════════════════════════════════ */}')
  );

  if (endIndex === -1) {
    throw new Error('[PHASE 4] Tidak menemukan batas awal PHOTOS VIEW setelah toolbar.');
  }

  const oldBlock = lines.slice(startIndex, endIndex).join('\n');

  [
    ['view toggle photos', "handleSwitchView('photos')"],
    ['view toggle albums', "handleSwitchView('albums')"],
    ['bulk toggle', 'setIsBulkSelectActive(!isBulkSelectActive)'],
    ['reorder toggle', 'setIsReorderActive(!isReorderActive)'],
    ['active tab all', "setActiveTab('all')"],
    ['active tab landing', "setActiveTab('landing')"],
    ['active tab customer', "setActiveTab('customer')"],
    ['search value', 'value={searchQuery}'],
    ['search onChange', 'onChange={(e) => setSearchQuery(e.target.value)}'],
    ['search clear', "onClick={() => setSearchQuery('')}"],
  ].forEach(([label, needle]) => verifyContains(oldBlock, needle, `old toolbar ${label}`));

  const replacement = `      {/* ── View Mode Toggle + Toolbar ────────────────────────────────────────── */}
      <section className="gallery-toolbar-shell" aria-label="Kontrol tampilan dan filter galeri">
        <div className="gallery-toolbar-primary">
          <div className="gallery-toolbar-mode-group">
            <div className="gallery-view-toggle gallery-view-toggle-modern" role="group" aria-label="Mode tampilan galeri">
              <button
                type="button"
                className={\`view-toggle-btn \${viewMode === 'photos' ? 'active' : ''}\`}
                onClick={() => {
                  handleSwitchView('photos');
                  setIsBulkSelectActive(false);
                  setIsReorderActive(false);
                  setSelectedPhotoIds([]);
                }}
                aria-pressed={viewMode === 'photos'}
                title="Tampilan Semua Foto"
              >
                <LayoutGrid size={15} />
                <span>Semua Foto</span>
              </button>
              <button
                type="button"
                className={\`view-toggle-btn \${viewMode === 'albums' ? 'active' : ''}\`}
                onClick={() => {
                  handleSwitchView('albums');
                  setIsBulkSelectActive(false);
                  setIsReorderActive(false);
                  setSelectedPhotoIds([]);
                }}
                aria-pressed={viewMode === 'albums'}
                title="Tampilan Per Album"
              >
                <BookImage size={15} />
                <span>Per Album</span>
              </button>
            </div>

            {viewMode === 'photos' && (
              <div className="gallery-action-mode-group" role="group" aria-label="Mode aksi foto">
                <button
                  type="button"
                  className={\`view-toggle-btn gallery-mode-action-btn \${isBulkSelectActive ? 'active' : ''}\`}
                  onClick={() => {
                    setIsBulkSelectActive(!isBulkSelectActive);
                    setIsReorderActive(false);
                    setSelectedPhotoIds([]);
                  }}
                  aria-pressed={isBulkSelectActive}
                  title="Pilih Beberapa Foto Sekaligus"
                >
                  <Check size={14} />
                  <span>{isBulkSelectActive ? 'Batal Pilih' : 'Pilih Massal'}</span>
                </button>
                {activeTab === 'all' && selectedAlbumFilter === 'all' && (
                  <button
                    type="button"
                    className={\`view-toggle-btn gallery-mode-action-btn \${isReorderActive ? 'active' : ''}\`}
                    onClick={() => {
                      setIsReorderActive(!isReorderActive);
                      setIsBulkSelectActive(false);
                      setSelectedPhotoIds([]);
                    }}
                    aria-pressed={isReorderActive}
                    title="Seret foto untuk mengubah urutan landing page"
                  >
                    <Settings2 size={14} />
                    <span>{isReorderActive ? 'Selesai Susun' : 'Susun Urutan'}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {viewMode === 'photos' && (
            <div className="gallery-toolbar-search-wrap">
              <div className="app-search app-search-md gallery-search-field">
                <Search className="app-search-icon" />
                <input
                  type="text"
                  className="app-search-input"
                  placeholder="Cari foto, caption, atau deskripsi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Cari foto galeri"
                />
                {searchQuery && (
                  <button type="button" className="app-search-clear" onClick={() => setSearchQuery('')} aria-label="Bersihkan pencarian">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {viewMode === 'photos' && (
          <div className="gallery-toolbar-secondary">
            <span className="gallery-toolbar-label">Filter tampilan</span>
            <div className="gallery-filter-tabs gallery-filter-tabs-modern" role="tablist" aria-label="Filter foto galeri">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'all'}
                className={\`gallery-filter-btn \${activeTab === 'all' ? 'active' : ''}\`}
                onClick={() => setActiveTab('all')}
              >
                <span>Semua</span>
                <strong>{gallery.length}</strong>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'landing'}
                className={\`gallery-filter-btn \${activeTab === 'landing' ? 'active' : ''}\`}
                onClick={() => setActiveTab('landing')}
              >
                <span>Landing</span>
                <strong>{gallery.filter(p => p.showOnLandingPage).length}</strong>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'customer'}
                className={\`gallery-filter-btn \${activeTab === 'customer' ? 'active' : ''}\`}
                onClick={() => setActiveTab('customer')}
              >
                <span>Customer</span>
                <strong>{gallery.filter(p => p.showToCustomer).length}</strong>
              </button>
            </div>
          </div>
        )}
      </section>`.split('\n');

  const nextLines = [
    ...lines.slice(0, startIndex),
    ...replacement,
    ...lines.slice(endIndex),
  ];

  return nextLines.join('\n');
}

function main() {
  Object.entries(FILES).forEach(([label, filePath]) => assertFile(filePath, label));

  const galleryJsx = read(FILES.galleryJsx);
  const galleryCss = read(FILES.galleryCss);
  const auditReport = read(FILES.auditReport);

  verifyContains(auditReport, 'Toolbar', 'Phase 1 audit toolbar target');
  verifyContains(auditReport, 'View toggle, bulk select, reorder, filter tab, dan search ada. Target Phase 4.', 'Phase 1 audit Phase 4 note');

  // Phase order guardrails.
  [
    ['phase 2 header css marker', '/* === START GALLERY COMMAND HEADER PHASE 2 === */'],
    ['phase 2 header jsx', 'className="app-page-header gallery-command-shell"'],
  ].forEach(([label, needle]) => {
    const source = label.includes('css') ? galleryCss : galleryJsx;
    verifyContains(source, needle, label);
  });

  // No jumping: Phase 3 must be applied before Phase 4.
  [
    ['phase 3 storage css marker', '/* === START GALLERY STORAGE PANEL PHASE 3 === */'],
    ['phase 3 storage jsx class', 'gallery-storage-panel'],
    ['phase 3 storage stats jsx', 'gallery-storage-stats'],
  ].forEach(([label, needle]) => {
    const source = label.includes('css') ? galleryCss : galleryJsx;
    verifyContains(
      source,
      needle,
      `${label}. Jalankan Phase 3 dulu sebelum Phase 4, bro. Jangan loncat tangga kosmik.`
    );
  });

  // Logic/import guardrails.
  [
    ['viewMode state', "const [viewMode, setViewMode] = useState('photos');"],
    ['activeTab state', "const [activeTab, setActiveTab] = useState('all');"],
    ['selectedAlbumFilter state', "const [selectedAlbumFilter, setSelectedAlbumFilter] = useState('all');"],
    ['searchQuery state', "const [searchQuery, setSearchQuery] = useState('');"],
    ['bulk state', 'const [isBulkSelectActive, setIsBulkSelectActive] = useState(false);'],
    ['selected photos state', 'const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);'],
    ['reorder state', 'const [isReorderActive, setIsReorderActive] = useState(false);'],
    ['switch view handler', 'const handleSwitchView = (mode) => {'],
    ['LayoutGrid import', 'LayoutGrid'],
    ['BookImage import', 'BookImage'],
    ['Check import', 'Check'],
    ['Settings2 import', 'Settings2'],
    ['Search import', 'Search'],
    ['X import', 'X'],
    ['photos view after toolbar', '{/* PHOTOS VIEW'],
  ].forEach(([label, needle]) => verifyContains(galleryJsx, needle, label));

  const nextGalleryJsx = replaceToolbarByLine(galleryJsx);

  [
    ['new toolbar shell', 'className="gallery-toolbar-shell"'],
    ['new toolbar primary', 'className="gallery-toolbar-primary"'],
    ['new toolbar mode group', 'className="gallery-toolbar-mode-group"'],
    ['new modern view toggle', 'className="gallery-view-toggle gallery-view-toggle-modern"'],
    ['new action mode group', 'className="gallery-action-mode-group"'],
    ['new search wrapper', 'className="gallery-toolbar-search-wrap"'],
    ['new search class', 'className="app-search app-search-md gallery-search-field"'],
    ['new toolbar secondary', 'className="gallery-toolbar-secondary"'],
    ['new filter tabs', 'className="gallery-filter-tabs gallery-filter-tabs-modern"'],
    ['photos handler preserved', "handleSwitchView('photos')"],
    ['albums handler preserved', "handleSwitchView('albums')"],
    ['bulk handler preserved', 'setIsBulkSelectActive(!isBulkSelectActive)'],
    ['reorder handler preserved', 'setIsReorderActive(!isReorderActive)'],
    ['all filter preserved', "setActiveTab('all')"],
    ['landing filter preserved', "setActiveTab('landing')"],
    ['customer filter preserved', "setActiveTab('customer')"],
    ['search value preserved', 'value={searchQuery}'],
    ['search onChange preserved', 'onChange={(e) => setSearchQuery(e.target.value)}'],
    ['search clear preserved', "onClick={() => setSearchQuery('')}"],
    ['photos view still present', '{/* PHOTOS VIEW'],
  ].forEach(([label, needle]) => verifyContains(nextGalleryJsx, needle, label));

  const phaseCss = `
${PHASE_MARKER_START}

/*
  Phase 4 scope:
  - Toolbar shell
  - View mode toggle relayout
  - Bulk/reorder action mode group
  - Filter tabs relayout
  - Search field relayout
  - No Gallery store, route, grid, modal, lightbox, bulk action bar, album card, or photo card logic touched
*/

.gallery-page .gallery-toolbar-shell {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: clamp(14px, 1.7vw, 20px);
  padding: clamp(10px, 1.35vw, 14px);
  border-radius: clamp(18px, 1.7vw, 24px);
  border: 1px solid rgba(255, 255, 255, 0.095);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.066), rgba(255, 255, 255, 0.024)),
    radial-gradient(circle at 12% 0%, rgba(var(--gallery-gold, 239, 197, 110), 0.08), transparent 28%),
    radial-gradient(circle at 100% 20%, rgba(var(--accent-cyan-rgb), 0.075), transparent 32%),
    rgba(13, 16, 24, 0.48);
  box-shadow:
    0 14px 42px rgba(0, 0, 0, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.065);
  backdrop-filter: blur(18px) saturate(1.06);
  -webkit-backdrop-filter: blur(18px) saturate(1.06);
  overflow: hidden;
}

.gallery-page .gallery-toolbar-shell::before {
  content: "";
  position: absolute;
  inset-inline: clamp(16px, 4vw, 48px);
  top: 0;
  height: 1px;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(var(--accent-cyan-rgb), 0.34), rgba(var(--gallery-gold, 239, 197, 110), 0.32), transparent);
  opacity: 0.76;
}

.gallery-page .gallery-toolbar-primary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(10px, 1.6vw, 16px);
}

.gallery-page .gallery-toolbar-mode-group {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  flex-wrap: wrap;
}

.gallery-page .gallery-view-toggle-modern,
.gallery-page .gallery-action-mode-group {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: 0 0 auto;
  padding: 4px;
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.095);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.056), rgba(255, 255, 255, 0.018)),
    rgba(0, 0, 0, 0.14);
}

.gallery-page .gallery-toolbar-shell .view-toggle-btn {
  min-height: 36px;
  padding: 0 13px;
  border-radius: 11px;
  font-size: 0.8rem;
  font-weight: 850;
  letter-spacing: -0.018em;
  color: var(--text-muted);
  border: 1px solid transparent;
}

.gallery-page .gallery-toolbar-shell .view-toggle-btn:hover {
  color: var(--text-primary);
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.045);
}

.gallery-page .gallery-toolbar-shell .view-toggle-btn.active {
  color: #171006;
  border-color: rgba(var(--gallery-gold, 239, 197, 110), 0.44);
  background:
    linear-gradient(135deg, rgba(var(--gallery-gold, 239, 197, 110), 1), rgba(224, 168, 82, 1));
  box-shadow:
    0 8px 18px rgba(var(--gallery-gold, 239, 197, 110), 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

.gallery-page .gallery-action-mode-group {
  border-color: rgba(var(--accent-cyan-rgb), 0.13);
  background:
    linear-gradient(135deg, rgba(var(--accent-cyan-rgb), 0.07), rgba(255, 255, 255, 0.02)),
    rgba(0, 0, 0, 0.13);
}

.gallery-page .gallery-mode-action-btn.active {
  color: #061418;
  border-color: rgba(var(--accent-cyan-rgb), 0.42);
  background:
    linear-gradient(135deg, rgba(var(--accent-cyan-rgb), 1), rgba(125, 229, 244, 0.94));
  box-shadow:
    0 8px 18px rgba(var(--accent-cyan-rgb), 0.17),
    inset 0 1px 0 rgba(255, 255, 255, 0.32);
}

.gallery-page .gallery-toolbar-search-wrap {
  flex: 1 1 320px;
  display: flex;
  justify-content: flex-end;
  min-width: min(100%, 280px);
}

.gallery-page .gallery-search-field {
  width: min(100%, 390px);
  min-height: 42px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.105);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.068), rgba(255, 255, 255, 0.026)),
    rgba(0, 0, 0, 0.14);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 10px 24px rgba(0, 0, 0, 0.10);
}

.gallery-page .gallery-search-field:focus-within {
  border-color: rgba(var(--accent-cyan-rgb), 0.38);
  box-shadow:
    0 0 0 3px rgba(var(--accent-cyan-rgb), 0.085),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.gallery-page .gallery-search-field .app-search-input {
  font-size: 0.82rem;
  font-weight: 650;
}

.gallery-page .gallery-toolbar-secondary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.075);
}

.gallery-page .gallery-toolbar-label {
  flex: 0 0 auto;
  color: var(--text-muted);
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  white-space: nowrap;
}

.gallery-page .gallery-filter-tabs-modern {
  flex: 1 1 auto;
  justify-content: flex-end;
  gap: 6px;
  max-width: 100%;
  overflow-x: auto;
  padding: 4px;
  border-radius: 15px;
  scrollbar-width: none;
}

.gallery-page .gallery-filter-tabs-modern::-webkit-scrollbar {
  display: none;
}

.gallery-page .gallery-filter-tabs-modern .gallery-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 11px;
  border-radius: 11px;
  font-size: 0.76rem;
  font-weight: 850;
  letter-spacing: -0.012em;
}

.gallery-page .gallery-filter-tabs-modern .gallery-filter-btn strong {
  display: inline-flex;
  min-width: 24px;
  height: 22px;
  align-items: center;
  justify-content: center;
  padding: 0 7px;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.86);
  background: rgba(255, 255, 255, 0.08);
  font-size: 0.68rem;
  font-weight: 900;
}

.gallery-page .gallery-filter-tabs-modern .gallery-filter-btn.active {
  color: #171006;
  background:
    linear-gradient(135deg, rgba(var(--gallery-gold, 239, 197, 110), 1), rgba(224, 168, 82, 1));
  box-shadow:
    0 7px 17px rgba(var(--gallery-gold, 239, 197, 110), 0.17),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

.gallery-page .gallery-filter-tabs-modern .gallery-filter-btn.active strong {
  color: #171006;
  background: rgba(255, 255, 255, 0.42);
}

[data-theme="light"] .gallery-page .gallery-toolbar-shell {
  border-color: rgba(15, 23, 42, 0.08);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.86), rgba(248, 250, 252, 0.68)),
    radial-gradient(circle at 12% 0%, rgba(var(--gallery-gold, 239, 197, 110), 0.11), transparent 28%),
    radial-gradient(circle at 100% 20%, rgba(var(--accent-cyan-rgb), 0.09), transparent 32%),
    rgba(255, 255, 255, 0.74);
  box-shadow:
    0 14px 38px rgba(15, 23, 42, 0.075),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

[data-theme="light"] .gallery-page .gallery-view-toggle-modern,
[data-theme="light"] .gallery-page .gallery-action-mode-group,
[data-theme="light"] .gallery-page .gallery-filter-tabs-modern,
[data-theme="light"] .gallery-page .gallery-search-field {
  border-color: rgba(15, 23, 42, 0.075);
  background: rgba(255, 255, 255, 0.62);
}

[data-theme="light"] .gallery-page .gallery-toolbar-shell .view-toggle-btn:not(.active) {
  color: #475569;
}

[data-theme="light"] .gallery-page .gallery-toolbar-label {
  color: #64748b;
}

@media (max-width: 920px) {
  .gallery-page .gallery-toolbar-primary {
    align-items: stretch;
    flex-direction: column;
  }

  .gallery-page .gallery-toolbar-mode-group,
  .gallery-page .gallery-toolbar-search-wrap {
    width: 100%;
  }

  .gallery-page .gallery-toolbar-search-wrap {
    justify-content: stretch;
  }

  .gallery-page .gallery-search-field {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .gallery-page .gallery-toolbar-shell {
    gap: 9px;
    margin-top: 12px;
    padding: 10px;
    border-radius: 18px;
  }

  .gallery-page .gallery-toolbar-mode-group {
    gap: 8px;
  }

  .gallery-page .gallery-view-toggle-modern,
  .gallery-page .gallery-action-mode-group {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 5px;
  }

  .gallery-page .gallery-toolbar-shell .view-toggle-btn {
    min-height: 38px;
    justify-content: center;
    padding: 0 9px;
    font-size: 0.75rem;
  }

  .gallery-page .gallery-search-field {
    min-height: 40px;
  }

  .gallery-page .gallery-toolbar-secondary {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
    padding-top: 9px;
  }

  .gallery-page .gallery-toolbar-label {
    font-size: 0.6rem;
  }

  .gallery-page .gallery-filter-tabs-modern {
    width: 100%;
    justify-content: flex-start;
  }

  .gallery-page .gallery-filter-tabs-modern .gallery-filter-btn {
    flex: 1 0 auto;
    justify-content: center;
    min-height: 34px;
    padding: 0 10px;
    font-size: 0.72rem;
  }
}

@media (max-width: 430px) {
  .gallery-page .gallery-filter-tabs-modern {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    overflow: visible;
  }

  .gallery-page .gallery-filter-tabs-modern .gallery-filter-btn {
    min-width: 0;
    gap: 5px;
    padding: 0 7px;
  }

  .gallery-page .gallery-filter-tabs-modern .gallery-filter-btn strong {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    font-size: 0.62rem;
  }
}

@media (max-width: 360px) {
  .gallery-page .gallery-toolbar-shell .view-toggle-btn span {
    max-width: 82px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

${PHASE_MARKER_END}
`;

  let nextGalleryCss = stripMarkedBlock(galleryCss, PHASE_MARKER_START, PHASE_MARKER_END).trimEnd();
  nextGalleryCss = `${nextGalleryCss}\n\n${phaseCss.trim()}\n`;

  [
    ['css marker start', PHASE_MARKER_START],
    ['css marker end', PHASE_MARKER_END],
    ['toolbar shell css', '.gallery-page .gallery-toolbar-shell'],
    ['modern view toggle css', '.gallery-page .gallery-view-toggle-modern'],
    ['action mode group css', '.gallery-page .gallery-action-mode-group'],
    ['search field css', '.gallery-page .gallery-search-field'],
    ['filter tabs modern css', '.gallery-page .gallery-filter-tabs-modern'],
    ['mobile css', '@media (max-width: 768px)'],
  ].forEach(([label, needle]) => verifyContains(nextGalleryCss, needle, label));

  writeIfChanged(FILES.galleryJsx, nextGalleryJsx);
  writeIfChanged(FILES.galleryCss, nextGalleryCss);

  console.log('[PHASE 4] Gallery toolbar relayout selesai.');
  console.log('[PHASE 4] Scope aman: toolbar/view/filter/search only.');
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
