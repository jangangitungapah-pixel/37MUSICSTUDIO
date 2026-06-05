import { CheckCircle2, Gift, Inbox, MessageCircle, Send, Wrench, XCircle } from 'lucide-react';

const DashboardCommandCenter = ({
  pendingRequests,
  billingInsights,
  priorityMaintenance,
  retentionInsights,
  formatDateShort,
  formatCurrency,
  onNavigate,
  onApproveRequest,
  onRejectRequest,
  onSendBillingReminder,
  onCompleteMaintenance,
}) => (
  <section className="dash-command-grid">
    <section className="dash-command-panel glass-panel">
      <div className="dash-command-head">
        <div className="dash-command-title">
          <Inbox size={17} />
          <div>
            <h3>Request Publik</h3>
            <p>{pendingRequests.length} menunggu keputusan</p>
          </div>
        </div>
        <button className="dash-mini-link" onClick={() => onNavigate('/calendar')}>Kalender</button>
      </div>
      <div className="dash-work-list">
        {pendingRequests.slice(0, 3).map((request) => (
          <div className="dash-work-item" key={request.id}>
            <div className="dash-work-main">
              <strong>{request.band}</strong>
              <span>{formatDateShort(request.date)} - {String(request.hour).padStart(2, '0')}:00, {request.duration || 1} jam</span>
            </div>
            <div className="dash-work-actions">
              <button
                className="icon-btn success dash-icon-action approve"
                onClick={() => onApproveRequest(request)}
                title="Approve request"
                aria-label={`Setujui request booking dari ${request.band}`}
              >
                <CheckCircle2 size={14} />
              </button>
              <button
                className="icon-btn delete dash-icon-action reject"
                onClick={() => onRejectRequest(request)}
                title="Tolak request"
                aria-label={`Tolak request booking dari ${request.band}`}
              >
                <XCircle size={14} />
              </button>
            </div>
          </div>
        ))}
        {pendingRequests.length === 0 && (
          <div className="dash-work-empty">
            <CheckCircle2 size={18} />
            <span>Tidak ada request baru.</span>
          </div>
        )}
      </div>
    </section>

    <section className="dash-command-panel glass-panel">
      <div className="dash-command-head">
        <div className="dash-command-title">
          <MessageCircle size={17} />
          <div>
            <h3>Tagihan Prioritas</h3>
            <p>{billingInsights.openInvoices.length} invoice terbuka</p>
          </div>
        </div>
        <button className="dash-mini-link" onClick={() => onNavigate('/billing')}>Billing</button>
      </div>
      <div className="dash-work-list">
        {billingInsights.openInvoices.slice(0, 3).map((invoice) => (
          <div className={`dash-work-item urgency-${invoice.urgency}`} key={invoice.id}>
            <div className="dash-work-main">
              <strong>{invoice.band}</strong>
              <span>{invoice.daysUntil < 0 ? 'Lewat jadwal' : invoice.daysUntil === 0 ? 'Jadwal hari ini' : invoice.daysUntil === 1 ? 'Jadwal besok' : `H-${invoice.daysUntil}`} - {formatCurrency(invoice.remaining)}</span>
            </div>
            <button
              className="icon-btn cyan dash-icon-action send"
              onClick={() => onSendBillingReminder(invoice)}
              title="Kirim reminder WhatsApp"
              aria-label={`Kirim pengingat tagihan WhatsApp ke ${invoice.band}`}
            >
              <Send size={14} />
            </button>
          </div>
        ))}
        {billingInsights.openInvoices.length === 0 && (
          <div className="dash-work-empty">
            <CheckCircle2 size={18} />
            <span>Semua tagihan tertangani.</span>
          </div>
        )}
      </div>
    </section>

    <section className="dash-command-panel glass-panel">
      <div className="dash-command-head">
        <div className="dash-command-title">
          <Wrench size={17} />
          <div>
            <h3>Operasional</h3>
            <p>Servis dan retensi</p>
          </div>
        </div>
        <button className="dash-mini-link" onClick={() => onNavigate('/maintenance')}>Detail</button>
      </div>
      <div className="dash-work-list">
        {priorityMaintenance.slice(0, 2).map(({ item, label, reason }) => (
          <div className="dash-work-item" key={item.id}>
            <div
              className="dash-work-main"
              onClick={() => onNavigate('/maintenance')}
              style={{ cursor: 'pointer', flex: 1 }}
            >
              <strong>{item.name}</strong>
              <span>{label} - {reason}</span>
            </div>
            <div className="dash-work-actions">
              <button
                type="button"
                className="icon-btn success dash-icon-action approve"
                onClick={(event) => { event.stopPropagation(); onCompleteMaintenance(item); }}
                title="Tandai Selesai Servis"
                aria-label={`Selesaikan servis untuk ${item.name}`}
              >
                <CheckCircle2 size={14} />
              </button>
            </div>
          </div>
        ))}
        <button className="dash-work-item as-button" onClick={() => onNavigate('/customers')}>
          <div className="dash-work-main">
            <strong>{retentionInsights.passiveCustomers.length} pelanggan pasif</strong>
            <span>{retentionInsights.vipCandidates.length} kandidat VIP, {retentionInsights.promoTargets.length} target promo</span>
          </div>
          <Gift size={14} />
        </button>
      </div>
    </section>
  </section>
);

export default DashboardCommandCenter;
