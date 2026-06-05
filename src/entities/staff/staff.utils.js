import { getDefaultPermissionsForRole } from './staff.permissions';

export const cleanStaffUsername = (username = '') => username.toLowerCase().replace(/\s+/g, '');

export const getStaffEmail = (email, username) => email || `${username}@37musicstudio.local`;

export const createLocalStaff = (staff, id = Date.now().toString()) => ({
  ...staff,
  id,
  status: 'active',
  permissions: staff.permissions || getDefaultPermissionsForRole(staff.role),
});

export const createStaffProfile = ({ uid, email, username, staffData, requiresPasswordChange }) => ({
  uid,
  email,
  username,
  name: staffData.name || '',
  phone: staffData.phone || '',
  role: staffData.role,
  permissions: staffData.permissions || getDefaultPermissionsForRole(staffData.role),
  requiresPasswordChange,
  status: staffData.status || 'active',
  createdAt: new Date().toISOString(),
});

export const createStaffUpdatePayload = (updatedData) => ({
  ...updatedData,
  permissions: updatedData.permissions || getDefaultPermissionsForRole(updatedData.role),
});

export const toStaffDocumentUpdate = (payload) => ({
  name: payload.name || '',
  role: payload.role,
  permissions: payload.permissions,
  phone: payload.phone || '',
});
