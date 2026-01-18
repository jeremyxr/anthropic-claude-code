'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeSanitize from 'rehype-sanitize';
import { useMemo } from 'react';

interface MarkdownDisplayProps {
  content: string;
  className?: string;
}

/**
 * Component for rendering markdown content with GitHub Flavored Markdown support.
 * Features:
 * - Inline images ![alt](url)
 * - Line breaks (Enter key creates new line)
 * - Bold, italic, links, lists, tables
 * - Blockquotes and task lists
 * - Sanitized output (XSS protection)
 */
export function MarkdownDisplay({ content, className = '' }: MarkdownDisplayProps) {
  // Memoize markdown parsing for performance
  const processedContent = useMemo(() => {
    if (!content || content.trim() === '') return '';
    return content;
  }, [content]);

  if (!processedContent) {
    return null;
  }

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          // Paragraph styling
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 text-gray-900 dark:text-white leading-relaxed">
              {children}
            </p>
          ),

          // Headings
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-3 mt-4 first:mt-0 text-gray-900 dark:text-white">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold mb-3 mt-4 first:mt-0 text-gray-900 dark:text-white">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-bold mb-2 mt-3 first:mt-0 text-gray-900 dark:text-white">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-bold mb-2 mt-3 first:mt-0 text-gray-900 dark:text-white">
              {children}
            </h4>
          ),

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {children}
            </a>
          ),

          // Images - responsive and styled
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt || ''}
              className="max-w-full h-auto rounded-lg my-3 border border-gray-200 dark:border-gray-700"
              loading="lazy"
            />
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-3 space-y-1 text-gray-900 dark:text-white">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-900 dark:text-white">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-900 dark:text-white leading-relaxed">
              {children}
            </li>
          ),

          // Code blocks
          code: ({ inline, children }: any) => {
            if (inline) {
              return (
                <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-gray-900 dark:text-white">
                  {children}
                </code>
              );
            }
            return (
              <code className="block px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-mono overflow-x-auto mb-3 text-gray-900 dark:text-white">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-3 overflow-x-auto">{children}</pre>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1 mb-3 italic text-gray-700 dark:text-gray-300">
              {children}
            </blockquote>
          ),

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {children}
            </tbody>
          ),
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => (
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
              {children}
            </td>
          ),

          // Horizontal rule
          hr: () => (
            <hr className="my-4 border-gray-200 dark:border-gray-700" />
          ),

          // Strong (bold)
          strong: ({ children }) => (
            <strong className="font-bold text-gray-900 dark:text-white">
              {children}
            </strong>
          ),

          // Emphasis (italic)
          em: ({ children }) => (
            <em className="italic text-gray-900 dark:text-white">{children}</em>
          ),

          // Strikethrough
          del: ({ children }) => (
            <del className="line-through text-gray-600 dark:text-gray-400">
              {children}
            </del>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
