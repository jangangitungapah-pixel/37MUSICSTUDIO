import { useState } from 'react';
import { useStaffStore } from '../store/useStaffStore';
import { useAuditLogStore } from '../store/useAuditLogStore';
import { PERMISSIONS, PERMISSION_LABELS, getDefaultPermissionsForRole } from '../lib/permissions';
import { UserPlus, Edit2, Trash2, Shield, User, Power, ClipboardList } from 'lucide-react';
import Modal from '../components/Modal';
import { toast } from 'sonner';
import './StaffPage.css';

const StaffPage = () => {
  const { staffMembers, addStaff, updateStaff, deleteStaff, toggleStaffStatus } = useStaffStore();
  const { logs } = useAuditLogStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: 'staff',
    phone: '',
    permissions: getDefaultPermissionsForRole('staff'),
  });

  const handleOpenModal = (staff = null) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        name: staff.name,
        role: staff.role,
        phone: staff.phone,
        permissions: staff.permissions || getDefaultPermissionsForRole(staff.role),
      });
    } else {
      setEditingStaff(null);
      setFormData({
        name: '',
        role: 'staff',
        phone: '',
        permissions: getDefaultPermissionsForRole('staff'),
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingStaff) {
      updateStaff(editingStaff.id, formData);
      toast.success('Data staff berhasil diperbarui');
    } else {
      addStaff(formData);
      toast.success('Staff baru berhasil ditambahkan');
    }
    setIsModalOpen(false);
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
    <div className="staff-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">Manajemen Staff</h2>
          <p className="page-subtitle">Kelola akses dan data anggota tim Anda</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            <UserPlus size={16} />
            <span>Tambah Staff</span>
          </button>
        </div>
      </div>

      <div className="staff-grid">
        {staffMembers.map(staff => (
          <div key={staff.id} className={`staff-card glass-panel ${staff.status === 'inactive' ? 'inactive' : ''}`}>
            <div className="staff-card-header">
              <div className="staff-avatar">
                {staff.role === 'admin' ? <Shield size={24} color="var(--accent-pink)" /> : <User size={24} color="var(--accent-cyan)" />}
              </div>
              <div className="staff-actions">
                <button className="icon-btn edit-btn" onClick={() => handleOpenModal(staff)} title="Edit">
                  <Edit2 size={16} />
                </button>
                <button className="icon-btn delete-btn" onClick={() => handleDelete(staff.id)} title="Hapus">
                  <Trash2 size={16} />
                </button>
                <button className="icon-btn toggle-btn" onClick={() => handleToggleStatus(staff.id)} title="Toggle Status">
                  <Power size={16} color={staff.status === 'active' ? '#4CAF50' : '#FF5252'} />
                </button>
              </div>
            </div>
            
            <div className="staff-info">
              <h3>{staff.name}</h3>
              <span className={`staff-role-badge ${staff.role}`}>
                {staff.role === 'admin' ? 'Administrator' : 'Staff'}
              </span>
              <p className="staff-phone">📞 {staff.phone || '-'}</p>
              <div className="staff-permission-chips">
                {(staff.permissions || getDefaultPermissionsForRole(staff.role)).slice(0, 4).map((permission) => (
                  <span key={permission}>{PERMISSION_LABELS[permission] || permission}</span>
                ))}
                {(staff.permissions || getDefaultPermissionsForRole(staff.role)).length > 4 && (
                  <span>+{(staff.permissions || getDefaultPermissionsForRole(staff.role)).length - 4}</span>
                )}
              </div>
            </div>
            
            <div className="staff-status-bar">
              <span className="status-indicator" style={{ background: staff.status === 'active' ? '#4CAF50' : '#FF5252' }} />
              <span>{staff.status === 'active' ? 'Aktif' : 'Nonaktif'}</span>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingStaff ? "Edit Staff" : "Tambah Staff"}>
        <form className="staff-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nama Lengkap <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label>No. Telepon / WhatsApp</label>
            <input
              type="tel"
              className="form-input"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <label>Role Akses <span className="required">*</span></label>
            <select
              className="form-input"
              value={formData.role}
              onChange={e => handleRoleChange(e.target.value)}
              required
            >
              <option value="staff">Staff (Akses Terbatas)</option>
              <option value="admin">Administrator (Akses Penuh)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Izin Menu</label>
            <div className="permission-grid">
              {Object.values(PERMISSIONS).map((permission) => (
                <label key={permission} className={`permission-card ${formData.permissions?.includes(permission) ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={formData.permissions?.includes(permission) || false}
                    onChange={() => handlePermissionToggle(permission)}
                    disabled={formData.role === 'admin'}
                  />
                  <span>{PERMISSION_LABELS[permission] || permission}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Batal</button>
            <button type="submit" className="btn-primary">
              {editingStaff ? 'Simpan Perubahan' : 'Tambahkan'}
            </button>
          </div>
        </form>
      </Modal>

      <div className="audit-log-panel glass-panel">
        <div className="audit-log-header">
          <ClipboardList size={18} />
          <div>
            <h3>Audit Log Terbaru</h3>
            <p>Jejak perubahan booking, pelanggan, inventaris, finance, dan staff.</p>
          </div>
        </div>
        <div className="audit-log-list">
          {logs.slice(0, 8).map((log) => (
            <div key={log.id} className="audit-log-item">
              <div>
                <strong>{log.summary}</strong>
                <span>{log.actorName} &bull; {log.action}</span>
              </div>
              <small>{new Date(log.createdAt).toLocaleString('id-ID')}</small>
            </div>
          ))}
          {logs.length === 0 && <div className="audit-log-empty">Belum ada audit log.</div>}
        </div>
      </div>
    </div>
  );
};

export default StaffPage;
