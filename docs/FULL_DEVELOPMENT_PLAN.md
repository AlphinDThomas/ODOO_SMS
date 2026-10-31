# Brightloop Subscription Management System (SMS)
## Comprehensive Implementation Plan & 4-Person Team Roadmap

---

## 1. Executive Summary & Technical Architecture

Brightloop Software is transitioning from manual spreadsheets, forgotten renewals, and handwritten invoices to a unified, automated subscription management platform.

### Tech Stack
- **Frontend:** React (Vite) + Tailwind CSS + Lucide Icons + React Router DOM
- **Backend:** Node.js (ES Modules) + Express + Zod (Validation)
- **Database & ORM:** PostgreSQL on Supabase + Prisma ORM
- **Authentication:** Supabase Auth (JWT) integrated with PostgreSQL `UserProfile` for Role-Based Access Control (`ADMIN`, `STAFF`, `CUSTOMER`)

### System Architecture Flow
```
                     ┌────────────────────────────────────────────────────────┐
                     │             React Frontend (Vite + Tailwind)           │
                     │  /admin (Admin Shell) │ /staff │ /customer (Portal)    │
                     └───────────────┬────────────────────────┬───────────────┘
                                     │ JWT                    │ /api/v1/*
                                     ▼                        ▼
                          ┌──────────────────┐    ┌───────────────────────────┐
                          │  Supabase Auth   │    │    Express REST API       │
                          │  (Users & Token) │    │  Auth Guard & RBAC Checks │
                          └──────────────────┘    └─────────────┬─────────────┘
                                                                │ Prisma ORM
                                                                ▼
                                                  ┌───────────────────────────┐
                                                  │    Supabase PostgreSQL    │
                                                  │  (Tables, Indices, Enums) │
                                                  └───────────────────────────┘
```

---

## 2. Team Split Overview (4 Developer Tracks)

Each developer owns a complete vertical slice of the application (both backend logic and frontend UI) to minimize merge conflicts and maximize velocity.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PERSON 1: Product Catalog, Plans, Taxes & Discount Rules Engine             │
│ PERSON 2: Customers, Quotation Templates & Subscription Sales Pipeline      │
│ PERSON 3: Automated Recurring Billing Engine, Invoices & Payments           │
│ PERSON 4: Customer Self-Service Portal & Finance Lead KPI Dashboard         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Specifications per Developer

---

### 👤 Person 1: Product Catalog, Plans, Taxes & Discount Rules
**Role:** Catalog & Pricing Engine Lead  
**Branch:** `feature/catalog-plans`

#### A. Database Entities Owned
- `Product` (`type`: `SOFTWARE`, `ADDON`, `OTHER`, `salesPrice`, `costPrice`, `notes`)
- `ProductVariant` (`name`: e.g. "Brand: Odoo", `priceAdjustment`: `+560.00`)
- `TaxRule` & `ProductTaxRule` (`name`: e.g. "Standard GST", `ratePercent`: `18.00%`, `isDefault`)
- `Plan` (`interval`: `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`, `minQuantity`, `availableFrom`, `availableTo`, `autoCloseOnEnd`, `allowEarlyClose`, `allowPause`, `allowRenewal`)
- `DiscountRule` & `DiscountProduct` (`type`: `FIXED` or `PERCENTAGE`, `value`, `minPurchaseAmount`, `minQuantity`, `maxUses`, `usesCount`, `scope`: `PRODUCT` or `SUBSCRIPTION`)

#### B. Backend API Endpoints to Implement (`src/modules/catalog/` & `src/modules/discounts/`)
1. **Products & Variants:**
   - `GET /api/v1/products` - List products with nested variants and applicable tax rules.
   - `POST /api/v1/products` - Create product (Admin only).
   - `POST /api/v1/products/:id/variants` - Add variant (e.g. Odoo brand +560).
   - `PUT /api/v1/products/:id` & `DELETE /api/v1/products/:id` (soft deactivate via `isActive`).
2. **Tax Rules:**
   - `GET /api/v1/taxes` - List all tax rules.
   - `POST /api/v1/taxes` - Create a tax rule and optionally set as default.
3. **Plans:**
   - `GET /api/v1/plans` - List plans (filter by active/available dates).
   - `POST /api/v1/plans` - Create plan with all lifecycle flags.
