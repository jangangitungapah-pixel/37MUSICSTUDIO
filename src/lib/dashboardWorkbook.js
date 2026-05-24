import { format } from 'date-fns';
import { buildCombinedLedger } from './finance';
import {
  getAnomalies,
  getBillingInsights,
  getBookingTotal,
  getCustomerRetentionInsights,
  getDemandInsights,
  getMaintenanceUsageInsights,
  getRemainingDue,
  getRevenueForecast,
} from './smartInsights';

const THEME = {
  ink: 'FF111827',
  muted: 'FF6B7280',
  line: 'FFE5E7EB',
  lineDark: 'FF9CA3AF',
  navy: 'FF1F2937',
  navy2: 'FF374151',
  blue: 'FF2563EB',
  blueSoft: 'FFEFF6FF',
  cyan: 'FF0891B2',
  cyanSoft: 'FFE0F7FA',
  green: 'FF059669',
  greenSoft: 'FFECFDF5',
  amber: 'FFD97706',
  amberSoft: 'FFFFF7ED',
  red: 'FFDC2626',
  redSoft: 'FFFEF2F2',
  slateSoft: 'FFF8FAFC',
  violet: 'FF7C3AED',
  violetSoft: 'FFF5F3FF',
};

const MONEY_FMT = '"Rp" #,##0;[Red]-"Rp" #,##0;"-"';
const NUMBER_FMT = '#,##0';

