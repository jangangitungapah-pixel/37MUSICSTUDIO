import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useBookingStore } from '../store/useBookingStore';
import { useBookingRequestStore } from '../store/useBookingRequestStore';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  ChevronLeft, ChevronRight, LogOut, Phone, MessageCircle,
  Plus, CalendarDays, Clock, Info, X, Moon, Sun, Headphones, ShieldCheck
} from 'lucide-react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, addDays, subDays,
  startOfWeek, endOfWeek, addWeeks, subWeeks
} from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useNotificationStore } from '../store/useNotificationStore';
import { useThemeStore } from '../store/useThemeStore';
import { AnimatePresence, motion } from 'framer-motion';
import { modalPreset, overlayVariants } from '../animations';
import MotionSection from '../components/animation/MotionSection';
import { useGalleryStore } from '../store/useGalleryStore';
import './PublicCalendarPage.css';

const getPublicPhotoCaption = (photo, index = 0) => {
  const rawCaption = String(photo?.caption || '').trim();
  const looksLikeFileName = /\d{6,}/.test(rawCaption) || rawCaption.split(/\s+/).length > 5;

  if (!rawCaption || rawCaption.length > 48 || looksLikeFileName) {
    return `Studio angle ${String(index + 1).padStart(2, '0')}`;
  }

  return rawCaption;
};

