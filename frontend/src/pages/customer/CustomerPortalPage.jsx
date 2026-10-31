import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Layers,
  Package,
  Printer,
  Receipt,
  RefreshCw,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function formatCurrency(val) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StatusBadge({ status }) {
  const styles = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
    QUOTATION: 'bg-amber-50 text-amber-700 border-amber-200',
    DRAFT: 'bg-slate-50 text-slate-700 border-slate-200',
    PAUSED: 'bg-orange-50 text-orange-700 border-orange-200',
    EXPIRED: 'bg-red-50 text-red-700 border-red-200',
    CLOSED: 'bg-slate-100 text-slate-600 border-slate-300',
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PARTIALLY_PAID: 'bg-amber-50 text-amber-700 border-amber-200',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  };

  const style = styles[status] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize tracking-wide',
        style,
      )}
    >
      {status ? status.toLowerCase().replace('_', ' ') : '—'}
    </span>
  );
}

export function CustomerPortalPage() {
  const { profile } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [acceptingId, setAcceptingId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  async function loadData(showLoading = true) {
    if (showLoading) setLoading(true);
    try {
      const [subsRes, invRes] = await Promise.all([
        api.get('/portal/subscriptions'),
        api.get('/portal/invoices'),
      ]);
      setSubscriptions(subsRes.data?.subscriptions || []);
      setInvoices(invRes.data?.invoices || []);
    } catch (err) {
      console.error('Failed to load portal data:', err);
      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to load dashboard data. Please check your connection.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData(true);
  }, []);

  async function refreshData() {
    setRefreshing(true);
    setError('');
    await loadData(false);
  }

  async function handleAcceptQuotation(subscriptionId) {
    setError('');
    setActionSuccess('');
    setAcceptingId(subscriptionId);

    try {
      const { data } = await api.post(`/portal/quotations/${subscriptionId}/accept`);
      setActionSuccess(data?.message || 'Quotation accepted! Subscription is now confirmed.');
      await refreshData();
    } catch (err) {
      console.error('Accept quotation failed:', err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Failed to accept quotation. It may have expired or changed.',
      );
    } finally {
      setAcceptingId(null);
    }
  }

  // Summary Metrics Calculations
  const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE');
  const totalBalanceDue = invoices.reduce((sum, inv) => sum + (Number(inv.balanceDue) || 0), 0);
  const paidInvoicesCount = invoices.filter((inv) => inv.status === 'PAID').length;

  // Find next renewal
  const upcomingRenewals = subscriptions
    .filter((s) => s.status === 'ACTIVE' && s.nextBillingDate)
    .sort((a, b) => new Date(a.nextBillingDate) - new Date(b.nextBillingDate));
  const nextRenewal = upcomingRenewals[0];

  if (loading) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center space-y-3">
        <RefreshCw className="size-8 animate-spin text-slate-400" />
        <p className="text-sm font-medium text-slate-500">Loading Customer Dashboard…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Customer Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back,{' '}
            <span className="font-semibold text-slate-700">
              {profile?.fullName || profile?.email}
            </span>
            {profile?.customer?.companyName && (
              <span> • {profile.customer.companyName}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/customer/catalog"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Package className="size-3.5" />
            Browse Products & Plans
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Global Alerts / Feedback */}
      {actionSuccess && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess('')}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* SECTION 1: Summary KPI Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Active Subscriptions */}
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Subscriptions
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{activeSubs.length}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {subscriptions.length} total on record
              </p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Layers className="size-6" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Next Renewal Date */}
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Next Billing Cycle
              </p>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                {nextRenewal ? formatDate(nextRenewal.nextBillingDate) : 'No upcoming cycle'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[150px]">
                {nextRenewal ? nextRenewal.plan?.name : 'All services current'}
              </p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Calendar className="size-6" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Total Invoices */}
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Invoices
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{invoices.length}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {paidInvoicesCount} settled in full
              </p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Receipt className="size-6" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Outstanding Balance */}
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Outstanding Balance
              </p>
              <h3
                className={cn(
                  'text-2xl font-bold mt-1',
                  totalBalanceDue > 0 ? 'text-amber-600' : 'text-emerald-600',
                )}
              >
                {formatCurrency(totalBalanceDue)}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {totalBalanceDue > 0 ? 'Payment required' : 'Zero balance due'}
              </p>
            </div>
            <div
              className={cn(
                'flex size-11 items-center justify-center rounded-xl',
                totalBalanceDue > 0
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-emerald-50 text-emerald-600',
              )}
            >
              <DollarSign className="size-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: My Subscriptions */}
      <section id="subscriptions" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="size-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900">My Subscriptions</h2>
          </div>
          <span className="text-xs text-slate-500">
            {subscriptions.length} {subscriptions.length === 1 ? 'Subscription' : 'Subscriptions'}
          </span>
        </div>

        {subscriptions.length === 0 ? (
          <Card className="border-dashed border-slate-200 p-8 text-center">
            <Layers className="mx-auto size-10 text-slate-300 mb-2" />
            <h3 className="text-base font-semibold text-slate-900">No subscriptions found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              You do not have any active subscriptions yet. Explore our software plans and modules
              to get started.
            </p>
            <div className="mt-4">
              <Link
                to="/customer/catalog"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
              >
                <Package className="size-3.5" />
                Explore Subscription Plans
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {subscriptions.map((sub) => {
              const linesTotal =
                sub.lines?.reduce((sum, l) => {
                  const amt =
                    l.lineAmount != null
                      ? Number(l.lineAmount)
                      : Number(l.unitPrice) * l.quantity;
                  return sum + amt;
                }, 0) || Number(sub.plan?.amount || 0);

              const isQuotation = sub.status === 'QUOTATION';

              return (
                <Card
                  key={sub.id}
                  className={cn(
                    'flex flex-col justify-between border-slate-200 shadow-xs hover:border-slate-300 transition-all',
                    isQuotation && 'border-amber-300 bg-amber-50/15',
                  )}
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs font-semibold text-slate-400">
                          {sub.number}
                        </span>
                        <CardTitle className="text-base font-bold text-slate-900">
                          {sub.plan?.name || 'Subscription Plan'}
                        </CardTitle>
                      </div>
                      <StatusBadge status={sub.status} />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 p-5 pt-0">
                    {/* Recurring Cost Banner */}
                    <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 flex items-baseline justify-between">
                      <span className="text-xs font-medium text-slate-500">Recurring Total</span>
                      <span className="text-lg font-bold text-slate-900">
                        {formatCurrency(linesTotal)}
                        <span className="text-xs font-normal text-slate-500">
                          /{sub.billingInterval?.toLowerCase()}
                        </span>
                      </span>
                    </div>

                    {/* Term Details */}
                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Term Start</span>
                        <span className="font-medium text-slate-800">
                          {formatDate(sub.startDate)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Term Expiry</span>
                        <span className="font-medium text-slate-800">
                          {formatDate(sub.expiryDate)}
                        </span>
                      </div>
                      {sub.nextBillingDate && (
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-400">Next Billing</span>
                          <span className="font-medium text-indigo-700">
                            {formatDate(sub.nextBillingDate)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Payment Terms</span>
                        <span className="font-medium text-slate-800">
                          Net {sub.paymentTermsDays} Days
                        </span>
                      </div>
                    </div>

                    {/* Included Line Items */}
                    {sub.lines?.length > 0 && (
                      <div className="pt-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                          Included Products
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {sub.lines.map((line) => (
                            <span
                              key={line.id}
                              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700"
                            >
                              {line.product?.name} × {line.quantity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quotation Acceptance Action */}
                    {isQuotation && (
                      <div className="pt-2 border-t border-amber-200">
                        <Button
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                          disabled={acceptingId === sub.id}
                          onClick={() => handleAcceptQuotation(sub.id)}
                        >
                          {acceptingId === sub.id ? (
                            <>
                              <RefreshCw className="size-3.5 animate-spin mr-1.5" />
                              Accepting Offer…
                            </>
                          ) : (
                            'Accept & Confirm Offer'
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 3: Invoices & Receipts */}
      <section id="invoices" className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="size-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">Recent Invoices & Receipts</h2>
          </div>
          <Link
            to="/customer/invoices"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            View All Invoices
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {invoices.length === 0 ? (
          <Card className="border-dashed border-slate-200 p-8 text-center">
            <FileText className="mx-auto size-10 text-slate-300 mb-2" />
            <h3 className="text-base font-semibold text-slate-900">No invoices generated yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Invoices for active billing cycles will be available for viewing, payment, and
              download here.
            </p>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Grand Total</th>
                  <th className="px-4 py-3">Balance Due</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.slice(0, 6).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                      {inv.number || inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(inv.issueDate)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(inv.dueDate)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      <span
                        className={cn(
                          Number(inv.balanceDue) > 0 ? 'text-amber-700' : 'text-slate-400',
                        )}
                      >
                        {formatCurrency(inv.balanceDue)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/customer/invoices/${inv.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs"
                        >
                          View Details
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-slate-500 hover:text-slate-900"
                          onClick={() => setSelectedInvoice(inv)}
                        >
                          <Printer className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Invoice Quick Printable Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 sm:p-8 shadow-2xl">
            {/* Modal Controls */}
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Official Tax Invoice
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="gap-1.5 text-xs"
                >
                  <Printer className="size-3.5" />
                  Print Receipt
                </Button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white mb-2">
                    BL
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Brightloop Software Inc.</h2>
                  <p className="text-xs text-slate-500">Subscription & Billing Division</p>
                </div>
                <div className="text-right">
                  <h3 className="font-mono text-xl font-extrabold text-slate-900">
                    {selectedInvoice.number || selectedInvoice.invoiceNumber}
                  </h3>
                  <div className="mt-1">
                    <StatusBadge status={selectedInvoice.status} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 text-xs text-slate-600">
                <div>
                  <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                    Billed To:
                  </p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">
                    {profile?.customer?.companyName || profile?.fullName}
                  </p>
                  <p className="text-slate-500">{profile?.email}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p>
                    <span className="text-slate-400">Issue Date:</span>{' '}
                    <span className="font-semibold text-slate-700">
                      {formatDate(selectedInvoice.issueDate)}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-400">Payment Due:</span>{' '}
                    <span className="font-semibold text-slate-700">
                      {formatDate(selectedInvoice.dueDate)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="space-y-2 border-t border-slate-100 pt-4 text-sm">
                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedInvoice.subtotal || selectedInvoice.grandTotal)}</span>
                </div>
                {selectedInvoice.discountTotal != null && Number(selectedInvoice.discountTotal) > 0 && (
                  <div className="flex justify-between text-emerald-700 text-xs">
                    <span>Discount Applied</span>
                    <span>-{formatCurrency(selectedInvoice.discountTotal)}</span>
                  </div>
                )}
                {selectedInvoice.taxTotal != null && Number(selectedInvoice.taxTotal) > 0 && (
                  <div className="flex justify-between text-slate-600 text-xs">
                    <span>Tax</span>
                    <span>+{formatCurrency(selectedInvoice.taxTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900 text-base">
                  <span>Grand Total</span>
                  <span>{formatCurrency(selectedInvoice.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-xs pt-1 font-semibold text-amber-700">
                  <span>Balance Due</span>
                  <span>{formatCurrency(selectedInvoice.balanceDue)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
