import { Prisma } from '@prisma/client';
import { HttpError } from '../../utils/httpError.js';

/**
 * Concurrency rules (enforced when billing/payments are implemented):
 *
 * Invoice generation + billing record:
 *   prisma.$transaction([lock subscription FOR UPDATE, insert BillingRecord,
 *   insert Invoice/lines, bump nextBillingDate]). Unique (subscriptionId, periodStart)
 *   is the duplicate gate. Unique violation => skip, do not create a second invoice.
 *
 * Discount usage:
 *   Increment DiscountRule.usesCount and SubscriptionDiscount.timesApplied in the
 *   same transaction as Invoice confirm, with a WHERE usesCount < maxUses guard.
 *
 * Payments:
 *   Lock the invoice row, insert Payment, recompute amountPaid/balanceDue/status.
 *   Reject amount > balanceDue. Status PARTIALLY_PAID or PAID is derived inside
 *   the transaction.
 */
export function isUniqueConstraint(error) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export function duplicateBillingError() {
  return new HttpError(409, 'Invoice already exists for this billing period');
}

export function applyPaymentStatus(grandTotal, amountPaid) {
  const total = Number(grandTotal);
  const paid = Number(amountPaid);
  if (paid <= 0) return { status: 'CONFIRMED', amountPaid: paid, balanceDue: total - paid };
  if (paid < total) return { status: 'PARTIALLY_PAID', amountPaid: paid, balanceDue: total - paid };
  if (paid === total) return { status: 'PAID', amountPaid: paid, balanceDue: 0 };
  throw new HttpError(400, 'Payment exceeds the outstanding balance');
}

export const BILLING_ADVISORY_LOCK_KEY = 814729;
