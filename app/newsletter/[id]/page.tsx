'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Newsletter, NewsletterHistory } from '@/lib/types/newsletter';

export default function NewsletterDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [history, setHistory] = useState<NewsletterHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [previewEmail, setPreviewEmail] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchNewsletterDetails();
  }, [id]);

  const fetchNewsletterDetails = async () => {
    try {
      const [newsletterRes, historyRes] = await Promise.all([
        fetch(`/api/newsletter?id=${id}`),
        fetch(`/api/newsletter/history?newsletterId=${id}`),
      ]);

      if (!newsletterRes.ok) throw new Error('Failed to fetch newsletter');

      const newsletterData = await newsletterRes.json();
      const historyData = await historyRes.json();

      setNewsletter(newsletterData.newsletter);
      setHistory(historyData.history || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage(null);

    try {
      const response = await fetch('/api/newsletter/send-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsletterId: id,
          recipientEmail: previewEmail,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send preview');
      }

      setActionMessage({
        type: 'success',
        text: `Preview email sent to ${previewEmail}`,
      });
      setPreviewEmail('');
      fetchNewsletterDetails(); // Refresh history
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'An error occurred',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage(null);

    try {
      const response = await fetch('/api/newsletter/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsletterId: id,
          scheduledFor: scheduledDate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to schedule newsletter');
      }

      setActionMessage({
        type: 'success',
        text: 'Newsletter scheduled successfully!',
      });
      fetchNewsletterDetails(); // Refresh data
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'An error occurred',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error || !newsletter) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="text-red-600">Error: {error || 'Newsletter not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <a href="/" className="text-blue-600 hover:text-blue-700">
            ← Back to Dashboard
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{newsletter.title}</h1>
                {newsletter.brand && (
                  <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                    {newsletter.brand}
                  </span>
                )}
              </div>
              <p className="text-gray-600">{newsletter.subject}</p>
              {newsletter.campaignId && (
                <p className="text-xs text-gray-500 mt-1">
                  Campaign ID: {newsletter.campaignId}
                </p>
              )}
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                newsletter.status === 'draft'
                  ? 'bg-gray-100 text-gray-800'
                  : newsletter.status === 'scheduled'
                  ? 'bg-blue-100 text-blue-800'
                  : newsletter.status === 'sent'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {newsletter.status}
            </span>
          </div>

          {newsletter.status === 'scheduled' && newsletter.scheduledFor && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-blue-600 mr-2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <div>
                  <span className="font-semibold text-blue-900">Scheduled for: </span>
                  <span className="text-blue-800">
                    {new Date(newsletter.scheduledFor).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-6">
            <div>
              <strong>Created:</strong> {new Date(newsletter.createdAt).toLocaleString()}
            </div>
            <div>
              <strong>Updated:</strong> {new Date(newsletter.updatedAt).toLocaleString()}
            </div>
            {newsletter.sentAt && (
              <div className="col-span-2">
                <strong>Sent:</strong> {new Date(newsletter.sentAt).toLocaleString()}
              </div>
            )}
          </div>

          {newsletter.s3Url && (
            <a
              href={newsletter.s3Url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              View in Browser
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Send Preview */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Send Preview Email</h2>
            <form onSubmit={handleSendPreview}>
              <input
                type="email"
                value={previewEmail}
                onChange={(e) => setPreviewEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                placeholder="Enter email address"
                required
              />
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {actionLoading ? 'Sending...' : 'Send Preview'}
              </button>
            </form>
          </div>

          {/* Schedule Newsletter */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Schedule Newsletter</h2>
            <form onSubmit={handleSchedule}>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                required
              />
              <button
                type="submit"
                disabled={actionLoading || newsletter.status === 'scheduled'}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
              >
                {actionLoading ? 'Scheduling...' : 'Schedule Newsletter'}
              </button>
            </form>
          </div>
        </div>

        {actionMessage && (
          <div
            className={`mb-6 p-4 rounded-md ${
              actionMessage.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {actionMessage.text}
          </div>
        )}

        {/* History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">History</h2>
          {history.length === 0 ? (
            <p className="text-gray-500">No history available</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">{item.action}</span>
                      {item.metadata?.recipientEmail && (
                        <span className="text-sm text-gray-600 ml-2">
                          to {item.metadata.recipientEmail}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {item.userId && (
                    <p className="text-xs text-gray-500">by {item.userId}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
