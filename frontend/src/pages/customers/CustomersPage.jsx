import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Search,
  Plus,
  Edit2,
  Eye,
  FileText,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/badge';

export function CustomersPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form state
  const [form, setForm] = useState({
    companyName: '',
    billingEmail: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });
  const [saving, setSaving] = useState(false);

  const basePath = profile?.role === 'ADMIN' ? '/admin' : '/staff';

  async function loadCustomers(searchQuery = search) {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/customers', {
        params: { search: searchQuery || undefined },
      });
      setCustomers(data.items || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadCustomers(search);
  }

  function openCreateModal() {
    setForm({
      companyName: '',
      billingEmail: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    });
    setModalError('');
    setIsCreateOpen(true);
  }

  function openEditModal(customer) {
    setSelectedCustomer(customer);
    setForm({
      companyName: customer.companyName || '',
      billingEmail: customer.billingEmail || '',
      phone: customer.phone || '',
      addressLine1: customer.addressLine1 || '',
      addressLine2: customer.addressLine2 || '',
      city: customer.city || '',
      state: customer.state || '',
      postalCode: customer.postalCode || '',
      country: customer.country || '',
    });
    setModalError('');
    setIsEditOpen(true);
  }

  async function openViewModal(customer) {
    try {
      const { data } = await api.get(`/customers/${customer.id}`);
      setSelectedCustomer(data.data || customer);
      setIsViewOpen(true);
    } catch {
      setSelectedCustomer(customer);
      setIsViewOpen(true);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setModalError('');
      const payload = {
        companyName: form.companyName.trim(),
        billingEmail: form.billingEmail.trim().toLowerCase(),
        phone: form.phone?.trim() || null,
        addressLine1: form.addressLine1?.trim() || null,
        addressLine2: form.addressLine2?.trim() || null,
        city: form.city?.trim() || null,
        state: form.state?.trim() || null,
        postalCode: form.postalCode?.trim() || null,
        country: form.country?.trim() || null,
      };
      await api.post('/customers', payload);
      setIsCreateOpen(false);
      await loadCustomers();
    } catch (err) {
      setModalError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to create customer',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      setSaving(true);
      setModalError('');
      const payload = {
        companyName: form.companyName.trim(),
        billingEmail: form.billingEmail.trim().toLowerCase(),
        phone: form.phone?.trim() || null,
        addressLine1: form.addressLine1?.trim() || null,
        addressLine2: form.addressLine2?.trim() || null,
        city: form.city?.trim() || null,
        state: form.state?.trim() || null,
        postalCode: form.postalCode?.trim() || null,
        country: form.country?.trim() || null,
      };
      await api.put(`/customers/${selectedCustomer.id}`, payload);
      setIsEditOpen(false);
      await loadCustomers();
    } catch (err) {
      setModalError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to update customer',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customers Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your client accounts, billing information, and subscription sales pipelines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => loadCustomers()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="size-4" />
            New Customer
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Total Clients</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{customers.length}</p>
            </div>
            <div className="p-2.5 rounded-full bg-blue-50 text-blue-600">
              <Building2 className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Active Subscriptions</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {customers.reduce((acc, c) => acc + (c._count?.subscriptions || 0), 0)}
              </p>
            </div>
            <div className="p-2.5 rounded-full bg-emerald-50 text-emerald-600">
              <FileText className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Portal Users Linked</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {customers.filter((c) => c.userId || c.user).length}
              </p>
            </div>
            <div className="p-2.5 rounded-full bg-purple-50 text-purple-600">
              <UserCheck className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                placeholder="Search by company name, billing email, phone, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="outline">
              Search
            </Button>
            {search && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSearch('');
                  loadCustomers('');
                }}
              >
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <div className="rounded-md bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Customers Table */}
      <Card>
        <CardHeader className="border-b border-slate-100 py-4">
          <CardTitle className="text-base font-semibold">Registered Clients ({customers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-slate-400" />
              Loading customer directory...
            </div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Building2 className="size-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-700">No customers found</p>
              <p className="text-xs text-slate-400 mt-1">
                {search ? 'Try clearing your search query' : 'Create your first customer profile to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">Company Name</th>
                    <th className="px-6 py-3 font-medium">Billing Contact</th>
                    <th className="px-6 py-3 font-medium">Location</th>
                    <th className="px-6 py-3 font-medium text-center">Subscriptions</th>
                    <th className="px-6 py-3 font-medium text-center">Portal User</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Building2 className="size-4 text-slate-400 flex-shrink-0" />
                          <span>{customer.companyName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Mail className="size-3.5 text-slate-400" />
                            <span>{customer.billingEmail}</span>
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Phone className="size-3.5 text-slate-400" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        {customer.city || customer.country ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="size-3.5 text-slate-400" />
                            <span>
                              {[customer.city, customer.state, customer.country].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No address</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                          {customer._count?.subscriptions || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-xs">
                        {customer.userId || customer.user ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                            <UserCheck className="size-3.5" />
                            Linked
                          </span>
                        ) : (
                          <span className="text-slate-400">Standalone</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-slate-600"
                            onClick={() => openViewModal(customer)}
                            title="View Customer Profile"
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-slate-600"
                            onClick={() => openEditModal(customer)}
                            title="Edit Customer"
                          >
                            <Edit2 className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-medium ml-1"
                            onClick={() =>
                              navigate(`${basePath}/subscriptions/new?customerId=${customer.id}`)
                            }
                          >
                            <Plus className="size-3 mr-1" />
                            Quote
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

      {/* CREATE CUSTOMER MODAL */}
      <Dialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Customer Profile"
        description="Register a new company or client account in Brightloop SMS."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="e.g. Acme Corporation"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="billingEmail">Billing Email *</Label>
              <Input
                id="billingEmail"
                type="email"
                placeholder="billing@company.com"
                value={form.billingEmail}
                onChange={(e) => setForm({ ...form, billingEmail: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+1 555-0100"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                placeholder="Street address or P.O. Box"
                value={form.addressLine1}
                onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                placeholder="Suite, unit, building, floor (optional)"
                value={form.addressLine2}
                onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="San Francisco"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State / Province</Label>
              <Input
                id="state"
                placeholder="CA"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                placeholder="94105"
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="United States"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>
          </div>

          {modalError && <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded">{modalError}</p>}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* EDIT CUSTOMER MODAL */}
      <Dialog
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Customer Profile"
        description="Update contact information and billing address."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="editCompanyName">Company Name *</Label>
              <Input
                id="editCompanyName"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editBillingEmail">Billing Email *</Label>
              <Input
                id="editBillingEmail"
                type="email"
                value={form.billingEmail}
                onChange={(e) => setForm({ ...form, billingEmail: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editPhone">Phone Number</Label>
              <Input
                id="editPhone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="editAddressLine1">Address Line 1</Label>
              <Input
                id="editAddressLine1"
                value={form.addressLine1}
                onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="editAddressLine2">Address Line 2</Label>
              <Input
                id="editAddressLine2"
                value={form.addressLine2}
                onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editCity">City</Label>
              <Input
                id="editCity"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editState">State</Label>
              <Input
                id="editState"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editPostalCode">Postal Code</Label>
              <Input
                id="editPostalCode"
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editCountry">Country</Label>
              <Input
                id="editCountry"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>
          </div>

          {modalError && <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded">{modalError}</p>}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* VIEW CUSTOMER PROFILE DIALOG */}
      <Dialog
        open={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={selectedCustomer?.companyName || 'Customer Profile'}
        description="Customer profile details and subscription history."
        maxWidth="max-w-2xl"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Quick Contact & Info Card */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-medium uppercase">Email</p>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedCustomer.billingEmail}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium uppercase">Phone</p>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedCustomer.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium uppercase">Country</p>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedCustomer.country || 'N/A'}</p>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <p className="text-slate-400 font-medium uppercase">Address</p>
                <p className="font-medium text-slate-700 mt-0.5">
                  {[
                    selectedCustomer.addressLine1,
                    selectedCustomer.addressLine2,
                    selectedCustomer.city,
                    selectedCustomer.state,
                    selectedCustomer.postalCode,
                  ]
                    .filter(Boolean)
                    .join(', ') || 'No physical address on file'}
                </p>
              </div>
            </div>

            {/* Subscriptions for this customer */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  Subscriptions & Quotes ({selectedCustomer.subscriptions?.length || 0})
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => {
                    setIsViewOpen(false);
                    navigate(`${basePath}/subscriptions/new?customerId=${selectedCustomer.id}`);
                  }}
                >
                  <Plus className="size-3 mr-1" />
                  Create Quotation
                </Button>
              </div>

              {selectedCustomer.subscriptions?.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-xs">
                  {selectedCustomer.subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
                      onClick={() => {
                        setIsViewOpen(false);
                        navigate(`${basePath}/subscriptions/${sub.id}`);
                      }}
                    >
                      <div>
                        <span className="font-bold text-slate-900">{sub.number}</span>
                        <span className="text-slate-500 ml-2">Plan: {sub.plan?.name}</span>
                        <span className="text-slate-400 ml-2">({sub.plan?.interval})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={sub.status} />
                        <span className="font-semibold text-slate-700">View →</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                  No subscriptions created for this customer yet.
                </div>
              )}
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
