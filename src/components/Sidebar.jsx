import React, { useState } from 'react';
import { CalendarDays, Users, Package, CreditCard, Settings, Music, BookOpen, PieChart, Menu, X, LogOut, HelpCircle, Bell, ChevronRight } from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();

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
    { icon: <PieChart size={19} />, label: 'Dashboard', path: '/', tourClass: '' },
    { icon: <CalendarDays size={19} />, label: 'Calendar', path: '/calendar', tourClass: 'tour-calendar' },
    { icon: <Users size={19} />, label: 'Customers', path: '/customers', tourClass: 'tour-customers' },
    { icon: <Package size={19} />, label: 'Inventory', path: '/inventory', tourClass: '' },
    { icon: <CreditCard size={19} />, label: 'Billing / POS', path: '/billing', tourClass: 'tour-billing' },
    { icon: <BookOpen size={19} />, label: 'Pembukuan', path: '/finance', tourClass: '' },
    { icon: <Settings size={19} />, label: 'Settings', path: '/settings', tourClass: '' },
  ];

  // Get first letter of username or email for avatar
  const displayName = userProfile?.username || user?.displayName || (user?.email ? user.email.split('@')[0] : 'User');
  const avatarLetter = displayName.charAt(0).toUpperCase();

  // Get current page title for mobile header
  const currentPage = menuItems.find(item => item.path === location.pathname);
  const currentLabel = currentPage ? currentPage.label : '37 Studio';

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
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="logo-icon">
              <Music size={22} color="var(--accent-pink)" />
            </div>
            <div className="logo-text-group">
              <h1 className="logo-text">37 STUDIO</h1>
              <span className="logo-subtitle">Music Studio</span>
            </div>
          </div>
          <button className="notification-bell-btn sidebar-bell" onClick={() => setIsNotifOpen(true)}>
            <Bell size={18} />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <span className="nav-section-label">MENU</span>
          {menuItems.map((item, index) => (
            <NavLink 
              key={index} 
              to={item.path} 
              className={({ isActive }) => `nav-item ${item.tourClass} ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              <ChevronRight size={14} className="nav-chevron" />
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button className="nav-item tour-guide-btn" onClick={handleRestartTour}>
            <span className="nav-icon"><HelpCircle size={19} /></span>
            <span className="nav-label">Panduan Tour</span>
          </button>
          
          <div className="sidebar-divider" />
          
          <div className="user-profile tour-profile" onClick={() => setIsProfileOpen(true)}>
            <div className="avatar">{avatarLetter}</div>
            <div className="user-info">
              <span className="user-name" title={user?.email || ''}>{displayName}</span>
              <span className="user-role">Administrator</span>
            </div>
            <button 
              className="sidebar-logout-btn" 
              onClick={(e) => { e.stopPropagation(); handleLogout(); }} 
              title="Logout"
            >
              <LogOut size={16} />
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
