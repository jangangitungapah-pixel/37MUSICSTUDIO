import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music2, Calendar, MapPin, Mic2, Star, ChevronRight, Activity, 
  Clock3, Headphones, MessageCircle, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2,
  Moon, Sun, Menu, X, Phone, CheckCircle2
} from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { dropdownPreset } from '../animations';
import MotionButton from '../components/animation/MotionButton';
import MotionSection from '../components/animation/MotionSection';
import MotionCard from '../components/animation/MotionCard';
import { MotionList } from '../components/animation/MotionList';
import { MotionListItem } from '../components/animation/MotionListItem';
import { useGalleryStore } from '../store/useGalleryStore';
import './LandingPage.css';

const LandingPage = () => {
  const { studioName, studioAddress, studioPhone, pricePerHour } = useSettingsStore();
  const { user, isAuthLoaded, login, error, loading, clearError } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { gallery } = useGalleryStore();
  const navigate = useNavigate();
  
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const heroPhotos = gallery.filter(p => p.showOnLandingPage);

  useEffect(() => {
    if (heroPhotos.length <= 1) return;
    const interval = setInterval(() => {
      setActiveHeroIndex(prev => (prev + 1) % heroPhotos.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroPhotos.length]);

  const currentHeroPhoto = heroPhotos.length > 0 
    ? heroPhotos[activeHeroIndex] 
    : { url: '/studio-hero.jpg', caption: 'Setup operator + gear lengkap' };

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

  useEffect(() => {
    if (!isMobileMenuOpen && !isLoginOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsLoginOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen, isLoginOpen]);

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

  // Framer motion variants removed in favor of central animation system

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="nav-brand">
          <img src="/logo.png" alt="Logo" className="nav-brand-logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <span className="brand-text">{studioName || '37 MUSIC'}</span>
        </Link>
        <div className="nav-links hide-on-mobile" role="navigation" aria-label="Navigasi utama">
          <a href="#features" aria-label="Lihat fasilitas studio">Fasilitas</a>
          {gallery.filter(p => p.showOnLandingPage).length > 0 && (
            <a href="#gallery" aria-label="Lihat galeri foto studio">Galeri</a>
          )}
          <a href="#pricing" aria-label="Lihat harga sewa">Harga</a>
          <a href="#location" aria-label="Lihat lokasi studio">Lokasi</a>
        </div>
        <div className="nav-actions">
          <MotionButton
            type="button"
            className="nav-theme-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            aria-label={theme === 'dark' ? 'Aktifkan Light Mode' : 'Aktifkan Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </MotionButton>
          <MotionButton 
            type="button"
            className={`nav-login-btn ${isLoginOpen ? 'active' : ''}`}
            onClick={() => { setIsLoginOpen(!isLoginOpen); setIsMobileMenuOpen(false); }}
            aria-label="Login Staff"
            aria-expanded={isLoginOpen}
          >
            <Lock size={15} />
            <span>Login Staff</span>
          </MotionButton>
          <Link to="/jadwal-publik" className="nav-book-btn" aria-label="Booking studio sekarang">
            Booking
          </Link>
          <button
            type="button"
            className={`nav-hamburger ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={() => { setIsMobileMenuOpen(!isMobileMenuOpen); setIsLoginOpen(false); }}
            aria-label={isMobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="landing-mobile-menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.button
              type="button"
              className="mobile-nav-backdrop"
              aria-label="Tutup menu navigasi"
              onClick={() => setIsMobileMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              id="landing-mobile-menu"
              className="mobile-nav-menu"
              role="navigation"
              aria-label="Menu navigasi mobile"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <a href="#features" aria-label="Fasilitas studio" onClick={() => setIsMobileMenuOpen(false)}>Fasilitas</a>
              {gallery.filter(p => p.showOnLandingPage).length > 0 && (
                <a href="#gallery" aria-label="Galeri foto studio" onClick={() => setIsMobileMenuOpen(false)}>Galeri</a>
              )}
              <a href="#pricing" aria-label="Harga sewa" onClick={() => setIsMobileMenuOpen(false)}>Harga</a>
              <a href="#location" aria-label="Lokasi studio" onClick={() => setIsMobileMenuOpen(false)}>Lokasi</a>
              <Link to="/jadwal-publik" className="mobile-menu-booking" onClick={() => setIsMobileMenuOpen(false)}>
                <Calendar size={16} /> Booking Studio
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Login Dropdown */}
      <AnimatePresence>
        {isLoginOpen && (
          <motion.div 
            className="nav-login-dropdown"
            role="dialog"
            aria-modal="true"
            aria-label="Login Staff"
            {...dropdownPreset}
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
                <motion.div id="login-error" role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="login-dropdown-error">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </motion.div>
              )}

              <div className="login-field">
                <label className="login-field-label" htmlFor="staff-identifier">Username / Email</label>
                <div className="login-field-wrap">
                  <Mail size={16} className="login-field-icon" />
                  <input
                    id="staff-identifier"
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    className="login-field-input"
                    placeholder="admin"
                    autoComplete="username"
                    autoFocus
                    required
                    aria-describedby={error ? 'login-error' : undefined}
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-field-label" htmlFor="staff-password">Password</label>
                <div className="login-field-wrap">
                  <Lock size={16} className="login-field-icon" />
                  <input
                    id="staff-password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="login-field-input"
                    placeholder="Password staff"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="login-field-toggle"
                    onClick={() => setShowPass(v => !v)}
                    aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <MotionButton type="submit" className="login-dropdown-submit" disabled={loading}>
                {loading
                  ? <><Loader2 className="spinner" size={16} /><span>Memverifikasi...</span></>
                  : <><span>Masuk ke Dashboard</span><ChevronRight size={16} /></>}
              </MotionButton>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-stage" />

        <div className="hero-layout">
          <MotionList as="div" className="hero-content">
            <MotionListItem as="div" className="hero-badge">
              <Activity size={15} />
              <span>Studio musik premium di Tangerang</span>
            </MotionListItem>
            
            <MotionListItem as="h1" className="hero-title">
              Ruang latihan dan rekaman untuk sound yang lebih siap panggung.
            </MotionListItem>
            
            <MotionListItem as="p" className="hero-subtitle">
              Satu ruang studio eksklusif dengan treatment akustik, gear lengkap, dan bantuan operator untuk rehearsal, take vokal, sampai produksi demo.
            </MotionListItem>
            
            <MotionListItem as="div" className="hero-buttons">
              <Link to="/jadwal-publik" className="btn-primary btn-large">
                <Calendar size={20} /> Booking Studio Sekarang
              </Link>
              <a href="https://youtube.com/@37musicstudio74?si=dq57yhCuJcph0pIf" target="_blank" rel="noopener noreferrer" className="btn-youtube btn-large">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
                Lihat Hasil Rekaman
              </a>
            </MotionListItem>

            <MotionListItem as="div" className="hero-quick-facts" aria-label="Informasi singkat studio">
              <div className="hero-fact"><Clock3 size={16} /> 10.00-23.00</div>
              <div className="hero-fact"><Headphones size={16} /> 1 Ruang Studio</div>
              <div className="hero-fact"><MessageCircle size={16} /> Booking via WA</div>
            </MotionListItem>
          </MotionList>

          <div className="hero-media-wrapper">
            <div className="hero-media-ambient-glow" style={{ backgroundImage: `url(${currentHeroPhoto.url})` }} />
            <div className="hero-media-frame">
              <div className="hero-media-image">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={currentHeroPhoto.url}
                    src={currentHeroPhoto.url} 
                    alt={currentHeroPhoto.caption}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </AnimatePresence>
                {heroPhotos.length > 1 && (
                  <div className="hero-slideshow-dots">
                    {heroPhotos.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`slideshow-dot ${idx === activeHeroIndex ? 'active' : ''}`}
                        onClick={() => setActiveHeroIndex(idx)}
                        aria-label={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <MotionSection direction="up" className="section-header">
          <h2>Fasilitas Studio</h2>
          <p>Satu studio eksklusif dengan treatment akustik, alat lengkap, dan workflow yang nyaman untuk latihan maupun rekaman.</p>
        </MotionSection>
        
        <div className="features-grid">
          <MotionCard interactive={false} delay={0.1} className="feature-card studio">
            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), transparent)', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
              <Music2 size={28} color="var(--accent-cyan)" />
            </div>
            <h3>Ruang Latihan Premium</h3>
            <p>Vibe dapet, sound nendang. Ruang latihan full kedap suara dengan akustik seimbang buat jamming super intens.</p>
            <ul className="feature-list">
              <li><ChevronRight size={16} /> Full AC & Kedap Suara</li>
              <li><ChevronRight size={16} /> Drum Set Premium</li>
              <li><ChevronRight size={16} /> Ampli Gitar dan Bass</li>
            </ul>
          </MotionCard>

          <MotionCard interactive={false} delay={0.2} className="feature-card recording">
            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, rgba(255, 42, 95, 0.15), transparent)', border: '1px solid rgba(255, 42, 95, 0.3)' }}>
              <Mic2 size={28} color="var(--accent-pink)" />
            </div>
            <h3>Recording & Tracking</h3>
            <p>Bawa pulang hasil rekaman proper. Gear kelas studio yang standby buat take vocal sampai bikin demo lagu.</p>
            <ul className="feature-list">
              <li><ChevronRight size={16} /> Mic Condenser & Dinamik</li>
              <li><ChevronRight size={16} /> Audio Interface & DAW</li>
              <li><ChevronRight size={16} /> Monitoring Headphone</li>
            </ul>
          </MotionCard>
          
          <MotionCard interactive={false} delay={0.3} className="feature-card operator">
            <div className="feature-icon" style={{ background: 'rgba(255, 152, 0, 0.1)', border: '1px solid rgba(255, 152, 0, 0.25)' }}>
              <Star size={28} color="#FF9800" />
            </div>
            <h3>Operator Studio</h3>
            <p>Kamu fokus bermain dan take vokal, operator membantu routing, sound check, dan setup gear.</p>
            <ul className="feature-list">
              <li><ChevronRight size={16} /> Bantuan Sound Check</li>
              <li><ChevronRight size={16} /> Setup Instrumen</li>
              <li><ChevronRight size={16} /> Asisten Recording</li>
            </ul>
          </MotionCard>
        </div>
      </section>

      {/* Gallery Section */}
      {gallery.filter(p => p.showOnLandingPage).length > 0 && (
        <section id="gallery" className="landing-gallery-section">
          <MotionSection direction="up" className="section-header">
            <h2>Galeri Foto Studio</h2>
            <p>Jelajahi suasana latihan dan rekaman premium kami yang siap menyambut project musik Anda.</p>
          </MotionSection>
          
          <div className="landing-gallery-grid">
            {gallery.filter(p => p.showOnLandingPage).slice(0, 6).map((photo, index) => (
              <MotionCard 
                key={photo.id}
                delay={0.05 * index}
                className="landing-gallery-card"
                onClick={() => setLightboxPhoto(photo)}
              >
                <div className="landing-gallery-media">
                  <img src={photo.url} alt={photo.caption} loading="lazy" />
                  <div className="landing-gallery-overlay">
                    <span className="gallery-caption">{photo.caption}</span>
                  </div>
                </div>
              </MotionCard>
            ))}
          </div>

          {gallery.filter(p => p.showToCustomer).length > 0 && (
            <div className="gallery-actions" style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
              <Link to="/galeri" className="btn-primary btn-large">
                Lihat Semua Foto
              </Link>
            </div>
          )}

          {/* Lightbox for Landing Page */}
          <AnimatePresence>
            {lightboxPhoto && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="gallery-lightbox-overlay"
                style={{ zIndex: 10000 }}
                onClick={() => setLightboxPhoto(null)}
              >
                <button 
                  className="lightbox-close" 
                  onClick={() => setLightboxPhoto(null)}
                  aria-label="Tutup penampil gambar"
                >
                  <X size={24} />
                </button>
                <motion.div 
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="lightbox-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img src={lightboxPhoto.url} alt={lightboxPhoto.caption} />
                  <div className="lightbox-footer">
                    <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: '12px 0 0 0', fontWeight: '600' }}>{lightboxPhoto.caption}</h3>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <MotionSection direction="up" className="pricing-container">
          <div className="pricing-info">
            <h2>Harga Sewa Mulai Dari</h2>
            <div className="price-display">
              <span className="price-currency">Rp</span>
              <span className="price-amount">{new Intl.NumberFormat('id-ID').format(pricePerHour || 120000)}</span>
              <span className="price-unit">/ jam</span>
            </div>
            <p>Kualitas audio maksimal nggak harus mahal. Amankan jadwal nge-jam atau take vokal kamu sekarang. Ada harga spesial buat booking durasi panjang!</p>
            <div className="pricing-includes" role="list" aria-label="Yang termasuk dalam harga">
              <div className="pricing-include-item" role="listitem"><CheckCircle2 size={16} /><span>Operator Studio</span></div>
              <div className="pricing-include-item" role="listitem"><CheckCircle2 size={16} /><span>Full AC &amp; Kedap Suara</span></div>
              <div className="pricing-include-item" role="listitem"><CheckCircle2 size={16} /><span>Alat Musik Lengkap</span></div>
              <div className="pricing-include-item" role="listitem"><CheckCircle2 size={16} /><span>Mic, Headphone &amp; Interface</span></div>
            </div>
            <Link to="/jadwal-publik" className="btn-primary btn-large" style={{ marginTop: '4px' }}>
              Booking Studio Sekarang
            </Link>
          </div>
        </MotionSection>
      </section>

      {/* Footer */}
      <footer id="location" className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="nav-brand">
              <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
              <span className="brand-text">{studioName || '37 MUSIC STUDIO'}</span>
            </div>
            <p>Studio musik satu ruang dengan akustik premium, gear lengkap, dan booking digital yang mudah.</p>
          </div>
          <div className="footer-contact">
            <h3>Hubungi Kami</h3>
            <p>
              <MapPin size={16} />
              <span>{studioAddress || 'Jl. Musik Indah No. 37, Kota Anda'}</span>
            </p>
            <p>
              <Phone size={16} />
              <a
                href={`https://wa.me/${(studioPhone || '08123456789').replace(/[-\s+()]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-contact-link"
                aria-label={`Hubungi via WhatsApp: ${studioPhone || '0812-3456-7890'}`}
              >
                WhatsApp: {studioPhone || '0812-3456-7890'}
              </a>
            </p>
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
                title="Lokasi 37 Music Studio di Google Maps"
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
