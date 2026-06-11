import { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Grid3X3,
  Plus,
  Sparkles,
} from 'lucide-react';
import { cn } from '../lib/cn.js';

const studioHours = {
  openHour: 10,
  closeHour: 23,
};

const solidSurfaces = {
  gridShell: '[background:color-mix(in_srgb,var(--ui-bg-base)_90%,var(--ui-control-hover))]',
  gridHeader: '[background:color-mix(in_srgb,var(--ui-bg-base)_84%,var(--ui-control-hover))]',
  gridCorner: '[background:color-mix(in_srgb,var(--ui-bg-base)_78%,var(--ui-control-hover))]',
  gridSticky: '[background:color-mix(in_srgb,var(--ui-bg-base)_82%,var(--ui-control))]',
  gridCell: '[background:color-mix(in_srgb,var(--ui-bg-base)_88%,transparent)]',
  gridCellWeekend: '[background:color-mix(in_srgb,var(--ui-bg-base)_82%,var(--ui-control))]',
};

const viewOptions = [
  {
    key: 'day',
    label: 'Day',
    helper: '1 hari',
  },
  {
    key: 'week',
    label: 'Week',
    helper: '7 hari',
  },
  {
    key: 'month',
    label: 'Month',
    helper: '1 bulan',
  },
];

const bookingStatusItems = [
  {
    key: 'pending',
    label: 'Pending',
    dotClass: 'bg-studio-accent',
  },
  {
    key: 'dp',
    label: 'DP',
    dotClass: 'bg-studio-purple',
  },
  {
    key: 'paid',
    label: 'Lunas',
    dotClass: 'bg-studio-cyan',
  },
];

const dayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const bookingSeeds = [
  {
    id: 'booking-01',
    day: 3,
    time: '10:00',
    title: 'Band rehearsal',
    status: 'pending',
    tone: 'accent',
  },
  {
    id: 'booking-02',
    day: 7,
    time: '14:00',
    title: 'Vocal take',
    status: 'dp',
    tone: 'cyan',
  },
  {
    id: 'booking-03',
    day: 12,
    time: '19:00',
    title: 'Live session',
    status: 'paid',
    tone: 'purple',
  },
  {
    id: 'booking-04',
    day: 19,
    time: '20:00',
    title: 'Tracking',
    status: 'pending',
    tone: 'accent',
  },
  {
    id: 'booking-05',
    day: 25,
    time: '16:00',
    title: 'Mix review',
    status: 'dp',
    tone: 'cyan',
  },
];

const toneClasses = {
  accent: 'border-studio-accent/35 bg-studio-accent/12 text-[var(--ui-text-strong)]',
  cyan: 'border-studio-cyan/35 bg-studio-cyan/12 text-[var(--ui-text-strong)]',
  purple: 'border-studio-purple/35 bg-studio-purple/12 text-[var(--ui-text-strong)]',
};

function createDate(year, monthIndex, dayNumber) {
  return new Date(year, monthIndex, dayNumber);
}

function getDaysInMonth(year, monthIndex) {
  return createDate(year, monthIndex + 1, 0).getDate();
}

function clampDay(year, monthIndex, dayNumber) {
  return Math.min(dayNumber, getDaysInMonth(year, monthIndex));
}

