import { useState, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, Mail, Phone, Calendar as CalendarIcon, Users, UserCheck, DollarSign, X, AtSign, MapPin, Clock, Star, StickyNote, MessageCircle, Gift, Award } from 'lucide-react';
import { useCustomerStore } from '../store/useCustomerStore';
import { useTourStore } from '../store/useTourStore';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import { getMembershipTier, TIER_CONFIG, getLoyaltyPoints, sendWelcomeMessage, sendPromoMessage, sendMembershipUpgrade } from '../lib/whatsappService';
import './CustomersPage.css';

const AVATAR_COLORS = [
  { bg: 'rgba(0, 240, 255, 0.12)', color: '#00f0ff' },
  { bg: 'rgba(255, 42, 95, 0.12)', color: '#ff2a5f' },
  { bg: 'rgba(255, 193, 7, 0.12)', color: '#FFC107' },
  { bg: 'rgba(76, 175, 80, 0.12)', color: '#4CAF50' },
  { bg: 'rgba(156, 39, 176, 0.12)', color: '#9C27B0' },
  { bg: 'rgba(255, 152, 0, 0.12)', color: '#FF9800' },
];

const getAvatarColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const formatCurrency = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

const CustomersPage = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, getStats } = useCustomerStore();
  const { run, currentStep, nextStep } = useTourStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'Active', 'Inactive'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    instagram: '',
    address: '',
    status: 'Active',
    notes: ''
  });

  const stats = getStats();

  const filteredCustomers = useMemo(() => {
    let result = customers;
    
    // Filter by status tab
    if (activeFilter !== 'all') {
      result = result.filter(c => c.status === activeFilter);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.phone.includes(q) || 
        c.email.toLowerCase().includes(q) ||
        (c.instagram && c.instagram.toLowerCase().includes(q))
      );
    }
    
    return result;
  }, [customers, searchQuery, activeFilter]);

  const handleOpenNew = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', email: '', instagram: '', address: '', status: 'Active', notes: '' });
    setIsModalOpen(true);
  };

  const handleToggleVIP = (customer) => {
    updateCustomer(customer.id, { ...customer, isVIP: !customer.isVIP });
  };

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({ ...customer });
    setIsModalOpen(true);
    setSelectedCustomer(null);
  };

  const handleDelete = (id) => {
    const customer = customers.find(c => c.id === id);
    toast.warning('Hapus pelanggan?', {
      description: customer?.name || 'Data pelanggan ini akan dihapus permanen.',
      action: {
        label: 'Hapus',
        onClick: () => {
          deleteCustomer(id);
          if (selectedCustomer && selectedCustomer.id === id) setSelectedCustomer(null);
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData);
    } else {
      addCustomer(formData);
    }
    setIsModalOpen(false);
    // Advance tour if we're on the save step
    if (run && currentStep === 9) {
      setTimeout(() => nextStep(), 300);
    }
  };

  const handleRowClick = (customer) => {
    setSelectedCustomer(prev => prev && prev.id === customer.id ? null : customer);
  };

  return (
    <div className="customers-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Database Pelanggan</h2>
          <p className="page-subtitle">37 Music Studio — Kelola daftar band dan penyewa</p>
        </div>
        
        <div className="header-actions">
          <div className="search-bar glass-panel tour-cust-search">
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Cari nama, HP, email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}><X size={14} /></button>
            )}
          </div>
          <button className="btn-primary tour-cust-add-btn" onClick={() => {
            handleOpenNew();
            if (run && currentStep === 3) {
              setTimeout(() => nextStep(), 300);
            }
          }}>
            <Plus size={18} />
            <span>Pelanggan Baru</span>
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="stats-bar tour-cust-stats">
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(0, 240, 255, 0.1)' }}>
            <Users size={20} color="var(--accent-cyan)" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Pelanggan</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(76, 175, 80, 0.1)' }}>
            <UserCheck size={20} color="#4CAF50" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{stats.active}</span>
            <span className="stat-label">Aktif</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(255, 42, 95, 0.1)' }}>
            <Star size={20} color="var(--accent-pink)" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{stats.totalBookingsAll} <small>kali</small></span>
            <span className="stat-label">Total Booking</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(156, 39, 176, 0.1)' }}>
            <Clock size={20} color="#9C27B0" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{stats.totalHoursAll} <small>jam</small></span>
            <span className="stat-label">Total Jam</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(255, 193, 7, 0.1)' }}>
            <DollarSign size={20} color="#FFC107" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{formatCurrency(stats.totalRevenueAll)}</span>
            <span className="stat-label">Total Pemasukan</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="customers-content-area">
        {/* Main Table */}
        <div className="customers-container glass-panel">
          {/* Filter Tabs */}
          <div className="filter-tabs tour-cust-filters">
            <button className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>
              Semua <span className="tab-count">{customers.length}</span>
            </button>
            <button className={`filter-tab ${activeFilter === 'Active' ? 'active' : ''}`} onClick={() => setActiveFilter('Active')}>
              Aktif <span className="tab-count">{stats.active}</span>
            </button>
            <button className={`filter-tab ${activeFilter === 'Inactive' ? 'active' : ''}`} onClick={() => setActiveFilter('Inactive')}>
              Tidak Aktif <span className="tab-count">{stats.inactive}</span>
            </button>
          </div>

          <div className="table-responsive hide-on-mobile">
            <table className="customers-table tour-cust-table">
              <thead>
                <tr>
                  <th>Nama Band / Pelanggan</th>
                  <th>Kontak</th>
                  <th>Bergabung</th>
                  <th>Booking</th>
                  <th>Jam</th>
                  <th>Revenue</th>
                  <th>Tier</th>
                  <th>Status</th>
                  <th className="action-col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map(customer => {
                    const avatarColor = getAvatarColor(customer.name);
                    const isSelected = selectedCustomer && selectedCustomer.id === customer.id;
                    return (
                      <tr key={customer.id} className={isSelected ? 'row-selected' : ''} onClick={() => handleRowClick(customer)}>
                        <td>
                          <div className="customer-name-cell">
                            <div className="customer-avatar" style={{ background: avatarColor.bg, color: avatarColor.color }}>
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="customer-info">
                              <span className="customer-name" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {customer.name}
                                {customer.isVIP && <Star size={12} color="#FFC107" fill="#FFC107" title="VIP Member" />}
                              </span>
                              {customer.notes && <span className="customer-note">{customer.notes}</span>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="contact-info">
                            <span className="contact-item"><Phone size={13} /> {customer.phone || '-'}</span>
                            {customer.email && <span className="contact-item"><Mail size={13} /> {customer.email}</span>}
                          </div>
                        </td>
                        <td>
                          <span className="date-text">{customer.joinDate}</span>
                        </td>
                        <td>
                          <span className="booking-badge">{customer.totalBookings}×</span>
                        </td>
                        <td>
                          <span className="hours-badge">{customer.totalHours || 0} jam</span>
                        </td>
                        <td>
                          <span className="revenue-text">{formatCurrency(customer.totalSpent)}</span>
                        </td>
                        <td>
                          {(() => {
                            const tier = getMembershipTier(customer.totalBookings, customer.totalSpent);
                            const cfg = TIER_CONFIG[tier];
                            return (
                              <span className="tier-badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}44` }}>
                                {cfg.icon} {tier}
                              </span>
                            );
                          })()}
                        </td>
                        <td>
                          <span className={`status-badge ${customer.status.toLowerCase()}`}>
                            {customer.status === 'Active' ? 'Aktif' : 'Tidak Aktif'}
                          </span>
                        </td>
                        <td className="action-col" onClick={e => e.stopPropagation()}>
                          <div className="row-actions">
                            <button className="icon-btn" onClick={() => handleToggleVIP(customer)} title={customer.isVIP ? "Hapus VIP" : "Jadikan VIP"}>
                              <Star size={15} color={customer.isVIP ? "#FFC107" : "currentColor"} fill={customer.isVIP ? "#FFC107" : "none"} />
                            </button>
                            <button className="icon-btn" onClick={() => handleOpenEdit(customer)} title="Edit">
                              <Edit2 size={15} />
                            </button>
                            <button className="icon-btn delete" onClick={() => handleDelete(customer.id)} title="Hapus">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="empty-state">
                      Tidak ada data pelanggan ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="mobile-customer-list show-on-mobile">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(customer => {
                const avatarColor = getAvatarColor(customer.name);
                return (
                  <div 
                    key={customer.id} 
                    className="mobile-customer-card" 
                    onClick={() => handleRowClick(customer)}
                  >
                    <div className="mobile-card-left">
                      <div className="customer-avatar" style={{ background: avatarColor.bg, color: avatarColor.color }}>
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="mobile-card-info">
                        <span className="customer-name">{customer.name}</span>
                        <span className="mobile-card-phone"><Phone size={11} /> {customer.phone || '-'}</span>
                        <div className="mobile-card-meta">
                          <span className="mobile-meta-tag bookings">{customer.totalBookings}× booking</span>
                          <span className="mobile-meta-tag hours">{customer.totalHours || 0}h</span>
                        </div>
                      </div>
                    </div>
                    <div className="mobile-card-right">
                      <span className={`status-dot ${customer.status.toLowerCase()}`}></span>
                      <div className="mobile-card-actions" onClick={e => e.stopPropagation()}>
                        <button className="icon-btn" onClick={() => handleOpenEdit(customer)} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button className="icon-btn delete" onClick={() => handleDelete(customer.id)} title="Hapus">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state" style={{padding: '32px', textAlign: 'center', color: 'var(--text-muted)'}}>
                Tidak ada data pelanggan ditemukan.
              </div>
            )}
          </div>
        </div>

        {/* Detail Sidebar */}
        {selectedCustomer && (
          <div className="customer-detail-panel glass-panel tour-cust-detail">
            <div className="detail-panel-header">
              <div className="detail-avatar" style={{ background: getAvatarColor(selectedCustomer.name).bg, color: getAvatarColor(selectedCustomer.name).color }}>
                {selectedCustomer.name.charAt(0).toUpperCase()}
              </div>
              <h3>{selectedCustomer.name}</h3>
              <span className={`status-badge ${selectedCustomer.status.toLowerCase()}`}>
                {selectedCustomer.status === 'Active' ? 'Aktif' : 'Tidak Aktif'}
              </span>
              <button className="icon-btn detail-panel-close" onClick={() => setSelectedCustomer(null)}><X size={16} /></button>
            </div>

            <div className="detail-panel-body">
              <div className="detail-section">
                <h4 className="section-title">Kontak</h4>
                <div className="detail-item"><Phone size={14} /> <span>{selectedCustomer.phone}</span></div>
                {selectedCustomer.email && <div className="detail-item"><Mail size={14} /> <span>{selectedCustomer.email}</span></div>}
                {selectedCustomer.instagram && <div className="detail-item"><AtSign size={14} /> <span>{selectedCustomer.instagram}</span></div>}
                {selectedCustomer.address && <div className="detail-item"><MapPin size={14} /> <span>{selectedCustomer.address}</span></div>}
              </div>

              {/* Membership Tier */}
              {(() => {
                const tier = getMembershipTier(selectedCustomer.totalBookings, selectedCustomer.totalSpent);
                const cfg = TIER_CONFIG[tier];
                const points = getLoyaltyPoints(selectedCustomer.totalSpent);
                return (
                  <div className="detail-section">
                    <h4 className="section-title">Membership & Poin</h4>
                    <div className="membership-tier-card" style={{ background: cfg.bg, border: `1px solid ${cfg.color}44` }}>
                      <div className="tier-info">
                        <span className="tier-icon">{cfg.icon}</span>
                        <div>
                          <div className="tier-name" style={{ color: cfg.color }}>{tier} Member</div>
                          {cfg.next && (
                            <div className="tier-next">Naik ke {cfg.next} di {cfg.nextAt}</div>
                          )}
                        </div>
                      </div>
                      <div className="tier-points">
                        <span className="points-value">{points.toLocaleString('id-ID')}</span>
                        <span className="points-label">poin</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="detail-section">
                <h4 className="section-title">Statistik</h4>
                <div className="stat-grid stat-grid-3">
                  <div className="mini-stat">
                    <span className="mini-stat-value">{selectedCustomer.totalBookings}</span>
                    <span className="mini-stat-label">Total Booking</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-stat-value">{selectedCustomer.totalHours || 0}</span>
                    <span className="mini-stat-label">Total Jam</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-stat-value">{formatCurrency(selectedCustomer.totalSpent)}</span>
                    <span className="mini-stat-label">Total Bayar</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="section-title">Tanggal</h4>
                <div className="detail-item"><CalendarIcon size={14} /> <span>Bergabung: {selectedCustomer.joinDate}</span></div>
                <div className="detail-item"><Clock size={14} /> <span>Booking Terakhir: {selectedCustomer.lastBooking || '-'}</span></div>
              </div>

              {selectedCustomer.notes && (
                <div className="detail-section">
                  <h4 className="section-title">Catatan</h4>
                  <p className="detail-notes">{selectedCustomer.notes}</p>
                </div>
              )}
            </div>

            <div className="detail-panel-footer">
              {/* WA CRM Buttons */}
              <div className="wa-crm-buttons">
                <button
                  className="wa-btn welcome"
                  onClick={() => sendWelcomeMessage(selectedCustomer)}
                  title="Kirim pesan sapaan"
                >
                  <MessageCircle size={14} /> Sapaan
                </button>
                <button
                  className="wa-btn promo"
                  onClick={() => sendPromoMessage(selectedCustomer, { title: 'Promo Spesial!', description: 'Diskon booking untuk pelanggan setia kami.' })}
                  title="Kirim promo"
                >
                  <Gift size={14} /> Promo
                </button>
                <button
                  className="wa-btn tier"
                  onClick={() => sendMembershipUpgrade(selectedCustomer, getMembershipTier(selectedCustomer.totalBookings, selectedCustomer.totalSpent))}
                  title="Ingatkan membership tier"
                >
                  <Award size={14} /> Tier
                </button>
              </div>
              <button className="btn-edit-full" onClick={() => handleOpenEdit(selectedCustomer)}>
                <Edit2 size={14} /> Edit Pelanggan
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingCustomer ? "Edit Pelanggan" : "Pelanggan Baru"}
      >
        <form className="customer-form" onSubmit={handleSubmit}>

          {/* Avatar Preview + Name */}
          <div className="cf-identity-section">
            <div className="cf-avatar-preview" style={{
              background: formData.name ? getAvatarColor(formData.name).bg : 'rgba(255,255,255,0.06)',
              color: formData.name ? getAvatarColor(formData.name).color : 'var(--text-muted)',
              border: formData.name ? `1.5px solid ${getAvatarColor(formData.name).color}30` : '1.5px solid rgba(255,255,255,0.08)'
            }}>
              {formData.name ? formData.name.charAt(0).toUpperCase() : <Users size={22} opacity={0.4} />}
            </div>
            <div className="cf-name-field">
              <label className="cf-label">Nama Band / Pelanggan <span className="cf-required">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="contoh: The Rockers"
                required
                className="cf-input tour-cust-input-name"
                autoFocus
              />
            </div>
          </div>

          {/* Section: Kontak */}
          <div className="cf-section">
            <div className="cf-section-title"><Phone size={12} /> Kontak</div>
            <div className="cf-row">
              <div className="cf-field">
                <label className="cf-label">No. HP / WhatsApp <span className="cf-required">*</span></label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="08xxxxxxxxxx" required className="cf-input tour-cust-input-contact" />
              </div>
              <div className="cf-field">
                <label className="cf-label"><Mail size={11} /> Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" className="cf-input" />
              </div>
            </div>
            <div className="cf-row">
              <div className="cf-field">
                <label className="cf-label"><AtSign size={11} /> Instagram</label>
                <div className="cf-prefix-input">
                  <span className="cf-prefix">@</span>
                  <input type="text" name="instagram" value={formData.instagram.replace('@','')} onChange={(e) => handleChange({ target: { name: 'instagram', value: '@' + e.target.value.replace('@','') }})} placeholder="username" className="cf-input cf-input-prefixed tour-cust-input-social" />
                </div>
              </div>
              <div className="cf-field">
                <label className="cf-label"><MapPin size={11} /> Alamat</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Jl. Contoh No. 123" className="cf-input tour-cust-input-address" />
              </div>
            </div>
          </div>

          {/* Section: Status & VIP */}
          <div className="cf-section">
            <div className="cf-section-title"><Star size={12} /> Status Keanggotaan</div>
            <div className="cf-status-row">
              <div className="cf-status-cards">
                {[
                  { value: 'Active', label: 'Aktif', color: '#4CAF50' },
                  { value: 'Inactive', label: 'Tidak Aktif', color: '#6b6b76' },
                ].map(opt => (
                  <label key={opt.value} className={`cf-status-card ${formData.status === opt.value ? 'selected' : ''}`} style={{ '--cs-color': opt.color }}>
                    <input type="radio" name="status" value={opt.value} checked={formData.status === opt.value} onChange={handleChange} className="cf-radio" />
                    <span className="cf-status-dot" style={{ background: opt.color }} />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
              <label className="cf-vip-toggle">
                <span className="cf-vip-label"><Star size={13} color="#FFC107" fill="#FFC107" /> VIP Member <span className="cf-vip-sub">Diskon 10%</span></span>
                <div className={`cf-toggle-switch ${formData.isVIP ? 'on' : ''}`} onClick={() => setFormData(p => ({ ...p, isVIP: !p.isVIP }))}>
                  <div className="cf-toggle-thumb" />
                </div>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="cf-section">
            <div className="cf-field">
              <label className="cf-label"><StickyNote size={11} /> Catatan (opsional)</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Preferensi alat, kebiasaan, dll..." className="cf-input cf-textarea tour-cust-input-notes" rows="2" />
            </div>
          </div>

          <div className="cf-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Batal</button>
            <button type="submit" className="btn-primary tour-cust-btn-save">
              {editingCustomer ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomersPage;

