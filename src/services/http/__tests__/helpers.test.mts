import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildUrl, extractErrorMessage, HttpError, isRetryableStatus } from '../helpers.ts';

describe('buildUrl', () => {
  it('joins base and path with exactly one slash', () => {
    assert.equal(buildUrl('https://api.mealawe.com', '/api/x'), 'https://api.mealawe.com/api/x');
    assert.equal(buildUrl('https://api.mealawe.com/', '/api/x'), 'https://api.mealawe.com/api/x');
    assert.equal(buildUrl('https://api.mealawe.com', 'api/x'), 'https://api.mealawe.com/api/x');
  });

  it('keeps an absolute URL untouched', () => {
    assert.equal(buildUrl('https://api.mealawe.com', 'https://other.test/a'), 'https://other.test/a');
  });
});

describe('extractErrorMessage', () => {
  it('reads msg, error or message from a JSON body', () => {
    assert.equal(extractErrorMessage('{"msg":"Rider not found"}', 404), 'Rider not found');
    assert.equal(extractErrorMessage('{"error":"Bad OTP"}', 400), 'Bad OTP');
    assert.equal(extractErrorMessage('{"message":"Nope"}', 400), 'Nope');
  });

  it('prefers msg over error over message', () => {
    assert.equal(extractErrorMessage('{"message":"c","error":"b","msg":"a"}', 400), 'a');
  });

  it('falls back to a generic message for empty, non-JSON or unhelpful bodies', () => {
    assert.equal(extractErrorMessage('', 500), 'Request failed: 500');
    assert.equal(extractErrorMessage('<html>oops</html>', 502), 'Request failed: 502');
    assert.equal(extractErrorMessage('{"msg":"   "}', 400), 'Request failed: 400');
    assert.equal(extractErrorMessage('{"msg":42}', 400), 'Request failed: 400');
    assert.equal(extractErrorMessage('null', 400), 'Request failed: 400');
  });
});

describe('isRetryableStatus', () => {
  it('retries rate limiting and server errors only', () => {
    assert.equal(isRetryableStatus(429), true);
    assert.equal(isRetryableStatus(500), true);
    assert.equal(isRetryableStatus(503), true);
    assert.equal(isRetryableStatus(400), false);
    assert.equal(isRetryableStatus(401), false);
    assert.equal(isRetryableStatus(404), false);
  });
});

describe('HttpError', () => {
  it('carries the status, message and raw body', () => {
    const error = new HttpError(401, 'Session expired', '{"msg":"x"}');
    assert.equal(error.status, 401);
    assert.equal(error.message, 'Session expired');
    assert.equal(error.body, '{"msg":"x"}');
    assert.ok(error instanceof Error);
    assert.equal(error.name, 'HttpError');
  });
});
