import { useCallback, useEffect, useState } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { hasBookingOverlap } from '../lib/bookingWorkflows';

const getPointerY = (event) => {
  const source = event.touches?.[0] || event.changedTouches?.[0] || event;
  return source.clientY ?? 0;
};

export const useCalendarBookingResize = ({
  bookings,
  updateBooking,
  calculatePrice,
  getCalendarCellHeight,
  touchStartRef,
}) => {
  const [resizingBooking, setResizingBooking] = useState(null);
  const [initialResizeY, setInitialResizeY] = useState(0);
  const [resizeAddedHours, setResizeAddedHours] = useState(0);
  const [resizeConfirmData, setResizeConfirmData] = useState(null);

  const resetResizeState = useCallback(() => {
    setResizingBooking(null);
    setResizeAddedHours(0);
  }, []);

  const handleResizeStart = useCallback((event, booking) => {
    event.stopPropagation();
    event.preventDefault();
    touchStartRef.current = null;
    setResizingBooking(booking);
    setInitialResizeY(getPointerY(event));
    setResizeAddedHours(0);
  }, [touchStartRef]);

  useEffect(() => {
    const handleResizeMove = (event) => {
      if (!resizingBooking) return;
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();

      const diffY = getPointerY(event) - initialResizeY;
      const addedHours = Math.round(diffY / getCalendarCellHeight());
      setResizeAddedHours(addedHours);
    };

    const handleResizeEnd = (event) => {
      if (!resizingBooking) return;
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();

      const diffY = getPointerY(event) - initialResizeY;
      const addedHours = Math.round(diffY / getCalendarCellHeight());

      if (addedHours !== 0) {
        const newDuration = Math.max(1, Math.min(13, resizingBooking.duration + addedHours));
        if (newDuration !== resizingBooking.duration) {
          const candidate = {
            date: resizingBooking.date,
            hour: resizingBooking.hour,
            duration: newDuration,
          };

          if (hasBookingOverlap(bookings, candidate, resizingBooking.id)) {
            useNotificationStore.getState().addNotification({
              title: 'Jadwal Bentrok!',
              message: 'Perpanjangan waktu bertabrakan dengan jadwal lain.',
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
      document.body.classList.add('calendar-resize-lock');
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.addEventListener('touchmove', handleResizeMove, { passive: false });
      document.addEventListener('touchend', handleResizeEnd);
      document.addEventListener('touchcancel', handleResizeEnd);
    }

    return () => {
      document.body.classList.remove('calendar-resize-lock');
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.removeEventListener('touchmove', handleResizeMove);
      document.removeEventListener('touchend', handleResizeEnd);
      document.removeEventListener('touchcancel', handleResizeEnd);
    };
  }, [bookings, calculatePrice, getCalendarCellHeight, initialResizeY, resetResizeState, resizingBooking, updateBooking]);

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
