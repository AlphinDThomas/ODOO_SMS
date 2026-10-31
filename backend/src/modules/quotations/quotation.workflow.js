import { HttpError } from '../../utils/httpError.js';
import { isQuotationExpired, quotationExpiryFrom } from '../../utils/dates.js';

/**
 * Quotation expiration
 * - On submit (DRAFT -> QUOTATION): set submittedAt and
 *   quotationExpiresAt = submittedAt + quotationValidityDays (from template).
 * - Accept/confirm is rejected when now >= quotationExpiresAt.
 * - expireQuotations() transitions QUOTATION -> EXPIRED after that instant.
 *
 * Customer acceptance
 * - CUSTOMER may accept only their own QUOTATION (linked via Customer.userId).
 * - STAFF/ADMIN may confirm a non-expired QUOTATION on the customer's behalf.
 * - Both paths: QUOTATION -> CONFIRMED, set acceptedAt and acceptedById.
 * - Role is never taken from the request body.
 */
export function assertCanSubmit(subscription) {
  if (subscription.status !== 'DRAFT') {
    throw new HttpError(409, 'Only draft subscriptions can be submitted as quotations');
  }
}

export function buildQuotationFields(now, validityDays) {
  return {
    status: 'QUOTATION',
    submittedAt: now,
    quotationValidityDays: validityDays,
    quotationExpiresAt: quotationExpiryFrom(now, validityDays),
  };
}

export function assertCanAccept({ subscription, actor, now = new Date() }) {
  if (subscription.status === 'EXPIRED' || isQuotationExpired(subscription.quotationExpiresAt, now)) {
    throw new HttpError(409, 'This quotation has expired');
  }
  if (subscription.status !== 'QUOTATION') {
    throw new HttpError(409, 'Only open quotations can be accepted');
  }
  if (actor.role === 'CUSTOMER') {
    const ownCustomerId = actor.customer?.id;
    if (!ownCustomerId || ownCustomerId !== subscription.customerId) {
      throw new HttpError(403, 'You can only accept your own quotation');
    }
  } else if (actor.role !== 'ADMIN' && actor.role !== 'STAFF') {
    throw new HttpError(403, 'Insufficient permissions');
  }
}

export function buildAcceptanceFields(actorId, now = new Date()) {
  return {
    status: 'CONFIRMED',
    acceptedAt: now,
    acceptedById: actorId,
  };
}

export function shouldExpireQuotation(subscription, now = new Date()) {
  return subscription.status === 'QUOTATION' && isQuotationExpired(subscription.quotationExpiresAt, now);
}
