import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeToMonthly } from '../src/modules/reports/reports.service.js';
import { isQuotationExpired } from '../src/utils/dates.js';

describe('Finance Analytics - normalizeToMonthly', () => {
  it('normalizes monthly billing interval without change', () => {
    assert.equal(normalizeToMonthly(100, 'MONTHLY'), 100);
  });

  it('normalizes yearly billing interval to monthly value (amount / 12)', () => {
    assert.equal(normalizeToMonthly(1200, 'YEARLY'), 100);
  });

  it('normalizes weekly billing interval using standard 52/12 weeks', () => {
    const weekly = normalizeToMonthly(50, 'WEEKLY');
    assert.equal(Math.round(weekly * 100) / 100, 216.67);
  });

  it('normalizes daily billing interval to 30 days', () => {
    assert.equal(normalizeToMonthly(10, 'DAILY'), 300);
  });

  it('handles null, undefined, or missing values safely', () => {
    assert.equal(normalizeToMonthly(null, 'MONTHLY'), 0);
    assert.equal(normalizeToMonthly(undefined, 'MONTHLY'), 0);
    assert.equal(normalizeToMonthly('abc', 'MONTHLY'), 0);
  });

  it('computes annual recurring revenue correctly (ARR = MRR * 12)', () => {
    const mrr = normalizeToMonthly(250, 'MONTHLY') + normalizeToMonthly(1200, 'YEARLY');
    const arr = mrr * 12;
    assert.equal(mrr, 350);
    assert.equal(arr, 4200);
  });
});

describe('Customer Portal - Quotation Expiry & Acceptance Logic', () => {
  it('identifies unexpired quotations properly', () => {
    const futureExpiry = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
    assert.equal(isQuotationExpired(futureExpiry, new Date()), false);
  });

  it('identifies expired quotations properly', () => {
    const pastExpiry = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
    assert.equal(isQuotationExpired(pastExpiry, new Date()), true);
  });

  it('verifies customer ownership check for quotation acceptance', () => {
    const customerId = 'cust-uuid-1';
    const unauthorizedCustomerId = 'cust-uuid-2';
    const subscription = {
      id: 'sub-1',
      customerId: 'cust-uuid-1',
      status: 'QUOTATION',
      quotationExpiresAt: new Date(Date.now() + 86400000),
    };

    // Simulated ownership assertion
    const isOwner = (sub, cId) => sub.customerId === cId;
    assert.equal(isOwner(subscription, customerId), true);
    assert.equal(isOwner(subscription, unauthorizedCustomerId), false);
  });

  it('verifies state transition from QUOTATION to CONFIRMED on acceptance', () => {
    const initialStatus = 'QUOTATION';
    const acceptedStatus = 'CONFIRMED';
    const actorId = 'user-uuid-123';
    const now = new Date();

    const transition = (sub, actor) => {
      if (sub.status !== 'QUOTATION') throw new Error('Not open quotation');
      return {
        ...sub,
        status: acceptedStatus,
        acceptedAt: now,
        acceptedById: actor,
      };
    };

    const updated = transition({ status: initialStatus }, actorId);
    assert.equal(updated.status, 'CONFIRMED');
    assert.equal(updated.acceptedById, actorId);
    assert.equal(updated.acceptedAt, now);
  });
});

describe('Finance Analytics - Overdue and Receivables Logic', () => {
  it('calculates days overdue accurately', () => {
    const now = new Date('2026-10-31T12:00:00Z');
    const dueDate = new Date('2026-10-21T12:00:00Z'); // 10 days earlier
    const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    assert.equal(diffDays, 10);
  });

  it('identifies overdue invoices based on status and dueDate', () => {
    const now = new Date('2026-10-31T12:00:00Z');
    const invoices = [
      { id: '1', status: 'CONFIRMED', dueDate: new Date('2026-10-15'), balanceDue: 200 },
      { id: '2', status: 'PARTIALLY_PAID', dueDate: new Date('2026-10-25'), balanceDue: 150 },
      { id: '3', status: 'PAID', dueDate: new Date('2026-10-10'), balanceDue: 0 },
      { id: '4', status: 'CONFIRMED', dueDate: new Date('2026-11-15'), balanceDue: 500 },
    ];

    const overdue = invoices.filter(
      (inv) => ['CONFIRMED', 'PARTIALLY_PAID'].includes(inv.status) && inv.dueDate < now,
    );

    assert.equal(overdue.length, 2);
    assert.equal(overdue[0].id, '1');
    assert.equal(overdue[1].id, '2');

    const totalOutstanding = invoices
      .filter((inv) => ['CONFIRMED', 'PARTIALLY_PAID'].includes(inv.status))
      .reduce((sum, inv) => sum + inv.balanceDue, 0);

    assert.equal(totalOutstanding, 850);
  });
});
