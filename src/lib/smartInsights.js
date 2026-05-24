const DAY_LABELS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const SHORT_DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toDateKey = (date) => {
  const d = date instanceof Date ? date : toDate(date);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const currency = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

const overlaps = (aStart, aEnd, bStart, bEnd) => Number(aStart) < Number(bEnd) && Number(bStart) < Number(aEnd);

export const getBookingTotal = (booking, pricePerHour = 0) => {
  if (!booking || booking.status === 'maintenance') return 0;
  const base = booking.type === 'recording'
    ? Number(booking.sessionPrice || 0)
    : Number(booking.duration || 0) * Number(pricePerHour || 0);
  return Math.max(0, base + Number(booking.equipmentCost || 0) - Number(booking.discountAmount || 0));
};

export const getRemainingDue = (booking, pricePerHour = 0) => {
  if (!booking || booking.status === 'confirmed' || booking.status === 'maintenance') return 0;
  const total = getBookingTotal(booking, pricePerHour);
  return Math.max(0, total - Number(booking.dpAmount || 0));
};

export const getDemandInsights = (bookings = []) => {
  const activeBookings = bookings.filter((b) => b.status !== 'maintenance' && b.date);
  const byDay = Array(7).fill(0);
  const byHour = {};
  const byDuration = {};
  let totalHours = 0;

  activeBookings.forEach((booking) => {
    const date = toDate(booking.date);
    if (!date) return;
    const duration = Number(booking.duration || 0);
    byDay[date.getDay()] += 1;
    byDuration[duration] = (byDuration[duration] || 0) + 1;
    totalHours += duration;
    for (let h = Number(booking.hour || 0); h < Number(booking.hour || 0) + duration; h += 1) {
      byHour[h] = (byHour[h] || 0) + 1;
    }
  });

  const busiestDayIndex = byDay.reduce((best, count, idx) => count > byDay[best] ? idx : best, 0);
  const quietestDayIndex = byDay.reduce((best, count, idx) => count < byDay[best] ? idx : best, 0);
  const busiestHour = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0]?.[0];
  const favoriteDuration = Object.entries(byDuration).sort((a, b) => b[1] - a[1])[0]?.[0];
  const potentialHours = Math.max(1, activeBookings.length ? new Set(activeBookings.map((b) => b.date)).size * 13 : 13);
  const occupancyPercent = Math.min(100, Math.round((totalHours / potentialHours) * 100));

  return {
    totalBookings: activeBookings.length,
    totalHours,
    busiestDay: DAY_LABELS[busiestDayIndex],
    busiestDayCount: byDay[busiestDayIndex],
    quietestDay: DAY_LABELS[quietestDayIndex],
    busiestHour: busiestHour ? Number(busiestHour) : null,
    busiestHourCount: busiestHour ? byHour[busiestHour] : 0,
    favoriteDuration: favoriteDuration ? Number(favoriteDuration) : null,
    occupancyPercent,
  };
};


export const getBillingInsights = (bookings = [], pricePerHour = 0) => {
  const todayKey = toDateKey(new Date());
  const openInvoices = bookings
    .filter((b) => b.status !== 'confirmed' && b.status !== 'maintenance')
    .map((booking) => {
      const remaining = getRemainingDue(booking, pricePerHour);
      const date = toDate(booking.date);
      const daysUntil = date ? Math.ceil((date - new Date(todayKey)) / 86400000) : null;
      let urgency = 'normal';
      if (daysUntil !== null && daysUntil < 0) urgency = 'overdue';
      else if (daysUntil !== null && daysUntil <= 1) urgency = 'today';
      else if (remaining >= 500000) urgency = 'high';
      return { ...booking, remaining, daysUntil, urgency };
    })
    .filter((b) => b.remaining > 0)
    .sort((a, b) => {
      const urgencyRank = { overdue: 4, today: 3, high: 2, normal: 1 };
      return urgencyRank[b.urgency] - urgencyRank[a.urgency] || b.remaining - a.remaining;
    });

  const totalReceivable = openInvoices.reduce((sum, b) => sum + b.remaining, 0);
  const followUpsToday = openInvoices.filter((b) => b.urgency === 'overdue' || b.urgency === 'today');
  const largestInvoice = openInvoices[0] || null;

  return {
    openInvoices,
    followUpsToday,
    totalReceivable,
    largestInvoice,
    summary: openInvoices.length
      ? `${openInvoices.length} invoice perlu follow-up, total ${currency(totalReceivable)}`
      : 'Tidak ada invoice terbuka',
  };
};

