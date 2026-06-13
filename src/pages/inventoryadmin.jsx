import {
  useMemo,
  useState,
  useEffect,
} from 'react';
import { useOutletContext } from 'react-router';
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
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '../lib/cn.js';
import { adminInventoryRepository } from '../services/adminInventoryRepository.js';

const inventoryStatusFilters = [
  { key: 'all', label: 'Semua' },
  { key: 'ready', label: 'Ready' },
  { key: 'low', label: 'Low stock' },
  { key: 'maintenance', label: 'Maintenance' },
];

const starterInventoryAssets = [
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

const emptyInventoryDraft = {
  category: 'Instrument',
  condition: 'Good',
  id: '',
  lastChecked: '',
  location: 'Studio',
  minQuantity: 1,
  name: '',
  nextMaintenance: '',
  notes: '',
  quantity: 1,
  status: 'ready',
  valueEstimate: 0,
};

const inventoryFormStatusOptions = [
  { key: 'ready', label: 'Ready' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'retired', label: 'Retired' },
];

function getTodayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function createInventoryItemId(name) {
  const slug = normalizeSearchText(name)
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 42);

  return `asset-${slug || 'item'}-${Date.now().toString(36)}`;
}

function createInventoryDraftFromItem(item = {}) {
  return {
    ...emptyInventoryDraft,
    ...item,
    id: item.id || '',
    lastChecked: item.lastChecked || getTodayDateKey(),
    minQuantity: Number(item.minQuantity) || 0,
    nextMaintenance: item.nextMaintenance || '',
    quantity: Number(item.quantity) || 0,
    status: item.status === 'low' ? 'ready' : item.status || 'ready',
    valueEstimate: Number(item.valueEstimate) || 0,
  };
}

function createInventoryPayloadFromDraft(draft, currentItem) {
  return {
    ...(currentItem || {}),
    ...draft,
    id: draft.id || createInventoryItemId(draft.name),
    minQuantity: Math.max(0, Number(draft.minQuantity) || 0),
    quantity: Math.max(0, Number(draft.quantity) || 0),
    valueEstimate: Math.max(0, Number(draft.valueEstimate) || 0),
  };
}


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

