/**
 * WhatsApp Service - Membuat dan mengirim pesan WA berformat template
 * Digunakan untuk CRM, reminder booking, dan broadcast promo.
 */
import { useSettingsStore } from '../store/useSettingsStore';

const getAdminPhone = () => {
  const phone = useSettingsStore.getState().studioPhone || '';
  return phone.replace(/\D/g, '').replace(/^0/, '62');
};

const openWA = (phone, message) => {
  const cleaned = phone.replace(/\D/g, '').replace(/^0/, '62');
  const url = `https://wa.me/${cleaned || getAdminPhone()}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

/**
 * Kirim pengingat jadwal ke pelanggan
 */
export const sendBookingReminder = (customer, booking) => {
  const { studioName, studioAddress } = useSettingsStore.getState();
  const message =
    `Halo *${customer.name}* 👋\n\n` +
    `Mengingatkan jadwal latihan di *${studioName}*:\n\n` +
    `📅 Tanggal  : ${booking.date}\n` +
    `⏰ Jam      : ${String(booking.hour).padStart(2,'0')}:00 – ${String(booking.hour + booking.duration).padStart(2,'0')}:00\n` +
    `⏱️ Durasi   : ${booking.duration} jam\n` +
    (studioAddress ? `📍 Lokasi   : ${studioAddress}\n` : '') +
    `\nMohon datang tepat waktu ya! Terima kasih 🎸`;
  openWA(customer.phone, message);
};

/**
 * Kirim pesan selamat datang / apresiasi ke pelanggan baru
 */
export const sendWelcomeMessage = (customer) => {
  const { studioName, studioPhone } = useSettingsStore.getState();
  const message =
    `Halo *${customer.name}* 🎉\n\n` +
    `Selamat datang di *${studioName}*! Senang bisa berkenalan.\n\n` +
    `Jangan ragu untuk booking studio kapan saja melalui link jadwal atau hubungi kami langsung.\n\n` +
    `Kami siap mendukung karya musik terbaik kalian! 🎵\n\n` +
    `📞 Admin: ${studioPhone || '-'}`;
  openWA(customer.phone, message);
};

/**
 * Kirim penawaran promo / diskon
 */
export const sendPromoMessage = (customer, promoDetails) => {
  const { studioName } = useSettingsStore.getState();
  const message =
    `Halo *${customer.name}* 🎁\n\n` +
    `Ada penawaran spesial dari *${studioName}* untuk kamu!\n\n` +
    `🔥 *${promoDetails.title || 'Promo Spesial'}*\n` +
    `${promoDetails.description || 'Diskon booking studio, berlaku terbatas!'}\n\n` +
    `Segera booking sebelum kehabisan! Hubungi kami untuk info lebih lanjut. 🎸`;
  openWA(customer.phone, message);
};

/**
 * Kirim notifikasi membership naik level
 */
export const sendMembershipUpgrade = (customer, tier) => {
  const { studioName } = useSettingsStore.getState();
  const tierEmoji = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎' };
  const message =
    `Halo *${customer.name}* ${tierEmoji[tier] || '⭐'}\n\n` +
    `Selamat! Membership kamu di *${studioName}* telah naik ke level *${tier}*!\n\n` +
    `Nikmati keuntungan eksklusif sebagai member ${tier}:\n` +
    (tier === 'Gold' || tier === 'Platinum' ? `• Diskon 10% setiap booking\n` : '') +
    `• Prioritas pemesanan slot favorit\n` +
    `• Informasi promo eksklusif lebih awal\n\n` +
    `Terima kasih sudah setia bersama kami! 🎵`;
  openWA(customer.phone, message);
};

/**
 * Kirim tagihan / sisa pembayaran
 */
export const sendPaymentReminder = (customer, invoiceDetails) => {
  const { studioName } = useSettingsStore.getState();
  const remaining = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(invoiceDetails.remaining);
  const message =
    `Halo *${customer.name}* 👋\n\n` +
    `Mengingatkan, masih ada tagihan yang belum dilunasi di *${studioName}*:\n\n` +
    `📄 Invoice : INV-${String(invoiceDetails.id).padStart(5,'0')}\n` +
    `📅 Jadwal  : ${invoiceDetails.date}\n` +
    `💰 Sisa    : *${remaining}*\n\n` +
    `Mohon segera dilunasi. Terima kasih! 🙏`;
  openWA(customer.phone, message);
};

/**
 * Hitung tier membership berdasarkan total booking
 */
export const getMembershipTier = (totalBookings = 0, totalSpent = 0) => {
  if (totalBookings >= 20 || totalSpent >= 5000000) return 'Platinum';
  if (totalBookings >= 10 || totalSpent >= 2000000) return 'Gold';
  if (totalBookings >= 5  || totalSpent >= 1000000) return 'Silver';
  return 'Bronze';
};

export const TIER_CONFIG = {
  Bronze:   { color: '#CD7F32', bg: 'rgba(205, 127, 50, 0.15)',  icon: '🥉', next: 'Silver',   nextAt: '5 bookings' },
  Silver:   { color: '#C0C0C0', bg: 'rgba(192, 192, 192, 0.15)', icon: '🥈', next: 'Gold',     nextAt: '10 bookings' },
  Gold:     { color: '#FFD700', bg: 'rgba(255, 215, 0, 0.15)',   icon: '🥇', next: 'Platinum', nextAt: '20 bookings' },
  Platinum: { color: '#00f0ff', bg: 'rgba(0, 240, 255, 0.15)',   icon: '💎', next: null,       nextAt: null },
};

/**
 * Hitung loyalty points (1 point per 10.000 rupiah)
 */
export const getLoyaltyPoints = (totalSpent = 0) => Math.floor(totalSpent / 10000);
