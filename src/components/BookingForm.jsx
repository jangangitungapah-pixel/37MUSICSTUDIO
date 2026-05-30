import { useState } from 'react';
import { useBookingStore } from '../store/useBookingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useCustomerStore } from '../store/useCustomerStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { format } from 'date-fns';
import { Music2, Mic, Wrench, User, Phone, Calendar, Clock, DollarSign, StickyNote, Star, AlertCircle, QrCode, Banknote, RefreshCw, Box } from 'lucide-react';
import { generatePaymentLink, checkPaymentStatus } from '../lib/paymentGateway';
import { useInventoryStore } from '../store/useInventoryStore';
import { buildRecurringBookings, hasBookingOverlap } from '../lib/bookingWorkflows';
import './BookingForm.css';

const BookingForm = ({ onClose, initialDate, initialHour }) => {
  const { bookings, addBooking, addBookings } = useBookingStore();
  const { pricePerHour, durationDiscounts = [], recordingSessions = [] } = useSettingsStore();
  const { customers, incrementBookingCount } = useCustomerStore();
  const { inventory } = useInventoryStore();
  const rentableInventory = inventory.filter(i => i.condition === 'Excellent' || i.condition === 'Good');

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [qrisData, setQrisData] = useState(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  
  const [rentedEquipment, setRentedEquipment] = useState([]);
  const [conflictSuggestion, setConflictSuggestion] = useState(null);
  const [recurring, setRecurring] = useState({ enabled: false, frequency: 'weekly', count: 4 });

  const today = format(new Date(), 'yyyy-MM-dd');

  const [formData, setFormData] = useState({
    type: 'booking',
    band: '',
    phone: '',
    date: initialDate || today,
    hour: initialHour || 10,
    duration: 2,
    status: 'pending',
    dpAmount: 0,
    depositDeadline: '',
    note: '',
    sessionId: recordingSessions.length > 0 ? recordingSessions[0].id : '',
    sessionPrice: recordingSessions.length > 0 ? recordingSessions[0].price : 0,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: (name === 'hour' || name === 'duration' || name === 'dpAmount') ? Number(value) : value
      };
      
      if (name === 'sessionId') {
        const session = recordingSessions.find(s => s.id === value);
        if (session) {
          newData.duration = session.hours;
          newData.sessionPrice = session.price;
        }
      }

      if (name === 'band') {
        const found = customers.find(c => c.name.toLowerCase() === value.toLowerCase());
        if (found && !prev.phone) newData.phone = found.phone;
      }
      if (name === 'status' && value !== 'dp') newData.dpAmount = 0;
      return newData;
    });
    setConflictSuggestion(null); // Clear suggestion on change
  };

  const handleEquipmentToggle = (itemId) => {
    setRentedEquipment(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const selectedCustomer = customers.find(c => c.name.toLowerCase() === formData.band.toLowerCase());
  const isVIP = selectedCustomer?.isVIP || false;
  
  const basePrice = formData.type === 'recording' ? formData.sessionPrice : (formData.duration * pricePerHour);
  
  // Calculate Duration Discount
  const applicableDiscount = formData.type === 'recording' ? null : durationDiscounts
    .filter(d => formData.duration >= d.hours)
    .sort((a, b) => b.discountAmount - a.discountAmount)[0];
  const durationDiscountAmount = applicableDiscount ? applicableDiscount.discountAmount : 0;
  
  const vipDiscountAmount = isVIP ? basePrice * 0.1 : 0;
  const discountAmount = vipDiscountAmount + durationDiscountAmount;
  
  const equipmentCost = rentedEquipment.reduce((total, itemId) => {
    const item = inventory.find(i => i.id === itemId);
    return total + (item?.rentalPrice || 0);
  }, 0);

  const totalPrice = basePrice + equipmentCost - discountAmount;
  const remaining = totalPrice - formData.dpAmount;
  const dpPercent = totalPrice > 0 ? Math.min(100, Math.round((formData.dpAmount / totalPrice) * 100)) : 0;

  const formatCurrency = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const checkOverlap = (d, h, dur) => {
    return hasBookingOverlap(bookings, { date: d, hour: h, duration: dur });
  };

  const findNearestAvailableSlot = (targetDate, targetHour, duration) => {
    // Check same day later hours
    for (let h = targetHour + 1; h <= 24 - duration; h++) {
      if (!checkOverlap(targetDate, h, duration)) return { date: targetDate, hour: h };
    }
    // Check same day earlier hours
    for (let h = targetHour - 1; h >= 10; h--) {
      if (!checkOverlap(targetDate, h, duration)) return { date: targetDate, hour: h };
    }
    // Check next day
    const nextDate = format(new Date(new Date(targetDate).getTime() + 86400000), 'yyyy-MM-dd');
    for (let h = 10; h <= 24 - duration; h++) {
      if (!checkOverlap(nextDate, h, duration)) return { date: nextDate, hour: h };
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (checkOverlap(formData.date, formData.hour, formData.duration)) {
      const suggestion = findNearestAvailableSlot(formData.date, formData.hour, formData.duration);
      if (suggestion) {
        setConflictSuggestion(suggestion);
        useNotificationStore.getState().addNotification({ title: 'Jadwal Bentrok!', message: 'Sistem menemukan jadwal kosong terdekat.', type: 'warning' });
      } else {
        useNotificationStore.getState().addNotification({ title: 'Jadwal Bentrok!', message: 'Jam yang dipilih menabrak jadwal lain.', type: 'error' });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const finalBookingData = {
        ...formData,
        rentedEquipment,
        equipmentCost,
        equipmentUsageHours: rentedEquipment.length * formData.duration,
      };

      if (formData.type === 'maintenance') {
        await addBooking({ ...finalBookingData, status: 'maintenance' });
      } else {
        const enrichedBooking = { ...finalBookingData, isVIP, discountAmount };
        if (recurring.enabled) {
          const recurringBookings = buildRecurringBookings(enrichedBooking, recurring);
          const conflict = recurringBookings.find((booking) => hasBookingOverlap(bookings, booking));
          if (conflict) {
            useNotificationStore.getState().addNotification({
              title: 'Booking berulang bentrok',
              message: `Bentrok pada ${conflict.date} jam ${conflict.hour}.00. Kurangi jumlah pengulangan atau ubah jadwal.`,
              type: 'error',
            });
            setIsSubmitting(false);
            return;
          }
          await addBookings(recurringBookings);
          await incrementBookingCount(formData.band, { phone: formData.phone, duration: formData.duration * recurringBookings.length, totalPrice: totalPrice * recurringBookings.length });
        } else {
          await addBooking(enrichedBooking);
          await incrementBookingCount(formData.band, { phone: formData.phone, duration: formData.duration, totalPrice });
        }
      }
      onClose();
      if (run && currentStep === 10) setTimeout(() => nextStep(), 100);
    } catch (error) {
      useNotificationStore.getState().addNotification({
        title: 'Gagal menyimpan booking',
        message: error.message || 'Coba lagi beberapa saat lagi.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateQRIS = async () => {
    const amountToPay = formData.status === 'dp' ? formData.dpAmount : totalPrice;
    if (amountToPay <= 0) {
      useNotificationStore.getState().addNotification({ title: 'Error', message: 'Nominal pembayaran tidak valid', type: 'error' });
      return;
    }
    setIsGeneratingQR(true);
    try {
      const res = await generatePaymentLink({ amount: amountToPay });
      setQrisData(res);
      setPaymentStatus('pending');
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!qrisData?.invoiceId) return;
    const res = await checkPaymentStatus(qrisData.invoiceId);
    setPaymentStatus(res.status);
    if (res.status === 'paid') {
      useNotificationStore.getState().addNotification({ title: 'Berhasil', message: 'Pembayaran QRIS berhasil dikonfirmasi.', type: 'success' });
      setFormData(prev => ({ ...prev, note: `${prev.note ? prev.note + '\n' : ''}[PAID VIA QRIS ${res.invoiceId}]` }));
    } else {
      useNotificationStore.getState().addNotification({ title: 'Pending', message: 'Pembayaran belum diterima.', type: 'warning' });
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Belum Bayar', color: '#FF9800' },
    { value: 'dp', label: 'DP', color: '#00f0ff' },
    { value: 'confirmed', label: 'Lunas', color: '#4CAF50' },
  ];

  return (
    <form className="booking-form" onSubmit={handleSubmit}>

      {/* Type Toggle */}
      <div className="bf-type-toggle">
        <button
          type="button"
          className={`bf-type-btn ${formData.type === 'booking' ? 'active booking' : ''}`}
          onClick={() => setFormData(p => ({ ...p, type: 'booking', band: '' }))}
        >
          <Music2 size={16} />
          Latihan
        </button>
        <button
          type="button"
          className={`bf-type-btn ${formData.type === 'recording' ? 'active recording' : ''}`}
          style={formData.type === 'recording' ? { background: 'rgba(255, 152, 0, 0.15)', color: '#FF9800', borderColor: 'rgba(255, 152, 0, 0.3)' } : {}}
          onClick={() => {
            const defaultSession = recordingSessions.length > 0 ? recordingSessions[0] : null;
            setFormData(p => ({ 
              ...p, 
              type: 'recording', 
              band: '',
              sessionId: defaultSession ? defaultSession.id : '',
              sessionPrice: defaultSession ? defaultSession.price : 0,
              duration: defaultSession ? defaultSession.hours : 6
            }));
          }}
        >
          <Mic size={16} />
          Recording
        </button>
        <button
          type="button"
          className={`bf-type-btn ${formData.type === 'maintenance' ? 'active maintenance' : ''}`}
          onClick={() => setFormData(p => ({ ...p, type: 'maintenance', band: 'Maintenance' }))}
        >
          <Wrench size={16} />
          Blokir Jadwal
        </button>
      </div>

      {/* Section: Identity */}
      <div className="bf-section">
        <div className="bf-section-title">
          <User size={13} />
          {formData.type === 'maintenance' ? 'Keterangan Blokir' : 'Identitas Penyewa'}
        </div>
        <div className="bf-row">
          <div className="bf-field">
            <label className="bf-label">
              {formData.type === 'maintenance' ? 'Judul Blokir' : 'Nama Band / Penyewa'}
              <span className="bf-required">*</span>
            </label>
            <div className="bf-input-wrap">
              <input
                type="text"
                name="band"
                list="customer-list"
                value={formData.band}
                onChange={handleChange}
                placeholder={formData.type === 'maintenance' ? 'contoh: Perbaikan Drum' : 'contoh: The Rockers'}
                required
                className="bf-input tour-input-band"
                autoFocus
                autoComplete="off"
              />
              {isVIP && (
                <span className="bf-vip-badge"><Star size={11} /> VIP</span>
              )}
            </div>
            {formData.type !== 'maintenance' && (
              <datalist id="customer-list">
                {customers.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            )}
          </div>

          {formData.type !== 'maintenance' && (
            <div className="bf-field">
              <label className="bf-label"><Phone size={12} /> No. HP / WhatsApp</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="08xxxxxxxxxx"
                className="bf-input tour-input-phone"
              />
            </div>
          )}
        </div>
      </div>

      {/* Section: Schedule */}
      <div className="bf-section">
        <div className="bf-section-title"><Calendar size={13} /> Jadwal</div>
        <div className="bf-row">
          <div className="bf-field">
            <label className="bf-label">Tanggal <span className="bf-required">*</span></label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="bf-input tour-input-date"
              required
            />
          </div>
          <div className="bf-field">
            <label className="bf-label"><Clock size={12} /> Jam Mulai <span className="bf-required">*</span></label>
            <select name="hour" value={formData.hour} onChange={handleChange} className="bf-input tour-input-hour">
              {Array.from({ length: 13 }, (_, i) => i + 10).map(h => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
          
          {formData.type === 'recording' ? (
            <div className="bf-field" style={{ flex: 1.5 }}>
              <label className="bf-label">Paket Sesi <span className="bf-required">*</span></label>
              <select name="sessionId" value={formData.sessionId} onChange={handleChange} className="bf-input" required>
                {recordingSessions.length === 0 ? (
                   <option value="">Belum ada sesi diatur</option>
                ) : (
                   recordingSessions.map(s => (
                     <option key={s.id} value={s.id}>{s.name} ({s.hours} Jam)</option>
                   ))
                )}
              </select>
            </div>
          ) : (
            <div className="bf-field">
              <label className="bf-label">Durasi <span className="bf-required">*</span></label>
              <div className="bf-duration-picker tour-input-duration">
                <button type="button" className="bf-dur-btn" onClick={() => setFormData(p => ({ ...p, duration: Math.max(1, p.duration - 1) }))} disabled={formData.duration <= 1}>−</button>
                <span className="bf-dur-val">{formData.duration} <small>jam</small></span>
                <button type="button" className="bf-dur-btn" onClick={() => setFormData(p => ({ ...p, duration: Math.min(13, p.duration + 1) }))} disabled={formData.duration >= 13}>+</button>
              </div>
            </div>
          )}
        </div>

        {/* Time Preview */}
        <div className="bf-time-preview">
          <Clock size={12} />
          {String(formData.hour).padStart(2, '0')}:00 – {String(Number(formData.hour) + formData.duration).padStart(2, '0')}:00
          <span className="bf-time-dot">·</span>
          {formData.duration} jam
        </div>

        {formData.type !== 'maintenance' && (
          <div className="bf-recurring-panel">
            <label className="bf-recurring-toggle">
              <input
                type="checkbox"
                checked={recurring.enabled}
                onChange={(event) => setRecurring((prev) => ({ ...prev, enabled: event.target.checked }))}
              />
              <span>Booking berulang</span>
            </label>
            {recurring.enabled && (
              <div className="bf-row">
                <div className="bf-field">
                  <label className="bf-label">Frekuensi</label>
                  <select
                    className="bf-input"
                    value={recurring.frequency}
                    onChange={(event) => setRecurring((prev) => ({ ...prev, frequency: event.target.value }))}
                  >
                    <option value="weekly">Mingguan</option>
                    <option value="monthly">Bulanan</option>
                  </select>
                </div>
                <div className="bf-field">
                  <label className="bf-label">Jumlah sesi</label>
                  <input
                    type="number"
                    min="2"
                    max="24"
                    value={recurring.count}
                    onChange={(event) => setRecurring((prev) => ({ ...prev, count: Number(event.target.value) }))}
                    className="bf-input"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Conflict Suggestion UI */}
        {conflictSuggestion && (
          <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFC107', fontSize: '0.85rem', fontWeight: 'bold' }}>
              <AlertCircle size={14} /> JADWAL BENTROK
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Slot {String(formData.hour).padStart(2, '0')}:00 sudah terisi. Rekomendasi jadwal terdekat yang kosong: 
              <strong style={{ color: 'var(--text-primary)' }}> {conflictSuggestion.date} pukul {String(conflictSuggestion.hour).padStart(2, '0')}:00</strong>.
            </div>
            <button type="button" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(255, 193, 7, 0.2)', color: '#FFC107', border: 'none' }} onClick={() => {
              setFormData(prev => ({ ...prev, date: conflictSuggestion.date, hour: conflictSuggestion.hour }));
              setConflictSuggestion(null);
            }}>
              Gunakan Saran Ini
            </button>
          </div>
        )}
      </div>

      {/* Section: Equipment Rental (booking only) */}
      {formData.type !== 'maintenance' && rentableInventory.length > 0 && (
        <div className="bf-section">
          <div className="bf-section-title"><Box size={13} /> Sewa Alat Tambahan</div>
          <div className="bf-equipment-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rentableInventory.map(item => (
              <label key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', cursor: 'pointer', border: rentedEquipment.includes(item.id) ? '1px solid var(--accent-cyan)' : '1px solid transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" checked={rentedEquipment.includes(item.id)} onChange={() => handleEquipmentToggle(item.id)} style={{ accentColor: 'var(--accent-cyan)' }} />
                  <div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.name}</div>
                    {item.brand && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.brand}</div>}
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
                  {item.rentalPrice > 0 ? `+${formatCurrency(item.rentalPrice)}` : 'Gratis'}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Section: Payment (booking only) */}
      {formData.type !== 'maintenance' && (
        <div className="bf-section">
          <div className="bf-section-title"><DollarSign size={13} /> Pembayaran</div>

          {/* Status Selector */}
          <div className="bf-status-grid tour-input-status">
            {statusOptions.map(opt => (
              <label key={opt.value} className={`bf-status-card ${formData.status === opt.value ? 'selected' : ''}`} style={{ '--status-color': opt.color }}>
                <input type="radio" name="status" value={opt.value} checked={formData.status === opt.value} onChange={handleChange} className="bf-status-radio" />
                <span className="bf-status-dot" style={{ background: opt.color }} />
                <span className="bf-status-label">{opt.label}</span>
              </label>
            ))}
          </div>

          {/* Price Summary Card */}
          <div className="bf-price-card">
            {isVIP && (
              <div className="bf-price-row vip">
                <span><Star size={11} /> Diskon VIP 10%</span>
                <span>−{formatCurrency(vipDiscountAmount)}</span>
              </div>
            )}
            {durationDiscountAmount > 0 && (
              <div className="bf-price-row vip">
                <span><AlertCircle size={11} /> Diskon Durasi (≥ {applicableDiscount?.hours} Jam)</span>
                <span>−{formatCurrency(durationDiscountAmount)}</span>
              </div>
            )}
            <div className="bf-price-row subtotal">
              <span>Subtotal {formData.type === 'recording' ? '(Paket Sesi)' : `(${formData.duration} jam)`}</span>
              <span>{formatCurrency(basePrice)}</span>
            </div>
            {equipmentCost > 0 && (
              <div className="bf-price-row">
                <span>Sewa Alat Tambahan</span>
                <span>{formatCurrency(equipmentCost)}</span>
              </div>
            )}
            {(isVIP || durationDiscountAmount > 0) && (
              <div className="bf-price-row after-disc">
                <span>Setelah Diskon</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
            )}
            <div className="bf-price-row total">
              <span>Total Tagihan</span>
              <span className="bf-total-val">{formatCurrency(totalPrice)}</span>
            </div>
          </div>

          {(formData.status === 'pending' || formData.status === 'dp') && (
            <div className="bf-deadline-field">
              <label className="bf-label">Deadline DP / Pelunasan</label>
              <input
                type="date"
                name="depositDeadline"
                value={formData.depositDeadline}
                min={today}
                onChange={handleChange}
                className="bf-input"
              />
              <span className="bf-field-hint">Dipakai oleh billing untuk menandai tagihan yang harus segera ditindaklanjuti.</span>
            </div>
          )}

          {/* DP Section */}
          {formData.status === 'dp' && (
            <div className="bf-dp-section tour-input-dp-section">
              <div className="bf-row">
                <div className="bf-field">
                  <label className="bf-label">Nominal DP <span className="bf-required">*</span></label>
                  <input
                    type="number"
                    name="dpAmount"
                    min="0"
                    max={totalPrice}
                    value={formData.dpAmount}
                    onChange={handleChange}
                    className="bf-input tour-input-dp"
                    placeholder="0"
                    required
                  />
                </div>
                <div className="bf-field">
                  <label className="bf-label">Sisa Tagihan</label>
                  <div className={`bf-input bf-remaining ${remaining > 0 ? 'unpaid' : 'paid'}`}>
                    {formatCurrency(remaining)}
                  </div>
                </div>
              </div>
              <div className="bf-dp-progress">
                <div className="bf-dp-bar" style={{ width: `${dpPercent}%` }} />
              </div>
              <div className="bf-dp-labels">
                <span>DP: {formatCurrency(formData.dpAmount)}</span>
                <span className="bf-dp-pct">{dpPercent}% terbayar</span>
                <span>Sisa: {formatCurrency(remaining)}</span>
              </div>
            </div>
          )}

          {formData.status === 'confirmed' && (
            <div className="bf-paid-notice">
              ✓ Pembayaran penuh {formatCurrency(totalPrice)} dicatat sebagai Lunas
            </div>
          )}

          {/* Payment Method Selector */}
          {(formData.status === 'dp' || formData.status === 'confirmed') && (
            <div className="bf-payment-method" style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                className={`bf-type-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cash')}
                style={{ flex: 1 }}
              >
                <Banknote size={16} /> Cash / Manual
              </button>
              <button 
                type="button" 
                className={`bf-type-btn ${paymentMethod === 'qris' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('qris')}
                style={{ flex: 1 }}
              >
                <QrCode size={16} /> QRIS Otomatis
              </button>
            </div>
          )}

          {/* QRIS Mock UI */}
          {paymentMethod === 'qris' && (formData.status === 'dp' || formData.status === 'confirmed') && (
            <div className="bf-qris-container" style={{ marginTop: '16px', padding: '16px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
              {!qrisData ? (
                <button type="button" className="btn-secondary" onClick={handleGenerateQRIS} disabled={isGeneratingQR} style={{ width: '100%' }}>
                  {isGeneratingQR ? 'Generating QRIS...' : 'Generate QRIS Code'}
                </button>
              ) : (
                <div className="bf-qris-display">
                  <div style={{ marginBottom: '12px' }}>
                    <QrCode size={120} color="var(--accent-cyan)" />
                  </div>
                  <div style={{ marginBottom: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Scan QRIS ini untuk membayar {formatCurrency(qrisData.amount)}<br/>
                    Status: <span style={{ color: paymentStatus === 'paid' ? '#4CAF50' : '#FF9800', fontWeight: 'bold' }}>{paymentStatus.toUpperCase()}</span>
                  </div>
                  <button type="button" className="btn-secondary" onClick={handleCheckStatus} disabled={paymentStatus === 'paid'} style={{ width: '100%' }}>
                    <RefreshCw size={16} style={{ marginRight: '8px' }} />
                    Cek Status Pembayaran
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Note */}
      <div className="bf-section">
        <div className="bf-field">
          <label className="bf-label"><StickyNote size={12} /> Catatan (opsional)</label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            placeholder="Catatan tambahan..."
            className="bf-input bf-textarea"
            rows="2"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="bf-actions">
        <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
        <button type="submit" className="btn-primary tour-btn-save" disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : formData.type === 'maintenance' ? 'Blokir Jadwal' : 'Simpan Booking'}
        </button>
      </div>
    </form>
  );
};

export default BookingForm;
