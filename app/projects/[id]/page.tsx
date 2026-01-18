'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, Project, Milestone, Deliverable, TeamMember } from '@/lib/api';
import { InlineEdit, InlineSelect, InlineDate } from '@/components/InlineEdit';
import { useUser } from '@/lib/user-context';
import { useSettings } from '@/lib/settings-context';

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { currentUser, currentTeam } = useUser();
  const { getStatusesByEntity, priorities: teamPriorities } = useSettings();

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [deliverables, setDeliverables] = useState<Record<string, Deliverable[]>>({});
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const [milestoneFormData, setMilestoneFormData] = useState({
    name: '',
    description: '',
    status: 'not-started' as const,
    dueDate: '',
  });

  const [taskFormData, setTaskFormData] = useState({
    name: '',
    description: '',
    status: 'todo' as const,
    type: '',
    assignee: '',
    priority: 'medium' as const,
    dueDate: '',
    labels: '',
  });

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const projectData = await api.getProject(id);
      setProject(projectData);

      const milestonesData = await api.getMilestones(id);
      setMilestones(milestonesData);

      if (currentTeam) {
        const members = await api.getTeamMembers(currentTeam.id);
        setTeamMembers(members);
      }

      const deliverablesMap: Record<string, Deliverable[]> = {};
      for (const milestone of milestonesData) {
        const items = await api.getDeliverables(milestone.id);
        deliverablesMap[milestone.id] = items;
      }
      setDeliverables(deliverablesMap);
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProjectField = async (field: string, value: any) => {
    try {
      await api.updateProject(id, {
        [field]: value,
        updatedBy: currentUser?.id
      });
      await loadData();
    } catch (err) {
      console.error(`Failed to update project ${field}:`, err);
      throw err;
    }
  };

  const updateMilestoneField = async (milestoneId: string, field: string, value: any) => {
    try {
      await api.updateMilestone(milestoneId, {
        [field]: value,
        updatedBy: currentUser?.id
      });
      await loadData();
    } catch (err) {
      console.error(`Failed to update milestone ${field}:`, err);
      throw err;
    }
  };

  const updateTaskField = async (taskId: string, field: string, value: any) => {
    try {
      await api.updateDeliverable(taskId, {
        [field]: value,
        updatedBy: currentUser?.id
      });
      await loadData();
    } catch (err) {
      console.error(`Failed to update task ${field}:`, err);
      throw err;
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMilestone({
        ...milestoneFormData,
        projectId: id,
        dueDate: milestoneFormData.dueDate || null,
        createdBy: currentUser?.id
      });
      setShowMilestoneModal(false);
      setMilestoneFormData({
        name: '',
        description: '',
        status: 'not-started',
        dueDate: '',
      });
      loadData();
    } catch (err) {
      console.error('Failed to create milestone:', err);
      alert('Failed to create milestone');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const labelsArray = taskFormData.labels
        ? taskFormData.labels.split(',').map(label => label.trim()).filter(Boolean)
        : [];

      await api.createDeliverable({
        name: taskFormData.name,
        description: taskFormData.description || undefined,
        status: taskFormData.status,
        type: taskFormData.type || undefined,
        assignee: taskFormData.assignee || null,
        priority: taskFormData.priority,
        dueDate: taskFormData.dueDate || null,
        labels: labelsArray,
        milestoneId: selectedMilestoneId,
        createdBy: currentUser?.id
      });
      setShowTaskModal(false);
      setTaskFormData({
        name: '',
        description: '',
        status: 'todo',
        type: '',
        assignee: '',
        priority: 'medium',
        dueDate: '',
        labels: '',
      });
      setSelectedMilestoneId('');
      loadData();
    } catch (err) {
      console.error('Failed to create task:', err);
      alert('Failed to create task');
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this milestone? This will also delete all tasks in it.')) {
      return;
    }
    try {
      await api.deleteMilestone(milestoneId);
      await loadData();
    } catch (err) {
      console.error('Failed to delete milestone:', err);
      alert('Failed to delete milestone');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }
    try {
      await api.deleteDeliverable(taskId);
      await loadData();
    } catch (err) {
      console.error('Failed to delete task:', err);
      alert('Failed to delete task');
    }
  };

  const toggleTaskExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'not-started': 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
      'todo': 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
      'in-progress': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      'in-review': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
      'completed': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      'done': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      'blocked': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      'at-risk': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      'on-hold': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    };
    return colors[status] || colors['not-started'];
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'critical': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      'high': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
      'medium': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
      'low': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    };
    return colors[priority] || colors['medium'];
  };

  const getMilestoneProgress = (milestoneId: string) => {
    const tasks = deliverables[milestoneId] || [];
    if (tasks.length === 0) return { completed: 0, total: 0, percentage: 0 };
    const completed = tasks.filter(t => t.status === 'done').length;
    const percentage = Math.round((completed / tasks.length) * 100);
    return { completed, total: tasks.length, percentage };
  };

  const getProjectProgress = () => {
    let totalTasks = 0;
    let completedTasks = 0;
    Object.values(deliverables).forEach(tasks => {
      totalTasks += tasks.length;
      completedTasks += tasks.filter(t => t.status === 'done').length;
    });
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { completed: completedTasks, total: totalTasks, percentage };
  };

  const getOwnerName = (userId: string | null) => {
    if (!userId) return null;
    const member = teamMembers.find(m => m.userId === userId);
    return member?.user?.name || member?.user?.email || userId;
  };

  // Get status options from centralized settings
  const projectStatusOptions = getStatusesByEntity('project').map(s => ({ value: s.statusValue, label: s.label }));
  const milestoneStatusOptions = getStatusesByEntity('milestone').map(s => ({ value: s.statusValue, label: s.label }));
  const taskStatusOptions = getStatusesByEntity('deliverable').map(s => ({ value: s.statusValue, label: s.label }));

  // Get priority options from centralized settings
  const priorityOptions = teamPriorities.map(p => ({ value: p.priorityValue, label: p.label }));

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  const progress = getProjectProgress();

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="px-8 py-3">
          {/* Breadcrumb */}
          <Link href="/initiatives" className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-3">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Initiatives
          </Link>

          {/* Project Title and Properties */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 mr-4">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                <InlineEdit
                  value={project.name}
                  onSave={(value) => updateProjectField('name', value)}
                  className="text-2xl font-semibold"
                  displayClassName="text-2xl font-semibold"
                />
              </h1>
              {(project.description || true) && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <InlineEdit
                    value={project.description || ''}
                    onSave={(value) => updateProjectField('description', value)}
                    multiline
                    markdown
                    userId={currentUser?.id}
                    placeholder="Add a description (supports markdown)"
                    className="text-sm"
                    displayClassName="text-sm"
                  />
                </div>
              )}

              {/* Inline Properties */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                  <InlineSelect
                    value={project.status}
                    options={projectStatusOptions}
                    onSave={(value) => updateProjectField('status', value)}
                    displayClassName="font-medium"
                  />
                </span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  👤 <InlineSelect
                    value={project.assignee || ''}
                    options={[
                      { value: '', label: 'No assignee' },
                      ...teamMembers.map(m => ({
                        value: m.userId,
                        label: m.user?.name || m.user?.email || 'Unknown'
                      }))
                    ]}
                    onSave={(value) => updateProjectField('assignee', value || null)}
                    getDisplayValue={(value) => getOwnerName(value || null) || 'No assignee'}
                    displayClassName="inline"
                  />
                </span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  🎯 <InlineDate
                    value={project.targetDeliveryDate}
                    onSave={(value) => updateProjectField('targetDeliveryDate', value)}
                    placeholder="No target date"
                    displayClassName="inline"
                  />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-8 py-6">
            {/* Milestones */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Milestones ({milestones.length})</h3>
                <button
                  onClick={() => setShowMilestoneModal(true)}
                  className="flex items-center space-x-1.5 px-2.5 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Milestone</span>
                </button>
              </div>

              <div className="space-y-3">
                {milestones.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">No milestones yet</p>
                    <button
                      onClick={() => setShowMilestoneModal(true)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Create Milestone</span>
                    </button>
                  </div>
                ) : (
                  milestones.map((milestone) => {
                    const progress = getMilestoneProgress(milestone.id);
                    const tasks = deliverables[milestone.id] || [];

                    return (
                      <div key={milestone.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0 mr-4">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                <InlineEdit
                                  value={milestone.name}
                                  onSave={(value) => updateMilestoneField(milestone.id, 'name', value)}
                                  displayClassName="font-medium"
                                />
                              </h4>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {progress.completed}/{progress.total} · {progress.percentage}%
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              <InlineEdit
                                value={milestone.description || ''}
                                onSave={(value) => updateMilestoneField(milestone.id, 'description', value)}
                                multiline
                                placeholder="Add a description"
                                displayClassName="text-xs"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(milestone.status)}`}>
                                <InlineSelect
                                  value={milestone.status}
                                  options={milestoneStatusOptions}
                                  onSave={(value) => updateMilestoneField(milestone.id, 'status', value)}
                                  displayClassName="font-medium"
                                />
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                📅 <InlineDate
                                  value={milestone.dueDate}
                                  onSave={(value) => updateMilestoneField(milestone.id, 'dueDate', value)}
                                  placeholder="No due date"
                                  displayClassName="inline"
                                />
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedMilestoneId(milestone.id);
                                setShowTaskModal(true);
                              }}
                              className="px-2.5 py-1 border border-gray-200 dark:border-gray-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              + Add task
                            </button>
                            <button
                              onClick={() => handleDeleteMilestone(milestone.id)}
                              className="px-2.5 py-1 border border-red-200 dark:border-red-800 rounded text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 mb-3">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${progress.percentage}%` }}
                          ></div>
                        </div>

                        {/* Tasks */}
                        {tasks.length > 0 && (
                          <div className="space-y-2 mt-3">
                            {tasks.map((task) => {
                              const isExpanded = expandedTasks.has(task.id);
                              return (
                                <div key={task.id} className="border border-gray-100 dark:border-gray-800 rounded p-2">
                                  <div className="flex items-start space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={task.status === 'done'}
                                      onChange={() => updateTaskField(task.id, 'status', task.status === 'done' ? 'todo' : 'done')}
                                      className="w-4 h-4 rounded border-gray-300 mt-0.5 cursor-pointer"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div
                                        className="cursor-pointer"
                                        onClick={() => toggleTaskExpanded(task.id)}
                                      >
                                        <span className={`text-sm ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                                          <InlineEdit
                                            value={task.name}
                                            onSave={(value) => updateTaskField(task.id, 'name', value)}
                                            displayClassName="text-sm"
                                          />
                                        </span>
                                      </div>

                                      {isExpanded && (
                                        <div className="mt-3 space-y-2 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                                          <div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Description</div>
                                            <InlineEdit
                                              value={task.description || ''}
                                              onSave={(value) => updateTaskField(task.id, 'description', value)}
                                              multiline
                                              markdown
                                              userId={currentUser?.id}
                                              placeholder="Add a description (supports markdown)"
                                              displayClassName="text-xs"
                                            />
                                          </div>

                                          <div className="flex flex-wrap gap-2">
                                            <div>
                                              <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Status:</span>
                                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                                                <InlineSelect
                                                  value={task.status}
                                                  options={taskStatusOptions}
                                                  onSave={(value) => updateTaskField(task.id, 'status', value)}
                                                  displayClassName="font-medium"
                                                />
                                              </span>
                                            </div>

                                            <div>
                                              <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Priority:</span>
                                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                <InlineSelect
                                                  value={task.priority}
                                                  options={priorityOptions}
                                                  onSave={(value) => updateTaskField(task.id, 'priority', value)}
                                                  displayClassName="font-medium"
                                                />
                                              </span>
                                            </div>
                                          </div>

                                          <div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Assignee:</span>
                                            <span className="text-xs">
                                              <InlineSelect
                                                value={task.assignee || ''}
                                                options={[
                                                  { value: '', label: 'No assignee' },
                                                  ...teamMembers.map(m => ({
                                                    value: m.userId,
                                                    label: m.user?.name || m.user?.email || 'Unknown'
                                                  }))
                                                ]}
                                                onSave={(value) => updateTaskField(task.id, 'assignee', value || null)}
                                                getDisplayValue={(value) => getOwnerName(value || null) || 'No assignee'}
                                                displayClassName="inline text-xs"
                                              />
                                            </span>
                                          </div>

                                          <div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Due date:</span>
                                            <span className="text-xs">
                                              <InlineDate
                                                value={task.dueDate}
                                                onSave={(value) => updateTaskField(task.id, 'dueDate', value)}
                                                placeholder="No due date"
                                                displayClassName="inline text-xs"
                                              />
                                            </span>
                                          </div>

                                          {task.labels && task.labels.length > 0 && (
                                            <div>
                                              <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Labels:</span>
                                              <div className="flex flex-wrap gap-1 mt-1">
                                                {task.labels.map((label, idx) => (
                                                  <span key={idx} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                                                    {label}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          <div className="flex items-center space-x-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                                            <Link
                                              href={`/tasks/${task.id}`}
                                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                                            >
                                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                              </svg>
                                              <span>Open in full view</span>
                                            </Link>
                                            <button
                                              onClick={() => handleDeleteTask(task.id)}
                                              className="text-xs text-red-600 dark:text-red-400 hover:underline"
                                            >
                                              Delete task
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-1 flex-shrink-0">
                                      {!isExpanded && task.priority && task.priority !== 'medium' && (
                                        <span className={`px-1.5 py-0.5 rounded text-xs ${getPriorityColor(task.priority)}`}>
                                          {task.priority}
                                        </span>
                                      )}
                                      {!isExpanded && task.assignee && (
                                        <span className="text-xs text-gray-500">· {getOwnerName(task.assignee)}</span>
                                      )}
                                      <Link
                                        href={`/tasks/${task.id}`}
                                        className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                        title="Open in full view"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                      </Link>
                                      <button
                                        onClick={() => toggleTaskExpanded(task.id)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                      >
                                        <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 border-l border-gray-200 dark:border-gray-800 overflow-y-auto p-6">
          {/* Properties */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
              Properties
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</div>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                  <InlineSelect
                    value={project.status}
                    options={projectStatusOptions}
                    onSave={(value) => updateProjectField('status', value)}
                    displayClassName="font-medium"
                  />
                </span>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Assignee</div>
                <div className="text-sm text-gray-900 dark:text-white">
                  <InlineSelect
                    value={project.assignee || ''}
                    options={[
                      { value: '', label: 'No assignee' },
                      ...teamMembers.map(m => ({
                        value: m.userId,
                        label: m.user?.name || m.user?.email || 'Unknown'
                      }))
                    ]}
                    onSave={(value) => updateProjectField('assignee', value || null)}
                    getDisplayValue={(value) => getOwnerName(value || null) || 'No assignee'}
                  />
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Target Date</div>
                <div className="text-sm text-gray-900 dark:text-white">
                  <InlineDate
                    value={project.targetDeliveryDate}
                    onSave={(value) => updateProjectField('targetDeliveryDate', value)}
                    placeholder="No target date"
                    displayClassName="text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Milestones Progress */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
              Milestones
            </h3>
            <div className="space-y-2">
              {milestones.map((milestone) => {
                const progress = getMilestoneProgress(milestone.id);
                return (
                  <div key={milestone.id} className="flex justify-between items-center">
                    <span className="text-sm text-gray-900 dark:text-white truncate">{milestone.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {progress.percentage}% of {progress.total}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress */}
          <div>
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
              Progress
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Scope</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{progress.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {progress.completed} · {progress.percentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-lg w-full p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Create Milestone</h2>
              <button
                onClick={() => setShowMilestoneModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateMilestone}>
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Name *</label>
                  <input
                    type="text"
                    required
                    value={milestoneFormData.name}
                    onChange={(e) => setMilestoneFormData({ ...milestoneFormData, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    placeholder="Enter milestone name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Description</label>
                  <textarea
                    value={milestoneFormData.description}
                    onChange={(e) => setMilestoneFormData({ ...milestoneFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    placeholder="Describe the milestone"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={milestoneFormData.dueDate}
                    onChange={(e) => setMilestoneFormData({ ...milestoneFormData, dueDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-5 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-lg w-full p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Create Task</h2>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Name *</label>
                  <input
                    type="text"
                    required
                    value={taskFormData.name}
                    onChange={(e) => setTaskFormData({ ...taskFormData, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    placeholder="Enter task name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Description</label>
                  <textarea
                    value={taskFormData.description}
                    onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    placeholder="Describe the task"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Priority</label>
                    <select
                      value={taskFormData.priority}
                      onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Assignee</label>
                    <select
                      value={taskFormData.assignee}
                      onChange={(e) => setTaskFormData({ ...taskFormData, assignee: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    >
                      <option value="">No assignee</option>
                      {teamMembers.map((member) => (
                        <option key={member.userId} value={member.userId}>
                          {member.user?.name || member.user?.email || 'Unknown'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Due Date</label>
                    <input
                      type="date"
                      value={taskFormData.dueDate}
                      onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tags</label>
                    <input
                      type="text"
                      value={taskFormData.labels}
                      onChange={(e) => setTaskFormData({ ...taskFormData, labels: e.target.value })}
                      placeholder="label1, label2"
                      className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-5 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
