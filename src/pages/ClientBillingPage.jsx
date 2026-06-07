import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useAuthStore } from '../store/useAuthStore';
import { useBookingStore } from '../store/useBookingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useNotificationStore } from '../store/useNotificationStore';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  FileText,
  MessageCircle,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  WalletCards
} from 'lucide-react';
import ClientPortalNav from '../components/ClientPortalNav';
import './ClientPortal.css';

const clean = (value) => String(value || '').trim().toLowerCase();
const digits = (value) => String(value || '').replace(/\D/g, '');

const formatMoney = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const formatDateLabel = (dateStr) => {
  if (!dateStr) return 'Tanggal belum ada';

  try {
    return format(new Date(dateStr + 'T00:00:00'), 'EEEE, dd MMM yyyy', { locale: localeId });
  } catch {
    return dateStr;
  }
};

const formatTimeLabel = (hour, duration = 1) => {
  const start = Number(hour || 0);
  const end = start + Number(duration || 1);
  return String(start).padStart(2, '0') + '.00 - ' + String(end).padStart(2, '0') + '.00';
};

const statusLabel = (status) => {
  const normalized = clean(status);
  if (normalized === 'confirmed') return 'Lunas';
  if (normalized === 'dp') return 'DP';
  if (normalized === 'cancelled') return 'Dibatalkan';
  if (normalized === 'maintenance') return 'Maintenance';
  return 'Belum Bayar';
};

const statusTone = (status) => {
  const normalized = clean(status);
  if (normalized === 'confirmed') return 'green';
  if (normalized === 'dp') return 'gold';
  if (normalized === 'cancelled') return 'red';
  return 'cyan';
};

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

const calculateSubtotal = (booking, pricePerHour) => {
  if (booking.type === 'recording') {
    return Number(booking.sessionPrice || booking.estimatedPrice || booking.totalPrice || 0);
  }

  return Number(booking.duration || 0) * Number(pricePerHour || 0);
};

const calculateTotal = (booking, pricePerHour) => {
  const subtotal = calculateSubtotal(booking, pricePerHour);
  return subtotal + Number(booking.equipmentCost || 0) - Number(booking.discountAmount || 0);
};

const calculateRemaining = (booking, pricePerHour) => {
  if (booking.status === 'confirmed') return 0;
  const total = calculateTotal(booking, pricePerHour);
  if (booking.status === 'dp') return Math.max(0, total - Number(booking.dpAmount || 0));
  return total;
};

const getServiceName = (booking) => (
  booking.type === 'recording' ? 'Sesi Recording' : 'Sewa Studio Latihan'
);

const buildInvoiceText = ({ booking, pricePerHour, studioName, studioAddress, studioPhone }) => {
  const subtotal = calculateSubtotal(booking, pricePerHour);
  const discount = Number(booking.discountAmount || 0);
  const total = calculateTotal(booking, pricePerHour);
  const dp = Number(booking.dpAmount || 0);
  const remaining = calculateRemaining(booking, pricePerHour);

  const lines = [
    '━━━━━━━━━━━━━━━━━━',
    '📄 INVOICE — ' + studioName,
    '━━━━━━━━━━━━━━━━━━',
    'No: INV-' + String(booking.id || '').padStart(5, '0'),
    'Tanggal: ' + format(new Date(), 'dd MMM yyyy'),
    'Status: ' + statusLabel(booking.status).toUpperCase(),
    '',
    'Pelanggan: ' + (booking.band || booking.clientName || 'Client'),
    booking.phone ? 'Telp: ' + booking.phone : null,
    '',
    'Layanan: ' + getServiceName(booking),
    'Jadwal: ' + formatDateLabel(booking.date) + ' • ' + formatTimeLabel(booking.hour, booking.duration),
    'Durasi: ' + Number(booking.duration || 1) + ' jam',
    '',
    'Subtotal: ' + formatMoney(subtotal),
    discount > 0 ? 'Diskon: -' + formatMoney(discount) : null,
    dp > 0 ? 'DP: -' + formatMoney(dp) : null,
    '━━━━━━━━━━━━━━━━━━',
    booking.status === 'confirmed'
      ? 'TOTAL DIBAYAR: ' + formatMoney(total)
      : 'SISA TAGIHAN: ' + formatMoney(remaining),
    '━━━━━━━━━━━━━━━━━━',
    '',
    studioName,
    studioAddress,
    studioPhone ? 'Telp: ' + studioPhone : null,
  ].filter(Boolean);

  return lines.join('\n');
};

