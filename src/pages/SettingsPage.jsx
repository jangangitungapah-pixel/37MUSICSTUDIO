import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  Settings, Save, Building2, Phone, MapPin, DollarSign,
  Bell, Database, Trash2, CheckCircle2, XCircle, ShieldAlert,
  ChevronRight, Music2, Sparkles, Lock, ToggleLeft, ToggleRight,
  AlertTriangle, RefreshCw
} from 'lucide-react';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './SettingsPage.css';

const SettingsPage = () => {
  const storeSettings = useSettingsStore();
  const [formData, setFormData] = useState({
    studioName: '',
    studioAddress: '',
    studioPhone: '',
    pricePerHour: 0
  });

  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [activeSection, setActiveSection] = useState('profile'); // tab navigation
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

  useEffect(() => {
    setFormData({
      studioName: storeSettings.studioName,
      studioAddress: storeSettings.studioAddress,
      studioPhone: storeSettings.studioPhone,
      pricePerHour: storeSettings.pricePerHour
    });
  }, [storeSettings.studioName, storeSettings.studioAddress, storeSettings.studioPhone, storeSettings.pricePerHour]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'pricePerHour' ? Number(value) : value
    }));
    if (saveStatus === 'saved') setSaveStatus('idle');
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

  const handleResetSelected = async () => {
    if (resetConfirmStep < 2) {
      setResetConfirmStep(prev => prev + 1);
      return;
    }
    setIsResetting(true);
    try {
      const selected = Object.keys(resetOptions).filter(k => resetOptions[k]);
      const promises = [];
      for (const colName of selected) {
        const snapshot = await getDocs(collection(db, colName));
        snapshot.docs.forEach(d => promises.push(deleteDoc(d.ref)));
      }
      await Promise.all(promises);
      localStorage.clear();
      alert('Data berhasil dihapus! Aplikasi akan dimuat ulang.');
      window.location.reload();
    } catch {
      alert('Terjadi kesalahan saat menghapus data.');
      setIsResetting(false);
      setResetConfirmStep(0);
    }
  };

  const handleRequestNotif = () => {
    Notification.requestPermission().then(perm => {
      setNotifPermission(perm);
    });
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const allSelected = Object.values(resetOptions).every(Boolean);

  const sections = [
    { id: 'profile', label: 'Profil Studio', icon: Building2 },
    { id: 'pricing', label: 'Tarif & Harga', icon: DollarSign },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'data', label: 'Manajemen Data', icon: Database },
  ];

  return (
    <div className="settings-page">
      {/* Page Header */}
      <header className="settings-header">
        <div className="settings-header-info">
          <div className="settings-header-icon">
            <Settings size={22} />
          </div>
          <div>
            <h2 className="page-title">Pengaturan</h2>
            <p className="page-subtitle">Konfigurasi sistem & preferensi aplikasi</p>
          </div>
        </div>
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
      </header>

      <div className="settings-layout">
        {/* Left Tab Navigation */}
        <nav className="settings-nav glass-panel">
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
              onClick={() => setActiveSection(id)}
            >
              <span className="settings-nav-icon"><Icon size={17} /></span>
              <span className="settings-nav-label">{label}</span>
              <ChevronRight size={14} className="settings-nav-chevron" />
            </button>
          ))}
        </nav>

        {/* Right Content */}
        <div className="settings-content-area">

          {/* === SECTION: PROFILE === */}
          {activeSection === 'profile' && (
            <div className="settings-panel glass-panel tour-settings-profile">
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
                {/* Studio Name */}
                <div className="settings-field">
                  <label className="settings-label">
                    <Music2 size={14} />
                    Nama Studio
                  </label>
                  <input
                    type="text"
                    name="studioName"
                    value={formData.studioName}
                    onChange={handleChange}
                    className="settings-input"
                    placeholder="Contoh: 37 Music Studio"
                    required
                  />
                  <span className="settings-hint">Nama ini akan muncul di semua dokumen & halaman publik</span>
                </div>

                {/* Phone */}
                <div className="settings-field">
                  <label className="settings-label">
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
                      className="settings-input with-prefix"
                      placeholder="81234567890"
                    />
                  </div>
                  <span className="settings-hint">Digunakan untuk tautan WhatsApp booking pelanggan</span>
                </div>

                {/* Address */}
                <div className="settings-field">
                  <label className="settings-label">
                    <MapPin size={14} />
                    Alamat Lengkap Studio
                  </label>
                  <textarea
                    name="studioAddress"
                    value={formData.studioAddress}
                    onChange={handleChange}
                    className="settings-input settings-textarea"
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
            <div className="settings-panel glass-panel tour-settings-rate">
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
                <div className="settings-field">
                  <label className="settings-label">
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
                      className="settings-input with-prefix"
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

                <div className="settings-info-box">
                  <AlertTriangle size={14} />
                  <span>Perubahan tarif hanya berlaku untuk booking baru. Booking yang sudah ada tidak berubah secara otomatis.</span>
                </div>
              </form>
            </div>
          )}

          {/* === SECTION: NOTIFICATIONS === */}
          {activeSection === 'notifications' && (
            <div className="settings-panel glass-panel">
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
                    <div className="notif-toggle active">
                      <ToggleRight size={28} color="var(--accent-cyan)" />
                    </div>
                  ) : notifPermission === 'default' ? (
                    <button className="btn-primary" onClick={handleRequestNotif} type="button">
                      Izinkan
                    </button>
                  ) : (
                    <div className="notif-toggle">
                      <ToggleLeft size={28} color="var(--text-muted)" />
                    </div>
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
            <div className="settings-panel glass-panel danger-zone tour-settings-danger">
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
                      className={`btn-danger-action step-${resetConfirmStep}`}
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
                        className="btn-cancel-reset"
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

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
