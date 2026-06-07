import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, LayoutDashboard, LogOut, MessageCircle, ReceiptText, UserRound } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useBookingStore } from '../store/useBookingStore';
import { useClientMessageStore } from '../store/useClientMessageStore';
import { useSettingsStore } from '../store/useSettingsStore';

const clean = (value) => String(value || '').trim().toLowerCase();
const digits = (value) => String(value || '').replace(/\D/g, '');

const navItems = [
  { label: 'Dashboard', to: '/client/dashboard', icon: LayoutDashboard, match: ['/client/dashboard'] },
  { label: 'Jadwal', to: '/jadwal-publik', icon: Calendar, match: ['/jadwal-publik'] },
  { label: 'Billing', to: '/client/billing', icon: ReceiptText, match: ['/client/billing'], badgeKey: 'billing' },
  { label: 'Pesan', to: '/client/messages', icon: MessageCircle, match: ['/client/messages'], badgeKey: 'messages' },
  { label: 'Profil', to: '/client/profile', icon: UserRound, match: ['/client/profile'], badgeKey: 'profile' },
];

const matchClientRecord = (record, signals) => {
  if (!record) return false;

  const uidFields = [
    record.clientUid,
    record.customerUid,
    record.userId,
    record.uid,
    record.createdBy,
    record.ownerUid,
  ].map(clean).filter(Boolean);

  if (signals.uid && uidFields.includes(signals.uid)) return true;

  const linkedFields = [
    record.linkedCustomerId,
    record.customerId,
    record.clientId,
  ].map(clean).filter(Boolean);

  if (signals.linkedCustomerId && linkedFields.includes(signals.linkedCustomerId)) return true;

  const emailFields = [
    record.clientEmail,
    record.customerEmail,
    record.email,
    record.userEmail,
  ].map(clean).filter(Boolean);

  if (signals.email && emailFields.includes(signals.email)) return true;

  const phoneFields = [
    record.clientPhone,
    record.customerPhone,
    record.phone,
    record.whatsapp,
    record.wa,
  ].map(digits).filter(Boolean);

  if (signals.phone && phoneFields.includes(signals.phone)) return true;

  return false;
};

const calculateBookingTotal = (booking, pricePerHour) => {
  const subtotal = booking.type === 'recording'
    ? Number(booking.sessionPrice || booking.estimatedPrice || booking.totalPrice || 0)
    : Number(booking.duration || 0) * Number(pricePerHour || 0);

  return subtotal + Number(booking.equipmentCost || 0) - Number(booking.discountAmount || 0);
};

const calculateRemaining = (booking, pricePerHour) => {
  if (clean(booking.status) === 'confirmed') return 0;
  const total = calculateBookingTotal(booking, pricePerHour);
  if (clean(booking.status) === 'dp') return Math.max(0, total - Number(booking.dpAmount || 0));
  return total;
};

const formatBadgeNumber = (value) => {
  const count = Number(value || 0);
  if (count <= 0) return '';
  return count > 9 ? '9+' : String(count);
};

const ClientPortalNav = ({ title = 'Client Portal', onLogout }) => {
  const location = useLocation();
  const { user, userProfile } = useAuthStore();
  const { bookings } = useBookingStore();
  const { messages } = useClientMessageStore();
  const { pricePerHour } = useSettingsStore();

  const signals = useMemo(() => ({
    uid: clean(user?.uid),
    email: clean(user?.email || userProfile?.email),
    phone: digits(userProfile?.phone),
    linkedCustomerId: clean(userProfile?.linkedCustomerId),
  }), [user?.uid, user?.email, userProfile?.email, userProfile?.phone, userProfile?.linkedCustomerId]);

  const navBadges = useMemo(() => {
    const activeBillingCount = (bookings || [])
      .filter((booking) => !['maintenance', 'cancelled'].includes(clean(booking.status)))
      .filter((booking) => matchClientRecord(booking, signals))
      .filter((booking) => calculateRemaining(booking, pricePerHour) > 0)
      .length;

    const openMessageCount = (messages || [])
      .filter((message) => {
        const status = clean(message.status || 'open');
        return status !== 'done' && status !== 'replied';
      })
      .length;

    const profileNeedsAttention = !digits(userProfile?.phone) || !userProfile?.linkedCustomerId;

    return {
      billing: formatBadgeNumber(activeBillingCount),
      messages: formatBadgeNumber(openMessageCount),
      profile: profileNeedsAttention ? '!' : '',
    };
  }, [bookings, messages, pricePerHour, signals, userProfile?.phone, userProfile?.linkedCustomerId]);

  return (
    <nav className="client-nav client-dashboard-nav client-unified-nav">
      <Link to="/client/dashboard" className="client-brand">
        <span className="client-brand-mark">37</span>
        <span>{title}</span>
      </Link>

      <div className="client-nav-actions client-unified-nav-actions">
        {navItems.map(({ label, to, icon: Icon, match, badgeKey }) => {
          const isActive = match.some((path) => location.pathname === path);
          const badge = badgeKey ? navBadges[badgeKey] : '';

          return (
            <Link
              key={to}
              to={to}
              className={'client-ghost-btn client-nav-pill ' + (isActive ? 'active' : '') + (badge ? ' has-badge' : '')}
              aria-current={isActive ? 'page' : undefined}
              aria-label={badge ? label + ', ada update ' + badge : label}
            >
              <Icon size={15} />
              <span>{label}</span>
              {badge && <em className={'client-nav-badge badge-' + badgeKey}>{badge}</em>}
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
