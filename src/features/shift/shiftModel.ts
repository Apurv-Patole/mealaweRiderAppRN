/** Rider shift model and normalizer (pure, no React Native imports). */
export type ShiftStatus = 'online' | 'offline' | 'completed';
export type ShiftStage = 'pickup_stage' | 'delivery_stage' | 'completed';

export interface RiderShift {
  id: string;
  riderId: string;
  /** YYYY-MM-DD */
  date: string;
  mealSlot: string;
  routeNo: string;
  status: ShiftStatus;
  stage: ShiftStage;
  /** ISO timestamp. */
  startedAt: string;
  endedAt: string | null;
  totalActualKm: number;
  /** The odometer reading entered at the start of the shift, when the shift started with one. */
  startOdometerKm: number | null;
  /** The odometer reading entered when the shift ended. */
  endOdometerKm: number | null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : value === null || value === undefined ? '' : String(value);
}

function statusOf(value: unknown): ShiftStatus {
  return value === 'offline' || value === 'completed' ? value : 'online';
}

/** An odometer reading from the server, or null when missing or not a positive number. */
function odometerKm(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const km = Number(value);
  return Number.isFinite(km) && km > 0 ? km : null;
}

function stageOf(value: unknown): ShiftStage {
  return value === 'delivery_stage' || value === 'completed' ? value : 'pickup_stage';
}

/**
 * Maps the server's `RiderShift` document onto `RiderShift`. The server answers `{}` when
 * there is no active shift, so a payload without an `_id` becomes null.
 */
export function normalizeShift(raw: unknown): RiderShift | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const id = text(record._id ?? record.id);
  if (!id) return null;

  const km = Number(record.totalActualKm);
  return {
    id,
    riderId: text(record.riderId),
    date: text(record.date),
    mealSlot: text(record.mealSlot),
    routeNo: text(record.routeNo),
    status: statusOf(record.status),
    stage: stageOf(record.stage),
    startedAt: text(record.startedAt),
    endedAt: record.endedAt ? text(record.endedAt) : null,
    totalActualKm: Number.isFinite(km) ? km : 0,
    startOdometerKm: odometerKm(record.startOdometerKm),
    endOdometerKm: odometerKm(record.endOdometerKm),
  };
}

export function isShiftOnline(shift: RiderShift | null): shift is RiderShift {
  return shift !== null && shift.status === 'online';
}

export type TodayStatuses = Partial<Record<'Breakfast' | 'Lunch' | 'Dinner', ShiftStatus>>;

/** A new statuses map with one meal slot updated. Unknown meal names leave it unchanged. */
export function withStatus(statuses: TodayStatuses, mealSlot: string, status: ShiftStatus): TodayStatuses {
  if (mealSlot !== 'Breakfast' && mealSlot !== 'Lunch' && mealSlot !== 'Dinner') return statuses;
  return { ...statuses, [mealSlot]: status };
}

/** Meal slot to shift status, for the slot timetable. Unknown meal names are ignored. */
export function statusByMeal(rows: unknown): TodayStatuses {
  const result: TodayStatuses = {};
  if (!Array.isArray(rows)) return result;
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const { mealSlot, status } = row as Record<string, unknown>;
    if (mealSlot === 'Breakfast' || mealSlot === 'Lunch' || mealSlot === 'Dinner') {
      result[mealSlot] = statusOf(status);
    }
  }
  return result;
}