export const getCustomerRetentionInsights = (customers = []) => {
  const now = new Date();
  const withDays = customers.map((customer) => {
    const last = customer.lastBooking && customer.lastBooking !== '-' ? toDate(customer.lastBooking) : null;
    const daysSinceLastBooking = last ? Math.floor((now - last) / 86400000) : null;
    return { ...customer, daysSinceLastBooking };
  });

  const passiveCustomers = withDays
    .filter((c) => Number(c.totalBookings || 0) > 0 && c.daysSinceLastBooking !== null && c.daysSinceLastBooking > 30)
    .sort((a, b) => b.daysSinceLastBooking - a.daysSinceLastBooking);

  const vipCandidates = withDays
    .filter((c) => !c.isVIP && (Number(c.totalBookings || 0) >= 5 || Number(c.totalSpent || 0) >= 1000000))
    .sort((a, b) => Number(b.totalSpent || 0) - Number(a.totalSpent || 0));

  const promoTargets = withDays
    .filter((c) => c.phone && (c.daysSinceLastBooking === null || c.daysSinceLastBooking >= 14))
    .sort((a, b) => Number(b.totalBookings || 0) - Number(a.totalBookings || 0))
    .slice(0, 5);

  return { passiveCustomers, vipCandidates, promoTargets };
};

export const getMaintenanceUsageInsights = (inventory = [], bookings = []) => {
  const today = new Date();
  const startWindow = new Date(today);
  startWindow.setDate(today.getDate() - 30);
  const recentBookings = bookings.filter((b) => {
    const date = toDate(b.date);
    return date && date >= startWindow && date <= today && b.status !== 'maintenance';
  });
  const studioHours30d = recentBookings.reduce((sum, b) => sum + Number(b.duration || 0), 0);

  const recommendations = inventory.map((item) => {
    const nextService = toDate(item.nextService);
    const daysToService = nextService ? Math.ceil((nextService - today) / 86400000) : null;
    const explicitRentalHours = recentBookings
      .filter((b) => Array.isArray(b.rentedEquipment) && b.rentedEquipment.includes(item.id))
      .reduce((sum, b) => sum + Number(b.duration || 0), 0);
    const sharedUseHours = ['drum', 'amps', 'microphones', 'accessories']
      .includes(String(item.category || '').toLowerCase()) ? Math.round(studioHours30d * 0.65) : 0;
    const usageHours = Math.max(explicitRentalHours, sharedUseHours);
    const conditionPenalty = { Excellent: 0, Good: 1, 'Needs Repair': 4, Broken: 6 }[item.condition] || 1;
    const duePenalty = daysToService === null ? 1 : daysToService < 0 ? 6 : daysToService <= 7 ? 4 : daysToService <= 21 ? 2 : 0;
    const usagePenalty = usageHours >= 80 ? 4 : usageHours >= 45 ? 2 : usageHours >= 20 ? 1 : 0;
    const priority = conditionPenalty + duePenalty + usagePenalty;

    return {
      item,
      usageHours,
      daysToService,
      priority,
      label: priority >= 8 ? 'Kritis' : priority >= 5 ? 'Tinggi' : priority >= 3 ? 'Pantau' : 'Normal',
      reason: daysToService !== null && daysToService <= 7
        ? 'jadwal servis sangat dekat'
        : usageHours >= 45
          ? 'pemakaian 30 hari tinggi'
          : item.condition === 'Needs Repair' || item.condition === 'Broken'
            ? 'kondisi alat perlu perhatian'
            : 'masih dalam batas normal',
    };
  }).sort((a, b) => b.priority - a.priority || b.usageHours - a.usageHours);

  return { studioHours30d, recommendations };
};

