import { useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronRight, Loader2, Sparkles, X, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

export function RunBillingModal({ isOpen, onClose, onCompleted }) {
  if (!isOpen) return null;

  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  async function handleRun(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await api.post('/billing/run', {
        asOfDate,
      });
      setResults(res.data);
      if (onCompleted) {
        onCompleted(res.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Billing cycle execution failed');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResults(null);
    setError(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <button
          onClick={handleReset}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
            <Zap className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Run Automated Billing Cycle</h3>
            <p className="text-xs text-slate-500">
              Generate recurring invoices for all due subscriptions
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!results ? (
          <form onSubmit={handleRun} className="mt-4 space-y-4">
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4 text-xs text-indigo-900">
              <p className="font-medium text-indigo-950">How Recurring Billing Works:</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-indigo-800">
                <li>Finds all <strong>ACTIVE</strong> subscriptions due on or before the selected date.</li>
                <li>Automatically computes product taxes and applies active discount rules.</li>
                <li>Generates official, sequential invoices (e.g. <code>INV-0001</code>).</li>
                <li>Guarantees <strong>idempotency</strong> via Billing Records (no subscription is billed twice).</li>
                <li>Advances subscription billing schedules to the next cycle.</li>
              </ul>
            </div>

            <div>
              <Label htmlFor="asOfDate">Billing As-Of Date</Label>
              <Input
                id="asOfDate"
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Any subscription with next billing date on or before this day will be processed.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Generating Invoices...
                  </>
                ) : (
                  <>
                    <Zap className="size-4" />
                    Execute Billing Run
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-4 text-emerald-800">
              <CheckCircle2 className="size-6 shrink-0 text-emerald-600" />
              <div>
                <h4 className="font-semibold text-emerald-950">Billing Cycle Completed!</h4>
                <p className="text-xs text-emerald-700">
                  Processed {results.processedCount} subscriptions up to {results.asOfDate}.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-slate-50 p-3">
                <span className="block text-2xl font-bold text-emerald-600">
                  {results.createdInvoices?.length || 0}
                </span>
                <span className="text-xs text-slate-500">Invoices Created</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <span className="block text-2xl font-bold text-slate-700">
                  {results.skipped?.length || 0}
                </span>
                <span className="text-xs text-slate-500">Skipped (Up-to-Date)</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <span className="block text-2xl font-bold text-indigo-600">
                  ${(results.createdInvoices || []).reduce((acc, inv) => acc + Number(inv.grandTotal), 0).toFixed(2)}
                </span>
                <span className="text-xs text-slate-500">Total Billed</span>
              </div>
            </div>

            {results.createdInvoices?.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Newly Created Invoices
                </h5>
                <div className="mt-2 max-h-48 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {results.createdInvoices.map((inv) => (
                    <div key={inv.invoiceId} className="flex items-center justify-between p-3 text-xs hover:bg-slate-50">
                      <div>
                        <span className="font-semibold text-slate-900">{inv.invoiceNumber}</span>
                        <span className="ml-2 text-slate-500">{inv.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">${Number(inv.grandTotal).toFixed(2)}</span>
                        <Link
                          to={`/admin/invoices/${inv.invoiceId}`}
                          onClick={handleReset}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <ChevronRight className="size-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button onClick={handleReset}>Done & Refresh View</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
