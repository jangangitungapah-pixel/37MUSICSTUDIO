import { useState, useRef, useEffect } from 'react';
import { useBookingStore } from '../store/useBookingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTourStore } from '../store/useTourStore';
import { Printer, CheckCircle, AlertCircle, FileText, Search, X, Share2, MessageCircle, Copy, Download, Check, Bell } from 'lucide-react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import { getBillingInsights } from '../lib/smartInsights';
import { getDepositDeadlineStatus } from '../lib/bookingWorkflows';
import './BillingPage.css';

const BillingPage = () => {
  const { bookings, updateBookingStatus } = useBookingStore();
  const { pricePerHour, studioName, studioAddress, studioPhone } = useSettingsStore();
  const { currentStep, nextStep, run } = useTourStore();
  const [activeTab, setActiveTab] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isThermalMode, setIsThermalMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const invoiceRef = useRef(null);
  const billableBookings = bookings.filter((booking) => !['maintenance', 'cancelled'].includes(booking.status));

  // Auto-close invoice modal if user clicks Lanjut on the print step (step 7 -> 8)
  useEffect(() => {
    if (run && currentStep === 8 && isInvoiceModalOpen) {
      setIsInvoiceModalOpen(false);
    }
  }, [run, currentStep, isInvoiceModalOpen]);

  // Helper functions
  const calculateSubtotal = (booking) => (
    booking.type === 'recording'
      ? (booking.sessionPrice || 0)
      : (booking.duration * pricePerHour)
  );
  const calculateTotal = (booking) => calculateSubtotal(booking) + (booking.equipmentCost || 0) - (booking.discountAmount || 0);
  const getServiceName = (booking) => (booking.type === 'recording' ? 'Sesi Recording' : 'Sewa Studio Latihan');
  const getRateLabel = (booking) => (booking.type === 'recording' ? 'Harga Paket' : formatCurrency(pricePerHour));
  const calculateRemaining = (booking) => {
    if (booking.status === 'confirmed') return 0;
    const total = calculateTotal(booking);
    return booking.status === 'dp' ? total - (booking.dpAmount || 0) : total;
  };
  const formatCurrency = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  // Stats calculation
  const totalPendapatan = billableBookings.reduce((sum, b) => {
    if (b.status === 'confirmed') return sum + calculateTotal(b);
    if (b.status === 'dp') return sum + (b.dpAmount || 0);
    return sum;
  }, 0);

  const totalPiutang = billableBookings.reduce((sum, b) => sum + calculateRemaining(b), 0);
  const totalTransaksi = billableBookings.length;
  const billingInsights = getBillingInsights(billableBookings, pricePerHour);

  // Filtering
  const filteredBookings = billableBookings.filter(b => {
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
    if (run && currentStep === 4) setTimeout(() => nextStep(), 100);
  };

  const handleStatusChange = (e, id, newStatus) => {
    e.stopPropagation();
    updateBookingStatus(id, newStatus);
  };

  const handleOpenInvoice = (booking) => {
    setSelectedInvoice(booking);
    setIsInvoiceModalOpen(true);
    if (run && currentStep === 5) setTimeout(() => nextStep(), 100);
  };
  
  const handleCloseInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
    if (run && currentStep === 7) setTimeout(() => nextStep(), 100);
  };

  const handlePrint = () => {
    window.print();
  };

  // Build invoice text for sharing
  const buildInvoiceText = (inv) => {
    const subtotal = calculateSubtotal(inv);
    const discount = inv.discountAmount || 0;
    const total = calculateTotal(inv);
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
      `Layanan: ${getServiceName(inv)}`,
      `Jadwal: ${format(new Date(inv.date), 'dd MMM yyyy')} • ${String(inv.hour).padStart(2, '0')}:00-${String(inv.hour + inv.duration).padStart(2, '0')}:00`,
      `Durasi: ${inv.duration} jam - ${getRateLabel(inv)}`,
      ``,
      `Subtotal: ${formatCurrency(subtotal)}`,
      discount > 0 ? `Diskon VIP: -${formatCurrency(discount)}` : null,
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

  const handleSendReminder = (inv) => {
    if (!inv.phone) {
      toast.error("Nomor telepon tidak tersedia untuk jadwal ini.");
      return;
    }
    const message = `Halo ${inv.band}, sekadar mengingatkan Anda ada jadwal latihan besok tanggal ${format(new Date(inv.date), 'dd MMM yyyy')} jam ${String(inv.hour).padStart(2, '0')}:00 WIB di ${studioName}. Mohon datang tepat waktu ya! Terima kasih.`;
    const phone = inv.phone.replace(/\D/g, '');
    const url = `https://wa.me/${phone.startsWith('0') ? '62' + phone.slice(1) : phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCopyText = async (inv) => {
    const text = buildInvoiceText(inv);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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
    } catch (error) {
      console.error('Screenshot failed:', error);
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
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <div className="billing-page">
      {/* Header Stats */}
      <div className="billing-stats-bar tour-bill-stats">
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

      {/* Smart Billing Summary */}
      <div className="billing-smart-panel">
        <div className="billing-smart-main">
          <Bell size={18} />
          <div>
            <h3>Reminder Pintar</h3>
            <p>{billingInsights.summary}</p>
          </div>
        </div>
        <div className="billing-smart-list">
          {billingInsights.openInvoices.slice(0, 3).map((invoice) => (
            <div key={invoice.id} className={`billing-smart-item ${invoice.urgency}`}>
              <div>
                <strong>{invoice.band}</strong>
                <span>{invoice.daysUntil < 0 ? 'Lewat jadwal' : invoice.daysUntil === 0 ? 'Jadwal hari ini' : invoice.daysUntil === 1 ? 'Jadwal besok' : `H-${invoice.daysUntil}`}</span>
              </div>
              <small>{formatCurrency(invoice.remaining)}</small>
              <button
                className="billing-smart-btn"
                onClick={() => handleSendReminder(invoice)}
                title="Kirim reminder WhatsApp"
              >
                <MessageCircle size={14} />
              </button>
            </div>
          ))}
          {billingInsights.openInvoices.length === 0 && (
            <div className="billing-smart-empty">Tidak ada tagihan yang perlu ditindaklanjuti.</div>
          )}
        </div>
      </div>

      <div className="billing-content glass-panel">
        <div className="billing-toolbar">
          <div className="billing-tabs tour-bill-tabs">
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
          <div className="search-wrapper tour-bill-search">
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

        <div className="table-responsive tour-bill-table hide-on-mobile">
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
              ) : (() => {
                const firstUnpaidIdx = filteredBookings.findIndex(b => b.status !== 'confirmed');
                const tutorialTargetIdx = firstUnpaidIdx !== -1 ? firstUnpaidIdx : 0;

                return filteredBookings.map((b, index) => {
                  const remaining = calculateRemaining(b);
                  const total = calculateTotal(b);
                  const isTutorialRow = run && index === tutorialTargetIdx;

                  return (
                    <tr key={b.id} className={isTutorialRow && currentStep === 5 ? 'tour-bill-row' : ''} onClick={() => handleOpenInvoice(b)}>
                      <td className="inv-id">INV-{b.id.toString().padStart(5, '0')}</td>
                      <td>{format(new Date(b.date), 'dd MMM yyyy')}</td>
                      <td className="inv-band">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {b.band}
                          {b.discountAmount > 0 && <span title="VIP Discount" style={{ fontSize: '10px', background: '#FFC107', color: '#000', padding: '1px 4px', borderRadius: '4px' }}>VIP</span>}
                        </div>
                      </td>
                      <td className="inv-total">{formatCurrency(total)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <select 
                          className={`status-select ${b.status} ${isTutorialRow && currentStep === 8 ? 'tour-bill-status-select' : ''}`}
                          value={b.status}
                          onChange={(e) => handleStatusChange(e, b.id, e.target.value)}
                        >
                          <option value="pending">Belum Bayar</option>
                          <option value="dp">DP {b.dpAmount > 0 ? `(${formatCurrency(b.dpAmount)})` : ''}</option>
                          <option value="confirmed">Lunas</option>
                        </select>
                      </td>
                      <td className={`inv-remaining ${remaining > 0 ? 'has-debt' : ''}`}>
                        {remaining > 0 ? formatCurrency(remaining) : '-'}
                        {(() => {
                          const deadline = getDepositDeadlineStatus(b);
                          return deadline.state !== 'none' ? (
                            <span className={`deadline-chip ${deadline.state}`}>{deadline.label}</span>
                          ) : null;
                        })()}
                      </td>
                      <td className="action-col">
                        <div className="row-actions">
                          {remaining > 0 && (
                            <button 
                              className={`btn-sm-pay ${isTutorialRow && currentStep === 4 ? 'tour-bill-btn-pay' : ''}`} 
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
                });
              })()}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="mobile-billing-list show-on-mobile">
          {filteredBookings.length === 0 ? (
            <div className="empty-state" style={{padding: '32px', textAlign: 'center', color: 'var(--text-muted)'}}>
              Tidak ada data transaksi.
            </div>
          ) : filteredBookings.map(b => {
            const remaining = calculateRemaining(b);
            const total = calculateTotal(b);
            return (
              <div key={b.id} className="mobile-billing-card" onClick={() => handleOpenInvoice(b)}>
                <div className="mobile-bill-top">
                  <span className="mobile-bill-band">{b.band}</span>
                  <span className="mobile-bill-id">INV-{b.id.toString().padStart(5, '0')}</span>
                </div>
                <div className="mobile-bill-mid">
                  <span className="mobile-bill-tag date">{format(new Date(b.date), 'dd MMM yyyy')}</span>
                  <span className="mobile-bill-tag total">{formatCurrency(total)}</span>
                  {remaining > 0 && <span className="mobile-bill-tag debt">Sisa: {formatCurrency(remaining)}</span>}
                  {(() => {
                    const deadline = getDepositDeadlineStatus(b);
                    return deadline.state !== 'none' ? (
                      <span className={`mobile-bill-tag deadline ${deadline.state}`}>{deadline.label}</span>
                    ) : null;
                  })()}
                </div>
                <div className="mobile-bill-bottom" onClick={e => e.stopPropagation()}>
                  <select 
                    className={`status-select ${b.status}`}
                    value={b.status}
                    onChange={(e) => handleStatusChange(e, b.id, e.target.value)}
                  >
                    <option value="pending">Belum Bayar</option>
                    <option value="dp">DP {b.dpAmount > 0 ? `(${formatCurrency(b.dpAmount)})` : ''}</option>
                    <option value="confirmed">Lunas</option>
                  </select>
                  <div className="mobile-bill-actions" onClick={e => e.stopPropagation()}>
                    {remaining > 0 && (
                      <button className="btn-sm-pay" onClick={(e) => handleMarkAsPaid(e, b.id)}>Lunasi</button>
                    )}
                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); handleOpenInvoice(b); }} title="Invoice">
                      <Printer size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Invoice Modal — Premium Redesign ── */}
      {selectedInvoice && (() => {
        const subtotal    = calculateSubtotal(selectedInvoice);
        const discount    = selectedInvoice.discountAmount || 0;
        const total       = subtotal - discount;
        const dpPaid      = selectedInvoice.dpAmount || 0;
        const remaining   = selectedInvoice.status === 'confirmed' ? 0 : total - dpPaid;
        const invNo       = `INV-${String(selectedInvoice.id).slice(-5).padStart(5,'0')}`;
        const isLunas     = selectedInvoice.status === 'confirmed';
        const isDP        = selectedInvoice.status === 'dp';

        return (
        <Modal
          isOpen={isInvoiceModalOpen}
          onClose={handleCloseInvoiceModal}
          title=""
          className="invoice-modal-wide"
        >
          <div className="inv2-shell">
            {/* ════ LEFT: Print-ready Invoice ════ */}
            <div className={`inv2-paper ${isThermalMode ? 'thermal-mode' : 'a4-mode'}`} ref={invoiceRef}>
              
              {/* Thermal jagges top (only visible in thermal mode) */}
              <div className="thermal-edge top"></div>

              {/* Gradient top accent (A4 only) */}
              <div className="inv2-accent" />

              {/* Studio Header */}
              <div className="inv2-header">
                <div className="inv2-brand">
                  <div className="inv2-brand-icon-wrap">
                    <div className="inv2-brand-icon">🎸</div>
                  </div>
                  <div className="inv2-brand-text">
                    <div className="inv2-brand-name">{studioName}</div>
                    <div className="inv2-brand-sub">{studioAddress}</div>
                    {studioPhone && <div className="inv2-brand-sub">T: {studioPhone}</div>}
                  </div>
                </div>
                <div className="inv2-title-block">
                  <div className="inv2-title">INVOICE</div>
                  <div className={`inv2-status-badge ${selectedInvoice.status}`}>
                    {isLunas ? 'LUNAS' : isDP ? 'DP (SEBAGIAN)' : 'BELUM BAYAR'}
                  </div>
                </div>
              </div>

              {/* Details Grid: Bill To & Meta */}
              <div className="inv2-details-grid">
                <div className="inv2-bill-to">
                  <div className="inv2-label">DITAGIHKAN KEPADA</div>
                  <div className="inv2-customer-name">{selectedInvoice.band}</div>
                  {selectedInvoice.phone && (
                    <div className="inv2-customer-phone">{selectedInvoice.phone}</div>
                  )}
                </div>
                <div className="inv2-meta-info">
                  <div className="inv2-meta-item">
                    <span className="inv2-label">NOMOR INVOICE</span>
                    <span className="inv2-val-mono">{invNo}</span>
                  </div>
                  <div className="inv2-meta-item">
                    <span className="inv2-label">TANGGAL CETAK</span>
                    <span className="inv2-val">{format(new Date(), 'dd MMM yyyy')}</span>
                  </div>
                  <div className="inv2-meta-item">
                    <span className="inv2-label">JADWAL STUDIO</span>
                    <span className="inv2-val">{format(new Date(selectedInvoice.date), 'dd MMM yyyy')}</span>
                  </div>
                </div>
              </div>

              {/* Line items */}
              <div className="inv2-table-wrapper">
                <table className="inv2-items">
                  <thead>
                    <tr>
                      <th className="col-desc">DESKRIPSI LAYANAN</th>
                      <th className="col-qty">DURASI</th>
                      <th className="col-rate">TARIF</th>
                      <th className="col-amt">JUMLAH</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="col-desc">
                        <div className="inv2-item-name">{getServiceName(selectedInvoice)}</div>
                        <div className="inv2-item-time">
                          {format(new Date(selectedInvoice.date), 'EEEE, dd MMMM yyyy')} • {String(selectedInvoice.hour).padStart(2,'0')}:00 – {String(selectedInvoice.hour + selectedInvoice.duration).padStart(2,'0')}:00 WIB
                        </div>
                      </td>
                      <td className="col-qty">{selectedInvoice.duration} jam</td>
                      <td className="col-rate">{getRateLabel(selectedInvoice)}</td>
                      <td className="col-amt">{formatCurrency(subtotal)}</td>
                    </tr>
                    {discount > 0 && (
                      <tr className="inv2-discount-row">
                        <td className="col-desc"><div className="inv2-discount-label">↳ Diskon VIP / Promosi</div></td>
                        <td className="col-qty">—</td>
                        <td className="col-rate">—</td>
                        <td className="col-amt inv2-discount-val">−{formatCurrency(discount)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary Section */}
              <div className="inv2-summary-section">
                <div className="inv2-notes">
                  <div className="inv2-label">CATATAN PEMBAYARAN</div>
                  <p>Mohon simpan invoice ini sebagai bukti pembayaran yang sah. Apabila ada kendala terkait layanan, harap hubungi staff kami maksimal 1x24 jam.</p>
                </div>

                <div className="inv2-summary-box">
                  {discount > 0 && (
                    <div className="inv2-sum-row">
                      <span className="sum-label">Subtotal</span>
                      <span className="sum-val">{formatCurrency(subtotal)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="inv2-sum-row highlight-discount">
                      <span className="sum-label">Total Diskon</span>
                      <span className="sum-val">−{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="inv2-sum-row">
                    <span className="sum-label">Total Tagihan</span>
                    <span className="sum-val">{formatCurrency(total)}</span>
                  </div>
                  {dpPaid > 0 && (
                    <div className="inv2-sum-row highlight-dp">
                      <span className="sum-label">Telah Dibayar (DP)</span>
                      <span className="sum-val">−{formatCurrency(dpPaid)}</span>
                    </div>
                  )}
                  
                  <div className="inv2-divider"></div>
                  
                  <div className={`inv2-grand-total ${isLunas ? 'status-paid' : 'status-due'}`}>
                    <div className="grand-label">{isLunas ? 'Total Dibayar' : 'Sisa Tagihan'}</div>
                    <div className="grand-val">{formatCurrency(isLunas ? total : remaining)}</div>
                  </div>
                </div>

                {/* Watermark / Stamp */}
                {isLunas && (
                  <div className="inv2-watermark">
                    <span>LUNAS</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="inv2-footer">
                <div className="inv2-footer-content">
                  <div className="footer-thanks">Terima kasih atas kepercayaan Anda!</div>
                  <div className="footer-brand">{studioName}</div>
                </div>
              </div>

              {/* Thermal jagges bottom (only visible in thermal mode) */}
              <div className="thermal-edge bottom"></div>
            </div>

            {/* ════ RIGHT: Action Panel ════ */}
            <div className="inv2-actions no-print">
              <div className="inv2-actions-header">
                <span className="inv2-actions-title">Bagikan Invoice</span>
                <span className="inv2-actions-sub">{invNo} · {selectedInvoice.band}</span>
              </div>

              {/* Format Toggle */}
              <div className="inv2-format-toggle">
                <button 
                  className={`format-btn ${!isThermalMode ? 'active' : ''}`}
                  onClick={() => setIsThermalMode(false)}
                >
                  <FileText size={14} /> A4 Invoice
                </button>
                <button 
                  className={`format-btn ${isThermalMode ? 'active' : ''}`}
                  onClick={() => setIsThermalMode(true)}
                >
                  <Printer size={14} /> Thermal Struk
                </button>
              </div>

              {/* Share grid */}
              <div className="inv2-share-grid">
                <button
                  className="inv2-share-btn wa"
                  onClick={() => handleShareWhatsApp(selectedInvoice)}
                >
                  <MessageCircle size={20} />
                  <span>WhatsApp</span>
                  <small>Kirim teks invoice</small>
                </button>

                {!isLunas && (
                  <button
                    className="inv2-share-btn remind"
                    onClick={() => handleSendReminder(selectedInvoice)}
                  >
                    <Bell size={20} />
                    <span>Pengingat</span>
                    <small>Ingatkan jadwal</small>
                  </button>
                )}

                <button
                  className="inv2-share-btn dl"
                  onClick={handleDownloadImage}
                >
                  <Download size={20} />
                  <span>Unduh</span>
                  <small>Simpan sebagai gambar</small>
                </button>

                <button
                  className="inv2-share-btn cp"
                  onClick={() => handleCopyText(selectedInvoice)}
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                  <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
                  <small>{copied ? 'Berhasil disalin' : 'Salin ke clipboard'}</small>
                </button>

                {navigator.share && (
                  <button
                    className="inv2-share-btn more"
                    onClick={() => handleNativeShare(selectedInvoice)}
                  >
                    <Share2 size={20} />
                    <span>Lainnya</span>
                    <small>Share via aplikasi lain</small>
                  </button>
                )}
              </div>

              {/* Status quick actions */}
              {!isLunas && (
                <button
                  className="inv2-pay-btn"
                  onClick={(e) => { handleMarkAsPaid(e, selectedInvoice.id); setSelectedInvoice({ ...selectedInvoice, status: 'confirmed' }); }}
                >
                  <CheckCircle size={18} />
                  Tandai Lunas Sekarang
                </button>
              )}

              {/* Print / Close */}
              <div className="inv2-main-btns">
                <button className="inv2-btn-close" onClick={handleCloseInvoiceModal}>
                  <X size={16} /> Tutup
                </button>
                <button
                  className={`inv2-btn-print ${run && currentStep === 7 ? 'tour-invoice-print' : ''}`}
                  onClick={handlePrint}
                >
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
