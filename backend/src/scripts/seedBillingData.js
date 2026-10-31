import { prisma } from '../config/prisma.js';
import { addDays, toUtcDate } from '../utils/dates.js';

async function seedBillingData() {
  console.log('Seeding rich test billing data for Brightloop Software...');

  // 1. Admin user
  const admin = await prisma.userProfile.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    throw new Error('Admin user profile not found. Run seedUsers.js first.');
  }

  // 2. Tax Rules
  console.log('1. Creating Tax Rules...');
  const vat18 = await prisma.taxRule.upsert({
    where: { id: '00000000-0000-0000-0000-000000000018' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000018',
      name: 'Standard GST / VAT (18%)',
      ratePercent: 18.0,
      isDefault: true,
      isActive: true,
    },
  });

  const vat5 = await prisma.taxRule.upsert({
    where: { id: '00000000-0000-0000-0000-000000000005' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000005',
      name: 'Reduced Tech Tax (5%)',
      ratePercent: 5.0,
      isDefault: false,
      isActive: true,
    },
  });

  // 3. Products & Variants
  console.log('2. Creating Products & Variants...');
  let crmProduct = await prisma.product.findFirst({ where: { name: 'Brightloop CRM Pro' } });
  if (!crmProduct) {
    crmProduct = await prisma.product.create({
      data: {
        name: 'Brightloop CRM Pro',
        type: 'SOFTWARE',
        salesPrice: 100.0,
        costPrice: 25.0,
        notes: 'Full-featured enterprise subscription CRM',
        taxRules: {
          create: [{ taxRuleId: vat18.id }],
        },
        variants: {
          create: [
            { name: 'Standard Edition', priceAdjustment: 0.0 },
            { name: 'Odoo Enterprise Brand', priceAdjustment: 560.0 }, // Odoo brand adds 560
          ],
        },
      },
      include: { variants: true },
    });
  }

  let supportAddon = await prisma.product.findFirst({ where: { name: '24/7 Priority Support SLA' } });
  if (!supportAddon) {
    supportAddon = await prisma.product.create({
      data: {
        name: '24/7 Priority Support SLA',
        type: 'ADDON',
        salesPrice: 150.0,
        costPrice: 40.0,
        notes: 'Dedicated 15-minute response SLA',
        taxRules: {
          create: [{ taxRuleId: vat18.id }],
        },
      },
    });
  }

  let apiPack = await prisma.product.findFirst({ where: { name: 'Custom API Integration Pack' } });
  if (!apiPack) {
    apiPack = await prisma.product.create({
      data: {
        name: 'Custom API Integration Pack',
        type: 'SOFTWARE',
        salesPrice: 250.0,
        costPrice: 50.0,
        taxRules: {
          create: [{ taxRuleId: vat5.id }],
        },
      },
    });
  }

  // 4. Plans
  console.log('3. Creating Plans...');
  let monthlyPlan = await prisma.plan.findFirst({ where: { name: 'Monthly Business Plan' } });
  if (!monthlyPlan) {
    monthlyPlan = await prisma.plan.create({
      data: {
        name: 'Monthly Business Plan',
        amount: 100.0,
        interval: 'MONTHLY',
        minQuantity: 1,
        availableFrom: new Date('2026-01-01'),
        autoCloseOnEnd: true,
        allowEarlyClose: true,
        allowPause: true,
        allowRenewal: true,
      },
    });
  }

  let yearlyPlan = await prisma.plan.findFirst({ where: { name: 'Yearly Enterprise Contract' } });
  if (!yearlyPlan) {
    yearlyPlan = await prisma.plan.create({
      data: {
        name: 'Yearly Enterprise Contract',
        amount: 1200.0,
        interval: 'YEARLY',
        minQuantity: 5,
        availableFrom: new Date('2026-01-01'),
        autoCloseOnEnd: true,
        allowEarlyClose: false,
        allowPause: true,
        allowRenewal: true,
      },
    });
  }

  // 5. Customers
  console.log('4. Creating / Linking Customers...');
  let acmeCustomer = await prisma.customer.findFirst({ where: { companyName: 'Acme Technologies Pvt Ltd' } });
  if (!acmeCustomer) {
    acmeCustomer = await prisma.customer.create({
      data: {
        companyName: 'Acme Technologies Pvt Ltd',
        billingEmail: 'customer@brightloop.com',
        phone: '+1 415-555-0199',
        addressLine1: '123 Market Street, Suite 500',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'USA',
      },
    });
  }

  let cyberdyne = await prisma.customer.findFirst({ where: { companyName: 'Cyberdyne Systems Corp' } });
  if (!cyberdyne) {
    cyberdyne = await prisma.customer.create({
      data: {
        companyName: 'Cyberdyne Systems Corp',
        billingEmail: 'billing@cyberdyne.io',
        phone: '+1 213-555-0144',
        addressLine1: '2144 Terminator Blvd',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90012',
        country: 'USA',
      },
    });
  }

  let wayneCorp = await prisma.customer.findFirst({ where: { companyName: 'Wayne Enterprises Global' } });
  if (!wayneCorp) {
    wayneCorp = await prisma.customer.create({
      data: {
        companyName: 'Wayne Enterprises Global',
        billingEmail: 'finance@wayne-corp.com',
        phone: '+1 212-555-0188',
        addressLine1: '1007 Mountain Drive',
        city: 'Gotham',
        state: 'NJ',
        postalCode: '07001',
        country: 'USA',
      },
    });
  }

  // 6. Discount Rules
  console.log('5. Creating Discount Rules...');
  let discount15 = await prisma.discountRule.findFirst({ where: { name: '15% Volume Subscription Discount' } });
  if (!discount15) {
    discount15 = await prisma.discountRule.create({
      data: {
        name: '15% Volume Subscription Discount',
        type: 'PERCENTAGE',
        value: 15.0,
        scope: 'SUBSCRIPTION',
        minQuantity: 2,
        validFrom: new Date('2026-01-01'),
        validTo: new Date('2027-12-31'),
        maxUses: 100,
        usesCount: 2,
      },
    });
  }

  // 7. Active Subscriptions (Ready for Automated Billing Run)
  console.log('6. Creating Active Subscriptions Due for Billing Run...');
  const odooVariant = await prisma.productVariant.findFirst({ where: { name: 'Odoo Enterprise Brand' } });

  const today = toUtcDate(new Date());

  // Sub 1: Acme Technologies (Due today!)
  const sub1 = await prisma.subscription.upsert({
    where: { number: 'SUB-2026-0001' },
    update: { nextBillingDate: today, status: 'ACTIVE', pausedAt: null },
    create: {
      number: 'SUB-2026-0001',
      customerId: acmeCustomer.id,
      planId: monthlyPlan.id,
      status: 'ACTIVE',
      startDate: new Date('2026-10-01'),
      expiryDate: new Date('2027-10-01'),
      billingInterval: 'MONTHLY',
      nextBillingDate: today,
      quotationValidityDays: 15,
      createdById: admin.id,
      lines: {
        create: [
          {
            productId: crmProduct.id,
            variantId: odooVariant ? odooVariant.id : null,
            quantity: 1,
            unitPrice: 660.0, // 100 base + 560 Odoo brand
            taxRatePercent: 18.0,
            lineAmount: 660.0,
          },
        ],
      },
    },
  });

  // Sub 2: Cyberdyne (Due today with 15% discount!)
  const sub2 = await prisma.subscription.upsert({
    where: { number: 'SUB-2026-0002' },
    update: { nextBillingDate: today, status: 'ACTIVE', pausedAt: null },
    create: {
      number: 'SUB-2026-0002',
      customerId: cyberdyne.id,
      planId: monthlyPlan.id,
      status: 'ACTIVE',
      startDate: new Date('2026-10-01'),
      expiryDate: new Date('2027-10-01'),
      billingInterval: 'MONTHLY',
      nextBillingDate: today,
      quotationValidityDays: 15,
      createdById: admin.id,
      lines: {
        create: [
          {
            productId: crmProduct.id,
            quantity: 3,
            unitPrice: 100.0,
            taxRatePercent: 18.0,
            lineAmount: 300.0,
          },
          {
            productId: supportAddon.id,
            quantity: 1,
            unitPrice: 150.0,
            taxRatePercent: 18.0,
            lineAmount: 150.0,
          },
        ],
      },
      discounts: {
        create: [{ discountId: discount15.id }],
      },
    },
  });

  // 8. Pre-existing Invoices with Diverse Statuses (To test immediately on /admin/invoices)
  console.log('7. Creating Invoices with Diverse Statuses (Paid, Partial, Overdue, Confirmed, Draft)...');

  // A. Confirmed / Unpaid Invoice
  await prisma.invoice.upsert({
    where: { number: 'INV-2026-0010' },
    update: {},
    create: {
      number: 'INV-2026-0010',
      subscriptionId: sub1.id,
      customerId: acmeCustomer.id,
      status: 'CONFIRMED',
      periodStart: new Date('2026-09-01'),
      periodEnd: new Date('2026-10-01'),
      issueDate: new Date('2026-09-01'),
      dueDate: addDays(new Date(), 10), // Due in 10 days
      subtotal: 660.0,
      discountTotal: 0.0,
      taxTotal: 118.8,
      grandTotal: 778.8,
      amountPaid: 0.0,
      balanceDue: 778.8,
      customerSnapshot: {
        companyName: acmeCustomer.companyName,
        billingEmail: acmeCustomer.billingEmail,
        phone: acmeCustomer.phone,
        addressLine1: acmeCustomer.addressLine1,
        city: acmeCustomer.city,
        state: acmeCustomer.state,
        country: acmeCustomer.country,
      },
      confirmedAt: new Date('2026-09-01'),
      lines: {
        create: [
          {
            productId: crmProduct.id,
            variantId: odooVariant ? odooVariant.id : null,
            description: 'Brightloop CRM Pro (Odoo Enterprise Brand)',
            quantity: 1,
            unitPrice: 660.0,
            taxRatePercent: 18.0,
            taxAmount: 118.8,
            discountAmount: 0.0,
            lineTotal: 778.8,
          },
        ],
      },
    },
  });

  // B. Partially Paid Invoice (Paid $200, Balance $331)
  const partialInv = await prisma.invoice.upsert({
    where: { number: 'INV-2026-0011' },
    update: {},
    create: {
      number: 'INV-2026-0011',
      subscriptionId: sub2.id,
      customerId: cyberdyne.id,
      status: 'PARTIALLY_PAID',
      periodStart: new Date('2026-08-01'),
      periodEnd: new Date('2026-09-01'),
      issueDate: new Date('2026-08-01'),
      dueDate: addDays(new Date(), 5),
      subtotal: 450.0,
      discountTotal: 0.0,
      taxTotal: 81.0,
      grandTotal: 531.0,
      amountPaid: 200.0,
      balanceDue: 331.0,
      customerSnapshot: {
        companyName: cyberdyne.companyName,
        billingEmail: cyberdyne.billingEmail,
        phone: cyberdyne.phone,
        city: cyberdyne.city,
      },
      confirmedAt: new Date('2026-08-01'),
      lines: {
        create: [
          {
            productId: crmProduct.id,
            description: 'Brightloop CRM Pro (Standard)',
            quantity: 3,
            unitPrice: 100.0,
            taxRatePercent: 18.0,
            taxAmount: 54.0,
            lineTotal: 354.0,
          },
          {
            productId: supportAddon.id,
            description: '24/7 Priority Support SLA',
            quantity: 1,
            unitPrice: 150.0,
            taxRatePercent: 18.0,
            taxAmount: 27.0,
            lineTotal: 177.0,
          },
        ],
      },
    },
  });

  // Add recorded payment for the partial invoice
  const existingPayment = await prisma.payment.findFirst({ where: { invoiceId: partialInv.id } });
  if (!existingPayment) {
    await prisma.payment.create({
      data: {
        invoiceId: partialInv.id,
        method: 'BANK_TRANSFER',
        amount: 200.0,
        paidAt: new Date('2026-08-15'),
        note: 'Wire Transfer Ref #CYBER-7729',
        recordedById: admin.id,
      },
    });
  }

  // C. Fully Paid Invoice
  const paidInv = await prisma.invoice.upsert({
    where: { number: 'INV-2026-0012' },
    update: {},
    create: {
      number: 'INV-2026-0012',
      subscriptionId: sub1.id,
      customerId: acmeCustomer.id,
      status: 'PAID',
      periodStart: new Date('2026-07-01'),
      periodEnd: new Date('2026-08-01'),
      issueDate: new Date('2026-07-01'),
      dueDate: new Date('2026-07-16'),
      subtotal: 660.0,
      discountTotal: 0.0,
      taxTotal: 118.8,
      grandTotal: 778.8,
      amountPaid: 778.8,
      balanceDue: 0.0,
      customerSnapshot: {
        companyName: acmeCustomer.companyName,
        billingEmail: acmeCustomer.billingEmail,
      },
      confirmedAt: new Date('2026-07-01'),
      lines: {
        create: [
          {
            productId: crmProduct.id,
            description: 'Brightloop CRM Pro (Odoo Brand)',
            quantity: 1,
            unitPrice: 660.0,
            taxRatePercent: 18.0,
            taxAmount: 118.8,
            lineTotal: 778.8,
          },
        ],
      },
    },
  });

  const existingFullPayment = await prisma.payment.findFirst({ where: { invoiceId: paidInv.id } });
  if (!existingFullPayment) {
    await prisma.payment.create({
      data: {
        invoiceId: paidInv.id,
        method: 'CARD',
        amount: 778.8,
        paidAt: new Date('2026-07-05'),
        note: 'Stripe Online Checkout Card **** 4242',
        recordedById: admin.id,
      },
    });
  }

  // D. Overdue Invoice (Due 20 days ago!)
  await prisma.invoice.upsert({
    where: { number: 'INV-2026-0013' },
    update: {},
    create: {
      number: 'INV-2026-0013',
      subscriptionId: sub2.id,
      customerId: wayneCorp.id,
      status: 'CONFIRMED',
      periodStart: new Date('2026-09-01'),
      periodEnd: new Date('2026-10-01'),
      issueDate: new Date('2026-09-01'),
      dueDate: new Date('2026-09-16'), // 45 days ago! Overdue!
      subtotal: 250.0,
      discountTotal: 0.0,
      taxTotal: 12.5,
      grandTotal: 262.5,
      amountPaid: 0.0,
      balanceDue: 262.5,
      customerSnapshot: {
        companyName: wayneCorp.companyName,
        billingEmail: wayneCorp.billingEmail,
        phone: wayneCorp.phone,
      },
      confirmedAt: new Date('2026-09-01'),
      lines: {
        create: [
          {
            productId: apiPack.id,
            description: 'Custom API Integration Pack',
            quantity: 1,
            unitPrice: 250.0,
            taxRatePercent: 5.0,
            taxAmount: 12.5,
            lineTotal: 262.5,
          },
        ],
      },
    },
  });

  // E. Draft Invoice (Ready to be confirmed)
  await prisma.invoice.upsert({
    where: { number: 'INV-2026-0014' },
    update: {},
    create: {
      number: 'INV-2026-0014',
      subscriptionId: sub1.id,
      customerId: acmeCustomer.id,
      status: 'DRAFT',
      periodStart: new Date('2026-10-01'),
      periodEnd: new Date('2026-11-01'),
      issueDate: new Date('2026-10-01'),
      dueDate: addDays(new Date(), 15),
      subtotal: 150.0,
      discountTotal: 0.0,
      taxTotal: 27.0,
      grandTotal: 177.0,
      amountPaid: 0.0,
      balanceDue: 177.0,
      customerSnapshot: {
        companyName: acmeCustomer.companyName,
        billingEmail: acmeCustomer.billingEmail,
      },
      lines: {
        create: [
          {
            productId: supportAddon.id,
            description: '24/7 Priority Support SLA (Draft Add-on)',
            quantity: 1,
            unitPrice: 150.0,
            taxRatePercent: 18.0,
            taxAmount: 27.0,
            lineTotal: 177.0,
          },
        ],
      },
    },
  });

  await prisma.$disconnect();
  console.log('✓ Successfully seeded rich test billing data!');
}

seedBillingData().catch((err) => {
  console.error('Failed to seed billing data:', err);
  process.exit(1);
});
