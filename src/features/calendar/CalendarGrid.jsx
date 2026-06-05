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
      className={`cal-grid-wrapper${resizingBooking ? ' is-resize-active' : ''}${movingBooking ? ' is-move-active' : ''}`}
      ref={gridWrapperRef}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="cal-grid"
        style={{
          gridTemplateColumns: `${timeColWidth} repeat(${numDays}, minmax(${colWidth}, 1fr))`,
          gridTemplateRows: `auto repeat(${hoursArray.length}, minmax(48px, 1fr))`,
        }}
      >
        {/* Corner cell */}
        <div className="cal-corner" style={{ gridRow: 1, gridColumn: 1 }}>
          <span className="cal-corner-label">JAM</span>
        </div>

        {/* Day header cells */}
        {daysMetadata.map((meta, idx) => (
          <div
            key={idx}
            className={[
              'cal-day-header',
              meta.isToday   ? 'today'   : '',
              meta.isWeekend ? 'weekend' : '',
            ].filter(Boolean).join(' ')}
            style={{ gridRow: 1, gridColumn: idx + 2 }}
          >
            <span className="day-name">
              {dayNames[meta.dow]}
              {meta.isBlocked && (
                <AlertTriangle size={10} color="var(--c-red)" style={{ marginLeft: 3, display: 'inline', verticalAlign: 'middle' }} />
              )}
            </span>
            <span className="day-num">{meta.dayNum}</span>
          </div>
        ))}

        {/* Time rows + grid cells */}
        {hoursArray.map((hour, hourIdx) => {
          const isCurrentHour = now.getHours() === hour;

          return (
            <React.Fragment key={hour}>
              {/* Time label */}
              <div
                className={[
                  'cal-time-label sticky-col',
                  hourIdx % 2 === 0 ? 'even-row' : '',
                  isCurrentHour ? 'current-hour' : '',
                ].filter(Boolean).join(' ')}
                style={{ gridRow: hourIdx + 2, gridColumn: 1 }}
              >
                <span className="time-range">{String(hour).padStart(2, '0')}.00</span>
              </div>

              {/* Day cells */}
              {daysMetadata.map((meta, dayIdx) => {
                const { dateStr, isToday, isWeekend, isBlocked } = meta;
                const cellBooking = bookingsLookup[`${dateStr}-${hour}`];
                const isMoveTarget = moveTarget && moveTarget.date === dateStr && Number(moveTarget.hour) === hour;
                const moveTargetClass = isMoveTarget
                  ? (moveTarget.isValid ? 'move-target-valid' : 'move-target-invalid')
                  : '';
                const isThisCurrentHour = isToday && now.getHours() === hour;
                const timeLineTop = isThisCurrentHour ? `${(now.getMinutes() / 60) * 100}%` : null;

                const cellClasses = [
                  'cal-cell',
                  !cellBooking ? 'empty-cell' : 'covered-cell',
                  hourIdx % 2 === 0 ? 'even-row' : '',
                  isToday ? 'today-col' : '',
                  isWeekend ? 'weekend-col' : '',
                  isBlocked && !cellBooking ? 'blocked-cell' : '',
                  moveTargetClass,
                ].filter(Boolean).join(' ');

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
                    onDrop={(e) => onDrop(e, dateStr, hour)}
                    role={cellBooking ? 'presentation' : 'button'}
                    tabIndex={cellBooking ? -1 : 0}
                    aria-label={cellBooking ? undefined : `Slot kosong pukul ${hour}.00 tanggal ${meta.ariaLabelDate}. Tekan Enter untuk booking.`}
                    onKeyDown={cellBooking ? undefined : (e) => onCellKeyDown(e, dateStr, hour)}
                  >
                    {isThisCurrentHour && (
                      <div className="cal-time-line" style={{ top: timeLineTop }} />
                    )}
                    {!cellBooking && <span className="cal-cell-plus">+</span>}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}

        {/* Booking cards */}
        {visibleBookings.map((booking) => {
          const dayIdx = daysMetadata.findIndex((d) => d.dateStr === booking.date);
          if (dayIdx === -1) return null;

          const startRow  = (booking.hour - startHour) + 2;
          const endRow    = startRow + booking.duration;
          const gridCol   = dayIdx + 2;
          const isMovingSource  = movingBooking && movingBooking.id === booking.id;
          const isToday         = daysMetadata[dayIdx].isToday;
          const hasCurrentTime  = isToday && now.getHours() >= booking.hour && now.getHours() < (booking.hour + booking.duration);
          const timeLineTop     = hasCurrentTime
            ? `${((now.getHours() - booking.hour + (now.getMinutes() / 60)) / booking.duration) * 100}%`
            : null;

          const cardClasses = [
            'cal-booking',
            `status-${booking.status}`,
            booking.isResizing      ? 'is-resizing'      : '',
            isMovingSource          ? 'is-moving-source' : '',
          ].filter(Boolean).join(' ');

          return (
            <div
              key={booking.id}
              className={cardClasses}
              style={{
                gridRow: `${startRow} / ${endRow}`,
                gridColumn: `${gridCol}`,
                position: 'relative',
                inset: 'unset',
                margin: '2px',
                borderRadius: '8px',
              }}
              onClick={(e) => onBookingClick(e, booking)}
              onPointerDown={(e) => onMobileBookingPointerDown(e, booking)}
              onContextMenu={(e) => e.preventDefault()}
              draggable={!isMobile}
              onDragStart={(e) => onDragStart(e, booking)}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, booking.date, booking.hour)}
              role="button"
              tabIndex={0}
              aria-label={`Jadwal ${booking.band}, pukul ${booking.hour}.00 durasi ${booking.duration} jam. Status: ${getStatusLabel(booking.status)}.`}
              onKeyDown={(e) => onBookingKeyDown(e, booking)}
            >
              {hasCurrentTime && (
                <div className="cal-time-line" style={{ top: timeLineTop }} />
              )}

              <div className="booking-info">
                <span className="cal-booking-band">
                  {booking.isVIP && (
                    <svg
                      className="cal-vip-star"
                      viewBox="0 0 24 24"
                      width="10"
                      height="10"
                      style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 3, transform: 'translateY(-1px)' }}
                    >
                      <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
                    </svg>
                  )}
                  {booking.band}
                </span>
                <div className="cal-booking-meta">
                  {booking.type === 'recording' && (
                    <span className="cal-rec-badge" title="Recording Session">
                      <span className="cal-rec-dot" />
                      REC
                    </span>
                  )}
                  <span className="cal-booking-time">
                    {booking.hour}.00–{booking.hour + booking.duration}.00
                  </span>
                </div>
              </div>

              <div
                className="cal-resize-handle"
                onMouseDown={(e) => onResizeStart(e, booking)}
                onTouchStart={(e) => onResizeStart(e, booking)}
              >
                <div className="cal-resize-line" />
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Mobile drag ghost */}
    <AnimatePresence>
      {movingBooking && moveGhost && (
        <motion.div
          className={`cal-drag-ghost status-${movingBooking.status}`}
          style={{
            left: moveGhost.x,
            top: moveGhost.y,
            width: moveGhost.width,
            height: moveGhost.height,
          }}
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 6 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          <strong>{movingBooking.band}</strong>
          <span>{movingBooking.hour}.00–{movingBooking.hour + movingBooking.duration}.00</span>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Move hint toast */}
    <AnimatePresence>
      {movingBooking && moveTarget && (
        <motion.div
          className={`cal-move-hint ${moveTarget.isValid ? 'valid' : 'invalid'}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          <strong>{moveTarget.isValid ? 'Lepaskan untuk pindah' : moveTarget.reason}</strong>
          <span>{moveTarget.date} · {String(moveTarget.hour).padStart(2, '0')}:00 · {moveTarget.duration} jam</span>
        </motion.div>
      )}
    </AnimatePresence>
  </>
);

export default CalendarGrid;
