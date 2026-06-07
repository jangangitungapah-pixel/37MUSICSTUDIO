export const PERMISSIONS = {
  dashboard: 'dashboard',
  calendar: 'calendar',
  customers: 'customers',
  inventory: 'inventory',
  billing: 'billing',
  finance: 'finance',
  staff: 'staff',
  maintenance: 'maintenance',
  settings: 'settings',
  dataManagement: 'dataManagement',
  gallery: 'gallery',
  messages: 'messages',
};

export const PERMISSION_LABELS = {
  [PERMISSIONS.dashboard]: 'Dashboard',
  [PERMISSIONS.calendar]: 'Kalender & Booking',
  [PERMISSIONS.customers]: 'Pelanggan',
  [PERMISSIONS.inventory]: 'Inventaris',
  [PERMISSIONS.billing]: 'Billing / POS',
  [PERMISSIONS.finance]: 'Pembukuan',
  [PERMISSIONS.staff]: 'Manajemen Staff',
  [PERMISSIONS.maintenance]: 'Maintenance',
  [PERMISSIONS.settings]: 'Pengaturan',
  [PERMISSIONS.dataManagement]: 'Backup / Reset Data',
  [PERMISSIONS.gallery]: 'Galeri Foto',
  [PERMISSIONS.messages]: 'Pesan Client',
};

export const ADMIN_PERMISSIONS = Object.values(PERMISSIONS);

export const STAFF_DEFAULT_PERMISSIONS = [
  PERMISSIONS.dashboard,
  PERMISSIONS.calendar,
  PERMISSIONS.customers,
  PERMISSIONS.inventory,
  PERMISSIONS.billing,
  PERMISSIONS.maintenance,
  PERMISSIONS.gallery,
  PERMISSIONS.messages,
];

export const ROUTE_PERMISSIONS = {
  '/dashboard': PERMISSIONS.dashboard,
  '/calendar': PERMISSIONS.calendar,
  '/customers': PERMISSIONS.customers,
  '/inventory': PERMISSIONS.inventory,
  '/billing': PERMISSIONS.billing,
  '/finance': PERMISSIONS.finance,
  '/staff': PERMISSIONS.staff,
  '/maintenance': PERMISSIONS.maintenance,
  '/settings': PERMISSIONS.settings,
  '/gallery': PERMISSIONS.gallery,
  '/messages': PERMISSIONS.messages,
  '/admin/messages': PERMISSIONS.messages,
};

export const getDefaultPermissionsForRole = (role) => (
  role === 'admin' ? ADMIN_PERMISSIONS : STAFF_DEFAULT_PERMISSIONS
);

export const hasPermission = (profile, permission) => {
  if (!permission) return true;
  if (!profile) return false;
  if (profile.role === 'admin') return true;
  const permissions = Array.isArray(profile.permissions)
    ? profile.permissions
    : getDefaultPermissionsForRole(profile.role);

  // Backward compatibility: Automatically grant 'gallery' permission to active staff who don't have it in their custom permissions array yet.
  if (permission === PERMISSIONS.gallery && profile.role === 'staff' && !permissions.includes(PERMISSIONS.gallery)) {
    if (permissions.includes(PERMISSIONS.dashboard)) {
      return true;
    }
  }

  return permissions.includes(permission);
};
