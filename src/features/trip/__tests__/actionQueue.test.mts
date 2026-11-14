import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  applyPending,
  completeStep,
  createAction,
  dueActions,
  failedActions,
  hasActionFor,
  isComplete,
  isRetryableFailure,
  makeActionId,
  nextStep,
  parseQueue,
  pendingActions,
  recordFailure,
  recordRetry,
  retryNow,
  TARGET_STATUS,
  type NewAction,
  type OverlayOrder,
} from '../actionQueue.ts';

const NOW = 1_000_000;

function input(overrides: Partial<NewAction> = {}): NewAction {
  return {
    id: 'a1',
    kind: 'pickup',
    orderId: 'o1',
    orderNo: '1042',
    photoUri: 'file:///proof.jpg',
    location: { lat: 18.52, lng: 73.85 },
    riderId: 'r1',
    shiftId: 's1',
    ...overrides,
  };
}

describe('makeActionId', () => {
  it('combines the time and a random suffix', () => {
    assert.equal(makeActionId(0, () => 0), '0-000000');
    assert.match(makeActionId(NOW, () => 0.5), /^[0-9a-z]+-[0-9a-z]{6}$/);
  });

  it('gives different ids for different times and randoms', () => {
    assert.notEqual(makeActionId(1, () => 0.1), makeActionId(2, () => 0.1));
    assert.notEqual(makeActionId(1, () => 0.1), makeActionId(1, () => 0.9));
  });
});

describe('createAction', () => {
  it('starts pending with nothing done and an empty handover', () => {
    const action = createAction(input(), NOW);
    assert.equal(action.state, 'pending');
    assert.deepEqual(action.done, []);
    assert.equal(action.proofUrl, null);
    assert.equal(action.attempts, 0);
    assert.equal(action.retryAt, NOW);
    assert.equal(action.handOverTo, '');
    assert.equal(action.createdAt, NOW);
  });

  it('keeps who received a delivery', () => {
    assert.equal(createAction(input({ kind: 'delivery', handOverTo: 'Doorstep' }), NOW).handOverTo, 'Doorstep');
  });
});

describe('steps', () => {
  it('a pickup runs proof, then the pickup record, then the status', () => {
    let action = createAction(input(), NOW);
    assert.equal(nextStep(action), 'proof');
    action = completeStep(action, 'proof', 'https://cdn/p.jpg');
    assert.equal(nextStep(action), 'complete');
    action = completeStep(action, 'complete');
    assert.equal(nextStep(action), 'status');
    assert.equal(isComplete(action), false);
    action = completeStep(action, 'status');
    assert.equal(nextStep(action), null);
    assert.equal(isComplete(action), true);
  });

  it('a delivery has no pickup-record step', () => {
    let action = createAction(input({ kind: 'delivery' }), NOW);
    action = completeStep(action, 'proof', 'https://cdn/d.jpg');
    assert.equal(nextStep(action), 'status');
  });

  it('remembers the proof URL for the later steps and does not lose it', () => {
    let action = completeStep(createAction(input(), NOW), 'proof', 'https://cdn/p.jpg');
    action = completeStep(action, 'complete');
    assert.equal(action.proofUrl, 'https://cdn/p.jpg');
  });

  it('completing a step twice changes nothing', () => {
    const once = completeStep(createAction(input(), NOW), 'proof', 'u');
    assert.equal(completeStep(once, 'proof', 'other'), once);
  });

  it('resets the attempt count and error when a step succeeds', () => {
    const failed = recordRetry(createAction(input(), NOW), 'offline', NOW);
    const next = completeStep(failed, 'proof', 'u');
    assert.equal(next.attempts, 0);
    assert.equal(next.error, null);
  });

  it('targets the right order status', () => {
    assert.equal(TARGET_STATUS.pickup, 'handedOverToDeliveryBoy');
    assert.equal(TARGET_STATUS.delivery, 'delivered');
  });
});

describe('failures', () => {
  it('retries connection problems, timeouts, rate limits and server errors', () => {
    for (const status of [0, 408, 429, 500, 502, 503]) assert.equal(isRetryableFailure(status), true, String(status));
  });

  it('does not retry refusals that will not change', () => {
    for (const status of [400, 401, 402, 404, 409]) assert.equal(isRetryableFailure(status), false, String(status));
  });

  it('a retry keeps the action pending, counts the attempt and waits before the next try', () => {
    const retried = recordRetry(createAction(input(), NOW), 'No connection', NOW);
    assert.equal(retried.state, 'pending');
    assert.equal(retried.attempts, 1);
    assert.equal(retried.error, 'No connection');
    assert.ok(retried.retryAt > NOW);
  });

  it('waits longer after each failed attempt', () => {
    let action = createAction(input(), NOW);
    const gaps: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      action = recordRetry(action, 'x', NOW);
      gaps.push(action.retryAt - NOW);
    }
    assert.ok((gaps[3] ?? 0) > (gaps[0] ?? 0));
  });

  it('a permanent failure stops retrying and keeps the reason', () => {
    const failed = recordFailure(createAction(input(), NOW), 'This order was cancelled.');
    assert.equal(failed.state, 'failed');
    assert.equal(failed.error, 'This order was cancelled.');
  });

  it('"try again" puts a failed action back in line immediately', () => {
    const failed = recordFailure(recordRetry(createAction(input(), NOW), 'x', NOW), 'Cancelled');
    const again = retryNow(failed, NOW + 5);
    assert.equal(again.state, 'pending');
    assert.equal(again.attempts, 0);
    assert.equal(again.error, null);
    assert.equal(again.retryAt, NOW + 5);
  });
});