const PublicCalendarPage = () => {
  const navigate = useNavigate();
  const { user, logout, loginGuest, isAuthLoaded, loading: authLoading } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { bookings } = useBookingStore();
  const { addRequest } = useBookingRequestStore();
  const { studioName, studioPhone, pricePerHour, durationDiscounts = [], operationalHours = { start: 10, end: 23 }, blockedDates = [] } = useSettingsStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [publicAccessError, setPublicAccessError] = useState('');
  const { gallery } = useGalleryStore();
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  
  const customerPhotos = useMemo(() => {
    return gallery.filter(photo => photo.showToCustomer);
  }, [gallery]);

  const heroPhoto = useMemo(() => {
    return customerPhotos.find(photo => photo.url) ||
      gallery.find(photo => photo.showOnLandingPage && photo.url) || {
        url: '/studio-hero.webp',
        caption: '37 Music Studio private room',
      };
  }, [customerPhotos, gallery]);

  const featuredPhotos = useMemo(() => {
    const photos = customerPhotos.filter(photo => photo.url);
    return photos.length > 0 ? photos.slice(0, 8) : [heroPhoto];
  }, [customerPhotos, heroPhoto]);

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
  const [formErrors, setFormErrors] = useState({});
  const lastSlotButtonRef = useRef(null);

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
  const formattedRate = new Intl.NumberFormat('id-ID').format(pricePerHour || 120000);
  const operatingLabel = `${String(startHour).padStart(2, '0')}.00-${String(endHour).padStart(2, '0')}.00`;

  const closeModal = () => {
    setModalOpen(false);
    setIsSubmittingRequest(false);
    setTimeout(() => lastSlotButtonRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (!modalOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setModalOpen(false);
        setIsSubmittingRequest(false);
        setTimeout(() => lastSlotButtonRef.current?.focus(), 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

  // Open booking modal
  const openModal = (dateStr, hour, triggerElement) => {
    lastSlotButtonRef.current = triggerElement || null;
    setSelectedSlot({ dateStr, hour });
    setBandName('');
    setCustomerPhone('');
    setDuration(2);
    setFormErrors({});
    setModalOpen(true);
  };

  // Send WA
  const sendWA = async () => {
    const nextErrors = {};

    if (!bandName.trim()) {
      nextErrors.bandName = 'Nama band atau artis wajib diisi.';
      useNotificationStore.getState().addNotification({ title: 'Nama Band kosong', message: 'Harap isi nama band Anda.', type: 'error' });
    }
    if (!customerPhone.trim()) {
      nextErrors.customerPhone = 'Nomor WhatsApp wajib diisi.';
      useNotificationStore.getState().addNotification({ title: 'Nomor WhatsApp kosong', message: 'Harap isi nomor yang bisa dihubungi admin.', type: 'error' });
    }
    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setFormErrors({});
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
      closeModal();
      return;
    }
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(cleanMessage)}`, '_blank');
    closeModal();
  };

  const currentLabel = useMemo(() => {
    if (viewMode === 'day') return format(currentDate, 'EEEE, dd MMMM yyyy', { locale: localeId });
    if (viewMode === 'week') {
      const s = startOfWeek(currentDate, { weekStartsOn: 0 });
      const e = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(s, 'dd MMM', { locale: localeId })} - ${format(e, 'dd MMM yyyy', { locale: localeId })}`;
    }
    return format(currentDate, 'MMMM yyyy', { locale: localeId });
  }, [currentDate, viewMode]);

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const colWidth = viewMode === 'day' ? '240px' : viewMode === 'week' ? '120px' : '70px';
  const timeColWidth = isMobile ? '60px' : '110px';

  return (
    <div className="pc-page">
      {/* ── Dynamic Hero Header ── */}
      <MotionSection direction="down" className="pc-hero" as="header">
        <div className="pc-hero-media" aria-hidden="true">
          <img src={heroPhoto.url} alt="" />
          <div className="pc-hero-scrim" />
        </div>
        <div className="pc-topbar">
          <button className="pc-brand-btn" type="button" onClick={handleExitPublic} aria-label="Kembali ke beranda">
            <span className="pc-brand-mark" aria-hidden="true">
              <img src="/logo.svg" alt="" />
            </span>
            <span>{studioName || '37 MUSIC STUDIO'}</span>
          </button>

          <div className="pc-topbar-actions">
            <button
              type="button"
              className="pc-theme-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              aria-label={theme === 'dark' ? 'Aktifkan Light Mode' : 'Aktifkan Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="pc-exit-btn" type="button" onClick={handleExitPublic}>
              <LogOut size={16} />
              <span>Kembali</span>
            </button>
          </div>
        </div>

        <div className="pc-hero-inner">
          <div className="pc-hero-kicker">
            <CalendarDays size={17} />
            <span>Live public booking calendar</span>
          </div>
          <h1 className="pc-hero-title">{studioName || '37 MUSIC STUDIO'}</h1>
          <p className="pc-hero-sub">Pilih slot kosong, ajukan sesi, lalu lanjut konfirmasi langsung lewat WhatsApp. Dibuat ringkas untuk booking dari HP.</p>

          <div className="pc-hero-actions">
            <a className="pc-primary-link" href="#pc-booking-calendar">
              <span>Cek Slot</span>
              <ChevronRight size={18} />
            </a>

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
          </div>

          <div className="pc-hero-stats" aria-label="Ringkasan studio">
            <div className="pc-avail-chip">
              <span className={`pc-avail-dot ${availableToday > 0 ? 'green' : 'red'}`} />
              <span>
                {availableToday > 0
                  ? `${availableToday} slot tersedia hari ini`
                  : 'Penuh untuk hari ini'}
              </span>
            </div>
            <div>
              <Clock size={16} />
              <span>{operatingLabel}</span>
            </div>
            <div>
              <Headphones size={16} />
              <span>Operator ready</span>
            </div>
            <div>
              <ShieldCheck size={16} />
              <span>Rp {formattedRate}/jam</span>
            </div>
          </div>
        </div>

        <div className="pc-hero-caption">
          <span>{getPublicPhotoCaption(heroPhoto)}</span>
        </div>
      </MotionSection>

      {/* ── Calendar Container ── */}
      <div className="pc-body">
        {(authLoading || publicAccessError) && (
          <div className={`pc-public-status ${publicAccessError ? 'error' : ''}`}>
            {publicAccessError || 'Menyiapkan akses jadwal publik...'}
          </div>
        )}

        <MotionSection delay={0.05} className="pc-calendar-intro">
          <div>
            <span>Booking board</span>
            <h2>Pilih jam kosong yang paling pas.</h2>
          </div>
          <p>Slot hijau bisa langsung dipilih. Slot merah atau redup berarti sudah terisi, tutup, atau sudah lewat.</p>
        </MotionSection>

        <MotionSection delay={0.1} className="pc-toolbar">
          {/* Navigation */}
          <div className="pc-nav">
            <button className="icon-btn" type="button" onClick={handlePrev} aria-label="Lihat periode sebelumnya" title="Sebelumnya"><ChevronLeft size={22} /></button>
            <span className="pc-date-label">{currentLabel}</span>
            <button className="icon-btn" type="button" onClick={handleNext} aria-label="Lihat periode berikutnya" title="Berikutnya"><ChevronRight size={22} /></button>
            <button className="btn-secondary" type="button" onClick={handleGoToday}>Hari Ini</button>
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
                  type="button"
                  aria-pressed={viewMode === v}
                  onClick={() => setViewMode(v)}
                >
                  {v === 'day' ? 'Hari' : v === 'week' ? 'Minggu' : 'Bulan'}
                </button>
              ))}
            </div>
          </div>
        </MotionSection>

        {/* Grid Panel */}
        <div className="pc-grid-panel" id="pc-booking-calendar">
          <div className="pc-scroll-hint" aria-hidden="true">Geser kalender untuk melihat tanggal lainnya</div>
          <div className="pc-grid-wrapper" ref={gridWrapperRef}>
            <div
              className="pc-grid"
              role="grid"
              aria-label="Kalender ketersediaan studio"
              style={{ gridTemplateColumns: `${timeColWidth} repeat(${daysArray.length}, minmax(${colWidth}, 1fr))` }}
            >
              {/* Corner */}
              <div className="pc-corner" role="columnheader"><span>WAKTU</span></div>

              {/* Day Headers */}
              {daysArray.map((day, idx) => {
                const isToday = format(day, 'yyyy-MM-dd') === todayStr;
                const dow = getDay(day);
                const isWknd = dow === 0 || dow === 6;
                return (
                  <div key={idx} className={`pc-header-cell ${isToday ? 'today' : ''} ${isWknd ? 'weekend' : ''}`} role="columnheader">
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
                  <div className="pc-time-label" role="rowheader">
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
                    const dayLabel = format(day, 'EEEE, dd MMMM yyyy', { locale: localeId });
                    const timeLabel = `${String(hour).padStart(2, '0')}:00 - ${String(hour + 1).padStart(2, '0')}:00`;

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

                    const cellContent = (
                      <>
                        {isBlocked && hour === startHour + 2 && !booking && (
                          <div className="pc-booked-tag">TUTUP</div>
                        )}
                        {booking && isBlockStart && (
                          <div className="pc-booked-tag">TERISI</div>
                        )}
                        {canBook && (
                          <>
                            <div className="pc-plus-icon" aria-hidden="true">
                              <Plus size={18} strokeWidth={2.5} />
                            </div>
                            <span className="pc-available-label">Pilih</span>
                          </>
                        )}
                      </>
                    );

                    if (canBook) {
                      return (
                        <button
                          key={`${dateStr}-${hour}`}
                          type="button"
                          className={classes}
                          onClick={(event) => openModal(dateStr, hour, event.currentTarget)}
                          aria-label={`Booking ${dayLabel}, jam ${timeLabel}`}
                        >
                          {cellContent}
                        </button>
                      );
                    }

                    return (
                      <div
                        key={`${dateStr}-${hour}`}
                        className={classes}
                        role="gridcell"
                        aria-label={`${dayLabel}, jam ${timeLabel}, ${booking ? 'terisi' : isBlocked ? 'tutup' : 'tidak tersedia'}`}
                      >
                        {cellContent}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Section for Customer View */}
      {featuredPhotos.length > 0 && (
        <div className="pc-gallery-section">
          <MotionSection direction="up" className="pc-gallery-header">
            <span>Vibe studio</span>
            <h2>Lihat ruangnya sebelum booking.</h2>
            <p>Foto studio membantu kamu memilih sesi dengan konteks yang lebih jelas.</p>
          </MotionSection>

          <div className="pc-gallery-scroll">
            {featuredPhotos.map((photo, index) => {
              const displayCaption = getPublicPhotoCaption(photo, index);

              return (
              <div key={photo.id || photo.url || index} className="pc-gallery-item" onClick={() => setLightboxPhoto({ ...photo, displayCaption })}>
                <img src={photo.url} alt={displayCaption} loading="lazy" />
                <div className="pc-gallery-item-caption">
                  <span>{displayCaption}</span>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox for Public Calendar Page */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="gallery-lightbox-overlay"
            style={{ zIndex: 10000 }}
            onClick={() => setLightboxPhoto(null)}
          >
            <button 
              className="lightbox-close" 
              onClick={() => setLightboxPhoto(null)}
              aria-label="Tutup penampil gambar"
            >
              <X size={24} />
            </button>
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="lightbox-content"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={lightboxPhoto.url} alt={lightboxPhoto.displayCaption || 'Foto studio'} />
              <div className="lightbox-footer">
                <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: '12px 0 0 0', fontWeight: '600' }}>{lightboxPhoto.displayCaption || 'Foto studio'}</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Premium Booking Modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="pc-modal-overlay"
            onClick={closeModal}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="pc-modal"
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="pc-booking-title"
              {...modalPreset}
            >
              <div className="pc-modal-content">
                {/* Header */}
                <div className="pc-modal-header">
                  <div className="pc-modal-header-info">
                    <div className="pc-modal-header-icon">
                      <CalendarDays size={24} />
                    </div>
                    <div>
                      <h3 id="pc-booking-title">Pesan Studio</h3>
                      <p>
                        {selectedSlot.dateStr
                          ? format(new Date(selectedSlot.dateStr + 'T00:00:00'), 'EEEE, dd MMMM yyyy', { locale: localeId })
                          : ''}
                      </p>
                    </div>
                  </div>
                  <button className="pc-modal-close" type="button" onClick={closeModal} aria-label="Tutup modal booking">
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
                    <label htmlFor="pc-band-name">Nama Band / Artis</label>
                    <input
                      id="pc-band-name"
                      type="text"
                      className="pc-form-input"
                      value={bandName}
                      onChange={e => {
                        setBandName(e.target.value);
                        setFormErrors(prev => ({ ...prev, bandName: '' }));
                      }}
                      placeholder="Contoh: The Beatles"
                      autoFocus
                      aria-invalid={Boolean(formErrors.bandName)}
                      aria-describedby={formErrors.bandName ? 'pc-band-error' : undefined}
                    />
                    {formErrors.bandName && <span id="pc-band-error" className="pc-field-error">{formErrors.bandName}</span>}
                  </div>

                  <div className="pc-form-group">
                    <label htmlFor="pc-customer-phone">No. WhatsApp</label>
                    <input
                      id="pc-customer-phone"
                      type="tel"
                      className="pc-form-input"
                      value={customerPhone}
                      onChange={e => {
                        setCustomerPhone(e.target.value);
                        setFormErrors(prev => ({ ...prev, customerPhone: '' }));
                      }}
                      placeholder="08xxxxxxxxxx"
                      aria-invalid={Boolean(formErrors.customerPhone)}
                      aria-describedby={formErrors.customerPhone ? 'pc-phone-error' : undefined}
                    />
                    {formErrors.customerPhone && <span id="pc-phone-error" className="pc-field-error">{formErrors.customerPhone}</span>}
                  </div>

                  <div className="pc-form-group">
                    <label id="pc-duration-label">Pilih Durasi</label>
                    <div className="pc-duration-grid">
                      {[1,2,3,4,5].map(h => (
                        <button
                          key={h}
                          type="button"
                          className={`pc-dur-btn ${duration === h ? 'active' : ''}`}
                          aria-pressed={duration === h}
                          aria-label={`Pilih durasi ${h} jam`}
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

                  <button className="btn-success" type="button" style={{width: '100%', padding: '14px'}} onClick={sendWA} disabled={isSubmittingRequest} aria-busy={isSubmittingRequest}>
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
