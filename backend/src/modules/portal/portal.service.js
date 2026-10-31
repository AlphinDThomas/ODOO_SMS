import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/httpError.js';
import { isQuotationExpired } from '../../utils/dates.js';

/**
 * Retrieve subscriptions belonging strictly to the authenticated customer.
 */
export async function getCustomerSubscriptions(customerId) {
  if (!customerId) {
    return [];
  }

  return prisma.subscription.findMany({
    where: { customerId },
    include: {
      plan: true,
      lines: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              type: true,
              salesPrice: true,
            },
          },
          variant: {
            select: {
              id: true,
              name: true,
              priceAdjustment: true,
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
      discounts: {
        include: {
          discount: {
            select: {
              id: true,
              name: true,
              type: true,
              value: true,
              scope: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Accept a quotation on behalf of the authenticated customer.
 * - Verifies the quotation belongs to the customer.
 * - Verifies that the quotation is in QUOTATION status.
 * - Verifies that now < quotationExpiresAt.
 * - Transitions status to CONFIRMED and sets acceptedAt & acceptedById.
 */
export async function acceptCustomerQuotation({ subscriptionId, customerId, actorId, now = new Date() }) {
  if (!customerId) {
    throw new HttpError(403, 'No customer profile linked to this account');
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      plan: true,
      customer: true,
    },
  });

  if (!subscription) {
    throw new HttpError(404, 'Quotation not found');
  }

  // Strict customer-level data isolation
  if (subscription.customerId !== customerId) {
    throw new HttpError(403, 'You can only accept your own quotation');
  }

  if (subscription.status === 'EXPIRED' || isQuotationExpired(subscription.quotationExpiresAt, now)) {
    // If not marked EXPIRED in database, update it asynchronously/inline
    if (subscription.status === 'QUOTATION') {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: 'EXPIRED' },
      }).catch(() => {});
    }
    throw new HttpError(409, 'This quotation has expired');
  }

  if (subscription.status !== 'QUOTATION') {
    throw new HttpError(409, `Only open quotations can be accepted (current status: ${subscription.status})`);
  }

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'CONFIRMED',
      acceptedAt: now,
      acceptedById: actorId,
    },
    include: {
      plan: true,
      lines: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  });

  return updated;
}

/**
 * Retrieve invoices and associated payments belonging strictly to the authenticated customer.
 */
export async function getCustomerInvoices(customerId) {
  if (!customerId) {
    return [];
  }

  return prisma.invoice.findMany({
    where: { customerId },
    include: {
      lines: {
        include: {
          product: {
            select: { id: true, name: true, type: true },
          },
          variant: {
            select: { id: true, name: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
      payments: {
        select: {
          id: true,
          method: true,
          amount: true,
          paidAt: true,
          note: true,
        },
        orderBy: { paidAt: 'desc' },
      },
      subscription: {
        select: {
          id: true,
          number: true,
          status: true,
          billingInterval: true,
          plan: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { issueDate: 'desc' },
  });
}

