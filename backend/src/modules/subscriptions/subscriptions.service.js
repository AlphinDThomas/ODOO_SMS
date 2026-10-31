import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/httpError.js';
import {
  addInterval,
  isQuotationExpired,
  quotationExpiryFrom,
  resumeBillingDate,
  toUtcDate,
} from '../../utils/dates.js';
import { getNextSubscriptionNumber } from './subscriptions.number.js';

export async function createSubscription(data, actor) {
  // Validate customer
  const customer = await prisma.customer.findUnique({
    where: { id: data.customerId },
  });
  if (!customer) {
    throw new HttpError(404, 'Customer not found');
  }

  // Validate plan
  const plan = await prisma.plan.findUnique({
    where: { id: data.planId },
  });
  if (!plan) {
    throw new HttpError(404, 'Plan not found');
  }

  let template = null;
  if (data.templateId) {
    template = await prisma.quotationTemplate.findUnique({
      where: { id: data.templateId },
      include: {
        lines: {
          include: {
            product: {
              include: {
                taxRules: { include: { taxRule: true } },
              },
            },
            variant: true,
          },
        },
      },
    });
    if (!template) {
      throw new HttpError(404, 'Quotation template not found');
    }
  }

  const now = new Date();
  const startDate = data.startDate ? toUtcDate(data.startDate) : toUtcDate(now);
  const billingInterval = data.billingInterval || plan.interval;

  // Default expiry date: 1 year from start date if not provided
  let expiryDate;
  if (data.expiryDate) {
    expiryDate = toUtcDate(data.expiryDate);
  } else {
    // Add 1 year by default
    const d = new Date(startDate.getTime());
    d.setUTCFullYear(d.getUTCFullYear() + 1);
    expiryDate = toUtcDate(d);
  }

  const quotationValidityDays =
    data.quotationValidityDays || template?.validityDays || 30;

  // Prepare lines
  let linesToCreate = [];
  if (data.lines && data.lines.length > 0) {
    // Validate custom lines
    const productIds = [...new Set(data.lines.map((l) => l.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { taxRules: { include: { taxRule: true } } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    if (products.length !== productIds.length) {
      throw new HttpError(400, 'One or more selected products do not exist');
    }

    linesToCreate = data.lines.map((l, idx) => {
      const prod = productMap.get(l.productId);
      const defaultTax =
        prod?.taxRules?.find((tr) => tr.taxRule?.isDefault)?.taxRule?.ratePercent ?? 0;
      const taxRate = l.taxRatePercent !== undefined ? l.taxRatePercent : Number(defaultTax);
      const lineAmt = Number(l.quantity) * Number(l.unitPrice);

      return {
        productId: l.productId,
        variantId: l.variantId || null,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRatePercent: taxRate,
        lineAmount: lineAmt,
        sortOrder: l.sortOrder ?? idx,
      };
    });
  } else if (template && template.lines.length > 0) {
    // Use template lines
    linesToCreate = template.lines.map((tl, idx) => {
      const defaultTax =
        tl.product?.taxRules?.find((tr) => tr.taxRule?.isDefault)?.taxRule?.ratePercent ?? 0;
      const unitPrice = Number(tl.unitPrice);
      const lineAmt = Number(tl.quantity) * unitPrice;

      return {
        productId: tl.productId,
        variantId: tl.variantId || null,
        quantity: tl.quantity,
        unitPrice,
        taxRatePercent: Number(defaultTax),
        lineAmount: lineAmt,
        sortOrder: tl.sortOrder ?? idx,
      };
    });
  } else {
    // If no custom lines or template provided, attach first active product
    const defaultProduct = await prisma.product.findFirst({
      where: { isActive: true },
      include: { taxRules: { include: { taxRule: true } } },
      orderBy: { createdAt: 'asc' },
    });
    if (defaultProduct) {
      const defaultTax =
        defaultProduct.taxRules?.find((tr) => tr.taxRule?.isDefault)?.taxRule?.ratePercent ?? 0;
      linesToCreate = [
        {
          productId: defaultProduct.id,
          variantId: null,
          quantity: plan.minQuantity ?? 1,
          unitPrice: Number(defaultProduct.salesPrice),
          taxRatePercent: Number(defaultTax),
          lineAmount: (plan.minQuantity ?? 1) * Number(defaultProduct.salesPrice),
          sortOrder: 0,
        },
      ];
    } else {
      throw new HttpError(400, 'Subscription must have at least one product line');
    }
  }

  // Validate discount rules if supplied
  if (data.discountIds && data.discountIds.length > 0) {
    const discounts = await prisma.discountRule.findMany({
      where: { id: { in: data.discountIds }, isActive: true },
    });
    if (discounts.length !== data.discountIds.length) {
      throw new HttpError(400, 'One or more discount rules are invalid or inactive');
    }
  }

  return await prisma.$transaction(async (tx) => {
    const number = await getNextSubscriptionNumber(tx);

    const subscription = await tx.subscription.create({
      data: {
        number,
        customerId: data.customerId,
        planId: data.planId,
        templateId: data.templateId || null,
        status: 'DRAFT',
        startDate,
        expiryDate,
        paymentTermsDays: data.paymentTermsDays ?? 15,
        billingInterval,
        quotationValidityDays,
        createdById: actor.id,
        lines: {
          create: linesToCreate,
        },
        discounts: {
          create: (data.discountIds || []).map((did) => ({
            discountId: did,
          })),
        },
      },
      include: {
        customer: true,
        plan: true,
        lines: {
          include: {
            product: true,
            variant: true,
          },
        },
        discounts: {
          include: {
            discount: true,
          },
        },
      },
    });

    return subscription;
  });
}

export async function listSubscriptions(
  { status, customerId, planId, search, page = 1, limit = 20 } = {},
  actor,
) {
  const skip = (page - 1) * limit;

  // Authorization check for CUSTOMER
  let effectiveCustomerId = customerId;
  if (actor.role === 'CUSTOMER') {
    const ownId = actor.customer?.id;
    if (!ownId) {
      return { items: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    }
    effectiveCustomerId = ownId;
  }

  const where = {
    ...(status ? { status } : {}),
    ...(effectiveCustomerId ? { customerId: effectiveCustomerId } : {}),
    ...(planId ? { planId } : {}),
    ...(search
      ? {
          OR: [
            { number: { contains: search, mode: 'insensitive' } },
            { customer: { companyName: { contains: search, mode: 'insensitive' } } },
            { customer: { billingEmail: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            billingEmail: true,
            phone: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            interval: true,
            amount: true,
            allowPause: true,
            allowRenewal: true,
            allowEarlyClose: true,
          },
        },
        lines: {
          include: {
            product: { select: { id: true, name: true, type: true } },
            variant: { select: { id: true, name: true } },
          },
        },
        discounts: {
          include: {
            discount: true,
          },
        },
        _count: {
          select: {
            invoices: true,
          },
        },
      },
    }),
  ]);

  // Augment items with calculated totals
  const enriched = items.map((sub) => {
    let subtotal = 0;
    let taxTotal = 0;
    for (const l of sub.lines) {
      const lineAmt = Number(l.lineAmount);
      const taxRate = Number(l.taxRatePercent) / 100;
      subtotal += lineAmt;
      taxTotal += lineAmt * taxRate;
    }
    const grandTotal = subtotal + taxTotal;

    return {
      ...sub,
      calculated: {
        subtotal: Number(subtotal.toFixed(2)),
        taxTotal: Number(taxTotal.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2)),
      },
    };
  });

  return {
    items: enriched,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getSubscriptionById(id, actor) {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: {
      customer: true,
      plan: true,
      template: true,
      createdBy: {
        select: { id: true, email: true, fullName: true, role: true },
      },
      acceptedBy: {
        select: { id: true, email: true, fullName: true, role: true },
      },
      lines: {
        orderBy: { sortOrder: 'asc' },
        include: {
          product: {
            include: {
              taxRules: { include: { taxRule: true } },
            },
          },
          variant: true,
        },
      },
      discounts: {
        include: {
          discount: true,
        },
      },
      invoices: {
        orderBy: { issueDate: 'desc' },
        take: 10,
        select: {
          id: true,
          number: true,
          status: true,
          issueDate: true,
          dueDate: true,
          grandTotal: true,
          amountPaid: true,
          balanceDue: true,
        },
      },
    },
  });

  if (!subscription) {
    throw new HttpError(404, 'Subscription not found');
  }

  // Access check
  if (actor.role === 'CUSTOMER') {
    const ownCustomerId = actor.customer?.id;
    if (!ownCustomerId || ownCustomerId !== subscription.customerId) {
      throw new HttpError(403, 'You can only access your own subscription');
    }
  }

  // Calculate pricing breakdown
  let subtotal = 0;
  let taxTotal = 0;
  for (const l of subscription.lines) {
    const lineAmt = Number(l.lineAmount);
    const taxRate = Number(l.taxRatePercent) / 100;
    subtotal += lineAmt;
    taxTotal += lineAmt * taxRate;
  }
  const grandTotal = subtotal + taxTotal;

  return {
    ...subscription,
    calculated: {
      subtotal: Number(subtotal.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
    },
  };
}

export async function updateSubscription(id, data, actor) {
  const existing = await prisma.subscription.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new HttpError(404, 'Subscription not found');
  }

  if (existing.status !== 'DRAFT') {
    throw new HttpError(400, 'Only DRAFT subscriptions can be modified');
  }

  return await prisma.$transaction(async (tx) => {
    if (data.lines) {
      await tx.subscriptionLine.deleteMany({ where: { subscriptionId: id } });

      const productIds = [...new Set(data.lines.map((l) => l.productId))];
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        include: { taxRules: { include: { taxRule: true } } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      const linesToCreate = data.lines.map((l, idx) => {
        const prod = productMap.get(l.productId);
        const defaultTax =
          prod?.taxRules?.find((tr) => tr.taxRule?.isDefault)?.taxRule?.ratePercent ?? 0;
        const taxRate = l.taxRatePercent !== undefined ? l.taxRatePercent : Number(defaultTax);
        const lineAmt = Number(l.quantity) * Number(l.unitPrice);

        return {
          subscriptionId: id,
          productId: l.productId,
          variantId: l.variantId || null,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRatePercent: taxRate,
          lineAmount: lineAmt,
          sortOrder: l.sortOrder ?? idx,
        };
      });

      await tx.subscriptionLine.createMany({ data: linesToCreate });
    }

    if (data.discountIds) {
      await tx.subscriptionDiscount.deleteMany({ where: { subscriptionId: id } });
      await tx.subscriptionDiscount.createMany({
        data: data.discountIds.map((did) => ({
          subscriptionId: id,
          discountId: did,
        })),
      });
    }

    const updated = await tx.subscription.update({
      where: { id },
      data: {
        ...(data.customerId ? { customerId: data.customerId } : {}),
        ...(data.planId ? { planId: data.planId } : {}),
        ...(data.templateId !== undefined ? { templateId: data.templateId } : {}),
        ...(data.startDate ? { startDate: toUtcDate(data.startDate) } : {}),
        ...(data.expiryDate ? { expiryDate: toUtcDate(data.expiryDate) } : {}),
        ...(data.billingInterval ? { billingInterval: data.billingInterval } : {}),
        ...(data.paymentTermsDays ? { paymentTermsDays: data.paymentTermsDays } : {}),
        ...(data.quotationValidityDays ? { quotationValidityDays: data.quotationValidityDays } : {}),
      },
      include: {
        customer: true,
        plan: true,
        lines: { include: { product: true, variant: true } },
        discounts: { include: { discount: true } },
      },
    });

    return updated;
  });
}

/**
 * Submit Quotation: transitions DRAFT -> QUOTATION
 */
export async function submitQuotation(id, actor) {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
  });
  if (!subscription) {
    throw new HttpError(404, 'Subscription not found');
  }

  if (subscription.status !== 'DRAFT') {
    throw new HttpError(409, 'Only draft subscriptions can be submitted as quotations');
  }

  const now = new Date();
  const validityDays = subscription.quotationValidityDays || 30;
  const quotationExpiresAt = quotationExpiryFrom(now, validityDays);

  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      status: 'QUOTATION',
      submittedAt: now,
      quotationExpiresAt,
    },
    include: {
      customer: true,
      plan: true,
      lines: { include: { product: true, variant: true } },
    },
  });

  return updated;
}

