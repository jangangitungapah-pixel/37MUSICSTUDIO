import { AnimatePresence, motion } from 'framer-motion';
import { Clock, MessageCircle, Phone, RotateCcw, StickyNote, Trash2, X } from 'lucide-react';
import { getDepositDeadlineStatus } from '../../lib/bookingWorkflows';

const BOOKING_STATUSES = ['pending', 'dp', 'confirmed'];
const STATUS_LABELS = { confirmed: 'Lunas', dp: 'DP', pending: 'Belum Bayar', cancelled: 'Batal', maintenance: 'Blokir' };

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
  const isRecording   = booking?.type === 'recording';
  const basePrice     = booking ? (isRecording ? (booking.sessionPrice || 0) : (booking.duration * pricePerHour)) : 0;
  const equipmentCost = booking?.equipmentCost || 0;
  const totalPrice    = booking ? basePrice + equipmentCost - (booking.discountAmount || 0) : 0;

  return (
    <div className="cal-page-portal" style={{ position: 'fixed', inset: 0, zIndex: 100000, pointerEvents: 'none' }}>
      <AnimatePresence>
        {/* Dark overlay on mobile */}
        {booking && isMobile && (
          <motion.div
            key="detail-overlay"
            className="cal-detail-overlay"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ pointerEvents: 'auto' }}
          />
        )}

        {booking && (
          <motion.div
            key="detail-popup"
            className={`cal-detail${isMobile ? ' mobile-sheet' : ''}`}
            style={{
              pointerEvents: 'auto',
              ...(!isMobile ? { top: detailPos.top, left: detailPos.left } : {}),
            }}
            onClick={(e) => e.stopPropagation()}
            initial={isMobile ? { y: 80, opacity: 0 } : { scale: 0.96, opacity: 0, y: -6 }}
            animate={isMobile ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
            exit={isMobile  ? { y: 80, opacity: 0 } : { scale: 0.96, opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: 'easeInOut' }}
          >
            {/* Header */}
            <div className="cal-detail-head">
              <div className="cal-detail-head-info">
                <span className={`cal-status-dot status-${booking.status}`} />
                <h4>
                  {booking.band}
                  {isRecording && <span className="cal-rec-pill">Recording</span>}
                </h4>
              </div>
              <div className="cal-detail-head-right">
                <span className={`cal-status-badge status-${booking.status}`}>
                  {getStatusLabel(booking.status)}
                </span>
                <button className="cal-detail-close" onClick={onClose} aria-label="Tutup">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="cal-detail-body">
              {/* Time + Duration */}
              <div className="cal-detail-row">
                <Clock size={14} color="var(--c-fnt)" />
                <div>
                  <div>{booking.date} · {booking.hour}.00 – {booking.hour + booking.duration}.00 WIB</div>
                  {isRecording ? (
                    <div style={{ marginTop: 4, fontSize: '.75rem', color: 'var(--c-mut)' }}>
                      Paket Sesi ({booking.duration} jam)
                    </div>
                  ) : (
                    <div className="cal-dur-controls">
                      <button
                        className="cal-dur-btn"
                        onClick={() => onChangeDuration(booking, Math.max(1, booking.duration - 1))}
                        disabled={booking.duration <= 1}
                        aria-label="Kurangi durasi"
                      >−</button>
                      <span className="cal-dur-val">{booking.duration} jam</span>
                      <button
                        className="cal-dur-btn"
                        onClick={() => onChangeDuration(booking, Math.min(13, booking.duration + 1))}
                        aria-label="Tambah durasi"
                      >+</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Phone */}
              {booking.phone && booking.status !== 'maintenance' && (
                <div className="cal-detail-row">
                  <Phone size={14} color="var(--c-fnt)" />
                  <span>{booking.phone}</span>
                </div>
              )}

              {/* Note */}
              {booking.note && (
                <div className="cal-detail-row">
                  <StickyNote size={14} color="var(--c-fnt)" />
                  <span>{booking.note}</span>
                </div>
              )}

              {/* Price card */}
              {booking.status !== 'maintenance' && (
                <div className="cal-price-card">
                  <div className="cal-price-row">
                    <span>Subtotal {isRecording ? '(Sesi Recording)' : `(${booking.duration} jam)`}</span>
                    <span>{formatCurrency(basePrice)}</span>
                  </div>

                  {booking.rentedEquipment?.length > 0 && (
                    <div className="cal-price-row">
                      <span>
                        Sewa Alat
                        <span style={{ display: 'block', fontSize: '.7rem', color: 'var(--c-fnt)', marginTop: 1 }}>
                          {booking.rentedEquipment
                            .map((id) => inventory.find((item) => item.id === id)?.name || 'Alat')
                            .join(', ')}
                        </span>
                      </span>
                      <span>{formatCurrency(equipmentCost)}</span>
                    </div>
                  )}

                  {(booking.discountAmount || 0) > 0 && (
                    <div className="cal-price-row" style={{ color: 'var(--c-teal)' }}>
                      <span>Diskon VIP</span>
                      <span>−{formatCurrency(booking.discountAmount)}</span>
                    </div>
                  )}

                  <div className="cal-price-row total">
                    <span>Total</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>

                  {booking.status === 'dp' && booking.dpAmount > 0 && (
                    <>
                      <div className="cal-price-row" style={{ color: 'var(--c-gold)' }}>
                        <span>DP Dibayar</span>
                        <span>{formatCurrency(booking.dpAmount)}</span>
                      </div>
                      <div className="cal-price-row" style={{ color: 'var(--c-red)' }}>
                        <span>Sisa Tagihan</span>
                        <span>{formatCurrency(totalPrice - booking.dpAmount)}</span>
                      </div>
                    </>
                  )}

                  {booking.status === 'confirmed' && (
                    <div style={{ marginTop: 4, fontSize: '.72rem', color: 'var(--c-teal)', fontWeight: 700 }}>
                      ✓ Lunas
                    </div>
                  )}
                  {booking.status === 'pending' && (
                    <div style={{ marginTop: 4, fontSize: '.72rem', color: 'var(--c-red)', fontWeight: 700 }}>
                      ⚠ Belum Dibayar
                    </div>
                  )}

                  {(() => {
                    const deadline = getDepositDeadlineStatus(booking);
                    if (deadline.state === 'none') return null;
                    return (
                      <div className={`cal-deadline-warn${deadline.state === 'urgent' ? ' urgent' : ''}`}>
                        ⏰ Deadline: {deadline.label}
                      </div>
                    );
                  })()}

                  {booking.status === 'cancelled' && (
                    <div style={{ marginTop: 4, fontSize: '.72rem', color: 'var(--c-mut)' }}>
                      Dibatalkan{booking.cancelReason ? `: ${booking.cancelReason}` : ''}
                    </div>
                  )}
                </div>
              )}

              {/* Status selector */}
              {booking.status !== 'maintenance' && booking.status !== 'cancelled' && (
                <div>
                  <div style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--c-fnt)', marginBottom: 5 }}>
                    Ubah Status
                  </div>
                  <div className="cal-status-selector">
                    {BOOKING_STATUSES.map((s) => (
                      <button
                        key={s}
                        className={`cal-status-opt${booking.status === s ? ` active ${s}` : ''}`}
                        onClick={() => onStatusChange(booking.id, s)}
                        aria-pressed={booking.status === s}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="cal-detail-foot">
              <button className="cal-detail-action danger" onClick={() => onDeleteBooking(booking.id)}>
                <Trash2 size={13} />
                {booking.status === 'maintenance' ? 'Hapus Blokir' : 'Hapus'}
              </button>

              {booking.status !== 'maintenance' && (
                <button className="cal-detail-action" onClick={onSendReminder}>
                  <MessageCircle size={13} />
                  Pengingat
                </button>
              )}

              {booking.status !== 'maintenance' && booking.status !== 'cancelled' && (
                <>
                  <button className="cal-detail-action" onClick={() => onOpenReschedule(booking)}>
                    <RotateCcw size={13} />
                    Reschedule
                  </button>
                  <button className="cal-detail-action danger" onClick={() => onCancelBooking(booking)}>
                    <X size={13} />
                    Batalkan
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
