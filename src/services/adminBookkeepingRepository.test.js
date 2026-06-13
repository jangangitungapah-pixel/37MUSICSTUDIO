import { describe, it, expect } from 'vitest';
import {
  normalizeBookkeepingEntry,
  normalizeBookkeepingAuditLog,
} from './adminBookkeepingRepository.js';

describe('normalizeBookkeepingEntry', () => {
  it('should return null if entry is falsy', () => {
    expect(normalizeBookkeepingEntry(null)).toBeNull();
    expect(normalizeBookkeepingEntry(undefined)).toBeNull();
  });

  it('should normalize partial entry data with default values', () => {
    const raw = {
      amount: 150000,
      description: 'Sewa Studio A',
      type: 'income',
    };
    const result = normalizeBookkeepingEntry(raw);
    expect(result).toBeDefined();
    expect(result.amount).toBe(150000);
    expect(result.description).toBe('Sewa Studio A');
    expect(result.type).toBe('income');
    expect(result.direction).toBe('in');
    expect(result.categoryId).toBe('other');
    expect(result.categoryName).toBe('Lain-lain');
    expect(result.accountId).toBe('cash');
    expect(result.accountName).toBe('Cash');
    expect(result.paymentMethod).toBe('cash');
    expect(result.sourceType).toBe('manual');
    expect(result.id).toMatch(/^bookkeeping-/);
  });

  it('should enforce non-negative amount and fallback to 0', () => {
    const rawNegative = { amount: -50000 };
    const rawInvalid = { amount: 'not-a-number' };

    expect(normalizeBookkeepingEntry(rawNegative).amount).toBe(0);
    expect(normalizeBookkeepingEntry(rawInvalid).amount).toBe(0);
  });

  it('should derive direction automatically from type if direction is invalid or missing', () => {
    const raw1 = { type: 'expense', direction: 'invalid' };
    const raw2 = { type: 'transfer', direction: 'invalid' };
    const raw3 = { type: 'income', direction: 'invalid' };

    expect(normalizeBookkeepingEntry(raw1).direction).toBe('out');
    expect(normalizeBookkeepingEntry(raw2).direction).toBe('neutral');
    expect(normalizeBookkeepingEntry(raw3).direction).toBe('in');
  });
});

describe('normalizeBookkeepingAuditLog', () => {
  it('should return null if action is missing or log is invalid', () => {
    expect(normalizeBookkeepingAuditLog(null)).toBeNull();
    expect(normalizeBookkeepingAuditLog({ id: '123' })).toBeNull(); // missing action
  });

  it('should normalize bookkeeping audit log properly', () => {
    const raw = {
      action: 'bookkeeping.create',
      entryId: 'entry-123',
      entrySnapshot: {
        amount: 200000,
        categoryName: 'Sewa Studio',
        description: 'Manual rent',
        paymentMethod: 'qris',
        type: 'income',
        accountId: 'qris',
      },
    };

    const result = normalizeBookkeepingAuditLog(raw);
    expect(result).toBeDefined();
    expect(result.action).toBe('bookkeeping.create');
    expect(result.entryId).toBe('entry-123');
    expect(result.entrySnapshot.amount).toBe(200000);
    expect(result.entrySnapshot.paymentMethod).toBe('qris');
  });
});