4. **Discount Rules:**
   - `GET /api/v1/discounts` - List discount rules with current usage counts.
   - `POST /api/v1/discounts` - Create rule (validate start/end dates, max uses).

#### C. Frontend UI Pages to Build (`src/pages/admin/`)
1. **Product Catalog Page (`/admin/products`):**
   - Grid/Table showing products, type badges, sales price, cost price, and variant badges.
   - Modal to create products and add variants with instant price adjustment preview.
2. **Plans Management Page (`/admin/plans`):**
   - Card layout for each plan (interval badge, pricing, availability dates).
   - Form with switch toggles for:
     - Auto-close on end date
     - Allow early close
     - Allow pause
     - Allow renewal
3. **Discount Rules Page (`/admin/discounts`):**
   - Table displaying rule name, scope (`PRODUCT` / `SUBSCRIPTION`), discount value, and progress bar for `usesCount / maxUses`.
4. **Tax Settings Modal/Tab (`/admin/taxes`):**
   - Form to define tax percentages and assign default taxes.

---

### 👤 Person 2: Customers, Quotation Templates & Subscriptions Pipeline
**Role:** Sales Pipeline & Subscription State Machine Lead  
**Branch:** `feature/subscriptions-sales`

#### A. Database Entities Owned
- `Customer` (`companyName`, `billingEmail`, `phone`, `addressLine1`, `city`, `state`, `postalCode`)
- `QuotationTemplate` & `QuotationTemplateLine` (`validityDays`, lines with product, variant, quantity, unit price)
- `Subscription` & `SubscriptionLine` (`number`: `SUB-XXXX`, `status`: `DRAFT` -> `QUOTATION` -> `CONFIRMED` -> `ACTIVE` -> `PAUSED` -> `EXPIRED` -> `CLOSED`)
- `SubscriptionDiscount` (link discounts to specific subscriptions)

#### B. Backend API Endpoints to Implement (`src/modules/customers/` & `src/modules/subscriptions/`)
1. **Customers:**
   - `GET /api/v1/customers` - Search/list customers.
   - `POST /api/v1/customers` - Create customer profile (can be linked to a registered user or standalone).
2. **Quotation Templates:**
   - `GET /api/v1/templates` - List templates with lines.
   - `POST /api/v1/templates` - Create reusable quotation templates.
3. **Subscription Lifecycle & State Machine:**
   - `GET /api/v1/subscriptions` - List with filters (`status`, `customerId`, `planId`).
   - `POST /api/v1/subscriptions` - Create draft subscription from scratch or by importing a `templateId`. Auto-generate number `SUB-XXXX`.
   - `POST /api/v1/subscriptions/:id/submit-quote` - Move `DRAFT` -> `QUOTATION`, compute `quotationExpiresAt = now + validityDays`.
   - `POST /api/v1/subscriptions/:id/confirm` - Staff/Admin confirms quote -> moves to `CONFIRMED`.
   - `POST /api/v1/subscriptions/:id/activate` - Move to `ACTIVE`, compute initial `nextBillingDate`.
   - `POST /api/v1/subscriptions/:id/pause` - If `plan.allowPause` is true, freeze subscription.
   - `POST /api/v1/subscriptions/:id/resume` - Unfreeze subscription and recalculate billing dates.
   - `POST /api/v1/subscriptions/:id/close` - Check `plan.allowEarlyClose` or expiration before closing.

#### C. Frontend UI Pages to Build (`src/pages/admin/` & `src/pages/staff/`)
1. **Customers Directory (`/admin/customers` or `/staff/customers`):**
   - List customers with email, active subscription count, and action to create new subscription.
2. **Quotation Templates Page (`/admin/templates`):**
   - Form to build templates: select plan, set validity period in days, add default product lines.
3. **Subscriptions Management & Pipeline (`/admin/subscriptions`):**
   - Kanban board or tabbed table organized by status (`Draft`, `Quotation`, `Confirmed`, `Active`, `Paused`, `Closed`).
   - Detail View: Status timeline header, customer information, product lines, line subtotals, tax breakdown, and lifecycle action buttons ("Submit Quotation", "Confirm", "Pause", "Close").
4. **New Subscription / Quote Builder Modal:**
   - "Start from Template" selector or custom product line picker with automatic variant pricing.

---

### 👤 Person 3: Recurring Billing Engine, Invoices & Payments
**Role:** Billing & Financial Transactions Lead  
**Branch:** `feature/billing-payments`

