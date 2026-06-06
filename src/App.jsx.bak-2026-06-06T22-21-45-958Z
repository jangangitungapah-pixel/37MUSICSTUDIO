import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useThemeStore } from './store/useThemeStore';
import LandingPage from './pages/LandingPage';
import FirebaseConfigNotice from './components/FirebaseConfigNotice';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';

const AdminShell = lazy(() => import('./components/AdminShell'));
const PublicCalendarPage = lazy(() => import('./pages/PublicCalendarPage'));
const PublicGalleryPage = lazy(() => import('./pages/PublicGalleryPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));

const FullPageLoader = () => (
  <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
    <Loader2 className="spinner" size={32} color="var(--accent-pink)" />
  </div>
);

const PageTitleUpdater = () => {
  const location = useLocation();

  useEffect(() => {
    const routeTitles = {
      '/': 'Welcome',
      '/dashboard': 'Dashboard',
      '/calendar': 'Kalender',
      '/customers': 'Pelanggan',
      '/inventory': 'Inventaris',
      '/billing': 'Billing & Kasir',
      '/finance': 'Keuangan',
      '/staff': 'Staff',
      '/maintenance': 'Maintenance Log',
      '/gallery': 'Galeri',
      '/settings': 'Pengaturan',
      '/jadwal-publik': 'Jadwal Publik',
      '/galeri': 'Galeri Publik',
    };

    const title = routeTitles[location.pathname] || 'Dashboard';
    document.title = `${title} | 37 Music Studio`;
  }, [location]);

  return null;
};

const loadAfterIdle = (callback) => {
  if (typeof window === 'undefined') return () => {};

  const isMobile = window.matchMedia?.('(max-width: 767px)').matches;
  if (isMobile) {
    const timeoutId = window.setTimeout(callback, 5000);
    return () => window.clearTimeout(timeoutId);
  }

  if ('requestIdleCallback' in window) {
    const idleId = window.requestIdleCallback(callback, { timeout: 2500 });
    return () => window.cancelIdleCallback(idleId);
  }

  const timeoutId = window.setTimeout(callback, 1800);
  return () => window.clearTimeout(timeoutId);
};

const LazyToaster = ({ theme }) => {
  const [ToasterComponent, setToasterComponent] = useState(null);

  useEffect(() => {
    let mounted = true;
    const cancel = loadAfterIdle(async () => {
      const { Toaster } = await import('sonner');
      if (mounted) setToasterComponent(() => Toaster);
    });

    return () => {
      mounted = false;
      cancel();
    };
  }, []);

  if (!ToasterComponent) return null;

  return (
    <ToasterComponent
      theme={theme}
      position="bottom-right"
      richColors
      toastOptions={{
        style: {
          background: theme === 'light' ? 'rgba(255, 255, 255, 0.96)' : 'rgba(22, 22, 28, 0.95)',
          backdropFilter: 'blur(16px)',
          border: theme === 'light' ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
          color: theme === 'light' ? '#111128' : '#ffffff',
          boxShadow: theme === 'light' ? '0 12px 32px rgba(17,17,40,0.12)' : 'none',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        },
      }}
    />
  );
};

function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <Router>
      <PageTitleUpdater />
      <LazyToaster theme={theme} />
      <FirebaseConfigNotice />
      <PWAUpdatePrompt />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Suspense fallback={<FullPageLoader />}><RegisterPage /></Suspense>} />
        <Route path="/jadwal-publik" element={<Suspense fallback={<FullPageLoader />}><PublicCalendarPage /></Suspense>} />
        <Route path="/galeri" element={<Suspense fallback={<FullPageLoader />}><PublicGalleryPage /></Suspense>} />
        <Route path="/*" element={<Suspense fallback={<FullPageLoader />}><AdminShell /></Suspense>} />
      </Routes>
    </Router>
  );
}

export default App;
