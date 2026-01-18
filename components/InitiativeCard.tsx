import Link from 'next/link';
import StatusBadge from './StatusBadge';
import { Initiative } from '@/lib/api';
import { MarkdownDisplay } from './MarkdownDisplay';

interface InitiativeCardProps {
  initiative: Initiative;
}

export default function InitiativeCard({ initiative }: InitiativeCardProps) {
  return (
    <Link href={`/initiatives/${initiative.id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{initiative.name}</h3>
          <StatusBadge status={initiative.status} type="initiative" />
        </div>

        <div className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
          {initiative.description ? (
            <MarkdownDisplay content={initiative.description} />
          ) : (
            <span className="text-gray-400 italic">No description</span>
          )}
        </div>

        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          <div>
            {initiative.owner && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {initiative.owner}
              </div>
            )}
          </div>
          <div>
            {initiative.targetDate && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(initiative.targetDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
