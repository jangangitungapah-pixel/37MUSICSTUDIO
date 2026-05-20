import React, { useState } from 'react';
import { useStaffStore } from '../store/useStaffStore';
import { UserPlus, Edit2, Trash2, Shield, User, Power, MoreVertical } from 'lucide-react';
import Modal from '../components/Modal';
import { toast } from 'sonner';
import './StaffPage.css';

const StaffPage = () => {
  const { staffMembers, addStaff, updateStaff, deleteStaff, toggleStaffStatus } = useStaffStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: 'staff',
    phone: '',
  });

  const handleOpenModal = (staff = null) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        name: staff.name,
        role: staff.role,
        phone: staff.phone,
      });
    } else {
      setEditingStaff(null);
      setFormData({
        name: '',
        role: 'staff',
        phone: '',
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
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              required
            >
              <option value="staff">Staff (Akses Terbatas)</option>
              <option value="admin">Administrator (Akses Penuh)</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Batal</button>
            <button type="submit" className="btn-primary">
              {editingStaff ? 'Simpan Perubahan' : 'Tambahkan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffPage;
