import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGalleryStore } from '../store/useGalleryStore';
import { 
  Plus, Search, X, Trash2, UploadCloud, Link2, Globe, Users, 
  Loader2, Maximize2, FileImage, Sparkles, Check
} from 'lucide-react';
import Modal from '../components/Modal';
import { toast } from 'sonner';
import { staggerContainer, staggerItem } from '../animations';
import './GalleryPage.css';

const MAX_PHOTOS_LIMIT = 30; // Visual storage warning helper

const GalleryPage = () => {
  const { gallery, addPhoto, updatePhoto, deletePhoto } = useGalleryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'landing', 'customer'
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  
  // Upload form state
  const [uploadTab, setUploadTab] = useState('file'); // 'file', 'url'
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]); // Array of { id, base64, name, caption }
  const [caption, setCaption] = useState('');
  const [showOnLandingPage, setShowOnLandingPage] = useState(true);
  const [showToCustomer, setShowToCustomer] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef(null);
  const dragRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Search & Filter Logic
  const filteredPhotos = gallery.filter(photo => {
    const matchesSearch = !searchQuery.trim() || 
      (photo.caption && photo.caption.toLowerCase().includes(searchQuery.toLowerCase()));
      
    if (activeTab === 'landing') {
      return matchesSearch && photo.showOnLandingPage;
    }
    if (activeTab === 'customer') {
      return matchesSearch && photo.showToCustomer;
    }
    return matchesSearch;
  });

  // Client-side image compression using Canvas
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to JPEG with 0.7 quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedDataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const processUploadedFiles = async (files) => {
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`Berkas "${file.name}" bukan gambar.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setLoading(true);
    try {
      const newFilesData = await Promise.all(
        validFiles.map(async (file) => {
          const compressedBase64 = await compressImage(file);
          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          const cleanCaption = baseName
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
            
          return {
            id: Date.now() + Math.random().toString(36).substr(2, 5),
            base64: compressedBase64,
            name: file.name,
            caption: cleanCaption
          };
        })
      );
      setSelectedFiles(prev => [...prev, ...newFilesData]);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memproses gambar.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    await processUploadedFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;
    await processUploadedFiles(files);
  };

  const handleOpenUploadModal = () => {
    setSelectedFiles([]);
    setImageUrl('');
    setCaption('');
    setShowOnLandingPage(true);
    setShowToCustomer(true);
    setUploadTab('file');
    setIsUploadModalOpen(true);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (uploadTab === 'url') {
      const finalUrl = imageUrl.trim();
      if (!finalUrl) {
        toast.error('Masukkan tautan URL terlebih dahulu.');
        return;
      }
      setLoading(true);
      try {
        await addPhoto({
          url: finalUrl,
          caption: caption.trim() || 'Foto Studio 37',
          showOnLandingPage,
          showToCustomer
        });
        toast.success('Foto berhasil ditambahkan ke galeri');
        setIsUploadModalOpen(false);
      } catch (err) {
        toast.error('Gagal menambahkan foto: ' + err.message);
      } finally {
        setLoading(false);
      }
    } else {
      if (selectedFiles.length === 0) {
        toast.error('Pilih berkas foto terlebih dahulu.');
        return;
      }
      setLoading(true);
      try {
        await Promise.all(
          selectedFiles.map(fileItem => 
            addPhoto({
              url: fileItem.base64,
              caption: fileItem.caption.trim() || 'Foto Studio 37',
              showOnLandingPage,
              showToCustomer
            })
          )
        );
        toast.success(`${selectedFiles.length} foto berhasil ditambahkan ke galeri`);
        setIsUploadModalOpen(false);
      } catch (err) {
        toast.error('Gagal menambahkan foto: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeletePhoto = (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus foto ini dari galeri?')) {
      deletePhoto(id);
      toast.success('Foto berhasil dihapus dari galeri');
    }
  };

  const handleToggleLanding = (id, currentValue) => {
    updatePhoto(id, { showOnLandingPage: !currentValue });
    toast.success('Pengaturan tampilan Landing Page diperbarui');
  };

  const handleToggleCustomer = (id, currentValue) => {
    updatePhoto(id, { showToCustomer: !currentValue });
    toast.success('Pengaturan tampilan Akses Customer diperbarui');
  };

  const handleOpenLightbox = (photo) => {
    setSelectedPhoto(photo);
    setIsLightboxOpen(true);
  };

  return (
    <div className="app-page gallery-page">
      {/* Header */}
      <div className="app-page-header">
        <div>
          <h2 className="app-page-title">Galeri Foto Studio</h2>
          <p className="app-page-subtitle">Unggah, kelola, dan atur tampilan foto studio pada media promosi customer</p>
        </div>
        <div className="app-page-actions">
          <button className="btn-primary" onClick={handleOpenUploadModal}>
            <Plus size={16} />
            <span>Tambah Foto</span>
          </button>
        </div>
      </div>

      {/* Quota / Performance Overview Widget */}
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
          <div 
            className="gallery-progressbar" 
            style={{ width: `${Math.min((gallery.length / MAX_PHOTOS_LIMIT) * 100, 100)}%` }} 
          />
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="app-table-toolbar" style={{ marginTop: '24px' }}>
        <div className="app-table-toolbar-left">
          <div className="gallery-filter-tabs">
            <button 
              className={`gallery-filter-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              Semua Foto ({gallery.length})
            </button>
            <button 
              className={`gallery-filter-btn ${activeTab === 'landing' ? 'active' : ''}`}
              onClick={() => setActiveTab('landing')}
            >
              Di Landing Page ({gallery.filter(p => p.showOnLandingPage).length})
            </button>
            <button 
              className={`gallery-filter-btn ${activeTab === 'customer' ? 'active' : ''}`}
              onClick={() => setActiveTab('customer')}
            >
              Tampil ke Customer ({gallery.filter(p => p.showToCustomer).length})
            </button>
          </div>
        </div>
        <div className="app-table-toolbar-right">
          <div className="app-search app-search-md">
            <Search className="app-search-icon" />
            <input 
              type="text" 
              className="app-search-input"
              placeholder="Cari foto berdasarkan keterangan..." 
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
      </div>

      {/* Photos Grid */}
      <motion.div 
        className="photo-grid"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {filteredPhotos.map(photo => (
            <motion.div 
              layout
              variants={staggerItem}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              key={photo.id}
              className="app-panel photo-card"
            >
              <div className="photo-card-media" onClick={() => handleOpenLightbox(photo)}>
                <img src={photo.url} alt={photo.caption} loading="lazy" />
                <div className="photo-card-hover-overlay">
                  <Maximize2 size={20} className="hover-expand-icon" />
                </div>
              </div>

              <div className="photo-card-info">
                <p className="photo-caption" title={photo.caption}>{photo.caption}</p>
                <span className="photo-date">📅 {photo.createdAt.split(' ')[0]}</span>
              </div>

              <div className="photo-card-toggles">
                <div className="toggle-row">
                  <div className="toggle-label-wrap">
                    <Globe size={14} className="toggle-icon-landing" />
                    <span>Landing Page</span>
                  </div>
                  <button 
                    className={`gallery-switch ${photo.showOnLandingPage ? 'active' : ''}`}
                    onClick={() => handleToggleLanding(photo.id, photo.showOnLandingPage)}
                    aria-label={`Toggle Landing Page for ${photo.caption}`}
                  >
                    <span className="switch-dot" />
                  </button>
                </div>

                <div className="toggle-row">
                  <div className="toggle-label-wrap">
                    <Users size={14} className="toggle-icon-customer" />
                    <span>Akses Customer</span>
                  </div>
                  <button 
                    className={`gallery-switch ${photo.showToCustomer ? 'active' : ''}`}
                    onClick={() => handleToggleCustomer(photo.id, photo.showToCustomer)}
                    aria-label={`Toggle Akses Customer for ${photo.caption}`}
                  >
                    <span className="switch-dot" />
                  </button>
                </div>
              </div>

              <div className="photo-card-actions">
                <button 
                  className="photo-delete-btn" 
                  onClick={() => handleDeletePhoto(photo.id)}
                  aria-label={`Hapus foto ${photo.caption}`}
                  title="Hapus foto dari galeri"
                >
                  <Trash2 size={16} />
                  <span>Hapus</span>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredPhotos.length === 0 && (
        <div className="gallery-empty-state app-panel">
          <FileImage size={48} className="empty-state-icon" />
          <h3>Tidak ada foto ditemukan</h3>
          <p>Mulailah menambahkan foto studio Anda untuk menghias halaman promosi publik.</p>
          <button className="btn-primary" onClick={handleOpenUploadModal} style={{ marginTop: '12px' }}>
            <Plus size={16} />
            <span>Tambah Foto Sekarang</span>
          </button>
        </div>
      )}

      {/* Add Photo Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={() => !loading && setIsUploadModalOpen(false)} title="Tambah Foto Galeri">
        <form className="gallery-upload-form" onSubmit={handleUploadSubmit}>
          {/* Tabs for Upload Method */}
          <div className="upload-tabs-container">
            <button 
              type="button" 
              className={`upload-tab-btn ${uploadTab === 'file' ? 'active' : ''}`}
              onClick={() => !loading && setUploadTab('file')}
            >
              <UploadCloud size={16} />
              <span>Unggah File</span>
            </button>
            <button 
              type="button" 
              className={`upload-tab-btn ${uploadTab === 'url' ? 'active' : ''}`}
              onClick={() => !loading && setUploadTab('url')}
            >
              <Link2 size={16} />
              <span>Tautan URL</span>
            </button>
          </div>

          {/* Form Content */}
          <div className="upload-tab-content">
            {uploadTab === 'file' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div 
                  ref={dragRef}
                  className={`drag-upload-zone ${isDragging ? 'dragging' : ''} ${selectedFiles.length > 0 ? 'compact' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !loading && fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    disabled={loading}
                  />
                  
                  <div className="drag-instructions">
                    {loading ? (
                      <Loader2 size={24} className="spinner" />
                    ) : (
                      <UploadCloud size={24} className="upload-icon" />
                    )}
                    {selectedFiles.length > 0 ? (
                      <p className="drag-title">Klik atau seret file ke sini untuk menambah foto</p>
                    ) : (
                      <>
                        <p className="drag-title">Drag & drop foto ke sini, atau klik untuk memilih</p>
                        <p className="drag-subtitle">Bisa memilih banyak foto sekaligus (maks. 5MB per berkas). Otomatis dikompresi di sisi klien.</p>
                      </>
                    )}
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="upload-queue-container">
                    <div className="upload-queue-header">
                      <span>Daftar Unggahan ({selectedFiles.length} foto)</span>
                      <button 
                        type="button" 
                        className="clear-queue-btn" 
                        onClick={() => setSelectedFiles([])}
                        disabled={loading}
                      >
                        Hapus Semua
                      </button>
                    </div>
                    <div className="upload-queue-list">
                      {selectedFiles.map((fileItem) => (
                        <div key={fileItem.id} className="upload-queue-item">
                          <div className="queue-thumbnail">
                            <img src={fileItem.base64} alt={fileItem.name} />
                          </div>
                          <div className="queue-details">
                            <span className="queue-filename" title={fileItem.name}>{fileItem.name}</span>
                            <input 
                              type="text" 
                              className="bf-input queue-caption-input" 
                              placeholder="Masukkan keterangan foto..."
                              value={fileItem.caption}
                              onChange={(e) => {
                                setSelectedFiles(prev => prev.map(item => 
                                  item.id === fileItem.id ? { ...item, caption: e.target.value } : item
                                ));
                              }}
                              disabled={loading}
                              maxLength={80}
                              required
                            />
                          </div>
                          <button 
                            type="button" 
                            className="queue-remove-btn" 
                            onClick={() => setSelectedFiles(prev => prev.filter(item => item.id !== fileItem.id))}
                            disabled={loading}
                            title="Hapus foto ini"
                          >
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
                <input 
                  id="gallery-image-url"
                  type="url" 
                  className="bf-input" 
                  placeholder="Contoh: https://images.unsplash.com/photo-..." 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  disabled={loading}
                  required={uploadTab === 'url'}
                />
                {imageUrl && (
                  <div className="url-preview-container">
                    <img 
                      src={imageUrl} 
                      alt="Pratinjau URL" 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        toast.error('URL gambar tidak valid atau tidak mendukung akses publik.');
                      }}
                      onLoad={(e) => {
                        e.target.style.display = 'block';
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {uploadTab === 'url' && (
            <div className="form-group" style={{ marginTop: '8px' }}>
              <label htmlFor="gallery-caption" className="bf-label">Keterangan / Keterangan Foto <span className="bf-required">*</span></label>
              <input 
                id="gallery-caption"
                type="text" 
                className="bf-input" 
                placeholder="Misal: Studio 37 Rehearsal Room" 
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={80}
                required={uploadTab === 'url'}
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <label className="bf-label">Lokasi Penayangan</label>
            <div className="modal-toggles-grid">
              <label className={`modal-toggle-card ${showOnLandingPage ? 'selected' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={showOnLandingPage} 
                  onChange={() => setShowOnLandingPage(!showOnLandingPage)}
                  disabled={loading}
                />
                <span className="toggle-indicator">
                  {showOnLandingPage ? <Check size={14} /> : null}
                </span>
                <div>
                  <strong>Pajang di Landing Page</strong>
                  <p>Akan muncul di beranda publik landing page.</p>
                </div>
              </label>

              <label className={`modal-toggle-card ${showToCustomer ? 'selected' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={showToCustomer} 
                  onChange={() => setShowToCustomer(!showToCustomer)}
                  disabled={loading}
                />
                <span className="toggle-indicator">
                  {showToCustomer ? <Check size={14} /> : null}
                </span>
                <div>
                  <strong>Tampilkan ke Customer</strong>
                  <p>Muncul di galeri umum (Lihat Semua) &amp; jadwal publik.</p>
                </div>
              </label>
            </div>
          </div>

          <div className="bf-actions" style={{ marginTop: '20px' }}>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => setIsUploadModalOpen(false)}
              disabled={loading}
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading || (uploadTab === 'file' && selectedFiles.length === 0) || (uploadTab === 'url' && !imageUrl)}
            >
              {loading ? <Loader2 size={16} className="spinner" /> : null}
              {loading ? ' Memproses...' : 'Tambahkan ke Galeri'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && selectedPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="gallery-lightbox-overlay"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button 
              className="lightbox-close" 
              onClick={() => setIsLightboxOpen(false)}
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
              <img src={selectedPhoto.url} alt={selectedPhoto.caption} />
              <div className="lightbox-footer">
                <h3>{selectedPhoto.caption}</h3>
                <div className="lightbox-badges">
                  {selectedPhoto.showOnLandingPage && <span className="lightbox-badge landing"><Globe size={11} /> Landing Page</span>}
                  {selectedPhoto.showToCustomer && <span className="lightbox-badge customer"><Users size={11} /> Akses Customer</span>}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryPage;
