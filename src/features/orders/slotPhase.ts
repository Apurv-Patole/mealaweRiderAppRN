import { hourOf, type SlotWindow } from '@/features/shift/slots';

export type SlotPhase = 'ongoing' | 'upcoming' | 'completed';

/**
 * Where a meal slot is on the selected delivery day: a future day is all upcoming; today a slot is
 * upcoming before its window, ongoing during it, and completed after it (pure, local time).
 */
export function slotPhase(slot: SlotWindow, now: Date, dateOffset: number): SlotPhase {
  if (dateOffset > 0) return 'upcoming';
  const hour = hourOf(now);
  if (hour >= slot.endHour) return 'completed';
  if (hour >= slot.startHour) return 'ongoing';
  return 'upcoming';
}

export const PHASE_LABEL: Record<SlotPhase, string> = {
  ongoing: 'Active',
  upcoming: 'Upcoming',
  completed: 'Completed',
};
