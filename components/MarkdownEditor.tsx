'use client';

import { useState, useRef, useEffect } from 'react';
import { MarkdownDisplay } from './MarkdownDisplay';
import { uploadImage } from '@/lib/imageUpload';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  userId?: string; // For image uploads
  minHeight?: string;
  className?: string;
}

interface ToolbarItem {
  label: string;
  action: () => void;
  icon?: string;
  description: string;
}

/**
 * Markdown editor with live preview and slash command toolbar
 * Features:
 * - Split view: textarea on left, live preview on right
 * - Type "/" to show formatting toolbar
 * - Upload images with button
 * - Keyboard shortcuts (Cmd/Ctrl+Enter to save, Esc to cancel)
 */
export function MarkdownEditor({
  value,
  onChange,
  onSave,
  onCancel,
  placeholder = 'Type / for formatting options...',
  userId,
  minHeight = '200px',
  className = '',
}: MarkdownEditorProps) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect "/" key to show toolbar
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Show toolbar when "/" is typed
    if (e.key === '/' && !showToolbar) {
      const textarea = textareaRef.current;
      if (textarea) {
        const cursorPosition = textarea.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPosition);
        const lastChar = textBeforeCursor[textBeforeCursor.length - 1];

        // Only show if "/" is at start of line or after whitespace
        if (cursorPosition === 0 || lastChar === '\n' || lastChar === ' ') {
          // Calculate position for toolbar popup
          const rect = textarea.getBoundingClientRect();
          setToolbarPosition({
            top: rect.top + window.scrollY + 20,
            left: rect.left + window.scrollX,
          });
          setShowToolbar(true);
        }
      }
    }

    // Hide toolbar on Escape
    if (e.key === 'Escape') {
      if (showToolbar) {
        setShowToolbar(false);
        e.preventDefault();
        e.stopPropagation();
      } else if (onCancel) {
        onCancel();
      }
    }

    // Save on Cmd/Ctrl+Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && onSave) {
      e.preventDefault();
      onSave();
    }

    // Close toolbar on other keys
    if (showToolbar && e.key !== '/') {
      setShowToolbar(false);
    }
  };

  // Insert formatted text at cursor position
  const insertAtCursor = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;

    // Remove the "/" character if it was typed
    let actualStart = start;
    if (value[start - 1] === '/') {
      actualStart = start - 1;
    }

    const newText =
      value.substring(0, actualStart) +
      before +
      textToInsert +
      after +
      value.substring(end);

    onChange(newText);
    setShowToolbar(false);

    // Set cursor position after insertion
    setTimeout(() => {
      const newCursorPos = actualStart + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  // Toolbar actions
  const toolbarItems: ToolbarItem[] = [
    {
      label: 'Bold',
      icon: '**B**',
      description: 'Make text bold',
      action: () => insertAtCursor('**', '**', 'bold text'),
    },
    {
      label: 'Italic',
      icon: '*I*',
      description: 'Make text italic',
      action: () => insertAtCursor('*', '*', 'italic text'),
    },
    {
      label: 'Heading',
      icon: 'H1',
      description: 'Create a heading',
      action: () => insertAtCursor('## ', '', 'Heading'),
    },
    {
      label: 'Link',
      icon: '🔗',
      description: 'Insert a link',
      action: () => insertAtCursor('[', '](url)', 'link text'),
    },
    {
      label: 'Image',
      icon: '🖼️',
      description: 'Insert an image',
      action: () => insertAtCursor('![', '](image-url)', 'alt text'),
    },
    {
      label: 'Bullet List',
      icon: '•',
      description: 'Create a bullet list',
      action: () => insertAtCursor('- ', '', 'list item'),
    },
    {
      label: 'Numbered List',
      icon: '1.',
      description: 'Create a numbered list',
      action: () => insertAtCursor('1. ', '', 'list item'),
    },
    {
      label: 'Quote',
      icon: '❝',
      description: 'Insert a blockquote',
      action: () => insertAtCursor('> ', '', 'quote'),
    },
    {
      label: 'Code',
      icon: '< >',
      description: 'Insert code block',
      action: () => insertAtCursor('`', '`', 'code'),
    },
  ];

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    try {
      setIsUploading(true);
      const imageUrl = await uploadImage(file, userId);

      // Insert image markdown at cursor
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newText =
          value.substring(0, start) +
          `![${file.name}](${imageUrl})` +
          value.substring(end);
        onChange(newText);

        // Set cursor position after image
        setTimeout(() => {
          const newCursorPos = start + `![${file.name}](${imageUrl})`.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          textarea.focus();
        }, 0);
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Split View Container */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left: Editor */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm resize-y font-mono"
            style={{ minHeight }}
          />

          {/* Helper Text */}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-3">
              <span>Type / for formatting</span>
              {userId && (
                <>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                  >
                    {isUploading ? 'Uploading...' : 'Upload image'}
                  </button>
                </>
              )}
            </div>
            {onSave && (
              <span>Cmd/Ctrl+Enter to save, Esc to cancel</span>
            )}
          </div>

          {/* Hidden file input for image upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Right: Live Preview */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 overflow-y-auto bg-gray-50 dark:bg-gray-900" style={{ minHeight }}>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
            Preview
          </div>
          {value ? (
            <MarkdownDisplay content={value} />
          ) : (
            <div className="text-sm text-gray-400 dark:text-gray-500 italic">
              Nothing to preview yet...
            </div>
          )}
        </div>
      </div>

      {/* Slash Command Toolbar */}
      {showToolbar && (
        <>
          {/* Backdrop to close toolbar */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowToolbar(false)}
          />

          {/* Toolbar Menu */}
          <div
            className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 w-64"
            style={{
              top: toolbarPosition.top,
              left: toolbarPosition.left,
            }}
          >
            <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 mb-1">
              Formatting
            </div>
            {toolbarItems.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={item.action}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 group"
              >
                <span className="text-sm font-mono text-gray-500 dark:text-gray-400 w-10">
                  {item.icon}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {item.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
