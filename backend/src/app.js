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
import { catalogRouter } from './modules/catalog/catalog.routes.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          origin === env.frontendOrigin ||
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:')
        ) {
          return callback(null, true);
        }
        return callback(null, env.frontendOrigin);
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
  app.use('/api/v1', catalogRouter);

  app.use(errorHandler);
  return app;
}
