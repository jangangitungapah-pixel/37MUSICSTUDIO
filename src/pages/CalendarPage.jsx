import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, CalendarCheck, Clock, DollarSign, Trash2, Phone, StickyNote, X, MessageCircle, TrendingUp, Calendar, LayoutGrid, CalendarDays } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, addDays, subDays, getDay, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';
import { useBookingStore } from '../store/useBookingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTourStore } from '../store/useTourStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { AnimatePresence, motion } from 'framer-motion';
import Modal from '../components/Modal';
import BookingForm from '../components/BookingForm';
import './CalendarPage.css';
import './CalendarPrintStyles.css';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prefillDate, setPrefillDate] = useState(null);
  const [prefillHour, setPrefillHour] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailPos, setDetailPos] = useState({ top: 0, left: 0 });
  const gridWrapperRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { bookings, deleteBooking, updateBookingStatus, updateBooking, getMonthlyStats } = useBookingStore();
  const { pricePerHour, studioName } = useSettingsStore();
  const { run, currentStep, nextStep } = useTourStore();

  const daysArray = useMemo(() => {
    if (viewMode === 'day') return [currentDate];
    if (viewMode === 'week') {
      return eachDayOfInterval({ start: startOfWeek(currentDate, { weekStartsOn: 0 }), end: endOfWeek(currentDate, { weekStartsOn: 0 }) });
    }
    return eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
  }, [currentDate, viewMode]);

  const numDays = daysArray.length;
  const startHour = 10;
  const endHour = 23;
  const hoursArray = Array.from({ length: endHour - startHour }).map((_, i) => startHour + i);
  const stats = getMonthlyStats(currentDate);

  // Last month for trend
  const lastStats = getMonthlyStats(addMonths(currentDate, -1));
  const revTrend = lastStats.totalRevenue > 0 ? Math.round(((stats.totalRevenue - lastStats.totalRevenue) / lastStats.totalRevenue) * 100) : null;

  const filteredBookings = useMemo(() => bookings.filter(b => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!b.band.toLowerCase().includes(q) && !(b.phone && b.phone.includes(q))) return false;
    }
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    return true;
  }), [bookings, searchQuery, filterStatus]);

  const handleCellClick = (dateStr, hour) => {
    setPrefillDate(dateStr); setPrefillHour(hour); setIsModalOpen(true);
    if (run && currentStep === 4) setTimeout(() => nextStep(), 100);
  };
  const handleNewBooking = () => { setPrefillDate(null); setPrefillHour(null); setIsModalOpen(true); };
  const handleGoToday = () => {
    setCurrentDate(new Date());
    setTimeout(() => {
      const todayEl = document.querySelector('.today-col-highlight');
      if (todayEl && gridWrapperRef.current) todayEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, 100);
  };
  const handlePrev = () => {
    if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };
  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const handleBookingClick = (e, booking) => {
    e.stopPropagation();
    if (isMobile) { setSelectedBooking(booking); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const popupHeight = 480;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    let top = spaceBelow >= popupHeight ? rect.bottom + 8 : spaceAbove >= popupHeight ? rect.top - popupHeight - 8 : Math.max(8, window.innerHeight - popupHeight - 8);
    const left = Math.min(rect.left, window.innerWidth - 320);
    setDetailPos({ top, left });
    setSelectedBooking(booking);
    if (run && currentStep === 11 && booking.band === 'Band Tutorial') setTimeout(() => nextStep(), 100);
  };

  const handleDeleteBooking = (id) => {
    deleteBooking(id); setSelectedBooking(null);
    if (run && currentStep === 12) setTimeout(() => nextStep(), 100);
  };

  const handleSendReminder = () => {
    if (!selectedBooking.phone) { alert("Nomor telepon tidak tersedia."); return; }
    const message = `Halo ${selectedBooking.band}, sekadar mengingatkan ada jadwal latihan ${format(new Date(selectedBooking.date), 'dd MMM yyyy')} jam ${String(selectedBooking.hour).padStart(2, '0')}:00 WIB di ${studioName}. Terima kasih!`;
    let phone = selectedBooking.phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleStatusChange = (id, newStatus) => updateBookingStatus(id, newStatus);

  useEffect(() => {
    if (run) return;
    const handleClick = () => setSelectedBooking(null);
    if (selectedBooking) { document.addEventListener('click', handleClick); return () => document.removeEventListener('click', handleClick); }
  }, [selectedBooking, run]);

  const formatCurrency = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  const getStatusLabel = (s) => ({ confirmed: 'Lunas', dp: 'DP', pending: 'Belum Bayar' }[s] || s);
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  let emptyCellAssigned = false;

  const viewModes = [
    { id: 'day', label: 'Hari', icon: CalendarDays },
    { id: 'week', label: 'Minggu', icon: Calendar },
    { id: 'month', label: 'Bulan', icon: LayoutGrid },
  ];

  const getDateLabel = () => {
    if (viewMode === 'day') return format(currentDate, 'dd MMMM yyyy');
    if (viewMode === 'week') return `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'dd MMM')} – ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), 'dd MMM yyyy')}`;
    return format(currentDate, 'MMMM yyyy');
  };

  const colWidth = viewMode === 'day' ? '200px' : viewMode === 'week' ? '120px' : isMobile ? '50px' : '60px';
  const timeColWidth = isMobile ? '55px' : '80px';

  return (
    <div className="calendar-page">
      {/* Header */}
      <header className="cal-header">
        <div className="cal-header-left">
          <div className="cal-header-icon">
            <CalendarCheck size={20} />
          </div>
          <div>
            <h2 className="page-title">Booking Calendar</h2>
            <p className="page-subtitle">{studioName} — {format(currentDate, 'MMMM yyyy')}</p>
          </div>
        </div>
        <div className="cal-header-right">
          <div className="search-bar glass-panel tour-calendar-search">
            <Search size={16} color="var(--text-muted)" />
            <input type="text" placeholder="Cari band / no HP..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            {searchQuery && <button className="search-clear" onClick={() => setSearchQuery('')}><X size={13} /></button>}
          </div>
          <button className="btn-secondary tour-calendar-print" onClick={() => window.print()} title="Cetak">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            <span className="hide-on-mobile">Cetak</span>
          </button>
          <button className="btn-primary tour-calendar-new-btn" onClick={handleNewBooking}>
            <Plus size={18} /><span>New Booking</span>
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(0,240,255,0.1)' }}>
            <CalendarCheck size={18} color="var(--accent-cyan)" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{stats.totalBookings}</span>
            <span className="stat-label">Total Booking</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(255,42,95,0.1)' }}>
            <Clock size={18} color="var(--accent-pink)" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{stats.totalHours}<small> jam</small></span>
            <span className="stat-label">Jam Terpakai</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(76,175,80,0.1)' }}>
            <DollarSign size={18} color="#4CAF50" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{formatCurrency(stats.totalRevenue)}</span>
            <span className="stat-label">
              Est. Pendapatan
              {revTrend !== null && (
                <span className={`trend-badge ${revTrend >= 0 ? 'up' : 'down'}`}>
                  <TrendingUp size={10} />{revTrend >= 0 ? '+' : ''}{revTrend}%
                </span>
              )}
            </span>
          </div>
        </div>
        <div className="stat-card glass-panel stat-breakdown">
          <div className="breakdown-items">
            <span className="breakdown-item"><span className="dot confirmed" />  {stats.confirmed} Lunas</span>
            <span className="breakdown-item"><span className="dot dp" />  {stats.dp} DP</span>
            <span className="breakdown-item"><span className="dot pending" />  {stats.pending} Pending</span>
          </div>
        </div>
      </div>

      {/* Calendar Container */}
      <div className="calendar-container glass-panel">
        {/* Toolbar */}
        <div className="calendar-toolbar">
          {/* Left: Navigation */}
          <div className="date-navigation tour-calendar-nav">
            <button className="icon-btn nav-arrow" onClick={handlePrev}><ChevronLeft size={18} /></button>
            <span className="current-month">{getDateLabel()}</span>
            <button className="icon-btn nav-arrow" onClick={handleNext}><ChevronRight size={18} /></button>
            <button className="today-btn" onClick={handleGoToday}>Hari Ini</button>
          </div>

          {/* Right: View Switcher + Filters */}
          <div className="toolbar-right">
            <div className="view-switcher tour-calendar-filters">
              {viewModes.map(({ id, label, icon: Icon }) => (
                <button key={id} className={`view-btn ${viewMode === id ? 'active' : ''}`} onClick={() => setViewMode(id)}>
                  <Icon size={14} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <div className="quick-filters">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'pending', label: 'Pending' },
                { id: 'dp', label: 'DP' },
                { id: 'confirmed', label: 'Lunas' },
                { id: 'maintenance', label: 'Blokir' },
              ].map(({ id, label }) => (
                <button key={id} className={`filter-chip ${filterStatus === id ? `active ${id}` : ''}`} onClick={() => setFilterStatus(id)}>
                  {id !== 'all' && <span className={`dot ${id}`} style={id === 'maintenance' ? { background: '#6b6b76' } : undefined} />}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="monthly-grid-wrapper tour-calendar-grid" ref={gridWrapperRef}>
          <div className="monthly-grid" style={{ gridTemplateColumns: `${timeColWidth} repeat(${numDays}, minmax(${colWidth}, 1fr))` }}>
            <div className="grid-corner-cell"><span className="corner-label">JAM</span></div>

            {daysArray.map((day, idx) => {
              const isToday = format(day, 'yyyy-MM-dd') === todayStr;
              const dow = getDay(day);
              const isWeekend = dow === 0 || dow === 6;
              return (
                <div key={idx} className={`grid-header-cell ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}>
                  <span className="day-name">{dayNames[dow]}</span>
                  <span className={`day-number ${isToday ? 'today-circle' : ''}`}>{format(day, 'd')}</span>
                </div>
              );
            })}

            {hoursArray.map((hour, hourIdx) => (
              <React.Fragment key={hour}>
                <div className={`time-label sticky-col ${hourIdx % 2 === 0 ? 'even-row' : ''}`}>
                  <span className="time-range">{String(hour).padStart(2, '0')}.00 - {String(hour + 1).padStart(2, '0')}.00</span>
                </div>
                {daysArray.map((day, dayIdx) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isToday = dateStr === todayStr;
                  const dow = getDay(day);
                  const isWeekend = dow === 0 || dow === 6;
                  const cellBooking = filteredBookings.find(b => b.date === dateStr && b.hour <= hour && (b.hour + b.duration) > hour);
                  const isBookingStart = cellBooking && cellBooking.hour === hour;
                  const isBookingEnd = cellBooking && (cellBooking.hour + cellBooking.duration - 1) === hour;
                  const isTargetCell = run && currentStep === 4 && isToday && !cellBooking && !emptyCellAssigned;
                  if (isTargetCell) emptyCellAssigned = true;
                  const isTutorialBooking = cellBooking && cellBooking.band === 'Band Tutorial' && run && currentStep === 11;

                  const cellClasses = ['grid-cell', hourIdx % 2 === 0 ? 'even-row' : '', isToday ? 'today-col-highlight' : '', isWeekend ? 'weekend-col' : '', isTargetCell ? 'tour-target-cell' : '', isTutorialBooking ? 'tour-new-booking' : ''].filter(Boolean).join(' ');

                  if (cellBooking) {
                    return (
                      <div key={`${hour}-${dayIdx}`} className={`${cellClasses} booked-cell status-${cellBooking.status} ${isBookingStart ? 'booking-start' : ''} ${isBookingEnd ? 'booking-end' : ''}`} onClick={e => handleBookingClick(e, cellBooking)}>
                        {isBookingStart && (
                          <div className="booking-info">
                            <span className="booking-band-name">{cellBooking.band}</span>
                            <span className="booking-time-label">{cellBooking.hour}.00–{cellBooking.hour + cellBooking.duration}.00</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div key={`${hour}-${dayIdx}`} className={`${cellClasses} empty-cell`} onClick={() => handleCellClick(dateStr, hour)}>
                      <span className="hover-plus">+</span>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Detail — Bottom Sheet on mobile, Popup on desktop */}
      <AnimatePresence>
        {(() => {
          if (!selectedBooking) return null;
          const b = bookings.find(x => x.id === selectedBooking.id) || selectedBooking;
          const isRecording = b.type === 'recording';
          const basePrice = isRecording ? (b.sessionPrice || 0) : (b.duration * pricePerHour);
          const totalPrice = basePrice - (b.discountAmount || 0);
          
          return (
            <>
              {isMobile && <div className="detail-overlay" onClick={() => setSelectedBooking(null)} />}
              <motion.div
                className={`booking-detail-popup glass-panel ${isMobile ? 'mobile-sheet' : ''}`}
                style={!isMobile ? { top: detailPos.top, left: detailPos.left } : undefined}
                onClick={e => e.stopPropagation()}
                initial={isMobile ? { y: 60, opacity: 0 } : { scale: 0.92, opacity: 0, y: -8 }}
                animate={isMobile ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
                exit={isMobile ? { y: 80, opacity: 0 } : { scale: 0.9, opacity: 0, y: -10 }}
                transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              >
              {/* Header */}
              <div className="detail-header">
                <div className="detail-header-info">
                  <span className={`detail-status-dot status-${b.status}`} />
                  <h4>{b.band} {isRecording && <span style={{fontSize:'0.7rem', background:'var(--accent-cyan)', color:'#000', padding:'2px 6px', borderRadius:'4px', marginLeft:'6px'}}>Recording</span>}</h4>
                </div>
                <div className="detail-header-actions">
                  <span className={`detail-status-badge status-${b.status}`}>{getStatusLabel(b.status)}</span>
                  <button className="icon-btn detail-close" onClick={() => setSelectedBooking(null)}><X size={16} /></button>
                </div>
              </div>

              <div className="detail-body">
                {/* Time */}
                <div className="detail-info-row">
                  <Clock size={14} />
                  <div className="detail-info-content">
                    <span>{b.date} • {b.hour}.00 – {b.hour + b.duration}.00 WIB</span>
                    {isRecording ? (
                      <div className="duration-controls" style={{ opacity: 0.8 }}>
                        <span className="dur-label">Paket Sesi ({b.duration} jam)</span>
                      </div>
                    ) : (
                      <div className="duration-controls">
                        <button className="dur-btn" onClick={() => updateBooking(b.id, { duration: Math.max(1, b.duration - 1) })} disabled={b.duration <= 1}>−</button>
                        <span className="dur-label">{b.duration} jam</span>
                      <button className="dur-btn" onClick={() => {
                        const newDur = Math.min(12, b.duration + 1);
                        if (newDur > b.duration) {
                          const isOverlap = bookings.some(x => x.id !== b.id && x.date === b.date && (Number(x.hour) < Number(b.hour) + newDur) && (Number(b.hour) < Number(x.hour) + Number(x.duration)));
                          if (isOverlap) { useNotificationStore.getState().addNotification({ title: 'Jadwal Bentrok!', message: 'Durasi bertabrakan dengan booking lain.', type: 'error' }); return; }
                          updateBooking(b.id, { duration: newDur });
                        }
                      }}>+</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Phone */}
                {b.phone && b.status !== 'maintenance' && (
                  <div className="detail-info-row"><Phone size={14} /><span>{b.phone}</span></div>
                )}

                {/* Note */}
                {b.note && (
                  <div className="detail-info-row"><StickyNote size={14} /><span>{b.note}</span></div>
                )}

                {/* Price Section */}
                {b.status !== 'maintenance' && (
                  <div className="detail-price-card">
                    <div className="detail-price-row">
                      <span>Subtotal {isRecording ? '(Sesi Recording)' : `(${b.duration} jam)`}</span>
                      <span>{formatCurrency(basePrice)}</span>
                    </div>
                    {(b.discountAmount || 0) > 0 && (
                      <div className="detail-price-row discount">
                        <span>Diskon VIP</span>
                        <span>−{formatCurrency(b.discountAmount)}</span>
                      </div>
                    )}
                    <div className="detail-price-row total">
                      <span>Total</span>
                      <span>{formatCurrency(totalPrice)}</span>
                    </div>
                    {b.status === 'dp' && b.dpAmount > 0 && (
                      <>
                        <div className="detail-price-row dp"><span>DP Dibayar</span><span>{formatCurrency(b.dpAmount)}</span></div>
                        <div className="detail-price-row remaining"><span>Sisa Tagihan</span><span>{formatCurrency(totalPrice - b.dpAmount)}</span></div>
                      </>
                    )}
                    {b.status === 'confirmed' && <div className="detail-paid-badge">✓ Lunas</div>}
                    {b.status === 'pending' && <div className="detail-unpaid-badge">⚠ Belum Dibayar</div>}
                  </div>
                )}

                {/* Status Change */}
                {b.status !== 'maintenance' && (
                  <div className="detail-status-section">
                    <label>Ubah Status</label>
                    <div className="status-buttons">
                      {['pending', 'dp', 'confirmed'].map(s => (
                        <button key={s} className={`status-btn ${s} ${b.status === s ? 'active' : ''}`} onClick={() => handleStatusChange(b.id, s)}>
                          {getStatusLabel(s)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="detail-footer">
                <button className="delete-btn tour-btn-delete" onClick={() => handleDeleteBooking(b.id)}>
                  <Trash2 size={14} /><span>{b.status === 'maintenance' ? 'Hapus Blokir' : 'Hapus'}</span>
                </button>
                {b.status !== 'maintenance' && (
                  <button className="btn-secondary" onClick={handleSendReminder}>
                    <MessageCircle size={14} /><span>Kirim Pengingat</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        );
      })()}
      </AnimatePresence>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Booking Baru">
        <BookingForm onClose={() => setIsModalOpen(false)} initialDate={prefillDate} initialHour={prefillHour} />
      </Modal>
    </div>
  );
};

export default CalendarPage;
