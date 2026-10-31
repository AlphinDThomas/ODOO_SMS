import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  Package,
  Receipt,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

export function CustomerSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [acceptingId, setAcceptingId] = useState(null);
  const [activatingId, setActivatingId] = useState(null);
  const [pausingId, setPausingId] = useState(null);
  const [resumingId, setResumingId] = useState(null);
  const [closingId, setClosingId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  async function loadSubscriptions(showSpinner = true) {
    if (showSpinner) setLoading(true);
    try {
      const res = await api.get('/portal/subscriptions');
      setSubscriptions(res.data?.subscriptions || []);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to load your subscriptions. Please check your connection.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadSubscriptions(true);
  }, []);

  async function refreshData() {
    setRefreshing(true);
    setError('');
    await loadSubscriptions(false);
  }

  async function handleAcceptQuotation(subscriptionId) {
    setError('');
    setActionSuccess('');
    setAcceptingId(subscriptionId);

    try {
      const { data } = await api.post(`/portal/quotations/${subscriptionId}/accept`);
      setActionSuccess(
        data?.message || 'Quotation accepted successfully! Your subscription is now confirmed.',
      );
      await refreshData();
    } catch (err) {
      console.error('Accept quotation failed:', err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Failed to accept quotation. It may have expired or been updated.',
      );
    } finally {
      setAcceptingId(null);
    }
  }

  async function handleActivateSubscription(subscriptionId) {
    setError('');
    setActionSuccess('');
    setActivatingId(subscriptionId);

    try {
      await api.post(`/subscriptions/${subscriptionId}/activate`);
      setActionSuccess('Subscription activated successfully! Recurring billing is now active.');
      await refreshData();
    } catch (err) {
      console.error('Activate subscription failed:', err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Failed to activate subscription.',
      );
    } finally {
      setActivatingId(null);
    }
  }

  async function handlePauseSubscription(subId) {
    if (!window.confirm('Are you sure you want to pause this subscription?')) return;
    setError('');
    setActionSuccess('');
    setPausingId(subId);
    try {
      await api.post(`/subscriptions/${subId}/pause`, { reason: 'Paused by customer via portal' });
      setActionSuccess('Subscription paused successfully.');
      await refreshData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to pause subscription. It may not permit pausing.');
    } finally {
      setPausingId(null);
    }
  }

  async function handleResumeSubscription(subId) {
    setError('');
    setActionSuccess('');
    setResumingId(subId);
    try {
      await api.post(`/subscriptions/${subId}/resume`);
      setActionSuccess('Subscription resumed successfully.');
      await refreshData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resume subscription.');
    } finally {
      setResumingId(null);
    }
  }

  async function handleCloseSubscription(subId) {
    const reason = window.prompt('Please provide a reason for cancellation (optional):', 'Customer requested cancellation');
    if (reason === null) return;
    setError('');
    setActionSuccess('');
    setClosingId(subId);
    try {
      await api.post(`/subscriptions/${subId}/close`, { reason });
      setActionSuccess('Subscription cancelled and closed successfully.');
      await refreshData();
    } catch (err) {
      setError(err.response?.data?.error || 'Cancellation rejected. The plan policy may not allow early closure.');
    } finally {
      setClosingId(null);
    }
  }

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? sub.status === 'ACTIVE'
        : statusFilter === 'CONFIRMED'
        ? sub.status === 'CONFIRMED'
        : statusFilter === 'QUOTATION'
        ? sub.status === 'QUOTATION'
        : statusFilter === 'PAUSED'
        ? sub.status === 'PAUSED'
        : statusFilter === 'CLOSED'
        ? sub.status === 'CLOSED' || sub.status === 'EXPIRED'
        : true;

    const query = search.trim().toLowerCase();
    if (!query) return matchesStatus;

    const matchesSearch =
      sub.number?.toLowerCase().includes(query) ||
      sub.plan?.name?.toLowerCase().includes(query) ||
      sub.lines?.some((l) => l.product?.name?.toLowerCase().includes(query));

    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    ALL: subscriptions.length,
    ACTIVE: subscriptions.filter((s) => s.status === 'ACTIVE').length,
    CONFIRMED: subscriptions.filter((s) => s.status === 'CONFIRMED').length,
    QUOTATION: subscriptions.filter((s) => s.status === 'QUOTATION').length,
    PAUSED: subscriptions.filter((s) => s.status === 'PAUSED').length,
    CLOSED: subscriptions.filter((s) => s.status === 'CLOSED' || s.status === 'EXPIRED').length,
  };

  if (loading) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center space-y-3">
        <RefreshCw className="size-8 animate-spin text-slate-400" />
        <p className="text-sm font-medium text-slate-500">Loading your subscriptions…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner - Matching UI consistency */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl flex items-center gap-2.5">
            <Layers className="size-6 text-slate-700" />
            My Subscriptions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your recurring subscription plans, term renewal schedules, and product licenses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/customer/catalog"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Package className="size-3.5" />
            Browse Catalog
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

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'CONFIRMED', label: 'Confirmed' },
            { id: 'QUOTATION', label: 'Quotations' },
            { id: 'PAUSED', label: 'Paused' },
            { id: 'CLOSED', label: 'Closed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                  statusFilter === tab.id
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600',
                )}
              >
                {statusCounts[tab.id] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search subscriptions or plans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 bg-white"
          />
        </div>
      </div>

      {/* Subscriptions Grid */}
      {filteredSubscriptions.length === 0 ? (
        <Card className="border-dashed border-slate-200 p-10 text-center bg-slate-50/50">
          <Layers className="mx-auto size-10 text-slate-300 mb-2" />
          <h3 className="text-base font-semibold text-slate-900">
            {subscriptions.length === 0
              ? 'No subscriptions active yet'
              : 'No subscriptions match your search'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {subscriptions.length === 0
              ? 'Browse our software modules and subscription tiers to start your first plan.'
              : 'Try adjusting your search terms or status filter.'}
          </p>
          {subscriptions.length === 0 && (
            <div className="mt-4">
              <Link
                to="/customer/catalog"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
              >
                <Package className="size-3.5" />
                Browse Catalog
              </Link>
            </div>
          )}
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredSubscriptions.map((sub) => {
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
                  'flex flex-col justify-between border-slate-200 shadow-xs hover:border-slate-300 transition-all bg-white',
                  isQuotation && 'border-amber-300 bg-amber-50/20 shadow-sm',
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
                  {/* Recurring Price Banner */}
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
                        <span className="text-slate-400">Next Billing Cycle</span>
                        <span className="font-semibold text-indigo-700">
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
                        Included Products & Modules
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

                  {/* Action Section */}
                  {isQuotation ? (
                    <div className="pt-2 border-t border-amber-200">
                      <div className="mb-2 text-center text-[11px] font-medium text-amber-800">
                        Official proposal ready for review & confirmation
                      </div>
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
                          'Accept & Confirm Subscription'
                        )}
                      </Button>
                    </div>
                  ) : sub.status === 'CONFIRMED' ? (
                    <div className="pt-2 border-t border-blue-200 space-y-2">
                      <div className="text-center text-[11px] font-medium text-blue-800">
                        Quotation confirmed! Ready to activate recurring billing.
                      </div>
                      <Button
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                        disabled={activatingId === sub.id}
                        onClick={() => handleActivateSubscription(sub.id)}
                      >
                        {activatingId === sub.id ? (
                          <>
                            <RefreshCw className="size-3.5 animate-spin mr-1.5" />
                            Activating…
                          </>
                        ) : (
                          'Activate Subscription Now'
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium">
                          {sub.status === 'ACTIVE' && (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <CheckCircle2 className="size-3.5" />
                              Active & In Good Standing
                            </span>
                          )}
                          {sub.status === 'PAUSED' && (
                            <span className="flex items-center gap-1 text-orange-600">
                              <Clock className="size-3.5" />
                              Temporarily Paused
                            </span>
                          )}
                          {sub.status === 'CLOSED' && (
                            <span className="flex items-center gap-1 text-slate-500">
                              <X className="size-3.5" />
                              Cancelled & Closed
                            </span>
                          )}
                        </span>
                        <Link
                          to="/customer/invoices"
                          className="font-medium text-slate-700 hover:text-slate-900 hover:underline flex items-center gap-1"
                        >
                          <Receipt className="size-3" />
                          Billing History
                        </Link>
                      </div>

                      {/* Action buttons for ACTIVE / PAUSED */}
                      {(sub.status === 'ACTIVE' || sub.status === 'PAUSED') && (
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
                          {sub.status === 'ACTIVE' && sub.plan?.allowPause && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs text-orange-700 hover:bg-orange-50 border-orange-200"
                              disabled={pausingId === sub.id}
                              onClick={() => handlePauseSubscription(sub.id)}
                            >
                              {pausingId === sub.id ? (
                                <RefreshCw className="size-3 animate-spin mr-1" />
                              ) : null}
                              Pause
                            </Button>
                          )}
                          {sub.status === 'PAUSED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs text-indigo-700 hover:bg-indigo-50 border-indigo-200"
                              disabled={resumingId === sub.id}
                              onClick={() => handleResumeSubscription(sub.id)}
                            >
                              {resumingId === sub.id ? (
                                <RefreshCw className="size-3 animate-spin mr-1" />
                              ) : null}
                              Resume
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs text-red-700 hover:bg-red-50 border-red-200"
                            disabled={closingId === sub.id}
                            onClick={() => handleCloseSubscription(sub.id)}
                          >
                            {closingId === sub.id ? (
                              <RefreshCw className="size-3 animate-spin mr-1" />
                            ) : null}
                            Cancel Subscription
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
