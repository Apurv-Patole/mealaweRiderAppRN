import type { SlotWindow } from '@/features/shift/slots';

import { slotPhase } from '../slotPhase';

/** The meal whose window is running right now on the selected day, or null (pure, local time). */
export function activeMealName(slots: readonly SlotWindow[], now: Date, dateOffset: number): string | null {
  const running = slots.find((slot) => slotPhase(slot, now, dateOffset) === 'ongoing');
  return running ? running.meal : null;
}

/** The line under the rider's name: the running meal shift, else whether a shift is on. */
export function shiftStatusLine(online: boolean, activeMeal: string | null): string {
  if (activeMeal) return `${activeMeal} shift is active`;
  return online ? 'On shift' : 'Off shift';
}
