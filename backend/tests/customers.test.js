import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createCustomerSchema, updateCustomerSchema } from '../src/modules/customers/customers.schema.js';

describe('customer validation and schemas', () => {
  it('validates required customer fields', () => {
    const valid = createCustomerSchema.safeParse({
      body: {
        companyName: 'Brightloop Corp',
        billingEmail: 'billing@brightloop.com',
        phone: '+1 800-555-0100',
        city: 'San Francisco',
        country: 'USA',
      },
    });
    assert.equal(valid.success, true);
    assert.equal(valid.data.body.companyName, 'Brightloop Corp');
    assert.equal(valid.data.body.billingEmail, 'billing@brightloop.com');
  });

  it('rejects missing company name or invalid email', () => {
    const invalidEmail = createCustomerSchema.safeParse({
      body: {
        companyName: 'Acme',
        billingEmail: 'not-an-email',
      },
    });
    assert.equal(invalidEmail.success, false);

    const missingCompany = createCustomerSchema.safeParse({
      body: {
        companyName: '',
        billingEmail: 'valid@example.com',
      },
    });
    assert.equal(missingCompany.success, false);
  });

  it('validates customer update parameters', () => {
    const valid = updateCustomerSchema.safeParse({
      params: { id: 'a7811581-65dc-4ea1-bbfb-5816dac68db6' },
      body: { phone: '+1 555-9999' },
    });
    assert.equal(valid.success, true);

    const invalidUuid = updateCustomerSchema.safeParse({
      params: { id: 'invalid-id' },
      body: { phone: '+1 555-9999' },
    });
    assert.equal(invalidUuid.success, false);
  });
});
