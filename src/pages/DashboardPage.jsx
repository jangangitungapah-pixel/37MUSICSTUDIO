import { useState, useMemo, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBookingStore } from '../store/useBookingStore';
import { useBookingRequestStore } from '../store/useBookingRequestStore';
import { useCustomerStore } from '../store/useCustomerStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import { format, subDays, addMonths, addDays } from 'date-fns';
import {
  Clock,
  CheckCircle2, Lightbulb, Wallet, Activity,
  Inbox, MessageCircle, Wrench, Gift, XCircle, Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getAnomalies,
  getBillingInsights,
  getCustomerRetentionInsights,
  getDemandInsights,
  getMaintenanceUsageInsights,
  getRevenueForecast,
} from '../lib/smartInsights';
import { hasBookingOverlap } from '../lib/bookingWorkflows';
import { buildDashboardWorkbook } from '../lib/dashboardWorkbook';
import { useStaffStore } from '../store/useStaffStore';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import DashboardHeader from '../features/dashboard/DashboardHeader';
import DashboardMainGrid from '../features/dashboard/DashboardMainGrid';
import DashboardStats from '../features/dashboard/DashboardStats';
import './DashboardPage.css';

const runCelebration = async (options) => {
  if (typeof window === 'undefined' || window.matchMedia?.('(max-width: 768px)').matches) return;

  try {
    const { default: confetti } = await import('canvas-confetti');
    confetti(options);
  } catch {
    // Celebration is optional UI feedback; keep the workflow silent if it fails.
  }
};

