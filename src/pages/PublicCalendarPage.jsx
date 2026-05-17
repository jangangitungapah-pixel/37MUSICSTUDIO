import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useBookingStore } from '../store/useBookingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { ChevronLeft, ChevronRight, LogOut, CalendarDays, Phone, MessageCircle, Plus } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addDays, subDays, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { useNotificationStore } from '../store/useNotificationStore';
import Modal from '../components/Modal';
import './PublicCalendarPage.css';

const PublicCalendarPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { bookings } = useBookingStore();
  const { studioName, studioPhone } = useSettingsStore();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'day', 'week', 'month'
  const gridWrapperRef = useRef(null);
  
  // Modal state
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState({ dateStr: '', hour: 0 });
  const [bandName, setBandName] = useState('');
  const [duration, setDuration] = useState(2);

  // If not guest, redirect
  useEffect(() => {
    if (!user || !user.isAnonymous) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleGoToday = () => {
    setCurrentDate(new Date());
    setTimeout(() => {
      if (gridWrapperRef.current) {
        const todayCell = gridWrapperRef.current.querySelector('.grid-header-cell.today');
        if (todayCell) {
          const scrollPos = todayCell.offsetLeft - (window.innerWidth / 2) + 45;
          gridWrapperRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
        }
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
  const hoursArray = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Filter out cancelled bookings
  const activeBookings = useMemo(() => {
    return bookings.filter(b => b.status !== 'cancelled');
  }, [bookings]);

  return (
    <div className="public-calendar-page">
      <header className="public-header glass-panel">
        <div className="header-brand">
          <div className="logo-icon">
            <CalendarDays size={24} color="var(--accent-pink)" />
          </div>
          <h1>{studioName} - Jadwal Studio</h1>
        </div>
        <button className="btn-secondary logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Keluar</span>
        </button>
      </header>

      <div className="public-content">
        <div className="calendar-container glass-panel">
          <div className="calendar-toolbar">
            <div className="date-navigation">
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
            <div className="legend">
              <span className="legend-item"><span className="dot booked"></span> Terisi / Dibooking</span>
              <span className="legend-item"><span className="dot available"></span> Kosong</span>
            </div>
          </div>

          <div className="monthly-grid-wrapper" ref={gridWrapperRef}>
            <div className="monthly-grid" style={{ gridTemplateColumns: `80px repeat(${numDays}, minmax(${viewMode === 'day' ? '200px' : viewMode === 'week' ? '120px' : '60px'}, 1fr))` }}>
              
              {/* Top-Left Corner Header Cell */}
              <div className="grid-corner-cell sticky-col">
                <span className="corner-label">JAM</span>
              </div>

              {/* Days Header */}
              {daysArray.map((day, idx) => {
                const isToday = format(day, 'yyyy-MM-dd') === todayStr;
                const dayOfWeek = getDay(day);
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
                return (
                  <div key={idx} className={`grid-header-cell ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}>
                    <span className="day-name">{dayNames[dayOfWeek]}</span>
                    <span className="day-number">{format(day, 'd')}</span>
                  </div>
                );
              })}

              {/* Grid Body */}
              {hoursArray.map((hour, hourIdx) => (
                <React.Fragment key={hour}>
                  {/* Time Label Column (Sticky) */}
                  <div className={`sticky-col time-label ${hourIdx % 2 === 0 ? 'even-row' : ''}`}>
                    <span className="time-range">{String(hour).padStart(2, '0')}.00 – {String(hour + 1).padStart(2, '0')}.00</span>
                  </div>

                  {/* Day Cells for this Hour */}
                  {daysArray.map((day, dayIdx) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isToday = dateStr === todayStr;
                    const dayOfWeek = getDay(day);
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                    // Find if any active booking covers this date and hour
                    const slotBooking = activeBookings.find(b => {
                      if (b.date !== dateStr) return false;
                      const startHour = b.hour;
                      const endHour = b.hour + b.duration;
                      return hour >= startHour && hour < endHour;
                    });

                    // Determine block characteristics
                    let blockClass = '';
                    let label = '';
                    
                    if (slotBooking) {
                      const startHour = slotBooking.hour;
                      const endHour = slotBooking.hour + slotBooking.duration;
                      const isBookingStart = hour === startHour;
                      const isBookingEnd = hour === endHour - 1;
                      
                      blockClass = 'booked-cell status-confirmed';
                      if (isBookingStart) blockClass += ' booking-start';
                      if (isBookingEnd) blockClass += ' booking-end';
                      
                      label = 'TERISI';
                    }

                    const isAvailable = !slotBooking;
                    const isPast = day < new Date(new Date().setHours(0,0,0,0)) || (isToday && hour < new Date().getHours());
                    const canBook = isAvailable && !isPast && hour >= 9; // Only allow booking from 9 AM onwards, not in past
                    
                    const handleSlotClick = () => {
                      if (canBook) {
                        setSelectedSlot({ dateStr, hour });
                        setBandName('');
                        setDuration(2);
                        setWaModalOpen(true);
                      }
                    };

                    const cellClasses = [
                      'grid-cell',
                      hourIdx % 2 === 0 ? 'even-row' : '',
                      isToday ? 'today-col-highlight' : '',
                      isWeekend ? 'weekend-col' : '',
                      blockClass,
                      canBook ? 'available-slot-interactive empty-cell' : '',
                      isPast && isAvailable ? 'past-slot empty-cell' : ''
                    ].filter(Boolean).join(' ');

                    return (
                      <div 
                        key={`${dateStr}-${hour}`} 
                        className={cellClasses}
                        onClick={handleSlotClick}
                      >
                        {slotBooking && (hour === slotBooking.hour) && (
                          <div className="public-booking-label">
                            {label}
                          </div>
                        )}
                        {canBook && !slotBooking && (
                          <div className="public-available-label">
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

      <Modal
        isOpen={waModalOpen}
        onClose={() => setWaModalOpen(false)}
        title="Pesan via WhatsApp"
      >
        <div className="wa-booking-form">
          <p className="wa-booking-info">
            Pesan studio untuk tanggal <strong>{selectedSlot.dateStr ? format(new Date(selectedSlot.dateStr), 'dd MMM yyyy') : ''}</strong> jam <strong>{selectedSlot.hour}:00</strong>.
          </p>
          
          <div className="form-group">
            <label>Nama Band</label>
            <input 
              type="text" 
              className="form-input" 
              value={bandName}
              onChange={(e) => setBandName(e.target.value)}
              placeholder="Contoh: The Beatles"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Durasi Main (Jam)</label>
            <select 
              className="form-input" 
              value={duration} 
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6].map(h => (
                <option key={h} value={h}>{h} Jam</option>
              ))}
            </select>
          </div>

          <button 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={() => {
              if (!bandName.trim()) {
                const { addNotification } = useNotificationStore.getState();
                addNotification({ title: 'Data Tidak Lengkap', message: 'Silakan isi Nama Band terlebih dahulu.', type: 'error' });
                return;
              }

              // Overlap check
              const isOverlap = activeBookings.some(b => {
                if (b.date !== selectedSlot.dateStr) return false;
                const bHour = Number(b.hour);
                const bDur = Number(b.duration);
                const formHour = Number(selectedSlot.hour);
                const formDur = Number(duration);
                return (bHour < formHour + formDur) && (formHour < bHour + bDur);
              });

              if (isOverlap) {
                const { addNotification } = useNotificationStore.getState();
                addNotification({ title: 'Jadwal Bentrok', message: 'Durasi yang Anda pilih menabrak jadwal band lain di bawahnya. Silakan kurangi durasi.', type: 'error' });
                return;
              }

              // Construct WA Message
              const formattedDate = format(new Date(selectedSlot.dateStr), 'dd MMMM yyyy');
              const message = `Halo Admin ${studioName},\n\nSaya dari band *${bandName.trim()}* ingin menyewa studio untuk:\n📅 Tanggal: ${formattedDate}\n⏰ Jam: ${selectedSlot.hour}:00\n⏱️ Durasi: ${duration} Jam\n\nApakah masih tersedia?`;
              
              // Clean phone number
              let phone = (studioPhone || '').replace(/\D/g, '');
              if (phone.startsWith('0')) phone = '62' + phone.substring(1);
              
              const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
              window.open(waUrl, '_blank');
              setWaModalOpen(false);
            }}
          >
            <MessageCircle size={18} />
            <span>Kirim Pesan ke WhatsApp</span>
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default PublicCalendarPage;
