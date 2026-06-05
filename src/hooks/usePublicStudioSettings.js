import { useEffect, useState } from 'react';

export const DEFAULT_PUBLIC_STUDIO_SETTINGS = {
  studioName: '37 MUSIC STUDIO',
  studioAddress: 'Jl. Musik Indah No. 37, Jakarta',
  studioPhone: '0812-3456-7890',
  pricePerHour: 120000,
};

const isMobileViewport = () => (
  typeof window !== 'undefined' &&
  window.matchMedia?.('(max-width: 767px)').matches
);

const runWhenIdle = (callback) => {
  if (typeof window === 'undefined') return () => {};

  const mobileDelay = isMobileViewport() ? 4500 : 700;

  if (isMobileViewport()) {
    const id = window.setTimeout(callback, mobileDelay);
    return () => window.clearTimeout(id);
  }

  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(callback, { timeout: 1600 });
    return () => window.cancelIdleCallback(id);
  }

  const id = window.setTimeout(callback, mobileDelay);
  return () => window.clearTimeout(id);
};

export const usePublicStudioSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_PUBLIC_STUDIO_SETTINGS);

  useEffect(() => {
    let isCancelled = false;
    let unsubscribe = null;

    const cancelIdle = runWhenIdle(async () => {
      try {
        const [{ doc, onSnapshot }, { db }] = await Promise.all([
          import('firebase/firestore'),
          import('../firebase'),
        ]);

        if (isCancelled) return;

        unsubscribe = onSnapshot(
          doc(db, 'config', 'settings'),
          (snapshot) => {
            if (!snapshot.exists() || isCancelled) return;
            setSettings((current) => ({ ...current, ...snapshot.data() }));
          },
          () => {
            // Public landing keeps the fast local defaults if Firestore is unavailable.
          }
        );
      } catch {
        // Public landing keeps the fast local defaults if Firebase cannot be loaded.
      }
    });

    return () => {
      isCancelled = true;
      cancelIdle();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return settings;
};