function InventoryOverviewStrip({ stats, itemCount }) {
  const overviewItems = [
    {
      helper: 'asset',
      icon: Boxes,
      label: 'Total',
      value: itemCount,
    },
    {
      helper: 'ready',
      icon: ShieldCheck,
      label: 'Ready',
      value: stats.ready,
    },
    {
      helper: 'low',
      icon: AlertTriangle,
      label: 'Low',
      value: stats.lowStock,
    },
    {
      helper: 'value',
      icon: Tags,
      label: 'Value',
      value: formatCurrency(stats.valueEstimate),
    },
  ];

  return (
    <section className="grid gap-2 border-y border-[var(--ui-border)] py-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Inventory summary">
      {overviewItems.map(({ helper, icon: Icon, label, value }) => (
        <article className="flex min-h-12 items-center gap-3 px-1" key={label}>
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[var(--ui-control)] text-studio-accent ring-1 ring-[var(--ui-ring)]">
            <Icon size={15} strokeWidth={2.35} aria-hidden="true" />
          </span>

          <div className="grid min-w-0 gap-0.5">
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
              {label}
            </span>
            <strong className="truncate text-lg font-semibold leading-none tracking-[-0.05em] text-[var(--ui-text-strong)]">
              {value}
            </strong>
            <span className="truncate text-[0.7rem] font-medium text-[var(--ui-text-soft)]">
              {helper}
            </span>
          </div>
        </article>
      ))}
    </section>
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
    <section className="relative overflow-hidden border-b border-[var(--ui-border)] pb-4 pt-2">
      <div className="pointer-events-none absolute -right-20 -top-24 size-48 rounded-full bg-studio-cyan/10 blur-3xl" aria-hidden="true" />
      <div className="relative z-10 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="grid gap-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--ui-control)] px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-studio-accent ring-1 ring-[var(--ui-ring)]">
            <Boxes size={14} strokeWidth={2.35} aria-hidden="true" />
            Studio Asset Inventory
          </div>

          <div className="grid gap-1">
            <h1 className="m-0 text-[clamp(2.35rem,5vw,4.6rem)] font-semibold leading-[0.94] tracking-[-0.08em] text-[var(--ui-text-strong)]">
              Inventory studio.
            </h1>

            <p className="m-0 max-w-2xl text-sm leading-7 text-[var(--ui-text-muted)]">
              Console ringkas untuk gear, cable, spare part, dan maintenance studio.
            </p>
          </div>
        </div>

        <div className="hidden min-w-40 text-right lg:grid">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
            Ready
          </span>
          <strong className="text-3xl font-semibold leading-none tracking-[-0.06em] text-[var(--ui-text-strong)]">
            {stats.ready}
          </strong>
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
  onCreateAsset,
  onSearchChange,
  onStatusChange,
}) {
  return (
    <section className="grid gap-2 py-2 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
      <label className="flex min-h-10 items-center gap-3 rounded-full bg-[var(--ui-control)] px-3 text-[var(--ui-text-strong)] ring-1 ring-[var(--ui-ring)]">
        <Search className="shrink-0 text-[var(--ui-text-soft)]" size={15} strokeWidth={2.35} aria-hidden="true" />
        <input
          className="min-h-8 w-full border-0 bg-transparent text-sm font-semibold outline-none placeholder:text-[var(--ui-text-soft)]"
          placeholder="Cari asset, kategori, lokasi..."
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <div className="flex snap-x items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0" aria-label="Inventory status filter">
        {inventoryStatusFilters.map((item) => (
          <button
            className={cn(
              'inline-flex min-h-8 shrink-0 items-center justify-center rounded-full px-3 text-[0.7rem] font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20',
              statusFilter === item.key
                ? 'bg-studio-accent/10 text-studio-accent ring-1 ring-studio-accent/15'
                : 'bg-transparent text-[var(--ui-text-muted)] hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)]',
            )}
            key={item.key}
            type="button"
            onClick={() => onStatusChange(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] lg:min-w-[230px]">
        <label className="flex min-h-9 items-center gap-2 rounded-full bg-[var(--ui-control)] px-3 text-xs font-semibold text-[var(--ui-text-muted)] ring-1 ring-[var(--ui-ring)]">
          <SlidersHorizontal size={14} strokeWidth={2.35} aria-hidden="true" />
          <select
            className="min-h-8 w-full border-0 bg-transparent font-semibold outline-none"
            value={categoryFilter}
            onChange={(event) => onCategoryChange(event.target.value)}
          >
            <option value="all">Semua kategori</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>

        <button
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full [background:var(--ui-primary-bg)] px-4 text-sm font-semibold text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
          type="button"
          onClick={onCreateAsset}
        >
          <Plus size={15} strokeWidth={2.35} aria-hidden="true" />
          Add
        </button>
      </div>

      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-soft)] lg:col-span-3">
        {resultCount} item
      </span>
    </section>
  );
}

function InventoryAssetCard({
  asset,
  onDeleteAsset,
  onEditAsset,
  onMarkMaintenance,
  onRestockAsset,
}) {
  const stockRatio = asset.minQuantity > 0
    ? Math.min(100, Math.round((asset.quantity / asset.minQuantity) * 100))
    : 100;
  const isMaintenance = asset.status === 'maintenance';

  return (
    <article className="group grid gap-3 px-2 py-3 transition hover:bg-[var(--ui-control)] lg:grid-cols-[minmax(260px,1fr)_120px_120px_190px] lg:items-center">
      <div className="grid min-w-0 gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--ui-control)] text-studio-accent ring-1 ring-[var(--ui-ring)]">
            <PackageCheck size={14} strokeWidth={2.35} aria-hidden="true" />
          </span>

          <h2 className="m-0 min-w-0 truncate text-base font-semibold tracking-[-0.04em] text-[var(--ui-text-strong)]">
            {asset.name}
          </h2>
        </div>

        <p className="m-0 truncate pl-9 text-xs font-semibold text-[var(--ui-text-muted)]">
          {asset.category} • {asset.location}
        </p>
      </div>

      <div className="flex items-center lg:justify-start">
        <InventoryStatusBadge status={asset.status} />
      </div>

      <div className="flex items-baseline gap-2 text-sm font-semibold text-[var(--ui-text-main)]">
        <strong className="text-xl font-semibold tracking-[-0.04em] text-[var(--ui-text-strong)]">
          {asset.quantity}
        </strong>
        <span className="text-[0.72rem] text-[var(--ui-text-muted)]">
          / min {asset.minQuantity}
        </span>
        <span className={cn(
          'ml-auto rounded-full px-2 py-0.5 text-[0.65rem] font-semibold lg:ml-0',
          stockRatio < 75 ? 'bg-studio-accent/10 text-studio-accent' : 'bg-studio-cyan/10 text-studio-cyan',
        )}>
          {stockRatio}%
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        <button
          aria-label={'Restock ' + asset.name}
          className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full bg-studio-cyan/10 px-2 text-[0.7rem] font-semibold text-studio-cyan transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-cyan/20"
          type="button"
          onClick={() => onRestockAsset(asset)}
        >
          <RotateCcw size={12} strokeWidth={2.35} aria-hidden="true" />
          +1
        </button>

        <button
          aria-label={(isMaintenance ? 'Mark ready ' : 'Mark maintenance ') + asset.name}
          className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full bg-studio-purple/10 px-2 text-[0.7rem] font-semibold text-studio-purple transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-purple/20"
          type="button"
          onClick={() => onMarkMaintenance(asset)}
        >
          <Wrench size={12} strokeWidth={2.35} aria-hidden="true" />
          {isMaintenance ? 'Ready' : 'Maint'}
        </button>

        <button
          aria-label={'Edit ' + asset.name}
          className="inline-flex min-h-8 items-center justify-center rounded-full bg-[var(--ui-control)] px-2 text-[var(--ui-text-muted)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
          type="button"
          onClick={() => onEditAsset(asset)}
        >
          <Pencil size={13} strokeWidth={2.35} aria-hidden="true" />
        </button>

        <button
          aria-label={'Delete ' + asset.name}
          className="inline-flex min-h-8 items-center justify-center rounded-full bg-studio-accent/10 px-2 text-studio-accent transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
          type="button"
          onClick={() => onDeleteAsset(asset)}
        >
          <Trash2 size={13} strokeWidth={2.35} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

function InventoryBoard({
  assets,
  onDeleteAsset,
  onEditAsset,
  onMarkMaintenance,
  onRestockAsset,
}) {
  if (assets.length === 0) {
    return (
      <section className="grid min-h-[220px] content-center justify-items-center gap-4 border-y border-[var(--ui-border)] p-6 text-center">
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
    <section className="overflow-hidden border-y border-[var(--ui-border)]">
      <div className="hidden border-b border-[var(--ui-border)] px-2 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-soft)] lg:grid lg:grid-cols-[minmax(260px,1fr)_120px_120px_190px]">
        <span>Asset</span>
        <span>Status</span>
        <span>Stock</span>
        <span>Actions</span>
      </div>

      <div className="divide-y divide-[var(--ui-border)]">
        {assets.map((asset) => (
          <InventoryAssetCard
            asset={asset}
            key={asset.id}
            onDeleteAsset={onDeleteAsset}
            onEditAsset={onEditAsset}
            onMarkMaintenance={onMarkMaintenance}
            onRestockAsset={onRestockAsset}
          />
        ))}
      </div>
    </section>
  );
}

function InventoryMaintenancePanel({ assets }) {
  const watchItems = assets.filter((asset) => asset.status !== 'ready').slice(0, 3);

  return (
    <aside className="grid gap-3 border-t border-[var(--ui-border)] pt-3">
      <div className="flex items-center justify-between gap-3">
        <div className="grid gap-0.5">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-studio-accent">
            Watchlist
          </span>
          <h2 className="m-0 text-lg font-semibold tracking-[-0.05em] text-[var(--ui-text-strong)]">
            Perlu perhatian
          </h2>
        </div>

        <Wrench className="text-studio-accent" size={17} strokeWidth={2.35} aria-hidden="true" />
      </div>

      <div className="grid gap-1.5">
        {watchItems.length > 0 ? watchItems.map((asset) => (
          <article className="grid gap-1 border-b border-[var(--ui-border)] pb-2" key={asset.id}>
            <div className="flex items-center justify-between gap-3">
              <strong className="truncate text-sm font-semibold text-[var(--ui-text-strong)]">
                {asset.name}
              </strong>
              <InventoryStatusBadge status={asset.status} />
            </div>

            <p className="m-0 truncate text-xs leading-5 text-[var(--ui-text-muted)]">
              {asset.notes}
            </p>
          </article>
        )) : (
          <p className="m-0 text-sm leading-6 text-[var(--ui-text-muted)]">
            Semua asset ready.
          </p>
        )}
      </div>
    </aside>
  );
}


function InventoryFormField({
  label,
  onChange,
  placeholder = '',
  type = 'text',
  value,
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-[var(--ui-text-main)]">
      <span className="text-[0.68rem] uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">{label}</span>
      <input
        className="min-h-10 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] placeholder:text-[var(--ui-text-soft)] focus:border-studio-accent/45 focus:ring-4 focus:ring-studio-accent/15"
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function InventoryFormPanel({
  draft,
  formMode,
  formStatus,
  onCancel,
  onChange,
  onSubmit,
}) {
  if (!draft) {
    return null;
  }

  const isSaving = formStatus === 'saving';

  return (
    <section className="fixed inset-0 z-50 grid justify-items-end bg-black/30 p-3 backdrop-blur-sm" aria-label="Inventory asset form">
      <form className="flex h-full w-full max-w-[520px] flex-col overflow-hidden rounded-[1.4rem] border border-[var(--ui-border-strong)] bg-[var(--ui-bg-page)] shadow-[var(--ui-shadow-strong)] ring-1 ring-[var(--ui-ring)]" onSubmit={onSubmit}>
        <div className="flex items-start justify-between gap-3 border-b border-[var(--ui-border)] p-4">
          <div className="grid gap-1">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-studio-accent">
              {formMode === 'edit' ? 'Edit asset' : 'New asset'}
            </span>
            <h2 className="m-0 text-2xl font-semibold tracking-[-0.06em] text-[var(--ui-text-strong)]">
              {formMode === 'edit' ? draft.name || 'Edit asset' : 'Tambah asset'}
            </h2>
          </div>

          <button
            aria-label="Close inventory form"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--ui-control)] text-[var(--ui-text-muted)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
            type="button"
            onClick={onCancel}
          >
            <X size={15} strokeWidth={2.35} aria-hidden="true" />
          </button>
        </div>

        <div className="grid flex-1 gap-4 overflow-y-auto p-4">
          <div className="grid gap-3">
            <InventoryFormField label="Nama" placeholder="Contoh: XLR cable 5m" value={draft.name} onChange={(value) => onChange('name', value)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <InventoryFormField label="Kategori" placeholder="Cable, Microphone..." value={draft.category} onChange={(value) => onChange('category', value)} />
              <InventoryFormField label="Lokasi" placeholder="Room A, Drawer..." value={draft.location} onChange={(value) => onChange('location', value)} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <InventoryFormField label="Qty" type="number" value={draft.quantity} onChange={(value) => onChange('quantity', value)} />
            <InventoryFormField label="Min" type="number" value={draft.minQuantity} onChange={(value) => onChange('minQuantity', value)} />
            <InventoryFormField label="Value" type="number" value={draft.valueEstimate} onChange={(value) => onChange('valueEstimate', value)} />
          </div>

          <label className="grid gap-1.5 text-sm font-semibold text-[var(--ui-text-main)]">
            <span className="text-[0.68rem] uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">Notes</span>
            <textarea
              className="min-h-24 resize-y rounded-xl border border-[var(--ui-border)] bg-[var(--ui-control)] p-3 text-sm font-medium leading-6 text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] placeholder:text-[var(--ui-text-soft)] focus:border-studio-accent/45 focus:ring-4 focus:ring-studio-accent/15"
              placeholder="Catatan kondisi, kebutuhan restock, noise, sparepart..."
              value={draft.notes}
              onChange={(event) => onChange('notes', event.target.value)}
            />
          </label>

          <details className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-control)] p-3 ring-1 ring-[var(--ui-ring)]">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--ui-text-strong)]">
              Detail lanjutan
            </summary>

            <div className="mt-3 grid gap-3">
              <label className="grid gap-1.5 text-sm font-semibold text-[var(--ui-text-main)]">
                <span className="text-[0.68rem] uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">Status</span>
                <select
                  className="min-h-10 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-page)] px-3 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] focus:border-studio-accent/45 focus:ring-4 focus:ring-studio-accent/15"
                  value={draft.status}
                  onChange={(event) => onChange('status', event.target.value)}
                >
                  {inventoryFormStatusOptions.map((option) => (
                    <option key={option.key} value={option.key}>{option.label}</option>
                  ))}
                </select>
              </label>

              <InventoryFormField label="Condition" placeholder="Good, Excellent..." value={draft.condition} onChange={(value) => onChange('condition', value)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <InventoryFormField label="Checked" type="date" value={draft.lastChecked} onChange={(value) => onChange('lastChecked', value)} />
                <InventoryFormField label="Next maintenance" type="date" value={draft.nextMaintenance} onChange={(value) => onChange('nextMaintenance', value)} />
              </div>
            </div>
          </details>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ui-border)] p-4">
          <span className={cn(
            'text-sm font-semibold',
            formStatus === 'error' ? 'text-studio-accent' : 'text-[var(--ui-text-muted)]',
          )}>
            {formStatus === 'saved' ? 'Tersimpan.' : formStatus === 'error' ? 'Gagal menyimpan.' : 'Simpan ke inventoryItems.'}
          </span>

          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[var(--ui-control)] px-4 text-sm font-semibold text-[var(--ui-text-muted)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
              disabled={isSaving}
              type="button"
              onClick={onCancel}
            >
              Cancel
            </button>

            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full [background:var(--ui-primary-bg)] px-5 text-sm font-semibold text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              <Save size={15} strokeWidth={2.35} aria-hidden="true" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}


function InventorySyncBanner({
  errorMessage,
  isReady,
  isUsingStarterAssets,
  itemCount,
  seedStatus,
  onSeedStarterInventory,
}) {
  const statusTitle = errorMessage
    ? 'Firestore belum terbaca'
    : isReady
      ? 'Firestore aktif'
      : 'Menghubungkan';

  const statusText = errorMessage
    ? errorMessage
    : isUsingStarterAssets
      ? 'Collection kosong. Starter asset ditampilkan sementara.'
      : String(itemCount) + ' item realtime.';

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ui-border)] py-2">
      <div className="flex min-w-0 items-center gap-2">
        <span className={cn(
          'grid size-8 shrink-0 place-items-center rounded-xl ring-1',
          errorMessage
            ? 'bg-studio-accent/10 text-studio-accent ring-studio-accent/15'
            : 'bg-studio-cyan/10 text-studio-cyan ring-studio-cyan/15',
        )}>
          {errorMessage ? (
            <AlertTriangle size={15} strokeWidth={2.35} aria-hidden="true" />
          ) : (
            <ShieldCheck size={15} strokeWidth={2.35} aria-hidden="true" />
          )}
        </span>

        <div className="grid min-w-0 gap-0.5">
          <strong className="truncate text-sm font-semibold text-[var(--ui-text-strong)]">
            {statusTitle}
          </strong>
          <span className="truncate text-xs font-medium text-[var(--ui-text-muted)]">
            {statusText}
          </span>
        </div>
      </div>

      <button
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-studio-cyan/25 bg-transparent px-3 text-xs font-semibold text-studio-cyan transition hover:bg-studio-cyan/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-cyan/20 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={seedStatus === 'saving'}
        type="button"
        onClick={onSeedStarterInventory}
      >
        <ClipboardList size={14} strokeWidth={2.35} aria-hidden="true" />
        {seedStatus === 'saving' ? 'Syncing' : seedStatus === 'saved' ? 'Seeded' : seedStatus === 'error' ? 'Failed' : 'Seed'}
      </button>
    </section>
  );
}

function InventoryFirestorePlan() {
  return (
    <details className="border-t border-[var(--ui-border)] pt-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[var(--ui-text-strong)]">
        <span className="grid gap-0.5">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-studio-cyan">
            Data layer
          </span>
          Firestore realtime
        </span>

        <ClipboardList className="text-studio-cyan" size={17} strokeWidth={2.35} aria-hidden="true" />
      </summary>

      <div className="mt-3 grid gap-2 text-xs leading-5 text-[var(--ui-text-muted)]">
        {[
          'inventoryItems untuk asset.',
          'inventoryActivityLogs untuk audit.',
          'Rules admin wajib aktif.',
        ].map((item) => (
          <div className="flex items-start gap-2" key={item}>
            <ArrowUpRight className="mt-0.5 shrink-0 text-studio-cyan" size={12} strokeWidth={2.35} aria-hidden="true" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </details>
  );
}

export function InventoryAdmin() {
  const adminContext = useOutletContext() || {};
  const { adminUser = null } = adminContext;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryState, setInventoryState] = useState({
    errorMessage: '',
    isReady: false,
  });
  const [seedStatus, setSeedStatus] = useState('idle');
  const [assetDraft, setAssetDraft] = useState(null);
  const [activeInventoryItem, setActiveInventoryItem] = useState(null);
  const [assetFormMode, setAssetFormMode] = useState('create');
  const [assetFormStatus, setAssetFormStatus] = useState('idle');

  useEffect(() => {
    setInventoryState({
      errorMessage: '',
      isReady: false,
    });

    const unsubscribe = adminInventoryRepository.subscribeInventoryItems(
      (items) => {
        setInventoryItems(items);
        setInventoryState((current) => ({
          ...current,
          isReady: true,
        }));
      },
      (error) => {
        setInventoryState({
          errorMessage: error?.message || 'Firestore inventory belum bisa dibaca. Cek rules inventoryItems.',
          isReady: true,
        });
      },
    );

    return unsubscribe;
  }, []);

  const activeAssets = inventoryItems.length > 0
    ? inventoryItems
    : starterInventoryAssets;
  const isUsingStarterAssets = inventoryState.isReady && inventoryItems.length === 0;
  const categories = useMemo(() => getInventoryCategories(activeAssets), [activeAssets]);
  const filteredAssets = useMemo(
    () => getFilteredAssets(activeAssets, searchTerm, statusFilter, categoryFilter),
    [activeAssets, categoryFilter, searchTerm, statusFilter],
  );
  const stats = useMemo(() => getInventoryStats(activeAssets), [activeAssets]);

  const resetAssetFormStatus = () => {
    window.setTimeout(() => {
      setAssetFormStatus('idle');
    }, 2200);
  };

  const closeAssetForm = () => {
    setAssetDraft(null);
    setActiveInventoryItem(null);
    setAssetFormMode('create');
    setAssetFormStatus('idle');
  };

  const openCreateAssetForm = () => {
    setActiveInventoryItem(null);
    setAssetDraft(createInventoryDraftFromItem());
    setAssetFormMode('create');
    setAssetFormStatus('idle');
  };

  const openEditAssetForm = (asset) => {
    setActiveInventoryItem(asset);
    setAssetDraft(createInventoryDraftFromItem(asset));
    setAssetFormMode('edit');
    setAssetFormStatus('idle');
  };

  const handleAssetDraftChange = (field, value) => {
    setAssetDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));

    if (assetFormStatus !== 'idle') {
      setAssetFormStatus('idle');
    }
  };

  const recordInventoryLog = async (entry) => {
    try {
      await adminInventoryRepository.recordInventoryActivityLog({
        ...entry,
        by: adminUser,
      });
    } catch (error) {
      console.error('Failed to record inventory activity log.', error);
    }
  };

  const handleAssetFormSubmit = async (event) => {
    event.preventDefault();

    if (!assetDraft || !String(assetDraft.name || '').trim()) {
      setAssetFormStatus('error');
      resetAssetFormStatus();
      return;
    }

    setAssetFormStatus('saving');

    try {
      const payload = createInventoryPayloadFromDraft(assetDraft, activeInventoryItem);
      const savedItem = await adminInventoryRepository.upsertInventoryItem(payload, adminUser);

      if (savedItem) {
        await recordInventoryLog({
          action: assetFormMode === 'edit' ? 'inventory-edit' : 'inventory-create',
          itemId: savedItem.id,
          itemName: savedItem.name,
          label: assetFormMode === 'edit' ? 'Inventory asset updated' : 'Inventory asset created',
        });
      }

      setAssetFormStatus('saved');

      window.setTimeout(() => {
        closeAssetForm();
      }, 650);
    } catch (error) {
      console.error('Failed to save inventory asset.', error);
      setAssetFormStatus('error');
      resetAssetFormStatus();
    }
  };

  const handleSeedStarterInventory = async () => {
    setSeedStatus('saving');

    try {
      const seededItems = await adminInventoryRepository.seedStarterInventoryItems(
        starterInventoryAssets,
        adminUser,
      );

      setInventoryItems(seededItems);
      setInventoryState({
        errorMessage: '',
        isReady: true,
      });
      setSeedStatus('saved');

      window.setTimeout(() => {
        setSeedStatus('idle');
      }, 2200);
    } catch (error) {
      console.error('Failed to seed starter inventory.', error);
      setSeedStatus('error');

      window.setTimeout(() => {
        setSeedStatus('idle');
      }, 2200);
    }
  };

  const handleRestockAsset = async (asset) => {
    try {
      const nextItem = {
        ...asset,
        lastChecked: getTodayDateKey(),
        quantity: Number(asset.quantity || 0) + 1,
        status: asset.status === 'maintenance' ? 'maintenance' : 'ready',
      };

      await adminInventoryRepository.upsertInventoryItem(nextItem, adminUser);
      await recordInventoryLog({
        action: 'inventory-restock',
        itemId: asset.id,
        itemName: asset.name,
        label: 'Inventory quantity restocked +1',
      });
    } catch (error) {
      console.error('Failed to restock inventory asset.', error);
    }
  };

  const handleMarkMaintenance = async (asset) => {
    try {
      const nextStatus = asset.status === 'maintenance' ? 'ready' : 'maintenance';
      const nextItem = {
        ...asset,
        lastChecked: getTodayDateKey(),
        status: nextStatus,
      };

      await adminInventoryRepository.upsertInventoryItem(nextItem, adminUser);
      await recordInventoryLog({
        action: nextStatus === 'maintenance' ? 'inventory-maintenance' : 'inventory-ready',
        itemId: asset.id,
        itemName: asset.name,
        label: nextStatus === 'maintenance' ? 'Inventory marked maintenance' : 'Inventory marked ready',
      });
    } catch (error) {
      console.error('Failed to update maintenance status.', error);
    }
  };

  const handleDeleteAsset = async (asset) => {
    const shouldDelete = window.confirm(`Delete inventory asset "${asset.name}"?`);

    if (!shouldDelete) {
      return;
    }

    try {
      await adminInventoryRepository.deleteInventoryItem(asset.id);
      await recordInventoryLog({
        action: 'inventory-delete',
        itemId: asset.id,
        itemName: asset.name,
        label: 'Inventory asset deleted',
      });
    } catch (error) {
      console.error('Failed to delete inventory asset.', error);
    }
  };

  return (
    <section className="grid gap-4 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-1 md:pb-4 md:pt-2" aria-labelledby="inventory-admin-title">
      <div className="sr-only" id="inventory-admin-title">
        Inventory admin workspace
      </div>

      <InventoryHero stats={stats} />

      <InventoryOverviewStrip stats={stats} itemCount={activeAssets.length} />

      <InventorySyncBanner
        errorMessage={inventoryState.errorMessage}
        isReady={inventoryState.isReady}
        isUsingStarterAssets={isUsingStarterAssets}
        itemCount={inventoryItems.length}
        seedStatus={seedStatus}
        onSeedStarterInventory={handleSeedStarterInventory}
      />

      <InventoryToolbar
        categories={categories}
        categoryFilter={categoryFilter}
        resultCount={filteredAssets.length}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onCategoryChange={setCategoryFilter}
        onCreateAsset={openCreateAssetForm}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
      />

      <InventoryFormPanel
        draft={assetDraft}
        formMode={assetFormMode}
        formStatus={assetFormStatus}
        onCancel={closeAssetForm}
        onChange={handleAssetDraftChange}
        onSubmit={handleAssetFormSubmit}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(230px,280px)] xl:items-start">
        <InventoryBoard
          assets={filteredAssets}
          onDeleteAsset={handleDeleteAsset}
          onEditAsset={openEditAssetForm}
          onMarkMaintenance={handleMarkMaintenance}
          onRestockAsset={handleRestockAsset}
        />

        <div className="grid gap-4">
          <InventoryMaintenancePanel assets={activeAssets} />
          <InventoryFirestorePlan />
        </div>
      </div>
    </section>
  );
}
