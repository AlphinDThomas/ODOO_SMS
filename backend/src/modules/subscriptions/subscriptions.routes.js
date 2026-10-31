import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './subscriptions.controller.js';
import {
  closeSubscriptionSchema,
  createSubscriptionSchema,
  listSubscriptionsQuerySchema,
  pauseSubscriptionSchema,
  renewSubscriptionSchema,
  subscriptionIdParamSchema,
  updateSubscriptionSchema,
} from './subscriptions.schema.js';

export const subscriptionsRouter = Router();

subscriptionsRouter.get(
  '/',
  requireAuth,
  validate(listSubscriptionsQuerySchema),
  controller.listSubscriptions,
);

subscriptionsRouter.post(
  '/',
  requireAuth,
  requireRole('ADMIN', 'STAFF'),
  validate(createSubscriptionSchema),
  controller.createSubscription,
);

subscriptionsRouter.get(
  '/:id',
  requireAuth,
  validate(subscriptionIdParamSchema),
  controller.getSubscription,
);

subscriptionsRouter.put(
  '/:id',
  requireAuth,
  requireRole('ADMIN', 'STAFF'),
  validate(updateSubscriptionSchema),
  controller.updateSubscription,
);

subscriptionsRouter.post(
  '/:id/submit-quote',
  requireAuth,
  requireRole('ADMIN', 'STAFF'),
  validate(subscriptionIdParamSchema),
  controller.submitQuote,
);

subscriptionsRouter.post(
  '/:id/confirm',
  requireAuth,
  validate(subscriptionIdParamSchema),
  controller.confirmQuote,
);

subscriptionsRouter.post(
  '/:id/activate',
  requireAuth,
  requireRole('ADMIN', 'STAFF'),
  validate(subscriptionIdParamSchema),
  controller.activateSubscription,
);

subscriptionsRouter.post(
  '/:id/pause',
  requireAuth,
  requireRole('ADMIN', 'STAFF'),
  validate(pauseSubscriptionSchema),
  controller.pauseSubscription,
);

subscriptionsRouter.post(
  '/:id/resume',
  requireAuth,
  requireRole('ADMIN', 'STAFF'),
  validate(subscriptionIdParamSchema),
  controller.resumeSubscription,
);

subscriptionsRouter.post(
  '/:id/renew',
  requireAuth,
  requireRole('ADMIN', 'STAFF'),
  validate(renewSubscriptionSchema),
  controller.renewSubscription,
);

subscriptionsRouter.post(
  '/:id/close',
  requireAuth,
  requireRole('ADMIN', 'STAFF'),
  validate(closeSubscriptionSchema),
  controller.closeSubscription,
);
