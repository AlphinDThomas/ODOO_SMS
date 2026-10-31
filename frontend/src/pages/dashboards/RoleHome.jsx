import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

const COPY = {
  ADMIN: {
    title: 'Admin dashboard',
    body: 'Catalog, staff, billing, and finance screens will land in later phases. You can create staff accounts from Users.',
  },
  STAFF: {
    title: 'Staff dashboard',
    body: 'Day-to-day customer, quotation, subscription, invoice, and payment tools will appear here after Phase 1.',
  },
  CUSTOMER: {
    title: 'Customer portal',
    body: 'Your subscriptions, invoices, and payments will appear here. You will only ever see your own records.',
  },
};

export function RoleHome({ role }) {
  const { profile } = useAuth();
  const copy = COPY[role];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-sm text-slate-500">Signed in as {profile?.fullName || profile?.email}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Phase 1 workspace</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">{copy.body}</CardContent>
      </Card>
    </div>
  );
}
