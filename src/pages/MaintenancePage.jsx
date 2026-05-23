import { useState, useMemo } from 'react';
import { useBookingStore } from '../store/useBookingStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { format } from 'date-fns';
import { Wrench, AlertCircle, CheckCircle, Clock, DollarSign, Trash2, FileText } from 'lucide-react';
import Modal from '../components/Modal';
import { toast } from 'sonner';
import { getMaintenanceUsageInsights } from '../lib/smartInsights';
import { motion } from 'framer-motion';
import { pagePreset } from '../animations';
import './MaintenancePage.css';

const MaintenancePage = () => {
  const { bookings, deleteBooking } = useBookingStore();
  const { addTransaction } = useFinanceStore();
  const { inventory } = useInventoryStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    cost: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'pending',
  });

  // Filter only maintenance-type bookings
  const maintenanceLogs = useMemo(() =>
    bookings
      .filter(b => b.type === 'maintenance' || b.status === 'maintenance')
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [bookings]
  );

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

  const handleSaveCost = async (e) => {
    e.preventDefault();
    if (!selectedLog) return;

    const cost = Number(formData.cost);
    const { updateBooking } = useBookingStore.getState();

    // Update booking with maintenance cost info
    if (updateBooking) {
      await updateBooking(selectedLog.id, {
        maintenanceCost: cost,
        maintenanceStatus: formData.status,
        note: formData.description,
      });
    }

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
      </div>

      {/* Stats */}
      <div className="app-stat-grid maint-stats-bar">
        <div className="app-stat-card total">
          <div className="stat-icon" style={{background: 'rgba(0, 240, 255, 0.1)', color: 'var(--accent-cyan)'}}><FileText size={22} /></div>
          <div className="stat-data">
            <span className="stat-label">Total Log</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="app-stat-card pending">
          <div className="stat-icon" style={{background: 'rgba(255, 193, 7, 0.1)', color: '#FFC107'}}><AlertCircle size={22} /></div>
          <div className="stat-data">
            <span className="stat-label">Pending / Proses</span>
            <span className="stat-value">{stats.pending}</span>
          </div>
        </div>
        <div className="app-stat-card done">
          <div className="stat-icon" style={{background: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50'}}><CheckCircle size={22} /></div>
          <div className="stat-data">
            <span className="stat-label">Selesai</span>
            <span className="stat-value">{stats.done}</span>
          </div>
        </div>
        <div className="app-stat-card cost">
          <div className="stat-icon" style={{background: 'rgba(255, 42, 95, 0.1)', color: 'var(--accent-pink)'}}><DollarSign size={22} /></div>
          <div className="stat-data">
            <span className="stat-label">Total Biaya</span>
            <span className="stat-value">{formatCurrency(stats.totalCost)}</span>
          </div>
        </div>
      </div>

      {/* Smart Usage Recommendations */}
      <div className="app-smart-panel">
        <div className="smart-head">
          <Wrench size={20} />
          <div>
            <h3>Prioritas Servis Cerdas</h3>
            <p>{usageInsights.studioHours30d} jam pemakaian studio dalam 30 hari terakhir.</p>
          </div>
        </div>
        <div className="smart-list" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px'}}>
          {usageInsights.recommendations.slice(0, 3).map(({ item, label, reason, daysToService }) => (
            <div key={item.id} className={`smart-item ${label.toLowerCase()}`} style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 16px', position: 'relative'}}>
              <strong style={{display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px'}}>{item.name}</strong>
              <span style={{display: 'block', fontSize: '0.75rem', color: label === 'Overhaul' ? 'var(--accent-pink)' : label === 'Cek Rutin' ? '#FFC107' : 'var(--text-secondary)', marginBottom: '4px'}}>{label} - {reason}</span>
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
        <div className="maint-table-header">
          <span className="maint-table-title">Riwayat Maintenance</span>
          <span className="maint-table-hint">Klik baris untuk update status & biaya</span>
        </div>

        {maintenanceLogs.length === 0 ? (
          <div className="maint-empty">
            <Wrench size={48} color="var(--text-muted)" />
            <p>Belum ada log maintenance.</p>
            <small>Tambahkan jadwal maintenance melalui halaman <strong>Calendar</strong> → Blokir Jadwal.</small>
          </div>
        ) : (
          <div className="app-table-wrapper">
            <table className="app-table maint-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Judul</th>
                  <th>Jam</th>
                  <th>Durasi</th>
                  <th>Status</th>
                  <th>Biaya</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {maintenanceLogs.map(log => {
                  const statusInfo = getStatusBadge(log);
                  return (
                    <tr key={log.id} className="maint-row" onClick={() => handleOpenDetail(log)}>
                      <td>{format(new Date(log.date), 'dd MMM yyyy')}</td>
                      <td className="maint-title-cell">
                        <Wrench size={14} color="var(--accent-pink)" style={{ marginRight: 6 }} />
                        {log.band || 'Maintenance'}
                      </td>
                      <td>{String(log.hour).padStart(2, '0')}:00</td>
                      <td>{log.duration} jam</td>
                      <td>
                        <span className="maint-status-badge" style={{ background: `${statusInfo.color}22`, color: statusInfo.color, borderColor: `${statusInfo.color}44` }}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className={log.maintenanceCost > 0 ? 'maint-cost-cell has-cost' : 'maint-cost-cell'}>
                        {log.maintenanceCost > 0 ? formatCurrency(log.maintenanceCost) : '—'}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <button
                          className="icon-btn delete"
                          onClick={() => {
                            if (window.confirm('Hapus log ini?')) {
                              deleteBooking(log.id);
                              toast.success('Log dihapus');
                            }
                          }}
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
              <div className="maint-status-toggle">
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
