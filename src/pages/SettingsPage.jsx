import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { Settings, Save, AlertCircle, Building, DollarSign, Database } from 'lucide-react';
import './SettingsPage.css';

const SettingsPage = () => {
  const settings = useSettingsStore();
  const [formData, setFormData] = useState({
    studioName: '',
    studioAddress: '',
    studioPhone: '',
    pricePerHour: 0
  });
  
  const [isSaved, setIsSaved] = useState(false);

  // Initialize form with current settings
  useEffect(() => {
    setFormData({
      studioName: settings.studioName,
      studioAddress: settings.studioAddress,
      studioPhone: settings.studioPhone,
      pricePerHour: settings.pricePerHour
    });
  }, [settings.studioName, settings.studioAddress, settings.studioPhone, settings.pricePerHour]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'pricePerHour' ? Number(value) : value
    }));
    setIsSaved(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    settings.updateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000); // Hide notification after 3s
  };

  const handleResetData = () => {
    if (window.confirm('PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data booking, kas, pelanggan, dan inventaris? Tindakan ini tidak dapat dibatalkan.')) {
      alert('Fitur Reset Data dinonaktifkan dalam mode Demo.');
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <h2>Pengaturan Sistem</h2>
          <p className="subtitle">Konfigurasi profil studio, tarif sewa, dan preferensi aplikasi</p>
        </div>
        <button className="btn-primary" onClick={handleSubmit}>
          <Save size={16} /> Simpan Pengaturan
        </button>
      </div>

      {isSaved && (
        <div className="settings-alert success">
          <AlertCircle size={16} />
          Pengaturan berhasil disimpan dan langsung diterapkan ke seluruh modul.
        </div>
      )}

      <div className="settings-content">
        <form className="settings-form" onSubmit={handleSubmit} id="settings-form">
          
          {/* Section 1: Profil Studio */}
          <div className="settings-section glass-panel">
            <div className="settings-section-header">
              <Building size={20} />
              <h3>Profil & Identitas Studio</h3>
            </div>
            <p className="section-desc">Informasi ini akan ditampilkan pada kop surat Nota/Invoice digital pelanggan.</p>
            
            <div className="settings-grid">
              <div className="form-group full-width">
                <label>Nama Studio</label>
                <input 
                  type="text" 
                  name="studioName" 
                  value={formData.studioName} 
                  onChange={handleChange} 
                  className="form-input" 
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Nomor Telepon / WhatsApp</label>
                <input 
                  type="text" 
                  name="studioPhone" 
                  value={formData.studioPhone} 
                  onChange={handleChange} 
                  className="form-input" 
                />
              </div>

              <div className="form-group full-width">
                <label>Alamat Lengkap</label>
                <textarea 
                  name="studioAddress" 
                  value={formData.studioAddress} 
                  onChange={handleChange} 
                  className="form-input form-textarea" 
                  rows="2"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Konfigurasi Tarif */}
          <div className="settings-section glass-panel">
            <div className="settings-section-header">
              <DollarSign size={20} />
              <h3>Konfigurasi Tarif & Keuangan</h3>
            </div>
            <p className="section-desc">Atur standar harga sewa. Perubahan ini akan memengaruhi kalkulasi *booking* baru dan kalkulasi laporan statistik berjalan.</p>
            
            <div className="settings-grid">
              <div className="form-group">
                <label>Tarif Sewa per Jam (Rp)</label>
                <input 
                  type="number" 
                  name="pricePerHour" 
                  value={formData.pricePerHour} 
                  onChange={handleChange} 
                  className="form-input" 
                  min="0"
                  step="5000"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Data Management */}
          <div className="settings-section glass-panel danger-zone">
            <div className="settings-section-header">
              <Database size={20} />
              <h3>Manajemen Data (Danger Zone)</h3>
            </div>
            <p className="section-desc">Pengaturan tingkat lanjut untuk database lokal aplikasi.</p>
            
            <div className="settings-actions">
              <button type="button" className="btn-danger" onClick={handleResetData}>
                Reset Semua Data Aplikasi
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
