'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  assigned: 'Assigned',
  in_review: 'Under Review',
  approved: 'Approved',
  delivered: 'Ready to Download',
};
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-500',
  submitted: 'bg-yellow-100 text-yellow-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_review: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  delivered: 'bg-emerald-100 text-emerald-700',
};

function PaymentForm({
  caseId,
  amount,
  onSuccess,
}: {
  caseId: string;
  amount: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  async function handlePay() {
    if (!stripe || !elements) return;
    setPaying(true);
    setError('');
    try {
      const { data } = await api.post(`/investigations/${caseId}/payment`, { amount });
      const clientSecret: string = data.client_secret;

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card: cardElement },
        });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed.');
      } else if (paymentIntent?.status === 'succeeded') {
        // Give webhook a moment to process then refresh
        await new Promise((r) => setTimeout(r, 2000));
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '14px',
                color: '#111827',
                '::placeholder': { color: '#9ca3af' },
              },
            },
          }}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <button
        onClick={handlePay}
        disabled={paying || !stripe}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50"
        style={{ backgroundColor: '#0f1623' }}
      >
        {paying ? 'Processing…' : `Pay $${amount.toFixed(2)} →`}
      </button>
      <p className="text-xs text-center text-gray-400">
        Secured by Stripe · Signal Law Group
      </p>
    </div>
  );
}

export default function CaseStatusPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  async function loadCase() {
    const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
    const endpoint = role === 'client' ? `/investigations/${id}` : `/investigations/public/${id}`;
    const { data } = await api.get(endpoint);
    setCaseData(data);
  }

  useEffect(() => {
    loadCase().finally(() => setLoading(false));
  }, [id]);

  async function downloadDocument() {
    setDownloading(true);
    try {
      const { data } = await api.get(`/investigations/${id}/document`);
      window.open(data.url, '_blank');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Document not available yet.');
    } finally {
      setDownloading(false);
    }
  }

  if (loading)
    return (
      <div className="flex flex-col h-screen" style={{ backgroundColor: '#f2f0eb' }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Loading…
        </div>
      </div>
    );

  const price = Number(caseData?.matter?.price || 0);

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#f2f0eb' }}>
      <Navbar />
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-4">
        <button
          onClick={() => router.push('/matters')}
          className="text-sm text-gray-400 hover:text-gray-700"
        >
          ← Back
        </button>
        <h1 className="text-lg font-bold text-gray-900">Investigation Status</h1>
      </div>

      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Status card */}
          {caseData && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {caseData.matter?.name}
                </h2>
                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full ${
                    STATUS_COLORS[caseData.status]
                  }`}
                >
                  {STATUS_LABELS[caseData.status] || caseData.status}
                </span>
              </div>

              <div className="space-y-0 text-sm divide-y divide-gray-100">
                <div className="flex justify-between py-2.5">
                  <span className="text-gray-400">Investigation ID</span>
                  <span className="font-mono text-gray-700 text-xs">
                    {caseData.id}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-gray-400">Matter</span>
                  <span className="text-gray-700">{caseData.matter?.name}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-gray-400">Amount</span>
                  <span className="font-semibold text-gray-900">
                    ${price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-gray-400">Payment</span>
                  <span
                    className={
                      caseData.payment_done
                        ? 'text-green-600 font-medium'
                        : 'text-orange-500 font-medium'
                    }
                  >
                    {caseData.payment_done ? 'Confirmed ✓' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-gray-400">Attorney Access</span>
                  <span
                    className={
                      caseData.access_granted
                        ? 'text-green-600 font-medium'
                        : 'text-gray-400'
                    }
                  >
                    {caseData.access_granted ? 'Granted ✓' : 'Awaiting attorney'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {!caseData.payment_done && (
                <div>
                  {!showPayment ? (
                    <button
                      onClick={() => setShowPayment(true)}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition"
                      style={{ backgroundColor: '#0f1623' }}
                    >
                      Pay ${price.toFixed(2)} to Submit →
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700">
                        Enter card details
                      </p>
                      <Elements stripe={stripePromise}>
                        <PaymentForm
                          caseId={id}
                          amount={price}
                          onSuccess={() => {
                            setShowPayment(false);
                            loadCase();
                          }}
                        />
                      </Elements>
                    </div>
                  )}
                </div>
              )}

              {caseData.payment_done && caseData.access_granted && (
                <button
                  onClick={downloadDocument}
                  disabled={downloading}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50"
                  style={{ backgroundColor: '#2d4a1e' }}
                >
                  {downloading ? 'Preparing download…' : 'Download Document →'}
                </button>
              )}

              {caseData.payment_done && caseData.status === 'submitted' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-sm text-blue-700 font-medium">
                    Waiting for an available attorney
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    All attorneys are currently unavailable. Your case is in the queue and will be assigned as soon as one becomes available. No action needed.
                  </p>
                </div>
              )}

              {caseData.payment_done && !caseData.access_granted && caseData.status !== 'submitted' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-sm text-amber-700 font-medium">
                    Payment confirmed — attorney review in progress
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    You'll receive an email when your document is ready.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          {caseData && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-4">
                Progress
              </p>
              <div className="space-y-3">
                {[
                  { label: 'Intake submitted', done: true },
                  {
                    label: 'Payment confirmed',
                    done: caseData.payment_done,
                  },
                  {
                    label: (caseData.status === 'submitted' && caseData.payment_done)
                      ? 'Waiting for available attorney…'
                      : 'Attorney assigned',
                    done: ['assigned', 'in_review', 'approved', 'delivered'].includes(caseData.status),
                  },
                  {
                    label: 'Document approved',
                    done: ['approved', 'delivered'].includes(caseData.status),
                  },
                  {
                    label: 'Ready to download',
                    done: caseData.access_granted,
                  },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        step.done
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {step.done ? '✓' : i + 1}
                    </div>
                    <span
                      className={`text-sm ${
                        step.done ? 'text-gray-900 font-medium' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
