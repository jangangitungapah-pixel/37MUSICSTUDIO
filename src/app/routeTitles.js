export const routeTitles = {
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

export const getRouteTitle = (pathname) => routeTitles[pathname] || 'Dashboard';
