import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [], // Persistent history
      toastQueue: [],    // Ephemeral toasts
      
      addNotification: (notification) => {
        const id = Date.now() + Math.random();
        const newNotif = { 
          id, 
          timestamp: new Date().toISOString(), 
          isRead: false, 
          ...notification 
        };
        
        // Trigger Native OS Notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          const title = notification.title || '37 Music Studio';
          const options = {
            body: notification.message || '',
            icon: '/icon-512.png',
            badge: '/icon-192.png',
            tag: notification.tag || 'studio-notification',
            renotify: true,
            vibrate: [200, 100, 200],
            data: { url: '/' }
          };

          if (navigator.serviceWorker) {
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification(title, options).catch(() => {
                try { new Notification(title, options); } catch(e) {}
              });
            }).catch(() => {
              try { new Notification(title, options); } catch(e) {}
            });
          } else {
            try { new Notification(title, options); } catch(e) {}
          }
        }

        set((state) => ({
          notifications: [newNotif, ...state.notifications].slice(0, 50), // History
          toastQueue: [newNotif, ...state.toastQueue].slice(0, 5) // Active toasts
        }));

        // Auto-dismiss the toast popup after 5 seconds
        setTimeout(() => {
          set((state) => ({
            toastQueue: state.toastQueue.map(n => 
              n.id === id ? { ...n, dismissed: true } : n
            )
          }));
          setTimeout(() => {
            set((state) => ({
              toastQueue: state.toastQueue.filter(n => n.id !== id)
            }));
          }, 400);
        }, 5000);
      },

      dismissToast: (id) => {
        set((state) => ({
          toastQueue: state.toastQueue.map(n => 
            n.id === id ? { ...n, dismissed: true } : n
          )
        }));
        setTimeout(() => {
          set((state) => ({
            toastQueue: state.toastQueue.filter(n => n.id !== id)
          }));
        }, 400);
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, isRead: true } : n
          )
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, isRead: true }))
        }));
      },

      clearAll: () => set({ notifications: [] })
    }),
    {
      name: 'music-studio-notifications',
      partialize: (state) => ({ notifications: state.notifications }), // Only save history
    }
  )
);
