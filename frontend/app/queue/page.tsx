'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  assigned: 'bg-blue-100 text-blue-700',
  in_review: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  delivered: 'bg-gray-100 text-gray-500',
  submitted: 'bg-yellow-100 text-yellow-700',
};

const STATUS_LABEL: Record<string, string> = {
  assigned: 'New',
  in_review: 'In Review',
  approved: 'Ready',
  delivered: 'Delivered',
  submitted: 'Submitted',
};

const TEMPLATE_QUESTIONS: Record<string, string[]> = {
  DL: ['Who is the demand letter addressed to? (name or company)', 'What is their address? (type \'unknown\' if not sure)', 'What did they do wrong? Describe in your own words.', 'When did this issue start?', 'Do you have any proof? (photos, messages, receipts — describe them)', 'What do you want from them? (money, action, or both)', 'What is the exact amount or action you are demanding?'],
  CR: ['What type of contract is this? (job, lease, business deal, NDA, other)', 'Who is the other party in this contract?', 'What concerns you about this contract?', 'Are there specific clauses you want us to focus on?', 'What do you want from this review? (find risks, plain summary, advice before signing)'],
  TR: ['What is the address of the rental property?', 'What is your landlord\'s name or property management company?', 'What type of issue are you facing? (eviction, deposit, repairs, harassment, other)', 'What happened? Describe the situation.', 'When did this issue start?', 'What outcome are you hoping for?'],
  EM: ['What company did or do you work for?', 'What was your job title?', 'What type of issue are you facing? (wrongful termination, harassment, discrimination, retaliation, unpaid wages, other)', 'What happened? Describe in your own words.', 'When did this happen?', 'Did you report this to HR? (yes / no)', 'What do you want from this? (compensation, job back, legal protection, other)'],
  BF: ['What is your proposed business name?', 'What type of entity do you want to form? (LLC, Corporation, Partnership, Sole Proprietor)', 'Which state will the business be registered in?', 'How many owners will this business have?', 'What does the business do? Describe in one or two sentences.', 'What do you need from us? (register the company, operating agreement, full legal setup, advice only)'],
  EP: ['What is your marital status? (single, married, divorced, widowed)', 'Do you have children? (yes — minor / yes — adult / no)', 'Describe your main assets. (property, savings, investments, life insurance)', 'What type of estate planning do you need? (will, trust, healthcare directive, power of attorney, all of the above)', 'Who do you want to receive your assets?', 'Who do you want to manage your estate?'],
  SC: ['Who are you filing against? (full name or business name)', 'Do you have their address?', 'What happened? Why do they owe you money?', 'How much money are you claiming?', 'When did the incident happen?', 'Did you try to resolve this before coming to us? (yes / no)'],
  CD: ['Who is this letter addressed to? (name or company)', 'What type of violation is this? (harassment, copyright infringement, defamation, business interference, stalking, other)', 'What exactly are they doing? Be specific.', 'When did this behavior start?', 'What exactly do you want them to stop doing?'],
};

function buildDraft(matterCode: string, matterName: string, clientName: string, data: Record<string, string>): string {
  const questions = TEMPLATE_QUESTIONS[matterCode] || [];
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const qaSections = questions.map((q, i) => {
    const answer = data[`q${i + 1}`] || '—';
    return `${q}\n${answer}`;
  }).join('\n\n');

  return `SIGNAL LAW GROUP
${matterName.toUpperCase()}

Client: ${clientName}
Date: ${date}

────────────────────────────────

INTAKE SUMMARY

${qaSections}

────────────────────────────────

DRAFT DOCUMENT

[Attorney: Review the intake above and draft your document here. Replace this section with the completed legal document.]
`;
}

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

type FilterKey = 'all' | 'assigned' | 'in_review' | 'approved' | 'delivered';

