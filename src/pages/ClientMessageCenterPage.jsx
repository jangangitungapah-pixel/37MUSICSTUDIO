import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock3,
  Inbox,
  Loader2,
  MessageCircle,
  Reply,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import ClientPortalNav from '../components/ClientPortalNav';
import { useAuthStore } from '../store/useAuthStore';
import { useClientMessageStore } from '../store/useClientMessageStore';
import { useNotificationStore } from '../store/useNotificationStore';
import './ClientPortal.css';

const clean = (value) => String(value || '').trim().toLowerCase();

const formatDateTime = (value) => {
  if (!value) return 'Waktu tidak tersedia';

  try {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const statusLabel = (status) => {
  const normalized = clean(status);
  if (normalized === 'done') return 'Selesai';
  if (normalized === 'replied') return 'Dibalas Admin';
  return 'Open';
};

const statusTone = (status) => {
  const normalized = clean(status);
  if (normalized === 'done') return 'green';
  if (normalized === 'replied') return 'gold';
  return 'cyan';
};

const getAdminReplies = (message) => {
  const replies = Array.isArray(message?.replies) ? message.replies : [];
  return replies
    .filter((reply) => String(reply?.message || '').trim())
    .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
};

const getLatestAdminReply = (message) => {
  const replies = getAdminReplies(message);
  if (replies.length > 0) return replies[replies.length - 1];

  const fallback = String(message?.latestAdminReply || message?.adminReplyNote || '').trim();
  if (!fallback) return null;

  return {
    id: 'legacy-admin-reply-' + (message?.id || 'message'),
    senderName: 'Admin 37 Music Studio',
    message: fallback,
    createdAt: message?.latestAdminReplyAt || message?.repliedAt || message?.updatedAt || message?.createdAt || '',
    isLegacy: true,
  };
};

const getReplySearchText = (message) => {
  const replies = getAdminReplies(message);
  return replies
    .map((reply) => [reply.senderName, reply.message].filter(Boolean).join(' '))
    .join(' ');
};

const filterOptions = [
  { key: 'all', label: 'Semua' },
  { key: 'open', label: 'Open' },
  { key: 'replied', label: 'Dibalas' },
  { key: 'done', label: 'Selesai' },
];

const messageTemplates = [
  {
    label: 'Tanya slot',
    subject: 'Pertanyaan Booking',
    message: 'Halo admin, saya mau tanya ketersediaan slot studio untuk hari/tanggal ... jam ... Apakah masih available?',
  },
  {
    label: 'Reschedule',
    subject: 'Reschedule Jadwal',
    message: 'Halo admin, saya ingin reschedule booking saya. Jadwal awal ... ingin dipindah ke ... Apakah memungkinkan?',
  },
  {
    label: 'Konfirmasi bayar',
    subject: 'Konfirmasi Pembayaran',
    message: 'Halo admin, saya ingin konfirmasi pembayaran/DP untuk booking saya. Mohon dicek ya.',
  },
  {
    label: 'Recording',
    subject: 'Kebutuhan Recording',
    message: 'Halo admin, saya mau konsultasi kebutuhan recording. Rencananya untuk ... dengan estimasi durasi ... jam.',
  },
];

const ClientMessageCenterPage = () => {
  const { user, userProfile, isAuthLoaded, logout } = useAuthStore();
  const { messages, addMessage, isLoaded, error } = useClientMessageStore();
  const addNotification = useNotificationStore((state) => state.addNotification);

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [subject, setSubject] = useState('Pertanyaan Booking');
  const [messageDraft, setMessageDraft] = useState('');
  const [isSending, setIsSending] = useState(false);

  const displayName =
    userProfile?.displayName ||
    userProfile?.username ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'Client';

  const emailLabel = user?.email || userProfile?.email || 'Akun client';
  const firstLetter = displayName?.trim()?.charAt(0)?.toUpperCase() || 'C';

  const sortedMessages = useMemo(() => {
    return [...(messages || [])].sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
  }, [messages]);

  const filteredMessages = useMemo(() => {
    const query = clean(searchTerm);

    return sortedMessages.filter((message) => {
      const normalizedStatus = clean(message.status || 'open');
      const passFilter = activeFilter === 'all'
        ? true
        : activeFilter === 'open'
          ? normalizedStatus !== 'done' && normalizedStatus !== 'replied'
          : normalizedStatus === activeFilter;

      const haystack = clean([
        message.subject,
        message.message,
        message.adminReplyNote,
        message.latestAdminReply,
        getReplySearchText(message),
        message.status,
      ].filter(Boolean).join(' '));

      return passFilter && (!query || haystack.includes(query));
    });
  }, [sortedMessages, activeFilter, searchTerm]);

  const openCount = sortedMessages.filter((message) => clean(message.status) !== 'done' && clean(message.status) !== 'replied').length;
  const repliedCount = sortedMessages.filter((message) => clean(message.status) === 'replied').length;
  const doneCount = sortedMessages.filter((message) => clean(message.status) === 'done').length;
  const messageLength = messageDraft.trim().length;
  const latestAdminReplyMessage = sortedMessages.find((message) => getLatestAdminReply(message));
  const latestAdminReply = latestAdminReplyMessage ? getLatestAdminReply(latestAdminReplyMessage) : null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanMessage = messageDraft.trim();

    if (cleanMessage.length < 8) {
      addNotification({
        type: 'warning',
        title: 'Pesan terlalu pendek',
        message: 'Tulis minimal 8 karakter supaya admin paham konteksnya.',
      });
      return;
    }

    setIsSending(true);

    try {
      await addMessage({
        subject,
        message: cleanMessage,
        clientName: displayName,
        clientEmail: emailLabel,
        clientPhone: userProfile?.phone || '',
        linkedCustomerId: userProfile?.linkedCustomerId || '',
        source: 'client-message-center',
      });

      setMessageDraft('');
    } catch (sendError) {
      addNotification({
        type: 'error',
        title: 'Pesan gagal dikirim',
        message: sendError.message || 'Coba lagi beberapa saat lagi.',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isAuthLoaded) {
    return (
      <div className="client-portal-loader">
        <div className="client-loader-card">
          <div className="client-loader-logo">37</div>
          <span>Memuat pesan...</span>
        </div>
      </div>
    );
  }

  if (!user || user.isAnonymous) {
    return <Navigate to="/client" replace />;
  }

  return (
    <main className="client-portal-page client-dashboard-page client-message-center-page">
      <div className="client-ambient-bg" aria-hidden="true">
        <span className="client-blob client-blob-pink" />
        <span className="client-blob client-blob-cyan" />
      </div>

      <ClientPortalNav title="Client Messages" onLogout={logout} />

      <section className="client-message-center-hero">
        <div>
          <div className="client-kicker">
            <Sparkles size={16} />
            <span>Pesan Studio</span>
          </div>
          <h1>Ngobrol dengan admin studio.</h1>
          <p>
            Kirim pertanyaan booking, invoice, jadwal, atau kebutuhan recording. Semua pesan tersimpan rapi di akun client kamu.
          </p>
        </div>

        <aside className="client-profile-card client-message-profile-card">
          <div className="client-profile-avatar">{firstLetter}</div>
          <div className="client-profile-copy">
            <span>Pesan sebagai</span>
            <strong>{displayName}</strong>
            <small>{emailLabel}</small>
          </div>
          <div className="client-profile-status">
            <ShieldCheck size={15} />
            {isLoaded ? 'Sinkron' : 'Memuat...'}
          </div>
        </aside>
      </section>

      <section className="client-dashboard-grid client-message-stats" aria-label="Ringkasan pesan client">
        <article className="client-stat-card client-stat-cyan">
          <div className="client-stat-top">
            <span className="client-stat-icon"><Inbox size={20} /></span>
            <span>Open</span>
          </div>
          <strong>{isLoaded ? openCount : '...'}</strong>
          <small>Pesan yang masih perlu follow up.</small>
        </article>

        <article className="client-stat-card client-stat-gold">
          <div className="client-stat-top">
            <span className="client-stat-icon"><Reply size={20} /></span>
            <span>Dibalas</span>
          </div>
          <strong>{isLoaded ? repliedCount : '...'}</strong>
          <small>Pesan yang sudah diberi catatan admin.</small>
        </article>

        <article className="client-stat-card client-stat-green">
          <div className="client-stat-top">
            <span className="client-stat-icon"><CheckCircle2 size={20} /></span>
            <span>Selesai</span>
          </div>
          <strong>{isLoaded ? doneCount : '...'}</strong>
          <small>Pesan yang sudah ditutup.</small>
        </article>
      </section>

      {latestAdminReply && (
        <section className="client-message-reply-strip" aria-label="Balasan admin terbaru">
          <div className="client-message-reply-icon">
            <Reply size={18} />
          </div>
          <div>
            <span>Balasan admin terbaru</span>
            <strong>{latestAdminReply.senderName || 'Admin 37 Music Studio'}</strong>
            <p>{latestAdminReply.message}</p>
          </div>
        </section>
      )}

      <section className="client-message-center-layout">
        <form className="client-panel client-message-compose-panel" onSubmit={handleSubmit}>
          <div className="client-panel-header">
            <div>
              <span>Kirim Pesan</span>
              <h2>Message to admin.</h2>
            </div>
            <MessageCircle size={20} />
          </div>

          <label className="client-message-field">
            <span>Topik</span>
            <select value={subject} onChange={(event) => setSubject(event.target.value)}>
              <option>Pertanyaan Booking</option>
              <option>Konfirmasi Pembayaran</option>
              <option>Reschedule Jadwal</option>
              <option>Kebutuhan Recording</option>
              <option>Lainnya</option>
            </select>
          </label>

          <div className="client-message-template-section">
            <span>Template cepat</span>
            <div className="client-message-template-chips">
              {messageTemplates.map((template) => (
                <button
                  type="button"
                  key={template.label}
                  onClick={() => {
                    setSubject(template.subject);
                    setMessageDraft(template.message);
                  }}
                >
                  {template.label}
                </button>
              ))}
            </div>
          </div>

          <label className="client-message-field">
            <span>Isi pesan</span>
            <textarea
              value={messageDraft}
              onChange={(event) => setMessageDraft(event.target.value)}
              placeholder="Tulis detailnya singkat tapi jelas. Contoh: tanggal, jam, jenis sesi, atau kendala pembayaran."
              rows={7}
            />
            <div className="client-message-compose-helper">
              <small>{messageLength < 8 ? "Minimal 8 karakter supaya admin paham konteksnya." : "Sudah cukup jelas. Kirim kalau detailnya sudah benar."}</small>
              <em>{messageLength} karakter</em>
            </div>
          </label>

          <button type="submit" className="client-submit-btn" disabled={isSending || messageLength < 8}>
            {isSending ? <Loader2 className="spinner" size={16} /> : <Send size={16} />}
            {isSending ? 'Mengirim...' : 'Kirim Pesan'}
          </button>
        </form>

        <section className="client-panel client-message-history-panel">
          <div className="client-panel-header">
            <div>
              <span>Riwayat Pesan</span>
              <h2>{filteredMessages.length > 0 ? 'Thread terbaru.' : 'Belum ada pesan.'}</h2>
            </div>
            <Clock3 size={20} />
          </div>

          {error && (
            <div className="client-message-alert">
              <ShieldCheck size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="client-message-toolbar">
            <div className="client-message-tabs">
              {filterOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={activeFilter === option.key ? 'active' : ''}
                  onClick={() => setActiveFilter(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <label className="client-message-search">
              <Search size={16} />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari pesan..."
              />
            </label>
          </div>

          {!isLoaded ? (
            <div className="client-empty-state">
              <div className="client-empty-icon"><Clock3 size={22} /></div>
              <div>
                <strong>Memuat pesan...</strong>
                <p>Riwayat pesan sedang disinkronkan dari Firestore.</p>
              </div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="client-empty-state">
              <div className="client-empty-icon"><Inbox size={22} /></div>
              <div>
                <strong>Belum ada pesan yang cocok.</strong>
                <p>Kirim pesan baru atau ganti filter pencarian.</p>
              </div>
            </div>
          ) : (
            <div className="client-message-thread-list">
              {filteredMessages.map((message) => {
                const adminReplies = getAdminReplies(message);
                const legacyReply = adminReplies.length === 0 ? getLatestAdminReply(message) : null;

                return (
                  <article className="client-message-thread-card" key={message.id}>
                    <div className="client-message-thread-top">
                      <div>
                        <span>{message.subject || 'Pesan Client Portal'}</span>
                        <strong>{message.message}</strong>
                        <div className="client-message-thread-meta">
                          <small>{formatDateTime(message.updatedAt || message.createdAt)}</small>
                          {message.source && <small>{message.source === "client-message-center" ? "Client Center" : message.source}</small>}
                        </div>
                      </div>
                      <span className={'client-status-pill status-' + statusTone(message.status)}>
                        {statusLabel(message.status)}
                      </span>
                    </div>

                    {adminReplies.length > 0 && (
                      <div className="client-admin-reply-stack" aria-label="Balasan admin">
                        {adminReplies.map((reply) => (
                          <div className="client-admin-reply-note" key={reply.id || reply.createdAt || reply.message}>
                            <Reply size={15} />
                            <div>
                              <strong>{reply.senderName || 'Admin 37 Music Studio'}</strong>
                              <p>{reply.message}</p>
                              {reply.createdAt && <small>{formatDateTime(reply.createdAt)}</small>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {legacyReply && (
                      <div className="client-admin-reply-note">
                        <Reply size={15} />
                        <div>
                          <strong>{legacyReply.senderName || 'Admin 37 Music Studio'}</strong>
                          <p>{legacyReply.message}</p>
                          {legacyReply.createdAt && <small>{formatDateTime(legacyReply.createdAt)}</small>}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
};

export default ClientMessageCenterPage;
