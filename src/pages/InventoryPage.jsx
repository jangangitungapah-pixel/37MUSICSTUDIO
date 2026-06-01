import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Box, Package, AlertCircle, Wrench, X, Tag, Hash, StickyNote, ChevronDown } from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { useBookingStore } from '../store/useBookingStore';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import { getMaintenanceUsageInsights } from '../lib/smartInsights';
import { motion } from 'framer-motion';
import { pagePreset } from '../animations';
import confetti from 'canvas-confetti';
import Fuse from 'fuse.js';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import useSound from 'use-sound';
import { CLICK_SOUND } from '../lib/sounds';
import { format } from 'date-fns';
import Lottie from 'lottie-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender
} from '@tanstack/react-table';
import './InventoryPage.css';

const CONDITION_COLORS = {
  'Excellent': { bg: 'rgba(76, 175, 80, 0.15)', color: '#4CAF50', label: 'Sangat Baik' },
  'Good': { bg: 'rgba(0, 240, 255, 0.15)', color: 'var(--accent-cyan)', label: 'Baik' },
  'Needs Repair': { bg: 'rgba(255, 193, 7, 0.15)', color: '#FFC107', label: 'Butuh Servis' },
  'Broken': { bg: 'rgba(255, 42, 95, 0.15)', color: 'var(--accent-pink)', label: 'Rusak' }
};

const inventorySchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  category: z.string().min(1, 'Pilih kategori'),
  brand: z.string().optional(),
  qty: z.number().int().min(1, 'Jumlah minimal 1 unit'),
  condition: z.enum(['Excellent', 'Good', 'Needs Repair', 'Broken']),
  rentalPrice: z.number().min(0, 'Harga sewa tidak boleh negatif'),
  lastServiced: z.string().optional(),
  nextService: z.string().optional(),
  notes: z.string().optional()
});

const validateWithZod = (fieldName) => (value) => {
  const fieldSchema = inventorySchema.shape[fieldName];
  if (!fieldSchema) return true;
  const result = fieldSchema.safeParse(value);
  return result.success ? true : result.error.errors[0].message;
};

