import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useBookingStore } from '../store/useBookingStore';
import { useBookingRequestStore } from '../store/useBookingRequestStore';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  ChevronLeft, ChevronRight, LogOut, Phone, MessageCircle,
  Plus, CalendarDays, Clock, Info, X
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
  const { addRequest } = useBookingRequestStore();
  const { studioName, studioPhone, pricePerHour, durationDiscounts = [], operationalHours = { start: 10, end: 23 }, blockedDates = [] } = useSettingsStore();

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
  const [customerPhone, setCustomerPhone] = useState('');
  const [duration, setDuration]       = useState(2);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

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

  const startHour = operationalHours.start;
  const endHour   = operationalHours.end;
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
    setCustomerPhone('');
    setDuration(2);
    setModalOpen(true);
  };

  // Send WA
  const sendWA = async () => {
    if (!bandName.trim()) {
      useNotificationStore.getState().addNotification({ title: 'Nama Band kosong', message: 'Harap isi nama band Anda.', type: 'error' });
      return;
    }
    if (!customerPhone.trim()) {
      useNotificationStore.getState().addNotification({ title: 'Nomor WhatsApp kosong', message: 'Harap isi nomor yang bisa dihubungi admin.', type: 'error' });
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
    setIsSubmittingRequest(true);
    try {
      await addRequest({
        band: bandName.trim(),
        phone: customerPhone.trim(),
        date: selectedSlot.dateStr,
        hour: selectedSlot.hour,
        duration,
        estimatedPrice: priceEst,
        source: 'public-calendar',
      });
      useNotificationStore.getState().addNotification({
        title: 'Permintaan terkirim',
        message: 'Admin akan meninjau dan mengonfirmasi jadwal Anda.',
        type: 'success',
      });
    } catch (error) {
      useNotificationStore.getState().addNotification({
        title: 'Gagal mengirim request',
        message: error.message || 'Coba lagi beberapa saat lagi.',
        type: 'error',
      });
      setIsSubmittingRequest(false);
      return;
    }
    const dateLabel = format(new Date(selectedSlot.dateStr + 'T00:00:00'), 'dd MMMM yyyy', { locale: localeId });
    const endHourLabel = selectedSlot.hour + duration;
    const cleanMessage = `Halo Admin ${studioName}\n\nSaya dari band *${bandName.trim()}* ingin booking studio:\n\nTanggal : ${dateLabel}\nJam     : ${selectedSlot.hour}:00 - ${endHourLabel}:00\nDurasi  : ${duration} jam\nKontak  : ${customerPhone.trim()}\n\nSaya juga sudah mengirim request dari kalender publik.`;
    let phone = (studioPhone || '').replace(/\D/g, '');
    if (!phone) {
      useNotificationStore.getState().addNotification({ title: 'Request tersimpan', message: 'Nomor admin belum tersedia untuk WhatsApp otomatis.', type: 'warning' });
      setModalOpen(false);
      setIsSubmittingRequest(false);
      return;
    }
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(cleanMessage)}`, '_blank');
    setModalOpen(false);
    setIsSubmittingRequest(false);
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
  const colWidth = viewMode === 'day' ? '240px' : viewMode === 'week' ? '120px' : '70px';
  const timeColWidth = isMobile ? '60px' : '110px';

  return (
    <div className="pc-page">
      {/* ── Dynamic Hero Header ── */}
      <header className="pc-hero">
        <div className="pc-hero-bg">
          <div className="pc-hero-blob-1" />
          <div className="pc-hero-blob-2" />
        </div>
        
        <div className="pc-hero-inner">
          <div className="pc-hero-logo" style={{ background: 'transparent', boxShadow: 'none', border: 'none' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
          </div>
          <h1 className="pc-hero-title">{studioName || '37 MUSIC STUDIO'}</h1>
          <p className="pc-hero-sub">Cek ketersediaan jadwal secara real-time dan booking jadwal latihan atau rekaman band kamu dengan mudah.</p>

          <div className="pc-hero-actions">
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
                <Phone size={16} />
                <span>Chat Admin</span>
              </a>
            )}

            <button className="pc-logout-btn" onClick={handleExitPublic} title="Kembali ke beranda">
              <LogOut size={16} />
              <span>Kembali</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Calendar Container ── */}
      <div className="pc-body">
        {(authLoading || publicAccessError) && (
          <div className={`pc-public-status ${publicAccessError ? 'error' : ''}`}>
            {publicAccessError || 'Menyiapkan akses jadwal publik...'}
          </div>
        )}

        {/* Toolbar */}
        <div className="pc-toolbar">
          {/* Navigation */}
          <div className="pc-nav">
            <button className="pc-icon-btn" onClick={handlePrev}><ChevronLeft size={22} /></button>
            <span className="pc-date-label">{currentLabel}</span>
            <button className="pc-icon-btn" onClick={handleNext}><ChevronRight size={22} /></button>
            <button className="pc-today-btn" onClick={handleGoToday}>Hari Ini</button>
          </div>

          <div className="pc-toolbar-right">
            {/* Legend */}
            <div className="pc-legend">
              <div className="pc-legend-item"><span className="pc-dot booked" /> Terisi / Tutup</div>
              <div className="pc-legend-item"><span className="pc-dot available" /> Tersedia</div>
            </div>
            
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
          </div>
        </div>

        {/* Grid Panel */}
        <div className="pc-grid-panel">
          <div className="pc-grid-wrapper" ref={gridWrapperRef}>
            <div
              className="pc-grid"
              style={{ gridTemplateColumns: `${timeColWidth} repeat(${daysArray.length}, minmax(${colWidth}, 1fr))` }}
            >
              {/* Corner */}
              <div className="pc-corner"><span>WAKTU</span></div>

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
              {hoursArray.map((hour) => (
                <React.Fragment key={hour}>
                  {/* Time label */}
                  <div className="pc-time-label">
                    <span>
                      {isMobile 
                        ? `${String(hour).padStart(2, '0')}:00` 
                        : `${String(hour).padStart(2, '0')}:00 - ${String(hour + 1).padStart(2, '0')}:00`}
                    </span>
                  </div>

                  {/* Day cells */}
                  {daysArray.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isToday = dateStr === todayStr;
                    const dow = getDay(day);
                    const isWknd = dow === 0 || dow === 6;
                    const isBlocked = blockedDates.includes(dateStr);

                    const booking = activeBookings.find(b => {
                      if (b.date !== dateStr) return false;
                      return hour >= b.hour && hour < b.hour + b.duration;
                    });

                    const isPast = dateStr < todayStr || (isToday && hour < nowHour);
                    const canBook = !booking && !isPast && !isBlocked;
                    const isBlockStart = booking && hour === booking.hour;

                    const classes = [
                      'pc-cell',
                      isToday ? 'today-col' : '',
                      isWknd ? 'weekend-col' : '',
                      booking ? 'booked' : '',
                      booking && isBlockStart ? 'block-start' : '',
                      booking && hour === booking.hour + booking.duration - 1 ? 'block-end' : '',
                      canBook ? 'available' : '',
                      (isPast || isBlocked) && !booking ? 'past' : '',
                    ].filter(Boolean).join(' ');

                    return (
                      <div
                        key={`${dateStr}-${hour}`}
                        className={classes}
                        onClick={() => canBook && openModal(dateStr, hour)}
                      >
                        {isBlocked && hour === startHour + 2 && !booking && (
                          <div className="pc-booked-tag">TUTUP</div>
                        )}
                        {booking && isBlockStart && (
                          <div className="pc-booked-tag">TERISI</div>
                        )}
                        {canBook && (
                          <div className="pc-plus-icon">
                            <Plus size={18} strokeWidth={2.5} />
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

      {/* ── Premium Booking Modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="pc-modal-overlay"
            onClick={() => setModalOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="pc-modal"
              onClick={e => e.stopPropagation()}
              initial={{ y: 60, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div className="pc-modal-content">
                {/* Header */}
                <div className="pc-modal-header">
                  <div className="pc-modal-header-info">
                    <div className="pc-modal-header-icon">
                      <CalendarDays size={24} />
                    </div>
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
                    <X size={20} />
                  </button>
                </div>

                {/* Time chip */}
                <div className="pc-time-chip">
                  <Clock size={16} />
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
                    <label>No. WhatsApp</label>
                    <input
                      type="tel"
                      className="pc-form-input"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>

                  <div className="pc-form-group">
                    <label>Pilih Durasi</label>
                    <div className="pc-duration-grid">
                      {[1,2,3,4,5].map(h => (
                        <button
                          key={h}
                          type="button"
                          className={`pc-dur-btn ${duration === h ? 'active' : ''}`}
                          onClick={() => setDuration(h)}
                        >
                          {h} Jam
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price estimate */}
                  <div className="pc-price-estimate">
                    <span className="pc-price-label">Estimasi Harga</span>
                    <div className="pc-price-value-container">
                      {durationDiscountEst > 0 && (
                        <div className="pc-price-discount-label">
                          Diskon: -{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(durationDiscountEst)}
                        </div>
                      )}
                      <span className="pc-price-value">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(priceEst)}
                      </span>
                    </div>
                  </div>

                  {/* Info note */}
                  <div className="pc-modal-note">
                    <Info size={16} />
                    <span>Booking akan diajukan ke admin studio untuk ditinjau dan dikonfirmasi melalui pesan WhatsApp.</span>
                  </div>

                  <button className="pc-wa-send-btn" onClick={sendWA} disabled={isSubmittingRequest}>
                    <MessageCircle size={22} />
                    <span>{isSubmittingRequest ? 'Sedang Memproses...' : 'Kirim Booking via WhatsApp'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicCalendarPage;
