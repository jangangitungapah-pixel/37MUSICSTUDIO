import { Activity, Clock, Lightbulb, Wallet } from 'lucide-react';

const DashboardSmartInsights = ({
  demandInsights,
  revenueForecast,
  billingInsights,
  anomalies,
  formatCurrency,
}) => (
  <section className="app-smart-panel app-smart-grid cols-auto">
    <div className="smart-item">
      <div className="smart-head" style={{ color: 'var(--accent-cyan)' }}>
        <Lightbulb size={16} />
        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pola Booking</span>
      </div>
      <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
        {demandInsights.busiestDayCount > 0 ? `${demandInsights.busiestDay}, ${demandInsights.busiestHour}.00` : 'Belum ada pola'}
      </strong>
      <small style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
        {demandInsights.favoriteDuration ? `Durasi favorit ${demandInsights.favoriteDuration} jam, okupansi ${demandInsights.occupancyPercent}%` : 'Butuh data booking untuk membaca tren.'}
      </small>
    </div>

    <div className="smart-item">
      <div className="smart-head" style={{ color: '#4CAF50' }}>
        <Wallet size={16} />
        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Forecast Bulan Ini</span>
      </div>
      <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{formatCurrency(revenueForecast.conservativeForecast)}</strong>
      <small style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
        Optimistis {formatCurrency(revenueForecast.optimisticForecast)} termasuk sisa tagihan.
      </small>
    </div>

    <div className="smart-item">
      <div className="smart-head" style={{ color: '#FFA000' }}>
        <Clock size={16} />
        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Follow-up Billing</span>
      </div>
      <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{billingInsights.followUpsToday.length} prioritas hari ini</strong>
      <small style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{billingInsights.summary}</small>
    </div>

    <div className="smart-item">
      <div className="smart-head" style={{ color: anomalies.length ? 'var(--accent-pink)' : '#4CAF50' }}>
        <Activity size={16} />
        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Anomali Data</span>
      </div>
      <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{anomalies.length ? `${anomalies.length} perlu dicek` : 'Tidak ada anomali'}</strong>
      <small style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
        {anomalies[0]?.detail || 'Harga, DP, jam, dan overlap jadwal terlihat normal.'}
      </small>
    </div>
  </section>
);

export default DashboardSmartInsights;
