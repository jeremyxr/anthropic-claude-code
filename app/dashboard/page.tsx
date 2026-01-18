'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Initiative, Project, Milestone, Deliverable } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';

type Tab = 'all' | 'active' | 'completed' | 'blocked';

export default function Dashboard() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [initData, delivData] = await Promise.all([
        api.getInitiatives(),
        api.getDeliverables(),
      ]);
      setInitiatives(initData);
      setDeliverables(delivData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredDeliverables = () => {
    switch (activeTab) {
      case 'active':
        return deliverables.filter(d => d.status === 'in-progress');
      case 'completed':
        return deliverables.filter(d => d.status === 'done');
      case 'blocked':
        return deliverables.filter(d => d.status === 'blocked');
      default:
        return deliverables;
    }
  };

  const filteredDeliverables = getFilteredDeliverables();
  const blockingDeliverables = deliverables.filter(d => d.status === 'blocked');

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
        <div className="px-6 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My issues</h1>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center space-x-6 text-sm">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'active'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'completed'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setActiveTab('blocked')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'blocked'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Blocked
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="px-6 py-2 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Filter</span>
        </button>
        <button className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>Display</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {blockingDeliverables.length > 0 && activeTab === 'all' && (
          <div className="border-b border-gray-200 dark:border-gray-800">
            <div className="px-6 py-3">
              <div className="flex items-center space-x-2 text-sm mb-3">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-medium text-gray-900 dark:text-white">Blocking issues</span>
                <span className="text-gray-500">{blockingDeliverables.length}</span>
              </div>
              {blockingDeliverables.map((deliverable) => (
                <Link
                  key={deliverable.id}
                  href={`/tasks/${deliverable.id}`}
                  className="flex items-center py-2 px-3 -mx-3 rounded hover:bg-gray-50 dark:hover:bg-gray-900 group"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm text-gray-900 dark:text-white truncate">{deliverable.name}</span>
                  </div>
                  {deliverable.jiraIssueKey && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded mr-3">
                      {deliverable.jiraIssueKey}
                    </span>
                  )}
                  <StatusBadge status={deliverable.status} type="deliverable" />
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="px-6 py-3">
          {filteredDeliverables.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">No issues found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredDeliverables.map((deliverable) => (
                <Link
                  key={deliverable.id}
                  href={`/tasks/${deliverable.id}`}
                  className="flex items-center py-2 px-3 -mx-3 rounded hover:bg-gray-50 dark:hover:bg-gray-900 group"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm text-gray-900 dark:text-white truncate">{deliverable.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {deliverable.labels && deliverable.labels.length > 0 && (
                      <div className="flex items-center space-x-1">
                        {deliverable.labels.slice(0, 2).map((label, i) => (
                          <span key={i} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                    {deliverable.jiraIssueKey && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                        {deliverable.jiraIssueKey}
                      </span>
                    )}
                    {deliverable.assignee && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">{deliverable.assignee}</span>
                    )}
                    <StatusBadge status={deliverable.status} type="deliverable" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
