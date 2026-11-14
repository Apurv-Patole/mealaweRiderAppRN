/** Wallet, salary and incentive models and helpers (pure, no React Native imports). */

function text(value: unknown): string {
  return typeof value === 'string' ? value : value === null || value === undefined ? '' : String(value);
}

function num(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function isoOrNull(value: unknown): string | null {
  return typeof value === 'string' && value && !Number.isNaN(new Date(value).getTime()) ? value : null;
}

// ── Ledger ──────────────────────────────────────────────────────

export type LedgerType = 'pending' | 'credit' | 'debit';
export type LedgerKind = 'incentive' | 'pending' | 'salary' | 'deduction' | 'credit' | 'debit';

export interface LedgerEntry {
  id: string;
  type: LedgerType;
  amount: number;
  source: 'incentive' | 'manual';
  sourceId: string;
  description: string;
  balanceAfter: number;
  createdAt: string;
  /** For pending entries: when the held amount reaches the wallet. */
  releasesAt: string | null;
}

export function normalizeLedger(raw: unknown): LedgerEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const entry = record(item);
    const type = entry.type;
    if (type !== 'pending' && type !== 'credit' && type !== 'debit') return [];
    return [
      {
        id: text(entry._id ?? entry.id) || `${text(entry.createdAt)}-${text(entry.sourceId)}-${num(entry.amount)}`,
        type,
        amount: num(entry.amount),
        source: entry.source === 'manual' ? 'manual' : 'incentive',
        sourceId: text(entry.sourceId),
        description: text(entry.description),
        balanceAfter: num(entry.balanceAfter),
        createdAt: text(entry.createdAt),
        releasesAt: isoOrNull(entry.releasesAt),
      } satisfies LedgerEntry,
    ];
  });
}

/** A debit that pays the monthly salary out of the wallet. */
export function isSalaryPayout(entry: Pick<LedgerEntry, 'type' | 'source' | 'sourceId'>): boolean {
  return entry.type === 'debit' && entry.sourceId.startsWith('salary-');
}

/** A manual debit by admin that is not a salary payout (for example a fine or a damage charge). */
export function isDeduction(entry: Pick<LedgerEntry, 'type' | 'source' | 'sourceId'>): boolean {
  return entry.source === 'manual' && entry.type === 'debit' && !entry.sourceId.startsWith('salary-');
}

export function ledgerKind(entry: LedgerEntry): LedgerKind {
  if (isSalaryPayout(entry)) return 'salary';
  if (isDeduction(entry)) return 'deduction';
  if (entry.type === 'pending') return 'pending';
  if (entry.type === 'credit') return entry.source === 'incentive' ? 'incentive' : 'credit';
  return 'debit';
}

const KIND_TITLE: Record<LedgerKind, string> = {
  incentive: 'Incentive credited',
  pending: 'Incentive on hold',
  salary: 'Salary paid out',
  deduction: 'Deduction',
  credit: 'Credit',
  debit: 'Debit',
};

/** The entry's own description, or a plain title for its kind. */
export function ledgerTitle(entry: LedgerEntry): string {
  return entry.description.trim() || KIND_TITLE[ledgerKind(entry)];
}

/** Positive for money in (and money on hold), negative for money out. */
export function signedAmount(entry: Pick<LedgerEntry, 'type' | 'amount'>): number {
  return entry.type === 'debit' ? -Math.abs(entry.amount) : Math.abs(entry.amount);
}

/** "+₹120", "-₹50", "₹0". */
export function formatSignedRupees(amount: number): string {
  const whole = Math.round(Math.abs(amount)).toLocaleString('en-IN');
  if (Math.round(amount) === 0) return '₹0';
  return `${amount > 0 ? '+' : '-'}₹${whole}`;
}

// ── Monthly salary ──────────────────────────────────────────────

export interface SalaryRecord {
  month: string;
  baseSalary: number;
  totalIncentiveEarned: number;
  totalDeductions: number;
  totalAmount: number;
  status: 'pending' | 'paid';
  paidAt: string | null;
  notes: string;
}

/** The server answers `null` when no salary record exists for the month yet. */
export function normalizeSalary(raw: unknown): SalaryRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const salary = record(raw);
  const month = text(salary.month);
  if (!month) return null;
  return {
    month,
    baseSalary: num(salary.baseSalary),
    totalIncentiveEarned: num(salary.totalIncentiveEarned),
    totalDeductions: num(salary.totalDeductions),
    totalAmount: num(salary.totalAmount),
    status: salary.status === 'paid' ? 'paid' : 'pending',
    paidAt: isoOrNull(salary.paidAt),
    notes: text(salary.notes),
  };
}

// ── Months ──────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

