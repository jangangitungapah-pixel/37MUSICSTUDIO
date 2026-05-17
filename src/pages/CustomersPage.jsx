import React, { useState, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, Mail, Phone, Calendar as CalendarIcon, Users, UserCheck, UserX, DollarSign, X, AtSign, MapPin, Clock, Star } from 'lucide-react';
import { useCustomerStore } from '../store/useCustomerStore';
import { useTourStore } from '../store/useTourStore';
import Modal from '../components/Modal';
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
    if (window.confirm('Yakin ingin menghapus pelanggan ini?')) {
      deleteCustomer(id);
      if (selectedCustomer && selectedCustomer.id === id) setSelectedCustomer(null);
    }
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
          <div className="form-group tour-cust-input-name">
            <label>Nama Band / Pelanggan <span className="required">*</span></label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="contoh: The Rockers"
              required 
              className="form-input"
              autoFocus
            />
          </div>

          <div className="form-row tour-cust-input-contact">
            <div className="form-group">
              <label>No. HP / WhatsApp <span className="required">*</span></label>
              <input 
                type="tel" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                placeholder="08xxxxxxxxxx"
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="email@example.com"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row tour-cust-input-social">
            <div className="form-group">
              <label>Instagram</label>
              <input 
                type="text" 
                name="instagram" 
                value={formData.instagram} 
                onChange={handleChange} 
                placeholder="@username"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="form-input">
                <option value="Active">Aktif</option>
                <option value="Inactive">Tidak Aktif</option>
              </select>
            </div>
          </div>

          <div className="form-group tour-cust-input-address">
            <label>Alamat</label>
            <input 
              type="text" 
              name="address" 
              value={formData.address} 
              onChange={handleChange} 
              placeholder="Jl. Contoh No. 123, Kota"
              className="form-input"
            />
          </div>

          <div className="form-group tour-cust-input-notes">
            <label>Catatan</label>
            <textarea 
              name="notes" 
              value={formData.notes} 
              onChange={handleChange} 
              placeholder="Preferensi alat, kebiasaan, dll..." 
              className="form-input form-textarea"
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Batal</button>
            <button type="submit" className="btn-primary tour-cust-btn-save">Simpan</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomersPage;
