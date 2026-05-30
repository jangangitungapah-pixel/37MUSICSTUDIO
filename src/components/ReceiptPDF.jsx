import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#1e1e24',
    backgroundColor: '#ffffff'
  },
  accentBar: {
    height: 5,
    backgroundColor: '#00f0ff',
    marginBottom: 15
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f5',
    paddingBottom: 10
  },
  brandBlock: {
    flexDirection: 'column'
  },
  studioName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00f0ff',
    marginBottom: 2
  },
  studioSub: {
    fontSize: 8,
    color: '#71717a'
  },
  titleBlock: {
    alignItems: 'flex-end'
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111128',
    marginBottom: 2
  },
  metaInfo: {
    width: '100%'
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f5',
    paddingBottom: 4
  },
  metaLabel: {
    fontSize: 8,
    color: '#71717a'
  },
  metaVal: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111128'
  },
  amountBox: {
    backgroundColor: '#f4f4f5',
    padding: 10,
    borderRadius: 4,
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e1e24'
  },
  amountVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0099bb'
  },
  footer: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#f1f1f5',
    paddingTop: 10,
    textAlign: 'center',
    fontSize: 7,
    color: '#71717a'
  }
});

const formatCurrency = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

export const ReceiptPDF = ({ transaction, settings }) => {
  const { studioName, studioAddress, studioPhone } = settings;
  const isIncome = transaction.type === 'income';
  
  return (
    <Document>
      <Page size="A6" style={styles.page}>
        <View style={[styles.accentBar, { backgroundColor: isIncome ? '#00f0ff' : '#ff2a5f' }]} />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={[styles.studioName, { color: isIncome ? '#0099bb' : '#ff2a5f' }]}>{studioName}</Text>
            <Text style={styles.studioSub}>{studioAddress}</Text>
            {studioPhone && <Text style={styles.studioSub}>T: {studioPhone}</Text>}
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>KUITANSI</Text>
          </View>
        </View>
        
        {/* Details */}
        <View style={styles.metaInfo}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>TANGGAL</Text>
            <Text style={styles.metaVal}>{transaction.date}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>JENIS</Text>
            <Text style={[styles.metaVal, { color: isIncome ? '#2ecc71' : '#e74c3c' }]}>
              {isIncome ? 'PEMASUKAN' : 'PENGELUARAN'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>KATEGORI</Text>
            <Text style={styles.metaVal}>{transaction.category}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>KETERANGAN</Text>
            <Text style={[styles.metaVal, { maxWidth: 150 }]}>{transaction.description}</Text>
          </View>
          {transaction.operatorName && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>OPERATOR</Text>
              <Text style={styles.metaVal}>{transaction.operatorName}</Text>
            </View>
          )}
        </View>
        
        {/* Amount */}
        <View style={[styles.amountBox, { backgroundColor: isIncome ? '#e8f8f5' : '#fdedec' }]}>
          <Text style={styles.amountLabel}>NOMINAL</Text>
          <Text style={[styles.amountVal, { color: isIncome ? '#27ae60' : '#c0392b' }]}>
            {formatCurrency(transaction.amount)}
          </Text>
        </View>
        
        {/* Footer */}
        <Text style={styles.footer}>
          Terima kasih • Dicetak pada {new Date().toLocaleString('id-ID')}
        </Text>
      </Page>
    </Document>
  );
};
