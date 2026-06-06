import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  Headphones,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  Mic2,
  Music2,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { getPortalPathForProfile } from '../lib/roles';
import { usePublicStudioSettings } from '../hooks/usePublicStudioSettings';
import './ClientPortal.css';

const formatCurrency = (value) => new Intl.NumberFormat('id-ID').format(value || 0);

const ClientLandingPage = () => {
  const navigate = useNavigate();
  const { studioName, pricePerHour, studioPhone } = usePublicStudioSettings();
  const { theme, toggleTheme } = useThemeStore();
  const { user, userProfile, isAuthLoaded, login, loginWithGoogle, loading, error, clearError } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [localError, setLocalError] = useState('');

  const formattedPrice = formatCurrency(pricePerHour || 120000);
  const whatsappDigits = String(studioPhone || '6281234567890').replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${whatsappDigits.startsWith('0') ? `62${whatsappDigits.slice(1)}` : whatsappDigits}`;

  useEffect(() => {
    if (!isAuthLoaded || !user || user.isAnonymous) return;
    navigate(getPortalPathForProfile(userProfile, '/client/dashboard'), { replace: true });
  }, [isAuthLoaded, navigate, user, userProfile]);

  const handleGoogleLogin = async () => {
    clearError?.();
    setLocalError('');

    try {
      const profile = await loginWithGoogle();
      navigate(getPortalPathForProfile(profile, '/client/dashboard'), { replace: true });
    } catch (loginError) {
      setLocalError(loginError?.message || 'Login Google gagal.');
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    clearError?.();
    setLocalError('');

    try {
      await login(identifier, password);
    } catch (loginError) {
      setLocalError(loginError?.message || 'Login gagal. Periksa email/username dan password.');
    }
  };

  return (
    <main className="client-portal-page">
      <div className="client-ambient-bg" aria-hidden="true">
        <span className="client-blob client-blob-pink" />
        <span className="client-blob client-blob-cyan" />
      </div>

      <nav className="client-nav">
        <Link to="/client" className="client-brand" aria-label="37 Music Studio Client Portal">
          <span className="client-brand-mark">37</span>
          <span>{studioName || '37 Music Studio'}</span>
        </Link>

        <div className="client-nav-actions">
          <button type="button" className="client-ghost-btn" onClick={toggleTheme}>
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="client-ghost-btn">
            <MessageCircle size={15} />
            WA
          </a>
        </div>
      </nav>

      <section className="client-hero-shell">
        <div className="client-hero-copy">
          <div className="client-kicker">
            <Sparkles size={16} />
            <span>Client Portal</span>
          </div>

          <h1>Booking, jadwal, dan aktivitas studio dalam satu tempat.</h1>
          <p>
            Masuk untuk melihat riwayat latihan, recording, jadwal mendatang, status pembayaran,
            dan kirim pesan langsung ke admin studio.
          </p>

          <div className="client-hero-actions">
            <Link to="/jadwal-publik" className="client-primary-btn">
              <Calendar size={18} />
              Cek Jadwal Publik
            </Link>
            <Link to="/galeri" className="client-secondary-btn">
              <Music2 size={18} />
              Lihat Vibe Studio
            </Link>
          </div>

          <div className="client-proof-grid">
            <div>
              <Clock3 size={18} />
              <strong>10.00–23.00</strong>
              <span>Jam operasional</span>
            </div>
            <div>
              <Headphones size={18} />
              <strong>Operator</strong>
              <span>Ready assist</span>
            </div>
            <div>
              <ShieldCheck size={18} />
              <strong>Private Room</strong>
              <span>Nyaman dan fokus</span>
            </div>
          </div>
        </div>

        <aside className="client-login-panel" aria-label="Panel masuk client portal">
          <div className="client-login-header">
            <div className="client-login-icon">
              <Lock size={20} />
            </div>
            <div>
              <span>Masuk Portal</span>
              <h2>37 Music Studio</h2>
            </div>
          </div>

          {(localError || error) && (
            <div className="client-alert" role="alert">
              <AlertCircle size={15} />
              <span>{error || localError}</span>
            </div>
          )}

          <button
            type="button"
            className="client-google-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? <Loader2 className="spinner" size={16} /> : <span className="client-google-mark">G</span>}
            <span>Masuk / Daftar dengan Google</span>
          </button>

          <div className="client-login-or"><span>atau masuk dengan email</span></div>

          <form className="client-login-form" onSubmit={handleLogin}>
            <label>
              <span>Email / Username</span>
              <div className="client-input-wrap">
                <Mail size={16} />
                <input
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="nama@email.com"
                  autoComplete="username"
                  required
                />
              </div>
            </label>

            <label>
              <span>Password</span>
              <div className="client-input-wrap">
                <Lock size={16} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowPass((value) => !value)} aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <button type="submit" className="client-submit-btn" disabled={loading}>
              {loading ? <Loader2 className="spinner" size={17} /> : <span>Masuk</span>}
              {!loading && <ChevronRight size={17} />}
            </button>
          </form>

          <div className="client-login-footer">
            <span>Belum punya akun?</span>
            <Link to="/register">
              <UserPlus size={15} />
              Daftar Akun
            </Link>
          </div>
        </aside>
      </section>

      <section className="client-rate-card">
        <div>
          <span>Mulai dari</span>
          <strong>Rp {formattedPrice}</strong>
          <small>/ jam</small>
        </div>
        <Mic2 size={24} />
      </section>
    </main>
  );
};

export default ClientLandingPage;