const parseDate = (value) => {
  if (!value || value === '-') return null;
  const raw = String(value);
  const date = value instanceof Date ? value : new Date(raw.includes('T') ? raw : `${raw}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const dateKey = (value) => {
  const date = parseDate(value);
  return date ? format(date, 'yyyy-MM-dd') : '';
};

const displayDate = (value) => {
  const date = parseDate(value);
  return date ? format(date, 'dd MMM yyyy') : '-';
};

const displayDay = (value) => {
  const date = parseDate(value);
  return date ? format(date, 'EEEE') : '-';
};

const normalizeNumber = (value) => Number(value || 0);

const invoiceId = (id) => `INV-${String(id || '').slice(-5).padStart(5, '0')}`;

const bookingTypeLabel = (booking) => {
  if (booking.status === 'maintenance' || booking.type === 'maintenance') return 'Maintenance';
  if (booking.type === 'recording') return 'Recording';
  return 'Latihan';
};

const paymentStatusLabel = (status) => ({
  confirmed: 'Lunas',
  dp: 'DP',
  pending: 'Belum Bayar',
  cancelled: 'Dibatalkan',
  maintenance: 'Maintenance',
}[status] || status || '-');

const conditionLabel = (condition) => ({
  Excellent: 'Sangat Baik',
  Good: 'Baik',
  'Needs Repair': 'Perlu Servis',
  Broken: 'Rusak',
  excellent: 'Sangat Baik',
  good: 'Baik',
  needs_repair: 'Perlu Servis',
  broken: 'Rusak',
}[condition] || condition || '-');

const conditionTone = (condition) => {
  if (condition === 'Broken' || condition === 'broken') return { fg: THEME.red, bg: THEME.redSoft };
  if (condition === 'Needs Repair' || condition === 'needs_repair') return { fg: THEME.amber, bg: THEME.amberSoft };
  return { fg: THEME.green, bg: THEME.greenSoft };
};

const statusTone = (status) => {
  if (status === 'confirmed' || status === 'active') return { fg: THEME.green, bg: THEME.greenSoft };
  if (status === 'dp') return { fg: THEME.blue, bg: THEME.blueSoft };
  if (status === 'pending') return { fg: THEME.amber, bg: THEME.amberSoft };
  if (status === 'maintenance') return { fg: THEME.muted, bg: THEME.slateSoft };
  return { fg: THEME.red, bg: THEME.redSoft };
};

const thinBorder = (color = THEME.line) => ({
  top: { style: 'thin', color: { argb: color } },
  left: { style: 'thin', color: { argb: color } },
  bottom: { style: 'thin', color: { argb: color } },
  right: { style: 'thin', color: { argb: color } },
});

const setTitle = (worksheet, { title, subtitle, range, accent = THEME.blueSoft }) => {
  worksheet.mergeCells(range.title);
  const titleCell = worksheet.getCell(range.title.split(':')[0]);
  titleCell.value = title;
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: THEME.ink } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: accent } };

  worksheet.mergeCells(range.subtitle);
  const subtitleCell = worksheet.getCell(range.subtitle.split(':')[0]);
  subtitleCell.value = subtitle;
  subtitleCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: THEME.muted } };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  worksheet.getRow(Number(range.title.match(/\d+/)?.[0] || 1)).height = 30;
  worksheet.getRow(Number(range.subtitle.match(/\d+/)?.[0] || 2)).height = 20;
};

const styleHeaderRow = (worksheet, rowNumber) => {
  const row = worksheet.getRow(rowNumber);
  row.height = 28;
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME.navy } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = thinBorder(THEME.navy2);
  });
};

const styleDataRow = (row, index) => {
  row.height = 22;
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { name: 'Calibri', size: 10, color: { argb: THEME.ink } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: index % 2 === 0 ? 'FFFFFFFF' : THEME.slateSoft },
    };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = thinBorder();
  });
};

const styleTotalRow = (row) => {
  row.height = 25;
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: THEME.ink } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
    cell.border = {
      top: { style: 'medium', color: { argb: THEME.lineDark } },
      bottom: { style: 'double', color: { argb: THEME.navy2 } },
      left: { style: 'thin', color: { argb: THEME.lineDark } },
      right: { style: 'thin', color: { argb: THEME.lineDark } },
    };
    cell.alignment = { vertical: 'middle' };
  });
};

const setWidths = (worksheet, widths) => {
  widths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });
};

const setPage = (worksheet) => {
  worksheet.properties.defaultRowHeight = 19;
  worksheet.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.25, right: 0.25, top: 0.55, bottom: 0.55, header: 0.2, footer: 0.2 },
  };
};

const setMoneyColumns = (worksheet, columns) => {
  columns.forEach((column) => {
    worksheet.getColumn(column).numFmt = MONEY_FMT;
    worksheet.getColumn(column).alignment = { horizontal: 'right', vertical: 'middle' };
  });
};

const writeNote = (worksheet, row, startCol, endCol, value, tone = 'blue') => {
  const colors = {
    blue: { bg: THEME.blueSoft, fg: THEME.blue },
    green: { bg: THEME.greenSoft, fg: THEME.green },
    amber: { bg: THEME.amberSoft, fg: THEME.amber },
    red: { bg: THEME.redSoft, fg: THEME.red },
    slate: { bg: THEME.slateSoft, fg: THEME.muted },
  }[tone];
  worksheet.mergeCells(row, startCol, row, endCol);
  const cell = worksheet.getCell(row, startCol);
  cell.value = value;
  cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: colors.fg } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.bg } };
  cell.border = thinBorder();
  cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  worksheet.getRow(row).height = 24;
};

const getDateRangeLabel = (bookings = []) => {
  const dates = bookings.map((booking) => dateKey(booking.date)).filter(Boolean).sort();
  if (!dates.length) return 'Belum ada booking';
  return `${displayDate(dates[0])} sampai ${displayDate(dates[dates.length - 1])}`;
};

const getDaysFromToday = (dateValue, today) => {
  const date = parseDate(dateValue);
  if (!date) return null;
  const base = parseDate(format(today, 'yyyy-MM-dd'));
  return Math.ceil((date - base) / 86400000);
};

const customerSegment = (customer) => {
  const bookings = normalizeNumber(customer.totalBookings);
  const spent = normalizeNumber(customer.totalSpent);
  if (customer.isVIP || bookings >= 10 || spent >= 2000000) return 'VIP';
  if (bookings >= 5 || spent >= 1000000) return 'Potensial VIP';
  if (bookings > 0) return 'Reguler';
  return 'Prospek';
};

const followUpLabel = (customer, today) => {
  const days = getDaysFromToday(customer.lastBooking, today);
  if (days === null) return 'Belum pernah booking';
  const inactiveDays = Math.abs(days);
  if (inactiveDays >= 45) return `Follow-up: ${inactiveDays} hari tidak booking`;
  if (inactiveDays >= 21) return `Pantau: ${inactiveDays} hari tidak booking`;
  return 'Aktif';
};

const addSummarySheet = (workbook, context) => {
  const {
    bookings,
    customers,
    inventory,
    staffMembers,
    transactions,
    pricePerHour,
    studioName,
    today,
  } = context;

  const worksheet = workbook.addWorksheet('Ringkasan', { views: [{ showGridLines: false }] });
  setPage(worksheet);
  setWidths(worksheet, [22, 18, 18, 18, 22, 22, 22, 22]);

  const demand = getDemandInsights(bookings);
  const billing = getBillingInsights(bookings, pricePerHour);
  const forecast = getRevenueForecast(bookings, transactions, pricePerHour, today);
  const retention = getCustomerRetentionInsights(customers);
  const maintenance = getMaintenanceUsageInsights(inventory, bookings);
  const anomalies = getAnomalies(bookings, pricePerHour);

  setTitle(worksheet, {
    title: `Laporan Dashboard - ${studioName}`,
    subtitle: `Dicetak ${format(today, 'dd MMM yyyy HH:mm')} | Periode data booking: ${getDateRangeLabel(bookings)}`,
    range: { title: 'A1:H1', subtitle: 'A2:H2' },
    accent: THEME.cyanSoft,
  });

  const kpis = [
    ['Total Booking', demand.totalBookings, 'jadwal aktif'],
    ['Total Jam Studio', demand.totalHours, 'jam terbooking'],
    ['Nilai Booking Bulan Ini', forecast.bookedValue, 'gross booking'],
    ['Kas Masuk Bulan Ini', forecast.currentIncome, 'tercatat'],
    ['Piutang Terbuka', billing.totalReceivable, 'perlu follow-up'],
    ['Pelanggan', customers.length, 'kontak'],
    ['Inventaris', inventory.length, 'alat'],
    ['Staff Aktif', staffMembers.filter((s) => s.status === 'active').length, 'akun aktif'],
  ];

  worksheet.getRow(4).values = ['Metrik', 'Nilai', 'Catatan', '', 'Metrik', 'Nilai', 'Catatan', ''];
  [1, 5].forEach((cellNumber) => {
    const rowCell = worksheet.getRow(4).getCell(cellNumber);
    rowCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });
  styleHeaderRow(worksheet, 4);

  kpis.forEach((kpi, index) => {
    const rowNumber = 5 + Math.floor(index / 2);
    const startCol = index % 2 === 0 ? 1 : 5;
    const row = worksheet.getRow(rowNumber);
    row.getCell(startCol).value = kpi[0];
    row.getCell(startCol + 1).value = kpi[1];
    row.getCell(startCol + 2).value = kpi[2];
    [startCol, startCol + 1, startCol + 2].forEach((col) => {
      const cell = row.getCell(col);
      cell.border = thinBorder();
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 === 0 ? THEME.blueSoft : THEME.violetSoft } };
      cell.alignment = { vertical: 'middle' };
    });
    row.getCell(startCol).font = { bold: true, color: { argb: THEME.ink } };
    row.getCell(startCol + 1).font = { bold: true, size: 12, color: { argb: THEME.blue } };
    row.getCell(startCol + 1).numFmt = kpi[0].includes('Kas') || kpi[0].includes('Piutang') || kpi[0].includes('Nilai') ? MONEY_FMT : NUMBER_FMT;
  });

  writeNote(
    worksheet,
    10,
    1,
    8,
    `Demand: hari tersibuk ${demand.busiestDay || '-'}, jam ramai ${demand.busiestHour ? `${demand.busiestHour}.00` : '-'}, durasi favorit ${demand.favoriteDuration ? `${demand.favoriteDuration} jam` : '-'}. Estimasi okupansi ${demand.occupancyPercent}%.`,
    'blue'
  );

  const sectionHeader = (row, title) => {
    worksheet.mergeCells(row, 1, row, 8);
    const cell = worksheet.getCell(row, 1);
    cell.value = title;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME.navy2 } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    worksheet.getRow(row).height = 24;
  };

  sectionHeader(12, 'Prioritas Tagihan');
  worksheet.getRow(13).values = ['Invoice', 'Pelanggan', 'Tanggal', 'Sisa Tagihan', 'Urgensi', 'Telepon', '', ''];
  styleHeaderRow(worksheet, 13);
  const openInvoices = billing.openInvoices.slice(0, 6);
  if (openInvoices.length) {
    openInvoices.forEach((booking, index) => {
      const row = worksheet.getRow(14 + index);
      row.values = [
        invoiceId(booking.id),
        booking.band || '-',
        displayDate(booking.date),
        booking.remaining,
        booking.urgency === 'overdue' ? 'Lewat jadwal' : booking.urgency === 'today' ? 'Hari ini' : booking.urgency === 'high' ? 'Nominal besar' : 'Normal',
        booking.phone || '-',
      ];
      styleDataRow(row, index);
      row.getCell(4).numFmt = MONEY_FMT;
      row.getCell(4).font = { bold: true, color: { argb: THEME.red } };
    });
  } else {
    writeNote(worksheet, 14, 1, 8, 'Tidak ada tagihan terbuka.', 'green');
  }

  const maintenanceStartRow = openInvoices.length ? 22 : 17;
  sectionHeader(maintenanceStartRow, 'Perawatan Inventaris');
  worksheet.getRow(maintenanceStartRow + 1).values = ['Alat', 'Kategori', 'Prioritas', 'Estimasi Pakai 30 Hari', 'Jadwal Servis', 'Alasan', '', ''];
  styleHeaderRow(worksheet, maintenanceStartRow + 1);
  maintenance.recommendations.slice(0, 6).forEach((item, index) => {
    const row = worksheet.getRow(maintenanceStartRow + 2 + index);
    row.values = [
      item.item.name || '-',
      item.item.category || '-',
      item.label,
      item.usageHours,
      item.daysToService === null ? '-' : item.daysToService < 0 ? `${Math.abs(item.daysToService)} hari lewat` : `${item.daysToService} hari lagi`,
      item.reason,
    ];
    styleDataRow(row, index);
    row.getCell(4).numFmt = NUMBER_FMT;
    row.getCell(3).font = { bold: true, color: { argb: item.priority >= 8 ? THEME.red : item.priority >= 5 ? THEME.amber : THEME.green } };
  });

  const actionRow = maintenanceStartRow + 10;
  sectionHeader(actionRow, 'Catatan Operasional');
  const notes = [
    billing.summary,
    retention.passiveCustomers.length ? `${retention.passiveCustomers.length} pelanggan pasif perlu ditindaklanjuti.` : 'Retensi pelanggan stabil.',
    anomalies.length ? `${anomalies.length} anomali data perlu dicek di sheet terkait.` : 'Tidak ada anomali booking utama.',
  ];
  notes.forEach((note, index) => writeNote(worksheet, actionRow + 1 + index, 1, 8, note, index === 2 && anomalies.length ? 'amber' : 'slate'));

  worksheet.views = [{ state: 'frozen', ySplit: 4, showGridLines: false }];
};

const addBookingSheet = (workbook, context) => {
  const { bookings, pricePerHour, studioName, today } = context;
  const worksheet = workbook.addWorksheet('Jadwal & Booking', { views: [{ showGridLines: false }] });
  setPage(worksheet);
  setWidths(worksheet, [14, 15, 13, 10, 10, 10, 26, 18, 14, 16, 16, 16, 16, 16, 16, 16, 26]);

  setTitle(worksheet, {
    title: `Laporan Jadwal & Booking - ${studioName}`,
    subtitle: `Dicetak ${format(today, 'dd MMM yyyy HH:mm')} | Range: ${getDateRangeLabel(bookings)}`,
    range: { title: 'A1:Q1', subtitle: 'A2:Q2' },
    accent: THEME.blueSoft,
  });

  const activeBookings = bookings.filter((booking) => booking.status !== 'cancelled');
  const paidCount = activeBookings.filter((booking) => booking.status === 'confirmed').length;
  const dpCount = activeBookings.filter((booking) => booking.status === 'dp').length;
  const pendingCount = activeBookings.filter((booking) => booking.status === 'pending').length;
  const totalValue = activeBookings.reduce((sum, booking) => sum + getBookingTotal(booking, pricePerHour), 0);
  const totalReceivable = activeBookings.reduce((sum, booking) => sum + getRemainingDue(booking, pricePerHour), 0);
  writeNote(worksheet, 4, 1, 17, `Ringkasan: ${activeBookings.length} jadwal aktif | Lunas ${paidCount} | DP ${dpCount} | Belum bayar ${pendingCount} | Nilai booking ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalValue)} | Piutang ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalReceivable)}`, totalReceivable > 0 ? 'amber' : 'green');

  worksheet.getRow(6).values = [
    'Invoice',
    'Tanggal',
    'Hari',
    'Mulai',
    'Selesai',
    'Durasi',
    'Band/Penyewa',
    'No WhatsApp',
    'Layanan',
    'Status Bayar',
    'Harga Dasar',
    'Sewa Alat',
    'Diskon',
    'Total Tagihan',
    'DP Masuk',
    'Sisa Tagihan',
    'Catatan Follow-up',
  ];
  styleHeaderRow(worksheet, 6);

  const sortedBookings = [...bookings].sort((a, b) => dateKey(a.date).localeCompare(dateKey(b.date)) || normalizeNumber(a.hour) - normalizeNumber(b.hour));
  sortedBookings.forEach((booking, index) => {
    const base = booking.status === 'maintenance'
      ? 0
      : booking.type === 'recording'
        ? normalizeNumber(booking.sessionPrice)
        : normalizeNumber(booking.duration) * normalizeNumber(pricePerHour);
    const equipment = booking.status === 'maintenance' ? 0 : normalizeNumber(booking.equipmentCost);
    const discount = booking.status === 'maintenance' ? 0 : normalizeNumber(booking.discountAmount);
    const total = getBookingTotal(booking, pricePerHour);
    const dp = booking.status === 'maintenance' ? 0 : normalizeNumber(booking.dpAmount);
    const remaining = getRemainingDue(booking, pricePerHour);
    const daysUntil = getDaysFromToday(booking.date, today);
    const followUp = remaining <= 0
      ? 'OK'
      : daysUntil !== null && daysUntil < 0
        ? `Lewat jadwal ${Math.abs(daysUntil)} hari`
        : daysUntil !== null && daysUntil <= 1
          ? 'Follow-up hari ini'
          : 'Pantau pembayaran';

    const row = worksheet.addRow([
      invoiceId(booking.id),
      displayDate(booking.date),
      displayDay(booking.date),
      `${normalizeNumber(booking.hour)}.00`,
      `${normalizeNumber(booking.hour) + normalizeNumber(booking.duration)}.00`,
      normalizeNumber(booking.duration),
      booking.band || '-',
      booking.phone || '-',
      bookingTypeLabel(booking),
      paymentStatusLabel(booking.status),
      base,
      equipment,
      discount,
      total,
      dp,
      remaining,
      followUp,
    ]);

    styleDataRow(row, index);
    row.getCell(6).numFmt = '0 "jam"';
    const tone = statusTone(booking.status);
    row.getCell(10).font = { bold: true, color: { argb: tone.fg } };
    row.getCell(10).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tone.bg } };
    if (remaining > 0) {
      row.getCell(16).font = { bold: true, color: { argb: THEME.red } };
      row.getCell(17).font = { bold: true, color: { argb: THEME.amber } };
    }
  });

  const dataEnd = 6 + sortedBookings.length;
  if (sortedBookings.length) {
    const totalRow = worksheet.addRow([]);
    totalRow.getCell(1).value = 'TOTAL';
    totalRow.getCell(6).value = { formula: `SUBTOTAL(109,F7:F${dataEnd})` };
    totalRow.getCell(11).value = { formula: `SUBTOTAL(109,K7:K${dataEnd})` };
    totalRow.getCell(12).value = { formula: `SUBTOTAL(109,L7:L${dataEnd})` };
    totalRow.getCell(13).value = { formula: `SUBTOTAL(109,M7:M${dataEnd})` };
    totalRow.getCell(14).value = { formula: `SUBTOTAL(109,N7:N${dataEnd})` };
    totalRow.getCell(15).value = { formula: `SUBTOTAL(109,O7:O${dataEnd})` };
    totalRow.getCell(16).value = { formula: `SUBTOTAL(109,P7:P${dataEnd})` };
    styleTotalRow(totalRow);
    worksheet.mergeCells(totalRow.number, 1, totalRow.number, 5);
  }

  setMoneyColumns(worksheet, [11, 12, 13, 14, 15, 16]);
  [1, 2, 3, 4, 5, 6, 9, 10].forEach((col) => {
    worksheet.getColumn(col).alignment = { horizontal: 'center', vertical: 'middle' };
  });
  [7, 8, 17].forEach((col) => {
    worksheet.getColumn(col).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  });
  if (sortedBookings.length) worksheet.autoFilter = `A6:Q${dataEnd}`;
  worksheet.views = [{ state: 'frozen', ySplit: 6, showGridLines: false }];
};

const addFinanceSheet = (workbook, context) => {
  const { transactions, bookings, pricePerHour, studioName, today } = context;
  const worksheet = workbook.addWorksheet('Pembukuan', { views: [{ showGridLines: false }] });
  setPage(worksheet);
  setWidths(worksheet, [7, 15, 16, 20, 42, 18, 18, 18, 18, 18]);

  const ledger = buildCombinedLedger({ transactions, bookings, pricePerHour });
  const income = ledger.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + normalizeNumber(entry.amount), 0);
  const expense = ledger.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + normalizeNumber(entry.amount), 0);
  const net = income - expense;

  setTitle(worksheet, {
    title: `Laporan Pembukuan - ${studioName}`,
    subtitle: `Dicetak ${format(today, 'dd MMM yyyy HH:mm')} | ${ledger.length} transaksi | Saldo akhir ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(net)}`,
    range: { title: 'A1:J1', subtitle: 'A2:J2' },
    accent: THEME.greenSoft,
  });
  writeNote(worksheet, 4, 1, 10, `Total kas masuk ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(income)} | kas keluar ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(expense)} | net ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(net)}. Data booking lunas dan DP otomatis masuk ledger.`, net >= 0 ? 'green' : 'red');

  worksheet.getRow(6).values = ['No', 'Tanggal', 'Arus', 'Kategori', 'Keterangan', 'Referensi', 'Sumber', 'Kas Masuk', 'Kas Keluar', 'Saldo Berjalan'];
  styleHeaderRow(worksheet, 6);

  ledger.reverse().forEach((entry, index) => {
    const isIncome = entry.type === 'income';
    const rawId = String(entry.id || '');
    const reference = rawId.startsWith('book-')
      ? invoiceId(rawId.replace('book-', ''))
      : rawId.startsWith('dp-')
        ? `DP-${String(rawId.replace('dp-', '')).slice(-5).padStart(5, '0')}`
        : rawId || 'Manual';
    const source = entry.isManual === false ? 'Booking' : 'Manual';
    const row = worksheet.addRow([
      index + 1,
      displayDate(entry.date),
      isIncome ? 'Pemasukan' : 'Pengeluaran',
      entry.category || (isIncome ? 'Sewa Studio' : '-'),
      entry.description || '-',
      reference,
      source,
      isIncome ? entry.amount : null,
      isIncome ? null : entry.amount,
      entry.balance,
    ]);
    styleDataRow(row, index);
    const tone = isIncome ? { fg: THEME.green, bg: THEME.greenSoft } : { fg: THEME.red, bg: THEME.redSoft };
    row.getCell(3).font = { bold: true, color: { argb: tone.fg } };
    row.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tone.bg } };
    row.getCell(7).font = { italic: true, color: { argb: THEME.muted } };
    row.getCell(10).font = { bold: true, color: { argb: entry.balance >= 0 ? THEME.blue : THEME.red } };
  });

  const dataEnd = 6 + ledger.length;
  if (ledger.length) {
    const totalRow = worksheet.addRow([]);
    totalRow.getCell(1).value = 'TOTAL';
    totalRow.getCell(8).value = { formula: `SUBTOTAL(109,H7:H${dataEnd})` };
    totalRow.getCell(9).value = { formula: `SUBTOTAL(109,I7:I${dataEnd})` };
    totalRow.getCell(10).value = { formula: `H${dataEnd + 1}-I${dataEnd + 1}` };
    styleTotalRow(totalRow);
    worksheet.mergeCells(totalRow.number, 1, totalRow.number, 7);
  }

  setMoneyColumns(worksheet, [8, 9, 10]);
  [1, 2, 3, 6, 7].forEach((col) => {
    worksheet.getColumn(col).alignment = { horizontal: 'center', vertical: 'middle' };
  });
  worksheet.getColumn(5).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  if (ledger.length) worksheet.autoFilter = `A6:J${dataEnd}`;
  worksheet.views = [{ state: 'frozen', ySplit: 6, showGridLines: false }];
};

const addCustomersSheet = (workbook, context) => {
  const { customers, studioName, today } = context;
  const worksheet = workbook.addWorksheet('Daftar Pelanggan', { views: [{ showGridLines: false }] });
  setPage(worksheet);
  setWidths(worksheet, [28, 18, 16, 16, 16, 15, 15, 15, 18, 18, 20, 30]);

  const vipCount = customers.filter((customer) => customerSegment(customer) === 'VIP').length;
  const followUpCount = customers.filter((customer) => followUpLabel(customer, today).startsWith('Follow-up')).length;
  setTitle(worksheet, {
    title: `Laporan Pelanggan - ${studioName}`,
    subtitle: `Dicetak ${format(today, 'dd MMM yyyy HH:mm')} | ${customers.length} pelanggan | ${vipCount} VIP | ${followUpCount} perlu follow-up`,
    range: { title: 'A1:L1', subtitle: 'A2:L2' },
    accent: THEME.violetSoft,
  });
  writeNote(worksheet, 4, 1, 12, 'Sheet ini ditambah segmentasi, nilai transaksi, rata-rata order, dan status follow-up agar data pelanggan bisa langsung dipakai untuk promo/retensi.', 'slate');

  worksheet.getRow(6).values = [
    'Nama Pelanggan',
    'No WhatsApp',
    'Tanggal Gabung',
    'Umur Data',
    'Booking Terakhir',
    'Hari Tidak Booking',
    'Total Booking',
    'Total Jam',
    'Total Belanja',
    'Rata-rata/Booking',
    'Segmen',
    'Rekomendasi Follow-up',
  ];
  styleHeaderRow(worksheet, 6);

  customers
    .slice()
    .sort((a, b) => normalizeNumber(b.totalSpent) - normalizeNumber(a.totalSpent) || normalizeNumber(b.totalBookings) - normalizeNumber(a.totalBookings))
    .forEach((customer, index) => {
      const joined = customer.joinDate || customer.joinedAt;
      const joinedAge = getDaysFromToday(joined, today);
      const lastBookingDays = getDaysFromToday(customer.lastBooking, today);
      const inactiveDays = lastBookingDays === null ? null : Math.abs(lastBookingDays);
      const totalBookings = normalizeNumber(customer.totalBookings);
      const averageSpend = totalBookings > 0 ? Math.round(normalizeNumber(customer.totalSpent) / totalBookings) : 0;
      const segment = customerSegment(customer);
      const row = worksheet.addRow([
        customer.name || '-',
        customer.phone || '-',
        displayDate(joined),
        joinedAge === null ? '-' : `${Math.abs(joinedAge)} hari`,
        displayDate(customer.lastBooking),
        inactiveDays,
        totalBookings,
        normalizeNumber(customer.totalHours),
        normalizeNumber(customer.totalSpent),
        averageSpend,
        segment,
        followUpLabel(customer, today),
      ]);
      styleDataRow(row, index);
      if (segment === 'VIP') row.getCell(11).font = { bold: true, color: { argb: THEME.green } };
      if (segment === 'Potensial VIP') row.getCell(11).font = { bold: true, color: { argb: THEME.violet } };
      if (row.getCell(12).value?.startsWith?.('Follow-up')) row.getCell(12).font = { bold: true, color: { argb: THEME.amber } };
    });

  const dataEnd = 6 + customers.length;
  if (customers.length) {
    const totalRow = worksheet.addRow([]);
    totalRow.getCell(1).value = 'TOTAL';
    totalRow.getCell(7).value = { formula: `SUBTOTAL(109,G7:G${dataEnd})` };
    totalRow.getCell(8).value = { formula: `SUBTOTAL(109,H7:H${dataEnd})` };
    totalRow.getCell(9).value = { formula: `SUBTOTAL(109,I7:I${dataEnd})` };
    totalRow.getCell(10).value = { formula: `IF(G${dataEnd + 1}=0,0,I${dataEnd + 1}/G${dataEnd + 1})` };
    styleTotalRow(totalRow);
    worksheet.mergeCells(totalRow.number, 1, totalRow.number, 6);
  }

  setMoneyColumns(worksheet, [9, 10]);
  [3, 4, 5, 6, 7, 8, 11].forEach((col) => {
    worksheet.getColumn(col).alignment = { horizontal: 'center', vertical: 'middle' };
  });
  [1, 2, 12].forEach((col) => {
    worksheet.getColumn(col).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  });
  if (customers.length) worksheet.autoFilter = `A6:L${dataEnd}`;
  worksheet.views = [{ state: 'frozen', ySplit: 6, showGridLines: false }];
};

const addInventorySheet = (workbook, context) => {
  const { inventory, bookings, studioName, today } = context;
  const worksheet = workbook.addWorksheet('Inventaris Alat', { views: [{ showGridLines: false }] });
  setPage(worksheet);
  setWidths(worksheet, [28, 18, 20, 8, 16, 16, 16, 15, 16, 14, 18, 20, 30]);

  const maintenance = getMaintenanceUsageInsights(inventory, bookings);
  const maintenanceById = new Map(maintenance.recommendations.map((item) => [item.item.id, item]));
  const serviceNeeded = maintenance.recommendations.filter((item) => item.priority >= 3).length;
  const assetValue = inventory.reduce((sum, item) => sum + normalizeNumber(item.price) * normalizeNumber(item.qty || 1), 0);

  setTitle(worksheet, {
    title: `Laporan Inventaris Alat - ${studioName}`,
    subtitle: `Dicetak ${format(today, 'dd MMM yyyy HH:mm')} | ${inventory.length} alat | ${serviceNeeded} perlu dipantau | Estimasi nilai aset ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(assetValue)}`,
    range: { title: 'A1:M1', subtitle: 'A2:M2' },
    accent: THEME.amberSoft,
  });
  writeNote(worksheet, 4, 1, 13, `Estimasi pemakaian 30 hari berbasis booking terbaru. Total jam studio 30 hari: ${maintenance.studioHours30d} jam.`, serviceNeeded ? 'amber' : 'green');

  worksheet.getRow(6).values = [
    'Nama Alat',
    'Kategori',
    'Merek/Tipe',
    'Qty',
    'Tanggal Beli',
    'Harga Satuan',
    'Nilai Aset',
    'Kondisi',
    'Servis Terakhir',
    'Servis Berikutnya',
    'Hari ke Servis',
    'Prioritas',
    'Catatan',
  ];
  styleHeaderRow(worksheet, 6);

  inventory
    .slice()
    .sort((a, b) => (maintenanceById.get(b.id)?.priority || 0) - (maintenanceById.get(a.id)?.priority || 0))
    .forEach((item, index) => {
      const rec = maintenanceById.get(item.id);
      const qty = normalizeNumber(item.qty || 1);
      const unitPrice = normalizeNumber(item.price);
      const row = worksheet.addRow([
        item.name || '-',
        item.category || '-',
        item.brand || '-',
        qty,
        displayDate(item.purchaseDate || item.buyDate),
        unitPrice,
        unitPrice * qty,
        conditionLabel(item.condition),
        displayDate(item.lastServiced),
        displayDate(item.nextService),
        rec?.daysToService ?? null,
        rec?.label || 'Normal',
        item.notes || rec?.reason || '-',
      ]);
      styleDataRow(row, index);
      const tone = conditionTone(item.condition);
      row.getCell(8).font = { bold: true, color: { argb: tone.fg } };
      row.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tone.bg } };
      if ((rec?.priority || 0) >= 5) row.getCell(12).font = { bold: true, color: { argb: rec.priority >= 8 ? THEME.red : THEME.amber } };
    });

  const dataEnd = 6 + inventory.length;
  if (inventory.length) {
    const totalRow = worksheet.addRow([]);
    totalRow.getCell(1).value = 'TOTAL ASET';
    totalRow.getCell(4).value = { formula: `SUBTOTAL(109,D7:D${dataEnd})` };
    totalRow.getCell(7).value = { formula: `SUBTOTAL(109,G7:G${dataEnd})` };
    styleTotalRow(totalRow);
    worksheet.mergeCells(totalRow.number, 1, totalRow.number, 3);
  }

  setMoneyColumns(worksheet, [6, 7]);
  [2, 4, 5, 8, 9, 10, 11, 12].forEach((col) => {
    worksheet.getColumn(col).alignment = { horizontal: 'center', vertical: 'middle' };
  });
  [1, 3, 13].forEach((col) => {
    worksheet.getColumn(col).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  });
  if (inventory.length) worksheet.autoFilter = `A6:M${dataEnd}`;
  worksheet.views = [{ state: 'frozen', ySplit: 6, showGridLines: false }];
};

const addStaffSheet = (workbook, context) => {
  const { staffMembers, studioName, today } = context;
  const worksheet = workbook.addWorksheet('Daftar Staff', { views: [{ showGridLines: false }] });
  setPage(worksheet);
  setWidths(worksheet, [28, 18, 16, 24, 30, 18, 16, 30]);

  const activeCount = staffMembers.filter((staff) => staff.status === 'active').length;
  setTitle(worksheet, {
    title: `Daftar Staff & Admin - ${studioName}`,
    subtitle: `Dicetak ${format(today, 'dd MMM yyyy HH:mm')} | ${staffMembers.length} akun | ${activeCount} aktif`,
    range: { title: 'A1:H1', subtitle: 'A2:H2' },
    accent: THEME.slateSoft,
  });
  writeNote(worksheet, 4, 1, 8, 'Sheet staff ditambah username, jumlah permission, dan catatan akses agar audit operasional lebih cepat.', 'slate');

  worksheet.getRow(6).values = ['Nama Lengkap', 'Role', 'Status Akun', 'Username', 'Email Login', 'No Telepon', 'Jumlah Akses', 'Catatan Akses'];
  styleHeaderRow(worksheet, 6);

  staffMembers.forEach((staff, index) => {
    const permissions = Array.isArray(staff.permissions) ? staff.permissions : [];
    const row = worksheet.addRow([
      staff.name || '-',
      staff.role === 'admin' ? 'Administrator' : 'Staff',
      staff.status === 'active' ? 'Aktif' : 'Nonaktif',
      staff.username || '-',
      staff.email || '-',
      staff.phone || '-',
      permissions.length,
      staff.role === 'admin' ? 'Akses penuh' : permissions.length ? permissions.join(', ') : 'Akses default/belum dicatat',
    ]);
    styleDataRow(row, index);
    const tone = statusTone(staff.status);
    row.getCell(3).font = { bold: true, color: { argb: tone.fg } };
    row.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tone.bg } };
    if (staff.role === 'admin') row.getCell(2).font = { bold: true, color: { argb: THEME.violet } };
  });

  const dataEnd = 6 + staffMembers.length;
  if (staffMembers.length) worksheet.autoFilter = `A6:H${dataEnd}`;
  [2, 3, 7].forEach((col) => {
    worksheet.getColumn(col).alignment = { horizontal: 'center', vertical: 'middle' };
  });
  [1, 4, 5, 6, 8].forEach((col) => {
    worksheet.getColumn(col).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  });
  worksheet.views = [{ state: 'frozen', ySplit: 6, showGridLines: false }];
};

export const buildDashboardWorkbook = (workbook, options) => {
  const context = {
    ...options,
    studioName: options.studioName || '37 Music Studio',
    bookings: options.bookings || [],
    customers: options.customers || [],
    inventory: options.inventory || [],
    staffMembers: options.staffMembers || [],
    transactions: options.transactions || [],
    pricePerHour: normalizeNumber(options.pricePerHour),
    operationalHours: options.operationalHours || { start: 10, end: 23 },
    today: options.today || new Date(),
  };

  workbook.creator = context.studioName;
  workbook.company = context.studioName;
  workbook.subject = 'Laporan operasional dashboard';
  workbook.title = `Laporan Dashboard ${context.studioName}`;
  workbook.created = context.today;
  workbook.modified = context.today;

  addSummarySheet(workbook, context);
  addBookingSheet(workbook, context);
  addFinanceSheet(workbook, context);
  addCustomersSheet(workbook, context);
  addInventorySheet(workbook, context);
  addStaffSheet(workbook, context);

  return workbook;
};
