import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useBookingStore } from '../store/useBookingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  ChevronLeft, ChevronRight, LogOut, Music, Phone, MessageCircle,
  Plus, CalendarDays, Clock, XCircle, Info, X
} from 'lucide-react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, addDays, subDays,
  startOfWeek, endOfWeek, addWeeks, subWeeks
} from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useNotificationStore } from '../store/useNotificationStore';
import { AnimatePresence, motion } from 'framer-motion';
import './PublicCalendarPage.css';

const PublicCalendarPage = () => {
  const navigate = useNavigate();
  const { user, logout, loginGuest, isAuthLoaded, loading: authLoading } = useAuthStore();
  const { bookings } = useBookingStore();
  const { studioName, studioPhone, pricePerHour, durationDiscounts = [] } = useSettingsStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [publicAccessError, setPublicAccessError] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [viewMode, setViewMode]       = useState('week');
  const gridWrapperRef = useRef(null);

  // Booking modal state
  const [modalOpen, setModalOpen]     = useState(false);
  const [selectedSlot, setSelectedSlot] = useState({ dateStr: '', hour: 0 });
  const [bandName, setBandName]       = useState('');
  const [duration, setDuration]       = useState(2);

  useEffect(() => {
    if (!isAuthLoaded || user) return;

    let isActive = true;
    loginGuest().catch(() => {
      if (isActive) {
        setPublicAccessError('Jadwal publik belum bisa dimuat. Aktifkan Anonymous Auth di Firebase atau hubungi admin studio.');
      }
    });

    return () => {
      isActive = false;
    };
  }, [isAuthLoaded, user, loginGuest]);

  const handleExitPublic = async () => {
    if (user?.isAnonymous) {
      try {
        await logout();
      } catch {
        // Keep navigation responsive even if sign-out fails.
      }
    }
    navigate('/');
  };

  const handleGoToday = () => {
    setCurrentDate(new Date());
    setTimeout(() => {
      if (gridWrapperRef.current) {
        const todayCell = gridWrapperRef.current.querySelector('.pc-header-cell.today');
        if (todayCell) {
          const scrollPos = todayCell.offsetLeft - window.innerWidth / 2 + 45;
          gridWrapperRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
        }
      }
    }, 100);
  };

  const handlePrev = () => {
    if (viewMode === 'day')   setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };
  const handleNext = () => {
    if (viewMode === 'day')   setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  // Days array based on view mode
  const daysArray = useMemo(() => {
    if (viewMode === 'day') return [currentDate];
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end: endOfWeek(currentDate, { weekStartsOn: 0 }) });
    }
    return eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
  }, [currentDate, viewMode]);

  const startHour = 10;
  const endHour   = 23;
  const hoursArray = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const todayStr   = format(new Date(), 'yyyy-MM-dd');
  const nowHour    = new Date().getHours();

  const activeBookings = useMemo(() =>
    bookings.filter(b => b.status !== 'cancelled'), [bookings]);

  // Count available slots today
  const availableToday = useMemo(() => {
    return hoursArray.filter(h => {
      const isBooked = activeBookings.some(b => b.date === todayStr && h >= b.hour && h < b.hour + b.duration);
      return !isBooked && h >= nowHour;
    }).length;
  }, [activeBookings, todayStr, nowHour, hoursArray]);

  // Price estimate
  const basePriceEst = (pricePerHour || 120000) * duration;
  const applicableDiscount = durationDiscounts
    .filter(d => duration >= d.hours)
    .sort((a, b) => b.discountAmount - a.discountAmount)[0];
  const durationDiscountEst = applicableDiscount ? applicableDiscount.discountAmount : 0;
  const priceEst = basePriceEst - durationDiscountEst;

  // Open booking modal
  const openModal = (dateStr, hour) => {
    setSelectedSlot({ dateStr, hour });
    setBandName('');
    setDuration(2);
    setModalOpen(true);
  };

  // Send WA
  const sendWA = () => {
    if (!bandName.trim()) {
      useNotificationStore.getState().addNotification({ title: 'Nama Band kosong', message: 'Harap isi nama band Anda.', type: 'error' });
      return;
    }
    const isOverlap = activeBookings.some(b => {
      if (b.date !== selectedSlot.dateStr) return false;
      return Number(b.hour) < selectedSlot.hour + duration && selectedSlot.hour < Number(b.hour) + Number(b.duration);
    });
    if (isOverlap) {
      useNotificationStore.getState().addNotification({ title: 'Jadwal Bentrok', message: 'Durasi yang Anda pilih menabrak jadwal lain. Silakan kurangi durasi.', type: 'error' });
      return;
    }
    const dateLabel = format(new Date(selectedSlot.dateStr + 'T00:00:00'), 'dd MMMM yyyy', { locale: localeId });
    const endHourLabel = selectedSlot.hour + duration;
    const cleanMessage = `Halo Admin ${studioName}\n\nSaya dari band *${bandName.trim()}* ingin booking studio:\n\nTanggal : ${dateLabel}\nJam     : ${selectedSlot.hour}:00 - ${endHourLabel}:00\nDurasi  : ${duration} jam\n\nApakah slot tersebut masih tersedia?`;
    let phone = (studioPhone || '').replace(/\D/g, '');
    if (!phone) {
      useNotificationStore.getState().addNotification({ title: 'Nomor admin belum tersedia', message: 'Silakan hubungi admin studio secara manual.', type: 'error' });
      return;
    }
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(cleanMessage)}`, '_blank');
    setModalOpen(false);
  };

  const currentLabel = useMemo(() => {
    if (viewMode === 'day') return format(currentDate, 'EEEE, dd MMMM yyyy', { locale: localeId });
    if (viewMode === 'week') {
      const s = startOfWeek(currentDate, { weekStartsOn: 0 });
      const e = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(s, 'dd MMM')} - ${format(e, 'dd MMM yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy', { locale: localeId });
  }, [currentDate, viewMode]);

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const colWidth = viewMode === 'day' ? '220px' : viewMode === 'week' ? '110px' : '60px';
  const timeColWidth = isMobile ? '55px' : '100px';

  return (
    <div className="pc-page">
      {/* ── Hero Header ── */}
      <header className="pc-hero">
        <div className="pc-hero-bg" />
        <div className="pc-hero-inner">
          {/* Brand */}
          <div className="pc-hero-brand">
            <div className="pc-hero-logo">
              <Music size={22} color="#ff2a5f" />
            </div>
            <div>
              <h1 className="pc-hero-title">{studioName || '37 MUSIC STUDIO'}</h1>
              <p className="pc-hero-sub">Cek ketersediaan & booking via WhatsApp</p>
            </div>
          </div>

          {/* Right: info + logout */}
          <div className="pc-hero-right">
            {/* Today availability chip */}
            <div className="pc-avail-chip">
              <span className={`pc-avail-dot ${availableToday > 0 ? 'green' : 'red'}`} />
              <span>
                {availableToday > 0
                  ? `${availableToday} slot tersedia hari ini`
                  : 'Penuh untuk hari ini'}
              </span>
            </div>

            {studioPhone && (
              <a
                href={`https://wa.me/${studioPhone.replace(/\D/g,'').replace(/^0/,'62')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pc-wa-quick-btn"
              >
                <Phone size={15} />
                <span>Hubungi Kami</span>
              </a>
            )}

            <button className="pc-logout-btn" onClick={handleExitPublic} title="Kembali ke beranda">
              <LogOut size={16} />
              <span>Beranda</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Calendar Container ── */}
      <div className="pc-body">
        {(authLoading || publicAccessError) && (
          <div className={`pc-public-status glass-panel ${publicAccessError ? 'error' : ''}`}>
            {publicAccessError || 'Menyiapkan akses jadwal publik...'}
          </div>
        )}

        {/* Toolbar */}
        <div className="pc-toolbar glass-panel">
          {/* Navigation */}
          <div className="pc-nav">
            <button className="pc-icon-btn" onClick={handlePrev}><ChevronLeft size={20} /></button>
            <span className="pc-date-label">{currentLabel}</span>
            <button className="pc-icon-btn" onClick={handleNext}><ChevronRight size={20} /></button>
            <button className="pc-today-btn" onClick={handleGoToday}>Hari Ini</button>
          </div>

          <div className="pc-toolbar-right">
            {/* View switcher */}
            <div className="pc-view-switch">
              {['day', 'week', 'month'].map(v => (
                <button
                  key={v}
                  className={`pc-view-btn ${viewMode === v ? 'active' : ''}`}
                  onClick={() => setViewMode(v)}
                >
                  {v === 'day' ? 'Hari' : v === 'week' ? 'Minggu' : 'Bulan'}
                </button>
              ))}
            </div>
            {/* Legend */}
            <div className="pc-legend">
              <span className="pc-legend-item"><span className="pc-dot booked" />Terisi</span>
              <span className="pc-legend-item"><span className="pc-dot available" />Kosong</span>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="pc-grid-panel glass-panel">
          <div className="pc-grid-wrapper" ref={gridWrapperRef}>
            <div
              className="pc-grid"
              style={{ gridTemplateColumns: `${timeColWidth} repeat(${daysArray.length}, minmax(${colWidth}, 1fr))` }}
            >
              {/* Corner */}
              <div className="pc-corner"><span>JAM</span></div>

              {/* Day Headers */}
              {daysArray.map((day, idx) => {
                const isToday = format(day, 'yyyy-MM-dd') === todayStr;
                const dow = getDay(day);
                const isWknd = dow === 0 || dow === 6;
                return (
                  <div key={idx} className={`pc-header-cell ${isToday ? 'today' : ''} ${isWknd ? 'weekend' : ''}`}>
                    <span className="pc-day-name">{dayNames[dow]}</span>
                    <span className="pc-day-num">{format(day, 'd')}</span>
                    {isToday && <span className="pc-today-dot" />}
                  </div>
                );
              })}

              {/* Hour rows */}
              {hoursArray.map((hour, hIdx) => (
                <React.Fragment key={hour}>
                  {/* Time label */}
                  <div className={`pc-time-label ${hIdx % 2 === 0 ? 'even' : ''}`}>
                    <span>
                      {isMobile 
                        ? `${String(hour).padStart(2, '0')}.00` 
                        : `${String(hour).padStart(2, '0')}.00 - ${String(hour + 1).padStart(2, '0')}.00`}
                    </span>
                  </div>

                  {/* Day cells */}
                  {daysArray.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isToday = dateStr === todayStr;
                    const dow = getDay(day);
                    const isWknd = dow === 0 || dow === 6;

                    const booking = activeBookings.find(b => {
                      if (b.date !== dateStr) return false;
                      return hour >= b.hour && hour < b.hour + b.duration;
                    });

                    const isPast = dateStr < todayStr || (isToday && hour < nowHour);
                    const canBook = !booking && !isPast;
                    const isBlockStart = booking && hour === booking.hour;

                    const classes = [
                      'pc-cell',
                      hIdx % 2 === 0 ? 'even' : '',
                      isToday ? 'today-col' : '',
                      isWknd ? 'weekend-col' : '',
                      booking ? 'booked' : '',
                      booking && isBlockStart ? 'block-start' : '',
                      booking && hour === booking.hour + booking.duration - 1 ? 'block-end' : '',
                      canBook ? 'available' : '',
                      isPast && !booking ? 'past' : '',
                    ].filter(Boolean).join(' ');

                    return (
                      <div
                        key={`${dateStr}-${hour}`}
                        className={classes}
                        onClick={() => canBook && openModal(dateStr, hour)}
                      >
                        {booking && isBlockStart && (
                          <div className="pc-booked-tag">
                            <XCircle size={11} />
                            <span>TERISI</span>
                          </div>
                        )}
                        {canBook && (
                          <div className="pc-plus-icon">
                            <Plus size={14} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Booking Modal (Bottom-Sheet on mobile) ── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="pc-modal-overlay"
            onClick={() => setModalOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              className="pc-modal glass-panel"
              onClick={e => e.stopPropagation()}
              initial={{ y: 60, scale: 0.96, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 40, scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
            {/* Header */}
            <div className="pc-modal-header">
              <div className="pc-modal-header-info">
                <CalendarDays size={20} color="#00f0ff" />
                <div>
                  <h3>Pesan Studio</h3>
                  <p>
                    {selectedSlot.dateStr
                      ? format(new Date(selectedSlot.dateStr + 'T00:00:00'), 'EEEE, dd MMMM yyyy', { locale: localeId })
                      : ''}
                  </p>
                </div>
              </div>
              <button className="pc-modal-close" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Time chip */}
            <div className="pc-time-chip">
              <Clock size={14} />
              <span>
                {String(selectedSlot.hour).padStart(2,'0')}:00 -{' '}
                {String(selectedSlot.hour + duration).padStart(2,'0')}:00
                &nbsp;({duration} jam)
              </span>
            </div>

            {/* Form */}
            <div className="pc-modal-body">
              <div className="pc-form-group">
                <label>Nama Band / Artis</label>
                <input
                  type="text"
                  className="pc-form-input"
                  value={bandName}
                  onChange={e => setBandName(e.target.value)}
                  placeholder="Contoh: The Beatles"
                  autoFocus
                />
              </div>

              <div className="pc-form-group">
                <label>Durasi (Jam)</label>
                <div className="pc-duration-grid">
                  {[1,2,3,4,5].map(h => (
                    <button
                      key={h}
                      type="button"
                      className={`pc-dur-btn ${duration === h ? 'active' : ''}`}
                      onClick={() => setDuration(h)}
                    >
                      {h}j
                    </button>
                  ))}
                </div>
              </div>

              {/* Price estimate */}
              <div className="pc-price-estimate">
                <span className="pc-price-label">Estimasi harga</span>
                <div className="pc-price-value-container">
                  {durationDiscountEst > 0 && (
                    <div className="pc-price-discount-label">
                      Potongan Diskon: -{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(durationDiscountEst)}
                    </div>
                  )}
                  <span className="pc-price-value">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(priceEst)}
                  </span>
                </div>
              </div>

              {/* Info note */}
              <div className="pc-modal-note">
                <Info size={13} />
                <span>Klik tombol di bawah untuk mengirim permintaan booking ke WhatsApp admin. Booking akan dikonfirmasi oleh admin.</span>
              </div>

              <button className="pc-wa-send-btn" onClick={sendWA}>
                <MessageCircle size={20} />
                <span>Kirim ke WhatsApp Admin</span>
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicCalendarPage;
