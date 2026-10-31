# ODOO_SMS – Complete Person 2 Module Implementation

You are acting as the primary AI development engineer for my assigned part of the ODOO_SMS (Subscription Management System) project.

Your responsibility is to **fully implement and complete all development work assigned to Person 2** in this project.

This is an implementation task, not merely a code review, planning exercise or analysis task.

## 1. Mandatory Documentation

Before making any changes, read these three files completely:

1. `docs/MASTER_PROMPT.md`
2. `docs/FULL_DEVELOPMENT_PLAN.md`
3. `docs/MEMBER2_DEVELOPMENT.md`

Understand the overall project requirements, full development roadmap, team responsibilities and my exact implementation scope.

Use these documents as the primary project specifications.

## 2. My Assigned Role – Person 2

I am **Person 2: Customers, Quotation Templates and Subscription Sales Pipeline**.

You must implement every feature assigned to Person 2 in `MEMBER2_DEVELOPMENT.md` and the agreed team development plan.

My responsibilities include:

### A. Customer Management
- Customer creation and management.
- Customer directory and listing.
- Customer details and editing.
- Customer information validation.
- Customer search and filtering.
- Integration with authentication and role-based access control.

### B. Quotation Template Management
- Create and manage quotation templates.
- Add and manage quotation template lines.
- Select products and plans from the shared catalog.
- Support pricing and quantity information.
- Validate quotation template data.
- Allow quotations to be created using existing templates or manually.

### C. Subscription Sales Pipeline
- Create draft subscriptions.
- Automatically generate subscription numbers using the required `SUB-XXXX` format.
- Add and manage subscription lines.
- Associate subscriptions with customers.
- Support subscription creation from quotation templates.
- Maintain pricing snapshots as specified in the project requirements.
- Handle quotation validity and expiry.
- Implement the quotation submission and confirmation workflow.
- Associate applicable discounts using the shared discount engine.

### D. Subscription Lifecycle Management

Implement the complete lifecycle and its valid transitions:

- DRAFT
- QUOTATION
- CONFIRMED
- ACTIVE
- PAUSED
- EXPIRED
- CLOSED

Support the required actions:
- Submit quotation.
- Confirm quotation.
- Activate subscription.
- Pause subscription.
- Resume subscription.
- Renew subscription.
- Close subscription.

Implement proper validation so that invalid status transitions cannot occur.

## 3. Backend Implementation

Complete the backend implementation for my module.

Expected module structure:

- `backend/src/modules/customers/`
- `backend/src/modules/subscriptions/`

Follow the existing project architecture and conventions.

Implement all required:
- Database models and relationships.
- Prisma schema changes and migrations.
- Routes.
- Controllers.
- Services.
- Zod validation schemas.
- Middleware and authorization checks where required.
- Error handling.
- API response formatting.

Implement the documented APIs, including:

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

Support the filters and request formats defined in the documentation.

Do not implement endpoints superficially. Each endpoint must perform its actual business operation, validate input, enforce permissions and return appropriate responses.

## 4. Frontend Implementation

Complete the frontend for all Person 2 features.

Implement the required pages and functionality:

1. Customer Directory.
2. Customer Creation and Editing.
3. Quotation Template Management.
4. Quotation Template Creation.
5. Subscription Management Dashboard.
6. Subscription Creation / Quote Builder.
7. Subscription Details.
8. Subscription Lifecycle Actions.
9. Subscription Status Timeline.

The subscription management interface should provide a clear way to view and manage subscriptions by status.

The subscription detail page should display:
- Customer information.
- Subscription number.
- Current status.
- Subscription lines.
- Product and plan information.
- Quantities and pricing.
- Subtotals.
- Applicable discounts.
- Tax breakdown.
- Relevant dates.
- Status history and available actions.

Use the existing design system, reusable components and frontend architecture. Ensure that all UI actions are connected to actual backend APIs.

## 5. Integration With Other Team Members

This is a four-person team project. Respect the following ownership:

