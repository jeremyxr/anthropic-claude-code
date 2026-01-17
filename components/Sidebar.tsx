'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [favoritesOpen, setFavoritesOpen] = useState(true);

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-60 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col overflow-hidden">
      {/* User Profile */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <button className="w-full flex items-center space-x-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
            A
          </div>
          <span className="font-medium text-gray-900 dark:text-gray-100 flex-1 text-left">alden</span>
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-3">
        {/* Top Links */}
        <div className="px-2 mb-4">
          <Link
            href="/dashboard"
            className={`flex items-center space-x-2 px-2 py-1.5 rounded text-sm ${
              isActive('/dashboard')
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <span>Inbox</span>
          </Link>
          <Link
            href="/initiatives"
            className={`flex items-center space-x-2 px-2 py-1.5 rounded text-sm mt-1 ${
              isActive('/initiatives')
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>My initiatives</span>
          </Link>
        </div>

        {/* Workspace Section */}
        <div className="px-2 mb-4">
          <button
            onClick={() => setWorkspaceOpen(!workspaceOpen)}
            className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <span>Workspace</span>
            <svg
              className={`w-3 h-3 transform transition-transform ${workspaceOpen ? 'rotate-0' : '-rotate-90'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {workspaceOpen && (
            <div className="space-y-1">
              <Link
                href="/projects"
                className={`flex items-center space-x-2 px-2 py-1.5 rounded text-sm ${
                  isActive('/projects')
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span>Projects</span>
              </Link>
              <Link
                href="/milestones"
                className={`flex items-center space-x-2 px-2 py-1.5 rounded text-sm ${
                  isActive('/milestones')
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Milestones</span>
              </Link>
              <Link
                href="/deliverables"
                className={`flex items-center space-x-2 px-2 py-1.5 rounded text-sm ${
                  isActive('/deliverables')
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Deliverables</span>
              </Link>
            </div>
          )}
        </div>

        {/* Favorites Section */}
        <div className="px-2 mb-4">
          <button
            onClick={() => setFavoritesOpen(!favoritesOpen)}
            className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <span>Favorites</span>
            <svg
              className={`w-3 h-3 transform transition-transform ${favoritesOpen ? 'rotate-0' : '-rotate-90'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {favoritesOpen && (
            <div className="space-y-1">
              <Link
                href="/favorites/active"
                className="flex items-center space-x-2 px-2 py-1.5 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Active work</span>
              </Link>
              <Link
                href="/favorites/backlog"
                className="flex items-center space-x-2 px-2 py-1.5 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                <span>Backlog</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-2">
        <div className="space-y-1">
          <button className="w-full flex items-center space-x-2 px-2 py-1.5 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create issue</span>
          </button>
          <button className="w-full flex items-center space-x-2 px-2 py-1.5 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>Invite people</span>
          </button>
          <Link
            href="/settings/jira"
            className="w-full flex items-center space-x-2 px-2 py-1.5 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span>Link JIRA</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
