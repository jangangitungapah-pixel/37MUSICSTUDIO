import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Calendar,
  ChevronRight,
  Clock3,
  History,
  Loader2,
  LogOut,
  MessageCircle,
  Mic2,
  Music2,
  ReceiptText,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useBookingStore } from '../store/useBookingStore';
import { useBookingRequestStore } from '../store/useBookingRequestStore';
import { useClientMessageStore } from '../store/useClientMessageStore';
import { useNotificationStore } from '../store/useNotificationStore';
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
  if (normalized === 'confirmed') return 'Confirmed';
  if (normalized === 'dp') return 'DP';
  if (normalized === 'approved') return 'Approved';
  if (normalized === 'replied') return 'Dibalas';
  if (normalized === 'done') return 'Selesai';
  if (normalized === 'rejected') return 'Ditolak';
  if (normalized === 'cancelled') return 'Dibatalkan';
  if (normalized === 'maintenance') return 'Maintenance';
  return 'Pending';
};

const statusTone = (status) => {
  const normalized = clean(status);
  if (['confirmed', 'approved', 'done'].includes(normalized)) return 'green';
  if (normalized === 'dp') return 'gold';
  if (['cancelled', 'rejected'].includes(normalized)) return 'red';
  return 'cyan';
};

const getRecordPrice = (record) => Number(
  record?.estimatedPrice ||
  record?.totalPrice ||
  record?.finalPrice ||
  record?.sessionPrice ||
  record?.price ||
  0
);

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

const buildSessionItem = (record, kind) => ({
  id: record.id || record.date + '-' + record.hour + '-' + kind,
  kind,
  title: record.band || record.bandName || record.clientName || record.customerName || 'Sesi Studio',
  date: record.date || '',
  hour: Number(record.hour || 0),
  duration: Number(record.duration || 1),
  status: record.status || 'pending',
  price: getRecordPrice(record),
  raw: record,
});

