import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CalendarCheck, CheckCircle2, Clock, DollarSign, Inbox, TrendingUp, XCircle } from 'lucide-react';
import { mobileMenuVariants } from '../../animations';

const CalendarOverview = ({
  formatCurrency,
  isCollapsed,
  pendingRequests,
  revTrend,
  scheduleAnomalies,
  stats,
  onApproveRequest,
  onRejectRequest,
}) => (
  <AnimatePresence initial={false}>
    {!isCollapsed && (
      <motion.div
        id="calendar-top-panels"
        className="calendar-overview"
        variants={mobileMenuVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.22, ease: 'easeInOut' }}
      >
        <div className="calendar-stats-grid">
          <div className="calendar-stat-card">
            <div className="calendar-stat-icon stat-icon-bookings">
              <CalendarCheck size={18} color="var(--accent-cyan)" />
            </div>
            <div className="calendar-stat-data">
              <span className="calendar-stat-value">{stats.totalBookings}</span>
              <span className="calendar-stat-label">Total Booking</span>
            </div>
          </div>
          <div className="calendar-stat-card">
            <div className="calendar-stat-icon stat-icon-hours">
              <Clock size={18} color="var(--accent-pink)" />
            </div>
            <div className="calendar-stat-data">
              <span className="calendar-stat-value">{stats.totalHours}<small> jam</small></span>
              <span className="calendar-stat-label">Jam Terpakai</span>
            </div>
          </div>
          <div className="calendar-stat-card">
            <div className="calendar-stat-icon stat-icon-revenue">
              <DollarSign size={18} color="#4CAF50" />
            </div>
            <div className="calendar-stat-data">
              <span className="calendar-stat-value">{formatCurrency(stats.totalRevenue)}</span>
              <span className="calendar-stat-label">
                Est. Pendapatan
                {revTrend !== null && (
                  <span className={`trend-badge ${revTrend >= 0 ? 'up' : 'down'}`}>
                    <TrendingUp size={10} />{revTrend >= 0 ? '+' : ''}{revTrend}%
                  </span>
                )}
              </span>
            </div>
          </div>
          <div className="calendar-stat-card">
            <div className="calendar-stat-legend">
              <span className="calendar-stat-legend-item"><span className="dot confirmed" /> {stats.confirmed} Lunas</span>
              <span className="calendar-stat-legend-item"><span className="dot dp" /> {stats.dp} DP</span>
              <span className="calendar-stat-legend-item"><span className="dot pending" /> {stats.pending} Pending</span>
            </div>
          </div>
        </div>

        <div className="app-smart-panel">
          {scheduleAnomalies.length > 0 && (
            <div className="cal-smart-alert">
              <AlertTriangle size={15} />
              <span>{scheduleAnomalies.length} anomali jadwal terdeteksi. Pertama: {scheduleAnomalies[0].detail}</span>
            </div>
          )}
        </div>

        {pendingRequests.length > 0 && (
          <div className="app-smart-panel">
            <div className="smart-head">
              <Inbox size={20} />
              <div>
                <h3>Request Booking Publik</h3>
                <p>{pendingRequests.length} request menunggu persetujuan admin.</p>
              </div>
            </div>
            <div className="smart-list">
              {pendingRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="cal-request-chip">
                  <div className="cal-request-info">
                    <strong>{request.band}</strong>
                    <span>{request.date} &bull; {String(request.hour).padStart(2, '0')}.00-{String(Number(request.hour) + Number(request.duration || 1)).padStart(2, '0')}.00</span>
                  </div>
                  <div className="cal-request-actions">
                    <button className="request-approve" onClick={() => onApproveRequest(request)} title="Approve">
                      <CheckCircle2 size={15} /> Approve
                    </button>
                    <button className="request-reject" onClick={() => onRejectRequest(request)} title="Tolak">
                      <XCircle size={15} /> Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    )}
  </AnimatePresence>
);

export default CalendarOverview;
