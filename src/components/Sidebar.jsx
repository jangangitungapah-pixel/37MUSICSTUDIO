import React, { useState } from 'react';
import { CalendarDays, Users, Package, CreditCard, Settings, Music, BookOpen, PieChart, Menu, X, LogOut, HelpCircle, Bell } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useTourStore } from '../store/useTourStore';
import { useNotificationStore } from '../store/useNotificationStore';
import ProfileModal from './ProfileModal';
import NotificationPanel from './NotificationPanel';
import './Sidebar.css';

const Sidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const { user, userProfile, logout } = useAuthStore();
  const { startTour } = useTourStore();
  const { notifications } = useNotificationStore();
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleRestartTour = () => {
    const currentPath = window.location.pathname;
    const tourPages = ['/', '/calendar', '/customers', '/inventory', '/billing', '/settings'];
    
    // If already on a page with a tour, start it here
    if (tourPages.includes(currentPath)) {
      setMobileOpen(false);
      setTimeout(() => {
        startTour();
      }, 300);
    } else {
      // Navigate to dashboard first
      navigate('/');
      setMobileOpen(false);
      setTimeout(() => {
        startTour();
      }, 300);
    }
  };

  const menuItems = [
    { icon: <PieChart size={20} />, label: 'Dashboard', path: '/', tourClass: '' },
    { icon: <CalendarDays size={20} />, label: 'Calendar', path: '/calendar', tourClass: 'tour-calendar' },
    { icon: <Users size={20} />, label: 'Customers', path: '/customers', tourClass: 'tour-customers' },
    { icon: <Package size={20} />, label: 'Inventory', path: '/inventory', tourClass: '' },
    { icon: <CreditCard size={20} />, label: 'Billing / POS', path: '/billing', tourClass: 'tour-billing' },
    { icon: <BookOpen size={20} />, label: 'Pembukuan', path: '/finance', tourClass: '' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/settings', tourClass: '' },
  ];

  // Get first letter of username or email for avatar
  const displayName = userProfile?.username || user?.displayName || (user?.email ? user.email.split('@')[0] : 'User');
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="mobile-header">
        <div className="mobile-header-brand">
          <Music size={20} color="var(--accent-pink)" />
          <span className="mobile-header-title">37 STUDIO</span>
        </div>
        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
          <button className="notification-bell-btn" onClick={() => setIsNotifOpen(true)}>
             <Bell size={22} color="var(--text-primary)" />
             {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </button>
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar glass-panel ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-icon">
            <Music size={24} color="var(--accent-pink)" />
          </div>
          <h1 className="logo-text">37 STUDIO</h1>
          <button className="notification-bell-btn" onClick={() => setIsNotifOpen(true)} style={{marginLeft: 'auto', display: 'flex'}}>
             <Bell size={20} color="var(--text-muted)" />
             {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
            <NavLink 
              key={index} 
              to={item.path} 
              className={({ isActive }) => `nav-item ${item.tourClass} ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleRestartTour} style={{background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', marginBottom: '10px'}}>
            <HelpCircle size={20} color="var(--text-muted)" />
            <span style={{color: 'var(--text-muted)'}}>Panduan Tour</span>
          </button>
          
          <div className="user-profile tour-profile" style={{cursor: 'pointer', position: 'relative'}} onClick={() => setIsProfileOpen(true)}>
            <div className="avatar">{avatarLetter}</div>
            <div className="user-info">
              <span className="user-name" title={user?.email || ''}>{displayName}</span>
              <span className="user-role">Administrator</span>
            </div>
            
            <button 
              className="icon-btn logout-btn" 
              onClick={(e) => { e.stopPropagation(); handleLogout(); }} 
              title="Logout" 
              style={{marginLeft: 'auto'}}
            >
              <LogOut size={18} color="var(--text-muted)" />
            </button>
          </div>
        </div>
      </aside>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <NotificationPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
};

export default Sidebar;
