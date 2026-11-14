import { normalizeOrders, type RiderOrder } from '@/features/orders/orderModel';
import { normalizeShift, type RiderShift } from '@/features/shift/shiftModel';
import { ENDPOINTS, http } from '@/services/http';

import {
  normalizeIncentives,
  normalizeLedger,
  normalizeSalary,
  type IncentiveRecord,
  type LedgerEntry,
  type SalaryRecord,
} from './walletModel';

/** The ledger is read this many entries at a time. */
export const LEDGER_PAGE_SIZE = 20;

/** The wallet balance in rupees. The server answers `{ balance: 0 }` for a rider with no wallet yet. */
export async function fetchBalance(): Promise<number> {
  const raw = await http.get<{ balance?: unknown }>(ENDPOINTS.wallet.balance);
  const balance = Number(raw?.balance);
  return Number.isFinite(balance) ? balance : 0;
}

/** One page of wallet entries, newest first. A page shorter than `LEDGER_PAGE_SIZE` is the last one. */
export async function fetchLedger(page: number): Promise<LedgerEntry[]> {
  return normalizeLedger(await http.get<unknown>(`${ENDPOINTS.wallet.ledger}?page=${page}&limit=${LEDGER_PAGE_SIZE}`));
}

/** The salary record for a "YYYY-MM" month, or null when none exists yet. */
export async function fetchSalary(month: string): Promise<SalaryRecord | null> {
  return normalizeSalary(await http.get<unknown>(`${ENDPOINTS.wallet.salary}/${encodeURIComponent(month)}`));
}

/** The rider's incentive records, most recent first (empty until a shift has ended and been calculated). */
export async function fetchIncentives(): Promise<IncentiveRecord[]> {
  return normalizeIncentives(await http.get<unknown>(ENDPOINTS.wallet.incentives));
}

/** The rider's recent shifts (attendance history), newest first. */
export async function fetchShiftHistory(riderId: string, limit = 30): Promise<RiderShift[]> {
  const raw = await http.get<unknown>(`${ENDPOINTS.history.shifts}/${encodeURIComponent(riderId)}?limit=${limit}`);
  return Array.isArray(raw) ? raw.map(normalizeShift).filter((shift): shift is RiderShift => shift !== null) : [];
}

/** The rider's recent orders (order history). The server decides how far back it goes. */
export async function fetchOrderHistory(riderId: string): Promise<RiderOrder[]> {
  return normalizeOrders(await http.get<unknown>(`${ENDPOINTS.history.orders}/${encodeURIComponent(riderId)}`));
}
