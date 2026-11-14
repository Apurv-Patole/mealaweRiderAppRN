/** The reasons offered when a rider cannot deliver an order, and how they become one message. */
export const CANCEL_REASONS = [
  'Cannot reach the customer',
  'Address or landmark is wrong',
  'Kitchen has not handed over the order',
  'Problem with my vehicle',
  'Something else',
] as const;

export type CancelReason = (typeof CANCEL_REASONS)[number];

/** The chosen reason, then any note the rider typed: "Customer not reachable: phone is off". */
export function composeCancelReason(reason: string, note: string): string {
  const trimmedNote = note.trim();
  if (!reason) return trimmedNote;
  return trimmedNote ? `${reason}: ${trimmedNote}` : reason;
}

/** A cancel request needs a reason: either a chosen one or some typed text. */
export function canSubmitCancel(reason: string, note: string): boolean {
  return composeCancelReason(reason, note).length > 0;
}
