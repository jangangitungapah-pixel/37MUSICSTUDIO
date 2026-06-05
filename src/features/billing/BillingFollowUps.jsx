import { Bell } from 'lucide-react';

const BillingFollowUps = ({ billingInsights, formatCurrency, onSendReminder }) => (
  <div className="billing-smart-panel">
    <div className="billing-smart-main">
      <div>
        <span className="app-section-eyebrow">Smart Billing</span>
        <h3>Prioritas Follow-up</h3>
        <p>{billingInsights.summary}</p>
      </div>
    </div>
    <div className="billing-smart-list">
      {billingInsights.openInvoices.slice(0, 3).map((invoice) => (
        <div key={invoice.id} className={`billing-smart-item ${invoice.urgency}`}>
          <div>
            <strong>{invoice.band}</strong>
            <span style={{ color: invoice.urgency === 'high' ? 'var(--accent-pink)' : invoice.urgency === 'medium' ? '#FFC107' : 'var(--text-secondary)' }}>
              {invoice.daysUntil < 0 ? 'Lewat jadwal' : invoice.daysUntil === 0 ? 'Jadwal hari ini' : invoice.daysUntil === 1 ? 'Jadwal besok' : `H-${invoice.daysUntil}`}
            </span>
          </div>
          <small>{formatCurrency(invoice.remaining)}</small>
          <button
            type="button"
            className="billing-smart-btn"
            onClick={() => onSendReminder(invoice)}
            title="Kirim reminder WhatsApp"
            aria-label={`Kirim pengingat WhatsApp ke ${invoice.band}`}
          >
            <Bell size={13} />
          </button>
        </div>
      ))}
      {billingInsights.openInvoices.length === 0 && (
        <div className="billing-smart-empty">Tidak ada tagihan yang perlu ditindaklanjuti.</div>
      )}
    </div>
  </div>
);

export default BillingFollowUps;
