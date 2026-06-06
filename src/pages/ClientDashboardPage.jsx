import { Link, Navigate } from 'react-router-dom';
import {
  Calendar,
  Clock3,
  LogOut,
  MessageCircle,
  Mic2,
  Music2,
  ReceiptText,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import './ClientPortal.css';

const ClientDashboardPage = () => {
  const { user, userProfile, isAuthLoaded, logout } = useAuthStore();

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

  const displayName = userProfile?.username || user?.displayName || user?.email?.split('@')[0] || 'Client';

  return (
    <main className="client-portal-page client-dashboard-page">
      <div className="client-ambient-bg" aria-hidden="true">
        <span className="client-blob client-blob-pink" />
        <span className="client-blob client-blob-cyan" />
      </div>

      <nav className="client-nav">
        <Link to="/client/dashboard" className="client-brand">
          <span className="client-brand-mark">37</span>
          <span>Client Portal</span>
        </Link>

        <button type="button" className="client-ghost-btn" onClick={logout}>
          <LogOut size={15} />
          Keluar
        </button>
      </nav>

      <section className="client-dashboard-hero">
        <div className="client-kicker">
          <Sparkles size={16} />
          <span>Halo, {displayName}</span>
        </div>
        <h1>Aktivitas studio kamu akan tampil di sini.</h1>
        <p>
          Dashboard client disiapkan untuk ringkasan latihan, recording, booking mendatang,
          pembayaran, dan pesan langsung ke admin.
        </p>
      </section>

      <section className="client-dashboard-grid">
        <div className="client-stat-card">
          <Music2 size={20} />
          <span>Total Latihan</span>
          <strong>0</strong>
          <small>Riwayat akan dihitung dari booking client.</small>
        </div>

        <div className="client-stat-card">
          <Mic2 size={20} />
          <span>Total Recording</span>
          <strong>0</strong>
          <small>Session recording client.</small>
        </div>

        <div className="client-stat-card">
          <Clock3 size={20} />
          <span>Jam Studio</span>
          <strong>0</strong>
          <small>Total durasi pemakaian.</small>
        </div>

        <div className="client-stat-card">
          <ReceiptText size={20} />
          <span>Tagihan Aktif</span>
          <strong>0</strong>
          <small>Status pembayaran dan DP.</small>
        </div>
      </section>

      <section className="client-action-panel">
        <div>
          <h2>Langkah berikutnya</h2>
          <p>Phase berikutnya akan menghubungkan dashboard ini ke data booking, request booking, dan Message to Admin.</p>
        </div>

        <div className="client-action-list">
          <Link to="/jadwal-publik" className="client-action-card">
            <Calendar size={18} />
            <span>Cek Jadwal</span>
          </Link>
          <button type="button" className="client-action-card" disabled>
            <MessageCircle size={18} />
            <span>Message to Admin</span>
          </button>
        </div>
      </section>
    </main>
  );
};

export default ClientDashboardPage;
