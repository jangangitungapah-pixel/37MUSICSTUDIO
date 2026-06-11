import { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Grid3X3,
  Phone,
  Plus,
  ReceiptText,
  UserRound,
  WalletCards,
  X,
  ChevronDown,
} from 'lucide-react';
import { Link, useOutletContext, useSearchParams } from 'react-router';
import { cn } from '../lib/cn.js';

const PRICE_PER_HOUR = 120000;

const studioHours = {
  openHour: 10,
  closeHour: 23,
};

const solidSurfaces = {
  gridShell: '[background:color-mix(in_srgb,var(--ui-bg-base)_90%,var(--ui-control-hover))]',
  gridHeader: '[background:color-mix(in_srgb,var(--ui-bg-base)_94%,var(--ui-control-hover))]',
  gridCorner: '[background:color-mix(in_srgb,var(--ui-bg-base)_96%,var(--ui-control-hover))]',
  gridSticky: '[background:color-mix(in_srgb,var(--ui-bg-base)_94%,var(--ui-control))]',
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

const paymentOptions = [
  {
    key: 'pending',
    label: 'Pending',
  },
  {
    key: 'dp',
    label: 'DP',
  },
  {
    key: 'paid',
    label: 'Lunas',
  },
];

const sessionTypes = [
  'Latihan Band',
  'Recording',
  'Mixing Review',
  'Podcast',
  'Vocal Session',
];

const durationOptions = [1, 2, 3, 4, 5, 6];

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
    customerName: 'Raka Pradana',
    phone: '081234567890',
    durationHours: 2,
    sessionType: 'Latihan Band',
    status: 'pending',
    totalPrice: PRICE_PER_HOUR * 2,
    dpAmount: 0,
    remainingPayment: PRICE_PER_HOUR * 2,
    tone: 'accent',
  },
  {
    id: 'booking-02',
    day: 7,
    time: '14:00',
    title: 'Vocal take',
    customerName: 'Mira Ayu',
    phone: '081298765432',
    durationHours: 1,
    sessionType: 'Vocal Session',
    status: 'dp',
    totalPrice: PRICE_PER_HOUR,
    dpAmount: 50000,
    remainingPayment: PRICE_PER_HOUR - 50000,
    tone: 'purple',
  },
  {
    id: 'booking-03',
    day: 12,
    time: '19:00',
    title: 'Live session',
    customerName: 'Dimas Wicak',
    phone: '082211223344',
    durationHours: 3,
    sessionType: 'Recording',
    status: 'paid',
    totalPrice: PRICE_PER_HOUR * 3,
    dpAmount: PRICE_PER_HOUR * 3,
    remainingPayment: 0,
    tone: 'cyan',
  },
  {
    id: 'booking-04',
    day: 19,
    time: '20:00',
    title: 'Tracking',
    customerName: 'The Velvet Room',
    phone: '087700001111',
    durationHours: 2,
    sessionType: 'Recording',
    status: 'pending',
    totalPrice: PRICE_PER_HOUR * 2,
    dpAmount: 0,
    remainingPayment: PRICE_PER_HOUR * 2,
    tone: 'accent',
  },
  {
    id: 'booking-05',
    day: 25,
    time: '16:00',
    title: 'Mix review',
    customerName: 'Nara Studio Project',
    phone: '085500001111',
    durationHours: 1,
    sessionType: 'Mixing Review',
    status: 'dp',
    totalPrice: PRICE_PER_HOUR,
    dpAmount: 70000,
    remainingPayment: PRICE_PER_HOUR - 70000,
    tone: 'purple',
  },
];

const toneClasses = {
  accent: 'border-studio-accent/45 bg-studio-accent/14 text-[var(--ui-text-strong)] shadow-[0_14px_34px_rgb(255_59_161/0.12)]',
  cyan: 'border-studio-cyan/45 bg-studio-cyan/14 text-[var(--ui-text-strong)] shadow-[0_14px_34px_rgb(34_211_238/0.12)]',
  purple: 'border-studio-purple/45 bg-studio-purple/14 text-[var(--ui-text-strong)] shadow-[0_14px_34px_rgb(139_92_246/0.12)]',
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

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(Math.max(0, Number(value) || 0));
}


function parseMoney(value) {
  return Number(String(value).replace(/[^0-9]/g, '')) || 0;
}

function getStatusLabel(status) {
  if (status === 'paid') return 'Lunas';
  if (status === 'dp') return 'DP';
  return 'Pending';
}

function getToneByStatus(status) {
  if (status === 'paid') return 'cyan';
  if (status === 'dp') return 'purple';
  return 'accent';
}

