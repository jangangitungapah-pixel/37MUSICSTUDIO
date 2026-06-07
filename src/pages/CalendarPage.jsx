import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { createPortal } from 'react-dom';
import { Inbox, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Plus, Search, CalendarCheck, Clock, DollarSign, Trash2, Phone, StickyNote, X, MessageCircle, TrendingUp, Calendar, LayoutGrid, CalendarDays, AlertTriangle, CheckCircle2, XCircle, RotateCcw, Printer } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, addDays, subDays, getDay, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';
import { useBookingStore } from '../store/useBookingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useBookingRequestStore } from '../store/useBookingRequestStore';
import { useCustomerStore } from '../store/useCustomerStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { AnimatePresence, motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import Modal from '../components/Modal';
import BookingForm from '../components/BookingForm';
import { getAnomalies } from '../lib/smartInsights';
import { getDepositDeadlineStatus, hasBookingOverlap } from '../lib/bookingWorkflows';
import { useCalendarBookingMove } from '../hooks/useCalendarBookingMove';
import { useCalendarBookingResize } from '../hooks/useCalendarBookingResize';
import { mobileMenuVariants, activeIndicatorTransition } from '../animations';
import Fuse from 'fuse.js';
import useSound from 'use-sound';
import { useThemeStore } from '../store/useThemeStore';
import { CLICK_SOUND } from '../lib/sounds';
import './CalendarPage.css';
import './CalendarPrintStyles.css';

