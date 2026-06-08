import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useNavigate } from 'react-router-dom';
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks
} from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { AnimatePresence,
  motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Headphones,
  Info,
  LogOut,
  MessageCircle,
  Moon,
  Phone,
  Plus,
  ShieldCheck,
  Sun,
  WalletCards,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useBookingRequestStore } from '../store/useBookingRequestStore';
import { useBookingStore } from '../store/useBookingStore';
import { useGalleryStore } from '../store/useGalleryStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useThemeStore } from '../store/useThemeStore';
import './PublicCalendarPage.css';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
}).format(Number(value || 0));

const getPublicPhotoCaption = (photo, index = 0) => {
  const rawCaption = String(photo?.caption || '').trim();
  const looksLikeFileName =
    /\d{6,}/.test(rawCaption) ||
    /\.(jpg|jpeg|png|webp|gif)$/i.test(rawCaption) ||
    rawCaption.split(/\s+/).length > 6;

  if (!rawCaption || rawCaption.length > 52 || looksLikeFileName) {
    return 'Studio angle ' + String(index + 1).padStart(2, '0');
  }

  return rawCaption;
};

const getInitial = (value = 'C') => String(value || 'C').trim().charAt(0).toUpperCase();

const viewLabels = {
  day: 'Hari',
  week: 'Minggu',
  month: 'Bulan'
};

