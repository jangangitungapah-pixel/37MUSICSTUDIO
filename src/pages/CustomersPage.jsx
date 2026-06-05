import { useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Search, Plus, Edit2, Trash2, Mail, Phone, Calendar as CalendarIcon, Users, UserCheck, DollarSign, X, AtSign, MapPin, Clock, Star, StickyNote, MessageCircle, Gift, Award, ChevronDown } from 'lucide-react';
import { useCustomerStore } from '../store/useCustomerStore';
import { useBookingStore } from '../store/useBookingStore';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import { getMembershipTier, TIER_CONFIG, getLoyaltyPoints, sendWelcomeMessage, sendPromoMessage, sendMembershipUpgrade } from '../lib/whatsappService';
import { getCustomerRetentionInsights } from '../lib/smartInsights';
import { motion } from 'framer-motion';
import { pagePreset } from '../animations';
import confetti from 'canvas-confetti';
import Fuse from 'fuse.js';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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

const customerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  phone: z.string()
    .min(10, 'Nomor HP minimal 10 digit')
    .max(15, 'Nomor HP maksimal 15 digit')
    .regex(/^[0-9]+$/, 'Nomor HP harus berupa angka'),
  email: z.string().email('Format email tidak valid').or(z.literal('')),
  instagram: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['Active', 'Inactive']),
  isVIP: z.boolean().optional(),
  notes: z.string().optional()
});

const validateWithZod = (fieldName) => (value) => {
  const fieldSchema = customerSchema.shape[fieldName];
  if (!fieldSchema) return true;
  const result = fieldSchema.safeParse(value);
  return result.success ? true : result.error.errors[0].message;
};

