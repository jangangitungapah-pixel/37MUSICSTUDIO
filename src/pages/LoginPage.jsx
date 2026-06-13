import {
  useEffect,
  useState,
} from 'react';
import { useNavigate } from 'react-router';
import {
  AlertCircle,
  ArrowRight,
  Headphones,
  LockKeyhole,
  Mail,
  Radio,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { adminAuthRepository } from '../services/adminAuthRepository.js';

const accessHighlights = [
  {
    icon: Headphones,
    title: 'Firebase Auth',
    text: 'Admin login sekarang memakai akun email dan password dari Firebase Authentication.',
  },
  {
    icon: Radio,
    title: 'Admin portal',
    text: 'Booking dan customer admin tetap memakai shell yang sama, tapi aksesnya mulai diamankan.',
  },
  {
    icon: ShieldCheck,
    title: 'Rules ready',
    text: 'Setelah login auth aman, Firestore rules bisa dikunci ke request.auth.',
  },
];

const statusStyles = {
  idle: 'border-[var(--ui-border)] bg-[var(--ui-glass-soft)] text-[var(--ui-text-main)]',
  error: 'border-studio-accent/35 bg-studio-accent/10 text-[var(--ui-text-main)]',
  success: 'border-studio-cyan/35 bg-studio-cyan/10 text-[var(--ui-text-main)]',
};

const initialStatus = {
  kind: 'idle',
  title: 'Akses admin Firebase siap',
  text: 'Gunakan email dan kata sandi akun yang sudah dibuat di Firebase Authentication.',
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
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    const unsubscribe = adminAuthRepository.subscribeAdminAuth((authState) => {
      if (authState.isReady && authState.isAuthenticated) {
        navigate('/admin/bookings', { replace: true });
      }
    });

    return unsubscribe;
  }, [navigate]);

  const updateField = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));

    if (status.kind !== 'idle') {
      setStatus(initialStatus);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      setStatus({
        kind: 'error',
        title: 'Lengkapi akses admin',
        text: 'Isi email dan kata sandi akun Firebase dulu sebelum masuk.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await adminAuthRepository.signInAdmin({
        email,
        password,
      });

      setStatus({
        kind: 'success',
        title: 'Akses admin siap',
        text: 'Login Firebase berhasil. Kamu akan diarahkan ke admin booking.',
      });

      navigate('/admin/bookings', { replace: true });
    } catch (error) {
      setStatus({
        kind: 'error',
        title: 'Login admin gagal',
        text: adminAuthRepository.getAdminAuthErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      className="login-overhaul grid min-h-[calc(100dvh-12rem)] content-center gap-6 py-2 lg:grid-cols-[minmax(0,0.92fr)_minmax(340px,400px)] lg:items-center lg:gap-8"
      aria-labelledby="login-title"
    >
      <div className="grid gap-5">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-studio-accent ring-1 ring-[var(--ui-ring)]">
          <Sparkles size={14} strokeWidth={2.35} aria-hidden="true" />
          Firebase Admin Access
        </div>

        <div className="grid gap-4">
          <h1
            className="m-0 max-w-[760px] text-[clamp(2.45rem,5.2vw,4.9rem)] font-semibold leading-[0.96] tracking-[-0.045em] text-[var(--ui-text-strong)]"
            id="login-title"
          >
            Masuk untuk lanjut ke admin studio.
          </h1>

          <p className="m-0 max-w-[620px] text-[clamp(0.95rem,1.2vw,1.06rem)] font-medium leading-7 text-[var(--ui-text-main)]">
            Gunakan akun admin yang sudah dibuat di Firebase Authentication. Setelah login, booking dan customer akan membaca data dari Firestore.
          </p>
        </div>

        <div className="login-highlight-grid grid gap-2 sm:grid-cols-3">
          {accessHighlights.map((item) => {
            const HighlightIcon = item.icon;

            return (
              <article
                className="grid gap-2 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-3 ring-1 ring-[var(--ui-ring)]"
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

      <aside className="login-card relative overflow-hidden rounded-lg border border-[var(--ui-border-strong)] bg-[linear-gradient(145deg,var(--ui-glass),var(--ui-glass-soft))] p-4 shadow-[var(--ui-shadow-soft)] ring-1 ring-[var(--ui-ring)] backdrop-blur-2xl sm:p-5">
        <form className="relative z-10 grid gap-5" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-3">
            <div className="grid size-11 place-items-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-control)] text-[var(--ui-text-strong)] shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]">
              <LockKeyhole size={20} strokeWidth={2.35} aria-hidden="true" />
            </div>

            <div className="grid gap-2">
              <h2 className="m-0 text-[1.65rem] font-semibold tracking-[-0.055em] text-[var(--ui-text-strong)]">
                Masuk ke admin
              </h2>

              <p className="m-0 leading-7 text-[var(--ui-text-main)]">
                Pakai email dan kata sandi dari Firebase Auth. Credential development lama sudah tidak dipakai.
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
              helper="Firebase Auth"
              icon={Mail}
              id="studio-email"
              label="Email admin"
              onChange={updateField('email')}
              placeholder="admin@studio37new.com"
              type="email"
              value={form.email}
            />

            <LoginInput
              autoComplete="current-password"
              helper="Password"
              icon={LockKeyhole}
              id="studio-password"
              label="Password"
              onChange={updateField('password')}
              placeholder="••••••••"
              type="password"
              value={form.password}
            />
          </div>

          <button
            aria-busy={isSubmitting}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full [background:var(--ui-primary-bg)] px-6 text-sm font-semibold tracking-[-0.01em] text-[var(--ui-primary-text)] shadow-[var(--ui-shadow-soft)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-studio-accent/25 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Memproses login...' : 'Masuk ke admin'}
            <ArrowRight size={17} strokeWidth={2.35} aria-hidden="true" />
          </button>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ui-border)] pt-5 text-sm text-[var(--ui-text-muted)]">
            <span>Firebase Authentication</span>
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
