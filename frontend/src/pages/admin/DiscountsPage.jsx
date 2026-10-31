import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TODAY = new Date().toISOString().split('T')[0];

const EMPTY_FORM = {
  name: '',
  type: 'PERCENTAGE',
  value: '',
  minPurchaseAmount: '',
  minQuantity: '',
  validFrom: TODAY,
  validTo: '',
  maxUses: '',
  scope: 'SUBSCRIPTION',
  isActive: true,
  productIds: [],
};

export function DiscountsPage() {
  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function loadDiscounts() {
    setLoading(true);
    try {
      const params = { page: 1, pageSize: 100 };
      if (scopeFilter) params.scope = scopeFilter;
      const { data } = await api.get('/discounts', { params });
      setDiscounts(data.items);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load discounts');
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    try {
      const { data } = await api.get('/products', {
        params: { page: 1, pageSize: 200, isActive: 'true' },
      });
      setProducts(data.items);
    } catch {
      // non-fatal
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadDiscounts();
  }, [scopeFilter]);

  function startCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  function startEdit(d) {
    setEditing(d.id);
    setForm({
      name: d.name,
      type: d.type,
      value: String(d.value),
      minPurchaseAmount: d.minPurchaseAmount != null ? String(d.minPurchaseAmount) : '',
      minQuantity: d.minQuantity != null ? String(d.minQuantity) : '',
      validFrom: d.validFrom?.split('T')[0] ?? TODAY,
      validTo: d.validTo?.split('T')[0] ?? '',
      maxUses: d.maxUses != null ? String(d.maxUses) : '',
      scope: d.scope,
      isActive: d.isActive,
      productIds: d.products?.map((dp) => dp.productId) ?? [],
    });
    setFormError('');
  }

  function toggleProduct(id) {
    setForm((prev) => {
      const ids = prev.productIds.includes(id)
        ? prev.productIds.filter((x) => x !== id)
        : [...prev.productIds, id];
      return { ...prev, productIds: ids };
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError('');

    const value = Number(form.value);
    if (form.type === 'PERCENTAGE' && value > 100) {
      setFormError('Percentage discount cannot exceed 100');
      return;
    }
    if (form.scope === 'PRODUCT' && form.productIds.length === 0) {
      setFormError('Select at least one product for a PRODUCT-scope discount');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        value,
        minPurchaseAmount: form.minPurchaseAmount ? Number(form.minPurchaseAmount) : null,
        minQuantity: form.minQuantity ? Number(form.minQuantity) : null,
        validFrom: form.validFrom,
        validTo: form.validTo || null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        scope: form.scope,
        isActive: form.isActive,
        productIds: form.scope === 'PRODUCT' ? form.productIds : [],
      };
      if (editing) {
        await api.patch(`/discounts/${editing}`, payload);
      } else {
        await api.post('/discounts', payload);
      }
      setEditing(null);
      setForm(EMPTY_FORM);
      await loadDiscounts();
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

  async function toggleActive(d) {
    try {
      await api.patch(`/discounts/${d.id}`, { isActive: !d.isActive });
      await loadDiscounts();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update discount');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Discount Rules</h1>
        <Button onClick={startCreate}>+ New discount</Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{editing ? 'Edit discount' : 'Create discount'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-1">
              <Label htmlFor="d-name">Discount name *</Label>
              <Input
                id="d-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Summer Sale"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="d-type">Type *</Label>
              <select
                id="d-type"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 ring-slate-400"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option>PERCENTAGE</option>
                <option>FIXED</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="d-value">
                Value * {form.type === 'PERCENTAGE' ? '(%)' : '(₹)'}
              </Label>
              <Input
                id="d-value"
                type="number"
                min="0"
                max={form.type === 'PERCENTAGE' ? '100' : undefined}
                step="0.01"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                required
                placeholder={form.type === 'PERCENTAGE' ? '10' : '500'}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="d-scope">Scope *</Label>
              <select
                id="d-scope"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 ring-slate-400"
                value={form.scope}
                onChange={(e) => setForm({ ...form, scope: e.target.value, productIds: [] })}
              >
                <option>SUBSCRIPTION</option>
                <option>PRODUCT</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="d-from">Valid from *</Label>
              <Input
                id="d-from"
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="d-to">Valid to</Label>
              <Input
                id="d-to"
                type="date"
                value={form.validTo}
                onChange={(e) => setForm({ ...form, validTo: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="d-minpurch">Min purchase amount</Label>
              <Input
                id="d-minpurch"
                type="number"
                min="0"
                step="0.01"
                value={form.minPurchaseAmount}
                onChange={(e) => setForm({ ...form, minPurchaseAmount: e.target.value })}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="d-minqty">Min quantity</Label>
              <Input
                id="d-minqty"
                type="number"
                min="1"
                step="1"
                value={form.minQuantity}
                onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="d-maxuses">Max uses</Label>
              <Input
                id="d-maxuses"
                type="number"
                min="1"
                step="1"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                placeholder="Unlimited if blank"
                className="max-w-xs"
              />
            </div>

            {/* Product selector — only shown for PRODUCT scope */}
            {form.scope === 'PRODUCT' && products.length > 0 && (
              <div className="space-y-2 sm:col-span-2">
                <Label>Applicable products *</Label>
                <div className="max-h-48 overflow-y-auto rounded-md border border-slate-200 p-3 grid gap-2 sm:grid-cols-2">
                  {products.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.productIds.includes(p.id)}
                        onChange={() => toggleProduct(p.id)}
                        className="rounded"
                      />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                id="d-active"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="d-active">Active</Label>
            </div>

            {formError ? <p className="text-sm text-red-600 sm:col-span-2">{formError}</p> : null}

            <div className="flex gap-3 sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update discount' : 'Create discount'}
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
        <select
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value)}
        >
          <option value="">All scopes</option>
          <option>PRODUCT</option>
          <option>SUBSCRIPTION</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Loading…</p>
          ) : discounts.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No discount rules yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Scope</th>
                  <th className="px-4 py-3">Valid</th>
                  <th className="px-4 py-3">Uses</th>
                  <th className="px-4 py-3">Products</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{d.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          d.type === 'PERCENTAGE'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-orange-50 text-orange-700'
                        }`}
                      >
                        {d.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.type === 'PERCENTAGE'
                        ? `${Number(d.value)}%`
                        : `₹${Number(d.value).toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                        {d.scope}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {d.validFrom?.split('T')[0]}
                      {d.validTo ? ` → ${d.validTo.split('T')[0]}` : ' → ∞'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {d.usesCount}/{d.maxUses ?? '∞'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {d.products?.map((dp) => dp.product?.name).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${d.isActive ? 'text-green-700' : 'text-slate-400'}`}>
                        {d.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          className="text-xs text-blue-600 hover:underline"
                          onClick={() => startEdit(d)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-xs text-slate-500 hover:underline"
                          onClick={() => toggleActive(d)}
                        >
                          {d.isActive ? 'Deactivate' : 'Activate'}
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

