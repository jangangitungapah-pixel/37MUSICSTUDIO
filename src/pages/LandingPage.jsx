import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music2, Calendar, MapPin, Mic2, Star, ChevronRight, Activity, 
  Clock3, Headphones, MessageCircle, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2
} from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import './LandingPage.css';

const LandingPage = () => {
  const { studioName, studioAddress, studioPhone, pricePerHour } = useSettingsStore();
  const { user, isAuthLoaded, login, error, loading, clearError } = useAuthStore();
  const navigate = useNavigate();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll for navbar transparency
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Clear auth errors when modal is opened/closed
  useEffect(() => {
    clearError();
  }, [isLoginOpen, clearError]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(identifier, password);
      // Let the existing useEffect handle redirect to dashboard
    } catch {
      // Error handled by store
    }
  };

  // If user is already logged in and is staff/admin, redirect them to dashboard
  useEffect(() => {
    if (isAuthLoaded && user && !user.isAnonymous) {
      const t = setTimeout(() => navigate('/dashboard'), 500);
      return () => clearTimeout(t);
    }
  }, [user, isAuthLoaded, navigate]);

  // Framer motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.15, delayChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="nav-brand">
          <img src="/logo.png" alt="Logo" className="nav-brand-logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <span className="brand-text">{studioName || '37 MUSIC'}</span>
        </Link>
        <div className="nav-links hide-on-mobile">
          <a href="#features">Fasilitas</a>
          <a href="#pricing">Harga</a>
          <a href="#location">Lokasi</a>
        </div>
        <div className="nav-actions">
          <button 
            type="button"
            className={`nav-login-btn ${isLoginOpen ? 'active' : ''}`}
            onClick={() => setIsLoginOpen(!isLoginOpen)}
          >
            <Lock size={15} />
            <span>Login Staff</span>
          </button>
          <Link to="/jadwal-publik" className="nav-book-btn">
            Booking
          </Link>
        </div>
      </nav>

      {/* Login Dropdown */}
      <AnimatePresence>
        {isLoginOpen && (
          <motion.div 
            className="nav-login-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="login-dropdown-header">
              <div className="login-dropdown-icon-wrap" style={{ background: 'transparent', border: 'none' }}>
                <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div>
                <p className="login-dropdown-brand">{studioName || '37 MUSIC STUDIO'}</p>
                <h4 className="login-dropdown-title">Akses Staff</h4>
              </div>
            </div>

            <div className="login-dropdown-divider" />

            <form onSubmit={handleLoginSubmit} className="login-dropdown-form">
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="login-dropdown-error">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </motion.div>
              )}

              <div className="login-field">
                <label className="login-field-label">Username / Email</label>
                <div className="login-field-wrap">
                  <Mail size={16} className="login-field-icon" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    className="login-field-input"
                    placeholder="admin"
                    autoComplete="username"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-field-label">Password</label>
                <div className="login-field-wrap">
                  <Lock size={16} className="login-field-icon" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="login-field-input"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="login-field-toggle"
                    onClick={() => setShowPass(v => !v)}
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-dropdown-submit" disabled={loading}>
                {loading
                  ? <><Loader2 className="spinner" size={16} /><span>Memverifikasi...</span></>
                  : <><span>Masuk ke Dashboard</span><ChevronRight size={16} /></>}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-blob blob1" />
        <div className="hero-bg-blob blob2" />
        <div className="hero-bg-logo" />
        
        <motion.div 
          className="hero-content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >

          <motion.div variants={itemVariants} className="hero-badge">
            <Activity size={15} />
            <span>Elevate Your Sound. Studio Musik Premium di Tangerang.</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="hero-title">
            Bikin Karya Musikmu <br/>
            Naik Level <span className="text-gradient">Tanpa Batas</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="hero-subtitle">
            Dari jamming asik bareng band sampai produksi rekaman profesional. Nikmati ruang akustik premium dengan gear standar konser yang bikin sound kamu makin kickin'.
          </motion.p>
          
          <motion.div variants={itemVariants} className="hero-buttons">
            <Link to="/jadwal-publik" className="btn-primary btn-large">
              <Calendar size={20} /> Booking Studio Sekarang
            </Link>
            <a href="https://youtube.com/@37musicstudio74?si=dq57yhCuJcph0pIf" target="_blank" rel="noopener noreferrer" className="btn-youtube btn-large">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
              Lihat Hasil Output Kami
            </a>
          </motion.div>

          <motion.div variants={itemVariants} className="hero-quick-facts">
            <div className="hero-fact"><Clock3 size={16} /> 10.00-23.00</div>
            <div className="hero-fact"><Headphones size={16} /> 1 Ruang Studio</div>
            <div className="hero-fact"><MessageCircle size={16} /> Booking via WA</div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2>Ultimate Studio Specs</h2>
          <p>Satu studio eksklusif dengan treatment akustik kelas industri. Ready buat rehearsal dan serious tracking.</p>
        </motion.div>
        
        <div className="features-grid">
          <motion.div 
            className="feature-card studio"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), transparent)', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
              <Music2 size={28} color="var(--accent-cyan)" />
            </div>
            <h3>Premium Rehearsal Space</h3>
            <p>Vibe dapet, sound nendang. Ruang latihan full kedap suara dengan akustik seimbang buat jamming super intens.</p>
            <ul className="feature-list">
              <li><ChevronRight size={16} /> Full AC & Kedap Suara</li>
              <li><ChevronRight size={16} /> Drum Set Premium</li>
              <li><ChevronRight size={16} /> Ampli Gitar dan Bass</li>
            </ul>
          </motion.div>

          <motion.div 
            className="feature-card recording"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, rgba(255, 42, 95, 0.15), transparent)', border: '1px solid rgba(255, 42, 95, 0.3)' }}>
              <Mic2 size={28} color="var(--accent-pink)" />
            </div>
            <h3>Pro Recording & Tracking</h3>
            <p>Bawa pulang hasil rekaman proper. Gear kelas studio yang standby buat take vocal sampai bikin demo lagu.</p>
            <ul className="feature-list">
              <li><ChevronRight size={16} /> Mic Condenser & Dinamik</li>
              <li><ChevronRight size={16} /> Audio Interface & DAW</li>
              <li><ChevronRight size={16} /> Monitoring Headphone</li>
            </ul>
          </motion.div>
          
          <motion.div 
            className="feature-card operator"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="feature-icon" style={{ background: 'rgba(255, 152, 0, 0.1)', border: '1px solid rgba(255, 152, 0, 0.25)' }}>
              <Star size={28} color="#FF9800" />
            </div>
            <h3>Dedicated Sound Engineer</h3>
            <p>Lo fokus berkarya aja, biar sound engineer kita yang urus routing, mixing, dan setup gear-nya.</p>
            <ul className="feature-list">
              <li><ChevronRight size={16} /> Bantuan Sound Check</li>
              <li><ChevronRight size={16} /> Setup Instrumen</li>
              <li><ChevronRight size={16} /> Asisten Recording</li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <motion.div 
          className="pricing-container"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="pricing-info">
            <h2>Harga Sewa Mulai Dari</h2>
            <div className="price-display">
              <span className="price-currency">Rp</span>
              <span className="price-amount">{new Intl.NumberFormat('id-ID').format(pricePerHour || 120000)}</span>
              <span className="price-unit">/ jam</span>
            </div>
            <p>Kualitas audio maksimal nggak harus mahal. Amankan jadwal nge-jam atau take vokal kamu sekarang. Ada harga spesial buat booking durasi panjang!</p>
            <Link to="/jadwal-publik" className="btn-primary btn-large" style={{ marginTop: '20px' }}>
              Booking Studio Sekarang
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer id="location" className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="nav-brand">
              <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
              <span className="brand-text">{studioName || '37 MUSIC STUDIO'}</span>
            </div>
            <p>Your sonic playground. Menggabungkan kualitas akustik premium dengan kemudahan booking secara digital.</p>
          </div>
          <div className="footer-contact">
            <h3>Hubungi Kami</h3>
            <p><MapPin size={16} /> {studioAddress || 'Jl. Musik Indah No. 37, Kota Anda'}</p>
            <p><Activity size={16} /> WhatsApp: {studioPhone || '0812-3456-7890'}</p>
          </div>
          <div className="footer-map">
            <h3>Lokasi Studio</h3>
            <div className="map-container">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.345151531122!2d106.6089336!3d-6.218134099999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69fea3cbcf857d%3A0x58b169d1a6502414!2s37%20Music%20Studio%20TANGERANG!5e0!3m2!1sen!2sid!4v1779439398167!5m2!1sen!2sid" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps Location"
              />
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} {studioName || '37 MUSIC STUDIO'}. Didesain menggunakan 37MUSICSTUDIO System.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
