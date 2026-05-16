import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { Settings, Save, AlertCircle, Building, DollarSign, Database, Trash2 } from 'lucide-react';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
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
  
  // Data reset states
  const [isResetting, setIsResetting] = useState(false);
  const [resetOptions, setResetOptions] = useState({
    bookings: false,
    customers: false,
    finances: false,
    inventory: false
  });

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

  const handleResetCheckboxChange = (e) => {
    const { name, checked } = e.target;
    if (name === 'all') {
      setResetOptions({
        bookings: checked,
        customers: checked,
        finances: checked,
        inventory: checked
      });
    } else {
      setResetOptions(prev => ({ ...prev, [name]: checked }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    settings.updateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000); // Hide notification after 3s
  };

  const handleResetSelected = async () => {
    const selected = Object.keys(resetOptions).filter(k => resetOptions[k]);
    
    if (selected.length === 0) {
      alert('Pilih minimal satu jenis data yang ingin dihapus.');
      return;
    }

    const typeNames = selected.map(k => {
      if (k === 'bookings') return 'Jadwal Booking';
      if (k === 'customers') return 'Pelanggan';
      if (k === 'finances') return 'Pembukuan Kas';
      if (k === 'inventory') return 'Inventaris';
      return k;
    }).join(', ');

    if (window.confirm(`PERINGATAN: Anda akan menghapus data: ${typeNames}.\nData akan dihapus secara permanen dari server. Lanjutkan?`)) {
      if (window.confirm('KONFIRMASI TERAKHIR: Anda benar-benar yakin ingin menghapus data tersebut? Tindakan ini tidak dapat dibatalkan!')) {
        setIsResetting(true);
        try {
          const promises = [];
          
          for (const colName of selected) {
            const snapshot = await getDocs(collection(db, colName));
            snapshot.docs.forEach(d => {
              promises.push(deleteDoc(d.ref));
            });
          }
          
          await Promise.all(promises);
          
          // Clear localStorage as well just in case to avoid local cache ghosting
          localStorage.clear();
          
          alert('Data berhasil dihapus! Aplikasi akan dimuat ulang.');
          window.location.reload();
        } catch (error) {
          console.error("Error resetting data:", error);
          alert('Terjadi kesalahan saat menghapus data. Periksa koneksi internet Anda.');
          setIsResetting(false);
        }
      }
    }
  };

  const allSelected = resetOptions.bookings && resetOptions.customers && resetOptions.finances && resetOptions.inventory;

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
            <p className="section-desc">Pilih data spesifik yang ingin Anda hapus secara permanen dari server aplikasi.</p>
            
            <div className="reset-options" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>
                <input 
                  type="checkbox" 
                  name="all" 
                  checked={allSelected}
                  onChange={handleResetCheckboxChange}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-danger)' }}
                />
                Pilih Semua Data
              </label>
              
              <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.5rem 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    name="bookings" 
                    checked={resetOptions.bookings}
                    onChange={handleResetCheckboxChange}
                    style={{ width: '16px', height: '16px' }}
                  />
                  Daftar Jadwal (Booking)
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    name="customers" 
                    checked={resetOptions.customers}
                    onChange={handleResetCheckboxChange}
                    style={{ width: '16px', height: '16px' }}
                  />
                  Data Pelanggan (Customer)
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    name="finances" 
                    checked={resetOptions.finances}
                    onChange={handleResetCheckboxChange}
                    style={{ width: '16px', height: '16px' }}
                  />
                  Data Pembukuan (Kas)
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    name="inventory" 
                    checked={resetOptions.inventory}
                    onChange={handleResetCheckboxChange}
                    style={{ width: '16px', height: '16px' }}
                  />
                  Data Inventaris
                </label>
              </div>
            </div>

            <div className="settings-actions" style={{ marginTop: '1.5rem' }}>
              <button 
                type="button" 
                className="btn-danger" 
                onClick={handleResetSelected}
                disabled={isResetting || (!resetOptions.bookings && !resetOptions.customers && !resetOptions.finances && !resetOptions.inventory)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: isResetting ? 0.7 : 1 }}
              >
                <Trash2 size={16} /> 
                {isResetting ? 'Sedang Menghapus...' : 'Hapus Data Terpilih'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
