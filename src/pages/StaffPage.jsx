import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStaffStore } from '../store/useStaffStore';
import { useAuditLogStore } from '../store/useAuditLogStore';
import { PERMISSIONS, PERMISSION_LABELS, getDefaultPermissionsForRole } from '../lib/permissions';
import { UserPlus, Edit2, Trash2, Shield, User, Power, ClipboardList, Loader2, Clock, CheckCircle2, Key, Search, X } from 'lucide-react';
import Modal from '../components/Modal';
import { toast } from 'sonner';
import { staggerContainer, staggerItem } from '../animations';
import confetti from 'canvas-confetti';
import Fuse from 'fuse.js';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import useSound from 'use-sound';
import { CLICK_SOUND } from '../lib/sounds';
import './StaffPage.css';

const staffSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  username: z.string()
    .min(3, 'Username minimal 3 karakter')
    .regex(/^[a-z0-9]+$/, 'Username harus berupa huruf kecil & angka saja (tanpa spasi)'),
  role: z.enum(['staff', 'admin']),
  phone: z.string()
    .min(10, 'Nomor HP minimal 10 digit')
    .max(15, 'Nomor HP maksimal 15 digit')
    .regex(/^[0-9]+$/, 'Nomor HP harus berupa angka').or(z.literal('')),
  password: z.string().min(6, 'Password minimal 6 karakter').or(z.literal('')),
  permissions: z.array(z.string()).optional()
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password minimal 6 karakter')
});

const validateStaffWithZod = (fieldName) => (value) => {
  const fieldSchema = staffSchema.shape[fieldName];
  if (!fieldSchema) return true;
  const result = fieldSchema.safeParse(value);
  return result.success ? true : result.error.errors[0].message;
};

