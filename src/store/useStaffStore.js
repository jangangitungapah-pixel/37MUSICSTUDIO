import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useDemoStore } from './useDemoStore';
import { getDefaultPermissionsForRole } from '../lib/permissions';
import { useAuditLogStore } from './useAuditLogStore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, setDoc, doc, updateDoc } from 'firebase/firestore';
import { db, firebaseConfig } from '../firebase';

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

        createStaffAccount: async (staffData, email, password) => {
          let secondaryApp;
          try {
            // 1. Initialize secondary app to avoid logging out the admin
            secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
            const secondaryAuth = getAuth(secondaryApp);
            const secondaryDb = getFirestore(secondaryApp);

            // 2. Create the user
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const newUser = userCredential.user;

            // 3. Create the basic user profile using secondaryDb (allowed because isSelf matches)
            const newProfile = {
              uid: newUser.uid,
              email: email,
              username: staffData.name.toLowerCase().replace(/\s+/g, ''),
              phone: staffData.phone || '',
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(secondaryDb, 'users', newUser.uid), newProfile);

            // 4. Sign out the secondary auth
            await signOut(secondaryAuth);

            // 5. Clean up the secondary app
            await deleteApp(secondaryApp);

            // 6. Update the user document to set the 'role' using the primary db (admin access allowed)
            await updateDoc(doc(db, 'users', newUser.uid), {
              role: staffData.role,
              permissions: staffData.permissions || getDefaultPermissionsForRole(staffData.role)
            });

            // 7. Update local state
            const newStaff = {
              ...staffData,
              id: newUser.uid, // Use actual Firebase UID
              status: 'active',
              permissions: staffData.permissions || getDefaultPermissionsForRole(staffData.role),
            };
            
            set((state) => ({
              staffMembers: [...state.staffMembers, newStaff]
            }));

            useAuditLogStore.getState().addLog({
              action: 'staff_create_auth',
              entityType: 'staff',
              entityId: newStaff.id,
              summary: `Akun Staff ${newStaff.name} berhasil dibuat`,
            });
            
            return newStaff;
          } catch (error) {
            if (secondaryApp) {
              try { await deleteApp(secondaryApp); } catch (e) { /* ignore */ }
            }
            throw error;
          }
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
