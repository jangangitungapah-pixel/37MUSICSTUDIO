import React, { useState } from 'react';
import { useBookingStore } from '../store/useBookingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useCustomerStore } from '../store/useCustomerStore';
import { format } from 'date-fns';
import './BookingForm.css';

const BookingForm = ({ onClose, initialDate, initialHour }) => {
  const { addBooking } = useBookingStore();
  const { pricePerHour } = useSettingsStore();
  const { customers, incrementBookingCount } = useCustomerStore();
  
  const today = format(new Date(), 'yyyy-MM-dd');

  const [formData, setFormData] = useState({
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

  const handleSubmit = (e) => {
    e.preventDefault();
    addBooking(formData);
    incrementBookingCount(formData.band, {
      phone: formData.phone,
      duration: formData.duration,
      totalPrice: formData.duration * pricePerHour
    });
    onClose();
  };

  const totalPrice = formData.duration * pricePerHour;
  const remaining = totalPrice - formData.dpAmount;
  const formatCurrency = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label>Nama Band / Penyewa <span className="required">*</span></label>
          <input 
            type="text" 
            name="band" 
            list="customer-list"
            value={formData.band} 
            onChange={handleChange} 
            placeholder="contoh: The Rockers" 
            required 
            className="form-input"
            autoFocus
            autoComplete="off"
          />
          <datalist id="customer-list">
            {customers.map(c => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>
        <div className="form-group">
          <label>No. HP / WhatsApp</label>
          <input 
            type="tel" 
            name="phone" 
            value={formData.phone} 
            onChange={handleChange} 
            placeholder="08xxxxxxxxxx" 
            className="form-input"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Tanggal Booking <span className="required">*</span></label>
          <input 
            type="date" 
            name="date" 
            value={formData.date} 
            onChange={handleChange} 
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label>Status Pembayaran</label>
          <select name="status" value={formData.status} onChange={handleChange} className="form-input">
            <option value="pending">Belum Bayar</option>
            <option value="dp">DP (Down Payment)</option>
            <option value="confirmed">Lunas</option>
          </select>
        </div>
      </div>

      <div className="form-row form-row-3">
        <div className="form-group">
          <label>Jam Mulai <span className="required">*</span></label>
          <select name="hour" value={formData.hour} onChange={handleChange} className="form-input">
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
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label>Total Harga</label>
          <div className="price-display">
            {formatCurrency(totalPrice)}
          </div>
        </div>
      </div>

      {/* DP Amount Section - only visible when status is 'dp' */}
      {formData.status === 'dp' && (
        <div className="dp-section">
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
                className="form-input"
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
        <button type="submit" className="btn-primary">Simpan Booking</button>
      </div>
    </form>
  );
};

export default BookingForm;
