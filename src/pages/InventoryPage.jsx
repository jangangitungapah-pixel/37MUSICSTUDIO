import { useState, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, Box, Package, AlertCircle, Wrench, X, Tag, Hash, StickyNote } from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { useBookingStore } from '../store/useBookingStore';
import { useTourStore } from '../store/useTourStore';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import { getMaintenanceUsageInsights } from '../lib/smartInsights';
import { motion } from 'framer-motion';
import { pagePreset } from '../animations';
import './InventoryPage.css';

const CONDITION_COLORS = {
  'Excellent': { bg: 'rgba(76, 175, 80, 0.15)', color: '#4CAF50', label: 'Sangat Baik' },
  'Good': { bg: 'rgba(0, 240, 255, 0.15)', color: 'var(--accent-cyan)', label: 'Baik' },
  'Needs Repair': { bg: 'rgba(255, 193, 7, 0.15)', color: '#FFC107', label: 'Butuh Servis' },
  'Broken': { bg: 'rgba(255, 42, 95, 0.15)', color: 'var(--accent-pink)', label: 'Rusak' }
};

const InventoryPage = () => {
  const { inventory, categories, addCategory, addEquipment, updateEquipment, deleteEquipment, getStats } = useInventoryStore();
  const { bookings } = useBookingStore();
  const { run, currentStep, nextStep } = useTourStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '', category: '', brand: '', qty: 1, condition: 'Excellent',
    rentalPrice: 0, lastServiced: '', nextService: '', notes: ''
  });

  // Custom category input
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

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
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.brand.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [inventory, searchQuery, activeCategory]);

  const handleOpenNew = () => {
    setEditingItem(null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({ name: '', category: categories[0] || '', brand: '', qty: 1, condition: 'Excellent', rentalPrice: 0, lastServiced: today, nextService: '', notes: '' });
    setShowNewCat(false);
    setNewCatName('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowNewCat(false);
    setNewCatName('');
    setIsModalOpen(true);
    setSelectedItem(null);
  };

  const handleDelete = (id) => {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'category' && value === '__new__') {
      setShowNewCat(true);
      return;
    }
    setFormData(prev => ({ ...prev, [name]: (name === 'qty' || name === 'rentalPrice') ? parseInt(value) || 0 : value }));
  };

  const handleAddNewCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    addCategory(trimmed);
    setFormData(prev => ({ ...prev, category: trimmed }));
    setShowNewCat(false);
    setNewCatName('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      updateEquipment(editingItem.id, formData);
    } else {
      addEquipment(formData);
    }
    setIsModalOpen(false);
    if (run && currentStep === 8) {
      setTimeout(() => nextStep(), 300);
    }
  };

  const handleRowClick = (item) => {
    setSelectedItem(prev => prev && prev.id === item.id ? null : item);
  };

  const isServiceOverdue = (dateStr) => {
    return new Date(dateStr) <= new Date();
  };

  return (
    <motion.div className="app-page inventory-page" {...pagePreset}>
      <header className="app-page-header">
        <div>
          <h2 className="app-page-title">Inventory Studio</h2>
          <p className="app-page-subtitle">37 Music Studio — Kelola dan pantau kondisi alat-alat studio</p>
        </div>
        
        <div className="app-page-actions">

          <button className="btn-primary tour-inv-add-btn" onClick={() => {
            handleOpenNew();
            if (run && currentStep === 3) {
              setTimeout(() => nextStep(), 300);
            }
          }}>
            <Plus size={18} />
            <span>Alat Baru</span>
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="app-stat-grid tour-inv-stats">
        <div className="app-stat-card">
          <div className="stat-icon" style={{ background: 'rgba(0, 240, 255, 0.1)' }}>
            <Box size={20} color="var(--accent-cyan)" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{stats.total} <small>jenis</small></span>
            <span className="stat-label">Total Item</span>
          </div>
        </div>
        <div className="app-stat-card">
          <div className="stat-icon" style={{ background: 'rgba(156, 39, 176, 0.1)' }}>
            <Hash size={20} color="#CE93D8" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{stats.totalQty} <small>unit</small></span>
            <span className="stat-label">Total Unit</span>
          </div>
        </div>
        <div className="app-stat-card">
          <div className="stat-icon" style={{ background: 'rgba(76, 175, 80, 0.1)' }}>
            <Package size={20} color="#4CAF50" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{stats.excellent + stats.good}</span>
            <span className="stat-label">Kondisi Baik</span>
          </div>
        </div>
        <div className="app-stat-card">
          <div className="stat-icon" style={{ background: 'rgba(255, 193, 7, 0.1)' }}>
            <Wrench size={20} color="#FFC107" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{stats.needsRepair + stats.broken}</span>
            <span className="stat-label">Perlu Perhatian</span>
          </div>
        </div>
        <div className="app-stat-card">
          <div className="stat-icon" style={{ background: 'rgba(255, 42, 95, 0.1)' }}>
            <AlertCircle size={20} color="var(--accent-pink)" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{stats.serviceNeeded}</span>
            <span className="stat-label">Jadwal Servis Dekat</span>
          </div>
        </div>
      </div>

      {/* Smart Maintenance */}
      <div className="app-smart-panel">
        <div className="smart-head">
          <Wrench size={18} />
          <div>
            <h3>Maintenance Berbasis Pemakaian</h3>
            <p>{maintenanceInsights.studioHours30d} jam pemakaian studio dalam 30 hari terakhir.</p>
          </div>
        </div>
        <div className="smart-list" style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '12px'}}>
          {maintenanceInsights.recommendations.slice(0, 4).map(({ item, label, usageHours, reason }) => (
            <button
              key={item.id}
              className={`smart-item ${label.toLowerCase()}`}
              style={{flex: '1 1 calc(25% - 12px)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', minWidth: '200px', cursor: 'pointer', background: 'transparent', border: 'none', padding: 0}}
              onClick={() => handleRowClick(item)}
            >
              <div style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 16px', width: '100%', transition: 'all 0.2s', ...(label === 'Overhaul' ? {background: 'rgba(255, 42, 95, 0.05)', borderColor: 'rgba(255, 42, 95, 0.2)'} : label === 'Cek Rutin' ? {background: 'rgba(255, 193, 7, 0.05)', borderColor: 'rgba(255, 193, 7, 0.2)'} : {})}}>
                <strong style={{display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px'}}>{item.name}</strong>
                <span style={{display: 'block', fontSize: '0.75rem', color: label === 'Overhaul' ? 'var(--accent-pink)' : label === 'Cek Rutin' ? '#FFC107' : 'var(--text-secondary)', marginBottom: '4px'}}>{label} - {reason}</span>
                <small style={{display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)'}}>{usageHours} jam estimasi</small>
              </div>
            </button>
          ))}
          {maintenanceInsights.recommendations.length === 0 && (
            <span style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Belum ada data inventaris untuk dianalisis.</span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="inventory-content-area">
        <div className="inventory-container app-panel">
          {/* Category Tabs — dynamic from store */}
          <div className="app-table-toolbar">
            <div className="app-table-toolbar-left" style={{ flex: 1, overflowX: 'auto' }}>
              <div className="filter-tabs tour-inv-categories" style={{ margin: 0, borderBottom: 'none' }}>
                <button 
                  className={`filter-tab ${activeCategory === 'All' ? 'active' : ''}`} 
                  onClick={() => setActiveCategory('All')}
                >
                  Semua <span className="tab-count">{inventory.length}</span>
                </button>
                {categories.map(cat => {
                  const count = inventory.filter(i => i.category === cat).length;
                  return (
                    <button 
                      key={cat}
                      className={`filter-tab ${activeCategory === cat ? 'active' : ''}`} 
                      onClick={() => setActiveCategory(cat)}
                    >
                      {cat} <span className="tab-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="app-table-toolbar-right">
              <div className="app-search app-search-md tour-inv-search">
                <Search className="app-search-icon" />
                <input 
                  type="text" 
                  className="app-search-input"
                  placeholder="Cari nama alat, merk..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" className="app-search-clear" onClick={() => setSearchQuery('')} aria-label="Bersihkan pencarian" title="Bersihkan pencarian">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="app-table-wrapper hide-on-mobile">
            <table className="app-table inventory-table tour-inv-table">
              <thead>
                <tr>
                  <th>Nama Alat</th>
                  <th>Kategori & Merk</th>
                  <th>Qty</th>
                  <th>Harga Sewa</th>
                  <th>Servis Terakhir</th>
                  <th>Kondisi</th>
                  <th className="action-col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length > 0 ? (
                  filteredInventory.map(item => {
                    const isSelected = selectedItem && selectedItem.id === item.id;
                    const condition = CONDITION_COLORS[item.condition] || CONDITION_COLORS['Good'];
                    const overdue = isServiceOverdue(item.nextService);
                    return (
                      <tr key={item.id} className={`${isSelected ? 'row-selected' : ''} ${overdue ? 'row-overdue' : ''}`} onClick={() => handleRowClick(item)}>
                        <td>
                          <div className="item-name-cell">
                            <div className={`item-condition-dot ${item.condition.toLowerCase().replace(' ', '-')}`} />
                            <div className="item-info">
                              <span className="item-name">{item.name}</span>
                              {item.notes && <span className="item-note">{item.notes}</span>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="category-info">
                            <span className="category-badge">{item.category}</span>
                            <span className="brand-text">{item.brand}</span>
                          </div>
                        </td>
                        <td>
                          <span className="qty-badge">{item.qty || 1}</span>
                        </td>
                        <td>
                          <span className="revenue-text">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.rentalPrice || 0)}/sesi</span>
                        </td>
                        <td>
                          <span className="date-text">{item.lastServiced}</span>
                        </td>
                        <td>
                          <span className="condition-badge" style={{ background: condition.bg, color: condition.color }}>
                            {condition.label}
                          </span>
                        </td>
                        <td className="action-col" onClick={e => e.stopPropagation()}>
                          <div className="row-actions">
                            <button className="icon-btn" onClick={() => handleOpenEdit(item)} title="Edit">
                              <Edit2 size={15} />
                            </button>
                            <button className="icon-btn delete" onClick={() => handleDelete(item.id)} title="Hapus">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      Tidak ada data inventaris ditemukan.
                    </td>
                  </tr>
                )}
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
                        <button className="icon-btn" onClick={() => handleOpenEdit(item)} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button className="icon-btn delete" onClick={() => handleDelete(item.id)} title="Hapus">
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
              <button className="icon-btn detail-panel-close" onClick={() => setSelectedItem(null)}><X size={16} /></button>
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
        <form className="inventory-form" onSubmit={handleSubmit}>
          {/* Section 1: Identitas Alat */}
          <div className="form-section tour-inv-input-identity">
            <div className="form-section-header">
              <Box size={16} />
              <span>Identitas Alat</span>
            </div>
            
            <div className="form-row form-row-2-1">
              <div className="form-group">
                <label>Nama Alat / Model <span className="required">*</span></label>
                <input 
                  type="text" name="name" value={formData.name} onChange={handleChange} 
                  placeholder='contoh: Zildjian A Custom Crash 16"'
                  required className="form-input" autoFocus
                />
              </div>
              <div className="form-group">
                <label>Jumlah Unit</label>
                <input type="number" name="qty" value={formData.qty} onChange={handleChange} min="1" className="form-input" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Harga Sewa Tambahan / Sesi</label>
                <input type="number" name="rentalPrice" value={formData.rentalPrice} onChange={handleChange} min="0" step="5000" className="form-input" placeholder="0 (Gratis)" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Kategori <span className="required">*</span></label>
                {!showNewCat ? (
                  <select name="category" value={formData.category} onChange={handleChange} className="form-input" required>
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
                    <button type="button" className="btn-icon-sm confirm" onClick={handleAddNewCategory} title="Simpan"><Plus size={16} /></button>
                    <button type="button" className="btn-icon-sm cancel" onClick={() => { setShowNewCat(false); setFormData(prev => ({ ...prev, category: categories[0] || '' })); }} title="Batal"><X size={16} /></button>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Merk / Brand</label>
                <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="Pearl, Shure, dll" className="form-input" />
              </div>
            </div>
          </div>

          {/* Section 2: Kondisi */}
          <div className="form-section tour-inv-input-condition">
            <div className="form-section-header">
              <AlertCircle size={16} />
              <span>Kondisi Alat</span>
            </div>
            <div className="condition-selector">
              {Object.entries(CONDITION_COLORS).map(([key, val]) => (
                <button
                  key={key} type="button"
                  className={`condition-option ${formData.condition === key ? 'selected' : ''}`}
                  style={{ '--cond-color': val.color, '--cond-bg': val.bg }}
                  onClick={() => setFormData(prev => ({ ...prev, condition: key }))}
                >
                  <span className="cond-dot" style={{ background: val.color }} />
                  {val.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Maintenance */}
          <div className="form-section tour-inv-input-maintenance">
            <div className="form-section-header">
              <Wrench size={16} />
              <span>Jadwal Maintenance</span>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Servis Terakhir</label>
                <input type="date" name="lastServiced" value={formData.lastServiced} onChange={handleChange} className="form-input" required />
              </div>
              <div className="form-group">
                <label>Jadwal Servis Berikutnya</label>
                <input type="date" name="nextService" value={formData.nextService} onChange={handleChange} className="form-input" required />
              </div>
            </div>
          </div>

          {/* Section 4: Catatan */}
          <div className="form-section tour-inv-input-notes">
            <div className="form-section-header">
              <StickyNote size={16} />
              <span>Catatan Tambahan</span>
            </div>
            <textarea 
              name="notes" value={formData.notes} onChange={handleChange} 
              placeholder="Catat informasi kerusakan, penggantian onderdil, dll..." 
              className="form-input form-textarea" rows="3"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Batal</button>
            <button type="submit" className="btn-primary tour-inv-btn-save">
              {editingItem ? 'Update Alat' : 'Simpan Alat'}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default InventoryPage;
