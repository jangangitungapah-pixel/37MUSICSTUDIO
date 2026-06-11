import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Headphones,
  LockKeyhole,
  Mail,
  Radio,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';

const accessHighlights = [
  {
    icon: Headphones,
    title: 'Session-ready',
    text: 'Akses cepat untuk jadwal studio, booking, dan catatan sesi.',
  },
  {
    icon: Radio,
    title: 'Studio control',
    text: 'Disiapkan untuk panel operasional tanpa bikin halaman terasa penuh.',
  },
  {
    icon: ShieldCheck,
    title: 'Clear access',
    text: 'Form dibuat terang, kontras, dan stabil di dua palet warna.',
  },
];

const statusStyles = {
  idle: 'border-[var(--ui-border)] bg-[var(--ui-glass-soft)] text-[var(--ui-text-main)]',
  error: 'border-studio-accent/35 bg-studio-accent/10 text-[var(--ui-text-main)]',
  success: 'border-studio-cyan/35 bg-studio-cyan/10 text-[var(--ui-text-main)]',
};

const initialStatus = {
  kind: 'idle',
  title: 'Secure studio access',
  text: 'Masuk untuk mengelola booking, client, jadwal operator, dan session note studio.',
};

function getStatusClassName(kind) {
  return [
    'flex min-h-[88px] items-start gap-3 rounded-2xl border p-4 ring-1 ring-[var(--ui-ring)] transition',
    statusStyles[kind] || statusStyles.idle,
  ].join(' ');
}

function LoginInput({
  autoComplete,
  helper,
  icon: Icon,
  id,
  label,
  onChange,
  placeholder,
  type,
  value,
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[var(--ui-text-main)]" htmlFor={id}>
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <span className="text-xs font-medium text-[var(--ui-text-soft)]">{helper}</span>
      </span>

      <span className="group flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-control)] px-4 text-[var(--ui-text-strong)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition focus-within:border-studio-accent/50 focus-within:ring-4 focus-within:ring-studio-accent/20 hover:border-studio-accent/30 hover:bg-[var(--ui-control-hover)]">
        <Icon
          className="shrink-0 text-[var(--ui-text-soft)] transition group-focus-within:text-studio-accent group-hover:text-studio-accent"
          size={18}
          strokeWidth={2.25}
          aria-hidden="true"
        />

        <input
          autoComplete={autoComplete}
          className="min-h-10 w-full border-0 bg-transparent p-0 text-sm font-semibold text-[var(--ui-text-strong)] outline-none placeholder:text-[var(--ui-text-soft)]"
          id={id}
          onChange={onChange}
          placeholder={placeholder}
          type={type}
          value={value}
        />
      </span>
    </label>
  );
}

