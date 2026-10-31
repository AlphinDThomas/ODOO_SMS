import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Send,
  DollarSign,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function SubscriptionsPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'ALL');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [search, setSearch] = useState('');

  const basePath = profile?.role === 'ADMIN' ? '/admin' : '/staff';

  const STATUS_TABS = [
    { key: 'ALL', label: 'All' },
    { key: 'DRAFT', label: 'Draft' },
    { key: 'QUOTATION', label: 'Quotation' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'PAUSED', label: 'Paused' },
    { key: 'EXPIRED', label: 'Expired' },
    { key: 'CLOSED', label: 'Closed' },
  ];

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const statusParam = selectedStatus !== 'ALL' ? selectedStatus : undefined;
      const [subsRes, plansRes] = await Promise.all([
        api.get('/subscriptions', {
          params: {
            status: statusParam,
            planId: selectedPlan || undefined,
            search: search || undefined,
          },
        }),
        api.get('/plans'),
      ]);
      setSubscriptions(subsRes.data.items || []);
      setPlans(plansRes.data.items || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedStatus, selectedPlan]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadData();
  }

  function handleStatusTab(status) {
    setSelectedStatus(status);
    if (status === 'ALL') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', status);
    }
    setSearchParams(searchParams);
  }

  // Quick Action Handlers
  async function submitQuote(id) {
    try {
      await api.post(`/subscriptions/${id}/submit-quote`);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit quotation');
    }
  }

  async function confirmQuote(id) {
    try {
      await api.post(`/subscriptions/${id}/confirm`);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to confirm quotation');
    }
  }

  async function activateSub(id) {
    try {
      await api.post(`/subscriptions/${id}/activate`);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to activate subscription');
    }
  }

  async function pauseSub(id) {
    try {
      await api.post(`/subscriptions/${id}/pause`, { reason: 'Paused from pipeline dashboard' });
      await loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to pause subscription');
    }
  }

  async function resumeSub(id) {
    try {
      await api.post(`/subscriptions/${id}/resume`);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resume subscription');
    }
  }

  // Metrics
  const totalCount = subscriptions.length;
  const activeCount = subscriptions.filter((s) => s.status === 'ACTIVE').length;
  const quoteCount = subscriptions.filter((s) => s.status === 'QUOTATION').length;
  const activeRevenue = subscriptions
    .filter((s) => s.status === 'ACTIVE')
    .reduce((sum, s) => sum + (s.calculated?.grandTotal || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Subscription Sales Pipeline</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track customer subscriptions across quotes, activations, renewals, and lifecycle states.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => loadData()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button onClick={() => navigate(`${basePath}/subscriptions/new`)}>
            <Plus className="size-4" />
            New Quote / Subscription
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Total Subscriptions</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
            </div>
            <div className="p-2.5 rounded-full bg-slate-100 text-slate-700">
              <FileText className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Active Subscriptions</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
            </div>
            <div className="p-2.5 rounded-full bg-emerald-50 text-emerald-600">
              <PlayCircle className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Pending Quotes</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{quoteCount}</p>
            </div>
            <div className="p-2.5 rounded-full bg-amber-50 text-amber-600">
              <Send className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Active Recurring Value</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">${activeRevenue.toFixed(2)}</p>
            </div>
            <div className="p-2.5 rounded-full bg-blue-50 text-blue-600">
              <DollarSign className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Status Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleStatusTab(tab.key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors -mb-px',
              selectedStatus === tab.key
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                placeholder="Search by SUB-XXXX, company name, billing email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="w-full sm:w-56">
              <Select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)}>
                <option value="">All Subscription Plans</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.interval})
                  </option>
                ))}
              </Select>
            </div>

            <Button type="submit" variant="outline">
              Filter
            </Button>
            {(search || selectedPlan) && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSearch('');
                  setSelectedPlan('');
                  loadData();
                }}
              >
                Reset
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Subscriptions Table */}
      <Card>
        <CardHeader className="border-b border-slate-100 py-4">
          <CardTitle className="text-base font-semibold">
            {selectedStatus === 'ALL' ? 'All Subscriptions' : `${selectedStatus} Subscriptions`} ({subscriptions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-slate-400" />
              Loading subscriptions...
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <FileText className="size-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-700">No subscriptions found</p>
              <p className="text-xs text-slate-400 mt-1">
                {selectedStatus !== 'ALL'
                  ? `There are currently no subscriptions in '${selectedStatus}' state.`
                  : 'Get started by creating a new quotation or subscription.'}
              </p>
              <Button
                size="sm"
                className="mt-4"
                onClick={() => navigate(`${basePath}/subscriptions/new`)}
              >
                <Plus className="size-4 mr-1" />
                Build New Quote
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">Subscription #</th>
                    <th className="px-6 py-3 font-medium">Customer</th>
                    <th className="px-6 py-3 font-medium">Plan & Interval</th>
                    <th className="px-6 py-3 font-medium text-center">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Grand Total</th>
                    <th className="px-6 py-3 font-medium text-center">Next Billing</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <button
                          type="button"
                          className="hover:underline text-blue-600"
                          onClick={() => navigate(`${basePath}/subscriptions/${sub.id}`)}
                        >
                          {sub.number}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{sub.customer?.companyName}</div>
                        <div className="text-xs text-slate-400">{sub.customer?.billingEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{sub.plan?.name}</div>
                        <div className="text-xs text-slate-500 uppercase">{sub.billingInterval}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        ${Number(sub.calculated?.grandTotal || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-slate-600">
                        {sub.nextBillingDate ? (
                          <span>{new Date(sub.nextBillingDate).toLocaleDateString()}</span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Contextual lifecycle action buttons */}
                          {sub.status === 'DRAFT' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-medium"
                              onClick={() => submitQuote(sub.id)}
                            >
                              <Send className="size-3 mr-1 text-amber-600" />
                              Submit
                            </Button>
                          )}

                          {sub.status === 'QUOTATION' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              onClick={() => confirmQuote(sub.id)}
                            >
                              <CheckCircle className="size-3 mr-1" />
                              Confirm
                            </Button>
                          )}

                          {sub.status === 'CONFIRMED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
                              onClick={() => activateSub(sub.id)}
                            >
                              <PlayCircle className="size-3 mr-1" />
                              Activate
                            </Button>
                          )}

                          {sub.status === 'ACTIVE' && sub.plan?.allowPause && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              onClick={() => pauseSub(sub.id)}
                              title="Pause Subscription"
                            >
                              <PauseCircle className="size-4" />
                            </Button>
                          )}

                          {sub.status === 'PAUSED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-medium text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              onClick={() => resumeSub(sub.id)}
                            >
                              <PlayCircle className="size-3 mr-1" />
                              Resume
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-slate-600"
                            onClick={() => navigate(`${basePath}/subscriptions/${sub.id}`)}
                            title="View Full Details"
                          >
                            <Eye className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
