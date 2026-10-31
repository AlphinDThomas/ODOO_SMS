import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertCanAccessCustomerRecord,
  canAccessCustomerRecord,
} from '../src/modules/auth/auth.rbac.js';

describe('unauthorized customer access', () => {
  const customerA = { id: 'user-a', role: 'CUSTOMER', isActive: true, customer: { id: 'cust-a' } };
  const customerB = { id: 'user-b', role: 'CUSTOMER', isActive: true, customer: { id: 'cust-b' } };
  const staff = { id: 'staff-1', role: 'STAFF', isActive: true, customer: null };
  const admin = { id: 'admin-1', role: 'ADMIN', isActive: true, customer: null };

  it('allows a customer only their own customerId', () => {
    assert.equal(canAccessCustomerRecord(customerA, 'cust-a'), true);
    assert.equal(canAccessCustomerRecord(customerA, 'cust-b'), false);
    assert.throws(() => assertCanAccessCustomerRecord(customerB, 'cust-a'), /own records/);
  });

  it('allows staff and admin operational access', () => {
    assert.equal(canAccessCustomerRecord(staff, 'cust-a'), true);
    assert.equal(canAccessCustomerRecord(admin, 'cust-b'), true);
  });

  it('ignores a role field a client might send on the body', () => {
    const spoofed = { ...customerA, bodyRole: 'ADMIN' };
    assert.equal(canAccessCustomerRecord(spoofed, 'cust-b'), false);
  });
});
