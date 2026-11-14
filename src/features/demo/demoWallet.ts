import { monthKey, shiftMonth } from '@/features/wallet/walletModel';

import { DEMO_RIDER_ID } from './demoSession';
import type { DemoShift } from './demoState';

/** Seeded wallet, salary, incentive and attendance history for the demo rider. */

export const DEMO_BALANCE = 1240;

const DAY_MS = 86_400_000;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

function ymd(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function demoLedger(): Record<string, unknown>[] {
  return [
    { _id: 'demo-l1', type: 'credit', amount: 285, source: 'incentive', sourceId: 'demo-past-1', description: 'Dinner shift incentive', balanceAfter: 1240, createdAt: daysAgo(1).toISOString() },
    { _id: 'demo-l2', type: 'debit', amount: 50, source: 'manual', sourceId: 'fine-1', description: 'Late check-in deduction', balanceAfter: 955, createdAt: daysAgo(3).toISOString() },
    { _id: 'demo-l3', type: 'credit', amount: 310, source: 'incentive', sourceId: 'demo-past-2', description: 'Lunch shift incentive', balanceAfter: 1005, createdAt: daysAgo(4).toISOString() },
    { _id: 'demo-l4', type: 'credit', amount: 240, source: 'incentive', sourceId: 'demo-past-3', description: 'Dinner shift incentive', balanceAfter: 695, createdAt: daysAgo(6).toISOString() },
    { _id: 'demo-l5', type: 'debit', amount: 6500, source: 'manual', sourceId: 'salary-prev', description: 'Salary paid out', balanceAfter: 455, createdAt: daysAgo(12).toISOString() },
  ];
}

function incentiveRow(index: number, count: number, km: number, total: number): Record<string, unknown> {
  const date = daysAgo(index + 1);
  return {
    _id: `demo-inc-past-${index}`,
    shiftId: `demo-past-${index}`,
    date: ymd(date),
    mealSlot: index % 2 === 0 ? 'dinner' : 'lunch',
    totalIncentiveAmount: total,
    status: 'credited',
    creditedAt: new Date(date.getTime() + 7 * DAY_MS).toISOString(),
    breakdown: {
      ordersDelivered: { count, earned: count * 15 },
      kmTraveled: { km, earned: Math.round(km * 4) },
      attendanceStreak: { days: 4 - index, earned: 20 },
      onTimeDelivery: { percentage: 100, earned: 30 },
      earlyLogin: { loginTime: '17:12', cutoffTime: '17:20', earned: 10 },
    },
  };
}

export function demoPastIncentives(): Record<string, unknown>[] {
  return [incentiveRow(1, 6, 18.4, 285), incentiveRow(2, 7, 21.2, 310), incentiveRow(3, 5, 15.1, 240)];
}

export function demoSalary(month: string, now: Date): Record<string, unknown> | null {
  const current = monthKey(now);
  if (month === current) {
    return { month, baseSalary: 8000, totalIncentiveEarned: 835, totalDeductions: 50, totalAmount: 8785, status: 'pending', paidAt: null, notes: 'Demo salary, not final until month end.' };
  }
  if (month === shiftMonth(current, -1)) {
    return { month, baseSalary: 8000, totalIncentiveEarned: 2140, totalDeductions: 150, totalAmount: 9990, status: 'paid', paidAt: daysAgo(12).toISOString(), notes: '' };
  }
  return null;
}

export function demoPastShifts(): DemoShift[] {
  return [1, 2, 3].map((index) => {
    const date = daysAgo(index);
    return {
      _id: `demo-past-${index}`,
      riderId: DEMO_RIDER_ID,
      date: ymd(date),
      mealSlot: index % 2 === 0 ? 'Lunch' : 'Dinner',
      routeNo: 'DEMO-1',
      status: 'completed' as const,
      stage: 'completed' as const,
      startedAt: new Date(date.getTime() - 3 * 3_600_000).toISOString(),
      endedAt: date.toISOString(),
      totalActualKm: 12 + index * 3.1,
    };
  });
}
