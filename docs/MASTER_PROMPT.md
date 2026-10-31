# MASTER DEVELOPMENT PROMPT – BRIGHTLOOP SUBSCRIPTION MANAGEMENT SYSTEM

## Project Overview

We are developing a complete, production-quality Subscription Management System for a fictional software company called **Brightloop Software**.

The system must manage the complete subscription business lifecycle, including products, plans, customers, quotations, subscriptions, recurring billing, invoices, payments and financial analytics.

Your responsibility is to develop the entire application, including frontend, backend, database integration, authentication, business logic, billing automation, dashboards, testing and documentation.

You must work with the existing project repository rather than creating an unrelated implementation from scratch.

**IMPORTANT SOURCE OF TRUTH:** The root `README.md` contains the final agreed project specifications, four-person team allocation, module ownership, API conventions and implementation details. Follow it whenever there is a conflict with this prompt. Do not independently change the team's agreed responsibilities.

---

## 1. TECHNOLOGY STACK

### Frontend
- React.js with Vite
- JavaScript
- Tailwind CSS
- shadcn/ui
- React Router DOM
- Axios
- Recharts
- Lucide React

### Backend
- Node.js
- Express.js
- JavaScript ES Modules
- Prisma ORM
- Zod validation

### Database and Authentication
- Supabase PostgreSQL
- Supabase Auth

### Development Tools
- Git and GitHub
- Postman
- Swagger/OpenAPI
- ESLint

Do not introduce additional frameworks or technologies without explaining why they are necessary.

---

## 2. FIRST: INSPECT THE EXISTING PROJECT

Before writing or modifying code:

1. Inspect the complete frontend and backend directory structures.
2. Inspect package.json files and installed dependencies.
3. Review existing source code.
4. Inspect the Prisma schema and migration history.
5. Inspect environment variable configuration.
6. Identify completed, partially completed and missing functionality.
7. Identify existing errors and architectural problems.
8. Identify shared dependencies between the four modules.

Do not overwrite working implementations unnecessarily.

Create a development checklist and use it to track implementation progress.

Do not begin large-scale implementation before understanding the existing repository.

---

## 3. FOUR-MEMBER DEVELOPMENT OWNERSHIP

The project is divided into four functional modules. Each developer owns their respective vertical slice, including its frontend, backend, validation, business logic and testing.

### PERSON 1 – PRODUCT CATALOG, PLANS, TAXES & DISCOUNT RULES ENGINE

**Branch:** `feature/catalog-plans`

Responsible for:

- Product management.
- Product categories and types.
- Product variants and additional pricing.
- Subscription plan management.
- Billing intervals.
- Minimum quantities.
- Plan availability dates.
- Automatic closure and early-closure settings.
- Pause and renewal settings.
- Tax rules and product-tax relationships.
- Fixed and percentage discounts.
- Minimum purchase and quantity requirements.
- Discount validity and usage limits.
- Product-specific and subscription-wide discounts.

Database entities owned:
- `Product`
- `ProductVariant`
- `TaxRule`
- `ProductTaxRule`
- `Plan`
- `DiscountRule`
- `DiscountProduct`

### PERSON 2 – CUSTOMERS, QUOTATION TEMPLATES & SUBSCRIPTION SALES PIPELINE

**Branch:** `feature/subscriptions-sales`

Responsible for:

- Customer management.
- Customer directory and customer profiles.
- Customer-to-user association where applicable.
- Reusable quotation templates.
- Quotation template lines.
- Quotation creation from templates or manually.
- Quotation validity and expiry.
- Subscription creation.
- Subscription numbering.
- Subscription lines and pricing snapshots.
- Subscription lifecycle management.
- Subscription status transitions.
- Subscription activation.
- Subscription pause and resume.
- Subscription closure.
- Subscription renewal and expiry handling.
- Subscription discounts associated with subscriptions.

Database entities owned:
- `Customer`
- `QuotationTemplate`
- `QuotationTemplateLine`
- `Subscription`
- `SubscriptionLine`
- `SubscriptionDiscount`

Backend modules:
- `src/modules/customers/`
- `src/modules/subscriptions/`

Required APIs:

**Customers**
- `GET /api/v1/customers`
- `POST /api/v1/customers`

**Quotation Templates**
- `GET /api/v1/templates`
- `POST /api/v1/templates`

