import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  breakdownRows,
  canViewNextMonth,
  formatDuration,
  formatShortDate,
  formatSignedRupees,
  holdingNote,
  incentiveForShift,
  isDeduction,
  isSalaryPayout,
  ledgerKind,
  ledgerTitle,
  monthKey,
  monthLabel,
  normalizeIncentives,
  normalizeLedger,
  normalizeSalary,
  shiftMonth,
  signedAmount,
} from '../walletModel.ts';

function entry(overrides: Record<string, unknown> = {}) {
  return { _id: 'e1', type: 'credit', amount: 120, source: 'incentive', sourceId: 'shift1', description: '', balanceAfter: 500, createdAt: '2026-10-21T10:00:00.000Z', ...overrides };
}

describe('normalizeLedger', () => {
  it('maps entries and drops ones with an unknown type', () => {
    const entries = normalizeLedger([entry(), entry({ _id: 'e2', type: 'weird' }), null, 'x']);
    assert.equal(entries.length, 1);
    assert.deepEqual(entries[0], {
      id: 'e1', type: 'credit', amount: 120, source: 'incentive', sourceId: 'shift1',
      description: '', balanceAfter: 500, createdAt: '2026-10-21T10:00:00.000Z', releasesAt: null,
    });
  });

  it('keeps the release date of pending entries and tolerates missing fields', () => {
    const [pending] = normalizeLedger([entry({ type: 'pending', releasesAt: '2026-10-28T00:00:00.000Z' })]);
    assert.equal(pending?.releasesAt, '2026-10-28T00:00:00.000Z');
    const [bare] = normalizeLedger([{ type: 'credit', amount: '75' }]);
    assert.equal(bare?.amount, 75);
    assert.ok(bare && bare.id.length > 0);
  });

  it('is empty for anything that is not a list', () => {
    assert.deepEqual(normalizeLedger(undefined), []);
    assert.deepEqual(normalizeLedger({}), []);
  });
});

describe('ledger classification', () => {
  const [credit] = normalizeLedger([entry()]);
  const [salary] = normalizeLedger([entry({ type: 'debit', source: 'manual', sourceId: 'salary-2026-09' })]);
  const [fine] = normalizeLedger([entry({ type: 'debit', source: 'manual', sourceId: 'manual-1', description: 'Damage charge' })]);
  const [held] = normalizeLedger([entry({ type: 'pending' })]);
  const [manualCredit] = normalizeLedger([entry({ source: 'manual', sourceId: 'bonus' })]);

  it('tells salary payouts from deductions (both are manual debits)', () => {
    assert.equal(isSalaryPayout(salary!), true);
    assert.equal(isDeduction(salary!), false);
    assert.equal(isDeduction(fine!), true);
    assert.equal(isSalaryPayout(fine!), false);
    assert.equal(isDeduction(credit!), false);
  });

  it('names each kind', () => {
    assert.equal(ledgerKind(credit!), 'incentive');
    assert.equal(ledgerKind(held!), 'pending');
    assert.equal(ledgerKind(salary!), 'salary');
    assert.equal(ledgerKind(fine!), 'deduction');
    assert.equal(ledgerKind(manualCredit!), 'credit');
  });

  it('uses the description when there is one, else a title for the kind', () => {
    assert.equal(ledgerTitle(fine!), 'Damage charge');
    assert.equal(ledgerTitle(credit!), 'Incentive credited');
    assert.equal(ledgerTitle(held!), 'Incentive on hold');
    assert.equal(ledgerTitle(salary!), 'Salary paid out');
  });

  it('signs debits negative and credits and holds positive', () => {
    assert.equal(signedAmount({ type: 'debit', amount: 50 }), -50);
    assert.equal(signedAmount({ type: 'debit', amount: -50 }), -50);
    assert.equal(signedAmount({ type: 'credit', amount: 120 }), 120);
    assert.equal(signedAmount({ type: 'pending', amount: 80 }), 80);
  });
});

describe('formatSignedRupees', () => {
  it('shows a sign, whole rupees and Indian grouping', () => {
    assert.equal(formatSignedRupees(120), '+₹120');
    assert.equal(formatSignedRupees(-50), '-₹50');
    assert.equal(formatSignedRupees(125000), '+₹1,25,000');
    assert.equal(formatSignedRupees(0), '₹0');
    assert.equal(formatSignedRupees(0.2), '₹0');
  });
});

describe('normalizeSalary', () => {
  it('maps a salary record', () => {
    assert.deepEqual(
      normalizeSalary({ month: '2026-10', baseSalary: 12000, totalIncentiveEarned: 1500, totalDeductions: 200, totalAmount: 13300, status: 'paid', paidAt: '2026-11-01T00:00:00.000Z', notes: 'ok' }),
      { month: '2026-10', baseSalary: 12000, totalIncentiveEarned: 1500, totalDeductions: 200, totalAmount: 13300, status: 'paid', paidAt: '2026-11-01T00:00:00.000Z', notes: 'ok' },
    );
  });

  it('is null for no record (the server sends null) or a record without a month', () => {
    assert.equal(normalizeSalary(null), null);
    assert.equal(normalizeSalary({}), null);
    assert.equal(normalizeSalary('x'), null);
  });

  it('treats an odd status as pending and bad numbers as 0', () => {
    const salary = normalizeSalary({ month: '2026-10', status: 'weird', baseSalary: 'lots' });
    assert.equal(salary?.status, 'pending');
    assert.equal(salary?.baseSalary, 0);
  });
});

