'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface Speciality { id: string; name: string; }

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'attorney' });
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/specialities').then(({ data }) => setSpecialities(data)).catch(() => {});
  }, []);

  function toggleSpeciality(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: any = { ...form };
      if (form.role === 'attorney') payload.speciality_ids = selectedIds;
      const { data } = await api.post('/auth/register', payload);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('user', JSON.stringify(data.user));
      document.cookie = `access_token=${data.access_token}; path=/`;
      document.cookie = `role=${data.user.role}; path=/`;
      if (data.user.role === 'admin') router.push('/admin/dashboard');
      else router.push('/queue');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f2f0eb' }}>
      <div className="hidden lg:flex w-80 flex-col justify-between px-10 py-12" style={{ backgroundColor: '#0f1623' }}>
        <div>
          <div className="text-white font-bold text-xl tracking-tight">LexSelf</div>
          <div className="text-xs tracking-widest uppercase mt-1" style={{ color: '#c9a84c' }}>Signal Law Group</div>
        </div>
        <div>
          <p className="text-gray-400 text-sm leading-relaxed">Staff registration for attorneys and administrators.</p>
          <p className="text-gray-600 text-xs mt-4">Atlanta, GA · MVP v0.1</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Staff Registration</h1>
          <p className="text-sm text-gray-500 mb-7">For attorneys and administrators only</p>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                placeholder="Jane Smith" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                placeholder="you@signallawgroup.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <select value={form.role} onChange={(e) => { setForm({ ...form, role: e.target.value }); setSelectedIds([]); }}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                <option value="attorney">Attorney</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {form.role === 'attorney' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Specialities <span className="text-gray-400 font-normal">(select all that apply)</span>
                </label>
                <div className="border border-gray-300 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {specialities.length === 0 ? (
                    <p className="text-xs text-gray-400 px-4 py-3">Loading specialities…</p>
                  ) : specialities.map((s) => (
                    <label key={s.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(s.id)}
                        onChange={() => toggleSpeciality(s.id)}
                        className="w-4 h-4 accent-amber-500"
                      />
                      <span className="text-sm text-gray-700">{s.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Investigations are auto-assigned to attorneys with matching specialities.</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50"
              style={{ backgroundColor: '#0f1623' }}>
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>
          <div className="mt-6 pt-5 border-t border-gray-200 text-center space-y-2">
            <p className="text-sm text-gray-400">
              Already have an account? <Link href="/auth/login" className="text-gray-700 font-medium hover:underline">Sign in</Link>
            </p>
            <p className="text-xs text-gray-400">
              Are you a client? <Link href="/matters" className="text-gray-600 hover:underline">Access the portal →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
