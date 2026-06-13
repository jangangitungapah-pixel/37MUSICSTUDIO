import {
  useMemo,
  useState,
} from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  ClipboardList,
  PackageCheck,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  Wrench,
} from 'lucide-react';
import { cn } from '../lib/cn.js';

const inventoryStatusFilters = [
  { key: 'all', label: 'Semua' },
  { key: 'ready', label: 'Ready' },
  { key: 'low', label: 'Low stock' },
  { key: 'maintenance', label: 'Maintenance' },
];

const inventoryAssets = [
  {
    id: 'asset-drum-kit-a',
    name: 'Drum kit Studio A',
    category: 'Instrument',
    location: 'Room A',
    condition: 'Excellent',
    status: 'ready',
    quantity: 1,
    minQuantity: 1,
    valueEstimate: 8500000,
    lastChecked: '2026-06-10',
    nextMaintenance: '2026-07-10',
    notes: 'Shell, cymbal, pedal, dan snare siap pakai.',
  },
  {
    id: 'asset-guitar-amp-100w',
    name: 'Guitar amp 100W',
    category: 'Amplifier',
    location: 'Room A',
    condition: 'Good',
    status: 'ready',
    quantity: 2,
    minQuantity: 1,
    valueEstimate: 6200000,
    lastChecked: '2026-06-08',
    nextMaintenance: '2026-07-08',
    notes: 'Channel clean dan drive normal.',
  },
  {
    id: 'asset-bass-amp-main',
    name: 'Bass amp main',
    category: 'Amplifier',
    location: 'Room B',
    condition: 'Watch',
    status: 'maintenance',
    quantity: 1,
    minQuantity: 1,
    valueEstimate: 5200000,
    lastChecked: '2026-06-06',
    nextMaintenance: '2026-06-18',
    notes: 'Pot volume perlu dicek, kadang noise tipis.',
  },
  {
    id: 'asset-dynamic-mic',
    name: 'Dynamic vocal mic',
    category: 'Microphone',
    location: 'Control Rack',
    condition: 'Good',
    status: 'ready',
    quantity: 6,
    minQuantity: 4,
    valueEstimate: 3600000,
    lastChecked: '2026-06-09',
    nextMaintenance: '2026-07-09',
    notes: 'Mic utama untuk vocal rehearsal.',
  },
  {
    id: 'asset-xlr-cable-5m',
    name: 'XLR cable 5m',
    category: 'Cable',
    location: 'Cable Drawer',
    condition: 'Low',
    status: 'low',
    quantity: 3,
    minQuantity: 8,
    valueEstimate: 450000,
    lastChecked: '2026-06-11',
    nextMaintenance: '2026-06-20',
    notes: 'Butuh restock, beberapa cable lama sudah crackle.',
  },
  {
    id: 'asset-jack-cable-3m',
    name: 'Jack cable 3m',
    category: 'Cable',
    location: 'Cable Drawer',
    condition: 'Low',
    status: 'low',
    quantity: 4,
    minQuantity: 10,
    valueEstimate: 520000,
    lastChecked: '2026-06-11',
    nextMaintenance: '2026-06-20',
    notes: 'Cadangan kurang untuk jam ramai.',
  },
  {
    id: 'asset-audio-interface',
    name: 'Audio interface 8 input',
    category: 'Recording',
    location: 'Control Desk',
    condition: 'Excellent',
    status: 'ready',
    quantity: 1,
    minQuantity: 1,
    valueEstimate: 7400000,
    lastChecked: '2026-06-07',
    nextMaintenance: '2026-07-07',
    notes: 'Input preamp normal, monitoring aman.',
  },
  {
    id: 'asset-stand-mic',
    name: 'Mic stand boom',
    category: 'Accessory',
    location: 'Room A',
    condition: 'Good',
    status: 'ready',
    quantity: 5,
    minQuantity: 4,
    valueEstimate: 1250000,
    lastChecked: '2026-06-10',
    nextMaintenance: '2026-07-01',
    notes: 'Dua stand perlu dikencangkan ulang bulan depan.',
  },
];

const inventoryStatusToneClasses = {
  low: 'border-studio-accent/35 bg-studio-accent/10 text-studio-accent ring-studio-accent/15',
  maintenance: 'border-studio-purple/35 bg-studio-purple/10 text-studio-purple ring-studio-purple/15',
  ready: 'border-studio-cyan/35 bg-studio-cyan/10 text-studio-cyan ring-studio-cyan/15',
};

