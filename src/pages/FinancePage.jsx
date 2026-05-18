import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useBookingStore } from '../store/useBookingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { format, isSameDay, isSameWeek, isSameMonth, isSameYear } from 'date-fns';
import { Wallet, TrendingUp, TrendingDown, Plus, Trash2, Search, Download, Printer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import Modal from '../components/Modal';
import './FinancePage.css';

const CATEGORIES = {
  income: ['Sewa Studio', 'Lainnya'],
  expense: ['Operasional', 'Listrik / Air', 'Gaji', 'Perawatan', 'Alat Baru', 'Lainnya']
};

const FinancePage = () => {
  const { transactions, addTransaction, deleteTransaction } = useFinanceStore();
  const { bookings } = useBookingStore();
  const { pricePerHour } = useSettingsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense',
    date: format(new Date(), 'yyyy-MM-dd'),
    category: 'Operasional',
    amount: '',
    description: ''
  });
  
  const [filterPeriod, setFilterPeriod] = useState('month'); // 'day', 'week', 'month', 'year', 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [receiptToPrint, setReceiptToPrint] = useState(null);

  // Combine bookings and manual transactions
  const combinedData = useMemo(() => {
    let allEntries = [...transactions];

    // Map bookings to income entries
    bookings.forEach(b => {
      if (b.status === 'maintenance') return;
      
      // Confirmed bookings contribute total price
      if (b.status === 'confirmed') {
        const base = b.type === 'recording' ? (b.sessionPrice || 0) : (b.duration * pricePerHour);
        const total = base - (b.discountAmount || 0);
        allEntries.push({
          id: `book-${b.id}`,
          date: b.date,
          type: 'income',
          category: 'Sewa Studio',
          amount: total,
          description: `Sewa oleh ${b.band} (${b.duration} Jam)${b.discountAmount > 0 ? ' [VIP]' : ''}`,
          isManual: false
        });
      } 
      // DP bookings contribute DP amount only
      else if (b.status === 'dp' && b.dpAmount > 0) {
        allEntries.push({
          id: `dp-${b.id}`,
          date: b.date,
          type: 'income',
          category: 'Sewa Studio',
          amount: b.dpAmount,
          description: `DP Sewa oleh ${b.band}`,
          isManual: false
        });
      }
    });

    // Sort chronologically (oldest first) to calculate running balance
    allEntries.sort((a, b) => new Date(a.date) - new Date(b.date) || (a.id > b.id ? 1 : -1));

    let runningBalance = 0;
    return allEntries.map(entry => {
      if (entry.type === 'income') {
        runningBalance += entry.amount;
      } else {
        runningBalance -= entry.amount;
      }
      return { ...entry, balance: runningBalance };
    }).reverse(); // Reverse so newest is on top
  }, [transactions, bookings, pricePerHour]);

  // Filter Data based on selected period
  const filteredData = useMemo(() => {
    if (filterPeriod === 'all') return combinedData;
    
    const now = new Date();
    return combinedData.filter(entry => {
      const entryDate = new Date(entry.date);
      if (filterPeriod === 'day') return isSameDay(entryDate, now);
      if (filterPeriod === 'week') return isSameWeek(entryDate, now, { weekStartsOn: 1 });
      if (filterPeriod === 'month') return isSameMonth(entryDate, now);
      if (filterPeriod === 'year') return isSameYear(entryDate, now);
      return true;
    }).filter(entry => {
      if (!searchQuery) return true;
      const lowerQ = searchQuery.toLowerCase();
      return entry.description.toLowerCase().includes(lowerQ) || entry.category.toLowerCase().includes(lowerQ);
    });
  }, [combinedData, filterPeriod, searchQuery]);
  
  const totalIncomeFiltered = filteredData.filter(d => d.type === 'income').reduce((sum, d) => sum + d.amount, 0);
  const totalExpenseFiltered = filteredData.filter(d => d.type === 'expense').reduce((sum, d) => sum + d.amount, 0);
  
  const totalBalance = combinedData.length > 0 ? combinedData[0].balance : 0; // Newest entry has final balance

  const periodLabel = {
    'day': 'Hari Ini',
    'week': 'Minggu Ini',
    'month': 'Bulan Ini',
    'year': 'Tahun Ini',
    'all': 'Semua Waktu'
  }[filterPeriod];

  const formatCurrency = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  // Chart Data preparation
  const lineChartData = useMemo(() => {
    const grouped = {};
    
    filteredData.forEach(d => {
      const dDate = new Date(d.date);
      let dateKey, displayDate;
      
      if (filterPeriod === 'all') {
        dateKey = format(dDate, 'yyyy-MM');
        displayDate = format(dDate, 'MMM yyyy');
      } else if (filterPeriod === 'year') {
        dateKey = format(dDate, 'yyyy-MM');
        displayDate = format(dDate, 'MMM');
      } else {
        dateKey = format(dDate, 'yyyy-MM-dd');
        displayDate = format(dDate, 'dd MMM');
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = { 
          sortKey: dateKey,
          date: displayDate, 
          Pemasukan: 0, 
          Pengeluaran: 0 
        };
      }
      
      if (d.type === 'income') grouped[dateKey].Pemasukan += d.amount;
      else grouped[dateKey].Pengeluaran += d.amount;
    });
    
    // Sort chronologically based on the YYYY-MM-DD or YYYY-MM sortKey
    return Object.values(grouped).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [filteredData, filterPeriod]);

  const pieChartData = useMemo(() => {
    const grouped = {};
    filteredData.filter(d => d.type === 'expense').forEach(d => {
      if (!grouped[d.category]) grouped[d.category] = 0;
      grouped[d.category] += d.amount;
    });
    return Object.keys(grouped).map(k => ({ name: k, value: grouped[k] }));
  }, [filteredData]);

  const PIE_COLORS = ['#ff2a5f', '#00f0ff', '#a855f7', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0'];

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Buku Kas');

    // Title Rows
    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = 'LAPORAN KEUANGAN 37 MUSIC STUDIO';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A2:F2');
    worksheet.getCell('A2').value = `Periode: ${periodLabel} | Dicetak: ${format(new Date(), 'dd MMM yyyy HH:mm')}`;
    worksheet.getCell('A2').font = { size: 11, italic: true };
    worksheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.addRow([]); // Empty row

    // Headers
    const headerRow = worksheet.addRow(['Tanggal', 'Kategori', 'Tipe', 'Keterangan', 'Nominal', 'Saldo Berjalan']);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E1E2D' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    });

    // Columns width setup
    worksheet.columns = [
      { key: 'tanggal', width: 15 },
      { key: 'kategori', width: 20 },
      { key: 'tipe', width: 15 },
      { key: 'keterangan', width: 45 },
      { key: 'nominal', width: 22 },
      { key: 'saldo', width: 22 }
    ];

    // Add Data
    filteredData.forEach(d => {
      const row = worksheet.addRow([
        format(new Date(d.date), 'dd/MM/yyyy'),
        d.category,
        d.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        d.description,
        d.amount,
        d.balance
      ]);

      // Styling Data Row
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: {argb: 'FFE0E0E0'} }, left: { style: 'thin', color: {argb: 'FFE0E0E0'} },
          bottom: { style: 'thin', color: {argb: 'FFE0E0E0'} }, right: { style: 'thin', color: {argb: 'FFE0E0E0'} }
        };
        cell.alignment = { vertical: 'middle' };
        
        // Currency formatting
        if (colNumber === 5 || colNumber === 6) {
          cell.numFmt = '"Rp"#,##0;[Red]\-"Rp"#,##0';
        }
        
        // Color coding for Type and Nominal
        if (colNumber === 3 || colNumber === 5) {
          if (d.type === 'income') cell.font = { color: { argb: 'FF4CAF50' }, bold: colNumber === 5 };
          else cell.font = { color: { argb: 'FFFF2A5F' }, bold: colNumber === 5 };
        }
        
        // Make Saldo bold
        if (colNumber === 6) {
          cell.font = { bold: true };
        }
      });
    });

    // Generate File
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Laporan_Keuangan_37Studio_${filterPeriod}.xlsx`);
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

  return (
    <div className="finance-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Buku Kas / Pembukuan</h2>
          <p className="page-subtitle">Pantau arus kas masuk dan keluar operasional studio</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Cari transaksi..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '32px', width: '200px' }}
            />
          </div>
          <select 
            className="form-input" 
            style={{ width: 'auto', padding: '6px 12px', height: '36px', minWidth: '130px' }}
            value={filterPeriod} 
            onChange={(e) => setFilterPeriod(e.target.value)}
          >
            <option value="day">Hari Ini</option>
            <option value="week">Minggu Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="year">Tahun Ini</option>
            <option value="all">Semua Waktu</option>
          </select>
          <button className="btn-secondary" onClick={handleExportExcel} title="Export ke Excel" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 12px' }}>
            <Download size={16} /> <span className="hide-on-mobile">Export Excel</span>
          </button>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{ height: '36px' }}>
            <Plus size={18} /> <span className="hide-on-mobile">Catat Transaksi</span>
          </button>
        </div>
      </header>

      {/* Charts Section */}
      <div className="finance-charts-grid hide-on-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="finance-chart-card glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} color="var(--accent-cyan)" /> Tren Arus Kas
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(val) => `Rp${val/1000}k`} axisLine={false} tickLine={false} />
              <RechartsTooltip contentStyle={{backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', color: '#fff'}} itemStyle={{color: '#fff'}} />
              <Line type="monotone" dataKey="Pemasukan" stroke="var(--accent-cyan)" strokeWidth={3} dot={{r: 4, fill: 'var(--bg-dark)', strokeWidth: 2}} activeDot={{r: 6}} />
              <Line type="monotone" dataKey="Pengeluaran" stroke="var(--accent-pink)" strokeWidth={3} dot={{r: 4, fill: 'var(--bg-dark)', strokeWidth: 2}} activeDot={{r: 6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="finance-chart-card glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingDown size={16} color="var(--accent-pink)" /> Pengeluaran per Kategori
          </h3>
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px'}} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Belum ada pengeluaran
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="finance-stats">
        <div className="finance-stat-card primary">
          <div className="stat-icon"><Wallet size={24} /></div>
          <div className="stat-data">
            <span className="stat-label">Total Saldo Bersih</span>
            <span className="stat-value">{formatCurrency(totalBalance)}</span>
          </div>
        </div>
        <div className="finance-stat-card income">
          <div className="stat-icon"><TrendingUp size={24} /></div>
          <div className="stat-data">
            <span className="stat-label">Pemasukan ({periodLabel})</span>
            <span className="stat-value">{formatCurrency(totalIncomeFiltered)}</span>
          </div>
        </div>
        <div className="finance-stat-card expense">
          <div className="stat-icon"><TrendingDown size={24} /></div>
          <div className="stat-data">
            <span className="stat-label">Pengeluaran ({periodLabel})</span>
            <span className="stat-value">{formatCurrency(totalExpenseFiltered)}</span>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="finance-content glass-panel">
        <div className="finance-page table-responsive hide-on-mobile" style={{flex: 1, overflow: 'auto'}}>
          <table className="finance-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Kategori</th>
                <th>Keterangan</th>
                <th className="col-money">Kas Masuk (Debit)</th>
                <th className="col-money">Kas Keluar (Kredit)</th>
                <th className="col-money">Saldo Berjalan</th>
                <th className="action-col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">Tidak ada catatan transaksi untuk periode ini.</td></tr>
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
                    <td className="col-money text-income">
                      {entry.type === 'income' ? formatCurrency(entry.amount) : '-'}
                    </td>
                    <td className="col-money text-expense">
                      {entry.type === 'expense' ? formatCurrency(entry.amount) : '-'}
                    </td>
                    <td className="col-money fw-bold">
                      {formatCurrency(entry.balance)}
                    </td>
                    <td className="action-col" style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="icon-btn" 
                        onClick={() => handlePrint(entry)}
                        title="Cetak Kwitansi"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <Printer size={15} />
                      </button>
                      {entry.isManual && (
                        <button 
                          className="icon-btn delete" 
                          onClick={() => deleteTransaction(entry.id)}
                          title="Hapus Transaksi"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Ledger Cards */}
        <div className="mobile-ledger-list show-on-mobile">
          {filteredData.length === 0 ? (
            <div className="empty-state" style={{padding: '32px', textAlign: 'center', color: 'var(--text-muted)'}}>
              Tidak ada catatan transaksi untuk periode ini.
            </div>
          ) : filteredData.map(entry => (
            <div key={entry.id} className={`mobile-ledger-card ${entry.type}`}>
              <div className="mobile-ledger-info">
                <span className="mobile-ledger-desc">{entry.description}</span>
                <div className="mobile-ledger-meta">
                  <span className={`cat-badge ${entry.type}`}>{entry.category}</span>
                  <span className="mobile-ledger-date">{format(new Date(entry.date), 'dd MMM yyyy')}</span>
                </div>
              </div>
              <div className="mobile-ledger-right">
                <span className={`mobile-ledger-amount ${entry.type}`}>
                  {entry.type === 'income' ? '+' : '-'}{formatCurrency(entry.amount)}
                </span>
                <span className="mobile-ledger-balance">Saldo: {formatCurrency(entry.balance)}</span>
              </div>
              {entry.isManual && (
                <button 
                  className="icon-btn delete" 
                  onClick={() => deleteTransaction(entry.id)}
                  title="Hapus"
                  style={{ width: 28, height: 28, flexShrink: 0 }}
                >
                  <Trash2 size={13} />
                </button>
              )}
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
            <label>Jenis Transaksi</label>
            <div className="type-toggle">
              <button 
                type="button" 
                className={`toggle-btn ${formData.type === 'income' ? 'active income' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'income', category: CATEGORIES.income[0] }))}
              >
                <TrendingUp size={16} /> Pemasukan
              </button>
              <button 
                type="button" 
                className={`toggle-btn ${formData.type === 'expense' ? 'active expense' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'expense', category: CATEGORIES.expense[0] }))}
              >
                <TrendingDown size={16} /> Pengeluaran
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tanggal <span className="required">*</span></label>
              <input 
                type="date" name="date" 
                value={formData.date} 
                onChange={e => setFormData(p => ({...p, date: e.target.value}))} 
                className="form-input" required 
              />
            </div>
            <div className="form-group">
              <label>Kategori <span className="required">*</span></label>
              <select 
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
            <label>Nominal (Rp) <span className="required">*</span></label>
            <input 
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
            <label>Keterangan <span className="required">*</span></label>
            <textarea 
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
    </div>
  );
};

export default FinancePage;
