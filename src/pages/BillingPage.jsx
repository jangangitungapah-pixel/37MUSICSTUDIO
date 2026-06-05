import { useState, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBookingStore } from '../store/useBookingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { getBillingInsights } from '../lib/smartInsights';
import { getDepositDeadlineStatus } from '../lib/bookingWorkflows';
import { motion } from 'framer-motion';
import { pagePreset } from '../animations';
import BillingFilters from '../features/billing/BillingFilters';
import BillingFollowUps from '../features/billing/BillingFollowUps';
import BillingInvoiceModal from '../features/billing/BillingInvoiceModal';
import BillingMobileList from '../features/billing/BillingMobileList';
import BillingSummary from '../features/billing/BillingSummary';
import BillingTable from '../features/billing/BillingTable';
import './BillingPage.css';

const BillingPage = () => {
  const { bookings, updateBookingStatus } = useBookingStore(
    useShallow(state => ({
      bookings: state.bookings,
      updateBookingStatus: state.updateBookingStatus
    }))
  );
  const { pricePerHour, studioName, studioAddress, studioPhone } = useSettingsStore(
    useShallow(state => ({
      pricePerHour: state.pricePerHour,
      studioName: state.studioName,
      studioAddress: state.studioAddress,
      studioPhone: state.studioPhone
    }))
  );
  const [activeTab, setActiveTab] = useState('Semua');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isThermalMode, setIsThermalMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const invoiceRef = useRef(null);
  const billableBookings = bookings.filter((booking) => !['maintenance', 'cancelled'].includes(booking.status));



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

  const billingFilterCounts = {
    all: billableBookings.length,
    paid: billableBookings.filter(b => b.status === 'confirmed').length,
    unpaid: billableBookings.filter(b => b.status !== 'confirmed').length,
  };

  const handleChangeTab = (tab) => {
    setActiveTab(tab);
    setIsFilterDropdownOpen(false);
  };

  // Actions
  const handleMarkAsPaid = (e, id) => {
    e.stopPropagation();
    updateBookingStatus(id, 'confirmed');
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#00f0ff', '#ff2a5f', '#FFC107', '#4CAF50']
    });
    toast.success('Pembayaran ditandai sebagai lunas! 🎉');
  };

  const handleStatusChange = (e, id, newStatus) => {
    e.stopPropagation();
    updateBookingStatus(id, newStatus);
    if (newStatus === 'confirmed') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#ff2a5f', '#FFC107', '#4CAF50']
      });
      toast.success('Status pembayaran diubah menjadi Lunas! 🎉');
    }
  };

  const handleOpenInvoice = (booking) => {
    setSelectedInvoice(booking);
    setIsInvoiceModalOpen(true);
  };
  
  const handleCloseInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
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
    <motion.div className="app-page billing-page" {...pagePreset}>
      <BillingSummary
        totalPendapatan={totalPendapatan}
        totalPiutang={totalPiutang}
        totalTransaksi={totalTransaksi}
        formatCurrency={formatCurrency}
      />

      <BillingFollowUps
        billingInsights={billingInsights}
        formatCurrency={formatCurrency}
        onSendReminder={handleSendReminder}
      />
      <div className="billing-content app-panel">
        <BillingFilters
          activeTab={activeTab}
          isFilterDropdownOpen={isFilterDropdownOpen}
          searchQuery={searchQuery}
          counts={billingFilterCounts}
          filteredCount={filteredBookings.length}
          onToggleFilterDropdown={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
          onCloseFilterDropdown={() => setIsFilterDropdownOpen(false)}
          onChangeTab={handleChangeTab}
          onSearchChange={setSearchQuery}
          onClearSearch={() => setSearchQuery('')}
        />
        <BillingTable
          bookings={filteredBookings}
          calculateRemaining={calculateRemaining}
          calculateTotal={calculateTotal}
          formatCurrency={formatCurrency}
          getDeadlineStatus={getDepositDeadlineStatus}
          onOpenInvoice={handleOpenInvoice}
          onStatusChange={handleStatusChange}
          onMarkAsPaid={handleMarkAsPaid}
        />

        <BillingMobileList
          bookings={filteredBookings}
          calculateRemaining={calculateRemaining}
          calculateTotal={calculateTotal}
          formatCurrency={formatCurrency}
          getDeadlineStatus={getDepositDeadlineStatus}
          onOpenInvoice={handleOpenInvoice}
          onStatusChange={handleStatusChange}
          onMarkAsPaid={handleMarkAsPaid}
        />
      </div>

      <BillingInvoiceModal
        invoice={selectedInvoice}
        isOpen={isInvoiceModalOpen}
        isThermalMode={isThermalMode}
        copied={copied}
        invoiceRef={invoiceRef}
        settings={{ studioName, studioAddress, studioPhone }}
        pricePerHour={pricePerHour}
        calculateSubtotal={calculateSubtotal}
        formatCurrency={formatCurrency}
        getRateLabel={getRateLabel}
        getServiceName={getServiceName}
        onClose={handleCloseInvoiceModal}
        onCopyText={handleCopyText}
        onDownloadImage={handleDownloadImage}
        onMarkAsPaid={(event, invoice) => {
          handleMarkAsPaid(event, invoice.id);
          setSelectedInvoice({ ...invoice, status: 'confirmed' });
        }}
        onNativeShare={handleNativeShare}
        onPrint={handlePrint}
        onSendReminder={handleSendReminder}
        onShareWhatsApp={handleShareWhatsApp}
        onThermalModeChange={setIsThermalMode}
      />
      {/* Mobile bottom nav spacer */}
      <div aria-hidden="true" style={{ height: '90px', flexShrink: 0 }} className="mobile-bottom-spacer" />
    </motion.div>
  );
};

export default BillingPage;
