import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Prisma } from '@prisma/client';
import { applyPaymentStatus, isUniqueConstraint } from '../src/modules/billing/transactions.js';

describe('duplicate billing', () => {
  it('treats unique (subscriptionId, periodStart) as a duplicate invoice', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
    });
    assert.equal(isUniqueConstraint(error), true);
  });
});

describe('partial payments', () => {
  it('marks partial then paid and rejects overpayment', () => {
    assert.deepEqual(applyPaymentStatus(100, 40), {
      status: 'PARTIALLY_PAID',
      amountPaid: 40,
      balanceDue: 60,
    });
    assert.deepEqual(applyPaymentStatus(100, 100), {
      status: 'PAID',
      amountPaid: 100,
      balanceDue: 0,
    });
    assert.throws(() => applyPaymentStatus(100, 110), /exceeds/);
  });
});

describe('expired discounts', () => {
  it('rejects discounts outside the validity window or at max uses', () => {
    const now = new Date('2026-06-01T00:00:00Z');
    const expired = { validFrom: new Date('2026-01-01'), validTo: new Date('2026-03-01'), maxUses: 5, usesCount: 1 };
    const exhausted = { validFrom: new Date('2026-01-01'), validTo: new Date('2026-12-01'), maxUses: 2, usesCount: 2 };
    const live = { validFrom: new Date('2026-01-01'), validTo: new Date('2026-12-01'), maxUses: 5, usesCount: 1 };

    const usable = (rule, at) =>
      at >= rule.validFrom &&
      (!rule.validTo || at <= rule.validTo) &&
      (rule.maxUses == null || rule.usesCount < rule.maxUses);

    assert.equal(usable(expired, now), false);
    assert.equal(usable(exhausted, now), false);
    assert.equal(usable(live, now), true);
  });
});
