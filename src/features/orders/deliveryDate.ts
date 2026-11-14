/** Delivery-date choices for the Orders tab and the day range sent to the server (pure, local time). */
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export interface DeliveryDateOption {
  /** Days from today: 0 is today. Past days are never offered. */
  offset: number;
  label: string;
  date: Date;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Today and the next `count - 1` days, labelled "Today", "Tomorrow", then "Thu 23 Oct". */
export function deliveryDateOptions(now: Date, count = 4): DeliveryDateOption[] {
  return Array.from({ length: count }, (_, offset) => {
    const date = addDays(now, offset);
    const label =
      offset === 0
        ? 'Today'
        : offset === 1
          ? 'Tomorrow'
          : `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
    return { offset, label, date };
  });
}

/** Start and end of the local day as ISO strings, for the orders search. */
export function dayRange(date: Date): { fromDate: string; toDate: string } {
  const from = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const to = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return { fromDate: from.toISOString(), toDate: to.toISOString() };
}
