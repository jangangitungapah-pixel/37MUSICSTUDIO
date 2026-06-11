import { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Grid3X3,
  Music2,
  Plus,
  Sparkles,
} from 'lucide-react';
import { cn } from '../lib/cn.js';

const monthMeta = {
  label: 'Booking Calendar',
  month: 'January',
  year: '2026',
  openHour: '10:00',
  closeHour: '23:00',
};

const dayNames = ['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'];

const calendarDays = Array.from({ length: 31 }, (_, index) => {
  const dayNumber = index + 1;
  const dayName = dayNames[index % dayNames.length];

  return {
    key: String(dayNumber).padStart(2, '0'),
    label: `${dayName} ${String(dayNumber).padStart(2, '0')}`,
    dayName,
    dayNumber,
    isWeekend: dayName === 'Sat' || dayName === 'Sun',
  };
});

const timeSlots = Array.from({ length: 13 }, (_, index) => {
  const startHour = 10 + index;
  const endHour = startHour + 1;

  return {
    key: `${String(startHour).padStart(2, '0')}:00`,
    label: `${String(startHour).padStart(2, '0')}:00 - ${String(endHour).padStart(2, '0')}:00`,
    compactLabel: `${String(startHour).padStart(2, '0')} - ${String(endHour).padStart(2, '0')}`,
  };
});

const bookingBlocks = [
  {
    id: 'booking-01',
    day: '03',
    time: '10:00',
    title: 'Band rehearsal',
    tone: 'accent',
  },
  {
    id: 'booking-02',
    day: '07',
    time: '14:00',
    title: 'Vocal take',
    tone: 'cyan',
  },
  {
    id: 'booking-03',
    day: '12',
    time: '19:00',
    title: 'Live session',
    tone: 'purple',
  },
  {
    id: 'booking-04',
    day: '19',
    time: '20:00',
    title: 'Tracking',
    tone: 'accent',
  },
  {
    id: 'booking-05',
    day: '25',
    time: '16:00',
    title: 'Mix review',
    tone: 'cyan',
  },
];

const toneClasses = {
  accent: 'border-studio-accent/35 bg-studio-accent/12 text-[var(--ui-text-strong)]',
  cyan: 'border-studio-cyan/35 bg-studio-cyan/12 text-[var(--ui-text-strong)]',
  purple: 'border-studio-purple/35 bg-studio-purple/12 text-[var(--ui-text-strong)]',
};

function getBooking(dayKey, timeKey) {
  return bookingBlocks.find((booking) => booking.day === dayKey && booking.time === timeKey);
}

function CalendarCell({
  day,
  time,
}) {
  const booking = getBooking(day.key, time.key);

  return (
    <button
      aria-label={booking ? `${booking.title}, ${day.label}, ${time.label}` : `Empty slot, ${day.label}, ${time.label}`}
      className={cn(
        'group min-h-[58px] w-[116px] border-b border-r border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-1.5 text-left transition focus-visible:relative focus-visible:z-20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25',
        day.isWeekend ? 'bg-[var(--ui-control)]/55' : '',
        booking ? 'hover:bg-[var(--ui-control-hover)]' : 'hover:bg-[var(--ui-control)]',
      )}
      type="button"
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
          <span className="mt-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
            {time.key}
          </span>
        </span>
      ) : (
        <span className="grid min-h-[44px] place-items-center rounded-[1rem] border border-transparent text-[var(--ui-text-soft)] opacity-0 transition group-hover:border-[var(--ui-border)] group-hover:bg-[var(--ui-glass-soft)] group-hover:opacity-100">
          <Plus size={15} strokeWidth={2.35} aria-hidden="true" />
        </span>
      )}
    </button>
  );
}

function CalendarHeaderCell({ day }) {
  return (
    <div
      className={cn(
        'grid h-14 w-[116px] place-items-center border-b border-r border-[var(--ui-border)] bg-[var(--ui-control)] px-2 text-center',
        day.isWeekend ? 'text-studio-accent' : 'text-[var(--ui-text-main)]',
      )}
    >
      <span className="grid gap-0.5">
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
          {day.dayName}
        </span>
        <span className="text-sm font-semibold tracking-[-0.02em] text-[var(--ui-text-strong)]">
          {String(day.dayNumber).padStart(2, '0')}
        </span>
      </span>
    </div>
  );
}

function TimeCell({ slot }) {
  return (
    <div className="sticky left-0 z-10 grid min-h-[58px] w-[168px] place-items-center border-b border-r border-[var(--ui-border-strong)] bg-[var(--ui-control)] px-3 text-center shadow-[12px_0_22px_rgb(0_0_0/0.04)]">
      <span className="text-xs font-semibold tracking-[-0.015em] text-[var(--ui-text-main)]">
        {slot.label}
      </span>
    </div>
  );
}

