import { useEffect, useState } from 'react';
import { RefreshCw, Wifi, X } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';

const PWAUpdatePrompt = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateSW, setUpdateSW] = useState(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;

    const updateServiceWorker = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
        window.setTimeout(() => setOfflineReady(false), 5000);
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;

        window.setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      },
    });

    setUpdateSW(() => updateServiceWorker);
    return undefined;
  }, []);

  if (!needRefresh && !offlineReady) return null;

  const title = needRefresh ? 'Versi baru tersedia' : 'Aplikasi siap offline';
  const message = needRefresh
    ? 'Update sekarang agar portal memakai versi terbaru.'
    : '37 Music Studio bisa dibuka lebih cepat dari cache PWA.';

  return (
    <div
      className={'pwa-toast pwa-update-toast ' + (needRefresh ? 'is-update' : 'is-offline')}
      role="status"
      aria-live="polite"
    >
      <div className="pwa-toast-icon" aria-hidden="true">
        {needRefresh ? <RefreshCw size={18} /> : <Wifi size={18} />}
      </div>

      <div className="pwa-toast-copy">
        <strong>{title}</strong>
        <span>{message}</span>

        {needRefresh && (
          <button type="button" className="pwa-toast-primary" onClick={() => updateSW?.(true)}>
            Update sekarang
          </button>
        )}
      </div>

      <button
        type="button"
        className="pwa-toast-close"
        onClick={() => {
          setNeedRefresh(false);
          setOfflineReady(false);
        }}
        aria-label="Tutup notifikasi update"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default PWAUpdatePrompt;
