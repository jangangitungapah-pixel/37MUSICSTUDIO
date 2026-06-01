import { useState, useMemo, useEffect } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useBookingStore } from '../store/useBookingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
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
import Fuse from 'fuse.js';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import useSound from 'use-sound';
import { CLICK_SOUND } from '../lib/sounds';
import Lottie from 'lottie-react';
import confetti from 'canvas-confetti';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReceiptPDF } from '../components/ReceiptPDF';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender
} from '@tanstack/react-table';
import './FinancePage.css';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  category: z.string().min(1, 'Kategori harus dipilih'),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Nominal harus berupa angka positif'),
  description: z.string().min(3, 'Keterangan minimal 3 karakter')
});

const validateTransactionWithZod = (fieldName) => (value) => {
  const fieldSchema = transactionSchema.shape[fieldName];
  if (!fieldSchema) return true;
  const result = fieldSchema.safeParse(value);
  return result.success ? true : result.error.errors[0].message;
};

const CATEGORIES = {
  income: ['Sewa Studio', 'Lainnya'],
  expense: ['Operasional', 'Listrik / Air', 'Gaji', 'Perawatan', 'Alat Baru', 'Lainnya']
};

const FinancePage = () => {
  const { transactions, addTransaction, deleteTransaction } = useFinanceStore();
  const { bookings } = useBookingStore();
  const { pricePerHour, studioName, studioAddress, studioPhone } = useSettingsStore();
  const { theme } = useThemeStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playClick] = useSound(CLICK_SOUND, { volume: 0.25 });
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch('https://lottie.host/a61c36b6-d522-4467-bc22-38e2d427d14d/B8b0n95d7r.json')
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error("Lottie load failed", err));
  }, []);

  const { register, handleSubmit: handleFormSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      type: 'expense',
      date: format(new Date(), 'yyyy-MM-dd'),
      category: 'Operasional',
      amount: '',
      description: ''
    }
  });

  const watchedType = watch('type');

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
  
  const { user, userProfile } = useAuthStore();
  const [filterPeriod, setFilterPeriod] = useState('month'); // 'day', 'week', 'month', 'year', 'all'
  const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expense'
  const [searchQuery, setSearchQuery] = useState('');
  const [receiptToPrint, setReceiptToPrint] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Combine bookings and manual transactions
  const combinedData = useMemo(
    () => buildCombinedLedger({ transactions, bookings, pricePerHour }),
    [transactions, bookings, pricePerHour]
  );

  // Filter Data based on selected period with Fuse.js
  const periodFilteredData = useMemo(() => {
    let result = filterLedgerByPeriod(combinedData, filterPeriod, '');
    if (searchQuery.trim()) {
      const fuse = new Fuse(result, {
        keys: ['description', 'category'],
        threshold: 0.35,
        ignoreLocation: true
      });
      result = fuse.search(searchQuery).map(r => r.item);
    }
    return result;
  }, [combinedData, filterPeriod, searchQuery]);
  
  const totalIncomeFiltered = useMemo(() => periodFilteredData.filter(d => d.type === 'income').reduce((sum, d) => sum + d.amount, 0), [periodFilteredData]);
  const totalExpenseFiltered = useMemo(() => periodFilteredData.filter(d => d.type === 'expense').reduce((sum, d) => sum + d.amount, 0), [periodFilteredData]);
  const netCashFiltered = totalIncomeFiltered - totalExpenseFiltered;

  const filteredData = useMemo(() => {
    if (filterType === 'all') return periodFilteredData;
    return periodFilteredData.filter(d => d.type === filterType);
  }, [periodFilteredData, filterType]);

  // Today's Expense Tracker calculations
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

  const allExpenses = useMemo(() => {
    return combinedData.filter(d => d.type === 'expense');
  }, [combinedData]);

  const todayExpensesList = useMemo(() => {
    return allExpenses.filter(d => d.date === todayStr);
  }, [allExpenses, todayStr]);

  const todayExpensesSum = useMemo(() => {
    return todayExpensesList.reduce((sum, d) => sum + d.amount, 0);
  }, [todayExpensesList]);

  const yesterdayExpensesSum = useMemo(() => {
    return allExpenses
      .filter(d => d.date === yesterdayStr)
      .reduce((sum, d) => sum + d.amount, 0);
  }, [allExpenses, yesterdayStr]);
  
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

  const columns = useMemo(() => [
    {
      accessorKey: 'date',
      header: 'Tanggal',
      cell: info => format(new Date(info.getValue()), 'dd MMM yyyy')
    },
    {
      accessorKey: 'category',
      header: 'Kategori',
      cell: info => {
        const entry = info.row.original;
        return (
          <span className={`cat-badge ${entry.type === 'income' ? 'income' : 'expense'}`}>
            {entry.category}
          </span>
        );
      }
    },
    {
      accessorKey: 'description',
      header: 'Keterangan',
      cell: info => info.getValue()
    },
    {
      id: 'source',
      header: 'Sumber',
      accessorFn: entry => getRef(entry),
      cell: info => {
        const entry = info.row.original;
        return (
          <>
            <span className={`source-badge ${entry.isManual ? 'manual' : 'booking'}`}>
              {getRef(entry)}
            </span>
            {entry.isManual && entry.operatorName && (
              <div className="operator-sub">Oleh: {entry.operatorName}</div>
            )}
          </>
        );
      }
    },
    {
      id: 'income',
      header: 'Kas Masuk',
      accessorFn: entry => entry.type === 'income' ? entry.amount : 0,
      cell: info => {
        const entry = info.row.original;
        return entry.type === 'income' ? formatCurrency(entry.amount) : '—';
      }
    },
    {
      id: 'expense',
      header: 'Kas Keluar',
      accessorFn: entry => entry.type === 'expense' ? entry.amount : 0,
      cell: info => {
        const entry = info.row.original;
        return entry.type === 'expense' ? formatCurrency(entry.amount) : '—';
      }
    },
    {
      accessorKey: 'balance',
      header: 'Saldo',
      cell: info => formatCurrency(info.getValue())
    },
    {
      id: 'actions',
      header: '',
      cell: info => {
        const entry = info.row.original;
        return (
          <div className="action-cell">
            <button className="icon-btn print-btn" onClick={() => handlePrint(entry)} title="Cetak Kwitansi" aria-label="Cetak Kwitansi">
              <Printer size={14} />
            </button>
            <PDFDownloadLink
              document={<ReceiptPDF transaction={entry} settings={{ studioName, studioAddress, studioPhone }} />}
              fileName={`kuitansi-${entry.id}.pdf`}
              style={{ textDecoration: 'none', display: 'inline-flex' }}
            >
              {({ loading }) => (
                <button className="icon-btn print-btn" disabled={loading} title="Unduh PDF Kuitansi" aria-label="Unduh PDF Kuitansi" style={{ color: 'var(--accent-cyan)' }}>
                  <Download size={14} style={{ opacity: loading ? 0.5 : 1 }} />
                </button>
              )}
            </PDFDownloadLink>
            {entry.isManual && (
              <button className="icon-btn delete" onClick={() => { playClick(); if (window.confirm('Hapus transaksi ini?')) deleteTransaction(entry.id); }} title="Hapus" aria-label="Hapus Transaksi">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      }
    }
  ], [studioName, studioAddress, studioPhone]);

  const [sorting, setSorting] = useState([]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  // Chart Data preparation
  const lineChartData = useMemo(
    () => buildFinanceLineChartData(periodFilteredData, filterPeriod),
    [periodFilteredData, filterPeriod]
  );

  const pieChartData = useMemo(
    () => buildExpensePieData(periodFilteredData),
    [periodFilteredData]
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

  const onSubmit = (data) => {
    addTransaction({
      ...data,
      amount: Number(data.amount),
      operatorName: userProfile?.name || user?.email || 'Operator'
    });
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#00f0ff', '#ff2a5f', '#FFC107', '#4CAF50']
    });
    setIsModalOpen(false);
    toast.success('Transaksi berhasil dicatat!');
  };

  const handleTypeChange = (typeVal) => {
    playClick();
    setValue('type', typeVal);
    setValue('category', CATEGORIES[typeVal][0]);
  };

  const handleOpenModal = (type = 'expense') => {
    playClick();
    reset({
      type,
      date: format(new Date(), 'yyyy-MM-dd'),
      category: CATEGORIES[type][0],
      amount: '',
      description: ''
    });
    setIsModalOpen(true);
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
            onClick={() => { playClick(); handleExportExcel(); }} 
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
            onClick={() => handleOpenModal('expense')}
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

      {/* ── Insights Grid ── */}
      <div className="finance-insights-grid hide-on-print">
        {/* Forecast Panel */}
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

        {/* Reconciliation Panel */}
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

        {/* Daily Expenses Panel */}
        <div className="app-smart-panel daily-expenses-panel">
          <div className="smart-head">
            <TrendingDown size={20} style={{ color: 'var(--accent-pink)' }} />
            <div>
              <h3>Pengeluaran Harian</h3>
              <p>Pemantauan operasional kas keluar dan penanggung jawab.</p>
            </div>
          </div>
          <div className="smart-list daily-expense-list">
            <div className="daily-expense-summary">
              <div className="summary-item">
                <span className="summary-label">Hari Ini</span>
                <strong className="summary-val text-expense">{formatCurrency(todayExpensesSum)}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Kemarin</span>
                <strong className="summary-val">{formatCurrency(yesterdayExpensesSum)}</strong>
              </div>
            </div>
            
            <div className="mini-expense-list-title">Detail Hari Ini:</div>
            {todayExpensesList.length > 0 ? (
              <div className="mini-expense-list">
                {todayExpensesList.slice(0, 3).map((entry) => (
                  <div key={entry.id} className="mini-expense-item">
                    <div className="mini-expense-left">
                      <span className="mini-expense-desc">{entry.description}</span>
                      <span className="mini-expense-meta">
                        {entry.category} • oleh {entry.operatorName || 'Staff'}
                      </span>
                    </div>
                    <span className="mini-expense-amount">{formatCurrency(entry.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mini-expense-empty">Belum ada pengeluaran hari ini.</div>
            )}

            <button
              type="button"
              className="smart-btn-action"
              onClick={() => handleOpenModal('expense')}
            >
              <Plus size={14} /> Catat Pengeluaran
            </button>
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
                  onClick={() => { playClick(); setFilterPeriod(opt.value); }}
                  aria-pressed={filterPeriod === opt.value}
                  aria-label={`Filter periode: ${opt.label}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Type Pill Buttons */}
            <div className="toolbar-group">
              {[
                { value: 'all', label: 'Semua' },
                { value: 'income', label: 'Masuk' },
                { value: 'expense', label: 'Keluar' }
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`period-btn ${filterType === opt.value ? 'active' : ''}`}
                  onClick={() => { playClick(); setFilterType(opt.value); }}
                  aria-pressed={filterType === opt.value}
                  aria-label={`Filter jenis: ${opt.label}`}
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
          {filteredData.length === 0 ? (
            <div className="maint-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
              {animationData ? (
                <div style={{ width: 140, height: 140, marginBottom: '16px' }}>
                  <Lottie animationData={animationData} loop={true} />
                </div>
              ) : (
                <Wallet size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
              )}
              <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Tidak ada catatan transaksi untuk periode ini.</p>
              <small style={{ color: 'var(--text-muted)' }}>Tambahkan transaksi baru atau sesuaikan filter Anda.</small>
            </div>
          ) : (
            <table className="app-table finance-table">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => {
                      const canSort = header.column.getCanSort();
                      const isActionCol = header.id === 'actions';
                      return (
                        <th 
                          key={header.id} 
                          scope="col"
                          className={isActionCol ? 'action-col' : ''}
                          style={{ cursor: canSort ? 'pointer' : 'default', userSelect: 'none' }}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: ['income', 'expense', 'balance'].includes(header.id) ? 'flex-end' : 'flex-start' }}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {canSort && ({
                              asc: ' 🔼',
                              desc: ' 🔽'
                            }[header.column.getIsSorted()] || null)}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => {
                  const entry = row.original;
                  return (
                    <tr key={entry.id}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className={['income', 'expense', 'balance'].includes(cell.column.id) ? 'col-money' : ''}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile Cards */}
        <div className="mobile-ledger-list show-on-mobile">
          {filteredData.length === 0 ? (
            <div className="maint-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 10px', textAlign: 'center' }}>
              {animationData ? (
                <div style={{ width: 100, height: 100, marginBottom: '12px' }}>
                  <Lottie animationData={animationData} loop={true} />
                </div>
              ) : (
                <Wallet size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              )}
              <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px', fontSize: '14px' }}>Tidak ada transaksi.</p>
            </div>
          ) : table.getRowModel().rows.map(row => {
            const entry = row.original;
            return (
              <div key={entry.id} className={`mobile-ledger-card ${entry.type}`}>
                <div className="mobile-ledger-info">
                  <span className="mobile-ledger-desc">{entry.description}</span>
                  <div className="mobile-ledger-meta">
                    <span className={`cat-badge ${entry.type}`}>{entry.category}</span>
                    <span className="mobile-ledger-date">{format(new Date(entry.date), 'dd MMM yyyy')}</span>
                    <span className={`source-badge ${entry.isManual ? 'manual' : 'booking'}`}>{getRef(entry)}</span>
                    {entry.isManual && entry.operatorName && (
                      <span className="mobile-ledger-operator">Oleh: {entry.operatorName}</span>
                    )}
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
                  <PDFDownloadLink
                    document={<ReceiptPDF transaction={entry} settings={{ studioName, studioAddress, studioPhone }} />}
                    fileName={`kuitansi-${entry.id}.pdf`}
                    style={{ textDecoration: 'none', display: 'inline-flex' }}
                  >
                    {({ loading }) => (
                      <button className="icon-btn print-btn" disabled={loading} title="Unduh PDF Kuitansi" aria-label="Unduh PDF Kuitansi" style={{ color: 'var(--accent-cyan)' }}>
                        <Download size={13} />
                      </button>
                    )}
                  </PDFDownloadLink>
                  {entry.isManual && (
                    <button className="icon-btn delete" onClick={() => { playClick(); if (window.confirm('Hapus transaksi ini?')) deleteTransaction(entry.id); }} title="Hapus" aria-label="Hapus Transaksi">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Print Receipt Section (Only visible during print) */}
      {receiptToPrint && (
        <div className="print-receipt-container">
          <div className="receipt">
            <h2 className="receipt-title">BUKTI TRANSAKSI</h2>
            <div className="receipt-header">
              <p><strong>{studioName || '37 MUSIC STUDIO'}</strong></p>
              <p>{studioAddress}</p>
              <p>{studioPhone}</p>
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
      <Modal isOpen={isModalOpen} onClose={() => { playClick(); setIsModalOpen(false); }} title="Catat Transaksi">
        <form className="finance-form" onSubmit={handleFormSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="transaction-type">Jenis Transaksi</label>
            <div id="transaction-type" className="type-toggle">
              <button 
                type="button" 
                className={`toggle-btn ${watchedType === 'income' ? 'active income' : ''}`}
                onClick={() => handleTypeChange('income')}
                aria-pressed={watchedType === 'income'}
              >
                <TrendingUp size={16} /> Pemasukan
              </button>
              <button 
                type="button" 
                className={`toggle-btn ${watchedType === 'expense' ? 'active expense' : ''}`}
                onClick={() => handleTypeChange('expense')}
                aria-pressed={watchedType === 'expense'}
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
                type="date"
                className="form-input"
                {...register('date', { validate: validateTransactionWithZod('date') })}
              />
              {errors.date && <span className="cf-error-message" style={{ color: 'var(--accent-pink)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.date.message}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="transaction-category">Kategori <span className="required">*</span></label>
              <select 
                id="transaction-category"
                className="form-input"
                {...register('category', { validate: validateTransactionWithZod('category') })}
              >
                {CATEGORIES[watchedType].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <span className="cf-error-message" style={{ color: 'var(--accent-pink)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.category.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="transaction-amount">Nominal (Rp) <span className="required">*</span></label>
            <input 
              id="transaction-amount"
              type="number" 
              className="form-input" 
              placeholder="0"
              min="1"
              autoFocus
              {...register('amount', { validate: validateTransactionWithZod('amount') })}
            />
            {errors.amount && <span className="cf-error-message" style={{ color: 'var(--accent-pink)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.amount.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="transaction-description">Keterangan <span className="required">*</span></label>
            <textarea 
              id="transaction-description"
              className="form-input form-textarea" 
              placeholder="Detail catatan transaksi..."
              rows="2"
              {...register('description', { validate: validateTransactionWithZod('description') })}
            />
            {errors.description && <span className="cf-error-message" style={{ color: 'var(--accent-pink)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.description.message}</span>}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { playClick(); setIsModalOpen(false); }}>Batal</button>
            <button type="submit" className="btn-primary">Simpan Transaksi</button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default FinancePage;
