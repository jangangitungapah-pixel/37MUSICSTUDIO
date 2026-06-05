import { format } from 'date-fns';
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Download,
  Inbox,
  Music2,
  TrendingDown,
} from 'lucide-react';

const DashboardHeader = ({
  greeting,
  displayName,
  studioName,
  currentTime,
  invStats,
  bookingStats,
  pendingRequests,
  onQuickBooking,
  onQuickExpense,
  onExportExcel,
}) => (
  <section className="dash-greeting glass-panel">
    <div className="dash-greeting-left">
      <div className="dash-greeting-icon"><Music2 size={24} /></div>
      <div>
        <h2 className="dash-greeting-title">{greeting}, {displayName}! 👋</h2>
        <p className="dash-greeting-sub">{studioName}</p>
      </div>
    </div>

    <div className="dash-live-clock-widget">
      <div className="clock-time">{format(currentTime, 'HH:mm')}</div>
      <div className="clock-details">
        <span className="clock-date">{format(currentTime, 'EEEE, dd MMM yyyy')}</span>
        <span className="clock-status-live"><span className="status-live-pulse" /> Live cockpit</span>
      </div>
    </div>

    <div className="dash-greeting-right">
      <div className="dash-alerts-strip">
        {invStats.serviceNeeded > 0 && (
          <div className="dash-alert-chip warning">
            <AlertTriangle size={13} />
            <span>{invStats.serviceNeeded} alat servis</span>
          </div>
        )}
        {bookingStats.pending > 0 && (
          <div className="dash-alert-chip danger">
            <Clock size={13} />
            <span>{bookingStats.pending} pending</span>
          </div>
        )}
        {pendingRequests.length > 0 && (
          <div className="dash-alert-chip info">
            <Inbox size={13} />
            <span>{pendingRequests.length} request</span>
          </div>
        )}
        {bookingStats.pending === 0 && invStats.serviceNeeded === 0 && pendingRequests.length === 0 && (
          <div className="dash-alert-chip success">
            <CheckCircle2 size={13} />
            <span>Semua aman!</span>
          </div>
        )}
      </div>

      <div className="dash-action-toolbar">
        <button
          type="button"
          onClick={onQuickBooking}
          className="btn-primary qb-btn"
          title="Tambah Booking Cepat"
          aria-label="Tambah Booking Cepat"
        >
          <CalendarCheck size={16} />
          <span>+ Booking</span>
        </button>
        <button
          type="button"
          onClick={onQuickExpense}
          className="btn-primary qe-btn"
          title="Catat Pengeluaran Cepat"
          aria-label="Catat Pengeluaran Cepat"
        >
          <TrendingDown size={16} />
          <span>+ Pengeluaran</span>
        </button>
        <button
          type="button"
          onClick={onExportExcel}
          className="btn-secondary"
          title="Unduh Semua Laporan (Excel)"
          aria-label="Unduh Semua Laporan Excel"
        >
          <Download size={16} />
          <span>Laporan</span>
        </button>
      </div>
    </div>
  </section>
);

export default DashboardHeader;
