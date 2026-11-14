import type { RouteStop } from '@/features/route/routePlanner';

/** The stop to head to after a delivery: the first stop of the re-planned route, or null when nothing is left. */
export function nextStopOf(stops: readonly RouteStop[]): RouteStop | null {
  return stops[0] ?? null;
}

/** "Deliver · 1 order · 5.3 km" (the distance is left out when it is not known). */
export function nextStopLine(stop: Pick<RouteStop, 'type' | 'orders' | 'distanceFromRiderKm'>): string {
  const count = stop.orders.length;
  const km = stop.distanceFromRiderKm;
  return [
    stop.type === 'kitchen' ? 'Pick up' : 'Deliver',
    `${count} ${count === 1 ? 'order' : 'orders'}`,
    km !== null ? `${km.toFixed(1)} km` : null,
  ]
    .filter((part): part is string => part !== null)
    .join(' · ');
}

/** The ISO time to show on the "Delivered" step: the moment the rider confirmed, from the route parameter. */
export function deliveredAtIso(param: string | undefined): string | null {
  const ms = Number(param);
  if (!param || !Number.isFinite(ms) || ms <= 0) return null;
  return new Date(ms).toISOString();
}

/** The route parameter for "delivered just now". Lives here (not in the screen) so the clock read is not in render code. */
export function deliveredNowParam(): string {
  return String(Date.now());
}
