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
        className="cal-overview"
        variants={mobileMenuVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.22, ease: 'easeInOut' }}
      >
        {/* Stats Row */}
        <div className="cal-stats-row">
          <div className="cal-stat">
            <div className="cal-stat-icon teal">
              <CalendarCheck size={17} />
            </div>
            <div className="cal-stat-body">
              <span className="cal-stat-val">{stats.totalBookings}</span>
              <span className="cal-stat-lbl">Total Booking</span>
            </div>
          </div>

          <div className="cal-stat">
            <div className="cal-stat-icon gold">
              <Clock size={17} />
            </div>
            <div className="cal-stat-body">
              <span className="cal-stat-val">{stats.totalHours}<small> jam</small></span>
              <span className="cal-stat-lbl">Jam Terpakai</span>
            </div>
          </div>

          <div className="cal-stat">
            <div className="cal-stat-icon green">
              <DollarSign size={17} />
            </div>
            <div className="cal-stat-body">
              <span className="cal-stat-val" style={{ fontSize: '1rem' }}>
                {formatCurrency(stats.totalRevenue)}
              </span>
              <span className="cal-stat-lbl">
                Est. Pendapatan
                {revTrend !== null && (
                  <span className={`cal-trend ${revTrend >= 0 ? 'up' : 'down'}`}>
                    <TrendingUp size={9} />
                    {revTrend >= 0 ? '+' : ''}{revTrend}%
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="cal-stat">
            <div className="cal-stat-legend">
              <div className="cal-legend-row">
                <span className="cal-legend-dot confirmed" />
                <span>{stats.confirmed} Lunas</span>
              </div>
              <div className="cal-legend-row">
                <span className="cal-legend-dot dp" />
                <span>{stats.dp} DP</span>
              </div>
              <div className="cal-legend-row">
                <span className="cal-legend-dot pending" />
                <span>{stats.pending} Pending</span>
              </div>
            </div>
          </div>
        </div>

        {/* Anomaly alert */}
        {scheduleAnomalies.length > 0 && (
          <div className="cal-smart-strip">
            <AlertTriangle size={14} />
            <span>
              <strong>{scheduleAnomalies.length} anomali</strong> terdeteksi — {scheduleAnomalies[0].detail}
            </span>
          </div>
        )}

        {/* Pending requests */}
        {pendingRequests.length > 0 && (
          <div className="cal-inbox">
            <div className="cal-inbox-head">
              <Inbox size={16} color="var(--c-teal)" />
              <h3>Request Booking Publik</h3>
              <p>{pendingRequests.length} menunggu persetujuan</p>
            </div>
            <div className="cal-inbox-list">
              {pendingRequests.slice(0, 5).map((req) => (
                <div key={req.id} className="cal-req-chip">
                  <div className="cal-req-info">
                    <strong>{req.band}</strong>
                    <span>
                      {req.date} · {String(req.hour).padStart(2, '0')}.00–
                      {String(Number(req.hour) + Number(req.duration || 1)).padStart(2, '0')}.00
                    </span>
                  </div>
                  <div className="cal-req-btns">
                    <button className="cal-req-approve" onClick={() => onApproveRequest(req)} title="Approve">
                      <CheckCircle2 size={13} /> Approve
                    </button>
                    <button className="cal-req-reject" onClick={() => onRejectRequest(req)} title="Tolak">
                      <XCircle size={13} /> Tolak
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
