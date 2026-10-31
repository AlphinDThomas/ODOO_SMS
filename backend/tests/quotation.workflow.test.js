import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertCanAccept,
  buildAcceptanceFields,
  buildQuotationFields,
  shouldExpireQuotation,
} from '../src/modules/quotations/quotation.workflow.js';

describe('quotation expiration and acceptance', () => {
  it('sets expiry from validity days on submit', () => {
    const submittedAt = new Date('2026-01-01T00:00:00Z');
    const fields = buildQuotationFields(submittedAt, 10);
    assert.equal(fields.status, 'QUOTATION');
    assert.equal(fields.quotationExpiresAt.toISOString(), '2026-01-11T00:00:00.000Z');
  });

  it('rejects expired quotations', () => {
    const subscription = {
      status: 'QUOTATION',
      quotationExpiresAt: new Date('2026-01-10T00:00:00Z'),
      customerId: 'cust-1',
    };
    const actor = { role: 'CUSTOMER', customer: { id: 'cust-1' } };
    assert.throws(
      () => assertCanAccept({ subscription, actor, now: new Date('2026-01-11T00:00:00Z') }),
      /expired/,
    );
    assert.equal(shouldExpireQuotation(subscription, new Date('2026-01-11T00:00:00Z')), true);
  });

  it('lets a customer accept their own live quotation', () => {
    const subscription = {
      status: 'QUOTATION',
      quotationExpiresAt: new Date('2026-02-01T00:00:00Z'),
      customerId: 'cust-1',
    };
    const actor = { role: 'CUSTOMER', customer: { id: 'cust-1' } };
    assertCanAccept({ subscription, actor, now: new Date('2026-01-15T00:00:00Z') });
    const fields = buildAcceptanceFields('user-1', new Date('2026-01-15T00:00:00Z'));
    assert.equal(fields.status, 'CONFIRMED');
  });

  it('blocks a customer from accepting another customer quotation', () => {
    const subscription = {
      status: 'QUOTATION',
      quotationExpiresAt: new Date('2026-02-01T00:00:00Z'),
      customerId: 'cust-1',
    };
    const actor = { role: 'CUSTOMER', customer: { id: 'cust-2' } };
    assert.throws(() => assertCanAccept({ subscription, actor, now: new Date('2026-01-15T00:00:00Z') }), /own quotation/);
  });
});