export default function QueuePage() {
  const router = useRouter();
  const [cases, setCases] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selected, setSelected] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [activeTab, setActiveTab] = useState<'intake' | 'draft' | 'actions'>('intake');
  const [attorney, setAttorney] = useState<{ full_name: string; email: string; specialties?: string[] } | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) setAttorney(JSON.parse(raw));
    // Fetch live profile to get current is_available from DB
    api.get('/attorney/profile').then(({ data }) => {
      setIsAvailable(data.is_available);
      setAttorney((prev: any) => prev ? { ...prev, is_available: data.is_available } : data);
    }).catch(() => {});
    loadCases();
  }, []);

  async function toggleAvailability() {
    setTogglingAvailability(true);
    try {
      const { data } = await api.patch('/attorney/availability');
      setIsAvailable(data.is_available);
      const raw = localStorage.getItem('user');
      if (raw) {
        const parsed = JSON.parse(raw);
        localStorage.setItem('user', JSON.stringify({ ...parsed, is_available: data.is_available }));
      }
      // If toggled to available, reload cases — pending investigations may now be assigned
      if (data.is_available) {
        await loadCases(selected?.id);
      }
    } catch {
      // ignore
    } finally {
      setTogglingAvailability(false);
    }
  }

  async function loadCases(keepSelectedId?: string) {
    setLoading(true);
    const { data } = await api.get('/attorney/investigations');
    setCases(data);
    if (keepSelectedId) {
      const found = data.find((c: any) => c.id === keepSelectedId);
      if (found) {
        const { data: detail } = await api.get(`/attorney/investigations/${found.id}`);
        setSelected(detail);
        setNotes(detail.intake_data?.attorney_notes || '');
      } else if (data.length > 0) {
        selectCase(data[0]);
      }
    } else if (data.length > 0) {
      selectCase(data[0]);
    }
    setLoading(false);
  }

  async function selectCase(c: any) {
    const { data } = await api.get(`/attorney/investigations/${c.id}`);
    setSelected(data);
    setNotes(data.intake_data?.attorney_notes || '');
    setActiveTab('intake');
    // Auto-generate draft from intake answers
    const code = data.matter?.code || '';
    const intakeData = data.intake_data?.data || {};
    const generated = buildDraft(code, data.matter?.name || '', data.client?.full_name || '', intakeData);
    setDraft(generated);
  }

  const filtered = filter === 'all' ? cases : cases.filter(c => c.status === filter);

  const counts: Record<FilterKey, number> = {
    all: cases.length,
    assigned: cases.filter(c => c.status === 'assigned').length,
    in_review: cases.filter(c => c.status === 'in_review').length,
    approved: cases.filter(c => c.status === 'approved').length,
    delivered: cases.filter(c => c.status === 'delivered').length,
  };

  async function saveNotes() {
    setActionLoading('notes');
    try {
      await api.patch(`/attorney/investigations/${selected.id}/intake`, { attorney_notes: notes });
    } catch {
      alert('Failed to save notes.');
    }
    setActionLoading('');
  }

  async function saveDraft() {
    setActionLoading('draft');
    try {
      await api.patch(`/attorney/investigations/${selected.id}/intake`, { attorney_notes: `[DRAFT]\n${draft}\n[NOTES]\n${notes}` });
      alert('Draft saved.');
    } catch {
      alert('Failed to save draft.');
    }
    setActionLoading('');
  }

  async function approveCase() {
    if (!confirm('Generate document and approve?')) return;
    setActionLoading('approve');
    const currentId = selected.id;
    try {
      await api.patch(`/attorney/investigations/${currentId}/approve`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve case.');
    }
    await loadCases(currentId);
    setActionLoading('');
  }

  async function grantAccess() {
    if (!confirm('Grant download access to client?')) return;
    setActionLoading('grant');
    const currentId = selected.id;
    try {
      await api.patch(`/attorney/investigations/${currentId}/grant-access`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to grant access.');
    }
    await loadCases(currentId);
    setActionLoading('');
  }

  const intake = selected?.intake_data?.data || {};
  const intakeEntries = Object.entries(intake);

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#f2f0eb' }}>
      <Navbar />

      {/* Page header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 bg-white">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Attorney Review Portal</h1>
          <p className="text-sm text-gray-400 mt-0.5">Signal Law Group · Matter queue · AI draft review workflow</p>
        </div>
        <div className="flex items-center gap-3">
          {attorney && (
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ backgroundColor: '#0f1623' }}>
                {attorney.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{attorney.full_name}</span>
                  <button
                    onClick={toggleAvailability}
                    disabled={togglingAvailability}
                    className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full transition disabled:opacity-50 ${
                      isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${isAvailable ? 'bg-green-500' : 'bg-red-400'}`}></span>
                    {isAvailable ? 'Available' : 'Unavailable'}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {counts.all > 0 && (
                    <span className="text-xs text-gray-500">{counts.all} investigations open · {counts.delivered} delivered</span>
                  )}
                  {attorney.specialties && attorney.specialties.length > 0 && (
                    <div className="flex gap-1">
                      {attorney.specialties.map((code: string) => (
                        <span key={code} className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#fdf8ee', color: '#92650a' }}>{code}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — case list */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          {/* Filter tabs */}
          <div className="flex gap-1 px-3 pt-3 pb-2 flex-wrap text-xs">
            {([
              ['all', `All (${counts.all})`],
              ['assigned', `New (${counts.assigned})`],
              ['in_review', `In Review (${counts.in_review})`],
              ['approved', `Ready (${counts.approved})`],
              ['delivered', `Delivered (${counts.delivered})`],
            ] as [FilterKey, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-2.5 py-1 rounded-full font-medium transition ${filter === key ? 'text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                style={filter === key ? { backgroundColor: '#0f1623' } : {}}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Case list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="text-center text-gray-400 text-sm py-8">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No investigations.</p>
            ) : (
              filtered.map((c) => {
                const badge = BADGE_COLORS[c.matter?.code] || { bg: '#f3f4f6', text: '#374151' };
                const isActive = selected?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => selectCase(c)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 transition ${isActive ? 'bg-amber-50 border-l-2 border-l-amber-500' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs text-gray-400 font-mono">SLG-{c.id.slice(0, 8).toUpperCase()}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABEL[c.status] || c.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{c.client?.full_name}</p>
                    <p className="text-xs text-gray-400">{c.matter?.name}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span className="text-xs font-medium text-gray-700">${Number(c.matter?.price || 0).toFixed(0)} · {STATUS_LABEL[c.status]}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right — case detail */}
        {selected ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Case header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-gray-900">{selected.client?.full_name}</h2>
                  <span className="text-xs font-mono text-gray-400">· SLG-{selected.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-gray-500">{selected.matter?.name}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-sm text-gray-500">{selected.attorney_id ? 'Assigned' : 'Unassigned'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selected.status]}`}>
                    {STATUS_LABEL[selected.status] || selected.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-gray-900">${Number(selected.matter?.price || 0).toFixed(0)}</span>
                {selected.status === 'assigned' || selected.status === 'in_review' ? (
                  <button
                    onClick={approveCase}
                    disabled={!!actionLoading}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50"
                    style={{ backgroundColor: '#2d4a1e' }}
                  >
                    {actionLoading === 'approve' ? 'Generating…' : 'Approve & Generate →'}
                  </button>
                ) : selected.status === 'approved' && !selected.access_granted ? (
                  <button
                    onClick={grantAccess}
                    disabled={!!actionLoading}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50"
                    style={{ backgroundColor: '#2d4a1e' }}
                  >
                    {actionLoading === 'grant' ? 'Granting…' : 'Grant Access →'}
                  </button>
                ) : selected.access_granted ? (
                  <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-green-100 text-green-700">
                    Delivered ✓
                  </span>
                ) : null}
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 px-6">
              <div className="flex gap-1">
                {(['intake', 'draft', 'actions'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                      activeTab === tab ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {tab === 'intake' ? 'Intake Summary' : tab === 'draft' ? 'AI Draft' : 'Review & Actions'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
              {activeTab === 'intake' && (
                <>
                  {intakeEntries.length === 0 ? (
                    <p className="text-sm text-gray-400">No intake data yet.</p>
                  ) : (() => {
                    const questions = TEMPLATE_QUESTIONS[selected.matter?.code] || [];
                    return intakeEntries.map(([key, value], i) => {
                      const qIndex = parseInt(key.replace('q', '')) - 1;
                      const questionText = questions[qIndex] || key;
                      return (
                        <div key={i} className="bg-white rounded-xl px-5 py-4 border border-gray-100">
                          <p className="text-xs font-semibold text-gray-400 mb-1.5">Q{qIndex + 1} — {questionText}</p>
                          <p className="text-sm text-gray-900">{String(value)}</p>
                        </div>
                      );
                    });
                  })()}
                </>
              )}

              {activeTab === 'draft' && (
                <div className="bg-white rounded-xl px-5 py-5 border border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Document Draft</p>
                      <p className="text-xs text-gray-400 mt-0.5">Auto-generated from client intake · Edit before approving</p>
                    </div>
                    <button
                      onClick={saveDraft}
                      disabled={actionLoading === 'draft'}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition disabled:opacity-50"
                      style={{ backgroundColor: '#0f1623' }}
                    >
                      {actionLoading === 'draft' ? 'Saving…' : 'Save Draft'}
                    </button>
                  </div>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={24}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50 resize-none"
                  />
                </div>
              )}

              {activeTab === 'actions' && (
                <div className="bg-white rounded-xl px-5 py-4 border border-gray-100 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Attorney Notes</p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={5}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Add notes for this case…"
                  />
                  <button
                    onClick={saveNotes}
                    disabled={actionLoading === 'notes'}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white transition disabled:opacity-50"
                    style={{ backgroundColor: '#0f1623' }}
                  >
                    {actionLoading === 'notes' ? 'Saving…' : 'Save Notes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select an investigation from the list
          </div>
        )}
      </div>
    </div>
  );
}
