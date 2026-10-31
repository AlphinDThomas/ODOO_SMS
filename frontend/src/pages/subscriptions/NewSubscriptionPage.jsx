import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  Trash2,
  Building2,
  ArrowLeft,
  Sparkles,
  Percent,
  DollarSign,
  Save,
  Send,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function NewSubscriptionPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') || '';

  const basePath = profile?.role === 'ADMIN' ? '/admin' : '/staff';

  // Data sources
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Form states
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [billingInterval, setBillingInterval] = useState('MONTHLY');
  const [paymentTermsDays, setPaymentTermsDays] = useState(15);
  const [quotationValidityDays, setQuotationValidityDays] = useState(30);

  // Item Lines
  const [lines, setLines] = useState([]);
  // Discounts
  const [selectedDiscountIds, setSelectedDiscountIds] = useState([]);

  useEffect(() => {
    async function loadResources() {
      try {
        setLoading(true);
        setError('');
        const [custRes, planRes, tplRes, prodRes, discRes] = await Promise.all([
          api.get('/customers'),
          api.get('/plans'),
          api.get('/templates'),
          api.get('/products'),
          api.get('/discounts'),
        ]);

        const custList = custRes.data.items || [];
        const planList = planRes.data.items || [];
        const tplList = tplRes.data.items || [];
        const prodList = prodRes.data.items || [];
        const discList = discRes.data.items || [];

        setCustomers(custList);
        setPlans(planList);
        setTemplates(tplList);
        setProducts(prodList);
        setDiscounts(discList);

        if (!customerId && custList.length > 0) {
          setCustomerId(custList[0].id);
        }
        if (planList.length > 0) {
          setPlanId(planList[0].id);
          setBillingInterval(planList[0].interval || 'MONTHLY');
        }

        // Initialize 1 default product line
        if (prodList.length > 0) {
          const first = prodList[0];
          const defaultTax =
            first.taxRules?.find((t) => t.taxRule?.isDefault)?.taxRule?.ratePercent || 0;
          setLines([
            {
              productId: first.id,
              variantId: '',
              quantity: 1,
              unitPrice: Number(first.salesPrice) || 0,
              taxRatePercent: Number(defaultTax),
            },
          ]);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to initialize quote builder data');
      } finally {
        setLoading(false);
      }
    }

    loadResources();
  }, []);

  // When a template is selected, auto-populate plan and lines!
  async function handleTemplateSelect(tplId) {
    setSelectedTemplateId(tplId);
    if (!tplId) return;

    try {
      const { data } = await api.get(`/templates/${tplId}`);
      const tpl = data.data;
      if (!tpl) return;

      if (tpl.planId) {
        setPlanId(tpl.planId);
        if (tpl.plan?.interval) {
          setBillingInterval(tpl.plan.interval);
        }
      }
      if (tpl.validityDays) {
        setQuotationValidityDays(tpl.validityDays);
      }

      if (tpl.lines && tpl.lines.length > 0) {
        const loadedLines = tpl.lines.map((tl) => {
          const prod = products.find((p) => p.id === tl.productId);
          const defaultTax =
            prod?.taxRules?.find((t) => t.taxRule?.isDefault)?.taxRule?.ratePercent || 0;
          return {
            productId: tl.productId,
            variantId: tl.variantId || '',
            quantity: tl.quantity,
            unitPrice: Number(tl.unitPrice),
            taxRatePercent: Number(defaultTax),
          };
        });
        setLines(loadedLines);
      }
    } catch (err) {
      console.error('Failed to import template:', err);
    }
  }

  function handlePlanSelect(pId) {
    setPlanId(pId);
    const plan = plans.find((p) => p.id === pId);
    if (plan?.interval) {
      setBillingInterval(plan.interval);
    }
  }

  function addLine() {
    if (products.length === 0) return;
    const first = products[0];
    const defaultTax =
      first.taxRules?.find((t) => t.taxRule?.isDefault)?.taxRule?.ratePercent || 0;
    setLines([
      ...lines,
      {
        productId: first.id,
        variantId: '',
        quantity: 1,
        unitPrice: Number(first.salesPrice) || 0,
        taxRatePercent: Number(defaultTax),
      },
    ]);
  }

  function removeLine(index) {
    if (lines.length <= 1) {
      setError('Subscription must have at least one product line');
      return;
    }
    setLines(lines.filter((_, idx) => idx !== index));
  }

  function handleProductChange(index, productId) {
    const prod = products.find((p) => p.id === productId);
    const defaultTax =
      prod?.taxRules?.find((t) => t.taxRule?.isDefault)?.taxRule?.ratePercent || 0;
    const updated = [...lines];
    updated[index] = {
      ...updated[index],
      productId,
      variantId: '',
      unitPrice: prod ? Number(prod.salesPrice) : 0,
      taxRatePercent: Number(defaultTax),
    };
    setLines(updated);
  }

  function handleVariantChange(index, variantId) {
    const line = lines[index];
    const prod = products.find((p) => p.id === line.productId);
    let basePrice = prod ? Number(prod.salesPrice) : 0;
    if (variantId && prod?.variants) {
      const variant = prod.variants.find((v) => v.id === variantId);
      if (variant) {
        basePrice += Number(variant.priceAdjustment || 0);
      }
    }
    const updated = [...lines];
    updated[index] = {
      ...updated[index],
      variantId,
      unitPrice: basePrice,
    };
    setLines(updated);
  }

  function handleLineField(index, field, value) {
    const updated = [...lines];
    updated[index] = {
      ...updated[index],
      [field]: field === 'quantity' ? Math.max(1, parseInt(value, 10) || 1) : Math.max(0, parseFloat(value) || 0),
    };
    setLines(updated);
  }

  function toggleDiscount(discountId) {
    if (selectedDiscountIds.includes(discountId)) {
      setSelectedDiscountIds(selectedDiscountIds.filter((id) => id !== discountId));
    } else {
      setSelectedDiscountIds([...selectedDiscountIds, discountId]);
    }
  }

  // Financial Calculations
  const subtotal = lines.reduce(
    (sum, l) => sum + (l.quantity || 1) * (l.unitPrice || 0),
    0,
  );
  const taxTotal = lines.reduce(
    (sum, l) => sum + (l.quantity || 1) * (l.unitPrice || 0) * ((l.taxRatePercent || 0) / 100),
    0,
  );
  const grandTotal = subtotal + taxTotal;

  async function handleSubmit(shouldSubmitQuote = false) {
    if (!customerId) {
      setError('Please select a customer');
      return;
    }
    if (!planId) {
      setError('Please select a subscription plan');
      return;
    }
    if (lines.length === 0) {
      setError('Please add at least one line item');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        customerId,
        planId,
        templateId: selectedTemplateId || undefined,
        startDate,
        expiryDate,
        billingInterval,
        paymentTermsDays: parseInt(paymentTermsDays, 10),
        quotationValidityDays: parseInt(quotationValidityDays, 10),
        lines: lines.map((l, idx) => ({
          productId: l.productId,
          variantId: l.variantId || null,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRatePercent: l.taxRatePercent || 0,
          sortOrder: idx,
        })),
        discountIds: selectedDiscountIds,
      };

      const { data } = await api.post('/subscriptions', payload);
      const newSub = data.data;

      // If user clicked "Save & Submit Quotation", trigger submit-quote immediately
      if (shouldSubmitQuote && newSub?.id) {
        await api.post(`/subscriptions/${newSub.id}/submit-quote`);
      }

      navigate(`${basePath}/subscriptions/${newSub.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create subscription');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <Sparkles className="size-6 animate-spin mx-auto mb-2 text-slate-400" />
        Loading Quote Builder...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Back & Header */}
      <div className="flex items-center justify-between">
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              New Subscription / Quote Builder
            </h1>
            <p className="text-sm text-slate-500">
              Generate a custom quotation or start directly from a reusable quotation template.
            </p>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-md bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* STEP 1: TEMPLATE SELECTOR (OPTIONAL FAST-START) */}
      <Card className="bg-gradient-to-r from-blue-50/50 via-indigo-50/20 to-white border-blue-200">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-600 text-white shadow-sm">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Start from Quotation Template</p>
              <p className="text-xs text-slate-500">
                Instantly populate plan, validity terms, and standard product line items.
              </p>
            </div>
          </div>
          <div className="w-full sm:w-72">
            <Select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="bg-white"
            >
              <option value="">Manual / Custom Quote</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.plan?.name})
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* MAIN BUILDER FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Customer, Plan, & Dates (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Plan Details */}
          <Card>
            <CardHeader className="border-b border-slate-100 py-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="size-4 text-slate-400" />
                Customer & Subscription Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="custSelect">Customer Account *</Label>
                <Select
                  id="custSelect"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select client account
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.billingEmail})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="planSelect">Subscription Plan *</Label>
                <Select
                  id="planSelect"
                  value={planId}
                  onChange={(e) => handlePlanSelect(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select subscription plan
                  </option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.interval}) – Base price: ${Number(p.amount).toFixed(2)}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="intervalSelect">Billing Interval</Label>
                <Select
                  id="intervalSelect"
                  value={billingInterval}
                  onChange={(e) => setBillingInterval(e.target.value)}
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="paymentTerms">Payment Terms (Days)</Label>
                <Input
                  id="paymentTerms"
                  type="number"
                  min="0"
                  value={paymentTermsDays}
                  onChange={(e) => setPaymentTermsDays(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quoteValidity">Quotation Validity Window (Days)</Label>
                <Input
                  id="quoteValidity"
                  type="number"
                  min="1"
                  value={quotationValidityDays}
                  onChange={(e) => setQuotationValidityDays(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Itemized Lines Builder */}
          <Card>
            <CardHeader className="border-b border-slate-100 py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="size-4 text-slate-400" />
                Itemized Subscription Lines
              </CardTitle>
              <Button type="button" size="sm" variant="outline" onClick={addLine}>
                <Plus className="size-3.5 mr-1" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {lines.map((line, idx) => {
                const prod = products.find((p) => p.id === line.productId);
                const hasVariants = prod?.variants && prod.variants.length > 0;

                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    {/* Product */}
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

                    {/* Variant */}
                    {hasVariants && (
                      <div className="w-full sm:w-40">
                        <Label className="text-[11px] text-slate-500 sm:hidden">Variant</Label>
                        <Select
                          value={line.variantId || ''}
                          onChange={(e) => handleVariantChange(idx, e.target.value)}
                        >
                          <option value="">Standard</option>
                          {prod.variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name} (+${Number(v.priceAdjustment).toFixed(2)})
                            </option>
                          ))}
                        </Select>
                      </div>
                    )}

                    {/* Qty */}
                    <div className="w-20">
                      <Label className="text-[11px] text-slate-500 sm:hidden">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => handleLineField(idx, 'quantity', e.target.value)}
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="w-28">
                      <Label className="text-[11px] text-slate-500 sm:hidden">Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.unitPrice}
                        onChange={(e) => handleLineField(idx, 'unitPrice', e.target.value)}
                      />
                    </div>

                    {/* Tax % */}
                    <div className="w-20">
                      <Label className="text-[11px] text-slate-500 sm:hidden">Tax %</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={line.taxRatePercent}
                        onChange={(e) => handleLineField(idx, 'taxRatePercent', e.target.value)}
                      />
                    </div>

                    {/* Subtotal */}
                    <div className="w-24 text-right font-semibold text-slate-800 text-sm py-2">
                      ${(line.quantity * line.unitPrice).toFixed(2)}
                    </div>

                    {/* Delete line */}
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
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Discounts & Financial Summary (1 Col) */}
        <div className="space-y-6">
          {/* Discount Rules */}
          {discounts.length > 0 && (
            <Card>
              <CardHeader className="border-b border-slate-100 py-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Percent className="size-4 text-slate-400" />
                  Available Discounts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {discounts.map((disc) => (
                  <label
                    key={disc.id}
                    className="flex items-center gap-2.5 p-2 rounded-md hover:bg-slate-50 cursor-pointer text-xs border border-slate-100"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDiscountIds.includes(disc.id)}
                      onChange={() => toggleDiscount(disc.id)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{disc.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {disc.type === 'PERCENTAGE'
                          ? `${Number(disc.value)}% off`
                          : `$${Number(disc.value).toFixed(2)} flat discount`}
                        {' • '}
                        {disc.scope}
                      </p>
                    </div>
                  </label>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Pricing Summary */}
          <Card className="border-slate-300 shadow-sm">
            <CardHeader className="border-b border-slate-100 py-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="size-4 text-emerald-600" />
                Pricing Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Lines Subtotal:</span>
                <span className="font-medium text-slate-800">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Estimated Taxes:</span>
                <span className="font-medium text-slate-800">${taxTotal.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Total per {billingInterval}:</span>
                <span className="text-xl font-extrabold text-slate-900">${grandTotal.toFixed(2)}</span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4">
                <Button
                  className="w-full bg-slate-900 text-white hover:bg-slate-800"
                  onClick={() => handleSubmit(false)}
                  disabled={saving}
                >
                  <Save className="size-4 mr-2" />
                  {saving ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                  onClick={() => handleSubmit(true)}
                  disabled={saving}
                >
                  <Send className="size-4 mr-2" />
                  Save & Submit Quotation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
