'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Deliverable, Milestone, Project, Initiative, TeamMember, Comment } from '@/lib/api';
import { InlineEdit, InlineSelect, InlineDate } from '@/components/InlineEdit';
import { MarkdownDisplay } from '@/components/MarkdownDisplay';
import { useUser } from '@/lib/user-context';
import { useSettings } from '@/lib/settings-context';
import { FavoriteStar } from '@/components/FavoriteStar';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { currentUser, currentTeam } = useUser();
  const { getStatusesByEntity, priorities: teamPriorities } = useSettings();

  const [task, setTask] = useState<Deliverable | null>(null);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [initiative, setInitiative] = useState<Initiative | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyingToParentId, setReplyingToParentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, retryCount]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get task with full context
      const context = await api.getDeliverableWithContext(id);
      setTask(context.deliverable);
      setMilestone(context.milestone);
      setProject(context.project);
      setInitiative(context.initiative);

      // Load team members if we have a team
      if (currentTeam) {
        const members = await api.getTeamMembers(currentTeam.id);
        setTeamMembers(members);
      }

      // Load comments (gracefully handle if table doesn't exist yet)
      try {
        const taskComments = await api.getComments(id);
        setComments(taskComments);
      } catch (commentErr: any) {
        // If comments table doesn't exist (PGRST205), just skip loading comments
        // This allows the task to load even if the migration hasn't been run yet
        if (commentErr.code === 'PGRST205') {
          console.warn('Comments table not found. Run migration 004_comments_and_notifications.sql');
          setComments([]);
        } else {
          // For other errors, log but don't fail the entire page
          console.error('Failed to load comments:', commentErr);
          setComments([]);
        }
      }
    } catch (err: any) {
      console.error('Failed to load task:', err);

      // Handle different error types
      if (err.code === 'PGRST116') {
        setError('Task not found. It may have been deleted.');
      } else if (err.message?.includes('Network')) {
        setError('Network error. Please check your connection and try again.');
      } else if (err.message?.includes('permission')) {
        setError('You do not have permission to view this task.');
      } else {
        setError('Failed to load task. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateTaskField = async (field: string, value: any) => {
    if (!currentUser) {
      alert('You must be logged in to edit tasks');
      throw new Error('Not authenticated');
    }

    try {
      const updatedTask = await api.updateDeliverable(id, {
        [field]: value,
        updatedBy: currentUser.id
      });
      // Direct state update - no refetch! This eliminates the flicker
      setTask(updatedTask);
    } catch (err: any) {
      console.error(`Failed to update ${field}:`, err);

      // Only refetch on conflict - handle concurrent edit conflicts
      if (err.message?.includes('conflict') || err.code === '409') {
        alert('This task was modified by someone else. Reloading latest version...');
        await loadData();
      } else if (err.message?.includes('permission')) {
        alert('You do not have permission to edit this task.');
      } else {
        alert(`Failed to update ${field}. Please try again.`);
      }

      throw err;
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteDeliverable(id);
      // Navigate back to project page
      router.push(`/projects/${project?.id}`);
    } catch (err: any) {
      console.error('Failed to delete task:', err);
      if (err.message?.includes('permission')) {
        alert('You do not have permission to delete this task.');
      } else if (err.message?.includes('foreign key')) {
        alert('Cannot delete task because it has dependencies. Please remove them first.');
      } else {
        alert('Failed to delete task. Please try again.');
      }
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);

    // Check for @ mentions
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Only show mentions if there's no space after @ and @ is either at start or preceded by space
      if (!textAfterAt.includes(' ') && (lastAtIndex === 0 || value[lastAtIndex - 1] === ' ')) {
        setMentionSearch(textAfterAt);
        setMentionPosition(lastAtIndex);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const handleMentionSelect = (member: TeamMember) => {
    const beforeMention = newComment.slice(0, mentionPosition);
    const afterMention = newComment.slice(mentionPosition + mentionSearch.length + 1);
    setNewComment(`${beforeMention}@${member.user?.name}${afterMention}`);
    setShowMentions(false);
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionedName = match[1];
      // Find user ID by name
      const member = teamMembers.find(m =>
        m.user?.name.toLowerCase() === mentionedName.toLowerCase()
      );
      if (member) {
        mentions.push(member.userId);
      }
    }

    return mentions;
  };

  const handleReply = (comment: Comment) => {
    // If replying to a reply, use the parent's ID instead (maintain 1 layer only)
    const parentId = comment.parentCommentId || comment.id;
    setReplyingToParentId(parentId);
    setReplyingToCommentId(comment.id);
  };

  const handleCancelReply = () => {
    setReplyingToCommentId(null);
    setReplyingToParentId(null);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const mentions = extractMentions(newComment);

      // Create the comment (with parentCommentId if replying)
      const comment = await api.createComment({
        deliverableId: id,
        userId: currentUser.id,
        content: newComment,
        mentions,
        parentCommentId: replyingToParentId,
      });

      // Create notifications for mentioned users
      if (mentions.length > 0) {
        await Promise.all(
          mentions.map(userId =>
            api.createNotification({
              userId,
              type: 'mention',
              title: `${currentUser.name} mentioned you in a comment`,
              message: newComment,
              relatedCommentId: comment.id,
              relatedDeliverableId: id,
              relatedUserId: currentUser.id,
              isRead: false,
            })
          )
        );
      }

      // Reload comments
      const taskComments = await api.getComments(id);
      setComments(taskComments);
      setNewComment('');
      setReplyingToCommentId(null);
      setReplyingToParentId(null);
    } catch (err: any) {
      console.error('Failed to submit comment:', err);
      if (err.code === 'PGRST205') {
        alert('Comments feature is not yet set up. Please run the database migration: 004_comments_and_notifications.sql');
      } else {
        alert('Failed to submit comment. Please try again.');
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'in-review':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'done':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'blocked':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getOwnerName = (userId: string | null) => {
    if (!userId) return 'Unassigned';
    const member = teamMembers.find(m => m.userId === userId);
    return member?.user?.name || member?.user?.email || 'Unknown';
  };

  // Get options from centralized settings
  const statusOptions = getStatusesByEntity('deliverable').map(s => ({ value: s.statusValue, label: s.label }));
  const priorityOptions = teamPriorities.map(p => ({ value: p.priorityValue, label: p.label }));

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading task...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-950">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {error}
          </h3>
          <div className="flex justify-center space-x-3 mt-4">
            <button
              onClick={() => setRetryCount(prev => prev + 1)}
              className="px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
            >
              Retry
            </button>
            <button
              onClick={() => router.back()}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No data state (shouldn't happen if no error, but defensive)
  if (!task || !milestone || !project || !initiative) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-950">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Task not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-950">
      {/* Header with breadcrumb */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-8 py-3">
        <div className="flex items-center space-x-2">
          <FavoriteStar entityType="deliverable" entityId={id} />
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <Link href="/initiatives" className="hover:text-gray-900 dark:hover:text-gray-100">
              Initiatives
            </Link>
            <span>/</span>
            <Link href={`/initiatives/${initiative.id}`} className="hover:text-gray-900 dark:hover:text-gray-100">
              {initiative.name}
            </Link>
            <span>/</span>
            <Link href={`/projects/${project.id}`} className="hover:text-gray-900 dark:hover:text-gray-100">
              {project.name}
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white font-medium">{task.name}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-3xl">
            {/* Task Title */}
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              <InlineEdit
                value={task.name}
                onSave={(value) => updateTaskField('name', value)}
                className="text-2xl font-semibold"
                displayClassName="text-2xl font-semibold"
              />
            </h1>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Description
              </h3>
              <div className="text-sm text-gray-900 dark:text-white">
                <InlineEdit
                  value={task.description || ''}
                  onSave={(value) => updateTaskField('description', value)}
                  multiline
                  markdown
                  userId={currentUser?.id}
                  placeholder="Add a description (supports markdown)..."
                  displayClassName="text-sm"
                />
              </div>
            </div>

            {/* Activity Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Activity
                </h3>
              </div>
              <div className="space-y-3">
                {/* Created event */}
                <div className="flex items-start space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Task created</span>
                    {' · '}
                    {new Date(task.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {/* Last updated event */}
                {task.updatedAt !== task.createdAt && (
                  <div className="flex items-start space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Last updated</span>
                      {' · '}
                      {new Date(task.updatedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                )}

                {/* Comments Section */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">
                    Comments
                  </h4>

                  {/* Existing Comments */}
                  <div className="space-y-4 mb-4">
                    {comments.map((comment) => (
                      <div key={comment.id}>
                        {/* Top-level comment */}
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                            {comment.user?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {comment.user?.name || 'Unknown'}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(comment.createdAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              <MarkdownDisplay content={comment.content} />
                            </div>
                            <button
                              onClick={() => handleReply(comment)}
                              className="mt-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              Reply
                            </button>
                          </div>
                        </div>

                        {/* Replies (nested) */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="ml-11 mt-3 space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex items-start space-x-3">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                                  {reply.user?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {reply.user?.name || 'Unknown'}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {new Date(reply.createdAt).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-700 dark:text-gray-300">
                                    <MarkdownDisplay content={reply.content} />
                                  </div>
                                  <button
                                    onClick={() => handleReply(reply)}
                                    className="mt-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                  >
                                    Reply
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Comment Form */}
                  <form onSubmit={handleSubmitComment}>
                    {/* Reply indicator */}
                    {replyingToCommentId && (
                      <div className="mb-2 flex items-center justify-between px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
                        <span className="text-blue-700 dark:text-blue-300">
                          Replying to {comments.find(c => c.id === replyingToCommentId || c.replies?.find(r => r.id === replyingToCommentId))?.user?.name ||
                          comments.flatMap(c => c.replies || []).find(r => r.id === replyingToCommentId)?.user?.name || 'comment'}
                        </span>
                        <button
                          type="button"
                          onClick={handleCancelReply}
                          className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    <div className="relative">
                      <textarea
                        value={newComment}
                        onChange={handleCommentChange}
                        placeholder={replyingToCommentId ? "Write a reply... (use @ to mention someone)" : "Leave a comment... (use @ to mention someone)"}
                        rows={3}
                        className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                        disabled={!currentUser}
                      />

                      {/* Mention Dropdown */}
                      {showMentions && (
                        <div className="absolute bottom-full mb-1 left-0 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg max-h-48 overflow-y-auto z-10">
                          {teamMembers
                            .filter(m =>
                              m.user?.name.toLowerCase().includes(mentionSearch.toLowerCase())
                            )
                            .map((member) => (
                              <button
                                key={member.id}
                                type="button"
                                onClick={() => handleMentionSelect(member)}
                                className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                              >
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                                  {member.user?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {member.user?.name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {member.user?.email}
                                  </div>
                                </div>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!currentUser || !newComment.trim() || isSubmittingComment}
                      className="mt-2 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingComment ? 'Posting...' : 'Comment'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Sidebar */}
        <div className="w-80 border-l border-gray-200 dark:border-gray-800 overflow-y-auto px-6 py-6">
          <h2 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-4">
            Properties
          </h2>

          <div className="space-y-4">
            {/* Status */}
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Status</div>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                <InlineSelect
                  value={task.status}
                  options={statusOptions}
                  onSave={(value) => updateTaskField('status', value)}
                  displayClassName="font-medium"
                />
              </span>
            </div>

            {/* Priority */}
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Priority</div>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                <InlineSelect
                  value={task.priority}
                  options={priorityOptions}
                  onSave={(value) => updateTaskField('priority', value)}
                  displayClassName="font-medium"
                />
              </span>
            </div>

            {/* Assignee */}
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Assignee</div>
              <div className="text-sm text-gray-900 dark:text-white">
                <InlineSelect
                  value={task.assignee || ''}
                  options={[
                    { value: '', label: 'Unassigned' },
                    ...teamMembers.map(m => ({
                      value: m.userId,
                      label: m.user?.name || m.user?.email || 'Unknown'
                    }))
                  ]}
                  onSave={(value) => updateTaskField('assignee', value || null)}
                  getDisplayValue={(value) => getOwnerName(value || null)}
                />
              </div>
            </div>

            {/* Due Date */}
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Due Date</div>
              <div className="text-sm text-gray-900 dark:text-white">
                <InlineDate
                  value={task.dueDate}
                  onSave={(value) => updateTaskField('dueDate', value)}
                  placeholder="No due date"
                />
              </div>
            </div>

            {/* Milestone */}
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Milestone</div>
              <Link
                href={`/projects/${project.id}`}
                className="text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{milestone.name}</span>
              </Link>
            </div>

            {/* Project */}
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Project</div>
              <Link
                href={`/projects/${project.id}`}
                className="text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span>{project.name}</span>
              </Link>
            </div>

            {/* Initiative */}
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Initiative</div>
              <Link
                href={`/initiatives/${initiative.id}`}
                className="text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{initiative.name}</span>
              </Link>
            </div>

            {/* Tags */}
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Labels</div>
              {task.labels && task.labels.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {task.labels.map((label, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">No labels</p>
              )}
            </div>

            {/* Delete Button */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={handleDelete}
                className="w-full px-3 py-1.5 border border-red-200 dark:border-red-900 rounded text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
