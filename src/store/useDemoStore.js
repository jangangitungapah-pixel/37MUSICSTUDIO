import { create } from 'zustand';
import { format, addDays, subDays, subMonths, addMonths } from 'date-fns';

// ─── Seed-based deterministic pseudo-random ───
function makeSeedRand(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const PRICE_PER_HOUR = 120000;
const today = new Date();
const currentYear = today.getFullYear();
const DEMO_TODAY_STR = format(today, 'yyyy-MM-dd');

const BANDS = [
  { name: 'Nocturno',           phone: '082122466133', isVIP: true  },
  { name: 'Thunder Strike',     phone: '081234567890', isVIP: true  },
  { name: 'Iron Soul',          phone: '085678739042', isVIP: true  },
  { name: 'Senja Di Jakarta',   phone: '081199887766', isVIP: true  },
  { name: 'Melodi Fajar',       phone: '082233441122', isVIP: true  },
  { name: 'The Phantom',        phone: '081344556677', isVIP: false },
  { name: 'Rebel Hearts',       phone: '082345678901', isVIP: false },
  { name: 'Dark Matter',        phone: '083456789012', isVIP: false },
  { name: 'Solar Pulse',        phone: '084567890123', isVIP: false },
  { name: 'Echo Chamber',       phone: '085678901234', isVIP: false },
  { name: 'Red Frequency',      phone: '086789012345', isVIP: false },
  { name: 'Gravity Wave',       phone: '087890123456', isVIP: false },
  { name: 'Sonic Riot',         phone: '088901234567', isVIP: false },
  { name: 'The Last Beat',      phone: '089012345678', isVIP: false },
  { name: 'Neon Skyline',       phone: '081122334455', isVIP: false },
  { name: 'Voltage Kings',      phone: '082233445566', isVIP: false },
  { name: 'Midnight Crash',     phone: '083344556677', isVIP: false },
  { name: 'Ruang Suara',        phone: '085566778899', isVIP: false },
  { name: 'Distorsi Kota',      phone: '087788990011', isVIP: false },
  { name: 'Langkah Kanan',      phone: '089900112233', isVIP: false },
];

// ─── Generate Bookings for Current Year ───
function buildDemoBookings() {
  const rand = makeSeedRand(currentYear * 10000);
  const result = [];
  let id = 1700000100001;

  let cursor = new Date(currentYear, 0, 1);
  const endDate = new Date(currentYear, 11, 31);

  while (cursor <= endDate) {
    const dow = cursor.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const prob = isWeekend ? 0.85 : 0.60; // Increased probability for more data

    if (rand() < prob) {
      const count = isWeekend
        ? Math.floor(rand() * 4) + 2  // 2–5
        : Math.floor(rand() * 3) + 1; // 1–3
      const slots = [];

      for (let b = 0; b < count; b++) {
        let hour, duration, ok = false, tries = 0;
        let type = 'latihan', sessionPrice = 0, sessionId = '';

        while (!ok && tries < 25) {
          hour = Math.floor(rand() * 11) + 10;  // 10–20
          
          const isRec = rand() < 0.25;
          if (isRec) {
            type = 'recording';
            if (rand() < 0.5) { duration = 6; sessionId = 'demo-sesi-1'; sessionPrice = 450000; }
            else { duration = 3; sessionId = 'demo-sesi-2'; sessionPrice = 250000; }
          } else {
            type = 'latihan';
            duration = Math.floor(rand() * 4) + 2; // 2–5
            sessionPrice = 0;
            sessionId = '';
          }

          ok = !slots.some(s => s.h < hour + duration && hour < s.h + s.d);
          tries++;
        }
        if (!ok) break;
        slots.push({ h: hour, d: duration });

        const bi = Math.floor(rand() * BANDS.length);
        const band = BANDS[bi];
        const dateStr = format(cursor, 'yyyy-MM-dd');
        const isPast = dateStr < DEMO_TODAY_STR;
        const r = rand();
        let status;
        if (isPast) {
          status = r < 0.80 ? 'confirmed' : r < 0.90 ? 'dp' : 'pending';
        } else {
          status = r < 0.35 ? 'confirmed' : r < 0.65 ? 'dp' : 'pending';
        }
        const basePrice = type === 'recording' ? sessionPrice : (duration * PRICE_PER_HOUR);
        const dpAmount = status === 'dp'
          ? Math.round(basePrice * 0.5) : 0;
        const discountAmount = (band.isVIP && type === 'latihan')
          ? Math.round(basePrice * 0.1) : 0;

        result.push({ id, type, sessionId, sessionPrice, band: band.name, phone: band.phone, date: dateStr, hour, duration, status, dpAmount, discountAmount, note: '' });
        id++;
      }
    }
    cursor = addDays(cursor, 1);
  }
  return result;
}

// ─── Generate Customers derived from bookings ───
function buildDemoCustomers(bookings) {
  return BANDS.map((band, i) => {
    const bks = bookings.filter(b => b.band === band.name);
    const totalHours = bks.reduce((s, b) => s + b.duration, 0);
    const totalSpent = bks.reduce((s, b) => {
      const base = b.type === 'recording' ? (b.sessionPrice || 0) : (b.duration * PRICE_PER_HOUR);
      if (b.status === 'confirmed') return s + base - (b.discountAmount || 0);
      if (b.status === 'dp') return s + (b.dpAmount || 0);
      return s;
    }, 0);
    const past = bks.filter(b => b.date <= DEMO_TODAY_STR).sort((a, b) => b.date.localeCompare(a.date));
    return {
      id: 1700000200000 + i,
      name: band.name,
      phone: band.phone,
      email: band.name.toLowerCase().replace(/\s+/g, '') + '@band.com',
      instagram: '@' + band.name.toLowerCase().replace(/\s+/g, ''),
      address: '',
      status: bks.length > 0 ? 'Active' : 'Inactive',
      notes: band.isVIP ? 'Pelanggan VIP — diskon 10% aktif' : '',
      isVIP: band.isVIP,
      joinDate: `${currentYear - 1}-01-15`, // Joined last year
      totalBookings: bks.length,
      totalHours,
      totalSpent,
      lastBooking: past.length > 0 ? past[0].date : '-',
    };
  });
}

// ─── Dynamic Inventory ───
function buildDemoInventory() {
  return [
    { id: 1700000300001, name: 'Pearl Export EXX725SBC', category: 'Drum', brand: 'Pearl', qty: 1, condition: 'Good', lastServiced: format(subMonths(today, 2), 'yyyy-MM-dd'), nextService: format(addMonths(today, 4), 'yyyy-MM-dd'), notes: 'Pedal bass perlu dikencangkan' },
    { id: 1700000300002, name: 'Hi-Hat Zildjian A Custom 14"', category: 'Drum', brand: 'Zildjian', qty: 1, condition: 'Excellent', lastServiced: format(subMonths(today, 1), 'yyyy-MM-dd'), nextService: format(addMonths(today, 5), 'yyyy-MM-dd'), notes: '' },
    { id: 1700000300003, name: 'Crash Cymbal 16"', category: 'Drum', brand: 'Zildjian', qty: 2, condition: 'Good', lastServiced: format(subDays(today, 45), 'yyyy-MM-dd'), nextService: format(addDays(today, 135), 'yyyy-MM-dd'), notes: '' },
    { id: 1700000300004, name: 'Marshall DSL40CR', category: 'Amps', brand: 'Marshall', qty: 1, condition: 'Excellent', lastServiced: format(subMonths(today, 3), 'yyyy-MM-dd'), nextService: format(addMonths(today, 3), 'yyyy-MM-dd'), notes: '' },
    { id: 1700000300005, name: 'Fender Frontman 212R', category: 'Amps', brand: 'Fender', qty: 2, condition: 'Good', lastServiced: format(subDays(today, 150), 'yyyy-MM-dd'), nextService: format(addDays(today, 10), 'yyyy-MM-dd'), notes: 'Jadwal servis hampir tiba' },
    { id: 1700000300006, name: 'Bass Amp Ampeg BA-108', category: 'Amps', brand: 'Ampeg', qty: 1, condition: 'Needs Repair', lastServiced: format(subMonths(today, 8), 'yyyy-MM-dd'), nextService: format(subDays(today, 15), 'yyyy-MM-dd'), notes: 'Volume knob goyang, perlu ganti potensiometer' },
    { id: 1700000300007, name: 'Shure SM58', category: 'Microphones', brand: 'Shure', qty: 4, condition: 'Excellent', lastServiced: format(subMonths(today, 1), 'yyyy-MM-dd'), nextService: format(addMonths(today, 5), 'yyyy-MM-dd'), notes: '' },
    { id: 1700000300008, name: 'AKG C1000 S', category: 'Microphones', brand: 'AKG', qty: 2, condition: 'Good', lastServiced: format(subMonths(today, 4), 'yyyy-MM-dd'), nextService: format(addMonths(today, 2), 'yyyy-MM-dd'), notes: '' },
    { id: 1700000300009, name: 'Audio-Technica AT2020', category: 'Microphones', brand: 'Audio-Technica', qty: 2, condition: 'Excellent', lastServiced: format(subDays(today, 20), 'yyyy-MM-dd'), nextService: format(addMonths(today, 6), 'yyyy-MM-dd'), notes: 'Baru dibeli' },
    { id: 1700000300010, name: 'Yamaha MG16XU Mixer', category: 'Accessories', brand: 'Yamaha', qty: 1, condition: 'Excellent', lastServiced: format(subMonths(today, 2), 'yyyy-MM-dd'), nextService: format(addMonths(today, 4), 'yyyy-MM-dd'), notes: '' },
    { id: 1700000300011, name: 'JBL EON615 Speaker', category: 'Accessories', brand: 'JBL', qty: 2, condition: 'Good', lastServiced: format(subMonths(today, 3), 'yyyy-MM-dd'), nextService: format(addMonths(today, 3), 'yyyy-MM-dd'), notes: '' },
    { id: 1700000300012, name: 'Kabel XLR 6m', category: 'Accessories', brand: 'Belden', qty: 8, condition: 'Good', lastServiced: format(subMonths(today, 5), 'yyyy-MM-dd'), nextService: format(addDays(today, 30), 'yyyy-MM-dd'), notes: '2 kabel ujungnya longgar, perlu diganti' },
    { id: 1700000300013, name: 'DI Box Behringer', category: 'Accessories', brand: 'Behringer', qty: 3, condition: 'Broken', lastServiced: format(subMonths(today, 6), 'yyyy-MM-dd'), nextService: format(subDays(today, 50), 'yyyy-MM-dd'), notes: 'Perlu penggantian unit baru' },
    { id: 1700000300014, name: 'Stand Mic Boom', category: 'Accessories', brand: 'Hercules', qty: 5, condition: 'Good', lastServiced: format(subMonths(today, 1), 'yyyy-MM-dd'), nextService: format(addMonths(today, 11), 'yyyy-MM-dd'), notes: '' },
  ];
}

// ─── Monthly Operational Expenses (Current Year) ───
function buildDemoTransactions() {
  const txs = [];
  let id = 1700000400001;
  const rand = makeSeedRand(currentYear * 500);
  
  for (let m = 0; m < 12; m++) {   // Jan–Dec
    const mm = String(m + 1).padStart(2, '0');
    
    // Fixed / Semi-fixed monthly expenses
    const baseListrik = 800000 + (rand() * 300000); // 800k - 1.1m
    const baseGaji = 4500000;
    const baseInternet = 450000;
    const baseCicilan = 1250000;
    const baseSewa = 5000000; // Added rent
    
    // 1. Sewa Tempat (around 1st of month)
    txs.push({ id: id++, date: `${currentYear}-${mm}-01`, type: 'expense', category: 'Sewa Gedung', amount: baseSewa, description: `Biaya Sewa Ruko / Studio`, isManual: true });

    // 2. Tagihan Listrik (around 5th of month)
    txs.push({ id: id++, date: `${currentYear}-${mm}-05`, type: 'expense', category: 'Listrik / Air', amount: Math.round(baseListrik/1000)*1000, description: `Tagihan PLN & PDAM`, isManual: true });
    
    // 3. Internet (around 10th)
    txs.push({ id: id++, date: `${currentYear}-${mm}-10`, type: 'expense', category: 'Internet', amount: baseInternet, description: `Tagihan Internet Biznet / Indihome`, isManual: true });
    
    // 4. Cicilan Alat (around 15th)
    txs.push({ id: id++, date: `${currentYear}-${mm}-15`, type: 'expense', category: 'Alat Baru', amount: baseCicilan, description: `Cicilan alat musik & perlengkapan`, isManual: true });
    
    // 5. Gaji Karyawan (around 28th)
    txs.push({ id: id++, date: `${currentYear}-${mm}-28`, type: 'expense', category: 'Gaji', amount: baseGaji, description: `Gaji teknisi & staf studio`, isManual: true });

    // Variable expenses (Random amounts and days)
    // Operasional (Air minum, kebersihan)
    if (rand() > 0.1) {
       const opAmt = 200000 + (rand() * 250000);
       const opDay = String(Math.floor(rand() * 25) + 1).padStart(2, '0');
       txs.push({ id: id++, date: `${currentYear}-${mm}-${opDay}`, type: 'expense', category: 'Operasional', amount: Math.round(opAmt/1000)*1000, description: `Perlengkapan kebersihan & air minum`, isManual: true });
    }

    // Perawatan (Servis, beli senar/stick)
    if (rand() > 0.3) {
       const pAmt = 250000 + (rand() * 500000);
       const pDay = String(Math.floor(rand() * 25) + 1).padStart(2, '0');
       txs.push({ id: id++, date: `${currentYear}-${mm}-${pDay}`, type: 'expense', category: 'Perawatan', amount: Math.round(pAmt/1000)*1000, description: rand() > 0.5 ? `Beli senar gitar & drum stick` : `Servis ampli / AC / Drum`, isManual: true });
    }

    // Lainnya (Lain-lain)
    if (rand() > 0.6) {
       const lAmt = 50000 + (rand() * 200000);
       const lDay = String(Math.floor(rand() * 25) + 1).padStart(2, '0');
       txs.push({ id: id++, date: `${currentYear}-${mm}-${lDay}`, type: 'expense', category: 'Lainnya', amount: Math.round(lAmt/1000)*1000, description: `Konsumsi lembur / tak terduga`, isManual: true });
    }
  }
  
  // Sort transactions chronologically
  return txs.sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
}

// ─── Demo Staff ───
const demoStaffMembers = [
  { id: 'demo-admin-1', name: 'Dewi Admin', role: 'admin', phone: '081234567890', status: 'active', joinDate: `${currentYear - 2}-05-10` },
  { id: 'demo-staff-1', name: 'Budi Teknisi', role: 'staff', phone: '081987654321', status: 'active', joinDate: `${currentYear - 1}-08-15` },
  { id: 'demo-staff-2', name: 'Siti Resepsionis', role: 'staff', phone: '082111223344', status: 'active', joinDate: `${currentYear}-02-01` },
  { id: 'demo-staff-3', name: 'Andi Freelance', role: 'staff', phone: '083344556677', status: 'inactive', joinDate: `${currentYear}-01-10` },
];

const demoAlbumsItems = [
  { id: 'album-1', name: 'Ruang Studio & Kontrol', description: 'Foto-foto ruangan live studio dan audio control room', createdAt: format(subDays(today, 15), 'yyyy-MM-dd HH:mm:ss') },
  { id: 'album-2', name: 'Peralatan & Gear', description: 'Koleksi instrumen musik, drum, gitar, dan amplifier premium', createdAt: format(subDays(today, 12), 'yyyy-MM-dd HH:mm:ss') },
];

const demoGalleryItems = [
  {
    id: 1700000500001,
    url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1000',
    caption: 'Ruang Live Recording Studio Utama',
    showOnLandingPage: true,
    showToCustomer: true,
    albumId: 'album-1',
    createdAt: format(subDays(today, 10), 'yyyy-MM-dd')
  },
  {
    id: 1700000500002,
    url: 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?q=80&w=1000',
    caption: 'Mixing Console & Audio Control Room',
    showOnLandingPage: true,
    showToCustomer: true,
    albumId: 'album-1',
    createdAt: format(subDays(today, 8), 'yyyy-MM-dd')
  },
  {
    id: 1700000500003,
    url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=1000',
    caption: 'Pearl Export Premium Drum Kit',
    showOnLandingPage: true,
    showToCustomer: true,
    albumId: 'album-2',
    createdAt: format(subDays(today, 6), 'yyyy-MM-dd')
  },
  {
    id: 1700000500004,
    url: 'https://images.unsplash.com/photo-1550985616-10810253b84d?q=80&w=1000',
    caption: 'Koleksi Gitar Elektrik & Bass Standby',
    showOnLandingPage: false,
    showToCustomer: true,
    albumId: 'album-2',
    createdAt: format(subDays(today, 4), 'yyyy-MM-dd')
  },
  {
    id: 1700000500005,
    url: 'https://images.unsplash.com/photo-1487180142328-054b783fc471?q=80&w=1000',
    caption: 'Vocal Recording Booth & Shure SM58 / AT2020',
    showOnLandingPage: true,
    showToCustomer: false,
    albumId: 'album-1',
    createdAt: format(subDays(today, 2), 'yyyy-MM-dd')
  }
];

// ─── Pre-build all demo data (runs once at import) ───
const demoBookings    = buildDemoBookings();
const demoCustomers   = buildDemoCustomers(demoBookings);
const demoInventory   = buildDemoInventory();
const demoTransactions = buildDemoTransactions();

// ─── Store ───
export const useDemoStore = create((set) => ({
  isDemoMode: false,
  demoBookings,
  demoCustomers,
  demoInventory,
  demoTransactions,
  demoStaff: demoStaffMembers,
  demoGallery: demoGalleryItems,
  demoAlbums: demoAlbumsItems,
  toggleDemoMode: () => set(state => ({ isDemoMode: !state.isDemoMode })),
  setDemoMode: (val) => set({ isDemoMode: val }),
}));
