import { useCallback, useEffect, useRef, useState } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { hasBookingOverlap } from '../lib/bookingWorkflows';

const getPointerPoint = (event) => {
  const source = event.touches?.[0] || event.changedTouches?.[0] || event;
  return { x: source.clientX ?? 0, y: source.clientY ?? 0 };
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
  const moveTargetRef = useRef(null);
  const suppressNextBookingClickRef = useRef(false);

  const getMoveTargetAtPoint = useCallback((point, booking) => {
    const element = document.elementFromPoint(point.x, point.y)?.closest('[data-calendar-cell="true"]');
    if (!element || !gridWrapperRef.current?.contains(element)) return null;

    const date = element.dataset.date;
    const hour = Number(element.dataset.hour);
    if (!date || Number.isNaN(hour)) return null;

    const candidate = { date, hour, duration: Number(booking.duration || 1) };
    const isBlocked = blockedDates.includes(date);
    const isOutsideHours = hour < Number(operationalHours.start) || hour + candidate.duration > Number(operationalHours.end);
    const hasConflict = hasBookingOverlap(bookings, candidate, booking.id);
    const isSameSlot = booking.date === date && Number(booking.hour) === hour;

    return {
      date,
      hour,
      duration: candidate.duration,
      isSameSlot,
      isValid: !isBlocked && !isOutsideHours && !hasConflict,
      reason: isBlocked ? 'Tanggal diblokir' : isOutsideHours ? 'Di luar jam operasional' : hasConflict ? 'Slot bentrok' : 'Slot tersedia',
    };
  }, [blockedDates, bookings, gridWrapperRef, operationalHours.end, operationalHours.start]);

  const applyMoveTarget = useCallback((point, booking) => {
    const target = getMoveTargetAtPoint(point, booking);
    moveTargetRef.current = target;
    setMoveTarget(target);
  }, [getMoveTargetAtPoint]);

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

    const startPoint = getPointerPoint(event);
    const sourceRect = event.currentTarget.getBoundingClientRect();
    const cellHeight = getCalendarCellHeight();
    const ghostHeight = Math.max(cellHeight, cellHeight * Number(booking.duration || 1));
    const ghostWidth = sourceRect.width;
    let isActivated = false;
    let hasDraggedAfterActivation = false;

    const clearTimer = () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
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
      clearTimer();
      document.body.classList.remove('calendar-move-lock');
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerCancel);
      setMovingBooking(null);
      setMoveGhost(null);
      setMoveTarget(null);
      moveTargetRef.current = null;
      if (isActivated) {
        window.setTimeout(() => {
          suppressNextBookingClickRef.current = false;
        }, 500);
      }
    };

    const activateMove = () => {
      isActivated = true;
      suppressNextBookingClickRef.current = true;
      touchStartRef.current = null;
      moveTargetRef.current = null;
      document.body.classList.add('calendar-move-lock');
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
      setGhostAtPoint(point);
      applyMoveTarget(point, booking);
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

    longPressTimerRef.current = window.setTimeout(activateMove, 500);
    document.addEventListener('pointermove', handlePointerMove, { passive: false });
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerCancel);
  }, [applyMoveTarget, finishMobileMove, getCalendarCellHeight, isMobile, resizingBooking, setSelectedBooking, touchStartRef]);

  useEffect(() => () => {
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
    document.body.classList.remove('calendar-move-lock');
  }, []);

  return {
    movingBooking,
    moveGhost,
    moveTarget,
    suppressNextBookingClickRef,
    handleMobileBookingPointerDown,
  };
};
