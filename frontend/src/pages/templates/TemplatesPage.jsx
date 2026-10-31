import { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Calendar,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPlanId, setFormPlanId] = useState('');
  const [formValidityDays, setFormValidityDays] = useState(30);
  const [formLines, setFormLines] = useState([]);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const [tplRes, planRes, prodRes] = await Promise.all([
        api.get('/templates'),
        api.get('/plans'),
        api.get('/products'),
      ]);
      setTemplates(tplRes.data.items || []);
      setPlans(planRes.data.items || []);
      setProducts(prodRes.data.items || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load templates or catalog data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreateModal() {
    setFormName('');
    setFormPlanId(plans[0]?.id || '');
    setFormValidityDays(30);

    // Initial empty line if products available
    if (products.length > 0) {
      const firstProd = products[0];
      setFormLines([
        {
          productId: firstProd.id,
          variantId: '',
          quantity: 1,
          unitPrice: Number(firstProd.salesPrice) || 0,
        },
      ]);
    } else {
      setFormLines([]);
    }

    setError('');
    setIsCreateOpen(true);
  }

  function addLine() {
    if (products.length === 0) return;
    const firstProd = products[0];
    setFormLines([
      ...formLines,
      {
        productId: firstProd.id,
        variantId: '',
        quantity: 1,
        unitPrice: Number(firstProd.salesPrice) || 0,
      },
    ]);
  }

  function removeLine(index) {
    if (formLines.length <= 1) {
      setError('A quotation template must have at least one product line');
      return;
    }
    const updated = formLines.filter((_, idx) => idx !== index);
    setFormLines(updated);
  }

  function handleProductChange(index, productId) {
    const prod = products.find((p) => p.id === productId);
    const updated = [...formLines];
    updated[index] = {
      ...updated[index],
      productId,
      variantId: '',
      unitPrice: prod ? Number(prod.salesPrice) : 0,
    };
    setFormLines(updated);
  }

  function handleVariantChange(index, variantId) {
    const line = formLines[index];
    const prod = products.find((p) => p.id === line.productId);
    let basePrice = prod ? Number(prod.salesPrice) : 0;
    if (variantId && prod?.variants) {
      const variant = prod.variants.find((v) => v.id === variantId);
      if (variant) {
        basePrice += Number(variant.priceAdjustment || 0);
      }
    }
    const updated = [...formLines];
    updated[index] = {
      ...updated[index],
      variantId,
      unitPrice: basePrice,
    };
    setFormLines(updated);
  }

  function handleQuantityChange(index, quantity) {
    const updated = [...formLines];
    updated[index] = {
      ...updated[index],
      quantity: Math.max(1, parseInt(quantity, 10) || 1),
    };
    setFormLines(updated);
  }

  function handleUnitPriceChange(index, unitPrice) {
    const updated = [...formLines];
    updated[index] = {
      ...updated[index],
      unitPrice: Math.max(0, parseFloat(unitPrice) || 0),
    };
    setFormLines(updated);
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    if (!formPlanId) {
      setError('Please select a subscription plan');
      return;
    }
    if (formLines.length === 0) {
      setError('Please add at least one product line');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await api.post('/templates', {
        name: formName,
        planId: formPlanId,
        validityDays: parseInt(formValidityDays, 10),
        lines: formLines.map((l, idx) => ({
          productId: l.productId,
          variantId: l.variantId || null,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          sortOrder: idx,
        })),
      });

      setIsCreateOpen(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create quotation template');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this quotation template?')) return;
    try {
      await api.delete(`/templates/${id}`);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete template');
    }
  }

  async function viewTemplate(tpl) {
    try {
      const { data } = await api.get(`/templates/${tpl.id}`);
      setSelectedTemplate(data.data || tpl);
      setIsViewOpen(true);
    } catch {
      setSelectedTemplate(tpl);
      setIsViewOpen(true);
    }
  }

  // Calculate live total for form
  const formSubtotal = formLines.reduce(
    (sum, l) => sum + (l.quantity || 1) * (l.unitPrice || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quotation Templates</h1>
          <p className="text-sm text-slate-500 mt-1">
            Build standardized quotation packages with pre-configured products, plans, and validity rules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => loadData()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="size-4" />
            New Template
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-md bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Templates List */}
      <Card>
        <CardHeader className="border-b border-slate-100 py-4">
          <CardTitle className="text-base font-semibold">Available Templates ({templates.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-slate-400" />
              Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <FileText className="size-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-700">No quotation templates configured</p>
              <p className="text-xs text-slate-400 mt-1">
                Templates allow sales reps to issue standardized quotes and subscriptions in seconds.
              </p>
              <Button size="sm" className="mt-4" onClick={openCreateModal}>
                <Plus className="size-4 mr-1" />
                Create First Template
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">Template Name</th>
                    <th className="px-6 py-3 font-medium">Assigned Plan</th>
                    <th className="px-6 py-3 font-medium text-center">Validity Window</th>
                    <th className="px-6 py-3 font-medium text-center">Items</th>
                    <th className="px-6 py-3 font-medium text-center">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {templates.map((tpl) => (
                    <tr key={tpl.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-slate-400" />
                          <span>{tpl.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <span className="font-medium text-slate-800">{tpl.plan?.name}</span>
                        <span className="text-xs text-slate-400 block">
                          Billing: {tpl.plan?.interval}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-xs">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                          <Calendar className="size-3.5 text-slate-400" />
                          {tpl.validityDays} days
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                          {tpl.lines?.length || tpl._count?.lines || 0} lines
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {tpl.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Archived</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-slate-600"
                            onClick={() => viewTemplate(tpl)}
                            title="View Template Details"
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => handleDelete(tpl.id)}
                            title="Delete Template"
                          >
                            <Trash2 className="size-4" />
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

      {/* CREATE TEMPLATE MODAL */}
      <Dialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Quotation Template"
        description="Configure a reusable quotation package with products, variant options, and validity terms."
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="tplName">Template Package Name *</Label>
              <Input
                id="tplName"
                placeholder="e.g. Standard Cloud ERP Suite"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tplValidity">Quote Validity (Days) *</Label>
              <Input
                id="tplValidity"
                type="number"
                min="1"
                max="365"
                value={formValidityDays}
                onChange={(e) => setFormValidityDays(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-3">
              <Label htmlFor="tplPlan">Subscription Plan Association *</Label>
              <Select
                id="tplPlan"
                value={formPlanId}
                onChange={(e) => setFormPlanId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select a subscription plan
                </option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.interval}) – Base: ${Number(p.amount).toFixed(2)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* ITEM LINES BUILDER */}
          <div className="space-y-3 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Package Line Items</h3>
                <p className="text-xs text-slate-500">Products and default quantities included in this template</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addLine}>
                <Plus className="size-3.5 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {formLines.map((line, idx) => {
                const prod = products.find((p) => p.id === line.productId);
                const hasVariants = prod?.variants && prod.variants.length > 0;

                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    {/* Product Selector */}
                    <div className="flex-1 w-full sm:w-auto">
                      <Label className="text-[11px] text-slate-500 sm:hidden">Product</Label>
                      <Select
                        value={line.productId}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (${Number(p.salesPrice).toFixed(2)})
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* Variant Selector */}
                    {hasVariants && (
                      <div className="w-full sm:w-44">
                        <Label className="text-[11px] text-slate-500 sm:hidden">Variant</Label>
                        <Select
                          value={line.variantId || ''}
                          onChange={(e) => handleVariantChange(idx, e.target.value)}
                        >
                          <option value="">Default (No Variant)</option>
                          {prod.variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name} (+${Number(v.priceAdjustment).toFixed(2)})
                            </option>
                          ))}
                        </Select>
                      </div>
                    )}

                    {/* Quantity */}
                    <div className="w-24">
                      <Label className="text-[11px] text-slate-500 sm:hidden">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={line.quantity}
                        onChange={(e) => handleQuantityChange(idx, e.target.value)}
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="w-32">
                      <Label className="text-[11px] text-slate-500 sm:hidden">Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Price"
                        value={line.unitPrice}
                        onChange={(e) => handleUnitPriceChange(idx, e.target.value)}
                      />
                    </div>

                    {/* Subtotal */}
                    <div className="w-24 text-right font-semibold text-slate-800 text-sm py-2">
                      ${(line.quantity * line.unitPrice).toFixed(2)}
                    </div>

                    {/* Remove button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLine(idx)}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-9 w-9 p-0"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Total Preview */}
            <div className="flex justify-end items-center gap-4 py-2 px-3 bg-slate-100 rounded-md font-medium text-sm text-slate-700">
              <span>Estimated Package Subtotal:</span>
              <span className="text-base font-bold text-slate-900">${formSubtotal.toFixed(2)}</span>
            </div>
          </div>

          {error && <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded">{error}</p>}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* VIEW TEMPLATE DETAILS MODAL */}
      <Dialog
        open={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={selectedTemplate?.name || 'Template Details'}
        description="Configured line items, plan terms, and validity rules."
        maxWidth="max-w-2xl"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-medium uppercase">Plan</p>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedTemplate.plan?.name}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium uppercase">Interval</p>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedTemplate.plan?.interval}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium uppercase">Validity Window</p>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedTemplate.validityDays} days</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Itemized Products</h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-xs">
                {selectedTemplate.lines?.map((line) => (
                  <div key={line.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{line.product?.name}</p>
                      {line.variant && (
                        <p className="text-slate-500 text-[11px]">Variant: {line.variant.name}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-slate-700">
                        {line.quantity} × ${Number(line.unitPrice).toFixed(2)}
                      </p>
                      <p className="font-bold text-slate-900">
                        ${(line.quantity * Number(line.unitPrice)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
