import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, CalendarCheck, Clock, DollarSign, Trash2, Phone, StickyNote, X } from 'lucide-react';
import { format, addMonths, startOfMonth, getDaysInMonth, addDays, getDay, isSameMonth } from 'date-fns';
import { useBookingStore } from '../store/useBookingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTourStore } from '../store/useTourStore';
import Modal from '../components/Modal';
import BookingForm from '../components/BookingForm';
import './CalendarPage.css';

const CalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prefillDate, setPrefillDate] = useState(null);
  const [prefillHour, setPrefillHour] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailPos, setDetailPos] = useState({ top: 0, left: 0 });

  const gridWrapperRef = useRef(null);

  // Use global state
  const { bookings, deleteBooking, updateBookingStatus, getMonthlyStats } = useBookingStore();
  const { pricePerHour } = useSettingsStore();
  const { run, currentStep, nextStep } = useTourStore();

  // Calendar configuration
  const numDays = getDaysInMonth(currentMonth);
  const daysArray = Array.from({ length: numDays }).map((_, i) => addDays(currentMonth, i));
  const startHour = 10;
  const endHour = 23;
  const hoursArray = Array.from({ length: endHour - startHour }).map((_, i) => startHour + i);

  // Stats
  const stats = getMonthlyStats(currentMonth);

  // Filter bookings by search
  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return bookings;
    const q = searchQuery.toLowerCase();
    return bookings.filter(b => b.band.toLowerCase().includes(q) || (b.phone && b.phone.includes(q)));
  }, [bookings, searchQuery]);

  const handleCellClick = (dateStr, hour) => {
    setPrefillDate(dateStr);
    setPrefillHour(hour);
    setIsModalOpen(true);
    if (run && currentStep === 2) {
      setTimeout(() => nextStep(), 100);
    }
  };

  const handleNewBooking = () => {
    setPrefillDate(null);
    setPrefillHour(null);
    setIsModalOpen(true);
  };

  const handleGoToday = () => {
    setCurrentMonth(startOfMonth(new Date()));
    // Scroll to today column
    setTimeout(() => {
      const todayEl = document.querySelector('.today-col-highlight');
      if (todayEl && gridWrapperRef.current) {
        todayEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }, 100);
  };

  const handleBookingClick = (e, booking) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const popupHeight = 360; // estimated popup height
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

    if (run && currentStep === 9 && booking.band === 'Band Tutorial') {
      setTimeout(() => nextStep(), 100);
    }
  };

  const handleDeleteBooking = (id) => {
    deleteBooking(id);
    setSelectedBooking(null);
    if (run && currentStep === 10) {
      setTimeout(() => nextStep(), 100);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    updateBookingStatus(id, newStatus);
    setSelectedBooking(prev => prev ? { ...prev, status: newStatus } : null);
  };

  // Close detail popup on outside click
  useEffect(() => {
    const handleClick = () => setSelectedBooking(null);
    if (selectedBooking) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [selectedBooking]);

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
  
  const todaysBookings = filteredBookings.filter(b => b.date === todayStr);
  const latestBookingId = todaysBookings.length > 0 ? Math.max(...todaysBookings.map(b => b.id)) : null;

  let emptyCellAssigned = false;

  return (
    <div className="calendar-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Booking Calendar</h2>
          <p className="page-subtitle">37 Music Studio — {format(currentMonth, 'MMMM yyyy')}</p>
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
            <button className="icon-btn" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>
              <ChevronLeft size={20} />
            </button>
            <h3 className="current-month">{format(currentMonth, 'MMMM yyyy')}</h3>
            <button className="icon-btn" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight size={20} />
            </button>
            <button className="today-btn" onClick={handleGoToday}>Hari Ini</button>
          </div>
          <div className="legend">
            <span className="legend-item"><span className="dot confirmed"></span> Lunas</span>
            <span className="legend-item"><span className="dot dp"></span> DP</span>
            <span className="legend-item"><span className="dot pending"></span> Belum Bayar</span>
          </div>
        </div>

        <div className="monthly-grid-wrapper tour-calendar-grid" ref={gridWrapperRef}>
          <div className="monthly-grid" style={{ gridTemplateColumns: `90px repeat(${numDays}, minmax(60px, 1fr))` }}>
            
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

                  const isTargetCell = run && currentStep === 2 && isToday && !cellBooking && !emptyCellAssigned;
                  if (isTargetCell) emptyCellAssigned = true;

                  // Robust tutorial targeting: highlight the absolute latest booking created today
                  const isTutorialBooking = cellBooking && cellBooking.id === latestBookingId && run && currentStep === 9;

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
      {selectedBooking && (
        <div className="booking-detail-popup glass-panel" style={{ top: detailPos.top, left: detailPos.left }} onClick={e => e.stopPropagation()}>
          <div className="detail-header">
            <h4>{selectedBooking.band}</h4>
            <button className="icon-btn detail-close" onClick={() => setSelectedBooking(null)}><X size={16} /></button>
          </div>
          <div className="detail-body">
            <div className="detail-row">
              <Clock size={14} /> 
              <span>{selectedBooking.date} • {selectedBooking.hour}.00 – {selectedBooking.hour + selectedBooking.duration}.00 ({selectedBooking.duration} jam)</span>
            </div>
            {selectedBooking.phone && (
              <div className="detail-row">
                <Phone size={14} /> 
                <span>{selectedBooking.phone}</span>
              </div>
            )}
            <div className="detail-price-section">
              <div className="detail-price-row">
                <span className="price-label">Total Harga</span>
                <span className="price-value">{formatCurrency(selectedBooking.duration * pricePerHour)}</span>
              </div>
              {selectedBooking.status === 'dp' && selectedBooking.dpAmount > 0 && (
                <>
                  <div className="detail-price-row dp-row">
                    <span className="price-label">DP Dibayar</span>
                    <span className="price-value dp-paid">{formatCurrency(selectedBooking.dpAmount)}</span>
                  </div>
                  <div className="detail-price-row remaining-row">
                    <span className="price-label">Sisa Tagihan</span>
                    <span className="price-value remaining">{formatCurrency((selectedBooking.duration * pricePerHour) - selectedBooking.dpAmount)}</span>
                  </div>
                </>
              )}
              {selectedBooking.status === 'pending' && (
                <div className="detail-price-row remaining-row">
                  <span className="price-label">Belum Dibayar</span>
                  <span className="price-value remaining">{formatCurrency(selectedBooking.duration * pricePerHour)}</span>
                </div>
              )}
              {selectedBooking.status === 'confirmed' && (
                <div className="detail-price-row paid-row">
                  <span className="price-label">Status</span>
                  <span className="price-value paid-full">✓ Lunas</span>
                </div>
              )}
            </div>
            {selectedBooking.note && (
              <div className="detail-row">
                <StickyNote size={14} />
                <span>{selectedBooking.note}</span>
              </div>
            )}
            <div className="detail-status">
              <label>Ubah Status:</label>
              <div className="status-buttons">
                {['pending', 'dp', 'confirmed'].map(s => (
                  <button 
                    key={s} 
                    className={`status-btn ${s} ${selectedBooking.status === s ? 'active' : ''}`}
                    onClick={() => handleStatusChange(selectedBooking.id, s)}
                  >
                    {getStatusLabel(s)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="detail-footer">
            <button className="delete-btn tour-btn-delete" onClick={() => handleDeleteBooking(selectedBooking.id)}>
              <Trash2 size={14} />
              <span>Hapus Booking</span>
            </button>
          </div>
        </div>
      )}

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
