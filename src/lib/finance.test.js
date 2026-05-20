import { describe, expect, it } from 'vitest';
import {
  buildCombinedLedger,
  buildExpensePieData,
  buildFinanceLineChartData,
  filterLedgerByPeriod
} from './finance';

describe('finance ledger helpers', () => {
  it('builds booking income with discounts, recording package prices, DP, and running balance', () => {
    const ledger = buildCombinedLedger({
      pricePerHour: 100000,
      transactions: [
        {
          id: 1,
          date: '2026-05-02',
          type: 'expense',
          category: 'Operasional',
          amount: 50000,
          description: 'Air mineral',
          isManual: true
        }
      ],
      bookings: [
        {
          id: 10,
          date: '2026-05-01',
          status: 'confirmed',
          type: 'booking',
          band: 'Alpha',
          duration: 2,
          discountAmount: 25000
        },
        {
          id: 11,
          date: '2026-05-03',
          status: 'confirmed',
          type: 'recording',
          band: 'Beta',
          duration: 6,
          sessionPrice: 450000,
          discountAmount: 50000
        },
        {
          id: 12,
          date: '2026-05-04',
          status: 'dp',
          type: 'booking',
          band: 'Gamma',
          duration: 3,
          dpAmount: 75000
        },
        {
          id: 13,
          date: '2026-05-05',
          status: 'maintenance',
          type: 'maintenance',
          band: 'Maintenance',
          duration: 1
        }
      ]
    });

    expect(ledger).toHaveLength(4);
    expect(ledger.find((entry) => entry.id === 'book-10').amount).toBe(175000);
    expect(ledger.find((entry) => entry.id === 'book-11').amount).toBe(400000);
    expect(ledger.find((entry) => entry.id === 'dp-12').amount).toBe(75000);
    expect(ledger[0].balance).toBe(600000);
  });

  it('filters by period and search query', () => {
    const entries = [
      { id: 1, date: '2026-05-19', type: 'income', category: 'Sewa Studio', amount: 100000, description: 'Sewa Alpha' },
      { id: 2, date: '2026-04-10', type: 'expense', category: 'Perawatan', amount: 50000, description: 'Servis ampli' }
    ];

    const filtered = filterLedgerByPeriod(entries, 'month', 'alpha', new Date('2026-05-20T12:00:00+07:00'));

    expect(filtered).toEqual([entries[0]]);
  });

  it('groups chart data for income and expense summaries', () => {
    const entries = [
      { id: 1, date: '2026-05-19', type: 'income', category: 'Sewa Studio', amount: 100000, description: 'Sewa Alpha' },
      { id: 2, date: '2026-05-19', type: 'expense', category: 'Perawatan', amount: 50000, description: 'Servis ampli' },
      { id: 3, date: '2026-05-20', type: 'expense', category: 'Perawatan', amount: 25000, description: 'Beli senar' }
    ];

    expect(buildFinanceLineChartData(entries, 'month')).toMatchObject([
      { Pemasukan: 100000, Pengeluaran: 50000 },
      { Pemasukan: 0, Pengeluaran: 25000 }
    ]);
    expect(buildExpensePieData(entries)).toEqual([
      { name: 'Perawatan', value: 75000 }
    ]);
  });
});
