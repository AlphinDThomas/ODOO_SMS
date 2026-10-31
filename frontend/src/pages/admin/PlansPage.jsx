import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const INTERVALS = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

const TODAY = new Date().toISOString().split('T')[0];

const EMPTY_FORM = {
  name: '',
  amount: '',
  interval: 'MONTHLY',
  minQuantity: '1',
  availableFrom: TODAY,
  availableTo: '',
  autoCloseOnEnd: true,
  allowEarlyClose: false,
  allowPause: false,
  allowRenewal: true,
  isActive: true,
};

export function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [intervalFilter, setIntervalFilter] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function loadPlans() {
    setLoading(true);
    try {
      const params = { page: 1, pageSize: 100 };
      if (search) params.search = search;
      if (intervalFilter) params.interval = intervalFilter;
      const { data } = await api.get('/plans', { params });
      setPlans(data.items);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load plans');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlans();
  }, [search, intervalFilter]);

  function startCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  function startEdit(plan) {
    setEditing(plan.id);
    setForm({
      name: plan.name,
      amount: String(plan.amount),
      interval: plan.interval,
      minQuantity: String(plan.minQuantity),
      availableFrom: plan.availableFrom?.split('T')[0] ?? TODAY,
      availableTo: plan.availableTo?.split('T')[0] ?? '',
      autoCloseOnEnd: plan.autoCloseOnEnd,
      allowEarlyClose: plan.allowEarlyClose,
      allowPause: plan.allowPause,
      allowRenewal: plan.allowRenewal,
      isActive: plan.isActive,
    });
    setFormError('');
  }

  function bool(key) {
    return (e) => setForm({ ...form, [key]: e.target.checked });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        amount: Number(form.amount),
        interval: form.interval,
        minQuantity: Number(form.minQuantity),
        availableFrom: form.availableFrom,
        availableTo: form.availableTo || null,
        autoCloseOnEnd: form.autoCloseOnEnd,
        allowEarlyClose: form.allowEarlyClose,
        allowPause: form.allowPause,
        allowRenewal: form.allowRenewal,
        isActive: form.isActive,
      };
      if (editing) {
        await api.patch(`/plans/${editing}`, payload);
      } else {
        await api.post('/plans', payload);
      }
      setEditing(null);
      setForm(EMPTY_FORM);
      await loadPlans();
    } catch (err) {
      setFormError(
        err.response?.data?.errors?.[0]?.message ||
          err.response?.data?.error ||
          'Save failed',
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(plan) {
    try {
      await api.patch(`/plans/${plan.id}`, { isActive: !plan.isActive });
      await loadPlans();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update plan');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Subscription Plans</h1>
        <Button onClick={startCreate}>+ New plan</Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{editing ? 'Edit plan' : 'Create plan'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-1">
              <Label htmlFor="pl-name">Plan name *</Label>
              <Input
                id="pl-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Starter Monthly"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="pl-amount">Amount *</Label>
              <Input
                id="pl-amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="pl-interval">Billing interval *</Label>
              <select
                id="pl-interval"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 ring-slate-400"
                value={form.interval}
                onChange={(e) => setForm({ ...form, interval: e.target.value })}
              >
                {INTERVALS.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="pl-minqty">Min quantity *</Label>
              <Input
                id="pl-minqty"
                type="number"
                min="1"
                step="1"
                value={form.minQuantity}
                onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="pl-from">Available from *</Label>
              <Input
                id="pl-from"
                type="date"
                value={form.availableFrom}
                onChange={(e) => setForm({ ...form, availableFrom: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="pl-to">Available to</Label>
              <Input
                id="pl-to"
                type="date"
                value={form.availableTo}
                onChange={(e) => setForm({ ...form, availableTo: e.target.value })}
              />
            </div>

            {/* Policy flags */}
            <div className="sm:col-span-2">
              <p className="mb-2 text-sm font-medium text-slate-700">Plan policies</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ['autoCloseOnEnd', 'Auto-close on end'],
                  ['allowEarlyClose', 'Allow early close'],
                  ['allowPause', 'Allow pause'],
                  ['allowRenewal', 'Allow renewal'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={bool(key)}
                      className="rounded"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                id="pl-active"
                checked={form.isActive}
                onChange={bool('isActive')}
                className="rounded"
              />
              <Label htmlFor="pl-active">Active</Label>
            </div>

            {formError ? <p className="text-sm text-red-600 sm:col-span-2">{formError}</p> : null}

            <div className="flex gap-3 sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update plan' : 'Create plan'}
              </Button>
              {editing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setEditing(null); setForm(EMPTY_FORM); }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search plans…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
          value={intervalFilter}
          onChange={(e) => setIntervalFilter(e.target.value)}
        >
          <option value="">All intervals</option>
          {INTERVALS.map((i) => (
            <option key={i}>{i}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Loading…</p>
          ) : plans.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No plans found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Interval</th>
                  <th className="px-4 py-3">Min qty</th>
                  <th className="px-4 py-3">Available from</th>
                  <th className="px-4 py-3">Available to</th>
                  <th className="px-4 py-3">Policies</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3">₹{Number(p.amount).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {p.interval}
                      </span>
                    </td>
                    <td className="px-4 py-3">{p.minQuantity}</td>
                    <td className="px-4 py-3 text-xs">{p.availableFrom?.split('T')[0]}</td>
                    <td className="px-4 py-3 text-xs">{p.availableTo?.split('T')[0] ?? '∞'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {[
                        p.autoCloseOnEnd && 'Auto-close',
                        p.allowEarlyClose && 'Early-close',
                        p.allowPause && 'Pause',
                        p.allowRenewal && 'Renewal',
                      ]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${p.isActive ? 'text-green-700' : 'text-slate-400'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          className="text-xs text-blue-600 hover:underline"
                          onClick={() => startEdit(p)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-xs text-slate-500 hover:underline"
                          onClick={() => toggleActive(p)}
                        >
                          {p.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

