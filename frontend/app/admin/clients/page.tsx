'use client';
import { useEffect, useState } from 'react';
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
  draft: 'bg-gray-100 text-gray-500',
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

const MATTER_ORDER = ['DL', 'CR', 'TR', 'EM', 'BF', 'EP', 'SC', 'CD'];

export default function AdminClientsPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState<string>('ALL');

  useEffect(() => {
    api.get('/admin/investigations').then(({ data }) => setCases(data)).finally(() => setLoading(false));
  }, []);

  // Build matter list from data, preserving canonical order
  const matters = MATTER_ORDER.map((code) => {
    const match = cases.find((c) => c.matter?.code === code);
    if (!match) return null;
    return { code, name: match.matter.name };
  }).filter(Boolean) as { code: string; name: string }[];

  const filtered = selectedCode === 'ALL' ? cases : cases.filter((c) => c.matter?.code === selectedCode);
  const selectedMatterName = selectedCode === 'ALL' ? 'All Matters' : cases.find(c => c.matter?.code === selectedCode)?.matter?.name;

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#f2f0eb' }}>
      <Navbar />

      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Client Overview</h1>
        <p className="text-sm text-gray-400 mt-0.5">Signal Law Group · Clients by matter type</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — matter types */}
        <div className="w-60 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto">
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Matter Type</p>
          </div>

          {/* All matters */}
          <button
            onClick={() => setSelectedCode('ALL')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
              selectedCode === 'ALL' ? 'border-l-2 border-amber-500' : 'hover:bg-gray-50'
            }`}
            style={selectedCode === 'ALL' ? { backgroundColor: '#fdf8ee' } : {}}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold bg-gray-100 text-gray-500">
              ALL
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">All Matters</p>
              <p className="text-xs text-gray-400">{cases.length} clients</p>
            </div>
          </button>

          {matters.map((m) => {
            const badge = BADGE_COLORS[m.code] || { bg: '#f3f4f6', text: '#374151' };
            const count = cases.filter((c) => c.matter?.code === m.code).length;
            const isActive = selectedCode === m.code;
            return (
              <button
                key={m.code}
                onClick={() => setSelectedCode(m.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                  isActive ? 'border-l-2 border-amber-500' : 'hover:bg-gray-50'
                }`}
                style={isActive ? { backgroundColor: '#fdf8ee' } : {}}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ backgroundColor: badge.bg, color: badge.text }}
                >
                  {m.code}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-400">{count} client{count !== 1 ? 's' : ''}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right — clients table */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading…</div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">{selectedMatterName}</p>
                <span className="text-xs text-gray-400">{filtered.length} client{filtered.length !== 1 ? 's' : ''}</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                    {selectedCode === 'ALL' && (
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Matter</th>
                    )}
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-400 py-10">
                        No clients enrolled in this matter yet.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => {
                      const badge = BADGE_COLORS[c.matter?.code] || { bg: '#f3f4f6', text: '#374151' };
                      return (
                        <tr key={c.id} className="hover:bg-gray-50 transition">
                          <td className="px-5 py-3">
                            <p className="font-medium text-gray-900">{c.client?.full_name}</p>
                            <p className="text-xs text-gray-400">{c.client?.email}</p>
                          </td>
                          {selectedCode === 'ALL' && (
                            <td className="px-5 py-3">
                              <span
                                className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                                style={{ backgroundColor: badge.bg, color: badge.text }}
                              >
                                {c.matter?.code} · {c.matter?.name}
                              </span>
                            </td>
                          )}
                          <td className="px-5 py-3">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[c.status] || 'bg-gray-100 text-gray-500'}`}>
                              {STATUS_LABEL[c.status] || c.status}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-xs font-medium ${c.payment_done ? 'text-green-600' : 'text-orange-500'}`}>
                              {c.payment_done ? 'Paid ✓' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-400">
                            {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