**Subscriptions**
- `GET /api/v1/subscriptions`
- `POST /api/v1/subscriptions`
- `POST /api/v1/subscriptions/:id/submit-quote`
- `POST /api/v1/subscriptions/:id/confirm`
- `POST /api/v1/subscriptions/:id/activate`
- `POST /api/v1/subscriptions/:id/pause`
- `POST /api/v1/subscriptions/:id/resume`
- `POST /api/v1/subscriptions/:id/close`

Frontend pages:
- Customer Directory: `/admin/customers` and `/staff/customers`
- Quotation Templates: `/admin/templates`
- Subscription Management: `/admin/subscriptions`
- New Subscription / Quote Builder
- Subscription Detail View

The subscription lifecycle must support:

`DRAFT → QUOTATION → CONFIRMED → ACTIVE → PAUSED → ACTIVE → EXPIRED → CLOSED`

Only valid transitions are permitted. Enforce plan restrictions and authorization rules.

### PERSON 3 – AUTOMATED RECURRING BILLING ENGINE, INVOICES & PAYMENTS

**Branch:** `feature/billing-payments`

Responsible for:

- Automated recurring billing.
- Billing records and billing attempts.
- Duplicate billing prevention.
- Billing scheduler.
- Invoice generation.
- Invoice lifecycle management.
- Invoice confirmation and cancellation.
- Invoice detail and printable views.
- Payment recording.
- Payment methods and references.
- Partial payments.
- Outstanding balance calculation.
- Overdue invoice identification.
- Payment history.
- Financial transaction consistency.

Database entities owned:
- `BillingRecord`
- `BillingAttempt`
- `Invoice`
- `InvoiceLine`
- `Payment`

Backend modules:
- `src/modules/billing/`
- `src/modules/invoices/`
- `src/modules/payments/`

Required APIs:

**Billing**
- `POST /api/v1/billing/run`

**Invoices**
- `GET /api/v1/invoices`
- `GET /api/v1/invoices/:id`
- `POST /api/v1/invoices/:id/confirm`
- `POST /api/v1/invoices/:id/cancel`

**Payments**
- `POST /api/v1/payments`

The billing engine must prevent duplicate invoices, support missed-period recovery and maintain financial consistency.

### PERSON 4 – CUSTOMER SELF-SERVICE PORTAL & FINANCE ANALYTICS

**Branch:** `feature/portal-analytics`

Responsible for:

- Customer self-service portal.
- Customer subscription overview.
- Customer quotation viewing and acceptance.
- Customer invoice and receipt viewing.
- Customer payment history.
- Customer dashboard.
- Finance lead KPI dashboard.
- MRR and ARR calculations.
- Revenue analytics.
- Outstanding balance analytics.
- Overdue invoice reporting.
- Finance reporting APIs.
- Role-based global navigation.

Database access:
- `UserProfile`
- `Customer`
- Aggregated data from `Subscription`, `Invoice` and `Payment`

Backend modules:
- `src/modules/portal/`
- `src/modules/reports/`

Required APIs:

**Customer Portal**
- `GET /api/v1/portal/subscriptions`
- `POST /api/v1/portal/quotations/:id/accept`
- `GET /api/v1/portal/invoices`

**Finance Analytics**
- `GET /api/v1/reports/finance`

The portal must only expose information belonging to the authenticated customer.

The finance dashboard must use efficient database aggregations and aim for response times under two seconds.

---

## 4. SHARED SYSTEM RESPONSIBILITIES

Some functionality is required by multiple modules and must be coordinated across the team.

These include:

- Initial project setup and application configuration.
- Supabase Auth integration.
- User profiles and role-based access control.
- Shared Prisma schema integration.
- Common middleware.
- Shared API response conventions.
- Environment configuration.
- Global frontend layouts.
- Module router registration.
- Git integration and merge conflict resolution.
- End-to-end testing.

Do not assign ownership of another developer's functional module merely because your module depends on it.

Coordinate shared database changes and API contracts before implementation.

Do not independently create duplicate database models, duplicate routes or competing implementations of shared functionality.

---

## 5. AUTHENTICATION AND AUTHORIZATION

Implement authentication using Supabase Auth.

Requirements:

- Customer self-registration.
- Unique email validation.
- Password longer than eight characters, containing uppercase, lowercase and special characters.
- Login and logout.
- Password reset through email.
- Session management.
- Protected frontend routes.
- Backend authentication middleware.
- Role-based authorization.

Roles:

