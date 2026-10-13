import test from 'node:test';
import assert from 'node:assert/strict';
import { nepalDate, shiftMonth } from '../../src/lib/date';
import { periodHistory, summarize } from '../../src/lib/market';

test('Today crosses midnight in Nepal, independently of the device timezone', () => {
  assert.equal(nepalDate(new Date('2026-10-12T18:14:59Z')), '2026-10-12');
  assert.equal(nepalDate(new Date('2026-10-12T18:15:00Z')), '2026-10-13');
});
test('BS month navigation wraps years', () => {
  assert.deepEqual(shiftMonth(2083, 12, 1), { year: 2084, month: 1 });
  assert.deepEqual(shiftMonth(2083, 1, -1), { year: 2082, month: 12 });
});
test('period calculations preserve real gaps, decimals, and unavailable comparisons', () => {
  const history = [
    { date: '2026-10-01', gold: 100.25, silver: 10 },
    { date: '2026-10-12', gold: 120.5, silver: null },
    { date: '2026-10-13', gold: 110.25, silver: 11 },
  ];
  assert.equal(periodHistory(history, 7).length, 2);
  assert.equal(summarize(history, 'gold')?.change, 10);
  assert.equal(summarize(history.slice(2), 'gold')?.change, null);
  assert.equal(summarize(history, 'silver')?.rows.length, 2);
  assert.equal(summarize([], 'gold'), null);
});
