import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Music2, Calendar, MapPin, Mic2, Star, ChevronRight, Activity } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import './LandingPage.css';

const LandingPage = () => {
  const { studioName, studioAddress, studioPhone, pricePerHour, rooms } = useSettingsStore();
  const { user, isAuthLoaded } = useAuthStore();
  const navigate = useNavigate();

  // If user is already logged in and is staff/admin, redirect them to dashboard
  useEffect(() => {
    if (isAuthLoaded && user && !user.isAnonymous) {
      // Small delay to allow fade out
      const t = setTimeout(() => navigate('/dashboard'), 500);
      return () => clearTimeout(t);
    }
  }, [user, isAuthLoaded, navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1, delayChildren: 0.2 } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="landing-nav glass-panel">
        <div className="nav-brand">
          <Music2 size={24} color="var(--accent-pink)" />
          <span className="brand-text">{studioName}</span>
        </div>
        <div className="nav-links hide-on-mobile">
          <a href="#features">Fasilitas</a>
          <a href="#pricing">Harga</a>
          <a href="#location">Lokasi</a>
        </div>
        <div className="nav-actions">
          <Link to="/login" className="btn-secondary nav-login-btn">
            Login Staff
          </Link>
          <Link to="/jadwal-publik" className="btn-primary nav-book-btn">
            Booking Sekarang
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-blob blob1"></div>
        <div className="hero-bg-blob blob2"></div>
        
        <motion.div 
          className="hero-content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="hero-badge">
            <Activity size={14} color="var(--accent-cyan)" />
            <span>Studio Musik Premium di Kota Anda</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="hero-title">
            Tingkatkan Kualitas <br/>
            <span className="text-gradient">Karya Musik</span> Anda
          </motion.h1>
          
          <motion.p variants={itemVariants} className="hero-subtitle">
            Ruang latihan kedap suara dengan akustik terbaik, peralatan standar konser, dan layanan rekaman profesional untuk musisi indie hingga label.
          </motion.p>
          
          <motion.div variants={itemVariants} className="hero-buttons">
            <Link to="/jadwal-publik" className="btn-primary btn-large">
              <Calendar size={18} /> Cek Jadwal & Booking
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Facilities Section */}
      <section id="features" className="features-section">
        <div className="section-header text-center">
          <h2>Fasilitas & Ruangan</h2>
          <p>Pilih ruangan yang sesuai dengan kebutuhan band Anda</p>
        </div>
        
        <div className="features-grid">
          {(rooms && rooms.length > 0 ? rooms : [
            { id: 'studio-a', name: 'Studio A', color: 'var(--accent-cyan)' },
            { id: 'studio-b', name: 'Studio B', color: 'var(--accent-pink)' }
          ]).map((room, idx) => (
            <div key={room.id} className="feature-card glass-panel">
              <div className="feature-icon" style={{ background: `linear-gradient(135deg, ${room.color}33, transparent)`, border: `1px solid ${room.color}55` }}>
                {idx === 0 ? <Music2 size={24} color={room.color} /> : <Mic2 size={24} color={room.color} />}
              </div>
              <h3>{room.name}</h3>
              <p>Ruangan luas, full AC, drum kit premium, dan ampli tabung. Cocok untuk latihan band format besar atau live recording.</p>
              <ul className="feature-list">
                <li><ChevronRight size={14} /> Full AC & Kedap Suara</li>
                <li><ChevronRight size={14} /> Drum Set Premium</li>
                <li><ChevronRight size={14} /> Ampli Gitar Tabung</li>
              </ul>
            </div>
          ))}
          
          <div className="feature-card glass-panel">
            <div className="feature-icon" style={{ background: 'rgba(255, 152, 0, 0.15)', border: '1px solid rgba(255, 152, 0, 0.3)' }}>
              <Star size={24} color="#FF9800" />
            </div>
            <h3>Recording VIP</h3>
            <p>Fasilitas rekaman multitrack dengan operator berpengalaman. Hasil mixing dan mastering berstandar industri.</p>
            <ul className="feature-list">
              <li><ChevronRight size={14} /> Mic Condenser Studio</li>
              <li><ChevronRight size={14} /> Digital Audio Workstation</li>
              <li><ChevronRight size={14} /> Termasuk Operator</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="pricing-container glass-panel">
          <div className="pricing-info">
            <h2>Harga Sewa Mulai Dari</h2>
            <div className="price-display">
              <span className="price-currency">Rp</span>
              <span className="price-amount">{new Intl.NumberFormat('id-ID').format(pricePerHour)}</span>
              <span className="price-unit">/ jam</span>
            </div>
            <p>Dapatkan diskon khusus untuk pelajar dan booking di atas 3 jam. Kami juga melayani paket bundling recording.</p>
            <Link to="/jadwal-publik" className="btn-primary mt-4">
              Pesan Sekarang
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="location" className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="nav-brand">
              <Music2 size={24} color="var(--accent-pink)" />
              <span className="brand-text">{studioName}</span>
            </div>
            <p>Platform manajemen studio musik modern. Latihan dan rekaman jadi lebih mudah.</p>
          </div>
          <div className="footer-contact">
            <h3>Hubungi Kami</h3>
            <p><MapPin size={14} /> {studioAddress || 'Jl. Musik Indah No. 37'}</p>
            <p><Activity size={14} /> WA: {studioPhone || '0812-3456-7890'}</p>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} {studioName}. Dibuat menggunakan 37MUSICSTUDIO System.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
