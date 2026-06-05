import { Suspense, lazy, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Loader2, LockKeyhole, LogOut, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { ROUTE_PERMISSIONS, hasPermission } from '../lib/permissions';
import Sidebar from './Sidebar';
import NotificationToast from './NotificationToast';
import '../styles/fluent2-assets.css';
import '../styles/mobile-overhaul.css';
import '../styles/flat-minimal-system.css';
import '../styles/showcase-pages.css';
import '../pages/AuthPage.css';
import '../styles/modern-minimal-admin.css';

const CalendarPage = lazy(() => import('../pages/CalendarPage'));
const CustomersPage = lazy(() => import('../pages/CustomersPage'));
const InventoryPage = lazy(() => import('../pages/InventoryPage'));
const BillingPage = lazy(() => import('../pages/BillingPage'));
const FinancePage = lazy(() => import('../pages/FinancePage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const StaffPage = lazy(() => import('../pages/StaffPage'));
const MaintenancePage = lazy(() => import('../pages/MaintenancePage'));
const GalleryPage = lazy(() => import('../pages/GalleryPage'));

const STAFF_ROLES = new Set(['admin', 'staff']);

const FullPageLoader = () => (
  <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
    <Loader2 className="spinner" size={32} color="var(--accent-pink)" />
  </div>
);

const AccessDenied = () => {
  const { logout, loading } = useAuthStore();

  return (
    <div className="auth-container auth-centered">
      <div className="auth-bg-blob blob1" />
      <div className="auth-bg-blob blob2" />
      <div className="auth-form-panel">
        <div className="auth-card security-card">
          <div className="auth-header">
            <div className="auth-header-top">
              <div className="auth-header-logo">
                <ShieldAlert size={24} color="var(--accent-pink)" />
              </div>
              <div>
                <span className="auth-header-studio">37 Studio</span>
              </div>
            </div>
            <h1>Akses ditolak</h1>
            <p>Akun ini belum memiliki role admin atau staff. Hubungi admin utama untuk mengaktifkan akses dashboard.</p>
          </div>
          <button type="button" className="auth-guest-btn" onClick={logout} disabled={loading}>
            {loading ? <Loader2 className="spinner" size={16} /> : <LogOut size={16} />}
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const RequiredPasswordChange = () => {
  const { completeRequiredPasswordChange, logout, loading, error, clearError } = useAuthStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearError();
    setLocalError('');

    if (newPassword.length < 8) {
      setLocalError('Password baru minimal 8 karakter.');
      return;
    }

    if (newPassword === '123456' || newPassword.toLowerCase().includes('admin')) {
      setLocalError('Gunakan password baru yang tidak sama dengan password default.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError('Konfirmasi password tidak cocok.');
      return;
    }

    try {
      await completeRequiredPasswordChange(newPassword);
    } catch {
      return;
    }
  };

  return (
    <div className="auth-container auth-centered">
      <div className="auth-bg-blob blob1" />
      <div className="auth-bg-blob blob2" />
      <div className="auth-form-panel">
        <div className="auth-card security-card">
          <div className="auth-header">
            <div className="auth-header-top">
              <div className="auth-header-logo">
                <LockKeyhole size={24} color="var(--accent-pink)" />
              </div>
              <div>
                <span className="auth-header-studio">37 Studio</span>
              </div>
            </div>
            <h1>Ganti password default</h1>
            <p>Password default hanya untuk setup awal. Buat password baru sebelum masuk ke dashboard.</p>
          </div>

          {(localError || error) && (
            <div className="auth-error">
              <ShieldAlert size={16} />
              <span>{localError || error}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Password Baru</label>
              <input
                type="password"
                className="form-input no-icon"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength="8"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="form-group">
              <label>Konfirmasi Password</label>
              <input
                type="password"
                className="form-input no-icon"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength="8"
                autoComplete="new-password"
                required
              />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <Loader2 className="spinner" size={18} /> : <LockKeyhole size={17} />}
              <span>{loading ? 'Menyimpan...' : 'Simpan Password Baru'}</span>
            </button>
          </form>

          <button type="button" className="auth-guest-btn security-secondary-action" onClick={logout} disabled={loading}>
            <LogOut size={16} />
            <span>Keluar dulu</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const AnimatedRoutes = () => {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

const AdminShell = () => {
  const { user, userProfile, isAuthLoaded } = useAuthStore();
  const location = useLocation();

  if (!isAuthLoaded) {
    return <FullPageLoader />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.isAnonymous) {
    return <Navigate to="/jadwal-publik" replace />;
  }

  if (!STAFF_ROLES.has(userProfile?.role)) {
    return <AccessDenied />;
  }

  const requiredPerm = ROUTE_PERMISSIONS[location.pathname];
  const hasPerm = hasPermission(userProfile, requiredPerm);

  if (!hasPerm) {
    return <AccessDenied />;
  }

  if (userProfile?.requiresPasswordChange) {
    return <RequiredPasswordChange />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <NotificationToast />
      <main className="main-content">
        <AnimatedRoutes />
      </main>
    </div>
  );
};

export default AdminShell;
