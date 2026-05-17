import React, { useState } from 'react';
import { useBookingStore } from '../store/useBookingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useCustomerStore } from '../store/useCustomerStore';
import { useTourStore } from '../store/useTourStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { format } from 'date-fns';
import './BookingForm.css';

const BookingForm = ({ onClose, initialDate, initialHour }) => {
  const { bookings, addBooking } = useBookingStore();
  const { pricePerHour } = useSettingsStore();
  const { customers, incrementBookingCount } = useCustomerStore();
  const { run, currentStep, nextStep } = useTourStore();
  
  const today = format(new Date(), 'yyyy-MM-dd');

  const [formData, setFormData] = useState({
    type: 'booking', // 'booking' or 'maintenance'
    band: '',
    phone: '',
    date: initialDate || today,
    hour: initialHour || 10,
    duration: 2,
    status: 'pending',
    dpAmount: 0,
    note: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { 
        ...prev, 
        [name]: (name === 'hour' || name === 'duration' || name === 'dpAmount') ? Number(value) : value 
      };
      
      // Auto-fill phone if band name matches an existing customer
      if (name === 'band') {
        const foundCustomer = customers.find(c => c.name.toLowerCase() === value.toLowerCase());
        if (foundCustomer && !prev.phone) {
          newData.phone = foundCustomer.phone;
        }
      }

      // Reset dpAmount when status changes away from 'dp'
      if (name === 'status' && value !== 'dp') {
        newData.dpAmount = 0;
      }
      
      return newData;
    });
  };

  const selectedCustomer = customers.find(c => c.name.toLowerCase() === formData.band.toLowerCase());
  const isVIP = selectedCustomer?.isVIP || false;

  const basePrice = formData.duration * pricePerHour;
  const discountAmount = isVIP ? basePrice * 0.1 : 0;
  const totalPrice = basePrice - discountAmount;
  const remaining = totalPrice - formData.dpAmount;
  const formatCurrency = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const isOverlap = bookings.some(b => {
      if (b.date !== formData.date) return false;
      const bHour = Number(b.hour);
      const bDur = Number(b.duration);
      const formHour = Number(formData.hour);
      const formDur = Number(formData.duration);
      return (bHour < formHour + formDur) && (formHour < bHour + bDur);
    });
    
    if (isOverlap) {
      const { addNotification } = useNotificationStore.getState();
      addNotification({ 
        title: 'Jadwal Bentrok!', 
        message: 'Gagal menyimpan. Jam yang Anda pilih menabrak jadwal band lain.', 
        type: 'error' 
      });
      return;
    }

    if (formData.type === 'maintenance') {
      addBooking({ 
        ...formData,
        status: 'maintenance'
      });
    } else {
      addBooking({ ...formData, isVIP, discountAmount });
      incrementBookingCount(formData.band, {
        phone: formData.phone,
        duration: formData.duration,
        totalPrice: totalPrice
      });
    }
    
    onClose();

    if (run && currentStep === 10) {
      setTimeout(() => nextStep(), 100);
    }
  };

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <div className="type-toggle-container" style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '10px' }}>
        <button 
          type="button"
          className={`toggle-btn ${formData.type === 'booking' ? 'active' : ''}`}
          onClick={() => setFormData(p => ({ ...p, type: 'booking', band: '' }))}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: formData.type === 'booking' ? 'var(--bg-surface)' : 'transparent', color: formData.type === 'booking' ? 'var(--accent-cyan)' : 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: formData.type === 'booking' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none' }}
        >
          Sewa Studio
        </button>
        <button 
          type="button"
          className={`toggle-btn ${formData.type === 'maintenance' ? 'active' : ''}`}
          onClick={() => setFormData(p => ({ ...p, type: 'maintenance', band: 'Maintenance' }))}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: formData.type === 'maintenance' ? 'var(--bg-surface)' : 'transparent', color: formData.type === 'maintenance' ? 'var(--accent-pink)' : 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: formData.type === 'maintenance' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none' }}
        >
          Blokir Jadwal (Maintenance)
        </button>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>{formData.type === 'maintenance' ? 'Judul / Keterangan' : 'Nama Band / Penyewa'} <span className="required">*</span></label>
          <input 
            type="text" 
            name="band" 
            list="customer-list"
            value={formData.band} 
            onChange={handleChange} 
            placeholder={formData.type === 'maintenance' ? "contoh: Perbaikan Drum" : "contoh: The Rockers"} 
            required 
            className="form-input tour-input-band"
            autoFocus
            autoComplete="off"
          />
          {formData.type === 'booking' && (
            <datalist id="customer-list">
              {customers.map(c => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          )}
        </div>
        {formData.type === 'booking' && (
          <div className="form-group">
            <label>No. HP / WhatsApp</label>
            <input 
              type="tel" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              placeholder="08xxxxxxxxxx" 
              className="form-input tour-input-phone"
            />
          </div>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Tanggal {formData.type === 'booking' ? 'Booking' : ''} <span className="required">*</span></label>
          <input 
            type="date" 
            name="date" 
            value={formData.date} 
            onChange={handleChange} 
            className="form-input tour-input-date"
            required
          />
        </div>
        {formData.type === 'booking' && (
          <div className="form-group">
            <label>Status Pembayaran</label>
            <select name="status" value={formData.status} onChange={handleChange} className="form-input tour-input-status">
              <option value="pending">Belum Bayar</option>
              <option value="dp">DP (Down Payment)</option>
              <option value="confirmed">Lunas</option>
            </select>
          </div>
        )}
      </div>

      <div className="form-row form-row-3">
        <div className="form-group">
          <label>Jam Mulai <span className="required">*</span></label>
          <select name="hour" value={formData.hour} onChange={handleChange} className="form-input tour-input-hour">
            {Array.from({ length: 13 }).map((_, i) => {
              const h = i + 10; // 10:00 to 22:00
              return <option key={h} value={h}>{String(h).padStart(2, '0')}.00</option>
            })}
          </select>
        </div>
        <div className="form-group">
          <label>Durasi (Jam) <span className="required">*</span></label>
          <input 
            type="number" 
            name="duration" 
            min="1" 
            max="12" 
            value={formData.duration} 
            onChange={handleChange} 
            className="form-input tour-input-duration"
            required
          />
        </div>
        {formData.type === 'booking' && (
          <div className="form-group">
            <label>Total Harga</label>
            <div className="price-display">
              {formatCurrency(totalPrice)}
              {isVIP && (
                <span style={{ fontSize: '0.75rem', background: '#FFC107', color: '#000', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', fontWeight: 'bold' }}>
                  VIP Diskon 10%
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* DP Amount Section - only visible when status is 'dp' */}
      {formData.status === 'dp' && (
        <div className="dp-section tour-input-dp-section">
          <div className="form-row">
            <div className="form-group">
              <label>Nominal DP yang Dibayar <span className="required">*</span></label>
              <input 
                type="number" 
                name="dpAmount" 
                min="0" 
                max={totalPrice}
                value={formData.dpAmount} 
                onChange={handleChange} 
                className="form-input tour-input-dp"
                placeholder="Masukkan nominal DP..."
                required
              />
            </div>
            <div className="form-group">
              <label>Sisa Tagihan</label>
              <div className={`price-display remaining ${remaining > 0 ? 'has-balance' : 'paid-off'}`}>
                {formatCurrency(remaining)}
              </div>
            </div>
          </div>
          <div className="dp-summary">
            <span>Total: <strong>{formatCurrency(totalPrice)}</strong></span>
            <span>DP: <strong className="dp-paid">{formatCurrency(formData.dpAmount)}</strong></span>
            <span>Sisa: <strong className="dp-remaining">{formatCurrency(remaining)}</strong></span>
          </div>
        </div>
      )}

      <div className="form-group">
        <label>Catatan</label>
        <textarea 
          name="note" 
          value={formData.note} 
          onChange={handleChange} 
          placeholder="Catatan tambahan (opsional)..." 
          className="form-input form-textarea"
          rows="2"
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
        <button type="submit" className="btn-primary tour-btn-save">Simpan Booking</button>
      </div>
    </form>
  );
};

export default BookingForm;
