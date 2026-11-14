import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  applyReply,
  clampInterval,
  DEFAULT_INTERVAL_MS,
  DELIVERY_INTERVAL_MS,
  describeTracking,
  enqueuePing,
  intervalForStage,
  MAX_BUFFER,
  MAX_INTERVAL_MS,
  MIN_INTERVAL_MS,
  onFix,
  parseBuffer,
  parsePingReply,
  parseState,
  segmentIncrement,
  startState,
  withStage,
  type Fix,
  type PingPayload,
  type TrackingContext,
} from '../trackingCore.ts';

const CONTEXT: TrackingContext = { riderId: 'r1', shiftId: 's1', stage: 'pickup_stage' };
const T0 = 1_700_000_000_000;

// 0.0009 degrees of latitude is about 100 m
function fix(overrides: Partial<Fix> = {}): Fix {
  return { lat: 18.52, lng: 73.85, accuracy: 10, speed: 3, heading: 90, timestamp: T0, ...overrides };
}

describe('intervals', () => {
  it('pings every 30 s while delivering and 60 s otherwise', () => {
    assert.equal(DELIVERY_INTERVAL_MS, 30_000);
    assert.equal(DEFAULT_INTERVAL_MS, 60_000);
    assert.equal(intervalForStage('delivery_stage'), 30_000);
    assert.equal(intervalForStage('pickup_stage'), 60_000);
    assert.equal(intervalForStage('completed'), 60_000);
  });

  it('keeps a server-supplied rate within 10 s to 2 min', () => {
    assert.equal(clampInterval(500), MIN_INTERVAL_MS);
    assert.equal(clampInterval(45_000), 45_000);
    assert.equal(clampInterval(10 * 60_000), MAX_INTERVAL_MS);
  });

  it('starts at the stage default and switches rate when the stage changes', () => {
    const state = startState(CONTEXT);
    assert.equal(state.intervalMs, 60_000);
    const delivering = withStage(state, 'delivery_stage');
    assert.equal(delivering.context.stage, 'delivery_stage');
    assert.equal(delivering.intervalMs, 30_000);
    assert.equal(withStage(delivering, 'delivery_stage'), delivering);
    assert.equal(state.context.stage, 'pickup_stage');
  });
});

describe('segmentIncrement', () => {
  const start = fix();

  it('is 0 without a previous fix', () => {
    assert.equal(segmentIncrement(null, start), 0);
  });

  it('measures real movement in metres', () => {
    const meters = segmentIncrement(start, fix({ lat: 18.5209, timestamp: T0 + 20_000 }));
    assert.ok(meters > 95 && meters < 105, String(meters));
  });

  it('ignores stationary jitter under 5 m', () => {
    assert.equal(segmentIncrement(start, fix({ lat: 18.52002, timestamp: T0 + 5000 })), 0);
  });

  it('ignores fixes less accurate than 50 m', () => {
    assert.equal(segmentIncrement(start, fix({ lat: 18.5209, accuracy: 80, timestamp: T0 + 20_000 })), 0);
  });

  it('counts a fix with no accuracy reading', () => {
    assert.ok(segmentIncrement(start, fix({ lat: 18.5209, accuracy: null, timestamp: T0 + 20_000 })) > 90);
  });

  it('ignores a GPS jump faster than 55 m/s', () => {
    assert.equal(segmentIncrement(start, fix({ lat: 18.53, timestamp: T0 + 5000 })), 0);
  });
});

describe('onFix', () => {
  it('sends the very first fix as a ping and starts the clock', () => {
    const result = onFix(startState(CONTEXT), fix(), T0);
    assert.ok(result.ping);
    assert.equal(result.ping?.riderId, 'r1');
    assert.equal(result.ping?.shiftId, 's1');
    assert.equal(result.ping?.stage, 'pickup_stage');
    assert.equal(result.ping?.timestamp, new Date(T0).toISOString());
    assert.equal(result.ping?.segmentMeters, 0);
    assert.equal(result.state.lastPingAt, T0);
  });

  it('does not ping again until the interval has passed, but keeps adding distance', () => {
    let state = onFix(startState(CONTEXT), fix(), T0).state;
    const early = onFix(state, fix({ lat: 18.5209, timestamp: T0 + 20_000 }), T0 + 20_000);
    assert.equal(early.ping, null);
    assert.ok(early.state.segmentMeters > 90);
    state = early.state;
    const due = onFix(state, fix({ lat: 18.5218, timestamp: T0 + 60_000 }), T0 + 60_000);
    assert.ok(due.ping);
    assert.ok((due.ping?.segmentMeters ?? 0) > 190);
    assert.equal(due.state.segmentMeters, 0);
    assert.equal(due.state.lastPingAt, T0 + 60_000);
  });

  it('pings every 30 s once the stage is delivery', () => {
    const state = withStage(onFix(startState(CONTEXT), fix(), T0).state, 'delivery_stage');
    assert.equal(onFix(state, fix({ timestamp: T0 + 29_000 }), T0 + 29_000).ping, null);
    assert.ok(onFix(state, fix({ timestamp: T0 + 30_000 }), T0 + 30_000).ping);
  });

  it('still sends a ping for a poor-accuracy fix but does not count its distance', () => {
    const state = onFix(startState(CONTEXT), fix(), T0).state;
    const result = onFix(state, fix({ lat: 18.5209, accuracy: 120, timestamp: T0 + 60_000 }), T0 + 60_000);
    assert.ok(result.ping);
    assert.equal(result.ping?.segmentMeters, 0);
    assert.equal(result.state.lastFix?.lat, 18.52);
  });

  it('ignores a fix with invalid coordinates', () => {
    const state = startState(CONTEXT);
    assert.deepEqual(onFix(state, fix({ lat: 0, lng: 0 }), T0), { state, ping: null });
    assert.deepEqual(onFix(state, fix({ lat: Number.NaN }), T0), { state, ping: null });
  });

  it('does not mutate the previous state', () => {
    const state = startState(CONTEXT);
    const copy = JSON.stringify(state);
    onFix(state, fix(), T0);
    assert.equal(JSON.stringify(state), copy);
  });
});