function addDays(date, amount) {
  return createDate(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function addMonths(date, amount) {
  const targetDate = createDate(date.getFullYear(), date.getMonth() + amount, 1);
  const nextDay = clampDay(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    date.getDate(),
  );

  return createDate(targetDate.getFullYear(), targetDate.getMonth(), nextDay);
}

function getMondayStart(date) {
  const currentDay = date.getDay();
  const diff = currentDay === 0 ? -6 : 1 - currentDay;

  return addDays(date, diff);
}

function padNumber(value) {
  return String(value).padStart(2, '0');
}

function formatDateKey(date) {
  return [
    date.getFullYear(),
    padNumber(date.getMonth() + 1),
    padNumber(date.getDate()),
  ].join('-');
}

function formatDayNumber(date) {
  return padNumber(date.getDate());
}

function formatMonthYear(date) {
  return monthNames[date.getMonth()] + ' ' + date.getFullYear();
}

function formatDayLabel(date) {
  return dayShortNames[date.getDay()] + ' ' + formatDayNumber(date);
}

function formatFullDateLabel(date) {
  return formatDayLabel(date) + ' ' + monthNames[date.getMonth()] + ' ' + date.getFullYear();
}

function createCalendarDay(date) {
  const dayName = dayShortNames[date.getDay()];

  return {
    key: formatDateKey(date),
    label: formatDayLabel(date),
    fullLabel: formatFullDateLabel(date),
    dayName,
    dayNumber: date.getDate(),
    monthIndex: date.getMonth(),
    year: date.getFullYear(),
    date,
    isWeekend: dayName === 'Sat' || dayName === 'Sun',
  };
}

function createMonthDays(date) {
  const year = date.getFullYear();
  const monthIndex = date.getMonth();
  const daysInMonth = getDaysInMonth(year, monthIndex);

  return Array.from({ length: daysInMonth }, (_, index) => (
    createCalendarDay(createDate(year, monthIndex, index + 1))
  ));
}

function createWeekDays(date) {
  const startDate = getMondayStart(date);

  return Array.from({ length: 7 }, (_, index) => createCalendarDay(addDays(startDate, index)));
}

function createVisibleDays(viewMode, cursorDate) {
  if (viewMode === 'day') {
    return [createCalendarDay(cursorDate)];
  }

  if (viewMode === 'week') {
    return createWeekDays(cursorDate);
  }

  return createMonthDays(cursorDate);
}

function createTimeSlots() {
  return Array.from({ length: studioHours.closeHour - studioHours.openHour }, (_, index) => {
    const startHour = studioHours.openHour + index;
    const endHour = startHour + 1;

    return {
      key: padNumber(startHour) + ':00',
      label: padNumber(startHour) + ':00 - ' + padNumber(endHour) + ':00',
      compactLabel: padNumber(startHour) + ' - ' + padNumber(endHour),
    };
  });
}

function createDemoBookingsForMonth(cursorDate) {
  const year = cursorDate.getFullYear();
  const monthIndex = cursorDate.getMonth();
  const daysInMonth = getDaysInMonth(year, monthIndex);

  return bookingSeeds
    .filter((booking) => booking.day <= daysInMonth)
    .map((booking) => ({
      ...booking,
      dateKey: formatDateKey(createDate(year, monthIndex, booking.day)),
    }));
}

function getBookingForSlot(bookings, dayKey, timeKey) {
  return bookings.find((booking) => booking.dateKey === dayKey && booking.time === timeKey);
}

function getVisibleBookings(bookings, visibleDays) {
  const visibleKeys = new Set(visibleDays.map((day) => day.key));

  return bookings.filter((booking) => visibleKeys.has(booking.dateKey));
}

function getBookingStatusCounts(visibleBookings) {
  return bookingStatusItems.reduce((counts, item) => {
    counts[item.key] = visibleBookings.filter((booking) => booking.status === item.key).length;
    return counts;
  }, {});
}

function getViewRangeLabel(viewMode, visibleDays, cursorDate) {
  if (viewMode === 'day') {
    return formatFullDateLabel(cursorDate);
  }

  if (viewMode === 'week') {
    const firstDay = visibleDays[0];
    const lastDay = visibleDays[visibleDays.length - 1];

    return firstDay.fullLabel + ' - ' + lastDay.fullLabel;
  }

  return formatMonthYear(cursorDate);
}

function getDayColumnTemplate(viewMode) {
  if (viewMode === 'day') {
    return 'minmax(280px,1fr)';
  }

  if (viewMode === 'week') {
    return 'minmax(148px,1fr)';
  }

  return '116px';
}

function getGridMinWidth(viewMode, visibleDays) {
  if (viewMode === 'month') {
    return 168 + visibleDays.length * 116;
  }

  if (viewMode === 'week') {
    return 168 + visibleDays.length * 148;
  }

  return 448;
}

function CalendarCell({
  booking,
  day,
  isSelected,
  onSelect,
  time,
}) {
  return (
    <button
      aria-label={booking ? booking.title + ', ' + day.fullLabel + ', ' + time.label : 'Empty slot, ' + day.fullLabel + ', ' + time.label}
      className={cn(
        'group min-h-[58px] border-b border-r border-[var(--ui-border)] p-1.5 text-left transition focus-visible:relative focus-visible:z-20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25',
        solidSurfaces.gridCell,
        day.isWeekend ? solidSurfaces.gridCellWeekend : '',
        isSelected ? 'ring-2 ring-studio-accent/30 [background:color-mix(in_srgb,var(--ui-bg-base)_72%,var(--ui-control-hover))]' : '',
        booking ? 'hover:[background:color-mix(in_srgb,var(--ui-bg-base)_72%,var(--ui-control-hover))]' : 'hover:[background:color-mix(in_srgb,var(--ui-bg-base)_78%,var(--ui-control))]',
      )}
      type="button"
      onClick={onSelect}
    >
      {booking ? (
        <span
          className={cn(
            'grid min-h-[44px] content-center rounded-[1rem] border px-2 py-1.5 shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]',
            toneClasses[booking.tone],
          )}
        >
          <span className="truncate text-[0.72rem] font-semibold tracking-[-0.02em]">
            {booking.title}
          </span>
          <span className="mt-0.5 flex items-center justify-between gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
            <span>{time.key}</span>
            <span>{booking.status === 'paid' ? 'Lunas' : booking.status.toUpperCase()}</span>
          </span>
        </span>
      ) : (
        <span
          className={cn(
            'grid min-h-[44px] place-items-center rounded-[1rem] border text-[var(--ui-text-soft)] transition',
            isSelected
              ? 'border-studio-accent/35 bg-studio-accent/10 opacity-100'
              : 'border-transparent opacity-0 group-hover:border-[var(--ui-border)] group-hover:bg-[var(--ui-glass-soft)] group-hover:opacity-100',
          )}
        >
          <Plus size={15} strokeWidth={2.35} aria-hidden="true" />
        </span>
      )}
    </button>
  );
}

function CalendarHeaderCell({
  day,
  isActiveDay,
  onSelectDay,
}) {
  return (
    <button
      aria-label={'Select ' + day.fullLabel}
      aria-pressed={isActiveDay}
      className={cn(
        'grid h-14 place-items-center border-b border-r border-[var(--ui-border-strong)] px-2 text-center transition hover:[background:color-mix(in_srgb,var(--ui-bg-base)_72%,var(--ui-control-hover))] focus-visible:relative focus-visible:z-20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25',
        solidSurfaces.gridHeader,
        day.isWeekend ? 'text-studio-accent' : 'text-[var(--ui-text-main)]',
        isActiveDay ? 'ring-2 ring-studio-accent/25 [background:color-mix(in_srgb,var(--ui-bg-base)_70%,var(--ui-control-hover))]' : '',
      )}
      type="button"
      onClick={onSelectDay}
    >
      <span className="grid gap-0.5">
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
          {day.dayName}
        </span>
        <span className="text-sm font-semibold tracking-[-0.02em] text-[var(--ui-text-strong)]">
          {formatDayNumber(day.date)}
        </span>
      </span>
    </button>
  );
}

function TimeCell({ slot }) {
  return (
    <div
      className={cn(
        'sticky left-0 z-10 grid min-h-[58px] w-[168px] place-items-center border-b border-r border-[var(--ui-border-strong)] px-3 text-center shadow-[12px_0_22px_rgb(0_0_0/0.08)]',
        solidSurfaces.gridSticky,
      )}
    >
      <span className="text-xs font-semibold tracking-[-0.015em] text-[var(--ui-text-main)]">
        {slot.label}
      </span>
    </div>
  );
}

function BookingStatusCounters({ counts }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] p-1.5 shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]">
      {bookingStatusItems.map((item) => (
        <div
          className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-3 text-xs font-semibold uppercase tracking-[0.13em] text-[var(--ui-text-main)]"
          key={item.key}
        >
          <span className={cn('size-2 rounded-full', item.dotClass)} />
          <span>{item.label}</span>
          <strong className="text-sm tracking-[-0.03em] text-[var(--ui-text-strong)]">
            {counts[item.key] || 0}
          </strong>
        </div>
      ))}
    </div>
  );
}

