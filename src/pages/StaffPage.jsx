import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStaffStore } from '../store/useStaffStore';
import { useAuditLogStore } from '../store/useAuditLogStore';
import { PERMISSIONS, PERMISSION_LABELS, getDefaultPermissionsForRole } from '../lib/permissions';
import { UserPlus, Edit2, Trash2, Shield, User, Power, ClipboardList, Loader2, Clock, CheckCircle2, Key } from 'lucide-react';
import Modal from '../components/Modal';
import { toast } from 'sonner';
import { staggerContainer, staggerItem } from '../animations';
import './StaffPage.css';

const StaffPage = () => {
  const { staffMembers, updateStaff, deleteStaff, toggleStaffStatus, createStaffAccount, resetStaffPassword } = useStaffStore();
  const { logs } = useAuditLogStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [resetTargetStaff, setResetTargetStaff] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [editingStaff, setEditingStaff] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    role: 'staff',
    phone: '',
    password: '',
    permissions: getDefaultPermissionsForRole('staff'),
  });

  const handleOpenModal = (staff = null) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        name: staff.name,
        username: staff.username || '',
        role: staff.role,
        phone: staff.phone,
        password: '',
        permissions: staff.permissions || getDefaultPermissionsForRole(staff.role),
      });
    } else {
      setEditingStaff(null);
      setFormData({
        name: '',
        username: '',
        role: 'staff',
        phone: '',
        password: '',
        permissions: getDefaultPermissionsForRole('staff'),
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingStaff) {
      updateStaff(editingStaff.id, formData);
      toast.success('Data staff berhasil diperbarui');
      setIsModalOpen(false);
    } else {
      if (!formData.username || !formData.password || formData.password.length < 6) {
         toast.error('Username dan password (minimal 6 karakter) wajib diisi');
         return;
      }
      setLoading(true);
      try {
        await createStaffAccount(formData, '', formData.password, formData.username);
        toast.success('Staff baru berhasil ditambahkan');
        setIsModalOpen(false);
      } catch (error) {
        let msg = error.message;
        if (error.code === 'auth/email-already-in-use') msg = 'Username sudah digunakan.';
        if (error.code === 'auth/weak-password') msg = 'Password terlalu lemah (minimal 6 karakter).';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOpenResetPassword = (staff) => {
    setResetTargetStaff(staff);
    setNewPassword('');
    setIsPasswordModalOpen(true);
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    setLoading(true);
    try {
      await resetStaffPassword(resetTargetStaff, newPassword);
      toast.success('Password berhasil di-reset');
      setIsPasswordModalOpen(false);
    } catch (e) {
      toast.error('Gagal reset password: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Yakin ingin menghapus staff ini?')) {
      deleteStaff(id);
      toast.success('Staff berhasil dihapus');
    }
  };

  const handleToggleStatus = (id) => {
    toggleStaffStatus(id);
    toast.success('Status staff diperbarui');
  };

  const handleRoleChange = (role) => {
    setFormData((prev) => ({
      ...prev,
      role,
      permissions: getDefaultPermissionsForRole(role),
    }));
  };

  const handlePermissionToggle = (permission) => {
    setFormData((prev) => {
      const current = prev.permissions || [];
      return {
        ...prev,
        permissions: current.includes(permission)
          ? current.filter((item) => item !== permission)
          : [...current, permission],
      };
    });
  };

  return (
    <div className="app-page staff-page">
      <div className="app-page-header">
        <div>
          <h2 className="app-page-title">Manajemen Staff</h2>
          <p className="app-page-subtitle">Kelola akses dan data anggota tim Anda</p>
        </div>
        <div className="app-page-actions">
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            <UserPlus size={16} />
            <span>Tambah Staff</span>
          </button>
        </div>
      </div>

      <motion.div 
        className="app-stat-grid"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {staffMembers.map(staff => (
            <motion.div 
              layout
              variants={staggerItem}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              key={staff.id} 
              className={`app-panel staff-card ${staff.status === 'inactive' ? 'inactive' : ''}`}
            >
              <div className="staff-card-header">
                <div className="staff-avatar">
                  {staff.role === 'admin' ? <Shield size={24} className="avatar-icon-admin" /> : <User size={24} className="avatar-icon-staff" />}
                </div>
                <div className="staff-actions">
                  <button className="icon-btn" onClick={() => handleOpenResetPassword(staff)} title="Ganti Password" style={{ color: 'var(--accent-pink)' }}>
                    <Key size={16} />
                  </button>
                  <button className="icon-btn edit" onClick={() => handleOpenModal(staff)} title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button className="icon-btn delete" onClick={() => handleDelete(staff.id)} title="Hapus">
                    <Trash2 size={16} />
                  </button>
                  <button className="icon-btn" onClick={() => handleToggleStatus(staff.id)} title={staff.status === 'active' ? "Nonaktifkan" : "Aktifkan"}>
                    <Power size={16} color={staff.status === 'active' ? '#4CAF50' : '#FF5252'} />
                  </button>
                </div>
              </div>
              
              <div className="staff-info">
                <h3>{staff.name}</h3>
                <span className={`staff-role-badge ${staff.role}`}>
                  {staff.role === 'admin' ? 'Administrator' : 'Staff'}
                </span>
                {staff.username && <p className="staff-phone" style={{marginTop: 4}}>👤 @{staff.username}</p>}
                <p className="staff-phone">📞 {staff.phone || '-'}</p>
                <div className="staff-permission-chips">
                  {(staff.permissions || getDefaultPermissionsForRole(staff.role)).slice(0, 4).map((permission) => (
                    <span key={permission}>{PERMISSION_LABELS[permission] || permission}</span>
                  ))}
                  {(staff.permissions || getDefaultPermissionsForRole(staff.role)).length > 4 && (
                    <span className="chip-more">+{(staff.permissions || getDefaultPermissionsForRole(staff.role)).length - 4}</span>
                  )}
                </div>
              </div>
              
              <div className="staff-status-bar">
                <span className="status-indicator" style={{ background: staff.status === 'active' ? 'var(--accent-cyan)' : '#FF5252' }} />
                <span>{staff.status === 'active' ? 'Akun Aktif' : 'Akun Nonaktif'}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingStaff ? "Edit Staff" : "Tambah Staff"}>
        <form className="staff-form" onSubmit={handleSubmit}>
          <div className="bf-row">
            <div className="form-group">
              <label className="bf-label">Nama Lengkap <span className="bf-required">*</span></label>
              <input
                type="text"
                className="bf-input"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                autoFocus
                placeholder="Misal: Budi Santoso"
              />
            </div>
            
            <div className="form-group">
              <label className="bf-label">No. Telepon / WA</label>
              <input
                type="tel"
                className="bf-input"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08..."
              />
            </div>
          </div>

          {!editingStaff && (
            <div className="bf-row">
              <div className="form-group">
                <label className="bf-label">Username Login <span className="bf-required">*</span></label>
                <input
                  type="text"
                  className="bf-input"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  required
                  placeholder="Budi123"
                />
              </div>
              <div className="form-group">
                <label className="bf-label">Password <span className="bf-required">*</span></label>
                <input
                  type="password"
                  className="bf-input"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  minLength="6"
                  required
                  placeholder="Min. 6 karakter"
                />
              </div>
            </div>
          )}
          
          <div className="form-group">
            <label className="bf-label">Role Akses <span className="bf-required">*</span></label>
            <select
              className="bf-input"
              value={formData.role}
              onChange={e => handleRoleChange(e.target.value)}
              required
            >
              <option value="staff">Staff (Akses Terbatas)</option>
              <option value="admin">Administrator (Akses Penuh)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="bf-label">Izin Akses Menu (Hanya Staff)</label>
            <div className="permission-grid">
              {Object.values(PERMISSIONS).map((permission) => (
                <label key={permission} className={`permission-card ${formData.permissions?.includes(permission) ? 'selected' : ''} ${formData.role === 'admin' ? 'disabled' : ''}`}>
                  <input
                    type="checkbox"
                    checked={formData.role === 'admin' || (formData.permissions?.includes(permission) || false)}
                    onChange={() => handlePermissionToggle(permission)}
                    disabled={formData.role === 'admin'}
                  />
                  <span className="permission-icon">
                    {formData.role === 'admin' || formData.permissions?.includes(permission) ? <CheckCircle2 size={16} /> : <div className="empty-circle" />}
                  </span>
                  <span className="permission-label">{PERMISSION_LABELS[permission] || permission}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bf-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} disabled={loading}>Batal</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 size={16} className="spinner" /> : null}
              {loading ? ' Memproses...' : editingStaff ? 'Simpan Perubahan' : 'Tambahkan Staff'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title={`Ganti Password: ${resetTargetStaff?.name}`}>
        <form className="staff-form" onSubmit={handleResetPasswordSubmit}>
          <div className="form-group">
            <label className="bf-label">Password Baru <span className="bf-required">*</span></label>
            <input
              type="password"
              className="bf-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength="6"
              required
              placeholder="Minimal 6 karakter"
              autoFocus
            />
          </div>
          <div className="bf-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsPasswordModalOpen(false)} disabled={loading}>
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ background: 'var(--accent-pink)' }}>
              {loading ? <Loader2 className="spinner" size={16} /> : 'Simpan Password Baru'}
            </button>
          </div>
        </form>
      </Modal>

      <div className="app-panel audit-log-panel">
        <div className="audit-log-header">
          <ClipboardList size={22} className="audit-icon" />
          <div>
            <h3>Audit Log & Jejak Aktivitas</h3>
            <p>Memantau aktivitas perubahan dari seluruh akun dalam sistem.</p>
          </div>
        </div>
        <div className="audit-log-timeline">
          {logs.slice(0, 10).map((log) => (
            <div key={log.id} className="timeline-item">
              <div className="timeline-marker">
                <Clock size={12} />
              </div>
              <div className="app-card timeline-content">
                <div className="timeline-meta">
                  <span className="timeline-actor">{log.actorName}</span>
                  <span className="timeline-time">{new Date(log.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="timeline-action">
                  <strong>{log.action}</strong>: {log.summary}
                </div>
              </div>
            </div>
          ))}
          {logs.length === 0 && <div className="audit-log-empty">Belum ada jejak aktivitas tercatat.</div>}
        </div>
      </div>
    </div>
  );
};

export default StaffPage;
