import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGalleryStore } from '../store/useGalleryStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useThemeStore } from '../store/useThemeStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Search, X, Moon, Sun, Camera, Image as ImageIcon } from 'lucide-react';
import MotionSection from '../components/animation/MotionSection';
import MotionCard from '../components/animation/MotionCard';
import { staggerContainer, staggerItem } from '../animations';
import './PublicGalleryPage.css';

const PublicGalleryPage = () => {
  const navigate = useNavigate();
  const { gallery } = useGalleryStore();
  const { studioName } = useSettingsStore();
  const { theme, toggleTheme } = useThemeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // Filter photos shown to customers
  const customerPhotos = useMemo(() => {
    return gallery.filter(photo => photo.showToCustomer);
  }, [gallery]);

  // Filter based on search query
  const filteredPhotos = useMemo(() => {
    return customerPhotos.filter(photo => {
      if (!searchQuery.trim()) return true;
      return photo.caption && photo.caption.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [customerPhotos, searchQuery]);

  return (
    <div className="pg-container">
      {/* Background Blobs */}
      <div className="pg-bg-blobs">
        <div className="pg-blob-1" />
        <div className="pg-blob-2" />
      </div>

      {/* Header / Navbar */}
      <header className="pg-header">
        <div className="pg-header-top">
          <button 
            type="button" 
            className="pg-back-btn" 
            onClick={() => navigate('/')}
            aria-label="Kembali ke Beranda"
          >
            <ChevronLeft size={18} />
            <span>Kembali ke Beranda</span>
          </button>

          <button
            type="button"
            className="pg-theme-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            aria-label={theme === 'dark' ? 'Aktifkan Light Mode' : 'Aktifkan Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <MotionSection direction="down" className="pg-title-section">
          <div className="pg-logo-container">
            <img src="/logo.png" alt="Logo" className="pg-logo" />
          </div>
          <h1 className="pg-title">Galeri Foto {studioName || '37 Studio'}</h1>
          <p className="pg-subtitle">Jelajahi suasana latihan, perlengkapan premium, dan momen seru di studio kami.</p>
        </MotionSection>
      </header>

      <main className="pg-content">
        {/* Search Toolbar */}
        <MotionSection delay={0.1} className="pg-toolbar">
          <div className="pg-search-wrap">
            <Search className="pg-search-icon" size={18} />
            <input
              type="text"
              placeholder="Cari foto berdasarkan keterangan (misal: drum, live room)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pg-search-input"
              aria-label="Cari foto galeri"
            />
            {searchQuery && (
              <button 
                type="button" 
                className="pg-search-clear" 
                onClick={() => setSearchQuery('')}
                aria-label="Bersihkan pencarian"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="pg-search-results-text">
              Menampilkan {filteredPhotos.length} hasil pencarian untuk "{searchQuery}"
            </div>
          )}
        </MotionSection>

        {/* Gallery Grid */}
        <motion.div 
          className="pg-grid"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {filteredPhotos.map((photo, index) => (
              <motion.div
                key={photo.id}
                variants={staggerItem}
                layout
                className="pg-card-wrapper"
              >
                <MotionCard
                  className="pg-card"
                  onClick={() => setLightboxPhoto(photo)}
                >
                  <div className="pg-card-media">
                    <img src={photo.url} alt={photo.caption} loading="lazy" />
                    <div className="pg-card-overlay">
                      <span className="pg-card-caption">{photo.caption}</span>
                    </div>
                  </div>
                </MotionCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredPhotos.length === 0 && (
          <MotionSection direction="up" className="pg-empty-state">
            {searchQuery ? (
              <>
                <Search size={48} className="pg-empty-icon" />
                <h3>Tidak ada foto yang cocok</h3>
                <p>Coba kata kunci lain atau bersihkan pencarian untuk melihat semua foto.</p>
                <button type="button" className="btn-secondary" onClick={() => setSearchQuery('')}>
                  Lihat Semua Foto
                </button>
              </>
            ) : (
              <>
                <ImageIcon size={48} className="pg-empty-icon" />
                <h3>Galeri foto belum tersedia</h3>
                <p>Hubungi admin studio atau kembali lagi nanti untuk melihat koleksi foto kami.</p>
                <button type="button" className="btn-primary" onClick={() => navigate('/')}>
                  Kembali ke Beranda
                </button>
              </>
            )}
          </MotionSection>
        )}
      </main>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pg-lightbox-overlay"
            onClick={() => setLightboxPhoto(null)}
          >
            <button
              type="button"
              className="pg-lightbox-close"
              onClick={() => setLightboxPhoto(null)}
              aria-label="Tutup penampil gambar"
            >
              <X size={24} />
            </button>
            
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="pg-lightbox-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pg-lightbox-media-wrapper">
                <img src={lightboxPhoto.url} alt={lightboxPhoto.caption} />
              </div>
              <div className="pg-lightbox-footer">
                <h3>{lightboxPhoto.caption}</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicGalleryPage;
