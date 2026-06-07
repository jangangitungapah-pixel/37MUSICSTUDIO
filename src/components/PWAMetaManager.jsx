import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const pwaModes = {
  client: {
    manifestHref: '/client.webmanifest',
    themeColor: '#070706',
    title: '37 Studio Client',
    appleTitle: '37 Client',
    description: 'Portal client 37 Music Studio untuk booking, jadwal, aktivitas, dan pesan ke admin.',
  },
  admin: {
    manifestHref: '/admin.webmanifest',
    themeColor: '#0d0d12',
    title: '37 Studio Admin',
    appleTitle: '37 Admin',
    description: 'Portal admin 37 Music Studio untuk booking, pelanggan, billing, inventory, dan pesan client.',
  },
};

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

const upsertMeta = (selector, createElement, applyElement) => {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = createElement();
    document.head.appendChild(element);
  }

  applyElement(element);
};

const PWAMetaManager = () => {
  const location = useLocation();

  useEffect(() => {
    const mode = getModeFromPathname(location.pathname);
    const config = pwaModes[mode];

    document.documentElement.dataset.pwaMode = mode;

    document.head.querySelectorAll('link[rel="manifest"]').forEach((link) => {
      link.parentNode?.removeChild(link);
    });

    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = config.manifestHref;
    manifestLink.setAttribute('data-dynamic-pwa-manifest', mode);
    document.head.appendChild(manifestLink);

    upsertMeta(
      'meta[name="theme-color"]',
      () => {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        return meta;
      },
      (meta) => meta.setAttribute('content', config.themeColor)
    );

    upsertMeta(
      'meta[name="description"]',
      () => {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        return meta;
      },
      (meta) => meta.setAttribute('content', config.description)
    );

    upsertMeta(
      'meta[name="apple-mobile-web-app-title"]',
      () => {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'apple-mobile-web-app-title');
        return meta;
      },
      (meta) => meta.setAttribute('content', config.appleTitle)
    );

    upsertMeta(
      'meta[property="og:title"]',
      () => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:title');
        return meta;
      },
      (meta) => meta.setAttribute('content', config.title)
    );

    upsertMeta(
      'meta[property="og:description"]',
      () => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:description');
        return meta;
      },
      (meta) => meta.setAttribute('content', config.description)
    );
  }, [location.pathname]);

  return null;
};

export default PWAMetaManager;
