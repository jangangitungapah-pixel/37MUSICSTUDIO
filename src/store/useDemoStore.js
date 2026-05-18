import { create } from 'zustand';
import { format, addDays } from 'date-fns';

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
const DEMO_TODAY_STR = '2026-05-17';

const BANDS = [
  { name: 'Nocturno',       phone: '082122466133', isVIP: true  },
  { name: 'Thunder Strike', phone: '081234567890', isVIP: true  },
  { name: 'Iron Soul',      phone: '085678739042', isVIP: true  },
  { name: 'The Phantom',    phone: '081344556677', isVIP: false },
  { name: 'Rebel Hearts',   phone: '082345678901', isVIP: false },
  { name: 'Dark Matter',    phone: '083456789012', isVIP: false },
  { name: 'Solar Pulse',    phone: '084567890123', isVIP: false },
  { name: 'Echo Chamber',   phone: '085678901234', isVIP: false },
  { name: 'Red Frequency',  phone: '086789012345', isVIP: false },
  { name: 'Gravity Wave',   phone: '087890123456', isVIP: false },
  { name: 'Sonic Riot',     phone: '088901234567', isVIP: false },
  { name: 'The Last Beat',  phone: '089012345678', isVIP: false },
  { name: 'Neon Skyline',   phone: '081122334455', isVIP: false },
  { name: 'Voltage Kings',  phone: '082233445566', isVIP: false },
  { name: 'Midnight Crash', phone: '083344556677', isVIP: false },
];

// ─── Generate ~200+ Bookings for full year 2026 ───
function buildDemoBookings() {
  const rand = makeSeedRand(20260101);
  const result = [];
  let id = 1700000100001;

  let cursor = new Date(2026, 0, 1);
  const endDate = new Date(2026, 11, 31);

  while (cursor <= endDate) {
    const dow = cursor.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const prob = isWeekend ? 0.82 : 0.52;

    if (rand() < prob) {
      const count = isWeekend
        ? Math.floor(rand() * 3) + 2  // 2–4
        : Math.floor(rand() * 2) + 1; // 1–2
      const slots = [];

      for (let b = 0; b < count; b++) {
        let hour, duration, ok = false, tries = 0;
        while (!ok && tries < 25) {
          hour = Math.floor(rand() * 11) + 10;  // 10–20
          duration = Math.floor(rand() * 4) + 2; // 2–5
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
          status = r < 0.72 ? 'confirmed' : r < 0.88 ? 'dp' : 'pending';
        } else {
          status = r < 0.25 ? 'confirmed' : r < 0.55 ? 'dp' : 'pending';
        }
        const dpAmount = status === 'dp'
          ? Math.round(duration * PRICE_PER_HOUR * 0.5) : 0;
        const discountAmount = band.isVIP
          ? Math.round(duration * PRICE_PER_HOUR * 0.1) : 0;

        result.push({ id, band: band.name, phone: band.phone, date: dateStr, hour, duration, status, dpAmount, discountAmount, note: '' });
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
      if (b.status === 'confirmed') return s + (b.duration * PRICE_PER_HOUR) - (b.discountAmount || 0);
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
      joinDate: '2025-01-15',
      totalBookings: bks.length,
      totalHours,
      totalSpent,
      lastBooking: past.length > 0 ? past[0].date : '-',
    };
  });
}