/**
 * Confirm Quotation: transitions QUOTATION -> CONFIRMED
 * Staff/Admin can confirm, or Customer if permitted.
 */
export async function confirmQuotation(id, actor) {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: { customer: true },
  });
  if (!subscription) {
    throw new HttpError(404, 'Subscription not found');
  }

  const now = new Date();

  if (subscription.status === 'EXPIRED' || isQuotationExpired(subscription.quotationExpiresAt, now)) {
    throw new HttpError(409, 'This quotation has expired');
  }

  if (subscription.status !== 'QUOTATION') {
    throw new HttpError(409, 'Only open quotations can be confirmed');
  }

  if (actor.role === 'CUSTOMER') {
    const ownCustomerId = actor.customer?.id;
    if (!ownCustomerId || ownCustomerId !== subscription.customerId) {
      throw new HttpError(403, 'You can only accept your own quotation');
    }
  }

  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      status: 'CONFIRMED',
      acceptedAt: now,
      acceptedById: actor.id,
    },
    include: {
      customer: true,
      plan: true,
      lines: { include: { product: true, variant: true } },
    },
  });

  return updated;
}

/**
 * Activate Subscription: transitions CONFIRMED (or DRAFT) -> ACTIVE
 * Sets initial nextBillingDate.
 */
export async function activateSubscription(id, actor) {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
  });
  if (!subscription) {
    throw new HttpError(404, 'Subscription not found');
  }

  if (actor?.role === 'CUSTOMER' && subscription.customerId !== actor.customer?.id) {
    throw new HttpError(403, 'You can only manage your own subscriptions');
  }

  if (subscription.status !== 'CONFIRMED' && subscription.status !== 'DRAFT') {
    throw new HttpError(409, `Cannot activate subscription in '${subscription.status}' status`);
  }

  const today = toUtcDate(new Date());
  const start = toUtcDate(subscription.startDate);
  // Next billing date is start date, or today if start date is in the past
  const nextBillingDate = start.getTime() <= today.getTime() ? today : start;

  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      status: 'ACTIVE',
      nextBillingDate,
    },
    include: {
      customer: true,
      plan: true,
      lines: { include: { product: true, variant: true } },
    },
  });

  return updated;
}

