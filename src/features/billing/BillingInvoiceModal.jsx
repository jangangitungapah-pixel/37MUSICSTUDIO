import { PDFDownloadLink } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { Bell, Check, CheckCircle, Copy, Download, FileText, MessageCircle, Printer, Share2, X } from 'lucide-react';
import Modal from '../../components/Modal';
import { InvoicePDF } from '../../components/InvoicePDF';

const BillingInvoiceModal = ({
  invoice,
  isOpen,
  isThermalMode,
  copied,
  invoiceRef,
  settings,
  pricePerHour,
  calculateSubtotal,
  formatCurrency,
  getRateLabel,
  getServiceName,
  onClose,
  onCopyText,
  onDownloadImage,
  onMarkAsPaid,
  onNativeShare,
  onPrint,
  onSendReminder,
  onShareWhatsApp,
  onThermalModeChange,
}) => {
  if (!invoice) return null;

  const { studioName, studioAddress, studioPhone } = settings;
  const subtotal = calculateSubtotal(invoice);
  const discount = invoice.discountAmount || 0;
  const total = subtotal - discount;
  const dpPaid = invoice.dpAmount || 0;
  const remaining = invoice.status === 'confirmed' ? 0 : total - dpPaid;
  const invNo = `INV-${String(invoice.id).slice(-5).padStart(5, '0')}`;
  const isLunas = invoice.status === 'confirmed';
  const isDP = invoice.status === 'dp';
  const canNativeShare = typeof navigator !== 'undefined' && navigator.share;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className="invoice-modal-wide"
    >
      <div className="inv2-shell">
        <div className={`inv2-paper ${isThermalMode ? 'thermal-mode' : 'a4-mode'}`} ref={invoiceRef}>
          <div className="thermal-edge top"></div>
          <div className="inv2-accent" />

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
              <div className={`inv2-status-badge ${invoice.status}`}>
                {isLunas ? 'LUNAS' : isDP ? 'DP (SEBAGIAN)' : 'BELUM BAYAR'}
              </div>
            </div>
          </div>

          <div className="inv2-details-grid">
            <div className="inv2-bill-to">
              <div className="inv2-label">DITAGIHKAN KEPADA</div>
              <div className="inv2-customer-name">{invoice.band}</div>
              {invoice.phone && (
                <div className="inv2-customer-phone">{invoice.phone}</div>
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
                <span className="inv2-val">{format(new Date(invoice.date), 'dd MMM yyyy')}</span>
              </div>
            </div>
          </div>

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
                    <div className="inv2-item-name">{getServiceName(invoice)}</div>
                    <div className="inv2-item-time">
                      {format(new Date(invoice.date), 'EEEE, dd MMMM yyyy')} • {String(invoice.hour).padStart(2, '0')}:00 – {String(invoice.hour + invoice.duration).padStart(2, '0')}:00 WIB
                    </div>
                  </td>
                  <td className="col-qty">{invoice.duration} jam</td>
                  <td className="col-rate">{getRateLabel(invoice)}</td>
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

            {isLunas && (
              <div className="inv2-watermark">
                <span>LUNAS</span>
              </div>
            )}
          </div>

          <div className="inv2-footer">
            <div className="inv2-footer-content">
              <div className="footer-thanks">Terima kasih atas kepercayaan Anda!</div>
              <div className="footer-brand">{studioName}</div>
            </div>
          </div>

          <div className="thermal-edge bottom"></div>
        </div>

        <div className="inv2-actions no-print">
          <div className="inv2-actions-header">
            <span className="inv2-actions-title">Bagikan Invoice</span>
            <span className="inv2-actions-sub">{invNo} · {invoice.band}</span>
          </div>

          <div className="inv2-format-toggle" role="radiogroup" aria-label="Format invoice">
            <button
              type="button"
              className={`format-btn ${!isThermalMode ? 'active' : ''}`}
              onClick={() => onThermalModeChange(false)}
              role="radio"
              aria-checked={!isThermalMode}
              aria-label="Format A4 Invoice"
            >
              <FileText size={14} /> A4 Invoice
            </button>
            <button
              type="button"
              className={`format-btn ${isThermalMode ? 'active' : ''}`}
              onClick={() => onThermalModeChange(true)}
              role="radio"
              aria-checked={isThermalMode}
              aria-label="Format Thermal Struk"
            >
              <Printer size={14} /> Thermal Struk
            </button>
          </div>

          <div className="inv2-share-grid">
            <button
              type="button"
              className="inv2-share-btn wa"
              onClick={() => onShareWhatsApp(invoice)}
              aria-label="Bagikan invoice lewat WhatsApp"
            >
              <MessageCircle size={20} />
              <span>WhatsApp</span>
              <small>Kirim teks invoice</small>
            </button>

            {!isLunas && (
              <button
                type="button"
                className="inv2-share-btn remind"
                onClick={() => onSendReminder(invoice)}
                aria-label="Kirim pengingat jadwal lewat WhatsApp"
              >
                <Bell size={20} />
                <span>Pengingat</span>
                <small>Ingatkan jadwal</small>
              </button>
            )}

            <button
              type="button"
              className="inv2-share-btn dl"
              onClick={onDownloadImage}
              aria-label="Unduh invoice sebagai gambar"
            >
              <Download size={20} />
              <span>Unduh</span>
              <small>Simpan sebagai gambar</small>
            </button>

            <button
              type="button"
              className="inv2-share-btn cp"
              onClick={() => onCopyText(invoice)}
              aria-label="Salin teks invoice ke clipboard"
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
              <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
              <small>{copied ? 'Berhasil disalin' : 'Salin ke clipboard'}</small>
            </button>

            {canNativeShare && (
              <button
                type="button"
                className="inv2-share-btn more"
                onClick={() => onNativeShare(invoice)}
                aria-label="Bagikan invoice via aplikasi lainnya"
              >
                <Share2 size={20} />
                <span>Lainnya</span>
                <small>Share via aplikasi lain</small>
              </button>
            )}
          </div>

          {!isLunas && (
            <button
              type="button"
              className="inv2-pay-btn"
              onClick={(event) => onMarkAsPaid(event, invoice)}
              aria-label="Tandai invoice ini sebagai lunas"
            >
              <CheckCircle size={18} />
              Tandai Lunas Sekarang
            </button>
          )}

          <div className="inv2-main-btns">
            <button type="button" className="inv2-btn-close" onClick={onClose} aria-label="Tutup detail modal">
              <X size={16} /> Tutup
            </button>
            <PDFDownloadLink
              document={<InvoicePDF invoice={invoice} settings={{ studioName, studioAddress, studioPhone, pricePerHour }} />}
              fileName={`invoice-${invoice.id.toString().padStart(5, '0')}.pdf`}
              className="inv2-pdf-link"
            >
              {({ loading }) => (
                <button
                  type="button"
                  className="inv2-btn-print"
                  disabled={loading}
                  aria-label="Unduh invoice PDF"
                >
                  <Download size={16} />
                  <span>{loading ? 'PDF...' : 'Unduh PDF'}</span>
                </button>
              )}
            </PDFDownloadLink>
            <button
              type="button"
              className="inv2-btn-print"
              onClick={onPrint}
              aria-label="Cetak invoice atau simpan sebagai PDF"
            >
              <Printer size={16} /> Cetak
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BillingInvoiceModal;
