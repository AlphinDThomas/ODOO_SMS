import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { openapiDocument } from './docs/openapi.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter, usersRouter } from './modules/auth/auth.routes.js';
import { portalRouter } from './modules/portal/portal.routes.js';
import { reportsRouter } from './modules/reports/reports.routes.js';

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
  app.use('/api/v1/portal', portalRouter);
  app.use('/api/v1/reports', reportsRouter);

  app.use(errorHandler);
  return app;
}
