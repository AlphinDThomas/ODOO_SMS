import * as subscriptionService from './subscriptions.service.js';
import { HttpError } from '../../utils/httpError.js';

export async function createSubscription(req, res, next) {
  try {
    const data = { ...req.body };
    if (req.profile.role === 'CUSTOMER') {
      const ownCustomerId = req.profile.customer?.id;
      if (!ownCustomerId) {
        throw new HttpError(400, 'Your user account does not have an associated customer profile');
      }
      data.customerId = ownCustomerId;
    } else if (!data.customerId) {
      throw new HttpError(400, 'customerId is required');
    }

    const subscription = await subscriptionService.createSubscription(data, req.profile);

    // If customer requests a subscription, immediately submit as QUOTATION
    let finalSub = subscription;
    if (req.profile.role === 'CUSTOMER') {
      finalSub = await subscriptionService.submitQuotation(subscription.id, req.profile);
    }

    res.status(201).json({
      success: true,
      message:
        req.profile.role === 'CUSTOMER'
          ? 'Subscription quotation submitted successfully'
          : 'Subscription created successfully',
      data: finalSub,
    });
  } catch (error) {
    next(error);
  }
}

export async function listSubscriptions(req, res, next) {
  try {
    const result = await subscriptionService.listSubscriptions(req.query, req.profile);
    res.json({
      success: true,
      data: result,
      items: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSubscription(req, res, next) {
  try {
    const subscription = await subscriptionService.getSubscriptionById(req.params.id, req.profile);
    res.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSubscription(req, res, next) {
  try {
    const subscription = await subscriptionService.updateSubscription(req.params.id, req.body, req.profile);
    res.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
}

export async function submitQuote(req, res, next) {
  try {
    const subscription = await subscriptionService.submitQuotation(req.params.id, req.profile);
    res.json({
      success: true,
      message: 'Quotation submitted successfully',
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
}

export async function confirmQuote(req, res, next) {
  try {
    const subscription = await subscriptionService.confirmQuotation(req.params.id, req.profile);
    res.json({
      success: true,
      message: 'Quotation confirmed successfully',
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
}

export async function activateSubscription(req, res, next) {
  try {
    const subscription = await subscriptionService.activateSubscription(req.params.id, req.profile);
    res.json({
      success: true,
      message: 'Subscription activated successfully',
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
}

export async function pauseSubscription(req, res, next) {
  try {
    const subscription = await subscriptionService.pauseSubscription(
      req.params.id,
      req.body?.reason,
      req.profile,
    );
    res.json({
      success: true,
      message: 'Subscription paused successfully',
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
}

export async function resumeSubscription(req, res, next) {
  try {
    const subscription = await subscriptionService.resumeSubscription(req.params.id, req.profile);
    res.json({
      success: true,
      message: 'Subscription resumed successfully',
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
}

export async function renewSubscription(req, res, next) {
  try {
    const subscription = await subscriptionService.renewSubscription(
      req.params.id,
      req.body?.newExpiryDate,
      req.profile,
    );
    res.json({
      success: true,
      message: 'Subscription renewed successfully',
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
}

export async function closeSubscription(req, res, next) {
  try {
    const subscription = await subscriptionService.closeSubscription(
      req.params.id,
      req.body?.reason,
      req.profile,
    );
    res.json({
      success: true,
      message: 'Subscription closed successfully',
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
}
