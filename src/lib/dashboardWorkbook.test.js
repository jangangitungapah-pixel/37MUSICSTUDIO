import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { buildDashboardWorkbook } from './dashboardWorkbook';

const baseContext = {
  studioName: '37 Music Studio',
  pricePerHour: 100000,
  operationalHours: { start: 10, end: 23 },
  today: new Date('2026-05-22T10:00:00+07:00'),
  bookings: [
    {
      id: 10001,
      date: '2026-05-20',
      hour: 10,
      duration: 2,
      band: 'Alpha',
      phone: '08123456789',
      type: 'booking',
      status: 'confirmed',
      discountAmount: 0,
      equipmentCost: 50000,
    },
    {
      id: 10002,
      date: '2026-05-21',
      hour: 14,
      duration: 3,
      band: 'Beta',
      phone: '08987654321',
      type: 'booking',
      status: 'dp',
      dpAmount: 100000,
      discountAmount: 25000,
    },
  ],
  transactions: [
    {
      id: 1,
      date: '2026-05-19',
      type: 'expense',
      category: 'Operasional',
      amount: 75000,
      description: 'Kabel jack',
      isManual: true,
    },
  ],
  customers: [
    {
      id: 1,
      name: 'Alpha',
      phone: '08123456789',
      joinDate: '2026-01-01',
      totalBookings: 12,
      totalHours: 30,
      totalSpent: 2500000,
      lastBooking: '2026-05-20',
    },
  ],
  inventory: [
    {
      id: 1,
      name: 'Pearl Export',
      category: 'Drum',
      brand: 'Pearl',
      qty: 1,
      condition: 'Needs Repair',
      price: 5000000,
      lastServiced: '2026-03-01',
      nextService: '2026-05-23',
      notes: 'Tuning ulang',
    },
  ],
  staffMembers: [
    {
      id: 'admin',
      name: 'Admin Utama',
      role: 'admin',
      status: 'active',
      username: 'admin',
      email: 'admin@37musicstudio.local',
      phone: '081111111',
      permissions: ['dashboard:view', 'finance:view'],
    },
  ],
};

describe('dashboard workbook export', () => {
  it('builds a polished multi-sheet dashboard workbook with operational columns', () => {
    const workbook = buildDashboardWorkbook(new ExcelJS.Workbook(), baseContext);

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      'Ringkasan',
      'Jadwal & Booking',
      'Pembukuan',
      'Daftar Pelanggan',
      'Inventaris Alat',
      'Daftar Staff',
    ]);

    const bookingSheet = workbook.getWorksheet('Jadwal & Booking');
    expect(bookingSheet.getCell('A1').value).toContain('Laporan Jadwal & Booking');
    expect(bookingSheet.getCell('Q6').value).toBe('Catatan Follow-up');
    expect(bookingSheet.getCell('N9').value).toEqual({ formula: 'SUBTOTAL(109,N7:N8)' });
    expect(bookingSheet.autoFilter).toBe('A6:Q8');
    expect(bookingSheet.views[0].state).toBe('frozen');

    const financeSheet = workbook.getWorksheet('Pembukuan');
    expect(financeSheet.getCell('J6').value).toBe('Saldo Berjalan');
    expect(financeSheet.getCell('H10').value).toEqual({ formula: 'SUBTOTAL(109,H7:H9)' });

    const customersSheet = workbook.getWorksheet('Daftar Pelanggan');
    expect(customersSheet.getCell('K6').value).toBe('Segmen');
    expect(customersSheet.getCell('K7').value).toBe('VIP');

    const inventorySheet = workbook.getWorksheet('Inventaris Alat');
    expect(inventorySheet.getCell('L6').value).toBe('Prioritas');
    expect(inventorySheet.getCell('G8').value).toEqual({ formula: 'SUBTOTAL(109,G7:G7)' });

    const staffSheet = workbook.getWorksheet('Daftar Staff');
    expect(staffSheet.getCell('H6').value).toBe('Catatan Akses');
  });

  it('writes a valid xlsx buffer', async () => {
    const workbook = buildDashboardWorkbook(new ExcelJS.Workbook(), baseContext);
    const buffer = await workbook.xlsx.writeBuffer();

    expect(buffer.byteLength).toBeGreaterThan(10000);
  });
});
