import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute({ roles }) {
  const { loading, session, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="p-8 text-sm text-slate-500">Loading session…</p>;
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(profile.role)) {
    const home =
      profile.role === 'ADMIN' ? '/admin' : profile.role === 'STAFF' ? '/staff' : '/customer';
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
}
