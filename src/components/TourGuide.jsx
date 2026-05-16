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

  if (path === '/inventory') {
    steps = [
      {
        target: '.tour-inv-stats',
        title: '📊 Ringkasan Inventaris',
        content: 'Selamat datang di Inventory Studio! Baris kartu ini menampilkan ringkasan lengkap: total jenis alat, total unit, jumlah alat dalam kondisi baik, yang perlu perhatian, dan jadwal servis yang sudah dekat.',
      },
      {
        target: '.tour-inv-search',
        title: '🔍 Pencarian Alat',
        content: 'Ketik nama alat atau merk di sini untuk langsung menemukan alat yang Anda cari. Misalnya: "Zildjian", "Pearl", atau "Mic".',
      },
      {
        target: '.tour-inv-categories',
        title: '📂 Filter Kategori',
        content: 'Gunakan tab kategori ini untuk memfilter alat berdasarkan jenisnya: Drum, Gitar, Amplifier, Mic & Audio, dan lain-lain. Tab kategori akan bertambah otomatis saat Anda menambahkan kategori baru.',
      },
      {
        target: '.tour-inv-add-btn',
        title: '➕ Tambah Alat Baru',
        content: 'Mari kita coba menambahkan alat baru ke inventaris studio! Klik tombol "Alat Baru" yang bercahaya ini untuk membuka formulir pendaftaran alat.',
        hideNext: true,
      },
      {
        target: '.tour-inv-input-identity',
        title: '🎸 Identitas Alat',
        content: 'Di bagian ini, isi nama alat atau model (wajib), jumlah unit yang dimiliki, pilih kategori dari daftar yang tersedia (atau buat kategori baru), dan masukkan merk/brand alat tersebut.',
      },
      {
        target: '.tour-inv-input-condition',
        title: '🔧 Kondisi Alat',
        content: 'Pilih salah satu dari 4 tingkat kondisi: Sangat Baik (hijau), Baik (cyan), Butuh Servis (kuning), atau Rusak (merah). Status ini akan tampil sebagai indikator warna di tabel utama.',
      },
      {
        target: '.tour-inv-input-maintenance',
        title: '🗓️ Jadwal Maintenance',
        content: 'Catat tanggal servis terakhir dan jadwal servis berikutnya. Jika jadwal servis sudah melewati tanggal hari ini, baris alat tersebut akan otomatis ditandai dengan peringatan "TERLAMBAT" berwarna merah.',
      },
      {
        target: '.tour-inv-input-notes',
        title: '📝 Catatan Tambahan',
        content: 'Catat informasi penting seperti riwayat kerusakan, penggantian onderdil, atau instruksi khusus perawatan. Catatan ini akan muncul sebagai teks kecil di bawah nama alat pada tabel.',
      },
      {
        target: '.tour-inv-btn-save',
        title: '💾 Simpan Alat',
        content: 'Setelah semua data terisi, klik tombol "Simpan Alat" ini untuk menyimpan ke database. Data akan langsung tersinkronisasi ke semua perangkat.',
        hideNext: true,
      },
      {
        target: '.tour-inv-table',
        title: '🎉 Alat Tersimpan!',
        content: 'Alat baru Anda sudah muncul di tabel! Tabel ini menampilkan nama, kategori & merk, jumlah unit, jadwal servis, dan kondisi alat. Klik salah satu baris untuk melihat detail lengkapnya di panel samping.',
      },
      {
        target: '.tour-inv-table',
        title: '✅ Panduan Selesai!',
        content: 'Anda telah berhasil menguasai cara mengelola inventaris studio! Gunakan tombol Edit (pensil) untuk memperbarui data, atau tombol Hapus (tempat sampah) untuk menghapus alat. Selanjutnya, mari kita ke halaman Billing/POS!',
        nextPage: '/billing'
      },
    ];
  } else if (path === '/customers') {
    steps = [
      {
        target: '.tour-cust-stats',
        title: '📊 Statistik Pelanggan',
        content: 'Selamat datang di Database Pelanggan! Baris kartu ini menampilkan ringkasan penting: total pelanggan terdaftar, pelanggan aktif, jumlah total booking, total jam sewa, dan total pemasukan dari seluruh pelanggan.',
      },
      {
        target: '.tour-cust-search',
        title: '🔍 Pencarian Pelanggan',
        content: 'Ketik nama band, nomor HP, email, atau akun Instagram di sini untuk langsung menemukan pelanggan yang Anda cari. Hasil pencarian akan muncul secara instan di tabel bawah.',
      },
      {
        target: '.tour-cust-filters',
        title: '📋 Filter Status',
        content: 'Gunakan tab filter ini untuk menampilkan pelanggan berdasarkan status: "Semua" untuk melihat seluruh daftar, "Aktif" untuk pelanggan yang masih rutin sewa, atau "Tidak Aktif" untuk pelanggan yang sudah lama tidak datang.',
      },
      {
        target: '.tour-cust-add-btn',
        title: '➕ Tambah Pelanggan Baru',
        content: 'Mari kita coba menambahkan pelanggan baru! Klik tombol "Pelanggan Baru" yang menyala ini untuk membuka formulir pendaftaran.',
        hideNext: true,
      },
      {
        target: '.tour-cust-input-name',
        title: '✏️ Nama Band / Pelanggan',
        content: 'Masukkan nama band atau nama pelanggan di kolom ini. Contoh: "The Rockers", "Band Tutorial", atau nama pribadi pelanggan. Nama ini yang akan muncul di tabel dan kalender booking.',
      },
      {
        target: '.tour-cust-input-contact',
        title: '📱 Kontak Utama',
        content: 'Isi nomor HP/WhatsApp pelanggan (wajib diisi) agar Anda bisa menghubungi mereka untuk konfirmasi booking. Kolom email bersifat opsional, tapi sangat berguna untuk mengirim invoice atau pengingat.',
      },
      {
        target: '.tour-cust-input-social',
        title: '📲 Media Sosial & Status',
        content: 'Tambahkan akun Instagram pelanggan (opsional) untuk referensi. Di sebelah kanan, pilih status: "Aktif" untuk pelanggan yang masih rutin, atau "Tidak Aktif" untuk yang sudah jarang menyewa.',
      },
      {
        target: '.tour-cust-input-address',
        title: '📍 Alamat',
        content: 'Kolom alamat bersifat opsional. Berguna jika Anda perlu mengirimkan surat atau ingin mengetahui area domisili pelanggan.',
      },
      {
        target: '.tour-cust-input-notes',
        title: '📝 Catatan Tambahan',
        content: 'Catat informasi penting tentang pelanggan di sini, misalnya: preferensi alat, kebiasaan, alergi suara tertentu, atau catatan khusus lainnya yang perlu diingat oleh pengelola studio.',
      },
      {
        target: '.tour-cust-btn-save',
        title: '💾 Simpan Data Pelanggan',
        content: 'Setelah semua data terisi, klik tombol "Simpan" ini untuk menyimpan pelanggan ke database. Data akan langsung tersinkronisasi ke semua perangkat yang terhubung.',
        hideNext: true,
      },
      {
        target: '.tour-cust-table',
        title: '🎉 Pelanggan Tersimpan!',
        content: 'Pelanggan baru Anda sudah muncul di tabel ini! Tabel menampilkan nama, kontak, tanggal bergabung, total booking, jam, revenue, dan status. Klik salah satu baris untuk melihat detail lengkapnya di panel samping.',
      },
      {
        target: '.tour-cust-table',
        title: '✅ Panduan Selesai!',
        content: 'Anda telah berhasil menguasai cara mengelola database pelanggan! Gunakan tombol Edit (pensil) untuk memperbarui data, atau tombol Hapus (tempat sampah) untuk menghapus pelanggan. Selanjutnya, mari kita pelajari inventaris studio!',
        nextPage: '/inventory'
      },
    ];
  } else if (path === '/calendar') {
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
        content: 'Anda telah berhasil menguasai cara super lengkap untuk membuat dan menghapus jadwal! Selanjutnya, mari kita pelajari cara mengelola database pelanggan.',
        nextPage: '/customers'
      }
    ];
  } else if (path === '/billing') {
    steps = [
      {
        target: '.tour-bill-stats',
        title: '📈 Ringkasan Keuangan',
        content: 'Selamat datang di halaman Kasir & Penagihan (Billing/POS)! Panel ini memberikan ringkasan cepat: total pendapatan dari transaksi Lunas, sisa piutang dari DP atau transaksi Belum Bayar, dan total seluruh transaksi.',
      },
      {
        target: '.tour-bill-tabs',
        title: '📂 Filter Status',
        content: 'Gunakan tab ini untuk menyaring transaksi. Anda bisa melihat "Semua" transaksi, hanya transaksi yang sudah "Lunas", atau memantau transaksi yang "Belum Lunas" agar mudah ditagih.',
      },
      {
        target: '.tour-bill-search',
        title: '🔍 Cari Transaksi',
        content: 'Ketik nama penyewa / band di sini untuk langsung menemukan riwayat transaksi dan tagihan mereka dengan cepat.',
      },
      {
        target: '.tour-bill-table',
        title: '🧾 Daftar Transaksi',
        content: 'Ini adalah daftar seluruh tagihan sewa. Di sini Anda bisa melihat detail status pembayaran dan sisa tagihan untuk setiap transaksi secara berurutan.',
      },
      {
        target: '.tour-bill-btn-pay',
        title: '💳 Melunasi Tagihan',
        content: 'Jika tagihan belum lunas (seperti jadwal DP yang baru saja Anda buat), tombol "Lunasi" akan muncul. Coba tekan tombol Lunasi ini sekarang untuk melunasinya!',
        hideNext: true
      },
      {
        target: '.tour-bill-row',
        title: '📄 Buka Invoice Digital',
        content: 'Sip! Jadwal sudah lunas. Sekarang, coba klik langsung pada baris transaksi ini untuk membuka Invoice digital secara lengkap.',
        hideNext: true
      },
      {
        target: '.tour-invoice-share',
        title: '📤 Bagikan Invoice',
        content: 'Di sini Anda bisa membagikan invoice langsung ke WhatsApp pelanggan, menyalin teks, atau mengunduhnya sebagai file gambar. Sangat praktis!',
      },
      {
        target: '.tour-invoice-print',
        title: '🖨️ Cetak atau Simpan PDF',
        content: 'Gunakan tombol ini jika Anda terhubung ke printer kasir bluetooth atau ingin menyimpan sebagai PDF. Setelah itu, silakan klik tombol Lanjut.',
      },
      {
        target: '.tour-bill-status-select',
        title: '↩️ Ubah / Batal Status',
        content: 'Jika terjadi kesalahan (misalnya Anda tidak sengaja menekan Lunas), Anda bisa mengembalikan status pembayaran kapan saja melalui dropdown ini. (Misal: kembali ke DP).',
      },
      {
        target: '.tour-bill-table',
        title: '✅ Panduan Selesai!',
        content: 'Sekarang Anda sudah benar-benar menguasai seluruh fitur kasir dan digital invoice! Sampai jumpa di panduan modul selanjutnya.',
      }
    ];
  } else {
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