const InventoryPage = () => {
  const { inventory, categories, addCategory, addEquipment, updateEquipment, deleteEquipment, getStats } = useInventoryStore();
  const { bookings } = useBookingStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  
  const [playClick] = useSound(CLICK_SOUND, { volume: 0.25 });
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch('/lottie/inventory-empty.json')
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error("Lottie load failed", err));
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const { register, handleSubmit: handleFormSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      category: '',
      brand: '',
      qty: 1,
      condition: 'Excellent',
      rentalPrice: 0,
      lastServiced: '',
      nextService: '',
      notes: ''
    }
  });

  const watchedCategory = watch('category');
  const watchedCondition = watch('condition');
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    if (watchedCategory === '__new__') {
      setShowNewCat(true);
    } else {
      setShowNewCat(false);
    }
  }, [watchedCategory]);

  const stats = getStats();
  const maintenanceInsights = useMemo(() => getMaintenanceUsageInsights(inventory, bookings), [inventory, bookings]);
  const selectedItemUsage = useMemo(() => {
    if (!selectedItem) return [];
    return bookings
      .filter((booking) => booking.status !== 'cancelled' && booking.rentedEquipment?.includes(selectedItem.id))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);
  }, [bookings, selectedItem]);

  const filteredInventory = useMemo(() => {
    let result = inventory;
    if (activeCategory !== 'All') {
      result = result.filter(item => item.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const fuse = new Fuse(result, {
        keys: ['name', 'brand', 'category', 'notes'],
        threshold: 0.35,
        ignoreLocation: true
      });
      result = fuse.search(searchQuery).map(r => r.item);
    }
    return result;
  }, [inventory, searchQuery, activeCategory]);

  const handleOpenNew = () => {
    playClick();
    setEditingItem(null);
    const today = new Date().toISOString().split('T')[0];
    reset({ name: '', category: categories[0] || '', brand: '', qty: 1, condition: 'Excellent', rentalPrice: 0, lastServiced: today, nextService: '', notes: '' });
    setNewCatName('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    playClick();
    setEditingItem(item);
    reset({ 
      name: item.name || '',
      category: item.category || '',
      brand: item.brand || '',
      qty: item.qty || 1,
      condition: item.condition || 'Excellent',
      rentalPrice: item.rentalPrice || 0,
      lastServiced: item.lastServiced || '',
      nextService: item.nextService || '',
      notes: item.notes || ''
    });
    setNewCatName('');
    setIsModalOpen(true);
    setSelectedItem(null);
  };

  const handleDelete = (id) => {
    playClick();
    const item = inventory.find(equipment => equipment.id === id);
    toast.warning('Hapus item inventaris?', {
      description: item?.name || 'Data alat ini akan dihapus permanen.',
      action: {
        label: 'Hapus',
        onClick: () => {
          deleteEquipment(id);
          if (selectedItem && selectedItem.id === id) setSelectedItem(null);
        }
      },
      cancel: {
        label: 'Batal',
        onClick: () => {}
      }
    });
  };

  const handleAddNewCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    addCategory(trimmed);
    setValue('category', trimmed);
    setShowNewCat(false);
    setNewCatName('');
  };

  const onSubmitForm = (data) => {
    const parsedData = {
      ...data,
      qty: Number(data.qty) || 1,
      rentalPrice: Number(data.rentalPrice) || 0
    };

    if (editingItem) {
      updateEquipment(editingItem.id, parsedData);
      toast.success('Data inventaris diperbarui!');
    } else {
      addEquipment(parsedData);
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#ff2a5f', '#FFC107', '#4CAF50']
      });
      toast.success('Item inventaris berhasil ditambahkan! 🎉');
    }
    setIsModalOpen(false);
  };

  const handleRowClick = (item) => {
    setSelectedItem(prev => prev && prev.id === item.id ? null : item);
  };

  const isServiceOverdue = (dateStr) => {
    return new Date(dateStr) <= new Date();
  };

  const formatCurrency = (num) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Nama Alat',
      cell: info => {
        const item = info.row.original;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: '500' }}>{item.name}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'brand',
      header: 'Brand',
      cell: info => info.getValue() || '—'
    },
    {
      accessorKey: 'category',
      header: 'Kategori'
    },
    {
      accessorKey: 'qty',
      header: 'Unit',
      cell: info => `${info.getValue()} unit`
    },
    {
      accessorKey: 'condition',
      header: 'Kondisi',
      cell: info => {
        const cond = info.getValue();
        const cfg = CONDITION_COLORS[cond] || CONDITION_COLORS['Excellent'];
        return (
          <span className="condition-badge" style={{ background: cfg.bg, color: cfg.color, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', display: 'inline-block' }}>
            {cfg.label}
          </span>
        );
      }
    },
    {
      accessorKey: 'rentalPrice',
      header: 'Harga Sewa',
      cell: info => formatCurrency(info.getValue())
    },
    {
      accessorKey: 'nextService',
      header: 'Jadwal Servis',
      cell: info => {
        const dateStr = info.getValue();
        if (!dateStr) return '—';
        const overdue = isServiceOverdue(dateStr);
        return (
          <span style={{ color: overdue ? 'var(--accent-pink)' : 'var(--text-secondary)', fontWeight: overdue ? '500' : 'normal' }}>
            {format(new Date(dateStr), 'dd MMM yyyy')} {overdue && '⚠️'}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: info => {
        const item = info.row.original;
        return (
          <div className="row-actions" onClick={e => e.stopPropagation()}>
            <button className="icon-btn edit" onClick={() => handleOpenEdit(item)} title="Edit" aria-label={`Edit ${item.name}`}><Edit2 size={15} /></button>
            <button className="icon-btn delete" onClick={() => handleDelete(item.id)} title="Hapus" aria-label={`Hapus ${item.name}`}><Trash2 size={15} /></button>
          </div>
        );
      }
    }
  ], [categories]);

  const [sorting, setSorting] = useState([]);

  const table = useReactTable({
    data: filteredInventory,
    columns,
    state: {
      sorting
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  return (
    <motion.div className="app-page inventory-page" {...pagePreset}>
      <header className="app-page-header">
        <div>
          <h2 className="app-page-title">Inventory Studio</h2>
          <p className="app-page-subtitle">37 Music Studio — Kelola dan pantau kondisi alat-alat studio</p>
        </div>
        
        <div className="app-page-actions">

          <button className="btn-primary" onClick={handleOpenNew}>
            <Plus size={18} />
            <span>Alat Baru</span>
          </button>
        </div>
      </header>

      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-icon stat-icon-total">
            <Box size={20} color="var(--accent-cyan)" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{stats.total} <small>jenis</small></span>
            <span className="stat-label">Total Item</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-qty">
            <Hash size={20} color="#CE93D8" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{stats.totalQty} <small>unit</small></span>
            <span className="stat-label">Total Unit</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-good">
            <Package size={20} color="#4CAF50" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{stats.excellent + stats.good}</span>
            <span className="stat-label">Kondisi Baik</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-warning">
            <Wrench size={20} color="#FFC107" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{stats.needsRepair + stats.broken}</span>
            <span className="stat-label">Perlu Perhatian</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-alert">
            <AlertCircle size={20} color="var(--accent-pink)" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{stats.serviceNeeded}</span>
            <span className="stat-label">Jadwal Servis Dekat</span>
          </div>
        </div>
      </div>

      {/* Smart Maintenance */}
      <div className="inventory-smart-panel">
        <div className="inventory-smart-head">
          <Wrench size={18} />
          <div>
            <h3>Maintenance Berbasis Pemakaian</h3>
            <p>{maintenanceInsights.studioHours30d} jam pemakaian studio dalam 30 hari terakhir.</p>
          </div>
        </div>
        <div className="inventory-smart-list">
          {maintenanceInsights.recommendations.slice(0, 4).map(({ item, label, usageHours, reason }) => {
            const complexityClass = label === 'Overhaul' ? 'kritis' : label === 'Cek Rutin' ? 'tinggi' : 'normal';
            return (
              <button
                key={item.id}
                type="button"
                className={`inventory-smart-item ${complexityClass}`}
                onClick={() => handleRowClick(item)}
              >
                <strong>{item.name}</strong>
                <span>{label} - {reason}</span>
                <small>{usageHours} jam estimasi</small>
              </button>
            );
          })}
          {maintenanceInsights.recommendations.length === 0 && (
            <span className="inventory-smart-empty">Belum ada data inventaris untuk dianalisis.</span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="inventory-content-area">
        <div className="inventory-container app-panel">
          <div className="app-table-toolbar">
            <div className="app-table-toolbar-left">
              <div>
                <span className="app-table-toolbar-title">Daftar Inventaris</span>
                <span className="app-table-toolbar-subtitle">{filteredInventory.length} item ditemukan</span>
              </div>
            </div>
            <div className="app-table-toolbar-right">
              <div className="filter-dropdown-container">
                <button 
                  type="button"
                  className="filter-dropdown-toggle"
                  onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                  aria-haspopup="listbox"
                  aria-expanded={isCatDropdownOpen}
                  aria-label="Filter kategori inventaris"
                >
                  <Package size={16} className="filter-dropdown-icon" />
                  <span className="filter-dropdown-label">
                    {activeCategory === 'All' ? `Semua Kategori (${inventory.length})` : `${activeCategory} (${inventory.filter(i => i.category === activeCategory).length})`}
                  </span>
                  <ChevronDown size={16} className={`filter-dropdown-arrow ${isCatDropdownOpen ? 'open' : ''}`} />
                </button>
                
                {isCatDropdownOpen && (
                  <>
                    <div className="filter-dropdown-overlay" onClick={() => setIsCatDropdownOpen(false)} />
                    <div className="filter-dropdown-menu" role="listbox">
                      <button 
                        type="button" 
                        className={`filter-dropdown-item ${activeCategory === 'All' ? 'active' : ''}`}
                        onClick={() => { setActiveCategory('All'); setIsCatDropdownOpen(false); }}
                        role="option"
                        aria-selected={activeCategory === 'All'}
                      >
                        <span>Semua Kategori</span>
                        <span className="tab-count">{inventory.length}</span>
                      </button>
                      {categories.map(cat => {
                        const count = inventory.filter(i => i.category === cat).length;
                        return (
                          <button 
                            key={cat}
                            type="button" 
                            className={`filter-dropdown-item ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => { setActiveCategory(cat); setIsCatDropdownOpen(false); }}
                            role="option"
                            aria-selected={activeCategory === cat}
                          >
                            <span>{cat}</span>
                            <span className="tab-count">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <div className="app-search app-search-md">
                <Search className="app-search-icon" />
                <input 
                  type="text" 
                  className="app-search-input"
                  placeholder="Cari nama alat, merk..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Cari nama alat atau merk inventaris"
                />
                {searchQuery && (
                  <button type="button" className="app-search-clear" onClick={() => setSearchQuery('')} aria-label="Bersihkan pencarian" title="Bersihkan pencarian">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

        {filteredInventory.length === 0 ? (
          <div className="maint-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
            {animationData ? (
              <div style={{ width: 140, height: 140, marginBottom: '16px' }}>
                <Lottie animationData={animationData} loop={true} />
              </div>
            ) : (
              <Package size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
            )}
            <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Tidak ada data inventaris ditemukan.</p>
            <small style={{ color: 'var(--text-muted)', maxWidth: '380px' }}>Tambahkan item inventaris baru melalui tombol di atas.</small>
          </div>
        ) : (
          <>
            {/* Desktop Table view */}
            <div className="app-table-wrapper hide-on-mobile">
              <table className="app-table inventory-table">
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => {
                        const canSort = header.column.getCanSort();
                        const isActionCol = header.id === 'actions';
                        return (
                          <th 
                            key={header.id} 
                            scope="col"
                            className={isActionCol ? 'action-col' : ''}
                            style={{ cursor: canSort ? 'pointer' : 'default', userSelect: 'none' }}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {canSort && ({
                                asc: ' 🔼',
                                desc: ' 🔽'
                              }[header.column.getIsSorted()] || null)}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr 
                      key={row.id} 
                      className={`maint-row ${selectedItem && selectedItem.id === row.original.id ? 'row-selected' : ''}`} 
                      onClick={() => handleRowClick(row.original)}
                    >
                      {row.getVisibleCells().map(cell => {
                        const isActionCol = cell.column.id === 'actions';
                        return (
                          <td 
                            key={cell.id} 
                            className={isActionCol ? 'action-col' : ''}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          {/* Mobile Card List */}
          <div className="mobile-inv-list show-on-mobile">
            {filteredInventory.length > 0 ? (
              filteredInventory.map(item => {
                const condition = CONDITION_COLORS[item.condition] || CONDITION_COLORS['Good'];
                const overdue = isServiceOverdue(item.nextService);
                return (
                  <div key={item.id} className="mobile-inv-card" onClick={() => handleRowClick(item)}>
                    <div className={`item-condition-dot ${item.condition.toLowerCase().replace(' ', '-')}`} />
                    <div className="mobile-inv-info">
                      <span className="item-name">{item.name}</span>
                      <div className="mobile-inv-meta">
                        <span className="mobile-meta-tag cat">{item.category}</span>
                        {item.brand && <span className="mobile-meta-tag brand">{item.brand}</span>}
                        <span className="mobile-meta-tag qty">{item.qty || 1} unit</span>
                        {overdue && <span className="mobile-meta-tag overdue">⚠ Servis</span>}
                      </div>
                    </div>
                    <div className="mobile-inv-right">
                      <span className="condition-badge" style={{ background: condition.bg, color: condition.color }}>
                        {condition.label}
                      </span>
                      <div className="mobile-inv-actions" onClick={e => e.stopPropagation()}>
                        <button 
                          className="icon-btn" 
                          onClick={() => handleOpenEdit(item)} 
                          title="Edit"
                          aria-label={`Edit data ${item.name}`}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="icon-btn delete" 
                          onClick={() => handleDelete(item.id)} 
                          title="Hapus"
                          aria-label={`Hapus data ${item.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state" style={{padding: '32px', textAlign: 'center', color: 'var(--text-muted)'}}>
                Tidak ada data inventaris ditemukan.
              </div>
            )}
          </div>
        </>
      )}
    </div>

        {/* Detail Sidebar */}
        {selectedItem && (
          <div className="item-detail-panel app-panel">
            <div className="detail-panel-header">
              <div className="detail-icon-large" style={{ background: (CONDITION_COLORS[selectedItem.condition] || CONDITION_COLORS['Good']).bg, color: (CONDITION_COLORS[selectedItem.condition] || CONDITION_COLORS['Good']).color }}>
                <Box size={28} />
              </div>
              <h3>{selectedItem.name}</h3>
              <span className="condition-badge" style={{ background: (CONDITION_COLORS[selectedItem.condition] || CONDITION_COLORS['Good']).bg, color: (CONDITION_COLORS[selectedItem.condition] || CONDITION_COLORS['Good']).color }}>
                {(CONDITION_COLORS[selectedItem.condition] || CONDITION_COLORS['Good']).label}
              </span>
              <button className="icon-btn detail-panel-close" onClick={() => setSelectedItem(null)} aria-label="Tutup panel detail"><X size={16} /></button>
            </div>

            <div className="detail-panel-body">
              <div className="detail-section">
                <h4 className="section-title">Spesifikasi</h4>
                <div className="detail-item"><Tag size={14} /> <span>Kategori: {selectedItem.category}</span></div>
                <div className="detail-item"><Package size={14} /> <span>Merk: {selectedItem.brand}</span></div>
                <div className="detail-item"><Hash size={14} /> <span>Jumlah: {selectedItem.qty || 1} unit</span></div>
              </div>

              <div className="detail-section">
                <h4 className="section-title">Maintenance</h4>
                {(() => {
                  const insight = maintenanceInsights.recommendations.find((rec) => rec.item.id === selectedItem.id);
                  return insight ? (
                    <div className={`usage-insight-card ${insight.label.toLowerCase()}`}>
                      <strong>{insight.label}</strong>
                      <span>{insight.reason}</span>
                      <small>Estimasi pemakaian 30 hari: {insight.usageHours} jam</small>
                    </div>
                  ) : null;
                })()}
                <div className="maintenance-card">
                  <div className="maintenance-row">
                    <span className="m-label">Servis Terakhir</span>
                    <span className="m-date">{selectedItem.lastServiced}</span>
                  </div>
                  <div className={`maintenance-row ${isServiceOverdue(selectedItem.nextService) ? 'overdue' : 'next'}`}>
                    <span className="m-label">Jadwal Berikutnya</span>
                    <span className="m-date">
                      {selectedItem.nextService}
                      {isServiceOverdue(selectedItem.nextService) && <span className="overdue-tag">TERLAMBAT</span>}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="section-title">Pemakaian di Booking</h4>
                {selectedItemUsage.length > 0 ? (
                  <div className="inventory-usage-list">
                    <div className="inventory-usage-summary">
                      <strong>{selectedItemUsage.length}</strong>
                      <span>booking terakhir &bull; {selectedItemUsage.reduce((sum, booking) => sum + Number(booking.duration || 0), 0)} jam pemakaian</span>
                    </div>
                    {selectedItemUsage.map((booking) => (
                      <div key={booking.id} className="inventory-usage-item">
                        <div>
                          <strong>{booking.band}</strong>
                          <span>{booking.date} &bull; {String(booking.hour).padStart(2, '0')}.00</span>
                        </div>
                        <small>{booking.duration} jam</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="detail-notes">Belum ada booking yang memakai alat ini.</p>
                )}
              </div>

              {selectedItem.notes && (
                <div className="detail-section">
                  <h4 className="section-title">Catatan</h4>
                  <p className="detail-notes">{selectedItem.notes}</p>
                </div>
              )}
            </div>

            <div className="detail-panel-footer">
              <button className="btn-edit-full" onClick={() => handleOpenEdit(selectedItem)}>
                <Edit2 size={14} /> Update Alat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? "Edit Alat" : "Tambah Alat Baru"}
      >
        <form className="inventory-form" onSubmit={handleFormSubmit(onSubmitForm)}>
          <div className="form-section">
            <div className="form-section-header">
              <Box size={16} />
              <span>Identitas Alat</span>
            </div>
            
            <div className="form-row form-row-2-1">
              <div className="form-group">
                <label>Nama Alat / Model <span className="required">*</span></label>
                <input 
                  type="text" 
                  placeholder='contoh: Zildjian A Custom Crash 16"'
                  className="form-input" 
                  autoFocus
                  {...register('name', { validate: validateWithZod('name') })}
                />
                {errors.name && <span className="form-error-message" style={{ color: 'var(--accent-pink)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.name.message}</span>}
              </div>
              <div className="form-group">
                <label>Jumlah Unit</label>
                <input 
                  type="number" 
                  min="1" 
                  className="form-input" 
                  {...register('qty', { valueAsNumber: true, validate: validateWithZod('qty') })}
                />
                {errors.qty && <span className="form-error-message" style={{ color: 'var(--accent-pink)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.qty.message}</span>}
              </div>
            </div>
 
            <div className="form-row">
              <div className="form-group">
                <label>Harga Sewa Tambahan / Sesi</label>
                <input 
                  type="number" 
                  min="0" 
                  step="5000" 
                  className="form-input" 
                  placeholder="0 (Gratis)" 
                  {...register('rentalPrice', { valueAsNumber: true, validate: validateWithZod('rentalPrice') })}
                />
                {errors.rentalPrice && <span className="form-error-message" style={{ color: 'var(--accent-pink)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.rentalPrice.message}</span>}
              </div>
            </div>
 
            <div className="form-row">
              <div className="form-group">
                <label>Kategori <span className="required">*</span></label>
                {!showNewCat ? (
                  <select className="form-input" {...register('category', { validate: validateWithZod('category') })}>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__new__">＋ Kategori Baru...</option>
                  </select>
                ) : (
                  <div className="new-category-input">
                    <input 
                      type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)}
                      placeholder="Nama kategori baru..." className="form-input" autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewCategory(); } }}
                      style={{ minWidth: 0 }}
                    />
                    <button type="button" className="btn-icon-sm confirm" onClick={handleAddNewCategory} title="Simpan" aria-label="Simpan kategori baru"><Plus size={16} /></button>
                    <button type="button" className="btn-icon-sm cancel" onClick={() => { setValue('category', categories[0] || ''); }} title="Batal" aria-label="Batal tambah kategori baru"><X size={16} /></button>
                  </div>
                )}
                {errors.category && <span className="form-error-message" style={{ color: 'var(--accent-pink)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.category.message}</span>}
              </div>
              <div className="form-group">
                <label>Merk / Brand</label>
                <input 
                  type="text" 
                  placeholder="Pearl, Shure, dll" 
                  className="form-input" 
                  {...register('brand')}
                />
              </div>
            </div>
          </div>
 
          <div className="form-section">
            <div className="form-section-header">
              <AlertCircle size={16} />
              <span>Kondisi Alat</span>
            </div>
            <div className="condition-selector" role="radiogroup" aria-label="Kondisi alat">
              {Object.entries(CONDITION_COLORS).map(([key, val]) => (
                <button
                  key={key} type="button"
                  className={`condition-option ${watchedCondition === key ? 'selected' : ''}`}
                  style={{ '--cond-color': val.color, '--cond-bg': val.bg }}
                  onClick={() => setValue('condition', key)}
                  role="radio"
                  aria-checked={watchedCondition === key}
                  aria-label={`Kondisi ${val.label}`}
                >
                  <span className="cond-dot" style={{ background: val.color }} />
                  {val.label}
                </button>
              ))}
            </div>
          </div>
 
          <div className="form-section">
            <div className="form-section-header">
              <Wrench size={16} />
              <span>Jadwal Maintenance</span>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Servis Terakhir</label>
                <input type="date" className="form-input" required {...register('lastServiced')} />
              </div>
              <div className="form-group">
                <label>Jadwal Servis Berikutnya</label>
                <input type="date" className="form-input" required {...register('nextService')} />
              </div>
            </div>
          </div>
 
          <div className="form-section">
            <div className="form-section-header">
              <StickyNote size={16} />
              <span>Catatan Tambahan</span>
            </div>
            <textarea 
              placeholder="Catat informasi kerusakan, penggantian onderdil, dll..." 
              className="form-input form-textarea" rows="3"
              {...register('notes')}
            />
          </div>
 
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Batal</button>
            <button type="submit" className="btn-primary">
              {editingItem ? 'Update Alat' : 'Simpan Alat'}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default InventoryPage;
