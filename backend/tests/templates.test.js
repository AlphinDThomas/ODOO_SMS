import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTemplateSchema } from '../src/modules/templates/templates.schema.js';

describe('quotation template schemas and validation', () => {
  it('validates template with valid plan and lines', () => {
    const valid = createTemplateSchema.safeParse({
      body: {
        name: 'Enterprise SaaS Template',
        planId: '099e349b-d2b2-4f46-9584-287f79b7ae94',
        validityDays: 30,
        lines: [
          {
            productId: '609e0912-cd3a-4377-b569-9169c7d58711',
            quantity: 2,
            unitPrice: 500,
          },
        ],
      },
    });
    assert.equal(valid.success, true);
    assert.equal(valid.data.body.lines.length, 1);
    assert.equal(valid.data.body.lines[0].quantity, 2);
  });

  it('rejects template without lines or with negative price/quantity', () => {
    const emptyLines = createTemplateSchema.safeParse({
      body: {
        name: 'Empty Template',
        planId: '099e349b-d2b2-4f46-9584-287f79b7ae94',
        validityDays: 15,
        lines: [],
      },
    });
    assert.equal(emptyLines.success, false);

    const negativePrice = createTemplateSchema.safeParse({
      body: {
        name: 'Negative Template',
        planId: '099e349b-d2b2-4f46-9584-287f79b7ae94',
        validityDays: 15,
        lines: [
          {
            productId: '609e0912-cd3a-4377-b569-9169c7d58711',
            quantity: 1,
            unitPrice: -50,
          },
        ],
      },
    });
    assert.equal(negativePrice.success, false);
  });
});
