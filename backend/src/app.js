import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { openapiDocument } from './docs/openapi.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter, usersRouter } from './modules/auth/auth.routes.js';
import { discountsRouter } from './modules/discounts/discount.routes.js';
import { plansRouter } from './modules/plans/plan.routes.js';
import { productsRouter } from './modules/products/product.routes.js';
import { taxRulesRouter } from './modules/taxes/tax.routes.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.frontendOrigin,
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
  app.use('/api/v1/products', productsRouter);
  app.use('/api/v1/plans', plansRouter);
  app.use('/api/v1/taxes', taxRulesRouter);
  app.use('/api/v1/discounts', discountsRouter);

  app.use(errorHandler);
  return app;
}
