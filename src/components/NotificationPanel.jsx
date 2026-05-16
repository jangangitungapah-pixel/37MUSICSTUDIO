import React from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { CalendarCheck, UserPlus, AlertTriangle, Info, Bell, Check, X, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import './NotificationPanel.css';

const ICONS = {
  booking: CalendarCheck,
  customer: UserPlus,
  warning: AlertTriangle,
  info: Info,
  default: Bell,
};

const NotificationPanel = ({ isOpen, onClose }) => {
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();

  if (!isOpen) return null;

  return (
    <>
      <div className="notif-overlay" onClick={onClose} />
      <div className="notif-panel glass-panel">
        <div className="notif-header">
          <div className="notif-header-title">
            <Bell size={20} color="var(--accent-pink)" />
            <h2>Pusat Notifikasi</h2>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="notif-actions">
          <button className="btn-secondary btn-small" onClick={markAllAsRead}>
            <Check size={14} /> Tandai Dibaca
          </button>
          <button className="btn-secondary btn-small danger-text" onClick={clearAll}>
            <Trash2 size={14} /> Bersihkan
          </button>
        </div>

        <div className="notif-list">
          {notifications.length === 0 ? (
            <div className="notif-empty">
              <Bell size={40} color="var(--border-light)" />
              <p>Belum ada aktivitas baru</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const Icon = ICONS[notif.type] || ICONS.default;
              return (
                <div 
                  key={notif.id} 
                  className={`notif-card ${!notif.isRead ? 'unread' : ''}`}
                  onClick={() => !notif.isRead && markAsRead(notif.id)}
                >
                  {!notif.isRead && <div className="notif-unread-dot" />}
                  <div className={`notif-icon-wrapper type-${notif.type || 'info'}`}>
                    <Icon size={18} />
                  </div>
                  <div className="notif-content">
                    <h4 className="notif-title">{notif.title}</h4>
                    <p className="notif-message">{notif.message}</p>
                    <span className="notif-time">
                      {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true, locale: idLocale })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;