describe('server replies', () => {
  it('parses saved, stop and nextPingMs', () => {
    assert.deepEqual(parsePingReply({ saved: true, nextPingMs: 30000 }), { saved: true, stop: false, nextPingMs: 30000 });
    assert.deepEqual(parsePingReply({ saved: false, stop: true, reason: 'shift_not_active' }), { saved: false, stop: true, nextPingMs: null });
  });

  it('treats anything unexpected as "carry on"', () => {
    for (const raw of [null, undefined, 'x', {}, { nextPingMs: 'soon' }, { nextPingMs: -5 }]) {
      const reply = parsePingReply(raw);
      assert.equal(reply.stop, false);
      assert.equal(reply.nextPingMs, null);
    }
  });

  it('applies the server rate within limits and ignores a missing one', () => {
    const state = startState(CONTEXT);
    assert.equal(applyReply(state, { saved: true, stop: false, nextPingMs: 30_000 }).intervalMs, 30_000);
    assert.equal(applyReply(state, { saved: true, stop: false, nextPingMs: 1 }).intervalMs, MIN_INTERVAL_MS);
    assert.equal(applyReply(state, { saved: true, stop: false, nextPingMs: null }), state);
  });
});

function ping(n: number): PingPayload {
  return {
    riderId: 'r1', shiftId: 's1', lat: 18.5, lng: 73.8, accuracy: null, speed: null, heading: null,
    timestamp: new Date(T0 + n * 1000).toISOString(), stage: 'pickup_stage', segmentMeters: n,
  };
}

describe('buffer', () => {
  it('adds pings at the end, oldest first, without mutating', () => {
    const before = [ping(1)];
    const after = enqueuePing(before, ping(2));
    assert.deepEqual(after.map((p) => p.segmentMeters), [1, 2]);
    assert.equal(before.length, 1);
  });

  it('keeps at most the cap, dropping the oldest', () => {
    let buffer: PingPayload[] = [];
    for (let i = 0; i < MAX_BUFFER + 5; i += 1) buffer = enqueuePing(buffer, ping(i));
    assert.equal(buffer.length, MAX_BUFFER);
    assert.equal(buffer[0]?.segmentMeters, 5);
    assert.equal(buffer[buffer.length - 1]?.segmentMeters, MAX_BUFFER + 4);
  });

  it('parses a stored buffer and drops malformed entries', () => {
    assert.deepEqual(parseBuffer([ping(1), null, 'x', {}, { ...ping(2), lat: 'north' }, { ...ping(3), timestamp: 5 }]), [ping(1)]);
    assert.deepEqual(parseBuffer(undefined), []);
  });
});

describe('parseState', () => {
  it('round-trips a state', () => {
    const state = onFix(startState(CONTEXT), fix(), T0).state;
    assert.deepEqual(parseState(JSON.parse(JSON.stringify(state))), state);
  });

  it('rejects missing or malformed state', () => {
    for (const bad of [null, undefined, 'x', {}, { context: {} }, { context: { riderId: 'r' } }]) {
      assert.equal(parseState(bad), null, JSON.stringify(bad));
    }
  });

  it('repairs a bad rate and stage instead of failing', () => {
    const parsed = parseState({ context: { riderId: 'r', shiftId: 's', stage: 'weird' }, intervalMs: 999_999_999, segmentMeters: -5, lastPingAt: null });
    assert.equal(parsed?.context.stage, 'pickup_stage');
    assert.equal(parsed?.intervalMs, MAX_INTERVAL_MS);
    assert.equal(parsed?.segmentMeters, 0);
    assert.equal(parsed?.lastPingAt, null);
  });
});

describe('describeTracking', () => {
  const NOW = T0 + 10 * 60_000;

  it('says when sharing is off', () => {
    assert.equal(describeTracking({ active: false, lastPingAt: null, waiting: 0 }, NOW), 'Location sharing is off.');
  });

  it('says it is waiting for the first fix', () => {
    assert.match(describeTracking({ active: true, lastPingAt: null, waiting: 0 }, NOW), /first GPS fix/);
  });

  it('says when the last ping went and how many are waiting', () => {
    assert.match(describeTracking({ active: true, lastPingAt: NOW - 20_000, waiting: 0 }, NOW), /just now/);
    assert.match(describeTracking({ active: true, lastPingAt: NOW - 3 * 60_000, waiting: 4 }, NOW), /3 min ago\. 4 waiting to send\./);
  });
});
