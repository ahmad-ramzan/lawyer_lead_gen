'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';

export default function AttorneyCaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [caseData, setCaseData] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    api.get(`/attorney/cases/${id}`)
      .then(({ data }) => {
        setCaseData(data);
        setNotes(data.intake_data?.attorney_notes || '');
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function saveNotes() {
    setActionLoading('notes');
    try {
      await api.patch(`/attorney/cases/${id}/intake`, { attorney_notes: notes });
      alert('Notes saved.');
    } catch {
      alert('Failed to save notes.');
    } finally {
      setActionLoading('');
    }
  }

  async function approveCase() {
    if (!confirm('Approve this case and generate the document?')) return;
    setActionLoading('approve');
    try {
      await api.patch(`/attorney/cases/${id}/approve`);
      const { data } = await api.get(`/attorney/cases/${id}`);
      setCaseData(data);
    } catch {
      alert('Failed to approve case.');
    } finally {
      setActionLoading('');
    }
  }

  async function grantAccess() {
    if (!confirm('Grant download access to the client? This will send them an email.')) return;
    setActionLoading('grant');
    try {
      await api.patch(`/attorney/cases/${id}/grant-access`);
      router.push('/queue');
    } catch {
      alert('Failed to grant access.');
    } finally {
      setActionLoading('');
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;
  if (!caseData) return <div className="min-h-screen flex items-center justify-center text-gray-500">Case not found.</div>;

  const intake = caseData.intake_data;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/queue')} className="text-sm text-blue-600 hover:underline">← Back to queue</button>
        <h1 className="text-lg font-semibold text-gray-900">{caseData.matter?.name}</h1>
        <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{caseData.status}</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Client</h2>
          <p className="text-sm text-gray-700">{caseData.client?.full_name}</p>
          <p className="text-sm text-gray-500">{caseData.client?.email}</p>
        </div>

        {intake && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Intake Data</h2>
            <pre className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 overflow-auto">
              {JSON.stringify(intake.data, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Attorney Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add notes for this case…"
          />
          <button
            onClick={saveNotes}
            disabled={actionLoading === 'notes'}
            className="mt-3 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {actionLoading === 'notes' ? 'Saving…' : 'Save notes'}
          </button>
        </div>

        <div className="flex gap-3">
          {caseData.status !== 'approved' && caseData.status !== 'delivered' && (
            <button
              onClick={approveCase}
              disabled={!!actionLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl text-sm transition disabled:opacity-50"
            >
              {actionLoading === 'approve' ? 'Approving…' : 'Approve & generate document'}
            </button>
          )}
          {(caseData.status === 'approved') && !caseData.access_granted && (
            <button
              onClick={grantAccess}
              disabled={!!actionLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl text-sm transition disabled:opacity-50"
            >
              {actionLoading === 'grant' ? 'Granting…' : 'Grant download access'}
            </button>
          )}
          {caseData.access_granted && (
            <div className="flex-1 text-center py-2.5 text-sm text-emerald-600 font-medium bg-emerald-50 rounded-xl">
              Access granted — client can download
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
