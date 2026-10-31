import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { applyPaymentStatus, duplicateBillingError, isUniqueConstraint } from '../src/modules/billing/transactions.js';

describe('Person 3: Billing & Payment Business Rules', () => {
  describe('applyPaymentStatus', () => {
    it('sets CONFIRMED if 0 paid', () => {
      const res = applyPaymentStatus(500, 0);
      assert.equal(res.status, 'CONFIRMED');
      assert.equal(res.amountPaid, 0);
      assert.equal(res.balanceDue, 500);
    });

    it('sets PARTIALLY_PAID if partially paid', () => {
      const res = applyPaymentStatus(500, 200);
      assert.equal(res.status, 'PARTIALLY_PAID');
      assert.equal(res.amountPaid, 200);
      assert.equal(res.balanceDue, 300);
    });

    it('sets PAID when full balance is settled', () => {
      const res = applyPaymentStatus(500, 500);
      assert.equal(res.status, 'PAID');
      assert.equal(res.amountPaid, 500);
      assert.equal(res.balanceDue, 0);
    });

    it('throws error when payment exceeds outstanding balance', () => {
      assert.throws(() => applyPaymentStatus(500, 550), /exceeds/);
    });
  });

  describe('Duplicate Billing Protection', () => {
    it('returns an appropriate 409 HttpError for duplicate billing attempts', () => {
      const err = duplicateBillingError();
      assert.equal(err.status, 409);
      assert.match(err.message, /already exists/);
    });
  });

  describe('Discount Calculation and Evaluation', () => {
    const isDiscountEligible = (rule, subtotal, quantity, date) => {
      if (!rule.isActive) return false;
      if (new Date(date) < new Date(rule.validFrom)) return false;
      if (rule.validTo && new Date(date) > new Date(rule.validTo)) return false;
      if (rule.maxUses != null && rule.usesCount >= rule.maxUses) return false;
      if (rule.minPurchaseAmount != null && subtotal < rule.minPurchaseAmount) return false;
      if (rule.minQuantity != null && quantity < rule.minQuantity) return false;
      return true;
    };

    it('qualifies a valid discount within date and usage limits', () => {
      const rule = {
        isActive: true,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        maxUses: 100,
        usesCount: 5,
        minPurchaseAmount: 100,
        minQuantity: 2,
      };
      assert.equal(isDiscountEligible(rule, 150, 3, '2026-06-15'), true);
    });

    it('rejects a discount when subtotal is below minimum purchase amount', () => {
      const rule = {
        isActive: true,
        validFrom: '2026-01-01',
        maxUses: 100,
        usesCount: 5,
        minPurchaseAmount: 200,
      };
      assert.equal(isDiscountEligible(rule, 150, 3, '2026-06-15'), false);
    });

    it('rejects a discount when max uses limit is reached', () => {
      const rule = {
        isActive: true,
        validFrom: '2026-01-01',
        maxUses: 10,
        usesCount: 10,
      };
      assert.equal(isDiscountEligible(rule, 500, 5, '2026-06-15'), false);
    });
  });
});
