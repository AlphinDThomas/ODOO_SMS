# ODOO_SMS – Subscription Management System

## About the Project

ODOO_SMS is a Subscription Management System developed for **Brightloop Software**, a fictional software company.

The application aims to simplify subscription-based business operations by bringing product management, customer management, quotations, subscriptions, recurring billing, invoices, payments and financial reporting into one platform.

The system supports three types of users: Admin, Staff and Customer, each with different levels of access.

## Technology Stack

**Frontend**
- React.js with Vite
- JavaScript
- Tailwind CSS
- shadcn/ui
- React Router DOM
- Axios
- Recharts
- Lucide React

**Backend**
- Node.js
- Express.js
- Prisma ORM
- Zod

**Database and Authentication**
- Supabase PostgreSQL
- Supabase Auth

**Development Tools**
- Git and GitHub
- Postman
- Swagger/OpenAPI
- ESLint

## Team Responsibilities

The project is divided among four team members:

| Member | Responsibility | Branch |
|---|---|---|
| Person 1 | Product Catalog, Plans, Taxes and Discount Rules | `feature/catalog-plans` |
| Person 2 | Customers, Quotation Templates and Subscription Sales Pipeline | `feature/subscriptions-sales` |
| Person 3 | Recurring Billing, Invoices and Payments | `feature/billing-payments` |
| Person 4 | Customer Portal and Finance Analytics | `feature/portal-analytics` |

Each member handles the frontend and backend development of their assigned module. Shared components and database changes are coordinated during integration.

## Project Structure

```text
ODOO_SMS/
│
├── backend/
│   └── Express application
│
├── frontend/
│   └── React application
│
├── .gitignore
└── README.md
```

## User Roles

### Admin
- Manage staff accounts.
- Manage customers.
- Manage products, plans, taxes and discounts.
- Manage subscriptions, invoices and payments.
- Access financial reports and dashboards.

### Staff
- Manage customer information.
- Create quotations.
- Manage subscriptions.
- Handle invoices and payments.
- View products and subscription plans.

### Customer
- View personal subscription details.
- View and accept quotations.
- Access invoices and receipts.
- View payment history.
- Check outstanding payments and upcoming billing information.

## Getting Started

### Prerequisites

- Node.js and npm
- Git
- Supabase account

### Clone the Repository

```bash
git clone <repository-url>
cd ODOO_SMS
```

### Backend Setup

```bash
cd backend
npm install
```

Configure the required environment variables before starting the backend.

### Frontend Setup

```bash
cd frontend
npm install
```

Configure the frontend environment variables and start the development server using the script defined in `package.json`.

## API Convention

All backend endpoints use the following base path:

`/api/v1/`

Successful responses follow this format:

```json
{
  "success": true,
  "data": {}
}
```

Error responses follow this format:

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "A descriptive error message"
  }
}
```

Authenticated requests use a Supabase access token through the Authorization header.

## Development Guidelines

- Follow the agreed responsibilities of each team member.
- Maintain consistent coding practices.
- Use reusable components and modular code.
- Validate incoming requests on the backend.
- Enforce authentication and role-based access.
- Coordinate changes to shared database models.
- Test features before integrating them.
- Keep sensitive credentials out of the repository.

## Project Status

Currently under development.

---

**Brightloop Software – ODOO_SMS**