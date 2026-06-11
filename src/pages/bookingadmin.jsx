import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  Filter,
  MessageCircle,
  Mic,
  Phone,
  Search,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { cn } from '../lib/cn.js';

const bookingFilters = [
  {
    key: 'all',
    label: 'Semua',
  },
  {
    key: 'new',
    label: 'Baru',
  },
  {
    key: 'pending',
    label: 'Pending',
  },
  {
    key: 'confirmed',
    label: 'Confirmed',
  },
];

const bookingRequests = [
  {
    id: 'BK-037-001',
    name: 'Raka Pradana',
    band: 'Northline Kids',
    type: 'Latihan Band',
    date: 'Hari ini',
    time: '19:00',
    status: 'new',
    channel: 'WhatsApp',
    note: 'Butuh slot latihan 2 jam, full band, request drum dan 2 gitar.',
  },
  {
    id: 'BK-037-002',
    name: 'Mira Ayu',
    band: 'Solo Vocal',
    type: 'Vocal Recording',
    date: 'Besok',
    time: '14:00',
    status: 'pending',
    channel: 'Instagram',
    note: 'Mau rekam vocal guide dan tanya paket tracking ringan.',
  },
  {
    id: 'BK-037-003',
    name: 'Dimas Wicak',
    band: 'The Velvet Room',
    type: 'Live Recording',
    date: 'Jumat',
    time: '20:00',
    status: 'confirmed',
    channel: 'Admin Manual',
    note: 'Sesi live recording sudah dikonfirmasi, tinggal follow up kebutuhan mic.',
  },
];

const bookingMetrics = [
  {
    label: 'Request baru',
    value: '3',
    helper: 'Dummy queue',
  },
  {
    label: 'Slot aktif',
    value: '6',
    helper: 'Placeholder',
  },
  {
    label: 'Follow up',
    value: '2',
    helper: 'Belum final',
  },
];

const bookingChecklist = [
  'Validasi nama customer dan kontak',
  'Cek kebutuhan sesi, durasi, dan format recording',
  'Pastikan slot jadwal tersedia',
  'Konfirmasi pembayaran atau DP nanti saat fitur final dibuat',
];

function getStatusLabel(status) {
  const labels = {
    new: 'Baru',
    pending: 'Pending',
    confirmed: 'Confirmed',
  };

  return labels[status] || 'Draft';
}

function getStatusClassName(status) {
  return cn(
    'rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em]',
    status === 'new' && 'border-studio-accent/35 bg-studio-accent/10 text-studio-accent',
    status === 'pending' && 'border-studio-purple/35 bg-studio-purple/10 text-[var(--ui-text-strong)]',
    status === 'confirmed' && 'border-studio-cyan/35 bg-studio-cyan/10 text-[var(--ui-text-strong)]',
  );
}

function BookingMetric({ helper, label, value }) {
  return (
    <article className="grid gap-1 border-y border-[var(--ui-border)] py-4 sm:border-y-0 sm:border-l sm:px-5 sm:first:border-l-0">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ui-text-muted)]">
        {label}
      </span>
      <strong className="text-3xl font-semibold tracking-[-0.06em] text-[var(--ui-text-strong)]">
        {value}
      </strong>
      <span className="text-sm leading-6 text-[var(--ui-text-muted)]">
        {helper}
      </span>
    </article>
  );
}

