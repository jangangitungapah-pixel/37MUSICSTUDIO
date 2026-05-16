import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  
  addNotification: (notification) => {
    const id = Date.now() + Math.random();
    const newNotif = { id, timestamp: new Date(), ...notification };
    
    set((state) => ({
      notifications: [newNotif, ...state.notifications].slice(0, 20) // Keep last 20
    }));

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, dismissed: true } : n
        )
      }));
      // Clean up after animation
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      }, 400);
    }, 5000);
  },

  dismissNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, dismissed: true } : n
      )
    }));
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      }));
    }, 400);
  },

  clearAll: () => set({ notifications: [] })
}));
