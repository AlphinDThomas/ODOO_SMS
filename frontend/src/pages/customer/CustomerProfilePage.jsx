import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Mail, MapPin, Phone, ShieldCheck, User } from 'lucide-react';

export function CustomerProfilePage() {
  const { profile } = useAuth();
  const customer = profile?.customer;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl flex items-center gap-2.5">
          <User className="size-6 text-slate-700" />
          My Profile & Account
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your personal account information and registered company billing profile.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Account Card */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-600" />
              User Account
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-sm">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</p>
              <p className="font-medium text-slate-800">{profile?.fullName || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</p>
              <p className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Mail className="size-3.5 text-slate-400" />
                {profile?.email}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role Access</p>
              <span className="inline-flex items-center rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 mt-1">
                {profile?.role}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Company & Billing Card */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="size-4 text-indigo-600" />
              Company Billing Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-sm">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Company Name</p>
              <p className="font-medium text-slate-800">{customer?.companyName || 'Not configured'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Billing Email</p>
              <p className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Mail className="size-3.5 text-slate-400" />
                {customer?.billingEmail || profile?.email}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact Phone</p>
              <p className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Phone className="size-3.5 text-slate-400" />
                {customer?.phone || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Address</p>
              <p className="font-medium text-slate-800 flex items-start gap-1.5 mt-0.5">
                <MapPin className="size-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>
                  {[customer?.addressLine1, customer?.addressLine2, customer?.city, customer?.state, customer?.country]
                    .filter(Boolean)
                    .join(', ') || 'No address on file'}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
