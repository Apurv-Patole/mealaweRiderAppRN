import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatClock, formatClockFromIso, formatLongDate } from '../dates.ts';

describe('formatLongDate', () => {
  it('names the weekday, day and month', () => {
    assert.equal(formatLongDate(new Date(2026, 9, 21)), 'Wednesday, 21 October');
    assert.equal(formatLongDate(new Date(2026, 0, 1)), 'Thursday, 1 January');
  });
});

describe('formatClock', () => {
  it('uses a 12-hour clock with AM and PM', () => {
    assert.equal(formatClock(new Date(2026, 9, 21, 9, 5)), '9:05 AM');
    assert.equal(formatClock(new Date(2026, 9, 21, 14, 30)), '2:30 PM');
    assert.equal(formatClock(new Date(2026, 9, 21, 12, 0)), '12:00 PM');
    assert.equal(formatClock(new Date(2026, 9, 21, 0, 7)), '12:07 AM');
  });
});

describe('formatClockFromIso', () => {
  it('formats a valid ISO timestamp in local time', () => {
    const date = new Date(2026, 9, 21, 9, 5);
    assert.equal(formatClockFromIso(date.toISOString()), '9:05 AM');
  });

  it('is empty for an invalid timestamp', () => {
    assert.equal(formatClockFromIso(''), '');
    assert.equal(formatClockFromIso('not a date'), '');
  });
});
