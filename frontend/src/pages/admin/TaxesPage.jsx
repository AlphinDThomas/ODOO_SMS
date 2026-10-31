import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const EMPTY_FORM = {
  name: '',
  ratePercent: '',
  isDefault: false,
  isActive: true,
};

export function TaxesPage() {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function loadTaxes() {
    setLoading(true);
    try {
      const { data } = await api.get('/taxes');
      setTaxes(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load taxes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTaxes();
  }, []);

  function startCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  function startEdit(tax) {
    setEditing(tax.id);
    setForm({
      name: tax.name,
      ratePercent: String(tax.ratePercent),
      isDefault: tax.isDefault,
      isActive: tax.isActive,
    });
    setFormError('');
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError('');
    const rate = Number(form.ratePercent);
    if (rate < 0 || rate > 100) {
      setFormError('Tax rate must be between 0 and 100');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        ratePercent: rate,
        isDefault: form.isDefault,
        isActive: form.isActive,
      };
      if (editing) {
        await api.patch(`/taxes/${editing}`, payload);
      } else {
        await api.post('/taxes', payload);
      }
      setEditing(null);
      setForm(EMPTY_FORM);
      await loadTaxes();
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

  async function toggleActive(tax) {
    try {
      await api.patch(`/taxes/${tax.id}`, { isActive: !tax.isActive });
      await loadTaxes();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update tax');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Tax Rules</h1>
        <Button onClick={startCreate}>+ New tax rule</Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{editing ? 'Edit tax rule' : 'Create tax rule'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-1">
              <Label htmlFor="t-name">Tax name *</Label>
              <Input
                id="t-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. GST 18%"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="t-rate">Rate (%) *</Label>
              <Input
                id="t-rate"
                type="number"
                min="0"
                max="100"
                step="0.0001"
                value={form.ratePercent}
                onChange={(e) => setForm({ ...form, ratePercent: e.target.value })}
                required
                placeholder="18.00"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="t-default"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="t-default">Set as default tax</Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="t-active"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="t-active">Active</Label>
            </div>

            {formError ? <p className="text-sm text-red-600 sm:col-span-2">{formError}</p> : null}

            <div className="flex gap-3 sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update tax rule' : 'Create tax rule'}
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

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Loading…</p>
          ) : taxes.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No tax rules yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Rate (%)</th>
                  <th className="px-4 py-3">Default</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {taxes.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3">{Number(t.ratePercent).toFixed(4)}%</td>
                    <td className="px-4 py-3">
                      {t.isDefault ? (
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Default
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${t.isActive ? 'text-green-700' : 'text-slate-400'}`}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          className="text-xs text-blue-600 hover:underline"
                          onClick={() => startEdit(t)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-xs text-slate-500 hover:underline"
                          onClick={() => toggleActive(t)}
                        >
                          {t.isActive ? 'Deactivate' : 'Activate'}
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

