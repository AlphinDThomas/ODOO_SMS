import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  Layers,
  Printer,
  Receipt,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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

function getCountdown(expiryDateStr) {
  if (!expiryDateStr) return null;
  const now = new Date().getTime();
  const expiry = new Date(expiryDateStr).getTime();
  const diff = expiry - now;

  if (diff <= 0) {
    return { expired: true, text: 'Quotation expired' };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return { expired: false, text: `${days}d ${hours}h remaining` };
  }
  return { expired: false, text: `${hours}h ${minutes}m remaining` };
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
  const [acceptingId, setAcceptingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function initialLoad() {
      try {
        const [subsRes, invRes] = await Promise.all([
          api.get('/portal/subscriptions'),
          api.get('/portal/invoices'),
        ]);
        if (!ignore) {
          setSubscriptions(subsRes.data?.subscriptions || []);
          setInvoices(invRes.data?.invoices || []);
        }
      } catch (err) {
        if (!ignore) {
          console.error('Failed to load customer data:', err);
          setError(
            err.response?.data?.error ||
              err.message ||
              'Failed to load portal data. Please check your connection.',
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      ignore = true;
    };
  }, []);

  async function refreshData() {
    setRefreshing(true);
    setError('');

    try {
      const [subsRes, invRes] = await Promise.all([
        api.get('/portal/subscriptions'),
        api.get('/portal/invoices'),
      ]);
      setSubscriptions(subsRes.data?.subscriptions || []);
      setInvoices(invRes.data?.invoices || []);
    } catch (err) {
      console.error('Failed to refresh customer data:', err);
      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to refresh data. Please check your connection.',
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function handleAcceptQuotation(subscriptionId) {
    setError('');
    setActionSuccess('');
    setAcceptingId(subscriptionId);

    try {
      const { data } = await api.post(`/portal/quotations/${subscriptionId}/accept`);
      setActionSuccess(
        data?.message || `Quotation accepted! Subscription is now Confirmed.`,
      );
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

  // Filter quotations requiring action
  const openQuotations = subscriptions.filter((sub) => sub.status === 'QUOTATION');
  const activeAndOtherSubs = subscriptions.filter((sub) => sub.status !== 'QUOTATION');

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <RefreshCw className="size-8 animate-spin text-slate-400" />
        <p className="text-sm font-medium text-slate-600">Loading your customer portal…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Customer Self-Service Portal
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
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
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

      {/* SECTION 1: Quotes Requiring Action */}
      <section id="quotes" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Quotes Requiring Action
            </h2>
            {openQuotations.length > 0 && (
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                {openQuotations.length}
              </span>
            )}
          </div>
        </div>

        {openQuotations.length === 0 ? (
          <Card className="border-dashed border-slate-200 bg-slate-50/50">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <FileCheck className="mb-2 size-8 text-slate-400" />
              <p className="text-sm font-medium">No pending quotations requiring your review.</p>
              <p className="text-xs text-slate-400 mt-0.5">
                New custom offers and renewal proposals will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {openQuotations.map((quote) => {
              const countdown = getCountdown(quote.quotationExpiresAt);
              const isExpired = countdown?.expired;

              return (
                <Card
                  key={quote.id}
                  className={cn(
                    'overflow-hidden border-2 transition-all',
                    isExpired
                      ? 'border-red-200 bg-red-50/20'
                      : 'border-amber-300 bg-gradient-to-br from-amber-50/40 to-white shadow-sm hover:shadow-md',
                  )}
                >
                  <CardHeader className="border-b border-amber-100 bg-amber-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs font-semibold text-amber-900">
                          {quote.number}
                        </span>
                        <h3 className="font-semibold text-slate-900">
                          {quote.plan?.name || 'Custom Subscription Plan'}
                        </h3>
                      </div>
                      <StatusBadge status={quote.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5">
                    {/* Countdown Banner */}
                    <div
                      className={cn(
                        'flex items-center justify-between rounded-md p-2.5 text-xs font-medium',
                        isExpired
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100/80 text-amber-900',
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-4 shrink-0" />
                        <span>Valid until: {formatDate(quote.quotationExpiresAt)}</span>
                      </div>
                      <span className="font-bold">{countdown?.text}</span>
                    </div>

                    {/* Subscription Details */}
                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400">Billing Interval:</span>
                        <p className="font-medium text-slate-800">{quote.billingInterval}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Proposed Term:</span>
                        <p className="font-medium text-slate-800">
                          {formatDate(quote.startDate)} – {formatDate(quote.expiryDate)}
                        </p>
                      </div>
                    </div>

                    {/* Line Items */}
                    {quote.lines?.length > 0 && (
                      <div className="space-y-1 rounded-md border border-slate-100 bg-slate-50/50 p-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Included Products
                        </p>
                        <div className="divide-y divide-slate-100">
                          {quote.lines.map((line) => (
                            <div
                              key={line.id}
                              className="flex items-center justify-between py-1 text-xs"
                            >
                              <div>
                                <span className="font-medium text-slate-700">
                                  {line.product?.name}
                                </span>
                                {line.variant?.name && (
                                  <span className="ml-1 text-slate-400">
                                    ({line.variant.name})
                                  </span>
                                )}
                                <span className="ml-1 text-slate-400">× {line.quantity}</span>
                              </div>
                              <span className="font-semibold text-slate-900">
                                {formatCurrency(line.lineAmount || line.unitPrice * line.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-2">
                      <Button
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium"
                        disabled={isExpired || acceptingId === quote.id}
                        onClick={() => handleAcceptQuotation(quote.id)}
                      >
                        {acceptingId === quote.id ? (
                          <>
                            <RefreshCw className="size-4 animate-spin mr-2" />
                            Accepting Quote…
                          </>
                        ) : isExpired ? (
                          'Quote Expired'
                        ) : (
                          'Accept Quotation'
                        )}
                      </Button>
                      {!isExpired && (
                        <p className="text-center text-[11px] text-slate-400 mt-1.5">
                          Accepting confirms your agreement to the subscription terms.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: My Subscriptions */}
      <section id="subscriptions" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="size-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900">My Subscriptions</h2>
          </div>
          <span className="text-xs text-slate-500">
            Total Subscriptions: {activeAndOtherSubs.length}
          </span>
        </div>

        {activeAndOtherSubs.length === 0 ? (
          <Card className="border-dashed border-slate-200">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <Layers className="mb-2 size-8 text-slate-400" />
              <p className="text-sm font-medium">No active or confirmed subscriptions yet.</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Accepted quotations will automatically appear as confirmed subscriptions here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeAndOtherSubs.map((sub) => {
              const linesTotal = sub.lines?.reduce((sum, l) => {
                const amt = l.lineAmount != null ? Number(l.lineAmount) : Number(l.unitPrice) * l.quantity;
                return sum + amt;
              }, 0) || Number(sub.plan?.amount || 0);

              return (
                <Card key={sub.id} className="flex flex-col justify-between hover:border-slate-300 transition-colors">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="font-mono text-xs font-semibold text-slate-500">
                          {sub.number}
                        </span>
                        <h3 className="text-base font-semibold text-slate-900">
                          {sub.plan?.name || 'Subscription'}
                        </h3>
                      </div>
                      <StatusBadge status={sub.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5 pt-0">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-500">Recurring Total</span>
                        <span className="text-lg font-bold text-slate-900">
                          {formatCurrency(linesTotal)}
                          <span className="text-xs font-normal text-slate-500">
                            /{sub.billingInterval.toLowerCase()}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Start Date</span>
                        <span className="font-medium text-slate-800">
                          {formatDate(sub.startDate)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Expiry Date</span>
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

                    {/* Products Included */}
                    {sub.lines?.length > 0 && (
                      <div className="pt-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                          Product Items ({sub.lines.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {sub.lines.map((line) => (
                            <span
                              key={line.id}
                              className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 font-medium"
                            >
                              {line.product?.name} × {line.quantity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 3: My Invoices & Receipts */}
      <section id="invoices" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="size-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">My Invoices & Receipts</h2>
          </div>
          <span className="text-xs text-slate-500">
            Total Invoices: {invoices.length}
          </span>
        </div>

        {invoices.length === 0 ? (
          <Card className="border-dashed border-slate-200">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <FileText className="mb-2 size-8 text-slate-400" />
              <p className="text-sm font-medium">No invoices generated yet.</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Invoices for active billing cycles will be available for viewing and download here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
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
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                      {inv.number}
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-medium gap-1"
                        onClick={() => setSelectedInvoice(inv)}
                      >
                        <Printer className="size-3.5" />
                        View / Print
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Invoice Detail & Printable Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 sm:p-8 shadow-2xl">
            {/* Modal Controls */}
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Official Invoice Copy
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-1.5 bg-slate-900 hover:bg-slate-800 text-white"
                >
                  <Printer className="size-4" />
                  Print / Save PDF
                </Button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Document */}
            <div className="space-y-6 print:p-0">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Brightloop SMS
                  </h2>
                  <p className="text-xs text-slate-500">Subscription Management Billing</p>
                </div>
                <div className="text-right">
                  <h3 className="font-mono text-lg font-bold text-slate-900">
                    {selectedInvoice.number}
                  </h3>
                  <div className="mt-1">
                    <StatusBadge status={selectedInvoice.status} />
                  </div>
                </div>
              </div>

              {/* Bill To & Metadata */}
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 text-xs">
                <div>
                  <p className="font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Billed To:
                  </p>
                  <p className="font-bold text-slate-800">
                    {profile?.customer?.companyName || profile?.fullName}
                  </p>
                  <p className="text-slate-600">{profile?.customer?.billingEmail || profile?.email}</p>
                  {profile?.customer?.phone && (
                    <p className="text-slate-600">{profile.customer.phone}</p>
                  )}
                </div>
                <div className="space-y-1 text-right">
                  <div>
                    <span className="text-slate-400">Issue Date: </span>
                    <span className="font-medium text-slate-800">
                      {formatDate(selectedInvoice.issueDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Due Date: </span>
                    <span className="font-medium text-slate-800">
                      {formatDate(selectedInvoice.dueDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Billing Period: </span>
                    <span className="font-medium text-slate-800">
                      {formatDate(selectedInvoice.periodStart)} – {formatDate(selectedInvoice.periodEnd)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Itemized Lines */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2">Description</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Unit Price</th>
                      <th className="py-2 text-right">Tax</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.lines?.map((line) => (
                      <tr key={line.id}>
                        <td className="py-2 font-medium text-slate-800">
                          {line.description || line.product?.name || 'Subscription Period'}
                          {line.variant?.name && (
                            <span className="text-slate-400 font-normal"> ({line.variant.name})</span>
                          )}
                        </td>
                        <td className="py-2 text-center text-slate-600">{line.quantity}</td>
                        <td className="py-2 text-right text-slate-600">
                          {formatCurrency(line.unitPrice)}
                        </td>
                        <td className="py-2 text-right text-slate-600">
                          {formatCurrency(line.taxAmount || 0)}
                        </td>
                        <td className="py-2 text-right font-semibold text-slate-900">
                          {formatCurrency(line.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="border-t border-slate-200 pt-3 flex justify-end">
                <div className="w-60 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  {Number(selectedInvoice.discountTotal) > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span>-{formatCurrency(selectedInvoice.discountTotal)}</span>
                    </div>
                  )}
                  {Number(selectedInvoice.taxTotal) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax Total:</span>
                      <span>{formatCurrency(selectedInvoice.taxTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900 text-sm">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(selectedInvoice.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Amount Paid:</span>
                    <span className="text-emerald-700 font-medium">
                      {formatCurrency(selectedInvoice.amountPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-slate-200 pt-1.5 font-bold text-sm">
                    <span>Balance Due:</span>
                    <span
                      className={
                        Number(selectedInvoice.balanceDue) > 0
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }
                    >
                      {formatCurrency(selectedInvoice.balanceDue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Receipts History */}
              {selectedInvoice.payments?.length > 0 && (
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Payment Receipts
                  </p>
                  <div className="space-y-1 divide-y divide-slate-100 text-xs">
                    {selectedInvoice.payments.map((pmt) => (
                      <div key={pmt.id} className="pt-1.5 first:pt-0 flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-slate-800">
                            {formatCurrency(pmt.amount)}
                          </span>
                          <span className="ml-2 text-slate-500">
                            via {pmt.method.replace('_', ' ')}
                          </span>
                          {pmt.note && (
                            <span className="ml-2 text-slate-400 italic">({pmt.note})</span>
                          )}
                        </div>
                        <span className="text-slate-400">{formatDate(pmt.paidAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
