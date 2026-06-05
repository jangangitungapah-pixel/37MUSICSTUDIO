import { useEffect, useState } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { useThemeStore } from '../store/useThemeStore';
import FirebaseConfigNotice from '../components/FirebaseConfigNotice';
import AppRoutes from './routes';
import { getRouteTitle } from './routeTitles';

const PageTitleUpdater = () => {
  const location = useLocation();

  useEffect(() => {
    const title = getRouteTitle(location.pathname);
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
      <AppRoutes />
    </Router>
  );
}

export default App;
