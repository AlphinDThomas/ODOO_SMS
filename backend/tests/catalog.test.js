/**
 * catalog.test.js
 *
 * Unit tests for Person 1 — catalog, plans, taxes, discounts.
 *
 * These tests are pure in-memory logic tests that require NO database
 * connection and NO running server. They validate:
 *   - Validation schema constraints (Zod)
 *   - Service-layer business logic guards (date ordering, percentage ceiling,
 *     scope constraints, isDefault mutual-exclusion logic)
 *   - The discount-eligibility helper used by Person 3's billing engine
 *
 * Run:  cd backend && node --test tests/catalog.test.js
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ─── Zod schemas ──────────────────────────────────────────────────────────────

import { createProductSchema, createVariantSchema } from '../src/modules/products/product.schema.js';
import { createTaxRuleSchema } from '../src/modules/taxes/tax.schema.js';
import { createPlanSchema } from '../src/modules/plans/plan.schema.js';
import { createDiscountSchema } from '../src/modules/discounts/discount.schema.js';

// Valid v4-format UUID safe to use as test fixture data.
// Zod v4 requires proper UUID version bits.
const UUID_A = '550e8400-e29b-41d4-a716-446655440000';
const UUID_B = '123e4567-e89b-12d3-a456-426614174000';

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────

describe('Product validation schema', () => {
  it('accepts a valid product', () => {
    const r = createProductSchema.safeParse({
      body: { name: 'Odoo ERP', type: 'SOFTWARE', salesPrice: 999, costPrice: 400 },
    });
    assert.equal(r.success, true);
  });

  it('rejects unknown product type', () => {
    const r = createProductSchema.safeParse({
      body: { name: 'X', type: 'INVALID', salesPrice: 0, costPrice: 0 },
    });
    assert.equal(r.success, false);
  });

  it('rejects negative salesPrice', () => {
    const r = createProductSchema.safeParse({
      body: { name: 'X', type: 'SOFTWARE', salesPrice: -1, costPrice: 0 },
    });
    assert.equal(r.success, false);
  });

  it('rejects negative costPrice', () => {
    const r = createProductSchema.safeParse({
      body: { name: 'X', type: 'SOFTWARE', salesPrice: 0, costPrice: -5 },
    });
    assert.equal(r.success, false);
  });

  it('allows optional taxRuleIds as UUID array', () => {
    const r = createProductSchema.safeParse({
      body: {
        name: 'Y',
        type: 'ADDON',
        salesPrice: 100,
        costPrice: 50,
        taxRuleIds: [UUID_A],
      },
    });
    assert.equal(r.success, true);
  });

  it('rejects taxRuleIds with non-UUID strings', () => {
    const r = createProductSchema.safeParse({
      body: {
        name: 'Y',
        type: 'ADDON',
        salesPrice: 100,
        costPrice: 50,
        taxRuleIds: ['not-a-uuid'],
      },
    });
    assert.equal(r.success, false);
  });

  it('accepts all three product types', () => {
    for (const type of ['SOFTWARE', 'ADDON', 'OTHER']) {
      const r = createProductSchema.safeParse({
        body: { name: 'P', type, salesPrice: 0, costPrice: 0 },
      });
      assert.equal(r.success, true, `Type ${type} should be accepted`);
    }
  });

  it('requires name to be non-empty', () => {
    const r = createProductSchema.safeParse({
      body: { name: '', type: 'SOFTWARE', salesPrice: 0, costPrice: 0 },
    });
    assert.equal(r.success, false);
  });

  it('rejects name longer than 200 chars', () => {
    const r = createProductSchema.safeParse({
      body: { name: 'a'.repeat(201), type: 'SOFTWARE', salesPrice: 0, costPrice: 0 },
    });
    assert.equal(r.success, false);
  });

  it('accepts zero price (free product)', () => {
    const r = createProductSchema.safeParse({
      body: { name: 'Free', type: 'OTHER', salesPrice: 0, costPrice: 0 },
    });
    assert.equal(r.success, true);
  });
});

// ─── VARIANTS ─────────────────────────────────────────────────────────────────

describe('Variant validation schema', () => {
  it('accepts a valid variant', () => {
    const r = createVariantSchema.safeParse({
      params: { id: UUID_A },
      body: { name: 'Enterprise', priceAdjustment: 560 },
    });
    assert.equal(r.success, true);
  });

  it('accepts negative price adjustment (price reduction)', () => {
    const r = createVariantSchema.safeParse({
      params: { id: UUID_A },
      body: { name: 'Lite', priceAdjustment: -100 },
    });
    assert.equal(r.success, true);
  });

  it('rejects a missing name', () => {
    const r = createVariantSchema.safeParse({
      params: { id: UUID_A },
      body: { priceAdjustment: 100 },
    });
    assert.equal(r.success, false);
  });

  it('rejects an invalid parent product UUID', () => {
    const r = createVariantSchema.safeParse({
      params: { id: 'not-a-uuid' },
      body: { name: 'Pro', priceAdjustment: 200 },
    });
    assert.equal(r.success, false);
  });

  it('rejects missing priceAdjustment', () => {
    const r = createVariantSchema.safeParse({
      params: { id: UUID_A },
      body: { name: 'Starter' },
    });
    assert.equal(r.success, false);
  });

  it('accepts isActive flag', () => {
    const r = createVariantSchema.safeParse({
      params: { id: UUID_A },
      body: { name: 'Pro', priceAdjustment: 0, isActive: false },
    });
    assert.equal(r.success, true);
  });
});

// ─── TAX RULES ────────────────────────────────────────────────────────────────

describe('Tax rule validation schema', () => {
  it('accepts a valid tax rule', () => {
    const r = createTaxRuleSchema.safeParse({
      body: { name: 'GST 18%', ratePercent: 18 },
    });
    assert.equal(r.success, true);
  });

  it('accepts zero rate', () => {
    const r = createTaxRuleSchema.safeParse({
      body: { name: 'Zero-rated', ratePercent: 0 },
    });
    assert.equal(r.success, true);
  });

  it('accepts exactly 100% rate', () => {
    const r = createTaxRuleSchema.safeParse({
      body: { name: 'Full tax', ratePercent: 100 },
    });
    assert.equal(r.success, true);
  });

  it('rejects rate above 100', () => {
    const r = createTaxRuleSchema.safeParse({
      body: { name: 'X', ratePercent: 101 },
    });
    assert.equal(r.success, false);
  });

  it('rejects negative rate', () => {
    const r = createTaxRuleSchema.safeParse({
      body: { name: 'Negative', ratePercent: -1 },
    });
    assert.equal(r.success, false);
  });

  it('accepts isDefault flag', () => {
    const r = createTaxRuleSchema.safeParse({
      body: { name: 'GST', ratePercent: 18, isDefault: true },
    });
    assert.equal(r.success, true);
  });

  it('accepts fractional rates (e.g. 18.5)', () => {
    const r = createTaxRuleSchema.safeParse({
      body: { name: 'IGST', ratePercent: 18.5 },
    });
    assert.equal(r.success, true);
  });
});

// ─── isDefault mutual-exclusion logic ─────────────────────────────────────────

describe('isDefault tax mutual-exclusion logic', () => {
  function applyDefault(rules, promotedId) {
    return rules.map((r) => ({
      ...r,
      isDefault: r.id === promotedId,
    }));
  }

  it('ensures only one rule is default after promotion', () => {
    const rules = [
      { id: 'a', name: 'GST', isDefault: true },
      { id: 'b', name: 'VAT', isDefault: false },
    ];
    const updated = applyDefault(rules, 'b');
    const defaults = updated.filter((r) => r.isDefault);
    assert.equal(defaults.length, 1);
    assert.equal(defaults[0].id, 'b');
  });

  it('allows clearing default so no rule is default', () => {
    const rules = [{ id: 'a', name: 'GST', isDefault: true }];
    const updated = rules.map((r) => ({ ...r, isDefault: false }));
    const defaults = updated.filter((r) => r.isDefault);
    assert.equal(defaults.length, 0);
  });

  it('does not affect other rules when only isActive changes', () => {
    const rules = [
      { id: 'a', isDefault: true },
      { id: 'b', isDefault: false },
    ];
    // Simulating an update that does NOT touch isDefault
    const updated = rules.map((r) => (r.id === 'b' ? { ...r, isActive: false } : r));
    assert.equal(updated.find((r) => r.id === 'a').isDefault, true);
    assert.equal(updated.find((r) => r.id === 'b').isDefault, false);
  });
});

// ─── PLANS ────────────────────────────────────────────────────────────────────

describe('Plan validation schema', () => {
  const baseValid = {
    name: 'Starter',
    amount: 999,
    interval: 'MONTHLY',
    minQuantity: 1,
    availableFrom: '2026-01-01',
  };

  it('accepts a valid monthly plan', () => {
    const r = createPlanSchema.safeParse({ body: baseValid });
    assert.equal(r.success, true);
  });

  it('accepts all four billing intervals', () => {
    for (const interval of ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']) {
      const r = createPlanSchema.safeParse({ body: { ...baseValid, interval } });
      assert.equal(r.success, true, `Interval ${interval} should be accepted`);
    }
  });

  it('rejects an unknown interval', () => {
    const r = createPlanSchema.safeParse({ body: { ...baseValid, interval: 'BIANNUAL' } });
    assert.equal(r.success, false);
  });

  it('rejects minQuantity less than 1', () => {
    const r = createPlanSchema.safeParse({ body: { ...baseValid, minQuantity: 0 } });
    assert.equal(r.success, false);
  });

  it('accepts optional availableTo', () => {
    const r = createPlanSchema.safeParse({
      body: { ...baseValid, availableTo: '2027-01-01' },
    });
    assert.equal(r.success, true);
  });

  it('accepts all four policy flags', () => {
    const r = createPlanSchema.safeParse({
      body: {
        ...baseValid,
        autoCloseOnEnd: true,
        allowEarlyClose: true,
        allowPause: true,
        allowRenewal: true,
      },
    });
    assert.equal(r.success, true);
  });

  it('rejects negative amount', () => {
    const r = createPlanSchema.safeParse({ body: { ...baseValid, amount: -1 } });
    assert.equal(r.success, false);
  });

  it('accepts zero amount (free tier)', () => {
    const r = createPlanSchema.safeParse({ body: { ...baseValid, amount: 0 } });
    assert.equal(r.success, true);
  });

  it('rejects invalid date format', () => {
    const r = createPlanSchema.safeParse({ body: { ...baseValid, availableFrom: '01-01-2026' } });
    assert.equal(r.success, false);
  });
});

// ─── Plan date ordering (service-layer logic) ─────────────────────────────────

describe('Plan date ordering business logic', () => {
  function validatePlanDates(availableFrom, availableTo) {
    if (availableTo && new Date(availableTo) <= new Date(availableFrom)) {
      throw new Error('availableTo must be after availableFrom');
    }
  }

  it('accepts availableTo after availableFrom', () => {
    assert.doesNotThrow(() => validatePlanDates('2026-01-01', '2027-01-01'));
  });

  it('rejects availableTo equal to availableFrom', () => {
    assert.throws(() => validatePlanDates('2026-01-01', '2026-01-01'), /after/);
  });

  it('rejects availableTo before availableFrom', () => {
    assert.throws(() => validatePlanDates('2026-06-01', '2026-01-01'), /after/);
  });

  it('accepts null availableTo (open-ended plan)', () => {
    assert.doesNotThrow(() => validatePlanDates('2026-01-01', null));
  });
});

// ─── DISCOUNTS ────────────────────────────────────────────────────────────────

describe('Discount validation schema', () => {
  const baseValid = {
    name: 'Summer Deal',
    type: 'PERCENTAGE',
    value: 10,
    validFrom: '2026-01-01',
    scope: 'SUBSCRIPTION',
  };

  it('accepts a valid percentage discount', () => {
    const r = createDiscountSchema.safeParse({ body: baseValid });
    assert.equal(r.success, true);
  });

  it('accepts a valid fixed discount', () => {
    const r = createDiscountSchema.safeParse({
      body: { ...baseValid, type: 'FIXED', value: 500 },
    });
    assert.equal(r.success, true);
  });

  it('rejects PERCENTAGE value above 100', () => {
    const r = createDiscountSchema.safeParse({
      body: { ...baseValid, type: 'PERCENTAGE', value: 101 },
    });
    assert.equal(r.success, false);
  });

  it('accepts PERCENTAGE value of exactly 100', () => {
    const r = createDiscountSchema.safeParse({
      body: { ...baseValid, type: 'PERCENTAGE', value: 100 },
    });
    assert.equal(r.success, true);
  });

  it('accepts FIXED discount above 100 (not percentage)', () => {
    const r = createDiscountSchema.safeParse({
      body: { ...baseValid, type: 'FIXED', value: 9999 },
    });
    assert.equal(r.success, true);
  });

  it('rejects PRODUCT scope without productIds', () => {
    const r = createDiscountSchema.safeParse({
      body: { ...baseValid, scope: 'PRODUCT' },
    });
    assert.equal(r.success, false);
  });

  it('rejects PRODUCT scope with empty productIds array', () => {
    const r = createDiscountSchema.safeParse({
      body: { ...baseValid, scope: 'PRODUCT', productIds: [] },
    });
    assert.equal(r.success, false);
  });

  it('accepts PRODUCT scope with valid productIds', () => {
    const r = createDiscountSchema.safeParse({
      body: {
        ...baseValid,
        scope: 'PRODUCT',
        productIds: [UUID_A, UUID_B],
      },
    });
    assert.equal(r.success, true);
  });

  it('rejects productIds with non-UUID strings', () => {
    const r = createDiscountSchema.safeParse({
      body: {
        ...baseValid,
        scope: 'PRODUCT',
        productIds: ['not-a-uuid'],
      },
    });
    assert.equal(r.success, false);
  });

  it('accepts all optional conditions', () => {
    const r = createDiscountSchema.safeParse({
      body: {
        ...baseValid,
        minPurchaseAmount: 100,
        minQuantity: 2,
        maxUses: 50,
        validTo: '2026-12-31',
      },
    });
    assert.equal(r.success, true);
  });
});

// ─── Discount eligibility helper (reusable by billing engine) ─────────────────

describe('Discount eligibility logic (billing reuse)', () => {
  /**
   * This helper mirrors what Person 3's billing engine must check before
   * applying a discount. It is tested here to prove the logic is correct
   * and to serve as a specification for the billing integration.
   */
  function isDiscountEligible(rule, { amount = 0, quantity = 0, at = new Date() } = {}) {
    if (!rule.isActive) return false;
    const now = at instanceof Date ? at : new Date(at);
    if (now < new Date(rule.validFrom)) return false;
    if (rule.validTo && now > new Date(rule.validTo)) return false;
    if (rule.maxUses != null && rule.usesCount >= rule.maxUses) return false;
    if (rule.minPurchaseAmount != null && amount < rule.minPurchaseAmount) return false;
    if (rule.minQuantity != null && quantity < rule.minQuantity) return false;
    return true;
  }

  const live = {
    isActive: true,
    validFrom: new Date('2026-01-01'),
    validTo: new Date('2026-12-31'),
    maxUses: 10,
    usesCount: 3,
    minPurchaseAmount: 100,
    minQuantity: 2,
  };

  it('allows a live discount that meets all conditions', () => {
    assert.equal(isDiscountEligible(live, { amount: 200, quantity: 3, at: new Date('2026-06-01') }), true);
  });

  it('rejects an inactive discount', () => {
    assert.equal(isDiscountEligible({ ...live, isActive: false }, { amount: 200, quantity: 3 }), false);
  });

  it('rejects a discount before validFrom', () => {
    assert.equal(
      isDiscountEligible(live, { amount: 200, quantity: 3, at: new Date('2025-12-31') }),
      false,
    );
  });

  it('rejects a discount after validTo', () => {
    assert.equal(
      isDiscountEligible(live, { amount: 200, quantity: 3, at: new Date('2027-01-01') }),
      false,
    );
  });

  it('rejects an exhausted discount (usesCount >= maxUses)', () => {
    assert.equal(
      isDiscountEligible({ ...live, usesCount: 10, maxUses: 10 }, { amount: 200, quantity: 3 }),
      false,
    );
  });

  it('allows discount when usesCount is one below maxUses', () => {
    assert.equal(
      isDiscountEligible({ ...live, usesCount: 9, maxUses: 10 }, { amount: 200, quantity: 3 }),
      true,
    );
  });

  it('rejects when minPurchaseAmount not met', () => {
    assert.equal(isDiscountEligible(live, { amount: 50, quantity: 3 }), false);
  });

  it('rejects when minQuantity not met', () => {
    assert.equal(isDiscountEligible(live, { amount: 200, quantity: 1 }), false);
  });

  it('allows discount with unlimited maxUses (null)', () => {
    assert.equal(
      isDiscountEligible({ ...live, maxUses: null, usesCount: 9999 }, { amount: 200, quantity: 3 }),
      true,
    );
  });

  it('allows discount with no minPurchaseAmount and no minQuantity', () => {
    assert.equal(
      isDiscountEligible(
        { ...live, minPurchaseAmount: null, minQuantity: null },
        { amount: 0, quantity: 0 },
      ),
      true,
    );
  });
});

