import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const CalendarGrid = ({
  bookingsLookup,
  colWidth,
  dayNames,
  daysMetadata,
  gridWrapperRef,
  hoursArray,
  isMobile,
  moveGhost,
  moveTarget,
  movingBooking,
  now,
  numDays,
  resizingBooking,
  startHour,
  timeColWidth,
  visibleBookings,
  getStatusLabel,
  onBookingClick,
  onBookingKeyDown,
  onCellClick,
  onCellKeyDown,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
  onMobileBookingPointerDown,
  onResizeStart,
  onTouchEnd,
  onTouchStart,
}) => (
  <>
    <div
      className={`monthly-grid-wrapper ${resizingBooking ? 'is-resize-active' : ''} ${movingBooking ? 'is-move-active' : ''}`}
      ref={gridWrapperRef}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="monthly-grid"
        style={{
          gridTemplateColumns: `${timeColWidth} repeat(${numDays}, minmax(${colWidth}, 1fr))`,
          gridTemplateRows: `auto repeat(${hoursArray.length}, minmax(48px, 1fr))`,
        }}
      >
        <div className="grid-corner-cell" style={{ gridRow: 1, gridColumn: 1 }}>
          <span className="corner-label">JAM</span>
        </div>

        {daysMetadata.map((meta, idx) => (
          <div key={idx} className={`grid-header-cell ${meta.isToday ? 'today' : ''} ${meta.isWeekend ? 'weekend' : ''}`} style={{ gridRow: 1, gridColumn: idx + 2 }}>
            <span className="day-name">
              {dayNames[meta.dow]} {meta.isBlocked && <AlertTriangle size={12} color="var(--accent-pink)" style={{ marginLeft: 4, display: 'inline' }} />}
            </span>
            <span className={`day-number ${meta.isToday ? 'today-circle' : ''}`}>{meta.dayNum}</span>
          </div>
        ))}

        {hoursArray.map((hour, hourIdx) => {
          const isCurrentHour = now.getHours() === hour;

          return (
            <React.Fragment key={hour}>
              <div className={`time-label sticky-col ${hourIdx % 2 === 0 ? 'even-row' : ''} ${isCurrentHour ? 'current-hour-highlight' : ''}`} style={{ gridRow: hourIdx + 2, gridColumn: 1 }}>
                <span className="time-range">{String(hour).padStart(2, '0')}.00</span>
              </div>
              {daysMetadata.map((meta, dayIdx) => {
                const dateStr = meta.dateStr;
                const isToday = meta.isToday;
                const isWeekend = meta.isWeekend;
                const isBlocked = meta.isBlocked;
                const cellBooking = bookingsLookup[`${dateStr}-${hour}`];
                const isMoveTarget = moveTarget && moveTarget.date === dateStr && Number(moveTarget.hour) === hour;
                const moveTargetClass = isMoveTarget ? (moveTarget.isValid ? 'move-target-valid' : 'move-target-invalid') : '';
                const cellClasses = [
                  'grid-cell',
                  !cellBooking ? 'empty-cell' : 'covered-cell',
                  hourIdx % 2 === 0 ? 'even-row' : '',
                  isToday ? 'today-col-highlight' : '',
                  isWeekend ? 'weekend-col' : '',
                  isBlocked && !cellBooking ? 'blocked-cell' : '',
                  moveTargetClass,
                ].filter(Boolean).join(' ');
                const isCurrentHour = isToday && now.getHours() === hour;
                const timeLineTop = isCurrentHour ? `${(now.getMinutes() / 60) * 100}%` : null;

                return (
                  <div
                    key={`${hour}-${dayIdx}`}
                    className={cellClasses}
                    style={{ gridRow: hourIdx + 2, gridColumn: dayIdx + 2 }}
                    data-calendar-cell="true"
                    data-date={dateStr}
                    data-hour={hour}
                    onClick={cellBooking ? undefined : () => onCellClick(dateStr, hour)}
                    onDragOver={onDragOver}
                    onDrop={(event) => onDrop(event, dateStr, hour)}
                    role={cellBooking ? 'presentation' : 'button'}
                    tabIndex={cellBooking ? -1 : 0}
                    aria-label={cellBooking ? undefined : `Slot kosong pukul ${hour}.00 tanggal ${meta.ariaLabelDate}. Tekan Enter untuk membuat booking baru.`}
                    onKeyDown={cellBooking ? undefined : (event) => onCellKeyDown(event, dateStr, hour)}
                  >
                    {isCurrentHour && <div className="current-time-line" style={{ top: timeLineTop }} />}
                    {!cellBooking && <span className="hover-plus">+</span>}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}

        {visibleBookings.map((booking) => {
          const dayIdx = daysMetadata.findIndex((day) => day.dateStr === booking.date);
          if (dayIdx === -1) return null;

          const startRow = (booking.hour - startHour) + 2;
          const endRow = startRow + booking.duration;
          const gridColumn = dayIdx + 2;
          const isMovingSource = movingBooking && movingBooking.id === booking.id;
          const isToday = daysMetadata[dayIdx].isToday;
          const hasCurrentTime = isToday && now.getHours() >= booking.hour && now.getHours() < (booking.hour + booking.duration);
          const timeLineTop = hasCurrentTime
            ? `${((now.getHours() - booking.hour + (now.getMinutes() / 60)) / booking.duration) * 100}%`
            : null;
          const cardClasses = [
            'grid-cell',
            'booked-cell',
            `status-${booking.status}`,
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
                gridRow: `${startRow} / ${endRow}`,
                gridColumn: `${gridColumn}`,
              }}
              onClick={(event) => onBookingClick(event, booking)}
              onPointerDown={(event) => onMobileBookingPointerDown(event, booking)}
              onContextMenu={(event) => event.preventDefault()}
              draggable={!isMobile}
              onDragStart={(event) => onDragStart(event, booking)}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDrop={(event) => onDrop(event, booking.date, booking.hour)}
              role="button"
              tabIndex={0}
              aria-label={`Jadwal ${booking.band}, pukul ${booking.hour}.00 durasi ${booking.duration} jam tanggal ${daysMetadata[dayIdx].ariaLabelDate}. Status: ${getStatusLabel(booking.status)}.`}
              onKeyDown={(event) => onBookingKeyDown(event, booking)}
            >
              {hasCurrentTime && <div className="current-time-line" style={{ top: timeLineTop }} />}

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
                  <span className="booking-time-label">{booking.hour}.00-{booking.hour + booking.duration}.00</span>
                </div>
              </div>

              <div className="resize-handle" onMouseDown={(event) => onResizeStart(event, booking)} onTouchStart={(event) => onResizeStart(event, booking)}>
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
  </>
);

export default CalendarGrid;
