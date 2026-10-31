export const openapiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Subscription Management System API',
    version: '0.1.0',
    description: 'Phase 0–1: health, auth, profiles, and RBAC.',
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
  },
};
