import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { openapiDocument } from './docs/openapi.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter, usersRouter } from './modules/auth/auth.routes.js';
import { customersRouter } from './modules/customers/customers.routes.js';
import { templatesRouter } from './modules/templates/templates.routes.js';
import { subscriptionsRouter } from './modules/subscriptions/subscriptions.routes.js';
import { billingRouter } from './modules/billing/billing.routes.js';
import { invoicesRouter } from './modules/invoices/invoices.routes.js';
import { paymentsRouter } from './modules/payments/payments.routes.js';
import { discountsRouter } from './modules/discounts/discount.routes.js';
import { plansRouter } from './modules/plans/plan.routes.js';
import { productsRouter } from './modules/products/product.routes.js';
import { taxRulesRouter } from './modules/taxes/tax.routes.js';
import { portalRouter } from './modules/portal/portal.routes.js';
import { reportsRouter } from './modules/reports/reports.routes.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile/curl), configured origin, or any localhost port in dev
        if (!origin || origin === env.frontendOrigin || /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get('/api/v1/health', (_req, res) => {
    res.json({ ok: true, service: 'sms-api' });
  });

  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
  app.get('/api/v1/docs.json', (_req, res) => res.json(openapiDocument));

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/customers', customersRouter);
  app.use('/api/v1/templates', templatesRouter);
  app.use('/api/v1/subscriptions', subscriptionsRouter);
  app.use('/api/v1/products', productsRouter);
  app.use('/api/v1/plans', plansRouter);
  app.use('/api/v1/taxes', taxRulesRouter);
  app.use('/api/v1/discounts', discountsRouter);
  app.use('/api/v1/billing', billingRouter);
  app.use('/api/v1/invoices', invoicesRouter);
  app.use('/api/v1/payments', paymentsRouter);
  app.use('/api/v1/portal', portalRouter);
  app.use('/api/v1/reports', reportsRouter);

  app.use(errorHandler);
  return app;
}
