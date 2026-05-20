import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
  Music, AlertCircle, Loader2, Mail, Lock, Eye, EyeOff,
  CalendarDays, ArrowRight
} from 'lucide-react';
import './AuthPage.css';

const FEATURES = [
  { icon: '📅', label: 'Kelola jadwal studio secara real-time' },
  { icon: '👥', label: 'Database pelanggan & histori booking' },
  { icon: '💰', label: 'Laporan keuangan & invoice otomatis' },
  { icon: '🎸', label: 'Pantau kondisi inventaris alat musik' },
];

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const { login, loginGuest, error, loading, user, isAuthLoaded, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthLoaded && user && !user.isAnonymous) navigate('/dashboard');
  }, [user, isAuthLoaded, navigate]);

  useEffect(() => { clearError(); }, [clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await login(identifier, password); navigate('/dashboard'); } catch { return; }
  };

  const handleGuestLogin = async () => {
    try { await loginGuest(); navigate('/jadwal-publik'); } catch { return; }
  };

  if (!isAuthLoaded) {
    return (
      <div className="auth-loading">
        <Loader2 className="spinner" size={32} />
      </div>
    );
  }

  return (
    <div className="auth-container">
      {/* Animated background blobs */}
      <div className="auth-bg-blob blob1" />
      <div className="auth-bg-blob blob2" />
      <div className="auth-bg-blob blob3" />

      <div className="auth-split">
        {/* ── Left: Brand Panel ── */}
        <div className="auth-brand-panel">
          <div className="auth-brand-grid" />
          <div className="auth-brand-glow" />

          <div className="auth-brand-badge">
            <span className="auth-badge-dot" />
            Studio Management System
          </div>

          <div className="auth-brand-logo">
            <div className="auth-logo-icon">
              <Music size={34} color="#ff2a5f" />
            </div>
            <div>
              <h2 className="auth-brand-name">37 STUDIO</h2>
              <p className="auth-brand-sub">Music Studio</p>
            </div>
          </div>

          <h3 className="auth-brand-tagline">
            Kelola studio musik Anda dengan <span>sistem yang canggih</span>
          </h3>
          <p className="auth-brand-desc">
            Platform manajemen studio all-in-one — dari jadwal booking, keuangan,
            hingga inventaris alat musik, semua dalam satu dasbor.
          </p>

          <div className="auth-feature-pills">
            {FEATURES.map((f, i) => (
              <div className="auth-feature-pill" key={i}>
                <div className="auth-pill-icon">{f.icon}</div>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Form Panel ── */}
        <div className="auth-form-panel">
          <div className="auth-card">
            {/* Form Header */}
            <div className="auth-header">
              <div className="auth-header-top">
                <div className="auth-header-logo">
                  <Music size={22} color="#ff2a5f" />
                </div>
                <span className="auth-header-studio">37 MUSIC STUDIO</span>
              </div>
              <h1>Selamat Datang</h1>
              <p>Masuk ke panel admin studio Anda</p>
            </div>

            {/* Error */}
            {error && (
              <div className="auth-error">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Username atau Email</label>
                <div className="form-input-wrap">
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    className="form-input"
                    placeholder="admin"
                    autoComplete="username"
                    required
                  />
                  <Mail size={16} className="form-input-icon" />
                </div>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="form-input-wrap">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="form-input"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <Lock size={16} className="form-input-icon" />
                  <button
                    type="button"
                    className="form-input-action"
                    onClick={() => setShowPass(v => !v)}
                    tabIndex={-1}
                    title={showPass ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading
                  ? <><Loader2 className="spinner" size={18} /><span>Masuk...</span></>
                  : <><span>Masuk sebagai Admin</span><ArrowRight size={18} /></>
                }
              </button>
            </form>

            {/* Divider */}
            <div className="auth-divider">atau</div>

            {/* Guest Button */}
            <button
              type="button"
              className="auth-guest-btn"
              onClick={handleGuestLogin}
              disabled={loading}
            >
              <CalendarDays size={18} />
              <span>Lihat Jadwal Publik (Tamu)</span>
            </button>

            {/* Footer */}
            <div className="auth-footer">
              Hanya akun yang telah didaftarkan oleh perusahaan yang dapat masuk.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
