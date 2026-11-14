/** Parses the data payloads the server sends to riders (pure, no React Native imports). */
export type PushEvent =
  | { type: 'ATTENDANCE_REMINDER'; mealSlot: string }
  | { type: 'ORDER_ASSIGNED' }
  | { type: 'ORDER_READY' }
  | { type: 'CANCEL_UPDATE'; decision: string; orderNo: string }
  // The next two are planned server additions (plan section 10, items 8) so a rider
  // learns of customer cancellations and admin edits right away.
  | { type: 'ORDER_CANCELLED_BY_USER'; orderNo: string }
  | { type: 'ORDER_UPDATED'; orderNo: string };

export type PushEventType = PushEvent['type'];

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Turns an FCM `data` object into a typed event, or null when it is not a rider
 * event (missing, malformed, or a type this app version does not know).
 */
export function parsePushData(data: unknown): PushEvent | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;

  switch (record.type) {
    case 'ATTENDANCE_REMINDER':
      return { type: 'ATTENDANCE_REMINDER', mealSlot: text(record.mealSlot) };
    case 'ORDER_ASSIGNED':
      return { type: 'ORDER_ASSIGNED' };
    case 'ORDER_READY':
      return { type: 'ORDER_READY' };
    case 'CANCEL_UPDATE':
      return { type: 'CANCEL_UPDATE', decision: text(record.decision), orderNo: text(record.orderNo) };
    case 'ORDER_CANCELLED_BY_USER':
      return { type: 'ORDER_CANCELLED_BY_USER', orderNo: text(record.orderNo) };
    case 'ORDER_UPDATED':
      return { type: 'ORDER_UPDATED', orderNo: text(record.orderNo) };
    default:
      return null;
  }
}
