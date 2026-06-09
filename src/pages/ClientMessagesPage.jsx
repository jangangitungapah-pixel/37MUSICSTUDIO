import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Copy,
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

const filterOptions = [
  { key: 'all', label: 'Semua' },
  { key: 'open', label: 'Open' },
  { key: 'replied', label: 'Dibalas' },
  { key: 'done', label: 'Selesai' },
];

const ClientMessagesPage = () => {
  const { messages, isLoaded, error, updateMessageStatus } = useClientMessageStore();
  const [activeFilter, setActiveFilter] = useState('open');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyDrafts, setReplyDrafts] = useState({});

  const addNotification = useNotificationStore((state) => state.addNotification);

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
        message.clientName,
        message.clientEmail,
        message.clientPhone,
        message.message,
        message.subject,
        message.clientUid,
      ].filter(Boolean).join(' '));

      const passSearch = !query || haystack.includes(query);

      return passFilter && passSearch;
    });
  }, [sortedMessages, activeFilter, searchTerm]);

  const openCount = sortedMessages.filter((message) => clean(message.status) !== 'done').length;
  const repliedCount = sortedMessages.filter((message) => clean(message.status) === 'replied').length;
  const doneCount = sortedMessages.filter((message) => clean(message.status) === 'done').length;

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

  return (
    <div className="messages-page">
      <header className="messages-hero" aria-labelledby="messagesHeroTitle">
        {/* === START 37 ADMIN MESSAGES PHASE 2 HERO COMMAND CENTER === */}
        <div className="messages-hero-main">
          <span className="messages-kicker">
            <MessageCircle size={16} />
            37 Admin Inbox
          </span>

          <h1 id="messagesHeroTitle">Pesan dari client.</h1>

          <p>
            Semua pesan dari client portal masuk ke sini. Admin bisa follow up via WhatsApp,
            menyalin kontak, memberi catatan, dan menandai status tindak lanjut.
          </p>

          <div className="messages-command-strip" aria-label="Status operasional inbox">
            <span>
              <Clock3 size={14} />
              <strong>{isLoaded ? filteredMessages.length : '...'}</strong>
              <small>pesan tampil</small>
            </span>
            <span>
              <RefreshCw size={14} />
              <strong>{activeFilter === 'all' ? 'Semua' : statusLabel(activeFilter)}</strong>
              <small>filter aktif</small>
            </span>
            <span>
              <Search size={14} />
              <strong>{searchTerm ? 'Search on' : 'Ready'}</strong>
              <small>client lookup</small>
            </span>
          </div>
        </div>

        <div className="messages-hero-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="messages-summary-grid" aria-label="Ringkasan pesan client">
          <div className="messages-summary-card is-open">
            <span>
              <Clock3 size={14} />
              Open
            </span>
            <strong>{isLoaded ? openCount : '...'}</strong>
            <small>Belum selesai.</small>
          </div>
          <div className="messages-summary-card compact is-replied">
            <span>
              <Reply size={14} />
              Dibalas
            </span>
            <strong>{isLoaded ? repliedCount : '...'}</strong>
            <small>Sudah follow up.</small>
          </div>
          <div className="messages-summary-card compact is-done">
            <span>
              <CheckCircle2 size={14} />
              Selesai
            </span>
            <strong>{isLoaded ? doneCount : '...'}</strong>
            <small>Closed.</small>
          </div>
        </div>
        {/* === END 37 ADMIN MESSAGES PHASE 2 HERO COMMAND CENTER === */}
      </header>

      {error && (
        <div className="messages-alert">
          <RefreshCw size={16} />
          <span>{error}</span>
        </div>
      )}

      <section className="messages-toolbar">
        <div className="messages-filter-tabs" aria-label="Filter pesan client">
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

        <label className="messages-search">
          <Search size={16} />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari nama, email, nomor, isi pesan..."
          />
        </label>
      </section>

      <section className="messages-board">
        {!isLoaded ? (
          <div className="messages-empty">
            <Clock3 size={24} />
            <strong>Memuat pesan client...</strong>
            <p>Sebentar ya, inbox sedang disinkronkan dari Firestore.</p>
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className="messages-empty">
            <Mail size={24} />
            <strong>Belum ada pesan client.</strong>
            <p>Pesan yang dikirim dari client portal akan muncul di halaman ini.</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="messages-empty">
            <Search size={24} />
            <strong>Tidak ada pesan yang cocok.</strong>
            <p>Coba ganti filter atau kata kunci pencarian.</p>
          </div>
        ) : (
          <div className="messages-list">
            {filteredMessages.map((message) => {
              const waNumber = normalizeWaNumber(message.clientPhone);
              const waText = encodeURIComponent(
                'Halo ' + (message.clientName || 'kak') + ', kami dari 37 Music Studio mau follow up pesan kamu di Client Portal: "' + (message.message || '') + '"'
              );
              const waHref = waNumber ? 'https://wa.me/' + waNumber + '?text=' + waText : '';

              return (
                <article className={'message-card message-ticket tone-' + statusTone(message.status)} key={message.id}>
                  {/* === START 37 ADMIN MESSAGES PHASE 3 OPERATIONAL MESSAGE CARD === */}
                  <div className="message-card-shell">
                    <div className="message-card-header">
                      <div className="message-card-top">
                        <div className="message-client-avatar" aria-hidden="true">
                          {(message.clientName || message.clientEmail || 'C').charAt(0).toUpperCase()}
                        </div>

                        <div className="message-client-copy">
                          <span className="message-ticket-label">Client message</span>
                          <strong>{message.clientName || 'Client'}</strong>
                          <span>{formatDateTime(message.createdAt)}</span>
                        </div>

                        <span className={'message-status-pill status-' + statusTone(message.status)}>
                          {statusLabel(message.status)}
                        </span>
                      </div>

                      <div className="message-ticket-id">
                        <span>Client UID</span>
                        <strong>{message.clientUid || 'Belum tersedia'}</strong>
                      </div>
                    </div>

                    {message.subject && (
                      <div className="message-subject-line">
                        <span>Subject</span>
                        <strong>{message.subject}</strong>
                      </div>
                    )}

                    <div className="message-content-zone">
                      <span className="message-section-label">Isi pesan</span>
                      <p className="message-body">{message.message}</p>
                    </div>

                    <div className="message-card-contact-row">
                      <span className="message-section-label">Contact kit</span>
                      <div className="message-meta-grid">
                        <button type="button" onClick={() => copyText(message.clientEmail, 'Email client')}>
                          <Mail size={14} />
                          <span>{message.clientEmail || 'Email belum ada'}</span>
                          <Copy size={13} />
                        </button>
                        <button type="button" onClick={() => copyText(message.clientPhone, 'Nomor WhatsApp')}>
                          <Phone size={14} />
                          <span>{message.clientPhone || 'Nomor belum ada'}</span>
                          <Copy size={13} />
                        </button>
                        <button type="button" onClick={() => copyText(message.clientUid, 'UID client')}>
                          <UserRound size={14} />
                          <span>{message.clientUid || 'UID belum ada'}</span>
                          <Copy size={13} />
                        </button>
                      </div>
                    </div>

                    {message.adminReplyNote && (
                      <div className="message-reply-note">
                        <Reply size={15} />
                        <div>
                          <strong>Catatan admin</strong>
                          <p>{message.adminReplyNote}</p>
                        </div>
                      </div>
                    )}

                    <div className="message-card-actions-zone">
                      <div className="message-reply-box message-card-compose">
                        <textarea
                          value={replyDrafts[message.id] || ''}
                          onChange={(event) => setReplyDrafts((current) => ({
                            ...current,
                            [message.id]: event.target.value,
                          }))}
                          placeholder="Tulis catatan follow up internal, misalnya: Sudah dibalas via WA, client minta Sabtu malam."
                          rows={3}
                        />

                        <button type="button" onClick={() => saveReplyNote(message)}>
                          <Send size={15} />
                          Simpan Catatan
                        </button>
                      </div>

                      <div className="message-actions">
                        <a
                          className={'message-action-btn whatsapp' + (!waHref ? ' disabled' : '')}
                          href={waHref || undefined}
                          target="_blank"
                          rel="noreferrer"
                          aria-disabled={!waHref}
                          onClick={(event) => {
                            if (!waHref) {
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
                          Balas via WhatsApp
                        </a>

                        <button
                          type="button"
                          className="message-action-btn"
                          onClick={() => updateMessageStatus(message.id, 'replied', { isReadByAdmin: true, repliedAt: new Date().toISOString() })}
                          disabled={message.status === 'replied' || message.status === 'done'}
                        >
                          <MessageCircle size={15} />
                          Tandai Dibalas
                        </button>

                        <button
                          type="button"
                          className="message-action-btn primary"
                          onClick={() => updateMessageStatus(message.id, 'done', { isReadByAdmin: true, doneAt: new Date().toISOString() })}
                          disabled={message.status === 'done'}
                        >
                          <CheckCircle2 size={15} />
                          Selesai
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* === END 37 ADMIN MESSAGES PHASE 3 OPERATIONAL MESSAGE CARD === */}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default ClientMessagesPage;
