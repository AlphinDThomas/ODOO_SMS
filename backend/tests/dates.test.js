import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  addInterval,
  isEligibleBillingPeriod,
  lastEligiblePeriodStart,
  resumeBillingDate,
  shouldAutoCloseAfterPeriod,
} from '../src/utils/dates.js';

describe('month-end billing', () => {
  it('clamps 31 Jan to 28 Feb in a non-leap year', () => {
    const next = addInterval(new Date('2026-01-31T00:00:00Z'), 'MONTHLY');
    assert.equal(next.toISOString().slice(0, 10), '2026-02-28');
  });

  it('clamps 31 Jan to 29 Feb in a leap year', () => {
    const next = addInterval(new Date('2024-01-31T00:00:00Z'), 'MONTHLY');
    assert.equal(next.toISOString().slice(0, 10), '2024-02-29');
  });

  it('advances 29 Feb leap year to 28 Mar, then later years stay valid', () => {
    const next = addInterval(new Date('2024-02-29T00:00:00Z'), 'YEARLY');
    assert.equal(next.toISOString().slice(0, 10), '2025-02-28');
  });
});

describe('last eligible billing period', () => {
  it('does not skip the last period before expiry', () => {
    const start = new Date('2026-01-15T00:00:00Z');
    const expiry = new Date('2026-04-15T00:00:00Z');
    const last = lastEligiblePeriodStart(start, expiry, 'MONTHLY');
    assert.equal(last.toISOString().slice(0, 10), '2026-03-15');
    assert.equal(isEligibleBillingPeriod(new Date('2026-03-15T00:00:00Z'), start, expiry), true);
    assert.equal(isEligibleBillingPeriod(new Date('2026-04-15T00:00:00Z'), start, expiry), false);
  });

  it('closes only after the last eligible period has been billed', () => {
    const expiry = new Date('2026-04-15T00:00:00Z');
    assert.equal(shouldAutoCloseAfterPeriod(new Date('2026-03-15T00:00:00Z'), expiry, true), false);
    assert.equal(shouldAutoCloseAfterPeriod(new Date('2026-04-15T00:00:00Z'), expiry, true), true);
  });
});

describe('missed billing periods', () => {
  it('lists every period between start and as-of without skipping', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const expiry = new Date('2026-12-31T00:00:00Z');
    const asOf = new Date('2026-01-15T00:00:00Z');
    const periods = [];
    let cursor = start;
    while (isEligibleBillingPeriod(cursor, start, expiry) && cursor <= asOf) {
      periods.push(cursor.toISOString().slice(0, 10));
      cursor = addInterval(cursor, 'DAILY');
    }
    assert.equal(periods.length, 15);
    assert.equal(periods[0], '2026-01-01');
    assert.equal(periods[14], '2026-01-15');
  });
});

describe('paused subscriptions', () => {
  it('does not bill while paused and resumes on/after today', () => {
    const originalNext = new Date('2026-03-01T00:00:00Z');
    const today = new Date('2026-03-10T00:00:00Z');
    const resumed = resumeBillingDate(new Date('2026-02-20T00:00:00Z'), originalNext, today);
    assert.equal(resumed.toISOString().slice(0, 10), '2026-03-10');
  });
});