**ADMIN**
- Complete system access.
- Manage staff.
- Manage customers.
- Manage products, plans, taxes and discounts.
- Manage subscriptions, invoices and payments.
- Access financial dashboard and reports.

**STAFF**
- Manage customers.
- Create quotations.
- Manage subscriptions.
- Manage invoices and payments.
- View products and plans.
- Cannot create staff or modify restricted master data.

**CUSTOMER**
- Access only their own account.
- View their subscriptions.
- View quotations.
- View invoices.
- View payment history.
- Manage permitted subscription actions.
- Cannot access another customer's information.

Security requirements:

- Only Admin can create Staff accounts.
- Public registration must never allow users to assign themselves Admin or Staff roles.
- Enforce permissions in the backend, not just the frontend.
- Verify access tokens using Supabase Auth `getUser(accessToken)` or a correctly configured JWT verification mechanism.
- Never use the Supabase secret API key as a JWT signing secret.
- Never expose database credentials or Supabase secret keys to the frontend.

---

## 6. PRODUCT, PLAN, TAX AND DISCOUNT MANAGEMENT

Implement complete CRUD functionality.

Products must contain:
- Product name.
- Product type.
- Sales price.
- Cost price.
- Description or notes.
- Active/inactive status.

Product variants:
- Variant name.
- Additional fixed amount.
- Associated product.

Subscription plans:
- Plan name.
- Description.
- Price.
- Billing interval: Daily, Weekly, Monthly or Yearly.
- Minimum quantity.
- Availability start and end dates.
- Automatic closure.
- Early closure.
- Pause permission.
- Renewal permission.

Tax rules:
- Tax name.
- Tax percentage or applicable fixed amount.
- Tax applicability.
- Active status.

Discount rules:
- Fixed amount or percentage.
- Minimum purchase value.
- Minimum quantity.
- Start and expiry dates.
- Usage limits.
- Product-specific or subscription-wide applicability.

Discounts must be validated before application and their usage counts must be updated safely.

---

## 7. CUSTOMER AND QUOTATION MANAGEMENT

Implement customer management and reusable quotation templates.

Customer information must support:
- Company name.
- Billing email.
- Phone.
- Address line 1.
- City.
- State.
- Postal code.
- Optional association with a registered user.

Customer APIs:
- `GET /api/v1/customers` – Search and list customers.
- `POST /api/v1/customers` – Create a customer profile.

Quotation templates must support:
- Template name.
- Validity period in days.
- Selected subscription plan.
- Products and variants.
- Quantities.
- Unit prices.
- Reusable quotation lines.

Template APIs:
- `GET /api/v1/templates`
- `POST /api/v1/templates`

A quotation must be generated from a reusable template or created manually.

Store quotation and subscription pricing snapshots so historical quotations and subscriptions are not changed when product or plan prices are updated.

---

## 8. SUBSCRIPTION MANAGEMENT

Every subscription must contain:

- Unique subscription number using the `SUB-XXXX` format.
- Customer.
- Selected plan.
- Start date.
- Expiry date.
- Billing interval.
- Payment terms.
- Subscription lines.
- Quantities.
- Unit prices.
- Taxes.
- Discounts.
- Total amount.
- Next billing date.
- Quotation expiry date where applicable.
- Status.

Implement:

- Create subscription.
- Create from quotation template.
- View subscription details.
- Update permitted fields.
- Submit quotation.
- Confirm quotation.
- Activate subscription.
- Pause subscription.
- Resume subscription.
- Renew subscription.
- Close subscription.
- Handle expiry.

Required lifecycle:

`DRAFT → QUOTATION → CONFIRMED → ACTIVE → PAUSED → EXPIRED → CLOSED`

A paused subscription may return to Active through the resume operation.

Rules:

1. A quotation submission must calculate its expiry date using the template validity period.
2. Only Staff/Admin can confirm quotations through the internal subscription API.
3. Activation must calculate the initial next billing date.
4. Pause is permitted only when `plan.allowPause` is true.
5. Resume must recalculate billing dates correctly.
6. Closure must respect `plan.allowEarlyClose` or subscription expiry.
7. Renewal must respect `plan.allowRenewal`.
8. Customers must never access another customer's subscription.
9. Reject invalid lifecycle transitions.

Person 2 owns the internal subscription management and sales pipeline. Person 4 owns the customer-facing quotation acceptance and self-service portal experience. Coordinate their shared subscription and quotation logic rather than implementing duplicate state transitions.

---

