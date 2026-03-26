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

export default function AdminAttorneysPage() {
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [attorneys, setAttorneys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('ALL');

  useEffect(() => {
    Promise.all([
      api.get('/admin/investigations'),
      api.get('/admin/attorneys'),
    ]).then(([investigationsRes, attRes]) => {
      setInvestigations(investigationsRes.data);
      setAttorneys(attRes.data);
      if (attRes.data.length > 0) setSelectedId(attRes.data[0].id);
    }).finally(() => setLoading(false));
  }, []);

  const filteredInvestigations = selectedId === 'ALL'
    ? investigations.filter((c) => c.attorney)
    : investigations.filter((c) => c.attorney?.id === selectedId);

  const selectedAttorney = attorneys.find((a) => a.id === selectedId);

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#f2f0eb' }}>
      <Navbar />

      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Attorney Overview</h1>
        <p className="text-sm text-gray-400 mt-0.5">Signal Law Group · Investigations by attorney</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — attorney list */}
        <div className="w-60 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto">
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Attorneys</p>
          </div>

          {/* All attorneys option */}
          <button
            onClick={() => setSelectedId('ALL')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
              selectedId === 'ALL' ? 'border-l-2 border-amber-500' : 'hover:bg-gray-50'
            }`}
            style={selectedId === 'ALL' ? { backgroundColor: '#fdf8ee' } : {}}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold bg-gray-100 text-gray-500">
              ALL
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">All Attorneys</p>
              <p className="text-xs text-gray-400">{investigations.filter(c => c.attorney).length} investigations</p>
            </div>
          </button>

          {loading ? (
            <p className="text-xs text-gray-400 px-4 py-3">Loading…</p>
          ) : attorneys.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-3">No attorneys yet.</p>
          ) : (
            attorneys.map((a) => {
              const count = investigations.filter((c) => c.attorney?.id === a.id).length;
              const isActive = selectedId === a.id;
              const initials = a.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                    isActive ? 'border-l-2 border-amber-500' : 'hover:bg-gray-50'
                  }`}
                  style={isActive ? { backgroundColor: '#fdf8ee' } : {}}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white flex-none"
                    style={{ backgroundColor: '#0f1623' }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.full_name}</p>
                    <p className="text-xs text-gray-400">{count} case{count !== 1 ? 's' : ''} · {a.active_investigations} active</p>
                    {a.specialties?.length > 0 && (
                      <p className="text-xs text-amber-600 truncate">{a.specialties.join(', ')}</p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right — investigations table */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading…</div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    {selectedId === 'ALL' ? 'All Assigned Investigations' : selectedAttorney?.full_name}
                  </p>
                  {selectedId !== 'ALL' && selectedAttorney && (
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <p className="text-xs text-gray-400">{selectedAttorney.email} · {selectedAttorney.active_investigations} active</p>
                      {selectedAttorney.specialties?.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {selectedAttorney.specialties.map((code: string) => (
                            <span key={code} className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-700">{code}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-400">{filteredInvestigations.length} case{filteredInvestigations.length !== 1 ? 's' : ''}</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Matter</th>
                    {selectedId === 'ALL' && (
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Attorney</th>
                    )}
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInvestigations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-400 py-10">
                        No investigations assigned to this attorney yet.
                      </td>
                    </tr>
                  ) : (
                    filteredInvestigations.map((c) => {
                      const badge = BADGE_COLORS[c.matter?.code] || { bg: '#f3f4f6', text: '#374151' };
                      return (
                        <tr key={c.id} className="hover:bg-gray-50 transition">
                          <td className="px-5 py-3">
                            <p className="font-medium text-gray-900">{c.client?.full_name}</p>
                            <p className="text-xs text-gray-400">{c.client?.email}</p>
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                              style={{ backgroundColor: badge.bg, color: badge.text }}
                            >
                              {c.matter?.code} · {c.matter?.name}
                            </span>
                          </td>
                          {selectedId === 'ALL' && (
                            <td className="px-5 py-3">
                              <p className="text-gray-900 font-medium">{c.attorney?.full_name}</p>
                              <p className="text-xs text-gray-400">{c.attorney?.email}</p>
                            </td>
                          )}
                          <td className="px-5 py-3">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[c.status] || 'bg-gray-100 text-gray-500'}`}>
                              {STATUS_LABEL[c.status] || c.status}
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
