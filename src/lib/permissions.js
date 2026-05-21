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
};

export const ADMIN_PERMISSIONS = Object.values(PERMISSIONS);

export const STAFF_DEFAULT_PERMISSIONS = [
  PERMISSIONS.dashboard,
  PERMISSIONS.calendar,
  PERMISSIONS.customers,
  PERMISSIONS.inventory,
  PERMISSIONS.billing,
  PERMISSIONS.maintenance,
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
  return permissions.includes(permission);
};
