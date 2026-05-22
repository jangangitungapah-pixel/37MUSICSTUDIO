import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useDemoStore } from './useDemoStore';
import { getDefaultPermissionsForRole } from '../lib/permissions';
import { useAuditLogStore } from './useAuditLogStore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, setDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
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

          createStaffAccount: async (staffData, email, password, username) => {
          let secondaryApp;
          try {
            // 1. Initialize secondary app to avoid logging out the admin
            secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
            const secondaryAuth = getAuth(secondaryApp);
            const secondaryDb = getFirestore(secondaryApp);

            // 2. Create the user
            const finalEmail = email || `${username}@37musicstudio.local`;
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, finalEmail, password);
            const newUser = userCredential.user;

            // 3. Create the basic user profile using secondaryDb
            const newProfile = {
              uid: newUser.uid,
              email: finalEmail,
              username: username.toLowerCase().replace(/\s+/g, ''),
              phone: staffData.phone || '',
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(secondaryDb, 'users', newUser.uid), newProfile);
            
            // 3.5. Save username mapping for login lookup
            await setDoc(doc(secondaryDb, 'usernames', newProfile.username), {
              email: finalEmail
            });

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
              try { await deleteApp(secondaryApp); } catch { /* ignore */ }
            }
            throw error;
          }
        },

        updateStaff: async (id, updatedData) => {
          const payload = {
            ...updatedData,
            permissions: updatedData.permissions || getDefaultPermissionsForRole(updatedData.role),
          };
          set((state) => ({
            staffMembers: state.staffMembers.map(s => s.id === id ? { ...s, ...payload } : s)
          }));
          
          try {
             await updateDoc(doc(db, 'users', id), {
               role: payload.role,
               permissions: payload.permissions,
               phone: payload.phone || ''
             });
          } catch(e) {
             console.error("Error updating user document", e);
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
          let secondaryApp;
          try {
            secondaryApp = initializeApp(firebaseConfig, "SecondaryAppReset");
            const secondaryAuth = getAuth(secondaryApp);
            const secondaryDb = getFirestore(secondaryApp);

            // Create a completely new email to avoid "email-already-in-use"
            const newEmail = `${oldStaff.username}_${Date.now()}@37musicstudio.local`;
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);
            const newUser = userCredential.user;

            // Copy old profile to new uid
            const newProfile = {
              uid: newUser.uid,
              email: newEmail,
              username: oldStaff.username,
              phone: oldStaff.phone || '',
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(secondaryDb, 'users', newUser.uid), newProfile);

            // Update mapping
            await setDoc(doc(secondaryDb, 'usernames', oldStaff.username), {
              email: newEmail
            });

            await signOut(secondaryAuth);
            await deleteApp(secondaryApp);

            // Add role/permissions via primary admin db
            await updateDoc(doc(db, 'users', newUser.uid), {
              role: oldStaff.role,
              permissions: oldStaff.permissions || getDefaultPermissionsForRole(oldStaff.role)
            });

            // Delete old user document
            try {
              await deleteDoc(doc(db, 'users', oldStaff.id));
            } catch(e) {
              console.warn("Could not delete old user doc", e);
            }

            // Update local state
            const updatedStaff = { ...oldStaff, id: newUser.uid };
            set((state) => ({
              staffMembers: state.staffMembers.map((s) => s.id === oldStaff.id ? updatedStaff : s)
            }));

            useAuditLogStore.getState().addLog({
              action: 'staff_update',
              entityType: 'staff',
              entityId: newUser.uid,
              summary: `Password staff ${oldStaff.name} di-reset secara administratif.`,
            });
          } catch (error) {
            console.error('Error resetting staff password:', error);
            if (secondaryApp) await deleteApp(secondaryApp).catch(console.error);
            throw error;
          }
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
