'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface BrandSettings {
  templateId: string;
  defaultSubject?: string;
  customization?: {
    primaryColor?: string;
    logo?: string;
    [key: string]: any;
  };
}

interface Template {
  id: string;
  name: string;
  description: string;
}

export default function BrandSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [brandSettings, setBrandSettings] = useState<Record<string, BrandSettings>>({});
  const [availableTemplates, setAvailableTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for adding/editing
  const [editingBrand, setEditingBrand] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    brandId: '',
    templateId: 'default',
    defaultSubject: '',
    primaryColor: '',
    logo: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadSettings();
    }
  }, [status]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/brands');
      if (!response.ok) throw new Error('Failed to load settings');

      const data = await response.json();
      setBrandSettings(data.brandSettings);
      setAvailableTemplates(data.availableTemplates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/settings/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandSettings }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddOrUpdateBrand = () => {
    if (!formData.brandId.trim()) {
      setError('Brand ID is required');
      return;
    }

    const newSettings = { ...brandSettings };
    newSettings[formData.brandId] = {
      templateId: formData.templateId,
      ...(formData.defaultSubject && { defaultSubject: formData.defaultSubject }),
      ...(formData.primaryColor || formData.logo
        ? {
            customization: {
              ...(formData.primaryColor && { primaryColor: formData.primaryColor }),
              ...(formData.logo && { logo: formData.logo }),
            },
          }
        : {}),
    };

    setBrandSettings(newSettings);
    setEditingBrand(null);
    setFormData({
      brandId: '',
      templateId: 'default',
      defaultSubject: '',
      primaryColor: '',
      logo: '',
    });
    setError(null);
  };

  const handleEditBrand = (brandId: string) => {
    const settings = brandSettings[brandId];
    setEditingBrand(brandId);
    setFormData({
      brandId,
      templateId: settings.templateId,
      defaultSubject: settings.defaultSubject || '',
      primaryColor: settings.customization?.primaryColor || '',
      logo: settings.customization?.logo || '',
    });
  };

  const handleDeleteBrand = (brandId: string) => {
    if (brandId === 'default') {
      setError('Cannot delete default brand settings');
      return;
    }

    if (confirm(`Are you sure you want to delete brand "${brandId}"?`)) {
      const newSettings = { ...brandSettings };
      delete newSettings[brandId];
      setBrandSettings(newSettings);
    }
  };

  const handleCancelEdit = () => {
    setEditingBrand(null);
    setFormData({
      brandId: '',
      templateId: 'default',
      defaultSubject: '',
      primaryColor: '',
      logo: '',
    });
    setError(null);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Brand Template Settings</h1>
          <p className="text-gray-600 mt-2">
            Configure which newsletter template is used for each brand
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Add/Edit Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingBrand ? `Edit Brand: ${editingBrand}` : 'Add New Brand'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand ID *
              </label>
              <input
                type="text"
                value={formData.brandId}
                onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                disabled={!!editingBrand}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="e.g., brand-a"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template *
              </label>
              <select
                value={formData.templateId}
                onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Subject (Optional)
              </label>
              <input
                type="text"
                value={formData.defaultSubject}
                onChange={(e) => setFormData({ ...formData, defaultSubject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Brand A Newsletter"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Color (Optional)
              </label>
              <input
                type="text"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., #667eea"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL (Optional)
              </label>
              <input
                type="text"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., https://example.com/logo.png"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddOrUpdateBrand}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              {editingBrand ? 'Update Brand' : 'Add Brand'}
            </button>
            {editingBrand && (
              <button
                onClick={handleCancelEdit}
                className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Brand Settings Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Default Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(brandSettings).map(([brandId, settings]) => (
                <tr key={brandId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {brandId}
                    {brandId === 'default' && (
                      <span className="ml-2 text-xs text-gray-500">(fallback)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {settings.templateId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {settings.defaultSubject || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {settings.customization ? (
                      <div className="space-y-1">
                        {settings.customization.primaryColor && (
                          <div className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded border border-gray-300"
                              style={{ backgroundColor: settings.customization.primaryColor }}
                            />
                            <span className="text-xs">{settings.customization.primaryColor}</span>
                          </div>
                        )}
                        {settings.customization.logo && (
                          <div className="text-xs text-gray-500">Has logo</div>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <button
                      onClick={() => handleEditBrand(brandId)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    {brandId !== 'default' && (
                      <button
                        onClick={() => handleDeleteBrand(brandId)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Dashboard
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>

        {/* Template Preview Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Available Templates</h3>
          <div className="space-y-2">
            {availableTemplates.map((template) => (
              <div key={template.id} className="text-sm">
                <span className="font-medium text-blue-800">{template.name}:</span>{' '}
                <span className="text-blue-700">{template.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