export function LoginPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [status, setStatus] = useState(initialStatus);

  const updateField = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));

    if (status.kind !== 'idle') {
      setStatus(initialStatus);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const email = form.email.trim();
    const password = form.password.trim();

    if (!email || !email.includes('@')) {
      setStatus({
        kind: 'error',
        title: 'Email belum valid',
        text: 'Masukkan email studio yang benar sebelum lanjut.',
      });
      return;
    }

    if (password.length < 8) {
      setStatus({
        kind: 'error',
        title: 'Password terlalu pendek',
        text: 'Gunakan minimal 8 karakter agar akses studio tetap aman.',
      });
      return;
    }

    setStatus({
      kind: 'success',
      title: 'UI login siap',
      text: 'Validasi front-end berjalan. Integrasi backend/auth bisa masuk di phase berikutnya.',
    });
  };

  return (
    <section
      className="grid min-h-[62vh] content-center gap-10 py-4 lg:grid-cols-[minmax(0,0.94fr)_minmax(340px,420px)] lg:items-center lg:gap-12"
      aria-labelledby="login-title"
    >
      <div className="grid gap-8">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-studio-accent ring-1 ring-[var(--ui-ring)]">
          <Sparkles size={14} strokeWidth={2.35} aria-hidden="true" />
          Studio Access
        </div>

        <div className="grid gap-5">
          <h1
            className="m-0 max-w-[820px] text-[clamp(3rem,7vw,6.3rem)] font-semibold leading-[0.94] tracking-[-0.075em] text-[var(--ui-text-strong)]"
            id="login-title"
          >
            Login that feels calm before the session starts.
          </h1>

          <p className="m-0 max-w-[640px] text-[clamp(1rem,1.45vw,1.18rem)] leading-8 text-[var(--ui-text-main)]">
            Halaman masuk dibuat premium, lapang, dan tetap stabil saat theme diganti. Struktur layout tidak bercabang antara dark dan light mode.
          </p>
        </div>

        <div className="grid gap-0 border-y border-[var(--ui-border-strong)] sm:grid-cols-3">
          {accessHighlights.map((item) => {
            const HighlightIcon = item.icon;

            return (
              <article
                className="grid gap-3 border-[var(--ui-border)] py-5 sm:px-5 sm:[&:not(:first-child)]:border-l"
                key={item.title}
              >
                <HighlightIcon
                  className="text-studio-accent"
                  size={20}
                  strokeWidth={2.25}
                  aria-hidden="true"
                />

                <div className="grid gap-1.5">
                  <h2 className="m-0 text-base font-semibold tracking-[-0.035em] text-[var(--ui-text-strong)]">
                    {item.title}
                  </h2>

                  <p className="m-0 text-sm leading-6 text-[var(--ui-text-muted)]">
                    {item.text}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <aside className="relative overflow-hidden rounded-[2rem] border border-[var(--ui-border)] bg-[var(--ui-glass)] p-5 shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] backdrop-blur-2xl sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 size-52 rounded-full bg-studio-accent/16 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full bg-studio-cyan/14 blur-3xl" aria-hidden="true" />

        <form className="relative z-10 grid gap-6" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-3">
            <div className="grid size-12 place-items-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-control)] text-[var(--ui-text-strong)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]">
              <LockKeyhole size={20} strokeWidth={2.35} aria-hidden="true" />
            </div>

            <div className="grid gap-2">
              <h2 className="m-0 text-2xl font-semibold tracking-[-0.055em] text-[var(--ui-text-strong)]">
                Masuk ke Studio Panel
              </h2>

              <p className="m-0 leading-7 text-[var(--ui-text-main)]">
                Gunakan akun internal 37 Music Studio untuk membuka dashboard operasional.
              </p>
            </div>
          </div>

          <div
            className={getStatusClassName(status.kind)}
            role="status"
            aria-live="polite"
          >
            <AlertCircle
              className="mt-0.5 shrink-0 text-studio-accent"
              size={18}
              strokeWidth={2.25}
              aria-hidden="true"
            />

            <span className="grid gap-1">
              <strong className="text-sm font-semibold text-[var(--ui-text-strong)]">
                {status.title}
              </strong>
              <span className="text-sm leading-6 text-[var(--ui-text-main)]">
                {status.text}
              </span>
            </span>
          </div>

          <div className="grid gap-4">
            <LoginInput
              autoComplete="email"
              helper="Required"
              icon={Mail}
              id="studio-email"
              label="Email"
              onChange={updateField('email')}
              placeholder="operator@37musicstudio.com"
              type="email"
              value={form.email}
            />

            <LoginInput
              autoComplete="current-password"
              helper="Min. 8 karakter"
              icon={UserRound}
              id="studio-password"
              label="Password"
              onChange={updateField('password')}
              placeholder="Masukkan password"
              type="password"
              value={form.password}
            />
          </div>

          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full [background:var(--ui-primary-bg)] px-6 text-sm font-semibold tracking-[-0.01em] text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25"
            type="submit"
          >
            Masuk sekarang
            <ArrowRight size={17} strokeWidth={2.35} aria-hidden="true" />
          </button>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ui-border)] pt-5 text-sm text-[var(--ui-text-muted)]">
            <span>Belum tersambung ke backend auth.</span>
            <a
              className="font-semibold text-[var(--ui-text-strong)] transition hover:text-studio-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
              href="/"
            >
              Kembali ke home
            </a>
          </div>
        </form>
      </aside>
    </section>
  );
}
