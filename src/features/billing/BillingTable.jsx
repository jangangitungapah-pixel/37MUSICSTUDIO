import { Printer } from 'lucide-react';
import { format } from 'date-fns';

const BillingTable = ({
  bookings,
  calculateRemaining,
  calculateTotal,
  formatCurrency,
  getDeadlineStatus,
  onOpenInvoice,
  onStatusChange,
  onMarkAsPaid,
}) => (
  <div className="app-table-wrapper tour-bill-table hide-on-mobile">
    <table className="app-table billing-table">
      <thead>
        <tr>
          <th>Invoice ID</th>
          <th>Tanggal</th>
          <th>Penyewa</th>
          <th>Total Harga</th>
          <th>Status Pembayaran</th>
          <th>Sisa Tagihan</th>
          <th className="action-col">Aksi</th>
        </tr>
      </thead>
      <tbody>
        {bookings.length === 0 ? (
          <tr><td colSpan="7" className="empty-state">Tidak ada data transaksi.</td></tr>
        ) : bookings.map((booking) => {
          const remaining = calculateRemaining(booking);
          const total = calculateTotal(booking);
          const deadline = getDeadlineStatus(booking);

          return (
            <tr key={booking.id} onClick={() => onOpenInvoice(booking)}>
              <td className="inv-id">INV-{booking.id.toString().padStart(5, '0')}</td>
              <td>{format(new Date(booking.date), 'dd MMM yyyy')}</td>
              <td className="inv-band">
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {booking.band}
                  {booking.discountAmount > 0 && (
                    <span title="VIP Discount" style={{ fontSize: '10px', background: '#FFC107', color: '#000', padding: '1px 4px', borderRadius: '4px' }}>VIP</span>
                  )}
                </div>
              </td>
              <td className="inv-total">{formatCurrency(total)}</td>
              <td onClick={(event) => event.stopPropagation()}>
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
              </td>
              <td className={`inv-remaining ${remaining > 0 ? 'has-debt' : ''}`}>
                {remaining > 0 ? formatCurrency(remaining) : '-'}
                {deadline.state !== 'none' ? (
                  <span className={`deadline-chip ${deadline.state}`}>{deadline.label}</span>
                ) : null}
              </td>
              <td className="action-col">
                <div className="row-actions">
                  {remaining > 0 && (
                    <button
                      className="btn-sm-pay"
                      onClick={(event) => onMarkAsPaid(event, booking.id)}
                      title="Tandai Lunas"
                      aria-label={`Tandai lunas invoice band ${booking.band}`}
                    >
                      Lunasi
                    </button>
                  )}
                  <button
                    className="icon-btn"
                    onClick={(event) => { event.stopPropagation(); onOpenInvoice(booking); }}
                    title="Lihat Invoice"
                    aria-label={`Lihat detail invoice band ${booking.band}`}
                  >
                    <Printer size={16} />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default BillingTable;
