import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, CalendarCheck, Clock, DollarSign, Trash2, Phone, StickyNote, X, MessageCircle } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, getDaysInMonth, addDays, subDays, getDay, isSameMonth, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';
import { useBookingStore } from '../store/useBookingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTourStore } from '../store/useTourStore';
import { useNotificationStore } from '../store/useNotificationStore';
import Modal from '../components/Modal';
import BookingForm from '../components/BookingForm';
import './CalendarPage.css';
import './CalendarPrintStyles.css';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'day', 'week', 'month'
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prefillDate, setPrefillDate] = useState(null);
  const [prefillHour, setPrefillHour] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailPos, setDetailPos] = useState({ top: 0, left: 0 });

  // Drag-to-resize state (removed)
  const gridWrapperRef = useRef(null);

  // Responsive breakpoint detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Use global state
  const { bookings, deleteBooking, updateBookingStatus, updateBooking, getMonthlyStats } = useBookingStore();
  const { pricePerHour, studioName } = useSettingsStore();
  const { run, currentStep, nextStep } = useTourStore();

  // Calendar configuration based on View Mode
  const daysArray = useMemo(() => {
    if (viewMode === 'day') {
      return [currentDate];
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return eachDayOfInterval({ start, end });
    }
  }, [currentDate, viewMode]);

  const numDays = daysArray.length;
  const startHour = 10;
  const endHour = 23;
  const hoursArray = Array.from({ length: endHour - startHour }).map((_, i) => startHour + i);

  // Stats (Always Monthly based on currentDate)
  const stats = getMonthlyStats(currentDate);

  // Filter bookings by search and status
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch = b.band.toLowerCase().includes(q) || (b.phone && b.phone.includes(q));
        if (!matchesSearch) return false;
      }
      
      // 2. Status Filter
      if (filterStatus !== 'all') {
        if (b.status !== filterStatus) return false;
      }
      
      return true;
    });
  }, [bookings, searchQuery, filterStatus]);

  const handleCellClick = (dateStr, hour) => {
    setPrefillDate(dateStr);
    setPrefillHour(hour);
    setIsModalOpen(true);
    if (run && currentStep === 4) {
      setTimeout(() => nextStep(), 100);
    }
  };

  const handleNewBooking = () => {
    setPrefillDate(null);
    setPrefillHour(null);
    setIsModalOpen(true);
  };

  const handleGoToday = () => {
    setCurrentDate(new Date());
    // Scroll to today column
    setTimeout(() => {
      const todayEl = document.querySelector('.today-col-highlight');
      if (todayEl && gridWrapperRef.current) {
        todayEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
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
    const rect = e.currentTarget.getBoundingClientRect();
    const popupHeight = 480; // estimated popup height increased to accommodate new WhatsApp button and VIP rows
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    let top;
    if (spaceBelow >= popupHeight) {
      // Enough room below — show below
      top = rect.bottom + 8;
    } else if (spaceAbove >= popupHeight) {
      // Not enough below, but enough above — show above
      top = rect.top - popupHeight - 8;
    } else {
      // Neither side has enough room — clamp to stay within viewport
      top = Math.max(8, window.innerHeight - popupHeight - 8);
    }
    
    const left = Math.min(rect.left, window.innerWidth - 320);
    setDetailPos({ top, left });
    setSelectedBooking(booking);

    if (run && currentStep === 11 && booking.band === 'Band Tutorial') {
      setTimeout(() => nextStep(), 100);
    }
  };

  const handleDeleteBooking = (id) => {
    deleteBooking(id);
    setSelectedBooking(null);
    if (run && currentStep === 12) {
      setTimeout(() => nextStep(), 100);
    }
  };

  const handleSendReminder = () => {
    if (!selectedBooking.phone) {
      alert("Nomor telepon tidak tersedia untuk jadwal ini.");
      return;
    }
    const message = `Halo ${selectedBooking.band}, sekadar mengingatkan Anda ada jadwal latihan besok tanggal ${format(new Date(selectedBooking.date), 'dd MMM yyyy')} jam ${String(selectedBooking.hour).padStart(2, '0')}:00 WIB di ${studioName}. Mohon datang tepat waktu ya! Terima kasih.`;
    let phoneStr = selectedBooking.phone.replace(/\D/g, '');
    if (phoneStr.startsWith('0')) {
      phoneStr = '62' + phoneStr.substring(1);
    }
    const url = `https://wa.me/${phoneStr}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleStatusChange = (id, newStatus) => {
    updateBookingStatus(id, newStatus);
  };

  // Close detail popup on outside click (disabled during tour)
  useEffect(() => {
    if (run) return; // Don't close popup during tour
    const handleClick = () => setSelectedBooking(null);
    if (selectedBooking) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [selectedBooking, run]);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'confirmed': return 'Lunas';
      case 'dp': return 'DP';
      case 'pending': return 'Belum Bayar';
      default: return status;
    }
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  let emptyCellAssigned = false;

  return (
    <div className="calendar-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Booking Calendar</h2>
          <p className="page-subtitle">37 Music Studio — {format(currentDate, 'MMMM yyyy')}</p>
        </div>
        
        <div className="header-actions">
          <div className="search-bar glass-panel tour-calendar-search">
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Cari nama band / no HP..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}><X size={14} /></button>
            )}
          </div>
          <button className="btn-secondary tour-calendar-print" onClick={() => window.print()} title="Cetak Jadwal Hari Ini">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            <span className="hide-on-mobile">Cetak</span>
          </button>
          <button className="btn-primary tour-calendar-new-btn" onClick={handleNewBooking}>
            <Plus size={18} />
            <span>New Booking</span>
          </button>
        </div>
      </header>

      {/* Stats Summary Bar */}
      <div className="stats-bar">
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(0, 240, 255, 0.1)' }}>
            <CalendarCheck size={20} color="var(--accent-cyan)" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{stats.totalBookings}</span>
            <span className="stat-label">Total Booking</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(255, 42, 95, 0.1)' }}>
            <Clock size={20} color="var(--accent-pink)" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{stats.totalHours} <small>jam</small></span>
            <span className="stat-label">Jam Terpakai</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(76, 175, 80, 0.1)' }}>
            <DollarSign size={20} color="#4CAF50" />
          </div>
          <div className="stat-data">
            <span className="stat-value">{formatCurrency(stats.totalRevenue)}</span>
            <span className="stat-label">Estimasi Pendapatan</span>
          </div>
        </div>
        <div className="stat-card glass-panel stat-breakdown">
          <div className="breakdown-items">
            <span className="breakdown-item"><span className="dot confirmed"></span>{stats.confirmed} Lunas</span>
            <span className="breakdown-item"><span className="dot dp"></span>{stats.dp} DP</span>
            <span className="breakdown-item"><span className="dot pending"></span>{stats.pending} Pending</span>
          </div>
        </div>
      </div>

      <div className="calendar-container glass-panel">
        <div className="calendar-toolbar">
          <div className="date-navigation tour-calendar-nav">
            <button className="icon-btn" onClick={handlePrev}>
              <ChevronLeft size={20} />
            </button>
            <h3 className="current-month" style={{ minWidth: viewMode === 'week' ? '180px' : '140px', textAlign: 'center' }}>
              {viewMode === 'day' && format(currentDate, 'dd MMM yyyy')}
              {viewMode === 'week' && `${format(startOfWeek(currentDate, {weekStartsOn: 0}), 'dd MMM')} - ${format(endOfWeek(currentDate, {weekStartsOn: 0}), 'dd MMM yyyy')}`}
              {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
            </h3>
            <button className="icon-btn" onClick={handleNext}>
              <ChevronRight size={20} />
            </button>
            <button className="today-btn" onClick={handleGoToday}>Hari Ini</button>
            
            <div className="view-switcher hide-on-mobile" style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px', marginLeft: '12px' }}>
              <button className={`view-btn ${viewMode === 'day' ? 'active' : ''}`} onClick={() => setViewMode('day')}>Hari</button>
              <button className={`view-btn ${viewMode === 'week' ? 'active' : ''}`} onClick={() => setViewMode('week')}>Minggu</button>
              <button className={`view-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}>Bulan</button>
            </div>
          </div>
          
          <div className="quick-filters tour-calendar-filters" style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            <button className={`filter-chip ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>Semua</button>
            <button className={`filter-chip ${filterStatus === 'pending' ? 'active pending' : ''}`} onClick={() => setFilterStatus('pending')}><span className="dot pending"></span>Belum Bayar</button>
            <button className={`filter-chip ${filterStatus === 'dp' ? 'active dp' : ''}`} onClick={() => setFilterStatus('dp')}><span className="dot dp"></span>DP</button>
            <button className={`filter-chip ${filterStatus === 'confirmed' ? 'active confirmed' : ''}`} onClick={() => setFilterStatus('confirmed')}><span className="dot confirmed"></span>Lunas</button>
            <button className={`filter-chip ${filterStatus === 'maintenance' ? 'active maintenance' : ''}`} onClick={() => setFilterStatus('maintenance')}><span className="dot maintenance" style={{background:'#6b6b76'}}></span>Blokir</button>
          </div>
        </div>

        <div className="monthly-grid-wrapper tour-calendar-grid" ref={gridWrapperRef}>
          <div className="monthly-grid" style={{ gridTemplateColumns: `${isMobile ? '65px' : '90px'} repeat(${numDays}, minmax(${viewMode === 'day' ? '200px' : viewMode === 'week' ? '120px' : isMobile ? '50px' : '60px'}, 1fr))` }}>
            
            {/* Top-Left Corner Header Cell */}
            <div className="grid-corner-cell sticky-col">
              <span className="corner-label">JAM</span>
            </div>

            {/* Days Header */}
            {daysArray.map((day, idx) => {
              const isToday = format(day, 'yyyy-MM-dd') === todayStr;
              const dayOfWeek = getDay(day); // 0=Sun, 6=Sat
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
              return (
                <div key={idx} className={`grid-header-cell ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}>
                  <span className="day-name">{dayNames[dayOfWeek]}</span>
                  <span className="day-number">{format(day, 'd')}</span>
                </div>
              );
            })}

            {/* Grid Body (Rows = Hours, Cols = Days) */}
            {hoursArray.map((hour, hourIdx) => (
              <React.Fragment key={hour}>
                {/* Time Label Column (Sticky) */}
                <div className={`time-label sticky-col ${hourIdx % 2 === 0 ? 'even-row' : ''}`}>
                  <span className="time-range">{String(hour).padStart(2, '0')}.00 – {String(hour + 1).padStart(2, '0')}.00</span>
                </div>

                {/* Day Cells for this Hour */}
                {daysArray.map((day, dayIdx) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isToday = dateStr === todayStr;
                  const dayOfWeek = getDay(day);
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  
                  // Find booking that occupies this specific hour on this date
                  const cellBooking = filteredBookings.find(b => 
                    b.date === dateStr && 
                    b.hour <= hour && 
                    (b.hour + b.duration) > hour
                  );

                  const isBookingStart = cellBooking && cellBooking.hour === hour;
                  const isBookingEnd = cellBooking && (cellBooking.hour + cellBooking.duration - 1) === hour;

                  const isTargetCell = run && currentStep === 4 && isToday && !cellBooking && !emptyCellAssigned;
                  if (isTargetCell) emptyCellAssigned = true;

                  // Tutorial targeting: highlight the "Band Tutorial" booking
                  const isTutorialBooking = cellBooking && cellBooking.band === 'Band Tutorial' && run && currentStep === 11;

                  const cellClasses = [
                    'grid-cell',
                    hourIdx % 2 === 0 ? 'even-row' : '',
                    isToday ? 'today-col-highlight' : '',
                    isWeekend ? 'weekend-col' : '',
                    isTargetCell ? 'tour-target-cell' : '',
                    isTutorialBooking ? 'tour-new-booking' : ''
                  ].filter(Boolean).join(' ');

                  if (cellBooking) {
                    const statusClass = `status-${cellBooking.status}`;

                    return (
                      <div 
                        key={`${hour}-${dayIdx}`} 
                        className={`${cellClasses} booked-cell ${statusClass} ${isBookingStart ? 'booking-start' : ''} ${isBookingEnd ? 'booking-end' : ''}`}
                        onClick={(e) => handleBookingClick(e, cellBooking)}
                      >
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
                    <div 
                      key={`${hour}-${dayIdx}`} 
                      className={`${cellClasses} empty-cell`}
                      onClick={() => handleCellClick(dateStr, hour)}
                    >
                      <span className="hover-plus">+</span>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}

          </div>
        </div>
      </div>

      {/* Booking Detail Popup */}
      {selectedBooking && (() => {
        const activeBooking = bookings.find(b => b.id === selectedBooking.id) || selectedBooking;
        return (
          <div className="booking-detail-popup glass-panel" style={{ top: detailPos.top, left: detailPos.left }} onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <h4>{activeBooking.band}</h4>
              <button className="icon-btn detail-close" onClick={() => setSelectedBooking(null)}><X size={16} /></button>
            </div>
            <div className="detail-body">
              <div className="detail-row">
                <Clock size={14} /> 
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>{activeBooking.date} • {activeBooking.hour}.00 – {activeBooking.hour + activeBooking.duration}.00</span>
                  <div className="duration-controls" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: '4px' }}>
                    <button className="icon-btn" style={{ width: '24px', height: '24px', minHeight: '24px' }} onClick={() => updateBooking(activeBooking.id, { duration: Math.max(1, activeBooking.duration - 1) })} disabled={activeBooking.duration <= 1}>-</button>
                    <span style={{ fontSize: '0.8rem', width: '40px', textAlign: 'center' }}>{activeBooking.duration} jam</span>
                    <button className="icon-btn" style={{ width: '24px', height: '24px', minHeight: '24px' }} onClick={() => {
                      const newDuration = Math.min(12, activeBooking.duration + 1);
                      if (newDuration > activeBooking.duration) {
                        const isOverlap = bookings.some(b => {
                          if (b.id === activeBooking.id || b.date !== activeBooking.date) return false;
                          const bHour = Number(b.hour);
                          const bDur = Number(b.duration);
                          const aHour = Number(activeBooking.hour);
                          return (bHour < aHour + newDuration) && (aHour < bHour + bDur);
                        });
                        
                        if (isOverlap) {
                          const { addNotification } = useNotificationStore.getState();
                          addNotification({ 
                            title: 'Jadwal Bentrok!', 
                            message: 'Gagal menambah durasi. Penambahan durasi menabrak jadwal band lain.', 
                            type: 'error' 
                          });
                          return;
                        }
                        updateBooking(activeBooking.id, { duration: newDuration });
                      }
                    }}>+</button>
                  </div>
                </div>
              </div>
              
              {activeBooking.status !== 'maintenance' && (
                <>
                  {activeBooking.phone && (
                    <div className="detail-row">
                      <Phone size={14} /> 
                      <span>{activeBooking.phone}</span>
                    </div>
                  )}
                  <div className="detail-price-section">
                    <div className="detail-price-row">
                      <span className="price-label">Subtotal</span>
                      <span className="price-value">{formatCurrency(activeBooking.duration * pricePerHour)}</span>
                    </div>
                    {activeBooking.discountAmount > 0 && (
                      <div className="detail-price-row">
                        <span className="price-label">Diskon VIP</span>
                        <span className="price-value" style={{ color: '#FFC107' }}>-{formatCurrency(activeBooking.discountAmount)}</span>
                      </div>
                    )}
                    <div className="detail-price-row" style={{ fontWeight: 'bold' }}>
                      <span className="price-label">Total Harga</span>
                      <span className="price-value">{formatCurrency((activeBooking.duration * pricePerHour) - (activeBooking.discountAmount || 0))}</span>
                    </div>
                    {activeBooking.status === 'dp' && activeBooking.dpAmount > 0 && (
                      <>
                        <div className="detail-price-row dp-row">
                          <span className="price-label">DP Dibayar</span>
                          <span className="price-value dp-paid">{formatCurrency(activeBooking.dpAmount)}</span>
                        </div>
                        <div className="detail-price-row remaining-row">
                          <span className="price-label">Sisa Tagihan</span>
                          <span className="price-value remaining">{formatCurrency(((activeBooking.duration * pricePerHour) - (activeBooking.discountAmount || 0)) - activeBooking.dpAmount)}</span>
                        </div>
                      </>
                    )}
                    {activeBooking.status === 'pending' && (
                      <div className="detail-price-row remaining-row">
                        <span className="price-label">Belum Dibayar</span>
                        <span className="price-value remaining">{formatCurrency((activeBooking.duration * pricePerHour) - (activeBooking.discountAmount || 0))}</span>
                      </div>
                    )}
                    {activeBooking.status === 'confirmed' && (
                      <div className="detail-price-row paid-row">
                        <span className="price-label">Status</span>
                        <span className="price-value paid-full">✓ Lunas</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeBooking.note && (
                <div className="detail-row">
                  <StickyNote size={14} />
                  <span>{activeBooking.note}</span>
                </div>
              )}
              
              {activeBooking.status !== 'maintenance' && (
                <div className="detail-status">
                  <label>Ubah Status:</label>
                  <div className="status-buttons">
                    {['pending', 'dp', 'confirmed'].map(s => (
                      <button 
                        key={s} 
                        className={`status-btn ${s} ${activeBooking.status === s ? 'active' : ''}`}
                        onClick={() => handleStatusChange(activeBooking.id, s)}
                      >
                        {getStatusLabel(s)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="detail-footer">
              <button className="delete-btn tour-btn-delete" onClick={() => handleDeleteBooking(activeBooking.id)}>
                <Trash2 size={14} />
                <span>{activeBooking.status === 'maintenance' ? 'Hapus Blokir' : 'Hapus Booking'}</span>
              </button>
              {activeBooking.status !== 'maintenance' && (
                <button className="btn-secondary" onClick={handleSendReminder}>
                  <MessageCircle size={14} />
                  <span>Kirim Pengingat</span>
                </button>
              )}
            </div>
          </div>
        );
      })()}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Booking Baru"
      >
        <BookingForm 
          onClose={() => setIsModalOpen(false)} 
          initialDate={prefillDate}
          initialHour={prefillHour}
        />
      </Modal>
    </div>
  );
};

export default CalendarPage;
