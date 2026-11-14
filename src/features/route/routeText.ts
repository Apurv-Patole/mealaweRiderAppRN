/** Small pure text helpers for the Route tab's stop list (no React Native imports, so they are unit tested). */

/** "5 to collect • 5 to deliver • about 21.9 km", leaving out any part that is zero or unknown. */
export function routeSummaryText(toCollect: number, toDeliver: number, totalKm: string | null): string {
  return [
    toCollect > 0 ? `${toCollect} to collect` : null,
    toDeliver > 0 ? `${toDeliver} to deliver` : null,
    totalKm ? `about ${totalKm}` : null,
  ]
    .filter((part): part is string => part !== null)
    .join(' • ');
}

/** "Pick up • 2 orders • 1.7 km": what the stop is, how many orders, and how far (when known). */
export function stopSubtitle(kind: 'kitchen' | 'customer', orderCount: number, distance: string | null): string {
  return [kind === 'kitchen' ? 'Pick up' : 'Deliver', `${orderCount} ${orderCount === 1 ? 'order' : 'orders'}`, distance]
    .filter((part): part is string => part !== null)
    .join(' • ');
}