const DashboardPage = () => {
  const { bookings, getMonthlyStats, addBooking, updateBookingStatus } = useBookingStore(
    useShallow(state => ({
      bookings: state.bookings,
      getMonthlyStats: state.getMonthlyStats,
      addBooking: state.addBooking,
      updateBookingStatus: state.updateBookingStatus
    }))
  );
  const { requests, updateRequestStatus } = useBookingRequestStore(
    useShallow(state => ({
      requests: state.requests,
      updateRequestStatus: state.updateRequestStatus
    }))
  );
  const customers = useCustomerStore(state => state.customers);
  const { inventory, getStats: getInvStats, updateEquipment } = useInventoryStore(
    useShallow(state => ({
      inventory: state.inventory,
      getStats: state.getStats,
      updateEquipment: state.updateEquipment
    }))
  );
  const { transactions, addTransaction } = useFinanceStore(
    useShallow(state => ({
      transactions: state.transactions,
      addTransaction: state.addTransaction
    }))
  );
  const { pricePerHour, studioName, operationalHours = { start: 10, end: 23 } } = useSettingsStore(
    useShallow(state => ({
      pricePerHour: state.pricePerHour,
      studioName: state.studioName,
      operationalHours: state.operationalHours
    }))
  );
  const staffMembers = useStaffStore(state => state.staffMembers);
  const { user, userProfile } = useAuthStore(
    useShallow(state => ({
      user: state.user,
      userProfile: state.userProfile
    }))
  );
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Modals state
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);
  const [isQuickExpenseOpen, setIsQuickExpenseOpen] = useState(false);

  // Quick Booking Form State
  const [qbBand, setQbBand] = useState('');
  const [qbPhone, setQbPhone] = useState('');
  const [qbDate, setQbDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [qbHour, setQbHour] = useState(10);
  const [qbDuration, setQbDuration] = useState(1);
  const [qbStatus, setQbStatus] = useState('pending');
  const [qbDpAmount, setQbDpAmount] = useState('');
  const [qbNote, setQbNote] = useState('');

  // Quick Expense Form State
  const [qeDescription, setQeDescription] = useState('');
  const [qeAmount, setQeAmount] = useState('');
  const [qeCategory, setQeCategory] = useState('Operasional');
  const [qeDate, setQeDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleInstantPay = async (booking) => {
    try {
      await updateBookingStatus(booking.id, 'confirmed');
      toast.success(`Booking ${booking.band} berhasil dilunasi!`);
      runCelebration({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      toast.error(err.message || 'Gagal melunasi booking.');
    }
  };

  const handleContactCustomer = (customer) => {
    if (!customer.phone) {
      toast.error('Nomor telepon tidak tersedia untuk pelanggan ini.');
      return;
    }
    const message = `Halo ${customer.name}, kami dari ${studioName} ingin mengucapkan terima kasih atas loyalitas Anda latihan bersama kami. Semoga sukses selalu untuk musik Anda!`;
    const phone = customer.phone.replace(/\D/g, '');
    const url = `https://wa.me/${phone.startsWith('0') ? `62${phone.slice(1)}` : phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCompleteMaintenance = async (item) => {
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const nextServiceStr = format(addDays(new Date(), 90), 'yyyy-MM-dd');
      await updateEquipment(item.id, {
        condition: 'Excellent',
        lastServiced: todayStr,
        nextService: nextServiceStr
      });
      toast.success(`Servis ${item.name} selesai! Kondisi diatur ke Excellent.`);
      runCelebration({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err) {
      toast.error(err.message || 'Gagal menyelesaikan servis.');
    }
  };

  const handleQuickBookingSubmit = async (e) => {
    e.preventDefault();
    if (!qbBand.trim()) {
      toast.error('Nama band wajib diisi.');
      return;
    }

    const candidate = {
      date: qbDate,
      hour: Number(qbHour),
      duration: Number(qbDuration)
    };

    if (hasBookingOverlap(bookings, candidate)) {
      toast.error('Slot waktu bentrok dengan booking lain. Cek kalender.');
      return;
    }

    try {
      const dpVal = qbStatus === 'dp' ? Number(qbDpAmount) || 0 : 0;
      await addBooking({
        type: 'booking',
        band: qbBand,
        phone: qbPhone,
        date: qbDate,
        hour: Number(qbHour),
        duration: Number(qbDuration),
        status: qbStatus,
        dpAmount: dpVal,
        note: qbNote || 'Dibuat lewat Quick Booking di dashboard.'
      });
      toast.success(`Booking untuk ${qbBand} berhasil ditambahkan!`);
      runCelebration({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
      setIsQuickBookingOpen(false);
      // Reset form
      setQbBand('');
      setQbPhone('');
      setQbDate(format(new Date(), 'yyyy-MM-dd'));
      setQbHour(10);
      setQbDuration(1);
      setQbStatus('pending');
      setQbDpAmount('');
      setQbNote('');
    } catch (err) {
      toast.error(err.message || 'Gagal menambahkan booking.');
    }
  };

  const handleQuickExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!qeDescription.trim()) {
      toast.error('Keterangan wajib diisi.');
      return;
    }
    const amountVal = Number(qeAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error('Nominal harus berupa angka positif.');
      return;
    }

    try {
      await addTransaction({
        type: 'expense',
        category: qeCategory,
        amount: amountVal,
        description: qeDescription,
        date: qeDate,
        operatorName: userProfile?.name || user?.email || 'Operator'
      });
      toast.success('Pengeluaran berhasil dicatat!');
      runCelebration({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.6 }
      });
      setIsQuickExpenseOpen(false);
      // Reset form
      setQeDescription('');
      setQeAmount('');
      setQeCategory('Operasional');
      setQeDate(format(new Date(), 'yyyy-MM-dd'));
    } catch (err) {
      toast.error(err.message || 'Gagal mencatat pengeluaran.');
    }
  };

  const openQuickBooking = () => {
    setIsQuickBookingOpen(true);
    setQbBand('');
    setQbPhone('');
    setQbDate(format(new Date(), 'yyyy-MM-dd'));
    setQbHour(10);
    setQbDuration(1);
    setQbStatus('pending');
    setQbDpAmount('');
    setQbNote('');
  };

  const openQuickExpense = () => {
    setIsQuickExpenseOpen(true);
    setQeDescription('');
    setQeAmount('');
    setQeCategory('Operasional');
    setQeDate(format(new Date(), 'yyyy-MM-dd'));
  };


  const today = useMemo(() => new Date(), []);
  const currentHour = currentTime.getHours();
  const greeting = currentHour < 11 ? 'Selamat Pagi' : currentHour < 15 ? 'Selamat Siang' : currentHour < 18 ? 'Selamat Sore' : 'Selamat Malam';

  const bookingStats = getMonthlyStats(today);
  const lastMonthStats = getMonthlyStats(addMonths(today, -1));
  const invStats = getInvStats();

  const revenueTargetProgress = Math.min(100, Math.round((bookingStats.totalRevenue / 35000000) * 100));
  const occupancyProgress = Math.min(100, Math.round((bookingStats.totalHours / 390) * 100));
  const activeCustomersCount = customers.filter(c => c.totalBookings > 0).length;
  const activeCustomersProgress = customers.length > 0 ? Math.min(100, Math.round((activeCustomersCount / customers.length) * 100)) : 0;
  const healthyInvItems = (invStats.excellent || 0) + (invStats.good || 0);
  const inventoryHealthProgress = invStats.totalItems > 0 ? Math.round((healthyInvItems / invStats.totalItems) * 100) : 100;

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

  const maxRevenue = useMemo(
    () => Math.max(1, ...revenueChartData.map((item) => item.Pendapatan)),
    [revenueChartData]
  );

  const inventoryChartData = [
    { name: 'Excellent', value: invStats.excellent, color: 'var(--accent-cyan)' },
    { name: 'Good', value: invStats.good, color: 'rgb(var(--success-rgb))' },
    { name: 'Perlu Servis', value: invStats.needsRepair, color: 'rgb(var(--warning-rgb))' },
    { name: 'Rusak', value: invStats.broken, color: 'var(--accent-pink)' },
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

  const handleSendBookingReminder = (booking) => {
    if (!booking.phone) {
      toast.error('Nomor telepon tidak tersedia untuk jadwal ini.');
      return;
    }

    const timeLabel = `${booking.hour}.00`;
    const dateLabel = format(new Date(booking.date + 'T00:00:00'), 'dd MMM yyyy');
    const message = `Halo ${booking.band}, sekadar mengingatkan Anda ada jadwal latihan ${booking._tag === 'Hari Ini' ? 'hari ini' : 'besok'} tanggal ${dateLabel} jam ${timeLabel} WIB di ${studioName}. Mohon datang tepat waktu ya! Terima kasih.`;
    const phone = booking.phone.replace(/\D/g, '');
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

  const displayName = userProfile?.name || userProfile?.username || user?.displayName || (user?.email ? user.email.split('@')[0] : 'Admin');

  return (
    <div className="app-page dashboard-page">
      <DashboardHeader
        greeting={greeting}
        displayName={displayName}
        studioName={studioName}
        currentTime={currentTime}
        invStats={invStats}
        bookingStats={bookingStats}
        pendingRequests={pendingRequests}
        onQuickBooking={openQuickBooking}
        onQuickExpense={openQuickExpense}
        onExportExcel={handleExportExcel}
      />

      <DashboardStats
        bookingStats={bookingStats}
        lastMonthStats={lastMonthStats}
        customersCount={customers.length}
        invStats={invStats}
        revTrend={revTrend}
        bookTrend={bookTrend}
        revenueTargetProgress={revenueTargetProgress}
        occupancyProgress={occupancyProgress}
        activeCustomersProgress={activeCustomersProgress}
        inventoryHealthProgress={inventoryHealthProgress}
        formatCurrency={formatCurrency}
      />
      <DashboardMainGrid
        revenueChartData={revenueChartData}
        maxRevenue={maxRevenue}
        inventoryChartData={inventoryChartData}
        invStats={invStats}
        upcomingBookings={upcomingBookings}
        currentHour={currentHour}
        topCustomers={topCustomers}
        formatK={formatK}
        getStatusColor={getStatusColor}
        onNavigate={navigate}
        onInstantPay={handleInstantPay}
        onSendBookingReminder={handleSendBookingReminder}
        onContactCustomer={handleContactCustomer}
      />
{/* ===== Smart Insights ===== */}
      <section className="app-smart-panel app-smart-grid cols-auto">
        <div className="smart-item">
          <div className="smart-head" style={{color: 'var(--accent-cyan)'}}>
            <Lightbulb size={16} />
            <span style={{fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Pola Booking</span>
          </div>
          <strong style={{fontSize: '0.92rem', color: 'var(--text-primary)'}}>{demandInsights.busiestDayCount > 0 ? `${demandInsights.busiestDay}, ${demandInsights.busiestHour}.00` : 'Belum ada pola'}</strong>
          <small style={{fontSize: '0.72rem', color: 'var(--text-secondary)'}}>{demandInsights.favoriteDuration ? `Durasi favorit ${demandInsights.favoriteDuration} jam, okupansi ${demandInsights.occupancyPercent}%` : 'Butuh data booking untuk membaca tren.'}</small>
        </div>
        <div className="smart-item">
          <div className="smart-head" style={{color: '#4CAF50'}}>
            <Wallet size={16} />
            <span style={{fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Forecast Bulan Ini</span>
          </div>
          <strong style={{fontSize: '0.92rem', color: 'var(--text-primary)'}}>{formatCurrency(revenueForecast.conservativeForecast)}</strong>
          <small style={{fontSize: '0.72rem', color: 'var(--text-secondary)'}}>Optimistis {formatCurrency(revenueForecast.optimisticForecast)} termasuk sisa tagihan.</small>
        </div>
        <div className="smart-item">
          <div className="smart-head" style={{color: '#FFA000'}}>
            <Clock size={16} />
            <span style={{fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Follow-up Billing</span>
          </div>
          <strong style={{fontSize: '0.92rem', color: 'var(--text-primary)'}}>{billingInsights.followUpsToday.length} prioritas hari ini</strong>
          <small style={{fontSize: '0.72rem', color: 'var(--text-secondary)'}}>{billingInsights.summary}</small>
        </div>
        <div className="smart-item">
          <div className="smart-head" style={{color: anomalies.length ? 'var(--accent-pink)' : '#4CAF50'}}>
            <Activity size={16} />
            <span style={{fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Anomali Data</span>
          </div>
          <strong style={{fontSize: '0.92rem', color: 'var(--text-primary)'}}>{anomalies.length ? `${anomalies.length} perlu dicek` : 'Tidak ada anomali'}</strong>
          <small style={{fontSize: '0.72rem', color: 'var(--text-secondary)'}}>{anomalies[0]?.detail || 'Harga, DP, jam, dan overlap jadwal terlihat normal.'}</small>
        </div>
      </section>

      {/* ===== Operational Command Center ===== */}
      <section className="dash-command-grid">
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
                  <button 
                    className="icon-btn success dash-icon-action approve" 
                    onClick={() => handleApproveRequest(request)} 
                    title="Approve request"
                    aria-label={`Setujui request booking dari ${request.band}`}
                  >
                    <CheckCircle2 size={14} />
                  </button>
                  <button 
                    className="icon-btn delete dash-icon-action reject" 
                    onClick={() => handleRejectRequest(request)} 
                    title="Tolak request"
                    aria-label={`Tolak request booking dari ${request.band}`}
                  >
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
                <button 
                  className="icon-btn cyan dash-icon-action send" 
                  onClick={() => handleSendBillingReminder(invoice)} 
                  title="Kirim reminder WhatsApp"
                  aria-label={`Kirim pengingat tagihan WhatsApp ke ${invoice.band}`}
                >
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
              <div className="dash-work-item" key={item.id}>
                <div 
                  className="dash-work-main" 
                  onClick={() => navigate('/maintenance')}
                  style={{ cursor: 'pointer', flex: 1 }}
                >
                  <strong>{item.name}</strong>
                  <span>{label} - {reason}</span>
                </div>
                <div className="dash-work-actions">
                  <button 
                    type="button"
                    className="icon-btn success dash-icon-action approve"
                    onClick={(e) => { e.stopPropagation(); handleCompleteMaintenance(item); }}
                    title="Tandai Selesai Servis"
                    aria-label={`Selesaikan servis untuk ${item.name}`}
                  >
                    <CheckCircle2 size={14} />
                  </button>
                </div>
              </div>
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
      </section>
      {/* Quick Booking Modal */}
      <Modal isOpen={isQuickBookingOpen} onClose={() => setIsQuickBookingOpen(false)} title="Tambah Booking Cepat">
        <form className="finance-form quick-dash-form" onSubmit={handleQuickBookingSubmit}>
          <div className="form-group">
            <label htmlFor="qb-band">Nama Band <span className="required">*</span></label>
            <input 
              id="qb-band"
              type="text" 
              className="form-input" 
              placeholder="Masukkan nama band..."
              value={qbBand}
              onChange={(e) => setQbBand(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="qb-phone">No. WhatsApp</label>
              <input 
                id="qb-phone"
                type="text" 
                className="form-input" 
                placeholder="081xxx..."
                value={qbPhone}
                onChange={(e) => setQbPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="qb-date">Tanggal <span className="required">*</span></label>
              <input 
                id="qb-date"
                type="date" 
                className="form-input" 
                value={qbDate}
                onChange={(e) => setQbDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="qb-hour">Jam Mulai <span className="required">*</span></label>
              <select 
                id="qb-hour"
                className="form-input" 
                value={qbHour} 
                onChange={(e) => setQbHour(Number(e.target.value))}
                required
              >
                {Array.from({ length: 13 }, (_, i) => 10 + i).map(h => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="qb-duration">Durasi (Jam) <span className="required">*</span></label>
              <input 
                id="qb-duration"
                type="number" 
                className="form-input" 
                min="1" 
                max="12"
                value={qbDuration}
                onChange={(e) => setQbDuration(Number(e.target.value))}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="qb-status">Status Pembayaran <span className="required">*</span></label>
              <select 
                id="qb-status"
                className="form-input" 
                value={qbStatus} 
                onChange={(e) => setQbStatus(e.target.value)}
                required
              >
                <option value="pending">Pending (Belum Bayar)</option>
                <option value="dp">DP (Down Payment)</option>
                <option value="confirmed">Lunas (Confirmed)</option>
              </select>
            </div>
            {qbStatus === 'dp' && (
              <div className="form-group">
                <label htmlFor="qb-dpAmount">Nominal DP (Rp) <span className="required">*</span></label>
                <input 
                  id="qb-dpAmount"
                  type="number" 
                  className="form-input" 
                  placeholder="0"
                  min="1"
                  value={qbDpAmount}
                  onChange={(e) => setQbDpAmount(e.target.value)}
                  required
                />
              </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="qb-note">Catatan Tambahan</label>
            <textarea 
              id="qb-note"
              className="form-input form-textarea" 
              placeholder="Catatan latihan band..."
              rows="2"
              value={qbNote}
              onChange={(e) => setQbNote(e.target.value)}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsQuickBookingOpen(false)}>Batal</button>
            <button type="submit" className="btn-primary">Simpan Booking</button>
          </div>
        </form>
      </Modal>

      {/* Quick Expense Modal */}
      <Modal isOpen={isQuickExpenseOpen} onClose={() => setIsQuickExpenseOpen(false)} title="Catat Pengeluaran Cepat">
        <form className="finance-form quick-dash-form" onSubmit={handleQuickExpenseSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="qe-date">Tanggal <span className="required">*</span></label>
              <input 
                id="qe-date"
                type="date" 
                className="form-input" 
                value={qeDate}
                onChange={(e) => setQeDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="qe-category">Kategori <span className="required">*</span></label>
              <select 
                id="qe-category"
                className="form-input" 
                value={qeCategory} 
                onChange={(e) => setQeCategory(e.target.value)}
                required
              >
                {['Operasional', 'Listrik / Air', 'Gaji', 'Perawatan', 'Alat Baru', 'Lainnya'].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="qe-amount">Nominal (Rp) <span className="required">*</span></label>
            <input 
              id="qe-amount"
              type="number" 
              className="form-input" 
              placeholder="0"
              min="1"
              value={qeAmount}
              onChange={(e) => setQeAmount(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="qe-description">Keterangan <span className="required">*</span></label>
            <textarea 
              id="qe-description"
              className="form-input form-textarea" 
              placeholder="Detail pengeluaran..."
              rows="2"
              value={qeDescription}
              onChange={(e) => setQeDescription(e.target.value)}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsQuickExpenseOpen(false)}>Batal</button>
            <button type="submit" className="btn-primary">Simpan Transaksi</button>
          </div>
        </form>
      </Modal>
      {/* Mobile bottom nav spacer — ensures last card clears the fixed bottom navbar */}
      <div aria-hidden="true" style={{ height: '90px', flexShrink: 0 }} className="mobile-bottom-spacer" />
    </div>
  );
};

export default DashboardPage;