import { useThemeStore } from '../store/useThemeStore';

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const StaffPage = () => {
  const { soundEnabled } = useThemeStore();
  const { staffMembers, updateStaff, deleteStaff, toggleStaffStatus, createStaffAccount, resetStaffPassword } = useStaffStore();
  const { logs } = useAuditLogStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [playClickRaw] = useSound(CLICK_SOUND, { volume: 0.25 });
  const playClick = () => { if (soundEnabled) playClickRaw(); };

  const filteredStaff = useMemo(() => {
    let result = staffMembers;
    if (searchQuery.trim()) {
      const fuse = new Fuse(result, {
        keys: ['name', 'username', 'role'],
        threshold: 0.35,
        ignoreLocation: true
      });
      result = fuse.search(searchQuery).map(r => r.item);
    }
    return result;
  }, [staffMembers, searchQuery]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [resetTargetStaff, setResetTargetStaff] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit: handleFormSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      username: '',
      role: 'staff',
      phone: '',
      password: '',
      permissions: getDefaultPermissionsForRole('staff')
    }
  });

  const watchedRole = watch('role');
  const watchedPermissions = watch('permissions') || [];

  const { register: registerReset, handleSubmit: handleFormResetSubmit, reset: resetResetForm, formState: { errors: errorsReset } } = useForm({
    defaultValues: {
      newPassword: ''
    }
  });

  const handleOpenModal = (staff = null) => {
    playClick();
    if (staff) {
      setEditingStaff(staff);
      reset({
        name: staff.name || '',
        username: staff.username || '',
        role: staff.role || 'staff',
        phone: staff.phone || '',
        password: '',
        permissions: staff.permissions || getDefaultPermissionsForRole(staff.role)
      });
    } else {
      setEditingStaff(null);
      reset({
        name: '',
        username: '',
        role: 'staff',
        phone: '',
        password: '',
        permissions: getDefaultPermissionsForRole('staff')
      });
    }
    setIsModalOpen(true);
  };

  const onSubmitStaff = async (data) => {
    if (editingStaff) {
      updateStaff(editingStaff.id, data);
      toast.success('Data staff berhasil diperbarui');
      setIsModalOpen(false);
    } else {
      if (!data.username || !data.password || data.password.length < 6) {
         toast.error('Username dan password (minimal 6 karakter) wajib diisi');
         return;
      }
      setLoading(true);
      try {
        await createStaffAccount(data, '', data.password, data.username);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00f0ff', '#ff2a5f', '#FFC107', '#4CAF50']
        });
        toast.success('Staff baru berhasil ditambahkan! 🎉');
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
    playClick();
    setResetTargetStaff(staff);
    resetResetForm({ newPassword: '' });
    setIsPasswordModalOpen(true);
  };

  const onSubmitResetPassword = async (data) => {
    setLoading(true);
    try {
      await resetStaffPassword(resetTargetStaff, data.newPassword);
      toast.success('Password berhasil di-reset');
      setIsPasswordModalOpen(false);
    } catch (e) {
      toast.error('Gagal reset password: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    playClick();
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
    setValue('role', role);
    setValue('permissions', getDefaultPermissionsForRole(role));
  };

  const handlePermissionToggle = (permission) => {
    const current = watchedPermissions;
    const next = current.includes(permission)
      ? current.filter((item) => item !== permission)
      : [...current, permission];
    setValue('permissions', next);
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

      <div className="app-table-toolbar" style={{ marginTop: '20px' }}>
        <div className="app-table-toolbar-left">
          <div>
            <span className="app-table-toolbar-title">Daftar Tim</span>
            <span className="app-table-toolbar-subtitle">{filteredStaff.length} anggota ditemukan</span>
          </div>
        </div>
        <div className="app-table-toolbar-right">
          <div className="app-search app-search-md">
            <Search className="app-search-icon" />
            <input 
              type="text" 
              className="app-search-input"
              placeholder="Cari staff, username, role..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Cari anggota tim"
            />
            {searchQuery && (
              <button type="button" className="app-search-clear" onClick={() => setSearchQuery('')} aria-label="Bersihkan pencarian" title="Bersihkan pencarian">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <motion.div 
        className="staff-grid"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {filteredStaff.map(staff => (
            <motion.div 
              layout
              variants={staggerItem}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              key={staff.id} 
              className={`app-panel staff-card ${staff.status === 'inactive' ? 'inactive' : ''}`}
            >
              <div className="staff-card-header">
                <div className="staff-avatar-container">
                  <div className={`staff-avatar ${staff.role}`}>
                    {getInitials(staff.name)}
                  </div>
                  <span className={`staff-status-ring ${staff.status}`} />
                </div>
                <div className="staff-actions">
                  <button 
                    className="icon-btn" 
                    onClick={() => handleOpenResetPassword(staff)} 
                    title="Ganti Password" 
                    style={{ color: 'var(--accent-pink)' }}
                    aria-label="Ganti password akun"
                  >
                    <Key size={14} />
                  </button>
                  <button 
                    className="icon-btn edit" 
                    onClick={() => handleOpenModal(staff)} 
                    title="Edit"
                    aria-label="Edit data staff"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    className="icon-btn delete" 
                    onClick={() => handleDelete(staff.id)} 
                    title="Hapus"
                    aria-label="Hapus staff dari tim"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button 
                    className="icon-btn" 
                    onClick={() => handleToggleStatus(staff.id)} 
                    title={staff.status === 'active' ? "Nonaktifkan" : "Aktifkan"}
                    aria-label={staff.status === 'active' ? "Nonaktifkan akun staff" : "Aktifkan akun staff"}
                  >
                    <Power size={14} color={staff.status === 'active' ? '#4CAF50' : '#FF5252'} />
                  </button>
                </div>
              </div>
              
              <div className="staff-info">
                <h3>{staff.name}</h3>
                <span className={`f-badge ${staff.role === 'admin' ? 'f-badge-danger' : 'f-badge-info'}`}>
                  {staff.role === 'admin' ? 'Administrator' : 'Staff'}
                </span>
                {staff.username && <p className="staff-phone" style={{marginTop: 6}}>👤 @{staff.username}</p>}
                <p className="staff-phone">📞 {staff.phone || '-'}</p>
                <div className="staff-permission-chips">
                  {(staff.permissions || getDefaultPermissionsForRole(staff.role)).slice(0, 4).map((permission) => (
                    <span key={permission} className="f-badge f-badge-neutral">{PERMISSION_LABELS[permission] || permission}</span>
                  ))}
                  {(staff.permissions || getDefaultPermissionsForRole(staff.role)).length > 4 && (
                    <span className="chip-more">+{(staff.permissions || getDefaultPermissionsForRole(staff.role)).length - 4}</span>
                  )}
                </div>
              </div>
              
              <div className="staff-status-bar">
                <span className={`f-badge ${staff.status === 'active' ? 'f-badge-success' : 'f-badge-neutral'}`} style={{fontSize: '11px', padding: '3px 8px'}}>
                  {staff.status === 'active' ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingStaff ? "Edit Staff" : "Tambah Staff"}>
        <form className="staff-form" onSubmit={handleFormSubmit(onSubmitStaff)}>
          <div className="bf-row">
            <div className="form-group">
              <label htmlFor="staff-name" className="bf-label">Nama Lengkap <span className="bf-required">*</span></label>
              <input
                id="staff-name"
                type="text"
                className="bf-input"
                autoFocus
                placeholder="Misal: Budi Santoso"
                {...register('name', { validate: validateStaffWithZod('name') })}
              />
              {errors.name && <span className="cf-error-message" style={{ color: 'var(--accent-pink)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.name.message}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="staff-phone" className="bf-label">No. Telepon / WA</label>
              <input
                id="staff-phone"
                type="tel"
                className="bf-input"
                placeholder="08..."
                {...register('phone', { validate: validateStaffWithZod('phone') })}
              />
              {errors.phone && <span className="cf-error-message" style={{ color: 'var(--accent-pink)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.phone.message}</span>}
            </div>
          </div>

          {!editingStaff && (
            <div className="bf-row">
              <div className="form-group">
                <label htmlFor="staff-username" className="bf-label">Username Login <span className="bf-required">*</span></label>
                <input
                  id="staff-username"
                  type="text"
                  className="bf-input"
                  placeholder="Budi123"
                  {...register('username', { validate: validateStaffWithZod('username') })}
                  onChange={(e) => setValue('username', e.target.value.toLowerCase().replace(/\s+/g, ''))}
                />
                {errors.username && <span className="cf-error-message" style={{ color: 'var(--accent-pink)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.username.message}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="staff-password" className="bf-label">Password <span className="bf-required">*</span></label>
                <input
                  id="staff-password"
                  type="password"
                  className="bf-input"
                  placeholder="Min. 6 karakter"
                  {...register('password', { validate: validateStaffWithZod('password') })}
                />
                {errors.password && <span className="cf-error-message" style={{ color: 'var(--accent-pink)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.password.message}</span>}
              </div>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="staff-role" className="bf-label">Role Akses <span className="bf-required">*</span></label>
            <select
              id="staff-role"
              className="bf-input"
              value={watchedRole}
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
                <label key={permission} className={`permission-card ${watchedPermissions.includes(permission) ? 'selected' : ''} ${watchedRole === 'admin' ? 'disabled' : ''}`}>
                  <input
                    type="checkbox"
                    checked={watchedRole === 'admin' || watchedPermissions.includes(permission)}
                    onChange={() => handlePermissionToggle(permission)}
                    disabled={watchedRole === 'admin'}
                  />
                  <span className="permission-icon">
                    {watchedRole === 'admin' || watchedPermissions.includes(permission) ? <CheckCircle2 size={16} /> : <div className="empty-circle" />}
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

      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title={`Ganti Password: ${resetTargetStaff?.name || ''}`}>
        <form className="staff-form" onSubmit={handleFormResetSubmit(onSubmitResetPassword)}>
          <div className="form-group">
            <label htmlFor="staff-new-password" className="bf-label">Password Baru <span className="bf-required">*</span></label>
            <input
              id="staff-new-password"
              type="password"
              className="bf-input"
              placeholder="Minimal 6 karakter"
              autoFocus
              {...registerReset('newPassword', {
                validate: (val) => {
                  const res = resetPasswordSchema.shape.newPassword.safeParse(val);
                  return res.success ? true : res.error.errors[0].message;
                }
              })}
            />
            {errorsReset.newPassword && <span className="cf-error-message" style={{ color: 'var(--accent-pink)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errorsReset.newPassword.message}</span>}
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
