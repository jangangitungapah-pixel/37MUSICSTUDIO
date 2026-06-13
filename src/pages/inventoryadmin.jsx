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
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
  Download,
  Printer,
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

const stockMovementOptions = [
  {
    helper: 'Tambah stok masuk.',
    key: 'restock',
    label: 'Restock',
  },
  {
    helper: 'Stok terpakai operasional.',
    key: 'usage',
    label: 'Usage',
  },
  {
    helper: 'Stok rusak atau hilang.',
    key: 'damage',
    label: 'Damage',
  },
  {
    helper: 'Set jumlah aktual.',
    key: 'adjustment',
    label: 'Adjustment',
  },
];

function createStockMovementDraft(asset = {}) {
  return {
    movementType: 'restock',
    note: '',
    quantity: 1,
    sourceName: '',
    stockDate: getTodayDateKey(),
    targetQuantity: Math.max(0, Number(asset.quantity) || 0),
  };
}

function getStockMovementOptionLabel(movementType) {
  return stockMovementOptions.find((option) => option.key === movementType)?.label || 'Movement';
}

function getStockMovementPreview(asset, draft) {
  const currentQuantity = Math.max(0, Number(asset?.quantity) || 0);
  const inputQuantity = Math.max(0, Number(draft?.quantity) || 0);
  const targetQuantity = Math.max(0, Number(draft?.targetQuantity) || 0);
  const movementType = draft?.movementType || 'restock';

  if (movementType === 'usage' || movementType === 'damage') {
    const nextQuantity = Math.max(0, currentQuantity - inputQuantity);

    return {
      currentQuantity,
      nextQuantity,
      quantityChange: nextQuantity - currentQuantity,
    };
  }

  if (movementType === 'adjustment') {
    return {
      currentQuantity,
      nextQuantity: targetQuantity,
      quantityChange: targetQuantity - currentQuantity,
    };
  }

  return {
    currentQuantity,
    nextQuantity: currentQuantity + inputQuantity,
    quantityChange: inputQuantity,
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

function createInventoryReportFileName(prefix = 'inventory-report') {
  return prefix + '-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function escapeCsvValue(value) {
  const text = String(value ?? '');

  if (/[",\n\r]/u.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }

  return text;
}

function escapeReportHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getInventoryStockPercent(asset) {
  const quantity = Number(asset.quantity) || 0;
  const minQuantity = Number(asset.minQuantity) || 0;

  if (minQuantity <= 0) {
    return 100;
  }

  return Math.min(100, Math.round((quantity / minQuantity) * 100));
}

function getInventoryReportRows(assets) {
  return assets.map((asset) => ({
    category: asset.category || '',
    condition: asset.condition || '',
    id: asset.id || '',
    lastChecked: asset.lastChecked || '',
    location: asset.location || '',
    minQuantity: Number(asset.minQuantity) || 0,
    name: asset.name || '',
    nextMaintenance: asset.nextMaintenance || '',
    notes: asset.notes || '',
    quantity: Number(asset.quantity) || 0,
    status: asset.status || '',
    stockPercent: getInventoryStockPercent(asset),
    valueEstimate: Number(asset.valueEstimate) || 0,
  }));
}

function downloadInventoryCsv(assets) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const headers = [
    'Name',
    'Category',
    'Location',
    'Status',
    'Quantity',
    'Minimum',
    'Stock %',
    'Condition',
    'Value Estimate',
    'Last Checked',
    'Next Maintenance',
    'Notes',
  ];

  const rows = getInventoryReportRows(assets).map((row) => [
    row.name,
    row.category,
    row.location,
    row.status,
    row.quantity,
    row.minQuantity,
    row.stockPercent,
    row.condition,
    row.valueEstimate,
    row.lastChecked,
    row.nextMaintenance,
    row.notes,
  ]);

  const csvContent = [
    headers,
    ...rows,
  ]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n');

  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = createInventoryReportFileName('37-studio-inventory') + '.csv';
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

function createInventoryPrintMarkup(assets, stats) {
  const rows = getInventoryReportRows(assets);
  const generatedAt = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date());

  const rowMarkup = rows.map((row, index) => (
    '<tr>' +
      '<td>' + String(index + 1) + '</td>' +
      '<td><strong>' + escapeReportHtml(row.name) + '</strong><br><span>' + escapeReportHtml(row.category) + ' • ' + escapeReportHtml(row.location) + '</span></td>' +
      '<td>' + escapeReportHtml(row.status) + '</td>' +
      '<td>' + escapeReportHtml(row.quantity) + ' / min ' + escapeReportHtml(row.minQuantity) + '</td>' +
      '<td>' + escapeReportHtml(row.stockPercent) + '%</td>' +
      '<td>' + escapeReportHtml(formatCurrency(row.valueEstimate)) + '</td>' +
    '</tr>'
  )).join('');

  return '<!doctype html>' +
    '<html lang="id">' +
    '<head>' +
      '<meta charset="utf-8">' +
      '<title>37 Music Studio Inventory Report</title>' +
      '<style>' +
        '*{box-sizing:border-box}' +
        'body{margin:0;padding:32px;font-family:Inter,Arial,sans-serif;color:#111827;background:#fff}' +
        '.report-header{display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid #111827;padding-bottom:18px;margin-bottom:22px}' +
        '.eyebrow{font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#be185d;margin:0 0 8px}' +
        'h1{font-size:34px;line-height:1;margin:0;letter-spacing:-.06em}' +
        '.meta{font-size:12px;color:#4b5563;text-align:right;line-height:1.6}' +
        '.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:0 0 20px}' +
        '.stat{border:1px solid #d1d5db;border-radius:14px;padding:12px}' +
        '.stat span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.14em;color:#6b7280;font-weight:800}' +
        '.stat strong{display:block;font-size:22px;margin-top:4px;letter-spacing:-.04em}' +
        'table{width:100%;border-collapse:collapse;font-size:12px}' +
        'th{border-bottom:1px solid #111827;text-align:left;text-transform:uppercase;letter-spacing:.14em;font-size:10px;padding:10px 8px;color:#374151}' +
        'td{border-bottom:1px solid #e5e7eb;padding:10px 8px;vertical-align:top}' +
        'td span{color:#6b7280;font-size:11px}' +
        '@media print{body{padding:20px}.no-print{display:none}}' +
      '</style>' +
    '</head>' +
    '<body>' +
      '<header class="report-header">' +
        '<div>' +
          '<p class="eyebrow">37 Music Studio</p>' +
          '<h1>Inventory Report</h1>' +
        '</div>' +
        '<div class="meta">' +
          '<strong>Generated</strong><br>' +
          escapeReportHtml(generatedAt) +
        '</div>' +
      '</header>' +
      '<section class="stats">' +
        '<div class="stat"><span>Total Asset</span><strong>' + escapeReportHtml(assets.length) + '</strong></div>' +
        '<div class="stat"><span>Ready</span><strong>' + escapeReportHtml(stats.ready) + '</strong></div>' +
        '<div class="stat"><span>Low Stock</span><strong>' + escapeReportHtml(stats.lowStock) + '</strong></div>' +
        '<div class="stat"><span>Value</span><strong>' + escapeReportHtml(formatCurrency(stats.valueEstimate)) + '</strong></div>' +
      '</section>' +
      '<table>' +
        '<thead>' +
          '<tr>' +
            '<th>#</th>' +
            '<th>Asset</th>' +
            '<th>Status</th>' +
            '<th>Stock</th>' +
            '<th>%</th>' +
            '<th>Value</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' + rowMarkup + '</tbody>' +
      '</table>' +
    '</body>' +
    '</html>';
}

function printInventoryReport(assets, stats) {
  if (typeof window === 'undefined') {
    return;
  }

  const markup = createInventoryPrintMarkup(assets, stats);
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1120,height=800');

  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.open();
  printWindow.document.write(markup);
  printWindow.document.close();
  printWindow.focus();

  window.setTimeout(() => {
    printWindow.print();
  }, 250);
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

function formatActivityTime(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getInventoryActivityToneClass(action) {
  if (action.includes('delete')) {
    return 'text-studio-accent';
  }

  if (action.includes('maintenance')) {
    return 'text-studio-purple';
  }

  if (action.includes('restock') || action.includes('ready')) {
    return 'text-studio-cyan';
  }

  return 'text-[var(--ui-text-main)]';
}

function getInventoryItemActivityLogs(logs, itemId) {
  return Array.isArray(logs)
    ? logs.filter((log) => log.itemId === itemId).slice(0, 6)
    : [];
}

function _getInventoryStatusToneClass(status) {
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
  const toneClass = {
    low: 'bg-studio-accent/10 text-studio-accent',
    maintenance: 'bg-studio-purple/10 text-studio-purple',
    ready: 'bg-studio-cyan/10 text-studio-cyan',
    retired: 'bg-[var(--ui-control)] text-[var(--ui-text-muted)]',
  }[status] || 'bg-[var(--ui-control)] text-[var(--ui-text-main)]';

  return (
    <span className={cn('inline-flex w-fit items-center rounded-md px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em]', toneClass)}>
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
  onExportInventory,
  onPrintInventory,
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

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:min-w-[390px]">
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
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full bg-[var(--ui-control)] px-3 text-xs font-semibold text-[var(--ui-text-muted)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
          type="button"
          onClick={onExportInventory}
        >
          <Download size={14} strokeWidth={2.35} aria-hidden="true" />
          CSV
        </button>

        <button
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full bg-[var(--ui-control)] px-3 text-xs font-semibold text-[var(--ui-text-muted)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
          type="button"
          onClick={onPrintInventory}
        >
          <Printer size={14} strokeWidth={2.35} aria-hidden="true" />
          Print
        </button>

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
  onOpenDetail,
  onOpenStockMovement,
}) {
  const stockRatio = asset.minQuantity > 0
    ? Math.min(100, Math.round((asset.quantity / asset.minQuantity) * 100))
    : 100;
  const isMaintenance = asset.status === 'maintenance';
  const isLowStock = stockRatio < 75;

  return (
    <article
      className="grid min-w-[860px] grid-cols-[300px_128px_128px_210px] items-center gap-3 px-3 py-2.5 transition hover:bg-[var(--ui-control)]"
      title={'Last checked: ' + formatDateLabel(asset.lastChecked)}
    >
      <div className="grid min-w-0 gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-[var(--ui-control)] text-studio-accent ring-1 ring-[var(--ui-ring)]">
            <PackageCheck size={13} strokeWidth={2.35} aria-hidden="true" />
          </span>

          <button
            className="m-0 min-w-0 truncate text-left text-[0.95rem] font-semibold tracking-[-0.035em] text-[var(--ui-text-strong)] underline-offset-4 transition hover:text-studio-accent hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
            type="button"
            onClick={() => onOpenDetail(asset)}
          >
            {asset.name}
          </button>
        </div>

        <p className="m-0 truncate pl-8 text-[0.68rem] font-semibold text-[var(--ui-text-muted)]">
          {asset.category} • {asset.location}
        </p>
      </div>

      <InventoryStatusBadge status={asset.status} />

      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ui-text-main)]">
        <strong className="text-lg font-semibold tracking-[-0.04em] text-[var(--ui-text-strong)]">
          {asset.quantity}
        </strong>

        <span className="text-[0.7rem] text-[var(--ui-text-muted)]">
          min {asset.minQuantity}
        </span>

        {isLowStock ? (
          <span className="rounded-full bg-studio-accent/10 px-2 py-0.5 text-[0.62rem] font-semibold text-studio-accent">
            {stockRatio}%
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-[72px_72px_34px_34px] justify-end gap-1.5">
        <button
          aria-label={'Open stock movement for ' + asset.name}
          className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full bg-studio-cyan/10 px-2 text-[0.7rem] font-semibold text-studio-cyan transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-cyan/20"
          type="button"
          onClick={() => onOpenStockMovement(asset)}
        >
          <RotateCcw size={12} strokeWidth={2.35} aria-hidden="true" />
          Move
        </button>

        <button
          aria-label={(isMaintenance ? 'Mark ready ' : 'Mark maintenance ') + asset.name}
          className="inline-flex min-h-8 items-center justify-center rounded-full bg-studio-purple/10 px-2 text-[0.68rem] font-semibold text-studio-purple transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-purple/20"
          type="button"
          onClick={() => onMarkMaintenance(asset)}
        >
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
  onOpenDetail,
  onOpenStockMovement,
}) {
  if (assets.length === 0) {
    return (
      <section className="grid min-h-[200px] max-w-[980px] content-center justify-items-center gap-4 border-y border-[var(--ui-border)] p-6 text-center">
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
    <section className="max-w-[980px] overflow-hidden border-y border-[var(--ui-border)]">
      <div className="overflow-x-auto">
        <div className="min-w-[860px]">
          <div className="grid grid-cols-[300px_128px_128px_210px] gap-3 border-b border-[var(--ui-border)] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-soft)]">
            <span>Asset</span>
            <span>Status</span>
            <span>Stock</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="divide-y divide-[var(--ui-border)]">
            {assets.map((asset) => (
              <InventoryAssetCard
                asset={asset}
                key={asset.id}
                onDeleteAsset={onDeleteAsset}
                onEditAsset={onEditAsset}
                onMarkMaintenance={onMarkMaintenance}
                onOpenDetail={onOpenDetail}
                onOpenStockMovement={onOpenStockMovement}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function InventoryMaintenancePanel({ assets }) {
  const watchItems = assets.filter((asset) => asset.status !== 'ready').slice(0, 4);

  return (
    <section className="max-w-[980px] border-y border-[var(--ui-border)] py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-studio-accent">
          Watchlist
        </span>

        {watchItems.length > 0 ? watchItems.map((asset) => (
          <span className="inline-flex min-h-8 max-w-[260px] items-center gap-2 rounded-full bg-[var(--ui-control)] px-3 text-xs font-semibold text-[var(--ui-text-main)] ring-1 ring-[var(--ui-ring)]" key={asset.id}>
            <span className="truncate">{asset.name}</span>
            <InventoryStatusBadge status={asset.status} />
          </span>
        )) : (
          <span className="text-sm font-semibold text-[var(--ui-text-muted)]">
            Semua asset ready.
          </span>
        )}
      </div>
    </section>
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
        className="min-h-10 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-control-hover)] px-3 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] placeholder:text-[var(--ui-text-soft)] focus:border-studio-accent/45 focus:ring-4 focus:ring-studio-accent/15"
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
    <section className="fixed inset-0 z-50 grid justify-items-end bg-black/60 p-3 backdrop-blur-md" aria-label="Inventory asset form">
      <form className="flex h-full w-full max-w-[520px] flex-col overflow-hidden rounded-[1.4rem] border border-[var(--ui-border-strong)] bg-[var(--ui-bg-base)] shadow-[var(--ui-shadow-strong)] ring-1 ring-[var(--ui-ring)]" onSubmit={onSubmit}>
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
              className="min-h-24 resize-y rounded-xl border border-[var(--ui-border)] bg-[var(--ui-control-hover)] p-3 text-sm font-medium leading-6 text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] placeholder:text-[var(--ui-text-soft)] focus:border-studio-accent/45 focus:ring-4 focus:ring-studio-accent/15"
              placeholder="Catatan kondisi, kebutuhan restock, noise, sparepart..."
              value={draft.notes}
              onChange={(event) => onChange('notes', event.target.value)}
            />
          </label>

          <details className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-control-hover)] p-3 ring-1 ring-[var(--ui-ring)]">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--ui-text-strong)]">
              Detail lanjutan
            </summary>

            <div className="mt-3 grid gap-3">
              <label className="grid gap-1.5 text-sm font-semibold text-[var(--ui-text-main)]">
                <span className="text-[0.68rem] uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">Status</span>
                <select
                  className="min-h-10 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-base)] px-3 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] focus:border-studio-accent/45 focus:ring-4 focus:ring-studio-accent/15"
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

function InventoryStockMovementDrawer({
  asset,
  draft,
  movementStatus,
  onCancel,
  onChange,
  onSubmit,
}) {
  if (!asset || !draft) {
    return null;
  }

  const isSaving = movementStatus === 'saving';
  const movementPreview = getStockMovementPreview(asset, draft);
  const quantityLabel = draft.movementType === 'adjustment' ? 'Target quantity' : 'Quantity';

  return (
    <section className="fixed inset-0 z-50 grid justify-items-end bg-black/60 p-3 backdrop-blur-md" aria-label="Inventory stock movement drawer">
      <form className="flex h-full w-full max-w-[480px] flex-col overflow-hidden rounded-[1.4rem] border border-[var(--ui-border-strong)] bg-[var(--ui-bg-base)] shadow-[var(--ui-shadow-strong)] ring-1 ring-[var(--ui-ring)]" onSubmit={onSubmit}>
        <div className="flex items-start justify-between gap-3 border-b border-[var(--ui-border)] p-4">
          <div className="grid gap-1">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-studio-cyan">
              Stock movement
            </span>
            <h2 className="m-0 text-2xl font-semibold tracking-[-0.06em] text-[var(--ui-text-strong)]">
              {asset.name}
            </h2>
            <p className="m-0 text-sm font-semibold text-[var(--ui-text-muted)]">
              Current: {movementPreview.currentQuantity} • Next: {movementPreview.nextQuantity}
            </p>
          </div>

          <button
            aria-label="Close stock movement drawer"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--ui-control)] text-[var(--ui-text-muted)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
            type="button"
            onClick={onCancel}
          >
            <X size={15} strokeWidth={2.35} aria-hidden="true" />
          </button>
        </div>

        <div className="grid flex-1 gap-4 overflow-y-auto p-4">
          <div className="grid gap-2">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
              Movement type
            </span>

            <div className="grid gap-2 sm:grid-cols-2">
              {stockMovementOptions.map((option) => (
                <button
                  className={cn(
                    'grid gap-1 rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-cyan/20',
                    draft.movementType === option.key
                      ? 'border-studio-cyan/35 bg-studio-cyan/10 text-studio-cyan ring-1 ring-studio-cyan/15'
                      : 'border-[var(--ui-border)] bg-[var(--ui-control)] text-[var(--ui-text-main)] ring-1 ring-[var(--ui-ring)] hover:bg-[var(--ui-control-hover)]',
                  )}
                  key={option.key}
                  type="button"
                  onClick={() => onChange('movementType', option.key)}
                >
                  <strong className="text-sm font-semibold">
                    {option.label}
                  </strong>
                  <span className="text-xs font-medium text-[var(--ui-text-muted)]">
                    {option.helper}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold text-[var(--ui-text-main)]">
              <span className="text-[0.68rem] uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
                {quantityLabel}
              </span>
              <input
                className="min-h-10 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-control-hover)] px-3 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] focus:border-studio-cyan/45 focus:ring-4 focus:ring-studio-cyan/15"
                min="0"
                type="number"
                value={draft.movementType === 'adjustment' ? draft.targetQuantity : draft.quantity}
                onChange={(event) => onChange(draft.movementType === 'adjustment' ? 'targetQuantity' : 'quantity', event.target.value)}
              />
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-[var(--ui-text-main)]">
              <span className="text-[0.68rem] uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
                Date
              </span>
              <input
                className="min-h-10 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-control-hover)] px-3 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] focus:border-studio-cyan/45 focus:ring-4 focus:ring-studio-cyan/15"
                type="date"
                value={draft.stockDate}
                onChange={(event) => onChange('stockDate', event.target.value)}
              />
            </label>
          </div>

          <label className="grid gap-1.5 text-sm font-semibold text-[var(--ui-text-main)]">
            <span className="text-[0.68rem] uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
              Source / reason
            </span>
            <input
              className="min-h-10 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-control-hover)] px-3 text-sm font-semibold text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] placeholder:text-[var(--ui-text-soft)] focus:border-studio-cyan/45 focus:ring-4 focus:ring-studio-cyan/15"
              placeholder="Vendor, penggunaan sesi, koreksi opname..."
              value={draft.sourceName}
              onChange={(event) => onChange('sourceName', event.target.value)}
            />
          </label>

          <label className="grid gap-1.5 text-sm font-semibold text-[var(--ui-text-main)]">
            <span className="text-[0.68rem] uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
              Note
            </span>
            <textarea
              className="min-h-24 resize-y rounded-xl border border-[var(--ui-border)] bg-[var(--ui-control-hover)] p-3 text-sm font-medium leading-6 text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] placeholder:text-[var(--ui-text-soft)] focus:border-studio-cyan/45 focus:ring-4 focus:ring-studio-cyan/15"
              placeholder="Catatan tambahan untuk audit stok..."
              value={draft.note}
              onChange={(event) => onChange('note', event.target.value)}
            />
          </label>

          <div className="grid gap-2 rounded-xl bg-[var(--ui-control)] p-3 ring-1 ring-[var(--ui-ring)]">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
              Preview
            </span>
            <div className="flex items-end justify-between gap-3">
              <div className="grid gap-0.5">
                <span className="text-xs font-semibold text-[var(--ui-text-muted)]">Change</span>
                <strong className={cn(
                  'text-2xl font-semibold tracking-[-0.055em]',
                  movementPreview.quantityChange < 0 ? 'text-studio-accent' : 'text-studio-cyan',
                )}>
                  {movementPreview.quantityChange > 0 ? '+' : ''}{movementPreview.quantityChange}
                </strong>
              </div>

              <div className="grid gap-0.5 text-right">
                <span className="text-xs font-semibold text-[var(--ui-text-muted)]">After movement</span>
                <strong className="text-2xl font-semibold tracking-[-0.055em] text-[var(--ui-text-strong)]">
                  {movementPreview.nextQuantity}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ui-border)] p-4">
          <span className={cn(
            'text-sm font-semibold',
            movementStatus === 'error' ? 'text-studio-accent' : 'text-[var(--ui-text-muted)]',
          )}>
            {movementStatus === 'saved' ? 'Movement saved.' : movementStatus === 'error' ? 'Movement gagal.' : 'Update quantity dan timeline.'}
          </span>

          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[var(--ui-control)] px-4 text-sm font-semibold text-[var(--ui-text-muted)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-cyan/20"
              disabled={isSaving}
              type="button"
              onClick={onCancel}
            >
              Cancel
            </button>

            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full [background:var(--ui-primary-bg)] px-5 text-sm font-semibold text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-cyan/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              <Save size={15} strokeWidth={2.35} aria-hidden="true" />
              {isSaving ? 'Saving...' : 'Save movement'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function InventoryItemDetailDrawer({
  asset,
  logs,
  onCancel,
  onDeleteAsset,
  onEditAsset,
  onMarkMaintenance,
  onOpenStockMovement,
}) {
  if (!asset) {
    return null;
  }

  const stockPercent = getInventoryStockPercent(asset);
  const isMaintenance = asset.status === 'maintenance';
  const itemLogs = getInventoryItemActivityLogs(logs, asset.id);

  return (
    <section className="fixed inset-0 z-40 grid justify-items-end bg-black/60 p-3 backdrop-blur-md" aria-label="Inventory item detail drawer">
      <aside className="flex h-full w-full max-w-[560px] flex-col overflow-hidden rounded-[1.4rem] border border-[var(--ui-border-strong)] bg-[var(--ui-bg-base)] shadow-[var(--ui-shadow-strong)] ring-1 ring-[var(--ui-ring)]">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--ui-border)] p-4">
          <div className="grid min-w-0 gap-1">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-studio-accent">
              Asset detail
            </span>

            <h2 className="m-0 truncate text-2xl font-semibold tracking-[-0.06em] text-[var(--ui-text-strong)]">
              {asset.name}
            </h2>

            <p className="m-0 text-sm font-semibold text-[var(--ui-text-muted)]">
              {asset.category} • {asset.location}
            </p>
          </div>

          <button
            aria-label="Close asset detail"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--ui-control)] text-[var(--ui-text-muted)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
            type="button"
            onClick={onCancel}
          >
            <X size={15} strokeWidth={2.35} aria-hidden="true" />
          </button>
        </div>

        <div className="grid flex-1 gap-4 overflow-y-auto p-4">
          <section className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <InventoryStatusBadge status={asset.status} />
              <span className="rounded-md bg-[var(--ui-control)] px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)] ring-1 ring-[var(--ui-ring)]">
                {asset.condition || 'Good'}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-1 border-y border-[var(--ui-border)] py-3">
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
                  Quantity
                </span>
                <strong className="text-3xl font-semibold leading-none tracking-[-0.06em] text-[var(--ui-text-strong)]">
                  {asset.quantity}
                </strong>
              </div>

              <div className="grid gap-1 border-y border-[var(--ui-border)] py-3">
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
                  Minimum
                </span>
                <strong className="text-3xl font-semibold leading-none tracking-[-0.06em] text-[var(--ui-text-strong)]">
                  {asset.minQuantity}
                </strong>
              </div>

              <div className="grid gap-1 border-y border-[var(--ui-border)] py-3">
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
                  Stock
                </span>
                <strong className={cn(
                  'text-3xl font-semibold leading-none tracking-[-0.06em]',
                  stockPercent < 75 ? 'text-studio-accent' : 'text-studio-cyan',
                )}>
                  {stockPercent}%
                </strong>
              </div>
            </div>
          </section>

          <section className="grid gap-2 border-b border-[var(--ui-border)] pb-4">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
              Notes
            </span>
            <p className="m-0 text-sm leading-7 text-[var(--ui-text-main)]">
              {asset.notes || 'Belum ada catatan untuk asset ini.'}
            </p>
          </section>

          <section className="grid gap-2 border-b border-[var(--ui-border)] pb-4">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
              Schedule
            </span>

            <div className="grid gap-2 text-sm font-semibold text-[var(--ui-text-main)] sm:grid-cols-2">
              <span>Checked: {formatDateLabel(asset.lastChecked)}</span>
              <span>Next: {formatDateLabel(asset.nextMaintenance)}</span>
            </div>
          </section>

          <section className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-studio-cyan">
                Recent activity
              </span>
              <span className="text-xs font-semibold text-[var(--ui-text-muted)]">
                {itemLogs.length} log
              </span>
            </div>

            {itemLogs.length > 0 ? (
              <div className="grid divide-y divide-[var(--ui-border)]">
                {itemLogs.map((log) => (
                  <article className="grid gap-1 py-2" key={log.id}>
                    <div className="flex items-center justify-between gap-3">
                      <strong className={cn('truncate text-sm font-semibold', getInventoryActivityToneClass(log.action))}>
                        {log.label}
                      </strong>
                      <time className="shrink-0 text-xs font-semibold text-[var(--ui-text-soft)]" dateTime={log.at}>
                        {formatActivityTime(log.at)}
                      </time>
                    </div>

                    {log.quantityChange ? (
                      <p className="m-0 text-xs font-semibold text-[var(--ui-text-muted)]">
                        Qty {log.previousQuantity} → {log.nextQuantity} ({log.quantityChange > 0 ? '+' : ''}{log.quantityChange})
                      </p>
                    ) : null}

                    {log.note || log.sourceName ? (
                      <p className="m-0 truncate text-xs font-medium text-[var(--ui-text-muted)]">
                        {[log.sourceName, log.note].filter(Boolean).join(' • ')}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className="m-0 text-sm leading-6 text-[var(--ui-text-muted)]">
                Belum ada activity khusus untuk asset ini.
              </p>
            )}
          </section>
        </div>

        <div className="grid gap-2 border-t border-[var(--ui-border)] p-4 sm:grid-cols-[1fr_1fr_auto_auto]">
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-studio-cyan/10 px-4 text-sm font-semibold text-studio-cyan transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-cyan/20"
            type="button"
            onClick={() => onOpenStockMovement(asset)}
          >
            <RotateCcw size={14} strokeWidth={2.35} aria-hidden="true" />
            Move stock
          </button>

          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-studio-purple/10 px-4 text-sm font-semibold text-studio-purple transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-purple/20"
            type="button"
            onClick={() => onMarkMaintenance(asset)}
          >
            {isMaintenance ? 'Mark ready' : 'Maintenance'}
          </button>

          <button
            aria-label={'Edit ' + asset.name}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--ui-control)] px-4 text-[var(--ui-text-muted)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
            type="button"
            onClick={() => onEditAsset(asset)}
          >
            <Pencil size={15} strokeWidth={2.35} aria-hidden="true" />
          </button>

          <button
            aria-label={'Delete ' + asset.name}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-studio-accent/10 px-4 text-studio-accent transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
            type="button"
            onClick={() => onDeleteAsset(asset)}
          >
            <Trash2 size={15} strokeWidth={2.35} aria-hidden="true" />
          </button>
        </div>
      </aside>
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

function InventoryActivityTimeline({ logs, state }) {
  const visibleLogs = logs.slice(0, 7);

  return (
    <section className="max-w-[980px] border-b border-[var(--ui-border)] pb-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="grid gap-0.5">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-studio-cyan">
            Activity
          </span>
          <h2 className="m-0 text-lg font-semibold tracking-[-0.05em] text-[var(--ui-text-strong)]">
            Timeline inventory
          </h2>
        </div>

        <span className="text-xs font-semibold text-[var(--ui-text-muted)]">
          {state.errorMessage ? 'Log fallback' : state.isReady ? String(logs.length) + ' log' : 'Loading'}
        </span>
      </div>

      {state.errorMessage ? (
        <p className="m-0 mb-2 text-xs leading-5 text-studio-accent">
          {state.errorMessage}
        </p>
      ) : null}

      {visibleLogs.length > 0 ? (
        <div className="grid gap-0 divide-y divide-[var(--ui-border)]">
          {visibleLogs.map((log) => (
            <article className="grid gap-2 py-2 md:grid-cols-[minmax(180px,0.8fr)_minmax(0,1fr)_auto] md:items-center" key={log.id}>
              <div className="flex min-w-0 items-center gap-2">
                <span className={cn('size-2 rounded-full bg-current', getInventoryActivityToneClass(log.action))} aria-hidden="true" />
                <strong className="truncate text-sm font-semibold text-[var(--ui-text-strong)]">
                  {log.itemName}
                </strong>
              </div>

              <p className="m-0 truncate text-xs font-medium text-[var(--ui-text-muted)]">
                {log.label}
              </p>

              <time className="text-xs font-semibold text-[var(--ui-text-soft)]" dateTime={log.at}>
                {formatActivityTime(log.at)}
              </time>
            </article>
          ))}
        </div>
      ) : (
        <p className="m-0 text-sm leading-6 text-[var(--ui-text-muted)]">
          Belum ada activity. Aksi create, edit, restock, maintenance, dan delete akan muncul di sini.
        </p>
      )}
    </section>
  );
}

function InventoryFirestorePlan() {
  return (
    <details className="max-w-[980px] border-b border-[var(--ui-border)] pb-2">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold text-[var(--ui-text-muted)]">
        <span className="flex items-center gap-2">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-studio-cyan">
            Data layer
          </span>
          <span>Firestore realtime</span>
        </span>

        <ClipboardList className="text-studio-cyan" size={15} strokeWidth={2.35} aria-hidden="true" />
      </summary>

      <div className="mt-3 grid gap-2 text-xs leading-5 text-[var(--ui-text-muted)] md:grid-cols-3">
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
  const [stockMovementAsset, setStockMovementAsset] = useState(null);
  const [stockMovementDraft, setStockMovementDraft] = useState(null);
  const [stockMovementStatus, setStockMovementStatus] = useState('idle');
  const [detailAsset, setDetailAsset] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityState, setActivityState] = useState({
    errorMessage: '',
    isReady: false,
  });

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

  useEffect(() => {
    setActivityState({
      errorMessage: '',
      isReady: false,
    });

    const unsubscribe = adminInventoryRepository.subscribeInventoryActivityLogs(
      (logs) => {
        setActivityLogs(logs);
        setActivityState((current) => ({
          ...current,
          isReady: true,
        }));
      },
      (error) => {
        setActivityState({
          errorMessage: error?.message || 'Firestore inventoryActivityLogs belum bisa dibaca.',
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
  const selectedDetailAsset = useMemo(
    () => (detailAsset
      ? activeAssets.find((asset) => asset.id === detailAsset.id) || detailAsset
      : null),
    [activeAssets, detailAsset],
  );

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

  const resetStockMovementStatus = () => {
    window.setTimeout(() => {
      setStockMovementStatus('idle');
    }, 2200);
  };

  const closeStockMovementDrawer = () => {
    setStockMovementAsset(null);
    setStockMovementDraft(null);
    setStockMovementStatus('idle');
  };

  const openStockMovementDrawer = (asset) => {
    setStockMovementAsset(asset);
    setStockMovementDraft(createStockMovementDraft(asset));
    setStockMovementStatus('idle');
  };

  const handleStockMovementChange = (field, value) => {
    setStockMovementDraft((currentDraft) => {
      const nextDraft = {
        ...currentDraft,
        [field]: value,
      };

      if (field === 'movementType' && value === 'adjustment') {
        nextDraft.targetQuantity = Math.max(0, Number(stockMovementAsset?.quantity) || 0);
      }

      return nextDraft;
    });

    if (stockMovementStatus !== 'idle') {
      setStockMovementStatus('idle');
    }
  };

  const handleStockMovementSubmit = async (event) => {
    event.preventDefault();

    if (!stockMovementAsset || !stockMovementDraft) {
      setStockMovementStatus('error');
      resetStockMovementStatus();
      return;
    }

    const movementPreview = getStockMovementPreview(stockMovementAsset, stockMovementDraft);
    const movementLabel = getStockMovementOptionLabel(stockMovementDraft.movementType);

    setStockMovementStatus('saving');

    try {
      const nextItem = {
        ...stockMovementAsset,
        lastChecked: stockMovementDraft.stockDate || getTodayDateKey(),
        quantity: movementPreview.nextQuantity,
        status: stockMovementAsset.status === 'maintenance' ? 'maintenance' : 'ready',
      };

      await adminInventoryRepository.upsertInventoryItem(nextItem, adminUser);
      await recordInventoryLog({
        action: 'inventory-stock-' + stockMovementDraft.movementType,
        itemId: stockMovementAsset.id,
        itemName: stockMovementAsset.name,
        label: movementLabel + ': ' + movementPreview.currentQuantity + ' → ' + movementPreview.nextQuantity,
        movementType: stockMovementDraft.movementType,
        nextQuantity: movementPreview.nextQuantity,
        note: stockMovementDraft.note,
        previousQuantity: movementPreview.currentQuantity,
        quantityChange: movementPreview.quantityChange,
        sourceName: stockMovementDraft.sourceName,
      });

      setStockMovementStatus('saved');

      window.setTimeout(() => {
        closeStockMovementDrawer();
      }, 650);
    } catch (error) {
      console.error('Failed to save inventory stock movement.', error);
      setStockMovementStatus('error');
      resetStockMovementStatus();
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

  const openItemDetailDrawer = (asset) => {
    setDetailAsset(asset);
  };

  const closeItemDetailDrawer = () => {
    setDetailAsset(null);
  };

  const handleDetailMoveAsset = (asset) => {
    closeItemDetailDrawer();
    openStockMovementDrawer(asset);
  };

  const handleDetailEditAsset = (asset) => {
    closeItemDetailDrawer();
    openEditAssetForm(asset);
  };

  const handleDetailDeleteAsset = async (asset) => {
    closeItemDetailDrawer();
    await handleDeleteAsset(asset);
  };

  const handleExportInventory = () => {
    downloadInventoryCsv(filteredAssets);
  };

  const handlePrintInventory = () => {
    printInventoryReport(filteredAssets, stats);
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
        onExportInventory={handleExportInventory}
        onPrintInventory={handlePrintInventory}
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

      <InventoryItemDetailDrawer
        asset={selectedDetailAsset}
        logs={activityLogs}
        onCancel={closeItemDetailDrawer}
        onDeleteAsset={handleDetailDeleteAsset}
        onEditAsset={handleDetailEditAsset}
        onMarkMaintenance={handleMarkMaintenance}
        onOpenStockMovement={handleDetailMoveAsset}
      />

      <InventoryStockMovementDrawer
        asset={stockMovementAsset}
        draft={stockMovementDraft}
        movementStatus={stockMovementStatus}
        onCancel={closeStockMovementDrawer}
        onChange={handleStockMovementChange}
        onSubmit={handleStockMovementSubmit}
      />

      <div className="grid gap-3">
        <InventoryMaintenancePanel assets={activeAssets} />

        <InventoryBoard
          assets={filteredAssets}
          onDeleteAsset={handleDeleteAsset}
          onEditAsset={openEditAssetForm}
          onMarkMaintenance={handleMarkMaintenance}
          onOpenDetail={openItemDetailDrawer}
          onOpenStockMovement={openStockMovementDrawer}
        />

        <InventoryActivityTimeline logs={activityLogs} state={activityState} />

        <InventoryFirestorePlan />
      </div>
    </section>
  );
}