## 9. RECURRING BILLING AND INVOICE MANAGEMENT

Implement automated billing for eligible subscriptions.

Invoice information:
- Unique invoice number.
- Customer details.
- Subscription reference.
- Invoice date.
- Due date.
- Product and plan lines.
- Quantities.
- Unit prices.
- Tax details.
- Discount details.
- Subtotal.
- Total tax.
- Grand total.
- Amount paid.
- Outstanding balance.
- Invoice status.

Invoice lifecycle:

`DRAFT → CONFIRMED → PARTIALLY_PAID → PAID`

Also support cancellation where permitted.

Requirements:

1. Generate invoices automatically for eligible subscriptions.
2. Support hundreds of subscriptions in a billing run.
3. Never generate duplicate invoices for the same subscription billing period.
4. Never skip eligible billing periods.
5. Support catch-up billing for missed periods.
6. Skip paused subscriptions.
7. Handle failed billing attempts safely.
8. Maintain historical invoice snapshots.
9. Ensure discounts and taxes are applied correctly.
10. Update the next billing date only after successful invoice generation.

Use database transactions, unique constraints and concurrency controls.

Use appropriate PostgreSQL locking or equivalent concurrency-safe mechanisms when processing billing batches.

Person 3 owns invoice generation and billing implementation. Person 2 supplies the subscription data and lifecycle state required by the billing engine.

---

## 10. DISCOUNT MANAGEMENT

Admin-only discount creation.

Support:
- Fixed amount discounts.
- Percentage discounts.
- Minimum purchase value.
- Minimum quantity.
- Start and expiry dates.
- Usage limits.
- Product-specific discounts.
- Subscription-wide discounts.

Discounts must:
- Be validated before application.
- Stop applying when expired.
- Stop applying when usage limits are exhausted.
- Be recorded in invoice snapshots.
- Have usage counts updated safely when the invoice is confirmed.

Person 1 owns discount rules. Person 2 owns the subscription-to-discount association. Person 3 consumes applicable discount data during invoice generation.

Coordinate the data contracts between these modules.

---

## 11. PAYMENT MANAGEMENT

Implement payment recording.

Payment fields:
- Payment reference.
- Invoice.
- Customer.
- Amount.
- Payment method.
- Payment date.
- Notes.

Support:
- Cash.
- Bank transfer.
- Card.
- UPI.
- Other configurable payment methods.

Implement:
- Full payment.
- Partial payment.
- Outstanding balance.
- Overdue status.
- Payment history.

Reject overpayments unless explicitly supported by an approved business rule.

A payment must always be associated with the correct invoice.

Use database transactions to maintain financial consistency.

---

## 12. CUSTOMER PORTAL AND FINANCIAL DASHBOARD

### Customer Portal

Create a customer-facing portal containing:

- My Subscriptions.
- Current plan and subscription status.
- Start and expiry dates.
- Quotations requiring action.
- Quotation validity countdown.
- Accept quotation action.
- My Invoices and Receipts.
- Payment history.
- Outstanding payments.
- Upcoming billing information.

The portal must verify customer ownership on every request.

### Finance Lead Dashboard

Create a dashboard containing:

- Active subscriptions count.
- MRR (Monthly Recurring Revenue).
- ARR (Annual Recurring Revenue).
- Total revenue collected.
- Total outstanding balance.
- Overdue invoices.
- Recent payments.
- Revenue breakdown by plan.
- Useful date and status filters.

MRR must normalize active subscription values into monthly amounts. ARR is calculated as MRR multiplied by 12.

Use efficient database aggregations instead of fetching all records into the frontend.

Aim for under two-second response times for dashboard queries.

Person 4 owns the portal and finance analytics implementation.

---

## 13. FRONTEND DESIGN REQUIREMENTS

Create a modern, professional SaaS dashboard.

Design requirements:
- Consistent sidebar navigation.
- Responsive layouts.
- Professional typography.
- Reusable components.
- Consistent spacing.
- Clear page hierarchy.
- Searchable and filterable tables.
- Pagination.
- Loading states.
- Empty states.
- Error states.
- Confirmation dialogs.
- Form validation.
- Toast notifications.
- Accessible components.

Create separate navigation and permissions for:
- Admin.
- Staff.
- Customer.

Avoid placeholder buttons and non-functional pages.

Every button, form, filter, action and navigation item must perform its intended functionality.

Use realistic UI data only for clearly marked development previews. Do not leave hardcoded sample data in place of actual API integration.

