import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTourStore } from '../store/useTourStore';
import TutorialOverlay from './TutorialOverlay';

const TourGuide = () => {
  const { run, startTour, stopTour, currentStep, nextStep, prevStep, setStep } = useTourStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the user has seen the tour before
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      if (window.location.pathname === '/') {
        setTimeout(() => {
          startTour();
        }, 500);
      }
    }
  }, [startTour]);

  let steps = [];
  const path = window.location.pathname;

  if (path === '/calendar') {
    steps = [
      {
        target: '.tour-calendar-nav',
        title: 'Bulan Aktif',
        content: 'Ini adalah bulan yang sedang Anda kelola jadwalnya. Gunakan panah kiri atau kanan untuk melihat jadwal bulan depan atau bulan sebelumnya.',
      },
      {
        target: '.tour-calendar-search',
        title: 'Cari Jadwal',
        content: 'Punya jadwal yang sangat padat? Anda bisa mengetikkan nama band atau nomor HP di kotak pencarian ini untuk langsung menemukan jadwal mereka.',
      },
      {
        target: '.tour-target-cell',
        title: 'Mari Kita Coba!',
        content: 'Klik tepat pada kotak yang bercahaya ini untuk mencoba memasukkan jadwal booking secara instan.',
        hideNext: true
      },
      {
        target: '.tour-input-band',
        title: 'Ketik Nama Band',
        content: 'Ketik tulisan "Band Tutorial" persis seperti ini (tanpa tanda kutip) agar sistem bisa melacak jadwal Anda. Jika sudah, klik Lanjut.',
      },
      {
        target: '.tour-input-phone',
        title: 'Nomor HP (Opsional)',
        content: 'Anda bisa mengisi nomor WhatsApp pelanggan di sini. Ini sangat berguna jika Anda ingin mencari riwayat jadwal mereka nanti.',
      },
      {
        target: '.tour-input-status',
        title: 'Status Pembayaran',
        content: 'Pilih status pembayaran (Belum Bayar, DP, Lunas). Khusus untuk panduan ini, coba pilih status "DP (Down Payment)" agar kolom input DP muncul.',
      },
      {
        target: '.tour-input-duration',
        title: 'Jam & Durasi Latihan',
        content: 'Di sebelah kiri, jam mulai otomatis terisi sesuai dengan kotak yang Anda klik tadi. Sekarang isi durasi sewanya (misalnya 2 atau 3 jam).',
      },
      {
        target: '.tour-input-dp-section',
        title: 'Nominal DP',
        content: 'Jika tadi Anda mengubah status menjadi DP, bagian ini akan muncul. Masukkan nominal uang muka yang sudah dibayarkan. (Abaikan jika Anda tidak memilih DP).',
      },
      {
        target: '.tour-btn-save',
        title: 'Simpan Booking',
        content: 'Setelah semua terisi dan total harga terlihat benar, klik tombol "Simpan Booking" ini untuk mengonfirmasi jadwal.',
        hideNext: true
      },
      {
        target: '.tour-new-booking',
        title: 'Jadwal Berhasil Dibuat!',
        content: 'Ini dia blok jadwal Anda! Sekarang, coba klik blok jadwal "Band Tutorial" yang menyala ini untuk melihat ringkasan detailnya.',
        hideNext: true
      },
      {
        target: '.tour-btn-delete',
        title: 'Hapus Booking',
        content: 'Muncul popup detail! Karena ini cuma jadwal bohongan, mari kita hapus. Klik tombol "Hapus Booking" di bawah ini.',
        hideNext: true
      },
      {
        target: '.tour-calendar-grid',
        title: 'Hebat Sekali!',
        content: 'Anda telah berhasil menguasai cara super lengkap untuk membuat dan menghapus jadwal!',
      }
    ];
  } else {
    // Default to Dashboard
    steps = [
      {
        target: '.tour-dashboard-stats',
        title: 'Ringkasan Utama',
        content: 'Selamat datang! Di bagian paling atas ini, Anda bisa langsung melihat ringkasan pendapatan kotor, total sesi, pelanggan aktif, dan status alat.',
      },
      {
        target: '.tour-dashboard-revenue-chart',
        title: 'Grafik Pendapatan',
        content: 'Grafik ini menunjukkan tren pendapatan kotor studio Anda selama 7 hari terakhir, sehingga Anda bisa memantau hari-hari teramai.',
      },
      {
        target: '.tour-dashboard-inventory-chart',
        title: 'Kondisi Inventaris',
        content: 'Diagram lingkaran ini memberikan ringkasan cepat kondisi alat-alat studio Anda. Pastikan warna hijau dominan!',
      },
      {
        target: '.tour-dashboard-top-customers',
        title: 'Pelanggan Setia',
        content: 'Di sini Anda bisa melihat daftar pelanggan atau band yang paling sering menyewa studio Anda. Jangan lupa berikan diskon khusus untuk mereka!',
        nextPage: '/calendar'
      }
    ];
  }

  const handleClose = () => {
    localStorage.setItem('hasSeenTour', 'true');
    stopTour();
  };

  const handleComplete = () => {
    const currentStepObj = steps[currentStep];
    if (currentStepObj && currentStepObj.nextPage) {
      navigate(currentStepObj.nextPage);
      setStep(0); // Reset step for the next page's tour
    } else {
      handleClose();
    }
  };

  if (!run || steps.length === 0) return null;

  return (
    <TutorialOverlay
      steps={steps}
      currentStep={currentStep}
      onNext={nextStep}
      onPrev={prevStep}
      onClose={handleClose}
      onComplete={handleComplete}
    />
  );
};

export default TourGuide;
