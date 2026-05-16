import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useAuthStore } from '../store/useAuthStore';
import { User, Phone, Mail, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import './ProfileModal.css';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, userProfile, updateUserProfile, updateUserPassword, loading, error, clearError } = useAuthStore();
  
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'
  const [successMsg, setSuccessMsg] = useState('');
  const [localError, setLocalError] = useState('');

  // Reset form when modal opens or profile changes
  useEffect(() => {
    if (isOpen) {
      setUsername(userProfile?.username || user?.displayName || '');
      setPhone(userProfile?.phone || '');
      setPassword('');
      setConfirmPassword('');
      setActiveTab('profile');
      setSuccessMsg('');
      setLocalError('');
      clearError();
    }
  }, [isOpen, userProfile, user, clearError]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setLocalError('');
    clearError();
    
    try {
      await updateUserProfile(username, phone);
      setSuccessMsg('Profil berhasil diperbarui!');
    } catch (err) {
      // Error is handled by store
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setLocalError('');
    clearError();

    if (password !== confirmPassword) {
      setLocalError('Password tidak cocok!');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password minimal 6 karakter!');
      return;
    }

    try {
      await updateUserPassword(password);
      setSuccessMsg('Password berhasil diperbarui!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
      <div className="profile-modal-tabs">
        <button 
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Data Diri
        </button>
        <button 
          className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Keamanan
        </button>
      </div>

      {(error || localError) && (
        <div className="alert-box error">
          <AlertCircle size={16} />
          <span>{localError || error}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert-box success">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {activeTab === 'profile' ? (
        <form onSubmit={handleProfileSubmit} className="profile-form">
          <div className="form-group">
            <label>
              <Mail size={16} /> Email (Read-only)
            </label>
            <input 
              type="email" 
              value={user?.email || ''} 
              disabled 
              className="form-input disabled"
            />
          </div>

          <div className="form-group">
            <label>
              <User size={16} /> Username
            </label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))} 
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>
              <Phone size={16} /> Nomor Telepon
            </label>
            <input 
              type="tel" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              className="form-input"
              placeholder="08123456789"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 className="spinner" size={18} /> : 'Simpan Profil'}
          </button>
        </form>
      ) : (
        <form onSubmit={handlePasswordSubmit} className="profile-form">
          <div className="form-group">
            <label>
              <Lock size={16} /> Password Baru
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="form-input"
              placeholder="Minimal 6 karakter"
              required
            />
          </div>

          <div className="form-group">
            <label>
              <Lock size={16} /> Konfirmasi Password
            </label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className="form-input"
              placeholder="Ketik ulang password"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{background: 'var(--accent-pink)'}}>
            {loading ? <Loader2 className="spinner" size={18} /> : 'Ganti Password'}
          </button>
        </form>
      )}
    </Modal>
  );
};

export default ProfileModal;
