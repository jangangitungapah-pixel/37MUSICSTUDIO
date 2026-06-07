import { Link, useLocation } from 'react-router-dom';
import { Calendar, LayoutDashboard, LogOut, ReceiptText, UserRound, MessageCircle } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', to: '/client/dashboard', icon: LayoutDashboard, match: ['/client/dashboard'] },
  { label: 'Jadwal', to: '/jadwal-publik', icon: Calendar, match: ['/jadwal-publik'] },
  { label: 'Billing', to: '/client/billing', icon: ReceiptText, match: ['/client/billing'] },
  { label: 'Pesan', to: '/client/messages', icon: MessageCircle, match: ['/client/messages'] },
  { label: 'Profil', to: '/client/profile', icon: UserRound, match: ['/client/profile'] },
];

const ClientPortalNav = ({ title = 'Client Portal', onLogout }) => {
  const location = useLocation();

  return (
    <nav className="client-nav client-dashboard-nav client-unified-nav">
      <Link to="/client/dashboard" className="client-brand">
        <span className="client-brand-mark">37</span>
        <span>{title}</span>
      </Link>

      <div className="client-nav-actions client-unified-nav-actions">
        {navItems.map(({ label, to, icon: Icon, match }) => {
          const isActive = match.some((path) => location.pathname === path);

          return (
            <Link
              key={to}
              to={to}
              className={'client-ghost-btn client-nav-pill ' + (isActive ? 'active' : '')}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={15} />
              <span>{label}</span>
            </Link>
          );
        })}

        <button type="button" className="client-ghost-btn client-nav-pill client-nav-logout" onClick={onLogout}>
          <LogOut size={15} />
          <span>Keluar</span>
        </button>
      </div>
    </nav>
  );
};

export default ClientPortalNav;
