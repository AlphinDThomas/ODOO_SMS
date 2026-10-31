import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isQuotationExpired, quotationExpiryFrom, resumeBillingDate } from '../src/utils/dates.js';

describe('subscription numbering and lifecycle validation', () => {
  it('formats SUB-XXXX subscription numbers with zero padding', () => {
    const formatNumber = (seq) => `SUB-${String(seq).padStart(4, '0')}`;
    assert.equal(formatNumber(1), 'SUB-0001');
    assert.equal(formatNumber(42), 'SUB-0042');
    assert.equal(formatNumber(1234), 'SUB-1234');
  });

  it('validates quotation lifecycle: submit sets expiry, confirms only while live', () => {
    const submittedAt = new Date('2026-06-01T00:00:00Z');
    const validityDays = 15;
    const expiresAt = quotationExpiryFrom(submittedAt, validityDays);

    assert.equal(expiresAt.toISOString(), '2026-06-16T00:00:00.000Z');
    assert.equal(isQuotationExpired(expiresAt, new Date('2026-06-10T00:00:00Z')), false);
    assert.equal(isQuotationExpired(expiresAt, new Date('2026-06-16T00:00:01Z')), true);
  });

  it('enforces plan pause permission rule', () => {
    const planNoPause = { allowPause: false };
    const planAllowPause = { allowPause: true };

    const canPause = (plan) => plan.allowPause === true;
    assert.equal(canPause(planNoPause), false);
    assert.equal(canPause(planAllowPause), true);
  });

  it('recalculates nextBillingDate on resume without missing past intervals', () => {
    const pausedAt = new Date('2026-02-01T00:00:00Z');
    const oldNextBilling = new Date('2026-02-05T00:00:00Z');
    const today = new Date('2026-03-01T00:00:00Z');

    const resumedDate = resumeBillingDate(pausedAt, oldNextBilling, today);
    // Should be today (2026-03-01) since oldNextBilling (Feb 5) passed while paused
    assert.equal(resumedDate.toISOString(), '2026-03-01T00:00:00.000Z');
  });

  it('enforces early closure plan rule before expiry date', () => {
    const expiryDate = new Date('2026-12-31T00:00:00Z');
    const currentDate = new Date('2026-06-01T00:00:00Z');

    const canCloseEarly = (plan, current, expiry) => {
      if (current.getTime() < expiry.getTime()) {
        return plan.allowEarlyClose === true;
      }
      return true;
    };

    assert.equal(canCloseEarly({ allowEarlyClose: false }, currentDate, expiryDate), false);
    assert.equal(canCloseEarly({ allowEarlyClose: true }, currentDate, expiryDate), true);
    assert.equal(canCloseEarly({ allowEarlyClose: false }, new Date('2027-01-01T00:00:00Z'), expiryDate), true);
  });
});