- Person 1: Product Catalog, Plans, Taxes and Discount Rules Engine.
- Person 2: Customers, Quotation Templates and Subscription Sales Pipeline.
- Person 3: Automated Recurring Billing Engine, Invoices and Payments.
- Person 4: Customer Self-Service Portal and Finance Analytics.

You must complete Person 2's work without unnecessarily duplicating or replacing other members' implementations.

For integration:

- Consume Person 1's catalog, plan, tax and discount functionality.
- Provide the required subscription and customer data for Person 3's billing engine.
- Maintain the required customer and subscription data relationships for Person 4's portal and analytics.
- Follow the shared database schema and API contracts.
- If a required dependency is not yet implemented, create a compatible integration point and clearly document it. Do not invent a conflicting implementation.

## 6. Development Rules

- Inspect the existing repository before modifying code.
- Preserve working functionality.
- Follow the specified technology stack.
- Use modular, maintainable and reusable code.
- Maintain consistency with existing naming conventions.
- Implement proper frontend and backend validation.
- Enforce role-based authorization on the backend.
- Do not expose environment variables or secret keys.
- Avoid unnecessary dependencies.
- Do not introduce duplicate models, routes or components.
- Do not modify another person's module unnecessarily.
- Do not commit or push Git changes unless explicitly instructed.

## 7. Implementation Strategy

Work in logical phases, but continue until the complete Person 2 scope is implemented.

**Phase 1 – Repository Analysis**
- Read all documentation.
- Inspect existing code.
- Identify existing models, routes, components and dependencies.
- Determine which Person 2 features are already implemented and which are missing.

**Phase 2 – Database and Backend**
- Implement or update the required Prisma models.
- Create migrations.
- Implement customer management.
- Implement quotation templates.
- Implement subscription creation and management.
- Implement lifecycle transitions.
- Implement and validate all required APIs.

**Phase 3 – Frontend**
- Build all Person 2 pages.
- Integrate the APIs.
- Implement forms, tables, filters, dialogs and lifecycle actions.
- Ensure responsive and consistent UI.

**Phase 4 – Integration**
- Integrate with Person 1's catalog, plans, tax and discount functionality.
- Ensure subscription data is compatible with Person 3's billing requirements.
- Ensure compatibility with Person 4's customer portal and analytics requirements.

**Phase 5 – Testing and Verification**
- Test all APIs.
- Test database operations.
- Test validation and error handling.
- Test authentication and role permissions.
- Test subscription lifecycle transitions.
- Test frontend-to-backend integration.
- Fix errors and regressions.

**Phase 6 – Documentation and Completion**
- Update relevant documentation.
- Document APIs and any required integration contracts.
- List completed features.
- List any unresolved dependencies or limitations.

## 8. Execution Instructions

IMPORTANT:

1. Do not stop after producing an analysis report.
2. Do not merely provide instructions or code snippets for me to implement manually.
3. Actually create and modify the required project files.
4. Implement the backend and frontend functionality.
5. Run the available tests and build checks.
6. Fix errors encountered during implementation.
7. Continue through all phases until the entire Person 2 scope is completed.

You may divide the work into multiple implementation stages to maintain code quality, but do not consider the task finished until all assigned features have been implemented and verified.

If you encounter a missing dependency from another team member, do not silently skip the feature. Implement the appropriate compatible integration point, record the dependency and continue with the remaining work.

If a critical ambiguity or conflict makes implementation unsafe, explain the issue and ask me before making an incompatible architectural decision.

## 9. Final Completion Report

Once development is complete, provide:

- All implemented features.
- All created and modified files.
- Database changes and migrations.
- APIs implemented.
- Frontend pages and components implemented.
- Integration completed with other modules.
- Tests executed and their results.
- Build status.
- Remaining issues or dependencies, if any.

**FINAL OBJECTIVE: Fully develop, integrate, test and complete my entire Person 2 responsibility in ODOO_SMS. Do not stop at analysis or scaffolding. Deliver working, maintainable and integrated functionality.**