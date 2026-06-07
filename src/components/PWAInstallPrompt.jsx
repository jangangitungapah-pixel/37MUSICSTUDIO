import { useEffect, useMemo, useState } from 'react';
import { Download, MonitorSmartphone, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const DISMISS_DAYS = 7;
const DISMISS_MS = DISMISS_DAYS * 24 * 60 * 60 * 1000;

const isStandaloneMode = () => (
  window.matchMedia?.('(display-mode: standalone)').matches ||
  window.navigator.standalone === true
);

const getModeFromPathname = (pathname) => (
  pathname.startsWith('/admin') ||
  pathname.startsWith('/dashboard') ||
  pathname.startsWith('/calendar') ||
  pathname.startsWith('/customers') ||
  pathname.startsWith('/inventory') ||
  pathname.startsWith('/billing') ||
  pathname.startsWith('/finance') ||
  pathname.startsWith('/staff') ||
  pathname.startsWith('/maintenance') ||
  pathname.startsWith('/settings') ||
  pathname.startsWith('/messages')
    ? 'admin'
    : 'client'
);

const modeCopy = {
  client: {
    title: 'Install 37 Studio Client',
    message: 'Buka booking, jadwal, aktivitas, dan pesan admin langsung dari layar utama HP.',
    badge: 'Client App',
    storageKey: 'pwa-install-dismissed-client',
    icon: Sparkles,
  },
  admin: {
    title: 'Install 37 Studio Admin',
    message: 'Kelola booking, pelanggan, billing, inventory, dan pesan client lebih cepat dari app.',
    badge: 'Admin App',
    storageKey: 'pwa-install-dismissed-admin',
    icon: ShieldCheck,
  },
};

const isRecentlyDismissed = (storageKey) => {
  const value = Number(localStorage.getItem(storageKey) || 0);
  if (!value) return false;
  return Date.now() - value < DISMISS_MS;
};

const PWAInstallPrompt = () => {
  const location = useLocation();
  const mode = useMemo(() => getModeFromPathname(location.pathname), [location.pathname]);
  const copy = modeCopy[mode];

  const [installEvent, setInstallEvent] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);

      if (!isStandaloneMode() && !isRecentlyDismissed(copy.storageKey)) {
        window.setTimeout(() => setIsVisible(true), 1400);
      }
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setInstallEvent(null);
      localStorage.removeItem(copy.storageKey);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [copy.storageKey]);

  useEffect(() => {
    if (!installEvent || isStandaloneMode()) {
      setIsVisible(false);
      return;
    }

    if (isRecentlyDismissed(copy.storageKey)) {
      setIsVisible(false);
      return;
    }

    const timeoutId = window.setTimeout(() => setIsVisible(true), 800);
    return () => window.clearTimeout(timeoutId);
  }, [copy.storageKey, installEvent, mode]);

  const dismissPrompt = () => {
    localStorage.setItem(copy.storageKey, String(Date.now()));
    setIsVisible(false);
  };

  const handleInstall = async () => {
    if (!installEvent) return;

    setIsInstalling(true);

    try {
      await installEvent.prompt();
      await installEvent.userChoice;
      setIsVisible(false);
      setInstallEvent(null);
    } finally {
      setIsInstalling(false);
    }
  };

  if (!isVisible || !installEvent) return null;

  const Icon = copy.icon;

  return (
    <aside className={'pwa-install-card pwa-install-' + mode} role="dialog" aria-live="polite" aria-label={copy.title}>
      <div className="pwa-install-mark" aria-hidden="true">
        <Icon size={18} />
      </div>

      <div className="pwa-install-copy">
        <span>
          <MonitorSmartphone size={14} />
          {copy.badge}
        </span>
        <strong>{copy.title}</strong>
        <p>{copy.message}</p>

        <div className="pwa-install-actions">
          <button type="button" className="pwa-install-primary" onClick={handleInstall} disabled={isInstalling}>
            <Download size={15} />
            {isInstalling ? 'Membuka...' : 'Install'}
          </button>
          <button type="button" className="pwa-install-secondary" onClick={dismissPrompt}>
            Nanti dulu
          </button>
        </div>
      </div>

      <button type="button" className="pwa-install-close" onClick={dismissPrompt} aria-label="Tutup prompt install">
        <X size={16} />
      </button>
    </aside>
  );
};

export default PWAInstallPrompt;
