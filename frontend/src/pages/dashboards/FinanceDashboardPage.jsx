import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Clock,
  CreditCard,
  DollarSign,
  FileSpreadsheet,
  Mail,
  PieChart,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';
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

export function FinanceDashboardPage({ role }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Date range state
  const [datePreset, setDatePreset] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    let ignore = false;

    async function initialLoad() {
      try {
        const res = await api.get('/reports/finance');
        if (!ignore) {
          setData(res.data);
        }
      } catch (err) {
        if (!ignore) {
          console.error('Failed to load finance report:', err);
          setError(
            err.response?.data?.error ||
              err.message ||
              'Failed to load finance analytics. Ensure your account has Admin or Staff permissions.',
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

  async function fetchFinanceReport(start, end) {
    setRefreshing(true);
    setError('');

    try {
      const params = {};
      if (start) params.startDate = start;
      if (end) params.endDate = end;

      const res = await api.get('/reports/finance', { params });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load finance report:', err);
      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to load finance analytics. Ensure your account has Admin or Staff permissions.',
      );
    } finally {
      setRefreshing(false);
    }
  }

  function handlePresetChange(preset) {
    setDatePreset(preset);
    const now = new Date();
    let start = '';
    let end = '';

    if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      start = firstDay.toISOString().split('T')[0];
      end = now.toISOString().split('T')[0];
    } else if (preset === 'this_quarter') {
      const currentQuarterMonth = Math.floor(now.getMonth() / 3) * 3;
      const firstDay = new Date(now.getFullYear(), currentQuarterMonth, 1);
      start = firstDay.toISOString().split('T')[0];
      end = now.toISOString().split('T')[0];
    } else if (preset === 'this_year') {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      start = firstDay.toISOString().split('T')[0];
      end = now.toISOString().split('T')[0];
    } else if (preset === 'all') {
      start = '';
      end = '';
    }

    setStartDate(start);
    setEndDate(end);
    fetchFinanceReport(start, end);
  }

  function handleCustomFilterSubmit(e) {
    e.preventDefault();
    fetchFinanceReport(startDate, endDate);
  }

  const metrics = data?.metrics;
  const overdueInvoices = data?.overdueInvoices || [];
  const planBreakdown = data?.planBreakdown || [];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <RefreshCw className="size-8 animate-spin text-slate-400" />
        <p className="text-sm font-medium text-slate-600">Calculating financial metrics…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Filter Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Finance & Analytics Dashboard
            </h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {role} View
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Real-time subscription revenue KPIs, receivables tracking, and overdue collections.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Buttons */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs shadow-sm">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'this_month', label: 'This Month' },
              { id: 'this_quarter', label: 'Quarter' },
              { id: 'this_year', label: 'Year' },
              { id: 'custom', label: 'Custom' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetChange(p.id)}
                className={cn(
                  'rounded-md px-3 py-1 font-medium transition-colors',
                  datePreset === p.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchFinanceReport(startDate, endDate)}
            disabled={refreshing}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
            {refreshing ? 'Updating…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Custom Date Form (if selected) */}
      {datePreset === 'custom' && (
        <form
          onSubmit={handleCustomFilterSubmit}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-xs"
        >
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 rounded-md border border-slate-200 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 rounded-md border border-slate-200 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <Button type="submit" size="sm" className="h-9 bg-slate-900 text-white">
            Apply Date Range
          </Button>
        </form>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Unable to fetch analytics</p>
          <p className="text-xs mt-0.5">{error}</p>
        </div>
      )}

      {/* TOP 4 KPI CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Active Subscriptions */}
        <Card className="border-l-4 border-l-blue-500 shadow-xs hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Subscriptions
            </span>
            <div className="rounded-md bg-blue-50 p-2 text-blue-600">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-2xl font-bold text-slate-900">
              {metrics?.activeSubscriptionsCount ?? 0}
            </div>
            <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
              <span className="inline-block size-2 rounded-full bg-emerald-500"></span>
              Live recurring contracts
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: MRR & ARR */}
        <Card className="border-l-4 border-l-indigo-500 shadow-xs hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              MRR / ARR
            </span>
            <div className="rounded-md bg-indigo-50 p-2 text-indigo-600">
              <TrendingUp className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(metrics?.monthlyRecurringRevenue ?? 0)}
              <span className="text-xs font-normal text-slate-500"> /mo</span>
            </div>
            <p className="mt-1 text-xs font-medium text-indigo-700">
              ARR: {formatCurrency(metrics?.annualRecurringRevenue ?? 0)} /yr
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Total Revenue Collected */}
        <Card className="border-l-4 border-l-emerald-500 shadow-xs hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Revenue Collected
            </span>
            <div className="rounded-md bg-emerald-50 p-2 text-emerald-600">
              <DollarSign className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(metrics?.totalRevenueCollected ?? 0)}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {metrics?.paymentsCount ?? 0} total payments logged
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Total Outstanding Balance */}
        <Card className="border-l-4 border-l-amber-500 shadow-xs hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Outstanding Balance
            </span>
            <div className="rounded-md bg-amber-50 p-2 text-amber-600">
              <CreditCard className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(metrics?.totalOutstandingReceivables ?? 0)}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {metrics?.outstandingInvoicesCount ?? 0} unpaid / partial invoices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* OVERDUE COLLECTIONS SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-red-500" />
            <h2 className="text-lg font-bold text-slate-900">
              Overdue Collections Requiring Attention
            </h2>
            {overdueInvoices.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                {overdueInvoices.length} Overdue
              </span>
            )}
          </div>
        </div>

        {overdueInvoices.length === 0 ? (
          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardContent className="flex items-center gap-3 p-5 text-sm text-emerald-800">
              <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                <BarChart3 className="size-5" />
              </div>
              <div>
                <p className="font-semibold">All Accounts Up to Date</p>
                <p className="text-xs text-emerald-600">
                  There are currently no overdue receivables. All confirmed invoices are either paid or within their payment terms.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Customer Company</th>
                  <th className="px-4 py-3">Contact Email</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Days Overdue</th>
                  <th className="px-4 py-3 text-right">Outstanding Amount</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                      {inv.number}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {inv.customer?.companyName || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <a
                        href={`mailto:${inv.customer?.billingEmail}?subject=Overdue Invoice ${inv.number}&body=Dear ${inv.customer?.companyName || 'Customer'}, your invoice ${inv.number} with outstanding balance of ${formatCurrency(inv.balanceDue)} was due on ${formatDate(inv.dueDate)}.`}
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Mail className="size-3.5" />
                        {inv.customer?.billingEmail || '—'}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(inv.dueDate)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          inv.daysOverdue > 14
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200',
                        )}
                      >
                        <Clock className="size-3 mr-1" />
                        {inv.daysOverdue} {inv.daysOverdue === 1 ? 'day' : 'days'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-700">
                      {formatCurrency(inv.balanceDue)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`mailto:${inv.customer?.billingEmail}?subject=Overdue Notice: Invoice ${inv.number}&body=Hi ${inv.customer?.companyName || 'there'},%0D%0A%0D%0APlease be advised that invoice ${inv.number} for ${formatCurrency(inv.balanceDue)} is now ${inv.daysOverdue} days past due.%0D%0A%0D%0AThank you,%0D%0ABrightloop Finance Team`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded px-2.5 py-1.5 transition-colors"
                      >
                        <Mail className="size-3" />
                        Remind Customer
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* REVENUE BREAKDOWN BY PLAN TYPE */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <PieChart className="size-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">
            Revenue Breakdown by Plan Type
          </h2>
        </div>

        {planBreakdown.length === 0 ? (
          <Card className="border-dashed border-slate-200">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <FileSpreadsheet className="mb-2 size-8 text-slate-400" />
              <p className="text-sm font-medium">No plans or active subscriptions found.</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Plans created in the catalog will appear here once active subscriptions exist.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Summary Progress Cards */}
            <Card className="lg:col-span-2">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-semibold">
                  Monthly Contribution & Share
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5 pt-0">
                {planBreakdown.map((item) => (
                  <div key={item.planId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{item.planName}</span>
                        <span className="text-slate-400">({item.interval})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">
                          {item.activeCount} active sub{item.activeCount !== 1 ? 's' : ''}
                        </span>
                        <span className="font-bold text-slate-900">
                          {formatCurrency(item.mrr)} /mo
                        </span>
                        <span className="w-12 text-right font-medium text-indigo-600">
                          {item.sharePercentage}%
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(item.sharePercentage, 2))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Metrics Side Card */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-semibold">Summary Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5 pt-0 text-xs">
                <div className="rounded-lg bg-slate-50 p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Active Plans</span>
                    <span className="font-bold text-slate-900">{planBreakdown.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Plans with Active Subs</span>
                    <span className="font-bold text-slate-900">
                      {planBreakdown.filter((p) => p.activeCount > 0).length}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2">
                    <span className="text-slate-500">Calculated MRR</span>
                    <span className="font-bold text-indigo-700">
                      {formatCurrency(metrics?.monthlyRecurringRevenue ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Run-rate ARR</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(metrics?.annualRecurringRevenue ?? 0)}
                    </span>
                  </div>
                </div>

                <div className="rounded-md border border-blue-100 bg-blue-50/50 p-3 text-blue-900">
                  <p className="font-semibold">Automated MRR Normalization</p>
                  <p className="mt-1 text-[11px] text-blue-700">
                    Daily, weekly, and annual contracts are automatically normalized to a standardized 30-day monthly value for consistent executive reporting.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}
