'use client';

import { useState, useEffect } from 'react';
import { Newsletter } from '@/lib/types/newsletter';

export default function NewsletterList() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    try {
      const response = await fetch('/api/newsletter');
      if (!response.ok) throw new Error('Failed to fetch newsletters');
      const data = await response.json();
      setNewsletters(data.newsletters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Newsletter['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading newsletters...</div>;
  }

  if (error) {
    return <div className="text-red-600 py-8">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      {newsletters.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No newsletters found. Create your first newsletter to get started.
        </div>
      ) : (
        newsletters.map((newsletter) => (
          <div
            key={newsletter.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {newsletter.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{newsletter.subject}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  newsletter.status
                )}`}
              >
                {newsletter.status}
              </span>
            </div>

            <div className="text-sm text-gray-500 space-y-1">
              <p>Created: {new Date(newsletter.createdAt).toLocaleString()}</p>
              {newsletter.scheduledFor && (
                <p>
                  Scheduled for: {new Date(newsletter.scheduledFor).toLocaleString()}
                </p>
              )}
              {newsletter.sentAt && (
                <p>Sent: {new Date(newsletter.sentAt).toLocaleString()}</p>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <a
                href={`/newsletter/${newsletter.id}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                View Details
              </a>
              {newsletter.s3Url && (
                <a
                  href={newsletter.s3Url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                >
                  Preview in Browser
                </a>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
