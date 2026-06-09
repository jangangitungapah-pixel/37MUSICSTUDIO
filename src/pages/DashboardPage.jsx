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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  TrendingUp, TrendingDown, Users, CalendarCheck, PackageOpen, Clock,
  ArrowRight, AlertTriangle, CheckCircle2, Music2, Lightbulb, Wallet, Activity, Download,
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
import MotionSection from '../components/animation/MotionSection';
import MotionButton from '../components/animation/MotionButton';
import { MotionListItem } from '../components/animation/MotionListItem';
import Modal from '../components/Modal';
import confetti from 'canvas-confetti';
import './DashboardPage.css';

const COLORS = [
  'var(--accent-cyan)',
  'rgb(var(--success-rgb))',
  'rgb(var(--warning-rgb))',
  'var(--accent-pink)'
];

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

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      confetti({
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
      confetti({
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
      confetti({
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
      confetti({
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
    <div className="app-page dashboard-page admin-dashboard-modern">

      {/* Fluent Ambient Background */}
      <div className="dashboard-ambient-bg">
        <div className="ambient-orb orb-1" />
        <div className="ambient-orb orb-2" />
        <div className="ambient-orb orb-3" />
      </div>

      {/* ===== Greeting Banner ===== */}
      <MotionSection direction="down" className="dash-greeting glass-panel">
        <div className="dash-greeting-left">
          <div className="dash-greeting-icon"><Music2 size={24} /></div>
          <div>
            <h2 className="dash-greeting-title">{greeting}, {displayName}! 👋</h2>
            <p className="dash-greeting-sub">{studioName}</p>
          </div>
        </div>

        {/* Live Clock Widget */}
        <div className="dash-live-clock-widget">
          <div className="clock-time">{format(currentTime, 'HH:mm')}</div>
          <div className="clock-details">
            <span className="clock-date">{format(currentTime, 'EEEE, dd MMM yyyy')}</span>
            <span className="clock-status-live"><span className="status-live-pulse" /> Live cockpit</span>
          </div>
        </div>

        <div className="dash-greeting-right">
          <div className="dash-alerts-strip">
            {invStats.serviceNeeded > 0 && (
              <div className="dash-alert-chip warning">
                <AlertTriangle size={13} />
                <span>{invStats.serviceNeeded} alat servis</span>
              </div>
            )}
            {bookingStats.pending > 0 && (
              <div className="dash-alert-chip danger">
                <Clock size={13} />
                <span>{bookingStats.pending} pending</span>
              </div>
            )}
            {pendingRequests.length > 0 && (
              <div className="dash-alert-chip info">
                <Inbox size={13} />
                <span>{pendingRequests.length} request</span>
              </div>
            )}
            {bookingStats.pending === 0 && invStats.serviceNeeded === 0 && pendingRequests.length === 0 && (
              <div className="dash-alert-chip success">
                <CheckCircle2 size={13} />
                <span>Semua aman!</span>
              </div>
            )}
          </div>

          <div className="dash-action-toolbar">
            <MotionButton 
              onClick={() => {
                setIsQuickBookingOpen(true);
                setQbBand('');
                setQbPhone('');
                setQbDate(format(new Date(), 'yyyy-MM-dd'));
                setQbHour(10);
                setQbDuration(1);
                setQbStatus('pending');
                setQbDpAmount('');
                setQbNote('');
              }} 
              className="btn-primary qb-btn" 
              title="Tambah Booking Cepat"
              aria-label="Tambah Booking Cepat"
            >
              <CalendarCheck size={16} />
              <span>+ Booking</span>
            </MotionButton>
            <MotionButton 
              onClick={() => {
                setIsQuickExpenseOpen(true);
                setQeDescription('');
                setQeAmount('');
                setQeCategory('Operasional');
                setQeDate(format(new Date(), 'yyyy-MM-dd'));
              }} 
              className="btn-primary qe-btn" 
              title="Catat Pengeluaran Cepat"
              aria-label="Catat Pengeluaran Cepat"
            >
              <TrendingDown size={16} />
              <span>+ Pengeluaran</span>
            </MotionButton>
            <MotionButton 
              onClick={handleExportExcel} 
              className="btn-secondary" 
              title="Unduh Semua Laporan (Excel)"
              aria-label="Unduh Semua Laporan Excel"
            >
              <Download size={16} />
              <span>Laporan</span>
            </MotionButton>
          </div>
        </div>
      </MotionSection>

      {/* ===== Stats Cards ===== */}
      <div className="dash-stats-grid">
        {/* Revenue */}
        <div className="dash-stat-card glass-panel">
          <div className="dash-stat-top">
            <div className="stat-icon-wrapper blue">
              <TrendingUp size={20} />
            </div>
            {revTrend !== null && (
              <span className={`dash-trend ${revTrend >= 0 ? 'up' : 'down'}`}>
                {revTrend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {revTrend >= 0 ? '+' : ''}{revTrend}%
              </span>
            )}
          </div>
          <span className="dash-stat-value">{formatCurrency(bookingStats.totalRevenue)}</span>
          <span className="dash-stat-label">Pendapatan Bulan Ini</span>
          
          {/* Progress bar */}
          <div className="dash-stat-progress-container">
            <div className="dash-stat-progress-bar" style={{ width: `${revenueTargetProgress}%`, background: 'var(--accent-cyan)' }} />
          </div>
          <div className="dash-stat-progress-info">
            <span>Target: Rp 35jt</span>
            <span>{revenueTargetProgress}%</span>
          </div>
          <span className="dash-stat-sub">vs {formatCurrency(lastMonthStats.totalRevenue)} bulan lalu</span>
        </div>

        {/* Bookings */}
        <div className="dash-stat-card glass-panel">
          <div className="dash-stat-top">
            <div className="stat-icon-wrapper green">
              <CalendarCheck size={20} />
            </div>
            {bookTrend !== null && (
              <span className={`dash-trend ${bookTrend >= 0 ? 'up' : 'down'}`}>
                {bookTrend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {bookTrend >= 0 ? '+' : ''}{bookTrend}%
              </span>
            )}
          </div>
          <div className="dash-stat-value">
            {bookingStats.totalBookings}
            <span className="dash-stat-unit"> sesi</span>
          </div>
          <span className="dash-stat-label">Total Booking</span>
          
          {/* Progress bar */}
          <div className="dash-stat-progress-container">
            <div className="dash-stat-progress-bar" style={{ width: `${occupancyProgress}%`, background: 'rgb(var(--success-rgb))' }} />
          </div>
          <div className="dash-stat-progress-info">
            <span>Okupansi (Target 390 jam)</span>
            <span>{occupancyProgress}%</span>
          </div>
          
          <div className="dash-stat-pills" style={{marginTop: '4px'}}>
            <span className="dash-pill confirmed">{bookingStats.confirmed} Lunas</span>
            <span className="dash-pill dp">{bookingStats.dp} DP</span>
            <span className="dash-pill pending">{bookingStats.pending} Pending</span>
          </div>
        </div>

        {/* Customers */}
        <div className="dash-stat-card glass-panel">
          <div className="dash-stat-top">
            <div className="stat-icon-wrapper pink">
              <Users size={20} />
            </div>
          </div>
          <div className="dash-stat-value">
            {customers.length}
            <span className="dash-stat-unit"> orang</span>
          </div>
          <span className="dash-stat-label">Pelanggan Terdaftar</span>
          
          {/* Progress bar */}
          <div className="dash-stat-progress-container">
            <div className="dash-stat-progress-bar" style={{ width: `${activeCustomersProgress}%`, background: 'var(--accent-pink)' }} />
          </div>
          <div className="dash-stat-progress-info">
            <span>Rasio Pelanggan Aktif</span>
            <span>{activeCustomersProgress}%</span>
          </div>
          <span className="dash-stat-sub">{bookingStats.totalHours} jam terpakai bulan ini</span>
        </div>

        {/* Inventory Alert */}
        <div className="dash-stat-card glass-panel">
          <div className="dash-stat-top">
            <div className="stat-icon-wrapper orange">
              <PackageOpen size={20} />
            </div>
          </div>
          <div className={`dash-stat-value ${invStats.serviceNeeded > 0 ? 'warn' : ''}`}>
            {invStats.serviceNeeded}
            <span className="dash-stat-unit"> item</span>
          </div>
          <span className="dash-stat-label">Kondisi Alat</span>
          
          {/* Progress bar */}
          <div className="dash-stat-progress-container">
            <div className="dash-stat-progress-bar" style={{ width: `${inventoryHealthProgress}%`, background: '#FFA000' }} />
          </div>
          <div className="dash-stat-progress-info">
            <span>Rasio Alat Layak Pakai</span>
            <span>{inventoryHealthProgress}%</span>
          </div>
          <span className="dash-stat-sub">dari {invStats.totalItems} total alat inventaris</span>
        </div>
      </div>

      {/* ===== Main Grid: Charts + Upcoming ===== */}
      <div className="dash-main-grid">

        {/* Revenue Chart */}
        <div className="chart-container glass-panel span-2">
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
                isAnimationActive={!isMobile}
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
                isAnimationActive={!isMobile}
                type="monotone" 
                dataKey="Pendapatan" 
                stroke="var(--accent-cyan)" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#cyanGrad)" 
                dot={{ r: 4, stroke: 'var(--accent-cyan)', strokeWidth: 2, fill: 'var(--bg-surface)' }} 
                activeDot={{ r: 6, stroke: 'var(--accent-cyan)', strokeWidth: 2, fill: 'var(--accent-cyan)' }} 
                style={isMobile ? {} : { filter: 'drop-shadow(0 4px 8px rgba(0, 240, 255, 0.25))' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming Bookings */}
        <div className="dash-upcoming app-card">
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
              {upcomingBookings.map(b => {
                const isLive = b._tag === 'Hari Ini' && currentHour >= b.hour && currentHour < (b.hour + b.duration);
                return (
                  <div key={b.id} className={`upcoming-item ${isLive ? 'live-item' : ''}`}>
                    <div className="upcoming-status-bar" style={{ background: getStatusColor(b.status) }} />
                    <div className="upcoming-info">
                      <div className="upcoming-band">{b.band}</div>
                      <div className="upcoming-time">
                        <Clock size={11} /> {b.hour}.00 – {b.hour + b.duration}.00
                      </div>
                    </div>
                    {isLive ? (
                      <span className="upcoming-tag tag-live">
                        <span className="live-pulse-dot" /> LIVE NOW
                      </span>
                    ) : (
                      <span className={`upcoming-tag tag-${b._tag === 'Hari Ini' ? 'today' : 'tomorrow'}`}>{b._tag}</span>
                    )}
                    <div className="dash-work-actions">
                      {b.status !== 'confirmed' && (
                        <button 
                          type="button"
                          className="icon-btn success dash-icon-action approve" 
                          onClick={(e) => { e.stopPropagation(); handleInstantPay(b); }} 
                          title="Lunasi Instan"
                          aria-label={`Lunasi Instan booking dari ${b.band}`}
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                      <button 
                        type="button"
                        className="icon-btn cyan dash-icon-action send" 
                        onClick={(e) => { e.stopPropagation(); handleSendBookingReminder(b); }} 
                        title="Kirim reminder WhatsApp"
                        aria-label={`Kirim pengingat WhatsApp ke ${b.band}`}
                      >
                        <MessageCircle size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Inventory Pie */}
        <div className="chart-container glass-panel">
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
            <div className="donut-chart-wrapper" style={{ position: 'relative', width: '100%', height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    isAnimationActive={!isMobile}
                    data={inventoryChartData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={65} 
                    outerRadius={80} 
                    paddingAngle={4} 
                    cornerRadius={6}
                    dataKey="value" 
                    strokeWidth={0}
                  >
                    {inventoryChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip 
                    isAnimationActive={!isMobile}
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
              <div className="donut-center-label">
                <span className="donut-center-val">{invStats.totalItems}</span>
                <span className="donut-center-lbl">Total Alat</span>
              </div>
            </div>
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
        <div className="dash-table-card app-card span-2">
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
                  <div className="top-cust-stats" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                      <span className="top-cust-bookings">{c.totalBookings}</span>
                      <span className="top-cust-unit">sesi</span>
                    </div>
                    {c.phone && (
                      <button 
                        type="button"
                        className="icon-btn cyan dash-icon-action send" 
                        onClick={(e) => { e.stopPropagation(); handleContactCustomer(c); }} 
                        title="Hubungi WhatsApp"
                        aria-label={`Hubungi WhatsApp ${c.name}`}
                      >
                        <MessageCircle size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

{/* ===== Smart Insights ===== */}
      <MotionSection direction="up" className="app-smart-panel app-smart-grid cols-auto">
        <MotionListItem as="div" className="smart-item">
          <div className="smart-head" style={{color: 'var(--accent-cyan)'}}>
            <Lightbulb size={16} />
            <span style={{fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Pola Booking</span>
          </div>
          <strong style={{fontSize: '0.92rem', color: 'var(--text-primary)'}}>{demandInsights.busiestDayCount > 0 ? `${demandInsights.busiestDay}, ${demandInsights.busiestHour}.00` : 'Belum ada pola'}</strong>
          <small style={{fontSize: '0.72rem', color: 'var(--text-secondary)'}}>{demandInsights.favoriteDuration ? `Durasi favorit ${demandInsights.favoriteDuration} jam, okupansi ${demandInsights.occupancyPercent}%` : 'Butuh data booking untuk membaca tren.'}</small>
        </MotionListItem>
        <MotionListItem as="div" className="smart-item">
          <div className="smart-head" style={{color: '#4CAF50'}}>
            <Wallet size={16} />
            <span style={{fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Forecast Bulan Ini</span>
          </div>
          <strong style={{fontSize: '0.92rem', color: 'var(--text-primary)'}}>{formatCurrency(revenueForecast.conservativeForecast)}</strong>
          <small style={{fontSize: '0.72rem', color: 'var(--text-secondary)'}}>Optimistis {formatCurrency(revenueForecast.optimisticForecast)} termasuk sisa tagihan.</small>
        </MotionListItem>
        <MotionListItem as="div" className="smart-item">
          <div className="smart-head" style={{color: '#FFA000'}}>
            <Clock size={16} />
            <span style={{fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Follow-up Billing</span>
          </div>
          <strong style={{fontSize: '0.92rem', color: 'var(--text-primary)'}}>{billingInsights.followUpsToday.length} prioritas hari ini</strong>
          <small style={{fontSize: '0.72rem', color: 'var(--text-secondary)'}}>{billingInsights.summary}</small>
        </MotionListItem>
        <MotionListItem as="div" className="smart-item">
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
      </MotionSection>
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
