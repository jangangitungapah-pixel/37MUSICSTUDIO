import React, { useState, useRef } from 'react';
import { useBookingStore } from '../store/useBookingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { CreditCard, Printer, CheckCircle, Clock, AlertCircle, FileText, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import Modal from '../components/Modal';
import './BillingPage.css';

const BillingPage = () => {
  const { bookings, updateBookingStatus, updateBooking } = useBookingStore();
  const { pricePerHour, studioName, studioAddress, studioPhone } = useSettingsStore();
  const [activeTab, setActiveTab] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

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
      {selectedInvoice && (
        <Modal 
          isOpen={isInvoiceModalOpen} 
          onClose={() => setIsInvoiceModalOpen(false)} 
          title="Detail Invoice"
        >
          <div className="invoice-container">
            {/* Printable Area */}
            <div className="invoice-print-area">
              <div className="invoice-header">
                <div className="invoice-brand">
                  <h2>{studioName}</h2>
                  <p>{studioAddress}</p>
                  <p>Telp: {studioPhone}</p>
                </div>
                <div className="invoice-meta">
                  <h1>INVOICE</h1>
                  <p><strong>No:</strong> INV-{selectedInvoice.id.toString().padStart(5, '0')}</p>
                  <p><strong>Tanggal:</strong> {format(new Date(), 'dd MMM yyyy')}</p>
                </div>
              </div>
              
              <div className="invoice-customer">
                <p><strong>Ditagihkan Kepada:</strong></p>
                <h3>{selectedInvoice.band}</h3>
                {selectedInvoice.phone && <p>Telp: {selectedInvoice.phone}</p>}
              </div>

              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th>Deskripsi</th>
                    <th>Qty (Jam)</th>
                    <th>Harga/Jam</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      Sewa Studio Latihan<br/>
                      <small>{format(new Date(selectedInvoice.date), 'dd MMM yyyy')} • {String(selectedInvoice.hour).padStart(2, '0')}:00 - {String(selectedInvoice.hour + selectedInvoice.duration).padStart(2, '0')}:00</small>
                    </td>
                    <td className="text-center">{selectedInvoice.duration}</td>
                    <td>{formatCurrency(pricePerHour)}</td>
                    <td className="text-right">{formatCurrency(calculateTotal(selectedInvoice.duration))}</td>
                  </tr>
                </tbody>
              </table>

              <div className="invoice-summary">
                <div className="invoice-summary-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(calculateTotal(selectedInvoice.duration))}</span>
                </div>
                {selectedInvoice.status !== 'pending' && selectedInvoice.dpAmount > 0 && selectedInvoice.status !== 'confirmed' && (
                  <div className="invoice-summary-row">
                    <span>DP Dibayar</span>
                    <span>- {formatCurrency(selectedInvoice.dpAmount)}</span>
                  </div>
                )}
                {selectedInvoice.status === 'confirmed' && selectedInvoice.dpAmount > 0 && (
                  <div className="invoice-summary-row">
                    <span>DP Dibayar</span>
                    <span>- {formatCurrency(selectedInvoice.dpAmount)}</span>
                  </div>
                )}
                <div className="invoice-summary-row total-row">
                  <span>Total Tagihan / Sisa</span>
                  <span className="total-amount">{formatCurrency(calculateRemaining(selectedInvoice))}</span>
                </div>
                {selectedInvoice.status === 'confirmed' && (
                  <div className="invoice-stamp paid">LUNAS</div>
                )}
              </div>
              
              <div className="invoice-footer">
                <p>Terima kasih telah mempercayakan latihan Anda di 37 Music Studio!</p>
                <p><small>Invoice ini sah dan digenerate secara otomatis oleh sistem.</small></p>
              </div>
            </div>

            {/* Action Buttons (Not printable) */}
            <div className="invoice-actions no-print">
              <button className="btn-secondary" onClick={() => setIsInvoiceModalOpen(false)}>Tutup</button>
              <button className="btn-primary" onClick={handlePrint}>
                <Printer size={16} style={{ marginRight: 8 }} /> Cetak / PDF
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BillingPage;
