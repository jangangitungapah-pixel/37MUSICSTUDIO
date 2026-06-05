import { ArrowRight, CalendarCheck, CheckCircle2, Clock, MessageCircle, PackageOpen, Users } from 'lucide-react';

const DashboardMainGrid = ({
  revenueChartData,
  maxRevenue,
  inventoryChartData,
  invStats,
  upcomingBookings,
  currentHour,
  topCustomers,
  formatK,
  getStatusColor,
  onNavigate,
  onInstantPay,
  onSendBookingReminder,
  onContactCustomer,
}) => (
  <div className="dash-main-grid">
    <div className="chart-container glass-panel span-2">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">Tren Pendapatan</h3>
          <p className="chart-sub">7 hari terakhir</p>
        </div>
        <button className="chart-link-btn" onClick={() => onNavigate('/finance')}>
          Lihat Detail <ArrowRight size={14} />
        </button>
      </div>
      <div className="lite-revenue-chart" aria-label="Pendapatan 7 hari terakhir">
        {revenueChartData.map((item) => {
          const height = Math.max(6, Math.round((item.Pendapatan / maxRevenue) * 100));
          return (
            <div className="lite-revenue-day" key={item.name}>
              <div className="lite-revenue-track">
                <span className="lite-revenue-bar" style={{ height: `${height}%` }} />
              </div>
              <strong>{formatK(item.Pendapatan)}</strong>
              <span>{item.name}</span>
            </div>
          );
        })}
      </div>
    </div>

    <div className="dash-upcoming app-card">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">Jadwal Mendatang</h3>
          <p className="chart-sub">Hari ini & besok</p>
        </div>
        <button className="chart-link-btn" onClick={() => onNavigate('/calendar')}>
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
          {upcomingBookings.map((booking) => {
            const isLive = booking._tag === 'Hari Ini' && currentHour >= booking.hour && currentHour < (booking.hour + booking.duration);
            return (
              <div key={booking.id} className={`upcoming-item ${isLive ? 'live-item' : ''}`}>
                <div className="upcoming-status-bar" style={{ background: getStatusColor(booking.status) }} />
                <div className="upcoming-info">
                  <div className="upcoming-band">{booking.band}</div>
                  <div className="upcoming-time">
                    <Clock size={11} /> {booking.hour}.00 - {booking.hour + booking.duration}.00
                  </div>
                </div>
                {isLive ? (
                  <span className="upcoming-tag tag-live">
                    <span className="live-pulse-dot" /> LIVE NOW
                  </span>
                ) : (
                  <span className={`upcoming-tag tag-${booking._tag === 'Hari Ini' ? 'today' : 'tomorrow'}`}>{booking._tag}</span>
                )}
                <div className="dash-work-actions">
                  {booking.status !== 'confirmed' && (
                    <button
                      type="button"
                      className="icon-btn success dash-icon-action approve"
                      onClick={(event) => { event.stopPropagation(); onInstantPay(booking); }}
                      title="Lunasi Instan"
                      aria-label={`Lunasi Instan booking dari ${booking.band}`}
                    >
                      <CheckCircle2 size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-btn cyan dash-icon-action send"
                    onClick={(event) => { event.stopPropagation(); onSendBookingReminder(booking); }}
                    title="Kirim reminder WhatsApp"
                    aria-label={`Kirim pengingat WhatsApp ke ${booking.band}`}
                  >
                    <MessageCircle size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    <div className="chart-container glass-panel">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">Kondisi Inventaris</h3>
          <p className="chart-sub">{invStats.totalItems} item total</p>
        </div>
        <button className="chart-link-btn" onClick={() => onNavigate('/inventory')}>
          Detail <ArrowRight size={14} />
        </button>
      </div>
      {inventoryChartData.length === 0 ? (
        <div className="dash-empty-state">
          <PackageOpen size={32} opacity={0.2} />
          <p>Belum ada data inventaris</p>
        </div>
      ) : (
        <div className="lite-inventory-meter">
          <div className="donut-center-label lite-inventory-total">
            <span className="donut-center-val">{invStats.totalItems}</span>
            <span className="donut-center-lbl">Total Alat</span>
          </div>
          <div className="lite-inventory-bars">
            {inventoryChartData.map((item) => (
              <div className="lite-inventory-row" key={item.name}>
                <span>{item.name}</span>
                <div className="lite-inventory-track">
                  <span
                    className="lite-inventory-fill"
                    style={{
                      width: `${Math.max(4, Math.round((item.value / Math.max(invStats.totalItems, 1)) * 100))}%`,
                      background: item.color,
                    }}
                  />
                </div>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="inv-legend">
        {inventoryChartData.map((item) => (
          <div key={item.name} className="inv-legend-item">
            <span className="inv-legend-dot" style={{ background: item.color }} />
            <span>{item.name}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>

    <div className="dash-table-card app-card span-2">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">Top Pelanggan</h3>
          <p className="chart-sub">Berdasarkan loyalitas booking</p>
        </div>
        <button className="chart-link-btn" onClick={() => onNavigate('/customers')}>
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
          {topCustomers.map((customer, index) => (
            <div key={customer.id} className="top-cust-row">
              <div className={`top-cust-rank rank-${index + 1}`}>#{index + 1}</div>
              <div className="top-cust-avatar">{customer.name.charAt(0).toUpperCase()}</div>
              <div className="top-cust-info">
                <span className="top-cust-name">{customer.name}</span>
                <span className="top-cust-phone">{customer.phone || '-'}</span>
              </div>
              <div className="top-cust-stats" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                  <span className="top-cust-bookings">{customer.totalBookings}</span>
                  <span className="top-cust-unit">sesi</span>
                </div>
                {customer.phone && (
                  <button
                    type="button"
                    className="icon-btn cyan dash-icon-action send"
                    onClick={(event) => { event.stopPropagation(); onContactCustomer(customer); }}
                    title="Hubungi WhatsApp"
                    aria-label={`Hubungi WhatsApp ${customer.name}`}
                  >
                    <MessageCircle size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default DashboardMainGrid;
