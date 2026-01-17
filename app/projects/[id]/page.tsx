'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, Project, Milestone, Deliverable, TeamMember } from '@/lib/api';
import { useUser } from '@/lib/user-context';

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { currentUser, currentTeam } = useUser();

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [deliverables, setDeliverables] = useState<Record<string, Deliverable[]>>({});
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');

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
    tags: '',
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

      // Load team members
      if (currentTeam) {
        const members = await api.getTeamMembers(currentTeam.id);
        setTeamMembers(members);
      }

      // Load deliverables for each milestone
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
      const tagsArray = taskFormData.tags
        ? taskFormData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];

      await api.createDeliverable({
        name: taskFormData.name,
        description: taskFormData.description || undefined,
        status: taskFormData.status,
        type: taskFormData.type || undefined,
        assignee: taskFormData.assignee || null,
        priority: taskFormData.priority,
        dueDate: taskFormData.dueDate || null,
        tags: tagsArray,
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
        tags: '',
      });
      setSelectedMilestoneId('');
      loadData();
    } catch (err) {
      console.error('Failed to create task:', err);
      alert('Failed to create task');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not-started':
      case 'todo':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'completed':
      case 'done':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'at-risk':
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
    if (!userId) return 'Unassigned';
    const member = teamMembers.find(m => m.userId === userId);
    return member?.user?.name || member?.user?.email || 'Unknown';
  };

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
      {/* Header with breadcrumb */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <a href="/initiatives" className="hover:text-gray-900 dark:hover:text-gray-100">Initiatives</a>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium">{project.name}</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Project Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                {project.name}
              </h1>

              {/* Inline Properties */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status.replace('-', ' ')}
                </span>
                {project.lead && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    👤 {getOwnerName(project.lead)}
                  </span>
                )}
                {project.targetDeliveryDate && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    🎯 {new Date(project.targetDeliveryDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Description</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {project.description || 'No description provided'}
              </p>
            </div>

            {/* Milestones */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Milestones</h3>
                <button
                  onClick={() => setShowMilestoneModal(true)}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  + Add milestone
                </button>
              </div>

              <div className="space-y-3">
                {milestones.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No milestones yet</p>
                ) : (
                  milestones.map((milestone) => {
                    const progress = getMilestoneProgress(milestone.id);
                    const tasks = deliverables[milestone.id] || [];

                    return (
                      <div key={milestone.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-gray-900 dark:text-white">{milestone.name}</h4>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {progress.completed}/{progress.total} · {progress.percentage}%
                              </span>
                            </div>
                            {milestone.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">{milestone.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedMilestoneId(milestone.id);
                              setShowTaskModal(true);
                            }}
                            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                          >
                            + Add task
                          </button>
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
                            {tasks.map((task) => (
                              <div key={task.id} className="flex items-center space-x-2 text-sm pl-2">
                                <input
                                  type="checkbox"
                                  checked={task.status === 'done'}
                                  className="w-4 h-4 rounded border-gray-300"
                                  readOnly
                                />
                                <span className={task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}>
                                  {task.name}
                                </span>
                                {task.priority && task.priority !== 'medium' && (
                                  <span className={`px-1.5 py-0.5 rounded text-xs ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                )}
                                {task.assignee && (
                                  <span className="text-xs text-gray-500">· {getOwnerName(task.assignee)}</span>
                                )}
                              </div>
                            ))}
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
                  {project.status.replace('-', ' ')}
                </span>
              </div>
              {project.lead && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lead</div>
                  <div className="text-sm text-gray-900 dark:text-white">{getOwnerName(project.lead)}</div>
                </div>
              )}
              {project.targetDeliveryDate && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Target Date</div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {new Date(project.targetDeliveryDate).toLocaleDateString()}
                  </div>
                </div>
              )}
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
                    <span className="text-sm text-gray-900 dark:text-white">{milestone.name}</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create Milestone</h2>
            <form onSubmit={handleCreateMilestone}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={milestoneFormData.name}
                    onChange={(e) => setMilestoneFormData({ ...milestoneFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={milestoneFormData.description}
                    onChange={(e) => setMilestoneFormData({ ...milestoneFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={milestoneFormData.dueDate}
                    onChange={(e) => setMilestoneFormData({ ...milestoneFormData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={taskFormData.name}
                    onChange={(e) => setTaskFormData({ ...taskFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={taskFormData.description}
                    onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                    <select
                      value={taskFormData.priority}
                      onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignee</label>
                    <select
                      value={taskFormData.assignee}
                      onChange={(e) => setTaskFormData({ ...taskFormData, assignee: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={taskFormData.dueDate}
                      onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
                    <input
                      type="text"
                      value={taskFormData.tags}
                      onChange={(e) => setTaskFormData({ ...taskFormData, tags: e.target.value })}
                      placeholder="tag1, tag2"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
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