---

## 14. DATABASE AND ARCHITECTURE

Use Prisma with Supabase PostgreSQL.

Design appropriate relational models for:

- `UserProfile`
- `Customer`
- `Product`
- `ProductVariant`
- `TaxRule`
- `ProductTaxRule`
- `Plan`
- `QuotationTemplate`
- `QuotationTemplateLine`
- `Subscription`
- `SubscriptionLine`
- `DiscountRule`
- `DiscountProduct`
- `SubscriptionDiscount`
- `Invoice`
- `InvoiceLine`
- `Payment`
- `BillingRecord`
- `BillingAttempt`

Additional models may be introduced where justified.

Requirements:
- Proper foreign keys.
- Unique constraints.
- Database indexes.
- Appropriate cascade/restrict behavior.
- Decimal monetary fields.
- Timestamps.
- Historical snapshots.
- Consistent enum values.

Do not modify Supabase-managed authentication tables.

Do not assume Row Level Security automatically protects Prisma queries made through a privileged database connection. Enforce customer ownership and role authorization in the Express backend.

**Shared schema rule:** Each person must coordinate changes to the shared Prisma schema. Do not independently create conflicting versions of the same models or migrations.

---

## 15. BACKEND ENGINEERING AND SHARED API CONVENTIONS

Organize backend code by modules.

Use:
- Routes.
- Controllers.
- Services.
- Repositories where useful.
- Middleware.
- Zod schemas.
- Centralized error handling.
- Consistent API responses.
- Environment configuration.

Version API routes using:

`/api/v1/`

### Success Response

```json
{
  "success": true,
  "data": {}
}
```

### Error Response

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "A descriptive error message"
  }
}
```

### Authentication Header

Every authenticated frontend API call must pass the Supabase JWT access token:

```javascript
const { data: { session } } = await supabase.auth.getSession();

