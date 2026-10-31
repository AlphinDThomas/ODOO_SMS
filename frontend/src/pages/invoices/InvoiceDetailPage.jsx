import { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  Mail,
  Printer,
  XCircle,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { RecordPaymentModal } from './RecordPaymentModal';

export function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const basePath = profile?.role === 'ADMIN' ? '/admin' : profile?.role === 'STAFF' ? '/staff' : '/customer';
  const canManage = profile?.role === 'ADMIN' || profile?.role === 'STAFF';

  async function fetchInvoice() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  async function handleConfirm() {
    try {
      await api.post(`/invoices/${id}/confirm`);
      setActionMessage('Invoice confirmed successfully.');
      fetchInvoice();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm invoice');
    }
  }

  async function handleCancel() {
    if (!window.confirm('Are you sure you want to cancel this invoice?')) return;
    try {
      await api.post(`/invoices/${id}/cancel`);
      setActionMessage('Invoice cancelled.');
      fetchInvoice();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel invoice');
    }
  }

  async function handleSend() {
    try {
      const res = await api.post(`/invoices/${id}/send`);
      setActionMessage(res.data.message || 'Invoice sent successfully.');
      fetchInvoice();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send invoice');
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading invoice details...</div>;
  }

  if (error || !invoice) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-medium text-rose-600">{error || 'Invoice not found'}</p>
        <Button variant="outline" size="sm" onClick={() => navigate(`${basePath}/invoices`)} className="mt-4">
          <ArrowLeft className="size-4" />
          Back to Invoices
        </Button>
      </div>
    );
  }

  const snapshot = invoice.customerSnapshot || invoice.customer || {};
  const isOverdue = invoice.isOverdue;
  const balance = Number(invoice.balanceDue);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top Header / Actions Bar (Hidden on print) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <Link
          to={`${basePath}/invoices`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          Back to Invoices
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
            <Printer className="size-4" />
            Print / PDF
          </Button>

          {canManage && (
            <>
              {invoice.status === 'DRAFT' && (
                <Button size="sm" onClick={handleConfirm} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
                  <CheckCircle2 className="size-4" />
                  Confirm Invoice
                </Button>
              )}

              {['CONFIRMED', 'PARTIALLY_PAID'].includes(invoice.status) && (
                <Button variant="outline" size="sm" onClick={handleSend} className="gap-1.5">
                  <Mail className="size-4" />
                  {invoice.sentAt ? 'Resend' : 'Send to Customer'}
                </Button>
              )}

              {balance > 0 && invoice.status !== 'DRAFT' && invoice.status !== 'CANCELLED' && (
                <Button
                  size="sm"
                  onClick={() => setPaymentModalOpen(true)}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                >
                  <DollarSign className="size-4" />
                  Record Payment
                </Button>
              )}

              {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && invoice.payments?.length === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="gap-1.5 text-rose-600 hover:bg-rose-50"
                >
                  <XCircle className="size-4" />
                  Cancel
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {actionMessage && (
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-800 print:hidden">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Printable Invoice Container */}
      <Card className="border border-slate-200 bg-white p-8 shadow-sm sm:p-12 print:border-none print:p-0 print:shadow-none">
        {/* Invoice Header */}
        <div className="flex flex-col justify-between border-b border-slate-100 pb-8 sm:flex-row">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900">Brightloop Software</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Subscription & Cloud Solutions</p>
            <p className="mt-3 text-xs text-slate-600">
              billing@brightloop.com<br />
              +1 (800) 555-LOOP<br />
              100 Innovation Way, Suite 400
            </p>
          </div>

          <div className="mt-6 text-left sm:mt-0 sm:text-right">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">INVOICE</h1>
            <p className="text-sm font-semibold text-indigo-600">{invoice.number}</p>

            <div className="mt-3 space-y-1 text-xs text-slate-600">
              <p>
                <span className="text-slate-400">Issue Date: </span>
                {new Date(invoice.issueDate).toLocaleDateString()}
              </p>
              <p>
                <span className="text-slate-400">Due Date: </span>
                <span className={cn(isOverdue && 'font-bold text-rose-600')}>
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </span>
              </p>
              {invoice.sentAt && (
                <p className="text-[11px] text-slate-400">
                  Sent: {new Date(invoice.sentAt).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="mt-3">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider',
                  invoice.status === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : invoice.status === 'PARTIALLY_PAID'
                    ? 'bg-amber-100 text-amber-800'
                    : isOverdue
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-blue-100 text-blue-800',
                )}
              >
                {isOverdue ? 'OVERDUE' : invoice.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Bill-to & Subscription Details */}
        <div className="grid grid-cols-1 gap-8 border-b border-slate-100 py-6 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Billed To:</h3>
            <p className="mt-2 text-sm font-bold text-slate-900">{snapshot.companyName || 'Valued Customer'}</p>
            <div className="mt-1 space-y-0.5 text-xs text-slate-600">
              {snapshot.billingEmail && <p>{snapshot.billingEmail}</p>}
              {snapshot.phone && <p>{snapshot.phone}</p>}
              {snapshot.addressLine1 && <p>{snapshot.addressLine1}</p>}
              {snapshot.addressLine2 && <p>{snapshot.addressLine2}</p>}
              {(snapshot.city || snapshot.state || snapshot.postalCode) && (
                <p>
                  {[snapshot.city, snapshot.state, snapshot.postalCode].filter(Boolean).join(', ')}
                </p>
              )}
              {snapshot.country && <p>{snapshot.country}</p>}
            </div>
          </div>

          <div className="sm:text-right">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Subscription Ref:</h3>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {invoice.subscription?.number || '—'}
            </p>
            <div className="mt-1 space-y-0.5 text-xs text-slate-600">
              {invoice.subscription?.plan && (
                <p>Plan: {invoice.subscription.plan.name} ({invoice.subscription.plan.interval})</p>
              )}
              <p>
                Period: {new Date(invoice.periodStart).toLocaleDateString()} –{' '}
                {new Date(invoice.periodEnd).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="pb-3">Description</th>
                <th className="pb-3 text-center">Qty</th>
                <th className="pb-3 text-right">Unit Price</th>
                <th className="pb-3 text-right">Tax</th>
                <th className="pb-3 text-right">Discount</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.lines?.map((line) => (
                <tr key={line.id}>
                  <td className="py-3">
                    <p className="font-semibold text-slate-900">{line.description}</p>
                    {line.variant && (
                      <p className="text-[11px] text-slate-400">Variant: {line.variant.name}</p>
                    )}
                  </td>
                  <td className="py-3 text-center text-slate-600">{line.quantity}</td>
                  <td className="py-3 text-right text-slate-600">${Number(line.unitPrice).toFixed(2)}</td>
                  <td className="py-3 text-right text-slate-600">
                    {Number(line.taxRatePercent) > 0 ? (
                      <span>
                        ${Number(line.taxAmount).toFixed(2)}
                        <span className="block text-[10px] text-slate-400">({Number(line.taxRatePercent)}%)</span>
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 text-right text-slate-600">
                    {Number(line.discountAmount) > 0 ? `-$${Number(line.discountAmount).toFixed(2)}` : '—'}
                  </td>
                  <td className="py-3 text-right font-medium text-slate-900">
                    ${Number(line.lineTotal).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="flex justify-end border-t border-slate-200 pt-6">
          <div className="w-full max-w-xs space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>${Number(invoice.subtotal).toFixed(2)}</span>
            </div>
            {Number(invoice.discountTotal) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount Applied:</span>
                <span>-${Number(invoice.discountTotal).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Tax Total:</span>
              <span>+${Number(invoice.taxTotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
              <span>Grand Total:</span>
              <span>${Number(invoice.grandTotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Amount Paid:</span>
              <span>${Number(invoice.amountPaid).toFixed(2)}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-slate-50 p-2 text-sm font-bold">
              <span>Balance Due:</span>
              <span className={balance > 0 ? 'text-amber-700' : 'text-slate-500'}>
                ${balance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="mt-8 border-t border-slate-100 pt-6 print:break-inside-avoid">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recorded Payments</h4>
          {invoice.payments?.length === 0 ? (
            <p className="mt-2 text-xs text-slate-400 italic">No payments recorded yet.</p>
          ) : (
            <table className="mt-3 w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold text-[11px]">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Method</th>
                  <th className="pb-2">Reference</th>
                  <th className="pb-2">Recorded By</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600">
                {invoice.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2">{new Date(p.paidAt).toLocaleDateString()}</td>
                    <td className="py-2 font-medium text-slate-800">{p.method.replace('_', ' ')}</td>
                    <td className="py-2 text-slate-400">{p.note || '—'}</td>
                    <td className="py-2 text-slate-500">{p.recordedBy?.fullName || p.recordedBy?.email || '—'}</td>
                    <td className="py-2 text-right font-semibold text-emerald-600">
                      ${Number(p.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        invoice={invoice}
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={() => {
          setActionMessage('Payment recorded successfully.');
          fetchInvoice();
        }}
      />
    </div>
  );
}
