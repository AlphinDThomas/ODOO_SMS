import * as portalService from './portal.service.js';
import { HttpError } from '../../utils/httpError.js';

function getAuthenticatedCustomerId(req) {
  const customerId = req.profile?.customer?.id;
  if (!customerId) {
    throw new HttpError(403, 'Authenticated user is not associated with a customer profile');
  }
  return customerId;
}

export async function getSubscriptions(req, res, next) {
  try {
    const customerId = req.profile?.customer?.id;
    if (!customerId) {
      // If customer has no profile yet, return an empty array rather than failing hard
      return res.json({ subscriptions: [] });
    }

    const subscriptions = await portalService.getCustomerSubscriptions(customerId);
    res.json({ subscriptions });
  } catch (error) {
    next(error);
  }
}

export async function acceptQuotation(req, res, next) {
  try {
    const customerId = getAuthenticatedCustomerId(req);
    const { id } = req.params;

    const subscription = await portalService.acceptCustomerQuotation({
      subscriptionId: id,
      customerId,
      actorId: req.profile.id,
    });

    res.json({
      success: true,
      message: 'Quotation accepted successfully',
      subscription,
    });
  } catch (error) {
    next(error);
  }
}

export async function getInvoices(req, res, next) {
  try {
    const customerId = req.profile?.customer?.id;
    if (!customerId) {
      return res.json({ invoices: [] });
    }

    const invoices = await portalService.getCustomerInvoices(customerId);
    res.json({ invoices });
  } catch (error) {
    next(error);
  }
}

