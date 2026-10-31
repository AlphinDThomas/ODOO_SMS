import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ChevronDown,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const NAV = {
  ADMIN: [
    { to: '/admin', label: 'Finance Analytics', icon: BarChart3 },
    { to: '/admin/invoices', label: 'Invoices & Billing', icon: Receipt },
    { to: '/admin/users', label: 'Staff & Users', icon: Users },
  ],
  STAFF: [
    { to: '/staff', label: 'Finance Analytics', icon: BarChart3 },
    { to: '/staff/invoices', label: 'Invoices & Billing', icon: Receipt },
  ],
  CUSTOMER: [
    { to: '/customer', label: 'Customer Portal', icon: LayoutDashboard },
    { to: '/customer#quotes', label: 'Quotes & Offers', icon: Sparkles },
    { to: '/customer#subscriptions', label: 'My Subscriptions', icon: Layers },
    { to: '/customer#invoices', label: 'Invoices & Receipts', icon: Receipt },
  ],
};

function RoleBadge({ role }) {
  const styles = {
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    STAFF: 'bg-blue-100 text-blue-800 border-blue-200',
    CUSTOMER: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  const style = styles[role] || 'bg-slate-100 text-slate-800 border-slate-200';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider',
        style,
      )}
    >
      {role}
    </span>
  );
}

export function AppShell() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const links = NAV[profile?.role] ?? [];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function onSignOut() {
    await signOut();
    navigate('/login');
  }

  const initials = (profile?.fullName || profile?.email || 'U')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-svh bg-slate-50 text-slate-900">
      <div className="flex min-h-svh">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 border-r border-slate-200 bg-white p-5 md:flex md:flex-col md:justify-between">
          <div>
            <div className="mb-6 flex items-center gap-2.5 px-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-sm">
                BL
              </div>
              <div>
                <p className="text-sm font-bold tracking-tight text-slate-900">Brightloop SMS</p>
                <p className="text-[11px] font-medium text-slate-400">Subscription Platform</p>
              </div>
            </div>

            <nav className="flex flex-col gap-1">
              <div className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Navigation
              </div>
              {links.map((link) => {
                const Icon = link.icon;
                const isAnchor = link.to.includes('#');

                return isAnchor ? (
                  <a
                    key={link.to}
                    href={link.to}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    {Icon && <Icon className="size-4 shrink-0 text-slate-400" />}
                    <span>{link.label}</span>
                  </a>
                ) : (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {Icon && (
                          <Icon
                            className={cn('size-4 shrink-0', isActive ? 'text-white' : 'text-slate-400')}
                          />
                        )}
                        <span>{link.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Account Card */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 truncate">
                <div className="flex size-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-800">
                    {profile?.fullName || profile?.email}
                  </p>
                  <p className="truncate text-[10px] text-slate-400">
                    {profile?.customer?.companyName || profile?.role}
                  </p>
                </div>
              </div>
              <RoleBadge role={profile?.role} />
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex w-64 max-w-xs flex-col bg-white p-5 shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded bg-slate-900 text-xs font-bold text-white">
                    BL
                  </div>
                  <span className="font-bold text-slate-900">Brightloop SMS</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="size-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-1">
                {links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      {Icon && <Icon className="size-4 text-slate-400" />}
                      <span>{link.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
              <div className="mt-auto border-t border-slate-100 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSignOut}
                  className="w-full justify-start text-xs text-red-600 hover:text-red-700"
                >
                  <LogOut className="size-4 mr-2" />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 md:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="size-5" />
              </button>
              <div className="flex items-center gap-2.5">
                <RoleBadge role={profile?.role} />
                <span className="hidden text-xs text-slate-400 sm:inline">•</span>
                <span className="hidden text-xs text-slate-500 sm:inline">
                  {profile?.role === 'CUSTOMER'
                    ? profile?.customer?.companyName || 'Customer Portal'
                    : 'Administration Suite'}
                </span>
              </div>
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 pr-3 text-left hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <div className="flex size-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {initials}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">
                    {profile?.fullName || profile?.email}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {profile?.email}
                  </p>
                </div>
                <ChevronDown className="size-3.5 text-slate-400 ml-1" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in z-50">
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="text-xs font-semibold text-slate-900">
                      {profile?.fullName || 'User Account'}
                    </p>
                    <p className="truncate text-xs text-slate-500">{profile?.email}</p>
                    <div className="mt-1.5">
                      <RoleBadge role={profile?.role} />
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        onSignOut();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
