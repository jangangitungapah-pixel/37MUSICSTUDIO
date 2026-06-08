import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowUpRight,
  BookImage,
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  Folder,
  ImageIcon,
  Images,
  LayoutGrid,
  Link2,
  Moon,
  Search,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { useGalleryStore } from '../store/useGalleryStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useThemeStore } from '../store/useThemeStore';

import './PublicGalleryPage.css';

const pageVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
  },
};

const gridVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.045,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.30, ease: [0.16, 1, 0.3, 1] },
  },
};

const PublicGalleryPage = () => {
  const navigate = useNavigate();
  const { gallery, albums } = useGalleryStore();
  const { studioName } = useSettingsStore();
  const { theme, toggleTheme } = useThemeStore();

  const [viewMode, setViewMode] = useState('photos');
  const [openAlbumId, setOpenAlbumId] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxList, setLightboxList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [touchStart, setTouchStart] = useState(null);

  const themeSwitchTimeoutRef = useRef(null);

  const resolvedStudioName = studioName || '37 Music Studio';

  const customerPhotos = useMemo(
    () => gallery.filter((photo) => photo.showToCustomer),
    [gallery]
  );

  const filteredPhotos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return customerPhotos;

    return customerPhotos.filter((photo) => {
      const caption = photo.caption || '';
      const albumName = albums.find((album) => album.id === photo.albumId)?.name || '';
      return (caption + ' ' + albumName).toLowerCase().includes(query);
    });
  }, [albums, customerPhotos, searchQuery]);

  const albumItems = useMemo(() => {
    const mappedAlbums = albums
      .map((album) => {
        const photos = customerPhotos.filter((photo) => photo.albumId === album.id);
        let coverPhoto = null;

        if (album.coverPhotoId) {
          coverPhoto =
            photos.find((photo) => photo.id === album.coverPhotoId) ||
            gallery.find((photo) => photo.id === album.coverPhotoId);
        }

        if (!coverPhoto && photos.length > 0) {
          coverPhoto = photos[0];
        }

        return {
          id: album.id,
          name: album.name,
          description: album.description,
          coverPhotoId: album.coverPhotoId,
          photos,
          photoCount: photos.length,
          cover: coverPhoto || null,
        };
      })
      .filter((album) => album.photoCount > 0);

    const uncategorizedPhotos = customerPhotos.filter((photo) => !photo.albumId);

    if (uncategorizedPhotos.length > 0) {
      mappedAlbums.push({
        id: '__uncategorized__',
        name: 'Lainnya',
        description: 'Foto studio yang belum masuk ke album tertentu.',
        photos: uncategorizedPhotos,
        photoCount: uncategorizedPhotos.length,
        cover: uncategorizedPhotos[0] || null,
      });
    }

    return mappedAlbums;
  }, [albums, customerPhotos, gallery]);

  const openAlbumData = useMemo(() => {
    if (openAlbumId === null) return null;
    return albumItems.find((album) => album.id === openAlbumId) || null;
  }, [albumItems, openAlbumId]);

  const featuredPhoto = customerPhotos[0] || null;

  const getPhotoCaption = useCallback((photo, index = 0) => {
    const caption = photo?.caption?.trim();

    if (caption) return caption;

    return 'Studio angle ' + String(index + 1).padStart(2, '0');
  }, []);

  const openLightbox = useCallback((photo, list) => {
    const safeList = list && list.length > 0 ? list : [photo];
    const index = safeList.findIndex((item) => item.id === photo.id);

    setLightboxList(safeList);
    setLightboxIndex(index >= 0 ? index : 0);
    setLightboxPhoto(photo);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxPhoto(null);
  }, []);

  const goNext = useCallback((event) => {
    event?.stopPropagation();

    if (lightboxList.length === 0) return;

    const nextIndex = (lightboxIndex + 1) % lightboxList.length;
    setLightboxIndex(nextIndex);
    setLightboxPhoto(lightboxList[nextIndex]);
  }, [lightboxIndex, lightboxList]);

  const goPrev = useCallback((event) => {
    event?.stopPropagation();

    if (lightboxList.length === 0) return;

    const prevIndex = (lightboxIndex - 1 + lightboxList.length) % lightboxList.length;
    setLightboxIndex(prevIndex);
    setLightboxPhoto(lightboxList[prevIndex]);
  }, [lightboxIndex, lightboxList]);

  const handleSwitchView = useCallback((mode) => {
    setViewMode(mode);
    setOpenAlbumId(null);
    setSearchQuery('');
  }, []);

  const handleThemeToggle = useCallback(() => {
    const rootElement = document.documentElement;
    rootElement.setAttribute('data-theme-switching', 'true');

    if (themeSwitchTimeoutRef.current) {
      window.clearTimeout(themeSwitchTimeoutRef.current);
    }

    themeSwitchTimeoutRef.current = window.setTimeout(() => {
      rootElement.removeAttribute('data-theme-switching');
      themeSwitchTimeoutRef.current = null;
    }, 180);

    toggleTheme();
  }, [toggleTheme]);

  useEffect(() => {
    return () => {
      if (themeSwitchTimeoutRef.current) {
        window.clearTimeout(themeSwitchTimeoutRef.current);
      }

      document.documentElement.removeAttribute('data-theme-switching');
    };
  }, []);

  useEffect(() => {
    if (!customerPhotos.length) return;

    const params = new URLSearchParams(window.location.search);
    const photoId = params.get('photo');

    if (!photoId) return;

    const foundPhoto = customerPhotos.find((photo) => photo.id === photoId);

    if (foundPhoto) {
      openLightbox(foundPhoto, customerPhotos);
    }
  }, [customerPhotos, openLightbox]);

  useEffect(() => {
    if (!lightboxPhoto) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') goNext(event);
      if (event.key === 'ArrowLeft') goPrev(event);
      if (event.key === 'Escape') closeLightbox();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeLightbox, goNext, goPrev, lightboxPhoto]);

  const renderEmptyState = ({ icon = 'photos', title, description, action }) => {
    const Icon = icon === 'albums' ? Folder : ImageIcon;

    return (
      <div className="pg-empty-state">
        <div className="pg-empty-icon">
          <Icon size={38} />
        </div>
        <h3>{title}</h3>
        <p>{description}</p>
        {action}
      </div>
    );
  };

  const renderGalleryGrid = (photos, contextLabel = 'galeri studio') => (
    <motion.div
      className="pg-mosaic-grid"
      variants={gridVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {photos.map((photo, index) => {
          const caption = getPhotoCaption(photo, index);

          return (
            <motion.button
              key={photo.id}
              type="button"
              variants={itemVariants}
              layout
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className={'pg-mosaic-card pg-mosaic-card-' + ((index % 8) + 1)}
              onClick={() => openLightbox(photo, photos)}
              aria-label={'Lihat foto ' + caption}
            >
              <img src={photo.url} alt={caption} loading="lazy" className="pg-mosaic-image" />
              <span className="pg-mosaic-shade" />
              <span className="pg-mosaic-border" />

              <span className="pg-mosaic-caption">
                <span className="pg-mosaic-caption-kicker">
                  <Camera size={13} />
                  {contextLabel}
                </span>
                <strong>{caption}</strong>
              </span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <div className="pg-container pg-modern-gallery">
      <div className="pg-page-bg" aria-hidden="true">
        <div className="pg-bg-image" style={featuredPhoto ? { backgroundImage: 'url(' + featuredPhoto.url + ')' } : undefined} />
        <div className="pg-bg-overlay" />
      </div>

      <header className="pg-shell pg-topbar">
        <button type="button" className="pg-brand-pill" onClick={() => navigate('/')} aria-label="Kembali ke beranda 37 Music Studio">
          <span className="pg-brand-mark">
            <img src="/logo.svg" alt="" />
          </span>
          <span>{resolvedStudioName}</span>
        </button>

        <div className="pg-header-actions">
          <button
            type="button"
            className="pg-action-btn pg-theme-btn"
            onClick={handleThemeToggle}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            aria-label={theme === 'dark' ? 'Aktifkan Light Mode' : 'Aktifkan Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button type="button" className="pg-action-btn pg-back-btn" onClick={() => navigate('/')} aria-label="Kembali ke beranda">
            <ArrowLeft size={17} />
            <span>Kembali</span>
          </button>
        </div>
      </header>

      <main className="pg-main">
        <section className="pg-shell pg-hero-section">
          <motion.div className="pg-hero-copy" variants={pageVariants} initial="hidden" animate="visible">
            <span className="pg-kicker">
              <Images size={15} />
              Public studio gallery
            </span>

            <h1>Galeri visual 37 Music Studio.</h1>

            <p>
              Lihat suasana ruangan, setup gear, dan detail studio sebelum kamu datang.
              Foto di halaman ini otomatis mengikuti pengaturan galeri admin.
            </p>

            <div className="pg-hero-stats">
              <span>
                <strong>{customerPhotos.length}</strong>
                Foto publik
              </span>
              <span>
                <strong>{albumItems.length}</strong>
                Album aktif
              </span>
              <span>
                <strong>HD</strong>
                Preview studio
              </span>
            </div>
          </motion.div>

          <motion.div className="pg-hero-preview" variants={pageVariants} initial="hidden" animate="visible">
            {featuredPhoto ? (
              <button
                type="button"
                className="pg-hero-photo-card"
                onClick={() => openLightbox(featuredPhoto, customerPhotos)}
                aria-label="Buka foto utama galeri"
              >
                <img src={featuredPhoto.url} alt={getPhotoCaption(featuredPhoto, 0)} />
                <span className="pg-hero-photo-glow" />
                <span className="pg-hero-photo-caption">
                  <Camera size={14} />
                  {getPhotoCaption(featuredPhoto, 0)}
                </span>
              </button>
            ) : (
              <div className="pg-hero-empty-card">
                <ImageIcon size={36} />
                <span>Belum ada foto publik.</span>
              </div>
            )}
          </motion.div>
        </section>

        <section className="pg-shell pg-controls-panel">
          <div className="pg-view-toggle" aria-label="Pilih mode galeri">
            <button
              type="button"
              className={viewMode === 'photos' ? 'pg-view-btn active' : 'pg-view-btn'}
              onClick={() => handleSwitchView('photos')}
            >
              <LayoutGrid size={16} />
              <span>Semua Foto</span>
            </button>

            <button
              type="button"
              className={viewMode === 'albums' ? 'pg-view-btn active' : 'pg-view-btn'}
              onClick={() => handleSwitchView('albums')}
            >
              <BookImage size={16} />
              <span>Per Album</span>
            </button>
          </div>

          {viewMode === 'photos' && (
            <div className="pg-search-wrap">
              <Search className="pg-search-icon" size={17} />
              <input
                type="text"
                placeholder="Cari caption foto..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
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

          <div className="pg-controls-meta">
            <Sparkles size={15} />
            <span>{viewMode === 'photos' ? filteredPhotos.length : albumItems.length} item tampil</span>
          </div>
        </section>

        <section className="pg-shell pg-gallery-section">
          <AnimatePresence mode="wait">
            {viewMode === 'photos' && (
              <motion.div
                key="photos"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.22 }}
              >
                <div className="pg-section-heading">
                  <div>
                    <span className="pg-section-kicker">Semua foto</span>
                    <h2>{searchQuery ? 'Hasil pencarian galeri.' : 'Suasana studio dalam frame.'}</h2>
                  </div>

                  {searchQuery && (
                    <p>
                      {filteredPhotos.length} hasil untuk <strong>{searchQuery}</strong>
                    </p>
                  )}
                </div>

                {filteredPhotos.length > 0
                  ? renderGalleryGrid(filteredPhotos, 'foto studio')
                  : renderEmptyState({
                      icon: 'photos',
                      title: searchQuery ? 'Tidak ada foto yang cocok' : 'Belum ada foto publik',
                      description: searchQuery ? 'Coba kata kunci lain atau kembali ke semua foto.' : 'Foto yang ditandai tampil ke publik dari admin akan muncul di sini.',
                      action: searchQuery ? (
                        <button type="button" className="pg-secondary-btn" onClick={() => setSearchQuery('')}>
                          Lihat Semua Foto
                        </button>
                      ) : null,
                    })}
              </motion.div>
            )}

            {viewMode === 'albums' && (
              <motion.div
                key="albums"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.22 }}
              >
                <AnimatePresence mode="wait">
                  {openAlbumId === null && (
                    <motion.div
                      key="album-list"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.22 }}
                    >
                      <div className="pg-section-heading">
                        <div>
                          <span className="pg-section-kicker">Album studio</span>
                          <h2>Pilih album yang mau kamu lihat.</h2>
                        </div>
                        <p>Album hanya menampilkan foto yang dibuka untuk publik.</p>
                      </div>

                      {albumItems.length === 0
                        ? renderEmptyState({
                            icon: 'albums',
                            title: 'Belum ada album publik',
                            description: 'Album yang memiliki foto publik akan muncul di sini.',
                            action: (
                              <button type="button" className="pg-secondary-btn" onClick={() => handleSwitchView('photos')}>
                                Lihat Semua Foto
                              </button>
                            ),
                          })
                        : (
                          <motion.div className="pg-album-grid" variants={gridVariants} initial="hidden" animate="visible">
                            {albumItems.map((album, index) => (
                              <motion.button
                                key={album.id}
                                type="button"
                                variants={itemVariants}
                                className="pg-album-card"
                                onClick={() => setOpenAlbumId(album.id)}
                                aria-label={'Buka album ' + album.name}
                              >
                                <span className="pg-album-stack" />
                                <span className="pg-album-cover">
                                  {album.cover ? (
                                    album.coverPhotoId || album.photos.length < 4 ? (
                                      <img src={album.cover.url} alt={album.name} />
                                    ) : (
                                      <span className="pg-album-collage">
                                        {album.photos.slice(0, 4).map((photo) => (
                                          <img key={photo.id} src={photo.url} alt="" />
                                        ))}
                                      </span>
                                    )
                                  ) : (
                                    <span className="pg-album-empty">
                                      <ImageIcon size={28} />
                                    </span>
                                  )}
                                  <span className="pg-album-shade" />
                                </span>

                                <span className="pg-album-info">
                                  <span>
                                    <small>Album {String(index + 1).padStart(2, '0')}</small>
                                    <strong>{album.name}</strong>
                                  </span>
                                  <em>
                                    {album.photoCount} foto
                                    <ArrowUpRight size={14} />
                                  </em>
                                </span>
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                    </motion.div>
                  )}

                  {openAlbumId !== null && openAlbumData && (
                    <motion.div
                      key={'album-' + openAlbumId}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.22 }}
                    >
                      <div className="pg-album-drilldown-header">
                        <button type="button" className="pg-album-back-btn" onClick={() => setOpenAlbumId(null)}>
                          <ChevronLeft size={17} />
                          <span>Album</span>
                        </button>

                        <div className="pg-album-drilldown-title">
                          <span className="pg-section-kicker">Album aktif</span>
                          <h2>{openAlbumData.name}</h2>
                          {openAlbumData.description && <p>{openAlbumData.description}</p>}
                        </div>

                        <span className="pg-album-count-pill">{openAlbumData.photoCount} foto</span>
                      </div>

                      {openAlbumData.photos.length > 0
                        ? renderGalleryGrid(openAlbumData.photos, openAlbumData.name)
                        : renderEmptyState({
                            icon: 'photos',
                            title: 'Album ini kosong',
                            description: 'Belum ada foto publik pada album ini.',
                          })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pg-lightbox-overlay"
            onClick={closeLightbox}
            onTouchStart={(event) => setTouchStart(event.targetTouches[0].clientX)}
            onTouchEnd={(event) => {
              if (touchStart === null) return;

              const touchEnd = event.changedTouches[0].clientX;
              const diff = touchStart - touchEnd;

              if (diff > 50) {
                goNext(event);
              } else if (diff < -50) {
                goPrev(event);
              }

              setTouchStart(null);
            }}
          >
            <div className="pg-lightbox-ambilight" style={{ backgroundImage: 'url(' + lightboxPhoto.url + ')' }} />

            <div className="pg-lightbox-topbar" onClick={(event) => event.stopPropagation()}>
              {lightboxList.length > 1 && (
                <span className="pg-lightbox-counter">
                  {lightboxIndex + 1} / {lightboxList.length}
                </span>
              )}

              <div className="pg-lightbox-actions">
                <button
                  type="button"
                  className="pg-lightbox-action-btn"
                  onClick={() => {
                    const shareUrl = window.location.origin + window.location.pathname + '?photo=' + lightboxPhoto.id;
                    navigator.clipboard.writeText(shareUrl).then(() => {
                      toast.success('Tautan foto berhasil disalin!');
                    }).catch(() => {
                      toast.error('Gagal menyalin tautan.');
                    });
                  }}
                  title="Salin tautan foto"
                >
                  <Link2 size={16} />
                </button>

                <a
                  href={lightboxPhoto.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={'studio37_foto_' + lightboxPhoto.id + '.jpg'}
                  className="pg-lightbox-action-btn"
                  title="Buka / unduh resolusi asli"
                >
                  <Download size={16} />
                </a>

                <button type="button" className="pg-lightbox-action-btn close" onClick={closeLightbox} aria-label="Tutup lightbox">
                  <X size={18} />
                </button>
              </div>
            </div>

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

            <motion.div
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              className="pg-lightbox-content"
              onClick={(event) => event.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={lightboxPhoto.id}
                  src={lightboxPhoto.url}
                  alt={getPhotoCaption(lightboxPhoto, lightboxIndex)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                />
              </AnimatePresence>

              <div className="pg-lightbox-caption">
                <span>Foto studio</span>
                <strong>{getPhotoCaption(lightboxPhoto, lightboxIndex)}</strong>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicGalleryPage;
