import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#1e1e24',
    backgroundColor: '#ffffff'
  },
  accentBar: {
    height: 5,
    backgroundColor: '#ff2a5f',
    marginBottom: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f5',
    paddingBottom: 15
  },
  brandBlock: {
    flexDirection: 'column'
  },
  studioName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff2a5f',
    marginBottom: 4
  },
  studioSub: {
    fontSize: 8,
    color: '#71717a',
    marginBottom: 2
  },
  titleBlock: {
    alignItems: 'flex-end'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111128',
    marginBottom: 4
  },
  statusBadge: {
    padding: '3 8',
    borderRadius: 4,
    fontSize: 7,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#e74c3c'
  },
  statusConfirmed: {
    backgroundColor: '#2ecc71'
  },
  statusPending: {
    backgroundColor: '#f1c40f'
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25
  },
  billTo: {
    width: '45%'
  },
  metaInfo: {
    width: '45%',
    alignItems: 'flex-end'
  },
  label: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#a1a1aa',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  customerName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111128',
    marginBottom: 4
  },
  customerPhone: {
    fontSize: 8,
    color: '#71717a'
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4
  },
  metaLabel: {
    fontSize: 7,
    color: '#71717a'
  },
  metaVal: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#111128'
  },
  table: {
    width: '100%',
    marginBottom: 20
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#111128',
    paddingBottom: 6,
    marginBottom: 8,
    fontWeight: 'bold'
  },
  tableRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f5'
  },
  colDesc: { width: '50%' },
  colQty: { width: '15%', textAlign: 'center' },
  colRate: { width: '15%', textAlign: 'right' },
  colAmt: { width: '20%', textAlign: 'right' },
  itemName: { fontSize: 9, fontWeight: 'bold' },
  itemTime: { fontSize: 7, color: '#71717a', marginTop: 2 },
  discountRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f5',
    color: '#ff2a5f'
  },
  discountLabel: { fontSize: 8, color: '#ff2a5f' },
  discountVal: { fontSize: 8, fontWeight: 'bold', color: '#ff2a5f', textAlign: 'right', width: '20%' },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  notesBlock: {
    width: '50%'
  },
  notesText: {
    fontSize: 7,
    color: '#71717a',
    lineHeight: 1.4
  },
  summaryBox: {
    width: '45%'
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  sumLabel: { fontSize: 8, color: '#71717a' },
  sumVal: { fontSize: 8, color: '#111128' },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    marginVertical: 6
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#f4f4f5'
  },
  grandPaid: {
    backgroundColor: '#e8f8f5'
  },
  grandLabel: {
    fontSize: 8,
    fontWeight: 'bold'
  },
  grandVal: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#f1f1f5',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  footerThanks: {
    fontSize: 7,
    color: '#71717a'
  },
  footerBrand: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ff2a5f'
  }
});

const formatCurrency = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