#### A. Database Entities Owned
- `BillingRecord` & `BillingAttempt` (Idempotent tracking with `unique([subscriptionId, periodStart])`)
- `Invoice` & `InvoiceLine` (`number`: `INV-XXXX`, `status`: `DRAFT` -> `CONFIRMED` -> `PARTIALLY_PAID` -> `PAID` / `CANCELLED`)
- `Payment` (`method`: `BANK_TRANSFER`, `CARD`, `CASH`, `UPI`, `OTHER`, `amount`, `paidAt`, `note`)

#### B. Backend API Endpoints to Implement (`src/modules/billing/` & `src/modules/invoices/`)
1. **Batch Automated Billing Engine (`POST /api/v1/billing/run`):**
   - Query all `ACTIVE` subscriptions where `nextBillingDate <= today`.
   - Wrap operations in a transaction with PostgreSQL advisory lock `814729` (prevents concurrent double-execution).
   - Insert `BillingRecord` for `(subscriptionId, periodStart)`:
     - On duplicate constraint violation (`P2002`) -> Skip cleanly without duplicating invoices.
   - Generate `Invoice`:
     - Snapshot customer details (`customerSnapshot`).
     - Generate line items from `SubscriptionLine`.
     - Calculate tax amounts from `ProductTaxRule`.
     - Evaluate and apply valid `DiscountRule` (check `minPurchaseAmount`, `minQuantity`, `maxUses`).
     - Calculate `subtotal`, `discountTotal`, `taxTotal`, `grandTotal`, and set `balanceDue = grandTotal`.
   - Advance subscription `nextBillingDate` based on `billingInterval` (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`).
2. **Invoices API:**
   - `GET /api/v1/invoices` - Filter by status (`DRAFT`, `CONFIRMED`, `PAID`, `OVERDUE`).
   - `GET /api/v1/invoices/:id` - Full invoice detail with lines and payment history.
   - `POST /api/v1/invoices/:id/confirm` - Move `DRAFT` -> `CONFIRMED`.
   - `POST /api/v1/invoices/:id/cancel` - Cancel invoice.
3. **Payments API:**
   - `POST /api/v1/payments`:
     - Lock invoice row via transaction.
     - Reject if `amount > balanceDue`.
     - Insert `Payment` record with `recordedById`.
     - Update invoice `amountPaid = amountPaid + paymentAmount` and `balanceDue = grandTotal - amountPaid`.
     - Transition invoice status: `PAID` if `balanceDue === 0`, else `PARTIALLY_PAID`.

#### C. Frontend UI Pages to Build (`src/pages/admin/` & `src/pages/staff/`)
1. **Invoices Directory (`/admin/invoices`):**
   - List of invoices with status badges, customer name, issue date, due date, grand total, and balance due.
   - Filter chips: "All", "Draft", "Confirmed", "Partially Paid", "Paid", "Overdue".
   - "Trigger Billing Run" button with confirmation modal showing results summary.
2. **Invoice Detail & Printable View (`/admin/invoices/:id`):**
   - Clean, professional invoice layout formatted for printing (CSS print media query).
   - Customer info, itemized lines, subtotal, discounts applied, taxes, grand total, payment log.
3. **"Record Payment" Modal:**
   - Form fields: Amount (prefilled with `balanceDue`), Payment Method dropdown (`Bank Transfer`, `Card`, `UPI`, `Cash`), Date picker, Reference note.
   - Real-time balance preview before submitting.

---

### 👤 Person 4: Customer Portal & Finance Analytics Dashboard
**Role:** Portal Experience & Analytics Lead  
**Branch:** `feature/portal-analytics`

#### A. Database Entities Owned & Read
- `UserProfile` & `Customer` (User-to-Customer mapping)
- Aggregation across `Subscription`, `Invoice`, and `Payment`

#### B. Backend API Endpoints to Implement (`src/modules/portal/` & `src/modules/reports/`)
1. **Customer Self-Service Portal Endpoints (`src/modules/portal/`):**
   - `GET /api/v1/portal/subscriptions` - Returns only the subscriptions for the authenticated customer (`req.profile.customer.id`).
   - `POST /api/v1/portal/quotations/:id/accept` - Customer accepts a quotation:
     - Verify customer owns the quote.
     - Verify `now < quotationExpiresAt`.
     - Transition status from `QUOTATION` -> `CONFIRMED`.
   - `GET /api/v1/portal/invoices` - Customer's invoices and payment receipts.
2. **Finance Lead Analytics API (`GET /api/v1/reports/finance`):**
   - Fast, aggregated financial queries designed for **< 2 second** response time:
     - **Active Subscriptions Count** (`status = 'ACTIVE'`).
     - **MRR (Monthly Recurring Revenue):** Normalized sum of all active subscriptions converted to monthly value.
     - **ARR (Annual Recurring Revenue):** `MRR * 12`.
     - **Total Revenue Collected:** Sum of all recorded payments within date range.
     - **Total Outstanding Balance:** Sum of `balanceDue` on `CONFIRMED` and `PARTIALLY_PAID` invoices.
     - **Overdue Invoices List:** Invoices where `status != 'PAID'` and `dueDate < CURRENT_DATE`.

#### C. Frontend UI Pages to Build (`src/pages/customer/` & `src/pages/dashboards/`)
1. **Customer Portal (`/customer`):**
   - **My Subscriptions View:** Cards showing current plans, start/expiry dates, and status.
   - **Quotes Requiring Action:** Prominent alert card for open quotations with validity countdown timer and a one-click **"Accept Quotation"** button.
   - **My Invoices & Receipts:** Downloadable/printable invoice copies and payment history.
2. **Finance Lead Executive Dashboard (`/admin` and `/staff` default page):**
   - 4 Top KPI Cards: Active Subscriptions, MRR / ARR, Total Revenue Collected, Total Outstanding Receivables.
   - **Overdue Collections Widget:** Table of overdue invoices with customer contact email, amount owed, and days overdue for instant chasing.
   - Revenue breakdown chart or summary table by plan type.
3. **Global Navigation Polish (`src/layouts/AppShell.jsx`):**
   - Sidebar navigation dynamically customized based on user role (`ADMIN`, `STAFF`, `CUSTOMER`).
   - User profile dropdown with role badge and sign-out button.

---

## 4. Shared API Standard & Conventions

All endpoints should follow the established error handling and response schema:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
Handled automatically by `src/middleware/errorHandler.js`:
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Payment exceeds the outstanding balance"
  }
}
```

### Authentication Header
Every frontend API call must pass the Supabase JWT access token:
```javascript
const { data: { session } } = await supabase.auth.getSession();
const res = await fetch('/api/v1/...', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }
});
```
*(Handled automatically if you use `src/lib/api.js`).*

---

## 5. Immediate Action Checklist (Getting Started Now)

### Step 1: Bootstrap the Admin User
1. Create an account via the frontend registration page or in your Supabase Auth dashboard with your email.
2. In PowerShell, promote that user to `ADMIN`:
   ```powershell
   cd C:\Users\bobby\ODOO_SMS\backend
   $env:BOOTSTRAP_ADMIN_EMAIL="your_email@example.com"
   node src/scripts/bootstrapAdmin.js
   ```

### Step 2: Create the 4 Feature Branches
```powershell
git checkout main
git pull
git checkout -b feature/catalog-plans       # Person 1
git checkout -b feature/subscriptions-sales # Person 2
git checkout -b feature/billing-payments    # Person 3
git checkout -b feature/portal-analytics    # Person 4
```

### Step 3: Mount Module Routers in `backend/src/app.js`
As each person creates their route file, wire it into `src/app.js`:
```javascript
app.use('/api/v1/catalog', catalogRouter);          // Person 1
app.use('/api/v1/discounts', discountsRouter);      // Person 1
app.use('/api/v1/customers', customersRouter);      // Person 2
app.use('/api/v1/subscriptions', subsRouter);       // Person 2
app.use('/api/v1/billing', billingRouter);          // Person 3
app.use('/api/v1/invoices', invoicesRouter);        // Person 3
app.use('/api/v1/payments', paymentsRouter);        // Person 3
app.use('/api/v1/portal', portalRouter);            // Person 4
app.use('/api/v1/reports', reportsRouter);          // Person 4
```

### Step 4: Run the Development Servers
- **Backend:**
  ```powershell
  cd C:\Users\bobby\ODOO_SMS\backend
  npm run dev
  ```
  *(Running on `http://localhost:5000`)*
- **Frontend:**
  ```powershell
  cd C:\Users\bobby\ODOO_SMS\frontend
  npm run dev
  ```
  *(Running on `http://localhost:5173`)*