function calculateBookingPayment(form) {
  const durationHours = Number(form.durationHours) || 1;
  const totalPrice = durationHours * PRICE_PER_HOUR;
  const cleanDpAmount = Math.min(parseMoney(form.dpAmount), totalPrice);

  if (form.paymentStatus === 'paid') {
    return {
      dpAmount: totalPrice,
      remainingPayment: 0,
      totalPrice,
    };
  }

  if (form.paymentStatus === 'dp') {
    return {
      dpAmount: cleanDpAmount,
      remainingPayment: Math.max(0, totalPrice - cleanDpAmount),
      totalPrice,
    };
  }

  return {
    dpAmount: 0,
    remainingPayment: totalPrice,
    totalPrice,
  };
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

export function createAdminBookingSnapshot(date = new Date()) {
  const cursorDate = createDate(date.getFullYear(), date.getMonth(), date.getDate());

  return createDemoBookingsForMonth(cursorDate);
}

function createInitialBookingForm(date, timeKey = '10:00') {
  return {
    bookingDate: formatDateKey(date),
    customerName: '',
    dpAmount: '',
    durationHours: 1,
    notes: '',
    paymentStatus: 'pending',
    phone: '',
    sessionType: 'Latihan Band',
    startTime: timeKey,
  };
}

function createBookingFormFromBooking(booking) {
  return {
    bookingDate: booking.dateKey || formatDateKey(new Date()),
    customerName: booking.customerName || '',
    dpAmount: booking.status === 'dp' ? String(booking.dpAmount || '') : '',
    durationHours: getClampedBookingDuration(booking),
    notes: booking.notes || '',
    paymentStatus: booking.status || 'pending',
    phone: booking.phone || '',
    sessionType: booking.sessionType || booking.title || 'Latihan Band',
    startTime: booking.time || '10:00',
  };
}

function getBookingForSlot(bookings, dayKey, timeKey) {
  return bookings.find((booking) => booking.dateKey === dayKey && booking.time === timeKey);
}

function getHourFromTimeKey(timeKey) {
  return Number(String(timeKey).split(':')[0]) || 0;
}

function getClampedBookingDuration(booking) {
  const startHour = getHourFromTimeKey(booking.time);
  const maxDuration = Math.max(1, studioHours.closeHour - startHour);
  const duration = Number(booking.durationHours) || 1;

  return Math.min(Math.max(1, duration), maxDuration);
}

function getBookingEndHour(booking) {
  return getHourFromTimeKey(booking.time) + getClampedBookingDuration(booking);
}

function hasBookingTimeOverlap(firstBooking, secondBooking) {
  if (!firstBooking || !secondBooking || firstBooking.dateKey !== secondBooking.dateKey) {
    return false;
  }

  const firstStart = getHourFromTimeKey(firstBooking.time);
  const firstEnd = getBookingEndHour(firstBooking);
  const secondStart = getHourFromTimeKey(secondBooking.time);
  const secondEnd = getBookingEndHour(secondBooking);

  return firstStart < secondEnd && firstEnd > secondStart;
}

function getBookingConflict(bookings, candidateBooking, ignoredBookingId = '') {
  if (!candidateBooking) {
    return null;
  }

  return bookings.find((booking) => (
    booking
      && booking.id !== ignoredBookingId
      && hasBookingTimeOverlap(booking, candidateBooking)
  )) || null;
}

function getBookingConflictMessage(conflictBooking) {
  const conflictDate = parseDateInputToDate(
    conflictBooking.dateKey,
    createDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
  );
  const conflictEndTime = padNumber(getBookingEndHour(conflictBooking)) + ':00';
  const conflictName = conflictBooking.customerName || conflictBooking.title || 'booking lain';

  return 'Jadwal bentrok dengan ' + conflictName + ' pada ' + formatFullDateLabel(conflictDate) + ', jam ' + conflictBooking.time + ' - ' + conflictEndTime + '. Pilih jam atau durasi lain.';
}

function isSlotCoveredByBooking(booking, dayKey, timeKey) {
  if (!booking || booking.dateKey !== dayKey) {
    return false;
  }

  const slotHour = getHourFromTimeKey(timeKey);
  const startHour = getHourFromTimeKey(booking.time);
  const endHour = startHour + getClampedBookingDuration(booking);

  return slotHour >= startHour && slotHour < endHour;
}

function getBookingSpanForSlot(bookings, dayKey, timeKey) {
  const booking = bookings.find((item) => isSlotCoveredByBooking(item, dayKey, timeKey));

  if (!booking) {
    return {
      booking: null,
      isStart: false,
    };
  }

  return {
    booking,
    isStart: booking.time === timeKey,
  };
}

function getBookingDurationHeight(booking) {
  const duration = getClampedBookingDuration(booking);

  return Math.max(46, duration * 54 - 8);
}

function getVisibleBookings(bookings, visibleDays) {
  const visibleKeys = new Set(visibleDays.map((day) => day.key));

  return bookings.filter((booking) => visibleKeys.has(booking.dateKey));
}

function normalizeCustomerQuery(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function bookingMatchesCustomerQuery(booking, customerQuery) {
  if (!customerQuery) return true;

  const searchable = [
    booking.customerName,
    booking.phone,
    booking.sessionType,
    booking.title,
  ]
    .map(normalizeCustomerQuery)
    .join(' ');

  return searchable.includes(customerQuery);
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
    return 'minmax(220px,1fr)';
  }

  if (viewMode === 'week') {
    return 'minmax(104px,1fr)';
  }

  return '92px';
}

function getGridMinWidth(viewMode, visibleDays) {
  if (viewMode === 'month') {
    return 112 + visibleDays.length * 92;
  }

  if (viewMode === 'week') {
    return 112 + visibleDays.length * 104;
  }

  return 332;
}

function getInitialViewMode() {
  if (typeof window === 'undefined') {
    return 'month';
  }

  return window.matchMedia('(max-width: 767px)').matches ? 'week' : 'month';
}

function ThemedSelect({
  icon: Icon,
  label,
  name,
  onChange,
  options,
  value,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => String(option.value) === String(value)) || options[0];

  const handleSelect = (nextValue) => {
    onChange({
      target: {
        name,
        value: nextValue,
      },
    });
    setIsOpen(false);
  };

  return (
    <div
      className="relative grid gap-1.5 text-sm font-semibold text-[var(--ui-text-main)]"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      {label}

      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex min-h-11 w-full items-center gap-3 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 text-left text-sm font-semibold text-[var(--ui-text-strong)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:bg-[var(--ui-control-hover)] focus-visible:border-studio-accent/55 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 sm:min-h-12 sm:rounded-[1.25rem]"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        {Icon ? (
          <Icon
            className="shrink-0 text-[var(--ui-text-muted)]"
            size={16}
            strokeWidth={2.25}
            aria-hidden="true"
          />
        ) : null}

        <span className="min-w-0 flex-1 truncate">
          {selectedOption.label}
        </span>

        <ChevronDown
          className={cn(
            'shrink-0 text-[var(--ui-text-muted)] transition-transform',
            isOpen ? 'rotate-180' : '',
          )}
          size={16}
          strokeWidth={2.25}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 max-h-64 overflow-auto rounded-[1.25rem] border border-[var(--ui-border-strong)] bg-[var(--ui-bg-base)] p-1.5 shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)]"
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = String(option.value) === String(value);

            return (
              <button
                aria-selected={isSelected}
                className={cn(
                  'flex min-h-10 w-full items-center justify-between gap-3 rounded-2xl px-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20',
                  isSelected
                    ? 'bg-[var(--ui-control-hover)] text-studio-accent'
                    : 'text-[var(--ui-text-main)] hover:bg-[var(--ui-control)] hover:text-[var(--ui-text-strong)]',
                )}
                key={option.value}
                role="option"
                type="button"
                onClick={() => handleSelect(option.value)}
              >
                <span className="truncate">
                  {option.label}
                </span>

                {isSelected ? (
                  <span className="size-2 rounded-full bg-studio-accent" aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function FieldShell({
  children,
  icon: Icon,
  label,
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-[var(--ui-text-main)]">
      {label}
      <span className="flex min-h-11 items-center gap-3 rounded-[1.15rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 ring-1 ring-[var(--ui-ring)] focus-within:border-studio-accent/55 focus-within:ring-4 focus-within:ring-studio-accent/20 sm:min-h-12 sm:rounded-[1.25rem]">
        {Icon ? <Icon size={16} strokeWidth={2.25} aria-hidden="true" /> : null}
        {children}
      </span>
    </label>
  );
}

function BookingModal({
  bookingForm,
  footerHint = 'Simpan ke Firestore',
  isSaving = false,
  isOpen,
  modalDescription = '',
  modalEyebrow = 'Booking form',
  modalTitle = 'Tambah booking studio',
  onChange,
  onClose,
  onSubmit,
  paymentPreview,
  saveError = '',
  submitLabel = 'Simpan booking',
  submittingLabel = 'Menyimpan...',
}) {
  if (!isOpen) return null;

  const timeSelectOptions = createTimeSlots().map((slot) => ({
    label: slot.key,
    value: slot.key,
  }));
  const durationSelectOptions = durationOptions.map((duration) => ({
    label: duration + ' jam',
    value: String(duration),
  }));
  const sessionSelectOptions = sessionTypes.map((item) => ({
    label: item,
    value: item,
  }));
  const formDescription = modalDescription || 'Harga otomatis ' + formatCurrency(PRICE_PER_HOUR) + ' per jam. Data tersimpan ke Firestore.';


  return (
    <div
      className="fixed inset-0 z-50 grid items-end p-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] [background:color-mix(in_srgb,var(--ui-bg-base)_62%,transparent)] backdrop-blur-xl sm:place-items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <form
        className="grid max-h-[calc(100dvh-16px)] w-full gap-4 overflow-auto rounded-t-[1.75rem] border border-[var(--ui-border-strong)] bg-[var(--ui-bg-base)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] sm:max-h-[calc(100dvh-32px)] sm:w-[min(760px,calc(100vw-32px))] sm:rounded-[2rem] sm:p-6"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-studio-accent">
              {modalEyebrow}
            </span>
            <h2
              className="m-0 text-2xl font-semibold tracking-[-0.06em] text-[var(--ui-text-strong)] sm:text-3xl"
              id="booking-modal-title"
            >
              {modalTitle}
            </h2>
            <p className="m-0 text-sm leading-6 text-[var(--ui-text-muted)]">
              {formDescription}
            </p>
          </div>

          <button
            aria-label="Close booking form"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25"
            type="button"
            onClick={onClose}
          >
            <X size={17} strokeWidth={2.35} aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {saveError ? (
            <div className="sm:col-span-2 rounded-[1.25rem] border border-studio-accent/35 bg-studio-accent/10 px-4 py-3 text-sm font-semibold leading-6 text-[var(--ui-text-main)] ring-1 ring-studio-accent/15">
              {saveError}
            </div>
          ) : null}

          <FieldShell icon={UserRound} label="Nama customer">
            <input
              className="w-full border-0 bg-transparent text-sm font-semibold text-[var(--ui-text-strong)] outline-none placeholder:text-[var(--ui-text-soft)]"
              name="customerName"
              placeholder="Contoh: Raka Pradana"
              required
              type="text"
              value={bookingForm.customerName}
              onChange={onChange}
            />
          </FieldShell>

          <FieldShell icon={Phone} label="Nomor telepon">
            <input
              className="w-full border-0 bg-transparent text-sm font-semibold text-[var(--ui-text-strong)] outline-none placeholder:text-[var(--ui-text-soft)]"
              name="phone"
              placeholder="08xxxxxxxxxx"
              required
              type="tel"
              value={bookingForm.phone}
              onChange={onChange}
            />
          </FieldShell>

          <FieldShell icon={CalendarDays} label="Tanggal booking">
            <input
              className="w-full border-0 bg-transparent text-sm font-semibold text-[var(--ui-text-strong)] outline-none"
              name="bookingDate"
              required
              type="date"
              value={bookingForm.bookingDate}
              onChange={onChange}
            />
          </FieldShell>

          <ThemedSelect
            icon={Clock3}
            label="Jam mulai"
            name="startTime"
            options={timeSelectOptions}
            value={bookingForm.startTime}
            onChange={onChange}
          />

          <ThemedSelect
            icon={Clock3}
            label="Durasi booking"
            name="durationHours"
            options={durationSelectOptions}
            value={bookingForm.durationHours}
            onChange={onChange}
          />

          <ThemedSelect
            icon={ReceiptText}
            label="Tipe sesi"
            name="sessionType"
            options={sessionSelectOptions}
            value={bookingForm.sessionType}
            onChange={onChange}
          />
        </div>

        <div className="grid gap-3 rounded-[1.35rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-3 ring-1 ring-[var(--ui-ring)] sm:rounded-[1.5rem] sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ui-text-strong)]">
              <WalletCards size={16} strokeWidth={2.35} aria-hidden="true" />
              Status pembayaran
            </span>

            <span className="text-sm font-semibold text-[var(--ui-text-muted)]">
              {formatCurrency(PRICE_PER_HOUR)} / jam
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {paymentOptions.map((item) => (
              <button
                aria-pressed={bookingForm.paymentStatus === item.key}
                className={cn(
                  'min-h-10 rounded-full border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25 sm:min-h-11',
                  bookingForm.paymentStatus === item.key
                    ? 'border-studio-accent/35 bg-[var(--ui-control-hover)] text-studio-accent shadow-[var(--ui-shadow-control)] ring-1 ring-studio-accent/15'
                    : 'border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-[var(--ui-secondary-text)] hover:bg-[var(--ui-control)] hover:text-[var(--ui-text-strong)]',
                )}
                key={item.key}
                type="button"
                onClick={() => onChange({
                  target: {
                    name: 'paymentStatus',
                    value: item.key,
                  },
                })}
              >
                {item.label}
              </button>
            ))}
          </div>

          {bookingForm.paymentStatus === 'dp' ? (
            <FieldShell icon={Banknote} label="Nominal DP">
              <input
                className="w-full border-0 bg-transparent text-sm font-semibold text-[var(--ui-text-strong)] outline-none placeholder:text-[var(--ui-text-soft)]"
                min="0"
                name="dpAmount"
                placeholder="Contoh: 50000"
                type="number"
                value={bookingForm.dpAmount}
                onChange={onChange}
              />
            </FieldShell>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-1 border-y border-[var(--ui-border)] py-3 sm:border-y-0 sm:border-l sm:px-4 sm:first:border-l-0">
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)] sm:text-[0.68rem] sm:tracking-[0.16em]">
                Total
              </span>
              <strong className="text-lg font-semibold text-[var(--ui-text-strong)]">
                {formatCurrency(paymentPreview.totalPrice)}
              </strong>
            </div>

            <div className="grid gap-1 border-y border-[var(--ui-border)] py-3 sm:border-y-0 sm:border-l sm:px-4 sm:first:border-l-0">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
                Terbayar
              </span>
              <strong className="text-lg font-semibold text-[var(--ui-text-strong)]">
                {formatCurrency(paymentPreview.dpAmount)}
              </strong>
            </div>

            <div className="grid gap-1 border-y border-[var(--ui-border)] py-3 sm:border-y-0 sm:border-l sm:px-4 sm:first:border-l-0">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
                Sisa
              </span>
              <strong className="text-lg font-semibold text-[var(--ui-text-strong)]">
                {formatCurrency(paymentPreview.remainingPayment)}
              </strong>
            </div>
          </div>
        </div>

        <label className="grid gap-2 text-sm font-semibold text-[var(--ui-text-main)]">
          Catatan tambahan
          <textarea
            className="min-h-24 resize-y rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 py-3 text-sm font-semibold leading-6 text-[var(--ui-text-strong)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] outline-none placeholder:text-[var(--ui-text-soft)] focus:border-studio-accent/55 focus:ring-4 focus:ring-studio-accent/20"
            name="notes"
            placeholder="Contoh: butuh ampli gitar tambahan, request mic vocal, dll."
            value={bookingForm.notes}
            onChange={onChange}
          />
        </label>

        <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ui-border)] bg-[var(--ui-bg-base)] px-4 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-3 sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-4">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ui-text-muted)]">
            <ReceiptText size={16} strokeWidth={2.35} aria-hidden="true" />
            {footerHint}
          </span>

          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-5 text-sm font-semibold text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25"
              type="button"
              onClick={onClose}
            >
              Batal
            </button>

            <button
              aria-busy={isSaving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full [background:var(--ui-primary-bg)] px-5 text-sm font-semibold text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              <Plus size={16} strokeWidth={2.35} aria-hidden="true" />
              {isSaving ? submittingLabel : submitLabel}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function DetailRow({
  helper,
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="grid gap-0.5 border-t border-[var(--ui-border)] py-2.5 first:border-t-0 sm:py-3">
      <div className="flex items-center gap-2 text-[0.58rem] font-semibold uppercase tracking-[0.13em] text-[var(--ui-text-muted)] sm:text-[0.68rem] sm:tracking-[0.16em]">
        {Icon ? <Icon size={13} strokeWidth={2.35} aria-hidden="true" /> : null}
        {label}
      </div>

      <strong className="text-[0.95rem] font-semibold leading-5 tracking-[-0.035em] text-[var(--ui-text-strong)] sm:text-base">
        {value}
      </strong>

      {helper ? (
        <span className="text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
          {helper}
        </span>
      ) : null}
    </div>
  );
}

function PaymentMini({
  helper,
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="grid min-w-0 gap-0.5 border-l border-[var(--ui-border)] px-2 py-2.5 first:border-l-0 sm:px-4 sm:py-3.5">
      <div className="flex min-w-0 items-center gap-1.5 text-[0.52rem] font-semibold uppercase tracking-[0.11em] text-[var(--ui-text-muted)] sm:text-[0.68rem] sm:tracking-[0.16em]">
        {Icon ? <Icon className="shrink-0" size={12} strokeWidth={2.35} aria-hidden="true" /> : null}
        <span className="truncate">{label}</span>
      </div>

      <strong className="truncate text-base font-semibold leading-5 tracking-[-0.05em] text-[var(--ui-text-strong)] sm:text-xl">
        {value}
      </strong>

      <span className="truncate text-[0.68rem] font-medium leading-4 text-[var(--ui-text-muted)] sm:text-xs sm:leading-5">
        {helper}
      </span>
    </div>
  );
}

function BookingDetailModal({
  booking,
  bookingActionId = '',
  onClose,
  onDelete,
  onEdit,
  onMarkPaid,
}) {
  if (!booking) return null;

  const duration = getClampedBookingDuration(booking);
  const startHour = getHourFromTimeKey(booking.time);
  const endTime = padNumber(startHour + duration) + ':00';
  const bookingDate = parseDateInputToDate(booking.dateKey, createDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
  const paidAmount = booking.status === 'paid' ? booking.totalPrice : booking.dpAmount;
  const displayName = booking.customerName || booking.title;
  const sessionLabel = booking.sessionType || booking.title || 'Booking';
  const paymentLabel = getStatusLabel(booking.status);
  const canManageBooking = booking.source === 'admin' || booking.studioId === 'main-studio';
  const isDeletePending = bookingActionId === booking.id + ':delete';
  const isPaidPending = bookingActionId === booking.id + ':paid';
  const isActionPending = isDeletePending || isPaidPending;
  const isPaid = booking.status === 'paid';
  let statusDotClass = 'bg-studio-accent';

  if (booking.status === 'dp') {
    statusDotClass = 'bg-studio-purple';
  }

  if (booking.status === 'paid') {
    statusDotClass = 'bg-studio-cyan';
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] [background:color-mix(in_srgb,var(--ui-bg-base)_62%,transparent)] backdrop-blur-xl sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-detail-title"
    >
      <div className="flex max-h-[calc(100dvh-5.5rem)] w-full flex-col overflow-hidden rounded-[1.5rem] border border-[var(--ui-border-strong)] bg-[var(--ui-bg-base)] shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] sm:max-h-[calc(100dvh-32px)] sm:w-[min(760px,calc(100vw-32px))] sm:rounded-[2rem]">
        <header className="shrink-0 border-b border-[var(--ui-border)] px-4 py-3 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="grid min-w-0 gap-2">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-2.5 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-studio-accent ring-1 ring-[var(--ui-ring)] sm:px-3 sm:text-[0.68rem] sm:tracking-[0.18em]">
                <ReceiptText size={13} strokeWidth={2.35} aria-hidden="true" />
                Detail booking
              </span>

              <div className="grid gap-1">
                <h2
                  className="m-0 truncate text-3xl font-semibold leading-none tracking-[-0.07em] text-[var(--ui-text-strong)] sm:text-[clamp(2rem,4vw,3.25rem)]"
                  id="booking-detail-title"
                >
                  {displayName}
                </h2>

                <p className="m-0 max-w-2xl text-sm leading-6 text-[var(--ui-text-muted)]">
                  {sessionLabel} • {formatFullDateLabel(bookingDate)} • {booking.time} - {endTime}
                </p>
              </div>
            </div>

            <button
              aria-label="Close booking detail"
              className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25 sm:size-10"
              type="button"
              onClick={onClose}
            >
              <X size={17} strokeWidth={2.35} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="grid gap-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <section className="grid gap-3.5 sm:gap-4" aria-label="Ringkasan booking">
            <div className="flex items-center justify-between gap-3 pb-1 sm:pb-1.5">
              <div className="grid min-w-0 gap-1">
                <span className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)] sm:text-[0.68rem] sm:tracking-[0.16em]">
                  Status pembayaran
                </span>

                <strong className="inline-flex min-w-0 items-center gap-2 pb-0.5 text-2xl font-semibold leading-[1.18] tracking-[-0.055em] text-[var(--ui-text-strong)] sm:text-3xl sm:leading-[1.14]">
                  <span className={cn('size-2 shrink-0 rounded-full', statusDotClass)} aria-hidden="true" />
                  <span className="truncate">{paymentLabel}</span>
                </strong>
              </div>

              <span className="inline-flex max-w-[48%] shrink-0 items-center gap-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-2.5 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[var(--ui-text-main)] ring-1 ring-[var(--ui-ring)] sm:max-w-none sm:px-3 sm:py-2 sm:text-xs sm:tracking-[0.14em]">
                <span className={cn('size-1.5 shrink-0 rounded-full sm:size-2', statusDotClass)} aria-hidden="true" />
                <span className="truncate">{sessionLabel}</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-0 border-y border-[var(--ui-border)] py-1">
              <PaymentMini
                icon={WalletCards}
                label="Total"
                value={formatCurrency(booking.totalPrice)}
                helper={duration + ' jam'}
              />

              <PaymentMini
                icon={Banknote}
                label="Bayar"
                value={formatCurrency(paidAmount)}
                helper={booking.status === 'dp' ? 'DP' : paymentLabel}
              />

              <PaymentMini
                icon={ReceiptText}
                label="Sisa"
                value={formatCurrency(booking.remainingPayment)}
                helper={booking.remainingPayment > 0 ? 'Belum lunas' : 'Lunas'}
              />
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 sm:gap-6" aria-label="Data booking">
            <div className="grid gap-0">
              <span className="pb-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-studio-accent">
                Customer
              </span>

              <DetailRow
                icon={UserRound}
                label="Nama"
                value={displayName}
                helper={booking.phone || 'Nomor telepon belum diisi'}
              />

              <DetailRow
                icon={Phone}
                label="Nomor telepon"
                value={booking.phone || '-'}
                helper="Kontak customer"
              />
            </div>

            <div className="grid gap-0">
              <span className="pb-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-studio-accent">
                Jadwal
              </span>

              <DetailRow
                icon={CalendarDays}
                label="Tanggal"
                value={formatFullDateLabel(bookingDate)}
                helper={booking.dateKey}
              />

              <DetailRow
                icon={Clock3}
                label="Waktu"
                value={booking.time + ' - ' + endTime}
                helper={'Durasi ' + duration + ' jam'}
              />
            </div>
          </section>

          <section className="grid gap-1.5 border-y border-[var(--ui-border)] py-3" aria-label="Catatan booking">
            <span className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)] sm:text-[0.68rem] sm:tracking-[0.16em]">
              Catatan
            </span>

            <p className="m-0 text-sm leading-6 text-[var(--ui-text-main)]">
              {booking.notes || 'Belum ada catatan tambahan untuk booking ini.'}
            </p>
          </section>
        </div>

        <footer className="shrink-0 border-t border-[var(--ui-border)] bg-[var(--ui-bg-base)] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-5">
          <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
            <span className="text-xs font-semibold leading-5 text-[var(--ui-text-muted)]">
              {canManageBooking
                ? 'Booking ini tersimpan di Firestore dan bisa dikelola dari admin.'
                : 'Demo booking ini masih read-only. Buat booking baru untuk mencoba action Firestore.'}
            </span>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {canManageBooking ? (
                <>
                  <button
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-4 text-sm font-semibold text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isActionPending}
                    type="button"
                    onClick={() => onEdit(booking)}
                  >
                    Edit
                  </button>

                  <button
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-studio-cyan/35 bg-studio-cyan/10 px-4 text-sm font-semibold text-studio-cyan ring-1 ring-studio-cyan/15 transition hover:-translate-y-0.5 hover:bg-studio-cyan/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-cyan/20 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isActionPending || isPaid}
                    type="button"
                    onClick={() => onMarkPaid(booking)}
                  >
                    {isPaidPending ? 'Memproses...' : isPaid ? 'Sudah lunas' : 'Mark lunas'}
                  </button>

                  <button
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-studio-accent/35 bg-studio-accent/10 px-4 text-sm font-semibold text-studio-accent ring-1 ring-studio-accent/15 transition hover:-translate-y-0.5 hover:bg-studio-accent/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isActionPending}
                    type="button"
                    onClick={() => onDelete(booking)}
                  >
                    {isDeletePending ? 'Menghapus...' : 'Hapus'}
                  </button>
                </>
              ) : null}

              <button
                className="inline-flex min-h-10 items-center justify-center rounded-full [background:var(--ui-primary-bg)] px-5 text-sm font-semibold text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
                type="button"
                onClick={onClose}
              >
                Tutup
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function BookingToast({
  onClose,
  toast,
}) {
  if (!toast) return null;

  const isError = toast.tone === 'error';
  const toneClass = isError
    ? 'border-studio-accent/35 bg-studio-accent/10 ring-studio-accent/15'
    : 'border-studio-cyan/35 bg-studio-cyan/10 ring-studio-cyan/15';
  const dotClass = isError ? 'bg-studio-accent' : 'bg-studio-cyan';

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-[70] flex justify-end md:bottom-4 md:right-4 md:left-auto">
      <div
        aria-live={isError ? 'assertive' : 'polite'}
        className={cn(
          'pointer-events-auto flex w-full max-w-[24rem] items-start gap-3 rounded-[1.35rem] border px-4 py-3 text-sm font-semibold leading-6 text-[var(--ui-text-main)] shadow-[var(--ui-shadow-soft)] ring-1 backdrop-blur-xl',
          toneClass,
        )}
        role={isError ? 'alert' : 'status'}
      >
        <span className={cn('mt-2 size-2 shrink-0 rounded-full', dotClass)} aria-hidden="true" />

        <span className="min-w-0 flex-1">
          {toast.message}
        </span>

        <button
          aria-label="Tutup notifikasi"
          className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
          type="button"
          onClick={onClose}
        >
          <X size={14} strokeWidth={2.45} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function CalendarCell({
  booking,
  day,
  durationHeight = 0,
  isBookingSpan = false,
  isBookingStart = false,
  isSelected,
  onSelect,
  time,
}) {
  const duration = booking ? getClampedBookingDuration(booking) : 0;
  const displayName = booking?.customerName || booking?.title || '';
  const sessionLabel = booking?.sessionType || booking?.title || 'Booking';
  const paymentLabel = booking ? getStatusLabel(booking.status) : '';
  const blockToneClass = booking ? toneClasses[booking.tone] : '';
  let statusDotClass = 'bg-studio-accent';

  if (booking?.status === 'dp') {
    statusDotClass = 'bg-studio-purple';
  }

  if (booking?.status === 'paid') {
    statusDotClass = 'bg-studio-cyan';
  }

  return (
    <button
      aria-label={booking ? displayName + ', ' + sessionLabel + ', status pembayaran ' + paymentLabel + ', ' + day.fullLabel + ', ' + time.label + ', durasi ' + duration + ' jam' : 'Empty slot, ' + day.fullLabel + ', ' + time.label}
      className={cn(
        'group relative min-h-[54px] overflow-visible border-b border-r border-[var(--ui-border)] p-1 text-left transition focus-visible:relative focus-visible:z-30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25 sm:p-1.5',
        solidSurfaces.gridCell,
        day.isWeekend ? solidSurfaces.gridCellWeekend : '',
        isSelected ? 'ring-2 ring-studio-accent/30 [background:color-mix(in_srgb,var(--ui-bg-base)_72%,var(--ui-control-hover))]' : '',
        isBookingSpan ? '[background:color-mix(in_srgb,var(--ui-bg-base)_80%,var(--ui-control))]' : '',
        isBookingStart ? 'z-10' : 'z-0',
        !isBookingSpan ? 'hover:[background:color-mix(in_srgb,var(--ui-bg-base)_78%,var(--ui-control))]' : '',
      )}
      type="button"
      onClick={onSelect}
    >
      {booking && isBookingStart ? (
        <span
          className={cn(
            'pointer-events-none absolute inset-x-1 top-1 z-10 grid max-w-[calc(100%-0.5rem)] content-start overflow-hidden rounded-[0.85rem] border px-1.5 py-1.5 text-left ring-1 ring-[var(--ui-ring)] backdrop-blur-xl sm:inset-x-1.5 sm:rounded-[0.95rem] sm:px-2',
            blockToneClass,
          )}
          style={{ height: durationHeight }}
        >
          <span
            className={cn('pointer-events-none absolute bottom-1.5 left-1 top-1.5 w-0.5 rounded-full sm:left-1.5', statusDotClass)}
            aria-hidden="true"
          />

          <span className="grid min-w-0 gap-[0.08rem] pl-1.5 sm:gap-0.5 sm:pl-2">
            <span className="block truncate text-[0.56rem] font-semibold leading-[0.68rem] tracking-[-0.035em] text-[var(--ui-text-strong)] sm:text-[0.62rem] sm:leading-3">
              {displayName}
            </span>

            <span className="block truncate text-[0.4rem] font-semibold uppercase leading-[0.58rem] tracking-[0.06em] text-[var(--ui-text-muted)] sm:text-[0.48rem] sm:leading-3 sm:tracking-[0.08em]">
              {sessionLabel}
            </span>

            <span className="inline-flex w-fit max-w-full items-center gap-1 rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-1 py-px text-[0.38rem] font-semibold uppercase leading-[0.58rem] tracking-[0.06em] text-[var(--ui-text-main)] sm:px-1.5 sm:text-[0.46rem] sm:leading-3 sm:tracking-[0.08em]">
              <span className={cn('size-0.5 shrink-0 rounded-full sm:size-1', statusDotClass)} aria-hidden="true" />
              <span className="truncate">
                {paymentLabel}
              </span>
            </span>
          </span>
        </span>
      ) : null}

      {booking && !isBookingStart ? (
        <span className="sr-only">
          Slot lanjutan dari booking {displayName}
        </span>
      ) : null}

      {!booking ? (
        <span
          className={cn(
            'grid min-h-[38px] place-items-center rounded-[0.85rem] border text-[var(--ui-text-soft)] transition sm:min-h-[44px] sm:rounded-[1rem]',
            isSelected
              ? 'border-studio-accent/35 bg-studio-accent/10 opacity-100'
              : 'border-transparent opacity-0 group-hover:border-[var(--ui-border)] group-hover:bg-[var(--ui-glass-soft)] group-hover:opacity-100',
          )}
        >
          <Plus size={15} strokeWidth={2.35} aria-hidden="true" />
        </span>
      ) : null}
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
        'relative z-20 grid h-12 place-items-center border-b border-r border-[var(--ui-border-strong)] px-1.5 text-center transition hover:[background:color-mix(in_srgb,var(--ui-bg-base)_72%,var(--ui-control-hover))] focus-visible:relative focus-visible:z-30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25 sm:h-14 sm:px-2',
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
        <span className="text-xs font-semibold tracking-[-0.02em] text-[var(--ui-text-strong)] sm:text-sm">
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
        'sticky left-0 z-40 grid min-h-[54px] w-[112px] place-items-center border-b border-r border-[var(--ui-border-strong)] px-1.5 text-center shadow-[12px_0_22px_rgb(0_0_0/0.14)] sm:w-[136px] sm:px-2',
        solidSurfaces.gridSticky,
      )}
    >
      <span className="text-[0.68rem] font-semibold tracking-[-0.015em] text-[var(--ui-text-main)] sm:text-xs">
        {slot.label}
      </span>
    </div>
  );
}

