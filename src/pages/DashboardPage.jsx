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
import { buildCombinedLedger } from '../lib/finance';
import { hasBookingOverlap } from '../lib/bookingWorkflows';
import { useStaffStore } from '../store/useStaffStore';
import ExcelJS from 'exceljs/dist/exceljs.min.js';
import saveAs from 'file-saver';
import { toast } from 'sonner';
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
      const workbook = new ExcelJS.Workbook();
      workbook.creator = studioName || '37 Music Studio';
      workbook.created = new Date();

      // Helper for styling headers
      const styleHeader = (worksheet, rowNum = 1) => {
        const row = worksheet.getRow(rowNum);
        row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF374151' } // Lighter dark gray (Tailwind gray-700)
        };
        row.alignment = { vertical: 'middle' }; // Let horizontal inherit from columns
        row.height = 28;
        row.eachCell({ includeEmpty: true }, cell => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF4B5563' } },
            left: { style: 'thin', color: { argb: 'FF4B5563' } },
            bottom: { style: 'thin', color: { argb: 'FF4B5563' } },
            right: { style: 'thin', color: { argb: 'FF4B5563' } }
          };
        });
      };

      // 1. Jadwal & Booking
      const wsBooking = workbook.addWorksheet('Jadwal & Booking', { views: [{ showGridLines: false }] });
      wsBooking.columns = [
        { header: 'ID Invoice', key: 'id', width: 15 },
        { header: 'Tanggal', key: 'date', width: 18 },
        { header: 'Jam', key: 'time', width: 16 },
        { header: 'Nama Band/Penyewa', key: 'band', width: 28 },
        { header: 'Tipe', key: 'type', width: 15 },
        { header: 'Durasi', key: 'duration', width: 12 },
        { header: 'Harga Total', key: 'total', width: 20 },
        { header: 'Diskon', key: 'discount', width: 18 },
        { header: 'Status Pembayaran', key: 'status', width: 22 },
        { header: 'DP Masuk', key: 'dp', width: 18 },
        { header: 'Sisa Tagihan', key: 'remaining', width: 20 }
      ];

      bookings.forEach((b, index) => {
        const isMaintenance = b.status === 'maintenance';
        const base = isMaintenance ? 0 : (b.type === 'recording' ? (b.sessionPrice || 0) : (b.duration * pricePerHour));
        const discount = isMaintenance ? 0 : (b.discountAmount || 0);
        const total = base - discount;
        const dp = isMaintenance ? 0 : (b.dpAmount || 0);
        const remaining = (isMaintenance || b.status === 'confirmed') ? 0 : (total - dp);
        
        const row = wsBooking.addRow({
          id: `INV-${String(b.id).slice(-5).padStart(5,'0')}`,
          date: format(new Date(b.date), 'dd MMM yyyy'),
          time: `${b.hour}.00 - ${b.hour + b.duration}.00`,
          band: b.band,
          type: isMaintenance ? 'Maintenance' : (b.type === 'recording' ? 'Recording' : 'Latihan'),
          duration: `${b.duration} Jam`,
          total: total,
          discount: discount,
          status: isMaintenance ? 'Maintenance' : (b.status === 'confirmed' ? 'Lunas' : b.status === 'dp' ? 'DP' : 'Belum Bayar'),
          dp: dp,
          remaining: remaining
        });

        // Add Zebra Striping
        if (index % 2 === 1) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        }

        // Add Borders
        row.eachCell({ includeEmpty: true }, cell => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          };
          cell.alignment = { vertical: 'middle' };
        });

        // Colorize Status Text
        const statusCell = row.getCell(9);
        if (b.status === 'confirmed') statusCell.font = { color: { argb: 'FF10B981' }, bold: true }; // Green
        else if (b.status === 'dp') statusCell.font = { color: { argb: 'FFF59E0B' }, bold: true }; // Yellow
        else if (isMaintenance) statusCell.font = { color: { argb: 'FF6B7280' }, bold: true }; // Gray
        else statusCell.font = { color: { argb: 'FFEF4444' }, bold: true }; // Red
        
        // Highlight Remaining if not paid
        if (remaining > 0) {
          row.getCell(11).font = { color: { argb: 'FFEF4444' }, bold: true };
        }
      });
      // Add Totals Row
      const bDataStart = 6;
      const bDataEnd = 5 + bookings.length;
      if (bookings.length > 0) {
        const bTotalRow = wsBooking.addRow({ band: 'TOTAL KESELURUHAN' });
        bTotalRow.getCell(7).value = { formula: `SUBTOTAL(109, G${bDataStart}:G${bDataEnd})` };
        bTotalRow.getCell(8).value = { formula: `SUBTOTAL(109, H${bDataStart}:H${bDataEnd})` };
        bTotalRow.getCell(10).value = { formula: `SUBTOTAL(109, J${bDataStart}:J${bDataEnd})` };
        bTotalRow.getCell(11).value = { formula: `SUBTOTAL(109, K${bDataStart}:K${bDataEnd})` };
        bTotalRow.font = { bold: true, color: { argb: 'FF111827' } };
        bTotalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
        bTotalRow.eachCell({ includeEmpty: true }, cell => {
          cell.border = { top: { style: 'thin', color: { argb: 'FF9CA3AF' } }, bottom: { style: 'double', color: { argb: 'FF4B5563' } } };
        });
      }

      // Insert Title Rows at Top (pushes table header down to row 5)
      wsBooking.spliceRows(1, 0, [], [], [], []);
      wsBooking.mergeCells('A2:K2');
      const titleCell = wsBooking.getCell('A2');
      titleCell.value = `LAPORAN JADWAL & BOOKING - ${studioName.toUpperCase()}`;
      titleCell.font = { size: 16, bold: true, color: { argb: 'FF111827' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      wsBooking.mergeCells('A3:K3');
      const subCell = wsBooking.getCell('A3');
      subCell.value = `Dicetak pada: ${format(new Date(), 'dd MMMM yyyy HH:mm')}`;
      subCell.font = { size: 11, italic: true, color: { argb: 'FF6B7280' } };
      subCell.alignment = { vertical: 'middle', horizontal: 'center' };

      styleHeader(wsBooking, 5); // Table header is now at row 5
      if (bookings.length > 0) wsBooking.autoFilter = `A5:K${bDataEnd}`;

      // Set Number Formatting for Money Columns
      [7, 8, 10, 11].forEach(col => {
        wsBooking.getColumn(col).numFmt = '"Rp" #,##0';
        wsBooking.getColumn(col).alignment = { horizontal: 'right', vertical: 'middle' };
      });
      
      // Set Alignments for Text Columns
      [1, 2, 3, 5, 6, 9].forEach(col => {
        wsBooking.getColumn(col).alignment = { horizontal: 'center', vertical: 'middle' };
      });
      
      // Band name left-aligned with indent
      wsBooking.getColumn(4).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

      // 2. Pembukuan (Keuangan) — Enhanced: 9 columns with split Kas Masuk/Keluar + Saldo Berjalan
      const wsFinance = workbook.addWorksheet('Pembukuan', { views: [{ showGridLines: false }] });
      wsFinance.columns = [
        { header: 'No',             key: 'no',       width: 6  },
        { header: 'Tanggal',        key: 'date',     width: 16 },
        { header: 'Tipe Arus',      key: 'type',     width: 20 },
        { header: 'Kategori',       key: 'category', width: 22 },
        { header: 'Keterangan',     key: 'desc',     width: 42 },
        { header: 'Referensi',      key: 'ref',      width: 20 },
        { header: 'Kas Masuk',      key: 'masuk',    width: 24 },
        { header: 'Kas Keluar',     key: 'keluar',   width: 24 },
        { header: 'Saldo Berjalan', key: 'saldo',    width: 26 },
      ];

      // Use rich ledger from finance.js for running balance + category/description
      const richLedger = [...buildCombinedLedger({ transactions, bookings, pricePerHour })].reverse();

      const CF = {
        incomeGreen:   'FF2E7D32', incomeGreenBg: 'FFE8F5E9', incomeRowBg: 'FFECFDF5',
        expenseRed:    'FFC62828', expenseRedBg:  'FFFCE4EC', expenseRowBg: 'FFFEF2F2',
        saldoBlue:     'FF0277BD', saldoBlueBg:   'FFE3F2FD',
      };
      const currFmt = '"Rp" #,##0;[Red]-"Rp" #,##0';
      const fThin = (c = 'FFE5E7EB') => ({ style: 'thin',   color: { argb: c } });
      const fMed  = (c = 'FF4B5563') => ({ style: 'medium', color: { argb: c } });

      richLedger.forEach((t, index) => {
        const isIncome = t.type === 'income';

        // Derive reference ID from entry id
        const tId = String(t.id || '');
        let ref = 'Manual';
        if      (tId.startsWith('book-')) ref = `INV-${tId.replace('book-', '').slice(-5).padStart(5, '0')}`;
        else if (tId.startsWith('dp-'))   ref = `DP-${tId.replace('dp-', '').slice(-5).padStart(5, '0')}`;

        const row = wsFinance.addRow({
          no:       index + 1,
          date:     format(new Date(t.date), 'dd MMM yyyy'),
          type:     isIncome ? '▲ Pemasukan' : '▼ Pengeluaran',
          category: t.category || (isIncome ? 'Sewa Studio' : '-'),
          desc:     t.description || 'Pembayaran Booking',
          ref,
          masuk:    isIncome  ? t.amount : null,
          keluar:   !isIncome ? t.amount : null,
          saldo:    t.balance,
        });
        row.height = 18;

        const evenBg = index % 2 === 0 ? 'FFF5F5FF' : 'FFFFFFFF';
        const baseBorder = { top: fThin(), left: fThin(), bottom: fThin(), right: fThin() };

        row.eachCell({ includeEmpty: true }, cell => {
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: evenBg } };
          cell.border    = baseBorder;
          cell.alignment = { vertical: 'middle' };
          cell.font      = { name: 'Calibri', size: 9.5 };
        });

        // No
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
        // Date
        row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
        // Type — color-coded
        const typeCell = row.getCell(3);
        typeCell.font      = { name: 'Calibri', size: 9.5, bold: true, color: { argb: isIncome ? CF.incomeGreen : CF.expenseRed } };
        typeCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: isIncome ? CF.incomeRowBg : CF.expenseRowBg } };
        typeCell.alignment = { vertical: 'middle', horizontal: 'center' };
        // Category
        row.getCell(4).font      = { name: 'Calibri', size: 9.5, italic: true };
        row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
        // Desc
        row.getCell(5).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        // Ref
        row.getCell(6).font      = { name: 'Calibri', size: 8.5, italic: true, color: { argb: 'FF9CA3AF' } };
        row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };

        // Kas Masuk
        const masukCell = row.getCell(7);
        masukCell.numFmt    = currFmt;
        masukCell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (isIncome) {
          masukCell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: CF.incomeGreen } };
          masukCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CF.incomeGreenBg } };
        } else {
          masukCell.value = null;
          masukCell.font  = { name: 'Calibri', size: 8, color: { argb: 'FFDDDDDD' } };
        }

        // Kas Keluar
        const keluarCell = row.getCell(8);
        keluarCell.numFmt    = currFmt;
        keluarCell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (!isIncome) {
          keluarCell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: CF.expenseRed } };
          keluarCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CF.expenseRedBg } };
        } else {
          keluarCell.value = null;
          keluarCell.font  = { name: 'Calibri', size: 8, color: { argb: 'FFDDDDDD' } };
        }

        // Saldo Berjalan — colored + thicker left border
        const saldoCell = row.getCell(9);
        saldoCell.numFmt    = currFmt;
        saldoCell.alignment = { vertical: 'middle', horizontal: 'right' };
        saldoCell.font      = { name: 'Calibri', size: 9.5, bold: true, color: { argb: t.balance >= 0 ? CF.saldoBlue : CF.expenseRed } };
        saldoCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: t.balance >= 0 ? CF.saldoBlueBg : CF.expenseRedBg } };
        saldoCell.border    = { ...baseBorder, left: fMed() };
      });

      // Totals Row
      const fDataStart = 6;
      const fDataEnd   = 5 + richLedger.length;
      if (richLedger.length > 0) {
        const netBal = richLedger[richLedger.length - 1].balance;
        const fTotalRow = wsFinance.addRow({});
        fTotalRow.height = 24;
        fTotalRow.getCell(1).value     = 'TOTAL KESELURUHAN';
        fTotalRow.getCell(1).font      = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF111827' } };
        fTotalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'right' };
        [1,2,3,4,5,6].forEach(c => {
          fTotalRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
        });
        fTotalRow.getCell(7).value     = { formula: `SUBTOTAL(109, G${fDataStart}:G${fDataEnd})` };
        fTotalRow.getCell(7).numFmt    = currFmt;
        fTotalRow.getCell(7).font      = { name: 'Calibri', size: 10, bold: true, color: { argb: CF.incomeGreen } };
        fTotalRow.getCell(7).fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: CF.incomeGreenBg } };
        fTotalRow.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' };
        fTotalRow.getCell(8).value     = { formula: `SUBTOTAL(109, H${fDataStart}:H${fDataEnd})` };
        fTotalRow.getCell(8).numFmt    = currFmt;
        fTotalRow.getCell(8).font      = { name: 'Calibri', size: 10, bold: true, color: { argb: CF.expenseRed } };
        fTotalRow.getCell(8).fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: CF.expenseRedBg } };
        fTotalRow.getCell(8).alignment = { vertical: 'middle', horizontal: 'right' };
        fTotalRow.getCell(9).value     = netBal;
        fTotalRow.getCell(9).numFmt    = currFmt;
        fTotalRow.getCell(9).font      = { name: 'Calibri', size: 10, bold: true, color: { argb: netBal >= 0 ? CF.incomeGreen : CF.expenseRed } };
        fTotalRow.getCell(9).fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: netBal >= 0 ? CF.incomeGreenBg : CF.expenseRedBg } };
        fTotalRow.getCell(9).alignment = { vertical: 'middle', horizontal: 'right' };
        fTotalRow.eachCell({ includeEmpty: true }, cell => {
          cell.border = { top: fMed(), bottom: { style: 'double', color: { argb: 'FF374151' } }, left: fThin(), right: fThin() };
        });
      }

      // Insert 4 title/spacer rows at top — all data shifts down by 4
      wsFinance.spliceRows(1, 0, [], [], [], []);

      wsFinance.mergeCells('A2:I2');
      const fTitle = wsFinance.getCell('A2');
      fTitle.value     = `LAPORAN PEMBUKUAN — ${studioName.toUpperCase()}`;
      fTitle.font      = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF111827' } };
      fTitle.alignment = { vertical: 'middle', horizontal: 'center' };
      fTitle.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F9FF' } };
      wsFinance.getRow(2).height = 36;

      wsFinance.mergeCells('A3:I3');
      const fSub = wsFinance.getCell('A3');
      fSub.value     = `Dicetak: ${format(new Date(), 'dd MMMM yyyy HH:mm')}  •  ${richLedger.length} transaksi`;
      fSub.font      = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF6B7280' } };
      fSub.alignment = { vertical: 'middle', horizontal: 'center' };
      wsFinance.getRow(3).height = 18;
      wsFinance.getRow(4).height = 8;

      // Merge label columns in total row (after splice, total row = fDataEnd+1)
      if (richLedger.length > 0) wsFinance.mergeCells(`A${fDataEnd + 1}:F${fDataEnd + 1}`);

      styleHeader(wsFinance, 5);
      wsFinance.getRow(5).height = 30;

      if (richLedger.length > 0) wsFinance.autoFilter = `A5:I${fDataEnd}`;
      wsFinance.views = [{ state: 'frozen', ySplit: 5, showGridLines: false }];

      // 3. Daftar Pelanggan
      const wsCustomers = workbook.addWorksheet('Daftar Pelanggan', { views: [{ showGridLines: false }] });
      wsCustomers.columns = [
        { header: 'Nama Pelanggan', key: 'name', width: 28 },
        { header: 'No WhatsApp / HP', key: 'phone', width: 22 },
        { header: 'Tanggal Bergabung', key: 'joined', width: 20 },
        { header: 'Total Booking', key: 'totalBookings', width: 18 },
        { header: 'Tipe Pelanggan', key: 'type', width: 22 }
      ];
      customers.forEach((c, index) => {
        const joinStr = c.joinDate || c.joinedAt;
        const row = wsCustomers.addRow({
          name: c.name,
          phone: c.phone || '-',
          joined: joinStr ? format(new Date(joinStr), 'dd MMM yyyy') : '-',
          totalBookings: c.totalBookings,
          type: c.totalBookings >= 10 ? 'VIP (Langganan)' : 'Reguler'
        });
        
        // Zebra & Borders
        if (index % 2 === 1) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        row.eachCell({ includeEmpty: true }, cell => {
          cell.border = { top: { style: 'thin', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }, left: { style: 'thin', color: { argb: 'FFE5E7EB' } }, right: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
          cell.alignment = { vertical: 'middle' };
        });
        
        if (c.totalBookings >= 10) row.getCell(5).font = { color: { argb: 'FF10B981' }, bold: true };
      });

      const cDataStart = 6;
      const cDataEnd = 5 + customers.length;
      if (customers.length > 0) {
        const cTotalRow = wsCustomers.addRow({ name: 'TOTAL PELANGGAN / TOTAL BOOKING' });
        cTotalRow.getCell(4).value = { formula: `SUBTOTAL(109, D${cDataStart}:D${cDataEnd})` };
        cTotalRow.font = { bold: true, color: { argb: 'FF111827' } };
        cTotalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
        cTotalRow.eachCell({ includeEmpty: true }, cell => { cell.border = { top: { style: 'thin', color: { argb: 'FF9CA3AF' } }, bottom: { style: 'double', color: { argb: 'FF4B5563' } } }; });
      }

      wsCustomers.spliceRows(1, 0, [], [], [], []);
      wsCustomers.mergeCells('A2:E2');
      const cTitle = wsCustomers.getCell('A2');
      cTitle.value = `LAPORAN DAFTAR PELANGGAN - ${studioName.toUpperCase()}`;
      cTitle.font = { size: 16, bold: true, color: { argb: 'FF111827' } };
      cTitle.alignment = { vertical: 'middle', horizontal: 'center' };
      wsCustomers.mergeCells('A3:E3');
      const cSub = wsCustomers.getCell('A3');
      cSub.value = `Dicetak pada: ${format(new Date(), 'dd MMMM yyyy HH:mm')}`;
      cSub.font = { size: 11, italic: true, color: { argb: 'FF6B7280' } };
      cSub.alignment = { vertical: 'middle', horizontal: 'center' };

      styleHeader(wsCustomers, 5);
      if (customers.length > 0) wsCustomers.autoFilter = `A5:E${cDataEnd}`;
      
      [3, 4].forEach(col => wsCustomers.getColumn(col).alignment = { horizontal: 'center', vertical: 'middle' });
      [1, 2, 5].forEach(col => wsCustomers.getColumn(col).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 });

      // 4. Inventaris Alat
      const wsInventory = workbook.addWorksheet('Inventaris Alat', { views: [{ showGridLines: false }] });
      wsInventory.columns = [
        { header: 'Nama Alat', key: 'name', width: 28 },
        { header: 'Kategori', key: 'category', width: 20 },
        { header: 'Merek / Tipe', key: 'brand', width: 22 },
        { header: 'Tanggal Beli', key: 'buyDate', width: 18 },
        { header: 'Harga Beli', key: 'price', width: 20 },
        { header: 'Kondisi', key: 'condition', width: 18 },
        { header: 'Catatan Khusus', key: 'notes', width: 35 }
      ];
      const inventory = useInventoryStore.getState().inventory;
      inventory.forEach((i, index) => {
        const condMap = { excellent: 'Sangat Baik', good: 'Baik', needs_repair: 'Perlu Servis', broken: 'Rusak' };
        const row = wsInventory.addRow({
          name: i.name,
          category: i.category,
          brand: i.brand || '-',
          buyDate: i.purchaseDate ? format(new Date(i.purchaseDate), 'dd MMM yyyy') : '-',
          price: i.price || 0,
          condition: condMap[i.condition] || i.condition,
          notes: i.notes || '-'
        });
        
        // Zebra & Borders
        if (index % 2 === 1) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        row.eachCell({ includeEmpty: true }, cell => {
          cell.border = { top: { style: 'thin', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }, left: { style: 'thin', color: { argb: 'FFE5E7EB' } }, right: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
          cell.alignment = { vertical: 'middle' };
        });

        if (i.condition === 'broken') row.getCell(6).font = { color: { argb: 'FFEF4444' }, bold: true };
        else if (i.condition === 'needs_repair') row.getCell(6).font = { color: { argb: 'FFF59E0B' }, bold: true };
        else row.getCell(6).font = { color: { argb: 'FF10B981' }, bold: true };
      });
      
      const iDataStart = 6;
      const iDataEnd = 5 + inventory.length;
      if (inventory.length > 0) {
        const iTotalRow = wsInventory.addRow({ name: 'TOTAL ASET' });
        iTotalRow.getCell(5).value = { formula: `SUBTOTAL(109, E${iDataStart}:E${iDataEnd})` };
        iTotalRow.font = { bold: true, color: { argb: 'FF111827' } };
        iTotalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
        iTotalRow.eachCell({ includeEmpty: true }, cell => { cell.border = { top: { style: 'thin', color: { argb: 'FF9CA3AF' } }, bottom: { style: 'double', color: { argb: 'FF4B5563' } } }; });
      }

      wsInventory.spliceRows(1, 0, [], [], [], []);
      wsInventory.mergeCells('A2:G2');
      const iTitle = wsInventory.getCell('A2');
      iTitle.value = `LAPORAN INVENTARIS ALAT - ${studioName.toUpperCase()}`;
      iTitle.font = { size: 16, bold: true, color: { argb: 'FF111827' } };
      iTitle.alignment = { vertical: 'middle', horizontal: 'center' };
      wsInventory.mergeCells('A3:G3');
      const iSub = wsInventory.getCell('A3');
      iSub.value = `Dicetak pada: ${format(new Date(), 'dd MMMM yyyy HH:mm')}`;
      iSub.font = { size: 11, italic: true, color: { argb: 'FF6B7280' } };
      iSub.alignment = { vertical: 'middle', horizontal: 'center' };

      styleHeader(wsInventory, 5);
      if (inventory.length > 0) wsInventory.autoFilter = `A5:G${iDataEnd}`;
      
      wsInventory.getColumn(5).numFmt = '"Rp" #,##0';
      wsInventory.getColumn(5).alignment = { horizontal: 'right', vertical: 'middle' };
      [2, 4, 6].forEach(col => wsInventory.getColumn(col).alignment = { horizontal: 'center', vertical: 'middle' });
      [1, 3, 7].forEach(col => wsInventory.getColumn(col).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 });

      // 5. Daftar Staff
      const wsStaff = workbook.addWorksheet('Daftar Staff', { views: [{ showGridLines: false }] });
      wsStaff.columns = [
        { header: 'Nama Lengkap', key: 'name', width: 28 },
        { header: 'Posisi / Role', key: 'role', width: 18 },
        { header: 'Status Akun', key: 'status', width: 16 },
        { header: 'Email Login', key: 'email', width: 30 },
        { header: 'No Telepon', key: 'phone', width: 22 }
      ];
      staffMembers.forEach((s, index) => {
        const row = wsStaff.addRow({
          name: s.name,
          role: s.role === 'admin' ? 'Administrator' : 'Staff Umum',
          status: s.status === 'active' ? 'Aktif' : 'Nonaktif',
          email: s.email,
          phone: s.phone || '-'
        });
        
        // Zebra & Borders
        if (index % 2 === 1) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        row.eachCell({ includeEmpty: true }, cell => {
          cell.border = { top: { style: 'thin', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }, left: { style: 'thin', color: { argb: 'FFE5E7EB' } }, right: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
          cell.alignment = { vertical: 'middle' };
        });

        if (s.status === 'active') row.getCell(3).font = { color: { argb: 'FF10B981' }, bold: true };
        else row.getCell(3).font = { color: { argb: 'FFEF4444' }, bold: true };
      });
      
      const sDataEnd = 5 + staffMembers.length;
      wsStaff.spliceRows(1, 0, [], [], [], []);
      wsStaff.mergeCells('A2:E2');
      const sTitle = wsStaff.getCell('A2');
      sTitle.value = `DAFTAR STAFF & ADMIN - ${studioName.toUpperCase()}`;
      sTitle.font = { size: 16, bold: true, color: { argb: 'FF111827' } };
      sTitle.alignment = { vertical: 'middle', horizontal: 'center' };
      wsStaff.mergeCells('A3:E3');
      const sSub = wsStaff.getCell('A3');
      sSub.value = `Dicetak pada: ${format(new Date(), 'dd MMMM yyyy HH:mm')}`;
      sSub.font = { size: 11, italic: true, color: { argb: 'FF6B7280' } };
      sSub.alignment = { vertical: 'middle', horizontal: 'center' };

      styleHeader(wsStaff, 5);
      if (staffMembers.length > 0) wsStaff.autoFilter = `A5:E${sDataEnd}`;
      
      [2, 3].forEach(col => wsStaff.getColumn(col).alignment = { horizontal: 'center', vertical: 'middle' });
      [1, 4, 5].forEach(col => wsStaff.getColumn(col).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 });

      // Generate file and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const filename = `Laporan_Lengkap_${studioName || 'Studio'}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
      saveAs(blob, filename.replace(/\s+/g, '_'));
      
      toast.success('Laporan berhasil diunduh!', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat memproses laporan Excel.', { id: toastId });
    }
  };

  return (
    <div className="dashboard-page">

      {/* ===== Greeting Banner ===== */}
      <div className="dash-greeting glass-panel">
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
          <button onClick={handleExportExcel} className="btn-primary" style={{ marginLeft: 8, padding: '8px 16px', borderRadius: '12px' }} title="Unduh Semua Laporan (Excel)">
            <Download size={16} />
            <span className="hide-on-mobile">Unduh Laporan</span>
          </button>
        </div>
      </div>

      {/* ===== Smart Insights ===== */}
      <div className="dash-smart-grid">
        <div className="dash-smart-card glass-panel">
          <div className="dash-smart-icon cyan"><Lightbulb size={18} /></div>
          <div className="dash-smart-copy">
            <span className="dash-smart-label">Pola Booking</span>
            <strong>{demandInsights.busiestDayCount > 0 ? `${demandInsights.busiestDay}, ${demandInsights.busiestHour}.00` : 'Belum ada pola'}</strong>
            <small>{demandInsights.favoriteDuration ? `Durasi favorit ${demandInsights.favoriteDuration} jam, okupansi ${demandInsights.occupancyPercent}%` : 'Butuh data booking untuk membaca tren.'}</small>
          </div>
        </div>
        <div className="dash-smart-card glass-panel">
          <div className="dash-smart-icon green"><Wallet size={18} /></div>
          <div className="dash-smart-copy">
            <span className="dash-smart-label">Forecast Bulan Ini</span>
            <strong>{formatCurrency(revenueForecast.conservativeForecast)}</strong>
            <small>Optimistis {formatCurrency(revenueForecast.optimisticForecast)} termasuk sisa tagihan.</small>
          </div>
        </div>
        <div className="dash-smart-card glass-panel">
          <div className="dash-smart-icon orange"><Clock size={18} /></div>
          <div className="dash-smart-copy">
            <span className="dash-smart-label">Follow-up Billing</span>
            <strong>{billingInsights.followUpsToday.length} prioritas hari ini</strong>
            <small>{billingInsights.summary}</small>
          </div>
        </div>
        <div className="dash-smart-card glass-panel">
          <div className={`dash-smart-icon ${anomalies.length ? 'red' : 'green'}`}><Activity size={18} /></div>
          <div className="dash-smart-copy">
            <span className="dash-smart-label">Anomali Data</span>
            <strong>{anomalies.length ? `${anomalies.length} perlu dicek` : 'Tidak ada anomali'}</strong>
            <small>{anomalies[0]?.detail || 'Harga, DP, jam, dan overlap jadwal terlihat normal.'}</small>
          </div>
        </div>
      </div>

      {/* ===== Operational Command Center ===== */}
      <div className="dash-command-grid">
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
                  <button className="dash-icon-action approve" onClick={() => handleApproveRequest(request)} title="Approve request">
                    <CheckCircle2 size={14} />
                  </button>
                  <button className="dash-icon-action reject" onClick={() => handleRejectRequest(request)} title="Tolak request">
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
                <button className="dash-icon-action send" onClick={() => handleSendBillingReminder(invoice)} title="Kirim reminder WhatsApp">
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
      </div>

      {/* ===== Stats Cards ===== */}
      <div className="dash-stats-grid tour-dashboard-stats">
        {/* Revenue */}
        <div className="dash-stat-card glass-panel">
          <div className="dash-stat-top">
            <div className="stat-icon-wrapper blue"><TrendingUp size={20} /></div>
            {revTrend !== null && (
              <span className={`dash-trend ${revTrend >= 0 ? 'up' : 'down'}`}>
                {revTrend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {revTrend >= 0 ? '+' : ''}{revTrend}%
              </span>
            )}
          </div>
          <div className="dash-stat-value">{formatCurrency(bookingStats.totalRevenue)}</div>
          <div className="dash-stat-label">Pendapatan Bulan Ini</div>
          <div className="dash-stat-sub">vs {formatCurrency(lastMonthStats.totalRevenue)} bulan lalu</div>
        </div>

        {/* Bookings */}
        <div className="dash-stat-card glass-panel">
          <div className="dash-stat-top">
            <div className="stat-icon-wrapper green"><CalendarCheck size={20} /></div>
            {bookTrend !== null && (
              <span className={`dash-trend ${bookTrend >= 0 ? 'up' : 'down'}`}>
                {bookTrend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {bookTrend >= 0 ? '+' : ''}{bookTrend}%
              </span>
            )}
          </div>
          <div className="dash-stat-value">{bookingStats.totalBookings}<span className="dash-stat-unit"> sesi</span></div>
          <div className="dash-stat-label">Total Booking Bulan Ini</div>
          <div className="dash-stat-pills">
            <span className="dash-pill confirmed">{bookingStats.confirmed} Lunas</span>
            <span className="dash-pill dp">{bookingStats.dp} DP</span>
            <span className="dash-pill pending">{bookingStats.pending} Pending</span>
          </div>
        </div>

        {/* Customers */}
        <div className="dash-stat-card glass-panel">
          <div className="dash-stat-top">
            <div className="stat-icon-wrapper pink"><Users size={20} /></div>
          </div>
          <div className="dash-stat-value">{customers.length}<span className="dash-stat-unit"> orang</span></div>
          <div className="dash-stat-label">Total Pelanggan Terdaftar</div>
          <div className="dash-stat-sub">{bookingStats.totalHours} jam terpakai bulan ini</div>
        </div>

        {/* Inventory Alert */}
        <div className="dash-stat-card glass-panel">
          <div className="dash-stat-top">
            <div className={`stat-icon-wrapper ${invStats.serviceNeeded > 0 ? 'orange' : 'green'}`}>
              <PackageOpen size={20} />
            </div>
          </div>
          <div className={`dash-stat-value ${invStats.serviceNeeded > 0 ? 'warn' : ''}`}>
            {invStats.serviceNeeded}<span className="dash-stat-unit"> item</span>
          </div>
          <div className="dash-stat-label">Alat Perlu Perhatian</div>
          <div className="dash-stat-sub">dari {invStats.totalItems} total alat inventaris</div>
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
        <div className="dash-upcoming glass-panel">
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
        <div className="dash-table-card glass-panel span-2 tour-dashboard-top-customers">
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