/**
 * Pause Subscription: transitions ACTIVE -> PAUSED
 * Requires plan.allowPause === true
 */
export async function pauseSubscription(id, reason, actor) {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: { plan: true },
  });
  if (!subscription) {
    throw new HttpError(404, 'Subscription not found');
  }

  if (actor?.role === 'CUSTOMER' && subscription.customerId !== actor.customer?.id) {
    throw new HttpError(403, 'You can only manage your own subscriptions');
  }

  if (subscription.status !== 'ACTIVE') {
    throw new HttpError(409, 'Only ACTIVE subscriptions can be paused');
  }

  if (!subscription.plan.allowPause) {
    throw new HttpError(400, 'Selected plan does not permit pausing subscriptions');
  }

  const now = new Date();

  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      status: 'PAUSED',
      pausedAt: now,
    },
    include: {
      customer: true,
      plan: true,
    },
  });

  return updated;
}

/**
 * Resume Subscription: transitions PAUSED -> ACTIVE
 * Recalculates nextBillingDate using resumeBillingDate
 */
export async function resumeSubscription(id, actor) {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
  });
  if (!subscription) {
    throw new HttpError(404, 'Subscription not found');
  }

  if (actor?.role === 'CUSTOMER' && subscription.customerId !== actor.customer?.id) {
    throw new HttpError(403, 'You can only manage your own subscriptions');
  }

  if (subscription.status !== 'PAUSED') {
    throw new HttpError(409, 'Only PAUSED subscriptions can be resumed');
  }

  const now = new Date();
  const recalculatedNextBillingDate = resumeBillingDate(
    subscription.pausedAt,
    subscription.nextBillingDate,
    now,
  );

  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      status: 'ACTIVE',
      pausedAt: null,
      nextBillingDate: recalculatedNextBillingDate,
    },
    include: {
      customer: true,
      plan: true,
    },
  });

  return updated;
}