function BookingStatusCounters({ counts }) {
  return (
    <div className="grid w-full grid-cols-3 gap-1 rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-1 shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] sm:w-auto sm:flex sm:flex-wrap sm:items-center sm:gap-2 sm:rounded-full sm:p-1.5">
      {bookingStatusItems.map((item) => (
        <div
          className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-2 text-[0.64rem] font-semibold uppercase tracking-[0.1em] text-[var(--ui-text-main)] sm:min-h-9 sm:gap-2 sm:px-3 sm:text-xs sm:tracking-[0.13em]"
          key={item.key}
        >
          <span className={cn('size-1.5 rounded-full sm:size-2', item.dotClass)} />
          <span className="truncate">{item.label}</span>
          <strong className="text-xs tracking-[-0.03em] text-[var(--ui-text-strong)] sm:text-sm">
            {counts[item.key] || 0}
          </strong>
        </div>
      ))}
    </div>
  );
}

function BookingSlotCounters({ summary, timeSlots, visibleDays }) {
  const items = [
    {
      key: 'visible',
      label: 'Visible',
      value: summary.totalSlots,
      helper: visibleDays.length + ' hari x ' + timeSlots.length + ' jam',
    },
    {
      key: 'booked',
      label: 'Booked',
      value: summary.bookedSlots,
      helper: 'Booking aktif',
    },
    {
      key: 'available',
      label: 'Available',
      value: summary.availableSlots,
      helper: 'Slot kosong',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-0 border-y border-[var(--ui-border)]">
      {items.map((item) => (
        <article
          className="grid gap-0.5 border-l border-[var(--ui-border)] px-2 py-2 first:border-l-0 sm:px-5 sm:py-3"
          key={item.key}
        >
          <span className="truncate text-[0.58rem] font-semibold uppercase tracking-[0.11em] text-[var(--ui-text-muted)] sm:text-[0.68rem] sm:tracking-[0.16em]">
            {item.label}
          </span>

          <strong className="text-xl font-semibold leading-none tracking-[-0.055em] text-[var(--ui-text-strong)] sm:text-2xl">
            {item.value}
          </strong>

          <span className="hidden text-xs font-medium text-[var(--ui-text-muted)] sm:block">
            {item.helper}
          </span>
        </article>
      ))}
    </div>
  );
}

function ViewToggle({
  onChange,
  value,
}) {
  return (
    <div className="grid w-full grid-cols-3 rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-1 shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] sm:flex sm:w-auto sm:flex-wrap">
      {viewOptions.map((option) => (
        <button
          aria-pressed={value === option.key}
          className={cn(
            'inline-flex min-h-8 items-center justify-center rounded-full px-2 text-[0.66rem] font-semibold uppercase tracking-[0.11em] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25 sm:min-h-9 sm:px-3 sm:text-xs sm:tracking-[0.14em]',
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
  onAddBooking,
  onNext,
  onPrev,
  onToday,
  onViewChange,
  rangeLabel,
  statusCounts,
  viewMode,
}) {
  return (
    <div className="grid gap-2 rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-2 ring-1 ring-[var(--ui-ring)] sm:gap-3 sm:rounded-[1.5rem] sm:p-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center xl:rounded-[1.75rem]">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
        <button
          aria-label="Previous period"
          className="grid size-9 place-items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25 sm:size-10"
          type="button"
          onClick={onPrev}
        >
          <ChevronLeft size={16} strokeWidth={2.35} aria-hidden="true" />
        </button>

        <div className="inline-flex min-h-9 min-w-0 items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 text-xs font-semibold text-[var(--ui-text-strong)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] sm:min-h-10 sm:min-w-[220px] sm:px-4 sm:text-sm">
          <CalendarDays size={14} strokeWidth={2.35} aria-hidden="true" />
          <span className="truncate">{rangeLabel}</span>
        </div>

        <button
          aria-label="Next period"
          className="grid size-9 place-items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25 sm:size-10"
          type="button"
          onClick={onNext}
        >
          <ChevronRight size={16} strokeWidth={2.35} aria-hidden="true" />
        </button>

        <button
          className="inline-flex min-h-9 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-3 text-xs font-semibold text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25 sm:min-h-10 sm:px-4 sm:text-sm"
          type="button"
          onClick={onToday}
        >
          Today
        </button>
      </div>

      <BookingStatusCounters counts={statusCounts} />

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:flex-wrap lg:justify-end">
        <ViewToggle
          onChange={onViewChange}
          value={viewMode}
        />

        <button
          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full [background:var(--ui-primary-bg)] px-3 text-sm font-semibold text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20 sm:min-h-10 sm:gap-2 sm:px-4"
          type="button"
          onClick={onAddBooking}
        >
          <Plus size={15} strokeWidth={2.35} aria-hidden="true" />
          <span className="sm:hidden">Add</span>
          <span className="hidden sm:inline">Add booking</span>
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
  const gridTemplateColumns = '112px repeat(' + visibleDays.length + ', ' + dayColumnTemplate + ')';
  const gridMinWidth = getGridMinWidth(viewMode, visibleDays);

  return (
    <div
      className={cn(
        'isolate overflow-hidden rounded-[1.35rem] border border-[var(--ui-border-strong)] shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] sm:rounded-[1.75rem]',
        solidSurfaces.gridShell,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-2 border-b border-[var(--ui-border-strong)] px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3',
          solidSurfaces.gridCorner,
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] sm:size-10 sm:rounded-2xl">
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

      <div className="relative z-0 overflow-x-auto">
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
                'sticky left-0 z-50 grid h-12 w-[112px] place-items-center border-b border-r border-[var(--ui-border-strong)] px-1.5 text-center shadow-[12px_0_22px_rgb(0_0_0/0.16)] sm:h-14 sm:w-[136px] sm:px-2',
                solidSurfaces.gridCorner,
              )}
            >
              <span className="grid gap-0.5">
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-studio-accent">
                  Booking
                </span>
                <span className="text-[0.64rem] font-semibold text-[var(--ui-text-muted)] sm:text-xs">
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
                const bookingSpan = getBookingSpanForSlot(bookings, day.key, slot.key);
                const booking = bookingSpan.booking;
                const isSelected = selectedSlot.dateKey === day.key && selectedSlot.timeKey === slot.key;

                return (
                  <CalendarCell
                    booking={booking}
                    day={day}
                    durationHeight={bookingSpan.isStart ? getBookingDurationHeight(booking) : 0}
                    isBookingSpan={Boolean(booking)}
                    isBookingStart={bookingSpan.isStart}
                    isSelected={isSelected}
                    key={day.key + '-' + slot.key}
                    time={slot}
                    onSelect={() => onSelectSlot(day, slot, booking)}
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
    <div className="rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-3 text-sm leading-6 text-[var(--ui-text-main)] ring-1 ring-[var(--ui-ring)] sm:rounded-[1.5rem] sm:p-4 sm:leading-7">
      <span className="font-semibold text-[var(--ui-text-strong)]">Selected slot:</span>{' '}
      {selectedSlot.label} jam {selectedSlot.timeKey}.
      {booking ? (
        <span>
          {' '}Slot ini sudah terisi untuk <span className="font-semibold text-[var(--ui-text-strong)]">{booking.customerName || booking.title}</span> dengan status <span className="font-semibold text-[var(--ui-text-strong)]">{getStatusLabel(booking.status)}</span>. Total {formatCurrency(booking.totalPrice)} dan sisa {formatCurrency(booking.remainingPayment)}.
        </span>
      ) : (
        <span>
          {' '}Slot ini kosong. Klik slot kosong atau tombol Add booking untuk membuka form.
        </span>
      )}
    </div>
  );
}

export function BookingAdmin() {
  const adminContext = useOutletContext() || {};
  const {
    addManualBooking = () => {},
    deleteManualBooking = () => {},
    manualBookings = [],
    updateManualBooking = () => {},
  } = adminContext;
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState(getInitialViewMode);
  const [cursorDate, setCursorDate] = useState(() => {
    const now = new Date();

    return createDate(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [detailBooking, setDetailBooking] = useState(null);
  const [bookingActionId, setBookingActionId] = useState('');
  const [bookingSaveError, setBookingSaveError] = useState('');
  const [isBookingSaving, setIsBookingSaving] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editBookingForm, setEditBookingForm] = useState(() => {
    const now = new Date();

    return createInitialBookingForm(createDate(now.getFullYear(), now.getMonth(), now.getDate()));
  });
  const [editSaveError, setEditSaveError] = useState('');
  const [isBookingUpdating, setIsBookingUpdating] = useState(false);
  const [bookingToast, setBookingToast] = useState(null);
  const [bookingForm, setBookingForm] = useState(() => {
    const now = new Date();
    return createInitialBookingForm(createDate(now.getFullYear(), now.getMonth(), now.getDate()));
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

  const timeSlots = useMemo(() => createTimeSlots(), []);
  const visibleDays = useMemo(() => createVisibleDays(viewMode, cursorDate), [cursorDate, viewMode]);
  const baseBookings = useMemo(() => createDemoBookingsForMonth(cursorDate), [cursorDate]);
  const bookings = useMemo(
    () => [...baseBookings, ...manualBookings],
    [baseBookings, manualBookings],
  );
  const customerFilter = searchParams.get('customer') || '';
  const normalizedCustomerFilter = useMemo(
    () => normalizeCustomerQuery(customerFilter),
    [customerFilter],
  );
  const filteredBookings = useMemo(
    () => bookings.filter((booking) => bookingMatchesCustomerQuery(booking, normalizedCustomerFilter)),
    [bookings, normalizedCustomerFilter],
  );
  const boardBookings = normalizedCustomerFilter ? filteredBookings : bookings;
  const visibleBookings = useMemo(
    () => getVisibleBookings(boardBookings, visibleDays),
    [boardBookings, visibleDays],
  );
  const statusCounts = useMemo(
    () => getBookingStatusCounts(visibleBookings),
    [visibleBookings],
  );
  const rangeLabel = useMemo(
    () => getViewRangeLabel(viewMode, visibleDays, cursorDate),
    [cursorDate, viewMode, visibleDays],
  );
  const paymentPreview = useMemo(
    () => calculateBookingPayment(bookingForm),
    [bookingForm],
  );
  const editPaymentPreview = useMemo(
    () => calculateBookingPayment(editBookingForm),
    [editBookingForm],
  );
  const showBookingToast = (tone, message) => {
    setBookingToast({
      id: Date.now(),
      message,
      tone,
    });
  };

  useEffect(() => {
    if (!bookingToast || typeof window === 'undefined') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setBookingToast(null);
    }, bookingToast.tone === 'error' ? 6500 : 4200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [bookingToast]);
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

  const openBookingModal = (date = cursorDate, timeKey = selectedSlot.timeKey) => {
    setBookingForm(createInitialBookingForm(date, timeKey));
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    if (isBookingSaving) {
      return;
    }

    setBookingSaveError('');
    setIsBookingModalOpen(false);
  };

  const closeBookingDetailModal = () => {
    setDetailBooking(null);
  };

  const openEditBookingModal = (booking) => {
    if (!booking) {
      return;
    }

    setEditingBooking(booking);
    setEditBookingForm(createBookingFormFromBooking(booking));
    setEditSaveError('');
  };

  const closeEditBookingModal = () => {
    if (isBookingUpdating) {
      return;
    }

    setEditingBooking(null);
    setEditSaveError('');
  };

  const handleMarkBookingPaid = async (booking) => {
    if (!booking || booking.status === 'paid') {
      return;
    }

    const nextBooking = {
      ...booking,
      dpAmount: booking.totalPrice,
      remainingPayment: 0,
      status: 'paid',
      tone: getToneByStatus('paid'),
      updatedAt: new Date().toISOString(),
    };

    setBookingActionId(booking.id + ':paid');

    try {
      await updateManualBooking(nextBooking);
      setDetailBooking(nextBooking);
      showBookingToast('success', 'Booking ditandai lunas.');
    } catch (error) {
      console.error('Failed to mark booking paid.', error);
      showBookingToast('error', 'Status lunas belum tersimpan. Cek koneksi atau Firestore rules.');
    } finally {
      setBookingActionId('');
    }
  };

  const handleDeleteBooking = async (booking) => {
    if (!booking) {
      return;
    }

    const label = booking.customerName || booking.title || 'booking ini';
    const shouldDelete = typeof window === 'undefined'
      ? true
      : window.confirm('Hapus booking ' + label + '?');

    if (!shouldDelete) {
      return;
    }

    setBookingActionId(booking.id + ':delete');

    try {
      await deleteManualBooking(booking.id);
      setDetailBooking(null);
      showBookingToast('success', 'Booking dihapus.');
    } catch (error) {
      console.error('Failed to delete booking.', error);
      showBookingToast('error', 'Booking belum terhapus. Cek koneksi atau Firestore rules.');
    } finally {
      setBookingActionId('');
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    if (bookingSaveError) {
      setBookingSaveError('');
    }

    setBookingForm((current) => {
      const next = {
        ...current,
        [name]: value,
      };

      if (name === 'paymentStatus' && value !== 'dp') {
        next.dpAmount = '';
      }

      return next;
    });
  };

  const handleEditFormChange = (event) => {
    const { name, value } = event.target;

    if (editSaveError) {
      setEditSaveError('');
    }

    setEditBookingForm((current) => {
      const nextForm = {
        ...current,
        [name]: value,
      };

      if (name === 'paymentStatus' && value !== 'dp') {
        nextForm.dpAmount = '';
      }

      return nextForm;
    });
  };

  const handleEditBookingSubmit = async (event) => {
    event.preventDefault();

    if (!editingBooking) {
      return;
    }

    setEditSaveError('');

    const payment = calculateBookingPayment(editBookingForm);
    const nextBooking = {
      ...editingBooking,
      customerName: editBookingForm.customerName.trim(),
      dateKey: editBookingForm.bookingDate,
      dpAmount: payment.dpAmount,
      durationHours: Number(editBookingForm.durationHours) || 1,
      notes: editBookingForm.notes.trim(),
      phone: editBookingForm.phone.trim(),
      remainingPayment: payment.remainingPayment,
      sessionType: editBookingForm.sessionType,
      source: editingBooking.source || 'admin',
      status: editBookingForm.paymentStatus,
      studioId: editingBooking.studioId || 'main-studio',
      time: editBookingForm.startTime,
      title: editBookingForm.sessionType,
      tone: getToneByStatus(editBookingForm.paymentStatus),
      totalPrice: payment.totalPrice,
      updatedAt: new Date().toISOString(),
    };

    const editBookingConflict = getBookingConflict(bookings, nextBooking, editingBooking.id);

    if (editBookingConflict) {
      const conflictMessage = getBookingConflictMessage(editBookingConflict);

      setEditSaveError(conflictMessage);
      showBookingToast('error', conflictMessage);
      return;
    }

    setIsBookingUpdating(true);

    try {
      await updateManualBooking(nextBooking);

      const nextDate = parseDateInputToDate(editBookingForm.bookingDate, cursorDate);

      setCursorDate(nextDate);
      setSelectedSlot({
        dateKey: editBookingForm.bookingDate,
        label: formatFullDateLabel(nextDate),
        timeKey: editBookingForm.startTime,
      });
      setDetailBooking(nextBooking);
      setEditingBooking(null);
      showBookingToast('success', 'Perubahan booking tersimpan.');
    } catch (error) {
      console.error('Failed to update booking.', error);
      setEditSaveError('Perubahan belum tersimpan. Cek koneksi, login Firebase, atau Firestore rules.');
      showBookingToast('error', 'Perubahan belum tersimpan. Cek koneksi, login Firebase, atau Firestore rules.');
    } finally {
      setIsBookingUpdating(false);
    }
  };

  const handleBookingSubmit = async (event) => {
    event.preventDefault();
    setBookingSaveError('');

    const payment = calculateBookingPayment(bookingForm);
    const nextBooking = {
      createdAt: new Date().toISOString(),
      customerName: bookingForm.customerName.trim(),
      dateKey: bookingForm.bookingDate,
      dpAmount: payment.dpAmount,
      durationHours: Number(bookingForm.durationHours) || 1,
      id: 'manual-' + Date.now(),
      notes: bookingForm.notes.trim(),
      phone: bookingForm.phone.trim(),
      remainingPayment: payment.remainingPayment,
      sessionType: bookingForm.sessionType,
      source: 'admin',
      status: bookingForm.paymentStatus,
      studioId: 'main-studio',
      time: bookingForm.startTime,
      title: bookingForm.sessionType,
      tone: getToneByStatus(bookingForm.paymentStatus),
      totalPrice: payment.totalPrice,
      updatedAt: new Date().toISOString(),
    };

    const bookingConflict = getBookingConflict(bookings, nextBooking);

    if (bookingConflict) {
      const conflictMessage = getBookingConflictMessage(bookingConflict);

      setBookingSaveError(conflictMessage);
      showBookingToast('error', conflictMessage);
      return;
    }

    setIsBookingSaving(true);

    try {
      const savedBooking = await addManualBooking(nextBooking);
      const nextDate = parseDateInputToDate(bookingForm.bookingDate, cursorDate);

      setCursorDate(nextDate);
      setSelectedSlot({
        dateKey: bookingForm.bookingDate,
        label: formatFullDateLabel(nextDate),
        timeKey: bookingForm.startTime,
      });
      setDetailBooking(savedBooking || nextBooking);
      setIsBookingModalOpen(false);
      showBookingToast('success', 'Booking baru tersimpan.');
    } catch (error) {
      console.error('Failed to save booking.', error);
      setBookingSaveError('Booking belum tersimpan. Cek koneksi, login Firebase, atau Firestore rules.');
      showBookingToast('error', 'Booking belum tersimpan. Cek koneksi, login Firebase, atau Firestore rules.');
    } finally {
      setIsBookingSaving(false);
    }
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

  const handleSelectSlot = (day, slot, booking) => {
    setCursorDate(day.date);
    setSelectedSlot({
      dateKey: day.key,
      label: day.fullLabel,
      timeKey: slot.key,
    });

    if (booking) {
      setDetailBooking(booking);
      return;
    }

    openBookingModal(day.date, slot.key);
  };

  return (
    <section className="grid gap-3 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-1 md:gap-4 md:pb-4 md:pt-2" aria-labelledby="booking-admin-title">
      <div className="sr-only" id="booking-admin-title">
        Booking calendar workspace
      </div>

      <BookingToast
        toast={bookingToast}
        onClose={() => setBookingToast(null)}
      />

      <div className="grid gap-3 md:gap-4">
        <CalendarToolbar
          rangeLabel={rangeLabel}
          statusCounts={statusCounts}
          viewMode={viewMode}
          onAddBooking={() => openBookingModal(cursorDate, selectedSlot.timeKey)}
          onNext={goToNextPeriod}
          onPrev={goToPreviousPeriod}
          onToday={goToToday}
          onViewChange={setViewMode}
        />

        {normalizedCustomerFilter ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-studio-accent/30 bg-studio-accent/10 px-4 py-3 text-sm font-semibold text-[var(--ui-text-main)] ring-1 ring-studio-accent/15">
            <span>
              Booking board difilter untuk customer: <span className="text-[var(--ui-text-strong)]">{customerFilter}</span>
            </span>

            <Link
              className="inline-flex min-h-9 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25"
              to="/admin/bookings"
            >
              Clear filter
            </Link>
          </div>
        ) : null}

        <BookingSlotCounters
          summary={summary}
          timeSlots={timeSlots}
          visibleDays={visibleDays}
        />

        <CalendarGrid
          bookings={boardBookings}
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
        bookings={boardBookings}
        selectedSlot={selectedSlot}
      />

      <BookingModal
        bookingForm={bookingForm}
        footerHint="Simpan booking ke Firestore"
        isOpen={isBookingModalOpen}
        isSaving={isBookingSaving}
        modalDescription="Harga otomatis mengikuti durasi booking. Data baru akan tersimpan ke Firestore."
        modalEyebrow="Booking baru"
        modalTitle="Tambah booking studio"
        paymentPreview={paymentPreview}
        saveError={bookingSaveError}
        submitLabel="Simpan booking"
        submittingLabel="Menyimpan..."
        onChange={handleFormChange}
        onClose={closeBookingModal}
        onSubmit={handleBookingSubmit}
      />

      <BookingDetailModal
        booking={detailBooking}
        bookingActionId={bookingActionId}
        onClose={closeBookingDetailModal}
        onDelete={handleDeleteBooking}
        onEdit={openEditBookingModal}
        onMarkPaid={handleMarkBookingPaid}
      />

      <BookingModal
        bookingForm={editBookingForm}
        footerHint="Update booking di Firestore"
        isOpen={Boolean(editingBooking)}
        isSaving={isBookingUpdating}
        modalDescription="Ubah detail booking, pembayaran, jadwal, dan catatan. Perubahan akan dikirim ke Firestore."
        modalEyebrow="Edit booking"
        modalTitle="Edit booking studio"
        paymentPreview={editPaymentPreview}
        saveError={editSaveError}
        submitLabel="Simpan perubahan"
        submittingLabel="Menyimpan perubahan..."
        onChange={handleEditFormChange}
        onClose={closeEditBookingModal}
        onSubmit={handleEditBookingSubmit}
      />
    </section>
  );
}

function parseDateInputToDate(value, fallback) {
  const parts = value.split('-').map(Number);

  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return fallback;
  }

  return createDate(parts[0], parts[1] - 1, parts[2]);
}
