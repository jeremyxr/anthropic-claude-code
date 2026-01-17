'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Initiative } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import { useUser } from '@/lib/user-context';

export default function InitiativesPage() {
  const { currentUser, currentTeam } = useUser();
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning' as const,
    owner: '',
    targetDate: '',
  });

  useEffect(() => {
    loadInitiatives();
  }, []);

  const loadInitiatives = async () => {
    try {
      setLoading(true);
      const data = await api.getInitiatives();
      setInitiatives(data);
    } catch (err) {
      console.error('Failed to load initiatives:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !currentTeam) {
      alert('Please complete your profile and team setup first');
      return;
    }

    try {
      await api.createInitiative({
        ...formData,
        targetDate: formData.targetDate || null, // Convert empty string to null
        teamId: currentTeam.id,
        createdBy: currentUser.id,
      });
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        status: 'planning',
        owner: '',
        targetDate: '',
      });
      loadInitiatives();
    } catch (err) {
      console.error('Failed to create initiative:', err);
      alert('Failed to create initiative');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="px-8 py-3 flex items-center justify-between">
          <h1 className="text-sm font-semibold text-gray-900 dark:text-white">Initiatives</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {initiatives.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                No initiatives yet
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Get started by creating your first initiative
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create Initiative</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="px-8 py-2">
            <div className="space-y-px">
              {initiatives.map((initiative) => (
                <Link
                  key={initiative.id}
                  href={`/initiatives/${initiative.id}`}
                  className="flex items-center py-2 px-2 -mx-2 rounded-sm hover:bg-gray-50 dark:hover:bg-gray-900/50 group border-b border-gray-100 dark:border-gray-800/50 last:border-0"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <h3 className="text-sm text-gray-900 dark:text-white truncate">
                      {initiative.name}
                    </h3>
                    {initiative.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {initiative.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {initiative.owner && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {initiative.owner}
                      </span>
                    )}
                    {initiative.targetDate && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(initiative.targetDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    )}
                    <StatusBadge status={initiative.status} type="initiative" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-lg w-full p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Create Initiative</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    placeholder="Enter initiative name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    placeholder="Describe the initiative"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="on-hold">On Hold</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      Owner
                    </label>
                    <input
                      type="text"
                      value={formData.owner}
                      onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                      placeholder="Owner"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={formData.targetDate}
                      onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-5 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
