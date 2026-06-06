import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { getPortalPathForProfile, isAdminRole } from '../lib/roles';
import './ClientPortal.css';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { user, userProfile, isAuthLoaded, login, loginWithGoogle, loading, error, clearError } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!isAuthLoaded || !user || user.isAnonymous) return;
    navigate(getPortalPathForProfile(userProfile, '/admin/dashboard'), { replace: true });
  }, [isAuthLoaded, navigate, user, userProfile]);

  if (isAuthLoaded && user && !user.isAnonymous && isAdminRole(userProfile?.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

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
    <main className="client-portal-page admin-entry-page">
      <div className="client-ambient-bg" aria-hidden="true">
        <span className="client-blob client-blob-pink" />
        <span className="client-blob client-blob-cyan" />
      </div>

      <section className="admin-entry-shell">
        <Link to="/client" className="client-brand admin-entry-brand">
          <span className="client-brand-mark">37</span>
          <span>37 Music Studio</span>
        </Link>

        <div className="client-login-panel admin-login-panel">
          <div className="client-login-header">
            <div className="client-login-icon">
              <ShieldCheck size={20} />
            </div>
            <div>
              <span>Akses Operasional</span>
              <h2>Studio Dashboard</h2>
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
            <span>Masuk dengan Google</span>
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
                  placeholder="admin"
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
            <span>Portal client?</span>
            <Link to="/client">Buka Client Portal</Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AdminLoginPage;
