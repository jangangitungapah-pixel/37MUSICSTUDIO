import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Music, AlertCircle, Loader2 } from 'lucide-react';
import './AuthPage.css'; // Shared CSS for both Login and Register

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginGuest, error, loading, user, isAuthLoaded, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthLoaded && user) {
      navigate('/');
    }
  }, [user, isAuthLoaded, navigate]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(identifier, password);
      navigate('/');
    } catch (err) {
      // Error is handled by store
    }
  };

  const handleGuestLogin = async () => {
    try {
      await loginGuest();
      navigate('/jadwal-publik');
    } catch (err) {
      // Error is handled by store
    }
  };

  if (!isAuthLoaded) {
    return <div className="auth-loading"><Loader2 className="spinner" size={32} /></div>;
  }

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <div className="logo-icon">
            <Music size={32} color="var(--accent-pink)" />
          </div>
          <h1>37 STUDIO</h1>
          <p>Login to manage your studio</p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} style={{flexShrink: 0}} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email, Username, atau No. Telepon</label>
            <input 
              type="text" 
              value={identifier} 
              onChange={(e) => setIdentifier(e.target.value)} 
              className="form-input"
              placeholder="Masukkan identitas login"
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="form-input"
              placeholder="••••••••"
              required 
            />
          </div>
          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? <Loader2 className="spinner" size={18} /> : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Belum punya akun? <Link to="/register">Daftar di sini</Link></p>
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
            <button 
              type="button" 
              onClick={handleGuestLogin} 
              className="btn-secondary" 
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              Masuk sebagai Tamu (Lihat Jadwal)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
