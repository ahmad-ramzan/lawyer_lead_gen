'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('user', JSON.stringify(data.user));
      document.cookie = `access_token=${data.access_token}; path=/`;
      document.cookie = `role=${data.user.role}; path=/`;
      if (data.user.role === 'attorney') router.push('/queue');
      else if (data.user.role === 'admin') router.push('/admin/dashboard');
      else router.push('/matters');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f2f0eb' }}>
      {/* Left branding panel */}
      <div className="hidden lg:flex w-80 flex-col justify-between px-10 py-12" style={{ backgroundColor: '#0f1623' }}>
        <div>
          <div className="text-white font-bold text-xl tracking-tight">LexSelf</div>
          <div className="text-xs tracking-widest uppercase mt-1" style={{ color: '#c9a84c' }}>Signal Law Group</div>
        </div>
        <div>
          <p className="text-gray-400 text-sm leading-relaxed">
            Legal self-service, powered by AI. Attorney-reviewed documents on demand.
          </p>
          <p className="text-gray-600 text-xs mt-4">Atlanta, GA · MVP v0.1</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h1>
          <p className="text-sm text-gray-500 mb-7">Access your LexSelf portal</p>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" required value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50"
              style={{ backgroundColor: '#0f1623' }}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-400 mt-6">
            No account? <Link href="/auth/register" className="text-gray-700 font-medium hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
