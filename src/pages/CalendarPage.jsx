import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { createPortal } from 'react-dom';
import { Calendar, LayoutGrid, CalendarDays } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, addDays, subDays, getDay, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';
import { useBookingStore } from '../store/useBookingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useBookingRequestStore } from '../store/useBookingRequestStore';
import { useNotificationStore } from '../store/useNotificationStore';
import * as Tooltip from '@radix-ui/react-tooltip';
import Modal from '../components/Modal';
import BookingForm from '../components/BookingForm';
import { getAnomalies } from '../lib/smartInsights';
import { hasBookingOverlap } from '../lib/bookingWorkflows';
import { useCalendarBookingMove } from '../hooks/useCalendarBookingMove';
import { useCalendarBookingResize } from '../hooks/useCalendarBookingResize';
import Fuse from 'fuse.js';
import useSound from 'use-sound';
import { useThemeStore } from '../store/useThemeStore';
import { CLICK_SOUND } from '../lib/sounds';
import BookingDetailPopup from '../features/calendar/BookingDetailPopup';
import CalendarGrid from '../features/calendar/CalendarGrid';
import CalendarHeader from '../features/calendar/CalendarHeader';
import CalendarMobileControls from '../features/calendar/CalendarMobileControls';
import CalendarOverview from '../features/calendar/CalendarOverview';
import CalendarWorkspaceToolbar from '../features/calendar/CalendarWorkspaceToolbar';
import './CalendarPrintStyles.css';
import '../features/calendar/calendar.css';

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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
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
    const cell = gridWrapperRef.current?.querySelector('.grid-cell');
    return cell?.getBoundingClientRect().height || (isMobile ? 36 : 45);
  }, [isMobile]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
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

  const numDays = daysArray.length;

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

  const bookingsLookup = useMemo(() => {
    const map = {};
    displayBookings.forEach(b => {
      for (let h = b.hour; h < b.hour + b.duration; h++) {
        map[`${b.date}-${h}`] = b;
      }
    });
    return map;
  }, [displayBookings]);

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
  const selectedBookingDetail = selectedBooking ? (bookings.find((booking) => booking.id === selectedBooking.id) || selectedBooking) : null;
  const handleChangeBookingDuration = (booking, nextDuration) => {
    if (nextDuration === booking.duration) return;

    const candidate = { date: booking.date, hour: booking.hour, duration: nextDuration };
    if (hasBookingOverlap(bookings, candidate, booking.id)) {
      useNotificationStore.getState().addNotification({ title: 'Jadwal Bentrok!', message: 'Durasi bertabrakan dengan booking lain.', type: 'error' });
      return;
    }

    updateBooking(booking.id, { duration: nextDuration });
  };

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
    if (viewMode === 'week') return `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'dd MMM')} - ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), 'dd MMM yyyy')}`;
    return format(currentDate, 'MMMM yyyy');
  };

  const colWidth = isMobile 
    ? (viewMode === 'day' ? '100%' : viewMode === 'week' ? '85px' : '45px')
    : (viewMode === 'day' ? '200px' : viewMode === 'week' ? '120px' : '60px');
  const timeColWidth = isMobile ? '45px' : '100px';

  return (
    <Tooltip.Provider delayDuration={200}>
      <div className="cal-page">

        <div className="calendar-shell">
          {isMobile && (
            <CalendarMobileControls
              dateLabel={getDateLabel()}
              filterStatus={filterStatus}
              searchQuery={searchQuery}
              studioName={studioName}
              viewMode={viewMode}
              viewModes={viewModes}
              onChangeFilter={setFilterStatus}
              onChangeSearch={setSearchQuery}
              onChangeViewMode={setViewMode}
              onClearSearch={() => setSearchQuery('')}
              onGoToday={handleGoToday}
              onNewBooking={handleNewBooking}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}

          <CalendarHeader
            areTopPanelsCollapsed={areTopPanelsCollapsed}
            currentDate={currentDate}
            searchQuery={searchQuery}
            studioName={studioName}
            onClearSearch={() => setSearchQuery('')}
            onNewBooking={handleNewBooking}
            onPrint={() => window.print()}
            onSearchChange={setSearchQuery}
            onTogglePanels={() => setAreTopPanelsCollapsed((value) => !value)}
          />

      <CalendarOverview
        formatCurrency={formatCurrency}
        isCollapsed={areTopPanelsCollapsed}
        pendingRequests={pendingRequests}
        revTrend={revTrend}
        scheduleAnomalies={scheduleAnomalies}
        stats={stats}
        onApproveRequest={handleApproveRequest}
        onRejectRequest={handleRejectRequest}
      />

      {/* Calendar Workspace */}
      <section className="cal-workspace">
        <CalendarWorkspaceToolbar
          dateLabel={getDateLabel()}
          filterStatus={filterStatus}
          isMobile={isMobile}
          viewMode={viewMode}
          viewModes={viewModes}
          onChangeFilter={setFilterStatus}
          onChangeViewMode={setViewMode}
          onGoToday={handleGoToday}
          onNext={handleNext}
          onPrev={handlePrev}
        />
        <CalendarGrid
          bookingsLookup={bookingsLookup}
          colWidth={colWidth}
          dayNames={dayNames}
          daysMetadata={daysMetadata}
          gridWrapperRef={gridWrapperRef}
          hoursArray={hoursArray}
          isMobile={isMobile}
          moveGhost={moveGhost}
          moveTarget={moveTarget}
          movingBooking={movingBooking}
          now={now}
          numDays={numDays}
          resizingBooking={resizingBooking}
          startHour={startHour}
          timeColWidth={timeColWidth}
          visibleBookings={visibleBookings}
          getStatusLabel={getStatusLabel}
          onBookingClick={handleBookingClick}
          onBookingKeyDown={handleBookingKeyDown}
          onCellClick={handleCellClick}
          onCellKeyDown={handleCellKeyDown}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          onMobileBookingPointerDown={handleMobileBookingPointerDown}
          onResizeStart={handleResizeStart}
          onTouchEnd={handleTouchEnd}
          onTouchStart={handleTouchStart}
        />
      </section>
      </div>

      {createPortal(
        <BookingDetailPopup
          booking={selectedBookingDetail}
          detailPos={detailPos}
          formatCurrency={formatCurrency}
          inventory={inventory}
          isMobile={isMobile}
          pricePerHour={pricePerHour}
          getStatusLabel={getStatusLabel}
          onCancelBooking={handleCancelBooking}
          onChangeDuration={handleChangeBookingDuration}
          onClose={() => setSelectedBooking(null)}
          onDeleteBooking={handleDeleteBooking}
          onOpenReschedule={openRescheduleModal}
          onSendReminder={handleSendReminder}
          onStatusChange={handleStatusChange}
        />,
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
