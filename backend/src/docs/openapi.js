export const openapiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Subscription Management System API',
    version: '0.1.0',
    description: 'Phase 0–1: health, auth, profiles, RBAC, Customer Portal, and Finance Reports.',
  },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: { 200: { description: 'OK' } },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register a customer account',
        responses: { 201: { description: 'Created' } },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Current profile',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Session' } },
      },
    },
    '/users': {
      get: {
        summary: 'List users (Admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Paged users' } },
      },
    },
    '/users/staff': {
      post: {
        summary: 'Create a staff account (Admin)',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Created' } },
      },
    },
    '/portal/subscriptions': {
      get: {
        summary: 'List authenticated customer subscriptions',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Customer subscriptions list' } },
      },
    },
    '/portal/quotations/{id}/accept': {
      post: {
        summary: 'Accept an open quotation on behalf of authenticated customer',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Quotation accepted and confirmed' },
          403: { description: 'Unauthorized / Customer mismatch' },
          404: { description: 'Quotation not found' },
          409: { description: 'Quotation expired or not in quotation status' },
        },
      },
    },
    '/portal/invoices': {
      get: {
        summary: 'List authenticated customer invoices and receipts',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Customer invoices and payment receipts' } },
      },
    },
    '/reports/finance': {
      get: {
        summary: 'Executive Finance Analytics KPI report (Admin/Staff)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'Aggregated financial metrics and overdue collections' } },
      },
    },
  },
};
