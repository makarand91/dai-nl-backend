'use client';

import { useState } from 'react';

export default function CreateNewsletterForm() {
  const [formData, setFormData] = useState({
    strapiDocumentId: '',
    title: '',
    subject: '',
    htmlContent: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/newsletter/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create newsletter');
      }

      const data = await response.json();
      setSuccess('Newsletter created successfully!');

      // Open preview in new tab
      if (data.previewUrl) {
        window.open(data.previewUrl, '_blank');
      }

      // Reset form
      setFormData({
        strapiDocumentId: '',
        title: '',
        subject: '',
        htmlContent: '',
      });

      // Refresh the page after a short delay
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Create Newsletter</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Strapi Document ID (Optional)
          </label>
          <input
            type="text"
            value={formData.strapiDocumentId}
            onChange={(e) =>
              setFormData({ ...formData, strapiDocumentId: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., suici87c0i12iqwgafc1q3a5"
          />
          <p className="text-xs text-gray-500 mt-1">
            If provided, newsletter and articles will be fetched from Strapi 5
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Newsletter title (optional if using Strapi)"
            required={!formData.strapiDocumentId}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject *
          </label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Email subject line (optional if using Strapi)"
            required={!formData.strapiDocumentId}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            HTML Content *
          </label>
          <textarea
            value={formData.htmlContent}
            onChange={(e) =>
              setFormData({ ...formData, htmlContent: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="Enter HTML content (optional if using Strapi)"
            rows={10}
            required={!formData.strapiDocumentId}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create & Preview Newsletter'}
        </button>
      </form>
    </div>
  );
}
