import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useDemoStore } from './useDemoStore';
import { getDefaultPermissionsForRole } from '../lib/permissions';
import { useAuditLogStore } from './useAuditLogStore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { setDoc, doc, updateDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { db, firebaseConfig, auth } from '../firebase';

export const useStaffStore = create(
  persist(
    (set, get) => {
      const usersRef = collection(db, 'users');
      let realStaff = [];
      let unsubscribeStaff = null;

      onAuthStateChanged(auth, (user) => {
        if (unsubscribeStaff) {
          unsubscribeStaff();
          unsubscribeStaff = null;
        }

        if (!user || user.isAnonymous) {
          realStaff = [];
          set({ staffMembers: [] });
          return;
        }

        unsubscribeStaff = onSnapshot(usersRef, (snapshot) => {
          realStaff = snapshot.docs
            .filter(doc => !doc.id.includes('.') && !doc.id.includes('='))
            .map(doc => {
              const data = doc.data();
              return {
                id: data.uid || doc.id,
                name: data.name || data.username || 'No Name',
                username: data.username || '',
                email: data.email || '',
                phone: data.phone || '',
                role: data.role || 'staff',
                status: data.status || 'active',
                permissions: data.permissions || getDefaultPermissionsForRole(data.role || 'staff')
              };
            });

          if (!useDemoStore.getState().isDemoMode) {
            set({ staffMembers: realStaff });
          }
        }, (error) => {
          console.error('Error loading staff members:', error);
          set({ staffMembers: [] });
        });
      });

      // Subscribe to demo store
      useDemoStore.subscribe((demoState) => {
        if (demoState.isDemoMode) {
          set((state) => ({
            realStaffMembers: state.realStaffMembers || state.staffMembers,
            staffMembers: demoState.demoStaff
          }));
        } else {
          set({
            staffMembers: realStaff,
            realStaffMembers: null
          });
        }
      });

      return {
        staffMembers: [],
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
          // Use a unique app name to prevent conflicts on repeated calls
          const appName = `SecondaryApp_${Date.now()}`;
          let secondaryApp;
          try {
            // 1. Initialize secondary app to avoid logging out the admin
            secondaryApp = initializeApp(firebaseConfig, appName);
            const secondaryAuth = getAuth(secondaryApp);

            // 2. Create the user
            const cleanUsername = username.toLowerCase().replace(/\s+/g, '');
            const finalEmail = email || `${cleanUsername}@37musicstudio.local`;
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, finalEmail, password);
            const newUser = userCredential.user;

            // 3. Create the full user profile using primary db (Admin session)
            const newProfile = {
              uid: newUser.uid,
              email: finalEmail,
              username: cleanUsername,
              name: staffData.name || '',
              phone: staffData.phone || '',
              role: staffData.role,
              permissions: staffData.permissions || getDefaultPermissionsForRole(staffData.role),
              requiresPasswordChange: true,
              status: 'active',
              createdAt: new Date().toISOString()
            };
            
            try {
              await setDoc(doc(db, 'users', newUser.uid), newProfile);
              
              // 3.5. Save username mapping for login lookup
              await setDoc(doc(db, 'usernames', cleanUsername), {
                email: finalEmail
              });
            } catch (firestoreError) {
              // Rollback: delete the created Auth user to allow retries if Firestore fails
              console.error("Firestore write failed, rolling back Auth user...", firestoreError);
              await newUser.delete().catch(deleteErr => console.error("Rollback delete failed:", deleteErr));
              throw firestoreError;
            }

            // 4. Sign out the secondary auth
            await signOut(secondaryAuth);

            // 5. Clean up the secondary app
            await deleteApp(secondaryApp);
            secondaryApp = null;

            // 6. Update local state
            const newStaff = {
              ...staffData,
              id: newUser.uid, // Use actual Firebase UID
              username: cleanUsername,
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
               name: payload.name || '',
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
          // Use a unique app name to prevent conflicts on repeated calls
          const appName = `SecondaryAppReset_${Date.now()}`;
          let secondaryApp;
          try {
            secondaryApp = initializeApp(firebaseConfig, appName);
            const secondaryAuth = getAuth(secondaryApp);

            // Create a completely new email to avoid "email-already-in-use"
            const newEmail = `${oldStaff.username}_${Date.now()}@37musicstudio.local`;
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);
            const newUser = userCredential.user;

            // Copy old profile to new uid with all required fields
            const newProfile = {
              uid: newUser.uid,
              email: newEmail,
              username: oldStaff.username,
              name: oldStaff.name || '',
              phone: oldStaff.phone || '',
              role: oldStaff.role,
              permissions: oldStaff.permissions || getDefaultPermissionsForRole(oldStaff.role),
              status: oldStaff.status || 'active',
              requiresPasswordChange: false,
              createdAt: new Date().toISOString()
            };
            
            try {
              await setDoc(doc(db, 'users', newUser.uid), newProfile);

              // Update username mapping
              await setDoc(doc(db, 'usernames', oldStaff.username), {
                email: newEmail
              });
            } catch (firestoreError) {
              // Rollback: delete the new Auth user if Firestore writes fail during reset
              console.error("Firestore user creation failed during reset, deleting new Auth user...", firestoreError);
              await newUser.delete().catch(deleteErr => console.error("Rollback delete failed:", deleteErr));
              throw firestoreError;
            }

            await signOut(secondaryAuth);
            await deleteApp(secondaryApp);
            secondaryApp = null;

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


        deleteStaff: async (id) => {
          set((state) => ({
            staffMembers: state.staffMembers.filter(s => s.id !== id)
          }));
          useAuditLogStore.getState().addLog({
            action: 'staff_delete',
            entityType: 'staff',
            entityId: id,
            summary: 'Staff dihapus',
          });
          if (useDemoStore.getState().isDemoMode) return;
          try {
            await deleteDoc(doc(db, 'users', id));
          } catch (e) {
            console.error("Error deleting user document:", e);
          }
        },
        
        toggleStaffStatus: async (id) => {
          const staff = get().staffMembers.find(s => s.id === id);
          if (!staff) return;
          const nextStatus = staff.status === 'active' ? 'inactive' : 'active';

          set((state) => ({
            staffMembers: state.staffMembers.map(s => 
              s.id === id ? { ...s, status: nextStatus } : s
            )
          }));
          useAuditLogStore.getState().addLog({
            action: 'staff_status_toggle',
            entityType: 'staff',
            entityId: id,
            summary: 'Status staff diperbarui',
          });
          if (useDemoStore.getState().isDemoMode) return;
          try {
            await updateDoc(doc(db, 'users', id), {
              status: nextStatus
            });
          } catch (e) {
            console.error("Error updating user status:", e);
          }
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
