'use client';
import { useEffect, useRef, useState } from 'react';
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

interface Message { role: 'bot' | 'user'; content: string; }
interface Matter { id: string; code: string; name: string; price: number; description: string; }
export default function ClientPortalPage() {
  const router = useRouter();
  const [matters, setMatters] = useState<Matter[]>([]);
  const [selected, setSelected] = useState<Matter | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [isLastQuestion, setIsLastQuestion] = useState(false);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Identity modal — shown when submitting without a token
  const [showIdentity, setShowIdentity] = useState(false);
  const [identity, setIdentity] = useState({ full_name: '', email: '', phone: '' });
  const [identityLoading, setIdentityLoading] = useState(false);
  const [identityError, setIdentityError] = useState('');
  // Pending submit state saved while waiting for identity
  const [pendingAnswers, setPendingAnswers] = useState<Record<string, string> | null>(null);
  const [pendingChatLog, setPendingChatLog] = useState<any[] | null>(null);

  useEffect(() => {
    api.get('/matters').then(({ data }) => {
      setMatters(data);
      if (data.length > 0) selectMatter(data[0]);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function selectMatter(matter: Matter) {
    setSelected(matter);
    setMessages([]);
    setAnswers({});
    setStep(0);
    setIsDone(false);
    setIsLastQuestion(false);
    setInput('');
    setCaseId(null);
    setStarting(true);
    try {
      // Only fetch first question — do NOT create a case yet
      const { data } = await api.post('/chat/next', { matter_id: matter.id, step: 0 });
      setMessages([{ role: 'bot', content: data.question }]);
      if (data.is_last) {
        setIsLastQuestion(true);
      }
    } catch {
      setMessages([{ role: 'bot', content: 'Failed to start intake. Please try again.' }]);
    } finally {
      setStarting(false);
    }
  }

  async function handleSend() {
    if (!input.trim() || !selected || submitting || isDone) return;
    const answer = input.trim();
    setInput('');
    const userMsg: Message = { role: 'user', content: answer };
    setMessages((prev) => [...prev, userMsg]);
    const key = `q${step + 1}`;
    const newAnswers = { ...answers, [key]: answer };
    setAnswers(newAnswers);

    // User just answered the last question — mark done and show submit button
    if (isLastQuestion) {
      setIsDone(true);
      setMessages((prev) => [...prev, { role: 'bot', content: 'Thank you — I have everything I need. Click "Submit my case" below to continue.' }]);
      return;
    }

    try {
      const { data } = await api.post('/chat/next', { matter_id: selected.id, step: step + 1, answer });
      setStep(step + 1);
      setMessages((prev) => [...prev, { role: 'bot', content: data.question }]);
      if (data.is_last) {
        setIsLastQuestion(true);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', content: 'Error fetching next question.' }]);
    }
  }

  async function handleSubmitClick() {
    if (!selected || submitting) return;
    const chatLog = messages.map((m) => ({ role: m.role, content: m.content }));

    // Clear any non-client tokens (attorney/admin) silently
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('role');
      if (role && role !== 'client') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
        document.cookie = 'access_token=; Max-Age=0; path=/';
        document.cookie = 'role=; Max-Age=0; path=/';
      }
    }

    // Reset fields and show identity modal
    setIdentity({ full_name: '', email: '', phone: '' });
    setIdentityError('');
    setPendingAnswers(answers);
    setPendingChatLog(chatLog);
    setShowIdentity(true);
  }

  async function doSubmit(finalAnswers: Record<string, string>, chatLog: any[]) {
    setSubmitting(true);
    try {
      let activeCaseId = caseId;
      if (!activeCaseId) {
        const { data: caseData } = await api.post('/investigations', { matter_id: selected!.id });
        activeCaseId = caseData.id;
        setCaseId(activeCaseId);
      }
      await api.post(`/investigations/${activeCaseId}/intake`, { data: finalAnswers, chat_log: chatLog });
      router.push(`/investigations/${activeCaseId}`);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        // Stale, invalid, or wrong-role token — clear it and ask for identity
        localStorage.removeItem('access_token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
        document.cookie = 'access_token=; Max-Age=0; path=/';
        document.cookie = 'role=; Max-Age=0; path=/';
        setPendingAnswers(finalAnswers);
        setPendingChatLog(chatLog);
        setShowIdentity(true);
      } else {
        setMessages((prev) => [...prev, { role: 'bot', content: 'Failed to submit. Please try again.' }]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleIdentitySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identity.full_name.trim() || !identity.email.trim()) return;
    setIdentityLoading(true);
    setIdentityError('');
    try {
      // Register client (no password) — finds or creates by email
      const { data } = await api.post('/auth/register', {
        full_name: identity.full_name,
        email: identity.email,
        phone: identity.phone || undefined,
        role: 'client',
      });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('role', 'client');
      localStorage.setItem('user', JSON.stringify(data.user));
      document.cookie = `access_token=${data.access_token}; path=/`;
      document.cookie = `role=client; path=/`;
      setShowIdentity(false);
      await doSubmit(pendingAnswers!, pendingChatLog!);
    } catch (err: any) {
      setIdentityError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setIdentityLoading(false);
    }
  }

  function restart() {
    if (selected) selectMatter(selected);
  }

  const totalSteps = selected ? (messages.filter(m => m.role === 'bot').length) : 0;

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#f2f0eb' }}>
      <Navbar />

      {/* Identity modal — shown when submitting without login */}
      {showIdentity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Almost there</h2>
            <p className="text-sm text-gray-500 mb-5">Enter your details to submit your case. No password needed.</p>
            {identityError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{identityError}</div>
            )}
            <form onSubmit={handleIdentitySubmit} className="space-y-3">
              <input
                required
                placeholder="Full name"
                value={identity.full_name}
                onChange={(e) => setIdentity({ ...identity, full_name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <input
                required
                type="email"
                placeholder="Email address"
                value={identity.email}
                onChange={(e) => setIdentity({ ...identity, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <input
                placeholder="Phone (optional)"
                value={identity.phone}
                onChange={(e) => setIdentity({ ...identity, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="submit"
                disabled={identityLoading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50 mt-1"
                style={{ backgroundColor: '#0f1623' }}
              >
                {identityLoading ? 'Submitting…' : 'Submit my case →'}
              </button>
              <button
                type="button"
                onClick={() => setShowIdentity(false)}
                className="w-full text-sm text-gray-400 hover:text-gray-600 transition"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="px-6 py-4 flex items-start justify-between border-b border-gray-200 bg-white">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Legal Self-Service Portal</h1>
          <p className="text-sm text-gray-400 mt-0.5">AI-guided intake · Document drafting · Attorney review on demand</p>
        </div>
        <span className="text-xs border border-amber-400 text-amber-700 px-3 py-1 rounded-full">
          AI output is not legal advice
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — matter list */}
        <div className="w-64 border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 pt-3 pb-1">
              <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Select Matter Type</p>
            </div>
            {matters.map((m) => {
              const badge = BADGE_COLORS[m.code] || { bg: '#f3f4f6', text: '#374151' };
              const isActive = selected?.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => selectMatter(m)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                    isActive ? 'border-l-2 border-amber-500' : 'hover:bg-gray-50'
                  }`}
                  style={isActive ? { backgroundColor: '#fdf8ee' } : {}}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{ backgroundColor: badge.bg, color: badge.text }}>
                    {m.code}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.name}</p>
                    <p className="text-xs text-gray-400">${Number(m.price).toFixed(0)} · atty review</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main — chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">{selected.name}</h2>
                  <p className="text-xs text-gray-400">AI intake in progress · Signal Law Group</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className={`w-5 h-1.5 rounded-full transition-all ${i < totalSteps ? 'bg-amber-500' : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <button onClick={restart} className="text-sm border border-gray-300 px-3 py-1 rounded-md text-gray-600 hover:bg-gray-50 transition">
                    Restart
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4" style={{ backgroundColor: '#f2f0eb' }}>
                {starting && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-400 font-medium">LEX · AI</span>
                    <div className="bg-white rounded-xl px-4 py-3 text-sm text-gray-700 shadow-sm max-w-2xl">
                      <span className="animate-pulse">Loading questions…</span>
                    </div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {m.role === 'bot' && <span className="text-xs text-gray-400 font-medium">LEX · AI</span>}
                    <div className={`rounded-xl px-4 py-3 text-sm max-w-2xl shadow-sm ${
                      m.role === 'bot' ? 'bg-white text-gray-800' : 'text-white'
                    }`}
                      style={m.role === 'user' ? { backgroundColor: '#0f1623' } : {}}>
                      {m.content}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="bg-white border-t border-gray-200 px-6 py-4">
                {isDone ? (
                  <button
                    onClick={handleSubmitClick}
                    disabled={submitting}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white transition disabled:opacity-40"
                    style={{ backgroundColor: '#0f1623' }}
                  >
                    {submitting ? 'Submitting…' : 'Submit my case →'}
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      disabled={submitting || starting}
                      placeholder="Type your answer..."
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50"
                    />
                    <button
                      onClick={handleSend}
                      disabled={submitting || !input.trim() || starting}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition disabled:opacity-40"
                      style={{ backgroundColor: '#0f1623' }}
                    >
                      {submitting ? '…' : 'Send →'}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a matter type to begin
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
