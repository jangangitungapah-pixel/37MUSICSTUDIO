import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Headphones,
  LockKeyhole,
  Radio,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';

const DEV_USERNAME = 'admin';
const DEV_PASSWORD = 'admin';
const DEV_AUTH_STORAGE_KEY = 'thirty-seven-dev-auth';

const accessHighlights = [
  {
    icon: Headphones,
    title: 'Dev access ready',
    text: 'Masuk dengan akun dev untuk membuka halaman admin kosong dan mulai membangun dashboard.',
  },
  {
    icon: Radio,
    title: 'Admin canvas',
    text: 'Halaman admin dibuat kosong dulu supaya modul bisa disusun pelan-pelan tanpa merusak UI utama.',
  },
  {
    icon: ShieldCheck,
    title: 'Route sementara',
    text: 'Credential dev hanya untuk sesi build ini. Nanti bisa diganti ke auth yang sebenarnya.',
  },
];

const statusStyles = {
  idle: 'border-[var(--ui-border)] bg-[var(--ui-glass-soft)] text-[var(--ui-text-main)]',
  error: 'border-studio-accent/35 bg-studio-accent/10 text-[var(--ui-text-main)]',
  success: 'border-studio-cyan/35 bg-studio-cyan/10 text-[var(--ui-text-main)]',
};

const initialStatus = {
  kind: 'idle',
  title: 'Akses development siap',
  text: 'Gunakan username admin dan password admin untuk masuk ke halaman admin kosong.',
};

function getStatusClassName(kind) {
  return [
    'flex min-h-[74px] items-start gap-3 rounded-[1.35rem] border p-3.5 ring-1 ring-[var(--ui-ring)] transition',
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
    <label className="grid gap-2.5 text-sm font-semibold text-[var(--ui-text-main)]" htmlFor={id}>
      <span className="flex items-center justify-between gap-3 px-1">
        <span>{label}</span>
        <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--ui-text-muted)]">{helper}</span>
      </span>

      <span className="group flex min-h-[58px] items-center gap-3 rounded-[1.35rem] border border-[var(--ui-border-strong)] bg-[var(--ui-control)] px-3.5 text-[var(--ui-text-strong)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] transition focus-within:border-studio-accent/55 focus-within:bg-[var(--ui-control-hover)] focus-within:ring-4 focus-within:ring-studio-accent/20 hover:border-studio-accent/35 hover:bg-[var(--ui-control-hover)]">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] text-[var(--ui-text-soft)] transition group-focus-within:border-studio-accent/35 group-focus-within:text-studio-accent group-hover:text-studio-accent">
          <Icon
            size={17}
            strokeWidth={2.25}
            aria-hidden="true"
          />
        </span>

        <input
          autoComplete={autoComplete}
          className="studio-login-input min-h-11 w-full rounded-xl border-0 bg-transparent px-1 text-sm font-semibold text-[var(--ui-text-strong)] caret-studio-accent outline-none placeholder:text-[var(--ui-text-soft)] selection:bg-studio-accent/20"
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
    username: '',
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

    const username = form.username.trim();
    const password = form.password.trim();

    if (!username || !password) {
      setStatus({
        kind: 'error',
        title: 'Lengkapi akses development',
        text: 'Isi username dan password dev dulu sebelum masuk ke admin.',
      });
      return;
    }
    if (username !== DEV_USERNAME || password !== DEV_PASSWORD) {
      setStatus({
        kind: 'error',
        title: 'Username atau password belum cocok',
        text: 'Untuk sesi developing ini, gunakan username admin dan password admin.',
      });
      return;
    }
    setStatus({
      kind: 'success',
      title: 'Akses admin siap',
      text: 'Login development berhasil. Kamu akan diarahkan ke halaman admin kosong.',
    });

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(DEV_AUTH_STORAGE_KEY, 'true');
      window.history.pushState({}, '', '/admin');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <section
      className="grid min-h-[62vh] content-center gap-10 py-4 lg:grid-cols-[minmax(0,0.94fr)_minmax(340px,420px)] lg:items-center lg:gap-12"
      aria-labelledby="login-title"
    >
      <div className="grid gap-8">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-studio-accent ring-1 ring-[var(--ui-ring)]">
          <Sparkles size={14} strokeWidth={2.35} aria-hidden="true" />
          Akses Development
        </div>

        <div className="grid gap-5">
          <h1
            className="m-0 max-w-[820px] text-[clamp(3rem,7vw,6.3rem)] font-semibold leading-[0.94] tracking-[-0.075em] text-[var(--ui-text-strong)]"
            id="login-title"
          >
            Masuk untuk lanjut ke admin studio.
          </h1>

          <p className="m-0 max-w-[640px] text-[clamp(1rem,1.45vw,1.18rem)] leading-8 text-[var(--ui-text-main)]">
            Untuk sesi developing, gunakan username admin dan password admin. Setelah masuk, kamu akan diarahkan ke halaman admin kosong dulu.
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

      <aside className="relative overflow-hidden rounded-[2.25rem] border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] p-5 shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] backdrop-blur-2xl sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 size-52 rounded-full bg-studio-accent/16 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full bg-studio-cyan/14 blur-3xl" aria-hidden="true" />

        <form className="relative z-10 grid gap-5" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-3">
            <div className="grid size-11 place-items-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-control)] text-[var(--ui-text-strong)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]">
              <LockKeyhole size={20} strokeWidth={2.35} aria-hidden="true" />
            </div>

            <div className="grid gap-2">
              <h2 className="m-0 text-[1.65rem] font-semibold tracking-[-0.055em] text-[var(--ui-text-strong)]">
                Masuk ke admin dev
              </h2>

              <p className="m-0 leading-7 text-[var(--ui-text-main)]">
                Gunakan akses sementara untuk membuka canvas admin. Credential dev: admin / admin.
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
              autoComplete="username"
              helper="Dev access"
              icon={UserRound}
              id="studio-username"
              label="Username"
              onChange={updateField('username')}
              placeholder="admin"
              type="text"
              value={form.username}
            />

            <LoginInput
              autoComplete="current-password"
              helper="Dev password"
              icon={LockKeyhole}
              id="studio-password"
              label="Password"
              onChange={updateField('password')}
              placeholder="admin"
              type="password"
              value={form.password}
            />
          </div>

          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full [background:var(--ui-primary-bg)] px-6 text-sm font-semibold tracking-[-0.01em] text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25"
            type="submit"
          >
            Masuk ke admin
            <ArrowRight size={17} strokeWidth={2.35} aria-hidden="true" />
          </button>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ui-border)] pt-5 text-sm text-[var(--ui-text-muted)]">
            <span>Dev credential: admin / admin</span>
            <a
              className="font-semibold text-[var(--ui-text-strong)] transition hover:text-studio-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/20"
              href="/"
            >
              Kembali ke landing
            </a>
          </div>
        </form>
      </aside>
    </section>
  );
}