function ViewToggle({
  onChange,
  value,
}) {
  return (
    <div className="flex flex-wrap rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-1 shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]">
      {viewOptions.map((option) => (
        <button
          aria-pressed={value === option.key}
          className={cn(
            'inline-flex min-h-9 items-center justify-center rounded-full px-3 text-xs font-semibold uppercase tracking-[0.14em] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25',
            value === option.key
              ? 'bg-[var(--ui-control-hover)] text-studio-accent shadow-[var(--ui-shadow-control)]'
              : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-control)] hover:text-[var(--ui-text-strong)]',
          )}
          key={option.key}
          title={option.helper}
          type="button"
          onClick={() => onChange(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function CalendarToolbar({
  onNext,
  onPrev,
  onToday,
  onViewChange,
  rangeLabel,
  statusCounts,
  viewMode,
}) {
  return (
    <div className="grid gap-3 rounded-[1.75rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-3 ring-1 ring-[var(--ui-ring)] xl:grid-cols-[minmax(0,1fr)_auto_auto] xl:items-center">
      <div className="flex flex-wrap items-center gap-2">
        <button
          aria-label="Previous period"
          className="grid size-10 place-items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25"
          type="button"
          onClick={onPrev}
        >
          <ChevronLeft size={17} strokeWidth={2.35} aria-hidden="true" />
        </button>

        <div className="inline-flex min-h-10 min-w-[220px] items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-4 text-sm font-semibold text-[var(--ui-text-strong)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]">
          <CalendarDays size={16} strokeWidth={2.35} aria-hidden="true" />
          <span className="truncate">{rangeLabel}</span>
        </div>

        <button
          aria-label="Next period"
          className="grid size-10 place-items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25"
          type="button"
          onClick={onNext}
        >
          <ChevronRight size={17} strokeWidth={2.35} aria-hidden="true" />
        </button>

        <button
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-4 text-sm font-semibold text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25"
          type="button"
          onClick={onToday}
        >
          Today
        </button>
      </div>

      <BookingStatusCounters counts={statusCounts} />

      <div className="flex flex-wrap items-center gap-2 xl:justify-end">
        <ViewToggle
          onChange={onViewChange}
          value={viewMode}
        />

        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full [background:var(--ui-primary-bg)] px-4 text-sm font-semibold text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
          type="button"
        >
          <Plus size={16} strokeWidth={2.35} aria-hidden="true" />
          Add booking
        </button>
      </div>
    </div>
  );
}

function CalendarGrid({
  bookings,
  cursorDate,
  onSelectDay,
  onSelectSlot,
  selectedSlot,
  timeSlots,
  viewMode,
  visibleDays,
}) {
  const dayColumnTemplate = getDayColumnTemplate(viewMode);
  const gridTemplateColumns = '168px repeat(' + visibleDays.length + ', ' + dayColumnTemplate + ')';
  const gridMinWidth = getGridMinWidth(viewMode, visibleDays);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[1.75rem] border border-[var(--ui-border-strong)] shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)]',
        solidSurfaces.gridShell,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-3 border-b border-[var(--ui-border-strong)] px-4 py-3',
          solidSurfaces.gridCorner,
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]">
            <Grid3X3 size={18} strokeWidth={2.35} aria-hidden="true" />
          </div>

          <div className="grid min-w-0 gap-0.5">
            <strong className="truncate text-sm font-semibold tracking-[-0.02em] text-[var(--ui-text-strong)]">
              Dynamic booking board
            </strong>
            <span className="truncate text-xs font-medium text-[var(--ui-text-muted)]">
              View {viewMode}: {visibleDays.length} hari terlihat
            </span>
          </div>
        </div>

        <div className="hidden items-center gap-2 text-xs font-semibold text-[var(--ui-text-muted)] sm:flex">
          <span className="size-2 rounded-full bg-studio-accent" />
          Pending
          <span className="ml-2 size-2 rounded-full bg-studio-purple" />
          DP
          <span className="ml-2 size-2 rounded-full bg-studio-cyan" />
          Lunas
        </div>
      </div>

      <div className="overflow-x-auto">
        <div
          className="min-w-max"
          style={{ minWidth: gridMinWidth }}
        >
          <div
            className="grid"
            style={{ gridTemplateColumns }}
          >
            <div
              className={cn(
                'sticky left-0 z-20 grid h-14 w-[168px] place-items-center border-b border-r border-[var(--ui-border-strong)] px-3 text-center shadow-[12px_0_22px_rgb(0_0_0/0.08)]',
                solidSurfaces.gridCorner,
              )}
            >
              <span className="grid gap-0.5">
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-studio-accent">
                  Booking
                </span>
                <span className="text-xs font-semibold text-[var(--ui-text-muted)]">
                  {padNumber(studioHours.openHour)}:00 - {padNumber(studioHours.closeHour)}:00
                </span>
              </span>
            </div>

            {visibleDays.map((day) => (
              <CalendarHeaderCell
                day={day}
                isActiveDay={formatDateKey(cursorDate) === day.key}
                key={day.key}
                onSelectDay={() => onSelectDay(day.date)}
              />
            ))}
          </div>

          {timeSlots.map((slot) => (
            <div
              className="grid"
              key={slot.key}
              style={{ gridTemplateColumns }}
            >
              <TimeCell slot={slot} />

              {visibleDays.map((day) => {
                const booking = getBookingForSlot(bookings, day.key, slot.key);
                const isSelected = selectedSlot.dateKey === day.key && selectedSlot.timeKey === slot.key;

                return (
                  <CalendarCell
                    booking={booking}
                    day={day}
                    isSelected={isSelected}
                    key={day.key + '-' + slot.key}
                    time={slot}
                    onSelect={() => onSelectSlot(day, slot)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SelectedSlotPanel({
  bookings,
  selectedSlot,
}) {
  const booking = getBookingForSlot(bookings, selectedSlot.dateKey, selectedSlot.timeKey);

  return (
    <div className="rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-4 text-sm leading-7 text-[var(--ui-text-main)] ring-1 ring-[var(--ui-ring)]">
      <span className="font-semibold text-[var(--ui-text-strong)]">Selected slot:</span>{' '}
      {selectedSlot.label} jam {selectedSlot.timeKey}.
      {booking ? (
        <span>
          {' '}Slot ini sudah terisi untuk <span className="font-semibold text-[var(--ui-text-strong)]">{booking.title}</span> dengan status <span className="font-semibold text-[var(--ui-text-strong)]">{booking.status === 'paid' ? 'Lunas' : booking.status.toUpperCase()}</span>.
        </span>
      ) : (
        <span>
          {' '}Slot ini kosong dan siap dipakai untuk flow add booking di phase berikutnya.
        </span>
      )}
    </div>
  );
}

export function BookingAdmin({ activeItem }) {
  const [viewMode, setViewMode] = useState('month');
  const [cursorDate, setCursorDate] = useState(() => {
    const now = new Date();

    return createDate(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [selectedSlot, setSelectedSlot] = useState(() => {
    const now = new Date();
    const today = createDate(now.getFullYear(), now.getMonth(), now.getDate());

    return {
      dateKey: formatDateKey(today),
      label: formatFullDateLabel(today),
      timeKey: '10:00',
    };
  });

  const activeTitle = activeItem?.label || 'Booking';

  const timeSlots = useMemo(() => createTimeSlots(), []);
  const visibleDays = useMemo(() => createVisibleDays(viewMode, cursorDate), [cursorDate, viewMode]);
  const bookings = useMemo(() => createDemoBookingsForMonth(cursorDate), [cursorDate]);
  const visibleBookings = useMemo(
    () => getVisibleBookings(bookings, visibleDays),
    [bookings, visibleDays],
  );
  const statusCounts = useMemo(
    () => getBookingStatusCounts(visibleBookings),
    [visibleBookings],
  );
  const rangeLabel = useMemo(
    () => getViewRangeLabel(viewMode, visibleDays, cursorDate),
    [cursorDate, viewMode, visibleDays],
  );

  const summary = useMemo(() => {
    const totalSlots = visibleDays.length * timeSlots.length;

    return {
      availableSlots: totalSlots - visibleBookings.length,
      bookedSlots: visibleBookings.length,
      totalSlots,
    };
  }, [timeSlots, visibleBookings, visibleDays]);

  const updateCursorDate = (nextDate) => {
    setCursorDate(nextDate);
    setSelectedSlot({
      dateKey: formatDateKey(nextDate),
      label: formatFullDateLabel(nextDate),
      timeKey: selectedSlot.timeKey,
    });
  };

  const goToPreviousPeriod = () => {
    if (viewMode === 'month') {
      updateCursorDate(addMonths(cursorDate, -1));
      return;
    }

    if (viewMode === 'week') {
      updateCursorDate(addDays(cursorDate, -7));
      return;
    }

    updateCursorDate(addDays(cursorDate, -1));
  };

  const goToNextPeriod = () => {
    if (viewMode === 'month') {
      updateCursorDate(addMonths(cursorDate, 1));
      return;
    }

    if (viewMode === 'week') {
      updateCursorDate(addDays(cursorDate, 7));
      return;
    }

    updateCursorDate(addDays(cursorDate, 1));
  };

  const goToToday = () => {
    const now = new Date();

    updateCursorDate(createDate(now.getFullYear(), now.getMonth(), now.getDate()));
  };

  const handleSelectSlot = (day, slot) => {
    setCursorDate(day.date);
    setSelectedSlot({
      dateKey: day.key,
      label: day.fullLabel,
      timeKey: slot.key,
    });
  };

  return (
    <section className="grid gap-6 py-6" aria-labelledby="booking-admin-title">
      <div className="grid gap-5 border-b border-[var(--ui-border-strong)] pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-studio-accent ring-1 ring-[var(--ui-ring)]">
            <Sparkles size={14} strokeWidth={2.35} aria-hidden="true" />
            {activeTitle} Calendar
          </div>

          <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-4 text-sm font-semibold text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]">
            <Clock3 size={15} strokeWidth={2.35} aria-hidden="true" />
            {padNumber(studioHours.openHour)}:00 sampai {padNumber(studioHours.closeHour)}:00
          </div>
        </div>

        <div className="grid gap-3">
          <h2
            className="m-0 max-w-[820px] text-[clamp(2.35rem,5vw,5rem)] font-semibold leading-[0.94] tracking-[-0.075em] text-[var(--ui-text-strong)]"
            id="booking-admin-title"
          >
            Calendar grid booking yang bisa diganti periode.
          </h2>

          <p className="m-0 max-w-2xl text-[clamp(0.98rem,1.25vw,1.12rem)] leading-8 text-[var(--ui-text-main)]">
            Toolbar sekarang menampilkan counter status booking aktif: Pending, DP, dan Lunas. Counter mengikuti booking yang terlihat di view Day, Week, atau Month.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="grid gap-1 border-y border-[var(--ui-border)] py-4 sm:border-y-0 sm:border-l sm:px-5 sm:first:border-l-0">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ui-text-muted)]">
            Visible slot
          </span>
          <strong className="text-3xl font-semibold tracking-[-0.06em] text-[var(--ui-text-strong)]">
            {summary.totalSlots}
          </strong>
          <span className="text-sm leading-6 text-[var(--ui-text-muted)]">
            {visibleDays.length} hari x {timeSlots.length} jam
          </span>
        </article>

        <article className="grid gap-1 border-y border-[var(--ui-border)] py-4 sm:border-y-0 sm:border-l sm:px-5 sm:first:border-l-0">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ui-text-muted)]">
            Booked
          </span>
          <strong className="text-3xl font-semibold tracking-[-0.06em] text-[var(--ui-text-strong)]">
            {summary.bookedSlots}
          </strong>
          <span className="text-sm leading-6 text-[var(--ui-text-muted)]">
            Dummy event sesuai view aktif
          </span>
        </article>

        <article className="grid gap-1 border-y border-[var(--ui-border)] py-4 sm:border-y-0 sm:border-l sm:px-5 sm:first:border-l-0">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ui-text-muted)]">
            Available
          </span>
          <strong className="text-3xl font-semibold tracking-[-0.06em] text-[var(--ui-text-strong)]">
            {summary.availableSlots}
          </strong>
          <span className="text-sm leading-6 text-[var(--ui-text-muted)]">
            Slot kosong di view aktif
          </span>
        </article>
      </div>

      <div className="grid gap-4">
        <CalendarToolbar
          rangeLabel={rangeLabel}
          statusCounts={statusCounts}
          viewMode={viewMode}
          onNext={goToNextPeriod}
          onPrev={goToPreviousPeriod}
          onToday={goToToday}
          onViewChange={setViewMode}
        />

        <CalendarGrid
          bookings={bookings}
          cursorDate={cursorDate}
          selectedSlot={selectedSlot}
          timeSlots={timeSlots}
          viewMode={viewMode}
          visibleDays={visibleDays}
          onSelectDay={updateCursorDate}
          onSelectSlot={handleSelectSlot}
        />
      </div>

      <SelectedSlotPanel
        bookings={bookings}
        selectedSlot={selectedSlot}
      />
    </section>
  );
}