export const getRevenueForecast = (bookings = [], transactions = [], pricePerHour = 0, now = new Date()) => {
  const monthKey = toDateKey(now).slice(0, 7);
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const monthlyBookings = bookings.filter((b) => b.date?.startsWith(monthKey) && b.status !== 'maintenance');
  const bookedValue = monthlyBookings.reduce((sum, b) => sum + getBookingTotal(b, pricePerHour), 0);
  const cashReceivedFromBookings = monthlyBookings.reduce((sum, b) => {
    if (b.status === 'confirmed') return sum + getBookingTotal(b, pricePerHour);
    if (b.status === 'dp') return sum + Number(b.dpAmount || 0);
    return sum;
  }, 0);
  const manualIncome = transactions
    .filter((t) => t.type === 'income' && t.date?.startsWith(monthKey))
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const currentIncome = cashReceivedFromBookings + manualIncome;
  const runRateForecast = dayOfMonth > 0 ? Math.round((currentIncome / dayOfMonth) * daysInMonth) : currentIncome;
  const receivable = monthlyBookings.reduce((sum, b) => sum + getRemainingDue(b, pricePerHour), 0);
  const conservativeForecast = Math.max(currentIncome, runRateForecast);
  const optimisticForecast = conservativeForecast + receivable;

  return {
    currentIncome,
    bookedValue,
    receivable,
    conservativeForecast,
    optimisticForecast,
    progressPercent: Math.min(100, Math.round((dayOfMonth / daysInMonth) * 100)),
  };
};

export const getAnomalies = (bookings = [], pricePerHour = 0) => {
  const anomalies = [];
  const active = bookings.filter((b) => b.date);

  active.forEach((booking) => {
    const id = booking.id || `${booking.date}-${booking.hour}`;
    const total = getBookingTotal(booking, pricePerHour);
    if (booking.status !== 'maintenance' && total <= 0) {
      anomalies.push({ id: `${id}-zero-total`, severity: 'high', title: 'Harga booking nol', detail: `${booking.band || 'Booking'} belum punya nilai tagihan valid.` });
    }
    if (Number(booking.duration || 0) <= 0 || Number(booking.duration || 0) > 12) {
      anomalies.push({ id: `${id}-duration`, severity: 'medium', title: 'Durasi tidak wajar', detail: `${booking.band || 'Booking'} berdurasi ${booking.duration || 0} jam.` });
    }
    if (Number(booking.hour || 0) < 10 || Number(booking.hour || 0) >= 23) {
      anomalies.push({ id: `${id}-hour`, severity: 'medium', title: 'Jam di luar operasional', detail: `${booking.band || 'Booking'} berada di jam ${booking.hour}.00.` });
    }
    if (booking.status === 'dp' && Number(booking.dpAmount || 0) > total) {
      anomalies.push({ id: `${id}-dp`, severity: 'high', title: 'DP melebihi tagihan', detail: `${booking.band || 'Booking'} memiliki DP ${currency(booking.dpAmount)} dari total ${currency(total)}.` });
    }
  });

  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      const a = active[i];
      const b = active[j];
      if (a.date !== b.date || a.id === b.id) continue;
      if (!overlaps(a.hour, Number(a.hour) + Number(a.duration || 1), b.hour, Number(b.hour) + Number(b.duration || 1))) continue;
      const maintenanceInvolved = a.status === 'maintenance' || b.status === 'maintenance' || a.type === 'maintenance' || b.type === 'maintenance';
      anomalies.push({
        id: `${a.id}-${b.id}-overlap`,
        severity: maintenanceInvolved ? 'high' : 'medium',
        title: maintenanceInvolved ? 'Maintenance bertabrakan' : 'Booking bertabrakan',
        detail: `${a.band || 'Jadwal A'} dan ${b.band || 'Jadwal B'} overlap pada ${a.date}.`,
      });
    }
  }

  return anomalies.slice(0, 12);
};
