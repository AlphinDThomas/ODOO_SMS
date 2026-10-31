import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Building2,
  Clock,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  XCircle,
  Send,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { StatusTimeline } from '@/components/subscriptions/StatusTimeline';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SubscriptionDetailPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog states for Pause, Close, Renew
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('');

  const basePath = profile?.role === 'ADMIN' ? '/admin' : '/staff';

  async function loadSubscription() {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get(`/subscriptions/${id}`);
      setSub(data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubscription();
  }, [id]);

  // Lifecycle Action Handlers
  async function handleSubmitQuote() {
    try {
      setActionLoading(true);
      await api.post(`/subscriptions/${id}/submit-quote`);
      await loadSubscription();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit quotation');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirmQuote() {
    try {
      setActionLoading(true);
      await api.post(`/subscriptions/${id}/confirm`);
      await loadSubscription();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to confirm quotation');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleActivate() {
    try {
      setActionLoading(true);
      await api.post(`/subscriptions/${id}/activate`);
      await loadSubscription();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to activate subscription');
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePause() {
    try {
      setActionLoading(true);
      await api.post(`/subscriptions/${id}/pause`, { reason });
      setIsPauseOpen(false);
      setReason('');
      await loadSubscription();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to pause subscription');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResume() {
    try {
      setActionLoading(true);
      await api.post(`/subscriptions/${id}/resume`);
      await loadSubscription();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resume subscription');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRenew() {
    try {
      setActionLoading(true);
      await api.post(`/subscriptions/${id}/renew`, {
        newExpiryDate: newExpiryDate || undefined,
      });
      setIsRenewOpen(false);
      setNewExpiryDate('');
      await loadSubscription();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to renew subscription');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleClose() {
    try {
      setActionLoading(true);
      await api.post(`/subscriptions/${id}/close`, { reason });
      setIsCloseOpen(false);
      setReason('');
      await loadSubscription();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to close subscription');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500">
        <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-slate-400" />
        Loading subscription record...
      </div>
    );
  }

  if (error || !sub) {
    return (
      <div className="p-8 text-center">
        <p className="text-rose-600 font-semibold mb-4">{error || 'Subscription not found'}</p>
        <Button variant="outline" onClick={() => navigate(`${basePath}/subscriptions`)}>
          Back to Subscriptions
        </Button>
      </div>
    );
  }

  const isQuotation = sub.status === 'QUOTATION';
  const isExpiredQuote =
    isQuotation && sub.quotationExpiresAt && new Date(sub.quotationExpiresAt) <= new Date();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`${basePath}/subscriptions`)}
            className="text-slate-500"
          >
            <ArrowLeft className="size-4 mr-1" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{sub.number}</h1>
              <StatusBadge status={sub.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Client: <span className="font-semibold text-slate-800">{sub.customer?.companyName}</span>
              {' • '}
              Plan: <span className="font-semibold text-slate-800">{sub.plan?.name}</span> ({sub.billingInterval})
            </p>
          </div>
        </div>

        {/* LIFECYCLE ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          {sub.status === 'DRAFT' && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                onClick={handleSubmitQuote}
                disabled={actionLoading}
              >
                <Send className="size-3.5 mr-1.5" />
                Submit Quotation
              </Button>
              <Button
                size="sm"
                className="bg-slate-900 text-white"
                onClick={handleActivate}
                disabled={actionLoading}
              >
                <PlayCircle className="size-3.5 mr-1.5" />
                Activate Directly
              </Button>
            </>
          )}

          {sub.status === 'QUOTATION' && (
            <>
              <Button
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={handleConfirmQuote}
                disabled={actionLoading || isExpiredQuote}
              >
                <CheckCircle className="size-3.5 mr-1.5" />
                Confirm Quotation
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                onClick={() => setIsCloseOpen(true)}
                disabled={actionLoading}
              >
                <XCircle className="size-3.5 mr-1.5" />
                Reject / Close
              </Button>
            </>
          )}

          {sub.status === 'CONFIRMED' && (
            <Button
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleActivate}
              disabled={actionLoading}
            >
              <PlayCircle className="size-3.5 mr-1.5" />
              Activate Subscription
            </Button>
          )}

          {sub.status === 'ACTIVE' && (
            <>
              {sub.plan?.allowPause && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-amber-700 border-amber-300 hover:bg-amber-50"
                  onClick={() => setIsPauseOpen(true)}
                  disabled={actionLoading}
                >
                  <PauseCircle className="size-3.5 mr-1.5" />
                  Pause
                </Button>
              )}
              {sub.plan?.allowRenewal && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRenewOpen(true)}
                  disabled={actionLoading}
                >
                  <RotateCcw className="size-3.5 mr-1.5" />
                  Renew
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                onClick={() => setIsCloseOpen(true)}
                disabled={actionLoading}
              >
                <XCircle className="size-3.5 mr-1.5" />
                Close
              </Button>
            </>
          )}

          {sub.status === 'PAUSED' && (
            <>
              <Button
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={handleResume}
                disabled={actionLoading}
              >
                <PlayCircle className="size-3.5 mr-1.5" />
                Resume Subscription
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                onClick={() => setIsCloseOpen(true)}
                disabled={actionLoading}
              >
                <XCircle className="size-3.5 mr-1.5" />
                Close
              </Button>
            </>
          )}

          {sub.status === 'EXPIRED' && (
            <>
              {sub.plan?.allowRenewal && (
                <Button
                  size="sm"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => setIsRenewOpen(true)}
                  disabled={actionLoading}
                >
                  <RotateCcw className="size-3.5 mr-1.5" />
                  Renew Now
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                onClick={() => setIsCloseOpen(true)}
                disabled={actionLoading}
              >
                <XCircle className="size-3.5 mr-1.5" />
                Close
              </Button>
            </>
          )}
        </div>
      </div>

      {/* STATUS TIMELINE BAR */}
      <StatusTimeline status={sub.status} />

      {/* Quotation Expiry Alert */}
      {isQuotation && sub.quotationExpiresAt && (
        <div
          className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
            isExpiredQuote
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="size-4" />
            <span>
              {isExpiredQuote
                ? `This quotation expired on ${new Date(sub.quotationExpiresAt).toLocaleString()}`
                : `Quotation is open and valid until ${new Date(sub.quotationExpiresAt).toLocaleString()}`}
            </span>
          </div>
          <span className="font-semibold">Validity: {sub.quotationValidityDays} days</span>
        </div>
      )}

      {/* DETAILS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Information Card */}
        <Card>
          <CardHeader className="border-b border-slate-100 py-3">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
              <Building2 className="size-4 text-slate-400" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            <div>
              <p className="text-slate-400 uppercase text-[10px] font-semibold">Company</p>
              <p className="text-slate-800 font-bold text-sm mt-0.5">{sub.customer?.companyName}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase text-[10px] font-semibold">Billing Email</p>
              <p className="text-slate-700 font-medium mt-0.5">{sub.customer?.billingEmail}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase text-[10px] font-semibold">Phone</p>
              <p className="text-slate-700 font-medium mt-0.5">{sub.customer?.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase text-[10px] font-semibold">Billing Address</p>
              <p className="text-slate-700 mt-0.5">
                {[
                  sub.customer?.addressLine1,
                  sub.customer?.city,
                  sub.customer?.state,
                  sub.customer?.postalCode,
                  sub.customer?.country,
                ]
                  .filter(Boolean)
                  .join(', ') || 'No address specified'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Plan & Billing Terms Card */}
        <Card>
          <CardHeader className="border-b border-slate-100 py-3">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
              <Calendar className="size-4 text-slate-400" />
              Subscription & Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            <div>
              <p className="text-slate-400 uppercase text-[10px] font-semibold">Plan</p>
              <p className="text-slate-800 font-bold text-sm mt-0.5">{sub.plan?.name}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase text-[10px] font-semibold">Billing Interval</p>
              <p className="text-slate-700 font-medium mt-0.5 uppercase">{sub.billingInterval}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase text-[10px] font-semibold">Payment Terms</p>
              <p className="text-slate-700 font-medium mt-0.5">{sub.paymentTermsDays} days net</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase text-[10px] font-semibold">Start & Expiry</p>
              <p className="text-slate-700 mt-0.5">
                {new Date(sub.startDate).toLocaleDateString()} → {new Date(sub.expiryDate).toLocaleDateString()}
              </p>
            </div>
            {sub.nextBillingDate && (
              <div>
                <p className="text-slate-400 uppercase text-[10px] font-semibold">Next Scheduled Invoice</p>
                <p className="text-emerald-700 font-bold mt-0.5">
                  {new Date(sub.nextBillingDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lifecycle Audit Card */}
        <Card>
          <CardHeader className="border-b border-slate-100 py-3">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
              <Clock className="size-4 text-slate-400" />
              Pipeline Audit
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            <div>
              <p className="text-slate-400 uppercase text-[10px] font-semibold">Created By</p>
              <p className="text-slate-700 mt-0.5">
                {sub.createdBy?.fullName || sub.createdBy?.email} ({new Date(sub.createdAt).toLocaleDateString()})
              </p>
            </div>
            {sub.submittedAt && (
              <div>
                <p className="text-slate-400 uppercase text-[10px] font-semibold">Quote Submitted</p>
                <p className="text-slate-700 mt-0.5">{new Date(sub.submittedAt).toLocaleString()}</p>
              </div>
            )}
            {sub.acceptedAt && (
              <div>
                <p className="text-slate-400 uppercase text-[10px] font-semibold">Quote Accepted</p>
                <p className="text-slate-700 mt-0.5">
                  {new Date(sub.acceptedAt).toLocaleString()}
                  {sub.acceptedBy && ` by ${sub.acceptedBy.fullName || sub.acceptedBy.email}`}
                </p>
              </div>
            )}
            {sub.pausedAt && (
              <div>
                <p className="text-amber-600 uppercase text-[10px] font-semibold">Paused At</p>
                <p className="text-amber-800 mt-0.5">{new Date(sub.pausedAt).toLocaleString()}</p>
              </div>
            )}
            {sub.closedAt && (
              <div>
                <p className="text-rose-600 uppercase text-[10px] font-semibold">Closed At</p>
                <p className="text-rose-800 mt-0.5">
                  {new Date(sub.closedAt).toLocaleString()} ({sub.closeReason || 'Closed'})
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ITEMIZED SUBSCRIPTION LINES */}
      <Card>
        <CardHeader className="border-b border-slate-100 py-3">
          <CardTitle className="text-sm font-semibold">Itemized Subscription Lines</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Product / Service</th>
                  <th className="px-6 py-3 font-medium">Variant</th>
                  <th className="px-6 py-3 font-medium text-center">Qty</th>
                  <th className="px-6 py-3 font-medium text-right">Unit Price</th>
                  <th className="px-6 py-3 font-medium text-center">Tax %</th>
                  <th className="px-6 py-3 font-medium text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sub.lines?.map((line) => (
                  <tr key={line.id} className="hover:bg-slate-50/75">
                    <td className="px-6 py-3 font-semibold text-slate-900">
                      {line.product?.name}
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {line.variant?.name || 'Standard'}
                    </td>
                    <td className="px-6 py-3 text-center font-medium text-slate-800">
                      {line.quantity}
                    </td>
                    <td className="px-6 py-3 text-right text-slate-700">
                      ${Number(line.unitPrice).toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-center text-slate-500">
                      {Number(line.taxRatePercent)}%
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-slate-900">
                      ${Number(line.lineAmount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Breakdown Bottom Bar */}
          <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row justify-end items-end sm:items-center gap-6 text-xs">
            <div>
              <span className="text-slate-500">Subtotal:</span>
              <span className="font-semibold text-slate-800 ml-2">
                ${Number(sub.calculated?.subtotal || 0).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Taxes:</span>
              <span className="font-semibold text-slate-800 ml-2">
                ${Number(sub.calculated?.taxTotal || 0).toFixed(2)}
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              <span>Grand Total per {sub.billingInterval}:</span>
              <span className="text-base text-slate-900 font-extrabold ml-2">
                ${Number(sub.calculated?.grandTotal || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LINKED INVOICES */}
      <Card>
        <CardHeader className="border-b border-slate-100 py-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>Billing Invoices ({sub.invoices?.length || 0})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sub.invoices?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">Invoice #</th>
                    <th className="px-6 py-3 font-medium">Issue Date</th>
                    <th className="px-6 py-3 font-medium">Due Date</th>
                    <th className="px-6 py-3 font-medium text-center">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Grand Total</th>
                    <th className="px-6 py-3 font-medium text-right">Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sub.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/75">
                      <td className="px-6 py-3 font-bold text-slate-900">{inv.number}</td>
                      <td className="px-6 py-3 text-slate-600">
                        {new Date(inv.issueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-slate-800">
                        ${Number(inv.grandTotal).toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-rose-600">
                        ${Number(inv.balanceDue).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              No invoices generated for this subscription yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* PAUSE MODAL */}
      <Dialog
        open={isPauseOpen}
        onClose={() => setIsPauseOpen(false)}
        title="Pause Subscription"
        description="Temporarily freeze active subscription and recurring billing."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pauseReason">Reason for Pausing (Optional)</Label>
            <Input
              id="pauseReason"
              placeholder="e.g. Client requested temporary suspension"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsPauseOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 text-white hover:bg-amber-700"
              onClick={handlePause}
              disabled={actionLoading}
            >
              Confirm Pause
            </Button>
          </div>
        </div>
      </Dialog>

      {/* RENEW MODAL */}
      <Dialog
        open={isRenewOpen}
        onClose={() => setIsRenewOpen(false)}
        title="Renew Subscription"
        description="Extend the subscription's active validity period."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="newExpiry">New Expiry Date (Optional - defaults to +1 interval)</Label>
            <Input
              id="newExpiry"
              type="date"
              value={newExpiryDate}
              onChange={(e) => setNewExpiryDate(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsRenewOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleRenew}
              disabled={actionLoading}
            >
              Confirm Renewal
            </Button>
          </div>
        </div>
      </Dialog>

      {/* CLOSE MODAL */}
      <Dialog
        open={isCloseOpen}
        onClose={() => setIsCloseOpen(false)}
        title="Close Subscription"
        description="Permanently close this subscription. This action will terminate recurring billing."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="closeReason">Reason for Closure</Label>
            <Input
              id="closeReason"
              placeholder="e.g. Contract terminated, customer churned"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsCloseOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={handleClose}
              disabled={actionLoading}
            >
              Confirm Closure
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
