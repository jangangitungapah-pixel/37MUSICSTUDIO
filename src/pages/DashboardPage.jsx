import { useMemo } from 'react';
import { useBookingStore } from '../store/useBookingStore';
import { useBookingRequestStore } from '../store/useBookingRequestStore';
import { useCustomerStore } from '../store/useCustomerStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { format, subDays, addMonths } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  TrendingUp, TrendingDown, Users, CalendarCheck, PackageOpen, Clock,
  ArrowRight, AlertTriangle, CheckCircle2, Music2, Lightbulb, Wallet, Activity, Download,
  Inbox, MessageCircle, CalendarPlus, Wrench, Gift, XCircle, Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getAnomalies,
  getBillingInsights,
  getCustomerRetentionInsights,
  getDemandInsights,
  getMaintenanceUsageInsights,
  getRevenueForecast,
  getSlotRecommendations,
} from '../lib/smartInsights';
import { hasBookingOverlap } from '../lib/bookingWorkflows';
import { buildDashboardWorkbook } from '../lib/dashboardWorkbook';
import { useStaffStore } from '../store/useStaffStore';
import { toast } from 'sonner';
import MotionSection from '../components/animation/MotionSection';
import MotionButton from '../components/animation/MotionButton';
import { MotionListItem } from '../components/animation/MotionListItem';
import './DashboardPage.css';

const COLORS = ['#00f0ff', '#4CAF50', '#FFC107', '#ff2a5f'];