const ClientDashboardPage = () => {
  const { user, userProfile, isAuthLoaded, logout } = useAuthStore();
  const { bookings, isLoaded: bookingsLoaded } = useBookingStore();
  const { requests, isLoaded: requestsLoaded } = useBookingRequestStore();
  const { messages, addMessage, isLoaded: messagesLoaded } = useClientMessageStore();
  const [messageDraft, setMessageDraft] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const displayName = userProfile?.displayName || userProfile?.username || user?.displayName || user?.email?.split('@')[0] || 'Client';
  const emailLabel = user?.email || userProfile?.email || 'Akun client';
  const firstLetter = displayName?.trim()?.charAt(0)?.toUpperCase() || 'C';

  const signals = useMemo(() => ({
    uid: clean(user?.uid),
    email: clean(user?.email || userProfile?.email),
    phone: digits(userProfile?.phone),
    linkedCustomerId: clean(userProfile?.linkedCustomerId),
  }), [user?.uid, user?.email, userProfile?.email, userProfile?.phone, userProfile?.linkedCustomerId]);

  const clientBookings = useMemo(() => {
    return (bookings || [])
      .filter((booking) => clean(booking.status) !== 'cancelled')
      .filter((booking) => matchClientRecord(booking, signals));
  }, [bookings, signals]);

  const clientRequests = useMemo(() => {
    return (requests || [])
      .filter((request) => clean(request.status) !== 'cancelled')
      .filter((request) => matchClientRecord(request, signals));
  }, [requests, signals]);

  const clientMessages = useMemo(() => {
    return (messages || []).filter((message) => matchClientRecord(message, signals));
  }, [messages, signals]);

  const summary = useMemo(() => {
    const rehearsalBookings = clientBookings.filter((booking) => clean(booking.type) !== 'recording' && clean(booking.status) !== 'maintenance');
    const recordingBookings = clientBookings.filter((booking) => clean(booking.type) === 'recording');
    const totalHours = clientBookings
      .filter((booking) => clean(booking.status) !== 'maintenance')
      .reduce((sum, booking) => sum + Number(booking.duration || 0), 0);

    const activeBills = clientBookings.filter((booking) => ['pending', 'dp'].includes(clean(booking.status)));
    const activeBillAmount = activeBills.reduce((sum, booking) => sum + getRecordPrice(booking), 0);

    return {
      rehearsalCount: rehearsalBookings.length,
      recordingCount: recordingBookings.length,
      totalHours,
      activeBillCount: activeBills.length,
      activeBillAmount,
    };
  }, [clientBookings]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const upcomingSessions = useMemo(() => {
    const bookingItems = clientBookings.map((booking) => buildSessionItem(booking, 'booking'));
    const requestItems = clientRequests.map((request) => buildSessionItem(request, 'request'));

    return [...bookingItems, ...requestItems]
      .filter((item) => item.date >= todayStr)
      .sort((a, b) => (a.date || '').localeCompare(b.date || '') || Number(a.hour || 0) - Number(b.hour || 0))
      .slice(0, 4);
  }, [clientBookings, clientRequests, todayStr]);

  const recentActivities = useMemo(() => {
    const bookingActivities = clientBookings.map((booking) => ({
      id: 'booking-' + (booking.id || booking.date + '-' + booking.hour),
      icon: clean(booking.type) === 'recording' ? Mic2 : Music2,
      title: clean(booking.type) === 'recording' ? 'Recording session' : 'Latihan studio',
      caption: formatDateLabel(booking.date) + ' • ' + formatTimeLabel(booking.hour, booking.duration),
      status: booking.status || 'pending',
      date: booking.updatedAt || booking.createdAt || booking.date || '',
    }));

    const requestActivities = clientRequests.map((request) => ({
      id: 'request-' + (request.id || request.date + '-' + request.hour),
      icon: Calendar,
      title: 'Request booking',
      caption: formatDateLabel(request.date) + ' • ' + formatTimeLabel(request.hour, request.duration),
      status: request.status || 'pending',
      date: request.updatedAt || request.createdAt || request.date || '',
    }));

    const messageActivities = clientMessages.map((message) => ({
      id: 'message-' + (message.id || message.createdAt),
      icon: MessageCircle,
      title: 'Pesan ke admin',
      caption: message.message || 'Pesan client portal',
      status: message.status || 'open',
      date: message.updatedAt || message.createdAt || '',
    }));

    return [...bookingActivities, ...requestActivities, ...messageActivities]
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
      .slice(0, 5);
  }, [clientBookings, clientRequests, clientMessages]);

  const latestMessages = clientMessages.slice(0, 3);
  const isDataLoading = !bookingsLoaded || !requestsLoaded || !messagesLoaded;

  const handleMessageSubmit = async (event) => {
    event.preventDefault();

    const cleanMessage = messageDraft.trim();

    if (cleanMessage.length < 8) {
      useNotificationStore.getState().addNotification({
        type: 'error',
        title: 'Pesan terlalu pendek',
        message: 'Tulis pesan minimal 8 karakter agar admin paham konteksnya.',
      });
      return;
    }

    setIsSendingMessage(true);

    try {
      await addMessage({
        subject: 'Pesan dari Client Portal',
        message: cleanMessage,
        clientName: displayName,
        clientEmail: emailLabel,
        clientPhone: userProfile?.phone || '',
        linkedCustomerId: userProfile?.linkedCustomerId || '',
      });

      setMessageDraft('');
    } catch (error) {
      useNotificationStore.getState().addNotification({
        type: 'error',
        title: 'Pesan gagal dikirim',
        message: error.message || 'Coba lagi beberapa saat lagi.',
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (!isAuthLoaded) {
    return (
      <div className="client-portal-loader">
        <div className="client-loader-card">
          <div className="client-loader-logo">37</div>
          <span>Memuat dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user || user.isAnonymous) {
    return <Navigate to="/client" replace />;
  }

  const clientStats = [
    {
      label: 'Total Latihan',
      value: summary.rehearsalCount,
      caption: 'Sesi latihan yang terhubung ke akun kamu.',
      icon: Music2,
      tone: 'pink',
    },
    {
      label: 'Recording',
      value: summary.recordingCount,
      caption: 'Session recording dan take vokal.',
      icon: Mic2,
      tone: 'cyan',
    },
    {
      label: 'Jam Studio',
      value: summary.totalHours,
      caption: 'Akumulasi durasi pemakaian studio.',
      icon: Clock3,
      tone: 'gold',
    },
    {
      label: 'Tagihan Aktif',
      value: summary.activeBillCount,
      caption: summary.activeBillAmount > 0 ? formatMoney(summary.activeBillAmount) : 'Belum ada tagihan aktif.',
      icon: ReceiptText,
      tone: 'green',
    },
  ];

  return (
    <main className="client-portal-page client-dashboard-page">
      <div className="client-ambient-bg" aria-hidden="true">
        <span className="client-blob client-blob-pink" />
        <span className="client-blob client-blob-cyan" />
      </div>

      <nav className="client-nav client-dashboard-nav">
        <Link to="/client/dashboard" className="client-brand">
          <span className="client-brand-mark">37</span>
          <span>Client Portal</span>
        </Link>

        <div className="client-nav-actions">
          <Link to="/jadwal-publik" className="client-ghost-btn">
            <Calendar size={15} />
            Cek Slot
          </Link>
          <Link to="/client/profile" className="client-ghost-btn">
            <UserRound size={15} />
            Profil
          </Link>
          <button type="button" className="client-ghost-btn" onClick={logout}>
            <LogOut size={15} />
            Keluar
          </button>
        </div>
      </nav>

      <section className="client-dashboard-hero">
        <div className="client-dashboard-copy">
          <div className="client-kicker">
            <Sparkles size={16} />
            <span>Halo, {displayName}</span>
          </div>

          <h1>Kelola booking dan aktivitas studio kamu.</h1>
          <p>
            Pantau jadwal mendatang, riwayat latihan, recording, invoice, dan pesan ke admin
            dari satu portal yang ringan dan cepat dibuka dari HP.
          </p>

          <div className="client-dashboard-actions">
            <Link to="/jadwal-publik" className="client-primary-btn">
              Booking Jadwal
              <ChevronRight size={17} />
            </Link>
            <a href="#client-message-panel" className="client-secondary-btn">
              <MessageCircle size={16} />
              Message to Admin
            </a>
          </div>
        </div>

        <aside className="client-profile-card" aria-label="Profil client">
          <div className="client-profile-avatar">{firstLetter}</div>
          <div className="client-profile-copy">
            <span>Client aktif</span>
            <strong>{displayName}</strong>
            <small>{emailLabel}</small>
          </div>
          <div className="client-profile-status">
            <ShieldCheck size={15} />
            {isDataLoading ? 'Sinkronisasi...' : 'Terverifikasi'}
          </div>
          <Link to="/client/profile" className="client-profile-edit-link">
            Lengkapi Profil
            <ChevronRight size={14} />
          </Link>
        </aside>
      </section>

      <section className="client-dashboard-grid" aria-label="Ringkasan aktivitas client">
        {clientStats.map(({ label, value, caption, icon: Icon, tone }) => (
          <article className={'client-stat-card client-stat-' + tone} key={label}>
            <div className="client-stat-top">
              <span className="client-stat-icon">
                <Icon size={20} />
              </span>
              <span>{label}</span>
            </div>
            <strong>{isDataLoading ? '...' : value}</strong>
            <small>{caption}</small>
          </article>
        ))}
      </section>

      <section className="client-dashboard-layout">
        <article className="client-panel client-upcoming-panel">
          <div className="client-panel-header">
            <div>
              <span>Jadwal Mendatang</span>
              <h2>{upcomingSessions.length > 0 ? 'Sesi berikutnya.' : 'Belum ada booking aktif.'}</h2>
            </div>
            <Calendar size={20} />
          </div>

          {upcomingSessions.length > 0 ? (
            <div className="client-session-list">
              {upcomingSessions.map((session) => (
                <div className="client-session-item" key={session.kind + '-' + session.id}>
                  <div className="client-session-date">
                    <strong>{session.date ? format(new Date(session.date + 'T00:00:00'), 'dd', { locale: localeId }) : '--'}</strong>
                    <span>{session.date ? format(new Date(session.date + 'T00:00:00'), 'MMM', { locale: localeId }) : 'TBA'}</span>
                  </div>
                  <div className="client-session-copy">
                    <strong>{session.title}</strong>
                    <p>{formatDateLabel(session.date)} • {formatTimeLabel(session.hour, session.duration)}</p>
                  </div>
                  <span className={'client-status-pill status-' + statusTone(session.status)}>
                    {session.kind === 'request' ? 'Request ' : ''}{statusLabel(session.status)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="client-empty-state">
              <div className="client-empty-icon">
                <Clock3 size={22} />
              </div>
              <div>
                <strong>Booking pertama kamu akan muncul di sini.</strong>
                <p>Pilih slot kosong dari kalender publik, lalu admin akan mengonfirmasi jadwal melalui WhatsApp.</p>
              </div>
            </div>
          )}

          <Link to="/jadwal-publik" className="client-panel-link">
            Cek slot studio
            <ChevronRight size={16} />
          </Link>
        </article>

        <article className="client-panel client-message-panel" id="client-message-panel">
          <div className="client-panel-header">
            <div>
              <span>Message to Admin</span>
              <h2>Kirim catatan ke studio.</h2>
            </div>
            <MessageCircle size={20} />
          </div>

          <form className="client-message-form" onSubmit={handleMessageSubmit}>
            <textarea
              className="client-message-preview"
              value={messageDraft}
              onChange={(event) => setMessageDraft(event.target.value)}
              placeholder="Contoh: Kak, saya mau tanya slot hari Sabtu malam masih bisa untuk rehearsal 3 jam?"
              aria-label="Tulis pesan untuk admin"
              rows={5}
            />

            <button type="submit" className="client-submit-btn" disabled={isSendingMessage}>
              {isSendingMessage ? <Loader2 className="spinner" size={16} /> : <Send size={16} />}
              {isSendingMessage ? 'Mengirim...' : 'Kirim Pesan'}
            </button>
          </form>

          {latestMessages.length > 0 && (
            <div className="client-message-history">
              {latestMessages.map((message) => (
                <div className="client-message-history-item" key={message.id}>
                  <span className={'client-status-pill status-' + statusTone(message.status)}>
                    {statusLabel(message.status)}
                  </span>
                  <p>{message.message}</p>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="client-panel client-activity-panel">
          <div className="client-panel-header">
            <div>
              <span>Aktivitas Terakhir</span>
              <h2>Riwayat client.</h2>
            </div>
            <History size={20} />
          </div>

          {recentActivities.length > 0 ? (
            <div className="client-activity-list">
              {recentActivities.map(({ id, title, caption, status, icon: Icon }) => (
                <div className="client-activity-item" key={id}>
                  <span>
                    <Icon size={17} />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <p>{caption}</p>
                  </div>
                  <em className={'client-status-pill status-' + statusTone(status)}>{statusLabel(status)}</em>
                </div>
              ))}
            </div>
          ) : (
            <div className="client-empty-state">
              <div className="client-empty-icon">
                <History size={22} />
              </div>
              <div>
                <strong>Belum ada riwayat sesi.</strong>
                <p>Aktivitas akan terisi setelah kamu membuat request, booking, atau pesan ke admin.</p>
              </div>
            </div>
          )}
        </article>

        <article className="client-panel client-billing-panel">
          <div className="client-panel-header">
            <div>
              <span>Billing</span>
              <h2>Invoice & pembayaran.</h2>
            </div>
            <ReceiptText size={20} />
          </div>

          <div className="client-billing-value">
            <small>Tagihan berjalan</small>
            <strong>{summary.activeBillAmount > 0 ? formatMoney(summary.activeBillAmount) : 'Rp0'}</strong>
          </div>

          <p>
            Ketika admin membuat invoice atau DP untuk booking kamu, statusnya akan tampil di panel ini.
          </p>
        </article>
      </section>
    </main>
  );
};

export default ClientDashboardPage;
