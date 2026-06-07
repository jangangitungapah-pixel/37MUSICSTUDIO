import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  LogOut,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
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
  const completionScore = hasPhone ? 100 : 70;

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

      <nav className="client-nav client-dashboard-nav">
        <Link to="/client/dashboard" className="client-brand">
          <span className="client-brand-mark">37</span>
          <span>Client Profile</span>
        </Link>

        <div className="client-nav-actions">
          <Link to="/client/dashboard" className="client-ghost-btn">
            <ArrowLeft size={15} />
            Dashboard
          </Link>
          <button type="button" className="client-ghost-btn" onClick={logout}>
            <LogOut size={15} />
            Keluar
          </button>
        </div>
      </nav>

      <section className="client-profile-shell">
        <header className="client-profile-hero">
          <div>
            <div className="client-kicker">
              <Sparkles size={16} />
              <span>Lengkapi data client</span>
            </div>

            <h1>Profil client studio.</h1>
            <p>
              Simpan username dan nomor WhatsApp aktif agar request booking, pesan ke admin,
              dan histori studio kamu lebih mudah tersambung.
            </p>
          </div>

          <aside className="client-profile-score-card">
            <div className="client-profile-avatar xl">{firstLetter}</div>
            <div>
              <span>Kelengkapan profil</span>
              <strong>{completionScore}%</strong>
              <small>{hasPhone ? 'Profil siap dipakai.' : 'Tambahkan nomor WhatsApp.'}</small>
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
          </aside>
        </section>
      </section>
    </main>
  );
};

export default ClientProfilePage;
