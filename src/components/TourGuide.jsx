import React, { useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { useTourStore } from '../store/useTourStore';

const TourGuide = () => {
  const { run, startTour, stopTour } = useTourStore();

  useEffect(() => {
    // Check if the user has seen the tour before
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      // Start tour automatically on first visit
      startTour();
    }
  }, [startTour]);

  const steps = [
    {
      target: '.tour-dashboard-stats',
      content: 'Selamat datang di 37 Music Studio! Di sini Anda bisa melihat ringkasan pendapatan dan status operasional studio.',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '.tour-calendar',
      content: 'Menu Calendar adalah jantung aplikasi ini. Gunakan menu ini untuk mengecek jadwal kosong dan memasukkan booking baru.',
      placement: 'right',
    },
    {
      target: '.tour-customers',
      content: 'Semua data pelanggan, band, atau penyewa akan tersimpan di sini secara otomatis.',
      placement: 'right',
    },
    {
      target: '.tour-billing',
      content: 'Kelola pembayaran, lunasi DP, dan cetak struk (invoice) untuk pelanggan Anda di menu ini.',
      placement: 'right',
    },
    {
      target: '.tour-profile',
      content: 'Klik profil Anda untuk mengubah Username, Nomor Telepon, atau mengganti Password.',
      placement: 'right',
    }
  ];

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      // Mark tour as seen in local storage
      localStorage.setItem('hasSeenTour', 'true');
      stopTour();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: 'var(--bg-dark)',
          backgroundColor: 'var(--bg-dark)',
          overlayColor: 'rgba(0, 0, 0, 0.6)',
          primaryColor: 'var(--accent-pink)',
          textColor: 'var(--text-primary)',
          zIndex: 10000,
        },
        tooltipContainer: {
          textAlign: 'left',
          border: '1px solid var(--border-light)',
          borderRadius: '12px',
        },
        buttonNext: {
          borderRadius: '6px',
          fontWeight: 600,
        },
        buttonBack: {
          color: 'var(--text-muted)',
          marginRight: '10px',
        },
        buttonSkip: {
          color: 'var(--text-muted)',
        }
      }}
      locale={{
        back: 'Kembali',
        close: 'Tutup',
        last: 'Selesai',
        next: 'Lanjut',
        skip: 'Lewati',
      }}
    />
  );
};

export default TourGuide;
