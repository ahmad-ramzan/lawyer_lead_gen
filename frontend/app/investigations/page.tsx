'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  DL: { bg: '#f5e6c8', text: '#92650a' },
  CR: { bg: '#dbeafe', text: '#1e40af' },
  TR: { bg: '#d1fae5', text: '#065f46' },
  EM: { bg: '#fee2e2', text: '#991b1b' },
  BF: { bg: '#ede9fe', text: '#5b21b6' },
  EP: { bg: '#ccfbf1', text: '#0f766e' },
  SC: { bg: '#fef9c3', text: '#854d0e' },
  CD: { bg: '#fce7f3', text: '#9d174d' },
};

const STATUS_COLOR: Record<string, string> = {
  draft: 'text-gray-400',
  submitted: 'text-yellow-600',
  assigned: 'text-blue-600',
  in_review: 'text-purple-600',
  approved: 'text-green-600',
  delivered: 'text-emerald-600',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  assigned: 'Assigned',
  in_review: 'In Review',
  approved: 'Approved',
  delivered: 'Ready to Download',
};

interface MyCase {
  id: string;
  status: string;
  created_at: string;
  payment_done: boolean;
  access_granted: boolean;
  matter: { name: string; code: string; price: number };
}

export default function SubmittedMattersPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cases, setCases] = useState<MyCase[] | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/investigations/lookup', { email: email.trim() });
      setCases(data);
      setSearched(true);
    } catch {
      setError('Failed to look up cases. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#f2f0eb' }}>
      <Navbar />

      <div className="max-w-2xl mx-auto w-full px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Submitted Matters</h1>
        <p className="text-sm text-gray-400 mb-8">Enter your email to view your submitted cases.</p>

        {/* Email lookup form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <form onSubmit={handleLookup} className="flex gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setCases(null); setSearched(false); }}
              placeholder="Enter your email address"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50 whitespace-nowrap"
              style={{ backgroundColor: '#0f1623' }}
            >
              {loading ? 'Looking up…' : 'View Matters →'}
            </button>
          </form>
          {error && <p className="text-red-600 text-xs mt-3">{error}</p>}
        </div>

        {/* Results */}
        {searched && cases !== null && (
          cases.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 px-8 py-12 text-center">
              <p className="text-gray-500 text-sm mb-4">No submitted matters found for this email.</p>
              <button
                onClick={() => router.push('/matters')}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition"
                style={{ backgroundColor: '#0f1623' }}
              >
                Start a new matter →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cases.map((c) => {
                const badge = BADGE_COLORS[c.matter?.code] || { bg: '#f3f4f6', text: '#374151' };
                return (
                  <button
                    key={c.id}
                    onClick={() => router.push(`/investigations/${c.id}`)}
                    className="w-full bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center gap-4 text-left hover:shadow-sm transition"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                      style={{ backgroundColor: badge.bg, color: badge.text }}
                    >
                      {c.matter?.code}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{c.matter?.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-xs font-semibold ${STATUS_COLOR[c.status] || 'text-gray-400'}`}>
                        {STATUS_LABEL[c.status] || c.status}
                      </span>
                      {!c.payment_done && <p className="text-xs text-orange-500 mt-0.5">Payment pending</p>}
                      {c.access_granted && <p className="text-xs text-emerald-600 mt-0.5">Document ready</p>}
                    </div>
                    <span className="text-gray-300 text-sm ml-1">›</span>
                  </button>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