const CustomersPage = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, getStats } = useCustomerStore(
    useShallow(state => ({
      customers: state.customers,
      addCustomer: state.addCustomer,
      updateCustomer: state.updateCustomer,
      deleteCustomer: state.deleteCustomer,
      getStats: state.getStats
    }))
  );
  const bookings = useBookingStore(state => state.bookings);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'Active', 'Inactive'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const selectedCustomerBookings = useMemo(() => {
    if (!selectedCustomer) return [];
    return bookings
      .filter((booking) => booking.band?.toLowerCase() === selectedCustomer.name.toLowerCase() && booking.status !== 'maintenance')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);
  }, [bookings, selectedCustomer]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const { register, handleSubmit: handleFormSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      instagram: '',
      address: '',
      status: 'Active',
      isVIP: false,
      notes: ''
    }
  });

  const watchedName = watch('name');
  const watchedStatus = watch('status');
  const watchedIsVIP = watch('isVIP');

  const retentionInsights = useMemo(() => getCustomerRetentionInsights(customers), [customers]);
  const passiveCustomers = retentionInsights.passiveCustomers;

  const stats = getStats();

  const filteredCustomers = useMemo(() => {
    let result = customers;
    
    // Filter by status tab
    if (activeFilter === 'Passive') {
      result = passiveCustomers;
    } else if (activeFilter !== 'all') {
      result = result.filter(c => c.status === activeFilter);
    }
    
    // Filter by search query with Fuse.js for fuzzy matching
    if (searchQuery.trim()) {
      const fuse = new Fuse(result, {
        keys: ['name', 'phone', 'email', 'instagram'],
        threshold: 0.35,
        ignoreLocation: true
      });
      result = fuse.search(searchQuery).map(r => r.item);
    }
    
    return result;
  }, [customers, passiveCustomers, searchQuery, activeFilter]);

  const handleOpenNew = () => {
    setEditingCustomer(null);
    reset({ name: '', phone: '', email: '', instagram: '', address: '', status: 'Active', isVIP: false, notes: '' });
    setIsModalOpen(true);
  };

  const handleToggleVIP = (customer) => {
    const nextVIP = !customer.isVIP;
    updateCustomer(customer.id, { ...customer, isVIP: nextVIP });
    if (nextVIP) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#ff2a5f', '#FFC107', '#4CAF50']
      });
      toast.success(`${customer.name} sekarang menjadi VIP Member! 🌟`);
    } else {
      toast.info(`Status VIP ${customer.name} dihapus.`);
    }
  };

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    reset({ 
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      instagram: customer.instagram || '',
      address: customer.address || '',
      status: customer.status || 'Active',
      isVIP: customer.isVIP || false,
      notes: customer.notes || ''
    });
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

  const onSubmitForm = (data) => {
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, { ...editingCustomer, ...data });
      if (data.isVIP && !editingCustomer.isVIP) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00f0ff', '#ff2a5f', '#FFC107', '#4CAF50']
        });
      }
      toast.success('Data pelanggan berhasil diperbarui!');
    } else {
      addCustomer({
        ...data,
        joinDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        totalBookings: 0,
        totalHours: 0,
        totalSpent: 0
      });
      if (data.isVIP) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00f0ff', '#ff2a5f', '#FFC107', '#4CAF50']
        });
      }
      toast.success('Pelanggan baru berhasil ditambahkan!');
    }
    setIsModalOpen(false);
  };

  const handleRowClick = (customer) => {
    setSelectedCustomer(prev => prev && prev.id === customer.id ? null : customer);
  };

  const getFilterLabel = (filter) => {
    switch(filter) {
      case 'Active': return `Aktif (${stats.active})`;
      case 'Inactive': return `Tidak Aktif (${stats.inactive})`;
      case 'Passive': return `Pasif (>30 Hari) (${passiveCustomers.length})`;
      default: return `Semua Pelanggan (${customers.length})`;
    }
  };

  return (
    <motion.div className="app-page customers-page" {...pagePreset}>
      <header className="app-page-header">
        <div>
          <h2 className="app-page-title">Database Pelanggan</h2>
          <p className="app-page-subtitle">37 Music Studio — Kelola daftar band dan penyewa</p>
        </div>
        
        <div className="app-page-actions">

          <button className="btn-primary" onClick={handleOpenNew}>
            <Plus size={18} />
            <span>Pelanggan Baru</span>
          </button>
        </div>
      </header>

      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-icon stat-icon-total">
            <Users size={20} color="var(--accent-cyan)" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Pelanggan</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-active">
            <UserCheck size={20} color="#4CAF50" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{stats.active}</span>
            <span className="stat-label">Aktif</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-bookings">
            <Star size={20} color="var(--accent-pink)" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{stats.totalBookingsAll} <small>kali</small></span>
            <span className="stat-label">Total Booking</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-hours">
            <Clock size={20} color="#9C27B0" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{stats.totalHoursAll} <small>jam</small></span>
            <span className="stat-label">Total Jam</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-revenue">
            <DollarSign size={20} color="#FFC107" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{formatCurrency(stats.totalRevenueAll)}</span>
            <span className="stat-label">Total Pemasukan</span>
          </div>
        </div>
      </div>

      {/* Smart Retention */}
      <div className="app-smart-panel">
        <div className="smart-head">
          <Users size={20} />
          <div>
            <h3>Smart Retention</h3>
            <p>Sistem analitik cerdas pelanggan</p>
          </div>
        </div>
        <div className="smart-list smart-retention-grid cols-3">
          <div className="smart-retention-item">
            <div className="smart-retention-badge">
              <Clock size={14} /> Perlu Retensi
            </div>
            <strong className="smart-retention-value">{passiveCustomers.length} pelanggan</strong>
            <small className="smart-retention-label">{passiveCustomers[0] ? `${passiveCustomers[0].name} sudah ${passiveCustomers[0].daysSinceLastBooking} hari tidak booking.` : 'Belum ada pelanggan pasif.'}</small>
          </div>
          <div className="smart-retention-item">
            <div className="smart-retention-badge">
              <Star size={14} /> Kandidat VIP
            </div>
            <strong className="smart-retention-value">{retentionInsights.vipCandidates.length} pelanggan</strong>
            <small className="smart-retention-label">{retentionInsights.vipCandidates[0] ? `${retentionInsights.vipCandidates[0].name} cocok diberi benefit VIP.` : 'Semua kandidat sudah tertangani.'}</small>
          </div>
          <div className="smart-retention-item">
            <div className="smart-retention-badge">
              <Gift size={14} /> Target Promo
            </div>
            <strong className="smart-retention-value">{retentionInsights.promoTargets.length} kontak</strong>
            <small className="smart-retention-label">{retentionInsights.promoTargets.length ? 'Siap dikirimi promo personal via WhatsApp.' : 'Tidak ada kontak promo yang siap.'}</small>
          </div>
        </div>
      </div>

      {/* Retention Alert Banner */}
      {passiveCustomers.length > 0 && activeFilter !== 'Passive' && (
        <div className="retention-alert-banner">
          <div className="retention-banner-info">
            <div className="retention-banner-icon">
              <Users size={20} />
            </div>
            <div>
              <h4>Sistem Retensi Cerdas</h4>
              <p>Mendeteksi <strong>{passiveCustomers.length} pelanggan pasif</strong> (tidak booking &gt; 30 hari). Pertimbangkan untuk mengirim promo via WhatsApp.</p>
            </div>
          </div>
          <button className="btn-primary retention-banner-btn" onClick={() => setActiveFilter('Passive')}>
            Tampilkan Daftar
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="customers-content-area">
        {/* Main Table */}
        <div className="customers-container app-panel">
          <div className="app-table-toolbar">
            <div className="app-table-toolbar-left">
              <div>
                <span className="app-table-toolbar-title">Daftar Pelanggan</span>
                <span className="app-table-toolbar-subtitle">{filteredCustomers.length} pelanggan ditemukan</span>
              </div>
            </div>
            <div className="app-table-toolbar-right">
              <div className="filter-dropdown-container">
                <button 
                  type="button"
                  className="filter-dropdown-toggle"
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  aria-haspopup="listbox"
                  aria-expanded={isFilterDropdownOpen}
                  aria-label="Filter status pelanggan"
                >
                  <Users size={16} className="filter-dropdown-icon" />
                  <span className="filter-dropdown-label">{getFilterLabel(activeFilter)}</span>
                  <ChevronDown size={16} className={`filter-dropdown-arrow ${isFilterDropdownOpen ? 'open' : ''}`} />
                </button>
                
                {isFilterDropdownOpen && (
                  <>
                    <div className="filter-dropdown-overlay" onClick={() => setIsFilterDropdownOpen(false)} />
                    <div className="filter-dropdown-menu" role="listbox">
                      <button 
                        type="button" 
                        className={`filter-dropdown-item ${activeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => { setActiveFilter('all'); setIsFilterDropdownOpen(false); }}
                        role="option"
                        aria-selected={activeFilter === 'all'}
                      >
                        <span>Semua</span>
                        <span className="tab-count">{customers.length}</span>
                      </button>
                      <button 
                        type="button" 
                        className={`filter-dropdown-item ${activeFilter === 'Active' ? 'active' : ''}`}
                        onClick={() => { setActiveFilter('Active'); setIsFilterDropdownOpen(false); }}
                        role="option"
                        aria-selected={activeFilter === 'Active'}
                      >
                        <span>Aktif</span>
                        <span className="tab-count">{stats.active}</span>
                      </button>
                      <button 
                        type="button" 
                        className={`filter-dropdown-item ${activeFilter === 'Inactive' ? 'active' : ''}`}
                        onClick={() => { setActiveFilter('Inactive'); setIsFilterDropdownOpen(false); }}
                        role="option"
                        aria-selected={activeFilter === 'Inactive'}
                      >
                        <span>Tidak Aktif</span>
                        <span className="tab-count">{stats.inactive}</span>
                      </button>
                      <button 
                        type="button" 
                        className={`filter-dropdown-item ${activeFilter === 'Passive' ? 'active' : ''}`}
                        onClick={() => { setActiveFilter('Passive'); setIsFilterDropdownOpen(false); }}
                        role="option"
                        aria-selected={activeFilter === 'Passive'}
                      >
                        <span>Pasif (&gt;30 Hari)</span>
                        <span className="tab-count">{passiveCustomers.length}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="app-search app-search-md">
                <Search className="app-search-icon" />
                <input 
                  type="text" 
                  className="app-search-input"
                  placeholder="Cari nama, HP, email..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Cari nama, nomor HP, atau email pelanggan"
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
            <table className="app-table customers-table">
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
                            <div className={`customer-avatar ${customer.isVIP ? 'vip' : ''}`} style={{ background: avatarColor.bg, color: avatarColor.color }}>
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
                            <button 
                              className="icon-btn" 
                              onClick={() => handleToggleVIP(customer)} 
                              title={customer.isVIP ? "Hapus VIP" : "Jadikan VIP"}
                              aria-label={customer.isVIP ? `Hapus status VIP untuk ${customer.name}` : `Jadikan ${customer.name} sebagai VIP`}
                            >
                              <Star size={15} color={customer.isVIP ? "#FFC107" : "currentColor"} fill={customer.isVIP ? "#FFC107" : "none"} />
                            </button>
                            <button 
                              className="icon-btn" 
                              onClick={() => handleOpenEdit(customer)} 
                              title="Edit"
                              aria-label={`Edit data ${customer.name}`}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button 
                              className="icon-btn delete" 
                              onClick={() => handleDelete(customer.id)} 
                              title="Hapus"
                              aria-label={`Hapus data ${customer.name}`}
                            >
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
                      <div className={`customer-avatar ${customer.isVIP ? 'vip' : ''}`} style={{ background: avatarColor.bg, color: avatarColor.color }}>
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="mobile-card-info">
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                          <span className="customer-name">{customer.name}</span>
                          </div>
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
          <div className="customer-detail-panel app-panel">
            <div className="detail-panel-header">
              <div className={`detail-avatar ${selectedCustomer.isVIP ? 'vip' : ''}`} style={{ background: getAvatarColor(selectedCustomer.name).bg, color: getAvatarColor(selectedCustomer.name).color }}>
                {selectedCustomer.name.charAt(0).toUpperCase()}
              </div>
              <h3>{selectedCustomer.name}</h3>
              <span className={`status-badge ${selectedCustomer.status.toLowerCase()}`}>
                {selectedCustomer.status === 'Active' ? 'Aktif' : 'Tidak Aktif'}
              </span>
              <button className="icon-btn detail-panel-close" onClick={() => setSelectedCustomer(null)} aria-label="Tutup panel detail"><X size={16} /></button>
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

              <div className="detail-section">
                <h4 className="section-title">Timeline Booking</h4>
                {selectedCustomerBookings.length > 0 ? (
                  <div className="customer-booking-timeline">
                    {selectedCustomerBookings.map((booking) => (
                      <div key={booking.id} className={`customer-booking-item ${booking.status}`}>
                        <div>
                          <strong>{booking.date}</strong>
                          <span>{String(booking.hour).padStart(2, '0')}.00-{String(Number(booking.hour) + Number(booking.duration || 1)).padStart(2, '0')}.00</span>
                        </div>
                        <small>{booking.status === 'confirmed' ? 'Lunas' : booking.status === 'dp' ? 'DP' : booking.status === 'cancelled' ? 'Batal' : 'Belum Bayar'}</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="detail-notes">Belum ada histori booking yang tersambung.</p>
                )}
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
                  aria-label={`Kirim pesan WhatsApp sapaan selamat datang ke ${selectedCustomer.name}`}
                >
                  <MessageCircle size={14} /> Sapaan
                </button>
                <button
                  className="wa-btn promo"
                  onClick={() => sendPromoMessage(selectedCustomer, { title: 'Promo Spesial!', description: 'Diskon booking untuk pelanggan setia kami.' })}
                  title="Kirim promo"
                  aria-label={`Kirim pesan WhatsApp promo ke ${selectedCustomer.name}`}
                >
                  <Gift size={14} /> Promo
                </button>
                <button
                  className="wa-btn tier"
                  onClick={() => sendMembershipUpgrade(selectedCustomer, getMembershipTier(selectedCustomer.totalBookings, selectedCustomer.totalSpent))}
                  title="Ingatkan membership tier"
                  aria-label={`Kirim pesan WhatsApp status tier ke ${selectedCustomer.name}`}
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
        <form className="customer-form" onSubmit={handleFormSubmit(onSubmitForm)}>

          {/* Avatar Preview + Name */}
          <div className="cf-identity-section">
            <div className="cf-avatar-preview" style={{
              background: watchedName ? getAvatarColor(watchedName).bg : 'rgba(255,255,255,0.06)',
              color: watchedName ? getAvatarColor(watchedName).color : 'var(--text-muted)',
              border: watchedName ? `1.5px solid ${getAvatarColor(watchedName).color}30` : '1.5px solid rgba(255,255,255,0.08)'
            }}>
              {watchedName ? watchedName.charAt(0).toUpperCase() : <Users size={22} opacity={0.4} />}
            </div>
            <div className="cf-name-field">
              <label className="cf-label">Nama Band / Pelanggan <span className="cf-required">*</span></label>
              <input
                type="text"
                placeholder="contoh: The Rockers"
                className="cf-input"
                autoFocus
                {...register('name', { validate: validateWithZod('name') })}
              />
              {errors.name && <span className="cf-error-message" style={{ color: 'var(--accent-pink)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.name.message}</span>}
            </div>
          </div>

          {/* Section: Kontak */}
          <div className="cf-section">
            <div className="cf-section-title"><Phone size={12} /> Kontak</div>
            <div className="cf-row">
              <div className="cf-field">
                <label className="cf-label">No. HP / WhatsApp <span className="cf-required">*</span></label>
                <input 
                  type="tel" 
                  placeholder="08xxxxxxxxxx" 
                  className="cf-input" 
                  {...register('phone', { validate: validateWithZod('phone') })}
                />
                {errors.phone && <span className="cf-error-message" style={{ color: 'var(--accent-pink)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.phone.message}</span>}
              </div>
              <div className="cf-field">
                <label className="cf-label"><Mail size={11} /> Email</label>
                <input 
                  type="email" 
                  placeholder="email@example.com" 
                  className="cf-input" 
                  {...register('email', { validate: validateWithZod('email') })}
                />
                {errors.email && <span className="cf-error-message" style={{ color: 'var(--accent-pink)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.email.message}</span>}
              </div>
            </div>
            <div className="cf-row">
              <div className="cf-field">
                <label className="cf-label"><AtSign size={11} /> Instagram</label>
                <div className="cf-prefix-input">
                  <span className="cf-prefix">@</span>
                  <input 
                    type="text" 
                    placeholder="username" 
                    className="cf-input cf-input-prefixed" 
                    {...register('instagram')}
                    onChange={(e) => setValue('instagram', e.target.value.replace('@',''))}
                  />
                </div>
              </div>
              <div className="cf-field">
                <label className="cf-label"><MapPin size={11} /> Alamat</label>
                <input 
                  type="text" 
                  placeholder="Jl. Contoh No. 123" 
                  className="cf-input" 
                  {...register('address')}
                />
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
                  <label key={opt.value} className={`cf-status-card ${watchedStatus === opt.value ? 'selected' : ''}`} style={{ '--cs-color': opt.color }}>
                    <input 
                      type="radio" 
                      value={opt.value} 
                      className="cf-radio" 
                      {...register('status')}
                    />
                    <span className="cf-status-dot" style={{ background: opt.color }} />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
              <label className="cf-vip-toggle">
                <span className="cf-vip-label"><Star size={13} color="#FFC107" fill="#FFC107" /> VIP Member <span className="cf-vip-sub">Diskon 10%</span></span>
                <div 
                  className={`cf-toggle-switch ${watchedIsVIP ? 'on' : ''}`} 
                  onClick={() => setValue('isVIP', !watchedIsVIP)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setValue('isVIP', !watchedIsVIP);
                    }
                  }}
                  role="switch"
                  aria-checked={watchedIsVIP || false}
                  tabIndex={0}
                  aria-label="VIP Member Toggle"
                >
                  <div className="cf-toggle-thumb" />
                </div>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="cf-section">
            <div className="cf-field">
              <label className="cf-label"><StickyNote size={11} /> Catatan (opsional)</label>
              <textarea 
                placeholder="Preferensi alat, kebiasaan, dll..." 
                className="cf-input cf-textarea" 
                rows="2" 
                {...register('notes')}
              />
            </div>
          </div>

          <div className="cf-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Batal</button>
            <button type="submit" className="btn-primary">
              {editingCustomer ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default CustomersPage;