const ClientBillingPage = () => {
  const { user, userProfile, isAuthLoaded, logout } = useAuthStore();
  const { bookings, isLoaded } = useBookingStore();
  const { pricePerHour, studioName, studioAddress, studioPhone } = useSettingsStore();
  const addNotification = useNotificationStore((state) => state.addNotification);

  const [searchTerm, setSearchTerm] = useState('');

  const displayName =
    userProfile?.displayName ||
    userProfile?.username ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'Client';

  const firstLetter = displayName?.trim()?.charAt(0)?.toUpperCase() || 'C';

  const signals = useMemo(() => ({
    uid: clean(user?.uid),
    email: clean(user?.email || userProfile?.email),
    phone: digits(userProfile?.phone),
    linkedCustomerId: clean(userProfile?.linkedCustomerId),
  }), [user?.uid, user?.email, userProfile?.email, userProfile?.phone, userProfile?.linkedCustomerId]);

  const clientBookings = useMemo(() => {
    return (bookings || [])
      .filter((booking) => !['maintenance', 'cancelled'].includes(clean(booking.status)))
      .filter((booking) => matchClientRecord(booking, signals));
  }, [bookings, signals]);

  const filteredInvoices = useMemo(() => {
    const query = clean(searchTerm);

    return clientBookings
      .filter((booking) => {
        if (!query) return true;

        const haystack = clean([
          booking.band,
          booking.clientName,
          booking.date,
          booking.status,
          booking.phone,
          booking.id,
        ].filter(Boolean).join(' '));

        return haystack.includes(query);
      })
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || Number(b.hour || 0) - Number(a.hour || 0));
  }, [clientBookings, searchTerm]);

  const totals = useMemo(() => {
    return clientBookings.reduce((acc, booking) => {
      const total = calculateTotal(booking, pricePerHour);
      const paid = booking.status === 'confirmed'
        ? total
        : booking.status === 'dp'
          ? Number(booking.dpAmount || 0)
          : 0;

      const remaining = calculateRemaining(booking, pricePerHour);

      return {
        totalInvoice: acc.totalInvoice + total,
        totalPaid: acc.totalPaid + paid,
        totalRemaining: acc.totalRemaining + remaining,
        activeBills: acc.activeBills + (remaining > 0 ? 1 : 0),
      };
    }, {
      totalInvoice: 0,
      totalPaid: 0,
      totalRemaining: 0,
      activeBills: 0,
    });
  }, [clientBookings, pricePerHour]);

  const copyInvoice = async (booking) => {
    const text = buildInvoiceText({
      booking,
      pricePerHour,
      studioName,
      studioAddress,
      studioPhone,
    });

    try {
      await navigator.clipboard.writeText(text);
      addNotification({
        type: 'customer',
        title: 'Invoice disalin',
        message: 'Teks invoice berhasil disalin ke clipboard.',
      });
    } catch {
      addNotification({
        type: 'error',
        title: 'Gagal menyalin invoice',
        message: 'Browser tidak mengizinkan akses clipboard.',
      });
    }
  };

  const shareInvoiceWhatsApp = (booking) => {
    const text = buildInvoiceText({
      booking,
      pricePerHour,
      studioName,
      studioAddress,
      studioPhone,
    });

    const phone = digits(booking.phone || booking.clientPhone || userProfile?.phone);
    const normalizedPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const url = 'https://wa.me/' + normalizedPhone + '?text=' + encodeURIComponent(text);
    window.open(url, '_blank');
  };

  if (!isAuthLoaded) {
    return (
      <div className="client-portal-loader">
        <div className="client-loader-card">
          <div className="client-loader-logo">37</div>
          <span>Memuat billing...</span>
        </div>
      </div>
    );
  }

  if (!user || user.isAnonymous) {
    return <Navigate to="/client" replace />;
  }

  return (
    <main className="client-portal-page client-dashboard-page client-billing-page">
      <div className="client-ambient-bg" aria-hidden="true">
        <span className="client-blob client-blob-pink" />
        <span className="client-blob client-blob-cyan" />
      </div>
      <ClientPortalNav title="Client Billing" onLogout={logout} />

      <section className="client-billing-hero">
        <div>
          <div className="client-kicker">
            <Sparkles size={16} />
            <span>Invoice Client</span>
          </div>

          <h1>Billing studio kamu.</h1>
          <p>
            Lihat invoice, DP, sisa pembayaran, dan status lunas dari booking studio yang terhubung ke akun client kamu.
          </p>
        </div>

        <aside className="client-profile-card client-billing-profile-card">
          <div className="client-profile-avatar">{firstLetter}</div>
          <div className="client-profile-copy">
            <span>Billing untuk</span>
            <strong>{displayName}</strong>
            <small>{user?.email || userProfile?.email || 'Akun client'}</small>
          </div>
          <div className="client-profile-status">
            <ShieldCheck size={15} />
            {isLoaded ? 'Sinkron' : 'Memuat...'}
          </div>
        </aside>
      </section>

      <section className="client-dashboard-grid client-billing-stats" aria-label="Ringkasan billing client">
        <article className="client-stat-card client-stat-gold">
          <div className="client-stat-top">
            <span className="client-stat-icon"><ReceiptText size={20} /></span>
            <span>Total Invoice</span>
          </div>
          <strong>{formatMoney(totals.totalInvoice)}</strong>
          <small>Akumulasi semua invoice booking kamu.</small>
        </article>

        <article className="client-stat-card client-stat-green">
          <div className="client-stat-top">
            <span className="client-stat-icon"><CheckCircle2 size={20} /></span>
            <span>Sudah Dibayar</span>
          </div>
          <strong>{formatMoney(totals.totalPaid)}</strong>
          <small>Total pembayaran yang sudah tercatat.</small>
        </article>

        <article className="client-stat-card client-stat-pink">
          <div className="client-stat-top">
            <span className="client-stat-icon"><WalletCards size={20} /></span>
            <span>Sisa Tagihan</span>
          </div>
          <strong>{formatMoney(totals.totalRemaining)}</strong>
          <small>{totals.activeBills} invoice masih perlu diselesaikan.</small>
        </article>
      </section>

      <section className="client-billing-guide-strip" aria-label="Panduan billing client">
        <article className="client-billing-guide-card primary">
          <div className="client-billing-guide-icon">
            <WalletCards size={20} />
          </div>
          <div>
            <span>Sisa pembayaran</span>
            <strong>{formatMoney(totals.totalRemaining)}</strong>
            <p>{totals.activeBills > 0 ? totals.activeBills + " invoice masih perlu diselesaikan." : "Semua invoice yang tercatat sudah aman."}</p>
          </div>
        </article>

        <article className="client-billing-guide-card">
          <div className="client-billing-guide-icon">
            <ReceiptText size={20} />
          </div>
          <div>
            <span>Status invoice</span>
            <strong>{totals.activeBills > 0 ? "Perlu dicek" : "Aman"}</strong>
            <p>Gunakan Copy Invoice untuk menyimpan detail invoice atau Share WA untuk follow up cepat.</p>
          </div>
        </article>

        <article className="client-billing-guide-card action">
          <div className="client-billing-guide-icon">
            <MessageCircle size={20} />
          </div>
          <div>
            <span>Butuh bantuan?</span>
            <strong>Chat admin</strong>
            <p>Tanya pembayaran, DP, bukti transfer, atau koreksi invoice langsung dari portal.</p>
          </div>
          <Link to="/client/messages" className="client-billing-guide-link">
            Message Admin
            <ChevronRight size={15} />
          </Link>
        </article>
      </section>

      <section className="client-panel client-billing-list-panel">
        <div className="client-panel-header">
          <div>
            <span>Daftar Invoice</span>
            <h2>{filteredInvoices.length > 0 ? 'Invoice terbaru.' : 'Belum ada invoice.'}</h2>
          </div>
          <FileText size={20} />
        </div>

        <label className="client-billing-search">
          <Search size={16} />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari tanggal, band, status, invoice..."
          />
        </label>

        {filteredInvoices.length > 0 ? (
          <div className="client-invoice-list">
            {filteredInvoices.map((booking) => {
              const total = calculateTotal(booking, pricePerHour);
              const remaining = calculateRemaining(booking, pricePerHour);
              const dp = Number(booking.dpAmount || 0);

              return (
                <article className="client-invoice-card" key={booking.id}>
                  <div className="client-invoice-top">
                    <div>
                      <span>INV-{String(booking.id || '').padStart(5, '0')}</span>
                      <strong>{booking.band || booking.clientName || 'Sesi Studio'}</strong>
                      <p>{formatDateLabel(booking.date)} • {formatTimeLabel(booking.hour, booking.duration)}</p>
                    </div>

                    <span className={'client-status-pill status-' + statusTone(booking.status)}>
                      {statusLabel(booking.status)}
                    </span>
                  </div>

                  <div className="client-invoice-money-grid">
                    <div>
                      <small>Total</small>
                      <strong>{formatMoney(total)}</strong>
                    </div>
                    <div>
                      <small>DP</small>
                      <strong>{formatMoney(dp)}</strong>
                    </div>
                    <div>
                      <small>Sisa</small>
                      <strong>{formatMoney(remaining)}</strong>
                    </div>
                  </div>

                  <div className="client-invoice-actions">
                    <button type="button" onClick={() => copyInvoice(booking)}>
                      <Copy size={15} />
                      Copy Invoice
                    </button>
                    <button type="button" onClick={() => shareInvoiceWhatsApp(booking)}>
                      <MessageCircle size={15} />
                      Share WA
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="client-empty-state">
            <div className="client-empty-icon">
              <Clock3 size={22} />
            </div>
            <div>
              <strong>{isLoaded ? 'Belum ada invoice yang tersambung.' : 'Memuat invoice...'}</strong>
              <p>Invoice akan muncul setelah admin membuat booking atau approve request yang terhubung ke akun client kamu.</p>
            </div>
          </div>
        )}

        <Link to="/jadwal-publik" className="client-panel-link">
          Booking jadwal baru
          <Calendar size={16} />
          <ChevronRight size={16} />
        </Link>
      </section>
    </main>
  );
};

export default ClientBillingPage;