const res = await fetch('/api/v1/...', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }
});
```

Use the shared API client where available.

Document endpoints using Swagger/OpenAPI.

Ensure business logic is not placed directly inside route handlers.

### Module Router Integration

Coordinate router registration in `backend/src/app.js`.

Use the agreed API paths and avoid duplicate route mounts.

Person 1:
- Catalog and discount routes.

Person 2:
- `/api/v1/customers`
- `/api/v1/subscriptions`
- `/api/v1/templates`

Person 3:
- `/api/v1/billing`
- `/api/v1/invoices`
- `/api/v1/payments`

Person 4:
- `/api/v1/portal`
- `/api/v1/reports`

The team must confirm the template route mount and other shared route registrations during integration.

---

## 16. TESTING

Write meaningful tests for all modules.

### Authentication
- Valid login.
- Invalid login.
- Unauthorized access.
- Role restrictions.
- Customer ownership.

### Products and Plans
- CRUD operations.
- Validation.
- Invalid pricing.
- Plan restrictions.
- Tax and discount rules.

### Customers and Quotations
- Customer creation.
- Duplicate or invalid customer data.
- Template creation.
- Template line validation.
- Quotation generation.
- Quotation expiry.
- Unauthorized access.

### Subscriptions
- Unique subscription number.
- Creation from template.
- Lifecycle transitions.
- Pause/resume.
- Renewal.
- Expiry.
- Early closure.
- Unauthorized modifications.

### Billing
- Duplicate billing prevention.
- Missed billing periods.
- Month-end billing.
- Leap years.
- Failed billing.
- Concurrent scheduler execution.

### Invoices and Payments
- Full payment.
- Partial payment.
- Overpayment rejection.
- Outstanding balance.
- Overdue status.
- Invoice cancellation.

### Discounts
- Expiry.
- Usage limits.
- Minimum purchase.
- Invalid product scope.

### Portal and Analytics
- Customer ownership.
- Quotation acceptance.
- Dashboard calculations.
- Date filters.
- Finance report accuracy.

Also test complete end-to-end workflows.

---

## 17. DOCUMENTATION

Create and maintain:

**README.md**
- Project overview.
- Technology stack.
- Installation.
- Environment setup.
- Development commands.
- Project structure.
- Four-person ownership.

Also provide:
- Database relationship documentation.
- API documentation.
- Environment variable example files.
- Team contribution guidelines.
- Git branching strategy.
- Testing instructions.

Never commit actual secrets or `.env` files.

Do not overwrite the existing README without approval. Preserve its agreed team roadmap and specifications.

---

## 18. DEVELOPMENT EXECUTION STRATEGY

Develop the project in coordinated phases.

### PHASE 1 – PROJECT FOUNDATION AND SHARED INTEGRATION

- Inspect the existing repository.
- Configure frontend and backend.
- Verify database connectivity.
- Review Prisma schema.
- Establish Supabase Auth.
- Establish user profiles and RBAC.
- Establish shared API conventions.
- Establish module folder structure.
- Agree on shared database relationships and route registration.

Coordinate this phase across the team. Do not change the agreed ownership of the four functional modules.

### PHASE 2 – PRODUCT CATALOG, PLANS, TAXES AND DISCOUNTS

**Person 1**

- Product CRUD.
- Product variants.
- Subscription plans.
- Tax rules.
- Discount rules.
- Admin catalog and pricing UI.

### PHASE 3 – CUSTOMERS, QUOTATIONS AND SUBSCRIPTION PIPELINE

**Person 2**

- Customer management.
- Quotation templates.
- Template lines.
- Quotation creation.
- Subscription creation.
- Subscription numbering.
- Subscription lines.
- Subscription lifecycle.
- Subscription management UI.

### PHASE 4 – RECURRING BILLING, INVOICES AND PAYMENTS

**Person 3**

- Billing records.
- Billing attempts.
- Automated invoice generation.
- Invoice management.
- Billing scheduler.
- Idempotency and concurrency controls.
- Payment recording.
- Partial payments.
- Outstanding balances.

### PHASE 5 – CUSTOMER PORTAL AND FINANCE ANALYTICS

**Person 4**

- Customer self-service portal.
- Customer subscription view.
- Quotation acceptance.
- Customer invoice view.
- Payment history.
- Finance dashboard.
- MRR and ARR.
- Revenue reports.
- Overdue invoice analytics.

### PHASE 6 – INTEGRATION AND HARDENING

All team members:

- Integrate the four modules.
- Resolve schema conflicts.
- Resolve API integration issues.
- Test complete workflows.
- Perform authorization testing.
- Improve error handling.
- Optimize performance.
- Perform security review.
- Complete documentation.
- Prepare for deployment.

These phases define the overall project sequence. Individual members may work in parallel when shared dependencies and API contracts are agreed upon.

---

## 19. STRICT DEVELOPMENT RULES

- Do not generate the entire project in one uncontrolled operation.
- Implement features in logical phases.
- Do not stop after generating folder structures or placeholder components.
- Do not mark a feature complete until its frontend, backend, database operations and tests work.
- Do not use mock data as a substitute for actual functionality.
- Do not silently ignore errors.
- Do not break existing working features.
- Do not make destructive database changes without explaining them and obtaining approval.
- Do not run production migrations without approval.
- Do not expose secrets.
- Do not create conflicting Prisma migrations.
- Do not leave TODOs for core required functionality.
- Keep the application runnable after each phase.
- Respect the four-person module ownership.
- Do not implement another member's module without coordination.
- Coordinate shared models, API contracts and integration points before modifying them.
- Do not independently change the root README's agreed team allocation.

If required external configuration is missing, identify it clearly. Implement the code around safe environment variables and explain what needs to be configured. Never fabricate credentials.

---

## 20. COMPLETION CRITERIA

The project is complete only when this end-to-end workflow works:

1. Admin logs in.
2. Admin creates Staff accounts.
3. Customer registers independently.
4. Admin creates products, plans, tax rules and discounts.
5. Staff creates a customer profile.
6. Staff creates a quotation using a template or manually.
7. Customer views and accepts the quotation.
8. Subscription is confirmed and activated.
9. Subscription lifecycle actions work according to plan permissions.
10. Billing scheduler detects due subscriptions.
11. Invoice is generated correctly.
12. Customer views the invoice.
13. Staff records a payment.
14. Invoice status and outstanding balance update correctly.
15. Dashboard reflects updated financial information.
16. All permissions are enforced.
17. Historical records remain accurate.
18. Duplicate billing is prevented.
19. All modules work together without breaking existing functionality.

At the end, provide a final implementation report showing:

- Completed features.
- Remaining limitations.
- Database models.
- API endpoints.
- Test results.
- Security considerations.
- How to run the application.
- Deployment instructions.

Start by inspecting the existing project and creating the development checklist. Then proceed through the implementation phases until the complete system is implemented and tested.

**Do not confuse code generation with successful implementation. Verify actual functionality throughout development.**