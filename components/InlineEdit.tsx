'use client';

import { useState, useEffect, useRef } from 'react';
import { MarkdownDisplay } from './MarkdownDisplay';
import { MarkdownEditor } from './MarkdownEditor';

interface InlineEditProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  multiline?: boolean;
  markdown?: boolean;
  placeholder?: string;
  className?: string;
  displayClassName?: string;
  userId?: string; // Required for image uploads in markdown mode
}

export function InlineEdit({
  value,
  onSave,
  multiline = false,
  markdown = false,
  placeholder = 'Click to edit',
  className = '',
  displayClassName = '',
  userId
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (multiline && inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.select();
      } else if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing, multiline]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = async () => {
    if (editValue.trim() === value.trim()) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue.trim());
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save:', err);
      setEditValue(value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Enter' && multiline && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    // Markdown editing mode with live preview
    if (markdown) {
      return (
        <div className="relative">
          <MarkdownEditor
            value={editValue}
            onChange={setEditValue}
            onSave={handleSave}
            onCancel={handleCancel}
            placeholder={placeholder}
            userId={userId}
            minHeight="300px"
          />
        </div>
      );
    }

    // Regular multiline editing mode
    if (multiline) {
      return (
        <div className="relative">
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            disabled={isSaving}
            rows={3}
            className={`w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white ${className}`}
            placeholder={placeholder}
          />
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Press Cmd/Ctrl+Enter to save, Esc to cancel
          </div>
        </div>
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        disabled={isSaving}
        className={`w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white ${className}`}
        placeholder={placeholder}
      />
    );
  }

  // Display mode
  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded px-1 -mx-1 transition-colors ${displayClassName}`}
      title="Click to edit"
    >
      {markdown && value ? (
        <MarkdownDisplay content={value} />
      ) : value ? (
        value
      ) : (
        <span className="text-gray-400 italic">{placeholder}</span>
      )}
    </div>
  );
}

interface InlineSelectProps {
  value: string;
  options: { value: string; label: string }[];
  onSave: (value: string) => Promise<void>;
  displayClassName?: string;
  getDisplayValue?: (value: string) => string;
}

export function InlineSelect({
  value,
  options,
  onSave,
  displayClassName = '',
  getDisplayValue
}: InlineSelectProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save:', err);
      setEditValue(value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const displayValue = getDisplayValue
    ? getDisplayValue(value)
    : options.find(opt => opt.value === value)?.label || value;

  if (isEditing) {
    return (
      <select
        ref={selectRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        disabled={isSaving}
        className="px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded px-1 -mx-1 transition-colors inline-block ${displayClassName}`}
      title="Click to edit"
    >
      {displayValue}
    </div>
  );
}

interface InlineDateProps {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  displayClassName?: string;
  placeholder?: string;
}

export function InlineDate({
  value,
  onSave,
  displayClassName = '',
  placeholder = 'No date set'
}: InlineDateProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleSave = async () => {
    const normalizedValue = editValue || null;
    const normalizedOriginal = value || null;

    if (normalizedValue === normalizedOriginal) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(normalizedValue);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save:', err);
      setEditValue(value || '');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const displayValue = value
    ? new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : placeholder;

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="date"
        value={editValue ? editValue.split('T')[0] : ''}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        disabled={isSaving}
        className="px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded px-1 -mx-1 transition-colors inline-block ${displayClassName}`}
      title="Click to edit"
    >
      {value ? displayValue : <span className="text-gray-400 italic">{displayValue}</span>}
    </div>
  );
}