const DashboardPage = () => {
  const { bookings, getMonthlyStats, addBooking } = useBookingStore();
  const { requests, updateRequestStatus } = useBookingRequestStore();
  const { customers } = useCustomerStore();
  const { inventory, getStats: getInvStats } = useInventoryStore();
  const { transactions } = useFinanceStore();
  const { pricePerHour, studioName, operationalHours = { start: 10, end: 23 } } = useSettingsStore();
  const { staffMembers } = useStaffStore();
  const navigate = useNavigate();

  const today = useMemo(() => new Date(), []);
  const currentHour = today.getHours();
  const greeting = currentHour < 11 ? 'Selamat Pagi' : currentHour < 15 ? 'Selamat Siang' : currentHour < 18 ? 'Selamat Sore' : 'Selamat Malam';

  const bookingStats = getMonthlyStats(today);
  const lastMonthStats = getMonthlyStats(addMonths(today, -1));
  const invStats = getInvStats();

  const revTrend = lastMonthStats.totalRevenue > 0
    ? Math.round(((bookingStats.totalRevenue - lastMonthStats.totalRevenue) / lastMonthStats.totalRevenue) * 100)
    : null;
  const bookTrend = lastMonthStats.totalBookings > 0
    ? Math.round(((bookingStats.totalBookings - lastMonthStats.totalBookings) / lastMonthStats.totalBookings) * 100)
    : null;

  const combinedData = useMemo(() => {
    const allEntries = [...transactions];
    bookings.forEach(b => {
      const base = b.type === 'recording' ? (b.sessionPrice || 0) : (b.duration * pricePerHour);
      const total = base - (b.discountAmount || 0);
      if (b.status === 'confirmed') allEntries.push({ date: b.date, type: 'income', amount: total });
      else if (b.status === 'dp' && b.dpAmount > 0) allEntries.push({ date: b.date, type: 'income', amount: b.dpAmount });
    });
    return allEntries;
  }, [transactions, bookings, pricePerHour]);

  const demandInsights = useMemo(() => getDemandInsights(bookings), [bookings]);
  const billingInsights = useMemo(() => getBillingInsights(bookings, pricePerHour), [bookings, pricePerHour]);
  const revenueForecast = useMemo(
    () => getRevenueForecast(bookings, transactions, pricePerHour, today),
    [bookings, transactions, pricePerHour, today]
  );
  const anomalies = useMemo(() => getAnomalies(bookings, pricePerHour), [bookings, pricePerHour]);
  const pendingRequests = useMemo(
    () => requests
      .filter((request) => request.status === 'pending')
      .sort((a, b) => (a.date || '').localeCompare(b.date || '') || Number(a.hour || 0) - Number(b.hour || 0)),
    [requests]
  );
  const slotRecommendations = useMemo(
    () => getSlotRecommendations(bookings, {
      fromDate: today,
      duration: 2,
      startHour: operationalHours.start,
      endHour: operationalHours.end,
      limit: 3,
    }),
    [bookings, operationalHours.end, operationalHours.start, today]
  );
  const retentionInsights = useMemo(() => getCustomerRetentionInsights(customers), [customers]);
  const maintenanceInsights = useMemo(() => getMaintenanceUsageInsights(inventory, bookings), [inventory, bookings]);
  const priorityMaintenance = maintenanceInsights.recommendations.filter(({ priority }) => priority >= 3).slice(0, 3);

  const revenueChartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const income = combinedData.filter(t => t.date === dateStr && t.type === 'income').reduce((s, t) => s + t.amount, 0);
      return { name: format(d, 'EEE'), Pendapatan: income };
    });
  }, [combinedData, today]);

  const inventoryChartData = [
    { name: 'Excellent', value: invStats.excellent },
    { name: 'Good', value: invStats.good },
    { name: 'Perlu Servis', value: invStats.needsRepair },
    { name: 'Rusak', value: invStats.broken },
  ].filter(d => d.value > 0);

  const topCustomers = [...customers].sort((a, b) => b.totalBookings - a.totalBookings).slice(0, 5);

  // Today's bookings
  const todayStr = format(today, 'yyyy-MM-dd');
  const tomorrowStr = format(subDays(today, -1), 'yyyy-MM-dd');
  const todayBookings = bookings.filter(b => b.date === todayStr).sort((a, b) => a.hour - b.hour);
  const tomorrowBookings = bookings.filter(b => b.date === tomorrowStr).sort((a, b) => a.hour - b.hour);
  const upcomingBookings = [...todayBookings.map(b => ({ ...b, _tag: 'Hari Ini' })), ...tomorrowBookings.map(b => ({ ...b, _tag: 'Besok' }))].slice(0, 5);

  const formatCurrency = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  const formatK = (num) => num >= 1000000 ? `${(num / 1000000).toFixed(1)}jt` : num >= 1000 ? `${Math.round(num / 1000)}k` : num;
  const formatDateShort = (date) => date ? format(new Date(`${date}T00:00:00`), 'dd MMM') : '-';

  const getStatusColor = (s) => ({ confirmed: '#4CAF50', dp: '#00f0ff', pending: '#FF9800', maintenance: '#6b6b76' }[s] || '#6b6b76');

  const handleApproveRequest = async (request) => {
    const candidate = {
      date: request.date,
      hour: Number(request.hour),
      duration: Number(request.duration || 1),
    };

    if (hasBookingOverlap(bookings, candidate)) {
      toast.error('Slot request sudah terisi. Buka kalender untuk cek bentrok.');
      navigate('/calendar');
      return;
    }

    try {
      await addBooking({
        type: 'booking',
        band: request.band,
        phone: request.phone || '',
        date: request.date,
        hour: Number(request.hour),
        duration: Number(request.duration || 1),
        status: 'pending',
        dpAmount: 0,
        note: 'Dibuat dari request kalender publik via dashboard.',
      });
      await updateRequestStatus(request.id, 'approved', { approvedAt: new Date().toISOString() });
      toast.success(`${request.band} masuk ke kalender.`);
    } catch (error) {
      toast.error(error.message || 'Gagal approve request.');
    }
  };

  const handleRejectRequest = async (request) => {
    const reason = window.prompt('Alasan penolakan request booking:', 'Slot tidak tersedia');
    if (reason === null) return;

    try {
      await updateRequestStatus(request.id, 'rejected', { rejectionReason: reason, rejectedAt: new Date().toISOString() });
      toast.success(`${request.band} dipindahkan dari antrean.`);
    } catch (error) {
      toast.error(error.message || 'Gagal menolak request.');
    }
  };

  const handleSendBillingReminder = (invoice) => {
    if (!invoice.phone) {
      toast.error('Nomor telepon tidak tersedia untuk jadwal ini.');
      return;
    }

    const remaining = formatCurrency(invoice.remaining);
    const message = `Halo ${invoice.band}, mengingatkan masih ada sisa tagihan ${remaining} untuk jadwal ${formatDateShort(invoice.date)} jam ${String(invoice.hour).padStart(2, '0')}:00 di ${studioName}. Mohon konfirmasi pembayaran ya. Terima kasih.`;
    const phone = invoice.phone.replace(/\D/g, '');
    const url = `https://wa.me/${phone.startsWith('0') ? `62${phone.slice(1)}` : phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleExportExcel = async () => {
    let toastId;
    try {
      toastId = toast.loading('Memproses dokumen Excel...');
      const [{ default: ExcelJS }, fileSaver] = await Promise.all([
        import('exceljs'),
        import('file-saver'),
      ]);
      const saveAsFile = fileSaver.saveAs || fileSaver.default;

      const reportDate = new Date();
      const workbook = buildDashboardWorkbook(new ExcelJS.Workbook(), {
        bookings,
        customers,
        inventory,
        staffMembers,
        transactions,
        pricePerHour,
        studioName,
        operationalHours,
        today: reportDate,
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const filename = `Laporan_Dashboard_${studioName || 'Studio'}_${format(reportDate, 'yyyy-MM-dd_HH-mm')}.xlsx`;
      saveAsFile(blob, filename.replace(/\s+/g, '_'));

      toast.success('Laporan dashboard berhasil diunduh!', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat memproses laporan Excel.', { id: toastId });
    }
  };
  return (
    <div className="app-page dashboard-page">

      {/* ===== Greeting Banner ===== */}
      <MotionSection direction="down" className="dash-greeting glass-panel">
        <div className="dash-greeting-left">
          <div className="dash-greeting-icon"><Music2 size={22} /></div>
          <div>
            <h2 className="dash-greeting-title">{greeting}, Admin! 👋</h2>
            <p className="dash-greeting-sub">{studioName} · {format(today, 'EEEE, dd MMMM yyyy')}</p>
          </div>
        </div>
        <div className="dash-greeting-right">
          {invStats.serviceNeeded > 0 && (
            <div className="dash-alert-chip warning">
              <AlertTriangle size={13} />
              <span>{invStats.serviceNeeded} alat perlu servis</span>
            </div>
          )}
          {bookingStats.pending > 0 && (
            <div className="dash-alert-chip danger">
              <Clock size={13} />
              <span>{bookingStats.pending} booking belum bayar</span>
            </div>
          )}
          {pendingRequests.length > 0 && (
            <div className="dash-alert-chip info">
              <Inbox size={13} />
              <span>{pendingRequests.length} request publik</span>
            </div>
          )}
          {bookingStats.pending === 0 && invStats.serviceNeeded === 0 && pendingRequests.length === 0 && (
            <div className="dash-alert-chip success">
              <CheckCircle2 size={13} />
              <span>Semua berjalan lancar!</span>
            </div>
          )}
          <MotionButton onClick={handleExportExcel} className="btn-primary" style={{ marginLeft: 8, padding: '8px 16px', borderRadius: '12px' }} title="Unduh Semua Laporan (Excel)">
            <Download size={16} />
            <span className="hide-on-mobile">Unduh Laporan</span>
          </MotionButton>
        </div>
      </MotionSection>

      {/* ===== Smart Insights ===== */}
      <MotionSection direction="up" className="app-smart-panel dash-smart-grid" style={{flexDirection: 'row', gap: '12px', flexWrap: 'wrap'}}>
        <MotionListItem as="div" className="smart-item" style={{flex: 1}}>
          <div className="smart-head" style={{color: 'var(--accent-cyan)'}}>
            <Lightbulb size={16} />
            <span style={{fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Pola Booking</span>
          </div>
          <strong style={{fontSize: '0.92rem', color: 'var(--text-primary)'}}>{demandInsights.busiestDayCount > 0 ? `${demandInsights.busiestDay}, ${demandInsights.busiestHour}.00` : 'Belum ada pola'}</strong>
          <small style={{fontSize: '0.72rem', color: 'var(--text-secondary)'}}>{demandInsights.favoriteDuration ? `Durasi favorit ${demandInsights.favoriteDuration} jam, okupansi ${demandInsights.occupancyPercent}%` : 'Butuh data booking untuk membaca tren.'}</small>
        </MotionListItem>
        <MotionListItem as="div" className="smart-item" style={{flex: 1}}>
          <div className="smart-head" style={{color: '#4CAF50'}}>
            <Wallet size={16} />
            <span style={{fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Forecast Bulan Ini</span>
          </div>
          <strong style={{fontSize: '0.92rem', color: 'var(--text-primary)'}}>{formatCurrency(revenueForecast.conservativeForecast)}</strong>
          <small style={{fontSize: '0.72rem', color: 'var(--text-secondary)'}}>Optimistis {formatCurrency(revenueForecast.optimisticForecast)} termasuk sisa tagihan.</small>
        </MotionListItem>
        <MotionListItem as="div" className="smart-item" style={{flex: 1}}>
          <div className="smart-head" style={{color: '#FFA000'}}>
            <Clock size={16} />
            <span style={{fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Follow-up Billing</span>
          </div>
          <strong style={{fontSize: '0.92rem', color: 'var(--text-primary)'}}>{billingInsights.followUpsToday.length} prioritas hari ini</strong>
          <small style={{fontSize: '0.72rem', color: 'var(--text-secondary)'}}>{billingInsights.summary}</small>
        </MotionListItem>
        <MotionListItem as="div" className="smart-item" style={{flex: 1}}>
          <div className="smart-head" style={{color: anomalies.length ? 'var(--accent-pink)' : '#4CAF50'}}>
            <Activity size={16} />
            <span style={{fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Anomali Data</span>
          </div>
          <strong style={{fontSize: '0.92rem', color: 'var(--text-primary)'}}>{anomalies.length ? `${anomalies.length} perlu dicek` : 'Tidak ada anomali'}</strong>
          <small style={{fontSize: '0.72rem', color: 'var(--text-secondary)'}}>{anomalies[0]?.detail || 'Harga, DP, jam, dan overlap jadwal terlihat normal.'}</small>
        </MotionListItem>
      </MotionSection>

      {/* ===== Operational Command Center ===== */}
      <MotionSection direction="up" delay={0.1} className="dash-command-grid">
        <section className="dash-command-panel glass-panel">
          <div className="dash-command-head">
            <div className="dash-command-title">
              <Inbox size={17} />
              <div>
                <h3>Request Publik</h3>
                <p>{pendingRequests.length} menunggu keputusan</p>
              </div>
            </div>
            <button className="dash-mini-link" onClick={() => navigate('/calendar')}>Kalender</button>
          </div>
          <div className="dash-work-list">
            {pendingRequests.slice(0, 3).map((request) => (
              <div className="dash-work-item" key={request.id}>
                <div className="dash-work-main">
                  <strong>{request.band}</strong>
                  <span>{formatDateShort(request.date)} - {String(request.hour).padStart(2, '0')}:00, {request.duration || 1} jam</span>
                </div>
                <div className="dash-work-actions">
                  <button className="icon-btn success dash-icon-action" onClick={() => handleApproveRequest(request)} title="Approve request">
                    <CheckCircle2 size={14} />
                  </button>
                  <button className="icon-btn delete dash-icon-action" onClick={() => handleRejectRequest(request)} title="Tolak request">
                    <XCircle size={14} />
                  </button>
                </div>
              </div>
            ))}
            {pendingRequests.length === 0 && (
              <div className="dash-work-empty">
                <CheckCircle2 size={18} />
                <span>Tidak ada request baru.</span>
              </div>
            )}
          </div>
        </section>

        <section className="dash-command-panel glass-panel">
          <div className="dash-command-head">
            <div className="dash-command-title">
              <MessageCircle size={17} />
              <div>
                <h3>Tagihan Prioritas</h3>
                <p>{billingInsights.openInvoices.length} invoice terbuka</p>
              </div>
            </div>
            <button className="dash-mini-link" onClick={() => navigate('/billing')}>Billing</button>
          </div>
          <div className="dash-work-list">
            {billingInsights.openInvoices.slice(0, 3).map((invoice) => (
              <div className={`dash-work-item urgency-${invoice.urgency}`} key={invoice.id}>
                <div className="dash-work-main">
                  <strong>{invoice.band}</strong>
                  <span>{invoice.daysUntil < 0 ? 'Lewat jadwal' : invoice.daysUntil === 0 ? 'Jadwal hari ini' : invoice.daysUntil === 1 ? 'Jadwal besok' : `H-${invoice.daysUntil}`} - {formatCurrency(invoice.remaining)}</span>
                </div>
                <button className="icon-btn cyan dash-icon-action" onClick={() => handleSendBillingReminder(invoice)} title="Kirim reminder WhatsApp">
                  <Send size={14} />
                </button>
              </div>
            ))}
            {billingInsights.openInvoices.length === 0 && (
              <div className="dash-work-empty">
                <CheckCircle2 size={18} />
                <span>Semua tagihan tertangani.</span>
              </div>
            )}
          </div>
        </section>

        <section className="dash-command-panel glass-panel">
          <div className="dash-command-head">
            <div className="dash-command-title">
              <CalendarPlus size={17} />
              <div>
                <h3>Slot Kosong</h3>
                <p>Rekomendasi 2 jam</p>
              </div>
            </div>
            <button className="dash-mini-link" onClick={() => navigate('/calendar')}>Booking</button>
          </div>
          <div className="dash-work-list compact">
            {slotRecommendations.map((slot) => (
              <button className="dash-slot-item" key={`${slot.date}-${slot.hour}`} onClick={() => navigate('/calendar')} title="Buka kalender">
                <strong>{slot.dayName}, {formatDateShort(slot.date)}</strong>
                <span>{String(slot.hour).padStart(2, '0')}:00-{String(slot.endHour).padStart(2, '0')}:00 - {slot.reason}</span>
              </button>
            ))}
            {slotRecommendations.length === 0 && (
              <div className="dash-work-empty">
                <CalendarCheck size={18} />
                <span>Tidak ada slot kosong dekat.</span>
              </div>
            )}
          </div>
        </section>

        <section className="dash-command-panel glass-panel">
          <div className="dash-command-head">
            <div className="dash-command-title">
              <Wrench size={17} />
              <div>
                <h3>Operasional</h3>
                <p>Servis dan retensi</p>
              </div>
            </div>
            <button className="dash-mini-link" onClick={() => navigate('/maintenance')}>Detail</button>
          </div>
          <div className="dash-work-list">
            {priorityMaintenance.slice(0, 2).map(({ item, label, reason }) => (
              <button className="dash-work-item as-button" key={item.id} onClick={() => navigate('/maintenance')}>
                <div className="dash-work-main">
                  <strong>{item.name}</strong>
                  <span>{label} - {reason}</span>
                </div>
                <Wrench size={14} />
              </button>
            ))}
            <button className="dash-work-item as-button" onClick={() => navigate('/customers')}>
              <div className="dash-work-main">
                <strong>{retentionInsights.passiveCustomers.length} pelanggan pasif</strong>
                <span>{retentionInsights.vipCandidates.length} kandidat VIP, {retentionInsights.promoTargets.length} target promo</span>
              </div>
              <Gift size={14} />
            </button>
          </div>
        </section>
      </MotionSection>

      {/* ===== Stats Cards ===== */}
      <div className="app-stat-grid tour-dashboard-stats">
        {/* Revenue */}
        <div className="app-stat-card">
          <div className="stat-icon" style={{color: 'var(--accent-cyan)', background: 'rgba(0, 240, 255, 0.1)'}}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-data">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span className="stat-label">Pendapatan Bulan Ini</span>
              {revTrend !== null && (
                <span className={`dash-trend ${revTrend >= 0 ? 'up' : 'down'}`}>
                  {revTrend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {revTrend >= 0 ? '+' : ''}{revTrend}%
                </span>
              )}
            </div>
            <span className="stat-value">{formatCurrency(bookingStats.totalRevenue)}</span>
            <span className="stat-note">vs {formatCurrency(lastMonthStats.totalRevenue)} bulan lalu</span>
          </div>
        </div>

        {/* Bookings */}
        <div className="app-stat-card">
          <div className="stat-icon" style={{color: '#4CAF50', background: 'rgba(76, 175, 80, 0.1)'}}>
            <CalendarCheck size={24} />
          </div>
          <div className="stat-data">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span className="stat-label">Total Booking Bulan Ini</span>
              {bookTrend !== null && (
                <span className={`dash-trend ${bookTrend >= 0 ? 'up' : 'down'}`}>
                  {bookTrend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {bookTrend >= 0 ? '+' : ''}{bookTrend}%
                </span>
              )}
            </div>
            <span className="stat-value">{bookingStats.totalBookings}<span style={{fontSize: '0.6em', color: 'var(--text-muted)'}}> sesi</span></span>
            <div className="dash-stat-pills" style={{marginTop: '4px'}}>
              <span className="dash-pill confirmed">{bookingStats.confirmed} Lunas</span>
              <span className="dash-pill dp">{bookingStats.dp} DP</span>
              <span className="dash-pill pending">{bookingStats.pending} Pending</span>
            </div>
          </div>
        </div>

        {/* Customers */}
        <div className="app-stat-card">
          <div className="stat-icon" style={{color: 'var(--accent-pink)', background: 'rgba(255, 42, 95, 0.1)'}}>
            <Users size={24} />
          </div>
          <div className="stat-data">
            <span className="stat-label">Total Pelanggan Terdaftar</span>
            <span className="stat-value">{customers.length}<span style={{fontSize: '0.6em', color: 'var(--text-muted)'}}> orang</span></span>
            <span className="stat-note">{bookingStats.totalHours} jam terpakai bulan ini</span>
          </div>
        </div>

        {/* Inventory Alert */}
        <div className="app-stat-card">
          <div className="stat-icon" style={{color: invStats.serviceNeeded > 0 ? '#FFA000' : '#4CAF50', background: invStats.serviceNeeded > 0 ? 'rgba(255, 152, 0, 0.1)' : 'rgba(76, 175, 80, 0.1)'}}>
            <PackageOpen size={24} />
          </div>
          <div className="stat-data">
            <span className="stat-label">Alat Perlu Perhatian</span>
            <span className={`stat-value ${invStats.serviceNeeded > 0 ? 'warn' : ''}`}>{invStats.serviceNeeded}<span style={{fontSize: '0.6em', color: 'var(--text-muted)'}}> item</span></span>
            <span className="stat-note">dari {invStats.totalItems} total alat inventaris</span>
          </div>
        </div>
      </div>

      {/* ===== Main Grid: Charts + Upcoming ===== */}
      <div className="dash-main-grid">

        {/* Revenue Chart */}
        <div className="chart-container glass-panel span-2 tour-dashboard-revenue-chart">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Tren Pendapatan</h3>
              <p className="chart-sub">7 hari terakhir</p>
            </div>
            <button className="chart-link-btn" onClick={() => navigate('/finance')}>
              Lihat Detail <ArrowRight size={14} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatK} width={50} />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'var(--bg-surface)', 
                  border: '1px solid var(--border-light)', 
                  borderRadius: '12px', 
                  fontSize: '0.8rem',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                  color: 'var(--text-primary)'
                }}
                formatter={(v) => [formatCurrency(v), 'Pendapatan']}
                labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}
              />
              <Area 
                type="monotone" 
                dataKey="Pendapatan" 
                stroke="var(--accent-cyan)" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#cyanGrad)" 
                dot={{ r: 3.5, stroke: 'var(--accent-cyan)', strokeWidth: 2, fill: 'var(--bg-surface)' }} 
                activeDot={{ r: 5.5, stroke: 'var(--accent-cyan)', strokeWidth: 2, fill: 'var(--accent-cyan)' }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming Bookings */}
        <div className="dash-upcoming app-card tour-dashboard-upcoming">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Jadwal Mendatang</h3>
              <p className="chart-sub">Hari ini & besok</p>
            </div>
            <button className="chart-link-btn" onClick={() => navigate('/calendar')}>
              Kalender <ArrowRight size={14} />
            </button>
          </div>
          {upcomingBookings.length === 0 ? (
            <div className="dash-empty-state">
              <CalendarCheck size={32} opacity={0.2} />
              <p>Tidak ada jadwal hari ini</p>
            </div>
          ) : (
            <div className="upcoming-list">
              {upcomingBookings.map(b => (
                <div key={b.id} className="upcoming-item">
                  <div className="upcoming-status-bar" style={{ background: getStatusColor(b.status) }} />
                  <div className="upcoming-info">
                    <div className="upcoming-band">{b.band}</div>
                    <div className="upcoming-time">
                      <Clock size={11} /> {b.hour}.00 – {b.hour + b.duration}.00
                    </div>
                  </div>
                  <span className={`upcoming-tag tag-${b._tag === 'Hari Ini' ? 'today' : 'tomorrow'}`}>{b._tag}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory Pie */}
        <div className="chart-container glass-panel tour-dashboard-inventory-chart">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Kondisi Inventaris</h3>
              <p className="chart-sub">{invStats.totalItems} item total</p>
            </div>
            <button className="chart-link-btn" onClick={() => navigate('/inventory')}>
              Detail <ArrowRight size={14} />
            </button>
          </div>
          {inventoryChartData.length === 0 ? (
            <div className="dash-empty-state">
              <PackageOpen size={32} opacity={0.2} />
              <p>Belum ada data inventaris</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie 
                  data={inventoryChartData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={5} 
                  cornerRadius={4}
                  dataKey="value" 
                  strokeWidth={0}
                >
                  {inventoryChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-surface)', 
                    border: '1px solid var(--border-light)', 
                    borderRadius: '12px', 
                    fontSize: '0.8rem',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                    color: 'var(--text-primary)'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="inv-legend">
            {inventoryChartData.map((d, i) => (
              <div key={i} className="inv-legend-item">
                <span className="inv-legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
                <span>{d.name}</span>
                <strong>{d.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="dash-table-card app-card span-2 tour-dashboard-top-customers">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Top Pelanggan</h3>
              <p className="chart-sub">Berdasarkan loyalitas booking</p>
            </div>
            <button className="chart-link-btn" onClick={() => navigate('/customers')}>
              Semua <ArrowRight size={14} />
            </button>
          </div>
          {topCustomers.length === 0 ? (
            <div className="dash-empty-state">
              <Users size={32} opacity={0.2} />
              <p>Belum ada data pelanggan</p>
            </div>
          ) : (
            <div className="top-customers-list">
              {topCustomers.map((c, i) => (
                <div key={c.id} className="top-cust-row">
                  <div className={`top-cust-rank rank-${i + 1}`}>#{i + 1}</div>
                  <div className="top-cust-avatar">{c.name.charAt(0).toUpperCase()}</div>
                  <div className="top-cust-info">
                    <span className="top-cust-name">{c.name}</span>
                    <span className="top-cust-phone">{c.phone || '—'}</span>
                  </div>
                  <div className="top-cust-stats">
                    <span className="top-cust-bookings">{c.totalBookings}</span>
                    <span className="top-cust-unit">sesi</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
