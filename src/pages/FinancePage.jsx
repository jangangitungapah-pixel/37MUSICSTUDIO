import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useBookingStore } from '../store/useBookingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { format } from 'date-fns';
import { Wallet, TrendingUp, TrendingDown, Plus, Trash2 } from 'lucide-react';
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

  // Combine bookings and manual transactions
  const combinedData = useMemo(() => {
    let allEntries = [...transactions];

    // Map bookings to income entries
    bookings.forEach(b => {
      // Confirmed bookings contribute total price
      if (b.status === 'confirmed') {
        const total = b.duration * pricePerHour;
        allEntries.push({
          id: `book-${b.id}`,
          date: b.date,
          type: 'income',
          category: 'Sewa Studio',
          amount: total,
          description: `Sewa oleh ${b.band} (${b.duration} Jam)`,
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

  // Current Month Stats
  const currentMonth = format(new Date(), 'yyyy-MM');
  const thisMonthData = combinedData.filter(d => d.date.startsWith(currentMonth));
  
  const totalIncomeMonth = thisMonthData.filter(d => d.type === 'income').reduce((sum, d) => sum + d.amount, 0);
  const totalExpenseMonth = thisMonthData.filter(d => d.type === 'expense').reduce((sum, d) => sum + d.amount, 0);
  
  const totalBalance = combinedData.length > 0 ? combinedData[0].balance : 0; // Newest entry has final balance

  const formatCurrency = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

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
      <div className="finance-header">
        <div>
          <h2>Buku Kas / Pembukuan</h2>
          <p className="subtitle">Pantau arus kas masuk dan keluar operasional studio</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Catat Transaksi
        </button>
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
            <span className="stat-label">Pemasukan (Bulan Ini)</span>
            <span className="stat-value">{formatCurrency(totalIncomeMonth)}</span>
          </div>
        </div>
        <div className="finance-stat-card expense">
          <div className="stat-icon"><TrendingDown size={24} /></div>
          <div className="stat-data">
            <span className="stat-label">Pengeluaran (Bulan Ini)</span>
            <span className="stat-value">{formatCurrency(totalExpenseMonth)}</span>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="finance-content glass-panel">
        <div className="table-responsive">
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
              {combinedData.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">Tidak ada catatan transaksi.</td></tr>
              ) : (
                combinedData.map(entry => (
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
                    <td className="action-col">
                      {entry.isManual && (
                        <button 
                          className="icon-btn delete" 
                          onClick={() => deleteTransaction(entry.id)}
                          title="Hapus Transaksi"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
