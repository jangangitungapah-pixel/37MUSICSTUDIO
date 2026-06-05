import { MoreHorizontal } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { ROUTE_PERMISSIONS, hasPermission } from '../../lib/permissions';

const BottomNav = ({ primaryItems, userProfile, location, onNavigate, onMore, isMoreOpen }) => (
  <nav className="bottom-nav-bar">
    {primaryItems.filter((item) => hasPermission(userProfile, ROUTE_PERMISSIONS[item.path])).map((item) => {
      const isActive = location.pathname.startsWith(item.path) || (item.path === '/dashboard' && location.pathname === '/');
      return (
        <NavLink
          key={item.path}
          to={item.path}
          className={`bn-item ${isActive ? 'active' : ''}`}
          onClick={onNavigate}
        >
          <div className="bn-icon-wrapper">
            {item.icon}
          </div>
          <span className="bn-label">{item.label === 'Dashboard' ? 'Home' : item.label}</span>
        </NavLink>
      );
    })}
    <button
      type="button"
      className="bn-item"
      onClick={onMore}
      aria-label="Menu Lainnya"
      aria-haspopup="dialog"
      aria-expanded={isMoreOpen}
    >
      <div className="bn-icon-wrapper">
        <MoreHorizontal size={19} />
      </div>
      <span className="bn-label">Lainnya</span>
    </button>
  </nav>
);

export default BottomNav;