export const InvoicePDF = ({ invoice, settings }) => {
  const { studioName, studioAddress, studioPhone, pricePerHour } = settings;
  const isLunas = invoice.status === 'confirmed';
  const isDP = invoice.status === 'dp';
  
  const calculateSubtotal = (booking) => (
    booking.type === 'recording'
      ? (booking.sessionPrice || 0)
      : (booking.duration * pricePerHour)
  );
  const calculateTotal = (booking) => calculateSubtotal(booking) + (booking.equipmentCost || 0) - (booking.discountAmount || 0);
  const getServiceName = (booking) => (booking.type === 'recording' ? 'Sesi Recording' : 'Sewa Studio Latihan');
  const getRateLabel = (booking) => (booking.type === 'recording' ? 'Harga Paket' : formatCurrency(pricePerHour));
  
  const subtotal = calculateSubtotal(invoice);
  const discount = invoice.discountAmount || 0;
  const total = calculateTotal(invoice);
  const dpPaid = invoice.dpAmount || 0;
  const remaining = isLunas ? 0 : total - dpPaid;
  const invNo = `INV-${String(invoice.id).slice(-5).padStart(5,'0')}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.accentBar} />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.studioName}>{studioName}</Text>
            <Text style={styles.studioSub}>{studioAddress}</Text>
            {studioPhone && <Text style={styles.studioSub}>T: {studioPhone}</Text>}
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={[styles.statusBadge, isLunas ? styles.statusConfirmed : isDP ? styles.statusPending : {}]}>
              {isLunas ? 'LUNAS' : isDP ? 'DP (SEBAGIAN)' : 'BELUM BAYAR'}
            </Text>
          </View>
        </View>
        
        {/* Details Info */}
        <View style={styles.detailsGrid}>
          <View style={styles.billTo}>
            <Text style={styles.label}>DITAGIHKAN KEPADA</Text>
            <Text style={styles.customerName}>{invoice.band}</Text>
            {invoice.phone && <Text style={styles.customerPhone}>{invoice.phone}</Text>}
          </View>
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>NOMOR INVOICE</Text>
              <Text style={styles.metaVal}>{invNo}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>TANGGAL CETAK</Text>
              <Text style={styles.metaVal}>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>JADWAL STUDIO</Text>
              <Text style={styles.metaVal}>{invoice.date}</Text>
            </View>
          </View>
        </View>
        
        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>DESKRIPSI LAYANAN</Text>
            <Text style={styles.colQty}>DURASI</Text>
            <Text style={styles.colRate}>TARIF</Text>
            <Text style={styles.colAmt}>JUMLAH</Text>
          </View>
          
          <View style={styles.tableRow}>
            <View style={styles.colDesc}>
              <Text style={styles.itemName}>{getServiceName(invoice)}</Text>
              <Text style={styles.itemTime}>
                {invoice.date} • {String(invoice.hour).padStart(2,'0')}:00 – {String(invoice.hour + invoice.duration).padStart(2,'0')}:00 WIB
              </Text>
            </View>
            <Text style={styles.colQty}>{invoice.duration} jam</Text>
            <Text style={styles.colRate}>{getRateLabel(invoice)}</Text>
            <Text style={styles.colAmt}>{formatCurrency(subtotal)}</Text>
          </View>
          
          {discount > 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.colDesc, styles.discountLabel]}>↳ Diskon VIP / Promosi</Text>
              <Text style={styles.colQty}>—</Text>
              <Text style={styles.colRate}>—</Text>
              <Text style={styles.discountVal}>-{formatCurrency(discount)}</Text>
            </View>
          )}
        </View>
        
        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.notesBlock}>
            <Text style={styles.label}>CATATAN PEMBAYARAN</Text>
            <Text style={styles.notesText}>
              Mohon simpan invoice ini sebagai bukti pembayaran yang sah. Apabila ada kendala terkait layanan, harap hubungi staff kami maksimal 1x24 jam.
            </Text>
          </View>
          
          <View style={styles.summaryBox}>
            {discount > 0 && (
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Subtotal</Text>
                <Text style={styles.sumVal}>{formatCurrency(subtotal)}</Text>
              </View>
            )}
            {discount > 0 && (
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Total Diskon</Text>
                <Text style={styles.sumVal}>-{formatCurrency(discount)}</Text>
              </View>
            )}
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Total Tagihan</Text>
              <Text style={styles.sumVal}>{formatCurrency(total)}</Text>
            </View>
            {dpPaid > 0 && (
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Telah Dibayar (DP)</Text>
                <Text style={styles.sumVal}>-{formatCurrency(dpPaid)}</Text>
              </View>
            )}
            
            <View style={styles.divider} />
            
            <View style={[styles.grandTotal, isLunas ? styles.grandPaid : {}]}>
              <Text style={styles.grandLabel}>{isLunas ? 'Total Dibayar' : 'Sisa Tagihan'}</Text>
              <Text style={styles.grandVal}>{formatCurrency(isLunas ? total : remaining)}</Text>
            </View>
          </View>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerThanks}>Terima kasih atas kepercayaan Anda!</Text>
          <Text style={styles.footerBrand}>{studioName}</Text>
        </View>
      </Page>
    </Document>
  );
};
