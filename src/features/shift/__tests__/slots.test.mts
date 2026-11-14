import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  activeSlot,
  attendanceSlot,
  buildSlots,
  DEFAULT_SLOT_CONFIG,
  formatTime12,
  nearestSlot,
  nextSlotOpening,
  parseHHmm,
  slotStates,
} from '../slots.ts';

/** A local-time Date on 21 Oct 2026 (the slot logic uses the phone's local clock). */
function at(hour: number, minute = 0): Date {
  return new Date(2026, 9, 21, hour, minute);
}

const SLOTS = buildSlots(DEFAULT_SLOT_CONFIG);

describe('parseHHmm', () => {
  it('reads 24-hour times as fractional hours', () => {
    assert.equal(parseHHmm('08:00'), 8);
    assert.equal(parseHHmm('10:30'), 10.5);
    assert.equal(parseHHmm('9:15'), 9.25);
    assert.equal(parseHHmm('23:59'), 23 + 59 / 60);
  });

  it('rejects bad input', () => {
    for (const bad of ['', '24:00', '10:60', '10', 'ab:cd', null, undefined, 830]) {
      assert.equal(parseHHmm(bad), null, String(bad));
    }
  });
});

describe('formatTime12', () => {
  it('formats AM, PM, noon and midnight', () => {
    assert.equal(formatTime12('08:00'), '8:00 AM');
    assert.equal(formatTime12('14:05'), '2:05 PM');
    assert.equal(formatTime12('12:00'), '12:00 PM');
    assert.equal(formatTime12('00:30'), '12:30 AM');
  });
});

describe('buildSlots', () => {
  it('builds Breakfast, Lunch and Dinner windows with readable labels', () => {
    assert.deepEqual(
      SLOTS.map((slot) => [slot.meal, slot.label]),
      [
        ['Breakfast', '8:00 AM - 10:00 AM'],
        ['Lunch', '10:31 AM - 2:30 PM'],
        ['Dinner', '5:30 PM - 10:30 PM'],
      ],
    );
    assert.equal(SLOTS[0]?.earlyLoginCutoff, '08:30');
  });

  it('uses the server config when it is valid', () => {
    const slots = buildSlots({
      breakfast: { startTime: '07:00', endTime: '09:30' },
      lunch: { startTime: '11:00', endTime: '15:00', earlyLoginCutoff: '10:45' },
      dinner: { startTime: '18:00', endTime: '23:00' },
    });
    assert.equal(slots[0]?.startHour, 7);
    assert.equal(slots[0]?.earlyLoginCutoff, null);
    assert.equal(slots[1]?.earlyLoginCutoff, '10:45');
  });

  it('falls back to the defaults when any window is malformed or the config is missing', () => {
    const defaults = buildSlots(DEFAULT_SLOT_CONFIG);
    assert.deepEqual(buildSlots(null), defaults);
    assert.deepEqual(buildSlots({ breakfast: { startTime: 'x', endTime: 'y' } }), defaults);
    assert.deepEqual(
      buildSlots({
        breakfast: { startTime: '10:00', endTime: '08:00' },
        lunch: DEFAULT_SLOT_CONFIG.lunch,
        dinner: DEFAULT_SLOT_CONFIG.dinner,
      }),
      defaults,
    );
  });
});

describe('activeSlot', () => {
  it('finds the slot whose window is open', () => {
    assert.equal(activeSlot(SLOTS, at(8, 0))?.meal, 'Breakfast');
    assert.equal(activeSlot(SLOTS, at(9, 59))?.meal, 'Breakfast');
    assert.equal(activeSlot(SLOTS, at(12))?.meal, 'Lunch');
    assert.equal(activeSlot(SLOTS, at(20))?.meal, 'Dinner');
  });

  it('treats the end of a window as closed and the start as open', () => {
    assert.equal(activeSlot(SLOTS, at(10, 0)), null);
    assert.equal(activeSlot(SLOTS, at(10, 31))?.meal, 'Lunch');
    assert.equal(activeSlot(SLOTS, at(14, 30)), null);
  });

  it('is null between slots, early morning and late night', () => {
    for (const [hour, minute] of [[3, 0], [7, 59], [10, 15], [15, 0], [17, 29], [22, 30], [23, 45]] as const) {
      assert.equal(activeSlot(SLOTS, at(hour, minute)), null, `${hour}:${minute}`);
    }
  });
});

describe('nearestSlot', () => {
  it('picks the slot with the closest midpoint when none is open', () => {
    assert.equal(nearestSlot(SLOTS, at(6)).meal, 'Breakfast');
    assert.equal(nearestSlot(SLOTS, at(15)).meal, 'Lunch');
    assert.equal(nearestSlot(SLOTS, at(16, 45)).meal, 'Dinner');
    assert.equal(nearestSlot(SLOTS, at(23, 50)).meal, 'Dinner');
  });
});

describe('nextSlotOpening', () => {
  it('is the next slot that starts later today', () => {
    assert.equal(nextSlotOpening(SLOTS, at(6))?.meal, 'Breakfast');
    assert.equal(nextSlotOpening(SLOTS, at(10, 15))?.meal, 'Lunch');
    assert.equal(nextSlotOpening(SLOTS, at(15))?.meal, 'Dinner');
  });

  it('is null once the last slot has started', () => {
    assert.equal(nextSlotOpening(SLOTS, at(17, 30)), null);
    assert.equal(nextSlotOpening(SLOTS, at(23)), null);
  });
});

describe('attendanceSlot', () => {
  it('is the open slot, or the nearest one between slots', () => {
    assert.equal(attendanceSlot(SLOTS, at(12)).meal, 'Lunch');
    assert.equal(attendanceSlot(SLOTS, at(15)).meal, 'Lunch');
    assert.equal(attendanceSlot(SLOTS, at(7)).meal, 'Breakfast');
  });
});

describe('slotStates', () => {
  it('marks worked slots ongoing while online and completed after', () => {
    const rows = slotStates(SLOTS, at(12), { Breakfast: 'completed', Lunch: 'online' });
    assert.deepEqual(
      rows.map((row) => [row.slot.meal, row.state]),
      [['Breakfast', 'completed'], ['Lunch', 'ongoing'], ['Dinner', 'upcoming']],
    );
  });

  it('marks an unworked slot ongoing while open, upcoming before, and missed after', () => {
    assert.equal(slotStates(SLOTS, at(9), {})[0]?.state, 'ongoing');
    assert.equal(slotStates(SLOTS, at(7), {})[0]?.state, 'upcoming');
    assert.equal(slotStates(SLOTS, at(11), {})[0]?.state, 'missed');
  });
});
