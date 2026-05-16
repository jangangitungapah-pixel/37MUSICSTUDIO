import React from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { CalendarCheck, UserPlus, X, Bell, AlertTriangle, Info } from 'lucide-react';
import './NotificationToast.css';

const ICONS = {
  booking: CalendarCheck,
  customer: UserPlus,
  warning: AlertTriangle,
  info: Info,
  default: Bell,
};

const NotificationToast = () => {
  const { toastQueue, dismissToast } = useNotificationStore();

  if (toastQueue.length === 0) return null;

  return (
    <div className="toast-container">
      {toastQueue.map((notif) => {
        const Icon = ICONS[notif.type] || ICONS.default;
        return (
          <div 
            key={notif.id} 
            className={`toast-item toast-${notif.type || 'info'} ${notif.dismissed ? 'toast-exit' : 'toast-enter'}`}
          >
            <div className="toast-icon">
              <Icon size={18} />
            </div>
            <div className="toast-body">
              <span className="toast-title">{notif.title}</span>
              <span className="toast-message">{notif.message}</span>
            </div>
            <button className="toast-close" onClick={() => dismissToast(notif.id)}>
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationToast;
