import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const NAV = {
  ADMIN: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/invoices', label: 'Invoices & Billing' },
    { to: '/admin/users', label: 'Users' },
  ],
  STAFF: [
    { to: '/staff', label: 'Dashboard' },
    { to: '/staff/invoices', label: 'Invoices & Billing' },
  ],
  CUSTOMER: [
    { to: '/customer', label: 'Dashboard' },
    { to: '/customer/invoices', label: 'My Invoices' },
  ],
};

export function AppShell() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const links = NAV[profile?.role] ?? [];

  async function onSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-svh bg-slate-50 text-slate-900">
      <div className="flex min-h-svh">
        <aside className="hidden w-60 border-r border-slate-200 bg-white p-4 md:block">
          <p className="mb-6 text-sm font-semibold tracking-tight">Brightloop SMS</p>
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm',
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <LayoutDashboard className="size-4" />
              <span>{profile?.role}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-slate-600 sm:inline">{profile?.email}</span>
              <Button variant="outline" size="sm" onClick={onSignOut}>
                <LogOut className="size-4" />
                Sign out
              </Button>
            </div>
          </header>
          <main className="p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
