import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStaffStore = create(
  persist(
    (set) => ({
      staffMembers: [
        { id: '1', name: 'Admin Utama', role: 'admin', phone: '08123456789', status: 'active' },
        { id: '2', name: 'Budi Staff', role: 'staff', phone: '08198765432', status: 'active' },
      ],
      
      addStaff: (staff) => set((state) => ({
        staffMembers: [...state.staffMembers, { ...staff, id: Date.now().toString(), status: 'active' }]
      })),

      updateStaff: (id, updatedData) => set((state) => ({
        staffMembers: state.staffMembers.map(s => s.id === id ? { ...s, ...updatedData } : s)
      })),

      deleteStaff: (id) => set((state) => ({
        staffMembers: state.staffMembers.filter(s => s.id !== id)
      })),
      
      toggleStaffStatus: (id) => set((state) => ({
        staffMembers: state.staffMembers.map(s => 
          s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s
        )
      })),
    }),
    {
      name: 'music-studio-staff'
    }
  )
);
