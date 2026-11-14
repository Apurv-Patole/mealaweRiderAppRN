import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildEndShiftFormData, buildShiftFormData, type SelfieFile, type StartShiftInput } from '../shiftForm.ts';

const SELFIE: SelfieFile = { uri: 'file:///selfie.jpg', name: 'selfie.jpg', type: 'image/jpeg' };

const INPUT: StartShiftInput = {
  riderId: 'r1',
  routeNo: '7',
  mealSlot: 'Lunch',
  selfie: SELFIE,
  startKm: 12450,
  odometerPhoto: SELFIE,
  location: { lat: 18.5204, lng: 73.8567 },
  startedAt: '2026-10-21T05:30:00.000Z',
  deviceInfo: 'android 14',
};

class RecordingForm {
  readonly entries: [string, string | SelfieFile][] = [];
  append(name: string, value: string | SelfieFile): void {
    this.entries.push([name, value]);
  }
}

describe('buildShiftFormData', () => {
  it('sends exactly the fields the server expects, with coordinates as strings', () => {
    const form = buildShiftFormData(INPUT, new RecordingForm());
    assert.deepEqual(form.entries, [
      ['riderId', 'r1'],
      ['photo', SELFIE],
      ['startKm', '12450'],
      ['odometerPhoto', SELFIE],
      ['latitude', '18.5204'],
      ['longitude', '73.8567'],
      ['startedAt', '2026-10-21T05:30:00.000Z'],
      ['routeNo', '7'],
      ['mealSlot', 'Lunch'],
      ['deviceInfo', 'android 14'],
    ]);
  });
});

describe('buildEndShiftFormData', () => {
  it('sends the shift, the end reading as a string, and the odometer photo', () => {
    const form = buildEndShiftFormData({ shiftId: 's1', endKm: 12480.5, odometerPhoto: SELFIE }, new RecordingForm());
    assert.deepEqual(form.entries, [
      ['shiftId', 's1'],
      ['endKm', '12480.5'],
      ['odometerPhoto', SELFIE],
    ]);
  });
});