const CalendarPage = () => {
  const soundEnabled = useThemeStore(state => state.soundEnabled);
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
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
  const [playClickRaw] = useSound(CLICK_SOUND, { volume: 0.25 });
  const playClick = () => { if (soundEnabled) playClickRaw(); };

  // Swipe gesture state
  const touchStartRef = useRef(null);

  // Drag & drop state
  const [draggedBooking, setDraggedBooking] = useState(null);

  const [rescheduleDraft, setRescheduleDraft] = useState(null);

  const getCalendarCellHeight = useCallback(() => {
    const cell = gridWrapperRef.current?.querySelector('.timeline-slot-cell, .grid-cell');
    const rect = cell?.getBoundingClientRect();

    if (rect?.width) return rect.width;

    if (viewMode === 'day') return isMobile ? 124 : 168;
    if (viewMode === 'week') return isMobile ? 108 : 138;
    return isMobile ? 96 : 128;
  }, [isMobile, viewMode]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    const interval = setInterval(() => setNow(new Date()), 60000); // update every minute
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
      document.body.classList.remove('calendar-move-lock', 'calendar-resize-lock');
    };
  }, []);

  useEffect(() => {
    if (isMobile) {
      setAreTopPanelsCollapsed(false);
      setViewMode('week');
    }
  }, [isMobile]);

  const { bookings, addBooking, deleteBooking, updateBookingStatus, updateBooking, cancelBooking, rescheduleBooking, getMonthlyStats } = useBookingStore(
    useShallow(state => ({
      bookings: state.bookings,
      addBooking: state.addBooking,
      deleteBooking: state.deleteBooking,
      updateBookingStatus: state.updateBookingStatus,
      updateBooking: state.updateBooking,
      cancelBooking: state.cancelBooking,
      rescheduleBooking: state.rescheduleBooking,
      getMonthlyStats: state.getMonthlyStats
    }))
  );
  const { requests, updateRequestStatus } = useBookingRequestStore(
    useShallow(state => ({
      requests: state.requests,
      updateRequestStatus: state.updateRequestStatus
    }))
  );
  const { pricePerHour, studioName, durationDiscounts = [], recordingSessions = [], operationalHours = { start: 10, end: 23 }, blockedDates = [] } = useSettingsStore(
    useShallow(state => ({
      pricePerHour: state.pricePerHour,
      studioName: state.studioName,
      durationDiscounts: state.durationDiscounts,
      recordingSessions: state.recordingSessions,
      operationalHours: state.operationalHours,
      blockedDates: state.blockedDates
    }))
  );
  const inventory = useInventoryStore(state => state.inventory);
  const incrementBookingCount = useCustomerStore(state => state.incrementBookingCount);

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

  const {
    resizingBooking,
    resizeAddedHours,
    resizeConfirmData,
    setResizeConfirmData,
    handleResizeStart,
    confirmResize,
  } = useCalendarBookingResize({
    bookings,
    updateBooking,
    calculatePrice,
    getCalendarCellHeight,
    touchStartRef,
  });

  const {
    movingBooking,
    moveGhost,
    moveTarget,
    suppressNextBookingClickRef,
    handleMobileBookingPointerDown,
  } = useCalendarBookingMove({
    isMobile,
    resizingBooking,
    gridWrapperRef,
    bookings,
    blockedDates,
    operationalHours,
    updateBooking,
    touchStartRef,
    setSelectedBooking,
    getCalendarCellHeight,
  });

  const daysArray = useMemo(() => {
    if (viewMode === 'day') return [currentDate];
    if (viewMode === 'week') {
      return eachDayOfInterval({ start: startOfWeek(currentDate, { weekStartsOn: 0 }), end: endOfWeek(currentDate, { weekStartsOn: 0 }) });
    }
    return eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
  }, [currentDate, viewMode]);

  const daysMetadata = useMemo(() => {
    return daysArray.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dow = getDay(day);
      return {
        day,
        dateStr,
        dayNum: format(day, 'd'),
        ariaLabelDate: format(day, 'dd MMMM yyyy'),
        isToday: dateStr === todayStr,
        dow,
        isWeekend: dow === 0 || dow === 6,
        isBlocked: blockedDates.includes(dateStr)
      };
    });
  }, [daysArray, todayStr, blockedDates]);
  const startHour = operationalHours.start;
  const endHour = operationalHours.end;
  const hoursArray = Array.from({ length: endHour - startHour }).map((_, i) => startHour + i);
  const stats = getMonthlyStats(currentDate);

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

  const filteredBookings = useMemo(() => {
    let result = bookings;
    if (searchQuery.trim()) {
      const fuse = new Fuse(result, {
        keys: ['band', 'phone', 'notes'],
        threshold: 0.35,
        ignoreLocation: true
      });
      result = fuse.search(searchQuery).map(r => r.item);
    }
    if (filterStatus === 'all') {
      return result.filter(b => b.status !== 'cancelled');
    }
    return result.filter(b => b.status === filterStatus);
  }, [bookings, searchQuery, filterStatus]);

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

  const visibleBookings = useMemo(() => {
    const visibleDates = new Set(daysMetadata.map(d => d.dateStr));
    return displayBookings.filter(b => visibleDates.has(b.date));
  }, [displayBookings, daysMetadata]);

  const handleCellClick = (dateStr, hour) => {
    playClick();
    setPrefillDate(dateStr); setPrefillHour(hour); setIsModalOpen(true);
  };
  const handleNewBooking = () => { playClick(); setPrefillDate(null); setPrefillHour(null); setIsModalOpen(true); };
  const handleGoToday = () => {
    playClick();
    setCurrentDate(new Date());
    setTimeout(() => {
      const todayEl = document.querySelector('.today-col-highlight');
      if (todayEl && gridWrapperRef.current) todayEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, 100);
  };
  const handlePrev = () => {
    playClick();
    if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };
  const handleNext = () => {
    playClick();
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  // Swipe handlers
  const handleTouchStart = (e) => { touchStartRef.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartRef.current === null) return;
    if (viewMode !== 'day') {
      touchStartRef.current = null;
      return;
    }
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

    const requestName =
      request.band ||
      request.bandName ||
      request.clientName ||
      request.customerName ||
      'Pelanggan';

    const requestPhone =
      request.phone ||
      request.clientPhone ||
      request.customerPhone ||
      '';

    const estimatedPrice = Number(request.estimatedPrice || request.totalPrice || request.price || 0);

    try {
      const createdBooking = await addBooking({
        type: 'booking',
        band: requestName,
        phone: requestPhone,
        date: request.date,
        hour: Number(request.hour),
        duration: Number(request.duration || 1),
        status: 'pending',
        dpAmount: 0,
        estimatedPrice,
        totalPrice: estimatedPrice,
        note: request.note || 'Dibuat dari request kalender publik.',
        source: 'booking-request',
        sourceRequestId: request.id,

        clientUid: request.clientUid || '',
        clientEmail: request.clientEmail || '',
        clientName: request.clientName || requestName,
        clientPhone: request.clientPhone || requestPhone,
        linkedCustomerId: request.linkedCustomerId || '',
        createdBy: request.createdBy || request.clientUid || '',
      });

      // Auto-sync customer after approved request.
      // Jangan sampai approval booking gagal hanya karena customer sync gagal.
      await incrementBookingCount(requestName, {
        phone: requestPhone,
        duration: Number(request.duration || 1),
        totalPrice: estimatedPrice,
        estimatedPrice,
        clientUid: request.clientUid || '',
        clientEmail: request.clientEmail || '',
        clientName: request.clientName || requestName,
        clientPhone: request.clientPhone || requestPhone,
        linkedCustomerId: request.linkedCustomerId || '',
        sourceRequestId: request.id,
        createdBy: request.createdBy || request.clientUid || '',
      }).catch((syncError) => {
        console.warn('[Calendar] Customer sync skipped:', syncError);
      });

      await updateRequestStatus(request.id, 'approved', {
        approvedAt: new Date().toISOString(),
        approvedBookingId: createdBooking?.id || '',
        clientUid: request.clientUid || '',
        clientEmail: request.clientEmail || '',
        clientName: request.clientName || requestName,
        clientPhone: request.clientPhone || requestPhone,
        linkedCustomerId: request.linkedCustomerId || '',
      });

      useNotificationStore.getState().addNotification({
        title: 'Request disetujui',
        message: `${requestName} masuk ke kalender, customer otomatis disinkronkan, dan metadata client ikut tersimpan.`,
        type: 'success',
      });
    } catch (error) {
      useNotificationStore.getState().addNotification({
        title: 'Gagal approve request',
        message: error.message || 'Coba lagi beberapa saat lagi.',
        type: 'error',
      });
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

  const handleBookingClick = (e, booking) => {
    e.stopPropagation();
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
    }
    if (suppressNextBookingClickRef.current || movingBooking) {
      suppressNextBookingClickRef.current = false;
      return;
    }
    if (isMobile) { setSelectedBooking(booking); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const popupHeight = 480;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    let top = spaceBelow >= popupHeight ? rect.bottom + 8 : spaceAbove >= popupHeight ? rect.top - popupHeight - 8 : Math.max(8, window.innerHeight - popupHeight - 8);
    const left = Math.min(rect.left, window.innerWidth - 320);
    setDetailPos({ top, left });
    setSelectedBooking(booking);
  };

  const handleBookingKeyDown = (e, booking) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleBookingClick(e, booking);
    }
  };

  const handleCellKeyDown = (e, dateStr, hour) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCellClick(dateStr, hour);
    }
  };

  const handleDeleteBooking = (id) => {
    deleteBooking(id); setSelectedBooking(null);
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
    const handleClick = () => {
      setSelectedBooking(null);
    };
    if (selectedBooking) { document.addEventListener('click', handleClick); return () => document.removeEventListener('click', handleClick); }
  }, [selectedBooking]);

  const formatCurrency = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  const getStatusLabel = (s) => ({ confirmed: 'Lunas', dp: 'DP', pending: 'Belum Bayar', cancelled: 'Batal' }[s] || s);
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

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

  const hourColWidth = isMobile 
    ? (viewMode === 'day' ? '124px' : viewMode === 'week' ? '108px' : '96px')
    : (viewMode === 'day' ? '168px' : viewMode === 'week' ? '138px' : '128px');
  const dateColWidth = isMobile ? '82px' : '118px';

  return (
    <Tooltip.Provider delayDuration={200}>
      <div className="app-page calendar-page">
        {/* Fluent Ambient Background */}
        <div className="calendar-ambient-bg">
          <div className="ambient-orb orb-1" />
          <div className="ambient-orb orb-2" />
          <div className="ambient-orb orb-3" />
        </div>

        <div className={`calendar-shell ${selectedBooking ? 'blurred' : ''} ${areTopPanelsCollapsed ? 'panels-collapsed' : ''}`}>
          {/* Header */}
        <header className="calendar-page-header app-page-header">
          <div className="app-page-header-left">
            <div className="calendar-header-icon">
              <CalendarCheck size={20} />
            </div>
            <div>
              <h2 className="app-page-title">Booking Calendar</h2>
              <p className="app-page-subtitle">{studioName} — {format(currentDate, 'MMMM yyyy')}</p>
            </div>
          </div>
          <div className="calendar-header-actions app-page-actions">
            <div className="app-search app-search-lg calendar-header-search">
              <Search className="app-search-icon" />
              <input 
                type="text" 
                className="app-search-input"
                placeholder="Cari band / no HP..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                aria-label="Cari band atau nomor HP"
              />
              {searchQuery && (
                <button type="button" className="app-search-clear" onClick={() => setSearchQuery('')} aria-label="Bersihkan pencarian" title="Bersihkan pencarian">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="app-page-actions-buttons">
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
                    <span className="hide-on-mobile">{areTopPanelsCollapsed ? 'Tampilkan Panel' : 'Sembunyikan Panel'}</span>
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
                  <button className="btn-secondary calendar-print-btn" onClick={() => window.print()}>
                    <Printer size={16} />
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

              <button className="btn-primary calendar-new-btn" onClick={handleNewBooking}>
                <Plus size={18} /><span className="hide-on-mobile">New Booking</span>
              </button>
            </div>
          </div>
        </header>

      <AnimatePresence initial={false}>
        {!areTopPanelsCollapsed && (
          <motion.div
            id="calendar-top-panels"
            className="calendar-overview"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >
            {/* Stats Bar */}
            <div className="calendar-stats-grid">
              <div className="calendar-stat-card">
                <div className="calendar-stat-icon stat-icon-bookings">
                  <CalendarCheck size={18} color="var(--accent-cyan)" />
                </div>
                <div className="calendar-stat-data">
                  <span className="calendar-stat-value">{stats.totalBookings}</span>
                  <span className="calendar-stat-label">Total Booking</span>
                </div>
              </div>
              <div className="calendar-stat-card">
                <div className="calendar-stat-icon stat-icon-hours">
                  <Clock size={18} color="var(--accent-pink)" />
                </div>
                <div className="calendar-stat-data">
                  <span className="calendar-stat-value">{stats.totalHours}<small> jam</small></span>
                  <span className="calendar-stat-label">Jam Terpakai</span>
                </div>
              </div>
              <div className="calendar-stat-card">
                <div className="calendar-stat-icon stat-icon-revenue">
                  <DollarSign size={18} color="#4CAF50" />
                </div>
                <div className="calendar-stat-data">
                  <span className="calendar-stat-value">{formatCurrency(stats.totalRevenue)}</span>
                  <span className="calendar-stat-label">
                    Est. Pendapatan
                    {revTrend !== null && (
                      <span className={`trend-badge ${revTrend >= 0 ? 'up' : 'down'}`}>
                        <TrendingUp size={10} />{revTrend >= 0 ? '+' : ''}{revTrend}%
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <div className="calendar-stat-card">
                <div className="calendar-stat-legend">
                  <span className="calendar-stat-legend-item"><span className="dot confirmed" /> {stats.confirmed} Lunas</span>
                  <span className="calendar-stat-legend-item"><span className="dot dp" /> {stats.dp} DP</span>
                  <span className="calendar-stat-legend-item"><span className="dot pending" /> {stats.pending} Pending</span>
                </div>
              </div>
            </div>

            {/* Smart Scheduling */}
            <div className="app-smart-panel">

              {scheduleAnomalies.length > 0 && (
                <div className="cal-smart-alert">
                  <AlertTriangle size={15} />
                  <span>{scheduleAnomalies.length} anomali jadwal terdeteksi. Pertama: {scheduleAnomalies[0].detail}</span>
                </div>
              )}
            </div>

            {pendingRequests.length > 0 && (
              <div className="app-smart-panel">
                <div className="smart-head">
                  <Inbox size={20} />
                  <div>
                    <h3>Request Booking Publik</h3>
                    <p>{pendingRequests.length} request menunggu persetujuan admin.</p>
                  </div>
                </div>
                <div className="smart-list">
                  {pendingRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="cal-request-chip">
                      <div className="cal-request-info">
                        <strong>{request.band}</strong>
                        <span>{request.date} &bull; {String(request.hour).padStart(2, '0')}.00-{String(Number(request.hour) + Number(request.duration || 1)).padStart(2, '0')}.00</span>
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
      <section className="calendar-workspace app-panel">
        {/* Toolbar */}
        <div className="calendar-workspace-toolbar">
          {/* Left: Navigation */}
          <div className="calendar-toolbar-left">
            <button className="icon-btn nav-arrow" onClick={handlePrev} aria-label="Kembali ke periode sebelumnya"><ChevronLeft size={18} /></button>
            <span className="current-month">{getDateLabel()}</span>
            <button className="icon-btn nav-arrow" onClick={handleNext} aria-label="Lanjut ke periode berikutnya"><ChevronRight size={18} /></button>
            <button className="today-btn" onClick={handleGoToday}>Hari Ini</button>
          </div>

          {/* Right: View Switcher + Filters */}
          <div className="calendar-toolbar-right">
            <div className="view-switcher" role="tablist" aria-label="Pilih format tampilan kalender">
              {viewModes.map(({ id, label, icon: Icon }) => (
                <button 
                  key={id} 
                  className={`view-btn ${viewMode === id ? 'active' : ''}`} 
                  onClick={() => setViewMode(id)}
                  role="tab"
                  aria-selected={viewMode === id}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                  {viewMode === id && (
                    <motion.div 
                      layoutId="view-indicator"
                      className="view-btn-indicator"
                      transition={activeIndicatorTransition}
                    />
                  )}
                </button>
              ))}
            </div>
            <div className="quick-filters">
              {[
                { id: 'all', label: 'Semua', shortLabel: 'S' },
                { id: 'pending', label: 'Pending', shortLabel: 'P' },
                { id: 'dp', label: 'DP', shortLabel: 'DP' },
                { id: 'confirmed', label: 'Lunas', shortLabel: 'L' },
                { id: 'maintenance', label: 'Blokir', shortLabel: 'B' },
                { id: 'cancelled', label: 'Batal', shortLabel: 'X' },
              ].map(({ id, label }) => (
                <Tooltip.Root key={id}>
                  <Tooltip.Trigger asChild>
                    <button 
                      className={`filter-chip ${filterStatus === id ? `active ${id}` : ''}`} 
                      onClick={() => setFilterStatus(id)}
                      aria-pressed={filterStatus === id}
                      aria-label={`Filter status ${label}`}
                    >
                      {id !== 'all' && <span className={`dot ${id}`} style={id === 'maintenance' ? { background: '#6b6b76' } : undefined} />}
                      {label}
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="radix-tooltip-content" sideOffset={5} side="bottom">
                      {label}
                      <Tooltip.Arrow className="radix-tooltip-arrow" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div
          className={['monthly-grid-wrapper', 'calendar-timeline-wrapper', resizingBooking ? 'is-resize-active' : '', movingBooking ? 'is-move-active' : ''].filter(Boolean).join(' ')}
          ref={gridWrapperRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={['monthly-grid', 'calendar-timeline-grid', 'timeline-view-' + viewMode].filter(Boolean).join(' ')}
            style={{
              gridTemplateColumns: dateColWidth + ' repeat(' + hoursArray.length + ', minmax(' + hourColWidth + ', ' + hourColWidth + '))',
              gridTemplateRows: '48px repeat(' + daysMetadata.length + ', ' + (viewMode === 'day' ? (isMobile ? '76px' : '86px') : viewMode === 'week' ? (isMobile ? '62px' : '70px') : (isMobile ? '52px' : '58px')) + ')',
            }}
          >
            <div className="grid-corner-cell timeline-corner" style={{ gridRow: 1, gridColumn: 1 }}>
              <span className="corner-label">TGL</span>
            </div>

            {hoursArray.map((hour, hourIdx) => {
              const isCurrentHour = now.getHours() === hour;
              return (
                <div
                  key={'hour-' + hour}
                  className={['grid-header-cell', 'timeline-hour-header', hourIdx % 2 === 0 ? 'even-hour' : '', isCurrentHour ? 'current-hour' : ''].filter(Boolean).join(' ')}
                  style={{ gridRow: 1, gridColumn: hourIdx + 2 }}
                >
                  <span className="timeline-hour-label">{String(hour).padStart(2, '0')}.00</span>
                  <span className="timeline-hour-end">{String(hour + 1).padStart(2, '0')}.00</span>
                </div>
              );
            })}

            {daysMetadata.map((meta, dayIdx) => {
              const rowNumber = dayIdx + 2;

              return (
                <React.Fragment key={meta.dateStr}>
                  <div
                    className={['time-label', 'sticky-col', 'timeline-date-cell', meta.isToday ? 'today-date' : '', meta.isWeekend ? 'weekend-date' : '', meta.isBlocked ? 'blocked-date' : ''].filter(Boolean).join(' ')}
                    style={{ gridRow: rowNumber, gridColumn: 1 }}
                  >
                    <span className="timeline-date-day">{dayNames[meta.dow]}</span>
                    <span className="timeline-date-number">{meta.dayNum}</span>
                    {meta.isBlocked && <AlertTriangle size={11} className="timeline-date-alert" />}
                  </div>

                  {hoursArray.map((hour, hourIdx) => {
                    const isCurrentSlot = meta.isToday && now.getHours() === hour;
                    const timeLineLeft = isCurrentSlot ? String((now.getMinutes() / 60) * 100) + '%' : null;
                    const isMoveTarget = moveTarget && moveTarget.date === meta.dateStr && Number(moveTarget.hour) === hour;
                    const moveTargetClass = isMoveTarget ? (moveTarget.isValid ? 'move-target-valid' : 'move-target-invalid') : '';

                    const cellClasses = [
                      'grid-cell',
                      'empty-cell',
                      'timeline-slot-cell',
                      hourIdx % 2 === 0 ? 'even-hour' : '',
                      meta.isToday ? 'today-row-highlight' : '',
                      meta.isWeekend ? 'weekend-row' : '',
                      meta.isBlocked ? 'blocked-cell' : '',
                      moveTargetClass,
                    ].filter(Boolean).join(' ');

                    return (
                      <div
                        key={meta.dateStr + '-' + hour}
                        className={cellClasses}
                        style={{ gridRow: rowNumber, gridColumn: hourIdx + 2 }}
                        data-calendar-cell="true"
                        data-date={meta.dateStr}
                        data-hour={hour}
                        onClick={() => handleCellClick(meta.dateStr, hour)}
                        onDragOver={handleDragOver}
                        onDrop={(event) => handleDrop(event, meta.dateStr, hour)}
                        role="button"
                        tabIndex={0}
                        aria-label={'Slot kosong pukul ' + hour + '.00 tanggal ' + meta.ariaLabelDate + '. Tekan Enter untuk membuat booking baru.'}
                        onKeyDown={(event) => handleCellKeyDown(event, meta.dateStr, hour)}
                      >
                        {isCurrentSlot && <div className="current-time-line vertical-time-line" style={{ left: timeLineLeft }} />}
                        <span className="hover-plus">+</span>
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}

            {/* Floating Booking Timeline Bars */}
            {visibleBookings.map((booking) => {
              const dayIdx = daysMetadata.findIndex((day) => day.dateStr === booking.date);
              if (dayIdx === -1) return null;

              const bookingHour = Number(booking.hour);
              const bookingDuration = Number(booking.duration || 1);
              const startColumn = Math.max(2, bookingHour - startHour + 2);
              const endColumn = Math.min(hoursArray.length + 2, startColumn + bookingDuration);
              const rowNumber = dayIdx + 2;

              const isMovingSource = movingBooking && movingBooking.id === booking.id;
              const isToday = daysMetadata[dayIdx].isToday;
              const hasCurrentTime = isToday && now.getHours() >= bookingHour && now.getHours() < (bookingHour + bookingDuration);
              const timeLineLeft = hasCurrentTime
                ? String(((now.getHours() - bookingHour + (now.getMinutes() / 60)) / bookingDuration) * 100) + '%'
                : null;

              const cardClasses = [
                'grid-cell',
                'booked-cell',
                'timeline-booking-card',
                'status-' + booking.status,
                booking.isResizing ? 'is-resizing' : '',
                isMovingSource ? 'is-moving-source' : '',
                booking.isVIP ? 'booking-vip' : '',
                booking.type === 'recording' ? 'booking-recording' : '',
              ].filter(Boolean).join(' ');

              return (
                <div
                  key={booking.id}
                  className={cardClasses}
                  style={{
                    gridRow: String(rowNumber),
                    gridColumn: String(startColumn) + ' / ' + String(endColumn),
                  }}
                  onClick={(event) => handleBookingClick(event, booking)}
                  onPointerDown={(event) => handleMobileBookingPointerDown(event, booking)}
                  onContextMenu={(event) => event.preventDefault()}
                  draggable={!isMobile}
                  onDragStart={(event) => handleDragStart(event, booking)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(event) => handleDrop(event, booking.date, booking.hour)}
                  role="button"
                  tabIndex={0}
                  aria-label={'Jadwal ' + booking.band + ', pukul ' + booking.hour + '.00 durasi ' + booking.duration + ' jam tanggal ' + daysMetadata[dayIdx].ariaLabelDate + '. Status: ' + getStatusLabel(booking.status) + '.'}
                  onKeyDown={(event) => handleBookingKeyDown(event, booking)}
                >
                  {hasCurrentTime && <div className="current-time-line vertical-time-line booking-now-line" style={{ left: timeLineLeft }} />}

                  <div className="booking-info">
                    <span className="booking-band-name">
                      {booking.isVIP && (
                        <svg className="vip-star-icon" viewBox="0 0 24 24" fill="#FFC107" width="10" height="10" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4, transform: 'translateY(-1px)' }}>
                          <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
                        </svg>
                      )}
                      {booking.band}
                    </span>

                    <div className="booking-meta-row" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {booking.type === 'recording' && (
                        <span className="rec-indicator" title="Recording Session">
                          <span className="rec-dot" />
                          <span className="rec-text" style={{ fontSize: '9px', fontWeight: 800 }}>REC</span>
                        </span>
                      )}
                      <span className="booking-time-label">{booking.hour}.00–{booking.hour + booking.duration}.00</span>
                    </div>
                  </div>

                  <div className="resize-handle timeline-resize-handle" onMouseDown={(event) => handleResizeStart(event, booking)} onTouchStart={(event) => handleResizeStart(event, booking)}>
                    <div className="resize-line" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {movingBooking && moveGhost && (
            <motion.div
              className={`mobile-booking-drag-ghost status-${movingBooking.status}`}
              style={{
                left: moveGhost.x,
                top: moveGhost.y,
                width: moveGhost.width,
                height: moveGhost.height,
                transform: 'translate3d(0px, 0px, 0)'
              }}
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 6 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
              <strong>{movingBooking.band}</strong>
              <span>{movingBooking.hour}.00-{movingBooking.hour + movingBooking.duration}.00</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {movingBooking && moveTarget && (
            <motion.div
              className={`mobile-move-hint ${moveTarget.isValid ? 'valid' : 'invalid'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
              <strong>{moveTarget.isValid ? 'Lepaskan untuk pindah' : moveTarget.reason}</strong>
              <span>{moveTarget.date} - {String(moveTarget.hour).padStart(2, '0')}:00, durasi {moveTarget.duration} jam</span>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
      </div>

      {/* Booking Detail — Bottom Sheet on mobile, Popup on desktop */}
      {createPortal(
        <div className="booking-detail-portal-container" style={{ position: 'fixed', inset: 0, zIndex: 100000, pointerEvents: 'none' }}>
          <AnimatePresence>
            {selectedBooking && isMobile && (
              <motion.div
                key="detail-overlay"
                className="detail-overlay"
                onClick={() => setSelectedBooking(null)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeInOut' }}
                style={{ pointerEvents: 'auto' }}
              />
            )}
            {selectedBooking && (() => {
              const b = bookings.find(x => x.id === selectedBooking.id) || selectedBooking;
              const isRecording = b.type === 'recording';
              const basePrice = isRecording ? (b.sessionPrice || 0) : (b.duration * pricePerHour);
              const equipmentCost = b.equipmentCost || 0;
              const totalPrice = basePrice + equipmentCost - (b.discountAmount || 0);
              
              return (
                <motion.div
                  key="detail-popup"
                  className={`booking-detail-popup ${isMobile ? 'mobile-sheet' : ''}`}
                  style={{
                    pointerEvents: 'auto',
                    ...(!isMobile ? { top: detailPos.top, left: detailPos.left } : {})
                  }}
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
                      <h4>{b.band} {isRecording && <span className="recording-pill">Recording</span>}</h4>
                    </div>
                    <div className="detail-header-actions">
                      <span className={`detail-status-badge status-${b.status}`}>{getStatusLabel(b.status)}</span>
                      <button className="icon-btn detail-close" onClick={() => setSelectedBooking(null)} aria-label="Tutup detail booking"><X size={16} /></button>
                    </div>
                  </div>

                  <div className="detail-body">
                    {/* Time */}
                    <div className="detail-info-row">
                      <Clock size={14} />
                      <div className="detail-info-content">
                        <span>{b.date} • {b.hour}.00 – {b.hour + b.duration}.00 WIB</span>
                        {isRecording ? (
                          <div className="duration-controls is-muted">
                            <span className="dur-label">Paket Sesi ({b.duration} jam)</span>
                          </div>
                        ) : (
                          <div className="duration-controls">
                            <button className="dur-btn" onClick={() => updateBooking(b.id, { duration: Math.max(1, b.duration - 1) })} disabled={b.duration <= 1} aria-label="Kurangi durasi">−</button>
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
                          }} aria-label="Tambah durasi">+</button>
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
                    <button className="btn-danger" onClick={() => handleDeleteBooking(b.id)}>
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
                        <button className="btn-danger" onClick={() => handleCancelBooking(b)}>
                          <X size={14} /><span>Batal Booking</span>
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>,
        document.body
      )}

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
          <div className="resize-confirm-body">
            <div className="resize-warning-box">
              <h4>Perubahan Durasi & Biaya</h4>
              <p>
                Durasi: <strong>{resizeConfirmData.oldDuration} jam</strong> <span className="resize-arrow">{'->'}</span> <strong className="resize-new-duration">{resizeConfirmData.newDuration} jam</strong>
              </p>
            </div>

            <div className="resize-price-details">
              <div className="resize-price-row">
                <span>Total Biaya Sebelumnya</span>
                <span>{formatCurrency(resizeConfirmData.oldPrice)}</span>
              </div>
              <div className="resize-price-row is-total">
                <span>Total Biaya Baru</span>
                <span>{formatCurrency(resizeConfirmData.newPrice)}</span>
              </div>
            </div>

            {resizeConfirmData.diff !== 0 && (
              <div className={`resize-diff-note ${resizeConfirmData.diff > 0 ? 'increase' : 'decrease'}`}>
                {resizeConfirmData.diff > 0 
                  ? `Biaya bertambah sebesar ${formatCurrency(resizeConfirmData.diff)}.` 
                  : `Terdapat kelebihan biaya (pengurangan) sebesar ${formatCurrency(Math.abs(resizeConfirmData.diff))}.`}
              </div>
            )}

            {resizeConfirmData.booking.type === 'recording' && resizeConfirmData.newDuration > resizeConfirmData.oldDuration && (
              <div className="resize-recording-note">
                * Sesi recording menggunakan harga paket. Penambahan jam dihitung sebagai overtime.
              </div>
            )}

            {resizeConfirmData.booking.status === 'confirmed' && resizeConfirmData.diff > 0 && (
              <div className="resize-status-warning">
                <strong>Perhatian:</strong> Booking ini sebelumnya berstatus <strong>Lunas</strong>. Karena ada penambahan durasi & biaya, status akan otomatis diubah menjadi <strong>DP</strong> (Kurang Bayar).
              </div>
            )}

            <div className="resize-confirm-actions">
              <button className="btn-secondary" onClick={() => setResizeConfirmData(null)}>Batal</button>
              <button className="btn-primary" onClick={confirmResize}>Konfirmasi Perubahan</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
    </Tooltip.Provider>
  );
};

export default CalendarPage;
