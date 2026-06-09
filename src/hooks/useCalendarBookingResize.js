import { useCallback, useEffect, useRef, useState } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { hasBookingOverlap } from '../lib/bookingWorkflows';

const getPointerAxis = (event) => {
  const source = event.touches?.[0] || event.changedTouches?.[0] || event;
  return source.clientX ?? 0;
};

const getResizeDeltaHours = (diff, cellSize) => {
  const safeCellSize = Math.max(1, Number(cellSize || 1));
  const deadZone = Math.max(10, safeCellSize * 0.18);
  if (Math.abs(diff) < deadZone) return 0;
  return Math.round(diff / safeCellSize);
};

export const useCalendarBookingResize = ({
  bookings,
  updateBooking,
  calculatePrice,
  getCalendarCellHeight,
  touchStartRef,
}) => {
  const [resizingBooking, setResizingBooking] = useState(null);
  const [initialResizeAxis, setInitialResizeAxis] = useState(0);
  const [resizeAddedHours, setResizeAddedHours] = useState(0);
  const [resizeConfirmData, setResizeConfirmData] = useState(null);
  const resizeFrameRef = useRef(null);
  const latestAddedHoursRef = useRef(0);
  const resizeCellSizeRef = useRef(1);

  const resetResizeState = useCallback(() => {
    setResizingBooking(null);
    setResizeAddedHours(0);
    latestAddedHoursRef.current = 0;
    resizeCellSizeRef.current = 1;
  }, []);

  const handleResizeStart = useCallback((event, booking) => {
    if (event.button !== undefined && event.button !== 0) return;

    event.stopPropagation();
    if (event.cancelable) event.preventDefault();

    touchStartRef.current = null;
    latestAddedHoursRef.current = 0;
    resizeCellSizeRef.current = getCalendarCellHeight();
    setResizingBooking(booking);
    setInitialResizeAxis(getPointerAxis(event));
    setResizeAddedHours(0);
  }, [getCalendarCellHeight, touchStartRef]);

  useEffect(() => {
    const calculateAddedHours = (event) => {
      const diff = getPointerAxis(event) - initialResizeAxis;
      return getResizeDeltaHours(diff, resizeCellSizeRef.current);
    };

    const scheduleResizeAddedHours = (addedHours) => {
      latestAddedHoursRef.current = addedHours;
      if (resizeFrameRef.current) return;

      resizeFrameRef.current = window.requestAnimationFrame(() => {
        resizeFrameRef.current = null;
        setResizeAddedHours((previous) => previous === latestAddedHoursRef.current ? previous : latestAddedHoursRef.current);
      });
    };

    const handleResizeMove = (event) => {
      if (!resizingBooking) return;
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();

      scheduleResizeAddedHours(calculateAddedHours(event));
    };

    const handleResizeEnd = (event) => {
      if (!resizingBooking) return;
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();

      if (resizeFrameRef.current) {
        window.cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = null;
      }

      const addedHours = calculateAddedHours(event);

      if (addedHours !== 0) {
        const newDuration = Math.max(1, Math.min(13, Number(resizingBooking.duration || 1) + addedHours));

        if (newDuration !== resizingBooking.duration) {
          const candidate = {
            date: resizingBooking.date,
            hour: resizingBooking.hour,
            duration: newDuration,
          };

          const sameDayBookings = bookings.filter((booking) => booking.date === candidate.date);
          if (hasBookingOverlap(sameDayBookings, candidate, resizingBooking.id)) {
            useNotificationStore.getState().addNotification({
              title: 'Jadwal Bentrok!',
              message: 'Perubahan durasi bertabrakan dengan booking lain.',
              type: 'error',
            });
            resetResizeState();
            return;
          }

          if (resizingBooking.type === 'maintenance') {
            updateBooking(resizingBooking.id, { duration: newDuration });
          } else {
            const oldCalc = calculatePrice(resizingBooking, resizingBooking.duration);
            const newCalc = calculatePrice(resizingBooking, newDuration);

            setResizeConfirmData({
              booking: resizingBooking,
              oldDuration: resizingBooking.duration,
              newDuration,
              oldPrice: oldCalc.total,
              newPrice: newCalc.total,
              newDiscountAmount: newCalc.durDisc + newCalc.vipDisc,
              diff: newCalc.total - oldCalc.total,
            });
          }
        }
      }

      resetResizeState();
    };

    if (resizingBooking) {
      document.body.classList.add('calendar-resize-lock', 'calendar-interaction-lock');
      document.addEventListener('mousemove', handleResizeMove, { passive: false });
      document.addEventListener('mouseup', handleResizeEnd);
      document.addEventListener('touchmove', handleResizeMove, { passive: false });
      document.addEventListener('touchend', handleResizeEnd);
      document.addEventListener('touchcancel', handleResizeEnd);
    }

    return () => {
      if (resizeFrameRef.current) {
        window.cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = null;
      }
      document.body.classList.remove('calendar-resize-lock', 'calendar-interaction-lock');
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.removeEventListener('touchmove', handleResizeMove);
      document.removeEventListener('touchend', handleResizeEnd);
      document.removeEventListener('touchcancel', handleResizeEnd);
    };
  }, [bookings, calculatePrice, initialResizeAxis, resetResizeState, resizingBooking, updateBooking]);

  const confirmResize = useCallback(() => {
    if (!resizeConfirmData) return;

    const { booking, newDuration, newPrice, newDiscountAmount } = resizeConfirmData;
    let newStatus = booking.status;

    if (booking.status === 'confirmed' && newPrice > (booking.dpAmount || 0) && newPrice > calculatePrice(booking, booking.duration).total) {
      newStatus = 'dp';
    }

    updateBooking(booking.id, {
      duration: newDuration,
      status: newStatus,
      discountAmount: newDiscountAmount,
    });

    setResizeConfirmData(null);
  }, [calculatePrice, resizeConfirmData, updateBooking]);

  return {
    resizingBooking,
    resizeAddedHours,
    resizeConfirmData,
    setResizeConfirmData,
    handleResizeStart,
    confirmResize,
  };
};
