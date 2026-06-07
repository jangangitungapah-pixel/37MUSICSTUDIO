export const ADMIN_ROLES = new Set(['admin', 'staff']);

export const CLIENT_ROLE = 'client';

const digits = (value) => String(value || '').replace(/\D/g, '');

export const isAdminRole = (role) => ADMIN_ROLES.has(String(role || '').toLowerCase());

export const isClientRole = (role) => String(role || '').toLowerCase() === CLIENT_ROLE;

export const normalizeRole = (role) => {
  const value = String(role || '').toLowerCase();
  if (isAdminRole(value)) return value;
  return CLIENT_ROLE;
};

export const isClientProfileComplete = (userProfile) => {
  if (!userProfile) return false;
  if (isAdminRole(userProfile.role)) return true;

  const phoneLength = digits(userProfile.phone).length;
  return phoneLength >= 9;
};

export const getPortalPathForProfile = (userProfile, fallback = '/client') => {
  if (!userProfile) return fallback;
  if (isAdminRole(userProfile.role)) return '/admin/dashboard';
  return isClientProfileComplete(userProfile) ? '/client/dashboard' : '/client/profile';
};

export const stripAdminPrefix = (pathname) => {
  const next = String(pathname || '').replace(/^\/admin(?=\/|$)/, '');
  return next || '/dashboard';
};
