import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Layers, Package, RefreshCw } from 'lucide-react';

function formatCurrency(val) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

export function CustomerCatalogPage() {
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
                className="flex flex-col justify-between border-slate-200 shadow-xs hover:border-slate-300 transition-all"
              >
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
              <Card key={prod.id} className="border-slate-200 shadow-xs">
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
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
