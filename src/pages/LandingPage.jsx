import {
  useEffect,
  useState } from 'react';
import { TextField } from '@radix-ui/themes';
import { Link,
  useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  Disc3,
  Eye,
  EyeOff,
  Gauge,
  Lock,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Mic2,
  Moon,
  Music2,
  Phone,
  PlayCircle,
  Sparkles,
  Sun,
  Users2,
  Volume2,
  X,
  Loader2
} from 'lucide-react';
import { usePublicStudioSettings } from '../hooks/usePublicStudioSettings';
import { useThemeStore } from '../store/useThemeStore';
import { getPortalPathForProfile } from '../lib/roles';
import '@radix-ui/themes/styles.css';
import './LandingPage.css';

const FALLBACK_HERO_PHOTO = {
  url: '/studio-hero.webp',
  caption: '37 Music Studio — private rehearsal & recording room',
};

const YOUTUBE_URL = 'https://youtube.com/@37musicstudio74?si=dq57yhCuJcph0pIf';

const formatCurrency = (value) => new Intl.NumberFormat('id-ID').format(value || 0);

const normalizeWhatsAppNumber = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '6281234567890';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
};

const LandingPage = () => {
  const { studioName, studioAddress, studioPhone, pricePerHour } = usePublicStudioSettings();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [isLoginOpen] = useState(false);
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const currentHeroPhoto = FALLBACK_HERO_PHOTO;
  const formattedPrice = formatCurrency(pricePerHour || 120000);
  const whatsappNumber = normalizeWhatsAppNumber(studioPhone);
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 42);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setLoginError('');
    setIdentifier('');
    setPassword('');
  }, [isLoginOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen && !isLoginOpen && !lightboxPhoto) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setLightboxPhoto(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen, isLoginOpen, lightboxPhoto]);

  useEffect(() => {
    let unsubscribe = null;
    let isCancelled = false;
    const authCheckDelay = window.matchMedia?.('(max-width: 767px)').matches ? 5000 : 1200;

    const timer = window.setTimeout(async () => {
      try {
        const { useAuthStore } = await import('../store/useAuthStore');
        if (isCancelled) return;

        const redirectIfLoggedIn = (state) => {
          if (state.isAuthLoaded && state.user && !state.user.isAnonymous) {
            navigate(getPortalPathForProfile(state.userProfile, '/client/dashboard'), { replace: true });
          }
        };

        redirectIfLoggedIn(useAuthStore.getState());
        unsubscribe = useAuthStore.subscribe(redirectIfLoggedIn);
      } catch {
        // Staff auth is not needed for the public landing first paint.
      }
    }, authCheckDelay);

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
      if (unsubscribe) unsubscribe();
    };
  }, [navigate]);


  const handleGoogleLogin = async () => {
    setLoginLoading(true);
    setLoginError('');

    try {
      const { useAuthStore } = await import('../store/useAuthStore');

      const profile = await useAuthStore.getState().loginWithGoogle();
      navigate(getPortalPathForProfile(profile, '/client/dashboard'), { replace: true });
    } catch (error) {
      try {
        const { useAuthStore } = await import('../store/useAuthStore');
        const storeError = useAuthStore.getState?.().error;
        setLoginError(storeError || error?.message || 'Login Google gagal.');
      } catch {
        setLoginError(error?.message || 'Login Google gagal.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    let authStore;
    try {
      ({ useAuthStore: authStore } = await import('../store/useAuthStore'));
      await authStore.getState().login(identifier, password);
    } catch (error) {
      const storeError = authStore?.getState?.().error;
      setLoginError(storeError || error?.message || 'Login gagal. Cek lagi email/username dan password kamu.');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="landing-container tw-landing-phase80b min-h-screen w-full overflow-x-hidden bg-[#07070b] text-[#fffaf0] antialiased selection:bg-amber-300/30 selection:text-white">
      <nav className={`landing-nav tw-landing-nav fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#0b0d11]/85 px-3 shadow-2xl shadow-black/25 backdrop-blur-2xl transition-all duration-300 ${scrolled ? 'scrolled' : ''}`}>
        <Link to="/client" className="nav-brand group inline-flex items-center gap-2 rounded-2xl outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-amber-300/60" aria-label={`${studioName || '37 Music Studio'} home`}>
          <span className="nav-brand-mark group inline-flex items-center gap-2 rounded-2xl outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-amber-300/60 grid place-items-center border border-amber-300/30 bg-white/5 shadow-lg shadow-black/20 group-hover:border-amber-200/50" aria-hidden="true">
            <span className="nav-brand-monogram group inline-flex items-center gap-2 rounded-2xl outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-amber-300/60">37</span>
          </span>
          <span className="brand-text truncate text-xs font-black uppercase tracking-tight text-stone-50/95">{studioName || '37 MUSIC STUDIO'}</span>
        </Link>

        <div className="nav-links hide-on-mobile hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.035] p-1 md:flex" role="navigation" aria-label="Navigasi utama">
          <a href="#experience">Fasilitas</a>
          <a href="#gallery">Galeri</a>
          <a href="#pricing">Harga</a>
          <a href="#location">Lokasi</a>
        </div>

        <div className="nav-actions flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="nav-theme-btn grid place-items-center rounded-2xl border border-white/10 bg-white/5 text-stone-100/75 transition hover:-translate-y-0.5 hover:border-amber-300/35 hover:bg-white/10 hover:text-white"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
            aria-label={theme === 'dark' ? 'Aktifkan Light Mode' : 'Aktifkan Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>


          <Link to="/jadwal-publik" className="nav-book-btn hidden rounded-2xl bg-amber-300 px-4 font-black text-neutral-950 shadow-lg shadow-amber-500/15 transition hover:-translate-y-0.5 hover:bg-amber-200 sm:inline-flex" aria-label="Cek slot booking studio">
            <Calendar size={16} />
            <span>Booking</span>
          </Link>

          <button
            type="button"
            className={`nav-hamburger ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={() => {
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            aria-label={isMobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="landing-mobile-menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <>
          <button
            type="button"
            className="mobile-nav-backdrop fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            aria-label="Tutup menu navigasi"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div id="landing-mobile-menu" className="mobile-nav-menu fixed left-3 right-3 top-20 z-50 grid gap-2 rounded-3xl border border-white/10 bg-[#0d1017]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-2xl" role="navigation" aria-label="Menu navigasi mobile">
            <a href="#experience" onClick={() => setIsMobileMenuOpen(false)}>Fasilitas</a>
            <a href="#gallery" onClick={() => setIsMobileMenuOpen(false)}>Galeri</a>
            <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>Harga</a>
            <a href="#location" onClick={() => setIsMobileMenuOpen(false)}>Lokasi</a>
            <Link to="/jadwal-publik" className="mobile-menu-booking" onClick={() => setIsMobileMenuOpen(false)}>
              <Calendar size={17} />
              Cek Slot Studio
            </Link>
          </div>
        </>
      )}

      {isLoginOpen && (
        <div className="nav-login-dropdown" role="dialog" aria-modal="true" aria-label="Masuk ke akun studio">
          <div className="login-dropdown-header">
            <div className="login-dropdown-icon-wrap">
              <img src="/logo.svg" alt="" />
            </div>
            <div>
              <p className="login-dropdown-brand">{studioName || '37 MUSIC STUDIO'}</p>
              <h4 className="login-dropdown-title">Masuk ke Akun Studio</h4>
            </div>
          </div>

          <div className="login-dropdown-divider" />

          <button
            type="button"
            className="login-google-btn"
            onClick={handleGoogleLogin}
            disabled={loginLoading}
          >
            {loginLoading ? (
              <Loader2 className="spinner" size={16} />
            ) : (
              <span className="login-google-mark" aria-hidden="true">G</span>
            )}
            <span>Masuk / daftar dengan Google</span>
          </button>

          <div className="login-dropdown-or">
            <span>atau masuk dengan email</span>
          </div>

          <form onSubmit={handleLoginSubmit} className="login-dropdown-form">
            {loginError && (
              <div id="login-error" role="alert" className="login-dropdown-error">
                <AlertCircle size={14} />
                <span>{loginError}</span>
              </div>
            )}

            <div className="login-field">
              <label className="login-field-label" htmlFor="staff-identifier">Email / Username</label>
              <div className="login-field-wrap">
                <Mail size={16} className="login-field-icon" />
                <input
                  id="staff-identifier"
                  type="text"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className="login-field-input"
                  placeholder="email atau username"
                  autoComplete="username"
                  autoFocus
                  required
                  aria-describedby={loginError ? 'login-error' : undefined}
                />
              </div>
            </div>

            <div className="login-field">
              <label className="login-field-label" htmlFor="staff-password">Password</label>
              <div className="login-field-wrap">
                <Lock size={16} className="login-field-icon" />
                <input
                  id="staff-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="login-field-input"
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-field-toggle"
                  onClick={() => setShowPass((value) => !value)}
                  aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-dropdown-submit" disabled={loginLoading}>
              {loginLoading ? (
                <>
                  <Loader2 className="spinner" size={16} />
                  <span>Mengecek akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      <section className="hero-section relative isolate min-h-[100svh] overflow-hidden pt-[calc(74px+env(safe-area-inset-top,0px))]" aria-label="37 Music Studio landing hero">
        <div className="hero-background absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <img src={currentHeroPhoto.url} alt="" loading="eager" decoding="async" fetchPriority="high" />
          <div className="hero-scrim" />
        </div>

        <div className="hero-shell mx-auto grid min-h-[calc(100svh-74px)] w-full max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.62fr)] lg:px-8">
          <div className="hero-copy max-w-3xl space-y-6">
            <div className="hero-kicker inline-flex w-fit items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-200">
              <Sparkles size={16} />
              <span>Rehearsal & recording room di Tangerang</span>
            </div>

            <h1 className="hero-title max-w-4xl text-balance text-5xl font-black leading-[0.9] tracking-[-0.08em] text-white sm:text-6xl lg:text-7xl">Studio private untuk latihan dan recording yang lebih rapi.</h1>

            <p className="hero-subtitle max-w-2xl text-pretty text-base font-semibold leading-8 text-stone-100/75 sm:text-lg">
              Booking jadwal, latihan, recording, dan konten musik dalam satu ruang private. Gear siap, operator bantu setup, kamu tinggal datang dan main.
            </p>

            <div className="hero-actions flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/jadwal-publik" className="btn-primary btn-large inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-300 px-5 py-3 font-black text-neutral-950 shadow-xl shadow-amber-500/20 transition hover:-translate-y-0.5 hover:bg-amber-200">
                <Calendar size={20} />
                <span>Cek Slot Booking</span>
              </Link>
              <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-large inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-black text-white/85 shadow-xl shadow-black/10 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:text-white">
                <PlayCircle size={20} />
                <span>Lihat Video</span>
              </a>
            </div>
          </div>

                    <div className="hero-login-panel rounded-[2rem] border border-white/10 bg-white/[0.07] p-4 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-5" aria-label="Masuk atau daftar akun client">
            <div className="hero-login-top mb-4 flex items-start gap-3">
              <div className="hero-login-badge">
                <Lock size={16} />
              </div>
              <div>
                <span>Client Portal</span>
                <strong>Booking lebih cepat pakai akun studio.</strong>
              </div>
            </div>

            <button
              type="button"
              className="hero-google-login inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/95 px-4 py-3 font-black text-neutral-950 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleGoogleLogin}
              disabled={loginLoading}
            >
              {loginLoading ? (
                <Loader2 className="spinner" size={16} />
              ) : (
                <span className="login-google-mark" aria-hidden="true">G</span>
              )}
              <span>Masuk / daftar dengan Google</span>
            </button>

            <div className="hero-login-divider">
              <span>atau masuk dengan email</span>
            </div>

            <form onSubmit={handleLoginSubmit} className="hero-login-form grid gap-3">
              {loginError && (
                <div id="hero-login-error" role="alert" className="hero-login-error">
                  <AlertCircle size={14} />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="hero-login-field">
                <label htmlFor="hero-client-identifier">Email / Username</label>
                                <TextField.Root
                  data-radix-field="hero-client-identifier"
                  id="hero-client-identifier"
                  className="hero-radix-field hero-radix-identifier"
                  type="text"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="email atau username"
                  autoComplete="username"
                  required
                  aria-describedby={loginError ? 'hero-login-error' : undefined}
                >
                  <TextField.Slot>
                    <Mail size={15} />
                  </TextField.Slot>
                </TextField.Root>
              </div>

              <div className="hero-login-field">
                <label htmlFor="hero-client-password">Password</label>
                                <TextField.Root
                  data-radix-field="hero-client-password"
                  id="hero-client-password"
                  className="hero-radix-field hero-radix-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="password akun"
                  autoComplete="current-password"
                  required
                >
                  <TextField.Slot>
                    <Lock size={15} />
                  </TextField.Slot>

                  <TextField.Slot side="right">
                    <button
                      type="button"
                      className="hero-radix-eye"
                      onClick={() => setShowPass((value) => !value)}
                      aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </TextField.Slot>
                </TextField.Root>
              </div>

              <button type="submit" className="hero-login-submit inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-300 px-4 py-3 font-black text-neutral-950 shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60" disabled={loginLoading}>
                {loginLoading ? (
                  <>
                    <Loader2 className="spinner" size={16} />
                    <span>Mengecek akun...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Portal</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="hero-login-foot">
              <span>Belum punya akun? Pakai Google untuk daftar cepat.</span>
              <Link to="/jadwal-publik">Cek slot tanpa login</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="experience" className="experience-section mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="section-header mx-auto mb-10 max-w-3xl text-center">
          <span className="section-eyebrow mb-3 inline-flex w-fit rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-amber-200">Kenapa 37</span>
          <h2>Sesi musik lebih rapi, tanpa ribet teknis.</h2>
          <p>
            Kami siapkan ruang, alat, dan bantuan teknis supaya kamu bisa fokus latihan, rekaman, atau bikin konten.
          </p>
        </div>

        <div className="experience-grid grid gap-4 md:grid-cols-3">
          <div className="experience-card rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl shadow-black/10 backdrop-blur-xl transition hover:-translate-y-1 hover:border-amber-300/25 hover:bg-white/[0.07]">
            <div className="experience-icon">
              <Music2 size={26} />
            </div>
            <span className="experience-label">Rehearsal</span>
            <h3>Latihan band lebih fokus</h3>
            <p>Drum, ampli gitar, ampli bass, AC, dan ruang soundproof siap dipakai sejak awal sesi.</p>
          </div>

          <div className="experience-card featured rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl shadow-black/10 backdrop-blur-xl transition hover:-translate-y-1 hover:border-amber-300/25 hover:bg-white/[0.07]">
            <div className="experience-icon">
              <Mic2 size={26} />
            </div>
            <span className="experience-label">Recording</span>
            <h3>Rekam vokal, demo, dan konten</h3>
            <p>Mic, interface, monitoring, dan operator siap bantu tracking agar materi cepat jadi.</p>
          </div>

          <div className="experience-card rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl shadow-black/10 backdrop-blur-xl transition hover:-translate-y-1 hover:border-amber-300/25 hover:bg-white/[0.07]">
            <div className="experience-icon">
              <Gauge size={26} />
            </div>
            <span className="experience-label">Session assist</span>
            <h3>Setup dibantu dari awal</h3>
            <p>Butuh sound check, routing, atau tuning basic? Tim studio bantu supaya sesi tetap lancar.</p>
          </div>
        </div>
      </section>

      <section className="booking-flow-section mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flow-panel grid gap-6 rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl md:grid-cols-[0.8fr_1.2fr] md:p-7">
          <div className="flow-copy">
            <span className="section-eyebrow mb-3 inline-flex w-fit rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-amber-200">Booking cepat</span>
            <h2>Cek jadwal, pilih slot, langsung kirim request.</h2>
            <p>Dirancang untuk dibuka dari HP. Kamu bisa lihat slot kosong, isi kebutuhan sesi, lalu lanjut konfirmasi via WhatsApp.</p>
          </div>

          <div className="flow-steps grid gap-3 sm:grid-cols-3" aria-label="Alur booking">
            <div className="flow-step rounded-3xl border border-white/10 bg-black/15 p-4">
              <span>01</span>
              <strong>Lihat slot</strong>
              <p>Pilih tanggal dan jam yang tersedia.</p>
            </div>
            <div className="flow-step rounded-3xl border border-white/10 bg-black/15 p-4">
              <span>02</span>
              <strong>Isi detail</strong>
              <p>Tulis nama band/artist dan kebutuhan sesi.</p>
            </div>
            <div className="flow-step rounded-3xl border border-white/10 bg-black/15 p-4">
              <span>03</span>
              <strong>Konfirmasi</strong>
              <p>Request masuk, tim studio follow up via WhatsApp.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="gallery" className="landing-gallery-section mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="section-header align-left mx-auto mb-10 max-w-3xl text-center">
          <span className="section-eyebrow mb-3 inline-flex w-fit rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-amber-200">Lihat ruang</span>
          <h2>Cek dulu ruangnya sebelum datang.</h2>
          <p>Preview singkat biar kamu tahu suasana studio. Untuk foto lengkap, buka halaman galeri.</p>
        </div>

        <div className="landing-gallery-grid">
          <button
            type="button"
            className="landing-gallery-card gallery-card-1"
            onClick={() => setLightboxPhoto(FALLBACK_HERO_PHOTO)}
          >
            <div className="landing-gallery-media">
              <img src={FALLBACK_HERO_PHOTO.url} alt={FALLBACK_HERO_PHOTO.caption} loading="lazy" />
              <div className="landing-gallery-overlay">
                <Camera size={18} />
                <span>{FALLBACK_HERO_PHOTO.caption}</span>
              </div>
            </div>
          </button>
        </div>

        <div className="gallery-actions">
          <Link to="/galeri" className="btn-secondary btn-large inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-black text-white/85 shadow-xl shadow-black/10 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:text-white">
            <span>Lihat Galeri Studio</span>
            <ArrowUpRight size={18} />
          </Link>
        </div>

        {lightboxPhoto && (
          <div className="gallery-lightbox-overlay" onClick={() => setLightboxPhoto(null)}>
            <button
              type="button"
              className="lightbox-close"
              onClick={() => setLightboxPhoto(null)}
              aria-label="Tutup penampil gambar"
            >
              <X size={24} />
            </button>
            <div className="lightbox-content" onClick={(event) => event.stopPropagation()}>
              <img src={lightboxPhoto.url} alt={lightboxPhoto.caption || 'Foto studio'} />
              {lightboxPhoto.caption && <p>{lightboxPhoto.caption}</p>}
            </div>
          </div>
        )}
      </section>

      <section id="pricing" className="pricing-section mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="pricing-shell">
          <div className="pricing-copy">
            <span className="section-eyebrow mb-3 inline-flex w-fit rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-amber-200">Harga studio</span>
            <h2>Satu rate, fasilitas utama sudah termasuk.</h2>
            <p>
              Untuk latihan, demo recording, content session, atau sesi band yang butuh ruang private plus bantuan operator.
            </p>
            <div className="pricing-includes" role="list" aria-label="Yang termasuk dalam harga">
              <div role="listitem"><CheckCircle2 size={17} /><span>Operator standby</span></div>
              <div role="listitem"><CheckCircle2 size={17} /><span>AC & ruang soundproof</span></div>
              <div role="listitem"><CheckCircle2 size={17} /><span>Drum, ampli gitar & bass</span></div>
              <div role="listitem"><CheckCircle2 size={17} /><span>Mic, interface & monitoring</span></div>
            </div>
          </div>

          <div className="price-card">
            <div className="price-card-top">
              <span>Rate mulai dari</span>
              <Disc3 size={22} />
            </div>
            <div className="price-display">
              <span className="price-currency">Rp</span>
              <span className="price-amount">{formattedPrice}</span>
              <span className="price-unit">/ jam</span>
            </div>
            <Link to="/jadwal-publik" className="btn-primary btn-large inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-300 px-5 py-3 font-black text-neutral-950 shadow-xl shadow-amber-500/20 transition hover:-translate-y-0.5 hover:bg-amber-200">
              <Calendar size={19} />
              <span>Cek Slot Kosong</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="proof-section">
        <div className="proof-grid" aria-label="Keunggulan studio">
          <div>
            <Volume2 size={20} />
            <strong>Ruang siap pakai</strong>
            <span>Gear live dan recording sudah disiapkan sebelum sesi.</span>
          </div>
          <div>
            <Users2 size={20} />
            <strong>Cocok buat band muda</strong>
            <span>Nyaman untuk band, soloist, vocalist, dan creator.</span>
          </div>
          <div>
            <MessageCircle size={20} />
            <strong>Respons via WhatsApp</strong>
            <span>Request booking difollow up langsung oleh tim studio.</span>
          </div>
        </div>
      </section>

      <footer id="location" className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Link to="/client" className="nav-brand group inline-flex items-center gap-2 rounded-2xl outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-amber-300/60">
              <span className="nav-brand-mark group inline-flex items-center gap-2 rounded-2xl outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-amber-300/60 grid place-items-center border border-amber-300/30 bg-white/5 shadow-lg shadow-black/20 group-hover:border-amber-200/50" aria-hidden="true">
                <img src="/logo.svg" alt="" />
              </span>
              <span className="brand-text truncate text-xs font-black uppercase tracking-tight text-stone-50/95">{studioName || '37 MUSIC STUDIO'}</span>
            </Link>
            <p>Studio private di Tangerang untuk latihan band, demo recording, vokal, dan content session.</p>
            <div className="footer-social">
              <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer">
                <PlayCircle size={17} />
                YouTube
              </a>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={17} />
                WhatsApp
              </a>
            </div>
          </div>

          <div className="footer-contact">
            <h3>Kontak studio</h3>
            <p>
              <MapPin size={17} />
              <span>{studioAddress || 'Jl. Musik Indah No. 37, Kota Anda'}</span>
            </p>
            <p>
              <Phone size={17} />
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-contact-link"
                aria-label={`Hubungi via WhatsApp: ${studioPhone || '0812-3456-7890'}`}
              >
                {studioPhone || '0812-3456-7890'}
              </a>
            </p>
          </div>

          <div className="footer-map">
            <h3>Alamat studio</h3>
            <div className="map-container">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.345151531122!2d106.6089336!3d-6.218134099999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69fea3cbcf857d%3A0x58b169d1a6502414!2s37%20Music%20Studio%20TANGERANG!5e0!3m2!1sen!2sid!4v1779439398167!5m2!1sen!2sid"
                width="100%"
                height="100%"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Lokasi 37 Music Studio di Google Maps"
              />
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {studioName || '37 MUSIC STUDIO'}. Semua hak cipta dilindungi.</span>
        </div>
      </footer>

      <Link to="/jadwal-publik" className="mobile-sticky-cta" aria-label="Cek slot booking studio">
        <span>
          <Activity size={15} />
          Mulai Rp {formattedPrice}/jam
        </span>
        <strong>
          Booking
          <ChevronRight size={17} />
        </strong>
      </Link>
    </div>
  );
};

export default LandingPage;
