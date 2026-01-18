'use client';

import { useState, useRef, useEffect } from 'react';
import { uploadImage } from '@/lib/imageUpload';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  userId?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
  className?: string;
  rows?: number;
}

interface ToolbarItem {
  label: string;
  icon: string;
  shortcut?: string;
  action: () => void;
  divider?: boolean;
}

/**
 * Simplified markdown editor with auto-save and slash command toolbar
 * Features:
 * - Single textarea (no split view)
 * - Type "/" to show formatting toolbar
 * - Auto-save support with debouncing
 * - Upload images
 */
export function MarkdownEditor({
  value,
  onChange,
  onSave,
  onCancel,
  placeholder = 'Type / for formatting options...',
  userId,
  autoSave = false,
  autoSaveDelay = 1000,
  className = '',
  rows = 5,
}: MarkdownEditorProps) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialValueRef = useRef<string>(value);
  const isInitialMountRef = useRef(true);

  // Auto-save functionality
  useEffect(() => {
    // Skip auto-save on initial mount
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    if (autoSave && onSave) {
      // Only auto-save if value has actually changed
      if (value === initialValueRef.current) {
        return;
      }

      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set new timer
      autoSaveTimerRef.current = setTimeout(async () => {
        setIsSaving(true);
        await onSave();
        setIsSaving(false);
      }, autoSaveDelay);

      // Cleanup
      return () => {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }
      };
    }
  }, [value, autoSave, autoSaveDelay, onSave]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);

    // Show toolbar when "/" is typed at start of line or after whitespace
    if (e.key === '/' && !showToolbar) {
      const lastChar = textBeforeCursor[textBeforeCursor.length - 1];
      if (cursorPosition === 0 || lastChar === '\n' || lastChar === ' ') {
        const rect = textarea.getBoundingClientRect();
        const lineHeight = 20;
        const lines = textBeforeCursor.split('\n').length;

        setToolbarPosition({
          top: rect.top + window.scrollY + (lines * lineHeight),
          left: rect.left + window.scrollX,
        });
        setShowToolbar(true);
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

    // Manual save on Cmd/Ctrl+Enter (if not auto-saving)
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && onSave && !autoSave) {
      e.preventDefault();
      onSave();
    }

    // Close toolbar on other keys
    if (showToolbar && e.key !== '/') {
      setShowToolbar(false);
    }

    // Handle keyboard shortcuts for formatting
    if (e.metaKey || e.ctrlKey) {
      if (e.shiftKey) {
        // Ctrl+Shift+1/2/3 for headings
        if (e.key === '!' || e.key === '1') {
          e.preventDefault();
          insertHeading(1);
        } else if (e.key === '@' || e.key === '2') {
          e.preventDefault();
          insertHeading(2);
        } else if (e.key === '#' || e.key === '3') {
          e.preventDefault();
          insertHeading(3);
        } else if (e.key === '*' || e.key === '8') {
          e.preventDefault();
          insertBulletList();
        } else if (e.key === '(' || e.key === '9') {
          e.preventDefault();
          insertNumberedList();
        } else if (e.key === '&' || e.key === '7') {
          e.preventDefault();
          insertChecklist();
        } else if (e.key === 'U') {
          e.preventDefault();
          fileInputRef.current?.click();
        } else if (e.key === '\\') {
          e.preventDefault();
          insertCodeBlock();
        } else if (e.key === '>' || e.key === '.') {
          e.preventDefault();
          insertBlockquote();
        }
      }
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

  const insertHeading = (level: number) => {
    const hashes = '#'.repeat(level);
    insertAtCursor(`${hashes} `, '', 'Heading');
  };

  const insertBulletList = () => {
    insertAtCursor('- ', '', 'List item');
  };

  const insertNumberedList = () => {
    insertAtCursor('1. ', '', 'List item');
  };

  const insertChecklist = () => {
    insertAtCursor('- [ ] ', '', 'Task item');
  };

  const insertCodeBlock = () => {
    insertAtCursor('```\n', '\n```', 'code');
  };

  const insertBlockquote = () => {
    insertAtCursor('> ', '', 'Quote');
  };

  // Toolbar actions matching the design
  const toolbarItems: ToolbarItem[] = [
    {
      label: 'Heading 1',
      icon: 'H₁',
      shortcut: 'Ctrl ⇧ 1',
      action: () => insertHeading(1),
    },
    {
      label: 'Heading 2',
      icon: 'H₂',
      shortcut: 'Ctrl ⇧ 2',
      action: () => insertHeading(2),
    },
    {
      label: 'Heading 3',
      icon: 'H₃',
      shortcut: 'Ctrl ⇧ 3',
      action: () => insertHeading(3),
      divider: true,
    },
    {
      label: 'Bulleted list',
      icon: '≣',
      shortcut: 'Ctrl ⇧ 8',
      action: insertBulletList,
    },
    {
      label: 'Numbered list',
      icon: '≡',
      shortcut: 'Ctrl ⇧ 9',
      action: insertNumberedList,
    },
    {
      label: 'Checklist',
      icon: '☑',
      shortcut: 'Ctrl ⇧ 7',
      action: insertChecklist,
      divider: true,
    },
    {
      label: 'Insert media...',
      icon: '🖼',
      action: () => fileInputRef.current?.click(),
    },
    {
      label: 'Attach files...',
      icon: '📎',
      shortcut: 'Ctrl ⇧ U',
      action: () => fileInputRef.current?.click(),
      divider: true,
    },
    {
      label: 'Code block',
      icon: '</>',
      shortcut: 'Ctrl ⇧ \\',
      action: insertCodeBlock,
    },
    {
      label: 'Blockquote',
      icon: '❝',
      shortcut: 'Ctrl ⇧ .',
      action: insertBlockquote,
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm resize-y"
      />

      {/* Status indicators */}
      <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-2">
          <span>Type / for formatting</span>
          {userId && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload image'}
            </button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isSaving && <span className="text-blue-600 dark:text-blue-400">Saving...</span>}
          {autoSave ? (
            <span>Press Esc to close</span>
          ) : (
            onSave && <span>Cmd/Ctrl+Enter to save</span>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Slash Command Toolbar */}
      {showToolbar && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowToolbar(false)}
          />

          {/* Toolbar Menu */}
          <div
            className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-2 w-80"
            style={{
              top: toolbarPosition.top,
              left: toolbarPosition.left,
            }}
          >
            {toolbarItems.map((item, index) => (
              <div key={index}>
                <button
                  type="button"
                  onClick={item.action}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg w-6 text-center text-gray-600 dark:text-gray-400">
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.label}
                    </span>
                  </div>
                  {item.shortcut && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                      {item.shortcut}
                    </span>
                  )}
                </button>
                {item.divider && (
                  <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
