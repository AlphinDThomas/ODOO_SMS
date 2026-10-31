import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/layouts/AppShell';
import { useAuth } from '@/context/AuthContext';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { UsersPage } from '@/pages/admin/UsersPage';
import { ProductsPage } from '@/pages/admin/ProductsPage';
import { PlansPage } from '@/pages/admin/PlansPage';
import { TaxesPage } from '@/pages/admin/TaxesPage';
import { DiscountsPage } from '@/pages/admin/DiscountsPage';
import { CustomerPortalPage } from '@/pages/customer/CustomerPortalPage';
import { CustomerCatalogPage } from '@/pages/customer/CustomerCatalogPage';
import { CustomerNotificationsPage } from '@/pages/customer/CustomerNotificationsPage';
import { CustomerProfilePage } from '@/pages/customer/CustomerProfilePage';
import { FinanceDashboardPage } from '@/pages/dashboards/FinanceDashboardPage';
import { InvoicesPage } from '@/pages/invoices/InvoicesPage';
import { InvoiceDetailPage } from '@/pages/invoices/InvoiceDetailPage';
import { CustomersPage } from '@/pages/customers/CustomersPage';
import { TemplatesPage } from '@/pages/templates/TemplatesPage';
import { SubscriptionsPage } from '@/pages/subscriptions/SubscriptionsPage';
import { NewSubscriptionPage } from '@/pages/subscriptions/NewSubscriptionPage';
import { SubscriptionDetailPage } from '@/pages/subscriptions/SubscriptionDetailPage';

function HomeRedirect() {
  const { loading, profile, session } = useAuth();
  if (loading) return <p className="p-8 text-sm text-slate-500">Loading…</p>;
  if (!session || !profile) return <Navigate to="/login" replace />;
  if (profile.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (profile.role === 'STAFF') return <Navigate to="/staff" replace />;
  return <Navigate to="/customer" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route element={<AppShell />}>
          <Route path="/admin" element={<FinanceDashboardPage role="ADMIN" />} />
          <Route path="/admin/invoices" element={<InvoicesPage />} />
          <Route path="/admin/invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/customers" element={<CustomersPage />} />
          <Route path="/admin/templates" element={<TemplatesPage />} />
          <Route path="/admin/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/admin/subscriptions/new" element={<NewSubscriptionPage />} />
          <Route path="/admin/subscriptions/:id" element={<SubscriptionDetailPage />} />
          <Route path="/admin/products" element={<ProductsPage />} />
          <Route path="/admin/plans" element={<PlansPage />} />
          <Route path="/admin/taxes" element={<TaxesPage />} />
          <Route path="/admin/discounts" element={<DiscountsPage />} />
        </Route>
      </Route>

      {/* Staff Protected Routes */}
      <Route element={<ProtectedRoute roles={['STAFF']} />}>
        <Route element={<AppShell />}>
          <Route path="/staff" element={<FinanceDashboardPage role="STAFF" />} />
          <Route path="/staff/invoices" element={<InvoicesPage />} />
          <Route path="/staff/invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="/staff/customers" element={<CustomersPage />} />
          <Route path="/staff/templates" element={<TemplatesPage />} />
          <Route path="/staff/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/staff/subscriptions/new" element={<NewSubscriptionPage />} />
          <Route path="/staff/subscriptions/:id" element={<SubscriptionDetailPage />} />
        </Route>
      </Route>

      {/* Customer Protected Routes */}
      <Route element={<ProtectedRoute roles={['CUSTOMER']} />}>
        <Route element={<AppShell />}>
          <Route path="/customer" element={<CustomerPortalPage />} />
          <Route path="/customer/catalog" element={<CustomerCatalogPage />} />
          <Route path="/customer/invoices" element={<InvoicesPage />} />
          <Route path="/customer/invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="/customer/notifications" element={<CustomerNotificationsPage />} />
          <Route path="/customer/profile" element={<CustomerProfilePage />} />
        </Route>
      </Route>
    </Routes>
  );
}
