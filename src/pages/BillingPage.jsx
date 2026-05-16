import React, { useState, useRef } from 'react';
import { useBookingStore } from '../store/useBookingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { CreditCard, Printer, CheckCircle, Clock, AlertCircle, FileText, Search, X, Share2, MessageCircle, Copy, Download, Check } from 'lucide-react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import Modal from '../components/Modal';
import './BillingPage.css';

const BillingPage = () => {
  const { bookings, updateBookingStatus, updateBooking } = useBookingStore();
  const { pricePerHour, studioName, studioAddress, studioPhone } = useSettingsStore();
  const [activeTab, setActiveTab] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const invoiceRef = useRef(null);

  // Helper functions
  const calculateTotal = (duration) => duration * pricePerHour;
  const calculateRemaining = (booking) => {
    if (booking.status === 'confirmed') return 0;
    const total = calculateTotal(booking.duration);
    return booking.status === 'dp' ? total - (booking.dpAmount || 0) : total;
  };
  const formatCurrency = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  // Stats calculation
  const totalPendapatan = bookings.reduce((sum, b) => {
    if (b.status === 'confirmed') return sum + calculateTotal(b.duration);
    if (b.status === 'dp') return sum + (b.dpAmount || 0);
    return sum;
  }, 0);

  const totalPiutang = bookings.reduce((sum, b) => sum + calculateRemaining(b), 0);
  const totalTransaksi = bookings.length;

  // Filtering
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.band.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (activeTab === 'Lunas') return b.status === 'confirmed';
    if (activeTab === 'Belum Lunas') return b.status !== 'confirmed';
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  // Actions
  const handleMarkAsPaid = (e, id) => {
    e.stopPropagation();
    updateBookingStatus(id, 'confirmed');
    // Also reset DP if any since it's fully paid now? 
    // Actually no, updateBookingStatus just sets to confirmed, which means remaining is 0.
  };

  const handleOpenInvoice = (booking) => {
    setSelectedInvoice(booking);
    setIsInvoiceModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  // Build invoice text for sharing
  const buildInvoiceText = (inv) => {
    const total = calculateTotal(inv.duration);
    const dp = inv.dpAmount || 0;
    const statusText = inv.status === 'confirmed' ? 'LUNAS' : inv.status === 'dp' ? 'DP' : 'BELUM BAYAR';
    const lines = [
      `━━━━━━━━━━━━━━━━━━`,
      `📄 INVOICE — ${studioName}`,
      `━━━━━━━━━━━━━━━━━━`,
      `No: INV-${inv.id.toString().padStart(5, '0')}`,
      `Tanggal: ${format(new Date(), 'dd MMM yyyy')}`,
      `Status: ${statusText}`,
      ``,
      `Pelanggan: ${inv.band}`,
      inv.phone ? `Telp: ${inv.phone}` : null,
      ``,
      `Layanan: Sewa Studio Latihan`,
      `Jadwal: ${format(new Date(inv.date), 'dd MMM yyyy')} • ${String(inv.hour).padStart(2, '0')}:00-${String(inv.hour + inv.duration).padStart(2, '0')}:00`,
      `Durasi: ${inv.duration} jam × ${formatCurrency(pricePerHour)}`,
      ``,
      `Subtotal: ${formatCurrency(total)}`,
      dp > 0 ? `DP: -${formatCurrency(dp)}` : null,
      `━━━━━━━━━━━━━━━━━━`,
      inv.status === 'confirmed' 
        ? `TOTAL DIBAYAR: ${formatCurrency(total)}`
        : `SISA TAGIHAN: ${formatCurrency(total - dp)}`,
      `━━━━━━━━━━━━━━━━━━`,
      ``,
      `${studioName}`,
      studioAddress,
      `Telp: ${studioPhone}`,
    ].filter(Boolean);
    return lines.join('\n');
  };

  const handleShareWhatsApp = (inv) => {
    const text = buildInvoiceText(inv);
    const phone = inv.phone ? inv.phone.replace(/\D/g, '') : '';
    const url = `https://wa.me/${phone.startsWith('0') ? '62' + phone.slice(1) : phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyText = async (inv) => {
    const text = buildInvoiceText(inv);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadImage = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `invoice-${selectedInvoice.id.toString().padStart(5, '0')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Screenshot failed:', e);
    }
  };

  const handleNativeShare = async (inv) => {
    if (!navigator.share || !invoiceRef.current) return;
    try {
      // Tampilkan indikator loading atau tangani sementara jika perlu
      const canvas = await html2canvas(invoiceRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `invoice-${inv.id.toString().padStart(5, '0')}.png`, { type: 'image/png' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Invoice ${studioName}`,
            text: `Berikut adalah lampiran invoice dari ${studioName}.`,
            files: [file]
          });
        } else {
          // Fallback ke text jika device tidak support share file
          const text = buildInvoiceText(inv);
          await navigator.share({
            title: `Invoice ${studioName}`,
            text: text,
          });
        }
      }, 'image/png');
    } catch (e) {
      console.error('Share failed:', e);
    }
  };

  return (
    <div className="billing-page">
      {/* Header Stats */}
      <div className="billing-stats-bar">
        <div className="billing-stat-card income">
          <div className="stat-icon"><CheckCircle size={24} /></div>
          <div className="stat-data">
            <span className="stat-label">Total Pendapatan</span>
            <span className="stat-value">{formatCurrency(totalPendapatan)}</span>
          </div>
        </div>
        <div className="billing-stat-card debt">
          <div className="stat-icon"><AlertCircle size={24} /></div>
          <div className="stat-data">
            <span className="stat-label">Sisa Piutang (Belum Lunas)</span>
            <span className="stat-value">{formatCurrency(totalPiutang)}</span>
          </div>
        </div>
        <div className="billing-stat-card total">
          <div className="stat-icon"><FileText size={24} /></div>
          <div className="stat-data">
            <span className="stat-label">Total Transaksi</span>
            <span className="stat-value">{totalTransaksi} <small>trx</small></span>
          </div>
        </div>
      </div>

      <div className="billing-content glass-panel">
        <div className="billing-toolbar">
          <div className="billing-tabs">
            {['Semua', 'Lunas', 'Belum Lunas'].map(tab => (
              <button 
                key={tab} 
                className={`billing-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Cari nama band..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="search-input"
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="billing-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Tanggal</th>
                <th>Penyewa</th>
                <th>Total Harga</th>
                <th>Status Pembayaran</th>
                <th>Sisa Tagihan</th>
                <th className="action-col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">Tidak ada data transaksi.</td></tr>
              ) : (
                filteredBookings.map(b => {
                  const remaining = calculateRemaining(b);
                  const total = calculateTotal(b.duration);
                  
                  return (
                    <tr key={b.id} onClick={() => handleOpenInvoice(b)}>
                      <td className="inv-id">INV-{b.id.toString().padStart(5, '0')}</td>
                      <td>{format(new Date(b.date), 'dd MMM yyyy')}</td>
                      <td className="inv-band">{b.band}</td>
                      <td className="inv-total">{formatCurrency(total)}</td>
                      <td>
                        {b.status === 'confirmed' ? (
                          <span className="status-badge paid"><CheckCircle size={12}/> Lunas</span>
                        ) : b.status === 'dp' ? (
                          <span className="status-badge partial"><Clock size={12}/> DP {formatCurrency(b.dpAmount)}</span>
                        ) : (
                          <span className="status-badge unpaid"><AlertCircle size={12}/> Belum Bayar</span>
                        )}
                      </td>
                      <td className={`inv-remaining ${remaining > 0 ? 'has-debt' : ''}`}>
                        {remaining > 0 ? formatCurrency(remaining) : '-'}
                      </td>
                      <td className="action-col">
                        <div className="row-actions">
                          {remaining > 0 && (
                            <button 
                              className="btn-sm-pay" 
                              onClick={(e) => handleMarkAsPaid(e, b.id)}
                              title="Tandai Lunas"
                            >
                              Lunasi
                            </button>
                          )}
                          <button 
                            className="icon-btn" 
                            onClick={(e) => { e.stopPropagation(); handleOpenInvoice(b); }}
                            title="Lihat Invoice"
                          >
                            <Printer size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      {selectedInvoice && (() => {
        const total = calculateTotal(selectedInvoice.duration);
        const dpPaid = selectedInvoice.dpAmount || 0;
        const amountPaid = selectedInvoice.status === 'confirmed' ? total : dpPaid;
        const remaining = selectedInvoice.status === 'confirmed' ? 0 : total - dpPaid;

        return (
        <Modal 
          isOpen={isInvoiceModalOpen} 
          onClose={() => setIsInvoiceModalOpen(false)} 
          title="Detail Invoice"
        >
          <div className="invoice-container">
            <div className="invoice-print-area" ref={invoiceRef}>
              {/* Minimal Accent */}
              <div className="invoice-accent-bar"></div>

              {/* Header */}
              <div className="invoice-header">
                <div className="invoice-brand">
                  <h2>{studioName}</h2>
                  <p>{studioAddress}</p>
                  <p>Telp: {studioPhone}</p>
                </div>
                <div className="invoice-meta">
                  <h1>INVOICE</h1>
                </div>
              </div>

              {/* Meta Info Row */}
              <div className="invoice-info-row">
                <div className="invoice-info-block">
                  <span className="info-label">No. Invoice</span>
                  <span className="info-value">INV-{selectedInvoice.id.toString().padStart(5, '0')}</span>
                </div>
                <div className="invoice-info-block">
                  <span className="info-label">Tanggal</span>
                  <span className="info-value">{format(new Date(), 'dd MMM yyyy')}</span>
                </div>
                <div className="invoice-info-block">
                  <span className="info-label">Status</span>
                  <span className={`invoice-status-badge ${selectedInvoice.status}`}>
                    {selectedInvoice.status === 'confirmed' ? 'LUNAS' : selectedInvoice.status === 'dp' ? 'DP' : 'BELUM BAYAR'}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="invoice-divider"></div>
              
              {/* Customer Info */}
              <div className="invoice-customer">
                <span className="customer-label">Ditagihkan Kepada</span>
                <h3>{selectedInvoice.band}</h3>
                {selectedInvoice.phone && <p className="customer-phone">{selectedInvoice.phone}</p>}
              </div>

              {/* Items Table */}
              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th>Deskripsi</th>
                    <th className="text-center">Durasi</th>
                    <th>Tarif</th>
                    <th className="text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <span className="item-title">Sewa Studio Latihan</span>
                      <span className="item-detail">{format(new Date(selectedInvoice.date), 'EEEE, dd MMMM yyyy')}</span>
                      <span className="item-detail">{String(selectedInvoice.hour).padStart(2, '0')}:00 — {String(selectedInvoice.hour + selectedInvoice.duration).padStart(2, '0')}:00 WIB</span>
                    </td>
                    <td className="text-center">{selectedInvoice.duration} jam</td>
                    <td>{formatCurrency(pricePerHour)}</td>
                    <td className="text-right">{formatCurrency(total)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Summary */}
              <div className="invoice-summary-wrapper">
                {selectedInvoice.status === 'confirmed' && (
                  <div className="invoice-stamp paid">
                    <span>LUNAS</span>
                  </div>
                )}
                <div className="invoice-summary">
                  <div className="invoice-summary-row">
                    <span>Subtotal</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  {dpPaid > 0 && (
                    <div className="invoice-summary-row dp-row">
                      <span>DP Dibayar</span>
                      <span className="dp-amount">− {formatCurrency(dpPaid)}</span>
                    </div>
                  )}
                  <div className="invoice-summary-row total-row">
                    <span>{selectedInvoice.status === 'confirmed' ? 'Total Dibayar' : 'Sisa Tagihan'}</span>
                    <span className="total-amount">{formatCurrency(selectedInvoice.status === 'confirmed' ? total : remaining)}</span>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="invoice-footer">
                <div className="invoice-footer-divider"></div>
                <p className="footer-thanks">Terima kasih atas kepercayaan Anda</p>
                <p className="footer-note">{studioName}</p>
              </div>
            </div>

            {/* Share & Actions */}
            <div className="invoice-actions no-print">
              <div className="invoice-share-row">
                <button className="share-btn whatsapp" onClick={() => handleShareWhatsApp(selectedInvoice)} title="Kirim via WhatsApp">
                  <MessageCircle size={16} /> WhatsApp
                </button>
                <button className="share-btn download" onClick={handleDownloadImage} title="Simpan sebagai Gambar">
                  <Download size={16} /> Gambar
                </button>
                <button className="share-btn copy" onClick={() => handleCopyText(selectedInvoice)} title="Salin Teks Invoice">
                  {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Tersalin!' : 'Salin'}
                </button>
                {navigator.share && (
                  <button className="share-btn native" onClick={() => handleNativeShare(selectedInvoice)} title="Bagikan">
                    <Share2 size={16} /> Lainnya
                  </button>
                )}
              </div>
              <div className="invoice-main-actions">
                <button className="btn-secondary" onClick={() => setIsInvoiceModalOpen(false)}>Tutup</button>
                <button className="btn-primary" onClick={handlePrint}>
                  <Printer size={16} /> Cetak / PDF
                </button>
              </div>
            </div>
          </div>
        </Modal>
        );
      })()}
    </div>
  );
};

export default BillingPage;
