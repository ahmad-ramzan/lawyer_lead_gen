'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '', role: 'client' });
  const [specialties, setSpecialties] = useState<string[]>([]);

  const MATTERS = [
    { code: 'DL', name: 'Demand Letter' },
    { code: 'CR', name: 'Contract Review' },
    { code: 'TR', name: 'Tenant Rights' },
    { code: 'EM', name: 'Employment' },
    { code: 'BF', name: 'Business Formation' },
    { code: 'EP', name: 'Estate Planning' },
    { code: 'SC', name: 'Small Claims' },
    { code: 'CD', name: 'Cease & Desist' },
  ];

  function toggleSpecialty(code: string) {
    setSpecialties((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: any = { ...form };
      if (!payload.phone) delete payload.phone;
      if (form.role === 'attorney') payload.specialties = specialties;
      const { data } = await api.post('/auth/register', payload);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('user', JSON.stringify(data.user));
      document.cookie = `access_token=${data.access_token}; path=/`;
      document.cookie = `role=${data.user.role}; path=/`;
      if (data.user.role === 'attorney') router.push('/queue');
      else if (data.user.role === 'admin') router.push('/admin/dashboard');
      else router.push('/matters');
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
          <p className="text-gray-400 text-sm leading-relaxed">Legal self-service, powered by AI. Attorney-reviewed documents on demand.</p>
          <p className="text-gray-600 text-xs mt-4">Atlanta, GA · MVP v0.1</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
          <p className="text-sm text-gray-500 mb-7">Join LexSelf — Signal Law Group</p>
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
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone <span className="text-gray-400">(optional)</span></label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                placeholder="+1 (404) 000-0000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <select value={form.role} onChange={(e) => { setForm({ ...form, role: e.target.value }); setSpecialties([]); }}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                <option value="client">Client</option>
                <option value="attorney">Attorney</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {form.role === 'attorney' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Matter Specialties <span className="text-gray-400 font-normal">(select all that apply)</span>
                </label>
                <div className="border border-gray-300 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {MATTERS.map((m) => (
                    <label key={m.code} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition">
                      <input
                        type="checkbox"
                        checked={specialties.includes(m.code)}
                        onChange={() => toggleSpecialty(m.code)}
                        className="w-4 h-4 accent-amber-500"
                      />
                      <span className="text-sm text-gray-700">{m.name}</span>
                      <span className="ml-auto text-xs font-semibold text-gray-400">{m.code}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Cases are auto-assigned to attorneys with matching specialties.</p>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50"
              style={{ backgroundColor: '#0f1623' }}>
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account? <Link href="/auth/login" className="text-gray-700 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
