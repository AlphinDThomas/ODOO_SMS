import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Bell, CheckCircle2, Clock, DollarSign, Layers, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

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

export function CustomerNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [subsRes, invRes] = await Promise.all([
        api.get('/portal/subscriptions'),
        api.get('/portal/invoices'),
      ]);

      const subs = subsRes.data?.subscriptions || [];
      const invoices = invRes.data?.invoices || [];

      const list = [];

      // 1. Pending Quotations Notifications
      subs
        .filter((s) => s.status === 'QUOTATION')
        .forEach((s) => {
          const expiresAt = s.quotationExpiresAt ? new Date(s.quotationExpiresAt) : null;
          const isUrgent = expiresAt && expiresAt.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

          list.push({
            id: `quote-${s.id}`,
            type: 'quote',
            title: `Quotation ${s.number} Requires Your Action`,
            description: `A sales quotation for plan "${s.plan?.name}" is ready for your review and acceptance.`,
            meta: expiresAt ? `Expires: ${formatDate(expiresAt)}` : 'Awaiting confirmation',
            urgent: isUrgent,
            link: '/customer#quotes',
            actionText: 'Review Quotation',
            icon: Clock,
            color: 'amber',
          });
        });

      // 2. Pending Invoices Notifications
      invoices
        .filter((inv) => inv.status === 'CONFIRMED' || inv.status === 'PARTIALLY_PAID')
        .forEach((inv) => {
          const balance = Number(inv.balanceDue) || 0;
          list.push({
            id: `inv-${inv.id}`,
            type: 'invoice',
            title: `Invoice ${inv.invoiceNumber} Pending Payment`,
            description: `Outstanding balance of ${formatCurrency(balance)} is due for billing period ${formatDate(inv.periodStart)} – ${formatDate(inv.periodEnd)}.`,
            meta: `Due Date: ${formatDate(inv.dueDate)}`,
            urgent: new Date(inv.dueDate).getTime() < Date.now(),
            link: `/customer/invoices/${inv.id}`,
            actionText: 'View Invoice',
            icon: DollarSign,
            color: 'blue',
          });
        });

      // 3. Active Subscriptions
      subs
        .filter((s) => s.status === 'ACTIVE' && s.nextBillingDate)
        .forEach((s) => {
          list.push({
            id: `sub-${s.id}`,
            type: 'renewal',
            title: `Subscription ${s.number} (${s.plan?.name}) Active`,
            description: `Next recurring billing cycle will process on ${formatDate(s.nextBillingDate)}.`,
            meta: `Cycle: ${s.billingInterval}`,
            urgent: false,
            link: '/customer#subscriptions',
            actionText: 'Subscription Details',
            icon: Layers,
            color: 'emerald',
          });
        });

      setNotifications(list);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl flex items-center gap-2.5">
            <Bell className="size-6 text-slate-700" />
            Notifications & Alerts
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Important updates regarding your quotes, subscription renewals, and invoice payments.
          </p>
        </div>
        <button
          onClick={() => {
            setRefreshing(true);
            loadData();
          }}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50"
        >
          <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <RefreshCw className="size-8 animate-spin text-slate-400" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="border-slate-200 p-8 text-center">
          <CheckCircle2 className="mx-auto size-10 text-emerald-500 mb-2" />
          <h3 className="text-base font-semibold text-slate-900">You are all caught up!</h3>
          <p className="text-xs text-slate-500 mt-1">
            There are no pending actions or urgent alerts on your account.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const Icon = n.icon;
            const isAmber = n.color === 'amber';
            const isBlue = n.color === 'blue';
            const isEmerald = n.color === 'emerald';

            return (
              <Card
                key={n.id}
                className={`border-slate-200 shadow-xs transition-colors ${
                  n.urgent ? 'border-l-4 border-l-amber-500 bg-amber-50/20' : ''
                }`}
              >
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                        isAmber
                          ? 'bg-amber-100 text-amber-700'
                          : isBlue
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                        {n.urgent && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                            Action Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{n.description}</p>
                      <p className="text-[11px] font-medium text-slate-400 mt-1">{n.meta}</p>
                    </div>
                  </div>
                  <div>
                    {n.link.startsWith('#') || n.link.includes('#') ? (
                      <a
                        href={n.link}
                        className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
                      >
                        {n.actionText}
                      </a>
                    ) : (
                      <Link
                        to={n.link}
                        className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
                      >
                        {n.actionText}
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
