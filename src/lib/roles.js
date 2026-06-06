export const ADMIN_ROLES = new Set(['admin', 'staff']);

export const CLIENT_ROLE = 'client';

export const isAdminRole = (role) => ADMIN_ROLES.has(String(role || '').toLowerCase());

export const isClientRole = (role) => String(role || '').toLowerCase() === CLIENT_ROLE;

export const normalizeRole = (role) => {
  const value = String(role || '').toLowerCase();
  if (isAdminRole(value)) return value;
  return CLIENT_ROLE;
};

export const getPortalPathForProfile = (userProfile, fallback = '/client') => {
  if (!userProfile) return fallback;
  return isAdminRole(userProfile.role) ? '/admin/dashboard' : '/client/dashboard';
};

export const stripAdminPrefix = (pathname) => {
  const next = String(pathname || '').replace(/^\/admin(?=\/|$)/, '');
  return next || '/dashboard';
};
