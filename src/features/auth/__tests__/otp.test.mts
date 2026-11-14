import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { otpCells } from '../otp.ts';

describe('otpCells', () => {
  it('makes one box per digit slot with the first one active when empty', () => {
    const cells = otpCells('', 6);
    assert.equal(cells.length, 6);
    assert.deepEqual(cells[0], { char: '', active: true });
    assert.equal(cells.filter((cell) => cell.active).length, 1);
  });

  it('fills boxes in order and activates the next empty one', () => {
    const cells = otpCells('123', 6);
    assert.deepEqual(
      cells.map((cell) => cell.char),
      ['1', '2', '3', '', '', ''],
    );
    assert.equal(cells.findIndex((cell) => cell.active), 3);
  });

  it('keeps the last box active when the code is complete', () => {
    const cells = otpCells('123456', 6);
    assert.equal(cells.findIndex((cell) => cell.active), 5);
    assert.equal(cells[5]?.char, '6');
  });
});
