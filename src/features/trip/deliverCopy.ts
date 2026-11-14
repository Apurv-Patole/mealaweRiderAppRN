import type { RiderOrder } from '@/features/orders/orderModel';

type CustomerPlace = Pick<RiderOrder['customer'], 'address' | 'landmark'>;

/** The first part of an address, up to its first comma: "9, Balewadi Phata Road" stays whole, but long lines are cut. */
const MAX_PLACE_LENGTH = 24;

/** A short place name for the photo chip: the landmark if there is one, else the start of the address. */
export function shortPlace(customer: CustomerPlace): string {
  const source = (customer.landmark || customer.address || '').trim();
  if (source.length <= MAX_PLACE_LENGTH) return source;
  const cut = source.slice(0, MAX_PLACE_LENGTH);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 8 ? cut.slice(0, lastSpace) : cut).replace(/[,\s]+$/, '')}…`;
}

/** The photo chip: "2:58 PM · Balewadi Phata", or just the time when the place is unknown. */
export function photoCaption(clock: string, customer: CustomerPlace): string {
  const place = shortPlace(customer);
  return place ? `${clock} · ${place}` : clock;
}

/** The summary line under the customer's name: "Order #DM1004 · 9, Balewadi Phata Road". */
export function deliverySummaryLine(orderNo: string, address: string): string {
  const where = address.trim();
  return where ? `Order #${orderNo} · ${where}` : `Order #${orderNo}`;
}
