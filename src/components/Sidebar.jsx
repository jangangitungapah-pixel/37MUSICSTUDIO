import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Users, Package, CreditCard, Settings, Music, BookOpen, PieChart, Menu, X, LogOut, HelpCircle, Bell, ChevronRight, FlaskConical, Sun, Moon } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useTourStore } from '../store/useTourStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useThemeStore } from '../store/useThemeStore';
import { useDemoStore } from '../store/useDemoStore';
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
  const { isDemoMode, toggleDemoMode } = useDemoStore();
  const { theme, toggleTheme } = useThemeStore();
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
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }}
            style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}
          >
            {menuItems.map((item, index) => (
              <motion.div
                key={index}
                variants={{ hidden: { opacity: 0, x: -14 }, visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.4,0,0.2,1] } } }}
              >
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => `nav-item ${item.tourClass} ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  <ChevronRight size={14} className="nav-chevron" />
                </NavLink>
              </motion.div>
            ))}
          </motion.div>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {/* Demo Mode Badge */}
          {isDemoMode && (
            <button
              className="demo-mode-badge"
              onClick={() => { navigate('/settings'); setMobileOpen(false); }}
              title="Mode Demo Aktif — klik untuk ke Settings"
            >
              <span className="demo-badge-dot" />
              <FlaskConical size={13} color="#a855f7" />
              <span className="demo-badge-text">Demo Mode</span>
              <span className="demo-badge-off" onClick={(e) => { e.stopPropagation(); toggleDemoMode(); }}>✕ OFF</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button className="theme-toggle-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <span className="nav-icon">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </span>
            <span className="nav-label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

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
