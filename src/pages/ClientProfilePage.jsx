import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Headphones,
  Link2,
  Loader2,
  Mail,
  MessageCircle,
  Music2,
  Phone,
  ReceiptText,
  Save,
  ShieldCheck,
  Sparkles,
  StickyNote,
  UserRound,
  Users,
  WalletCards
} from 'lucide-react';
import ClientPortalNav from '../components/ClientPortalNav';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import './ClientPortal.css';

const digits = (value) => String(value || '').replace(/\D/g, '');

const clientTypeOptions = [
  'Band',
  'Solo Artist',
  'Content Creator',
  'Podcaster',
  'Producer',
  'Komunitas',
  'Umum',
];

const genreOptions = [
  'Pop',
  'Rock',
  'Metal',
  'Indie',
  'Jazz',
  'Worship',
  'Dangdut',
  'EDM',
  'Hip Hop',
  'Podcast / Talk',
  'Lainnya',
];

const needOptions = [
  'Rehearsal',
  'Recording',
  'Mixing',
  'Podcast',
  'Content',
  'Event Prep',
  'Lainnya',
];

const preferredTimeOptions = [
  'Pagi',
  'Siang',
  'Sore',
  'Malam',
  'Weekend',
  'Fleksibel',
];

const paymentOptions = [
  'Cash',
  'Transfer',
  'QRIS',
  'DP dulu',
  'Fleksibel',
];

const buildInitialForm = (user, userProfile) => ({
  username:
    userProfile?.username ||
    userProfile?.displayName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    '',
  phone: userProfile?.phone || '',
  projectName: userProfile?.projectName || userProfile?.clientName || '',
  clientType: userProfile?.clientType || '',
  primaryGenre: userProfile?.primaryGenre || '',
  mainNeed: userProfile?.mainNeed || '',
  memberCount: userProfile?.memberCount || '',
  preferredDuration: userProfile?.preferredDuration || '',
  preferredTime: userProfile?.preferredTime || '',
  preferredDays: userProfile?.preferredDays || '',
  socialLink: userProfile?.socialLink || '',
  gearNotes: userProfile?.gearNotes || '',
  invoiceName: userProfile?.invoiceName || '',
  paymentPreference: userProfile?.paymentPreference || '',
});

