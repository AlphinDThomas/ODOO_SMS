import { useState } from 'react';
import { AlertCircle, CheckCircle2, DollarSign, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

const PAYMENT_METHODS = [
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CARD', label: 'Credit / Debit Card' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CASH', label: 'Cash' },
  { value: 'OTHER', label: 'Other' },
];

export function RecordPaymentModal({ invoice, isOpen, onClose, onSuccess }) {
  if (!isOpen || !invoice) return null;

  const maxBalance = Number(invoice.balanceDue);
  const [amount, setAmount] = useState(maxBalance.toFixed(2));
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const numAmount = parseFloat(amount) || 0;
  const isOverpaid = numAmount > maxBalance + 0.001;
  const isInvalid = numAmount <= 0 || isOverpaid;

  async function handleSubmit(e) {
    e.preventDefault();
    if (isInvalid) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/payments', {
        invoiceId: invoice.id,
        amount: numAmount,
        method,
        paidAt: new Date(paidAt).toISOString(),
        note: note.trim() || undefined,
      });

      onSuccess(res.data);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <DollarSign className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Record Payment</h3>
            <p className="text-xs text-slate-500">
              Invoice #{invoice.number} — {invoice.customer?.companyName || 'Customer'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Invoice Grand Total:</span>
              <span className="font-medium text-slate-700">${Number(invoice.grandTotal).toFixed(2)}</span>
            </div>
            <div className="mt-1 flex justify-between text-xs text-slate-500">
              <span>Already Paid:</span>
              <span className="font-medium text-emerald-600">${Number(invoice.amountPaid).toFixed(2)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-sm font-semibold text-slate-900">
              <span>Outstanding Balance:</span>
              <span className="text-emerald-700">${maxBalance.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Payment Amount ($)</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAmount(maxBalance.toFixed(2))}
                  className="text-xs text-emerald-600 hover:underline"
                >
                  Full (${maxBalance.toFixed(2)})
                </button>
                <button
                  type="button"
                  onClick={() => setAmount((maxBalance / 2).toFixed(2))}
                  className="text-xs text-slate-500 hover:underline"
                >
                  50%
                </button>
              </div>
            </div>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={maxBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={isOverpaid ? 'border-rose-400 focus:ring-rose-400' : ''}
              required
            />
            {isOverpaid && (
              <p className="mt-1 text-xs text-rose-600">
                Payment exceeds remaining balance (${maxBalance.toFixed(2)})
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="method">Payment Method</Label>
              <select
                id="method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-xs focus:border-slate-900 focus:outline-hidden"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="paidAt">Payment Date</Label>
              <Input
                id="paidAt"
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="note">Payment Reference / Note (Optional)</Label>
            <Input
              id="note"
              placeholder="e.g. Bank Ref #TX-8291, Wire transfer confirmation"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isInvalid || loading}>
              {loading ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
