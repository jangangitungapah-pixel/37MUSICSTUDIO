import React, { useMemo } from 'react';
import { useBookingStore } from '../store/useBookingStore';
import { useCustomerStore } from '../store/useCustomerStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { format, subDays, startOfMonth, parseISO } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Users, CalendarCheck, PackageOpen } from 'lucide-react';
import './DashboardPage.css';

const COLORS = ['#00f0ff', '#ff2a5f', '#4CAF50', '#FFC107'];

const DashboardPage = () => {
  const { bookings, getMonthlyStats } = useBookingStore();
  const { customers } = useCustomerStore();
  const { inventory, getStats: getInvStats } = useInventoryStore();
  const { transactions } = useFinanceStore();
  const { pricePerHour } = useSettingsStore();

  const today = new Date();
  
  // Basic Stats
  const bookingStats = getMonthlyStats(today);
  const invStats = getInvStats();
  
  // Calculate combined finance
  const combinedData = useMemo(() => {
    let allEntries = [...transactions];
    bookings.forEach(b => {
      if (b.status === 'confirmed') {
        allEntries.push({ date: b.date, type: 'income', amount: b.duration * pricePerHour });
      } else if (b.status === 'dp' && b.dpAmount > 0) {
        allEntries.push({ date: b.date, type: 'income', amount: b.dpAmount });
      }
    });
    return allEntries;
  }, [transactions, bookings, pricePerHour]);

  // Chart Data: Last 7 Days Revenue
  const revenueChartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      
      const dayIncome = combinedData
        .filter(t => t.date === dateStr && t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
        
      data.push({
        name: format(d, 'dd MMM'),
        Pendapatan: dayIncome
      });
    }
    return data;
  }, [combinedData]);

  // Chart Data: Inventory Condition
  const inventoryChartData = [
    { name: 'Excellent', value: invStats.excellent },
    { name: 'Good', value: invStats.good },
    { name: 'Needs Repair', value: invStats.needsRepair },
    { name: 'Broken', value: invStats.broken },
  ].filter(d => d.value > 0);

  // Top Customers (Top 5 by total spent/bookings)
  const topCustomers = [...customers]
    .sort((a, b) => b.totalBookings - a.totalBookings)
    .slice(0, 5);

  const formatCurrency = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Dashboard Analytics</h2>
          <p className="page-subtitle">Ringkasan performa 37 Music Studio bulan ini</p>
        </div>
      </header>

      {/* Top Stats Cards */}
      <div className="dash-stats-grid tour-dashboard-stats">
        <div className="dash-stat-card glass-panel">
          <div className="stat-icon-wrapper blue">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Pendapatan Kotor (Bulan Ini)</span>
            <span className="stat-value">{formatCurrency(bookingStats.totalRevenue)}</span>
          </div>
        </div>
        <div className="dash-stat-card glass-panel">
          <div className="stat-icon-wrapper green">
            <CalendarCheck size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Sesi Sewa</span>
            <span className="stat-value">{bookingStats.totalBookings} <small>Sesi</small></span>
          </div>
        </div>
        <div className="dash-stat-card glass-panel">
          <div className="stat-icon-wrapper pink">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Pelanggan Aktif</span>
            <span className="stat-value">{customers.length} <small>Band/Orang</small></span>
          </div>
        </div>
        <div className="dash-stat-card glass-panel">
          <div className="stat-icon-wrapper orange">
            <PackageOpen size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Alat Perlu Servis</span>
            <span className="stat-value">{invStats.serviceNeeded} <small>Item</small></span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-container glass-panel span-2 tour-dashboard-revenue-chart">
          <h3>Tren Pendapatan (7 Hari Terakhir)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(val) => `Rp ${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#14141a', border: '1px solid var(--border-light)', borderRadius: '8px' }}
                  formatter={(value) => [formatCurrency(value), 'Pendapatan']}
                />
                <Line type="monotone" dataKey="Pendapatan" stroke="var(--accent-cyan)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent-cyan)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-container glass-panel tour-dashboard-inventory-chart">
          <h3>Kondisi Inventaris Alat</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={inventoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {inventoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#14141a', border: '1px solid var(--border-light)', borderRadius: '8px' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="dashboard-bottom-grid">
        <div className="dash-table-card glass-panel tour-dashboard-top-customers">
          <h3>Top Customers (Loyalitas)</h3>
          <div className="table-responsive">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Nama Band/Penyewa</th>
                  <th>Kontak</th>
                  <th>Total Booking</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c, i) => (
                  <tr key={c.id}>
                    <td>
                      <div className="top-cust-name">
                        <span className={`rank-badge rank-${i+1}`}>{i+1}</span>
                        {c.name}
                      </div>
                    </td>
                    <td>{c.phone}</td>
                    <td><strong>{c.totalBookings}</strong> sesi</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DashboardPage;
