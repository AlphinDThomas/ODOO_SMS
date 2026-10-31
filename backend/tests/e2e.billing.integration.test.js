import assert from 'node:assert/strict';
import { prisma } from '../src/config/prisma.js';
import { authClient, adminAuthClient } from '../src/config/supabase.js';
import { runBillingCycle } from '../src/modules/billing/billing.engine.js';
import * as invoicesService from '../src/modules/invoices/invoices.service.js';
import * as paymentsService from '../src/modules/payments/payments.service.js';
import { toUtcDate } from '../src/utils/dates.js';

async function runE2EAudit() {
  console.log('====================================================');
  console.log('🚀 STARTING PERSON 3 E2E INTEGRATION AUDIT & TESTS');
  console.log('====================================================\n');

  let testAdminUser;
  let testCustomerUser;
  let testCustomerId;
  let testProductId;
  let testVariantId;
  let testTaxRuleId;
  let testPlanId;
  let testDiscountRuleId;
  let testSubscriptionId;
  let generatedInvoiceId;

  try {
    // ----------------------------------------------------
    // 1. SETUP ACTORS & RBAC
    // ----------------------------------------------------
    console.log('--- 1. Verifying System Actors & RBAC ---');
    testAdminUser = await prisma.userProfile.findFirst({
      where: { role: 'ADMIN', email: 'admin@brightloop.com' },
      include: { customer: true }
    });
    assert.ok(testAdminUser, 'Admin profile must exist');
    console.log('✓ Admin user profile found:', testAdminUser.email);

    testCustomerUser = await prisma.userProfile.findFirst({
      where: { role: 'CUSTOMER', email: 'customer@brightloop.com' },
      include: { customer: true }
    });
    assert.ok(testCustomerUser, 'Customer profile must exist');
    testCustomerId = testCustomerUser.customer.id;
    console.log('✓ Customer user profile found:', testCustomerUser.email, 'CustomerID:', testCustomerId);

    // ----------------------------------------------------
    // 2. SETUP CATALOG & PRICING: Product, Variant, Tax, Plan, Discount
    // ----------------------------------------------------
    console.log('\n--- 2. Setting Up Test Catalog, Tax, Plan & Discount ---');
    
    // Tax Rule: 10%
    const taxRule = await prisma.taxRule.create({
      data: {
        name: 'E2E Test VAT 10%',
        ratePercent: 10.0,
        isDefault: true,
      }
    });
    testTaxRuleId = taxRule.id;
    console.log('✓ Created TaxRule (10%):', taxRule.name);

    // Product with variant
    const product = await prisma.product.create({
      data: {
        name: 'Brightloop CRM Pro',
        type: 'SOFTWARE',
        salesPrice: 100.0,
        costPrice: 20.0,
        taxRules: {
          create: [{ taxRuleId: testTaxRuleId }]
        },
        variants: {
          create: [{
            name: 'Odoo Edition',
            priceAdjustment: 50.0 // Base 100 + 50 = 150 per seat
          }]
        }
      },
      include: { variants: true }
    });
    testProductId = product.id;
    testVariantId = product.variants[0].id;
    console.log('✓ Created Product & Variant (CRM Pro + Odoo Edition): Unit price 150.00');

    // Plan: Monthly, 30 days
    const plan = await prisma.plan.create({
      data: {
        name: 'CRM Pro Monthly Plan',
        amount: 150.0,
        interval: 'MONTHLY',
        availableFrom: new Date('2026-01-01'),
        autoCloseOnEnd: true,
      }
    });
    testPlanId = plan.id;
    console.log('✓ Created Plan (Monthly):', plan.name);

    // Discount Rule: 20% off for subscriptions
    const discount = await prisma.discountRule.create({
      data: {
        name: 'E2E 20% Early Adopter Discount',
        type: 'PERCENTAGE',
        value: 20.0, // 20%
        scope: 'SUBSCRIPTION',
        validFrom: new Date('2026-01-01'),
        validTo: new Date('2026-12-31'),
        maxUses: 10,
        usesCount: 0,
      }
    });
    testDiscountRuleId = discount.id;
    console.log('✓ Created Discount Rule (20% off):', discount.name);

    // ----------------------------------------------------
    // 3. SETUP ACTIVE SUBSCRIPTION DUE FOR BILLING
    // ----------------------------------------------------
    console.log('\n--- 3. Setting Up Active Subscription ---');
    const startDate = new Date('2026-10-01T00:00:00Z');
    const expiryDate = new Date('2027-10-01T00:00:00Z');
    
    // 2 seats @ 150.00 = 300.00 subtotal
    // 20% discount = -60.00 -> taxable = 240.00
    // 10% tax on 240.00 = 24.00
    // Expected Grand Total = 264.00
    const subscription = await prisma.subscription.create({
      data: {
        number: `SUB-AUDIT-${Date.now().toString().slice(-4)}`,
        customerId: testCustomerId,
        planId: testPlanId,
        status: 'ACTIVE',
        startDate,
        expiryDate,
        billingInterval: 'MONTHLY',
        nextBillingDate: startDate, // Due on start date
        quotationValidityDays: 15,
        createdById: testAdminUser.id,
        lines: {
          create: [{
            productId: testProductId,
            variantId: testVariantId,
            quantity: 2,
            unitPrice: 150.0,
            taxRatePercent: 10.0,
            lineAmount: 300.0,
          }]
        },
        discounts: {
          create: [{
            discountId: testDiscountRuleId,
            isActive: true,
          }]
        }
      }
    });
    testSubscriptionId = subscription.id;
    console.log(`✓ Created Active Subscription: ${subscription.number} (Due: ${startDate.toISOString().split('T')[0]})`);

    // ----------------------------------------------------
    // 4. TEST AUTOMATED RECURRING BILLING ENGINE
    // ----------------------------------------------------
    console.log('\n--- 4. Executing Billing Run (Engine Test) ---');
    const billingRunResult = await runBillingCycle({
      asOfDate: new Date('2026-10-15T00:00:00Z'),
      subscriptionId: testSubscriptionId,
      actorId: testAdminUser.id,
    });

    console.log('Billing Run Output:', JSON.stringify(billingRunResult, null, 2));
    assert.equal(billingRunResult.createdInvoices.length, 1, 'Must create exactly 1 invoice');
    const createdInvSummary = billingRunResult.createdInvoices[0];
    generatedInvoiceId = createdInvSummary.invoiceId;

    // Verify Invoice Calculations in Database
    const invoice = await prisma.invoice.findUnique({
      where: { id: generatedInvoiceId },
      include: { lines: true, customer: true, billingRecord: true }
    });

    assert.ok(invoice, 'Generated invoice must exist in database');
    console.log(`✓ Invoice Created: ${invoice.number} (Status: ${invoice.status})`);
    console.log(`  Subtotal:       $${Number(invoice.subtotal).toFixed(2)} (Expected: $300.00)`);
    console.log(`  Discount Total: -$${Number(invoice.discountTotal).toFixed(2)} (Expected: -$60.00)`);
    console.log(`  Tax Total:      +$${Number(invoice.taxTotal).toFixed(2)} (Expected: +$24.00)`);
    console.log(`  Grand Total:    $${Number(invoice.grandTotal).toFixed(2)} (Expected: $264.00)`);
    console.log(`  Balance Due:    $${Number(invoice.balanceDue).toFixed(2)} (Expected: $264.00)`);

    assert.equal(Number(invoice.subtotal), 300.0, 'Subtotal must match');
    assert.equal(Number(invoice.discountTotal), 60.0, 'Discount must be 20% of 300 = 60');
    assert.equal(Number(invoice.taxTotal), 24.0, 'Tax must be 10% of 240 = 24');
    assert.equal(Number(invoice.grandTotal), 264.0, 'Grand total must be 300 - 60 + 24 = 264');
    assert.equal(Number(invoice.balanceDue), 264.0, 'Balance due must equal grand total');
    assert.equal(invoice.status, 'CONFIRMED', 'Status must be CONFIRMED');
    assert.ok(invoice.billingRecord, 'Must have linked BillingRecord');

    // Verify Subscription schedule was advanced
    const updatedSub = await prisma.subscription.findUnique({ where: { id: testSubscriptionId } });
    const expectedNextDate = new Date('2026-11-01T00:00:00Z');
    console.log(`✓ Subscription Next Billing Date advanced to: ${updatedSub.nextBillingDate.toISOString().split('T')[0]}`);
    assert.equal(
      updatedSub.nextBillingDate.toISOString().split('T')[0],
      expectedNextDate.toISOString().split('T')[0],
      'Next billing date must advance by 1 month'
    );

    // Verify Discount usage counter was incremented
    const updatedDiscount = await prisma.discountRule.findUnique({ where: { id: testDiscountRuleId } });
    assert.equal(updatedDiscount.usesCount, 1, 'Discount rule usesCount must increment by 1');
    console.log('✓ Discount usage counter incremented to:', updatedDiscount.usesCount);

    // ----------------------------------------------------
    // 5. TEST IDEMPOTENCY: Re-running billing for same period
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Idempotency (Duplicate Prevention) ---');
    const duplicateRun = await runBillingCycle({
      asOfDate: new Date('2026-10-15T00:00:00Z'),
      subscriptionId: testSubscriptionId,
    });
    assert.equal(duplicateRun.createdInvoices.length, 0, 'Must NOT create duplicate invoice');
    console.log('✓ Duplicate billing skipped cleanly:', duplicateRun.skipped[0]?.reason || 'Already billed');

    // ----------------------------------------------------
    // 6. TEST INVOICE LISTING & FILTERS
    // ----------------------------------------------------
    console.log('\n--- 6. Testing Invoices Service (List & Filters) ---');
    const listResult = await invoicesService.listInvoices({
      actor: testAdminUser,
      page: 1,
      pageSize: 10,
      status: 'CONFIRMED',
    });
    assert.ok(listResult.invoices.some(inv => inv.id === generatedInvoiceId), 'Invoice must appear in CONFIRMED list');
    assert.ok(listResult.metrics.totalDue > 0, 'Metrics totalDue must reflect outstanding balance');
    console.log(`✓ Invoice list retrieved ${listResult.invoices.length} invoices. Total Due: $${listResult.metrics.totalDue.toFixed(2)}`);

    // ----------------------------------------------------
    // 7. TEST SEND INVOICE
    // ----------------------------------------------------
    console.log('\n--- 7. Testing Send Invoice ---');
    const sendResult = await invoicesService.sendInvoice(generatedInvoiceId);
    assert.ok(sendResult.sentAt, 'sentAt must be recorded');
    console.log(`✓ Invoice marked sent: ${sendResult.message}`);

    // ----------------------------------------------------
    // 8. TEST PARTIAL PAYMENT
    // ----------------------------------------------------
    console.log('\n--- 8. Testing Partial Payment ---');
    // Balance is 264.00. Pay 100.00
    const partialPaymentResult = await paymentsService.recordPayment({
      actor: testAdminUser,
      invoiceId: generatedInvoiceId,
      amount: 100.0,
      method: 'BANK_TRANSFER',
      note: 'Wire payment installment 1',
    });

    console.log('Partial Payment Output:', {
      paymentAmount: partialPaymentResult.payment.amount,
      newInvoiceStatus: partialPaymentResult.invoice.status,
      amountPaid: partialPaymentResult.invoice.amountPaid,
      balanceDue: partialPaymentResult.invoice.balanceDue,
    });

    assert.equal(partialPaymentResult.invoice.status, 'PARTIALLY_PAID', 'Status must be PARTIALLY_PAID');
    assert.equal(Number(partialPaymentResult.invoice.amountPaid), 100.0, 'Amount paid must be 100.00');
    assert.equal(Number(partialPaymentResult.invoice.balanceDue), 164.0, 'Balance due must be 164.00 (264 - 100)');
    console.log('✓ Partial payment recorded successfully. New status: PARTIALLY_PAID');

    // ----------------------------------------------------
    // 9. TEST OVERPAYMENT REJECTION
    // ----------------------------------------------------
    console.log('\n--- 9. Testing Overpayment Protection ---');
    // Remaining balance is 164.00. Try to pay 200.00
    await assert.rejects(
      async () => {
        await paymentsService.recordPayment({
          actor: testAdminUser,
          invoiceId: generatedInvoiceId,
          amount: 200.0, // Exceeds 164.00
          method: 'CARD',
        });
      },
      /exceeds/,
      'Must reject payment exceeding outstanding balance'
    );
    console.log('✓ Overpayment was correctly blocked with error message');

    // ----------------------------------------------------
    // 10. TEST FULL / REMAINING SETTLEMENT
    // ----------------------------------------------------
    console.log('\n--- 10. Testing Final Payment (Full Settlement) ---');
    // Pay remaining 164.00
    const finalPaymentResult = await paymentsService.recordPayment({
      actor: testAdminUser,
      invoiceId: generatedInvoiceId,
      amount: 164.0,
      method: 'UPI',
      note: 'UPI balance settlement',
    });

    assert.equal(finalPaymentResult.invoice.status, 'PAID', 'Status must transition to PAID');
    assert.equal(Number(finalPaymentResult.invoice.amountPaid), 264.0, 'Amount paid must equal grand total 264.00');
    assert.equal(Number(finalPaymentResult.invoice.balanceDue), 0.0, 'Balance due must be exactly 0.00');
    console.log('✓ Full settlement recorded! Invoice status transitioned to: PAID');

    // ----------------------------------------------------
    // 11. TEST CANCEL PROTECTION ON PAID INVOICE
    // ----------------------------------------------------
    console.log('\n--- 11. Testing Cancel Protection on Settled Invoice ---');
    await assert.rejects(
      async () => {
        await invoicesService.cancelInvoice(generatedInvoiceId);
      },
      /fully paid|payments/,
      'Must NOT allow cancelling a paid invoice'
    );
    console.log('✓ Cancellation correctly rejected on paid invoice');

    // ----------------------------------------------------
    // 12. TEST CUSTOMER PORTAL PRIVACY & RBAC
    // ----------------------------------------------------
    console.log('\n--- 12. Testing Customer Portal Isolation (RBAC) ---');
    // Customer query should find this invoice because customerId matches
    const customerInvoices = await invoicesService.listInvoices({
      actor: testCustomerUser,
    });
    assert.ok(
      customerInvoices.invoices.some(inv => inv.id === generatedInvoiceId),
      'Customer must see their own invoice'
    );
    console.log(`✓ Customer accessed their own invoice list (${customerInvoices.invoices.length} found)`);

    // Verify customer cannot see invoices belonging to another customer
    const dummyActorCustomer2 = {
      role: 'CUSTOMER',
      customer: { id: '00000000-0000-0000-0000-000000000000' }
    };
    const foreignInvoices = await invoicesService.listInvoices({
      actor: dummyActorCustomer2,
    });
    assert.equal(
      foreignInvoices.invoices.some(inv => inv.id === generatedInvoiceId),
      false,
      'Another customer must NOT see this invoice'
    );

    // Verify foreign customer cannot fetch invoice by ID
    await assert.rejects(
      async () => {
        await invoicesService.getInvoiceById(generatedInvoiceId, dummyActorCustomer2);
      },
      /own invoices|Insufficient/,
      'Customer must NOT be able to view another customer invoice'
    );
    console.log('✓ Tenant isolation confirmed: Foreign customer blocked with 403 Forbidden');

    console.log('\n====================================================');
    console.log('🎉 ALL 12 AUDIT TESTS PASSED WITH 100% SUCCESS!');
    console.log('====================================================');

  } finally {
    // ----------------------------------------------------
    // 13. CLEANUP TEST DATA
    // ----------------------------------------------------
    console.log('\n--- 13. Cleaning Up E2E Test Data ---');
    if (generatedInvoiceId) {
      await prisma.payment.deleteMany({ where: { invoiceId: generatedInvoiceId } });
      await prisma.billingAttempt.deleteMany({ where: { subscriptionId: testSubscriptionId } });
      await prisma.billingRecord.deleteMany({ where: { subscriptionId: testSubscriptionId } });
      await prisma.invoiceLine.deleteMany({ where: { invoiceId: generatedInvoiceId } });
      await prisma.invoice.deleteMany({ where: { id: generatedInvoiceId } });
    }
    if (testSubscriptionId) {
      await prisma.subscriptionDiscount.deleteMany({ where: { subscriptionId: testSubscriptionId } });
      await prisma.subscriptionLine.deleteMany({ where: { subscriptionId: testSubscriptionId } });
      await prisma.subscription.deleteMany({ where: { id: testSubscriptionId } });
    }
    if (testDiscountRuleId) {
      await prisma.discountRule.deleteMany({ where: { id: testDiscountRuleId } });
    }
    if (testPlanId) {
      await prisma.plan.deleteMany({ where: { id: testPlanId } });
    }
    if (testProductId) {
      await prisma.productTaxRule.deleteMany({ where: { productId: testProductId } });
      await prisma.productVariant.deleteMany({ where: { productId: testProductId } });
      await prisma.product.deleteMany({ where: { id: testProductId } });
    }
    if (testTaxRuleId) {
      await prisma.taxRule.deleteMany({ where: { id: testTaxRuleId } });
    }
    await prisma.$disconnect();
    console.log('✓ Test data cleaned up successfully');
  }
}

runE2EAudit().catch(err => {
  console.error('E2E Audit Failed:', err);
  process.exit(1);
});
