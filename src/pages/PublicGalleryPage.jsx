import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGalleryStore } from '../store/useGalleryStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useThemeStore } from '../store/useThemeStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Search, X, Moon, Sun, ImageIcon, 
  Folder, LayoutGrid, BookImage, Image, Link2, Download
} from 'lucide-react';
import { toast } from 'sonner';
import MotionSection from '../components/animation/MotionSection';
import { staggerContainer, staggerItem } from '../animations';
import './PublicGalleryPage.css';

const PublicGalleryPage = () => {
  const navigate = useNavigate();
  const { gallery, albums } = useGalleryStore();
  const { studioName } = useSettingsStore();
  const { theme, toggleTheme } = useThemeStore();

  // ── States ────────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState('photos');
  const [openAlbumId, setOpenAlbumId] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxList, setLightboxList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [touchStart, setTouchStart] = useState(null);

  // ── Base: only photos shown to customers ──────────────────────────────────
  const customerPhotos = useMemo(() => gallery.filter(p => p.showToCustomer), [gallery]);

  // ── Lightbox Helpers ──────────────────────────────────────────────────────
  const openLightbox = (photo, list) => {
    const idx = list.findIndex(p => p.id === photo.id);
    setLightboxList(list);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxPhoto(photo);
  };

  const closeLightbox = () => setLightboxPhoto(null);

  const goNext = (e) => {
    e.stopPropagation();
    const next = (lightboxIndex + 1) % lightboxList.length;
    setLightboxIndex(next);
    setLightboxPhoto(lightboxList[next]);
  };

  const goPrev = (e) => {
    e.stopPropagation();
    const prev = (lightboxIndex - 1 + lightboxList.length) % lightboxList.length;
    setLightboxIndex(prev);
    setLightboxPhoto(lightboxList[prev]);
  };

  // ── Effects & Memos ───────────────────────────────────────────────────────
  // Auto-open lightbox if ?photo=id query parameter is present in URL
  React.useEffect(() => {
    if (!gallery || gallery.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const photoId = params.get('photo');
    if (photoId) {
      const foundPhoto = gallery.find(p => p.id === photoId);
      if (foundPhoto && foundPhoto.showToCustomer) {
        openLightbox(foundPhoto, customerPhotos);
      }
    }
  }, [gallery, customerPhotos]);

  // ── All-photos view (with search) ─────────────────────────────────────────
  const filteredPhotos = useMemo(() => {
    if (!searchQuery.trim()) return customerPhotos;
    const q = searchQuery.toLowerCase();
    return customerPhotos.filter(p => p.caption && p.caption.toLowerCase().includes(q));
  }, [customerPhotos, searchQuery]);

  // ── Album data for album view ─────────────────────────────────────────────
  const albumItems = useMemo(() => {
    const items = albums.map(alb => {
      const photos = customerPhotos.filter(p => p.albumId === alb.id);
      let coverPhoto = null;
      if (alb.coverPhotoId) {
        coverPhoto = photos.find(p => p.id === alb.coverPhotoId) || gallery.find(p => p.id === alb.coverPhotoId);
      }
      if (!coverPhoto && photos.length > 0) {
        coverPhoto = photos[0];
      }
      return { 
        id: alb.id, 
        name: alb.name, 
        description: alb.description, 
        coverPhotoId: alb.coverPhotoId,
        photos, 
        photoCount: photos.length,
        cover: coverPhoto || null
      };
    }).filter(a => a.photoCount > 0); // only albums with customer-visible photos

    const uncatPhotos = customerPhotos.filter(p => !p.albumId);
    if (uncatPhotos.length > 0) {
      items.push({ id: '__uncategorized__', name: 'Lainnya', description: null, photos: uncatPhotos, photoCount: uncatPhotos.length, cover: uncatPhotos[0] || null });
    }
    return items;
  }, [albums, customerPhotos, gallery]);

  // Photos in the currently open album
  const openAlbumData = useMemo(() => {
    if (openAlbumId === null) return null;
    return albumItems.find(a => a.id === openAlbumId) || null;
  }, [albumItems, openAlbumId]);

  // Keyboard nav for lightbox
  React.useEffect(() => {
    if (!lightboxPhoto) return;
    const handle = (e) => {
      if (e.key === 'ArrowRight') goNext(e);
      if (e.key === 'ArrowLeft') goPrev(e);
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [lightboxPhoto, lightboxIndex, lightboxList]);

  // ── Switch view resets ─────────────────────────────────────────────────────
  const handleSwitchView = (mode) => {
    setViewMode(mode);
    setOpenAlbumId(null);
    setSearchQuery('');
  };

  // ── Shared masonry grid renderer ──────────────────────────────────────────
  const renderMasonryGrid = (photos) => (
    <motion.div
      className="pg-masonry-grid"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {photos.map(photo => (
          <motion.div
            key={photo.id}
            variants={staggerItem}
            layout
            exit={{ opacity: 0, scale: 0.9 }}
            className="pg-masonry-item"
            onClick={() => openLightbox(photo, photos)}
            role="button"
            tabIndex={0}
            aria-label={`Lihat foto`}
            onKeyDown={(e) => e.key === 'Enter' && openLightbox(photo, photos)}
          >
            <img src={photo.url} alt="" loading="lazy" />
            <div className="pg-masonry-shine" />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <div className="pg-container">
      {/* Background */}
      <div className="pg-bg-blobs">
        <div className="pg-blob-1" />
        <div className="pg-blob-2" />
      </div>

      {/* Header */}
      <header className="pg-header">
        <div className="pg-header-top">
          <button type="button" className="pg-back-btn" onClick={() => navigate('/')} aria-label="Kembali ke Beranda">
            <ChevronLeft size={18} />
            <span>Kembali</span>
          </button>
          <button type="button" className="pg-theme-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'} aria-label={theme === 'dark' ? 'Aktifkan Light Mode' : 'Aktifkan Dark Mode'}>
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
        {/* ── View Mode Toggle ───────────────────────────────────────────── */}
        <MotionSection delay={0.05} className="pg-controls-row">
          <div className="pg-view-toggle">
            <button
              className={`pg-view-btn ${viewMode === 'photos' ? 'active' : ''}`}
              onClick={() => handleSwitchView('photos')}
            >
              <LayoutGrid size={15} />
              <span>Semua Foto</span>
            </button>
            <button
              className={`pg-view-btn ${viewMode === 'albums' ? 'active' : ''}`}
              onClick={() => handleSwitchView('albums')}
            >
              <BookImage size={15} />
              <span>Per Album</span>
            </button>
          </div>

          {/* Search – only in photos view */}
          {viewMode === 'photos' && (
            <div className="pg-search-wrap">
              <Search className="pg-search-icon" size={17} />
              <input
                type="text"
                placeholder="Cari foto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pg-search-input"
                aria-label="Cari foto galeri"
              />
              {searchQuery && (
                <button type="button" className="pg-search-clear" onClick={() => setSearchQuery('')} aria-label="Bersihkan pencarian">
                  <X size={15} />
                </button>
              )}
            </div>
          )}
        </MotionSection>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* PHOTOS VIEW                                                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {viewMode === 'photos' && (
            <motion.div key="view-photos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}>
              {searchQuery && (
                <p className="pg-search-info">
                  {filteredPhotos.length} hasil untuk &ldquo;{searchQuery}&rdquo;
                </p>
              )}

              {filteredPhotos.length > 0
                ? renderMasonryGrid(filteredPhotos)
                : (
                  <div className="pg-empty-state">
                    {searchQuery ? <Search size={44} className="pg-empty-icon" /> : <ImageIcon size={44} className="pg-empty-icon" />}
                    <h3>{searchQuery ? 'Tidak ada foto yang cocok' : 'Belum ada foto'}</h3>
                    <p>{searchQuery ? 'Coba kata kunci lain.' : 'Studio belum mengunggah foto apapun.'}</p>
                    {searchQuery && <button className="pg-btn-secondary" onClick={() => setSearchQuery('')}>Lihat Semua</button>}
                  </div>
                )
              }
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* ALBUMS VIEW                                                      */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {viewMode === 'albums' && (
            <motion.div key="view-albums" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}>
              <AnimatePresence mode="wait">

                {/* Album list */}
                {openAlbumId === null && (
                  <motion.div key="album-list" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                    {albumItems.length === 0 ? (
                      <div className="pg-empty-state">
                        <Folder size={44} className="pg-empty-icon" />
                        <h3>Belum ada album</h3>
                        <p>Studio belum mengatur album foto.</p>
                        <button className="pg-btn-secondary" onClick={() => handleSwitchView('photos')}>Lihat Semua Foto</button>
                      </div>
                    ) : (
                      <motion.div className="pg-album-grid" variants={staggerContainer} initial="hidden" animate="visible">
                        {albumItems.map(alb => (
                          <motion.div
                            key={alb.id}
                            variants={staggerItem}
                            className="pg-album-card"
                            onClick={() => setOpenAlbumId(alb.id)}
                            role="button"
                            tabIndex={0}
                            aria-label={`Buka album ${alb.name}`}
                            onKeyDown={(e) => e.key === 'Enter' && setOpenAlbumId(alb.id)}
                          >
                            <div className="pg-album-cover">
                              {alb.photos.length === 0 ? (
                                <div className="pg-album-cover-empty"><Image size={32} /></div>
                              ) : (alb.coverPhotoId && alb.cover) || alb.photos.length < 4 ? (
                                <img src={alb.cover ? alb.cover.url : alb.photos[0].url} alt={alb.name} className="pg-album-cover-single" />
                              ) : (
                                <div className="pg-album-cover-collage">
                                  {alb.photos.slice(0, 4).map((p, i) => <img key={i} src={p.url} alt="" />)}
                                </div>
                              )}
                              <div className="pg-album-cover-gradient" />
                              <div className="pg-album-cover-footer">
                                <strong>{alb.name}</strong>
                                <span>{alb.photoCount} foto</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Album drill-down */}
                {openAlbumId !== null && openAlbumData && (
                  <motion.div key={`album-${openAlbumId}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.22 }}>
                    <div className="pg-album-drilldown-header">
                      <button className="pg-album-back-btn" onClick={() => setOpenAlbumId(null)} aria-label="Kembali ke daftar album">
                        <ChevronLeft size={17} />
                        <span>Album</span>
                      </button>
                      <div className="pg-album-drilldown-title">
                        <h2>{openAlbumData.name}</h2>
                        <span className="pg-album-drilldown-count">{openAlbumData.photoCount} foto</span>
                      </div>
                    </div>

                    {openAlbumData.description && (
                      <p className="pg-album-drilldown-desc">{openAlbumData.description}</p>
                    )}

                    {openAlbumData.photos.length === 0
                      ? (
                        <div className="pg-empty-state">
                          <Image size={44} className="pg-empty-icon" />
                          <h3>Album ini kosong</h3>
                        </div>
                      )
                      : renderMasonryGrid(openAlbumData.photos)
                    }
                  </motion.div>
                )}

              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="pg-lightbox-overlay"
            onClick={closeLightbox}
            onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchStart === null) return;
              const touchEnd = e.changedTouches[0].clientX;
              const diff = touchStart - touchEnd;
              if (diff > 50) {
                goNext(e);
              } else if (diff < -50) {
                goPrev(e);
              }
              setTouchStart(null);
            }}
          >
             <div className="pg-lightbox-actions" onClick={(e) => e.stopPropagation()}>
               {/* Share */}
               <button
                 type="button"
                 className="pg-lightbox-action-btn"
                 onClick={() => {
                   const shareUrl = `${window.location.origin}${window.location.pathname}?photo=${lightboxPhoto.id}`;
                   navigator.clipboard.writeText(shareUrl).then(() => {
                     toast.success('Tautan foto berhasil disalin ke papan klip!');
                   }).catch(() => {
                     toast.error('Gagal menyalin tautan.');
                   });
                 }}
                 title="Salin Tautan Foto"
               >
                 <Link2 size={16} />
               </button>

               {/* Download */}
               <a
                 href={lightboxPhoto.url}
                 target="_blank"
                 rel="noopener noreferrer"
                 download={`studio37_foto_${lightboxPhoto.id}.jpg`}
                 className="pg-lightbox-action-btn"
                 title="Buka / Unduh Resolusi Asli"
               >
                 <Download size={16} />
               </a>

               {/* Close */}
               <button type="button" className="pg-lightbox-action-btn close" onClick={closeLightbox} aria-label="Tutup">
                 <X size={18} />
               </button>
             </div>

            {/* Counter */}
            {lightboxList.length > 1 && (
              <div className="pg-lightbox-counter">{lightboxIndex + 1} / {lightboxList.length}</div>
            )}

            {/* Prev / Next */}
            {lightboxList.length > 1 && (
              <>
                <button type="button" className="pg-lightbox-nav pg-lightbox-prev" onClick={goPrev} aria-label="Foto sebelumnya">
                  <ChevronLeft size={24} />
                </button>
                <button type="button" className="pg-lightbox-nav pg-lightbox-next" onClick={goNext} aria-label="Foto berikutnya">
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Image */}
            <motion.div
              initial={{ scale: 0.94, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 10 }}
              className="pg-lightbox-content"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={lightboxPhoto.id}
                  src={lightboxPhoto.url}
                  alt=""
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                />
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicGalleryPage;