describe('queue selection', () => {
  const a = createAction(input({ id: 'a', orderId: 'o1' }), 100);
  const b = createAction(input({ id: 'b', orderId: 'o2' }), 50);
  const waiting = { ...createAction(input({ id: 'c', orderId: 'o3' }), 10), retryAt: 9_999 };
  const failed = recordFailure(createAction(input({ id: 'd', orderId: 'o4' }), 5), 'no');
  const all = [a, b, waiting, failed];

  it('lists only pending actions whose wait is over, oldest first', () => {
    assert.deepEqual(dueActions(all, 500).map((x) => x.id), ['b', 'a']);
    assert.deepEqual(dueActions(all, 10_000).map((x) => x.id), ['c', 'b', 'a']);
  });

  it('separates pending from failed', () => {
    assert.deepEqual(pendingActions(all).map((x) => x.id), ['a', 'b', 'c']);
    assert.deepEqual(failedActions(all).map((x) => x.id), ['d']);
  });

  it('spots a double tap on the same order and kind only', () => {
    assert.equal(hasActionFor(all, 'o1', 'pickup'), true);
    assert.equal(hasActionFor(all, 'o1', 'delivery'), false);
    assert.equal(hasActionFor(all, 'o4', 'pickup'), false); // failed does not block a fresh try
    assert.equal(hasActionFor(all, 'zzz', 'pickup'), false);
  });

  it('does not mutate the list it is given', () => {
    const copy = JSON.stringify(all);
    dueActions(all, 10_000);
    pendingActions(all);
    assert.equal(JSON.stringify(all), copy);
  });
});

describe('parseQueue', () => {
  it('keeps valid stored actions and drops malformed ones', () => {
    const valid = createAction(input(), NOW);
    assert.deepEqual(parseQueue([valid, null, 'x', {}, { ...valid, kind: 'teleport' }, { ...valid, done: 'no' }, { ...valid, state: 'weird' }]), [valid]);
  });

  it('is empty for anything that is not a list', () => {
    assert.deepEqual(parseQueue(undefined), []);
    assert.deepEqual(parseQueue({}), []);
  });
});

describe('applyPending', () => {
  const orders: OverlayOrder[] = [
    { id: 'o1', statusKey: 'readytodelivery', lifecycle: 'prePickup' },
    { id: 'o2', statusKey: 'ontheway', lifecycle: 'postPickup' },
    { id: 'o3', statusKey: 'cancelledbyuser', lifecycle: 'cancelled' },
    { id: 'o4', statusKey: 'delivered', lifecycle: 'done' },
    { id: 'o5', statusKey: 'accepted', lifecycle: 'prePickup' },
  ];

  it('shows a waiting pickup as picked up and a waiting delivery as delivered', () => {
    const result = applyPending(orders, [
      createAction(input({ id: 'p', kind: 'pickup', orderId: 'o1' }), NOW),
      createAction(input({ id: 'd', kind: 'delivery', orderId: 'o2' }), NOW),
    ]);
    assert.deepEqual(result[0], { id: 'o1', statusKey: 'handedovertodeliveryboy', lifecycle: 'postPickup' });
    assert.deepEqual(result[1], { id: 'o2', statusKey: 'delivered', lifecycle: 'done' });
  });

  it('leaves untouched orders, and orders the server already finished or cancelled, alone', () => {
    const result = applyPending(orders, [
      createAction(input({ id: 'x', kind: 'delivery', orderId: 'o3' }), NOW),
      createAction(input({ id: 'y', kind: 'delivery', orderId: 'o4' }), NOW),
    ]);
    assert.deepEqual(result[2], orders[2]);
    assert.deepEqual(result[3], orders[3]);
    assert.deepEqual(result[4], orders[4]);
  });

  it('ignores failed actions and prefers a delivery over a pickup for the same order', () => {
    const failed = recordFailure(createAction(input({ id: 'f', kind: 'delivery', orderId: 'o5' }), NOW), 'no');
    assert.deepEqual(applyPending(orders, [failed])[4], orders[4]);

    const both = applyPending(orders, [
      createAction(input({ id: 'p', kind: 'pickup', orderId: 'o1' }), NOW),
      createAction(input({ id: 'd', kind: 'delivery', orderId: 'o1' }), NOW),
    ]);
    assert.equal(both[0]?.lifecycle, 'done');
  });

  it('returns a new list and never mutates the orders', () => {
    const copy = JSON.stringify(orders);
    const result = applyPending(orders, []);
    assert.notEqual(result, orders);
    assert.equal(JSON.stringify(orders), copy);
  });
});
