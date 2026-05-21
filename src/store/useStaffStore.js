import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useDemoStore } from './useDemoStore';
import { getDefaultPermissionsForRole } from '../lib/permissions';
import { useAuditLogStore } from './useAuditLogStore';

export const useStaffStore = create(
  persist(
    (set) => {
      // Subscribe to demo store
      useDemoStore.subscribe((demoState) => {
        if (demoState.isDemoMode) {
          set((state) => ({
            realStaffMembers: state.realStaffMembers || state.staffMembers,
            staffMembers: demoState.demoStaff
          }));
        } else {
          set((state) => ({
            staffMembers: state.realStaffMembers || state.staffMembers,
            realStaffMembers: null
          }));
        }
      });

      return {
        staffMembers: [
          { id: '1', name: 'Admin Utama', role: 'admin', phone: '08123456789', status: 'active', permissions: getDefaultPermissionsForRole('admin') },
          { id: '2', name: 'Budi Staff', role: 'staff', phone: '08198765432', status: 'active', permissions: getDefaultPermissionsForRole('staff') },
        ],
        realStaffMembers: null,
        
        addStaff: (staff) => {
          const newStaff = {
            ...staff,
            id: Date.now().toString(),
            status: 'active',
            permissions: staff.permissions || getDefaultPermissionsForRole(staff.role),
          };
          set((state) => ({
            staffMembers: [...state.staffMembers, newStaff]
          }));
          useAuditLogStore.getState().addLog({
            action: 'staff_create',
            entityType: 'staff',
            entityId: newStaff.id,
            summary: `Staff ${newStaff.name} ditambahkan`,
          });
        },

        updateStaff: (id, updatedData) => {
          const payload = {
            ...updatedData,
            permissions: updatedData.permissions || getDefaultPermissionsForRole(updatedData.role),
          };
          set((state) => ({
            staffMembers: state.staffMembers.map(s => s.id === id ? { ...s, ...payload } : s)
          }));
          useAuditLogStore.getState().addLog({
            action: 'staff_update',
            entityType: 'staff',
            entityId: id,
            summary: 'Data staff diperbarui',
            metadata: payload,
          });
        },

        deleteStaff: (id) => {
          set((state) => ({
            staffMembers: state.staffMembers.filter(s => s.id !== id)
          }));
          useAuditLogStore.getState().addLog({
            action: 'staff_delete',
            entityType: 'staff',
            entityId: id,
            summary: 'Staff dihapus',
          });
        },
        
        toggleStaffStatus: (id) => {
          set((state) => ({
            staffMembers: state.staffMembers.map(s => 
              s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s
            )
          }));
          useAuditLogStore.getState().addLog({
            action: 'staff_status_toggle',
            entityType: 'staff',
            entityId: id,
            summary: 'Status staff diperbarui',
          });
        },
      };
    },
    {
      name: 'music-studio-staff',
      partialize: (state) => {
        // Protect real data from being overwritten by demo data in localStorage
        if (useDemoStore.getState().isDemoMode) {
          return { staffMembers: state.realStaffMembers || state.staffMembers };
        }
        return { staffMembers: state.staffMembers };
      }
    }
  )
);