const ClientProfilePage = () => {
  const {
    user,
    userProfile,
    isAuthLoaded,
    logout,
    updateUserProfile,
  } = useAuthStore();

  const addNotification = useNotificationStore((state) => state.addNotification);

  const initialForm = useMemo(() => buildInitialForm(user, userProfile), [
    user,
    userProfile,
  ]);

  const [formData, setFormData] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData(initialForm);
  }, [initialForm]);

  const updateField = (fieldName, value) => {
    setFormData((current) => ({ ...current, [fieldName]: value }));
  };

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
  const firstLetter = (formData.projectName || displayName)?.trim()?.charAt(0)?.toUpperCase() || 'C';
  const hasPhone = digits(formData.phone).length >= 9;
  const hasEmail = Boolean(user?.email || userProfile?.email);
  const isCustomerLinked = Boolean(userProfile?.linkedCustomerId);

  const profileReadinessItems = [
    { label: 'Email login', value: hasEmail ? emailLabel : 'Belum tersedia', complete: hasEmail },
    { label: 'Nomor WhatsApp', value: hasPhone ? 'Siap untuk follow up admin' : 'Belum lengkap', complete: hasPhone },
    { label: 'Nama project', value: formData.projectName || 'Belum diisi', complete: Boolean(formData.projectName) },
    { label: 'Tipe client', value: formData.clientType || 'Belum dipilih', complete: Boolean(formData.clientType) },
    { label: 'Genre / kategori', value: formData.primaryGenre || 'Belum dipilih', complete: Boolean(formData.primaryGenre) },
    { label: 'Kebutuhan utama', value: formData.mainNeed || 'Belum dipilih', complete: Boolean(formData.mainNeed) },
    { label: 'Customer sync', value: isCustomerLinked ? 'Terhubung ke database customer' : 'Menunggu booking/approve admin', complete: isCustomerLinked, optional: true },
  ];

  const scoreItems = profileReadinessItems.filter((item) => !item.optional);
  const completionScore = Math.round((scoreItems.filter((item) => item.complete).length / scoreItems.length) * 100);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanUsername = formData.username.trim().toLowerCase().replace(/\s+/g, '');
    const cleanPhone = formData.phone.trim();

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
      await updateUserProfile(cleanUsername, cleanPhone, {
        projectName: formData.projectName,
        clientType: formData.clientType,
        primaryGenre: formData.primaryGenre,
        mainNeed: formData.mainNeed,
        memberCount: formData.memberCount,
        preferredDuration: formData.preferredDuration,
        preferredTime: formData.preferredTime,
        preferredDays: formData.preferredDays,
        socialLink: formData.socialLink,
        gearNotes: formData.gearNotes,
        invoiceName: formData.invoiceName,
        paymentPreference: formData.paymentPreference,
      });

      addNotification({
        type: 'success',
        title: 'Profil client tersimpan',
        message: 'Data professional profile berhasil diperbarui.',
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
              <span>Professional client profile</span>
            </div>

            <h1>Profil client kamu.</h1>
            <p>
              Lengkapi identitas studio supaya booking, pesan admin, billing, gear setup, dan histori customer jadi lebih rapi.
            </p>
          </div>

          <aside className="client-profile-score-card client-identity-card">
            <div className="client-profile-avatar xl">{firstLetter}</div>
            <div>
              <span>37 Client ID</span>
              <strong>{formData.projectName || displayName}</strong>
              <small>{[formData.primaryGenre, formData.mainNeed].filter(Boolean).join(' / ') || 'Lengkapi genre dan kebutuhan utama'}</small>
            </div>
            <div className="client-id-meta-grid">
              <span>{formData.clientType || 'Client'}</span>
              <span>{formData.memberCount ? formData.memberCount + ' personel' : 'Personel belum diisi'}</span>
              <span>{formData.preferredDuration ? formData.preferredDuration + ' jam' : 'Durasi fleksibel'}</span>
              <span>{formData.preferredTime || 'Waktu fleksibel'}</span>
            </div>
          </aside>
        </header>

        <section className="client-profile-layout client-profile-pro-layout">
          <form className="client-panel client-profile-form client-profile-pro-form" onSubmit={handleSubmit}>
            <div className="client-panel-header">
              <div>
                <span>Data professional</span>
                <h2>Identitas client.</h2>
              </div>
              <UserRound size={20} />
            </div>

            <div className="client-profile-section-block">
              <div className="client-profile-section-title">
                <ShieldCheck size={15} />
                <span>Account Identity</span>
              </div>

              <label className="client-profile-field">
                <span>Username</span>
                <div className="client-profile-input-wrap">
                  <UserRound size={17} />
                  <input
                    value={formData.username}
                    onChange={(event) => updateField('username', event.target.value)}
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
                    value={formData.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                    placeholder="contoh: 081234567890"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </div>
                <small>Nomor ini membantu admin menghubungkan booking dan follow up pesan.</small>
              </label>

              <label className="client-profile-field">
                <span>Nama invoice</span>
                <div className="client-profile-input-wrap">
                  <ReceiptText size={17} />
                  <input
                    value={formData.invoiceName}
                    onChange={(event) => updateField('invoiceName', event.target.value)}
                    placeholder="nama yang ingin dipakai di invoice"
                  />
                </div>
              </label>
            </div>

            <div className="client-profile-section-block">
              <div className="client-profile-section-title">
                <Music2 size={15} />
                <span>Studio Profile</span>
              </div>

              <label className="client-profile-field">
                <span>Nama band / project</span>
                <div className="client-profile-input-wrap">
                  <Music2 size={17} />
                  <input
                    value={formData.projectName}
                    onChange={(event) => updateField('projectName', event.target.value)}
                    placeholder="contoh: Naufal Band / Podcast Kopi"
                  />
                </div>
              </label>

              <div className="client-profile-form-grid two">
                <label className="client-profile-field">
                  <span>Tipe client</span>
                  <div className="client-profile-input-wrap">
                    <Users size={17} />
                    <select value={formData.clientType} onChange={(event) => updateField('clientType', event.target.value)}>
                      <option value="">Pilih tipe client</option>
                      {clientTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                </label>

                <label className="client-profile-field">
                  <span>Genre / kategori</span>
                  <div className="client-profile-input-wrap">
                    <Headphones size={17} />
                    <select value={formData.primaryGenre} onChange={(event) => updateField('primaryGenre', event.target.value)}>
                      <option value="">Pilih genre</option>
                      {genreOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                </label>
              </div>

              <div className="client-profile-form-grid two">
                <label className="client-profile-field">
                  <span>Kebutuhan utama</span>
                  <div className="client-profile-input-wrap">
                    <Calendar size={17} />
                    <select value={formData.mainNeed} onChange={(event) => updateField('mainNeed', event.target.value)}>
                      <option value="">Pilih kebutuhan</option>
                      {needOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                </label>

                <label className="client-profile-field">
                  <span>Jumlah personel</span>
                  <div className="client-profile-input-wrap">
                    <Users size={17} />
                    <input
                      value={formData.memberCount}
                      onChange={(event) => updateField('memberCount', event.target.value)}
                      placeholder="contoh: 4"
                      inputMode="numeric"
                    />
                  </div>
                </label>
              </div>

              <label className="client-profile-field">
                <span>Social media / portfolio</span>
                <div className="client-profile-input-wrap">
                  <Link2 size={17} />
                  <input
                    value={formData.socialLink}
                    onChange={(event) => updateField('socialLink', event.target.value)}
                    placeholder="Instagram, TikTok, YouTube, Spotify, atau link portfolio"
                  />
                </div>
              </label>
            </div>

            <div className="client-profile-section-block">
              <div className="client-profile-section-title">
                <Clock size={15} />
                <span>Booking Preference</span>
              </div>

              <div className="client-profile-form-grid two">
                <label className="client-profile-field">
                  <span>Durasi favorit</span>
                  <div className="client-profile-input-wrap">
                    <Clock size={17} />
                    <select value={formData.preferredDuration} onChange={(event) => updateField('preferredDuration', event.target.value)}>
                      <option value="">Pilih durasi</option>
                      <option value="1">1 jam</option>
                      <option value="2">2 jam</option>
                      <option value="3">3 jam</option>
                      <option value="4">4 jam</option>
                      <option value="5">5 jam</option>
                    </select>
                  </div>
                </label>

                <label className="client-profile-field">
                  <span>Waktu favorit</span>
                  <div className="client-profile-input-wrap">
                    <Calendar size={17} />
                    <select value={formData.preferredTime} onChange={(event) => updateField('preferredTime', event.target.value)}>
                      <option value="">Pilih waktu</option>
                      {preferredTimeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                </label>
              </div>

              <div className="client-profile-form-grid two">
                <label className="client-profile-field">
                  <span>Hari favorit</span>
                  <div className="client-profile-input-wrap">
                    <Calendar size={17} />
                    <input
                      value={formData.preferredDays}
                      onChange={(event) => updateField('preferredDays', event.target.value)}
                      placeholder="contoh: Sabtu malam / weekday sore"
                    />
                  </div>
                </label>

                <label className="client-profile-field">
                  <span>Preferensi pembayaran</span>
                  <div className="client-profile-input-wrap">
                    <WalletCards size={17} />
                    <select value={formData.paymentPreference} onChange={(event) => updateField('paymentPreference', event.target.value)}>
                      <option value="">Pilih metode</option>
                      {paymentOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                </label>
              </div>

              <label className="client-profile-field">
                <span>Catatan gear / setup</span>
                <div className="client-profile-input-wrap textarea-wrap">
                  <StickyNote size={17} />
                  <textarea
                    value={formData.gearNotes}
                    onChange={(event) => updateField('gearNotes', event.target.value)}
                    placeholder="Contoh: butuh mic extra, DI box, keyboard, setting drum tertentu, atau request operator."
                    rows={4}
                  />
                </div>
              </label>
            </div>

            <button type="submit" className="client-submit-btn client-profile-save-btn" disabled={isSaving}>
              {isSaving ? <Loader2 className="spinner" size={16} /> : <Save size={16} />}
              {isSaving ? 'Menyimpan...' : 'Simpan Professional Profile'}
            </button>
          </form>

          <aside className="client-panel client-profile-info-panel">
            <div className="client-panel-header">
              <div>
                <span>Akun login</span>
                <h2>Kesiapan portal.</h2>
              </div>
              <ShieldCheck size={20} />
            </div>

            <div className="client-profile-readiness-card">
              <div className="client-profile-readiness-head">
                <div>
                  <span>Checklist akun</span>
                  <strong>Kesiapan portal</strong>
                </div>
                <em>{completionScore}%</em>
              </div>

              <div className="client-profile-readiness-list pro">
                {profileReadinessItems.map((item) => (
                  <div className={item.complete ? 'complete' : item.optional ? 'syncing' : ''} key={item.label}>
                    {item.complete ? <CheckCircle2 size={16} /> : item.optional ? <Link2 size={16} /> : <CheckCircle2 size={16} />}
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.value}</small>
                    </span>
                  </div>
                ))}
              </div>
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
                <Music2 size={17} />
                <div>
                  <strong>Studio profile</strong>
                  <p>{[formData.clientType, formData.primaryGenre, formData.mainNeed].filter(Boolean).join(' • ') || 'Belum lengkap'}</p>
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
              <strong>Kenapa data professional penting?</strong>
              <p>
                Admin bisa menyiapkan setup lebih cepat, membaca kebutuhan sesi, menyesuaikan billing, dan menghubungkan histori booking dengan lebih akurat.
              </p>
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
            )}
          </aside>
        </section>
      </section>
    </main>
  );
};

export default ClientProfilePage;
