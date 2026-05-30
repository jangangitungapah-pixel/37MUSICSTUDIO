import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGalleryStore } from '../store/useGalleryStore';
import { 
  Plus, Search, X, Trash2, UploadCloud, Link2, Globe, Users, 
  Loader2, FileImage, Sparkles, Check, Folder, FolderOpen,
  Settings2, LayoutGrid, BookImage, ChevronLeft, Image
} from 'lucide-react';
import Modal from '../components/Modal';
import { toast } from 'sonner';
import { staggerContainer, staggerItem } from '../animations';
import './GalleryPage.css';

const MAX_PHOTOS_LIMIT = 30;

const GalleryPage = () => {
  const { 
    gallery, albums, addPhoto, updatePhoto, deletePhoto, 
    addAlbum, deleteAlbum 
  } = useGalleryStore();
  
  // View mode: 'photos' | 'albums'
  const [viewMode, setViewMode] = useState('photos');
  // When in album view, which album is open (null = album list, albumId/'' = uncategorized)
  const [openAlbumId, setOpenAlbumId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'landing', 'customer'
  const [selectedAlbumFilter, setSelectedAlbumFilter] = useState('all');
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);

  // Lightbox state
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Album Form State
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDesc, setNewAlbumDesc] = useState('');
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);

  // Upload form state
  const [uploadTab, setUploadTab] = useState('file');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [caption, setCaption] = useState('');
  const [showOnLandingPage, setShowOnLandingPage] = useState(true);
  const [showToCustomer, setShowToCustomer] = useState(true);
  const [uploadAlbumId, setUploadAlbumId] = useState('');
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef(null);
  const dragRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // ── All-photos filtered list (used in 'photos' view mode) ──────────────────
  const filteredPhotos = useMemo(() => gallery.filter(photo => {
    const matchesSearch = !searchQuery.trim() || 
      (photo.caption && photo.caption.toLowerCase().includes(searchQuery.toLowerCase()));
    let matchesTab = true;
    if (activeTab === 'landing') matchesTab = photo.showOnLandingPage;
    else if (activeTab === 'customer') matchesTab = photo.showToCustomer;
    let matchesAlbum = true;
    if (selectedAlbumFilter === 'uncategorized') matchesAlbum = !photo.albumId;
    else if (selectedAlbumFilter !== 'all') matchesAlbum = photo.albumId === selectedAlbumFilter;
    return matchesSearch && matchesTab && matchesAlbum;
  }), [gallery, searchQuery, activeTab, selectedAlbumFilter]);

  // ── Album view helpers ─────────────────────────────────────────────────────
  // Build album items: each named album + "Tanpa Album" bucket
  const albumItems = useMemo(() => {
    const items = albums.map(alb => {
      const photos = gallery.filter(p => p.albumId === alb.id);
      return {
        id: alb.id,
        name: alb.name,
        description: alb.description,
        photoCount: photos.length,
        cover: photos[0] || null,       // first photo as cover
        photos,
      };
    });
    // Uncategorized bucket
    const uncatPhotos = gallery.filter(p => !p.albumId);
    if (uncatPhotos.length > 0) {
      items.push({
        id: '__uncategorized__',
        name: 'Tanpa Album',
        description: 'Foto yang belum dimasukkan ke album manapun',
        photoCount: uncatPhotos.length,
        cover: uncatPhotos[0] || null,
        photos: uncatPhotos,
      });
    }
    return items;
  }, [albums, gallery]);

  // Photos shown when an album is open (drill-down)
  const openAlbumData = useMemo(() => {
    if (openAlbumId === null) return null;
    return albumItems.find(a => a.id === openAlbumId) || null;
  }, [albumItems, openAlbumId]);

  // ── Image compression ──────────────────────────────────────────────────────
  const compressImage = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const MAX = 1000;
        if (width > height) { if (width > MAX) { height *= MAX / width; width = MAX; } }
        else { if (height > MAX) { width *= MAX / height; height = MAX; } }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });

  const processUploadedFiles = async (files) => {
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) { toast.error(`Berkas "${file.name}" bukan gambar.`); return false; }
      return true;
    });
    if (validFiles.length === 0) return;
    setLoading(true);
    try {
      const newFilesData = await Promise.all(validFiles.map(async (file) => {
        const compressedBase64 = await compressImage(file);
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        return {
          id: Date.now() + Math.random().toString(36).substr(2, 5),
          base64: compressedBase64,
          name: file.name,
          caption: baseName.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        };
      }));
      setSelectedFiles(prev => [...prev, ...newFilesData]);
    } catch { toast.error('Gagal memproses gambar.'); }
    finally { setLoading(false); }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) await processUploadedFiles(files);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = async (e) => {
    e.preventDefault(); setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) await processUploadedFiles(files);
  };

  const handleOpenUploadModal = () => {
    setSelectedFiles([]); setImageUrl(''); setCaption('');
    setShowOnLandingPage(true); setShowToCustomer(true);
    setUploadAlbumId(''); setUploadTab('file');
    setIsUploadModalOpen(true);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (uploadTab === 'url') {
      const finalUrl = imageUrl.trim();
      if (!finalUrl) { toast.error('Masukkan tautan URL terlebih dahulu.'); return; }
      setLoading(true);
      try {
        await addPhoto({ url: finalUrl, caption: caption.trim() || 'Foto Studio 37', showOnLandingPage, showToCustomer, albumId: uploadAlbumId });
        toast.success('Foto berhasil ditambahkan ke galeri');
        setIsUploadModalOpen(false);
      } catch (err) { toast.error('Gagal menambahkan foto: ' + err.message); }
      finally { setLoading(false); }
    } else {
      if (selectedFiles.length === 0) { toast.error('Pilih berkas foto terlebih dahulu.'); return; }
      setLoading(true);
      try {
        await Promise.all(selectedFiles.map(fileItem =>
          addPhoto({ url: fileItem.base64, caption: fileItem.caption.trim() || 'Foto Studio 37', showOnLandingPage, showToCustomer, albumId: uploadAlbumId })
        ));
        toast.success(`${selectedFiles.length} foto berhasil ditambahkan ke galeri`);
        setIsUploadModalOpen(false);
      } catch (err) { toast.error('Gagal menambahkan foto: ' + err.message); }
      finally { setLoading(false); }
    }
  };

  const handleDeletePhoto = (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus foto ini dari galeri?')) {
      deletePhoto(id);
      setLightboxPhoto(null);
      toast.success('Foto berhasil dihapus dari galeri');
    }
  };

  const handleToggleLanding = (id, currentValue) => {
    updatePhoto(id, { showOnLandingPage: !currentValue });
    setLightboxPhoto(prev => prev?.id === id ? { ...prev, showOnLandingPage: !currentValue } : prev);
    toast.success('Pengaturan Landing Page diperbarui');
  };

  const handleToggleCustomer = (id, currentValue) => {
    updatePhoto(id, { showToCustomer: !currentValue });
    setLightboxPhoto(prev => prev?.id === id ? { ...prev, showToCustomer: !currentValue } : prev);
    toast.success('Pengaturan Akses Customer diperbarui');
  };

  const handleChangeAlbum = (id, albumId) => {
    updatePhoto(id, { albumId });
    setLightboxPhoto(prev => prev?.id === id ? { ...prev, albumId } : prev);
    toast.success('Album foto berhasil diperbarui');
  };

  const handleOpenLightbox = (photo) => { setLightboxPhoto(photo); setIsSettingsOpen(false); };

  const handleCreateAlbumSubmit = async (e) => {
    e.preventDefault();
    if (!newAlbumName.trim()) { toast.error('Nama album tidak boleh kosong.'); return; }
    setIsCreatingAlbum(true);
    try {
      await addAlbum({ name: newAlbumName.trim(), description: newAlbumDesc.trim() });
      toast.success('Album baru berhasil dibuat');
      setNewAlbumName(''); setNewAlbumDesc('');
    } catch (err) { toast.error('Gagal membuat album: ' + err.message); }
    finally { setIsCreatingAlbum(false); }
  };

  const handleDeleteAlbum = async (albumId, name) => {
    if (window.confirm(`Apakah Anda yakin menghapus album "${name}"? Foto di dalamnya tidak terhapus (diubah menjadi Tanpa Album).`)) {
      try {
        await deleteAlbum(albumId);
        toast.success(`Album "${name}" berhasil dihapus`);
        if (selectedAlbumFilter === albumId) setSelectedAlbumFilter('all');
        if (openAlbumId === albumId) setOpenAlbumId(null);
      } catch (err) { toast.error('Gagal menghapus album: ' + err.message); }
    }
  };

  // ── Switch view mode ───────────────────────────────────────────────────────
  const handleSwitchView = (mode) => {
    setViewMode(mode);
    setOpenAlbumId(null); // reset drill-down
    setSearchQuery('');
  };

  // ── Renders ────────────────────────────────────────────────────────────────
  return (
    <div className="app-page gallery-page">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="app-page-header">
        <div>
          <h2 className="app-page-title">Galeri Foto Studio</h2>
          <p className="app-page-subtitle">Unggah, kelola, dan atur tampilan foto studio pada media promosi customer</p>
        </div>
        <div className="app-page-actions" style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={() => setIsAlbumModalOpen(true)}>
            <FolderOpen size={16} />
            <span>Kelola Album</span>
          </button>
          <button className="btn-primary" onClick={handleOpenUploadModal}>
            <Plus size={16} />
            <span>Tambah Foto</span>
          </button>
        </div>
      </div>

      {/* ── Storage Overview ─────────────────────────────────────────────────── */}
      <div className="app-panel gallery-overview-panel">
        <div className="gallery-overview-content">
          <div className="overview-icon-wrap">
            <Sparkles size={22} className="sparkles-icon" />
          </div>
          <div>
            <h3>Kapasitas Penyimpanan Galeri</h3>
            <p>Terisi {gallery.length} dari maksimal {MAX_PHOTOS_LIMIT} slot foto yang direkomendasikan untuk kecepatan loading optimal.</p>
          </div>
        </div>
        <div className="gallery-progressbar-container">
          <div className="gallery-progressbar" style={{ width: `${Math.min((gallery.length / MAX_PHOTOS_LIMIT) * 100, 100)}%` }} />
        </div>
      </div>

      {/* ── View Mode Toggle + Toolbar ────────────────────────────────────────── */}
      <div className="gallery-toolbar-row" style={{ marginTop: '24px' }}>
        {/* Left: view toggle */}
        <div className="gallery-view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'photos' ? 'active' : ''}`}
            onClick={() => handleSwitchView('photos')}
            title="Tampilan Semua Foto"
          >
            <LayoutGrid size={15} />
            <span>Semua Foto</span>
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'albums' ? 'active' : ''}`}
            onClick={() => handleSwitchView('albums')}
            title="Tampilan Per Album"
          >
            <BookImage size={15} />
            <span>Per Album</span>
          </button>
        </div>

        {/* Right side: only show filters in 'photos' view */}
        {viewMode === 'photos' && (
          <div className="gallery-filters-right">
            <div className="gallery-filter-tabs">
              <button className={`gallery-filter-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
                Semua ({gallery.length})
              </button>
              <button className={`gallery-filter-btn ${activeTab === 'landing' ? 'active' : ''}`} onClick={() => setActiveTab('landing')}>
                Landing ({gallery.filter(p => p.showOnLandingPage).length})
              </button>
              <button className={`gallery-filter-btn ${activeTab === 'customer' ? 'active' : ''}`} onClick={() => setActiveTab('customer')}>
                Customer ({gallery.filter(p => p.showToCustomer).length})
              </button>
            </div>

            <div className="app-search app-search-md">
              <Search className="app-search-icon" />
              <input
                type="text"
                className="app-search-input"
                placeholder="Cari foto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Cari foto galeri"
              />
              {searchQuery && (
                <button type="button" className="app-search-clear" onClick={() => setSearchQuery('')} aria-label="Bersihkan pencarian">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PHOTOS VIEW                                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {viewMode === 'photos' && (
          <motion.div
            key="view-photos"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {filteredPhotos.length > 0 && (
              <p className="gallery-count-info">
                {filteredPhotos.length} foto • Klik foto untuk preview &amp; pengaturan
              </p>
            )}

            <motion.div
              className="photo-masonry-grid"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence>
                {filteredPhotos.map(photo => (
                  <motion.div
                    layout
                    variants={staggerItem}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={photo.id}
                    className="photo-masonry-item"
                    onClick={() => handleOpenLightbox(photo)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Lihat foto: ${photo.caption}`}
                    onKeyDown={(e) => e.key === 'Enter' && handleOpenLightbox(photo)}
                  >
                    <img src={photo.url} alt={photo.caption} loading="lazy" />
                    <div className="photo-masonry-badges">
                      {photo.showOnLandingPage && <span className="photo-badge badge-landing" title="Tampil di Landing Page"><Globe size={9} /></span>}
                      {photo.showToCustomer && <span className="photo-badge badge-customer" title="Tampil ke Customer"><Users size={9} /></span>}
                    </div>
                    <div className="photo-masonry-overlay">
                      <span className="photo-masonry-caption">{photo.caption}</span>
                      <span className="photo-masonry-hint"><Settings2 size={12} /> Klik untuk pengaturan</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {filteredPhotos.length === 0 && (
              <div className="gallery-empty-state app-panel">
                <FileImage size={48} className="empty-state-icon" />
                <h3>Tidak ada foto ditemukan</h3>
                <p>Mulailah menambahkan foto studio Anda untuk menghias halaman promosi publik.</p>
                <button className="btn-primary" onClick={handleOpenUploadModal} style={{ marginTop: '12px' }}>
                  <Plus size={16} /><span>Tambah Foto Sekarang</span>
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ALBUMS VIEW                                                         */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {viewMode === 'albums' && (
          <motion.div
            key="view-albums"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <AnimatePresence mode="wait">

              {/* ── Album list ─────────────────────────────────────────────── */}
              {openAlbumId === null && (
                <motion.div
                  key="album-list"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.22 }}
                >
                  <p className="gallery-count-info">
                    {albumItems.length} album • {gallery.length} foto total
                  </p>

                  {albumItems.length === 0 ? (
                    <div className="gallery-empty-state app-panel">
                      <FolderOpen size={48} className="empty-state-icon" />
                      <h3>Belum ada album</h3>
                      <p>Buat album terlebih dahulu melalui tombol "Kelola Album", lalu atur foto ke dalam album.</p>
                      <button className="btn-secondary" onClick={() => setIsAlbumModalOpen(true)} style={{ marginTop: '12px' }}>
                        <FolderOpen size={16} /><span>Kelola Album</span>
                      </button>
                    </div>
                  ) : (
                    <motion.div
                      className="album-grid"
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                    >
                      {albumItems.map((alb) => (
                        <motion.div
                          key={alb.id}
                          variants={staggerItem}
                          className="album-card"
                          onClick={() => setOpenAlbumId(alb.id)}
                          role="button"
                          tabIndex={0}
                          aria-label={`Buka album ${alb.name}`}
                          onKeyDown={(e) => e.key === 'Enter' && setOpenAlbumId(alb.id)}
                        >
                          {/* Cover photo collage */}
                          <div className="album-cover">
                            {alb.photos.length === 0 ? (
                              <div className="album-cover-empty">
                                <Image size={32} />
                              </div>
                            ) : alb.photos.length < 4 ? (
                              <img src={alb.cover.url} alt={alb.name} className="album-cover-single" />
                            ) : (
                              <div className="album-cover-collage">
                                {alb.photos.slice(0, 4).map((p, i) => (
                                  <img key={i} src={p.url} alt="" />
                                ))}
                              </div>
                            )}
                            <div className="album-cover-overlay">
                              <span className="album-photo-count">{alb.photoCount} foto</span>
                            </div>
                          </div>
                          <div className="album-card-info">
                            <Folder size={13} className={alb.id === '__uncategorized__' ? 'icon-muted' : 'icon-landing'} />
                            <div className="album-card-text">
                              <strong>{alb.name}</strong>
                              {alb.description && <span>{alb.description}</span>}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* ── Album drill-down (photos inside album) ─────────────────── */}
              {openAlbumId !== null && openAlbumData && (
                <motion.div
                  key={`album-${openAlbumId}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.22 }}
                >
                  {/* Back + album header */}
                  <div className="album-drilldown-header">
                    <button
                      className="album-back-btn"
                      onClick={() => setOpenAlbumId(null)}
                      aria-label="Kembali ke daftar album"
                    >
                      <ChevronLeft size={18} />
                      <span>Semua Album</span>
                    </button>
                    <div className="album-drilldown-title">
                      <Folder size={16} className="icon-landing" />
                      <h3>{openAlbumData.name}</h3>
                      <span className="album-drilldown-count">{openAlbumData.photoCount} foto</span>
                    </div>
                    {/* Only show delete for real albums (not uncategorized) */}
                    {openAlbumId !== '__uncategorized__' && (
                      <button
                        className="photo-delete-btn"
                        style={{ flex: 'none', padding: '7px 14px', borderRadius: '10px' }}
                        onClick={() => handleDeleteAlbum(openAlbumId, openAlbumData.name)}
                        title="Hapus Album"
                      >
                        <Trash2 size={14} />
                        <span>Hapus Album</span>
                      </button>
                    )}
                  </div>

                  {openAlbumData.description && (
                    <p className="album-drilldown-desc">{openAlbumData.description}</p>
                  )}

                  {openAlbumData.photos.length === 0 ? (
                    <div className="gallery-empty-state app-panel">
                      <Image size={48} className="empty-state-icon" />
                      <h3>Album ini kosong</h3>
                      <p>Tambahkan foto ke album ini melalui pengaturan pada tiap foto.</p>
                    </div>
                  ) : (
                    <>
                      <p className="gallery-count-info" style={{ marginTop: '16px' }}>
                        {openAlbumData.photos.length} foto • Klik foto untuk preview &amp; pengaturan
                      </p>
                      <motion.div
                        className="photo-masonry-grid"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                      >
                        {openAlbumData.photos.map(photo => (
                          <motion.div
                            layout
                            variants={staggerItem}
                            key={photo.id}
                            className="photo-masonry-item"
                            onClick={() => handleOpenLightbox(photo)}
                            role="button"
                            tabIndex={0}
                            aria-label={`Lihat foto: ${photo.caption}`}
                            onKeyDown={(e) => e.key === 'Enter' && handleOpenLightbox(photo)}
                          >
                            <img src={photo.url} alt={photo.caption} loading="lazy" />
                            <div className="photo-masonry-badges">
                              {photo.showOnLandingPage && <span className="photo-badge badge-landing" title="Tampil di Landing Page"><Globe size={9} /></span>}
                              {photo.showToCustomer && <span className="photo-badge badge-customer" title="Tampil ke Customer"><Users size={9} /></span>}
                            </div>
                            <div className="photo-masonry-overlay">
                              <span className="photo-masonry-caption">{photo.caption}</span>
                              <span className="photo-masonry-hint"><Settings2 size={12} /> Klik untuk pengaturan</span>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add Photo Modal ────────────────────────────────────────────────── */}
      <Modal isOpen={isUploadModalOpen} onClose={() => !loading && setIsUploadModalOpen(false)} title="Tambah Foto Galeri">
        <form className="gallery-upload-form" onSubmit={handleUploadSubmit}>
          <div className="upload-tabs-container">
            <button type="button" className={`upload-tab-btn ${uploadTab === 'file' ? 'active' : ''}`} onClick={() => !loading && setUploadTab('file')}>
              <UploadCloud size={16} /><span>Unggah File</span>
            </button>
            <button type="button" className={`upload-tab-btn ${uploadTab === 'url' ? 'active' : ''}`} onClick={() => !loading && setUploadTab('url')}>
              <Link2 size={16} /><span>Tautan URL</span>
            </button>
          </div>

          <div className="upload-tab-content">
            {uploadTab === 'file' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  ref={dragRef}
                  className={`drag-upload-zone ${isDragging ? 'dragging' : ''} ${selectedFiles.length > 0 ? 'compact' : ''}`}
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  onClick={() => !loading && fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple style={{ display: 'none' }} disabled={loading} />
                  <div className="drag-instructions">
                    {loading ? <Loader2 size={24} className="spinner" /> : <UploadCloud size={24} className="upload-icon" />}
                    {selectedFiles.length > 0
                      ? <p className="drag-title">Klik atau seret file ke sini untuk menambah foto</p>
                      : <><p className="drag-title">Drag & drop foto ke sini, atau klik untuk memilih</p>
                          <p className="drag-subtitle">Bisa memilih banyak foto sekaligus (maks. 5MB per berkas). Otomatis dikompresi di sisi klien.</p></>}
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="upload-queue-container">
                    <div className="upload-queue-header">
                      <span>Daftar Unggahan ({selectedFiles.length} foto)</span>
                      <button type="button" className="clear-queue-btn" onClick={() => setSelectedFiles([])} disabled={loading}>Hapus Semua</button>
                    </div>
                    <div className="upload-queue-list">
                      {selectedFiles.map((fileItem) => (
                        <div key={fileItem.id} className="upload-queue-item">
                          <div className="queue-thumbnail"><img src={fileItem.base64} alt={fileItem.name} /></div>
                          <div className="queue-details">
                            <span className="queue-filename" title={fileItem.name}>{fileItem.name}</span>
                            <input
                              type="text" className="bf-input queue-caption-input"
                              placeholder="Masukkan keterangan foto..."
                              value={fileItem.caption}
                              onChange={(e) => setSelectedFiles(prev => prev.map(item => item.id === fileItem.id ? { ...item, caption: e.target.value } : item))}
                              disabled={loading} maxLength={80} required
                            />
                          </div>
                          <button type="button" className="queue-remove-btn" onClick={() => setSelectedFiles(prev => prev.filter(item => item.id !== fileItem.id))} disabled={loading} title="Hapus foto ini">
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="gallery-image-url" className="bf-label">Tautan URL Gambar <span className="bf-required">*</span></label>
                <input id="gallery-image-url" type="url" className="bf-input" placeholder="Contoh: https://images.unsplash.com/photo-..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} disabled={loading} required={uploadTab === 'url'} />
                {imageUrl && (
                  <div className="url-preview-container">
                    <img src={imageUrl} alt="Pratinjau URL" onError={(e) => { e.target.style.display = 'none'; toast.error('URL gambar tidak valid.'); }} onLoad={(e) => { e.target.style.display = 'block'; }} />
                  </div>
                )}
              </div>
            )}
          </div>

          {uploadTab === 'url' && (
            <div className="form-group" style={{ marginTop: '8px' }}>
              <label htmlFor="gallery-caption" className="bf-label">Keterangan Foto <span className="bf-required">*</span></label>
              <input id="gallery-caption" type="text" className="bf-input" placeholder="Misal: Studio 37 Rehearsal Room" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={80} required={uploadTab === 'url'} disabled={loading} />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="upload-photo-album" className="bf-label">Masukkan Ke Album (Opsional)</label>
            <select id="upload-photo-album" className="bf-input" value={uploadAlbumId} onChange={(e) => setUploadAlbumId(e.target.value)} disabled={loading}>
              <option value="">Tanpa Album (Uncategorized)</option>
              {albums.map(alb => <option key={alb.id} value={alb.id}>{alb.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="bf-label">Lokasi Penayangan</label>
            <div className="modal-toggles-grid">
              <label className={`modal-toggle-card ${showOnLandingPage ? 'selected' : ''}`}>
                <input type="checkbox" checked={showOnLandingPage} onChange={() => setShowOnLandingPage(!showOnLandingPage)} disabled={loading} />
                <span className="toggle-indicator">{showOnLandingPage ? <Check size={14} /> : null}</span>
                <div><strong>Pajang di Landing Page</strong><p>Akan muncul di beranda publik landing page.</p></div>
              </label>
              <label className={`modal-toggle-card ${showToCustomer ? 'selected' : ''}`}>
                <input type="checkbox" checked={showToCustomer} onChange={() => setShowToCustomer(!showToCustomer)} disabled={loading} />
                <span className="toggle-indicator">{showToCustomer ? <Check size={14} /> : null}</span>
                <div><strong>Tampilkan ke Customer</strong><p>Muncul di galeri umum (Lihat Semua) &amp; jadwal publik.</p></div>
              </label>
            </div>
          </div>

          <div className="bf-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsUploadModalOpen(false)} disabled={loading}>Batal</button>
            <button type="submit" className="btn-primary" disabled={loading || (uploadTab === 'file' && selectedFiles.length === 0) || (uploadTab === 'url' && !imageUrl)}>
              {loading ? <Loader2 size={16} className="spinner" /> : null}
              {loading ? ' Memproses...' : 'Tambahkan ke Galeri'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Album Management Modal ────────────────────────────────────────── */}
      <Modal isOpen={isAlbumModalOpen} onClose={() => !isCreatingAlbum && setIsAlbumModalOpen(false)} title="Kelola Album Galeri">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <form onSubmit={handleCreateAlbumSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>Buat Album Baru</h4>
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="new-album-name" className="bf-label" style={{ fontSize: '0.85rem' }}>Nama Album <span className="bf-required">*</span></label>
              <input id="new-album-name" type="text" className="bf-input" placeholder="Contoh: Suasana Studio A" value={newAlbumName} onChange={(e) => setNewAlbumName(e.target.value)} maxLength={40} required disabled={isCreatingAlbum} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="new-album-desc" className="bf-label" style={{ fontSize: '0.85rem' }}>Deskripsi Singkat</label>
              <input id="new-album-desc" type="text" className="bf-input" placeholder="Misal: Foto-foto live room utama" value={newAlbumDesc} onChange={(e) => setNewAlbumDesc(e.target.value)} maxLength={80} disabled={isCreatingAlbum} />
            </div>
            <button type="submit" className="btn-primary" disabled={isCreatingAlbum} style={{ width: '100%', padding: '10px 14px', justifyContent: 'center' }}>
              {isCreatingAlbum ? <Loader2 size={16} className="spinner" /> : <Plus size={16} />}
              <span>Buat Album</span>
            </button>
          </form>

          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: '700' }}>Daftar Album ({albums.length})</h4>
            {albums.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '8px 0', textAlign: 'center' }}>Belum ada album dibuat.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                {albums.map(alb => {
                  const count = gallery.filter(p => p.albumId === alb.id).length;
                  return (
                    <div key={alb.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden' }}>
                        <span style={{ fontWeight: '600', fontSize: '0.92rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={alb.name}>{alb.name}</span>
                        {alb.description && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{alb.description}</span>}
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-pink)', fontWeight: '600' }}>🏷️ {count} Foto</span>
                      </div>
                      <button type="button" className="photo-delete-btn" onClick={() => handleDeleteAlbum(alb.id, alb.name)} style={{ padding: '6px 10px', height: 'auto', borderRadius: '8px' }} title="Hapus Album">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsAlbumModalOpen(false)} disabled={isCreatingAlbum}>Tutup</button>
          </div>
        </div>
      </Modal>

      {/* ── Lightbox with Settings Panel ────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="gallery-lightbox-overlay"
            onClick={() => { setLightboxPhoto(null); setIsSettingsOpen(false); }}
          >
            <button className="lightbox-close" onClick={() => { setLightboxPhoto(null); setIsSettingsOpen(false); }} aria-label="Tutup penampil gambar">
              <X size={24} />
            </button>
            <button
              className={`lightbox-gear-btn ${isSettingsOpen ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(v => !v); }}
              aria-label="Buka pengaturan foto" title="Pengaturan Foto"
            >
              <Settings2 size={18} />
            </button>

            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="lightbox-body"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="lightbox-image-area">
                <img src={lightboxPhoto.url} alt={lightboxPhoto.caption} />
              </div>
              <div className="lightbox-footer">
                <h3>{lightboxPhoto.caption}</h3>
                <div className="lightbox-badges">
                  {lightboxPhoto.showOnLandingPage && <span className="lightbox-badge landing"><Globe size={11} /> Landing Page</span>}
                  {lightboxPhoto.showToCustomer && <span className="lightbox-badge customer"><Users size={11} /> Akses Customer</span>}
                  {lightboxPhoto.albumId && albums.find(a => a.id === lightboxPhoto.albumId) && (
                    <span className="lightbox-badge album"><Folder size={11} /> {albums.find(a => a.id === lightboxPhoto.albumId)?.name}</span>
                  )}
                </div>
              </div>
            </motion.div>

            <AnimatePresence>
              {isSettingsOpen && (
                <motion.div
                  initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="lightbox-settings-panel"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="lsp-header"><Settings2 size={16} /><span>Pengaturan Foto</span></div>

                  <div className="lsp-section">
                    <span className="lsp-label">Keterangan</span>
                    <p className="lsp-caption-text">{lightboxPhoto.caption}</p>
                  </div>

                  <div className="lsp-section">
                    <span className="lsp-label"><Folder size={12} /> Album</span>
                    <select className="lsp-select" value={lightboxPhoto.albumId || ''} onChange={(e) => handleChangeAlbum(lightboxPhoto.id, e.target.value)}>
                      <option value="">Tanpa Album</option>
                      {albums.map(alb => <option key={alb.id} value={alb.id}>{alb.name}</option>)}
                    </select>
                  </div>

                  <div className="lsp-section">
                    <span className="lsp-label">Visibilitas</span>
                    <div className="lsp-toggle-row">
                      <div className="lsp-toggle-info">
                        <Globe size={13} className="icon-landing" />
                        <div><strong>Landing Page</strong><p>Tampil di beranda publik</p></div>
                      </div>
                      <button className={`gallery-switch ${lightboxPhoto.showOnLandingPage ? 'active' : ''}`} onClick={() => handleToggleLanding(lightboxPhoto.id, lightboxPhoto.showOnLandingPage)} aria-label="Toggle Landing Page">
                        <span className="switch-dot" />
                      </button>
                    </div>
                    <div className="lsp-toggle-row">
                      <div className="lsp-toggle-info">
                        <Users size={13} className="icon-customer" />
                        <div><strong>Akses Customer</strong><p>Tampil di galeri publik</p></div>
                      </div>
                      <button className={`gallery-switch ${lightboxPhoto.showToCustomer ? 'active' : ''}`} onClick={() => handleToggleCustomer(lightboxPhoto.id, lightboxPhoto.showToCustomer)} aria-label="Toggle Akses Customer">
                        <span className="switch-dot" />
                      </button>
                    </div>
                  </div>

                  <div className="lsp-section lsp-danger-zone">
                    <button className="lsp-delete-btn" onClick={() => handleDeletePhoto(lightboxPhoto.id)}>
                      <Trash2 size={15} /><span>Hapus Foto Ini</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryPage;
