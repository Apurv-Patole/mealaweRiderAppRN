/**
 * Meal slots and their time windows (pure, no React Native imports).
 * The server (`/api/slot-config/me`) sends the windows for the rider's city;
 * `DEFAULT_SLOT_CONFIG` mirrors the server's own defaults for when that call fails.
 * Times are the phone's local time, the same as the Ionic rider app.
 */
export type MealSlot = 'Breakfast' | 'Lunch' | 'Dinner';
export const MEAL_SLOTS: readonly MealSlot[] = ['Breakfast', 'Lunch', 'Dinner'];

export interface SlotWindow {
  meal: MealSlot;
  /** "HH:mm", 24 hour. */
  startTime: string;
  endTime: string;
  /** Fractional hours (10:30 is 10.5), so half-hour boundaries compare exactly. */
  startHour: number;
  endHour: number;
  /** Logging in before this time earns the early-login bonus. */
  earlyLoginCutoff: string | null;
  /** For example "8:00 AM - 10:00 AM". */
  label: string;
}

interface RawWindow {
  startTime: string;
  endTime: string;
  earlyLoginCutoff?: string;
}

export const DEFAULT_SLOT_CONFIG: Record<'breakfast' | 'lunch' | 'dinner', RawWindow> = {
  breakfast: { startTime: '08:00', endTime: '10:00', earlyLoginCutoff: '08:30' },
  lunch: { startTime: '10:31', endTime: '14:30', earlyLoginCutoff: '10:20' },
  dinner: { startTime: '17:30', endTime: '22:30', earlyLoginCutoff: '17:20' },
};

const HHMM = /^([01]?\d|2[0-3]):([0-5]\d)$/;

/** "10:30" to 10.5, or null when it is not a valid 24-hour time. */
export function parseHHmm(text: unknown): number | null {
  if (typeof text !== 'string') return null;
  const match = HHMM.exec(text.trim());
  if (!match) return null;
  return Number(match[1]) + Number(match[2]) / 60;
}

/** "14:05" to "2:05 PM". */
export function formatTime12(text: string): string {
  const [hours = 0, minutes = 0] = text.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function toWindow(meal: MealSlot, raw: unknown): SlotWindow | null {
  if (!raw || typeof raw !== 'object') return null;
  const { startTime, endTime, earlyLoginCutoff } = raw as Partial<RawWindow>;
  const startHour = parseHHmm(startTime);
  const endHour = parseHHmm(endTime);
  if (startHour === null || endHour === null || endHour <= startHour) return null;
  return {
    meal,
    startTime: String(startTime),
    endTime: String(endTime),
    startHour,
    endHour,
    earlyLoginCutoff: parseHHmm(earlyLoginCutoff) === null ? null : String(earlyLoginCutoff),
    label: `${formatTime12(String(startTime))} - ${formatTime12(String(endTime))}`,
  };
}

/**
 * Builds the three slot windows from the server's config. If any window is missing or
 * malformed the whole config is ignored in favour of the defaults, so the app never
 * runs with half a timetable.
 */
export function buildSlots(raw: unknown): SlotWindow[] {
  const config = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const parsed = [
    toWindow('Breakfast', config.breakfast),
    toWindow('Lunch', config.lunch),
    toWindow('Dinner', config.dinner),
  ];
  if (parsed.every((window): window is SlotWindow => window !== null)) return parsed;
  return MEAL_SLOTS.map((meal) => {
    const key = meal.toLowerCase() as keyof typeof DEFAULT_SLOT_CONFIG;
    return toWindow(meal, DEFAULT_SLOT_CONFIG[key]) as SlotWindow;
  });
}

/** Fractional hour of day for a Date, in the phone's local time. */
export function hourOf(date: Date): number {
  return date.getHours() + date.getMinutes() / 60;
}

/** The slot whose window contains `now`, or null between slots. Windows are start-inclusive, end-exclusive. */
export function activeSlot(slots: readonly SlotWindow[], now: Date): SlotWindow | null {
  const hour = hourOf(now);
  return slots.find((slot) => hour >= slot.startHour && hour < slot.endHour) ?? null;
}

/** The slot whose midpoint is closest to `now`; used to filter orders when no window is open. */
export function nearestSlot(slots: readonly SlotWindow[], now: Date): SlotWindow {
  const hour = hourOf(now);
  const middle = (slot: SlotWindow) => (slot.startHour + slot.endHour) / 2;
  const [first, ...rest] = slots;
  if (!first) throw new Error('No meal slots configured');
  return rest.reduce((best, slot) => (Math.abs(hour - middle(slot)) < Math.abs(hour - middle(best)) ? slot : best), first);
}

/** The next slot that opens later today, or null when none is left. */
export function nextSlotOpening(slots: readonly SlotWindow[], now: Date): SlotWindow | null {
  const hour = hourOf(now);
  return slots.find((slot) => slot.startHour > hour) ?? null;
}

/** The slot to mark attendance for: the open one, or the nearest when none is open. */
export function attendanceSlot(slots: readonly SlotWindow[], now: Date): SlotWindow {
  return activeSlot(slots, now) ?? nearestSlot(slots, now);
}

export type SlotState = 'ongoing' | 'completed' | 'upcoming' | 'missed';

export interface SlotRow {
  slot: SlotWindow;
  state: SlotState;
}

export type ShiftStatusValue = 'online' | 'offline' | 'completed';

/**
 * State of each slot today, for the timetable on the Route tab. A slot the rider worked
 * is `ongoing` while the shift is online and `completed` after it ends. A slot with no
 * shift is `ongoing` while its window is open (attendance can still be marked),
 * `upcoming` before it, and `missed` after it (a missed slot stays missed).
 */
export function slotStates(
  slots: readonly SlotWindow[],
  now: Date,
  shiftStatusByMeal: Partial<Record<MealSlot, ShiftStatusValue>>,
): SlotRow[] {
  const hour = hourOf(now);
  return slots.map((slot) => {
    const worked = shiftStatusByMeal[slot.meal];
    if (worked) return { slot, state: worked === 'online' ? 'ongoing' : 'completed' };
    if (hour >= slot.startHour && hour < slot.endHour) return { slot, state: 'ongoing' };
    return { slot, state: hour < slot.startHour ? 'upcoming' : 'missed' };
  });
}
