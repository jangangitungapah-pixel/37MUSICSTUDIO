import { AnimatePresence, motion } from 'framer-motion';
import { Clock, MessageCircle, Phone, RotateCcw, StickyNote, Trash2, X } from 'lucide-react';
import { getDepositDeadlineStatus } from '../../lib/bookingWorkflows';

const BOOKING_STATUSES = ['pending', 'dp', 'confirmed'];

const BookingDetailPopup = ({
  booking,
  detailPos,
  formatCurrency,
  inventory,
  isMobile,
  pricePerHour,
  getStatusLabel,
  onCancelBooking,
  onChangeDuration,
  onClose,
  onDeleteBooking,
  onOpenReschedule,
  onSendReminder,
  onStatusChange,
}) => {
  const isRecording = booking?.type === 'recording';
  const basePrice = booking ? (isRecording ? (booking.sessionPrice || 0) : (booking.duration * pricePerHour)) : 0;
  const equipmentCost = booking?.equipmentCost || 0;
  const totalPrice = booking ? basePrice + equipmentCost - (booking.discountAmount || 0) : 0;

  return (
    <div className="booking-detail-portal-container" style={{ position: 'fixed', inset: 0, zIndex: 100000, pointerEvents: 'none' }}>
      <AnimatePresence>
        {booking && isMobile && (
          <motion.div
            key="detail-overlay"
            className="detail-overlay"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            style={{ pointerEvents: 'auto' }}
          />
        )}
        {booking && (
          <motion.div
            key="detail-popup"
            className={`booking-detail-popup ${isMobile ? 'mobile-sheet' : ''}`}
            style={{
              pointerEvents: 'auto',
              ...(!isMobile ? { top: detailPos.top, left: detailPos.left } : {}),
            }}
            onClick={(event) => event.stopPropagation()}
            initial={isMobile ? { y: 80, opacity: 0 } : { scale: 0.95, opacity: 0, y: -4 }}
            animate={isMobile ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
            exit={isMobile ? { y: 80, opacity: 0 } : { scale: 0.95, opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
          >
            <div className="detail-header">
              <div className="detail-header-info">
                <span className={`detail-status-dot status-${booking.status}`} />
                <h4>{booking.band} {isRecording && <span className="recording-pill">Recording</span>}</h4>
              </div>
              <div className="detail-header-actions">
                <span className={`detail-status-badge status-${booking.status}`}>{getStatusLabel(booking.status)}</span>
                <button className="icon-btn detail-close" onClick={onClose} aria-label="Tutup detail booking"><X size={16} /></button>
              </div>
            </div>

            <div className="detail-body">
              <div className="detail-info-row">
                <Clock size={14} />
                <div className="detail-info-content">
                  <span>{booking.date} • {booking.hour}.00 – {booking.hour + booking.duration}.00 WIB</span>
                  {isRecording ? (
                    <div className="duration-controls is-muted">
                      <span className="dur-label">Paket Sesi ({booking.duration} jam)</span>
                    </div>
                  ) : (
                    <div className="duration-controls">
                      <button className="dur-btn" onClick={() => onChangeDuration(booking, Math.max(1, booking.duration - 1))} disabled={booking.duration <= 1} aria-label="Kurangi durasi">−</button>
                      <span className="dur-label">{booking.duration} jam</span>
                      <button className="dur-btn" onClick={() => onChangeDuration(booking, Math.min(13, booking.duration + 1))} aria-label="Tambah durasi">+</button>
                    </div>
                  )}
                </div>
              </div>

              {booking.phone && booking.status !== 'maintenance' && (
                <div className="detail-info-row"><Phone size={14} /><span>{booking.phone}</span></div>
              )}

              {booking.note && (
                <div className="detail-info-row"><StickyNote size={14} /><span>{booking.note}</span></div>
              )}

              {booking.status !== 'maintenance' && (
                <div className="detail-price-card">
                  <div className="detail-price-row">
                    <span>Subtotal {isRecording ? '(Sesi Recording)' : `(${booking.duration} jam)`}</span>
                    <span>{formatCurrency(basePrice)}</span>
                  </div>
                  {booking.rentedEquipment && booking.rentedEquipment.length > 0 && (
                    <div className="detail-price-row equipment">
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>Sewa Alat Tambahan</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {booking.rentedEquipment.map((id) => inventory.find((item) => item.id === id)?.name || 'Alat').join(', ')}
                        </span>
                      </div>
                      <span>{formatCurrency(equipmentCost)}</span>
                    </div>
                  )}
                  {(booking.discountAmount || 0) > 0 && (
                    <div className="detail-price-row discount">
                      <span>Diskon VIP</span>
                      <span>−{formatCurrency(booking.discountAmount)}</span>
                    </div>
                  )}
                  <div className="detail-price-row total">
                    <span>Total</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
                  {booking.status === 'dp' && booking.dpAmount > 0 && (
                    <>
                      <div className="detail-price-row dp"><span>DP Dibayar</span><span>{formatCurrency(booking.dpAmount)}</span></div>
                      <div className="detail-price-row remaining"><span>Sisa Tagihan</span><span>{formatCurrency(totalPrice - booking.dpAmount)}</span></div>
                    </>
                  )}
                  {booking.status === 'confirmed' && <div className="detail-paid-badge">✓ Lunas</div>}
                  {booking.status === 'pending' && <div className="detail-unpaid-badge">⚠ Belum Dibayar</div>}
                  {(() => {
                    const deadline = getDepositDeadlineStatus(booking);
                    return deadline.state !== 'none' ? (
                      <div className={`detail-deadline-badge ${deadline.state}`}>Deadline: {deadline.label}</div>
                    ) : null;
                  })()}
                  {booking.status === 'cancelled' && (
                    <div className="detail-cancelled-note">Dibatalkan{booking.cancelReason ? `: ${booking.cancelReason}` : ''}</div>
                  )}
                </div>
              )}

              {booking.status !== 'maintenance' && booking.status !== 'cancelled' && (
                <div className="detail-status-section">
                  <label>Ubah Status</label>
                  <div className="status-buttons">
                    {BOOKING_STATUSES.map((status) => (
                      <button key={status} className={`status-btn ${status} ${booking.status === status ? 'active' : ''}`} onClick={() => onStatusChange(booking.id, status)}>
                        {getStatusLabel(status)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="detail-footer">
              <button className="btn-danger" onClick={() => onDeleteBooking(booking.id)}>
                <Trash2 size={14} /><span>{booking.status === 'maintenance' ? 'Hapus Blokir' : 'Hapus'}</span>
              </button>
              {booking.status !== 'maintenance' && (
                <button className="btn-secondary" onClick={onSendReminder}>
                  <MessageCircle size={14} /><span>Kirim Pengingat</span>
                </button>
              )}
              {booking.status !== 'maintenance' && booking.status !== 'cancelled' && (
                <>
                  <button className="btn-secondary" onClick={() => onOpenReschedule(booking)}>
                    <RotateCcw size={14} /><span>Reschedule</span>
                  </button>
                  <button className="btn-danger" onClick={() => onCancelBooking(booking)}>
                    <X size={14} /><span>Batal Booking</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingDetailPopup;
