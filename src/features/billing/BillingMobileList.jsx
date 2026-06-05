import { Printer } from 'lucide-react';
import { format } from 'date-fns';

const BillingMobileList = ({
  bookings,
  calculateRemaining,
  calculateTotal,
  formatCurrency,
  getDeadlineStatus,
  onOpenInvoice,
  onStatusChange,
  onMarkAsPaid,
}) => (
  <div className="mobile-billing-list show-on-mobile">
    {bookings.length === 0 ? (
      <div className="empty-state" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Tidak ada data transaksi.
      </div>
    ) : bookings.map((booking) => {
      const remaining = calculateRemaining(booking);
      const total = calculateTotal(booking);
      const deadline = getDeadlineStatus(booking);

      return (
        <div key={booking.id} className="mobile-billing-card" onClick={() => onOpenInvoice(booking)}>
          <div className="mobile-bill-top">
            <span className="mobile-bill-band">{booking.band}</span>
            <span className="mobile-bill-id">INV-{booking.id.toString().padStart(5, '0')}</span>
          </div>
          <div className="mobile-bill-mid">
            <span className="mobile-bill-tag date">{format(new Date(booking.date), 'dd MMM yyyy')}</span>
            <span className="mobile-bill-tag total">{formatCurrency(total)}</span>
            {remaining > 0 && <span className="mobile-bill-tag debt">Sisa: {formatCurrency(remaining)}</span>}
            {deadline.state !== 'none' ? (
              <span className={`mobile-bill-tag deadline ${deadline.state}`}>{deadline.label}</span>
            ) : null}
          </div>
          <div className="mobile-bill-bottom" onClick={(event) => event.stopPropagation()}>
            <select
              className={`status-select ${booking.status}`}
              value={booking.status}
              onChange={(event) => onStatusChange(event, booking.id, event.target.value)}
              aria-label={`Ubah status pembayaran invoice ${booking.band}`}
            >
              <option value="pending">Belum Bayar</option>
              <option value="dp">DP {booking.dpAmount > 0 ? `(${formatCurrency(booking.dpAmount)})` : ''}</option>
              <option value="confirmed">Lunas</option>
            </select>
            <div className="mobile-bill-actions" onClick={(event) => event.stopPropagation()}>
              {remaining > 0 && (
                <button className="btn-sm-pay" onClick={(event) => onMarkAsPaid(event, booking.id)} aria-label={`Tandai lunas invoice band ${booking.band}`}>
                  Lunasi
                </button>
              )}
              <button className="icon-btn" onClick={(event) => { event.stopPropagation(); onOpenInvoice(booking); }} title="Invoice" aria-label={`Lihat detail invoice band ${booking.band}`}>
                <Printer size={14} />
              </button>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export default BillingMobileList;