function normalizeSearchText(value) {
  return String(value || '').trim().toLowerCase();
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(Number(value) || 0);
}

function formatDateLabel(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
  }).format(date);
}

function getInventoryStatusToneClass(status) {
  return inventoryStatusToneClasses[status] || 'border-[var(--ui-border)] bg-[var(--ui-control)] text-[var(--ui-text-main)] ring-[var(--ui-ring)]';
}

function getInventoryStats(assets) {
  return {
    lowStock: assets.filter((asset) => asset.status === 'low').length,
    maintenance: assets.filter((asset) => asset.status === 'maintenance').length,
    ready: assets.filter((asset) => asset.status === 'ready').length,
    totalAssets: assets.reduce((total, asset) => total + asset.quantity, 0),
    valueEstimate: assets.reduce((total, asset) => total + asset.valueEstimate, 0),
  };
}

function getInventoryCategories(assets) {
  return Array.from(new Set(assets.map((asset) => asset.category))).sort((first, second) => first.localeCompare(second));
}

function getFilteredAssets(assets, searchTerm, statusFilter, categoryFilter) {
  const query = normalizeSearchText(searchTerm);

  return assets.filter((asset) => {
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;
    const searchableText = normalizeSearchText([
      asset.name,
      asset.category,
      asset.location,
      asset.condition,
      asset.notes,
    ].join(' '));

    return matchesStatus && matchesCategory && (!query || searchableText.includes(query));
  });
}

function InventoryMetric({ helper, icon: Icon, label, value }) {
  return (
    <article className="grid gap-3 rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-4 ring-1 ring-[var(--ui-ring)]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
          {label}
        </span>
        <Icon className="text-studio-accent" size={18} strokeWidth={2.35} aria-hidden="true" />
      </div>

      <strong className="text-3xl font-semibold leading-none tracking-[-0.07em] text-[var(--ui-text-strong)]">
        {value}
      </strong>

      <span className="text-sm font-medium leading-6 text-[var(--ui-text-muted)]">
        {helper}
      </span>
    </article>
  );
}

function InventoryStatusBadge({ status }) {
  const label = inventoryStatusFilters.find((item) => item.key === status)?.label || status;

  return (
    <span className={cn('inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ring-1', getInventoryStatusToneClass(status))}>
      {label}
    </span>
  );
}

function InventoryHero({ stats }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] p-5 shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] backdrop-blur-2xl sm:p-7">
      <div className="pointer-events-none absolute -right-20 -top-28 size-64 rounded-full bg-studio-cyan/14 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 left-8 size-60 rounded-full bg-studio-accent/12 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-end">
        <div className="grid gap-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-studio-accent ring-1 ring-[var(--ui-ring)]">
            <Boxes size={15} strokeWidth={2.35} aria-hidden="true" />
            Studio Asset Inventory
          </div>

          <div className="grid gap-3">
            <h1 className="m-0 max-w-4xl text-[clamp(2.8rem,7vw,5.8rem)] font-semibold leading-[0.92] tracking-[-0.08em] text-[var(--ui-text-strong)]">
              Inventory studio yang siap diaudit.
            </h1>

            <p className="m-0 max-w-2xl text-base leading-8 text-[var(--ui-text-main)]">
              Pantau gear, cable, microphone, amplifier, spare part, dan maintenance supaya operasional studio tetap aman saat jam padat.
            </p>
          </div>
        </div>

        <div className="grid gap-2 rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-4 ring-1 ring-[var(--ui-ring)]">
          <div className="flex items-start justify-between gap-3">
            <div className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
                Inventory status
              </span>
              <strong className="text-2xl font-semibold tracking-[-0.055em] text-[var(--ui-text-strong)]">
                {stats.ready} ready item
              </strong>
            </div>

            <ShieldCheck className="text-studio-cyan" size={22} strokeWidth={2.35} aria-hidden="true" />
          </div>

          <p className="m-0 text-sm leading-6 text-[var(--ui-text-muted)]">
            Fase ini masih workspace foundation. Sync Firestore inventory akan dipasang setelah struktur collection disepakati.
          </p>
        </div>
      </div>
    </section>
  );
}