/** "2026-10" for a date, in the phone's local time. */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** The month `delta` months from `key` ("2026-01" with -1 is "2025-12"). */
export function shiftMonth(key: string, delta: number): string {
  const [year = 1970, month = 1] = key.split('-').map(Number);
  return monthKey(new Date(year, month - 1 + delta, 1));
}

/** Months in the future have no salary yet, so the arrow stops at the current month. */
export function canViewNextMonth(key: string, now: Date): boolean {
  return shiftMonth(key, 1) <= monthKey(now);
}

/** "October 2026". */
export function monthLabel(key: string): string {
  const [year = 1970, month = 1] = key.split('-').map(Number);
  return `${MONTH_NAMES[month - 1] ?? ''} ${year}`;
}

// ── Incentives ──────────────────────────────────────────────────

export interface BreakdownRow {
  key: 'ordersDelivered' | 'kmTraveled' | 'attendanceStreak' | 'onTimeDelivery' | 'earlyLogin';
  label: string;
  earned: number;
  /** What was achieved, for example "6 orders" or "12.3 km". Empty when there is nothing to say. */
  detail: string;
}

export interface IncentiveRecord {
  id: string;
  shiftId: string;
  /** YYYY-MM-DD */
  date: string;
  /** Breakfast, Lunch or Dinner. */
  mealSlot: string;
  total: number;
  status: 'holding' | 'credited';
  /** When a held incentive reaches the wallet. */
  creditDueAt: string | null;
  creditedAt: string | null;
  rows: BreakdownRow[];
}

function capitalise(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

export function breakdownRows(breakdown: unknown): BreakdownRow[] {
  const bd = record(breakdown);
  const orders = record(bd.ordersDelivered);
  const km = record(bd.kmTraveled);
  const streak = record(bd.attendanceStreak);
  const onTime = record(bd.onTimeDelivery);
  const early = record(bd.earlyLogin);

  const loginTime = text(early.loginTime);
  const cutoffTime = text(early.cutoffTime);

  return [
    { key: 'ordersDelivered', label: 'Orders delivered', earned: num(orders.earned), detail: `${num(orders.count)} ${num(orders.count) === 1 ? 'order' : 'orders'}` },
    { key: 'kmTraveled', label: 'Distance travelled', earned: num(km.earned), detail: `${num(km.km).toFixed(1)} km` },
    { key: 'attendanceStreak', label: 'Attendance streak', earned: num(streak.earned), detail: `${num(streak.days)} ${num(streak.days) === 1 ? 'day' : 'days'}` },
    { key: 'onTimeDelivery', label: 'On-time delivery', earned: num(onTime.earned), detail: `${Math.round(num(onTime.percentage))}% on time` },
    { key: 'earlyLogin', label: 'Early login', earned: num(early.earned), detail: loginTime && cutoffTime ? `Logged in ${loginTime}, cutoff ${cutoffTime}` : '' },
  ];
}

export function normalizeIncentives(raw: unknown): IncentiveRecord[] {
  // The server answers a list, but older responses were a single record.
  const list = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? [raw] : [];
  return list.flatMap((item) => {
    const entry = record(item);
    const shiftId = text(entry.shiftId);
    if (!shiftId) return [];
    return [
      {
        id: text(entry._id ?? entry.id) || shiftId,
        shiftId,
        date: text(entry.date),
        mealSlot: capitalise(text(entry.mealSlot)),
        total: num(entry.totalIncentiveAmount),
        status: entry.status === 'credited' ? 'credited' : 'holding',
        creditDueAt: isoOrNull(entry.creditDueAt),
        creditedAt: isoOrNull(entry.creditedAt),
        rows: breakdownRows(entry.breakdown),
      } satisfies IncentiveRecord,
    ];
  });
}

/** The incentive record for one shift, or null when it has not been calculated yet. */
export function incentiveForShift(records: readonly IncentiveRecord[], shiftId: string): IncentiveRecord | null {
  return records.find((candidate) => candidate.shiftId === shiftId) ?? null;
}

// ── Dates and durations ─────────────────────────────────────────

/** "3 h 5 min", "42 min", "under a minute". */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 60_000) return 'under a minute';
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** "21 Oct" from an ISO timestamp or a YYYY-MM-DD date, or an empty string when it is not a date. */
export function formatShortDate(value: string): string {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}`;
}

/** Text for when a held incentive arrives: "Credited on 28 Oct" or "Credits on 28 Oct". */
export function holdingNote(record: Pick<IncentiveRecord, 'status' | 'creditDueAt' | 'creditedAt'>): string {
  if (record.status === 'credited') {
    const when = formatShortDate(record.creditedAt ?? '');
    return when ? `Credited on ${when}` : 'Credited to your wallet';
  }
  const due = formatShortDate(record.creditDueAt ?? '');
  return due ? `On hold, credits on ${due}` : 'On hold for 7 days before it reaches your wallet';
}