/**
 * Renew Subscription: extends expiryDate
 * Requires plan.allowRenewal === true
 */
export async function renewSubscription(id, newExpiryDate, actor) {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: { plan: true },
  });
  if (!subscription) {
    throw new HttpError(404, 'Subscription not found');
  }

  if (!subscription.plan.allowRenewal) {
    throw new HttpError(400, 'Selected plan does not permit renewal');
  }

  let computedExpiry;
  if (newExpiryDate) {
    computedExpiry = toUtcDate(newExpiryDate);
  } else {
    // Add 1 interval to the current expiry date
    computedExpiry = addInterval(subscription.expiryDate, subscription.billingInterval);
  }

  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      expiryDate: computedExpiry,
      // If was EXPIRED, transition back to ACTIVE
      ...(subscription.status === 'EXPIRED' ? { status: 'ACTIVE' } : {}),
    },
    include: {
      customer: true,
      plan: true,
    },
  });

  return updated;
}

/**
 * Close Subscription: transitions to CLOSED
 * Checks plan.allowEarlyClose if current date < expiryDate
 */
export async function closeSubscription(id, reason, actor) {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: { plan: true },
  });
  if (!subscription) {
    throw new HttpError(404, 'Subscription not found');
  }

  if (actor?.role === 'CUSTOMER' && subscription.customerId !== actor.customer?.id) {
    throw new HttpError(403, 'You can only cancel your own subscriptions');
  }

  if (subscription.status === 'CLOSED') {
    throw new HttpError(409, 'Subscription is already closed');
  }

  const today = toUtcDate(new Date());
  const expiry = toUtcDate(subscription.expiryDate);

  // If closing early (before expiryDate), check plan.allowEarlyClose
  if (today.getTime() < expiry.getTime() && !subscription.plan.allowEarlyClose) {
    throw new HttpError(400, 'Selected plan does not permit early closure before expiry date');
  }

  const now = new Date();

  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      status: 'CLOSED',
      closedAt: now,
      closeReason: reason || 'Closed by user',
    },
    include: {
      customer: true,
      plan: true,
    },
  });

  return updated;
}
