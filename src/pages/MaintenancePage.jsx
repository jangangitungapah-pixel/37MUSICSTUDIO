import { useState, useMemo } from 'react';
import { useBookingStore } from '../store/useBookingStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { format } from 'date-fns';
import { Wrench, AlertCircle, CheckCircle, Clock, DollarSign, Trash2, FileText, Search, X, Plus } from 'lucide-react';
import Modal from '../components/Modal';
import { toast } from 'sonner';
import { getMaintenanceUsageInsights } from '../lib/smartInsights';
import { motion } from 'framer-motion';
import { pagePreset } from '../animations';
import Lottie from 'lottie-react';
import { useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender
} from '@tanstack/react-table';
import './MaintenancePage.css';

const MaintenancePage = () => {
  const { bookings, deleteBooking, addBooking, updateBooking } = useBookingStore();
  const { addTransaction } = useFinanceStore();
  const { inventory } = useInventoryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch('https://lottie.host/80c4e1f7-e737-4d76-880c-a9a304889c10/3B18t52W7l.json')
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error("Lottie load failed", err));
  }, []);
  
  const [formData, setFormData] = useState({
    description: '',
    cost: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'pending',
  });

  const [newLogData, setNewLogData] = useState({
    item: 'Studio 1 (Umum)',
    date: format(new Date(), 'yyyy-MM-dd'),
    hour: 10,
    duration: 2,
    description: '',
    status: 'pending',
    cost: '',
  });

  // Filter only maintenance-type bookings
  const maintenanceLogs = useMemo(() =>
    bookings
      .filter(b => b.type === 'maintenance' || b.status === 'maintenance')
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [bookings]
  );

  const filteredMaintenanceLogs = useMemo(() => {
    let result = maintenanceLogs;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(log => 
        (log.band && log.band.toLowerCase().includes(q)) ||
        (log.note && log.note.toLowerCase().includes(q)) ||
        (log.maintenanceStatus && log.maintenanceStatus.toLowerCase().includes(q))
      );
    }
    return result;
  }, [maintenanceLogs, searchQuery]);

  const stats = useMemo(() => {
    const total = maintenanceLogs.length;
    const done = maintenanceLogs.filter(b => b.maintenanceStatus === 'done').length;
    const pending = total - done;
    const totalCost = maintenanceLogs.reduce((sum, b) => sum + (Number(b.maintenanceCost) || 0), 0);
    return { total, done, pending, totalCost };
  }, [maintenanceLogs]);

  const usageInsights = useMemo(() => getMaintenanceUsageInsights(inventory, bookings), [inventory, bookings]);

  const formatCurrency = (num) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  const columns = useMemo(() => [
    {
      accessorKey: 'date',
      header: 'Tanggal',
      cell: info => format(new Date(info.getValue()), 'dd MMM yyyy')
    },
    {
      accessorKey: 'band',
      header: 'Judul',
      cell: info => (
        <div className="maint-title-cell">
          <Wrench size={14} color="var(--accent-pink)" style={{ marginRight: 6 }} />
          {info.getValue() || 'Maintenance'}
        </div>
      )
    },
    {
      accessorKey: 'hour',
      header: 'Jam',
      cell: info => `${String(info.getValue()).padStart(2, '0')}:00`
    },
    {
      accessorKey: 'duration',
      header: 'Durasi',
      cell: info => `${info.getValue()} jam`
    },
    {
      accessorKey: 'maintenanceStatus',
      header: 'Status',
      cell: info => {
        const log = info.row.original;
        const statusInfo = getStatusBadge(log);
        return (
          <span className="maint-status-badge" style={{ background: `${statusInfo.color}22`, color: statusInfo.color, borderColor: `${statusInfo.color}44` }}>
            {statusInfo.icon}
            <span style={{ marginLeft: 4 }}>{statusInfo.label}</span>
          </span>
        );
      }
    },
    {
      accessorKey: 'maintenanceCost',
      header: 'Biaya',
      cell: info => {
        const cost = info.getValue();
        return (
          <span className={cost > 0 ? 'maint-cost-cell has-cost' : 'maint-cost-cell'}>
            {cost > 0 ? formatCurrency(cost) : '—'}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: info => {
        const log = info.row.original;
        return (
          <div onClick={e => e.stopPropagation()}>
            <button
              className="icon-btn delete"
              onClick={() => {
                if (window.confirm('Hapus log ini?')) {
                  deleteBooking(log.id);
                  toast.success('Log dihapus');
                }
              }}
              title="Hapus"
              aria-label={`Hapus log maintenance ${log.band || 'Pemeliharaan Studio'}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      }
    }
  ], []);

  const [sorting, setSorting] = useState([]);

  const table = useReactTable({
    data: filteredMaintenanceLogs,
    columns,
    state: {
      sorting
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  const handleOpenDetail = (log) => {
    setSelectedLog(log);
    setFormData({
      description: log.note || '',
      cost: log.maintenanceCost || '',
      date: log.date || format(new Date(), 'yyyy-MM-dd'),
      status: log.maintenanceStatus || 'pending',
    });
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setNewLogData({
      item: 'Studio 1 (Umum)',
      date: format(new Date(), 'yyyy-MM-dd'),
      hour: 10,
      duration: 2,
      description: '',
      status: 'pending',
      cost: '',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveNew = async (e) => {
    e.preventDefault();
    const cost = Number(newLogData.cost) || 0;
    
    const newBooking = {
      band: newLogData.item,
      date: newLogData.date,
      hour: Number(newLogData.hour),
      duration: Number(newLogData.duration),
      type: 'maintenance',
      status: 'maintenance',
      maintenanceStatus: newLogData.status,
      maintenanceCost: cost,
      note: newLogData.description,
    };

    try {
      await addBooking(newBooking);

      // Record as expense in finance store if cost > 0 and status is done
      if (cost > 0 && newLogData.status === 'done') {
        addTransaction({
          type: 'expense',
          date: newLogData.date,
          category: 'Perawatan',
          amount: cost,
          description: `Biaya Maintenance: ${newLogData.item}`,
        });
        toast.success(`Log dicatat & Biaya Rp${cost.toLocaleString('id-ID')} dimasukkan ke pembukuan`);
      } else {
        toast.success('Log maintenance baru berhasil ditambahkan');
      }

      setIsAddModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Gagal menambahkan log maintenance');
    }
  };

  const handleSaveCost = async (e) => {
    e.preventDefault();
    if (!selectedLog) return;

    const cost = Number(formData.cost);

    // Update booking with maintenance cost info
    await updateBooking(selectedLog.id, {
      maintenanceCost: cost,
      maintenanceStatus: formData.status,
      note: formData.description,
    });

    // Also record as expense in finance store if cost > 0
    if (cost > 0 && formData.status === 'done') {
      addTransaction({
        type: 'expense',
        date: formData.date,
        category: 'Perawatan',
        amount: cost,
        description: `Biaya Maintenance: ${selectedLog.band || 'Pemeliharaan Studio'}`,
      });
      toast.success(`Biaya Rp${cost.toLocaleString('id-ID')} dicatat ke pembukuan`);
    } else {
      toast.success('Log maintenance diperbarui');
    }

    setIsModalOpen(false);
  };

  const getStatusBadge = (log) => {
    const s = log.maintenanceStatus || 'pending';
    const map = {
      pending: { label: 'Pending', color: '#FF9800', icon: <Clock size={12} /> },
      in_progress: { label: 'Proses', color: '#00f0ff', icon: <Wrench size={12} /> },
      done: { label: 'Selesai', color: '#4CAF50', icon: <CheckCircle size={12} /> },
    };
    return map[s] || map.pending;
  };

  return (
    <motion.div className="app-page maintenance-page" {...pagePreset}>
      <div className="app-page-header">
        <div>
          <h2 className="app-page-title">Log Maintenance</h2>
          <p className="app-page-subtitle">Pantau jadwal perawatan alat dan studio</p>
        </div>
        <div className="app-page-actions">
          <button className="btn-primary" onClick={handleOpenNew} aria-label="Tambah log maintenance baru">
            <Plus size={18} />
            <span>Tambah Log</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="app-stat-grid maint-stats-bar">
        <div className="app-stat-card maint-stat-card total">
          <div className="stat-icon"><FileText size={22} /></div>
          <div className="stat-data">
            <span className="stat-label">Total Log</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="app-stat-card maint-stat-card pending">
          <div className="stat-icon"><AlertCircle size={22} /></div>
          <div className="stat-data">
            <span className="stat-label">Pending / Proses</span>
            <span className="stat-value">{stats.pending}</span>
          </div>
        </div>
        <div className="app-stat-card maint-stat-card done">
          <div className="stat-icon"><CheckCircle size={22} /></div>
          <div className="stat-data">
            <span className="stat-label">Selesai</span>
            <span className="stat-value">{stats.done}</span>
          </div>
        </div>
        <div className="app-stat-card maint-stat-card cost">
          <div className="stat-icon"><DollarSign size={22} /></div>
          <div className="stat-data">
            <span className="stat-label">Total Biaya</span>
            <span className="stat-value">{formatCurrency(stats.totalCost)}</span>
          </div>
        </div>
      </div>

      {/* Smart Usage Recommendations */}
      <div className="maint-smart-panel">
        <div className="maint-smart-head">
          <Wrench size={20} />
          <div>
            <h3>Prioritas Servis Cerdas</h3>
            <p>{usageInsights.studioHours30d} jam pemakaian studio dalam 30 hari terakhir.</p>
          </div>
        </div>
        <div className="maint-smart-list">
          {usageInsights.recommendations.slice(0, 3).map(({ item, label, reason, daysToService }) => (
            <div 
              key={item.id} 
              className={`maint-smart-item ${label.toLowerCase() === 'overhaul' ? 'kritis' : label.toLowerCase() === 'cek rutin' ? 'tinggi' : ''}`}
            >
              <strong style={{display: 'block', fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '4px'}}>{item.name}</strong>
              <span style={{display: 'block', fontSize: '0.72rem', color: label === 'Overhaul' ? 'var(--accent-pink)' : label === 'Cek Rutin' ? '#FFC107' : 'var(--text-secondary)', marginBottom: '4px'}}>{label} - {reason}</span>
              <small style={{display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)'}}>{daysToService === null ? 'Belum ada jadwal servis' : daysToService < 0 ? `${Math.abs(daysToService)} hari terlambat` : `${daysToService} hari lagi`}</small>
            </div>
          ))}
          {usageInsights.recommendations.length === 0 && (
            <div className="maint-smart-empty" style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Belum ada inventaris yang bisa diprioritaskan.</div>
          )}
        </div>
      </div>

      {/* Log Table */}
      <div className="app-panel maint-content">
        <div className="app-table-toolbar">
          <div className="app-table-toolbar-left">
            <div>
              <span className="app-table-toolbar-title">Riwayat Maintenance</span>
              <span className="app-table-toolbar-subtitle">Klik baris untuk update status & biaya</span>
            </div>
          </div>
          <div className="app-table-toolbar-right">
            <div className="app-search app-search-md">
              <Search className="app-search-icon" />
              <input 
                type="text" 
                className="app-search-input"
                placeholder="Cari log, alat, status..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="button" className="app-search-clear" onClick={() => setSearchQuery('')} aria-label="Bersihkan pencarian" title="Bersihkan pencarian">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {filteredMaintenanceLogs.length === 0 ? (
          <div className="maint-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
            {animationData ? (
              <div style={{ width: 140, height: 140, marginBottom: '16px' }}>
                <Lottie animationData={animationData} loop={true} />
              </div>
            ) : (
              <Wrench size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
            )}
            <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Belum ada log maintenance.</p>
            <small style={{ color: 'var(--text-muted)', maxWidth: '380px' }}>Tambahkan jadwal maintenance melalui tombol di atas atau melalui halaman <strong>Calendar</strong>.</small>
          </div>
        ) : (
          <>
            {/* Desktop Table view */}
            <div className="app-table-wrapper hide-on-mobile">
              <table className="app-table maint-table">
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                  {table.getRowModel().rows.map(row => (
                    <tr 
                      key={row.id} 
                      className="maint-row" 
                      onClick={() => handleOpenDetail(row.original)}
                    >
                      {row.getVisibleCells().map(cell => {
                        const isActionCol = cell.column.id === 'actions';
                        return (
                          <td 
                            key={cell.id} 
                            className={isActionCol ? 'action-col' : ''}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List view */}
            <div className="mobile-maint-list show-on-mobile">
              {filteredMaintenanceLogs.map(log => {
                const statusInfo = getStatusBadge(log);
                return (
                  <div 
                    key={log.id} 
                    className="mobile-maint-card" 
                    onClick={() => handleOpenDetail(log)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenDetail(log); } }}
                    aria-label={`Detail log ${log.band || 'Maintenance'} tanggal ${format(new Date(log.date), 'dd MMM yyyy')}`}
                  >
                    <div className="mobile-maint-card-header">
                      <span className="maint-card-date">{format(new Date(log.date), 'dd MMM yyyy')}</span>
                      <span className="maint-status-badge" style={{ background: `${statusInfo.color}22`, color: statusInfo.color, borderColor: `${statusInfo.color}44` }}>
                        {statusInfo.icon}
                        <span style={{ marginLeft: 4 }}>{statusInfo.label}</span>
                      </span>
                    </div>
                    <h4 className="maint-card-title">{log.band || 'Maintenance'}</h4>
                    <div className="mobile-maint-card-details">
                      <span>{String(log.hour).padStart(2, '0')}:00 ({log.duration} jam)</span>
                      <strong className={log.maintenanceCost > 0 ? 'has-cost' : ''}>
                        {log.maintenanceCost > 0 ? formatCurrency(log.maintenanceCost) : '—'}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Log Maintenance">
        <form onSubmit={handleSaveNew} className="maint-form">
          <div className="form-group">
            <label className="form-label-with-icon">
              <Wrench size={13} />
              <span>Pilih Alat / Area <span className="required">*</span></span>
            </label>
            <select
              className="form-input"
              value={newLogData.item}
              onChange={e => setNewLogData(p => ({ ...p, item: e.target.value }))}
              required
            >
              <optgroup label="Area Umum Studio">
                <option value="Studio 1 (Umum)">Studio 1 (Umum)</option>
                <option value="Studio 2 (Umum)">Studio 2 (Umum)</option>
                <option value="Seluruh Studio (Umum)">Seluruh Studio (Umum)</option>
                <option value="Lainnya">Lainnya / Area Publik</option>
              </optgroup>
              <optgroup label="Database Inventaris">
                {inventory.map(item => (
                  <option key={item.id} value={`${item.name} (${item.brand || 'No Brand'})`}>
                    {item.name} {item.brand ? `(${item.brand})` : ''} - Kategori: {item.category}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label-with-icon">
              <span>Tanggal Pelaksanaan <span className="required">*</span></span>
            </label>
            <input
              type="date"
              className="form-input"
              value={newLogData.date}
              onChange={e => setNewLogData(p => ({ ...p, date: e.target.value }))}
              required
            />
          </div>

          <div className="form-row form-row-2" style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label-with-icon">
                <Clock size={13} />
                <span>Jam Mulai <span className="required">*</span></span>
              </label>
              <select
                className="form-input"
                value={newLogData.hour}
                onChange={e => setNewLogData(p => ({ ...p, hour: Number(e.target.value) }))}
                required
              >
                {Array.from({ length: 14 }, (_, i) => i + 10).map((hour) => (
                  <option key={hour} value={hour}>{String(hour).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label-with-icon">
                <span>Durasi (Jam) <span className="required">*</span></span>
              </label>
              <input
                type="number"
                className="form-input"
                value={newLogData.duration}
                onChange={e => setNewLogData(p => ({ ...p, duration: Number(e.target.value) }))}
                min="1"
                max="13"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label-with-icon">
              <Clock size={13} />
              <span>Status Pengerjaan</span>
            </label>
            <div className="maint-status-toggle" role="radiogroup" aria-label="Status Pengerjaan Baru">
              {[
                { value: 'pending', label: 'Pending', icon: <Clock size={14} /> },
                { value: 'in_progress', label: 'Proses', icon: <Wrench size={14} /> },
                { value: 'done', label: 'Selesai', icon: <CheckCircle size={14} /> },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`maint-toggle-btn btn-${opt.value} ${newLogData.status === opt.value ? 'active' : ''}`}
                  onClick={() => setNewLogData(p => ({ ...p, status: opt.value }))}
                  role="radio"
                  aria-checked={newLogData.status === opt.value}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label-with-icon">
              <FileText size={13} />
              <span>Catatan / Deskripsi Masalah</span>
            </label>
            <textarea
              className="form-input"
              value={newLogData.description}
              onChange={e => setNewLogData(p => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="Detail perbaikan atau jenis kerusakan..."
            />
          </div>

          <div className="form-group">
            <label className="form-label-with-icon">
              <DollarSign size={13} />
              <span>Estimasi / Biaya Perbaikan (Rp)</span>
            </label>
            <div className="maint-input-wrapper">
              <span className="maint-input-prefix">Rp</span>
              <input
                type="number"
                className="form-input maint-cost-input"
                value={newLogData.cost}
                onChange={e => setNewLogData(p => ({ ...p, cost: e.target.value }))}
                placeholder="0"
                min="0"
              />
            </div>
            {newLogData.status === 'done' && Number(newLogData.cost) > 0 && (
              <small className="form-hint">✓ Biaya akan otomatis dicatat sebagai pengeluaran di Pembukuan</small>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Batal</button>
            <button type="submit" className="btn-primary">Tambah Log</button>
          </div>
        </form>
      </Modal>

      {/* Detail / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Detail Log Maintenance">
        {selectedLog && (
          <form onSubmit={handleSaveCost} className="maint-form">
            <div className="maint-modal-info">
              <div className="maint-info-header">
                <div className="maint-info-icon">
                  <Wrench size={18} />
                </div>
                <div className="maint-info-title-container">
                  <span className="maint-info-tag">Nama Alat / Area</span>
                  <h4 className="maint-info-title">{selectedLog.band || 'Pemeliharaan Studio'}</h4>
                </div>
              </div>
              
              <div className="maint-info-grid">
                <div className="maint-info-grid-item">
                  <span className="maint-info-label">Tanggal Pelaksanaan</span>
                  <span className="maint-info-val">
                    {format(new Date(selectedLog.date), 'dd MMMM yyyy')}
                  </span>
                </div>
                <div className="maint-info-grid-item">
                  <span className="maint-info-label">Waktu & Durasi</span>
                  <span className="maint-info-val">
                    {String(selectedLog.hour).padStart(2, '0')}:00 – {String(Number(selectedLog.hour) + Number(selectedLog.duration)).padStart(2, '0')}:00 ({selectedLog.duration} jam)
                  </span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label-with-icon">
                <Clock size={13} />
                <span>Status Pengerjaan</span>
              </label>
              <div className="maint-status-toggle" role="radiogroup" aria-label="Status Pengerjaan">
                {[
                  { value: 'pending', label: 'Pending', icon: <Clock size={14} /> },
                  { value: 'in_progress', label: 'Proses', icon: <Wrench size={14} /> },
                  { value: 'done', label: 'Selesai', icon: <CheckCircle size={14} /> },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`maint-toggle-btn btn-${opt.value} ${formData.status === opt.value ? 'active' : ''}`}
                    onClick={() => setFormData(p => ({ ...p, status: opt.value }))}
                    role="radio"
                    aria-checked={formData.status === opt.value}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label-with-icon">
                <FileText size={13} />
                <span>Catatan / Deskripsi Kerusakan</span>
              </label>
              <textarea
                className="form-input"
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder="Detail kerusakan atau pekerjaan yang dilakukan..."
              />
            </div>

            <div className="form-group">
              <label className="form-label-with-icon">
                <DollarSign size={13} />
                <span>Biaya Perbaikan</span>
              </label>
              <div className="maint-input-wrapper">
                <span className="maint-input-prefix">Rp</span>
                <input
                  type="number"
                  className="form-input maint-cost-input"
                  value={formData.cost}
                  onChange={e => setFormData(p => ({ ...p, cost: e.target.value }))}
                  placeholder="0"
                  min="0"
                />
              </div>
              {formData.status === 'done' && Number(formData.cost) > 0 && (
                <small className="form-hint">✓ Biaya akan otomatis dicatat sebagai pengeluaran di Pembukuan</small>
              )}
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Batal</button>
              <button type="submit" className="btn-primary">Simpan Update</button>
            </div>
          </form>
        )}
      </Modal>
    </motion.div>
  );
};

export default MaintenancePage;