// ─── Static Inventory ───
const DEMO_INVENTORY_LIST = [
  { id: 1700000300001, name: 'Pearl Export EXX725SBC', category: 'Drum', brand: 'Pearl', qty: 1, condition: 'Good', lastServiced: '2026-01-10', nextService: '2026-07-10', notes: 'Pedal bass perlu dikencangkan' },
  { id: 1700000300002, name: 'Hi-Hat Zildjian A Custom 14"', category: 'Drum', brand: 'Zildjian', qty: 1, condition: 'Excellent', lastServiced: '2026-03-01', nextService: '2026-09-01', notes: '' },
  { id: 1700000300003, name: 'Crash Cymbal 16"', category: 'Drum', brand: 'Zildjian', qty: 2, condition: 'Good', lastServiced: '2026-02-15', nextService: '2026-08-15', notes: '' },
  { id: 1700000300004, name: 'Marshall DSL40CR', category: 'Amps', brand: 'Marshall', qty: 1, condition: 'Excellent', lastServiced: '2026-01-20', nextService: '2026-07-20', notes: '' },
  { id: 1700000300005, name: 'Fender Frontman 212R', category: 'Amps', brand: 'Fender', qty: 2, condition: 'Good', lastServiced: '2026-02-01', nextService: '2026-05-01', notes: 'Jadwal servis hampir tiba' },
  { id: 1700000300006, name: 'Bass Amp Ampeg BA-108', category: 'Amps', brand: 'Ampeg', qty: 1, condition: 'Needs Repair', lastServiced: '2025-11-10', nextService: '2026-03-10', notes: 'Volume knob goyang, perlu ganti potensiometer' },
  { id: 1700000300007, name: 'Shure SM58', category: 'Microphones', brand: 'Shure', qty: 4, condition: 'Excellent', lastServiced: '2026-04-01', nextService: '2026-10-01', notes: '' },
  { id: 1700000300008, name: 'AKG C1000 S', category: 'Microphones', brand: 'AKG', qty: 2, condition: 'Good', lastServiced: '2026-01-15', nextService: '2026-07-15', notes: '' },
  { id: 1700000300009, name: 'Yamaha MG16XU Mixer', category: 'Accessories', brand: 'Yamaha', qty: 1, condition: 'Excellent', lastServiced: '2026-03-15', nextService: '2026-09-15', notes: '' },
  { id: 1700000300010, name: 'JBL EON615 Speaker', category: 'Accessories', brand: 'JBL', qty: 2, condition: 'Good', lastServiced: '2026-02-20', nextService: '2026-08-20', notes: '' },
  { id: 1700000300011, name: 'Kabel XLR 6m', category: 'Accessories', brand: 'Belden', qty: 8, condition: 'Good', lastServiced: '2026-01-01', nextService: '2026-06-01', notes: '2 kabel ujungnya longgar, perlu diganti' },
  { id: 1700000300012, name: 'DI Box Behringer', category: 'Accessories', brand: 'Behringer', qty: 3, condition: 'Broken', lastServiced: '2025-12-01', nextService: '2026-01-01', notes: 'Perlu penggantian unit baru' },
];

// ─── Monthly Operational Expenses (Jan–May 2026) ───
function buildDemoTransactions() {
  const txs = [];
  let id = 1700000400001;
  const monthExpenses = [
    { cat: 'Listrik / Air',  desc: 'Tagihan PLN & PDAM',                    amount: 850000 },
    { cat: 'Gaji',            desc: 'Gaji teknisi & staf studio',             amount: 3500000 },
    { cat: 'Operasional',     desc: 'Perlengkapan kebersihan & operasional',  amount: 320000 },
    { cat: 'Listrik / Air',   desc: 'Tagihan internet Indihome',              amount: 450000 },
    { cat: 'Perawatan',       desc: 'Servis rutin peralatan studio',          amount: 650000 },
  ];
  for (let m = 0; m < 5; m++) {   // Jan–May
    const mm = String(m + 1).padStart(2, '0');
    monthExpenses.forEach((exp, ei) => {
      const dd = String(Math.min(28, (ei + 1) * 5)).padStart(2, '0');
      txs.push({ id, date: `2026-${mm}-${dd}`, type: 'expense', category: exp.cat, amount: exp.amount, description: `${exp.desc} — ${m + 1}/2026`, isManual: true });
      id++;
    });
  }
  return txs;
}

// ─── Pre-build all demo data (runs once at import) ───
const demoBookings    = buildDemoBookings();
const demoCustomers   = buildDemoCustomers(demoBookings);
const demoInventory   = DEMO_INVENTORY_LIST;
const demoTransactions = buildDemoTransactions();

// ─── Store ───
export const useDemoStore = create((set) => ({
  isDemoMode: false,
  demoBookings,
  demoCustomers,
  demoInventory,
  demoTransactions,
  toggleDemoMode: () => set(state => ({ isDemoMode: !state.isDemoMode })),
  setDemoMode: (val) => set({ isDemoMode: val }),
}));
