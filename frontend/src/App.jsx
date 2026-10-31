import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/layouts/AppShell';
import { useAuth } from '@/context/AuthContext';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { UsersPage } from '@/pages/admin/UsersPage';
import { RoleHome } from '@/pages/dashboards/RoleHome';
import { InvoicesPage } from '@/pages/invoices/InvoicesPage';
import { InvoiceDetailPage } from '@/pages/invoices/InvoiceDetailPage';

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

      {/* Admin routes */}
      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route element={<AppShell />}>
          <Route path="/admin" element={<RoleHome role="ADMIN" />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/invoices" element={<InvoicesPage />} />
          <Route path="/admin/invoices/:id" element={<InvoiceDetailPage />} />
        </Route>
      </Route>

      {/* Staff routes */}
      <Route element={<ProtectedRoute roles={['STAFF']} />}>
        <Route element={<AppShell />}>
          <Route path="/staff" element={<RoleHome role="STAFF" />} />
          <Route path="/staff/invoices" element={<InvoicesPage />} />
          <Route path="/staff/invoices/:id" element={<InvoiceDetailPage />} />
        </Route>
      </Route>

      {/* Customer routes */}
      <Route element={<ProtectedRoute roles={['CUSTOMER']} />}>
        <Route element={<AppShell />}>
          <Route path="/customer" element={<RoleHome role="CUSTOMER" />} />
          <Route path="/customer/invoices" element={<InvoicesPage />} />
          <Route path="/customer/invoices/:id" element={<InvoiceDetailPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
