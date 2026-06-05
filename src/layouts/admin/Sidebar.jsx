import { useState } from 'react';
import { CalendarDays, Users, Package, CreditCard, Settings, BookOpen, PieChart, LogOut, Bell, ChevronRight, ChevronLeft, FlaskConical, Sun, Moon, Shield, Hammer, Image, Volume2, VolumeX } from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useDemoStore } from '../../store/useDemoStore';
import { ROUTE_PERMISSIONS, hasPermission } from '../../lib/permissions';
import ProfileModal from '../../components/ProfileModal';
import NotificationPanel from '../../components/NotificationPanel';
import Modal from '../../components/Modal';
import BottomNav from './BottomNav';
import '../../components/Sidebar.css';

const UI_CLICK_SOUND = '/click.wav';

const playUiSound = (volume) => {
  const audio = new Audio(UI_CLICK_SOUND);
  audio.volume = volume;
  audio.play().catch(() => {});
};
 
const AnimativeSwitch = ({ checked, onChange, type, ariaLabel, disabled }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`anim-switch anim-switch-${type} ${checked ? 'on' : 'off'}`}
      onClick={onChange}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      <div
        className="anim-switch-handle"
      >
        <div
          className="anim-switch-icon-wrapper"
        >
          {type === 'theme' ? (
            checked ? (
              <Sun size={12} className="icon-sun" />
            ) : (
              <Moon size={12} className="icon-moon" />
            )
          ) : (
            checked ? (
              <Volume2 size={12} className="icon-volume-on" />
            ) : (
              <VolumeX size={12} className="icon-volume-off" />
            )
          )}
        </div>
      </div>
    </button>
  );
};

const Sidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false); // Used for the "More" bottom sheet now
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const { user, userProfile, logout } = useAuthStore();
  const { notifications } = useNotificationStore();
  const { isDemoMode, toggleDemoMode } = useDemoStore();
  const { theme, toggleTheme, soundEnabled, toggleSound } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const playClick = () => { if (soundEnabled) playUiSound(0.25); };
  const playHover = () => { if (soundEnabled) playUiSound(0.08); };
 
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
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
  const currentMenu = menuItems.find((item) => location.pathname.startsWith(item.path)) || menuItems[0];
  const currentRoleLabel = userProfile?.role === 'admin' ? 'Administrator' : 'Staff';

  return (
    <>
      {/* ===== MOBILE COMMAND HEADER ===== */}
      <header className="mobile-command-header">
        <div className="mobile-brand-lockup">
          <div className="mobile-brand-mark">
            <span className="brand-monogram" aria-hidden="true">37</span>
          </div>
          <div className="mobile-brand-copy">
            <span className="mobile-eyebrow">37 Music Studio</span>
            <h1>{currentMenu.label}</h1>
            <span>{currentRoleLabel}</span>
          </div>
        </div>
        <div className="mobile-header-actions">
          <button
            type="button"
            className="mobile-icon-btn"
            onClick={() => { toggleSound(); if (!soundEnabled) playUiSound(0.25); }}
            title={soundEnabled ? 'Matikan Efek Suara' : 'Aktifkan Efek Suara'}
            aria-label={soundEnabled ? 'Matikan Efek Suara' : 'Aktifkan Efek Suara'}
          >
            {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <button
            type="button"
            className="mobile-icon-btn"
            onClick={() => { playClick(); toggleTheme(); }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={theme === 'dark' ? 'Aktifkan Light Mode' : 'Aktifkan Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            type="button"
            className="mobile-icon-btn notification-bell-btn"
            onClick={() => { playClick(); setIsNotifOpen(true); }}
            aria-label="Buka panel notifikasi"
          >
            <Bell size={17} />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </button>
          <button
            type="button"
            className="mobile-avatar-btn"
            onClick={() => { playClick(); setIsProfileOpen(true); }}
            aria-label={`Buka Profil ${displayName}`}
          >
            {avatarLetter}
          </button>
        </div>
      </header>

      {/* ===== BOTTOM NAV BAR (MOBILE ONLY) ===== */}
      <BottomNav
        primaryItems={primaryMobileMenus}
        userProfile={userProfile}
        location={location}
        onNavigate={playClick}
        onMore={() => { playClick(); setMobileOpen(true); }}
        isMoreOpen={mobileOpen}
      />
 
      {/* ===== MOBILE "MORE" BOTTOM SHEET ===== */}
      <Modal 
        isOpen={mobileOpen} 
        onClose={() => setMobileOpen(false)} 
        className="mobile-bottom-sheet"
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
              onClick={() => { playClick(); setMobileOpen(false); }}
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
          onClick={() => { playClick(); setIsCollapsed(!isCollapsed); }}
          onMouseEnter={playHover}
          aria-label={isCollapsed ? "Buka sidebar" : "Tutup sidebar"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="logo-icon">
              <span className="brand-monogram" aria-hidden="true">37</span>
            </div>
            <div className="logo-text-group">
              <h1 className="logo-text">37 STUDIO</h1>
              <span className="logo-subtitle">Music Studio</span>
            </div>
          </div>
          <button 
            className="notification-bell-btn sidebar-bell" 
            onClick={() => { playClick(); setIsNotifOpen(true); }}
            onMouseEnter={playHover}
            aria-label="Buka panel notifikasi"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <span className="nav-section-label">MENU</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {menuItems.filter((item) => hasPermission(userProfile, ROUTE_PERMISSIONS[item.path])).map((item) => {
              const isActive = location.pathname.startsWith(item.path) || (item.path === '/dashboard' && location.pathname === '/');
              return (
                <div key={item.path}>
                  <NavLink 
                    to={item.path} 
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => { playClick(); setMobileOpen(false); }}
                    onMouseEnter={playHover}
                  >
                    <span className="nav-icon" style={{ position: 'relative', zIndex: 1 }}>{item.icon}</span>
                    <span className="nav-label" style={{ position: 'relative', zIndex: 1 }}>{item.label}</span>
                    <ChevronRight size={14} className="nav-chevron" style={{ position: 'relative', zIndex: 1 }} />
                  </NavLink>
                </div>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {/* Demo Mode Badge */}
          {isDemoMode && (
            <div className="demo-mode-badge">
              <button
                className="demo-badge-link"
                onClick={() => { navigate('/settings'); setMobileOpen(false); }}
                onMouseEnter={playHover}
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
                onMouseEnter={playHover}
                title="Nonaktifkan Mode Demo"
                aria-label="Nonaktifkan Mode Demo"
              >
                ✕ OFF
              </button>
            </div>
          )}

          {/* Sound Toggle */}
          {isCollapsed ? (
            <button 
              className="theme-toggle-btn" 
              onClick={toggleSound} 
              onMouseEnter={playHover} 
              title={soundEnabled ? 'Matikan Efek Suara' : 'Aktifkan Efek Suara'}
              aria-label={soundEnabled ? 'Matikan Efek Suara' : 'Aktifkan Efek Suara'}
            >
              <span className="nav-icon" style={{ flexShrink: 0 }}>
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </span>
            </button>
          ) : (
            <div className="sidebar-toggle-row">
              <div className="sidebar-toggle-info">
                <span className="nav-icon" style={{ flexShrink: 0 }}>
                  {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </span>
                <span className="nav-label">{soundEnabled ? 'Sound FX On' : 'Sound FX Off'}</span>
              </div>
              <AnimativeSwitch 
                checked={soundEnabled} 
                onChange={toggleSound} 
                type="sound"
                ariaLabel="Toggle Sound FX" 
              />
            </div>
          )}

          {/* Theme Toggle */}
          {isCollapsed ? (
            <button 
              className="theme-toggle-btn" 
              onClick={toggleTheme} 
              onMouseEnter={playHover} 
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={theme === 'dark' ? 'Aktifkan Light Mode' : 'Aktifkan Dark Mode'}
            >
              <span className="nav-icon" style={{ flexShrink: 0 }}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </span>
            </button>
          ) : (
            <div className="sidebar-toggle-row">
              <div className="sidebar-toggle-info">
                <span className="nav-icon" style={{ flexShrink: 0 }}>
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </span>
                <span className="nav-label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
              <AnimativeSwitch 
                checked={theme === 'light'} 
                onChange={toggleTheme} 
                type="theme"
                ariaLabel="Toggle Light Mode" 
              />
            </div>
          )}

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
              onMouseEnter={playHover}
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
