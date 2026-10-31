import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/config/prisma.js';
import * as subService from '../src/modules/subscriptions/subscriptions.service.js';
import * as portalService from '../src/modules/portal/portal.service.js';

describe('Customer Subscription Purchase, Pause, Resume, and Cancellation Lifecycle E2E', () => {
  let customerUser;
  let customerProfile;
  let testPlan;
  let testProduct;

  it('sets up customer profile, test plan (allowing pause and early close), and product', async () => {
    // 1. Find or create customer user profile
    const existing = await prisma.userProfile.findFirst({
      where: { role: 'CUSTOMER' },
      include: { customer: true },
    });

    if (existing && existing.customer) {
      customerUser = existing;
      customerProfile = existing.customer;
    } else {
      customerUser = await prisma.userProfile.create({
        data: {
          id: 'test-cust-' + Date.now(),
          email: `cust-${Date.now()}@brightloop.test`,
          role: 'CUSTOMER',
        },
      });
      customerProfile = await prisma.customer.create({
        data: {
          userId: customerUser.id,
          name: 'Test Customer E2E',
          companyName: 'Brightloop Client Corp',
          email: customerUser.email,
        },
      });
    }

    // 2. Create test plan with allowPause: true, allowEarlyClose: true
    testPlan = await prisma.plan.create({
      data: {
        name: 'E2E Customer Test Plan ' + Date.now(),
        interval: 'MONTHLY',
        amount: 89.0,
        minQuantity: 1,
        availableFrom: new Date(),
        allowPause: true,
        allowEarlyClose: true,
        allowRenewal: true,
      },
    });

    // 3. Find or create active product
    testProduct = await prisma.product.findFirst({
      where: { isActive: true },
    });
    if (!testProduct) {
      testProduct = await prisma.product.create({
        data: {
          name: 'E2E Test Product',
          type: 'SOFTWARE',
          salesPrice: 49.0,
          costPrice: 15.0,
          isActive: true,
        },
      });
    }

    assert.ok(customerProfile.id, 'Customer profile must exist');
    assert.ok(testPlan.id, 'Test plan must exist');
    assert.ok(testProduct.id, 'Test product must exist');
  });

  let createdSub;

  it('1. Customer purchases/requests subscription via self-service API', async () => {
    const actor = {
      id: customerUser.id,
      role: 'CUSTOMER',
      customer: customerProfile,
    };

    // Customer places order
    const payload = {
      customerId: customerProfile.id,
      planId: testPlan.id,
      lines: [
        {
          productId: testProduct.id,
          quantity: 2,
          unitPrice: Number(testProduct.salesPrice),
        },
      ],
    };

    createdSub = await subService.createSubscription(payload, actor);
    assert.ok(createdSub.id);
    assert.equal(createdSub.customerId, customerProfile.id);
    assert.equal(createdSub.status, 'DRAFT');

    // Submit quotation
    const quote = await subService.submitQuotation(createdSub.id, actor);
    assert.equal(quote.status, 'QUOTATION');
  });

  it('2. Customer views subscription quotation in portal', async () => {
    const list = await portalService.getCustomerSubscriptions(customerProfile.id);
    const found = list.find((s) => s.id === createdSub.id);
    assert.ok(found, 'Subscription quotation must be visible in customer portal');
    assert.equal(found.status, 'QUOTATION');
    assert.equal(found.lines.length, 1);
    assert.equal(found.lines[0].quantity, 2);
  });

  it('3. Customer accepts quotation and transitions to CONFIRMED', async () => {
    const accepted = await portalService.acceptCustomerQuotation({
      subscriptionId: createdSub.id,
      customerId: customerProfile.id,
      actorId: customerUser.id,
    });
    assert.equal(accepted.status, 'CONFIRMED');
    assert.ok(accepted.acceptedAt);
    assert.equal(accepted.acceptedById, customerUser.id);
  });

  it('4. Customer activates confirmed subscription into ACTIVE recurring state', async () => {
    const actor = {
      id: customerUser.id,
      role: 'CUSTOMER',
      customer: customerProfile,
    };

    const activated = await subService.activateSubscription(createdSub.id, actor);
    assert.equal(activated.status, 'ACTIVE');
    assert.ok(activated.nextBillingDate, 'nextBillingDate must be populated on activation');
  });

  it('5. Customer pauses subscription (governed by plan.allowPause)', async () => {
    const actor = {
      id: customerUser.id,
      role: 'CUSTOMER',
      customer: customerProfile,
    };

    const paused = await subService.pauseSubscription(createdSub.id, 'Temporary client vacation', actor);
    assert.equal(paused.status, 'PAUSED');
    assert.ok(paused.pausedAt, 'pausedAt timestamp must be recorded');
  });

  it('6. Customer resumes subscription and recalculates next billing date', async () => {
    const actor = {
      id: customerUser.id,
      role: 'CUSTOMER',
      customer: customerProfile,
    };

    const resumed = await subService.resumeSubscription(createdSub.id, actor);
    assert.equal(resumed.status, 'ACTIVE');
    assert.equal(resumed.pausedAt, null, 'pausedAt must be cleared on resume');
    assert.ok(resumed.nextBillingDate);
  });

  it('7. Rejects unauthorized cancellation if plan policy disallows early close', async () => {
    // Create strict plan where allowEarlyClose is false
    const strictPlan = await prisma.plan.create({
      data: {
        name: 'Strict 1-Yr Fixed Plan ' + Date.now(),
        interval: 'YEARLY',
        amount: 999.0,
        availableFrom: new Date(),
        allowEarlyClose: false,
      },
    });

    const actor = {
      id: customerUser.id,
      role: 'CUSTOMER',
      customer: customerProfile,
    };

    const strictSub = await subService.createSubscription(
      { customerId: customerProfile.id, planId: strictPlan.id },
      actor,
    );
    await subService.activateSubscription(strictSub.id, actor);

    // Attempting early close must throw 400 error
    await assert.rejects(
      async () => {
        await subService.closeSubscription(strictSub.id, 'I want to break contract', actor);
      },
      (err) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /not permit early closure/);
        return true;
      },
    );

    // Cleanup strict sub
    await prisma.subscriptionLine.deleteMany({ where: { subscriptionId: strictSub.id } });
    await prisma.subscription.delete({ where: { id: strictSub.id } });
    await prisma.plan.delete({ where: { id: strictPlan.id } });
  });

  it('8. Customer successfully cancels subscription when plan allows early close', async () => {
    const actor = {
      id: customerUser.id,
      role: 'CUSTOMER',
      customer: customerProfile,
    };

    const closed = await subService.closeSubscription(
      createdSub.id,
      'Downsizing team requirement',
      actor,
    );
    assert.equal(closed.status, 'CLOSED');
    assert.ok(closed.closedAt, 'closedAt must be populated');
    assert.equal(closed.closeReason, 'Downsizing team requirement');
  });

  it('9. Isolation: Customer cannot cancel another customer subscription', async () => {
    const anotherCustomer = await prisma.customer.create({
      data: {
        companyName: 'Other Tenant Inc',
        billingEmail: `billing-${Date.now()}@example.com`,
      },
    });

    const maliciousActor = {
      id: 'attacker-id',
      role: 'CUSTOMER',
      customer: anotherCustomer,
    };

    await assert.rejects(
      async () => {
        await subService.closeSubscription(createdSub.id, 'Malicious cancel', maliciousActor);
      },
      (err) => {
        assert.equal(err.status, 403);
        assert.match(err.message, /only cancel your own/);
        return true;
      },
    );

    // Cleanup
    await prisma.customer.delete({ where: { id: anotherCustomer.id } });
  });

  it('cleans up test subscription and plan', async () => {
    await prisma.subscriptionLine.deleteMany({ where: { subscriptionId: createdSub.id } });
    await prisma.subscription.delete({ where: { id: createdSub.id } });
    await prisma.plan.delete({ where: { id: testPlan.id } });
  });
});
