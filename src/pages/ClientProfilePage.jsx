import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Link,
  Link2,
  Loader2,
  Mail,
  MessageCircle,
  Navigate,
  Phone,
  ReceiptText,
  Save,
  ShieldCheck,
  Sparkles,
  useEffect,
  useMemo,
  UserRound,
  useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import ClientPortalNav from '../components/ClientPortalNav';
import './ClientPortal.css';

const digits = (value) => String(value || '').replace(/\D/g, '');

const ClientProfilePage = () => {
  const {
    user,
    userProfile,
    isAuthLoaded,
    logout,
    updateUserProfile,
  } = useAuthStore();

  const addNotification = useNotificationStore((state) => state.addNotification);

  const initialUsername = useMemo(() => (
    userProfile?.username ||
    userProfile?.displayName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    ''
  ), [userProfile?.username, userProfile?.displayName, user?.displayName, user?.email]);

  const initialPhone = useMemo(() => userProfile?.phone || '', [userProfile?.phone]);

  const [username, setUsername] = useState(initialUsername);
  const [phone, setPhone] = useState(initialPhone);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setUsername(initialUsername);
    setPhone(initialPhone);
  }, [initialUsername, initialPhone]);

  if (!isAuthLoaded) {
    return (
      <div className="client-portal-loader">
        <div className="client-loader-card">
          <div className="client-loader-logo">37</div>
          <span>Memuat profil...</span>
        </div>
      </div>
    );
  }

  if (!user || user.isAnonymous) {
    return <Navigate to="/client" replace />;
  }

  const displayName = userProfile?.displayName || userProfile?.username || user?.displayName || user?.email?.split('@')[0] || 'Client';
  const emailLabel = user?.email || userProfile?.email || 'Email belum tersedia';
  const firstLetter = displayName?.trim()?.charAt(0)?.toUpperCase() || 'C';
  const hasPhone = digits(phone).length >= 9;
  const isCustomerLinked = Boolean(userProfile?.linkedCustomerId);
  const hasEmail = Boolean(user?.email || userProfile?.email);
  const completionScore = Math.round(([
    hasEmail,
    hasPhone,
    isCustomerLinked,
  ].filter(Boolean).length / 3) * 100);

  const profileReadinessItems = [
    { label: 'Email login', value: hasEmail ? emailLabel : 'Belum tersedia', complete: hasEmail },
    { label: 'Nomor WhatsApp', value: hasPhone ? 'Siap untuk follow up admin' : 'Belum lengkap', complete: hasPhone },
    { label: 'Customer sync', value: isCustomerLinked ? 'Terhubung ke database customer' : 'Akan tersinkron saat booking/approve', complete: isCustomerLinked },
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    const cleanPhone = phone.trim();

    if (!cleanUsername) {
      addNotification({
        type: 'error',
        title: 'Username wajib diisi',
        message: 'Isi username client dulu ya.',
      });
      return;
    }

    if (digits(cleanPhone).length < 9) {
      addNotification({
        type: 'warning',
        title: 'Nomor WhatsApp belum lengkap',
        message: 'Masukkan nomor WhatsApp aktif agar booking dan pesan lebih mudah dilacak.',
      });
      return;
    }

    setIsSaving(true);

    try {
      await updateUserProfile(cleanUsername, cleanPhone);

      addNotification({
        type: 'success',
        title: 'Profil client tersimpan',
        message: 'Data profil berhasil diperbarui.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Profil gagal disimpan',
        message: error.message || 'Coba lagi beberapa saat lagi.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="client-portal-page client-dashboard-page client-profile-page">
      <div className="client-ambient-bg" aria-hidden="true">
        <span className="client-blob client-blob-pink" />
        <span className="client-blob client-blob-cyan" />
      </div>
      <ClientPortalNav title="Client Profile" onLogout={logout} />

      <section className="client-profile-shell">
        <header className="client-profile-hero">
          <div>
            <div className="client-kicker">
              <Sparkles size={16} />
              <span>Lengkapi data client</span>
            </div>

            <h1>Profil client studio.</h1>
            <p>
              Lengkapi identitas utama supaya booking, pesan admin, billing, dan histori studio lebih gampang tersambung ke akun kamu.
            </p>
          </div>

          <aside className="client-profile-score-card">
            <div className="client-profile-avatar xl">{firstLetter}</div>
            <div>
              <span>Kelengkapan profil</span>
              <strong>{completionScore}%</strong>
              <small>{hasPhone ? (isCustomerLinked ? 'Profil & customer sudah tersambung.' : 'Profil siap, customer akan tersinkron dari booking.') : 'Tambahkan nomor WhatsApp.'}</small>
            </div>
          </aside>
        </header>

        <section className="client-profile-layout">
          <form className="client-panel client-profile-form" onSubmit={handleSubmit}>
            <div className="client-panel-header">
              <div>
                <span>Data akun</span>
                <h2>Identitas client.</h2>
              </div>
              <UserRound size={20} />
            </div>

            <label className="client-profile-field">
              <span>Username</span>
              <div className="client-profile-input-wrap">
                <UserRound size={17} />
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="contoh: naufalband"
                  autoComplete="username"
                />
              </div>
              <small>Tanpa spasi. Dipakai untuk identitas akun client.</small>
            </label>

            <label className="client-profile-field">
              <span>Nomor WhatsApp</span>
              <div className="client-profile-input-wrap">
                <Phone size={17} />
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="contoh: 081234567890"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>
              <small>Nomor ini membantu admin menghubungkan booking dan follow up pesan.</small>
            </label>

            <button type="submit" className="client-submit-btn client-profile-save-btn" disabled={isSaving}>
              {isSaving ? <Loader2 className="spinner" size={16} /> : <Save size={16} />}
              {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </form>

          <aside className="client-panel client-profile-info-panel">
            <div className="client-panel-header">
              <div>
                <span>Akun login</span>
                <h2>Info login.</h2>
              </div>
              <ShieldCheck size={20} />
            </div>

            <div className="client-profile-info-list">
              <div>
                <Mail size={17} />
                <div>
                  <strong>Email</strong>
                  <p>{emailLabel}</p>
                </div>
              </div>

              <div>
                <UserRound size={17} />
                <div>
                  <strong>Nama tampil</strong>
                  <p>{displayName}</p>
                </div>
              </div>

              <div>
                <CheckCircle2 size={17} />
                <div>
                  <strong>Status</strong>
                  <p>{userProfile?.status || 'active'} • {userProfile?.role || 'client'}</p>
                </div>
              </div>
            </div>

            <div className="client-profile-note">
              <strong>Kenapa nomor WhatsApp penting?</strong>
              <p>
                Jika admin pernah membuat data customer berdasarkan nomor WA, dashboard client bisa lebih mudah
                mengenali riwayat booking yang terkait dengan akun kamu.
              </p>
            </div>

            <div className="client-profile-readiness-card">
              <div className="client-profile-readiness-head">
                <div>
                  <span>Checklist akun</span>
                  <strong>Kesiapan portal</strong>
                </div>
                <em>{completionScore}%</em>
              </div>

              <div className="client-profile-readiness-list">
                {profileReadinessItems.map((item) => (
                  <div className={item.complete ? "complete" : ""} key={item.label}>
                    <CheckCircle2 size={16} />
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.value}</small>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="client-profile-shortcuts">
              <Link to="/jadwal-publik">
                <Calendar size={16} />
                <span>Booking Jadwal</span>
                <ChevronRight size={14} />
              </Link>
              <Link to="/client/messages">
                <MessageCircle size={16} />
                <span>Message Admin</span>
                <ChevronRight size={14} />
              </Link>
              <Link to="/client/billing">
                <ReceiptText size={16} />
                <span>Billing</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {!isCustomerLinked && (
              <div className="client-profile-sync-hint">
                <Link2 size={16} />
                <p>Customer sync akan otomatis tersambung saat booking client dibuat dan admin approve request. Nomor WhatsApp yang sama bikin matching lebih akurat.</p>
              </div>
            )
          </aside>
        </section>
      </section>
    </main>
  );
};

export default ClientProfilePage;
