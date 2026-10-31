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
import { RoleHome } from '@/pages/dashboards/RoleHome';

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

      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route element={<AppShell />}>
          <Route path="/admin" element={<RoleHome role="ADMIN" />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/products" element={<ProductsPage />} />
          <Route path="/admin/plans" element={<PlansPage />} />
          <Route path="/admin/taxes" element={<TaxesPage />} />
          <Route path="/admin/discounts" element={<DiscountsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['STAFF']} />}>
        <Route element={<AppShell />}>
          <Route path="/staff" element={<RoleHome role="STAFF" />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['CUSTOMER']} />}>
        <Route element={<AppShell />}>
          <Route path="/customer" element={<RoleHome role="CUSTOMER" />} />
        </Route>
      </Route>
    </Routes>
  );
}
