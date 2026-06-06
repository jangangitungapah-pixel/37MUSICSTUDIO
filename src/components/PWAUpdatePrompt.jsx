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
    ? 'Update sekarang agar dashboard memakai versi terbaru.'
    : '37 Music Studio bisa dibuka lebih cepat dari cache PWA.';

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 10000,
        width: 'min(92vw, 390px)',
        padding: 14,
        borderRadius: 18,
        background: 'rgba(18, 18, 24, 0.94)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        color: '#fff',
        boxShadow: '0 22px 70px rgba(0, 0, 0, 0.38)',
        backdropFilter: 'blur(18px)',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          display: 'grid',
          placeItems: 'center',
          background: needRefresh ? 'rgba(255, 46, 136, 0.18)' : 'rgba(0, 240, 255, 0.16)',
          color: needRefresh ? 'var(--accent-pink, #ff2e88)' : 'var(--accent-cyan, #00f0ff)',
          flex: '0 0 auto',
        }}
      >
        {needRefresh ? <RefreshCw size={18} /> : <Wifi size={18} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ display: 'block', fontSize: 14, marginBottom: 3 }}>{title}</strong>
        <span style={{ display: 'block', fontSize: 12.5, lineHeight: 1.45, opacity: 0.78 }}>{message}</span>

        {needRefresh && (
          <button
            type="button"
            onClick={() => updateSW?.(true)}
            style={{
              marginTop: 10,
              border: 0,
              borderRadius: 999,
              padding: '8px 12px',
              background: 'var(--accent-pink, #ff2e88)',
              color: '#fff',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Update sekarang
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          setNeedRefresh(false);
          setOfflineReady(false);
        }}
        aria-label="Tutup notifikasi update"
        style={{
          border: 0,
          background: 'transparent',
          color: 'rgba(255,255,255,0.72)',
          cursor: 'pointer',
          padding: 4,
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default PWAUpdatePrompt;
