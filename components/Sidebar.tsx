'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useUser } from '@/lib/user-context';
import { api, Favorite, Initiative, Project, Milestone, Deliverable } from '@/lib/api';

interface FavoriteWithEntity extends Favorite {
  name?: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser, currentTeam } = useUser();
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [favoritesOpen, setFavoritesOpen] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteWithEntity[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    if (currentUser) {
      loadFavorites();
    }
  }, [currentUser]);

  const loadFavorites = async () => {
    if (!currentUser) return;

    try {
      setLoadingFavorites(true);
      const favs = await api.getFavorites(currentUser.id);

      // Fetch entity details for each favorite to get names
      const favoritesWithNames = await Promise.all(
        favs.map(async (fav) => {
          try {
            let name = 'Unknown';
            switch (fav.entityType) {
              case 'initiative':
                const initiative = await api.getInitiative(fav.entityId);
                name = initiative.name;
                break;
              case 'project':
                const project = await api.getProject(fav.entityId);
                name = project.name;
                break;
              case 'milestone':
                // Milestones don't have a direct get method, so we'll need to handle this
                // For now, we'll leave it as is and fetch it differently if needed
                name = 'Milestone';
                break;
              case 'deliverable':
                const deliverable = await api.getDeliverable(fav.entityId);
                name = deliverable.name;
                break;
            }
            return { ...fav, name };
          } catch (err) {
            console.error(`Failed to load entity details for favorite ${fav.id}:`, err);
            return { ...fav, name: 'Unknown' };
          }
        })
      );

      setFavorites(favoritesWithNames);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const getFavoriteIcon = (entityType: string) => {
    switch (entityType) {
      case 'initiative':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'project':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        );
      case 'milestone':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'deliverable':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getFavoriteLink = (fav: FavoriteWithEntity) => {
    switch (fav.entityType) {
      case 'initiative':
        return `/initiatives/${fav.entityId}`;
      case 'project':
        return `/projects/${fav.entityId}`;
      case 'milestone':
        // Milestones don't have their own page, so we can't link directly
        // We would need to know the project ID to link properly
        return '#';
      case 'deliverable':
        return `/tasks/${fav.entityId}`;
      default:
        return '#';
    }
  };

  return (
    <aside className="w-60 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col overflow-hidden">
      {/* User Profile */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <Link
          href="/settings"
          className="w-full flex items-center space-x-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
            {currentUser?.name?.charAt(0).toUpperCase() || 'J'}
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {currentUser?.name || 'JaneFlow'}
            </div>
            {currentTeam && (
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {currentTeam.name}
              </div>
            )}
          </div>
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-3">
        {/* Top Links */}
        <div className="px-2 mb-4">
          <Link
            href="/inbox"
            className={`flex items-center space-x-2 px-2 py-1.5 rounded text-sm ${
              isActive('/inbox')
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
            href="/dashboard"
            className={`flex items-center space-x-2 px-2 py-1.5 rounded text-sm mt-1 ${
              isActive('/dashboard')
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>My issues</span>
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

        {/* Favorites Section */}
        {currentUser && (
          <div className="px-2 mb-4">
            <button
              onClick={() => setFavoritesOpen(!favoritesOpen)}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="font-medium">Favorites</span>
              <svg
                className={`w-3 h-3 transition-transform ${favoritesOpen ? 'rotate-0' : '-rotate-90'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {favoritesOpen && (
              <div className="mt-1 space-y-0.5">
                {loadingFavorites ? (
                  <div className="px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400">
                    Loading...
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400">
                    No favorites yet
                  </div>
                ) : (
                  favorites.map((fav) => (
                    <Link
                      key={fav.id}
                      href={getFavoriteLink(fav)}
                      className="flex items-center space-x-2 px-2 py-1.5 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      {getFavoriteIcon(fav.entityType)}
                      <span className="truncate">{fav.name || 'Unknown'}</span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Bottom Actions */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-2">
        <div className="space-y-1">
          <Link
            href="/settings"
            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded text-sm ${
              isActive('/settings')
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
