import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { retryDelayMs } from '../backoff.ts';

describe('retryDelayMs', () => {
  it('doubles each attempt up to the cap (no jitter at random = 1)', () => {
    const delays = [0, 1, 2, 3, 4, 5, 6].map((attempt) => retryDelayMs(attempt, 2_000, 60_000, () => 1));
    assert.deepEqual(delays, [2_000, 4_000, 8_000, 16_000, 32_000, 60_000, 60_000]);
  });

  it('applies between 50% and 100% jitter', () => {
    assert.equal(retryDelayMs(2, 2_000, 60_000, () => 0), 4_000);
    assert.equal(retryDelayMs(2, 2_000, 60_000, () => 0.5), 6_000);
    assert.equal(retryDelayMs(2, 2_000, 60_000, () => 1), 8_000);
  });

  it('treats a negative attempt as the first', () => {
    assert.equal(retryDelayMs(-3, 2_000, 60_000, () => 1), 2_000);
  });
});