function BookingFilterButton({
  isActive,
  label,
  onClick,
}) {
  return (
    <button
      aria-pressed={isActive}
      className={cn(
        'inline-flex min-h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold tracking-[-0.01em] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25',
        isActive
          ? 'border-studio-accent/35 bg-[var(--ui-control-hover)] text-studio-accent shadow-[var(--ui-shadow-control)] ring-1 ring-studio-accent/15'
          : 'border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)]',
      )}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function BookingRequestCard({ request }) {
  return (
    <article className="grid gap-4 rounded-[1.6rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-4 ring-1 ring-[var(--ui-ring)] transition hover:border-studio-accent/35 hover:bg-[var(--ui-control)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-studio-accent">
            {request.id}
          </span>
          <h3 className="m-0 text-xl font-semibold tracking-[-0.045em] text-[var(--ui-text-strong)]">
            {request.name}
          </h3>
          <p className="m-0 text-sm leading-6 text-[var(--ui-text-muted)]">
            {request.band} • {request.channel}
          </p>
        </div>

        <span className={getStatusClassName(request.status)}>
          {getStatusLabel(request.status)}
        </span>
      </div>

      <p className="m-0 text-sm leading-7 text-[var(--ui-text-main)]">
        {request.note}
      </p>

      <div className="grid gap-2 rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-control)] p-3 text-sm ring-1 ring-[var(--ui-ring)] sm:grid-cols-3">
        <span className="inline-flex items-center gap-2 text-[var(--ui-text-main)]">
          <Mic size={15} strokeWidth={2.3} aria-hidden="true" />
          {request.type}
        </span>
        <span className="inline-flex items-center gap-2 text-[var(--ui-text-main)]">
          <Calendar size={15} strokeWidth={2.3} aria-hidden="true" />
          {request.date}
        </span>
        <span className="inline-flex items-center gap-2 text-[var(--ui-text-main)]">
          <Clock3 size={15} strokeWidth={2.3} aria-hidden="true" />
          {request.time}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full [background:var(--ui-primary-bg)] px-4 text-sm font-semibold text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
          type="button"
        >
          Lihat detail
          <ArrowRight size={15} strokeWidth={2.35} aria-hidden="true" />
        </button>

        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-4 text-sm font-semibold text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25"
          type="button"
        >
          <MessageCircle size={15} strokeWidth={2.35} aria-hidden="true" />
          Follow up
        </button>
      </div>
    </article>
  );
}

function BookingComposer() {
  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <form
      className="grid gap-4 rounded-[1.75rem] border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] p-5 shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] backdrop-blur-2xl"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-2">
        <div className="grid size-11 place-items-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]">
          <SlidersHorizontal size={20} strokeWidth={2.35} aria-hidden="true" />
        </div>

        <div className="grid gap-1">
          <h3 className="m-0 text-2xl font-semibold tracking-[-0.055em] text-[var(--ui-text-strong)]">
            Quick booking draft
          </h3>
          <p className="m-0 text-sm leading-6 text-[var(--ui-text-muted)]">
            Form ini masih placeholder UI. Belum menyimpan data dan belum terhubung ke backend.
          </p>
        </div>
      </div>

      <label className="grid gap-2 text-sm font-semibold text-[var(--ui-text-main)]" htmlFor="booking-customer-name">
        Nama customer
        <span className="flex min-h-12 items-center gap-3 rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 ring-1 ring-[var(--ui-ring)] focus-within:border-studio-accent/55 focus-within:ring-4 focus-within:ring-studio-accent/20">
          <UserRound size={16} strokeWidth={2.25} aria-hidden="true" />
          <input
            className="w-full border-0 bg-transparent text-sm font-semibold text-[var(--ui-text-strong)] outline-none placeholder:text-[var(--ui-text-soft)]"
            id="booking-customer-name"
            placeholder="Nama customer"
            type="text"
          />
        </span>
      </label>

      <label className="grid gap-2 text-sm font-semibold text-[var(--ui-text-main)]" htmlFor="booking-session-type">
        Tipe sesi
        <select
          className="min-h-12 rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 text-sm font-semibold text-[var(--ui-text-strong)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] outline-none focus:border-studio-accent/55 focus:ring-4 focus:ring-studio-accent/20"
          id="booking-session-type"
        >
          <option>Latihan Band</option>
          <option>Live Recording</option>
          <option>Tracking Recording</option>
          <option>Vocal Session</option>
        </select>
      </label>

      <label className="grid gap-2 text-sm font-semibold text-[var(--ui-text-main)]" htmlFor="booking-note">
        Catatan kebutuhan
        <textarea
          className="min-h-28 resize-y rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 py-3 text-sm font-semibold leading-6 text-[var(--ui-text-strong)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] outline-none placeholder:text-[var(--ui-text-soft)] focus:border-studio-accent/55 focus:ring-4 focus:ring-studio-accent/20"
          id="booking-note"
          placeholder="Contoh: latihan 2 jam, full band, butuh ampli gitar tambahan..."
        />
      </label>

      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full [background:var(--ui-primary-bg)] px-5 text-sm font-semibold text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
        type="submit"
      >
        Simpan draft placeholder
        <ArrowRight size={15} strokeWidth={2.35} aria-hidden="true" />
      </button>
    </form>
  );
}

function BookingChecklist() {
  return (
    <aside className="grid gap-4 rounded-[1.75rem] border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-5 ring-1 ring-[var(--ui-ring)]">
      <div className="grid gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-studio-accent">
          Admin flow
        </span>
        <h3 className="m-0 text-2xl font-semibold tracking-[-0.055em] text-[var(--ui-text-strong)]">
          Checklist booking
        </h3>
      </div>

      <div className="grid gap-3">
        {bookingChecklist.map((item) => (
          <div
            className="grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-3"
            key={item}
          >
            <span className="grid size-8 place-items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-cyan ring-1 ring-[var(--ui-ring)]">
              <CheckCircle2 size={16} strokeWidth={2.35} aria-hidden="true" />
            </span>
            <p className="m-0 text-sm leading-6 text-[var(--ui-text-main)]">
              {item}
            </p>
          </div>
        ))}
      </div>

      <a
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-4 text-sm font-semibold text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-control-hover)] hover:text-[var(--ui-text-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25"
        href="tel:+620000000000"
      >
        <Phone size={15} strokeWidth={2.35} aria-hidden="true" />
        Placeholder call admin
      </a>
    </aside>
  );
}

export function BookingAdmin({ activeItem }) {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredBookings = useMemo(() => {
    if (activeFilter === 'all') {
      return bookingRequests;
    }

    return bookingRequests.filter((request) => request.status === activeFilter);
  }, [activeFilter]);

  const activeTitle = activeItem?.label || 'Booking';

  return (
    <section className="grid gap-6 py-6" aria-labelledby="booking-admin-title">
      <div className="grid gap-5 border-b border-[var(--ui-border-strong)] pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-studio-accent ring-1 ring-[var(--ui-ring)]">
            <Sparkles size={14} strokeWidth={2.35} aria-hidden="true" />
            {activeTitle} Workspace
          </div>

          <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-secondary-bg)] px-4 text-sm font-semibold text-[var(--ui-secondary-text)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]">
            <Calendar size={15} strokeWidth={2.35} aria-hidden="true" />
            Placeholder data
          </div>
        </div>

        <div className="grid gap-3">
          <h2
            className="m-0 max-w-[760px] text-[clamp(2.35rem,5vw,5rem)] font-semibold leading-[0.94] tracking-[-0.075em] text-[var(--ui-text-strong)]"
            id="booking-admin-title"
          >
            Kelola booking studio dari satu meja kerja.
          </h2>

          <p className="m-0 max-w-2xl text-[clamp(0.98rem,1.25vw,1.12rem)] leading-8 text-[var(--ui-text-main)]">
            Halaman ini masih UI awal untuk modul booking. Isinya dummy dan placeholder dulu, supaya nanti alur request, konfirmasi, jadwal, dan follow up bisa dibangun bertahap.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {bookingMetrics.map((item) => (
          <BookingMetric
            helper={item.helper}
            key={item.label}
            label={item.label}
            value={item.value}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-4 text-sm font-semibold text-[var(--ui-text-main)] ring-1 ring-[var(--ui-ring)]">
                <Filter size={15} strokeWidth={2.35} aria-hidden="true" />
                Filter
              </span>

              {bookingFilters.map((filter) => (
                <BookingFilterButton
                  isActive={activeFilter === filter.key}
                  key={filter.key}
                  label={filter.label}
                  onClick={() => setActiveFilter(filter.key)}
                />
              ))}
            </div>

            <label className="flex min-h-10 min-w-[220px] items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-4 text-sm font-semibold text-[var(--ui-text-main)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] focus-within:border-studio-accent/55 focus-within:ring-4 focus-within:ring-studio-accent/20">
              <Search size={15} strokeWidth={2.35} aria-hidden="true" />
              <input
                className="w-full border-0 bg-transparent text-sm font-semibold text-[var(--ui-text-strong)] outline-none placeholder:text-[var(--ui-text-soft)]"
                placeholder="Search dummy"
                type="search"
              />
            </label>
          </div>

          <div className="grid gap-3">
            {filteredBookings.map((request) => (
              <BookingRequestCard
                key={request.id}
                request={request}
              />
            ))}
          </div>
        </div>

        <div className="grid content-start gap-4">
          <BookingComposer />
          <BookingChecklist />
        </div>
      </div>
    </section>
  );
}
