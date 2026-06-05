import { getDefaultPermissionsForRole } from './staff.permissions';

export const isStaffUserDoc = (docSnap) => !docSnap.id.includes('.') && !docSnap.id.includes('=');

export const mapUserDocToStaff = (docSnap) => {
  const data = docSnap.data();
  return {
    id: data.uid || docSnap.id,
    name: data.name || data.username || 'No Name',
    username: data.username || '',
    email: data.email || '',
    phone: data.phone || '',
    role: data.role || 'staff',
    status: data.status || 'active',
    permissions: data.permissions || getDefaultPermissionsForRole(data.role || 'staff'),
  };
};

export const mapUserSnapshotToStaff = (snapshot) => (
  snapshot.docs
    .filter(isStaffUserDoc)
    .map(mapUserDocToStaff)
);
