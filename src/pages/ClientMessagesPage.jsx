import {
  ArrowLeft, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Copy,
  Inbox,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Reply,
  Search,
  Send,
  UserRound,
} from 'lucide-react';
import { useClientMessageStore } from '../store/useClientMessageStore';
import { useNotificationStore } from '../store/useNotificationStore';
import './ClientMessagesPage.css';

const clean = (value) => String(value || '').trim().toLowerCase();
const digits = (value) => String(value || '').replace(/\D/g, '');

const normalizeWaNumber = (value) => {
  const raw = digits(value);
  if (!raw) return '';
  if (raw.startsWith('62')) return raw;
  if (raw.startsWith('0')) return '62' + raw.slice(1);
  return raw;
};

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

const formatShortTime = (value) => {
  if (!value) return '—';

  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const statusLabel = (status) => {
  const normalized = clean(status);
  if (normalized === 'done') return 'Selesai';
  if (normalized === 'replied') return 'Dibalas';
  return 'Open';
};

const statusTone = (status) => {
  const normalized = clean(status);
  if (normalized === 'done') return 'green';
  if (normalized === 'replied') return 'gold';
  return 'cyan';
};

const getMessageStatus = (message) => clean(message?.status || 'open');

const isOpenMessage = (message) => {
  const status = getMessageStatus(message);
  return status !== 'done' && status !== 'replied';
};

const getInitial = (message) => String(message?.clientName || message?.clientEmail || 'C').charAt(0).toUpperCase();

const getDisplayName = (message) => message?.clientName || message?.clientEmail || 'Client';

const getMessagePreview = (message) => {
  const text = String(message?.message || 'Tidak ada isi pesan.').replace(/\s+/g, ' ').trim();
  return text.length > 120 ? text.slice(0, 120) + '…' : text;
};

const getAdminReplies = (message) => {
  const replies = Array.isArray(message?.replies) ? message.replies : [];

  return replies
    .filter((reply) => String(reply?.message || '').trim())
    .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
};

const getAdminReplySearchText = (message) => {
  return getAdminReplies(message)
    .map((reply) => [
      reply.senderName,
      reply.message,
      reply.createdAt,
    ].filter(Boolean).join(' '))
    .join(' ');
};

const getReplyKey = (reply, messageId, index) => {
  return reply?.id || [messageId, reply?.createdAt, reply?.message, index].filter(Boolean).join('-');
};

const folderOptions = [
  { key: 'open', label: 'Inbox', description: 'Belum selesai', icon: Inbox },
  { key: 'replied', label: 'Dibalas', description: 'Sudah difollow up', icon: Reply },
  { key: 'done', label: 'Selesai', description: 'Closed thread', icon: CheckCircle2 },
  { key: 'all', label: 'Semua Pesan', description: 'Arsip operasional', icon: Mail },
];

const ClientMessagesPage = () => {
  const { messages, isLoaded, error, updateMessageStatus, sendAdminReply } = useClientMessageStore();
  const [activeFilter, setActiveFilter] = useState('open');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});

  const addNotification = useNotificationStore((state) => state.addNotification);

  const sortedMessages = useMemo(() => {
    return [...(messages || [])].sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
  }, [messages]);

  const mailboxCounts = useMemo(() => {
    const open = sortedMessages.filter(isOpenMessage).length;
    const replied = sortedMessages.filter((message) => getMessageStatus(message) === 'replied').length;
    const done = sortedMessages.filter((message) => getMessageStatus(message) === 'done').length;

    return {
      all: sortedMessages.length,
      open,
      replied,
      done,
    };
  }, [sortedMessages]);

  const filteredMessages = useMemo(() => {
    const query = clean(searchTerm);

    return sortedMessages.filter((message) => {
      const normalizedStatus = getMessageStatus(message);
      const passFilter = activeFilter === 'all'
        ? true
        : activeFilter === 'open'
          ? normalizedStatus !== 'done' && normalizedStatus !== 'replied'
          : normalizedStatus === activeFilter;

      const haystack = clean([
        message.clientName,
        message.clientEmail,
        message.clientPhone,
        message.message,
        message.subject,
        message.clientUid,
        message.adminReplyNote,
        message.latestAdminReply,
        getAdminReplySearchText(message),
        message.source,
      ].filter(Boolean).join(' '));

      return passFilter && (!query || haystack.includes(query));
    });
  }, [sortedMessages, activeFilter, searchTerm]);

  useEffect(() => {
    if (filteredMessages.length === 0) {
      setSelectedMessageId(null);
      return;
    }

    const selectedStillVisible = filteredMessages.some((message) => message.id === selectedMessageId);
    if (!selectedStillVisible) {
      setSelectedMessageId(filteredMessages[0].id);
    }
  }, [filteredMessages, selectedMessageId]);

  const selectedMessage = useMemo(() => {
    return filteredMessages.find((message) => message.id === selectedMessageId) || filteredMessages[0] || null;
  }, [filteredMessages, selectedMessageId]);

  const copyText = async (value, label) => {
    const text = String(value || '').trim();

    if (!text) {
      addNotification({
        type: 'warning',
        title: 'Data kosong',
        message: label + ' belum tersedia.',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      addNotification({
        type: 'success',
        title: 'Berhasil disalin',
        message: label + ' sudah masuk clipboard.',
      });
    } catch {
      addNotification({
        type: 'error',
        title: 'Gagal menyalin',
        message: 'Browser tidak mengizinkan akses clipboard.',
      });
    }
  };

  const saveReplyNote = async (message) => {
    const note = String(replyDrafts[message.id] || '').trim();

    if (!note) {
      addNotification({
        type: 'warning',
        title: 'Catatan kosong',
        message: 'Tulis catatan follow up dulu.',
      });
      return;
    }

    await updateMessageStatus(message.id, 'replied', {
      adminReplyNote: note,
      repliedAt: new Date().toISOString(),
      isReadByAdmin: true,
    });

    setReplyDrafts((current) => ({ ...current, [message.id]: '' }));

    addNotification({
      type: 'success',
      title: 'Catatan disimpan',
      message: 'Pesan ditandai sudah dibalas.',
    });
  };

  const sendCustomerReply = async (message) => {
    const note = String(replyDrafts[message.id] || '').trim();

    if (!note) {
      addNotification({
        type: 'warning',
        title: 'Balasan kosong',
        message: 'Tulis balasan untuk customer dulu.',
      });
      return;
    }

    try {
      await sendAdminReply(message.id, {
        message: note,
        senderName: 'Admin 37 Music Studio',
      });

      setReplyDrafts((current) => ({ ...current, [message.id]: '' }));
    } catch (replyError) {
      addNotification({
        type: 'error',
        title: 'Balasan gagal dikirim',
        message: replyError.message || 'Coba lagi beberapa saat lagi.',
      });
    }
  };

  const markReplied = async (message) => {
    await updateMessageStatus(message.id, 'replied', {
      isReadByAdmin: true,
      repliedAt: new Date().toISOString(),
    });
  };

  const markDone = async (message) => {
    await updateMessageStatus(message.id, 'done', {
      isReadByAdmin: true,
      doneAt: new Date().toISOString(),
    });
  };

  const getWhatsAppHref = (message) => {
    const waNumber = normalizeWaNumber(message?.clientPhone);
    const waText = encodeURIComponent(
      'Halo ' + (message?.clientName || 'kak') + ', kami dari 37 Music Studio mau follow up pesan kamu di Client Portal: "' + (message?.message || '') + '"'
    );

    return waNumber ? 'https://wa.me/' + waNumber + '?text=' + waText : '';
  };

  const activeFolder = folderOptions.find((folder) => folder.key === activeFilter) || folderOptions[0];
  const selectedWaHref = selectedMessage ? getWhatsAppHref(selectedMessage) : '';
  const selectedAdminReplies = selectedMessage ? getAdminReplies(selectedMessage) : [];

  return (
    <div className={'messages-page messages-inbox-page' + (selectedMessage ? ' has-selected-message' : '')}>
      <header className="messages-inbox-hero" aria-labelledby="messagesHeroTitle">
        <div className="messages-inbox-titleblock">
          <span className="messages-kicker">
            <MessageCircle size={16} />
            37 Admin Inbox
          </span>
          <h1 id="messagesHeroTitle">Client Inbox</h1>
          <p>
            Kelola pesan client dengan workflow inbox profesional: baca, cari, follow up, beri catatan, dan tutup percakapan dari satu layar.
          </p>
        </div>

        <div className="messages-inbox-metrics" aria-label="Ringkasan pesan client">
          <article className="messages-metric-card is-open">
            <span>Open</span>
            <strong>{isLoaded ? mailboxCounts.open : '...'}</strong>
            <small>Butuh follow up</small>
          </article>
          <article className="messages-metric-card is-replied">
            <span>Dibalas</span>
            <strong>{isLoaded ? mailboxCounts.replied : '...'}</strong>
            <small>Sudah direspons</small>
          </article>
          <article className="messages-metric-card is-done">
            <span>Selesai</span>
            <strong>{isLoaded ? mailboxCounts.done : '...'}</strong>
            <small>Closed</small>
          </article>
        </div>
      </header>

      {error && (
        <div className="messages-alert messages-state-card is-error" role="alert">
          <RefreshCw size={16} />
          <span>{error}</span>
        </div>
      )}

      <section className="messages-inbox-shell" aria-label="Professional client inbox">
        <aside className="inbox-sidebar" aria-label="Mailbox navigation">
          <div className="inbox-sidebar-header">
            <span>Mailbox</span>
            <strong>{mailboxCounts.all}</strong>
          </div>

          <nav className="inbox-folder-list" aria-label="Folder pesan">
            {folderOptions.map(({ key, label, description, icon: Icon }) => {
              const isActive = activeFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  className={'inbox-folder-btn ' + (isActive ? 'is-active' : '')}
                  onClick={() => setActiveFilter(key)}
                  aria-pressed={isActive}
                >
                  <span className="inbox-folder-icon"><Icon size={16} /></span>
                  <span className="inbox-folder-copy">
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                  <em>{mailboxCounts[key]}</em>
                </button>
              );
            })}
          </nav>

          <div className="inbox-sidebar-note">
            <Clock3 size={15} />
            <span>Pesan terbaru selalu muncul paling atas.</span>
          </div>
        </aside>

        <section className="inbox-list-panel" aria-label="Daftar pesan client">
          <div className="inbox-list-toolbar">
            <div>
              <span>{activeFolder.label}</span>
              <strong>{isLoaded ? filteredMessages.length : '...'} pesan</strong>
            </div>
            <label className="inbox-search">
              <Search size={16} />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari nama, email, nomor, isi pesan..."
                aria-label="Cari pesan client"
              />
            </label>
          </div>

          <div className="inbox-message-list" role="listbox" aria-label="Daftar percakapan client">
            {!isLoaded ? (
              <div className="inbox-state-card" role="status">
                <RefreshCw className="spinner" size={22} />
                <strong>Memuat inbox...</strong>
                <p>Sinkronisasi pesan dari Firestore sedang berjalan.</p>
              </div>
            ) : sortedMessages.length === 0 ? (
              <div className="inbox-state-card">
                <Mail size={22} />
                <strong>Belum ada pesan client.</strong>
                <p>Pesan yang dikirim dari client portal akan muncul di sini.</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="inbox-state-card">
                <Search size={22} />
                <strong>Tidak ada pesan cocok.</strong>
                <p>Coba ubah folder atau kata kunci pencarian.</p>
              </div>
            ) : (
              filteredMessages.map((message) => {
                const isSelected = selectedMessage?.id === message.id;
                const tone = statusTone(message.status);

                return (
                  <button
                    key={message.id}
                    type="button"
                    className={'inbox-message-row tone-' + tone + (isSelected ? ' is-selected' : '')}
                    onClick={() => setSelectedMessageId(message.id)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="inbox-row-avatar" aria-hidden="true">{getInitial(message)}</span>
                    <span className="inbox-row-main">
                      <span className="inbox-row-topline">
                        <strong>{getDisplayName(message)}</strong>
                        <time>{formatShortTime(message.updatedAt || message.createdAt)}</time>
                      </span>
                      <span className="inbox-row-subject">{message.subject || 'Pesan Client Portal'}</span>
                      <span className="inbox-row-preview">{getMessagePreview(message)}</span>
                    </span>
                    <span className={'inbox-status-dot status-' + tone}>{statusLabel(message.status)}</span>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <article className="inbox-detail-panel is-messenger-chat" aria-label="Percakapan client">
          {!selectedMessage ? (
            <div className="inbox-detail-empty">
              <Inbox size={28} />
              <strong>Pilih percakapan.</strong>
              <p>Pilih pesan dari daftar untuk membaca chat, membalas client, atau menutup follow up.</p>
            </div>
          ) : (
            <>
              <header className="inbox-detail-header">
                <button
                  type="button"
                  className="inbox-mobile-back"
                  onClick={() => setSelectedMessageId(null)}
                  aria-label="Kembali ke daftar pesan"
                >
                  <ArrowLeft size={18} />
                  <span>Pesan</span>
                </button>
                <div className="inbox-detail-identity">
                  <span className="inbox-detail-avatar">{getInitial(selectedMessage)}</span>
                  <div>
                    <span className="inbox-detail-label">Client message</span>
                    <h2>{selectedMessage.subject || 'Pesan Client Portal'}</h2>
                    <p>
                      Dari <strong>{getDisplayName(selectedMessage)}</strong> • {formatDateTime(selectedMessage.createdAt)}
                    </p>
                  </div>
                </div>
                <span className={'inbox-detail-status status-' + statusTone(selectedMessage.status)}>
                  {statusLabel(selectedMessage.status)}
                </span>
              </header>

              <div className="inbox-chat-scroll" aria-label="Isi percakapan client">
                <section className="inbox-contact-strip" aria-label="Kontak client">
                  <button type="button" onClick={() => copyText(selectedMessage.clientEmail, 'Email client')}>
                    <Mail size={14} />
                    <span>{selectedMessage.clientEmail || 'Email belum ada'}</span>
                    <Copy size={13} />
                  </button>
                  <button type="button" onClick={() => copyText(selectedMessage.clientPhone, 'Nomor WhatsApp')}>
                    <Phone size={14} />
                    <span>{selectedMessage.clientPhone || 'Nomor belum ada'}</span>
                    <Copy size={13} />
                  </button>
                  <button type="button" onClick={() => copyText(selectedMessage.clientUid, 'UID client')}>
                    <UserRound size={14} />
                    <span>{selectedMessage.clientUid || 'UID belum ada'}</span>
                    <Copy size={13} />
                  </button>
                </section>

                <div className="inbox-chat-day-pill">
                  {formatDateTime(selectedMessage.createdAt)}
                </div>

                <section className="inbox-message-reader inbox-chat-bubble is-client" aria-label="Pesan dari client">
                  <span>{getDisplayName(selectedMessage)}</span>
                  <p>{selectedMessage.message || 'Tidak ada isi pesan.'}</p>
                </section>

                {selectedMessage.adminReplyNote && (
                  <section className="inbox-reply-note inbox-chat-bubble is-internal-note" aria-label="Catatan internal admin">
                    <Reply size={16} />
                    <div>
                      <strong>Catatan internal</strong>
                      <p>{selectedMessage.adminReplyNote}</p>
                    </div>
                  </section>
                )}

                {selectedAdminReplies.length > 0 && (
                  <section className="inbox-admin-reply-history inbox-chat-thread" aria-label="Riwayat balasan admin ke customer">
                    <div className="inbox-admin-reply-history-head">
                      <span>Balasan admin</span>
                      <strong>{selectedAdminReplies.length} balasan</strong>
                    </div>

                    {selectedAdminReplies.map((reply, index) => (
                      <div className="inbox-reply-note inbox-customer-reply-note inbox-chat-bubble is-admin" key={getReplyKey(reply, selectedMessage.id, index)}>
                        <Send size={16} />
                        <div>
                          <strong>{reply.senderName || 'Admin 37 Music Studio'}</strong>
                          <p>{reply.message}</p>
                          {reply.createdAt && <small>{formatDateTime(reply.createdAt)}</small>}
                        </div>
                      </div>
                    ))}
                  </section>
                )}
              </div>

              <section className="inbox-reply-composer" aria-label="Balasan customer dan catatan follow up admin">
                <label htmlFor={'reply-note-' + selectedMessage.id}>Balasan / Catatan follow up</label>
                <textarea
                  id={'reply-note-' + selectedMessage.id}
                  value={replyDrafts[selectedMessage.id] || ''}
                  onChange={(event) => setReplyDrafts((current) => ({
                    ...current,
                    [selectedMessage.id]: event.target.value,
                  }))}
                  placeholder="Tulis balasan untuk customer..."
                  rows={3}
                />
                <div className="inbox-detail-actions">
                  <button type="button" className="inbox-action primary" onClick={() => sendCustomerReply(selectedMessage)}>
                    <Send size={15} />
                    Kirim
                  </button>

                  <button type="button" className="inbox-action" onClick={() => saveReplyNote(selectedMessage)}>
                    <Reply size={15} />
                    Catatan
                  </button>

                  <a
                    className={'inbox-action whatsapp' + (!selectedWaHref ? ' is-disabled' : '')}
                    href={selectedWaHref || undefined}
                    target="_blank"
                    rel="noreferrer"
                    aria-disabled={!selectedWaHref}
                    onClick={(event) => {
                      if (!selectedWaHref) {
                        event.preventDefault();
                        addNotification({
                          type: 'warning',
                          title: 'Nomor WhatsApp kosong',
                          message: 'Client belum menyimpan nomor WhatsApp.',
                        });
                      }
                    }}
                  >
                    <MessageCircle size={15} />
                    WhatsApp
                  </a>

                  <button
                    type="button"
                    className="inbox-action"
                    onClick={() => markReplied(selectedMessage)}
                    disabled={selectedMessage.status === 'replied' || selectedMessage.status === 'done'}
                  >
                    <Reply size={15} />
                    Dibalas
                  </button>

                  <button
                    type="button"
                    className="inbox-action success"
                    onClick={() => markDone(selectedMessage)}
                    disabled={selectedMessage.status === 'done'}
                  >
                    <CheckCircle2 size={15} />
                    Selesai
                  </button>
                </div>
              </section>
            </>
          )}
        </article>
      </section>
    </div>
  );
};

export default ClientMessagesPage;
