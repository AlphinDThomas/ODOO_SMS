import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Check,
  CheckCircle2,
  Clock,
  Layers,
  Package,
  RefreshCw,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';

function formatCurrency(val) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

export function CustomerCatalogPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Subscription Checkout Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submittingMode, setSubmittingMode] = useState(null); // 'quote' | 'activate'
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      setError('');
      try {
        const [plansRes, productsRes] = await Promise.all([
          api.get('/plans', { params: { pageSize: 100 } }),
          api.get('/products', { params: { pageSize: 100 } }),
        ]);

        const planItems = plansRes.data?.items || plansRes.data || [];
        const productItems = productsRes.data?.items || productsRes.data || [];

        setPlans(planItems.filter((p) => p.isActive !== false));
        setProducts(productItems.filter((p) => p.isActive !== false));
      } catch (err) {
        console.error('Failed to load catalog:', err);
        setError('Could not load products and plans catalog.');
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, []);

  function handleOpenSubscribe(plan, preSelectedProdId = null) {
    setSelectedPlan(plan);
    const defaultProduct = preSelectedProdId
      ? products.find((p) => p.id === preSelectedProdId) || products[0]
      : products[0];

    setSelectedProductId(defaultProduct ? defaultProduct.id : '');
    setSelectedVariantId(
      defaultProduct?.variants && defaultProduct.variants.length > 0
        ? defaultProduct.variants[0].id
        : '',
    );
    setQuantity(plan.minQuantity ?? 1);
    setModalError('');
    setModalOpen(true);
  }

  function handleProductChange(prodId) {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod && prod.variants && prod.variants.length > 0) {
      setSelectedVariantId(prod.variants[0].id);
    } else {
      setSelectedVariantId('');
    }
  }

  // Calculate prices
  const currentProduct = products.find((p) => p.id === selectedProductId);
  const currentVariant = currentProduct?.variants?.find((v) => v.id === selectedVariantId);

  const basePrice = currentProduct ? Number(currentProduct.salesPrice) : Number(selectedPlan?.amount || 0);
  const variantAdj = currentVariant ? Number(currentVariant.priceAdjustment) : 0;
  const unitPrice = Math.max(0, basePrice + variantAdj);
  const totalAmount = unitPrice * (Number(quantity) || 1);

  async function handleCompleteOrder(mode) {
    if (!selectedPlan) return;
    const minQty = selectedPlan.minQuantity ?? 1;
    if (Number(quantity) < minQty) {
      setModalError(`Quantity must be at least ${minQty} for this plan.`);
      return;
    }

    setSubmittingMode(mode);
    setModalError('');

    try {
      // 1. Create subscription request / quotation
      const payload = {
        planId: selectedPlan.id,
      };

      if (currentProduct) {
        payload.lines = [
          {
            productId: currentProduct.id,
            variantId: currentVariant ? currentVariant.id : undefined,
            quantity: Number(quantity),
            unitPrice: unitPrice,
          },
        ];
      }

      const res = await api.post('/subscriptions', payload);
      const sub = res.data?.data || res.data;

      if (mode === 'activate' && sub?.id) {
        // Customer chose instant checkout: accept quote and activate
        await api.post(`/portal/quotations/${sub.id}/accept`);
        await api.post(`/subscriptions/${sub.id}/activate`).catch(() => {
          // In case auto-activation is triggered on confirmation
        });
      }

      setModalOpen(false);
      navigate('/customer/subscriptions');
    } catch (err) {
      console.error('Subscription order failed:', err);
      setModalError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Failed to complete subscription request. Please try again.',
      );
    } finally {
      setSubmittingMode(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-3">
        <RefreshCw className="size-8 animate-spin text-slate-400" />
        <p className="text-sm font-medium text-slate-500">Loading Products & Plans…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Products & Subscription Plans
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Browse our available software subscription tiers, modules, and platform addons.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {actionSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* SECTION 1: Subscription Plans */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="size-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Subscription Plans</h2>
        </div>

        {plans.length === 0 ? (
          <p className="text-sm text-slate-500">No subscription plans available at this time.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className="flex flex-col justify-between border-slate-200 shadow-xs hover:border-slate-300 transition-all hover:shadow-sm"
              >
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg font-bold text-slate-900">{plan.name}</CardTitle>
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
                        {plan.interval}
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900">
                        {formatCurrency(plan.amount)}
                      </span>
                      <span className="text-xs text-slate-500">/{plan.interval?.toLowerCase()}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2 text-xs text-slate-600">
                    <div className="space-y-1.5 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Check className="size-4 text-emerald-600 shrink-0" />
                        <span>Minimum quantity: {plan.minQuantity ?? 1}</span>
                      </div>
                      {plan.allowRenewal && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Check className="size-4 text-emerald-600 shrink-0" />
                          <span>Automatic renewals supported</span>
                        </div>
                      )}
                      {plan.allowPause && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Check className="size-4 text-emerald-600 shrink-0" />
                          <span>Temporary subscription pauses allowed</span>
                        </div>
                      )}
                      {plan.allowEarlyClose && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Check className="size-4 text-emerald-600 shrink-0" />
                          <span>Flexible early closure policy</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </div>

                {/* Card Action */}
                <div className="p-5 pt-0">
                  <Button
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 flex items-center justify-center gap-1.5"
                    onClick={() => handleOpenSubscribe(plan)}
                  >
                    <ShoppingCart className="size-3.5" />
                    Subscribe to {plan.name}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2: Products & Addons */}
      <section className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <Package className="size-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Software Products & Addons</h2>
        </div>

        {products.length === 0 ? (
          <p className="text-sm text-slate-500">No software products catalogued yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((prod) => (
              <Card key={prod.id} className="border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-bold text-slate-900">{prod.name}</CardTitle>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {prod.type}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      {formatCurrency(prod.salesPrice)}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-slate-500">
                    {prod.notes && <p className="italic">{prod.notes}</p>}
                    {prod.variants && prod.variants.length > 0 && (
                      <div className="mt-3 border-t border-slate-100 pt-2">
                        <p className="font-semibold text-slate-700 mb-1">Available Editions:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {prod.variants.map((v) => (
                            <span
                              key={v.id}
                              className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700"
                            >
                              {v.name} ({Number(v.priceAdjustment) >= 0 ? `+${formatCurrency(v.priceAdjustment)}` : formatCurrency(v.priceAdjustment)})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </div>

                {plans.length > 0 && (
                  <div className="p-4 pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs text-indigo-700 hover:bg-indigo-50 border-indigo-200 font-medium"
                      onClick={() => handleOpenSubscribe(plans[0], prod.id)}
                    >
                      Subscribe to this Software
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Subscription Checkout Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedPlan ? `Subscribe to ${selectedPlan.name}` : 'Subscribe'}
        description={`Set up your subscription with ${selectedPlan?.interval?.toLowerCase()} recurring billing.`}
        maxWidth="max-w-xl"
      >
        <div className="space-y-5">
          {modalError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
              <ShieldAlert className="size-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          {/* Selected Plan Overview */}
          <div className="rounded-lg bg-indigo-50/60 p-4 border border-indigo-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                Plan Tier
              </p>
              <p className="text-base font-bold text-slate-900">{selectedPlan?.name}</p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600">
                <span className="font-medium text-indigo-700 capitalize">
                  {selectedPlan?.interval} billing
                </span>
                <span>•</span>
                <span>Min Qty: {selectedPlan?.minQuantity ?? 1}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-indigo-900">
                {formatCurrency(selectedPlan?.amount)}
              </p>
              <p className="text-[11px] text-slate-500">base plan rate</p>
            </div>
          </div>

          {/* Product & Variant Selector */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="product-select" className="text-xs font-semibold text-slate-700">
                Select Software / Core Product
              </Label>
              <select
                id="product-select"
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatCurrency(p.salesPrice)} — {p.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Edition / Variant Selector if applicable */}
            {currentProduct?.variants && currentProduct.variants.length > 0 && (
              <div>
                <Label htmlFor="variant-select" className="text-xs font-semibold text-slate-700">
                  Select Edition / Variant
                </Label>
                <select
                  id="variant-select"
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {currentProduct.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({Number(v.priceAdjustment) >= 0 ? `+${formatCurrency(v.priceAdjustment)}` : formatCurrency(v.priceAdjustment)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quantity */}
            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="quantity-input" className="text-xs font-semibold text-slate-700">
                  Subscription User Seats / Quantity
                </Label>
                <span className="text-[11px] text-slate-500">
                  Minimum required: {selectedPlan?.minQuantity ?? 1}
                </span>
              </div>
              <Input
                id="quantity-input"
                type="number"
                min={selectedPlan?.minQuantity ?? 1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Policy Compliance Flags */}
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-xs text-slate-600">
            <p className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
              Terms & Policy Governance
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5">
                <Check className={`size-3.5 ${selectedPlan?.allowPause ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{selectedPlan?.allowPause ? 'Pausing permitted' : 'No pausing allowed'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className={`size-3.5 ${selectedPlan?.allowEarlyClose ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{selectedPlan?.allowEarlyClose ? 'Early cancellation allowed' : 'Fixed term commitment'}</span>
              </div>
            </div>
          </div>

          {/* Pricing Breakdown Card */}
          <div className="rounded-lg bg-slate-900 p-4 text-white space-y-2">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Unit Price (Product + Edition)</span>
              <span>{formatCurrency(unitPrice)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-300">
              <span>Quantity</span>
              <span>× {quantity || 1}</span>
            </div>
            <div className="border-t border-slate-800 pt-2 flex justify-between items-baseline">
              <span className="font-bold text-sm">Recurring Total</span>
              <div className="text-right">
                <span className="text-xl font-extrabold text-white">
                  {formatCurrency(totalAmount)}
                </span>
                <span className="text-xs text-slate-400 font-normal">
                  /{selectedPlan?.interval?.toLowerCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="text-xs font-medium"
              disabled={submittingMode !== null}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCompleteOrder('quote')}
              disabled={submittingMode !== null}
              className="flex-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {submittingMode === 'quote' ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin mr-1.5" />
                  Requesting Quote…
                </>
              ) : (
                'Request Official Quotation'
              )}
            </Button>
            <Button
              onClick={() => handleCompleteOrder('activate')}
              disabled={submittingMode !== null}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
            >
              {submittingMode === 'activate' ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin mr-1.5" />
                  Activating…
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5 mr-1.5" />
                  Subscribe & Activate
                </>
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}