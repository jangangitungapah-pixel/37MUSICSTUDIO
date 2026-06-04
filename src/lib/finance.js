import { format, isSameDay, isSameWeek, isSameMonth, isSameYear } from 'date-fns';

export const PERIOD_LABELS = {
  day: 'Hari Ini',
  week: 'Minggu Ini',
  month: 'Bulan Ini',
  year: 'Tahun Ini',
  all: 'Semua Waktu'
};

export const buildCombinedLedger = ({ transactions = [], bookings = [], pricePerHour = 0 }) => {
  const allEntries = transactions.map(t => ({
    ...t,
    amount: Number(t.amount || 0)
  }));

  bookings.forEach((booking) => {
    if (booking.status === 'maintenance' || booking.status === 'cancelled') return;

    if (booking.status === 'confirmed') {
      const base = Number(booking.type === 'recording'
        ? (booking.sessionPrice || 0)
        : (booking.duration * pricePerHour));
      const total = base + Number(booking.equipmentCost || 0) - Number(booking.discountAmount || 0);

      allEntries.push({
        id: `book-${booking.id}`,
        date: booking.date,
        type: 'income',
        category: 'Sewa Studio',
        amount: Number(total),
        description: `Sewa oleh ${booking.band} (${booking.duration} Jam)${booking.discountAmount > 0 ? ' [VIP]' : ''}`,
        isManual: false
      });
    } else if (booking.status === 'dp' && Number(booking.dpAmount || 0) > 0) {
      allEntries.push({
        id: `dp-${booking.id}`,
        date: booking.date,
        type: 'income',
        category: 'Sewa Studio',
        amount: Number(booking.dpAmount),
        description: `DP Sewa oleh ${booking.band}`,
        isManual: false
      });
    }
  });

  allEntries.sort((a, b) => new Date(a.date) - new Date(b.date) || (a.id > b.id ? 1 : -1));

  let runningBalance = 0;
  return allEntries.map((entry) => {
    const amt = Number(entry.amount || 0);
    runningBalance += entry.type === 'income' ? amt : -amt;
    return { ...entry, amount: amt, balance: runningBalance };
  }).reverse();
};

export const filterLedgerByPeriod = (entries, filterPeriod, searchQuery = '', now = new Date()) => {
  const filteredByPeriod = filterPeriod === 'all'
    ? entries
    : entries.filter((entry) => {
        const entryDate = new Date(entry.date);
        if (filterPeriod === 'day') return isSameDay(entryDate, now);
        if (filterPeriod === 'week') return isSameWeek(entryDate, now, { weekStartsOn: 1 });
        if (filterPeriod === 'month') return isSameMonth(entryDate, now);
        if (filterPeriod === 'year') return isSameYear(entryDate, now);
        return true;
      });

  const query = searchQuery.trim().toLowerCase();
  if (!query) return filteredByPeriod;

  return filteredByPeriod.filter((entry) =>
    entry.description.toLowerCase().includes(query)
    || entry.category.toLowerCase().includes(query)
  );
};

export const buildFinanceLineChartData = (entries, filterPeriod) => {
  const grouped = {};

  entries.forEach((entry) => {
    const entryDate = new Date(entry.date);
    let dateKey;
    let displayDate;

    if (filterPeriod === 'all') {
      dateKey = format(entryDate, 'yyyy-MM');
      displayDate = format(entryDate, 'MMM yyyy');
    } else if (filterPeriod === 'year') {
      dateKey = format(entryDate, 'yyyy-MM');
      displayDate = format(entryDate, 'MMM');
    } else {
      dateKey = format(entryDate, 'yyyy-MM-dd');
      displayDate = format(entryDate, 'dd MMM');
    }

    if (!grouped[dateKey]) {
      grouped[dateKey] = {
        sortKey: dateKey,
        date: displayDate,
        Pemasukan: 0,
        Pengeluaran: 0
      };
    }

    if (entry.type === 'income') grouped[dateKey].Pemasukan += entry.amount;
    else grouped[dateKey].Pengeluaran += entry.amount;
  });

  return Object.values(grouped).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
};

export const buildExpensePieData = (entries) => {
  const grouped = {};

  entries.filter((entry) => entry.type === 'expense').forEach((entry) => {
    if (!grouped[entry.category]) grouped[entry.category] = 0;
    grouped[entry.category] += entry.amount;
  });

  return Object.keys(grouped).map((name) => ({ name, value: grouped[name] }));
};
