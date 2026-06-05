import { AlertCircle, CheckCircle, FileText } from 'lucide-react';

const BillingSummary = ({ totalPendapatan, totalPiutang, totalTransaksi, formatCurrency }) => (
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
        <span className="stat-label">Piutang Belum Lunas</span>
        <span className="stat-value">{formatCurrency(totalPiutang)}</span>
      </div>
    </div>
    <div className="billing-stat-card total">
      <div className="stat-icon"><FileText size={24} /></div>
      <div className="stat-data">
        <span className="stat-label">Total Invoice</span>
        <span className="stat-value">{totalTransaksi}</span>
      </div>
    </div>
  </div>
);

export default BillingSummary;
