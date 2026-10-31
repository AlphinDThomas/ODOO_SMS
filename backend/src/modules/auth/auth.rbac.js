import { HttpError } from '../../utils/httpError.js';

export function canAccessCustomerRecord(actor, customerId) {
  if (!actor?.isActive) return false;
  if (actor.role === 'ADMIN' || actor.role === 'STAFF') return true;
  if (actor.role === 'CUSTOMER') return actor.customer?.id === customerId;
  return false;
}

export function assertCanAccessCustomerRecord(actor, customerId) {
  if (!canAccessCustomerRecord(actor, customerId)) {
    throw new HttpError(403, 'You can only access your own records');
  }
}

export function assertAdmin(actor) {
  if (actor?.role !== 'ADMIN') {
    throw new HttpError(403, 'Insufficient permissions');
  }
}