function InventoryToolbar({
  categoryFilter,
  categories,
  resultCount,
  searchTerm,
  statusFilter,
  onCategoryChange,
  onSearchChange,
  onStatusChange,
}) {
  return (
    <section className="grid gap-3 rounded-[1.75rem] border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] p-3 shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] backdrop-blur-2xl lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
      <label className="flex min-h-12 items-center gap-3 rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-3.5 text-[var(--ui-text-strong)] ring-1 ring-[var(--ui-ring)]">
        <Search className="shrink-0 text-[var(--ui-text-soft)]" size={17} strokeWidth={2.35} aria-hidden="true" />
        <input
          className="min-h-10 w-full border-0 bg-transparent text-sm font-semibold outline-none placeholder:text-[var(--ui-text-soft)]"
          placeholder="Cari gear, lokasi, kategori, catatan..."
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <div className="flex snap-x gap-2 overflow-x-auto pb-1 lg:pb-0" aria-label="Inventory status filter">
        {inventoryStatusFilters.map((item) => (
          <button
            className={cn(
              'inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20',
              statusFilter === item.key
                ? 'border-studio-accent/35 bg-studio-accent/10 text-studio-accent ring-1 ring-studio-accent/15'
                : 'border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-[var(--ui-secondary-text)] hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)]',
            )}
            key={item.key}
            type="button"
            onClick={() => onStatusChange(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <label className="flex min-h-11 items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-3 text-xs font-semibold text-[var(--ui-secondary-text)] ring-1 ring-[var(--ui-ring)]">
        <SlidersHorizontal size={15} strokeWidth={2.35} aria-hidden="true" />
        <select
          className="min-h-9 border-0 bg-transparent font-semibold outline-none"
          value={categoryFilter}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          <option value="all">Semua kategori</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </label>

      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)] lg:col-span-3">
        {resultCount} item tampil
      </span>
    </section>
  );
}

function InventoryAssetCard({ asset }) {
  const stockRatio = asset.minQuantity > 0
    ? Math.min(100, Math.round((asset.quantity / asset.minQuantity) * 100))
    : 100;

  return (
    <article className="grid gap-4 rounded-[1.6rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-4 ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control)]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid min-w-0 gap-2">
          <InventoryStatusBadge status={asset.status} />

          <div className="grid gap-1">
            <h2 className="m-0 truncate text-lg font-semibold tracking-[-0.045em] text-[var(--ui-text-strong)]">
              {asset.name}
            </h2>

            <p className="m-0 text-sm font-medium text-[var(--ui-text-muted)]">
              {asset.category} • {asset.location}
            </p>
          </div>
        </div>

        <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent">
          <PackageCheck size={19} strokeWidth={2.35} aria-hidden="true" />
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="grid gap-1 rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-3">
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">Qty</span>
          <strong className="text-xl font-semibold text-[var(--ui-text-strong)]">{asset.quantity}</strong>
        </div>

        <div className="grid gap-1 rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-3">
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">Min</span>
          <strong className="text-xl font-semibold text-[var(--ui-text-strong)]">{asset.minQuantity}</strong>
        </div>

        <div className="grid gap-1 rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-3">
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">Stock</span>
          <strong className="text-xl font-semibold text-[var(--ui-text-strong)]">{stockRatio}%</strong>
        </div>
      </div>

      <p className="m-0 min-h-12 text-sm leading-6 text-[var(--ui-text-main)]">
        {asset.notes}
      </p>

      <div className="grid gap-2 border-t border-[var(--ui-border)] pt-3 text-xs font-semibold text-[var(--ui-text-muted)] sm:grid-cols-2">
        <span>Checked: {formatDateLabel(asset.lastChecked)}</span>
        <span>Maintenance: {formatDateLabel(asset.nextMaintenance)}</span>
      </div>
    </article>
  );
}

function InventoryBoard({ assets }) {
  if (assets.length === 0) {
    return (
      <section className="grid min-h-[280px] content-center justify-items-center gap-4 rounded-[2rem] border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] p-6 text-center shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)]">
        <AlertTriangle className="text-studio-accent" size={28} strokeWidth={2.35} aria-hidden="true" />
        <div className="grid gap-2">
          <h2 className="m-0 text-2xl font-semibold tracking-[-0.06em] text-[var(--ui-text-strong)]">
            Inventory tidak ditemukan.
          </h2>
          <p className="m-0 max-w-lg text-sm leading-7 text-[var(--ui-text-muted)]">
            Ubah filter atau kata pencarian untuk melihat item studio yang lain.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
      {assets.map((asset) => (
        <InventoryAssetCard asset={asset} key={asset.id} />
      ))}
    </section>
  );
}

function InventoryMaintenancePanel({ assets }) {
  const watchItems = assets.filter((asset) => asset.status !== 'ready');

  return (
    <aside className="grid gap-4 rounded-[1.75rem] border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] p-4 shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] backdrop-blur-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-studio-accent">
            Maintenance watch
          </span>
          <h2 className="m-0 text-2xl font-semibold tracking-[-0.06em] text-[var(--ui-text-strong)]">
            Gear yang perlu perhatian.
          </h2>
        </div>

        <Wrench className="text-studio-accent" size={21} strokeWidth={2.35} aria-hidden="true" />
      </div>

      <div className="grid gap-2">
        {watchItems.length > 0 ? watchItems.map((asset) => (
          <article className="grid gap-2 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-3 ring-1 ring-[var(--ui-ring)]" key={asset.id}>
            <div className="flex items-start justify-between gap-3">
              <strong className="text-sm font-semibold text-[var(--ui-text-strong)]">
                {asset.name}
              </strong>
              <InventoryStatusBadge status={asset.status} />
            </div>

            <p className="m-0 text-xs leading-5 text-[var(--ui-text-muted)]">
              {asset.notes}
            </p>
          </article>
        )) : (
          <p className="m-0 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-3 text-sm leading-6 text-[var(--ui-text-muted)]">
            Semua asset starter sedang ready. Mantap, studio lagi kalem seperti preamp bersih.
          </p>
        )}
      </div>
    </aside>
  );
}

function InventoryFirestorePlan() {
  return (
    <section className="grid gap-4 rounded-[1.75rem] border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] p-4 shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] backdrop-blur-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-studio-cyan">
            Next data layer
          </span>
          <h2 className="m-0 text-2xl font-semibold tracking-[-0.06em] text-[var(--ui-text-strong)]">
            Firestore inventory sync.
          </h2>
        </div>

        <ClipboardList className="text-studio-cyan" size={21} strokeWidth={2.35} aria-hidden="true" />
      </div>

      <div className="grid gap-2">
        {[
          'inventoryItems untuk gear, cable, spare part, dan consumable.',
          'inventoryActivityLogs untuk check-in, maintenance, restock, dan audit.',
          'Rules mengikuti akun admin yang sudah dipakai login.',
        ].map((item) => (
          <div className="flex items-start gap-2 rounded-[1.1rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-3 text-sm leading-6 text-[var(--ui-text-main)]" key={item}>
            <ArrowUpRight className="mt-1 shrink-0 text-studio-cyan" size={14} strokeWidth={2.35} aria-hidden="true" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function InventoryAdmin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = useMemo(() => getInventoryCategories(inventoryAssets), []);
  const filteredAssets = useMemo(
    () => getFilteredAssets(inventoryAssets, searchTerm, statusFilter, categoryFilter),
    [categoryFilter, searchTerm, statusFilter],
  );
  const stats = useMemo(() => getInventoryStats(inventoryAssets), []);

  return (
    <section className="grid gap-4 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-1 md:pb-4 md:pt-2" aria-labelledby="inventory-admin-title">
      <div className="sr-only" id="inventory-admin-title">
        Inventory admin workspace
      </div>

      <InventoryHero stats={stats} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InventoryMetric helper="Total quantity dari asset starter." icon={Boxes} label="Total asset" value={stats.totalAssets} />
        <InventoryMetric helper="Item yang siap dipakai." icon={ShieldCheck} label="Ready" value={stats.ready} />
        <InventoryMetric helper="Perlu restock atau cadangan." icon={AlertTriangle} label="Low stock" value={stats.lowStock} />
        <InventoryMetric helper="Estimasi kasar asset tercatat." icon={Tags} label="Value" value={formatCurrency(stats.valueEstimate)} />
      </div>

      <InventoryToolbar
        categories={categories}
        categoryFilter={categoryFilter}
        resultCount={filteredAssets.length}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onCategoryChange={setCategoryFilter}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,390px)] xl:items-start">
        <InventoryBoard assets={filteredAssets} />

        <div className="grid gap-4">
          <InventoryMaintenancePanel assets={inventoryAssets} />
          <InventoryFirestorePlan />
        </div>
      </div>
    </section>
  );
}
