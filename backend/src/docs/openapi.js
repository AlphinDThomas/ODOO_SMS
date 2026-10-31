export const openapiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Brightloop Subscription Management System API',
    version: '1.0.0',
    description: 'API documentation for Brightloop SMS, including Customers, Quotations, Subscriptions, Invoices, Billing, and Reports.',
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
    '/customers': {
      get: {
        summary: 'List or search customers (Staff, Admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Paged customers' } },
      },
      post: {
        summary: 'Create a new customer profile (Staff, Admin)',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Customer created' } },
      },
    },
    '/customers/{id}': {
      get: {
        summary: 'Get customer details (Staff, Admin, Customer owner)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Customer details' } },
      },
      put: {
        summary: 'Update customer profile',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Customer updated' } },
      },
    },
    '/templates': {
      get: {
        summary: 'List quotation templates',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Quotation templates' } },
      },
      post: {
        summary: 'Create quotation template (Staff, Admin)',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Template created' } },
      },
    },
    '/templates/{id}': {
      get: {
        summary: 'Get quotation template details',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Template details' } },
      },
      put: {
        summary: 'Update quotation template (Staff, Admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Template updated' } },
      },
      delete: {
        summary: 'Delete or deactivate quotation template (Staff, Admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Template deleted' } },
      },
    },
    '/subscriptions': {
      get: {
        summary: 'List subscriptions (Staff, Admin, Customer own)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Paged subscriptions' } },
      },
      post: {
        summary: 'Create draft subscription (Staff, Admin)',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Subscription created (SUB-XXXX)' } },
      },
    },
    '/subscriptions/{id}': {
      get: {
        summary: 'Get subscription details',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Subscription details' } },
      },
      put: {
        summary: 'Update draft subscription (Staff, Admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Subscription updated' } },
      },
    },
    '/subscriptions/{id}/submit-quote': {
      post: {
        summary: 'Submit draft as quotation (Staff, Admin) - sets quotationExpiresAt',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Quotation submitted' } },
      },
    },
    '/subscriptions/{id}/confirm': {
      post: {
        summary: 'Confirm quotation (Staff, Admin, Customer owner)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Quotation confirmed' } },
      },
    },
    '/subscriptions/{id}/activate': {
      post: {
        summary: 'Activate subscription (Staff, Admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Subscription activated' } },
      },
    },
    '/subscriptions/{id}/pause': {
      post: {
        summary: 'Pause active subscription (Staff, Admin) - validates plan.allowPause',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Subscription paused' } },
      },
    },
    '/subscriptions/{id}/resume': {
      post: {
        summary: 'Resume paused subscription (Staff, Admin) - recalculates nextBillingDate',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Subscription resumed' } },
      },
    },
    '/subscriptions/{id}/renew': {
      post: {
        summary: 'Renew subscription (Staff, Admin) - validates plan.allowRenewal',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Subscription renewed' } },
      },
    },
    '/subscriptions/{id}/close': {
      post: {
        summary: 'Close subscription (Staff, Admin) - validates plan.allowEarlyClose if before expiry',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Subscription closed' } },
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
