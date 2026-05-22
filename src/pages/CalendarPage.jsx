import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Plus, Search, CalendarCheck, Clock, DollarSign, Trash2, Phone, StickyNote, X, MessageCircle, TrendingUp, Calendar, LayoutGrid, CalendarDays, Lightbulb, AlertTriangle, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, addDays, subDays, getDay, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';
import { useBookingStore } from '../store/useBookingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useBookingRequestStore } from '../store/useBookingRequestStore';
import { useTourStore } from '../store/useTourStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { AnimatePresence, motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import Modal from '../components/Modal';
import BookingForm from '../components/BookingForm';
import { getAnomalies, getDemandInsights, getSlotRecommendations } from '../lib/smartInsights';
import { getDepositDeadlineStatus, hasBookingOverlap } from '../lib/bookingWorkflows';
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
  const [now, setNow] = useState(new Date());
  const [areTopPanelsCollapsed, setAreTopPanelsCollapsed] = useState(false);

  // Swipe gesture state
  const touchStartRef = useRef(null);

  // Drag & drop state
  const [draggedBooking, setDraggedBooking] = useState(null);

  // Resize state
  const [resizingBooking, setResizingBooking] = useState(null);
  const [initialResizeY, setInitialResizeY] = useState(0);
  const [resizeAddedHours, setResizeAddedHours] = useState(0);
  const [resizeConfirmData, setResizeConfirmData] = useState(null);
  const [rescheduleDraft, setRescheduleDraft] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    const interval = setInterval(() => setNow(new Date()), 60000); // update every minute
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isMobile) {
      setAreTopPanelsCollapsed(false);
      setViewMode('week');
    }
  }, [isMobile]);

  const { bookings, addBooking, deleteBooking, updateBookingStatus, updateBooking, cancelBooking, rescheduleBooking, getMonthlyStats } = useBookingStore();
  const { requests, updateRequestStatus } = useBookingRequestStore();
  const { pricePerHour, studioName, durationDiscounts = [], recordingSessions = [], operationalHours = { start: 10, end: 23 }, blockedDates = [] } = useSettingsStore();
  const { inventory } = useInventoryStore();
  const { run, currentStep, nextStep } = useTourStore();

  const calculatePrice = useCallback((b, dur) => {
    let base;
    let durDisc = 0;
    if (b.type === 'recording') {
      const session = recordingSessions.find(s => s.id === b.sessionId);
      const pkgHours = session ? session.hours : 6;
      const pkgPrice = session ? session.price : (b.sessionPrice || 0);
      base = dur <= pkgHours ? pkgPrice : pkgPrice + ((dur - pkgHours) * pricePerHour);
    } else {
      base = dur * pricePerHour;
      const applicableDiscount = durationDiscounts
        .filter(d => dur >= d.hours)
        .sort((a, b) => b.discountAmount - a.discountAmount)[0];
      if (applicableDiscount) durDisc = applicableDiscount.discountAmount;
    }
    const vipDisc = b.isVIP ? base * 0.1 : 0;
    const equipmentCost = b.equipmentCost || 0;
    return { base, durDisc, vipDisc, total: base + equipmentCost - (vipDisc + durDisc) };
  }, [durationDiscounts, pricePerHour, recordingSessions]);

  const daysArray = useMemo(() => {
    if (viewMode === 'day') return [currentDate];
    if (viewMode === 'week') {
      return eachDayOfInterval({ start: startOfWeek(currentDate, { weekStartsOn: 0 }), end: endOfWeek(currentDate, { weekStartsOn: 0 }) });
    }
    return eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
  }, [currentDate, viewMode]);

  const numDays = daysArray.length;
  const startHour = operationalHours.start;
  const endHour = operationalHours.end;
  const hoursArray = Array.from({ length: endHour - startHour }).map((_, i) => startHour + i);
  const stats = getMonthlyStats(currentDate);
  const slotRecommendations = useMemo(
    () => getSlotRecommendations(bookings, {
      fromDate: currentDate < new Date() ? new Date() : currentDate,
      duration: 2,
      limit: 4,
    }),
    [bookings, currentDate]
  );
  const demandInsights = useMemo(() => getDemandInsights(bookings), [bookings]);
  const scheduleAnomalies = useMemo(() => getAnomalies(bookings, pricePerHour), [bookings, pricePerHour]);
  const pendingRequests = useMemo(
    () => requests
      .filter((request) => request.status === 'pending')
      .sort((a, b) => (a.date || '').localeCompare(b.date || '') || Number(a.hour || 0) - Number(b.hour || 0)),
    [requests]
  );

  // Last month for trend
  const lastStats = getMonthlyStats(addMonths(currentDate, -1));
  const revTrend = lastStats.totalRevenue > 0 ? Math.round(((stats.totalRevenue - lastStats.totalRevenue) / lastStats.totalRevenue) * 100) : null;

  const filteredBookings = useMemo(() => bookings.filter(b => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!b.band.toLowerCase().includes(q) && !(b.phone && b.phone.includes(q))) return false;
    }
    if (filterStatus === 'all' && b.status === 'cancelled') return false;
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    return true;
  }), [bookings, searchQuery, filterStatus]);

  const displayBookings = useMemo(() => {
    if (!resizingBooking) return filteredBookings;
    return filteredBookings.map(b => {
      if (b.id === resizingBooking.id) {
        return { 
          ...b, 
          duration: Math.max(1, Math.min(13, b.duration + resizeAddedHours)),
          isResizing: true 
        };
      }
      return b;
    });
  }, [filteredBookings, resizingBooking, resizeAddedHours]);

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

  // Swipe handlers
  const handleTouchStart = (e) => { touchStartRef.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEndX;
    if (diff > 50) handleNext(); // Swiped left -> next
    else if (diff < -50) handlePrev(); // Swiped right -> prev
    touchStartRef.current = null;
  };

  // Drag & Drop handlers
  const handleDragStart = (e, booking) => {
    if (isMobile) return;
    setDraggedBooking(booking);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', booking.id);
    setTimeout(() => { if (e.target) e.target.style.opacity = '0.5'; }, 0);
  };
  const handleDragEnd = (e) => {
    setDraggedBooking(null);
    if (e.target) e.target.style.opacity = '1';
  };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (e, dateStr, hour) => {
    e.preventDefault();
    if (draggedBooking) {
      const candidate = { date: dateStr, hour, duration: draggedBooking.duration };
      if (hasBookingOverlap(bookings, candidate, draggedBooking.id)) {
        useNotificationStore.getState().addNotification({
          title: 'Jadwal Bentrok!',
          message: 'Slot tujuan bertabrakan dengan booking lain.',
          type: 'error',
        });
        return;
      }
      updateBooking(draggedBooking.id, { date: dateStr, hour: hour });
    }
  };

  const handleApproveRequest = async (request) => {
    const candidate = {
      date: request.date,
      hour: Number(request.hour),
      duration: Number(request.duration || 1),
    };
    if (hasBookingOverlap(bookings, candidate)) {
      useNotificationStore.getState().addNotification({
        title: 'Request bentrok',
        message: 'Slot request sudah terisi. Tolak request atau pindahkan manual sebelum approve.',
        type: 'error',
      });
      return;
    }

    try {
      await addBooking({
        type: 'booking',
        band: request.band,
        phone: request.phone || '',
        date: request.date,
        hour: Number(request.hour),
        duration: Number(request.duration || 1),
        status: 'pending',
        dpAmount: 0,
        note: 'Dibuat dari request kalender publik.',
      });
      await updateRequestStatus(request.id, 'approved', { approvedAt: new Date().toISOString() });
      useNotificationStore.getState().addNotification({ title: 'Request disetujui', message: `${request.band} masuk ke kalender.`, type: 'success' });
    } catch (error) {
      useNotificationStore.getState().addNotification({ title: 'Gagal approve request', message: error.message || 'Coba lagi beberapa saat lagi.', type: 'error' });
    }
  };

  const handleRejectRequest = async (request) => {
    const reason = window.prompt('Alasan penolakan request booking:', 'Slot tidak tersedia');
    if (reason === null) return;
    try {
      await updateRequestStatus(request.id, 'rejected', { rejectionReason: reason, rejectedAt: new Date().toISOString() });
      useNotificationStore.getState().addNotification({ title: 'Request ditolak', message: `${request.band} dipindahkan dari antrean.`, type: 'success' });
    } catch (error) {
      useNotificationStore.getState().addNotification({ title: 'Gagal menolak request', message: error.message || 'Coba lagi beberapa saat lagi.', type: 'error' });
    }
  };

  // Resize handler
  const handleResizeStart = (e, booking) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingBooking(booking);
    setInitialResizeY(e.clientY || (e.touches && e.touches[0].clientY));
    setResizeAddedHours(0);
  };

  useEffect(() => {
    const handleResizeMove = (e) => {
      if (!resizingBooking) return;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      const diffY = clientY - initialResizeY;
      const cellHeight = 45; // Approximate height of 1 grid cell
      const addedHours = Math.round(diffY / cellHeight);
      setResizeAddedHours(addedHours);
    };
    const handleResizeEnd = (e) => {
      if (!resizingBooking) return;
      const clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);
      const diffY = clientY - initialResizeY;
      const cellHeight = 45;
      const addedHours = Math.round(diffY / cellHeight);
      
      if (addedHours !== 0) {
        const newDur = Math.max(1, Math.min(13, resizingBooking.duration + addedHours));
        if (newDur !== resizingBooking.duration) {
          const candidate = { date: resizingBooking.date, hour: resizingBooking.hour, duration: newDur };
          if (hasBookingOverlap(bookings, candidate, resizingBooking.id)) {
            useNotificationStore.getState().addNotification({
              title: 'Jadwal Bentrok!',
              message: 'Perpanjangan waktu bertabrakan dengan jadwal lain.',
              type: 'error',
            });
            setResizingBooking(null);
            setResizeAddedHours(0);
            return;
          }

          if (resizingBooking.type === 'maintenance') {
            updateBooking(resizingBooking.id, { duration: newDur });
          } else {
            const oldCalc = calculatePrice(resizingBooking, resizingBooking.duration);
            const newCalc = calculatePrice(resizingBooking, newDur);
            setResizeConfirmData({
              booking: resizingBooking,
              oldDuration: resizingBooking.duration,
              newDuration: newDur,
              oldPrice: oldCalc.total,
              newPrice: newCalc.total,
              newDiscountAmount: newCalc.durDisc + newCalc.vipDisc,
              diff: newCalc.total - oldCalc.total
            });
          }
        }
      }
      setResizingBooking(null);
      setResizeAddedHours(0);
    };

    if (resizingBooking) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.addEventListener('touchmove', handleResizeMove, { passive: false });
      document.addEventListener('touchend', handleResizeEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.removeEventListener('touchmove', handleResizeMove);
      document.removeEventListener('touchend', handleResizeEnd);
    };
  }, [resizingBooking, initialResizeY, updateBooking, calculatePrice]);

  const confirmResize = () => {
    if (!resizeConfirmData) return;
    const { booking, newDuration, newPrice, newDiscountAmount } = resizeConfirmData;
    let newStatus = booking.status;
    
    // Auto-downgrade status if price increases and it was confirmed, but dpAmount is now less than new total
    if (booking.status === 'confirmed' && newPrice > (booking.dpAmount || 0) && newPrice > calculatePrice(booking, booking.duration).total) {
      newStatus = 'dp';
    }

    updateBooking(booking.id, { 
      duration: newDuration, 
      status: newStatus,
      discountAmount: newDiscountAmount
    });
    setResizeConfirmData(null);
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

  const handleCancelBooking = async (booking) => {
    const reason = window.prompt('Alasan pembatalan booking:', 'Dibatalkan pelanggan');
    if (reason === null) return;
    try {
      await cancelBooking(booking.id, reason);
      setSelectedBooking(null);
      useNotificationStore.getState().addNotification({ title: 'Booking dibatalkan', message: `${booking.band} ditandai batal.`, type: 'success' });
    } catch (error) {
      useNotificationStore.getState().addNotification({ title: 'Gagal membatalkan booking', message: error.message || 'Coba lagi beberapa saat lagi.', type: 'error' });
    }
  };

  const openRescheduleModal = (booking) => {
    setRescheduleDraft({
      id: booking.id,
      band: booking.band,
      duration: booking.duration,
      date: booking.date,
      hour: booking.hour,
      reason: '',
    });
  };

  const handleRescheduleSubmit = async (event) => {
    event.preventDefault();
    if (!rescheduleDraft) return;
    const candidate = {
      date: rescheduleDraft.date,
      hour: Number(rescheduleDraft.hour),
      duration: Number(rescheduleDraft.duration || 1),
    };
    if (hasBookingOverlap(bookings, candidate, rescheduleDraft.id)) {
      useNotificationStore.getState().addNotification({ title: 'Jadwal Bentrok!', message: 'Slot tujuan bertabrakan dengan booking lain.', type: 'error' });
      return;
    }
    try {
      await rescheduleBooking(rescheduleDraft.id, {
        date: rescheduleDraft.date,
        hour: Number(rescheduleDraft.hour),
        reason: rescheduleDraft.reason,
      });
      setRescheduleDraft(null);
      setSelectedBooking(null);
      useNotificationStore.getState().addNotification({ title: 'Booking dipindahkan', message: `${rescheduleDraft.band} berhasil dijadwalkan ulang.`, type: 'success' });
    } catch (error) {
      useNotificationStore.getState().addNotification({ title: 'Gagal reschedule', message: error.message || 'Coba lagi beberapa saat lagi.', type: 'error' });
    }
  };

  const handleSendReminder = () => {
    if (!selectedBooking.phone) {
      useNotificationStore.getState().addNotification({
        title: 'Nomor telepon tidak tersedia',
        message: 'Jadwal ini belum memiliki nomor WhatsApp pelanggan.',
        type: 'error'
      });
      return;
    }
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
  const getStatusLabel = (s) => ({ confirmed: 'Lunas', dp: 'DP', pending: 'Belum Bayar', cancelled: 'Batal' }[s] || s);
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

  const colWidth = isMobile 
    ? (viewMode === 'day' ? '100%' : viewMode === 'week' ? '0' : '45px')
    : (viewMode === 'day' ? '200px' : viewMode === 'week' ? '120px' : '60px');
  const timeColWidth = isMobile ? '45px' : '100px';

  return (
    <Tooltip.Provider delayDuration={200}>
      <div className="calendar-page">
        <div className={`calendar-main-content ${selectedBooking ? 'blurred' : ''} ${areTopPanelsCollapsed ? 'panels-collapsed' : ''}`}>
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

            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  className="btn-secondary cal-panel-toggle"
                  type="button"
                  onClick={() => setAreTopPanelsCollapsed((value) => !value)}
                  aria-expanded={!areTopPanelsCollapsed}
                  aria-controls="calendar-top-panels"
                >
                  {areTopPanelsCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  <span>{areTopPanelsCollapsed ? 'Tampilkan Panel' : 'Sembunyikan Panel'}</span>
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="radix-tooltip-content" sideOffset={5}>
                  {areTopPanelsCollapsed ? 'Tampilkan statistik' : 'Sembunyikan statistik'}
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>

            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button className="btn-secondary tour-calendar-print" onClick={() => window.print()}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  <span className="hide-on-mobile">Cetak</span>
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="radix-tooltip-content" sideOffset={5}>
                  Cetak jadwal kalender
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>

            <button className="btn-primary tour-calendar-new-btn" onClick={handleNewBooking}>
              <Plus size={18} /><span>New Booking</span>
            </button>
          </div>
        </header>

      <AnimatePresence initial={false}>
        {!areTopPanelsCollapsed && (
          <motion.div
            id="calendar-top-panels"
            className="calendar-top-panels"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >
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

            {/* Smart Scheduling */}
            <div className="cal-smart-panel glass-panel">
              <div className="cal-smart-summary">
                <div className="cal-smart-icon"><Lightbulb size={18} /></div>
                <div>
                  <h3>Rekomendasi Slot</h3>
                  <p>
                    {demandInsights.busiestHour
                      ? `Jam ramai ${demandInsights.busiestHour}.00, hari sepi ${demandInsights.quietestDay}.`
                      : 'Saran akan makin akurat setelah ada lebih banyak booking.'}
                  </p>
                </div>
              </div>
              <div className="cal-slot-list">
                {slotRecommendations.length === 0 ? (
                  <span className="cal-slot-empty">Tidak ada slot kosong yang cocok.</span>
                ) : slotRecommendations.map((slot) => (
                  <button
                    key={`${slot.date}-${slot.hour}`}
                    className="cal-slot-chip"
                    onClick={() => handleCellClick(slot.date, slot.hour)}
                    title="Pakai slot ini"
                  >
                    <strong>{slot.dayName}, {slot.date.slice(8, 10)}/{slot.date.slice(5, 7)}</strong>
                    <span>{String(slot.hour).padStart(2, '0')}.00-{String(slot.endHour).padStart(2, '0')}.00</span>
                    <small>{slot.reason}</small>
                  </button>
                ))}
              </div>
              {scheduleAnomalies.length > 0 && (
                <div className="cal-smart-alert">
                  <AlertTriangle size={15} />
                  <span>{scheduleAnomalies.length} anomali jadwal terdeteksi. Pertama: {scheduleAnomalies[0].detail}</span>
                </div>
              )}
            </div>

            {pendingRequests.length > 0 && (
              <div className="cal-request-panel glass-panel">
                <div className="cal-request-head">
                  <div>
                    <h3>Request Booking Publik</h3>
                    <p>{pendingRequests.length} request menunggu persetujuan admin.</p>
                  </div>
                </div>
                <div className="cal-request-list">
                  {pendingRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="cal-request-item">
                      <div className="cal-request-main">
                        <strong>{request.band}</strong>
                        <span>{request.date} &bull; {String(request.hour).padStart(2, '0')}.00-{String(Number(request.hour) + Number(request.duration || 1)).padStart(2, '0')}.00</span>
                        {request.phone && <small>{request.phone}</small>}
                      </div>
                      <div className="cal-request-actions">
                        <button className="request-approve" onClick={() => handleApproveRequest(request)} title="Approve">
                          <CheckCircle2 size={15} /> Approve
                        </button>
                        <button className="request-reject" onClick={() => handleRejectRequest(request)} title="Tolak">
                          <XCircle size={15} /> Tolak
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
                  {viewMode === id && (
                    <motion.div 
                      layoutId="view-indicator"
                      className="view-btn-indicator"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
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
                { id: 'cancelled', label: 'Batal' },
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
        <div className="monthly-grid-wrapper tour-calendar-grid" ref={gridWrapperRef} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="monthly-grid" style={{ gridTemplateColumns: `${timeColWidth} repeat(${numDays}, minmax(${colWidth}, 1fr))` }}>
            <div className="grid-corner-cell"><span className="corner-label">JAM</span></div>

            {daysArray.map((day, idx) => {
              const isToday = format(day, 'yyyy-MM-dd') === todayStr;
              const dow = getDay(day);
              const isWeekend = dow === 0 || dow === 6;
              const isBlocked = blockedDates.includes(format(day, 'yyyy-MM-dd'));
              return (
                <div key={idx} className={`grid-header-cell ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}>
                  <span className="day-name">{dayNames[dow]} {isBlocked && <AlertTriangle size={12} color="var(--accent-pink)" style={{marginLeft: 4, display: 'inline'}} />}</span>
                  <span className={`day-number ${isToday ? 'today-circle' : ''}`}>{format(day, 'd')}</span>
                </div>
              );
            })}

            {hoursArray.map((hour, hourIdx) => (
              <React.Fragment key={hour}>
                <div className={`time-label sticky-col ${hourIdx % 2 === 0 ? 'even-row' : ''}`}>
                  <span className="time-range">
                    {isMobile 
                      ? `${String(hour).padStart(2, '0')}.00` 
                      : `${String(hour).padStart(2, '0')}.00 - ${String(hour + 1).padStart(2, '0')}.00`}
                  </span>
                </div>
                {daysArray.map((day, dayIdx) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isToday = dateStr === todayStr;
                  const dow = getDay(day);
                  const isWeekend = dow === 0 || dow === 6;
                  const isBlocked = blockedDates.includes(dateStr);
                  const cellBooking = displayBookings.find(b => b.date === dateStr && b.hour <= hour && (b.hour + b.duration) > hour);
                  const isBookingStart = cellBooking && cellBooking.hour === hour;
                  const isBookingEnd = cellBooking && (cellBooking.hour + cellBooking.duration - 1) === hour;
                  const isTargetCell = run && currentStep === 4 && isToday && !cellBooking && !emptyCellAssigned;
                  if (isTargetCell) emptyCellAssigned = true;
                  const isTutorialBooking = cellBooking && cellBooking.band === 'Band Tutorial' && run && currentStep === 11;

                  const cellClasses = ['grid-cell', hourIdx % 2 === 0 ? 'even-row' : '', isToday ? 'today-col-highlight' : '', isWeekend ? 'weekend-col' : '', isTargetCell ? 'tour-target-cell' : '', isTutorialBooking ? 'tour-new-booking' : '', isBlocked && !cellBooking ? 'blocked-cell' : ''].filter(Boolean).join(' ');

                  // Current time line logic
                  const isCurrentHour = isToday && now.getHours() === hour;
                  const timeLineTop = isCurrentHour ? `${(now.getMinutes() / 60) * 100}%` : null;

                  if (cellBooking) {
                    return (
                      <motion.div 
                        layout
                        key={`${hour}-${dayIdx}-${cellBooking.id}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className={`${cellClasses} booked-cell status-${cellBooking.status} ${isBookingStart ? 'booking-start' : ''} ${isBookingEnd ? 'booking-end' : ''} ${cellBooking.isResizing ? 'is-resizing' : ''}`} 
                        onClick={e => handleBookingClick(e, cellBooking)}
                        draggable={isBookingStart && !isMobile}
                        onDragStart={(e) => handleDragStart(e, cellBooking)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, dateStr, hour)}
                      >
                        {isCurrentHour && <div className="current-time-line" style={{ top: timeLineTop }} />}
                        {isBookingStart && (
                          <div className="booking-info">
                            <span className="booking-band-name">{cellBooking.band}</span>
                            <span className="booking-time-label">{cellBooking.hour}.00–{cellBooking.hour + cellBooking.duration}.00</span>
                          </div>
                        )}
                        {isBookingEnd && (
                          <div className="resize-handle" onMouseDown={(e) => handleResizeStart(e, cellBooking)} onTouchStart={(e) => handleResizeStart(e, cellBooking)}>
                            <div className="resize-line" />
                          </div>
                        )}
                      </motion.div>
                    );
                  }
                  return (
                    <div 
                      key={`${hour}-${dayIdx}`} 
                      className={`${cellClasses} empty-cell`} 
                      onClick={() => handleCellClick(dateStr, hour)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, dateStr, hour)}
                    >
                      {isCurrentHour && <div className="current-time-line" style={{ top: timeLineTop }} />}
                      <span className="hover-plus">+</span>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
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
          const equipmentCost = b.equipmentCost || 0;
          const totalPrice = basePrice + equipmentCost - (b.discountAmount || 0);
          
          return (
            <>
              {isMobile && (
                <motion.div
                  className="detail-overlay"
                  onClick={() => setSelectedBooking(null)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, ease: 'easeInOut' }}
                />
              )}
              <motion.div
                className={`booking-detail-popup ${isMobile ? 'mobile-sheet' : ''}`}
                style={!isMobile ? { top: detailPos.top, left: detailPos.left } : undefined}
                onClick={e => e.stopPropagation()}
                initial={isMobile ? { y: 80, opacity: 0 } : { scale: 0.95, opacity: 0, y: -4 }}
                animate={isMobile ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
                exit={isMobile ? { y: 80, opacity: 0 } : { scale: 0.95, opacity: 0, y: -4 }}
                transition={{ duration: 0.15, ease: 'easeInOut' }}
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
                        const newDur = Math.min(13, b.duration + 1);
                        if (newDur > b.duration) {
                          const candidate = { date: b.date, hour: b.hour, duration: newDur };
                          if (hasBookingOverlap(bookings, candidate, b.id)) {
                            useNotificationStore.getState().addNotification({ title: 'Jadwal Bentrok!', message: 'Durasi bertabrakan dengan booking lain.', type: 'error' }); 
                            return; 
                          }
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
                    {b.rentedEquipment && b.rentedEquipment.length > 0 && (
                      <div className="detail-price-row equipment">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>Sewa Alat Tambahan</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {b.rentedEquipment.map(id => inventory.find(i => i.id === id)?.name || 'Alat').join(', ')}
                          </span>
                        </div>
                        <span>{formatCurrency(equipmentCost)}</span>
                      </div>
                    )}
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
                    {(() => {
                      const deadline = getDepositDeadlineStatus(b);
                      return deadline.state !== 'none' ? (
                        <div className={`detail-deadline-badge ${deadline.state}`}>Deadline: {deadline.label}</div>
                      ) : null;
                    })()}
                    {b.status === 'cancelled' && (
                      <div className="detail-cancelled-note">Dibatalkan{b.cancelReason ? `: ${b.cancelReason}` : ''}</div>
                    )}
                  </div>
                )}

                {/* Status Change */}
                {b.status !== 'maintenance' && b.status !== 'cancelled' && (
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
                {b.status !== 'maintenance' && b.status !== 'cancelled' && (
                  <>
                    <button className="btn-secondary" onClick={() => openRescheduleModal(b)}>
                      <RotateCcw size={14} /><span>Reschedule</span>
                    </button>
                    <button className="btn-secondary danger-soft" onClick={() => handleCancelBooking(b)}>
                      <XCircle size={14} /><span>Batalkan</span>
                    </button>
                  </>
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

      <Modal isOpen={!!rescheduleDraft} onClose={() => setRescheduleDraft(null)} title="Reschedule Booking">
        {rescheduleDraft && (
          <form className="reschedule-form" onSubmit={handleRescheduleSubmit}>
            <div className="form-group">
              <label>Tanggal Baru</label>
              <input
                type="date"
                className="form-input"
                value={rescheduleDraft.date}
                min={todayStr}
                onChange={(event) => setRescheduleDraft((prev) => ({ ...prev, date: event.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Jam Baru</label>
              <select
                className="form-input"
                value={rescheduleDraft.hour}
                onChange={(event) => setRescheduleDraft((prev) => ({ ...prev, hour: Number(event.target.value) }))}
              >
                {Array.from({ length: 13 }, (_, i) => i + 10).map((hour) => (
                  <option key={hour} value={hour}>{String(hour).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Catatan Perubahan</label>
              <textarea
                className="form-input"
                rows="3"
                value={rescheduleDraft.reason}
                onChange={(event) => setRescheduleDraft((prev) => ({ ...prev, reason: event.target.value }))}
                placeholder="Contoh: pelanggan minta pindah jam"
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setRescheduleDraft(null)}>Batal</button>
              <button type="submit" className="btn-primary">Simpan Jadwal Baru</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Resize Confirmation Modal */}
      <Modal isOpen={!!resizeConfirmData} onClose={() => setResizeConfirmData(null)} title="Konfirmasi Perubahan Jam">
        {resizeConfirmData && (
          <div className="resize-confirm-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="resize-warning-box" style={{ padding: '14px', background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.15)', borderRadius: '10px' }}>
              <h4 style={{ margin: '0 0 8px', color: 'var(--text-primary)', fontSize: '0.95rem' }}>Perubahan Durasi & Biaya</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Durasi: <strong>{resizeConfirmData.oldDuration} jam</strong> ➔ <strong style={{ color: '#00f0ff' }}>{resizeConfirmData.newDuration} jam</strong>
              </p>
            </div>

            <div className="resize-price-details" style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Biaya Sebelumnya</span>
                <span>{formatCurrency(resizeConfirmData.oldPrice)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>Total Biaya Baru</span>
                <span style={{ color: '#4CAF50' }}>{formatCurrency(resizeConfirmData.newPrice)}</span>
              </div>
            </div>

            {resizeConfirmData.diff !== 0 && (
              <div style={{ padding: '12px', background: resizeConfirmData.diff > 0 ? 'rgba(255,152,0,0.1)' : 'rgba(76,175,80,0.1)', borderRadius: '8px', fontSize: '0.8rem', color: resizeConfirmData.diff > 0 ? '#FF9800' : '#4CAF50' }}>
                {resizeConfirmData.diff > 0 
                  ? `Biaya bertambah sebesar ${formatCurrency(resizeConfirmData.diff)}.` 
                  : `Terdapat kelebihan biaya (pengurangan) sebesar ${formatCurrency(Math.abs(resizeConfirmData.diff))}.`}
              </div>
            )}

            {resizeConfirmData.booking.type === 'recording' && resizeConfirmData.newDuration > resizeConfirmData.oldDuration && (
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '-8px' }}>
                * Sesi recording menggunakan harga paket. Penambahan jam dihitung sebagai overtime.
              </div>
            )}

            {resizeConfirmData.booking.status === 'confirmed' && resizeConfirmData.diff > 0 && (
              <div style={{ padding: '10px', background: 'rgba(255,42,95,0.1)', borderLeft: '3px solid #ff2a5f', borderRadius: '4px', fontSize: '0.8rem', color: '#ffb4b4' }}>
                <strong>Perhatian:</strong> Booking ini sebelumnya berstatus <strong>Lunas</strong>. Karena ada penambahan durasi & biaya, status akan otomatis diubah menjadi <strong>DP</strong> (Kurang Bayar).
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setResizeConfirmData(null)}>Batal</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={confirmResize}>Konfirmasi Perubahan</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
    </Tooltip.Provider>
  );
};

export default CalendarPage;
