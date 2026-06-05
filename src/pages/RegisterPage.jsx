import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Music, AlertCircle } from 'lucide-react';
import { Button, Card, LoadingState } from '../shared/ui';
import './AuthPage.css';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  
  const { register, error, loading, user, isAuthLoaded, clearError } = useAuthStore();
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
    setLocalError('');
    
    if (password !== confirmPassword) {
      setLocalError('Password tidak cocok!');
      return;
    }

    try {
      await register(email, password, username, phone);
      navigate('/');
    } catch {
      return;
    }
  };

  if (!isAuthLoaded) {
    return <LoadingState className="auth-loading" size={32} />;
  }

  return (
    <div className="auth-container" style={{padding: '40px 20px'}}>
      <Card variant="glass" className="auth-card" style={{maxWidth: '450px'}}>
        <div className="auth-header">
          <div className="logo-icon">
            <Music size={32} color="var(--accent-pink)" />
          </div>
          <h1>37 STUDIO</h1>
          <p>Create a new account</p>
        </div>

        {(error || localError) && (
          <div className="auth-error">
            <AlertCircle size={16} style={{flexShrink: 0}} />
            <span>{localError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))} 
              className="form-input"
              placeholder="contoh: studioadmin"
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="form-input"
              placeholder="admin@example.com"
              required 
            />
          </div>

          <div className="form-group">
            <label>Nomor Telepon (Opsional)</label>
            <input 
              type="tel" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              className="form-input"
              placeholder="08123456789"
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
              minLength="6"
            />
          </div>
          
          <div className="form-group">
            <label>Konfirmasi Password</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className="form-input"
              placeholder="••••••••"
              required 
              minLength="6"
            />
          </div>
          
          <Button type="submit" className="auth-submit" loading={loading} spinnerSize={18}>
            Register
          </Button>
        </form>

        <div className="auth-footer">
          <p>Sudah punya akun? <Link to="/login">Login di sini</Link></p>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;
