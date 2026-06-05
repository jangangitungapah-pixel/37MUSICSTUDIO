import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createStaffAuthAccount, resetStaffAuthPassword } from '../services/staff/staffAuthService';
import { deleteStaffDocument, updateStaffDocument, updateStaffStatusDocument } from '../services/staff/staffRepository';
import { subscribeToStaff } from '../services/staff/staffSubscription';
import { createLocalStaff, createStaffUpdatePayload } from '../entities/staff/staff.utils';
import { useAuditLogStore } from './useAuditLogStore';
import { useDemoStore } from './useDemoStore';

export const useStaffStore = create(
  persist(
    (set, get) => {
      let realStaff = [];

      subscribeToStaff({
        onData: (staffMembers) => {
          realStaff = staffMembers;

          if (!useDemoStore.getState().isDemoMode) {
            set({ staffMembers: realStaff });
          }
        },
        onEmpty: () => {
          realStaff = [];
          set({ staffMembers: [] });
        },
        onError: (error) => {
          console.error('Error loading staff members:', error);
          set({ staffMembers: [] });
        },
      });

      useDemoStore.subscribe((demoState) => {
        if (demoState.isDemoMode) {
          set((state) => ({
            realStaffMembers: state.realStaffMembers || state.staffMembers,
            staffMembers: demoState.demoStaff,
          }));
        } else {
          set({
            staffMembers: realStaff,
            realStaffMembers: null,
          });
        }
      });

      return {
        staffMembers: [],
        realStaffMembers: null,

        addStaff: (staff) => {
          const newStaff = createLocalStaff(staff);
          set((state) => ({
            staffMembers: [...state.staffMembers, newStaff],
          }));
          useAuditLogStore.getState().addLog({
            action: 'staff_create',
            entityType: 'staff',
            entityId: newStaff.id,
            summary: `Staff ${newStaff.name} ditambahkan`,
          });
        },

        createStaffAccount: async (staffData, email, password, username) => {
          const newStaff = await createStaffAuthAccount(staffData, email, password, username);

          set((state) => ({
            staffMembers: [...state.staffMembers, newStaff],
          }));

          useAuditLogStore.getState().addLog({
            action: 'staff_create_auth',
            entityType: 'staff',
            entityId: newStaff.id,
            summary: `Akun Staff ${newStaff.name} berhasil dibuat`,
          });

          return newStaff;
        },

        updateStaff: async (id, updatedData) => {
          const payload = createStaffUpdatePayload(updatedData);
          set((state) => ({
            staffMembers: state.staffMembers.map((staff) => (
              staff.id === id ? { ...staff, ...payload } : staff
            )),
          }));

          try {
            await updateStaffDocument(id, payload);
          } catch (error) {
            console.error('Error updating user document', error);
          }

          useAuditLogStore.getState().addLog({
            action: 'staff_update',
            entityType: 'staff',
            entityId: id,
            summary: 'Data staff diperbarui',
            metadata: payload,
          });
        },

        resetStaffPassword: async (oldStaff, newPassword) => {
          const updatedStaff = await resetStaffAuthPassword(oldStaff, newPassword);

          set((state) => ({
            staffMembers: state.staffMembers.map((staff) => (
              staff.id === oldStaff.id ? updatedStaff : staff
            )),
          }));

          useAuditLogStore.getState().addLog({
            action: 'staff_update',
            entityType: 'staff',
            entityId: updatedStaff.id,
            summary: `Password staff ${oldStaff.name} di-reset secara administratif.`,
          });
        },

        deleteStaff: async (id) => {
          set((state) => ({
            staffMembers: state.staffMembers.filter((staff) => staff.id !== id),
          }));
          useAuditLogStore.getState().addLog({
            action: 'staff_delete',
            entityType: 'staff',
            entityId: id,
            summary: 'Staff dihapus',
          });
          if (useDemoStore.getState().isDemoMode) return;
          try {
            await deleteStaffDocument(id);
          } catch (error) {
            console.error('Error deleting user document:', error);
          }
        },

        toggleStaffStatus: async (id) => {
          const staff = get().staffMembers.find((item) => item.id === id);
          if (!staff) return;
          const nextStatus = staff.status === 'active' ? 'inactive' : 'active';

          set((state) => ({
            staffMembers: state.staffMembers.map((item) => (
              item.id === id ? { ...item, status: nextStatus } : item
            )),
          }));
          useAuditLogStore.getState().addLog({
            action: 'staff_status_toggle',
            entityType: 'staff',
            entityId: id,
            summary: 'Status staff diperbarui',
          });
          if (useDemoStore.getState().isDemoMode) return;
          try {
            await updateStaffStatusDocument(id, nextStatus);
          } catch (error) {
            console.error('Error updating user status:', error);
          }
        },
      };
    },
    {
      name: 'music-studio-staff',
      partialize: (state) => {
        if (useDemoStore.getState().isDemoMode) {
          return { staffMembers: state.realStaffMembers || state.staffMembers };
        }
        return { staffMembers: state.staffMembers };
      },
    }
  )
);