function CalendarGrid() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]">
            <Grid3X3 size={18} strokeWidth={2.35} aria-hidden="true" />
          </div>

          <div className="grid min-w-0 gap-0.5">
            <strong className="truncate text-sm font-semibold tracking-[-0.02em] text-[var(--ui-text-strong)]">
              Monthly booking board
            </strong>
            <span className="truncate text-xs font-medium text-[var(--ui-text-muted)]">
              Scroll horizontal untuk melihat tanggal 01 sampai 31
            </span>
          </div>
        </div>

        <div className="hidden items-center gap-2 text-xs font-semibold text-[var(--ui-text-muted)] sm:flex">
          <span className="size-2 rounded-full bg-studio-accent" />
          Booked
          <span className="ml-2 size-2 rounded-full bg-studio-cyan" />
          Recording
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          <div className="grid grid-cols-[168px_repeat(31,116px)]">
            <div className="sticky left-0 z-20 grid h-14 w-[168px] place-items-center border-b border-r border-[var(--ui-border-strong)] bg-[var(--ui-control-hover)] px-3 text-center shadow-[12px_0_22px_rgb(0_0_0/0.04)]">
              <span className="grid gap-0.5">
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-studio-accent">
                  Booking
                </span>
                <span className="text-xs font-semibold text-[var(--ui-text-muted)]">
                  {monthMeta.openHour} - {monthMeta.closeHour}
                </span>
              </span>
            </div>

            {calendarDays.map((day) => (
              <CalendarHeaderCell day={day} key={day.key} />
            ))}
          </div>

          {timeSlots.map((slot) => (
            <div className="grid grid-cols-[168px_repeat(31,116px)]" key={slot.key}>
              <TimeCell slot={slot} />

              {calendarDays.map((day) => (
                <CalendarCell
                  day={day}
                  key={`${day.key}-${slot.key}`}
                  time={slot}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalendarToolbar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          aria-label="Previous month placeholder"
          className="grid size-10 place-items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25"
          type="button"
        >
          <ChevronLeft size={17} strokeWidth={2.35} aria-hidden="true" />
        </button>

        <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-4 text-sm font-semibold text-[var(--ui-text-strong)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]">
          <CalendarDays size={16} strokeWidth={2.35} aria-hidden="true" />
          {monthMeta.month} {monthMeta.year}
        </div>

        <button
          aria-label="Next month placeholder"
          className="grid size-10 place-items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25"
          type="button"
        >
          <ChevronRight size={17} strokeWidth={2.35} aria-hidden="true" />
        </button>
      </div>

      <button
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full [background:var(--ui-primary-bg)] px-4 text-sm font-semibold text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
        type="button"
      >
        <Plus size={16} strokeWidth={2.35} aria-hidden="true" />
        Add booking
      </button>
    </div>
  );
}

export function BookingAdmin({ activeItem }) {
  const activeTitle = activeItem?.label || 'Booking';

  const summary = useMemo(() => {
    const bookedSlots = bookingBlocks.length;
    const totalSlots = calendarDays.length * timeSlots.length;
    const emptySlots = totalSlots - bookedSlots;

    return {
      bookedSlots,
      emptySlots,
      totalSlots,
    };
  }, []);

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
            {monthMeta.openHour} sampai {monthMeta.closeHour}
          </div>
        </div>

        <div className="grid gap-3">
          <h2
            className="m-0 max-w-[820px] text-[clamp(2.35rem,5vw,5rem)] font-semibold leading-[0.94] tracking-[-0.075em] text-[var(--ui-text-strong)]"
            id="booking-admin-title"
          >
            Calendar grid booking studio.
          </h2>

          <p className="m-0 max-w-2xl text-[clamp(0.98rem,1.25vw,1.12rem)] leading-8 text-[var(--ui-text-main)]">
            Format awal mengikuti tabel booking bulanan: tanggal 01 sampai 31 di bagian atas, jam booking di sisi kiri, lalu slot kosong atau booked di area grid.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="grid gap-1 border-y border-[var(--ui-border)] py-4 sm:border-y-0 sm:border-l sm:px-5 sm:first:border-l-0">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ui-text-muted)]">
            Total slot
          </span>
          <strong className="text-3xl font-semibold tracking-[-0.06em] text-[var(--ui-text-strong)]">
            {summary.totalSlots}
          </strong>
          <span className="text-sm leading-6 text-[var(--ui-text-muted)]">
            31 hari x 13 jam
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
            Dummy event
          </span>
        </article>

        <article className="grid gap-1 border-y border-[var(--ui-border)] py-4 sm:border-y-0 sm:border-l sm:px-5 sm:first:border-l-0">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ui-text-muted)]">
            Available
          </span>
          <strong className="text-3xl font-semibold tracking-[-0.06em] text-[var(--ui-text-strong)]">
            {summary.emptySlots}
          </strong>
          <span className="text-sm leading-6 text-[var(--ui-text-muted)]">
            Slot kosong
          </span>
        </article>
      </div>

      <div className="grid gap-4">
        <CalendarToolbar />
        <CalendarGrid />
      </div>

      <div className="rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-4 text-sm leading-7 text-[var(--ui-text-main)] ring-1 ring-[var(--ui-ring)]">
        <span className="font-semibold text-[var(--ui-text-strong)]">Catatan phase ini:</span>{' '}
        tombol slot dan tombol add booking masih placeholder UI. Phase berikutnya baru kita bisa bikin interaksi detail, modal booking, status, atau input customer.
      </div>
    </section>
  );
}
