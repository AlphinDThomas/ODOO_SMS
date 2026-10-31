import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Zap,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { RecordPaymentModal } from './RecordPaymentModal';
import { RunBillingModal } from './RunBillingModal';

const STATUS_TABS = [
  { key: 'ALL', label: 'All Invoices' },
  { key: 'CONFIRMED', label: 'Unpaid / Confirmed' },
  { key: 'PARTIALLY_PAID', label: 'Partially Paid' },
  { key: 'PAID', label: 'Paid' },
  { key: 'OVERDUE', label: 'Overdue ⚠️' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

function StatusBadge({ status, isOverdue }) {
  if (isOverdue && ['CONFIRMED', 'PARTIALLY_PAID'].includes(status)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
        <AlertTriangle className="size-3" />
        Overdue
      </span>
    );
  }

  const styles = {
    DRAFT: 'bg-slate-100 text-slate-700',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PARTIALLY_PAID: 'bg-amber-100 text-amber-800',
    PAID: 'bg-emerald-100 text-emerald-800',
    CANCELLED: 'bg-slate-200 text-slate-500 line-through',
  };

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', styles[status] || 'bg-slate-100 text-slate-700')}>
      {status.replace('_', ' ')}
    </span>
  );
}

export function InvoicesPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [metrics, setMetrics] = useState({ totalDue: 0, totalPaid: 0, countOverdue: 0, totalOverdue: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);

  const basePath = profile?.role === 'ADMIN' ? '/admin' : profile?.role === 'STAFF' ? '/staff' : '/customer';
  const canManage = profile?.role === 'ADMIN' || profile?.role === 'STAFF';

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  async function fetchInvoices() {
    setLoading(true);
    try {
      const res = await api.get('/invoices', {
        params: {
          page,
          pageSize,
          status: status === 'ALL' ? undefined : status,
          search: debouncedSearch.trim() || undefined,
        },
      });

      setInvoices(res.data.invoices || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
      if (res.data.metrics) {
        setMetrics(res.data.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInvoices();
  }, [page, status, debouncedSearch]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Invoices & Billing</h1>
          <p className="text-sm text-slate-500">
            Automated recurring invoices, payment tracking, and collections
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInvoices}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
            Refresh
          </Button>

          {canManage && (
            <Button
              size="sm"
              onClick={() => setBillingModalOpen(true)}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <Zap className="size-4" />
              Run Billing Cycle
            </Button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Invoices</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
              <FileText className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{total}</span>
          </div>
          <span className="text-xs text-slate-500">Generated across all cycles</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Collected</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">${metrics.totalPaid.toFixed(2)}</span>
          </div>
          <span className="text-xs text-slate-500">Successful payments recorded</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Outstanding</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">${metrics.totalDue.toFixed(2)}</span>
          </div>
          <span className="text-xs text-slate-500">Balance awaiting payment</span>
        </Card>

        <Card className="border-rose-200 bg-rose-50/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-rose-700">Overdue Balance</span>
            <div className="rounded-lg bg-rose-100 p-2 text-rose-700">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-700">${metrics.totalOverdue.toFixed(2)}</span>
            <span className="text-xs font-semibold text-rose-600">({metrics.countOverdue} invoices)</span>
          </div>
          <span className="text-xs text-rose-600">Passed payment due date</span>
        </Card>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatus(tab.key);
                setPage(1);
              }}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                status === tab.key
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute top-2.5 left-2.5 size-4 text-slate-400" />
          <Input
            placeholder="Search invoice # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
              <tr>
                <th className="p-3">Invoice #</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Subscription</th>
                <th className="p-3">Issue Date</th>
                <th className="p-3">Due Date</th>
                <th className="p-3 text-right">Grand Total</th>
                <th className="p-3 text-right">Amount Paid</th>
                <th className="p-3 text-right">Balance Due</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    No invoices found matching your criteria.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="p-3 font-semibold text-slate-900">
                      <Link
                        to={`${basePath}/invoices/${inv.id}`}
                        className="text-indigo-600 hover:underline"
                      >
                        {inv.number}
                      </Link>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-900">
                        {inv.customer?.companyName || '—'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {inv.customer?.billingEmail}
                      </div>
                    </td>
                    <td className="p-3 text-slate-600">
                      {inv.subscription ? (
                        <span>
                          {inv.subscription.number}
                          {inv.subscription.plan && (
                            <span className="block text-[10px] text-slate-400">
                              {inv.subscription.plan.name} ({inv.subscription.plan.interval})
                            </span>
                          )}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3 text-slate-600">
                      {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3">
                      <span className={cn('text-slate-600', inv.isOverdue && 'font-semibold text-rose-600')}>
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium text-slate-900">
                      ${Number(inv.grandTotal).toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-emerald-600">
                      ${Number(inv.amountPaid).toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-semibold">
                      <span className={Number(inv.balanceDue) > 0 ? 'text-amber-700' : 'text-slate-400'}>
                        ${Number(inv.balanceDue).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <StatusBadge status={inv.status} isOverdue={inv.isOverdue} />
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canManage && Number(inv.balanceDue) > 0 && inv.status !== 'DRAFT' && inv.status !== 'CANCELLED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[11px] text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                            onClick={() => setPaymentModalInvoice(inv)}
                          >
                            <DollarSign className="size-3" />
                            Pay
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => navigate(`${basePath}/invoices/${inv.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            <span>
              Showing {invoices.length} of {total} invoices (Page {page} of {totalPages})
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Automated Billing Run Modal */}
      <RunBillingModal
        isOpen={billingModalOpen}
        onClose={() => setBillingModalOpen(false)}
        onCompleted={fetchInvoices}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        invoice={paymentModalInvoice}
        isOpen={!!paymentModalInvoice}
        onClose={() => setPaymentModalInvoice(null)}
        onSuccess={() => {
          fetchInvoices();
        }}
      />
    </div>
  );
}