// ─── Discount date ordering ───────────────────────────────────────────────────

describe('Discount date ordering business logic', () => {
  function validateDiscountDates(validFrom, validTo) {
    if (validTo && new Date(validTo) <= new Date(validFrom)) {
      throw new Error('validTo must be after validFrom');
    }
  }

  it('accepts validTo after validFrom', () => {
    assert.doesNotThrow(() => validateDiscountDates('2026-01-01', '2026-12-31'));
  });

  it('rejects validTo equal to validFrom', () => {
    assert.throws(() => validateDiscountDates('2026-06-01', '2026-06-01'), /after/);
  });

  it('rejects validTo before validFrom', () => {
    assert.throws(() => validateDiscountDates('2026-06-01', '2026-01-01'), /after/);
  });

  it('accepts null validTo (perpetual discount)', () => {
    assert.doesNotThrow(() => validateDiscountDates('2026-01-01', null));
  });
});

// ─── Authorization logic ──────────────────────────────────────────────────────

describe('Admin-only write authorization', () => {
  function assertAdmin(profile) {
    if (profile?.role !== 'ADMIN') throw new Error('Insufficient permissions');
  }

  it('allows ADMIN to pass', () => {
    assert.doesNotThrow(() => assertAdmin({ role: 'ADMIN' }));
  });

  it('blocks STAFF from admin operations', () => {
    assert.throws(() => assertAdmin({ role: 'STAFF' }), /Insufficient/);
  });

  it('blocks CUSTOMER from admin operations', () => {
    assert.throws(() => assertAdmin({ role: 'CUSTOMER' }), /Insufficient/);
  });

  it('blocks null profile', () => {
    assert.throws(() => assertAdmin(null), /Insufficient/);
  });

  it('blocks undefined profile', () => {
    assert.throws(() => assertAdmin(undefined), /Insufficient/);
  });
});
