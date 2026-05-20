import React, { useMemo } from 'react';
import { useBookingStore } from '../store/useBookingStore';
import { useCustomerStore } from '../store/useCustomerStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { format, subDays, addMonths, parseISO, isToday, isTomorrow } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  TrendingUp, TrendingDown, Users, CalendarCheck, PackageOpen, Clock,
  ArrowRight, LayoutDashboard, Zap, AlertTriangle, CheckCircle2, Music2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

const COLORS = ['#00f0ff', '#4CAF50', '#FFC107', '#ff2a5f'];

const DashboardPage = () => {
  const { bookings, getMonthlyStats } = useBookingStore();
  const { customers } = useCustomerStore();
  const { getStats: getInvStats } = useInventoryStore();
  const { transactions } = useFinanceStore();
  const { pricePerHour, studioName } = useSettingsStore();
  const navigate = useNavigate();

  const today = new Date();
  const currentHour = today.getHours();
  const greeting = currentHour < 11 ? 'Selamat Pagi' : currentHour < 15 ? 'Selamat Siang' : currentHour < 18 ? 'Selamat Sore' : 'Selamat Malam';

  const bookingStats = getMonthlyStats(today);
  const lastMonthStats = getMonthlyStats(addMonths(today, -1));
  const invStats = getInvStats();

  const revTrend = lastMonthStats.totalRevenue > 0
    ? Math.round(((bookingStats.totalRevenue - lastMonthStats.totalRevenue) / lastMonthStats.totalRevenue) * 100)
    : null;
  const bookTrend = lastMonthStats.totalBookings > 0
    ? Math.round(((bookingStats.totalBookings - lastMonthStats.totalBookings) / lastMonthStats.totalBookings) * 100)
    : null;

  const combinedData = useMemo(() => {
    const allEntries = [...transactions];
    bookings.forEach(b => {
      if (b.status === 'confirmed') allEntries.push({ date: b.date, type: 'income', amount: b.duration * pricePerHour });
      else if (b.status === 'dp' && b.dpAmount > 0) allEntries.push({ date: b.date, type: 'income', amount: b.dpAmount });
    });
    return allEntries;
  }, [transactions, bookings, pricePerHour]);

  const revenueChartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const income = combinedData.filter(t => t.date === dateStr && t.type === 'income').reduce((s, t) => s + t.amount, 0);
      return { name: format(d, 'EEE'), Pendapatan: income };
    });
  }, [combinedData]);

  const inventoryChartData = [
    { name: 'Excellent', value: invStats.excellent },
    { name: 'Good', value: invStats.good },
    { name: 'Perlu Servis', value: invStats.needsRepair },
    { name: 'Rusak', value: invStats.broken },
  ].filter(d => d.value > 0);

  const topCustomers = [...customers].sort((a, b) => b.totalBookings - a.totalBookings).slice(0, 5);

  // Today's bookings
  const todayStr = format(today, 'yyyy-MM-dd');
  const tomorrowStr = format(subDays(today, -1), 'yyyy-MM-dd');
  const todayBookings = bookings.filter(b => b.date === todayStr).sort((a, b) => a.hour - b.hour);
  const tomorrowBookings = bookings.filter(b => b.date === tomorrowStr).sort((a, b) => a.hour - b.hour);
  const upcomingBookings = [...todayBookings.map(b => ({ ...b, _tag: 'Hari Ini' })), ...tomorrowBookings.map(b => ({ ...b, _tag: 'Besok' }))].slice(0, 5);

  const formatCurrency = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  const formatK = (num) => num >= 1000000 ? `${(num / 1000000).toFixed(1)}jt` : num >= 1000 ? `${Math.round(num / 1000)}k` : num;

  const getStatusColor = (s) => ({ confirmed: '#4CAF50', dp: '#00f0ff', pending: '#FF9800', maintenance: '#6b6b76' }[s] || '#6b6b76');

  return (
    <div className="dashboard-page">

      {/* ===== Greeting Banner ===== */}
      <div className="dash-greeting glass-panel">
        <div className="dash-greeting-left">
          <div className="dash-greeting-icon"><Music2 size={22} /></div>
          <div>
            <h2 className="dash-greeting-title">{greeting}, Admin! 👋</h2>
            <p className="dash-greeting-sub">{studioName} · {format(today, 'EEEE, dd MMMM yyyy')}</p>
          </div>
        </div>
        <div className="dash-greeting-right">
          {invStats.serviceNeeded > 0 && (
            <div className="dash-alert-chip warning">
              <AlertTriangle size={13} />
              <span>{invStats.serviceNeeded} alat perlu servis</span>
            </div>
          )}
          {bookingStats.pending > 0 && (
            <div className="dash-alert-chip danger">
              <Clock size={13} />
              <span>{bookingStats.pending} booking belum bayar</span>
            </div>
          )}
          {bookingStats.pending === 0 && invStats.serviceNeeded === 0 && (
            <div className="dash-alert-chip success">
              <CheckCircle2 size={13} />
              <span>Semua berjalan lancar!</span>
            </div>
          )}
        </div>
      </div>

      {/* ===== Stats Cards ===== */}
      <div className="dash-stats-grid tour-dashboard-stats">
        {/* Revenue */}
        <div className="dash-stat-card glass-panel">
          <div className="dash-stat-top">
            <div className="stat-icon-wrapper blue"><TrendingUp size={20} /></div>
            {revTrend !== null && (
              <span className={`dash-trend ${revTrend >= 0 ? 'up' : 'down'}`}>
                {revTrend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {revTrend >= 0 ? '+' : ''}{revTrend}%
              </span>
            )}
          </div>
          <div className="dash-stat-value">{formatCurrency(bookingStats.totalRevenue)}</div>
          <div className="dash-stat-label">Pendapatan Bulan Ini</div>
          <div className="dash-stat-sub">vs {formatCurrency(lastMonthStats.totalRevenue)} bulan lalu</div>
        </div>

        {/* Bookings */}
        <div className="dash-stat-card glass-panel">
          <div className="dash-stat-top">
            <div className="stat-icon-wrapper green"><CalendarCheck size={20} /></div>
            {bookTrend !== null && (
              <span className={`dash-trend ${bookTrend >= 0 ? 'up' : 'down'}`}>
                {bookTrend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {bookTrend >= 0 ? '+' : ''}{bookTrend}%
              </span>
            )}
          </div>
          <div className="dash-stat-value">{bookingStats.totalBookings}<span className="dash-stat-unit"> sesi</span></div>
          <div className="dash-stat-label">Total Booking Bulan Ini</div>
          <div className="dash-stat-pills">
            <span className="dash-pill confirmed">{bookingStats.confirmed} Lunas</span>
            <span className="dash-pill dp">{bookingStats.dp} DP</span>
            <span className="dash-pill pending">{bookingStats.pending} Pending</span>
          </div>
        </div>

        {/* Customers */}
        <div className="dash-stat-card glass-panel">
          <div className="dash-stat-top">
            <div className="stat-icon-wrapper pink"><Users size={20} /></div>
          </div>
          <div className="dash-stat-value">{customers.length}<span className="dash-stat-unit"> orang</span></div>
          <div className="dash-stat-label">Total Pelanggan Terdaftar</div>
          <div className="dash-stat-sub">{bookingStats.totalHours} jam terpakai bulan ini</div>
        </div>

        {/* Inventory Alert */}
        <div className="dash-stat-card glass-panel">
          <div className="dash-stat-top">
            <div className={`stat-icon-wrapper ${invStats.serviceNeeded > 0 ? 'orange' : 'green'}`}>
              <PackageOpen size={20} />
            </div>
          </div>
          <div className={`dash-stat-value ${invStats.serviceNeeded > 0 ? 'warn' : ''}`}>
            {invStats.serviceNeeded}<span className="dash-stat-unit"> item</span>
          </div>
          <div className="dash-stat-label">Alat Perlu Perhatian</div>
          <div className="dash-stat-sub">dari {invStats.totalItems} total alat inventaris</div>
        </div>
      </div>

      {/* ===== Main Grid: Charts + Upcoming ===== */}
      <div className="dash-main-grid">

        {/* Revenue Chart */}
        <div className="chart-container glass-panel span-2 tour-dashboard-revenue-chart">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Tren Pendapatan</h3>
              <p className="chart-sub">7 hari terakhir</p>
            </div>
            <button className="chart-link-btn" onClick={() => navigate('/keuangan')}>
              Lihat Detail <ArrowRight size={14} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatK} width={50} />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#17171d', 
                  border: '1px solid rgba(255, 255, 255, 0.08)', 
                  borderRadius: '12px', 
                  fontSize: '0.8rem',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                }}
                formatter={(v) => [formatCurrency(v), 'Pendapatan']}
                labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}
              />
              <Area 
                type="monotone" 
                dataKey="Pendapatan" 
                stroke="#00f0ff" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#cyanGrad)" 
                dot={{ r: 4, stroke: '#00f0ff', strokeWidth: 2, fill: '#0c0c10' }} 
                activeDot={{ r: 6, stroke: '#00f0ff', strokeWidth: 2, fill: '#00f0ff' }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming Bookings */}
        <div className="dash-upcoming glass-panel">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Jadwal Mendatang</h3>
              <p className="chart-sub">Hari ini & besok</p>
            </div>
            <button className="chart-link-btn" onClick={() => navigate('/kalender')}>
              Kalender <ArrowRight size={14} />
            </button>
          </div>
          {upcomingBookings.length === 0 ? (
            <div className="dash-empty-state">
              <CalendarCheck size={32} opacity={0.2} />
              <p>Tidak ada jadwal hari ini</p>
            </div>
          ) : (
            <div className="upcoming-list">
              {upcomingBookings.map(b => (
                <div key={b.id} className="upcoming-item">
                  <div className="upcoming-status-bar" style={{ background: getStatusColor(b.status) }} />
                  <div className="upcoming-info">
                    <div className="upcoming-band">{b.band}</div>
                    <div className="upcoming-time">
                      <Clock size={11} /> {b.hour}.00 – {b.hour + b.duration}.00
                    </div>
                  </div>
                  <span className={`upcoming-tag tag-${b._tag === 'Hari Ini' ? 'today' : 'tomorrow'}`}>{b._tag}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory Pie */}
        <div className="chart-container glass-panel tour-dashboard-inventory-chart">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Kondisi Inventaris</h3>
              <p className="chart-sub">{invStats.totalItems} item total</p>
            </div>
            <button className="chart-link-btn" onClick={() => navigate('/inventaris')}>
              Detail <ArrowRight size={14} />
            </button>
          </div>
          {inventoryChartData.length === 0 ? (
            <div className="dash-empty-state">
              <PackageOpen size={32} opacity={0.2} />
              <p>Belum ada data inventaris</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie 
                  data={inventoryChartData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={5} 
                  cornerRadius={4}
                  dataKey="value" 
                  strokeWidth={0}
                >
                  {inventoryChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#17171d', 
                    border: '1px solid rgba(255, 255, 255, 0.08)', 
                    borderRadius: '12px', 
                    fontSize: '0.8rem',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="inv-legend">
            {inventoryChartData.map((d, i) => (
              <div key={i} className="inv-legend-item">
                <span className="inv-legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
                <span>{d.name}</span>
                <strong>{d.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="dash-table-card glass-panel span-2 tour-dashboard-top-customers">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Top Pelanggan</h3>
              <p className="chart-sub">Berdasarkan loyalitas booking</p>
            </div>
            <button className="chart-link-btn" onClick={() => navigate('/pelanggan')}>
              Semua <ArrowRight size={14} />
            </button>
          </div>
          {topCustomers.length === 0 ? (
            <div className="dash-empty-state">
              <Users size={32} opacity={0.2} />
              <p>Belum ada data pelanggan</p>
            </div>
          ) : (
            <div className="top-customers-list">
              {topCustomers.map((c, i) => (
                <div key={c.id} className="top-cust-row">
                  <div className={`top-cust-rank rank-${i + 1}`}>#{i + 1}</div>
                  <div className="top-cust-avatar">{c.name.charAt(0).toUpperCase()}</div>
                  <div className="top-cust-info">
                    <span className="top-cust-name">{c.name}</span>
                    <span className="top-cust-phone">{c.phone || '—'}</span>
                  </div>
                  <div className="top-cust-stats">
                    <span className="top-cust-bookings">{c.totalBookings}</span>
                    <span className="top-cust-unit">sesi</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
