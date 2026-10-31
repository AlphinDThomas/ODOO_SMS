import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PRODUCT_TYPES = ['SOFTWARE', 'ADDON', 'OTHER'];

const EMPTY_FORM = {
  name: '',
  type: 'SOFTWARE',
  salesPrice: '',
  costPrice: '',
  notes: '',
  isActive: true,
  taxRuleIds: [],
};

export function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null); // product id
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Variants sub-panel
  const [variantPanel, setVariantPanel] = useState(null); // product id
  const [variants, setVariants] = useState([]);
  const [variantForm, setVariantForm] = useState({ name: '', priceAdjustment: '' });
  const [variantError, setVariantError] = useState('');
  const [savingVariant, setSavingVariant] = useState(false);

  async function loadProducts() {
    setLoading(true);
    try {
      const params = { page: 1, pageSize: 100 };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      const { data } = await api.get('/products', { params });
      setProducts(data.items);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load products');
    } finally {
      setLoading(false);
    }
  }

  async function loadTaxes() {
    try {
      const { data } = await api.get('/taxes', { params: { isActive: 'true' } });
      setTaxes(data);
    } catch {
      // non-fatal
    }
  }

  useEffect(() => {
    loadTaxes();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [search, typeFilter]);

  function startCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  function startEdit(product) {
    setEditing(product.id);
    setForm({
      name: product.name,
      type: product.type,
      salesPrice: String(product.salesPrice),
      costPrice: String(product.costPrice),
      notes: product.notes || '',
      isActive: product.isActive,
      taxRuleIds: product.taxRules?.map((ptr) => ptr.taxRuleId) ?? [],
    });
    setFormError('');
  }

  function toggleTaxRule(id) {
    setForm((prev) => {
      const ids = prev.taxRuleIds.includes(id)
        ? prev.taxRuleIds.filter((x) => x !== id)
        : [...prev.taxRuleIds, id];
      return { ...prev, taxRuleIds: ids };
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        salesPrice: Number(form.salesPrice),
        costPrice: Number(form.costPrice),
        notes: form.notes || null,
        isActive: form.isActive,
        taxRuleIds: form.taxRuleIds,
      };
      if (editing) {
        await api.patch(`/products/${editing}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setEditing(null);
      setForm(EMPTY_FORM);
      await loadProducts();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(product) {
    try {
      await api.patch(`/products/${product.id}`, { isActive: !product.isActive });
      await loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update product');
    }
  }

  // Variants
  async function openVariants(product) {
    setVariantPanel(product.id);
    setVariantForm({ name: '', priceAdjustment: '' });
    setVariantError('');
    try {
      const { data } = await api.get(`/products/${product.id}/variants`);
      setVariants(data);
    } catch {
      setVariants([]);
    }
  }

  async function addVariant(e) {
    e.preventDefault();
    setVariantError('');
    setSavingVariant(true);
    try {
      await api.post(`/products/${variantPanel}/variants`, {
        name: variantForm.name,
        priceAdjustment: Number(variantForm.priceAdjustment),
      });
      const { data } = await api.get(`/products/${variantPanel}/variants`);
      setVariants(data);
      setVariantForm({ name: '', priceAdjustment: '' });
    } catch (err) {
      setVariantError(err.response?.data?.error || 'Could not add variant');
    } finally {
      setSavingVariant(false);
    }
  }

  async function toggleVariant(variant) {
    try {
      await api.patch(`/products/${variantPanel}/variants/${variant.id}`, {
        isActive: !variant.isActive,
      });
      const { data } = await api.get(`/products/${variantPanel}/variants`);
      setVariants(data);
    } catch (err) {
      setVariantError(err.response?.data?.error || 'Could not update variant');
    }
  }

  const isFormMode = editing !== null || form.name !== '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <Button onClick={startCreate}>+ New product</Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{editing ? 'Edit product' : 'Create product'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-1">
              <Label htmlFor="p-name">Name *</Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Odoo ERP"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="p-type">Type *</Label>
              <select
                id="p-type"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 ring-slate-400"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {PRODUCT_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="p-sales">Sales price *</Label>
              <Input
                id="p-sales"
                type="number"
                min="0"
                step="0.01"
                value={form.salesPrice}
                onChange={(e) => setForm({ ...form, salesPrice: e.target.value })}
                required
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="p-cost">Cost price *</Label>
              <Input
                id="p-cost"
                type="number"
                min="0"
                step="0.01"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                required
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="p-notes">Notes</Label>
              <textarea
                id="p-notes"
                className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 ring-slate-400"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional product description"
              />
            </div>

            {taxes.length > 0 && (
              <div className="space-y-2 sm:col-span-2">
                <Label>Tax rules</Label>
                <div className="flex flex-wrap gap-3">
                  {taxes.map((tax) => (
                    <label key={tax.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.taxRuleIds.includes(tax.id)}
                        onChange={() => toggleTaxRule(tax.id)}
                        className="rounded"
                      />
                      {tax.name} ({Number(tax.ratePercent)}%)
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                id="p-active"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="p-active">Active</Label>
            </div>

            {formError ? <p className="text-sm text-red-600 sm:col-span-2">{formError}</p> : null}

            <div className="flex gap-3 sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update product' : 'Create product'}
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
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All types</option>
          {PRODUCT_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Loading…</p>
          ) : products.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No products found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Sales price</th>
                  <th className="px-4 py-3">Cost price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Taxes</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {p.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">₹{Number(p.salesPrice).toFixed(2)}</td>
                    <td className="px-4 py-3">₹{Number(p.costPrice).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${p.isActive ? 'text-green-700' : 'text-slate-400'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {p.taxRules?.map((ptr) => ptr.taxRule?.name).join(', ') || '—'}
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
                        <button
                          className="text-xs text-purple-600 hover:underline"
                          onClick={() => openVariants(p)}
                        >
                          Variants
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

      {/* Variants panel */}
      {variantPanel && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Variants — {products.find((p) => p.id === variantPanel)?.name}
              </CardTitle>
              <button
                className="text-sm text-slate-500 hover:text-slate-800"
                onClick={() => setVariantPanel(null)}
              >
                ✕ Close
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form className="flex flex-wrap gap-3 mb-4" onSubmit={addVariant}>
              <div className="space-y-1">
                <Label htmlFor="v-name">Variant name *</Label>
                <Input
                  id="v-name"
                  value={variantForm.name}
                  onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                  required
                  placeholder="e.g. Enterprise"
                  className="w-48"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="v-adj">Price adjustment *</Label>
                <Input
                  id="v-adj"
                  type="number"
                  step="0.01"
                  value={variantForm.priceAdjustment}
                  onChange={(e) => setVariantForm({ ...variantForm, priceAdjustment: e.target.value })}
                  required
                  placeholder="0.00"
                  className="w-36"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" size="sm" disabled={savingVariant}>
                  {savingVariant ? 'Adding…' : 'Add variant'}
                </Button>
              </div>
              {variantError ? <p className="text-sm text-red-600 w-full">{variantError}</p> : null}
            </form>

            {variants.length === 0 ? (
              <p className="text-sm text-slate-400">No variants yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Price adjustment</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-2">{v.name}</td>
                      <td className="px-3 py-2">₹{Number(v.priceAdjustment).toFixed(2)}</td>
                      <td className="px-3 py-2 text-xs">
                        <span className={v.isActive ? 'text-green-700' : 'text-slate-400'}>
                          {v.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          className="text-xs text-slate-500 hover:underline"
                          onClick={() => toggleVariant(v)}
                        >
                          {v.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

