'use client';

interface SaveIndicatorProps {
  state: 'idle' | 'saving' | 'saved' | 'error';
}

export function SaveIndicator({ state }: SaveIndicatorProps) {
  if (state === 'idle') return null;

  return (
    <div className="flex items-center justify-center w-5 h-5">
      {state === 'saving' && (
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      )}

      {state === 'saved' && (
        <svg
          className="w-4 h-4 text-green-500 animate-fade-out"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}

      {state === 'error' && (
        <svg
          className="w-4 h-4 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
    </div>
  );
}
