import { useState, useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useBookingStore } from '../store/useBookingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useThemeStore } from '../store/useThemeStore';
import { format } from 'date-fns';
import { Wallet, TrendingUp, TrendingDown, Plus, Trash2, Search, Download, Printer, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import {
  PERIOD_LABELS,
  buildCombinedLedger,
  buildExpensePieData,
  buildFinanceLineChartData,
  filterLedgerByPeriod
} from '../lib/finance';
import { getRevenueForecast } from '../lib/smartInsights';
import { getBookingTotal, getRemainingDue } from '../lib/bookingWorkflows';
import { motion } from 'framer-motion';
import { pagePreset } from '../animations';
import './FinancePage.css';

const CATEGORIES = {
  income: ['Sewa Studio', 'Lainnya'],
  expense: ['Operasional', 'Listrik / Air', 'Gaji', 'Perawatan', 'Alat Baru', 'Lainnya']
};

const FinancePage = () => {
  const { transactions, addTransaction, deleteTransaction } = useFinanceStore();
  const { bookings } = useBookingStore();
  const { pricePerHour } = useSettingsStore();
  const { theme } = useThemeStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense',
    date: format(new Date(), 'yyyy-MM-dd'),
    category: 'Operasional',
    amount: '',
    description: ''
  });

  const isLight = theme === 'light';
  const cyanColor = isLight ? '#0099bb' : '#00f0ff';
  const pinkColor = isLight ? '#e8194e' : '#ff2a5f';
  const gridStroke = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.04)';
  const tooltipBg = isLight ? 'rgba(255, 255, 255, 0.98)' : '#1a1a2e';
  const tooltipBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)';
  const tooltipTextColor = isLight ? '#111128' : '#ffffff';

  const PIE_COLORS = useMemo(() => {
    return isLight
      ? ['#e8194e', '#0099bb', '#a855f7', '#2e7d32', '#FF9800', '#E91E63', '#9C27B0']
      : ['#ff2a5f', '#00f0ff', '#a855f7', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0'];
  }, [isLight]);
  
  const [filterPeriod, setFilterPeriod] = useState('month'); // 'day', 'week', 'month', 'year', 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [receiptToPrint, setReceiptToPrint] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Combine bookings and manual transactions
  const combinedData = useMemo(
    () => buildCombinedLedger({ transactions, bookings, pricePerHour }),
    [transactions, bookings, pricePerHour]
  );

  // Filter Data based on selected period
  const filteredData = useMemo(
    () => filterLedgerByPeriod(combinedData, filterPeriod, searchQuery),
    [combinedData, filterPeriod, searchQuery]
  );
  
  const totalIncomeFiltered = filteredData.filter(d => d.type === 'income').reduce((sum, d) => sum + d.amount, 0);
  const totalExpenseFiltered = filteredData.filter(d => d.type === 'expense').reduce((sum, d) => sum + d.amount, 0);
  const netCashFiltered = totalIncomeFiltered - totalExpenseFiltered;
  
  const totalBalance = combinedData.length > 0 ? combinedData[0].balance : 0; // Newest entry has final balance

  const periodLabel = PERIOD_LABELS[filterPeriod];

  const formatCurrency = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  // Derive short reference ID from entry id
  const getRef = (entry) => {
    const id = String(entry.id || '');
    if (id.startsWith('book-')) return `INV-${id.replace('book-', '').slice(-5).padStart(5, '0')}`;
    if (id.startsWith('dp-'))   return `DP-${id.replace('dp-', '').slice(-5).padStart(5, '0')}`;
    return 'Manual';
  };

  // Chart Data preparation
  const lineChartData = useMemo(
    () => buildFinanceLineChartData(filteredData, filterPeriod),
    [filteredData, filterPeriod]
  );

  const pieChartData = useMemo(
    () => buildExpensePieData(filteredData),
    [filteredData]
  );
  const revenueForecast = useMemo(
    () => getRevenueForecast(bookings, transactions, pricePerHour),
    [bookings, transactions, pricePerHour]
  );
  const reconciliation = useMemo(() => {
    const periodBookingIds = new Set(
      filterLedgerByPeriod(
        bookings
          .filter((booking) => !['maintenance', 'cancelled'].includes(booking.status))
          .map((booking) => ({
            id: booking.id,
            date: booking.date,
            description: booking.band || '',
            category: 'Booking',
          })),
        filterPeriod,
        ''
      ).map((entry) => entry.id)
    );
    const periodBookings = bookings.filter((booking) => periodBookingIds.has(booking.id));
    const bookedValue = periodBookings.reduce((sum, booking) => sum + getBookingTotal(booking, pricePerHour), 0);
    const bookingCash = periodBookings.reduce((sum, booking) => {
      if (booking.status === 'confirmed') return sum + getBookingTotal(booking, pricePerHour);
      if (booking.status === 'dp') return sum + Number(booking.dpAmount || 0);
      return sum;
    }, 0);
    const openReceivable = periodBookings.reduce((sum, booking) => sum + getRemainingDue(booking, pricePerHour), 0);
    const manualIncome = filterLedgerByPeriod(
      transactions.filter((entry) => entry.type === 'income'),
      filterPeriod,
      ''
    )
      .reduce((sum, entry) => sum + entry.amount, 0);
    return {
      bookedValue,
      bookingCash,
      openReceivable,
      manualIncome,
      diff: totalIncomeFiltered - bookingCash - manualIncome,
    };
  }, [bookings, filterPeriod, pricePerHour, totalIncomeFiltered, transactions]);



  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
    const [{ default: ExcelJS }, fileSaver] = await Promise.all([
      import('exceljs'),
      import('file-saver')
    ]);
    const saveAsFile = fileSaver.saveAs || fileSaver.default?.saveAs || fileSaver.default;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = '37 Music Studio';
    workbook.created = new Date();

    const ws = workbook.addWorksheet('Buku Kas', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
      views: [{ state: 'frozen', ySplit: 5 }],
    });

    ws.columns = [
      { key: 'no',       width: 5  },
      { key: 'tanggal',  width: 14 },
      { key: 'kategori', width: 20 },
      { key: 'tipe',     width: 15 },
      { key: 'desc',     width: 46 },
      { key: 'masuk',    width: 22 },
      { key: 'keluar',   width: 22 },
      { key: 'saldo',    width: 22 },
    ];

    const C = {
      headerBg:    'FF0F0F1A',
      titleText:   'FF00E5FF',
      subheadBg:   'FF1A1A2E',
      incomeGreen: 'FF2E7D32',
      expenseRed:  'FFC62828',
      saldoBlue:   'FF0277BD',
      borderLight: 'FFD0D0D0',
      borderDark:  'FF444466',
      rowEven:     'FFF5F5FF',
      rowOdd:      'FFFFFFFF',
      footerText:  'FF888888',
    };

    const currency = '"Rp "#,##0;[Red]-"Rp "#,##0';
    const TOTAL_COLS = 8;

    const thin = (color = C.borderLight) => ({
      top:    { style: 'thin',   color: { argb: color } },
      left:   { style: 'thin',   color: { argb: color } },
      bottom: { style: 'thin',   color: { argb: color } },
      right:  { style: 'thin',   color: { argb: color } },
    });
    const medium = {
      top:    { style: 'medium', color: { argb: C.borderDark } },
      left:   { style: 'medium', color: { argb: C.borderDark } },
      bottom: { style: 'medium', color: { argb: C.borderDark } },
      right:  { style: 'medium', color: { argb: C.borderDark } },
    };

    const colLetter = (n) => String.fromCharCode(64 + n);
    const merge = (row, from, to) => ws.mergeCells(`${colLetter(from)}${row}:${colLetter(to)}${row}`);
    const setCell = (addr, props) => Object.assign(ws.getCell(addr), props);

    // ── Row 1: Studio Name ──────────────────────────────────────────
    merge(1, 1, TOTAL_COLS);
    ws.getRow(1).height = 34;
    setCell('A1', {
      value:     '37 MUSIC STUDIO',
      font:      { name: 'Calibri', size: 22, bold: true, color: { argb: C.titleText } },
      alignment: { vertical: 'middle', horizontal: 'center' },
      fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: C.headerBg } },
    });

    // ── Row 2: Report Title ─────────────────────────────────────────
    merge(2, 1, TOTAL_COLS);
    ws.getRow(2).height = 22;
    setCell('A2', {
      value:     'LAPORAN KEUANGAN — BUKU KAS OPERASIONAL',
      font:      { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } },
      alignment: { vertical: 'middle', horizontal: 'center' },
      fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: C.subheadBg } },
    });

    // ── Row 3: Meta (Periode & Tanggal) ────────────────────────────
    merge(3, 1, TOTAL_COLS);
    ws.getRow(3).height = 18;
    setCell('A3', {
      value:     `Periode: ${periodLabel}   •   Dicetak: ${format(new Date(), 'dd MMMM yyyy, HH:mm')} WIB   •   Total: ${filteredData.length} transaksi`,
      font:      { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FFAAAACC' } },
      alignment: { vertical: 'middle', horizontal: 'center' },
      fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: C.subheadBg } },
    });

    // ── Row 4: Spacer ───────────────────────────────────────────────
    ws.getRow(4).height = 8;

    // ── Row 5: Column Headers ───────────────────────────────────────
    const headers = ['No', 'Tanggal', 'Kategori', 'Tipe', 'Keterangan', 'Kas Masuk', 'Kas Keluar', 'Saldo'];
    const hRow = ws.getRow(5);
    hRow.height = 26;
    headers.forEach((h, i) => {
      const cell = hRow.getCell(i + 1);
      cell.value     = h;
      cell.font      = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.headerBg } };
      cell.alignment = { vertical: 'middle', horizontal: i >= 5 ? 'right' : 'center' };
      cell.border    = thin(C.borderDark);
    });

    // ── Data Rows (oldest first) ────────────────────────────────────
    const dataRows    = [...filteredData].reverse();
    let totalIncome   = 0;
    let totalExpense  = 0;

    dataRows.forEach((d, idx) => {
      const isIncome = d.type === 'income';
      const rowNum   = 6 + idx;
      const row      = ws.getRow(rowNum);
      row.height     = 18;
      if (isIncome) totalIncome  += d.amount;
      else          totalExpense += d.amount;

      const rowBgArgb = idx % 2 === 0 ? C.rowEven : C.rowOdd;
      const rowFill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgArgb } };

      const values = [
        idx + 1,
        format(new Date(d.date), 'dd/MM/yyyy'),
        d.category,
        isIncome ? '▲ Pemasukan' : '▼ Pengeluaran',
        d.description,
        isIncome  ? d.amount : null,
        !isIncome ? d.amount : null,
        d.balance,
      ];

      values.forEach((val, ci) => {
        const cell  = row.getCell(ci + 1);
        cell.value  = val;
        cell.fill   = rowFill;
        cell.border = thin();
        cell.font   = { name: 'Calibri', size: 9.5 };
        cell.alignment = { vertical: 'middle' };

        if (ci === 0) cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (ci === 1) cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (ci === 2) { cell.alignment = { vertical: 'middle', horizontal: 'center' }; cell.font = { name: 'Calibri', size: 9.5, italic: true }; }

        if (ci === 3) {
          cell.font      = { name: 'Calibri', size: 9.5, bold: true, color: { argb: isIncome ? C.incomeGreen : C.expenseRed } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }

        if (ci === 5) {
          cell.numFmt    = currency;
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.font      = val !== null
            ? { name: 'Calibri', size: 9.5, bold: true, color: { argb: C.incomeGreen } }
            : { name: 'Calibri', size: 9.5, color: { argb: 'FFCCCCCC' } };
        }

        if (ci === 6) {
          cell.numFmt    = currency;
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.font      = val !== null
            ? { name: 'Calibri', size: 9.5, bold: true, color: { argb: C.expenseRed } }
            : { name: 'Calibri', size: 9.5, color: { argb: 'FFCCCCCC' } };
        }

        if (ci === 7) {
          cell.numFmt    = currency;
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.font      = { name: 'Calibri', size: 9.5, bold: true, color: { argb: d.balance >= 0 ? C.saldoBlue : C.expenseRed } };
          cell.border    = { ...thin(), left: { style: 'medium', color: { argb: C.borderDark } } };
        }
      });
    });

    // ── Total Row ───────────────────────────────────────────────────
    const totNum = 6 + dataRows.length;
    ws.getRow(totNum).height = 24;
    merge(totNum, 1, 5);

    setCell(`A${totNum}`, {
      value:     'TOTAL PERIODE',
      font:      { name: 'Calibri', size: 10, bold: true },
      alignment: { vertical: 'middle', horizontal: 'right' },
      fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } },
      border:    medium,
    });
    setCell(`F${totNum}`, {
      value:     totalIncome,
      numFmt:    currency,
      font:      { name: 'Calibri', size: 10, bold: true, color: { argb: C.incomeGreen } },
      fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } },
      alignment: { vertical: 'middle', horizontal: 'right' },
      border:    medium,
    });
    setCell(`G${totNum}`, {
      value:     totalExpense,
      numFmt:    currency,
      font:      { name: 'Calibri', size: 10, bold: true, color: { argb: C.expenseRed } },
      fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4EC' } },
      alignment: { vertical: 'middle', horizontal: 'right' },
      border:    medium,
    });
    const net = totalIncome - totalExpense;
    setCell(`H${totNum}`, {
      value:     net,
      numFmt:    currency,
      font:      { name: 'Calibri', size: 10, bold: true, color: { argb: net >= 0 ? C.incomeGreen : C.expenseRed } },
      fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: net >= 0 ? 'FFE8F5E9' : 'FFFCE4EC' } },
      alignment: { vertical: 'middle', horizontal: 'right' },
      border:    medium,
    });

    // ── Footer ──────────────────────────────────────────────────────
    const footNum = totNum + 2;
    merge(footNum, 1, TOTAL_COLS);
    setCell(`A${footNum}`, {
      value:     'Dokumen ini dibuat otomatis oleh sistem 37 Music Studio. Harap simpan sebagai arsip resmi studio.',
      font:      { name: 'Calibri', size: 8.5, italic: true, color: { argb: C.footerText } },
      alignment: { horizontal: 'center', vertical: 'middle' },
    });

    // ── Auto-filter ─────────────────────────────────────────────────
    ws.autoFilter = { from: 'A5', to: 'H5' };

    // ── Download ─────────────────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer();
    const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAsFile(blob, `Laporan_Keuangan_37Studio_${filterPeriod}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error('Error exporting finance report:', error);
      toast.error('Gagal export Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = (transaction) => {
    setReceiptToPrint(transaction);
    setTimeout(() => {
      window.print();
      setReceiptToPrint(null);
    }, 100);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addTransaction({
      ...formData,
      amount: Number(formData.amount)
    });
    setIsModalOpen(false);
    setFormData(prev => ({ ...prev, amount: '', description: '' }));
  };

  const PERIOD_OPTIONS = [
    { value: 'day',   label: 'Hari Ini' },
    { value: 'week',  label: 'Minggu' },
    { value: 'month', label: 'Bulan Ini' },
    { value: 'year',  label: 'Tahun Ini' },
    { value: 'all',   label: 'Semua' },
  ];

  return (
    <motion.div className="app-page finance-page" {...pagePreset}>
      {/* ── Header ── */}
      <div className="app-page-header">
        <div className="app-page-header-left">
          <span className="finance-eyebrow">Pembukuan Studio</span>
          <h2 className="app-page-title">Buku Kas</h2>
          <p className="app-page-subtitle">Pantau kas masuk, pengeluaran, piutang booking, dan saldo operasional.</p>
          <div className="finance-header-meta hide-on-print">
            <span>{periodLabel}</span>
            <span>{filteredData.length} transaksi</span>
            <span className={netCashFiltered >= 0 ? 'is-positive' : 'is-negative'}>
              Net {formatCurrency(netCashFiltered)}
            </span>
          </div>
        </div>
        <div className="app-page-actions">
          {/* Export */}
          <button 
            className="btn-secondary hide-on-print" 
            onClick={handleExportExcel} 
            disabled={isExporting || filteredData.length === 0} 
            title={filteredData.length === 0 ? "Tidak ada data untuk diexport" : "Export ke Excel (.xlsx)"}
            aria-label="Ekspor Laporan Keuangan ke Excel"
          >
            <Download size={15} />
            <span className="hide-on-mobile">{isExporting ? 'Mengekspor...' : 'Export Excel'}</span>
          </button>

          {/* Add */}
          <button 
            className="btn-primary hide-on-print" 
            onClick={() => setIsModalOpen(true)}
            aria-label="Catat Transaksi Baru"
          >
            <Plus size={16} />
            <span className="hide-on-mobile">Catat Transaksi</span>
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="app-stat-grid finance-stats">
        <div className="app-stat-card primary" style={{flex: 1}}>
          <div className="stat-icon" style={{color: 'var(--accent-cyan)', background: 'rgba(var(--accent-cyan-rgb), 0.1)'}}>
            <Wallet size={24} />
          </div>
          <div className="stat-data">
            <span className="stat-label">Total Saldo Bersih</span>
            <span className="stat-value">{formatCurrency(totalBalance)}</span>
            <span className="stat-note">Akumulasi semua catatan kas</span>
          </div>
        </div>
        <div className="app-stat-card income" style={{flex: 1}}>
          <div className="stat-icon" style={{color: 'rgb(var(--success-rgb))', background: 'rgba(var(--success-rgb), 0.1)'}}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-data">
            <span className="stat-label">Pemasukan · {periodLabel}</span>
            <span className="stat-value">{formatCurrency(totalIncomeFiltered)}</span>
            <span className="stat-note">Booking dan pemasukan manual</span>
          </div>
        </div>
        <div className="app-stat-card expense" style={{flex: 1}}>
          <div className="stat-icon" style={{color: 'var(--accent-pink)', background: 'rgba(var(--accent-pink-rgb), 0.1)'}}>
            <TrendingDown size={24} />
          </div>
          <div className="stat-data">
            <span className="stat-label">Pengeluaran · {periodLabel}</span>
            <span className="stat-value">{formatCurrency(totalExpenseFiltered)}</span>
            <span className="stat-note">Biaya operasional tercatat</span>
          </div>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="finance-insights-grid hide-on-print">
      <div className="app-smart-panel">
        <div className="smart-head">
          <TrendingUp size={20} />
          <div>
            <h3>Forecast Pendapatan Bulanan</h3>
            <p>Proyeksi berbasis kas masuk berjalan, booking bulan ini, dan piutang aktif.</p>
          </div>
        </div>
        <div className="smart-list app-smart-grid cols-2">
          <div className="smart-item">
            <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Kas saat ini</span>
            <strong style={{fontSize: '1rem', color: 'var(--text-primary)'}}>{formatCurrency(revenueForecast.currentIncome)}</strong>
          </div>
          <div className="smart-item">
            <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Forecast konservatif</span>
            <strong style={{fontSize: '1rem', color: 'var(--text-primary)'}}>{formatCurrency(revenueForecast.conservativeForecast)}</strong>
          </div>
          <div className="smart-item">
            <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Forecast optimistis</span>
            <strong style={{fontSize: '1rem', color: 'var(--text-primary)'}}>{formatCurrency(revenueForecast.optimisticForecast)}</strong>
          </div>
          <div className="smart-item">
            <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Progress bulan</span>
            <strong style={{fontSize: '1rem', color: 'var(--text-primary)'}}>{revenueForecast.progressPercent}%</strong>
          </div>
        </div>
      </div>

      <div className="app-smart-panel">
        <div className="smart-head">
          <Wallet size={20} />
          <div>
            <h3>Rekonsiliasi Kas Booking</h3>
            <p>Cocokkan nilai booking, kas diterima, piutang, dan pemasukan manual pada {periodLabel.toLowerCase()}.</p>
          </div>
        </div>
        <div className="smart-list app-smart-grid cols-2">
          <div className="smart-item">
            <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Nilai booking</span>
            <strong style={{fontSize: '1rem', color: 'var(--text-primary)'}}>{formatCurrency(reconciliation.bookedValue)}</strong>
          </div>
          <div className="smart-item">
            <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Kas dari booking</span>
            <strong style={{fontSize: '1rem', color: 'var(--text-primary)'}}>{formatCurrency(reconciliation.bookingCash)}</strong>
          </div>
          <div className="smart-item">
            <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Piutang aktif</span>
            <strong style={{fontSize: '1rem', color: 'var(--text-primary)'}}>{formatCurrency(reconciliation.openReceivable)}</strong>
          </div>
          <div className="smart-item" style={{borderColor: reconciliation.diff === 0 ? 'rgba(var(--success-rgb), 0.2)' : 'rgba(var(--accent-pink-rgb), 0.2)'}}>
            <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Selisih kas</span>
            <strong style={{fontSize: '1rem', color: reconciliation.diff === 0 ? 'rgb(var(--success-rgb))' : 'var(--accent-pink)'}}>{formatCurrency(reconciliation.diff)}</strong>
          </div>
        </div>
      </div>
      </div>

      <div className="finance-charts-grid hide-on-print">
        {/* Line Chart */}
        <div className="app-card finance-chart-card">
          <div className="chart-card-header">
            <TrendingUp size={15} color="var(--accent-cyan)" />
            <h3>Tren Arus Kas</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickMargin={8} axisLine={false} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(v) => `${v/1000}k`} axisLine={false} tickLine={false} width={40} />
              <RechartsTooltip
                formatter={(v) => formatCurrency(v)}
                contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '10px', color: tooltipTextColor, fontSize: '0.82rem' }}
                itemStyle={{ color: tooltipTextColor }}
              />
              <Line type="monotone" dataKey="Pemasukan" stroke={cyanColor} strokeWidth={2.5} dot={{ r: 3, fill: isLight ? '#fff' : '#0d0d1a', strokeWidth: 2 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="Pengeluaran" stroke={pinkColor} strokeWidth={2.5} dot={{ r: 3, fill: isLight ? '#fff' : '#0d0d1a', strokeWidth: 2 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-dot" style={{ background: cyanColor }} />Pemasukan</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: pinkColor }} />Pengeluaran</span>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="app-card finance-chart-card">
          <div className="chart-card-header">
            <TrendingDown size={15} color="var(--accent-pink)" />
            <h3>Pengeluaran per Kategori</h3>
          </div>
          {pieChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={48} outerRadius={70} paddingAngle={4} dataKey="value">
                    {pieChartData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(v) => formatCurrency(v)}
                    contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '10px', fontSize: '0.8rem', color: tooltipTextColor }}
                    itemStyle={{ color: tooltipTextColor }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend-list">
                {pieChartData.map((item, i) => (
                  <div key={item.name} className="pie-legend-item">
                    <div className="pie-legend-left">
                      <span className="pie-legend-dot" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="pie-legend-name">{item.name}</span>
                    </div>
                    <span className="pie-legend-val">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Belum ada pengeluaran
            </div>
          )}
        </div>
      </div>

      {/* ── Ledger Table ── */}
      <div className="finance-content">
        {/* Table Header Bar */}
        <div className="app-table-toolbar">
          <div className="app-table-toolbar-left">
            <div>
              <span className="app-table-toolbar-title">Riwayat Transaksi</span>
              <span className="app-table-toolbar-subtitle">{periodLabel} • {filteredData.length} transaksi</span>
            </div>
          </div>
          <div className="app-table-toolbar-right hide-on-print">
            {/* Period Pill Buttons */}
            <div className="toolbar-group">
              {PERIOD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`period-btn ${filterPeriod === opt.value ? 'active' : ''}`}
                  onClick={() => setFilterPeriod(opt.value)}
                  aria-pressed={filterPeriod === opt.value}
                  aria-label={`Filter periode: ${opt.label}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="app-search app-search-md">
              <Search className="app-search-icon" />
              <input 
                type="text" 
                className="app-search-input"
                placeholder="Cari transaksi..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Cari riwayat transaksi"
              />
              {searchQuery && (
                <button type="button" className="app-search-clear" onClick={() => setSearchQuery('')} aria-label="Bersihkan pencarian" title="Bersihkan pencarian">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="app-table-wrapper hide-on-mobile" style={{ flex: 1, overflow: 'auto' }}>
          <table className="app-table finance-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Kategori</th>
                <th>Keterangan</th>
                <th>Sumber</th>
                <th className="col-money">Kas Masuk</th>
                <th className="col-money">Kas Keluar</th>
                <th className="col-money">Saldo</th>
                <th className="action-col"></th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state">Tidak ada catatan transaksi untuk periode ini.</td>
                </tr>
              ) : (
                filteredData.map(entry => (
                  <tr key={entry.id}>
                    <td>{format(new Date(entry.date), 'dd MMM yyyy')}</td>
                    <td>
                      <span className={`cat-badge ${entry.type === 'income' ? 'income' : 'expense'}`}>
                        {entry.category}
                      </span>
                    </td>
                    <td className="desc-cell">{entry.description}</td>
                    <td>
                      <span className={`source-badge ${entry.isManual ? 'manual' : 'booking'}`}>
                        {getRef(entry)}
                      </span>
                    </td>
                    <td className="col-money text-income">
                      {entry.type === 'income' ? formatCurrency(entry.amount) : '—'}
                    </td>
                    <td className="col-money text-expense">
                      {entry.type === 'expense' ? formatCurrency(entry.amount) : '—'}
                    </td>
                    <td className="col-money fw-bold">{formatCurrency(entry.balance)}</td>
                    <td className="action-col">
                      <div className="action-cell">
                        <button className="icon-btn print-btn" onClick={() => handlePrint(entry)} title="Cetak Kwitansi" aria-label="Cetak Kwitansi">
                          <Printer size={14} />
                        </button>
                        {entry.isManual && (
                          <button className="icon-btn delete" onClick={() => deleteTransaction(entry.id)} title="Hapus" aria-label="Hapus Transaksi">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="mobile-ledger-list show-on-mobile">
          {filteredData.length === 0 ? (
            <div className="empty-state-mobile" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Tidak ada catatan transaksi untuk periode ini.
            </div>
          ) : filteredData.map(entry => (
            <div key={entry.id} className={`mobile-ledger-card ${entry.type}`}>
              <div className="mobile-ledger-info">
                <span className="mobile-ledger-desc">{entry.description}</span>
                <div className="mobile-ledger-meta">
                  <span className={`cat-badge ${entry.type}`}>{entry.category}</span>
                  <span className="mobile-ledger-date">{format(new Date(entry.date), 'dd MMM yyyy')}</span>
                  <span className={`source-badge ${entry.isManual ? 'manual' : 'booking'}`}>{getRef(entry)}</span>
                </div>
              </div>
              <div className="mobile-ledger-right">
                <span className={`mobile-ledger-amount ${entry.type}`}>
                  {entry.type === 'income' ? '+' : '−'}{formatCurrency(entry.amount)}
                </span>
                <span className="mobile-ledger-balance">Saldo: {formatCurrency(entry.balance)}</span>
              </div>
              <div className="mobile-ledger-actions">
                <button className="icon-btn print-btn" onClick={() => handlePrint(entry)} title="Cetak Kwitansi" aria-label="Cetak Kwitansi">
                  <Printer size={13} />
                </button>
                {entry.isManual && (
                  <button className="icon-btn delete" onClick={() => deleteTransaction(entry.id)} title="Hapus" aria-label="Hapus Transaksi">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Print Receipt Section (Only visible during print) */}
      {receiptToPrint && (
        <div className="print-receipt-container">
          <div className="receipt">
            <h2 className="receipt-title">BUKTI TRANSAKSI</h2>
            <div className="receipt-header">
              <p><strong>{useSettingsStore.getState().studioName || '37 MUSIC STUDIO'}</strong></p>
              <p>{useSettingsStore.getState().studioAddress}</p>
              <p>{useSettingsStore.getState().studioPhone}</p>
            </div>
            <hr className="receipt-divider" />
            <div className="receipt-info">
              <p><span>Tanggal:</span> <span>{format(new Date(receiptToPrint.date), 'dd MMM yyyy')}</span></p>
              <p><span>Jenis:</span> <span>{receiptToPrint.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</span></p>
              <p><span>Kategori:</span> <span>{receiptToPrint.category}</span></p>
            </div>
            <div className="receipt-desc">
              <p><strong>Keterangan:</strong></p>
              <p>{receiptToPrint.description}</p>
            </div>
            <hr className="receipt-divider" />
            <div className="receipt-total">
              <p><span>TOTAL:</span> <span style={{fontSize: '18px', fontWeight: 'bold'}}>{formatCurrency(receiptToPrint.amount)}</span></p>
            </div>
            <div className="receipt-footer">
              <p>Terima kasih</p>
              <p>Dicetak pada {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Catat Transaksi">
        <form className="finance-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="transaction-type">Jenis Transaksi</label>
            <div id="transaction-type" className="type-toggle">
              <button 
                type="button" 
                className={`toggle-btn ${formData.type === 'income' ? 'active income' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'income', category: CATEGORIES.income[0] }))}
                aria-pressed={formData.type === 'income'}
              >
                <TrendingUp size={16} /> Pemasukan
              </button>
              <button 
                type="button" 
                className={`toggle-btn ${formData.type === 'expense' ? 'active expense' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'expense', category: CATEGORIES.expense[0] }))}
                aria-pressed={formData.type === 'expense'}
              >
                <TrendingDown size={16} /> Pengeluaran
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="transaction-date">Tanggal <span className="required">*</span></label>
              <input 
                id="transaction-date"
                type="date" name="date" 
                value={formData.date} 
                onChange={e => setFormData(p => ({...p, date: e.target.value}))} 
                className="form-input" required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="transaction-category">Kategori <span className="required">*</span></label>
              <select 
                id="transaction-category"
                name="category" 
                value={formData.category} 
                onChange={e => setFormData(p => ({...p, category: e.target.value}))} 
                className="form-input" required
              >
                {CATEGORIES[formData.type].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="transaction-amount">Nominal (Rp) <span className="required">*</span></label>
            <input 
              id="transaction-amount"
              type="number" 
              name="amount" 
              value={formData.amount} 
              onChange={e => setFormData(p => ({...p, amount: e.target.value}))} 
              className="form-input" 
              placeholder="0"
              min="1"
              required 
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="transaction-description">Keterangan <span className="required">*</span></label>
            <textarea 
              id="transaction-description"
              name="description" 
              value={formData.description} 
              onChange={e => setFormData(p => ({...p, description: e.target.value}))} 
              className="form-input form-textarea" 
              placeholder="Detail catatan transaksi..."
              rows="2"
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Batal</button>
            <button type="submit" className="btn-primary">Simpan Transaksi</button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default FinancePage;
