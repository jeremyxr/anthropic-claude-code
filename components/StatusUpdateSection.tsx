'use client';

import { useState, useEffect } from 'react';
import { api, ProjectUpdate } from '@/lib/api';
import { useUser } from '@/lib/user-context';

interface StatusUpdateSectionProps {
  projectId: string;
}

export function StatusUpdateSection({ projectId }: StatusUpdateSectionProps) {
  const { currentUser } = useUser();
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [isAddingUpdate, setIsAddingUpdate] = useState(false);
  const [newUpdate, setNewUpdate] = useState({
    status: 'on-track' as 'on-track' | 'at-risk' | 'off-track',
    content: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpdates();
  }, [projectId]);

  const loadUpdates = async () => {
    try {
      setLoading(true);
      const data = await api.getProjectUpdates(projectId);
      setUpdates(data);
    } catch (err) {
      console.error('Failed to load project updates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newUpdate.content.trim()) return;

    try {
      await api.createProjectUpdate({
        projectId,
        status: newUpdate.status,
        content: newUpdate.content.trim(),
        createdBy: currentUser.id,
      });
      setNewUpdate({ status: 'on-track', content: '' });
      setIsAddingUpdate(false);
      await loadUpdates();
    } catch (err) {
      console.error('Failed to create update:', err);
      alert('Failed to create update');
    }
  };

  const handleDeleteUpdate = async (updateId: string) => {
    if (!confirm('Are you sure you want to delete this update?')) return;

    try {
      await api.deleteProjectUpdate(updateId);
      await loadUpdates();
    } catch (err) {
      console.error('Failed to delete update:', err);
      alert('Failed to delete update');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track':
        return (
          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'at-risk':
        return (
          <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'off-track':
        return (
          <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'On track';
      case 'at-risk':
        return 'At risk';
      case 'off-track':
        return 'Off track';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'at-risk':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'off-track':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'yesterday';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Status Updates</h3>
        {!isAddingUpdate && (
          <button
            onClick={() => setIsAddingUpdate(true)}
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Write a project update</span>
          </button>
        )}
      </div>

      {isAddingUpdate && (
        <form onSubmit={handleCreateUpdate} className="mb-4 border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Status</label>
              <div className="flex space-x-2">
                {(['on-track', 'at-risk', 'off-track'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setNewUpdate({ ...newUpdate, status })}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                      newUpdate.status === status
                        ? getStatusColor(status)
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {getStatusIcon(status)}
                    <span>{getStatusLabel(status)}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Update</label>
              <textarea
                required
                value={newUpdate.content}
                onChange={(e) => setNewUpdate({ ...newUpdate, content: e.target.value })}
                rows={3}
                className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                placeholder="What's the status of this project?"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-3">
            <button
              type="button"
              onClick={() => {
                setIsAddingUpdate(false);
                setNewUpdate({ status: 'on-track', content: '' });
              }}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
            >
              Post update
            </button>
          </div>
        </form>
      )}

      {updates.length === 0 && !isAddingUpdate && (
        <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">No updates yet</p>
          <button
            onClick={() => setIsAddingUpdate(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Write first update</span>
          </button>
        </div>
      )}

      {updates.length > 0 && (
        <div className="space-y-3">
          {updates.map((update) => (
            <div key={update.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`flex items-center space-x-1.5 px-2 py-1 rounded text-xs font-medium ${getStatusColor(update.status)}`}>
                    {getStatusIcon(update.status)}
                    <span>{getStatusLabel(update.status)}</span>
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">·</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {update.user?.name || update.user?.email || 'Unknown'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">·</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(update.createdAt)}
                  </span>
                </div>
                {currentUser?.id === update.createdBy && (
                  <button
                    onClick={() => handleDeleteUpdate(update.id)}
                    className="text-xs text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{update.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
