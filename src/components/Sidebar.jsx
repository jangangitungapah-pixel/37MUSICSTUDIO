import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Users, Package, CreditCard, Settings, BookOpen, PieChart, LogOut, Bell, ChevronRight, ChevronLeft, FlaskConical, Sun, Moon, Shield, Hammer, MoreHorizontal, Image } from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useThemeStore } from '../store/useThemeStore';
import { useDemoStore } from '../store/useDemoStore';
import { ROUTE_PERMISSIONS, hasPermission } from '../lib/permissions';
import ProfileModal from './ProfileModal';
import NotificationPanel from './NotificationPanel';
import Modal from './Modal';
import { sidebarContainerVariants, sidebarItemVariants, bottomSheetVariants, activeIndicatorTransition, navTap } from '../animations';
import './Sidebar.css';

const Sidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false); // Used for the "More" bottom sheet now
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const { user, userProfile, logout } = useAuthStore();
  const { notifications } = useNotificationStore();
  const { isDemoMode, toggleDemoMode } = useDemoStore();
  const { theme, toggleTheme } = useThemeStore();
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



  const menuItems = [
    { icon: <PieChart size={19} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <CalendarDays size={19} />, label: 'Calendar', path: '/calendar' },
    { icon: <Users size={19} />, label: 'Customers', path: '/customers' },
    { icon: <Package size={19} />, label: 'Inventory', path: '/inventory' },
    { icon: <CreditCard size={19} />, label: 'Billing / POS', path: '/billing' },
    { icon: <BookOpen size={19} />, label: 'Pembukuan', path: '/finance' },
    { icon: <Image size={19} />, label: 'Galeri Foto', path: '/gallery' },
    { icon: <Shield size={19} />, label: 'Staff', path: '/staff' },
    { icon: <Hammer size={19} />, label: 'Maintenance', path: '/maintenance' },
    { icon: <Settings size={19} />, label: 'Settings', path: '/settings' },
  ];

  // Get first letter of username or email for avatar
  const displayName = userProfile?.username || user?.displayName || (user?.email ? user.email.split('@')[0] : 'User');
  const avatarLetter = displayName.charAt(0).toUpperCase();

  // Get current page title for mobile header
  
  // Separate primary and secondary menus for Bottom Nav
  const primaryMobileMenus = menuItems.slice(0, 4); // Dashboard, Calendar, Customers, Inventory
  const secondaryMobileMenus = menuItems.slice(4); // Billing, Finance, Staff, Maintenance, Settings

  return (
    <>
      {/* ===== BOTTOM NAV BAR (MOBILE ONLY) ===== */}
      <nav className="bottom-nav-bar">
        {primaryMobileMenus.filter((item) => hasPermission(userProfile, ROUTE_PERMISSIONS[item.path])).map((item) => {
          const isActive = location.pathname.startsWith(item.path) || (item.path === '/dashboard' && location.pathname === '/');
          return (
            <NavLink 
              key={item.path}
              to={item.path} 
              className={`bn-item ${isActive ? 'active' : ''}`}
            >
              <motion.div whileTap={navTap} className="bn-icon-wrapper">
                {item.icon}
                {isActive && <motion.div layoutId="bn-indicator" className="bn-indicator" transition={activeIndicatorTransition} />}
              </motion.div>
              <span className="bn-label">{item.label === 'Dashboard' ? 'Home' : item.label}</span>
            </NavLink>
          );
        })}
        <button 
          className="bn-item" 
          onClick={() => setMobileOpen(true)}
          aria-label="Menu Lainnya"
          aria-haspopup="dialog"
          aria-expanded={mobileOpen}
        >
          <motion.div whileTap={navTap} className="bn-icon-wrapper">
            <MoreHorizontal size={19} />
          </motion.div>
          <span className="bn-label">Lainnya</span>
        </button>
      </nav>

      {/* ===== MOBILE "MORE" BOTTOM SHEET ===== */}
      <Modal 
        isOpen={mobileOpen} 
        onClose={() => setMobileOpen(false)} 
        className="mobile-bottom-sheet"
        preset={{ variants: bottomSheetVariants, initial: 'hidden', animate: 'visible', exit: 'exit', transition: { type: 'spring', stiffness: 300, damping: 30 } }}
      >
        <div className="bottom-sheet-header">
          <div className="sheet-drag-handle" />
          <h3>Menu Lainnya</h3>
        </div>
        <div className="bottom-sheet-grid">
          {secondaryMobileMenus.filter((item) => hasPermission(userProfile, ROUTE_PERMISSIONS[item.path])).map((item) => (
            <NavLink 
              key={item.path}
              to={item.path} 
              className="sheet-nav-item"
              onClick={() => setMobileOpen(false)}
            >
              <div className="sheet-icon">{item.icon}</div>
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button className="sheet-nav-item text-danger" onClick={handleLogout}>
            <div className="sheet-icon"><LogOut size={19} /></div>
            <span>Logout</span>
          </button>
        </div>
      </Modal>

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className={`sidebar glass-panel ${isCollapsed ? 'collapsed' : ''}`}>
        
        {/* Desktop Collapse Toggle */}
        <button 
          className="collapse-toggle" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Buka sidebar" : "Tutup sidebar"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="logo-icon" style={{ background: 'transparent', boxShadow: 'none', border: 'none', padding: 0 }}>
              <img src="/logo.png" alt="Logo" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
            </div>
            <div className="logo-text-group">
              <h1 className="logo-text">37 STUDIO</h1>
              <span className="logo-subtitle">Music Studio</span>
            </div>
          </div>
          <button 
            className="notification-bell-btn sidebar-bell" 
            onClick={() => setIsNotifOpen(true)}
            aria-label="Buka panel notifikasi"
          >
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
            variants={sidebarContainerVariants}
            style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}
          >
            {menuItems.filter((item) => hasPermission(userProfile, ROUTE_PERMISSIONS[item.path])).map((item) => {
              const isActive = location.pathname.startsWith(item.path) || (item.path === '/dashboard' && location.pathname === '/');
              return (
                <motion.div
                  key={item.path}
                  variants={sidebarItemVariants}
                >
                  <NavLink 
                    to={item.path} 
                    className={`nav-item ${item.tourClass} ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="sidebar-active-indicator"
                        className="nav-active-bg"
                        initial={false}
                        transition={activeIndicatorTransition}
                      />
                    )}
                    <span className="nav-icon" style={{ position: 'relative', zIndex: 1 }}>{item.icon}</span>
                    <span className="nav-label" style={{ position: 'relative', zIndex: 1 }}>{item.label}</span>
                    <ChevronRight size={14} className="nav-chevron" style={{ position: 'relative', zIndex: 1 }} />
                  </NavLink>
                </motion.div>
              );
            })}
          </motion.div>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {/* Demo Mode Badge */}
          {isDemoMode && (
            <div className="demo-mode-badge">
              <button
                className="demo-badge-link"
                onClick={() => { navigate('/settings'); setMobileOpen(false); }}
                title="Mode Demo Aktif — klik untuk ke Settings"
                aria-label="Mode Demo Aktif, klik untuk membuka Pengaturan"
              >
                <span className="demo-badge-dot" />
                <FlaskConical size={13} color="#a855f7" />
                <span className="demo-badge-text">Demo Mode</span>
              </button>
              <button 
                className="demo-badge-off" 
                onClick={toggleDemoMode}
                title="Nonaktifkan Mode Demo"
                aria-label="Nonaktifkan Mode Demo"
              >
                ✕ OFF
              </button>
            </div>
          )}

          {/* Theme Toggle */}
          <button className="theme-toggle-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <span className="nav-icon" style={{ flexShrink: 0 }}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </span>
            <span className="nav-label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <div className="sidebar-divider" />
          
          <div className="user-profile">
            <button 
              className="user-profile-btn" 
              onClick={() => setIsProfileOpen(true)}
              title="Edit Profil"
              aria-label={`Buka Profil ${displayName}`}
            >
              <div className="avatar">{avatarLetter}</div>
              <div className="user-info">
                <span className="user-name" title={user?.email || ''}>{displayName}</span>
                <span className="user-role">{userProfile?.role === 'admin' ? 'Administrator' : 'Staff'}</span>
              </div>
            </button>
            <button 
              className="sidebar-logout-btn" 
              onClick={handleLogout} 
              title="Logout"
              aria-label="Logout"
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
