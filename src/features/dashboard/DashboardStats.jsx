import { CalendarCheck, PackageOpen, TrendingDown, TrendingUp, Users } from 'lucide-react';

const DashboardStats = ({
  bookingStats,
  lastMonthStats,
  customersCount,
  invStats,
  revTrend,
  bookTrend,
  revenueTargetProgress,
  occupancyProgress,
  activeCustomersProgress,
  inventoryHealthProgress,
  formatCurrency,
}) => (
  <div className="dash-stats-grid">
    <div className="dash-stat-card glass-panel">
      <div className="dash-stat-top">
        <div className="stat-icon-wrapper blue">
          <TrendingUp size={20} />
        </div>
        {revTrend !== null && (
          <span className={`dash-trend ${revTrend >= 0 ? 'up' : 'down'}`}>
            {revTrend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {revTrend >= 0 ? '+' : ''}{revTrend}%
          </span>
        )}
      </div>
      <span className="dash-stat-value">{formatCurrency(bookingStats.totalRevenue)}</span>
      <span className="dash-stat-label">Pendapatan Bulan Ini</span>

      <div className="dash-stat-progress-container">
        <div className="dash-stat-progress-bar" style={{ width: `${revenueTargetProgress}%`, background: 'var(--accent-cyan)' }} />
      </div>
      <div className="dash-stat-progress-info">
        <span>Target: Rp 35jt</span>
        <span>{revenueTargetProgress}%</span>
      </div>
      <span className="dash-stat-sub">vs {formatCurrency(lastMonthStats.totalRevenue)} bulan lalu</span>
    </div>

    <div className="dash-stat-card glass-panel">
      <div className="dash-stat-top">
        <div className="stat-icon-wrapper green">
          <CalendarCheck size={20} />
        </div>
        {bookTrend !== null && (
          <span className={`dash-trend ${bookTrend >= 0 ? 'up' : 'down'}`}>
            {bookTrend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {bookTrend >= 0 ? '+' : ''}{bookTrend}%
          </span>
        )}
      </div>
      <div className="dash-stat-value">
        {bookingStats.totalBookings}
        <span className="dash-stat-unit"> sesi</span>
      </div>
      <span className="dash-stat-label">Total Booking</span>

      <div className="dash-stat-progress-container">
        <div className="dash-stat-progress-bar" style={{ width: `${occupancyProgress}%`, background: 'rgb(var(--success-rgb))' }} />
      </div>
      <div className="dash-stat-progress-info">
        <span>Okupansi (Target 390 jam)</span>
        <span>{occupancyProgress}%</span>
      </div>

      <div className="dash-stat-pills" style={{ marginTop: '4px' }}>
        <span className="dash-pill confirmed">{bookingStats.confirmed} Lunas</span>
        <span className="dash-pill dp">{bookingStats.dp} DP</span>
        <span className="dash-pill pending">{bookingStats.pending} Pending</span>
      </div>
    </div>

    <div className="dash-stat-card glass-panel">
      <div className="dash-stat-top">
        <div className="stat-icon-wrapper pink">
          <Users size={20} />
        </div>
      </div>
      <div className="dash-stat-value">
        {customersCount}
        <span className="dash-stat-unit"> orang</span>
      </div>
      <span className="dash-stat-label">Pelanggan Terdaftar</span>

      <div className="dash-stat-progress-container">
        <div className="dash-stat-progress-bar" style={{ width: `${activeCustomersProgress}%`, background: 'var(--accent-pink)' }} />
      </div>
      <div className="dash-stat-progress-info">
        <span>Rasio Pelanggan Aktif</span>
        <span>{activeCustomersProgress}%</span>
      </div>
      <span className="dash-stat-sub">{bookingStats.totalHours} jam terpakai bulan ini</span>
    </div>

    <div className="dash-stat-card glass-panel">
      <div className="dash-stat-top">
        <div className="stat-icon-wrapper orange">
          <PackageOpen size={20} />
        </div>
      </div>
      <div className={`dash-stat-value ${invStats.serviceNeeded > 0 ? 'warn' : ''}`}>
        {invStats.serviceNeeded}
        <span className="dash-stat-unit"> item</span>
      </div>
      <span className="dash-stat-label">Kondisi Alat</span>

      <div className="dash-stat-progress-container">
        <div className="dash-stat-progress-bar" style={{ width: `${inventoryHealthProgress}%`, background: '#FFA000' }} />
      </div>
      <div className="dash-stat-progress-info">
        <span>Rasio Alat Layak Pakai</span>
        <span>{inventoryHealthProgress}%</span>
      </div>
      <span className="dash-stat-sub">dari {invStats.totalItems} total alat inventaris</span>
    </div>
  </div>
);

export default DashboardStats;
