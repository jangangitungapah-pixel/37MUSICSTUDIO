import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '../store/useSettingsStore';
import { useDemoStore } from '../store/useDemoStore';
import { useBookingStore } from '../store/useBookingStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  Settings, Save, Building2, Phone, MapPin, DollarSign,
  Bell, Database, Trash2, CheckCircle2, XCircle, ShieldAlert,
  ChevronRight, Music2, Sparkles, Lock,
  AlertTriangle, RefreshCw, FlaskConical, Download, Upload,
  Clock, CalendarX
} from 'lucide-react';
import { collection, doc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { pagePreset } from '../animations';
import '../components/BookingForm.css'; // Import premium form styles
import './SettingsPage.css';

const M3Switch = ({ checked, onChange, ariaLabel, disabled }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`m3-switch ${checked ? 'on' : 'off'}`}
      onClick={onChange}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      <div className="m3-switch-handle">
        <div className="m3-switch-handle-shape">
          {checked && (
            <span className="m3-switch-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

const SettingsPage = () => {
  const storeSettings = useSettingsStore(
    useShallow(state => ({
      studioName: state.studioName,
      studioAddress: state.studioAddress,
      studioPhone: state.studioPhone,
      pricePerHour: state.pricePerHour,
      durationDiscounts: state.durationDiscounts,
      recordingSessions: state.recordingSessions,
      operationalHours: state.operationalHours,
      blockedDates: state.blockedDates,
      updateSettings: state.updateSettings
    }))
  );
  const { isDemoMode, toggleDemoMode } = useDemoStore(
    useShallow(state => ({
      isDemoMode: state.isDemoMode,
      toggleDemoMode: state.toggleDemoMode
    }))
  );
  const bookings = useBookingStore(state => state.bookings);
  const user = useAuthStore(state => state.user);

  const [formData, setFormData] = useState({
    studioName: '',
    studioAddress: '',
    studioPhone: '',
    pricePerHour: 0,
    durationDiscounts: [],
    recordingSessions: [],
    operationalHours: { start: 10, end: 23 },
    blockedDates: []
  });

  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [activeSection, setActiveSection] = useState('profile'); // tab navigation
  
  // Duration Discount states
  const [newDiscountHours, setNewDiscountHours] = useState('');
  const [newDiscountAmount, setNewDiscountAmount] = useState('');

  // Recording Session states
  const [newRecSessionName, setNewRecSessionName] = useState('');
  const [newRecSessionHours, setNewRecSessionHours] = useState('');
  const [newRecSessionPrice, setNewRecSessionPrice] = useState('');

  // Block Date state
  const [newBlockedDate, setNewBlockedDate] = useState('');

  const [notifPermission, setNotifPermission] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );

  // Data reset states
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmStep, setResetConfirmStep] = useState(0); // 0, 1, 2
  const [resetOptions, setResetOptions] = useState({
    bookings: false,
    customers: false,
    finances: false,
    inventory: false
  });
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    setFormData({
      studioName: storeSettings.studioName,
      studioAddress: storeSettings.studioAddress,
      studioPhone: storeSettings.studioPhone,
      pricePerHour: storeSettings.pricePerHour,
      durationDiscounts: storeSettings.durationDiscounts || [],
      recordingSessions: storeSettings.recordingSessions || [],
      operationalHours: storeSettings.operationalHours || { start: 10, end: 23 },
      blockedDates: storeSettings.blockedDates || []
    });
  }, [storeSettings.studioName, storeSettings.studioAddress, storeSettings.studioPhone, storeSettings.pricePerHour, storeSettings.durationDiscounts, storeSettings.recordingSessions, storeSettings.operationalHours, storeSettings.blockedDates]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'pricePerHour' ? Number(value) : value
    }));
    if (saveStatus === 'saved') setSaveStatus('idle');
  };

  const handleOperationalHoursChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      operationalHours: {
        ...prev.operationalHours,
        [name]: Number(value)
      }
    }));
    if (saveStatus === 'saved') setSaveStatus('idle');
  };

  const handleAddBlockedDate = async () => {
    if (!newBlockedDate) return;

    if (formData.blockedDates.includes(newBlockedDate)) {
      toast.error('Tanggal ini sudah ada di daftar libur.');
      return;
    }

    // Smart Scenario: Check for existing bookings
    const bookingsOnDate = bookings.filter(b => b.date === newBlockedDate && b.status !== 'cancelled');
    const confirmedCount = bookingsOnDate.filter(b => b.status === 'confirmed').length;
    const dpCount = bookingsOnDate.filter(b => b.status === 'dp').length;
    const pendingCount = bookingsOnDate.filter(b => b.status === 'pending').length;

    if (bookingsOnDate.length > 0) {
      const confirmMsg = `Perhatian: Ada ${confirmedCount} lunas, ${dpCount} DP, dan ${pendingCount} pending pada tanggal ini.\n\nTanggal tetap akan diliburkan untuk booking BARU, tapi booking yang sudah masuk tidak akan dihapus. Anda harus menghubungi pelanggan terkait untuk reschedule/refund secara manual.\n\nLanjutkan blokir tanggal?`;
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }

    const newData = {
      ...formData,
      blockedDates: [...formData.blockedDates, newBlockedDate].sort()
    };

    setFormData(newData);
    setNewBlockedDate('');
    
    setSaveStatus('saving');
    try {
      await storeSettings.updateSettings(newData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
      if (bookingsOnDate.length > 0) {
        toast.warning('Tanggal diblokir. Jangan lupa tangani jadwal yang sudah terlanjur masuk.');
      } else {
        toast.success('Hari libur berhasil ditambahkan.');
      }
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleRemoveBlockedDate = async (dateStr) => {
    const newData = {
      ...formData,
      blockedDates: formData.blockedDates.filter(d => d !== dateStr)
    };
    
    setFormData(newData);

    setSaveStatus('saving');
    try {
      await storeSettings.updateSettings(newData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleAddDiscount = async () => {
    const hours = parseInt(newDiscountHours);
    const amount = parseInt(newDiscountAmount);
    
    if (isNaN(hours) || hours <= 0 || isNaN(amount) || amount < 0) {
      toast.error("Masukkan durasi jam dan nominal diskon yang valid.");
      return;
    }

    const newDiscount = {
      id: crypto.randomUUID(),
      hours,
      discountAmount: amount
    };

    const filtered = formData.durationDiscounts.filter(d => d.hours !== hours);
    const newData = {
      ...formData,
      durationDiscounts: [...filtered, newDiscount].sort((a, b) => a.hours - b.hours)
    };

    setFormData(newData);
    setNewDiscountHours('');
    setNewDiscountAmount('');
    
    // Auto-save ke database agar tidak hilang saat di-refresh
    setSaveStatus('saving');
    try {
      await storeSettings.updateSettings(newData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleRemoveDiscount = async (id) => {
    const newData = {
      ...formData,
      durationDiscounts: formData.durationDiscounts.filter(d => d.id !== id)
    };
    
    setFormData(newData);

    // Auto-save saat menghapus diskon
    setSaveStatus('saving');
    try {
      await storeSettings.updateSettings(newData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setSaveStatus('saving');
    try {
      await storeSettings.updateSettings(formData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleAddRecordingSession = async () => {
    const hours = parseInt(newRecSessionHours);
    const price = parseInt(newRecSessionPrice);
    
    if (!newRecSessionName || isNaN(hours) || hours <= 0 || isNaN(price) || price < 0) {
      toast.error("Masukkan nama sesi, durasi jam, dan harga yang valid.");
      return;
    }

    const newSession = {
      id: crypto.randomUUID(),
      name: newRecSessionName,
      hours,
      price
    };

    const newData = {
      ...formData,
      recordingSessions: [...formData.recordingSessions, newSession].sort((a, b) => a.hours - b.hours)
    };

    setFormData(newData);
    setNewRecSessionName('');
    setNewRecSessionHours('');
    setNewRecSessionPrice('');
    
    setSaveStatus('saving');
    try {
      await storeSettings.updateSettings(newData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleRemoveRecordingSession = async (id) => {
    const newData = {
      ...formData,
      recordingSessions: formData.recordingSessions.filter(s => s.id !== id)
    };
    
    setFormData(newData);

    setSaveStatus('saving');
    try {
      await storeSettings.updateSettings(newData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleResetCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setResetConfirmStep(0);
    if (name === 'all') {
      setResetOptions({ bookings: checked, customers: checked, finances: checked, inventory: checked });
    } else {
      setResetOptions(prev => ({ ...prev, [name]: checked }));
    }
  };

  const selectedCount = Object.values(resetOptions).filter(Boolean).length;

  const backupCollections = ['bookings', 'publicBookings', 'customers', 'finances', 'inventory', 'bookingRequests', 'config'];

  const handleBackupData = async () => {
    setIsBackingUp(true);
    try {
      const backup = {
        app: '37MUSICSTUDIO',
        version: 1,
        exportedAt: new Date().toISOString(),
        collections: {},
      };

      for (const colName of backupCollections) {
        const snapshot = await getDocs(collection(db, colName));
        backup.collections[colName] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          data: docSnap.data(),
        }));
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `37musicstudio-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Backup data berhasil dibuat.');
    } catch {
      toast.error('Gagal membuat backup data.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const commitBatchChunks = async (writes) => {
    for (let i = 0; i < writes.length; i += 450) {
      const batch = writeBatch(db);
      writes.slice(i, i + 450).forEach(({ colName, item }) => {
        batch.set(doc(db, colName, item.id.toString()), item.data, { merge: true });
      });
      await batch.commit();
    }
  };

  const handleRestoreBackup = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed.app !== '37MUSICSTUDIO' || !parsed.collections) {
        throw new Error('Format backup tidak valid.');
      }
      if (!window.confirm('Restore akan menimpa/menggabungkan data dari file backup ke server. Lanjutkan?')) {
        setIsRestoring(false);
        event.target.value = '';
        return;
      }

      const writes = [];
      backupCollections.forEach((colName) => {
        (parsed.collections[colName] || []).forEach((item) => {
          if (item?.id && item.data && typeof item.data === 'object') {
            writes.push({ colName, item });
          }
        });
      });
      await commitBatchChunks(writes);
      toast.success(`Restore selesai. ${writes.length} dokumen diproses.`);
    } catch (error) {
      toast.error(error.message || 'Gagal restore backup.');
    } finally {
      setIsRestoring(false);
      event.target.value = '';
    }
  };

  const handleResetSelected = async () => {
    if (resetConfirmStep < 2) {
      setResetConfirmStep(prev => prev + 1);
      return;
    }
    setIsResetting(true);
    try {
      const selected = Object.keys(resetOptions).filter(k => resetOptions[k]);
      if (resetOptions.bookings) selected.push('publicBookings');
      const promises = [];
      for (const colName of selected) {
        const snapshot = await getDocs(collection(db, colName));
        snapshot.docs.forEach(d => promises.push(deleteDoc(d.ref)));
      }
      await Promise.all(promises);
      localStorage.clear();
      toast.success('Data berhasil dihapus. Aplikasi akan dimuat ulang.');
      window.setTimeout(() => window.location.reload(), 700);
    } catch {
      toast.error('Terjadi kesalahan saat menghapus data.');
      setIsResetting(false);
      setResetConfirmStep(0);
    }
  };

  const handleRequestNotif = () => {
    Notification.requestPermission().then(perm => {
      setNotifPermission(perm);
      if (perm === 'granted' && user?.uid) {
        import('../lib/fcm').then(({ registerFCMToken }) => {
          registerFCMToken(user.uid);
        }).catch(err => {
          console.error('[FCM] Error loading FCM module:', err);
        });
      }
    });
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const allSelected = Object.values(resetOptions).every(Boolean);

  const sections = [
    { id: 'profile',       label: 'Profil Studio',    icon: Building2   },
    { id: 'pricing',       label: 'Tarif & Harga',    icon: DollarSign  },
    { id: 'operational',   label: 'Jam & Libur',      icon: Clock       },
    { id: 'notifications', label: 'Notifikasi',        icon: Bell        },
    { id: 'demo',          label: 'Mode Demo',         icon: FlaskConical},
    { id: 'data',          label: 'Manajemen Data',    icon: Database    },
  ];

  return (
    <div className="app-page settings-page">
      {/* Page Header */}
      <header className="app-page-header settings-command-shell">
        <div className="settings-command-top">
          <div className="settings-command-copy">
            <div className="settings-header-icon">
              <Settings size={22} />
            </div>
            <div className="settings-command-text">
              <span className="settings-command-eyebrow">Admin Control Center</span>
              <h2 className="app-page-title">Pengaturan</h2>
              <p className="app-page-subtitle">Konfigurasi studio, tarif, operasional, notifikasi, demo, dan data.</p>
            </div>
          </div>

          <div className="app-page-actions settings-save-cluster">
            <span className={`settings-state-pill ${saveStatus}`} aria-live="polite">
              {saveStatus === 'saving' ? 'Sync berjalan' :
               saveStatus === 'saved' ? 'Perubahan aman' :
               saveStatus === 'error' ? 'Butuh cek ulang' : 'Siap disimpan'}
            </span>
            <button
              className={`settings-save-btn ${saveStatus}`}
              onClick={handleSubmit}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' && <RefreshCw size={16} className="spin" />}
              {saveStatus === 'saved' && <CheckCircle2 size={16} />}
              {saveStatus === 'error' && <XCircle size={16} />}
              {saveStatus === 'idle' && <Save size={16} />}
              <span>
                {saveStatus === 'saving' ? 'Menyimpan...' :
                 saveStatus === 'saved' ? 'Tersimpan!' :
                 saveStatus === 'error' ? 'Gagal Simpan' : 'Simpan'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="settings-layout">
        {/* Left Tab Navigation */}
        <nav className="settings-nav app-panel">
          <div className="settings-nav-brand">
            <div className="nav-brand-icon">
              <Music2 size={20} color="var(--accent-pink)" />
            </div>
            <div className="nav-brand-info">
              <span className="nav-brand-name">{formData.studioName || '37 Music Studio'}</span>
              <span className="nav-brand-sub">Studio Management</span>
            </div>
          </div>
          <div className="settings-nav-divider" />
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`settings-nav-item ${activeSection === id ? 'active' : ''}`}
              aria-current={activeSection === id ? 'page' : undefined}
              onClick={() => setActiveSection(id)}
            >
              {activeSection === id && (
                <motion.div layoutId="settingsTabIndicator" className="settings-nav-indicator" />
              )}
              <span className="settings-nav-icon"><Icon size={17} /></span>
              <span className="settings-nav-label">{label}</span>
              <ChevronRight size={14} className="settings-nav-chevron" />
            </button>
          ))}
        </nav>

        {/* Right Content */}
        <div className="settings-content-area">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              {...pagePreset}
              className="settings-panel-wrapper"
            >
              {/* === SECTION: PROFILE === */}
              {activeSection === 'profile' && (
                <div className="settings-panel app-panel">
              <div className="settings-panel-header">
                <div className="panel-header-icon" style={{ background: 'rgba(0,240,255,0.1)', color: 'var(--accent-cyan)' }}>
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="panel-title">Profil & Identitas Studio</h3>
                  <p className="panel-desc">Informasi ini tampil di kop surat Invoice/Nota pelanggan.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="settings-form-body">
                {/* Studio Name & Phone */}
                <div className="settings-form-row">
                  <div className="settings-field">
                    <label className="bf-label">
                      <Music2 size={14} />
                      Nama Studio
                    </label>
                    <input
                      type="text"
                      name="studioName"
                      value={formData.studioName}
                      onChange={handleChange}
                      className="bf-input"
                      placeholder="Contoh: 37 Music Studio"
                      required
                    />
                    <span className="settings-hint">Nama ini akan muncul di dokumen & publik</span>
                  </div>

                  <div className="settings-field">
                    <label className="bf-label">
                      <Phone size={14} />
                      Nomor Telepon / WhatsApp
                    </label>
                    <div className="settings-input-group">
                      <span className="settings-input-prefix">+62</span>
                      <input
                        type="text"
                        name="studioPhone"
                        value={formData.studioPhone}
                        onChange={handleChange}
                        className="bf-input with-prefix"
                        placeholder="81234567890"
                      />
                    </div>
                    <span className="settings-hint">Untuk tautan WhatsApp booking pelanggan</span>
                  </div>
                </div>

                {/* Address */}
                <div className="settings-field">
                  <label className="bf-label">
                    <MapPin size={14} />
                    Alamat Lengkap Studio
                  </label>
                  <textarea
                    name="studioAddress"
                    value={formData.studioAddress}
                    onChange={handleChange}
                    className="bf-input settings-textarea"
                    placeholder="Jl. Contoh No. 37, Kota, Provinsi"
                    rows="3"
                  />
                </div>

                {/* Preview card */}
                <div className="studio-preview-card">
                  <div className="preview-label">
                    <Sparkles size={12} />
                    Preview Tampilan Invoice
                  </div>
                  <div className="preview-content">
                    <p className="preview-name">{formData.studioName || '— Nama Studio —'}</p>
                    <p className="preview-detail">{formData.studioPhone || '— No. Telp —'}</p>
                    <p className="preview-detail">{formData.studioAddress || '— Alamat —'}</p>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* === SECTION: PRICING === */}
          {activeSection === 'pricing' && (
            <div className="settings-panel app-panel">
              <div className="settings-panel-header">
                <div className="panel-header-icon" style={{ background: 'rgba(76,175,80,0.1)', color: '#4CAF50' }}>
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="panel-title">Konfigurasi Tarif & Harga</h3>
                  <p className="panel-desc">Atur standar harga sewa yang diterapkan ke seluruh booking baru.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="settings-form-body">
                <div className="settings-field" style={{ maxWidth: '280px' }}>
                  <label className="bf-label">
                    <DollarSign size={14} />
                    Tarif Sewa per Jam (Rupiah)
                  </label>
                  <div className="settings-input-group">
                    <span className="settings-input-prefix">Rp</span>
                    <input
                      type="number"
                      name="pricePerHour"
                      value={formData.pricePerHour}
                      onChange={handleChange}
                      className="bf-input with-prefix"
                      min="0"
                      step="5000"
                      required
                    />
                  </div>
                </div>

                {/* Pricing info cards */}
                <div className="pricing-info-grid">
                  <div className="pricing-info-card">
                    <span className="pricing-info-label">2 Jam</span>
                    <span className="pricing-info-value">{formatCurrency(formData.pricePerHour * 2)}</span>
                  </div>
                  <div className="pricing-info-card">
                    <span className="pricing-info-label">4 Jam</span>
                    <span className="pricing-info-value">{formatCurrency(formData.pricePerHour * 4)}</span>
                  </div>
                  <div className="pricing-info-card">
                    <span className="pricing-info-label">8 Jam</span>
                    <span className="pricing-info-value">{formatCurrency(formData.pricePerHour * 8)}</span>
                  </div>
                  <div className="pricing-info-card highlight">
                    <span className="pricing-info-label">13 Jam (Full Day)</span>
                    <span className="pricing-info-value">{formatCurrency(formData.pricePerHour * 13)}</span>
                  </div>
                </div>

                {/* Duration Discounts UI */}
                <div className="duration-discount-section">
                  <h4 className="duration-discount-title">Diskon Berdasarkan Durasi</h4>
                  <p className="duration-discount-desc">Otomatis memotong harga saat pelanggan membooking dengan durasi tertentu (atau lebih besar). Contoh: Diskon Rp 50.000 untuk minimal 4 jam.</p>
                  
                  <div className="duration-discount-form">
                    <div className="dd-input-group">
                      <label className="bf-label">Durasi (Jam)</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={newDiscountHours} 
                        onChange={e => setNewDiscountHours(e.target.value)} 
                        placeholder="Contoh: 4" 
                        className="bf-input"
                      />
                    </div>
                    <div className="dd-input-group">
                      <label className="bf-label">Potongan Diskon (Rp)</label>
                      <input 
                        type="number" 
                        min="0" 
                        value={newDiscountAmount} 
                        onChange={e => setNewDiscountAmount(e.target.value)} 
                        placeholder="Contoh: 50000" 
                        className="bf-input"
                      />
                    </div>
                    <button type="button" className="btn-secondary" onClick={handleAddDiscount}>
                      + Tambah
                    </button>
                  </div>

                  {formData.durationDiscounts && formData.durationDiscounts.length > 0 ? (
                    <motion.div className="duration-discount-list" layout>
                      <AnimatePresence>
                        {formData.durationDiscounts.map(d => (
                          <motion.div 
                            key={d.id} 
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="duration-discount-item"
                          >
                            <div className="dd-item-info">
                              <span className="dd-item-hours">≥ {d.hours} Jam</span>
                              <span className="dd-item-amount">− {formatCurrency(d.discountAmount)}</span>
                            </div>
                            <button type="button" className="icon-btn delete" onClick={() => handleRemoveDiscount(d.id)} title="Hapus">
                              <Trash2 size={16} />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    <div className="duration-discount-empty">
                      Belum ada aturan diskon durasi.
                    </div>
                  )}
                </div>

                {/* Recording Sessions UI */}
                <div className="duration-discount-section mt-4">
                  <h4 className="duration-discount-title">Paket Sesi Recording</h4>
                  <p className="duration-discount-desc">Tentukan paket kustom untuk sesi recording. Harga paket bersifat tetap dan tidak menggunakan perhitungan tarif per jam.</p>
                  
                  <div className="duration-discount-form">
                    <div className="dd-input-group">
                      <label className="bf-label">Nama Paket</label>
                      <input 
                        type="text" 
                        value={newRecSessionName} 
                        onChange={e => setNewRecSessionName(e.target.value)} 
                        placeholder="Cth: Sesi 6 Jam" 
                        className="bf-input"
                      />
                    </div>
                    <div className="dd-input-group">
                      <label className="bf-label">Durasi</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={newRecSessionHours} 
                        onChange={e => setNewRecSessionHours(e.target.value)} 
                        placeholder="6" 
                        className="bf-input"
                      />
                    </div>
                    <div className="dd-input-group">
                      <label className="bf-label">Harga Paket</label>
                      <input 
                        type="number" 
                        min="0" 
                        value={newRecSessionPrice} 
                        onChange={e => setNewRecSessionPrice(e.target.value)} 
                        placeholder="600000" 
                        className="bf-input"
                      />
                    </div>
                    <button type="button" className="btn-secondary" onClick={handleAddRecordingSession}>
                      + Tambah
                    </button>
                  </div>

                  {formData.recordingSessions && formData.recordingSessions.length > 0 ? (
                    <motion.div className="duration-discount-list" layout>
                      <AnimatePresence>
                        {formData.recordingSessions.map(s => (
                          <motion.div 
                            key={s.id} 
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="duration-discount-item"
                          >
                            <div className="dd-item-info">
                              <span className="dd-item-hours">{s.name} ({s.hours} Jam)</span>
                              <span className="dd-item-amount">{formatCurrency(s.price)}</span>
                            </div>
                            <button type="button" className="icon-btn delete" onClick={() => handleRemoveRecordingSession(s.id)} title="Hapus">
                              <Trash2 size={16} />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    <div className="duration-discount-empty">
                      Belum ada paket sesi recording.
                    </div>
                  )}
                </div>

                <div className="settings-info-box mt-3">
                  <AlertTriangle size={14} />
                  <span>Perubahan tarif hanya berlaku untuk booking baru. Booking yang sudah ada tidak berubah secara otomatis.</span>
                </div>
              </form>
            </div>
          )}

          {/* === SECTION: OPERATIONAL === */}
          {activeSection === 'operational' && (
            <div className="settings-panel app-panel">
              <div className="settings-panel-header">
                <div className="panel-header-icon" style={{ background: 'rgba(255,42,95,0.1)', color: 'var(--accent-pink)' }}>
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="panel-title">Jam Operasional & Hari Libur</h3>
                  <p className="panel-desc">Atur jam kerja harian dan blokir tanggal agar tidak bisa di-booking oleh publik.</p>
                </div>
              </div>

              <div className="settings-form-body">
                {/* Operational Hours */}
                <div className="duration-discount-section">
                  <h4 className="duration-discount-title">Jam Operasional Harian</h4>
                  <p className="duration-discount-desc">Menentukan ketersediaan slot di Kalender Publik dan Admin.</p>
                  
                  <div className="duration-discount-form">
                    <div className="dd-input-group">
                      <label className="bf-label">Jam Buka</label>
                      <select 
                        name="start" 
                        value={formData.operationalHours?.start || 10} 
                        onChange={handleOperationalHoursChange}
                        className="bf-input"
                      >
                        {Array.from({length: 24}).map((_, i) => (
                          <option key={`start-${i}`} value={i}>{String(i).padStart(2, '0')}:00</option>
                        ))}
                      </select>
                    </div>
                    <div className="dd-input-group">
                      <label className="bf-label">Jam Tutup</label>
                      <select 
                        name="end" 
                        value={formData.operationalHours?.end || 23} 
                        onChange={handleOperationalHoursChange}
                        className="bf-input"
                      >
                        {Array.from({length: 25}).map((_, i) => (
                          <option key={`end-${i}`} value={i}>{String(i).padStart(2, '0')}:00</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="settings-info-box mt-3">
                    <AlertTriangle size={14} />
                    <span>Jika jam diubah, pastikan tidak ada jadwal lunas/DP yang berada di luar jam operasional baru.</span>
                  </div>
                </div>

                {/* Blocked Dates */}
                <div className="duration-discount-section mt-4">
                  <h4 className="duration-discount-title">Hari Libur (Block Dates)</h4>
                  <p className="duration-discount-desc">Tanggal yang diblokir akan ditutup secara publik. Admin tetap dapat mengaksesnya jika dibutuhkan.</p>
                  
                  <div className="duration-discount-form">
                    <div className="dd-input-group">
                      <label className="bf-label">Pilih Tanggal</label>
                      <input 
                        type="date" 
                        value={newBlockedDate} 
                        onChange={e => setNewBlockedDate(e.target.value)} 
                        className="bf-input"
                      />
                    </div>
                    <button type="button" className="btn-secondary" style={{ alignSelf: 'flex-end', height: '46px' }} onClick={handleAddBlockedDate}>
                      + Blokir
                    </button>
                  </div>

                  {formData.blockedDates && formData.blockedDates.length > 0 ? (
                    <motion.div className="duration-discount-list" layout>
                      <AnimatePresence>
                        {formData.blockedDates.map(d => (
                          <motion.div 
                            key={d} 
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="duration-discount-item"
                          >
                            <div className="dd-item-info">
                              <CalendarX size={16} color="var(--accent-pink)" />
                              <span className="dd-item-hours">{new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <button type="button" className="icon-btn delete" onClick={() => handleRemoveBlockedDate(d)} title="Hapus dari daftar libur">
                              <Trash2 size={16} />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    <div className="duration-discount-empty">
                      Belum ada hari libur yang diatur.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* === SECTION: DEMO MODE === */}
          {activeSection === 'demo' && (
            <div className="settings-panel app-panel demo-mode-panel">
              <div className="settings-panel-header">
                <div className="panel-header-icon" style={{ background: 'rgba(138,43,226,0.15)', color: '#a855f7' }}>
                  <FlaskConical size={20} />
                </div>
                <div>
                  <h3 className="panel-title">Mode Demo</h3>
                  <p className="panel-desc">Tampilkan simulasi data dummy sepanjang tahun 2026 tanpa mengubah data nyata.</p>
                </div>
              </div>

              <div className="settings-form-body">
                {/* Main Toggle Card */}
                <div className={`demo-toggle-card ${isDemoMode ? 'active' : ''}`}>
                  <div className="demo-toggle-left">
                    <div className="demo-toggle-icon">
                      <FlaskConical size={28} />
                    </div>
                    <div>
                      <p className="demo-toggle-title">Simulasi Data 2026</p>
                      <p className="demo-toggle-desc">
                        {isDemoMode
                          ? '✅ Mode Demo AKTIF — Semua halaman menampilkan data simulasi'
                          : 'Data asli ditampilkan. Aktifkan untuk melihat contoh penggunaan aplikasi.'}
                      </p>
                    </div>
                  </div>
                  <M3Switch
                    checked={isDemoMode}
                    onChange={toggleDemoMode}
                    ariaLabel={isDemoMode ? 'Matikan Demo Mode' : 'Aktifkan Demo Mode'}
                  />
                </div>

                {/* Stats Preview when active */}
                {isDemoMode && (
                  <div className="demo-stats-preview">
                    <div className="demo-stat-chip">
                      <span className="demo-chip-value">200+</span>
                      <span className="demo-chip-label">Booking simulasi</span>
                    </div>
                    <div className="demo-stat-chip">
                      <span className="demo-chip-value">15</span>
                      <span className="demo-chip-label">Band / Pelanggan</span>
                    </div>
                    <div className="demo-stat-chip">
                      <span className="demo-chip-value">12</span>
                      <span className="demo-chip-label">Item inventaris</span>
                    </div>
                    <div className="demo-stat-chip">
                      <span className="demo-chip-value">Jan–Des 2026</span>
                      <span className="demo-chip-label">Rentang waktu</span>
                    </div>
                  </div>
                )}

                {/* Info Boxes */}
                <div className="demo-info-list">
                  <div className="demo-info-item safe">
                    <CheckCircle2 size={15} />
                    <span>Data asli di Firebase <strong>tidak akan tersentuh</strong> — mode demo hanya berjalan di memori browser.</span>
                  </div>
                  <div className="demo-info-item safe">
                    <CheckCircle2 size={15} />
                    <span>Semua fitur (Kalender, Dashboard, Billing, dll.) akan menampilkan data simulasi secara real-time.</span>
                  </div>
                  <div className="demo-info-item warn">
                    <AlertTriangle size={15} />
                    <span>Aksi seperti <strong>Tambah / Hapus Booking</strong> tidak akan menyimpan ke server saat Mode Demo aktif.</span>
                  </div>
                  <div className="demo-info-item warn">
                    <AlertTriangle size={15} />
                    <span>Mode Demo akan otomatis dimatikan saat halaman di-refresh.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === SECTION: NOTIFICATIONS === */}
          {activeSection === 'notifications' && (
            <div className="settings-panel app-panel">
              <div className="settings-panel-header">
                <div className="panel-header-icon" style={{ background: 'rgba(255,193,7,0.1)', color: '#FFC107' }}>
                  <Bell size={20} />
                </div>
                <div>
                  <h3 className="panel-title">Notifikasi Sistem</h3>
                  <p className="panel-desc">Kelola izin notifikasi perangkat agar Anda tidak melewatkan booking baru.</p>
                </div>
              </div>

              <div className="settings-form-body">
                <div className="notif-status-card">
                  <div className="notif-status-left">
                    <div className={`notif-status-dot ${notifPermission}`} />
                    <div>
                      <p className="notif-status-title">
                        {notifPermission === 'granted' ? 'Notifikasi Aktif' :
                         notifPermission === 'denied' ? 'Notifikasi Diblokir' :
                         notifPermission === 'unsupported' ? 'Tidak Didukung' : 'Belum Diizinkan'}
                      </p>
                      <p className="notif-status-desc">
                        {notifPermission === 'granted' ? 'Anda akan menerima pemberitahuan jadwal baru di layar.' :
                         notifPermission === 'denied' ? 'Buka pengaturan situs di browser untuk mengizinkan notifikasi.' :
                         notifPermission === 'unsupported' ? 'Browser Anda tidak mendukung Web Notifications.' :
                         'Klik tombol di bawah untuk mengizinkan notifikasi dari browser Anda.'}
                      </p>
                    </div>
                  </div>
                  {notifPermission === 'granted' ? (
                    <M3Switch checked={true} ariaLabel="Notifikasi Aktif" disabled={true} />
                  ) : notifPermission === 'default' ? (
                    <button className="btn-primary" onClick={handleRequestNotif} type="button">
                      Izinkan
                    </button>
                  ) : (
                    <M3Switch checked={false} onChange={handleRequestNotif} ariaLabel="Notifikasi Nonaktif" />
                  )}
                </div>

                <div className="settings-info-box">
                  <Lock size={14} />
                  <span>Izin notifikasi dikelola oleh browser Anda, bukan oleh aplikasi ini. Kami tidak menyimpan data perangkat Anda.</span>
                </div>
              </div>
            </div>
          )}

          {/* === SECTION: DATA MANAGEMENT === */}
          {activeSection === 'data' && (
            <div className="settings-panel app-panel danger-zone">
              <div className="settings-panel-header">
                <div className="panel-header-icon" style={{ background: 'rgba(255,68,68,0.1)', color: '#ff4444' }}>
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="panel-title">Manajemen Data</h3>
                  <p className="panel-desc">Hapus data secara permanen dari server. <strong>Tindakan ini tidak bisa dibatalkan.</strong></p>
                </div>
              </div>

              <div className="settings-form-body">
                <div className="backup-restore-card">
                  <div className="backup-restore-copy">
                    <h4>Backup & Restore</h4>
                    <p>Unduh salinan data operasional atau restore dari file backup JSON aplikasi ini.</p>
                  </div>
                  <div className="backup-restore-actions">
                    <button type="button" className="btn-secondary" onClick={handleBackupData} disabled={isBackingUp}>
                      <Download size={15} /> {isBackingUp ? 'Membuat...' : 'Download Backup'}
                    </button>
                    <label className={`restore-upload-btn ${isRestoring ? 'disabled' : ''}`}>
                      <Upload size={15} /> {isRestoring ? 'Restore...' : 'Restore Backup'}
                      <input type="file" accept="application/json,.json" onChange={handleRestoreBackup} disabled={isRestoring} />
                    </label>
                  </div>
                </div>

                <div className="reset-options-grid">
                  {[
                    { key: 'bookings', label: 'Jadwal Booking', desc: 'Semua data reservasi studio' },
                    { key: 'customers', label: 'Data Pelanggan', desc: 'Profil & histori pelanggan' },
                    { key: 'finances', label: 'Pembukuan Kas', desc: 'Seluruh catatan transaksi' },
                    { key: 'inventory', label: 'Inventaris', desc: 'Data alat & peralatan studio' },
                  ].map(({ key, label, desc }) => (
                    <label
                      key={key}
                      className={`reset-option-card ${resetOptions[key] ? 'selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        name={key}
                        checked={resetOptions[key]}
                        onChange={handleResetCheckboxChange}
                        className="reset-option-checkbox"
                      />
                      <div className="reset-option-info">
                        <span className="reset-option-label">{label}</span>
                        <span className="reset-option-desc">{desc}</span>
                      </div>
                      <div className={`reset-option-check ${resetOptions[key] ? 'checked' : ''}`}>
                        <CheckCircle2 size={18} />
                      </div>
                    </label>
                  ))}
                </div>

                {/* Select All */}
                <label className="reset-select-all">
                  <input
                    type="checkbox"
                    name="all"
                    checked={allSelected}
                    onChange={handleResetCheckboxChange}
                  />
                  <span>Pilih Semua Data</span>
                </label>

                {/* Confirm Steps */}
                {selectedCount > 0 && (
                  <div className={`reset-confirm-area step-${resetConfirmStep}`}>
                    {resetConfirmStep === 0 && (
                      <div className="reset-confirm-msg step0">
                        <AlertTriangle size={16} />
                        <span><strong>{selectedCount} kategori data</strong> dipilih untuk dihapus. Klik tombol untuk melanjutkan.</span>
                      </div>
                    )}
                    {resetConfirmStep === 1 && (
                      <div className="reset-confirm-msg step1">
                        <ShieldAlert size={16} />
                        <span>Apakah Anda <strong>benar-benar yakin</strong>? Data akan hilang <strong>permanen</strong>.</span>
                      </div>
                    )}
                    {resetConfirmStep === 2 && (
                      <div className="reset-confirm-msg step2">
                        <Trash2 size={16} />
                        <span>Klik sekali lagi untuk <strong>KONFIRMASI FINAL</strong> penghapusan data.</span>
                      </div>
                    )}

                    <button
                      type="button"
                      className={`btn-danger step-${resetConfirmStep}`}
                      onClick={handleResetSelected}
                      disabled={isResetting}
                    >
                      {isResetting ? (
                        <><RefreshCw size={15} className="spin" /> Menghapus...</>
                      ) : resetConfirmStep === 0 ? (
                        <><Trash2 size={15} /> Hapus {selectedCount} Data</>
                      ) : resetConfirmStep === 1 ? (
                        <><ShieldAlert size={15} /> Ya, Saya Yakin</>
                      ) : (
                        <><XCircle size={15} /> KONFIRMASI HAPUS PERMANEN</>
                      )}
                    </button>

                    {resetConfirmStep > 0 && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setResetConfirmStep(0)}
                      >
                        Batal
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          </motion.div>
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
};

export default SettingsPage;
