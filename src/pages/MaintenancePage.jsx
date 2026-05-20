import { useState, useMemo } from 'react';
import { useBookingStore } from '../store/useBookingStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { format } from 'date-fns';
import { Wrench, Plus, AlertCircle, CheckCircle, Clock, DollarSign, Trash2, FileText } from 'lucide-react';
import Modal from '../components/Modal';
import { toast } from 'sonner';
import './MaintenancePage.css';

const MaintenancePage = () => {
  const { bookings, deleteBooking } = useBookingStore();
  const { addTransaction } = useFinanceStore();
  const { rooms } = useSettingsStore();

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

  const formatCurrency = (num) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  const getRoomName = (roomId) => {
    const room = rooms?.find(r => r.id === roomId);
    return room?.name || roomId || 'Studio';
  };

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
    <div className="maintenance-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">Log Maintenance</h2>
          <p className="page-subtitle">Pantau jadwal perawatan alat dan ruangan studio</p>
        </div>
      </div>

      {/* Stats */}
      <div className="maint-stats-bar">
        <div className="maint-stat-card total">
          <div className="stat-icon"><FileText size={22} /></div>
          <div className="stat-data">
            <span className="stat-label">Total Log</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="maint-stat-card pending">
          <div className="stat-icon"><AlertCircle size={22} /></div>
          <div className="stat-data">
            <span className="stat-label">Pending / Proses</span>
            <span className="stat-value">{stats.pending}</span>
          </div>
        </div>
        <div className="maint-stat-card done">
          <div className="stat-icon"><CheckCircle size={22} /></div>
          <div className="stat-data">
            <span className="stat-label">Selesai</span>
            <span className="stat-value">{stats.done}</span>
          </div>
        </div>
        <div className="maint-stat-card cost">
          <div className="stat-icon"><DollarSign size={22} /></div>
          <div className="stat-data">
            <span className="stat-label">Total Biaya</span>
            <span className="stat-value">{formatCurrency(stats.totalCost)}</span>
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="maint-content glass-panel">
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
          <div className="table-responsive">
            <table className="maint-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Judul</th>
                  <th>Ruangan</th>
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
                      <td>{getRoomName(log.roomId)}</td>
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Update Log Maintenance">
        {selectedLog && (
          <form onSubmit={handleSaveCost} className="maint-form">
            <div className="maint-modal-info">
              <div className="maint-modal-row">
                <span>Jadwal</span>
                <strong>{format(new Date(selectedLog.date), 'dd MMMM yyyy')}, {String(selectedLog.hour).padStart(2, '0')}:00 – {String(Number(selectedLog.hour) + Number(selectedLog.duration)).padStart(2, '0')}:00</strong>
              </div>
              <div className="maint-modal-row">
                <span>Ruangan</span>
                <strong>{getRoomName(selectedLog.roomId)}</strong>
              </div>
            </div>

            <div className="form-group">
              <label>Status Pengerjaan</label>
              <div className="maint-status-toggle">
                {[
                  { value: 'pending', label: '⏳ Pending' },
                  { value: 'in_progress', label: '🔧 Proses' },
                  { value: 'done', label: '✅ Selesai' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`maint-toggle-btn ${formData.status === opt.value ? 'active' : ''}`}
                    onClick={() => setFormData(p => ({ ...p, status: opt.value }))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Catatan / Deskripsi Kerusakan</label>
              <textarea
                className="form-input"
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder="Detail kerusakan atau pekerjaan yang dilakukan..."
              />
            </div>

            <div className="form-group">
              <label>Biaya Perbaikan (Rp)</label>
              <input
                type="number"
                className="form-input"
                value={formData.cost}
                onChange={e => setFormData(p => ({ ...p, cost: e.target.value }))}
                placeholder="0"
                min="0"
              />
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
    </div>
  );
};

export default MaintenancePage;
