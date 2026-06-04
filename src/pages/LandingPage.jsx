import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Disc3,
  Eye,
  EyeOff,
  Gauge,
  Headphones,
  Lock,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Mic2,
  Moon,
  Music2,
  Phone,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Sun,
  Users2,
  Volume2,
  X,
  Loader2,
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

const FALLBACK_HERO_PHOTO = {
  url: '/studio-hero.webp',
  caption: '37 Music Studio private room',
};

const YOUTUBE_URL = 'https://youtube.com/@37musicstudio74?si=dq57yhCuJcph0pIf';

const formatCurrency = (value) => new Intl.NumberFormat('id-ID').format(value || 0);

const normalizeWhatsAppNumber = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '6281234567890';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
};

const getDisplayCaption = (photo, index = 0) => {
  const rawCaption = String(photo?.caption || '').trim();
  const looksLikeFileName = /\d{6,}/.test(rawCaption) || rawCaption.split(/\s+/).length > 5;

  if (!rawCaption || rawCaption.length > 48 || looksLikeFileName) {
    return `Studio angle ${String(index + 1).padStart(2, '0')}`;
  }

  return rawCaption;
};

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

  const landingPhotos = useMemo(
    () => gallery.filter((photo) => photo.showOnLandingPage && photo.url),
    [gallery]
  );
  const customerGallery = useMemo(
    () => gallery.filter((photo) => photo.showToCustomer && photo.url),
    [gallery]
  );
  const heroPhotos = useMemo(() => {
    const seen = new Set([FALLBACK_HERO_PHOTO.url]);
    const extraPhotos = landingPhotos.filter((photo) => {
      if (!photo.url || seen.has(photo.url)) return false;
      seen.add(photo.url);
      return true;
    });

    return [FALLBACK_HERO_PHOTO, ...extraPhotos].slice(0, 6);
  }, [landingPhotos]);
  const currentHeroPhoto = heroPhotos[activeHeroIndex] || FALLBACK_HERO_PHOTO;
  const formattedPrice = formatCurrency(pricePerHour || 120000);
  const whatsappNumber = normalizeWhatsAppNumber(studioPhone);
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;
  const showGalleryLink = customerGallery.length > 0;
  const galleryPreview = landingPhotos.length > 0 ? landingPhotos.slice(0, 6) : [FALLBACK_HERO_PHOTO];

  useEffect(() => {
    if (heroPhotos.length <= 1) return undefined;

    const interval = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % heroPhotos.length);
    }, 5600);

    return () => clearInterval(interval);
  }, [heroPhotos.length]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 42);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    clearError();
    setIdentifier('');
    setPassword('');
  }, [isLoginOpen, clearError]);

  useEffect(() => {
    if (!isMobileMenuOpen && !isLoginOpen && !lightboxPhoto) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsLoginOpen(false);
        setLightboxPhoto(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen, isLoginOpen, lightboxPhoto]);

  useEffect(() => {
    if (isAuthLoaded && user && !user.isAnonymous) {
      const t = setTimeout(() => navigate('/dashboard'), 500);
      return () => clearTimeout(t);
    }

    return undefined;
  }, [user, isAuthLoaded, navigate]);

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    try {
      await login(identifier, password);
    } catch {
      return;
    }
  };

  return (
    <div className="landing-container">
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="nav-brand" aria-label={`${studioName || '37 Music Studio'} home`}>
          <span className="nav-brand-mark" aria-hidden="true">
            <span className="nav-brand-monogram">37</span>
          </span>
          <span className="brand-text">{studioName || '37 MUSIC STUDIO'}</span>
        </Link>

        <div className="nav-links hide-on-mobile" role="navigation" aria-label="Navigasi utama">
          <a href="#experience">Experience</a>
          <a href="#gallery">Vibe</a>
          <a href="#pricing">Rate</a>
          <a href="#location">Lokasi</a>
        </div>

        <div className="nav-actions">
          <MotionButton
            type="button"
            className="nav-theme-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            aria-label={theme === 'dark' ? 'Aktifkan Light Mode' : 'Aktifkan Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </MotionButton>

          <MotionButton
            type="button"
            className={`nav-login-btn ${isLoginOpen ? 'active' : ''}`}
            onClick={() => {
              setIsLoginOpen(!isLoginOpen);
              setIsMobileMenuOpen(false);
            }}
            aria-label="Login Staff"
            aria-expanded={isLoginOpen}
          >
            <Lock size={16} />
            <span>Staff</span>
          </MotionButton>

          <Link to="/jadwal-publik" className="nav-book-btn" aria-label="Booking studio sekarang">
            <Calendar size={16} />
            <span>Booking</span>
          </Link>

          <button
            type="button"
            className={`nav-hamburger ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={() => {
              setIsMobileMenuOpen(!isMobileMenuOpen);
              setIsLoginOpen(false);
            }}
            aria-label={isMobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="landing-mobile-menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

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
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <a href="#experience" onClick={() => setIsMobileMenuOpen(false)}>Experience</a>
              <a href="#gallery" onClick={() => setIsMobileMenuOpen(false)}>Vibe</a>
              <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>Rate</a>
              <a href="#location" onClick={() => setIsMobileMenuOpen(false)}>Lokasi</a>
              <Link to="/jadwal-publik" className="mobile-menu-booking" onClick={() => setIsMobileMenuOpen(false)}>
                <Calendar size={17} />
                Booking Studio
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
              <div className="login-dropdown-icon-wrap">
                <img src="/logo.svg" alt="" />
              </div>
              <div>
                <p className="login-dropdown-brand">{studioName || '37 MUSIC STUDIO'}</p>
                <h4 className="login-dropdown-title">Akses Staff</h4>
              </div>
            </div>

            <div className="login-dropdown-divider" />

            <form onSubmit={handleLoginSubmit} className="login-dropdown-form">
              {error && (
                <motion.div
                  id="login-error"
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="login-dropdown-error"
                >
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
                    onChange={(event) => setIdentifier(event.target.value)}
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
                    onChange={(event) => setPassword(event.target.value)}
                    className="login-field-input"
                    placeholder="Password staff"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="login-field-toggle"
                    onClick={() => setShowPass((value) => !value)}
                    aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <MotionButton type="submit" className="login-dropdown-submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="spinner" size={16} />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk Dashboard</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </MotionButton>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="hero-section" aria-label="37 Music Studio landing hero">
        <div className="hero-background" aria-hidden="true">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentHeroPhoto.url}
              src={currentHeroPhoto.url}
              alt=""
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            />
          </AnimatePresence>
          <div className="hero-scrim" />
        </div>

        <div className="hero-shell">
          <MotionList as="div" className="hero-copy">
            <MotionListItem as="div" className="hero-kicker">
              <Sparkles size={16} />
              <span>Private music room in Tangerang</span>
            </MotionListItem>

            <MotionListItem as="h1" className="hero-title">
              Studio private buat suara yang lebih mahal.
            </MotionListItem>

            <MotionListItem as="p" className="hero-subtitle">
              Satu ruang eksklusif untuk rehearsal, recording, dan konten band. Gear siap, operator standby, booking langsung dari HP.
            </MotionListItem>

            <MotionListItem as="div" className="hero-actions">
              <Link to="/jadwal-publik" className="btn-primary btn-large">
                <Calendar size={20} />
                <span>Booking Slot</span>
              </Link>
              <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-large">
                <PlayCircle size={20} />
                <span>Play Preview</span>
              </a>
            </MotionListItem>
          </MotionList>

          <motion.div
            className="hero-session"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.72, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
            aria-label="Informasi singkat studio"
          >
            <div className="hero-session-main">
              <span className="session-label">Start from</span>
              <strong>Rp {formattedPrice}</strong>
              <span>/ jam</span>
            </div>
            <div className="hero-session-grid">
              <div>
                <Clock3 size={16} />
                <span>10.00-23.00</span>
              </div>
              <div>
                <Headphones size={16} />
                <span>Operator</span>
              </div>
              <div>
                <ShieldCheck size={16} />
                <span>Private room</span>
              </div>
            </div>
          </motion.div>

          {heroPhotos.length > 1 && (
            <div className="hero-slideshow-dots" aria-label="Pilihan foto hero">
              {heroPhotos.map((photo, index) => (
                <button
                  key={photo.id || photo.url}
                  type="button"
                  className={`slideshow-dot ${index === activeHeroIndex ? 'active' : ''}`}
                  onClick={() => setActiveHeroIndex(index)}
                  aria-label={`Tampilkan foto ${index + 1}`}
                  aria-current={index === activeHeroIndex}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <MotionSection id="experience" direction="up" className="experience-section" amount={0.01}>
        <div className="section-header">
          <span className="section-eyebrow">The 37 Experience</span>
          <h2>Satu studio, vibe-nya dibuat serius.</h2>
          <p>
            Layout dibuat untuk band muda, vocalist, solo creator, dan session player yang butuh tempat rapi tanpa ribet teknis.
          </p>
        </div>

        <div className="experience-grid">
          <MotionCard interactive delay={0.05} className="experience-card">
            <div className="experience-icon">
              <Music2 size={26} />
            </div>
            <span className="experience-label">Rehearsal</span>
            <h3>Latihan lebih fokus</h3>
            <p>Soundproof, AC, drum, ampli gitar, ampli bass, dan routing yang siap dipakai dari awal sesi.</p>
          </MotionCard>

          <MotionCard interactive delay={0.12} className="experience-card featured">
            <div className="experience-icon">
              <Mic2 size={26} />
            </div>
            <span className="experience-label">Recording</span>
            <h3>Take vokal dan demo</h3>
            <p>Mic, interface, monitoring, dan operator untuk bantu tracking supaya ide lagu cepat jadi materi.</p>
          </MotionCard>

          <MotionCard interactive delay={0.19} className="experience-card">
            <div className="experience-icon">
              <Gauge size={26} />
            </div>
            <span className="experience-label">Session assist</span>
            <h3>Datang, setup, main</h3>
            <p>Operator bantu sound check, tuning basic, dan kebutuhan teknis supaya sesi tetap jalan.</p>
          </MotionCard>
        </div>
      </MotionSection>

      <MotionSection direction="up" className="booking-flow-section">
        <div className="flow-panel">
          <div className="flow-copy">
            <span className="section-eyebrow">Mobile-first booking</span>
            <h2>Slot kosong bisa dicek sambil jalan.</h2>
            <p>Cocok buat user yang buka dari HP: cek jadwal, isi data, lalu konfirmasi lewat WhatsApp.</p>
          </div>

          <div className="flow-steps" aria-label="Alur booking">
            <div className="flow-step">
              <span>01</span>
              <strong>Cek slot</strong>
              <p>Lihat jadwal publik yang masih kosong.</p>
            </div>
            <div className="flow-step">
              <span>02</span>
              <strong>Isi sesi</strong>
              <p>Pilih jam, tulis kebutuhan, dan kirim request.</p>
            </div>
            <div className="flow-step">
              <span>03</span>
              <strong>Datang main</strong>
              <p>Tim studio bantu setup saat kamu tiba.</p>
            </div>
          </div>
        </div>
      </MotionSection>

      <MotionSection id="gallery" direction="up" className="landing-gallery-section">
        <div className="section-header align-left">
          <span className="section-eyebrow">Vibe check</span>
          <h2>Ruangnya kelihatan sebelum kamu booking.</h2>
          <p>Foto studio jadi sinyal utama supaya user mobile bisa cepat percaya sebelum lanjut ke jadwal.</p>
        </div>

        <div className="landing-gallery-grid">
          {galleryPreview.map((photo, index) => {
            const displayCaption = getDisplayCaption(photo, index);

            return (
            <MotionCard
              key={photo.id || photo.url}
              delay={0.04 * index}
              className={`landing-gallery-card gallery-card-${index + 1}`}
              onClick={() => setLightboxPhoto({ ...photo, displayCaption })}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setLightboxPhoto({ ...photo, displayCaption });
                }
              }}
            >
              <div className="landing-gallery-media">
                <img src={photo.url} alt={displayCaption} loading="lazy" />
                <div className="landing-gallery-overlay">
                  <Camera size={18} />
                  <span>{displayCaption}</span>
                </div>
              </div>
            </MotionCard>
            );
          })}
        </div>

        {showGalleryLink && (
          <div className="gallery-actions">
            <Link to="/galeri" className="btn-secondary btn-large">
              <span>Lihat Galeri</span>
              <ArrowUpRight size={18} />
            </Link>
          </div>
        )}

        <AnimatePresence>
          {lightboxPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="gallery-lightbox-overlay"
              onClick={() => setLightboxPhoto(null)}
            >
              <button
                type="button"
                className="lightbox-close"
                onClick={() => setLightboxPhoto(null)}
                aria-label="Tutup penampil gambar"
              >
                <X size={24} />
              </button>
              <motion.div
                initial={{ scale: 0.96, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.96, y: 10 }}
                className="lightbox-content"
                onClick={(event) => event.stopPropagation()}
              >
                <img src={lightboxPhoto.url} alt={lightboxPhoto.displayCaption || 'Foto studio'} />
                {lightboxPhoto.displayCaption && <p>{lightboxPhoto.displayCaption}</p>}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </MotionSection>

      <MotionSection id="pricing" direction="up" className="pricing-section">
        <div className="pricing-shell">
          <div className="pricing-copy">
            <span className="section-eyebrow">Studio rate</span>
            <h2>Harga jelas, fasilitas udah include.</h2>
            <p>
              Cocok untuk latihan, demo recording, content session, atau band yang butuh ruang private dengan operator.
            </p>
            <div className="pricing-includes" role="list" aria-label="Yang termasuk dalam harga">
              <div role="listitem"><CheckCircle2 size={17} /><span>Operator included</span></div>
              <div role="listitem"><CheckCircle2 size={17} /><span>Full AC dan soundproof</span></div>
              <div role="listitem"><CheckCircle2 size={17} /><span>Drum, ampli gitar, ampli bass</span></div>
              <div role="listitem"><CheckCircle2 size={17} /><span>Mic, interface, monitoring</span></div>
            </div>
          </div>

          <div className="price-card">
            <div className="price-card-top">
              <span>Mulai dari</span>
              <Disc3 size={22} />
            </div>
            <div className="price-display">
              <span className="price-currency">Rp</span>
              <span className="price-amount">{formattedPrice}</span>
              <span className="price-unit">/ jam</span>
            </div>
            <Link to="/jadwal-publik" className="btn-primary btn-large">
              <Calendar size={19} />
              <span>Cek Jadwal</span>
            </Link>
          </div>
        </div>
      </MotionSection>

      <MotionSection direction="up" className="proof-section">
        <div className="proof-grid" aria-label="Keunggulan studio">
          <div>
            <Volume2 size={20} />
            <strong>Sound ready</strong>
            <span>Gear live dan recording siap sesi.</span>
          </div>
          <div>
            <Users2 size={20} />
            <strong>Youth friendly</strong>
            <span>Nyaman buat band, creator, dan soloist.</span>
          </div>
          <div>
            <MessageCircle size={20} />
            <strong>Fast response</strong>
            <span>Konfirmasi booking lewat WhatsApp.</span>
          </div>
        </div>
      </MotionSection>

      <footer id="location" className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Link to="/" className="nav-brand">
              <span className="nav-brand-mark" aria-hidden="true">
                <img src="/logo.svg" alt="" />
              </span>
              <span className="brand-text">{studioName || '37 MUSIC STUDIO'}</span>
            </Link>
            <p>Studio musik private di Tangerang untuk rehearsal, recording, dan session content.</p>
            <div className="footer-social">
              <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer">
                <PlayCircle size={17} />
                YouTube
              </a>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={17} />
                WhatsApp
              </a>
            </div>
          </div>

          <div className="footer-contact">
            <h3>Hubungi kami</h3>
            <p>
              <MapPin size={17} />
              <span>{studioAddress || 'Jl. Musik Indah No. 37, Kota Anda'}</span>
            </p>
            <p>
              <Phone size={17} />
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-contact-link"
                aria-label={`Hubungi via WhatsApp: ${studioPhone || '0812-3456-7890'}`}
              >
                {studioPhone || '0812-3456-7890'}
              </a>
            </p>
          </div>

          <div className="footer-map">
            <h3>Lokasi studio</h3>
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
          <span>Copyright {new Date().getFullYear()} {studioName || '37 MUSIC STUDIO'}. All rights reserved.</span>
        </div>
      </footer>

      <Link to="/jadwal-publik" className="mobile-sticky-cta" aria-label="Booking studio sekarang">
        <span>
          <Activity size={15} />
          Rp {formattedPrice}/jam
        </span>
        <strong>
          Booking
          <ChevronRight size={17} />
        </strong>
      </Link>
    </div>
  );
};

export default LandingPage;
