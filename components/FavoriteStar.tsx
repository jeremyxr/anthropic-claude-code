'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useUser } from '@/lib/user-context';

interface FavoriteStarProps {
  entityType: 'initiative' | 'project' | 'milestone' | 'deliverable';
  entityId: string;
  className?: string;
  onToggle?: (isFavorited: boolean) => void;
}

export function FavoriteStar({ entityType, entityId, className = '', onToggle }: FavoriteStarProps) {
  const { currentUser, currentTeam } = useUser();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      checkFavoriteStatus();
    }
  }, [currentUser, entityType, entityId]);

  const checkFavoriteStatus = async () => {
    if (!currentUser) return;

    try {
      const favorited = await api.isFavorite(currentUser.id, entityType, entityId);
      setIsFavorited(favorited);
    } catch (err) {
      console.error('Failed to check favorite status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      alert('You must be logged in to favorite items');
      return;
    }

    // Optimistic update
    const previousState = isFavorited;
    setIsFavorited(!isFavorited);

    try {
      if (isFavorited) {
        // Remove from favorites
        await api.removeFavorite(currentUser.id, entityType, entityId);
        onToggle?.(false);
      } else {
        // Add to favorites
        await api.addFavorite({
          userId: currentUser.id,
          entityType,
          entityId,
          teamId: currentTeam?.id || null,
        });
        onToggle?.(true);
      }
    } catch (err: any) {
      // Revert optimistic update on error
      setIsFavorited(previousState);
      console.error('Failed to toggle favorite:', err);

      // Handle specific errors gracefully
      if (err.code === 'PGRST205') {
        alert('Favorites feature is not yet set up. Please run the database migration: 009_favorites.sql');
      } else if (err.code === '23505') {
        // Unique constraint violation - item is already favorited, just update state
        setIsFavorited(true);
      } else {
        alert('Failed to update favorite. Please try again.');
      }
    }
  };

  if (isLoading || !currentUser) {
    return null; // Don't show anything while loading or if not logged in
  }

  return (
    <button
      onClick={handleToggle}
      className={`inline-flex items-center justify-center transition-colors ${className}`}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isFavorited ? (
        // Filled star
        <svg
          className="w-4 h-4 text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ) : (
        // Empty star
        <svg
          className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      )}
    </button>
  );
}
