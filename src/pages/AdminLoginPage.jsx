import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CalendarCheck2,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react';

import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { getPortalPathForProfile, isAdminRole } from '../lib/roles';

import './ClientPortal.css';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { user, userProfile, isAuthLoaded, login, loginWithGoogle, loading, error, clearError } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [localError, setLocalError] = useState('');

  const themeSwitchTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isAuthLoaded || !user || user.isAnonymous) return;
    navigate(getPortalPathForProfile(userProfile, '/admin/dashboard'), { replace: true });
  }, [isAuthLoaded, navigate, user, userProfile]);

  useEffect(() => {
    return () => {
      if (themeSwitchTimeoutRef.current) {
        window.clearTimeout(themeSwitchTimeoutRef.current);
      }

      document.documentElement.removeAttribute('data-theme-switching');
    };
  }, []);

  if (isAuthLoaded && user && !user.isAnonymous && isAdminRole(userProfile?.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleThemeToggle = () => {
    const rootElement = document.documentElement;
    rootElement.setAttribute('data-theme-switching', 'true');

    if (themeSwitchTimeoutRef.current) {
      window.clearTimeout(themeSwitchTimeoutRef.current);
    }

    themeSwitchTimeoutRef.current = window.setTimeout(() => {
      rootElement.removeAttribute('data-theme-switching');
      themeSwitchTimeoutRef.current = null;
    }, 180);

    toggleTheme();
  };

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
      setLocalError(loginError?.message || 'Login gagal. Periksa username/email dan password.');
    }
  };

  return (
    <main className="client-portal-page admin-entry-page admin-login-modern">
      <div className="admin-login-bg" aria-hidden="true">
        <span className="admin-login-orb admin-login-orb-gold" />
        <span className="admin-login-orb admin-login-orb-cyan" />
        <span className="admin-login-grid-bg" />
      </div>

      <section className="admin-entry-shell admin-login-shell">
        <nav className="admin-login-nav" aria-label="Navigasi admin login">
          <Link to="/client" className="admin-login-brand" aria-label="Buka halaman client 37 Music Studio">
            <span className="admin-login-brand-mark">37</span>
            <span>
              <strong>37 Music Studio</strong>
              <small>Operational access</small>
            </span>
          </Link>

          <div className="admin-login-nav-actions">
            <button
              type="button"
              className="admin-login-icon-btn"
              onClick={handleThemeToggle}
              aria-label={theme === 'dark' ? 'Aktifkan light mode' : 'Aktifkan dark mode'}
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <Link to="/client" className="admin-login-back-btn">
              <ArrowLeft size={17} />
              <span>Client Portal</span>
            </Link>
          </div>
        </nav>

        <div className="admin-login-layout">
          <div className="admin-login-copy">
            <span className="admin-login-kicker">
              <ShieldCheck size={15} />
              Studio operations
            </span>

            <h1>Masuk ke studio dashboard.</h1>

            <p>
              Kelola booking, galeri, rate, billing, dan operasional 37 Music Studio dari satu ruang kerja yang aman.
            </p>

            <div className="admin-login-proof" aria-label="Fitur admin dashboard">
              <span>
                <CalendarCheck2 size={16} />
                Booking board
              </span>
              <span>
                <Sparkles size={16} />
                Premium control
              </span>
              <span>
                <Lock size={16} />
                Secure access
              </span>
            </div>
          </div>

          <div className="client-login-panel admin-login-panel admin-login-card">
            <div className="client-login-header admin-login-card-header">
              <div className="client-login-icon admin-login-card-icon">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span>Akses Operasional</span>
                <h2>Studio Dashboard</h2>
              </div>
            </div>

            {(localError || error) && (
              <div className="client-alert admin-login-alert" role="alert">
                <AlertCircle size={15} />
                <span>{error || localError}</span>
              </div>
            )}

            <button
              type="button"
              className="client-google-btn admin-google-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              {loading ? <Loader2 className="spinner" size={16} /> : <span className="client-google-mark">G</span>}
              <span>Masuk dengan Google</span>
            </button>

            <div className="client-login-or admin-login-or"><span>atau masuk dengan email</span></div>

            <form className="client-login-form admin-login-form" onSubmit={handleLogin}>
              <label>
                <span>Email / Username</span>
                <div className="client-input-wrap admin-input-wrap">
                  <Mail size={16} />
                  <input
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="email atau username"
                    autoComplete="username"
                    required
                  />
                </div>
              </label>

              <label>
                <span>Password</span>
                <div className="client-input-wrap admin-input-wrap">
                  <Lock size={16} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="password admin"
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" onClick={() => setShowPass((value) => !value)} aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <button type="submit" className="client-submit-btn admin-submit-btn" disabled={loading}>
                {loading ? <Loader2 className="spinner" size={17} /> : <span>Masuk ke Dashboard</span>}
                {!loading && <ChevronRight size={17} />}
              </button>
            </form>

            <div className="client-login-footer admin-login-footer">
              <span>Portal client?</span>
              <Link to="/client">Buka Client Portal</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AdminLoginPage;