describe('months', () => {
  const NOW = new Date(2026, 9, 21);

  it('builds the key for a date', () => {
    assert.equal(monthKey(NOW), '2026-10');
    assert.equal(monthKey(new Date(2026, 0, 5)), '2026-01');
  });

  it('moves between months across year ends', () => {
    assert.equal(shiftMonth('2026-10', -1), '2026-09');
    assert.equal(shiftMonth('2026-01', -1), '2025-12');
    assert.equal(shiftMonth('2026-12', 1), '2027-01');
  });

  it('does not allow viewing a future month', () => {
    assert.equal(canViewNextMonth('2026-09', NOW), true);
    assert.equal(canViewNextMonth('2026-10', NOW), false);
  });

  it('labels a month in words', () => {
    assert.equal(monthLabel('2026-10'), 'October 2026');
    assert.equal(monthLabel('2025-01'), 'January 2025');
  });
});

describe('incentives', () => {
  const raw = {
    _id: 'i1', shiftId: 's1', date: '2026-10-21', mealSlot: 'lunch', totalIncentiveAmount: 90, status: 'holding',
    creditDueAt: '2026-10-28T00:00:00.000Z',
    breakdown: {
      ordersDelivered: { count: 6, earned: 40 },
      kmTraveled: { km: 12.34, earned: 20 },
      attendanceStreak: { days: 1, earned: 10 },
      onTimeDelivery: { percentage: 91.6, earned: 20 },
      earlyLogin: { loginTime: '10:05', cutoffTime: '10:20', earned: 0 },
    },
  };

  it('maps a record with a capitalised slot', () => {
    const [record] = normalizeIncentives([raw]);
    assert.equal(record?.mealSlot, 'Lunch');
    assert.equal(record?.total, 90);
    assert.equal(record?.status, 'holding');
    assert.equal(record?.shiftId, 's1');
  });

  it('accepts a single record as well as a list, and drops ones without a shift', () => {
    assert.equal(normalizeIncentives(raw).length, 1);
    assert.deepEqual(normalizeIncentives([{}, null]), []);
    assert.deepEqual(normalizeIncentives(undefined), []);
  });

  it('describes each part of the breakdown', () => {
    const rows = breakdownRows(raw.breakdown);
    assert.deepEqual(rows.map((row) => [row.key, row.earned, row.detail]), [
      ['ordersDelivered', 40, '6 orders'],
      ['kmTraveled', 20, '12.3 km'],
      ['attendanceStreak', 10, '1 day'],
      ['onTimeDelivery', 20, '92% on time'],
      ['earlyLogin', 0, 'Logged in 10:05, cutoff 10:20'],
    ]);
  });

  it('copes with a missing breakdown', () => {
    const rows = breakdownRows(undefined);
    assert.equal(rows.length, 5);
    assert.ok(rows.every((row) => row.earned === 0));
  });

  it('finds the record for a shift, or null while it is still being calculated', () => {
    const records = normalizeIncentives([raw]);
    assert.equal(incentiveForShift(records, 's1')?.id, 'i1');
    assert.equal(incentiveForShift(records, 'other'), null);
  });
});

describe('formatDuration', () => {
  it('reads naturally', () => {
    assert.equal(formatDuration(30_000), 'under a minute');
    assert.equal(formatDuration(42 * 60_000), '42 min');
    assert.equal(formatDuration(3 * 3_600_000), '3 h');
    assert.equal(formatDuration(3 * 3_600_000 + 5 * 60_000), '3 h 5 min');
    assert.equal(formatDuration(Number.NaN), 'under a minute');
    assert.equal(formatDuration(-5), 'under a minute');
  });
});

describe('formatShortDate / holdingNote', () => {
  it('formats ISO timestamps and plain dates', () => {
    assert.equal(formatShortDate('2026-10-28'), '28 Oct');
    assert.equal(formatShortDate(new Date(2026, 10, 3, 12).toISOString()), '3 Nov');
    assert.equal(formatShortDate(''), '');
    assert.equal(formatShortDate('nope'), '');
  });

  it('explains when a held incentive arrives', () => {
    assert.equal(holdingNote({ status: 'holding', creditDueAt: '2026-10-28', creditedAt: null }), 'On hold, credits on 28 Oct');
    assert.equal(holdingNote({ status: 'holding', creditDueAt: null, creditedAt: null }), 'On hold for 7 days before it reaches your wallet');
    assert.equal(holdingNote({ status: 'credited', creditDueAt: null, creditedAt: '2026-10-29' }), 'Credited on 29 Oct');
    assert.equal(holdingNote({ status: 'credited', creditDueAt: null, creditedAt: null }), 'Credited to your wallet');
  });
});
