'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-yellow-100 text-yellow-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_review: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  delivered: 'bg-emerald-100 text-emerald-700',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', submitted: 'Submitted', assigned: 'Assigned',
  in_review: 'In Review', approved: 'Approved', delivered: 'Delivered',
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/overview'),
      api.get('/admin/investigations'),
    ]).then(([ovRes, casesRes]) => {
      setOverview(ovRes.data);
      setCases(casesRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const statuses = overview?.cases_by_status
    ? Object.entries(overview.cases_by_status as Record<string, number>)
    : [];

  const recentCases = cases.slice(0, 8);

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#f2f0eb' }}>
      <Navbar />

      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">CRM Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Signal Law Group · System overview</p>
      </div>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="text-center text-gray-400 text-sm py-20">Loading…</div>
        ) : (
          <div className="max-w-5xl space-y-6">

            {/* Top stats */}
            <div className="grid grid-cols-2 gap-4">
              <div
                className="rounded-2xl p-6 text-white cursor-pointer hover:opacity-90 transition"
                style={{ backgroundColor: '#0f1623' }}
                onClick={() => router.push('/admin/clients')}
              >
                <p className="text-sm text-gray-400">Total Clients</p>
                <p className="text-5xl font-bold mt-2">{overview?.total_clients ?? '—'}</p>
                <p className="text-xs text-gray-500 mt-3">View clients →</p>
              </div>
              <div
                className="rounded-2xl p-6 text-white cursor-pointer hover:opacity-90 transition"
                style={{ backgroundColor: '#1a2e10' }}
                onClick={() => router.push('/admin/attorneys')}
              >
                <p className="text-sm text-gray-400">Total Attorneys</p>
                <p className="text-5xl font-bold mt-2">{overview?.total_attorneys ?? '—'}</p>
                <p className="text-xs text-gray-500 mt-3">View attorneys →</p>
              </div>
            </div>

            {/* Cases by status */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Investigations by Status</p>
              <div className="grid grid-cols-3 gap-3">
                {statuses.map(([status, count]) => (
                  <div key={status} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">{STATUS_LABEL[status] || status}</p>
                      <p className="text-2xl font-bold text-gray-900">{count as number}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[status]}`}>
                      {STATUS_LABEL[status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent cases */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Recent Investigations</p>
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Matter</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Attorney</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentCases.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-gray-400 py-10">No investigations yet.</td>
                      </tr>
                    ) : (
                      recentCases.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50 transition">
                          <td className="px-5 py-3">
                            <p className="font-medium text-gray-900">{c.client?.full_name}</p>
                            <p className="text-xs text-gray-400">{c.client?.email}</p>
                          </td>
                          <td className="px-5 py-3 text-gray-700">{c.matter?.name}</td>
                          <td className="px-5 py-3 text-gray-600">{c.attorney?.full_name || <span className="text-gray-300 italic">Unassigned</span>}</td>
                          <td className="px-5 py-3">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[c.status]}`}>
                              {STATUS_LABEL[c.status] || c.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-400">
                            {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
