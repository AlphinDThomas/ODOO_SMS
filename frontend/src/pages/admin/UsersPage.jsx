import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const { data } = await api.get('/users');
    setUsers(data.items || []);
  }

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.error || 'Could not load users'));
  }, []);

  async function onCreate(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await api.post('/users/staff', form);
      setForm({ email: '', password: '', fullName: '' });
      setSuccess('Staff account created successfully!');
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not create staff');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Create staff</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={onCreate}>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Temporary password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <p className="text-xs text-slate-500">
                More than 8 characters, with uppercase, lowercase, and a special character (e.g. Staff@12345).
              </p>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create staff account'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {users.map((user) => (
              <li key={user.id} className="flex justify-between border-b border-slate-100 py-2">
                <span>{user.email}</span>
                <span className="text-slate-500">{user.role}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
