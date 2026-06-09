import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { hasBookingOverlap } from '../lib/bookingWorkflows';

const getPointerPoint = (event) => {
  const source = event.touches?.[0] || event.changedTouches?.[0] || event;
  return { x: source.clientX ?? 0, y: source.clientY ?? 0 };
};

const buildBookingsByDate = (bookings = []) => {
  const grouped = new Map();
  bookings.forEach((booking) => {
    const date = booking?.date;
    if (!date) return;
    const dayBookings = grouped.get(date) || [];
    dayBookings.push(booking);
    grouped.set(date, dayBookings);
  });
  return grouped;
};

export const useCalendarBookingMove = ({
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
}) => {
  const [movingBooking, setMovingBooking] = useState(null);
  const [moveGhost, setMoveGhost] = useState(null);
  const [moveTarget, setMoveTarget] = useState(null);
  const longPressTimerRef = useRef(null);
  const suppressClickTimerRef = useRef(null);
  const activeCleanupRef = useRef(null);
  const moveTargetRef = useRef(null);
  const suppressNextBookingClickRef = useRef(false);
  const lastTargetUpdateRef = useRef(0);
  const translationRef = useRef({ dx: 0, dy: 0 });
  const ghostElementRef = useRef(null);
  const ghostFrameRef = useRef(null);
  const latestGhostTranslationRef = useRef({ dx: 0, dy: 0 });

  const blockedDateSet = useMemo(() => new Set(blockedDates || []), [blockedDates]);
  const bookingsByDate = useMemo(() => buildBookingsByDate(bookings), [bookings]);

  const getMoveTargetAtPoint = useCallback((point, booking) => {
    const element = document.elementFromPoint(point.x, point.y)?.closest('[data-calendar-cell="true"]');
    if (!element || !gridWrapperRef.current?.contains(element)) return null;

    const date = element.dataset.date;
    const hour = Number(element.dataset.hour);
    if (!date || Number.isNaN(hour)) return null;

    const candidate = { date, hour, duration: Number(booking.duration || 1) };
    const isBlocked = blockedDateSet.has(date);
    const isOutsideHours = hour < Number(operationalHours.start) || hour + candidate.duration > Number(operationalHours.end);
    const dayBookings = bookingsByDate.get(date) || [];
    const hasConflict = hasBookingOverlap(dayBookings, candidate, booking.id);
    const isSameSlot = booking.date === date && Number(booking.hour) === hour;

    return {
      date,
      hour,
      duration: candidate.duration,
      isSameSlot,
      isValid: !isBlocked && !isOutsideHours && !hasConflict,
      reason: isBlocked ? 'Tanggal diblokir' : isOutsideHours ? 'Di luar jam operasional' : hasConflict ? 'Slot bentrok' : 'Slot tersedia',
    };
  }, [blockedDateSet, bookingsByDate, gridWrapperRef, operationalHours.end, operationalHours.start]);

  const applyMoveTarget = useCallback((point, booking) => {
    const target = getMoveTargetAtPoint(point, booking);
    const prev = moveTargetRef.current;
    const hasChanged = (!prev && target) ||
                       (prev && !target) ||
                       (prev && target && (prev.date !== target.date || prev.hour !== target.hour || prev.isValid !== target.isValid));
    if (hasChanged) {
      moveTargetRef.current = target;
      setMoveTarget(target);
    }
  }, [getMoveTargetAtPoint]);

  const scheduleGhostTransform = useCallback((dx, dy) => {
    latestGhostTranslationRef.current = { dx, dy };
    if (ghostFrameRef.current) return;

    ghostFrameRef.current = window.requestAnimationFrame(() => {
      ghostFrameRef.current = null;
      const ghostEl = ghostElementRef.current || document.querySelector('.mobile-booking-drag-ghost');
      ghostElementRef.current = ghostEl;
      if (ghostEl) {
        const latest = latestGhostTranslationRef.current;
        ghostEl.style.transform = `translate3d(${latest.dx}px, ${latest.dy}px, 0)`;
      }
    });
  }, []);

  const finishMobileMove = useCallback((booking, target) => {
    if (!target) {
      useNotificationStore.getState().addNotification({
        title: 'Pindah booking dibatalkan',
        message: 'Lepaskan booking di area kalender yang valid.',
        type: 'warning',
      });
      return;
    }

    if (!target.isValid) {
      useNotificationStore.getState().addNotification({
        title: target.reason,
        message: 'Jam tujuan harus kosong sesuai durasi booking sebelumnya.',
        type: 'error',
      });
      return;
    }

    if (target.isSameSlot) return;

    updateBooking(booking.id, { date: target.date, hour: target.hour });
    useNotificationStore.getState().addNotification({
      title: 'Booking dipindahkan',
      message: `${booking.band} dipindahkan ke ${target.date} jam ${String(target.hour).padStart(2, '0')}.00.`,
      type: 'success',
    });
  }, [updateBooking]);

  const handleMobileBookingPointerDown = useCallback((event, booking) => {
    if (!isMobile || resizingBooking || event.target.closest('.resize-handle')) return;
    if (event.button !== undefined && event.button !== 0) return;

    activeCleanupRef.current?.();

    const startPoint = getPointerPoint(event);
    const sourceRect = event.currentTarget.getBoundingClientRect();
    const cellHeight = getCalendarCellHeight();
    const ghostHeight = Math.max(cellHeight, cellHeight * Number(booking.duration || 1));
    const ghostWidth = sourceRect.width;
    let isActivated = false;
    let hasDraggedAfterActivation = false;
    let isCleanedUp = false;

    const clearTimer = () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    const clearSuppressClickTimer = () => {
      if (suppressClickTimerRef.current) {
        window.clearTimeout(suppressClickTimerRef.current);
        suppressClickTimerRef.current = null;
      }
    };

    const clearGhostFrame = () => {
      if (ghostFrameRef.current) {
        window.cancelAnimationFrame(ghostFrameRef.current);
        ghostFrameRef.current = null;
      }
      ghostElementRef.current = null;
    };

    const setGhostAtPoint = (point) => {
      setMoveGhost({
        x: point.x - (ghostWidth / 2),
        y: point.y - Math.min(28, ghostHeight / 2),
        width: ghostWidth,
        height: ghostHeight,
      });
    };

    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      activeCleanupRef.current = null;
      clearTimer();
      clearGhostFrame();
      document.body.classList.remove('calendar-move-lock', 'calendar-interaction-lock');
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerCancel);
      setMovingBooking(null);
      setMoveGhost(null);
      setMoveTarget(null);
      moveTargetRef.current = null;
      lastTargetUpdateRef.current = 0;
      translationRef.current = { dx: 0, dy: 0 };
      latestGhostTranslationRef.current = { dx: 0, dy: 0 };
      if (isActivated) {
        clearSuppressClickTimer();
        suppressClickTimerRef.current = window.setTimeout(() => {
          suppressNextBookingClickRef.current = false;
          suppressClickTimerRef.current = null;
        }, 500);
      }
    };

    const activateMove = () => {
      if (isCleanedUp) return;
      isActivated = true;
      suppressNextBookingClickRef.current = true;
      touchStartRef.current = null;
      moveTargetRef.current = null;
      ghostElementRef.current = null;
      document.body.classList.add('calendar-move-lock', 'calendar-interaction-lock');
      setSelectedBooking(null);
      setMovingBooking(booking);
      setGhostAtPoint(startPoint);
      applyMoveTarget(startPoint, booking);
      if (navigator.vibrate) navigator.vibrate(12);
    };

    const handlePointerMove = (moveEvent) => {
      const point = getPointerPoint(moveEvent);
      const movedDistance = Math.hypot(point.x - startPoint.x, point.y - startPoint.y);

      if (!isActivated && movedDistance > 12) {
        cleanup();
        return;
      }

      if (!isActivated) return;
      if (moveEvent.cancelable) moveEvent.preventDefault();
      moveEvent.stopPropagation();
      if (movedDistance > 12) hasDraggedAfterActivation = true;

      const dx = point.x - startPoint.x;
      const dy = point.y - startPoint.y;
      translationRef.current = { dx, dy };
      scheduleGhostTransform(dx, dy);

      // Throttle hit-testing (document.elementFromPoint) to at most once every 32ms on mobile.
      const nowTime = performance.now();
      if (nowTime - lastTargetUpdateRef.current > 32) {
        applyMoveTarget(point, booking);
        lastTargetUpdateRef.current = nowTime;
      }
    };

    const handlePointerUp = (upEvent) => {
      if (isActivated) {
        if (upEvent.cancelable) upEvent.preventDefault();
        upEvent.stopPropagation();
        const target = moveTargetRef.current;
        cleanup();
        if (!hasDraggedAfterActivation) return;
        finishMobileMove(booking, target);
        return;
      }
      cleanup();
    };

    const handlePointerCancel = () => {
      cleanup();
    };

    activeCleanupRef.current = cleanup;
    longPressTimerRef.current = window.setTimeout(activateMove, 360);
    document.addEventListener('pointermove', handlePointerMove, { passive: false });
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerCancel);
  }, [applyMoveTarget, finishMobileMove, getCalendarCellHeight, isMobile, resizingBooking, scheduleGhostTransform, setSelectedBooking, touchStartRef]);

  useEffect(() => () => {
    activeCleanupRef.current?.();
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
    if (suppressClickTimerRef.current) window.clearTimeout(suppressClickTimerRef.current);
    if (ghostFrameRef.current) window.cancelAnimationFrame(ghostFrameRef.current);
    document.body.classList.remove('calendar-move-lock', 'calendar-interaction-lock');
  }, []);

  return {
    movingBooking,
    moveGhost,
    moveTarget,
    translationRef,
    suppressNextBookingClickRef,
    handleMobileBookingPointerDown,
  };
};
