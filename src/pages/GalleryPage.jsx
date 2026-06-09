import { useState, useMemo, useRef, useEffect } from 'react';
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
    addAlbum, deleteAlbum, updateAlbum
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

  // Keep global mobile shell below Gallery lightbox.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    document.body.classList.toggle('gallery-lightbox-open', Boolean(lightboxPhoto));

    return () => {
      document.body.classList.remove('gallery-lightbox-open');
    };
  }, [lightboxPhoto]);
  
  // Album Form State
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDesc, setNewAlbumDesc] = useState('');
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);

  // Bulk actions & Reorder State
  const [isBulkSelectActive, setIsBulkSelectActive] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  const [isReorderActive, setIsReorderActive] = useState(false);
  const [draggedPhotoId, setDraggedPhotoId] = useState(null);

  // Inline album editing state
  const [editingAlbumId, setEditingAlbumId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingDesc, setEditingDesc] = useState('');

  const handleSaveAlbumEdit = async (albumId) => {
    if (!editingName.trim()) {
      toast.error('Nama album tidak boleh kosong.');
      return;
    }
    try {
      await updateAlbum(albumId, { name: editingName.trim(), description: editingDesc.trim() });
      toast.success('Album berhasil diperbarui');
      setEditingAlbumId(null);
    } catch (err) {
      toast.error('Gagal memperbarui album: ' + err.message);
    }
  };

  // Drag and Drop handlers
  const handlePhotoDragStart = (e, photoId) => {
    if (!isReorderActive) return;
    setDraggedPhotoId(photoId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handlePhotoDragOver = (e) => {
    e.preventDefault();
  };

  const handlePhotoDrop = async (e, targetPhotoId) => {
    e.preventDefault();
    if (!draggedPhotoId || draggedPhotoId === targetPhotoId) return;

    // Move dragged item in list
    const reorderedPhotos = [...filteredPhotos];
    const draggedIdx = reorderedPhotos.findIndex(p => p.id === draggedPhotoId);
    const targetIdx = reorderedPhotos.findIndex(p => p.id === targetPhotoId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const [draggedItem] = reorderedPhotos.splice(draggedIdx, 1);
    reorderedPhotos.splice(targetIdx, 0, draggedItem);

    // Re-assign order fields sequentially (0, 1, 2...)
    const updatedWithOrders = reorderedPhotos.map((photo, index) => ({
      ...photo,
      order: index
    }));

    // Optimistically update local Zustand store for instant visual feedback
    useGalleryStore.setState({ gallery: updatedWithOrders });

    try {
      await Promise.all(updatedWithOrders.map(p => 
        updatePhoto(p.id, { order: p.order })
      ));
      toast.success('Urutan foto berhasil disimpan');
    } catch (err) {
      toast.error('Gagal menyimpan urutan: ' + err.message);
    }

    setDraggedPhotoId(null);
  };
  
  // Upload form state
  const [uploadTab, setUploadTab] = useState('file');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [caption, setCaption] = useState('');
  const [showOnLandingPage, setShowOnLandingPage] = useState(true);
  const [showToCustomer, setShowToCustomer] = useState(true);
  const [uploadAlbumId, setUploadAlbumId] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  
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
        photoCount: photos.length,
        cover: coverPhoto || null,
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

  // ── Image compression — uses canvas.toBlob (async, non-blocking) ───────────
  const compressImage = (file) => new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.src = objectUrl;
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      const MAX = 1000;
      if (width > height) { if (width > MAX) { height *= MAX / width; width = MAX; } }
      else { if (height > MAX) { width *= MAX / height; height = MAX; } }
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);
      canvas.getContext('2d').drawImage(img, 0, 0, Math.round(width), Math.round(height));
      // toBlob is ASYNC — does not block the main thread (unlike toDataURL)
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Kompresi gambar gagal'));
      }, 'image/jpeg', 0.75);
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Gagal memuat gambar')); };
  });

  const processUploadedFiles = async (files) => {
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) { toast.error(`Berkas "${file.name}" bukan gambar.`); return false; }
      return true;
    });
    if (validFiles.length === 0) return;
    setLoading(true);
    setUploadProgress({ current: 0, total: validFiles.length });
    try {
      const newFilesData = [];
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setUploadProgress({ current: i + 1, total: validFiles.length });
        // compressImage now uses canvas.toBlob (async) — no main thread blocking
        const blob = await compressImage(file);
        // Create a temporary URL for preview in the queue UI
        const previewUrl = URL.createObjectURL(blob);
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        newFilesData.push({
          id: Date.now() + Math.random().toString(36).substr(2, 5),
          blob,       // actual Blob for upload
          previewUrl, // Object URL for <img> preview only
          name: file.name,
          caption: baseName.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        });
      }
      setSelectedFiles(prev => [...prev, ...newFilesData]);
    } catch (err) { toast.error('Gagal memproses gambar: ' + err.message); }
    finally { setLoading(false); setUploadProgress({ current: 0, total: 0 }); }
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
    // Revoke any lingering object URLs to avoid memory leaks
    setSelectedFiles(prev => { prev.forEach(f => f.previewUrl && URL.revokeObjectURL(f.previewUrl)); return []; });
    setImageUrl(''); setCaption('');
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
      setUploadProgress({ current: 0, total: selectedFiles.length });
      try {
        // Upload serial one by one — pass Blob directly (no base64 overhead)
        for (let i = 0; i < selectedFiles.length; i++) {
          const fileItem = selectedFiles[i];
          setUploadProgress({ current: i + 1, total: selectedFiles.length });
          await addPhoto({ file: fileItem.blob, caption: fileItem.caption.trim() || 'Foto Studio 37', showOnLandingPage, showToCustomer, albumId: uploadAlbumId });
        }
        // Cleanup preview URLs after successful upload
        selectedFiles.forEach(f => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
        toast.success(`${selectedFiles.length} foto berhasil ditambahkan ke galeri`);
        setIsUploadModalOpen(false);
      } catch (err) { toast.error('Gagal menambahkan foto: ' + err.message); }
      finally { setLoading(false); setUploadProgress({ current: 0, total: 0 }); }
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
      {/* Background Ambient Glow Blobs */}
      <div className="gallery-bg-blobs">
        <div className="gallery-blob gallery-blob-1" />
        <div className="gallery-blob gallery-blob-2" />
        <div className="gallery-blob gallery-blob-3" />
      </div>

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <header className="app-page-header gallery-command-shell">
        <div className="gallery-command-top">
          <div className="gallery-command-copy">
            <div className="gallery-command-icon" aria-hidden="true">
              <BookImage size={22} />
            </div>
            <div className="gallery-command-text">
              <span className="gallery-command-eyebrow">Gallery Control Deck</span>
              <h2 className="app-page-title">Galeri Foto Studio</h2>
              <p className="app-page-subtitle">Unggah, kelola, dan atur tampilan foto studio pada media promosi customer</p>
            </div>
          </div>

          <div className="app-page-actions gallery-action-cluster">
            <span className="gallery-command-pill" aria-label={`${gallery.length} dari ${MAX_PHOTOS_LIMIT} slot foto terpakai`}>
              {gallery.length}/{MAX_PHOTOS_LIMIT} foto
            </span>
            <button className="btn-secondary gallery-action-btn gallery-action-muted" onClick={() => setIsAlbumModalOpen(true)}>
              <FolderOpen size={16} />
              <span>Kelola Album</span>
            </button>
            <button className="btn-primary gallery-action-btn gallery-action-primary" onClick={handleOpenUploadModal}>
              <Plus size={16} />
              <span>Tambah Foto</span>
            </button>
          </div>
        </div>
      </header>
      {/* ── Storage Overview ─────────────────────────────────────────────────── */}
      <section className="app-panel gallery-overview-panel gallery-storage-panel" aria-label="Ringkasan kapasitas galeri">
        <div className="gallery-storage-main">
          <div className="gallery-overview-content">
            <div className="overview-icon-wrap gallery-storage-icon">
              <Sparkles size={22} className="sparkles-icon" />
            </div>
            <div className="gallery-storage-copy">
              <span className="gallery-storage-eyebrow">Storage Overview</span>
              <h3>Kapasitas Penyimpanan Galeri</h3>
              <p>Terisi {gallery.length} dari maksimal {MAX_PHOTOS_LIMIT} slot foto yang direkomendasikan untuk loading tetap ngebut.</p>
            </div>
          </div>

          <div className="gallery-storage-meter" aria-hidden="true">
            <span className="gallery-storage-percent">
              {Math.round(Math.min((gallery.length / MAX_PHOTOS_LIMIT) * 100, 100))}%
            </span>
            <span className="gallery-storage-label">terpakai</span>
          </div>
        </div>

        <div
          className="gallery-progressbar-container gallery-storage-progress"
          role="progressbar"
          aria-valuenow={gallery.length}
          aria-valuemin={0}
          aria-valuemax={MAX_PHOTOS_LIMIT}
          aria-label="Kapasitas foto galeri"
        >
          <div className="gallery-progressbar" style={{ width: `${Math.min((gallery.length / MAX_PHOTOS_LIMIT) * 100, 100)}%` }} />
        </div>

        <div className="gallery-storage-stats" aria-label="Statistik galeri">
          <div className="gallery-storage-stat">
            <span className="gallery-storage-stat-icon"><FileImage size={14} /></span>
            <span className="gallery-storage-stat-copy">
              <strong>{gallery.length}</strong>
              <small>Total Foto</small>
            </span>
          </div>
          <div className="gallery-storage-stat">
            <span className="gallery-storage-stat-icon landing"><Globe size={14} /></span>
            <span className="gallery-storage-stat-copy">
              <strong>{gallery.filter(p => p.showOnLandingPage).length}</strong>
              <small>Landing</small>
            </span>
          </div>
          <div className="gallery-storage-stat">
            <span className="gallery-storage-stat-icon customer"><Users size={14} /></span>
            <span className="gallery-storage-stat-copy">
              <strong>{gallery.filter(p => p.showToCustomer).length}</strong>
              <small>Customer</small>
            </span>
          </div>
          <div className="gallery-storage-stat">
            <span className="gallery-storage-stat-icon album"><FolderOpen size={14} /></span>
            <span className="gallery-storage-stat-copy">
              <strong>{albums.length}</strong>
              <small>Album</small>
            </span>
          </div>
        </div>
      </section>
      {/* ── View Mode Toggle + Toolbar ────────────────────────────────────────── */}
      <section className="gallery-toolbar-shell" aria-label="Kontrol tampilan dan filter galeri">
        <div className="gallery-toolbar-primary">
          <div className="gallery-toolbar-mode-group">
            <div className="gallery-view-toggle gallery-view-toggle-modern" role="group" aria-label="Mode tampilan galeri">
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'photos' ? 'active' : ''}`}
                onClick={() => {
                  handleSwitchView('photos');
                  setIsBulkSelectActive(false);
                  setIsReorderActive(false);
                  setSelectedPhotoIds([]);
                }}
                aria-pressed={viewMode === 'photos'}
                title="Tampilan Semua Foto"
              >
                <LayoutGrid size={15} />
                <span>Semua Foto</span>
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'albums' ? 'active' : ''}`}
                onClick={() => {
                  handleSwitchView('albums');
                  setIsBulkSelectActive(false);
                  setIsReorderActive(false);
                  setSelectedPhotoIds([]);
                }}
                aria-pressed={viewMode === 'albums'}
                title="Tampilan Per Album"
              >
                <BookImage size={15} />
                <span>Per Album</span>
              </button>
            </div>

            {viewMode === 'photos' && (
              <div className="gallery-action-mode-group" role="group" aria-label="Mode aksi foto">
                <button
                  type="button"
                  className={`view-toggle-btn gallery-mode-action-btn ${isBulkSelectActive ? 'active' : ''}`}
                  onClick={() => {
                    setIsBulkSelectActive(!isBulkSelectActive);
                    setIsReorderActive(false);
                    setSelectedPhotoIds([]);
                  }}
                  aria-pressed={isBulkSelectActive}
                  title="Pilih Beberapa Foto Sekaligus"
                >
                  <Check size={14} />
                  <span>{isBulkSelectActive ? 'Batal Pilih' : 'Pilih Massal'}</span>
                </button>
                {activeTab === 'all' && selectedAlbumFilter === 'all' && (
                  <button
                    type="button"
                    className={`view-toggle-btn gallery-mode-action-btn ${isReorderActive ? 'active' : ''}`}
                    onClick={() => {
                      setIsReorderActive(!isReorderActive);
                      setIsBulkSelectActive(false);
                      setSelectedPhotoIds([]);
                    }}
                    aria-pressed={isReorderActive}
                    title="Seret foto untuk mengubah urutan landing page"
                  >
                    <Settings2 size={14} />
                    <span>{isReorderActive ? 'Selesai Susun' : 'Susun Urutan'}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {viewMode === 'photos' && (
            <div className="gallery-toolbar-search-wrap">
              <div className="app-search app-search-md gallery-search-field">
                <Search className="app-search-icon" />
                <input
                  type="text"
                  className="app-search-input"
                  placeholder="Cari foto, caption, atau deskripsi..."
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

        {viewMode === 'photos' && (
          <div className="gallery-toolbar-secondary">
            <span className="gallery-toolbar-label">Filter tampilan</span>
            <div className="gallery-filter-tabs gallery-filter-tabs-modern" role="tablist" aria-label="Filter foto galeri">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'all'}
                className={`gallery-filter-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <span>Semua</span>
                <strong>{gallery.length}</strong>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'landing'}
                className={`gallery-filter-btn ${activeTab === 'landing' ? 'active' : ''}`}
                onClick={() => setActiveTab('landing')}
              >
                <span>Landing</span>
                <strong>{gallery.filter(p => p.showOnLandingPage).length}</strong>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'customer'}
                className={`gallery-filter-btn ${activeTab === 'customer' ? 'active' : ''}`}
                onClick={() => setActiveTab('customer')}
              >
                <span>Customer</span>
                <strong>{gallery.filter(p => p.showToCustomer).length}</strong>
              </button>
            </div>
          </div>
        )}
      </section>
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
                    className={`photo-masonry-item ${isBulkSelectActive ? 'bulk-active' : ''} ${selectedPhotoIds.includes(photo.id) ? 'selected' : ''} ${isReorderActive ? 'reorder-active' : ''} ${draggedPhotoId === photo.id ? 'dragging' : ''}`}
                    onClick={() => {
                      if (isBulkSelectActive) {
                        setSelectedPhotoIds(prev => 
                          prev.includes(photo.id) ? prev.filter(id => id !== photo.id) : [...prev, photo.id]
                        );
                      } else if (!isReorderActive) {
                        handleOpenLightbox(photo);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Lihat foto: ${photo.caption}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (isBulkSelectActive) {
                          setSelectedPhotoIds(prev => 
                            prev.includes(photo.id) ? prev.filter(id => id !== photo.id) : [...prev, photo.id]
                          );
                        } else if (!isReorderActive) {
                          handleOpenLightbox(photo);
                        }
                      }
                    }}
                    draggable={isReorderActive}
                    onDragStart={(e) => handlePhotoDragStart(e, photo.id)}
                    onDragOver={(e) => handlePhotoDragOver(e, photo.id)}
                    onDrop={(e) => handlePhotoDrop(e, photo.id)}
                  >
                    <img src={photo.url} alt={photo.caption} loading="lazy" />
                    
                    {isBulkSelectActive && (
                      <div className={`photo-bulk-checkbox ${selectedPhotoIds.includes(photo.id) ? 'checked' : ''}`}>
                        {selectedPhotoIds.includes(photo.id) && <Check size={10} color="#fff" />}
                      </div>
                    )}

                    <div className="photo-masonry-badges">
                      {photo.showOnLandingPage && <span className="photo-badge badge-landing" title="Tampil di Landing Page"><Globe size={9} /></span>}
                      {photo.showToCustomer && <span className="photo-badge badge-customer" title="Tampil ke Customer"><Users size={9} /></span>}
                    </div>
                    
                    {!isReorderActive && (
                      <div className="photo-masonry-overlay">
                        <span className="photo-masonry-caption">{photo.caption}</span>
                        <span className="photo-masonry-hint">
                          {isBulkSelectActive 
                            ? (selectedPhotoIds.includes(photo.id) ? 'Terpilih' : 'Klik untuk memilih') 
                            : <><Settings2 size={12} /> Klik untuk pengaturan</>
                          }
                        </span>
                      </div>
                    )}
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
                      className="album-grid album-grid-modern"
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                    >
                      {albumItems.map((alb) => (
                        <motion.div
                          key={alb.id}
                          variants={staggerItem}
                          className="album-card album-card-modern"
                          onClick={() => setOpenAlbumId(alb.id)}
                          role="button"
                          tabIndex={0}
                          aria-label={`Buka album ${alb.name}`}
                          onKeyDown={(e) => e.key === 'Enter' && setOpenAlbumId(alb.id)}
                        >
                          {/* Cover photo collage */}
                          <div className="album-cover album-cover-modern">
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
                          <div className="album-card-info album-card-info-modern">
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
                  <div className="album-drilldown-header album-drilldown-shell">
                    <button
                      className="album-back-btn album-back-btn-modern"
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
                        className="photo-delete-btn album-delete-btn"
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
                      <p className="gallery-count-info album-photo-count-info">
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
                            className={`photo-masonry-item ${isBulkSelectActive ? 'bulk-active' : ''} ${selectedPhotoIds.includes(photo.id) ? 'selected' : ''}`}
                            onClick={() => {
                              if (isBulkSelectActive) {
                                setSelectedPhotoIds(prev => 
                                  prev.includes(photo.id) ? prev.filter(id => id !== photo.id) : [...prev, photo.id]
                                );
                              } else {
                                handleOpenLightbox(photo);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label={`Lihat foto: ${photo.caption}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (isBulkSelectActive) {
                                  setSelectedPhotoIds(prev => 
                                    prev.includes(photo.id) ? prev.filter(id => id !== photo.id) : [...prev, photo.id]
                                  );
                                } else {
                                  handleOpenLightbox(photo);
                                }
                              }
                            }}
                          >
                            <img src={photo.url} alt={photo.caption} loading="lazy" />
                            
                            {isBulkSelectActive && (
                              <div className={`photo-bulk-checkbox ${selectedPhotoIds.includes(photo.id) ? 'checked' : ''}`}>
                                {selectedPhotoIds.includes(photo.id) && <Check size={10} color="#fff" />}
                              </div>
                            )}

                            <div className="photo-masonry-badges">
                              {photo.showOnLandingPage && <span className="photo-badge badge-landing" title="Tampil di Landing Page"><Globe size={9} /></span>}
                              {photo.showToCustomer && <span className="photo-badge badge-customer" title="Tampil ke Customer"><Users size={9} /></span>}
                            </div>
                            <div className="photo-masonry-overlay">
                              <span className="photo-masonry-caption">{photo.caption}</span>
                              <span className="photo-masonry-hint">
                                {isBulkSelectActive 
                                  ? (selectedPhotoIds.includes(photo.id) ? 'Terpilih' : 'Klik untuk memilih') 
                                  : <><Settings2 size={12} /> Klik untuk pengaturan</>
                                }
                              </span>
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
      <Modal isOpen={isUploadModalOpen} onClose={() => !loading && setIsUploadModalOpen(false)} title="Tambah Foto Galeri" className="gallery-upload-modal-shell">
        <form className="gallery-upload-form gallery-upload-form-modern" onSubmit={handleUploadSubmit}>
          <div className="upload-tabs-container gallery-upload-tabs-modern">
            <button type="button" className={`upload-tab-btn ${uploadTab === 'file' ? 'active' : ''}`} onClick={() => !loading && setUploadTab('file')}>
              <UploadCloud size={16} /><span>Unggah File</span>
            </button>
            <button type="button" className={`upload-tab-btn ${uploadTab === 'url' ? 'active' : ''}`} onClick={() => !loading && setUploadTab('url')}>
              <Link2 size={16} /><span>Tautan URL</span>
            </button>
          </div>

          <div className="upload-tab-content">
            {uploadTab === 'file' ? (
              <div className="gallery-upload-file-panel">
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
                      <button type="button" className="clear-queue-btn" onClick={() => {
                        selectedFiles.forEach(f => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
                        setSelectedFiles([]);
                      }} disabled={loading}>Hapus Semua</button>
                    </div>
                    <div className="upload-queue-list">
                      {selectedFiles.map((fileItem) => (
                        <div key={fileItem.id} className="upload-queue-item">
                          <div className="queue-thumbnail"><img src={fileItem.previewUrl} alt={fileItem.name} /></div>
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
                          <button type="button" className="queue-remove-btn" onClick={() => {
                            if (fileItem.previewUrl) URL.revokeObjectURL(fileItem.previewUrl);
                            setSelectedFiles(prev => prev.filter(item => item.id !== fileItem.id));
                          }} disabled={loading} title="Hapus foto ini">
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="form-group gallery-url-panel">
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
            <div className="form-group gallery-url-caption-group">
              <label htmlFor="gallery-caption" className="bf-label">Keterangan Foto <span className="bf-required">*</span></label>
              <input id="gallery-caption" type="text" className="bf-input" placeholder="Misal: Studio 37 Rehearsal Room" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={80} required={uploadTab === 'url'} disabled={loading} />
            </div>
          )}

          <div className="form-group gallery-upload-album-group">
            <label htmlFor="upload-photo-album" className="bf-label">Masukkan Ke Album (Opsional)</label>
            <select id="upload-photo-album" className="bf-input" value={uploadAlbumId} onChange={(e) => setUploadAlbumId(e.target.value)} disabled={loading}>
              <option value="">Tanpa Album (Uncategorized)</option>
              {albums.map(alb => <option key={alb.id} value={alb.id}>{alb.name}</option>)}
            </select>
          </div>

          <div className="form-group gallery-visibility-group">
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

          <div className="bf-actions gallery-modal-actions gallery-upload-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsUploadModalOpen(false)} disabled={loading}>Batal</button>
            <button type="submit" className="btn-primary" disabled={loading || (uploadTab === 'file' && selectedFiles.length === 0) || (uploadTab === 'url' && !imageUrl)}>
              {loading ? <Loader2 size={16} className="spinner" /> : null}
              {loading && uploadProgress.total > 1
                ? ` Mengunggah ${uploadProgress.current}/${uploadProgress.total}...`
                : loading ? ' Memproses...' : 'Tambahkan ke Galeri'
              }
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Album Management Modal ────────────────────────────────────────── */}
      <Modal isOpen={isAlbumModalOpen} onClose={() => !isCreatingAlbum && setIsAlbumModalOpen(false)} title="Kelola Album Galeri" className="gallery-album-modal-shell">
        <div className="gallery-album-manager">
          <form className="gallery-album-create-form" onSubmit={handleCreateAlbumSubmit}>
            <h4 className="gallery-modal-section-title">Buat Album Baru</h4>
            <div className="form-group gallery-compact-form-group">
              <label htmlFor="new-album-name" className="bf-label gallery-compact-label">Nama Album <span className="bf-required">*</span></label>
              <input id="new-album-name" type="text" className="bf-input" placeholder="Contoh: Suasana Live Room" value={newAlbumName} onChange={(e) => setNewAlbumName(e.target.value)} maxLength={40} required disabled={isCreatingAlbum} />
            </div>
            <div className="form-group gallery-compact-form-group">
              <label htmlFor="new-album-desc" className="bf-label gallery-compact-label">Deskripsi Singkat</label>
              <input id="new-album-desc" type="text" className="bf-input" placeholder="Misal: Foto-foto live room utama" value={newAlbumDesc} onChange={(e) => setNewAlbumDesc(e.target.value)} maxLength={80} disabled={isCreatingAlbum} />
            </div>
            <button type="submit" className="btn-primary gallery-album-create-btn" disabled={isCreatingAlbum}>
              {isCreatingAlbum ? <Loader2 size={16} className="spinner" /> : <Plus size={16} />}
              <span>Buat Album</span>
            </button>
          </form>

          <div className="gallery-album-list-section">
            <h4 className="gallery-modal-section-title">Daftar Album ({albums.length})</h4>
            {albums.length === 0 ? (
              <p className="gallery-album-empty-note">Belum ada album dibuat.</p>
            ) : (
              <div className="gallery-album-list">
                {albums.map(alb => {
                  const count = gallery.filter(p => p.albumId === alb.id).length;
                  const isEditing = editingAlbumId === alb.id;
                  return (
                    <div key={alb.id} className="gallery-album-row">
                      {isEditing ? (
                        <div className="gallery-album-edit-stack">
                          <input
                            type="text"
                            className="bf-input album-edit-input"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            maxLength={40}
                            placeholder="Nama Album"
                            autoFocus
                          />
                          <input
                            type="text"
                            className="bf-input album-edit-input album-edit-input-muted"
                            value={editingDesc}
                            onChange={(e) => setEditingDesc(e.target.value)}
                            maxLength={80}
                            placeholder="Deskripsi Album"
                          />
                          <div className="gallery-album-edit-actions">
                            <button
                              type="button"
                              className="btn-primary album-inline-btn"
                              onClick={() => handleSaveAlbumEdit(alb.id)}
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto', borderRadius: '6px' }}
                              onClick={() => setEditingAlbumId(null)}
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="gallery-album-row-copy">
                          <span className="gallery-album-row-title" title={alb.name}>{alb.name}</span>
                          {alb.description && <span className="gallery-album-row-desc">{alb.description}</span>}
                          <span className="gallery-album-row-count">🏷️ {count} Foto</span>
                        </div>
                      )}
                      
                      {!isEditing && (
                        <div className="gallery-album-row-actions">
                          <button
                            type="button"
                            className="btn-secondary album-icon-btn"
                              onClick={() => {
                                setEditingAlbumId(alb.id);
                                setEditingName(alb.name);
                                setEditingDesc(alb.description || '');
                              }}
                            title="Edit Album"
                          >
                            <Settings2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="photo-delete-btn album-icon-btn album-icon-btn-danger"
                              onClick={() => handleDeleteAlbum(alb.id, alb.name)}
                            title="Hapus Album"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="gallery-modal-actions gallery-album-footer-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsAlbumModalOpen(false)} disabled={isCreatingAlbum}>Tutup</button>
          </div>
        </div>
      </Modal>

      {/* ── Lightbox with Settings Panel ────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`gallery-lightbox-overlay gallery-lightbox-modern ${isSettingsOpen ? 'has-settings-open' : ''}`}
            onClick={() => { setLightboxPhoto(null); setIsSettingsOpen(false); }}
          >
            {/* Ambient Ambilight Glow */}
            <div className="lightbox-ambilight lightbox-ambilight-modern" style={{ backgroundImage: `url(${lightboxPhoto.url})` }} />
            <button className="lightbox-close lightbox-control-btn lightbox-close-modern" onClick={() => { setLightboxPhoto(null); setIsSettingsOpen(false); }} aria-label="Tutup penampil gambar">
              <X size={24} />
            </button>
            <button
              className={`lightbox-gear-btn lightbox-control-btn lightbox-gear-modern ${isSettingsOpen ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(v => !v); }}
              aria-label="Buka pengaturan foto" title="Pengaturan Foto"
            >
              <Settings2 size={18} />
            </button>

            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="lightbox-body lightbox-body-modern"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="lightbox-image-area lightbox-image-stage">
                <img src={lightboxPhoto.url} alt={lightboxPhoto.caption} />
              </div>
              <div className="lightbox-footer lightbox-footer-modern">
                <h3>{lightboxPhoto.caption}</h3>
                <div className="lightbox-badges lightbox-badges-modern">
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
                  className="lightbox-settings-panel lightbox-settings-panel-modern"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="lsp-header lsp-header-modern"><Settings2 size={16} /><span>Pengaturan Foto</span></div>

                  <div className="lsp-section lsp-section-modern">
                    <span className="lsp-label">Keterangan (Edit langsung)</span>
                    <input
                      type="text"
                      className="lsp-input lsp-caption-input lsp-caption-input-modern"
                      value={lightboxPhoto.caption}
                      onChange={(e) => {
                        const newCaption = e.target.value;
                        setLightboxPhoto(prev => ({ ...prev, caption: newCaption }));
                      }}
                      onBlur={() => {
                        updatePhoto(lightboxPhoto.id, { caption: lightboxPhoto.caption });
                        toast.success('Keterangan foto diperbarui');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.target.blur();
                        }
                      }}
                      maxLength={80}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--text-primary)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        marginTop: '6px'
                      }}
                    />
                  </div>

                  <div className="lsp-section lsp-section-modern">
                    <span className="lsp-label"><Folder size={12} /> Album</span>
                    <select 
                      className="lsp-select" 
                      value={lightboxPhoto.albumId || ''} 
                      onChange={(e) => {
                        handleChangeAlbum(lightboxPhoto.id, e.target.value);
                        // If album changes, unset cover
                        const alb = albums.find(a => a.id === lightboxPhoto.albumId);
                        if (alb?.coverPhotoId === lightboxPhoto.id) {
                          updateAlbum(lightboxPhoto.albumId, { coverPhotoId: '' });
                        }
                      }}
                    >
                      <option value="">Tanpa Album</option>
                      {albums.map(alb => <option key={alb.id} value={alb.id}>{alb.name}</option>)}
                    </select>
                  </div>

                  {lightboxPhoto.albumId && (
                    <div className="lsp-section lsp-section-modern">
                      <span className="lsp-label">Sampul Album</span>
                      {(() => {
                        const alb = albums.find(a => a.id === lightboxPhoto.albumId);
                        const isCover = alb?.coverPhotoId === lightboxPhoto.id;
                        return (
                          <button
                            type="button"
                            className={`btn-secondary lsp-cover-btn ${isCover ? 'is-cover' : ''}`}
                            onClick={() => {
                              if (isCover) {
                                updateAlbum(lightboxPhoto.albumId, { coverPhotoId: '' });
                                toast.success('Sampul album diubah ke default');
                              } else {
                                updateAlbum(lightboxPhoto.albumId, { coverPhotoId: lightboxPhoto.id });
                                toast.success('Foto ini dijadikan sampul album');
                              }
                            }}
                          >
                            <BookImage size={14} />
                            <span>{isCover ? 'Sampul Album Aktif' : 'Jadikan Sampul Album'}</span>
                          </button>
                        );
                      })()}
                    </div>
                  )}

                  <div className="lsp-section lsp-section-modern">
                    <span className="lsp-label">Visibilitas</span>
                    <div className="lsp-toggle-row lsp-toggle-row-modern">
                      <div className="lsp-toggle-info">
                        <Globe size={13} className="icon-landing" />
                        <div><strong>Landing Page</strong><p>Tampil di beranda publik</p></div>
                      </div>
                      <button className={`gallery-switch gallery-switch-modern ${lightboxPhoto.showOnLandingPage ? 'active' : ''}`} onClick={() => handleToggleLanding(lightboxPhoto.id, lightboxPhoto.showOnLandingPage)} aria-label="Toggle Landing Page">
                        <span className="switch-dot" />
                      </button>
                    </div>
                    <div className="lsp-toggle-row lsp-toggle-row-modern">
                      <div className="lsp-toggle-info">
                        <Users size={13} className="icon-customer" />
                        <div><strong>Akses Customer</strong><p>Tampil di galeri publik</p></div>
                      </div>
                      <button className={`gallery-switch gallery-switch-modern ${lightboxPhoto.showToCustomer ? 'active' : ''}`} onClick={() => handleToggleCustomer(lightboxPhoto.id, lightboxPhoto.showToCustomer)} aria-label="Toggle Akses Customer">
                        <span className="switch-dot" />
                      </button>
                    </div>
                  </div>

                  <div className="lsp-section lsp-section-modern lsp-danger-zone">
                    <button className="lsp-delete-btn lsp-delete-btn-modern" onClick={() => handleDeletePhoto(lightboxPhoto.id)}>
                      <Trash2 size={15} /><span>Hapus Foto Ini</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Bulk Action Bar ───────────────────────────────────────── */}
      <AnimatePresence>
        {isBulkSelectActive && selectedPhotoIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="bulk-action-bar"
          >
            <div className="bulk-action-info">
              <span>{selectedPhotoIds.length} foto terpilih</span>
            </div>
            <div className="bulk-actions-wrap">
              {/* Change album */}
              <div className="bulk-action-select-wrap">
                <Folder size={14} className="icon-landing" />
                <select
                  className="bulk-select-input"
                  onChange={async (e) => {
                    const albumId = e.target.value;
                    const albName = albumId ? (albums.find(a => a.id === albumId)?.name || 'Album') : 'Tanpa Album';
                    try {
                      await Promise.all(selectedPhotoIds.map(id => updatePhoto(id, { albumId })));
                      toast.success(`Berhasil memindahkan ${selectedPhotoIds.length} foto ke ${albName}`);
                      setSelectedPhotoIds([]);
                    } catch (err) {
                      toast.error('Gagal memindahkan foto: ' + err.message);
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled hidden>Pindahkan ke...</option>
                  <option value="">Tanpa Album</option>
                  {albums.map(alb => <option key={alb.id} value={alb.id}>{alb.name}</option>)}
                </select>
              </div>

              {/* Set Visibility */}
              <button
                type="button"
                className="bulk-action-btn"
                onClick={async () => {
                  if (window.confirm(`Tampilkan ${selectedPhotoIds.length} foto terpilih di Landing Page?`)) {
                    try {
                      await Promise.all(selectedPhotoIds.map(id => updatePhoto(id, { showOnLandingPage: true })));
                      toast.success(`Berhasil menampilkan ${selectedPhotoIds.length} foto di Landing Page`);
                      setSelectedPhotoIds([]);
                    } catch (err) {
                      toast.error('Gagal mengubah visibilitas: ' + err.message);
                    }
                  }
                }}
              >
                <Globe size={14} />
                <span>Tampilkan di Landing</span>
              </button>

              <button
                type="button"
                className="bulk-action-btn"
                onClick={async () => {
                  if (window.confirm(`Sembunyikan ${selectedPhotoIds.length} foto terpilih dari Landing Page?`)) {
                    try {
                      await Promise.all(selectedPhotoIds.map(id => updatePhoto(id, { showOnLandingPage: false })));
                      toast.success(`Berhasil menyembunyikan ${selectedPhotoIds.length} foto dari Landing Page`);
                      setSelectedPhotoIds([]);
                    } catch (err) {
                      toast.error('Gagal mengubah visibilitas: ' + err.message);
                    }
                  }
                }}
              >
                <X size={14} />
                <span>Sembunyikan Landing</span>
              </button>

              {/* Delete selected */}
              <button
                type="button"
                className="bulk-action-btn btn-danger"
                onClick={async () => {
                  if (window.confirm(`Apakah Anda yakin ingin menghapus ${selectedPhotoIds.length} foto terpilih? Tindakan ini tidak dapat dibatalkan.`)) {
                    try {
                      await Promise.all(selectedPhotoIds.map(id => deletePhoto(id)));
                      toast.success(`Berhasil menghapus ${selectedPhotoIds.length} foto`);
                      setSelectedPhotoIds([]);
                    } catch (err) {
                      toast.error('Gagal menghapus foto: ' + err.message);
                    }
                  }
                }}
              >
                <Trash2 size={14} />
                <span>Hapus Terpilih</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryPage;