const PublicCalendarPage = () => {
  const navigate = useNavigate();
  const { user, userProfile, logout, loginGuest, isAuthLoaded, loading: authLoading } = useAuthStore();
  const { bookings } = useBookingStore();
  const { addRequest } = useBookingRequestStore();
  const {
    studioName,
    studioPhone,
    pricePerHour,
    durationDiscounts = [],
    operationalHours = { start: 10, end: 23 },
    blockedDates = []
} = useSettingsStore();
  const { theme, toggleTheme } = useThemeStore();
  const { gallery } = useGalleryStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [publicAccessError, setPublicAccessError] = useState('');
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState({ dateStr: '', hour: 0 });
  const [bandName, setBandName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [duration, setDuration] = useState(2);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const gridWrapperRef = useRef(null);
  const lastSlotButtonRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isAuthLoaded || user) return;

    let isActive = true;

    loginGuest().catch(() => {
      if (isActive) {
        setPublicAccessError('Jadwal publik belum bisa dimuat. Aktifkan Anonymous Auth di Firebase atau hubungi admin studio.');
      }
    });

    return () => {
      isActive = false;
    };
  }, [isAuthLoaded, user, loginGuest]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setIsSubmittingRequest(false);
    setTimeout(() => lastSlotButtonRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (!modalOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, closeModal]);

  const startHour = Number(operationalHours?.start || 10);
  const endHour = Number(operationalHours?.end || 23);
  const hoursArray = useMemo(() => {
    const length = Math.max(0, endHour - startHour);
    return Array.from({ length }, (_, index) => startHour + index);
  }, [startHour, endHour]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const nowHour = new Date().getHours();

  const activeBookings = useMemo(
    () => bookings.filter((booking) => booking.status !== 'cancelled'),
    [bookings]
  );

  const daysArray = useMemo(() => {
    if (viewMode === 'day') return [currentDate];

    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    }

    return eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
});
  }, [currentDate, viewMode]);

  const availableToday = useMemo(() => {
    if (blockedDates.includes(todayStr)) return 0;

    return hoursArray.filter((hour) => {
      const isBooked = activeBookings.some(
        (booking) =>
          booking.date === todayStr &&
          hour >= Number(booking.hour) &&
          hour < Number(booking.hour) + Number(booking.duration)
      );

      return !isBooked && hour >= nowHour;
    }).length;
  }, [activeBookings, blockedDates, hoursArray, nowHour, todayStr]);

  const customerPhotos = useMemo(
    () => gallery.filter((photo) => photo?.url && (photo.showToCustomer || photo.showOnLandingPage)),
    [gallery]
  );

  const heroPhoto = useMemo(() => {
    return (
      customerPhotos.find((photo) => photo.url) ||
      gallery.find((photo) => photo.showOnLandingPage && photo.url) || {
        url: '/studio-hero.webp',
        caption: '37 Music Studio private room'
}
    );
  }, [customerPhotos, gallery]);

  const featuredPhotos = useMemo(() => {
    const photos = customerPhotos.filter((photo) => photo.url);
    return photos.length > 0 ? photos.slice(0, 6) : [heroPhoto];
  }, [customerPhotos, heroPhoto]);

  const currentLabel = useMemo(() => {
    if (viewMode === 'day') {
      return format(currentDate, 'EEEE, dd MMMM yyyy', { locale: localeId });
    }

    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return format(start, 'dd MMM', { locale: localeId }) + ' - ' + format(end, 'dd MMM yyyy', { locale: localeId });
    }

    return format(currentDate, 'MMMM yyyy', { locale: localeId });
  }, [currentDate, viewMode]);

  const formattedRate = new Intl.NumberFormat('id-ID').format(pricePerHour || 120000);
  const operatingLabel =
    String(startHour).padStart(2, '0') + '.00-' + String(endHour).padStart(2, '0') + '.00';

  const basePriceEst = (pricePerHour || 120000) * duration;
  const applicableDiscount = durationDiscounts
    .filter((discount) => duration >= Number(discount.hours || 0))
    .sort((a, b) => Number(b.discountAmount || 0) - Number(a.discountAmount || 0))[0];

  const durationDiscountEst = applicableDiscount ? Number(applicableDiscount.discountAmount || 0) : 0;
  const priceEst = Math.max(0, basePriceEst - durationDiscountEst);

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const colWidth = viewMode === 'day' ? '260px' : viewMode === 'week' ? '132px' : '76px';
  const timeColWidth = isMobile ? '66px' : '116px';

  const cleanStudioPhone = String(studioPhone || '').replace(/\D/g, '').replace(/^0/, '62');
  const clientDisplayName =
    userProfile?.displayName ||
    userProfile?.username ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'Client';

  const handleExitPublic = async () => {
    if (user?.isAnonymous) {
      try {
        await logout();
      } catch {
        // Keep navigation responsive even if sign-out fails.
      }
    }

    navigate('/');
  };

  const handlePrev = () => {
    if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const handleGoToday = () => {
    setCurrentDate(new Date());

    setTimeout(() => {
      const todayHeader = gridWrapperRef.current?.querySelector('[data-today-header="true"]');

      if (todayHeader && gridWrapperRef.current) {
        const scrollPos = todayHeader.offsetLeft - window.innerWidth / 2 + todayHeader.clientWidth;
        gridWrapperRef.current.scrollTo({ left: Math.max(0, scrollPos), behavior: 'smooth' });
      }
    }, 100);
  };
  const openModal = (dateStr, hour, triggerElement) => {
    lastSlotButtonRef.current = triggerElement || null;

    const savedClientName =
      userProfile?.projectName ||
      userProfile?.displayName ||
      userProfile?.username ||
      user?.displayName ||
      '';

    const savedClientPhone = userProfile?.phone || '';

    setSelectedSlot({ dateStr, hour });
    setBandName(savedClientName);
    setCustomerPhone(savedClientPhone);
    setDuration(Number(userProfile?.preferredDuration || 2) || 2);
    setFormErrors({});
    setModalOpen(true);
  };

  const sendWA = async () => {
    const nextErrors = {};

    if (!bandName.trim()) {
      nextErrors.bandName = 'Nama band atau artis wajib diisi.';
      useNotificationStore.getState().addNotification({
        title: 'Nama Band kosong',
        message: 'Harap isi nama band Anda.',
        type: 'error'
});
    }

    if (!customerPhone.trim()) {
      nextErrors.customerPhone = 'Nomor WhatsApp wajib diisi.';
      useNotificationStore.getState().addNotification({
        title: 'Nomor WhatsApp kosong',
        message: 'Harap isi nomor yang bisa dihubungi admin.',
        type: 'error'
});
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setFormErrors({});

    const isOverlap = activeBookings.some((booking) => {
      if (booking.date !== selectedSlot.dateStr) return false;

      return (
        Number(booking.hour) < selectedSlot.hour + duration &&
        selectedSlot.hour < Number(booking.hour) + Number(booking.duration)
      );
    });

    if (isOverlap) {
      useNotificationStore.getState().addNotification({
        title: 'Jadwal Bentrok',
        message: 'Durasi yang Anda pilih menabrak jadwal lain. Silakan kurangi durasi.',
        type: 'error'
});
      return;
    }

    setIsSubmittingRequest(true);

    try {
      await addRequest({
        band: bandName.trim(),
        phone: customerPhone.trim(),
        date: selectedSlot.dateStr,
        hour: selectedSlot.hour,
        duration,
        estimatedPrice: priceEst,
        source: 'public-calendar',
        clientUid: user && !user.isAnonymous ? user.uid : '',
        clientEmail: user && !user.isAnonymous ? user.email || userProfile?.email || '' : '',
        clientName:
          userProfile?.displayName ||
          userProfile?.username ||
          user?.displayName ||
          bandName.trim(),
        clientPhone: customerPhone.trim(),
        linkedCustomerId: userProfile?.linkedCustomerId || '',
        projectName: userProfile?.projectName || bandName.trim(),
        clientType: userProfile?.clientType || '',
        primaryGenre: userProfile?.primaryGenre || '',
        mainNeed: userProfile?.mainNeed || '',
        memberCount: userProfile?.memberCount || '',
        preferredDuration: userProfile?.preferredDuration || '',
        preferredTime: userProfile?.preferredTime || '',
        preferredDays: userProfile?.preferredDays || '',
        socialLink: userProfile?.socialLink || '',
        gearNotes: userProfile?.gearNotes || '',
        invoiceName: userProfile?.invoiceName || '',
        paymentPreference: userProfile?.paymentPreference || '',
        clientLevel: userProfile?.clientLevel || 'New',
        createdBy: user && !user.isAnonymous ? user.uid : 'public-guest'
});

      useNotificationStore.getState().addNotification({
        title: 'Permintaan terkirim',
        message: 'Admin akan meninjau dan mengonfirmasi jadwal Anda.',
        type: 'success'
});
    } catch (error) {
      useNotificationStore.getState().addNotification({
        title: 'Gagal mengirim request',
        message: error.message || 'Coba lagi beberapa saat lagi.',
        type: 'error'
});
      setIsSubmittingRequest(false);
      return;
    }

    const dateLabel = format(new Date(selectedSlot.dateStr + 'T00:00:00'), 'dd MMMM yyyy', { locale: localeId });
    const endHourLabel = selectedSlot.hour + duration;
    const cleanMessage =
      'Halo Admin ' +
      (studioName || '37 Music Studio') +
      '\n\nSaya dari band *' +
      bandName.trim() +
      '* ingin booking studio:\n\nTanggal : ' +
      dateLabel +
      '\nJam     : ' +
      selectedSlot.hour +
      ':00 - ' +
      endHourLabel +
      ':00\nDurasi  : ' +
      duration +
      ' jam\nKontak  : ' +
      customerPhone.trim() +
      '\n\nSaya juga sudah mengirim request dari kalender publik.';

    let phone = String(studioPhone || '').replace(/\D/g, '');

    if (!phone) {
      useNotificationStore.getState().addNotification({
        title: 'Request tersimpan',
        message: 'Nomor admin belum tersedia untuk WhatsApp otomatis.',
        type: 'warning'
});
      closeModal();
      return;
    }

    if (phone.startsWith('0')) phone = '62' + phone.substring(1);
    window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(cleanMessage), '_blank');
    closeModal();
  };

  return (
    <div className="pc-modern min-h-screen overflow-x-clip bg-[#090b10] text-stone-50 selection:bg-amber-300/25 selection:text-amber-50">
      <section className="pc-hero-section relative isolate overflow-hidden bg-[#090b10]">
        <div className="pc-hero-bg absolute inset-0 -z-30 bg-[#090b10]">
          <img
            src={heroPhoto.url}
            alt=""
            className="size-full object-cover"
          />
        </div>

        <div className="pc-hero-overlay absolute inset-0 -z-20" />
        <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-amber-300/35 to-transparent" />

        <div className="pc-hero-shell mx-auto flex flex-col px-4 sm:px-6 lg:px-8">
          <header className="pc-hero-nav flex items-center justify-between gap-3 pt-[calc(1rem+env(safe-area-inset-top,0px))]">
            <button
              type="button"
              onClick={handleExitPublic}
              className="pc-hero-brand group inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] py-1.5 pl-1.5 pr-3 text-left shadow-2xl shadow-black/20 backdrop-blur-2xl transition hover:-translate-y-0.5 hover:border-amber-300/25 hover:bg-white/[0.11]"
              aria-label="Kembali ke beranda"
            >
              <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl border border-amber-300/25 bg-black/20">
                <img src="/logo.svg" alt="" className="size-7 object-contain" />
              </span>
              <span className="truncate text-[0.76rem] font-black uppercase tracking-[-0.02em] text-stone-100/95">
                {studioName || '37 MUSIC STUDIO'}
              </span>
            </button>

            <div className="pc-hero-actions flex items-center gap-2">
              <button
                type="button"
                className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.07] text-stone-100/75 shadow-xl shadow-black/10 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.11] hover:text-white"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Aktifkan Light Mode' : 'Aktifkan Dark Mode'}
                title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              {user && !user.isAnonymous && (
                <button
                  type="button"
                  onClick={() => navigate('/client/dashboard')}
                  className="hidden min-h-11 items-center gap-2 rounded-2xl border border-cyan-200/15 bg-cyan-200/[0.075] px-3 text-[0.78rem] font-black text-cyan-50/85 shadow-xl shadow-black/10 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-200/30 hover:bg-cyan-200/[0.12] sm:inline-flex"
                >
                  <ShieldCheck size={16} />
                  <span>Client Portal</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExitPublic}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-3 text-[0.78rem] font-black text-stone-100/80 shadow-xl shadow-black/10 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.11] hover:text-white"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Kembali</span>
              </button>
            </div>
          </header>

          <main className="pc-hero-main grid place-items-center">
            <div className="pc-hero-card relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] text-center shadow-2xl shadow-black/30 backdrop-blur-2xl">
              <div className="pc-hero-card-glow pointer-events-none absolute inset-0" />
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/35 to-transparent" />

              <div className="pc-hero-inner relative z-10 mx-auto flex flex-col items-center">
                <div className="pc-hero-kicker inline-flex items-center justify-center gap-2 rounded-full border border-amber-300/25 bg-black/25 text-amber-100 shadow-xl shadow-black/15 backdrop-blur-xl">
                  <CalendarDays size={15} className="shrink-0" />
                  <span className="truncate">Live public booking calendar</span>
                </div>

                <h1 className="pc-hero-title font-['Bebas_Neue',Impact,'Arial_Narrow',sans-serif] font-normal uppercase text-stone-50 drop-shadow-2xl">
                  Booking studio tanpa ribet.
                </h1>

                <p className="pc-hero-copy">
                  Pilih slot kosong, isi detail sesi, lalu request kamu masuk ke admin studio untuk dikonfirmasi.
                  Enak dipakai dari HP, tetap detail di desktop.
                </p>

                <div className="pc-hero-cta-row flex flex-wrap items-center justify-center gap-3">
                  <a
                    href="#pc-booking-calendar"
                    className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-amber-200/20 bg-gradient-to-r from-amber-300 to-yellow-200 px-5 text-[0.9rem] font-black text-neutral-950 shadow-2xl shadow-amber-500/20 transition hover:-translate-y-0.5 hover:brightness-105"
                  >
                    <span>Cek Slot</span>
                    <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
                  </a>

                  {cleanStudioPhone && (
                    <a
                      href={'https://wa.me/' + cleanStudioPhone}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-5 text-[0.9rem] font-black text-stone-100/88 shadow-2xl shadow-black/15 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-green-300/25 hover:bg-white/[0.11]"
                    >
                      <Phone size={17} className="shrink-0 text-green-300" />
                      <span>Chat Admin</span>
                    </a>
                  )}
                </div>

                <div className="pc-hero-stats grid">
                  <div className="pc-hero-stat rounded-2xl border border-white/10 bg-white/[0.075] text-left shadow-xl shadow-black/10 backdrop-blur-xl">
                    <div className="pc-hero-stat-label flex min-w-0 items-center gap-2 font-black uppercase text-stone-300/70">
                      <span className={cx('size-2 shrink-0 rounded-full', availableToday > 0 ? 'bg-green-300 shadow-[0_0_0_7px_rgba(134,239,172,0.12)]' : 'bg-rose-400 shadow-[0_0_0_7px_rgba(251,113,133,0.12)]')} />
                      <span className="truncate">Hari ini</span>
                    </div>
                    <div className="pc-hero-stat-value flex min-w-0 items-baseline gap-1">
                      <strong>{availableToday}</strong>
                      <span>slot tersedia</span>
                    </div>
                  </div>

                  <div className="pc-hero-stat rounded-2xl border border-white/10 bg-white/[0.075] text-left shadow-xl shadow-black/10 backdrop-blur-xl">
                    <div className="pc-hero-stat-label flex min-w-0 items-center gap-2 font-black uppercase text-stone-300/70">
                      <Clock size={15} className="shrink-0 text-amber-200" />
                      <span className="truncate">Operasional</span>
                    </div>
                    <strong className="pc-hero-stat-text block truncate text-stone-50">{operatingLabel}</strong>
                  </div>

                  <div className="pc-hero-stat rounded-2xl border border-white/10 bg-white/[0.075] text-left shadow-xl shadow-black/10 backdrop-blur-xl">
                    <div className="pc-hero-stat-label flex min-w-0 items-center gap-2 font-black uppercase text-stone-300/70">
                      <WalletCards size={15} className="shrink-0 text-amber-200" />
                      <span className="truncate">Rate</span>
                    </div>
                    <div className="pc-hero-stat-value flex min-w-0 items-baseline gap-1">
                      <strong className="truncate">Rp {formattedRate}</strong>
                      <span>/ jam</span>
                    </div>
                  </div>

                  <div className="pc-hero-stat rounded-2xl border border-white/10 bg-white/[0.075] text-left shadow-xl shadow-black/10 backdrop-blur-xl">
                    <div className="pc-hero-stat-label flex min-w-0 items-center gap-2 font-black uppercase text-stone-300/70">
                      <Headphones size={15} className="shrink-0 text-amber-200" />
                      <span className="truncate">Setup</span>
                    </div>
                    <strong className="pc-hero-stat-text block truncate text-stone-50">Operator ready</strong>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </section>

      <section className="pc-board-section relative z-10 mx-auto -mt-8 flex w-[min(1180px,calc(100%-2rem))] flex-col gap-4 pb-10">
        {(authLoading || publicAccessError) && (
          <div
            className={cx(
              'rounded-2xl border px-4 py-3 text-sm font-black shadow-xl shadow-black/10 backdrop-blur-xl',
              publicAccessError
                ? 'border-rose-300/25 bg-rose-300/10 text-rose-100'
                : 'border-cyan-200/25 bg-cyan-200/10 text-cyan-100'
            )}
          >
            {publicAccessError || 'Menyiapkan akses jadwal publik...'}
          </div>
        )}

        <div className="pc-board-panel grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-black/20 backdrop-blur-2xl lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:p-5">
          <div className="pc-board-copy">
            <h2 className="pc-board-title font-['Bebas_Neue',Impact,sans-serif] text-[clamp(2.1rem,4vw,3.35rem)] uppercase leading-none tracking-[-0.025em] text-stone-50">
              Pilih jam kosong yang paling pas.
            </h2>
            <p className="pc-board-subtitle mt-2 max-w-2xl text-sm font-bold leading-6 text-stone-300/68">
              Slot hijau bisa dipilih. Slot merah atau redup berarti sudah terisi, tutup, atau sudah lewat.
            </p>
          </div>

          <div className="pc-board-controls flex flex-col gap-3 lg:items-end">
            <div className="pc-board-legend flex flex-wrap items-center gap-2 text-xs font-black text-stone-300/70">
              <span className="pc-board-legend-chip pc-board-legend-chip-available inline-flex items-center gap-2 rounded-full border border-green-300/20 bg-green-300/10 px-3 py-2 text-green-100">
                <span className="size-2 rounded-full bg-green-300" />
                Tersedia
              </span>
              <span className="pc-board-legend-chip pc-board-legend-chip-busy inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-rose-100">
                <span className="size-2 rounded-full bg-rose-300" />
                Terisi / tutup
              </span>
            </div>
          </div>
        </div>

        {user && !user.isAnonymous && (
          <div className="grid gap-3 rounded-[1.5rem] border border-cyan-200/14 bg-cyan-200/[0.06] p-4 shadow-xl shadow-black/10 backdrop-blur-xl sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
            <div className="grid size-12 place-items-center rounded-2xl border border-cyan-100/20 bg-cyan-100/10 text-lg font-black text-cyan-100">
              {getInitial(clientDisplayName)}
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-[0.12em] text-cyan-100/70">Booking sebagai akun client</span>
              <strong className="block text-sm font-black text-stone-50">{clientDisplayName}</strong>
              <p className="mt-1 text-xs font-bold text-stone-300/62">Nama dan nomor WhatsApp dari profil akan otomatis dipakai saat memilih slot.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/client/profile')}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.065] px-3 text-xs font-black text-stone-100/85 transition hover:-translate-y-0.5 hover:bg-white/[0.10]"
            >
              Lengkapi Profil
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        <div className="pc-period-toolbar sticky top-3 z-40 rounded-[1.6rem] border border-white/10 bg-[#121720]/86 p-3 shadow-2xl shadow-black/25 backdrop-blur-2xl">
          <div className="pc-period-toolbar-inner flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="pc-period-nav flex items-center gap-2">
              <button
                className="pc-period-arrow grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.055] text-stone-100/75 transition hover:bg-white/[0.09] hover:text-white"
                type="button"
                onClick={handlePrev}
                aria-label="Lihat periode sebelumnya"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="pc-period-label min-w-0 flex-1 rounded-xl border border-white/10 bg-black/18 px-4 py-2 text-center text-sm font-black capitalize text-stone-50 lg:min-w-64">
                {currentLabel}
              </div>

              <button
                className="pc-period-arrow grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.055] text-stone-100/75 transition hover:bg-white/[0.09] hover:text-white"
                type="button"
                onClick={handleNext}
                aria-label="Lihat periode berikutnya"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="pc-period-actions">
              <div className="pc-view-switcher inline-grid grid-cols-3 rounded-2xl border border-white/10 bg-black/25 p-1 shadow-inner shadow-black/20">
                {['day', 'week', 'month'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={viewMode === mode}
                    onClick={() => setViewMode(mode)}
                    className={cx(
                      'pc-view-btn min-h-9 rounded-xl px-3 text-xs font-black transition',
                      viewMode === mode
                        ? 'pc-view-btn-active bg-amber-300 text-neutral-950 shadow-lg shadow-amber-500/15'
                        : 'pc-view-btn-idle text-stone-200/62 hover:bg-white/[0.07] hover:text-stone-50'
                    )}
                  >
                    {viewLabels[mode]}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleGoToday}
                className="pc-today-btn inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-amber-300/18 bg-amber-300/10 px-4 text-sm font-black text-amber-100 transition hover:-translate-y-0.5 hover:border-amber-300/30 hover:bg-amber-300/14"
              >
                <CalendarCheck2 size={16} />
                Hari Ini
              </button>
            </div>
          </div>
        </div>

        <div id="pc-booking-calendar" className="pc-calendar-panel overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/25 backdrop-blur-2xl">
          <div className="pc-calendar-mobile-hint border-b border-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.11em] text-stone-300/52 sm:hidden">
            Geser kalender untuk melihat tanggal lainnya
          </div>

          <div ref={gridWrapperRef} className="pc-calendar-scroll pc-scrollbar max-h-[min(68svh,720px)] min-h-[430px] overflow-auto p-3">
            <div
              className="pc-calendar-grid grid min-w-max gap-0"
              role="grid"
              aria-label="Kalender ketersediaan studio"
              style={{ gridTemplateColumns: timeColWidth + ' repeat(' + daysArray.length + ', minmax(' + colWidth + ', 1fr))' }}
            >
              <div className="pc-time-head sticky left-0 top-0 z-30 grid min-h-20 place-items-center rounded-2xl border border-white/10 bg-[#111722]/95 text-[0.66rem] font-black uppercase tracking-[0.1em] text-stone-400 shadow-lg shadow-black/15 backdrop-blur-xl">
                Waktu
              </div>

              {daysArray.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isToday = dateStr === todayStr;
                const dow = getDay(day);
                const isWeekend = dow === 0 || dow === 6;

                return (
                  <div
                    key={dateStr}
                    data-today-header={isToday ? 'true' : undefined}
                    className={cx(
                      'pc-day-head sticky top-0 z-20 grid min-h-20 place-items-center rounded-2xl border px-2 text-center shadow-lg shadow-black/15 backdrop-blur-xl',
                      isToday
                        ? 'pc-day-today border-amber-300/45 bg-amber-300/[0.12]'
                        : isWeekend
                          ? 'pc-day-weekend border-rose-300/16 bg-rose-300/[0.055]'
                          : 'pc-day-normal border-white/10 bg-[#111722]/95'
                    )}
                    role="columnheader"
                  >
                    <span className="text-[0.67rem] font-black uppercase tracking-[0.08em] text-stone-300/70">
                      {dayNames[dow]}
                    </span>
                    <span className="text-2xl font-black leading-none text-stone-50">{format(day, 'd')}</span>
                    {isToday && <span className="mt-1 size-1.5 rounded-full bg-amber-300 shadow-[0_0_0_6px_rgba(252,211,77,0.12)]" />}
                  </div>
                );
              })}

              {hoursArray.map((hour) => (
                <React.Fragment key={hour}>
                  <div className="pc-time-cell sticky left-0 z-10 grid min-h-16 place-items-center rounded-2xl border border-white/10 bg-[#111722]/95 px-2 text-center text-[0.72rem] font-black tabular-nums text-stone-300/55 shadow-lg shadow-black/10 backdrop-blur-xl">
                    {isMobile
                      ? String(hour).padStart(2, '0') + ':00'
                      : String(hour).padStart(2, '0') + ':00 - ' + String(hour + 1).padStart(2, '0') + ':00'}
                  </div>

                  {daysArray.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isToday = dateStr === todayStr;
                    const dow = getDay(day);
                    const isWeekend = dow === 0 || dow === 6;
                    const isBlocked = blockedDates.includes(dateStr);

                    const booking = activeBookings.find((item) => {
                      if (item.date !== dateStr) return false;
                      return hour >= Number(item.hour) && hour < Number(item.hour) + Number(item.duration);
                    });

                    const isPast = dateStr < todayStr || (isToday && hour < nowHour);
                    const canBook = !booking && !isPast && !isBlocked;
                    const isBlockStart = booking && hour === Number(booking.hour);
                    const dayLabel = format(day, 'EEEE, dd MMMM yyyy', { locale: localeId });
                    const timeLabel = String(hour).padStart(2, '0') + ':00 - ' + String(hour + 1).padStart(2, '0') + ':00';

                    const cellClassName = cx(
                      'pc-slot-cell group relative min-h-16 overflow-hidden border p-0 text-sm transition',
                      canBook
                        ? 'pc-slot-available border-green-300/24 bg-green-300/[0.055] text-green-100 hover:border-green-300/58 hover:bg-green-300/[0.11] focus-visible:border-green-300/70'
                        : booking
                          ? 'pc-slot-booked border-rose-300/26 bg-rose-300/[0.10] text-rose-100'
                          : isBlocked
                            ? 'pc-slot-blocked border-rose-300/18 bg-rose-300/[0.045] text-rose-100/70'
                            : 'pc-slot-muted border-white/7 bg-white/[0.022] text-stone-500/50',
                      isWeekend && !booking && !canBook ? 'pc-slot-weekend-muted bg-rose-300/[0.035]' : '',
                      isToday ? 'pc-slot-today ring-1 ring-amber-300/10' : ''
                    );

                    const cellContent = (
                      <>
                        {canBook && (
                          <span className="pc-slot-plus-wrap absolute inset-0 grid place-items-center">
                            <span className="pc-slot-plus grid size-9 place-items-center rounded-full border border-green-300/18 bg-green-300/10 text-green-200 opacity-100 transition group-hover:scale-105 group-hover:bg-green-300/16">
                              <Plus size={18} strokeWidth={2.5} />
                            </span>
                          </span>
                        )}

                        {booking && isBlockStart && (
                          <span className="absolute inset-0 grid place-items-center px-2">
                            <span className="pc-slot-badge rounded-full border border-rose-200/16 bg-rose-300/12 px-2.5 py-1 text-[0.63rem] font-black uppercase tracking-[0.08em] text-rose-100">
                              Terisi
                            </span>
                          </span>
                        )}

                        {isBlocked && !booking && hour === startHour + 2 && (
                          <span className="absolute inset-0 grid place-items-center px-2">
                            <span className="pc-slot-badge rounded-full border border-rose-200/16 bg-rose-300/12 px-2.5 py-1 text-[0.63rem] font-black uppercase tracking-[0.08em] text-rose-100">
                              Tutup
                            </span>
                          </span>
                        )}
                      </>
                    );

                    if (canBook) {
                      return (
                        <button
                          key={dateStr + '-' + hour}
                          type="button"
                          className={cellClassName}
                          onClick={(event) => openModal(dateStr, hour, event.currentTarget)}
                          aria-label={'Booking ' + dayLabel + ', jam ' + timeLabel}
                        >
                          {cellContent}
                        </button>
                      );
                    }

                    return (
                      <div
                        key={dateStr + '-' + hour}
                        className={cellClassName}
                        role="gridcell"
                        aria-label={dayLabel + ', jam ' + timeLabel + ', ' + (booking ? 'terisi' : isBlocked ? 'tutup' : 'tidak tersedia')}
                      >
                        {cellContent}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {featuredPhotos.length > 0 && (
        <section className="mx-auto w-[min(1220px,calc(100%-2rem))] pb-20">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="mb-2 inline-flex rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.14em] text-rose-200">
                Vibe studio
              </span>
              <h2 className="font-['Bebas_Neue',Impact,sans-serif] text-[clamp(2.2rem,4.2vw,3.6rem)] uppercase leading-none tracking-[-0.025em] text-stone-50">
                Lihat ruangnya sebelum booking.
              </h2>
            </div>
            <p className="max-w-md text-sm font-bold leading-6 text-stone-300/64">
              Foto studio membantu kamu memilih sesi dengan konteks yang lebih jelas.
            </p>
          </div>

          <div className="pc-scrollbar grid auto-cols-[minmax(250px,31%)] grid-flow-col gap-4 overflow-x-auto pb-4 [scroll-snap-type:x_mandatory] max-lg:auto-cols-[78%]">
            {featuredPhotos.map((photo, index) => {
              const displayCaption = getPublicPhotoCaption(photo, index);

              return (
                <button
                  key={photo.id || photo.url || index}
                  type="button"
                  onClick={() => setLightboxPhoto({ ...photo, displayCaption })}
                  className="group relative aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/15 [scroll-snap-align:start]"
                >
                  <img
                    src={photo.url}
                    alt={displayCaption}
                    loading="lazy"
                    className="size-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/10 bg-black/45 px-3 py-2 text-left text-xs font-black text-white/85 shadow-xl shadow-black/20 backdrop-blur-xl">
                    {displayCaption}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            className="fixed inset-0 z-[10000] grid place-items-center bg-black/78 p-4 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxPhoto(null)}
          >
            <button
              type="button"
              className="absolute right-4 top-4 grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.08] text-white shadow-xl shadow-black/20 backdrop-blur-xl transition hover:bg-white/[0.13]"
              onClick={() => setLightboxPhoto(null)}
              aria-label="Tutup penampil gambar"
            >
              <X size={22} />
            </button>
            <motion.div
              className="w-[min(960px,100%)] overflow-hidden rounded-[2rem] border border-white/10 bg-[#111722] shadow-2xl shadow-black/40"
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.96 }}
              onClick={(event) => event.stopPropagation()}
            >
              <img src={lightboxPhoto.url} alt={lightboxPhoto.displayCaption || 'Foto studio'} className="max-h-[78svh] w-full object-contain bg-black" />
              <div className="border-t border-white/10 px-5 py-4">
                <h3 className="text-sm font-black text-stone-100">{lightboxPhoto.displayCaption || getPublicPhotoCaption(lightboxPhoto)}</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-[1000] grid place-items-center bg-black/72 p-4 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="pc-scrollbar max-h-[min(90svh,820px)] w-[min(540px,100%)] overflow-auto rounded-[2rem] border border-white/10 bg-[#141923]/96 shadow-2xl shadow-black/40 backdrop-blur-2xl"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="pc-booking-title"
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
                <div className="flex gap-3">
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-amber-300/18 bg-amber-300/10 text-amber-100">
                    <CalendarDays size={23} />
                  </div>
                  <div>
                    <h3 id="pc-booking-title" className="text-xl font-black tracking-[-0.04em] text-stone-50">
                      Ajukan Booking Studio
                    </h3>
                    <p className="mt-1 text-sm font-bold capitalize text-stone-300/62">
                      {selectedSlot.dateStr
                        ? format(new Date(selectedSlot.dateStr + 'T00:00:00'), 'EEEE, dd MMMM yyyy', { locale: localeId })
                        : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="grid size-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.055] text-stone-100/75 transition hover:bg-white/[0.10] hover:text-white"
                  onClick={closeModal}
                  aria-label="Tutup modal booking"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-center gap-2 rounded-2xl border border-amber-300/16 bg-amber-300/10 px-4 py-3 text-sm font-black text-amber-100">
                  <Clock size={16} />
                  <span>
                    {String(selectedSlot.hour).padStart(2, '0')}:00 - {String(selectedSlot.hour + duration).padStart(2, '0')}:00 ({duration} jam)
                  </span>
                </div>

                {user && !user.isAnonymous && (
                  <div className="grid gap-3 rounded-2xl border border-cyan-200/14 bg-cyan-200/[0.06] p-4 sm:grid-cols-[auto_minmax(0,1fr)]">
                    <div className="grid size-11 place-items-center rounded-2xl border border-cyan-100/20 bg-cyan-100/10 text-base font-black text-cyan-100">
                      {getInitial(clientDisplayName)}
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-cyan-100/70">Booking sebagai akun client</span>
                      <strong className="block text-sm font-black text-stone-50">{clientDisplayName}</strong>
                      <p className="mt-1 text-xs font-bold leading-5 text-stone-300/62">
                        Data client ikut tersimpan supaya booking, billing, dan histori lebih gampang tersambung.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="pc-band-name" className="text-sm font-black text-stone-200/76">
                    Nama Band / Artis
                  </label>
                  <input
                    id="pc-band-name"
                    type="text"
                    className="pc-autofill min-h-12 w-full rounded-2xl border border-white/10 bg-black/22 px-4 text-sm font-bold text-stone-50 outline-none transition placeholder:text-stone-400/45 focus:border-amber-300/48 focus:ring-4 focus:ring-amber-300/10"
                    value={bandName}
                    onChange={(event) => {
                      setBandName(event.target.value);
                      setFormErrors((prev) => ({ ...prev, bandName: '' }));
                    }}
                    placeholder="Contoh: The Beatles"
                    autoFocus
                    aria-invalid={Boolean(formErrors.bandName)}
                    aria-describedby={formErrors.bandName ? 'pc-band-error' : undefined}
                  />
                  {formErrors.bandName ? (
                    <span id="pc-band-error" className="text-xs font-black text-rose-200">
                      {formErrors.bandName}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-stone-400/60">Boleh isi nama band, nama artis, atau nama project.</span>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="pc-customer-phone" className="text-sm font-black text-stone-200/76">
                    No. WhatsApp
                  </label>
                  <input
                    id="pc-customer-phone"
                    type="tel"
                    className="pc-autofill min-h-12 w-full rounded-2xl border border-white/10 bg-black/22 px-4 text-sm font-bold text-stone-50 outline-none transition placeholder:text-stone-400/45 focus:border-amber-300/48 focus:ring-4 focus:ring-amber-300/10"
                    value={customerPhone}
                    onChange={(event) => {
                      setCustomerPhone(event.target.value);
                      setFormErrors((prev) => ({ ...prev, customerPhone: '' }));
                    }}
                    placeholder="08xxxxxxxxxx"
                    aria-invalid={Boolean(formErrors.customerPhone)}
                    aria-describedby={formErrors.customerPhone ? 'pc-phone-error' : undefined}
                  />
                  {formErrors.customerPhone ? (
                    <span id="pc-phone-error" className="text-xs font-black text-rose-200">
                      {formErrors.customerPhone}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-stone-400/60">Pakai nomor aktif supaya admin bisa follow up konfirmasi jadwal.</span>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-stone-200/76">Pilih Durasi</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((hour) => (
                      <button
                        key={hour}
                        type="button"
                        aria-pressed={duration === hour}
                        onClick={() => setDuration(hour)}
                        className={cx(
                          'min-h-11 rounded-2xl border text-sm font-black transition',
                          duration === hour
                            ? 'border-transparent bg-amber-300 text-neutral-950 shadow-lg shadow-amber-500/15'
                            : 'border-white/10 bg-white/[0.045] text-stone-200/68 hover:bg-white/[0.08] hover:text-white'
                        )}
                      >
                        {hour} Jam
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-green-300/18 bg-green-300/[0.08] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-black text-stone-200/70">Estimasi Harga</span>
                    <strong className="text-xl font-black tracking-[-0.04em] text-green-200">{formatRupiah(priceEst)}</strong>
                  </div>
                  {durationDiscountEst > 0 && (
                    <p className="mt-1 text-right text-xs font-black text-amber-100">
                      Diskon: -{formatRupiah(durationDiscountEst)}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <span className="block text-[0.68rem] font-black uppercase tracking-[0.08em] text-stone-400/60">Rate</span>
                    <strong className="mt-1 block text-xs font-black text-stone-100">Rp {formattedRate}</strong>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <span className="block text-[0.68rem] font-black uppercase tracking-[0.08em] text-stone-400/60">Durasi</span>
                    <strong className="mt-1 block text-xs font-black text-stone-100">{duration} jam</strong>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <span className="block text-[0.68rem] font-black uppercase tracking-[0.08em] text-stone-400/60">Diskon</span>
                    <strong className="mt-1 block text-xs font-black text-stone-100">
                      {durationDiscountEst > 0 ? '-' + formatRupiah(durationDiscountEst) : 'Rp0'}
                    </strong>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-xs font-bold leading-5 text-stone-300/68">
                  <Info size={16} className="mt-0.5 shrink-0 text-amber-200" />
                  <span>Request akan masuk ke admin studio untuk direview. Setelah dikonfirmasi, jadwal dan billing akan muncul di Client Portal.</span>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-cyan-200/14 bg-cyan-200/[0.06] p-4 text-xs font-bold leading-5 text-stone-300/68">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-cyan-100" />
                  <span>Pastikan tanggal, jam, durasi, dan nomor WhatsApp sudah benar sebelum kirim.</span>
                </div>

                <button
                  type="button"
                  onClick={sendWA}
                  disabled={isSubmittingRequest}
                  aria-busy={isSubmittingRequest}
                  className="group inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#25d366] px-5 text-sm font-black text-[#052415] shadow-2xl shadow-green-500/15 transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <MessageCircle size={21} />
                  <span>{isSubmittingRequest ? 'Mengirim Request...' : 'Kirim Request Booking'}</span>
                  <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicCalendarPage;
