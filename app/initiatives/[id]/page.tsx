'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, Initiative, Project, Milestone, Deliverable } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import { useUser } from '@/lib/user-context';

export default function InitiativeDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { currentUser } = useUser();

  const [initiative, setInitiative] = useState<Initiative | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Record<string, Milestone[]>>({});
  const [deliverables, setDeliverables] = useState<Record<string, Deliverable[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());

  // Modal states
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showCreateMilestoneModal, setShowCreateMilestoneModal] = useState(false);
  const [showCreateDeliverableModal, setShowCreateDeliverableModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');

  // Form data states
  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
    status: 'not-started' as const,
    lead: '',
  });

  const [milestoneFormData, setMilestoneFormData] = useState({
    name: '',
    description: '',
    status: 'not-started' as const,
    dueDate: '',
  });

  const [deliverableFormData, setDeliverableFormData] = useState({
    name: '',
    description: '',
    status: 'todo' as const,
    type: '',
    assignee: '',
    jiraIssueKey: '',
  });

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const initData = await api.getInitiative(id);
      setInitiative(initData);

      const projectsData = await api.getProjects(id);
      setProjects(projectsData);

      // Load milestones for each project
      const milestonesMap: Record<string, Milestone[]> = {};
      const deliverablesMap: Record<string, Deliverable[]> = {};

      for (const project of projectsData) {
        const projectMilestones = await api.getMilestones(project.id);
        milestonesMap[project.id] = projectMilestones;

        for (const milestone of projectMilestones) {
          const milestoneDeliverables = await api.getDeliverables(milestone.id);
          deliverablesMap[milestone.id] = milestoneDeliverables;
        }
      }

      setMilestones(milestonesMap);
      setDeliverables(deliverablesMap);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const toggleMilestone = (milestoneId: string) => {
    const newExpanded = new Set(expandedMilestones);
    if (newExpanded.has(milestoneId)) {
      newExpanded.delete(milestoneId);
    } else {
      newExpanded.add(milestoneId);
    }
    setExpandedMilestones(newExpanded);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProject({
        ...projectFormData,
        initiativeId: id,
        createdBy: currentUser?.id
      });
      setShowCreateProjectModal(false);
      setProjectFormData({
        name: '',
        description: '',
        status: 'not-started',
        lead: '',
      });
      loadData();
    } catch (err) {
      console.error('Failed to create project:', err);
      alert('Failed to create project');
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMilestone({
        ...milestoneFormData,
        projectId: selectedProjectId,
        dueDate: milestoneFormData.dueDate || null, // Convert empty string to null
        createdBy: currentUser?.id
      });
      setShowCreateMilestoneModal(false);
      setMilestoneFormData({
        name: '',
        description: '',
        status: 'not-started',
        dueDate: '',
      });
      setSelectedProjectId('');
      loadData();
    } catch (err) {
      console.error('Failed to create milestone:', err);
      alert('Failed to create milestone');
    }
  };

  const handleCreateDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDeliverable({
        ...deliverableFormData,
        milestoneId: selectedMilestoneId,
        createdBy: currentUser?.id
      });
      setShowCreateDeliverableModal(false);
      setDeliverableFormData({
        name: '',
        description: '',
        status: 'todo',
        type: '',
        assignee: '',
        jiraIssueKey: '',
      });
      setSelectedMilestoneId('');
      loadData();
    } catch (err) {
      console.error('Failed to create deliverable:', err);
      alert('Failed to create deliverable');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!initiative) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">Initiative not found</p>
          <Link href="/initiatives" className="text-blue-600 hover:underline">
            Back to Initiatives
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Link href="/initiatives" className="text-blue-600 hover:underline flex items-center mb-6">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Initiatives
        </Link>

        {/* Initiative Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{initiative.name}</h1>
              <p className="text-gray-600 dark:text-gray-300">{initiative.description}</p>
            </div>
            <StatusBadge status={initiative.status} type="initiative" />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Owner</p>
              <p className="font-medium text-gray-900 dark:text-white">{initiative.owner || 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Target Date</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {initiative.targetDate ? new Date(initiative.targetDate).toLocaleDateString() : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Projects</p>
              <p className="font-medium text-gray-900 dark:text-white">{projects.length}</p>
            </div>
          </div>
        </div>

        {/* Add Project Button */}
        <div className="mb-4">
          <button
            onClick={() => setShowCreateProjectModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Project</span>
          </button>
        </div>

        {/* Hierarchical View */}
        <div className="space-y-4">
          {projects.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <p className="text-gray-600 dark:text-gray-300">No projects yet. Create your first project to get started.</p>
            </div>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="bg-white dark:bg-gray-800 rounded-lg shadow">
                {/* Project Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 flex justify-between items-center"
                  onClick={() => toggleProject(project.id)}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <svg
                      className={`w-5 h-5 text-gray-500 transform transition-transform ${
                        expandedProjects.has(project.id) ? 'rotate-90' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{project.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{project.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {milestones[project.id]?.length || 0} milestones
                    </span>
                    <StatusBadge status={project.status} type="project" />
                  </div>
                </div>

                {/* Milestones */}
                {expandedProjects.has(project.id) && (
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProjectId(project.id);
                          setShowCreateMilestoneModal(true);
                        }}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add Milestone</span>
                      </button>
                    </div>
                    {milestones[project.id]?.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        No milestones yet
                      </div>
                    ) : (
                      milestones[project.id]?.map((milestone) => (
                        <div key={milestone.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                          <div
                            className="p-6 pl-16 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 flex justify-between items-center"
                            onClick={() => toggleMilestone(milestone.id)}
                          >
                            <div className="flex items-center space-x-4 flex-1">
                              <svg
                                className={`w-4 h-4 text-gray-500 transform transition-transform ${
                                  expandedMilestones.has(milestone.id) ? 'rotate-90' : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 dark:text-white">{milestone.name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{milestone.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {deliverables[milestone.id]?.length || 0} deliverables
                              </span>
                              <StatusBadge status={milestone.status} type="milestone" />
                            </div>
                          </div>

                          {/* Deliverables */}
                          {expandedMilestones.has(milestone.id) && (
                            <div className="bg-white dark:bg-gray-800">
                              <div className="p-4 pl-16 border-b border-gray-100 dark:border-gray-700">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMilestoneId(milestone.id);
                                    setShowCreateDeliverableModal(true);
                                  }}
                                  className="flex items-center space-x-2 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  <span>Add Deliverable</span>
                                </button>
                              </div>
                              {deliverables[milestone.id]?.length === 0 ? (
                                <div className="p-6 pl-24 text-center text-gray-500 dark:text-gray-400">
                                  No deliverables yet
                                </div>
                              ) : (
                                deliverables[milestone.id]?.map((deliverable) => (
                                  <div
                                    key={deliverable.id}
                                    className="p-4 pl-24 border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                                  >
                                    <div className="flex justify-between items-center">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                          <h5 className="font-medium text-gray-900 dark:text-white">
                                            {deliverable.name}
                                          </h5>
                                          {deliverable.jiraIssueKey && (
                                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                              {deliverable.jiraIssueKey}
                                            </span>
                                          )}
                                        </div>
                                        {deliverable.description && (
                                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                            {deliverable.description}
                                          </p>
                                        )}
                                        {deliverable.assignee && (
                                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Assigned to: {deliverable.assignee}
                                          </p>
                                        )}
                                      </div>
                                      <StatusBadge status={deliverable.status} type="deliverable" />
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Create Project Modal */}
        {showCreateProjectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Project</h2>
                <button
                  onClick={() => setShowCreateProjectModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateProject}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={projectFormData.name}
                      onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                      placeholder="Enter project name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={projectFormData.description}
                      onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                      placeholder="Describe the project"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Status
                      </label>
                      <select
                        value={projectFormData.status}
                        onChange={(e) => setProjectFormData({ ...projectFormData, status: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                      >
                        <option value="not-started">Not Started</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="on-hold">On Hold</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Lead
                      </label>
                      <input
                        type="text"
                        value={projectFormData.lead}
                        onChange={(e) => setProjectFormData({ ...projectFormData, lead: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                        placeholder="Project lead"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateProjectModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Milestone Modal */}
        {showCreateMilestoneModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Milestone</h2>
                <button
                  onClick={() => setShowCreateMilestoneModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateMilestone}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={milestoneFormData.name}
                      onChange={(e) => setMilestoneFormData({ ...milestoneFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                      placeholder="Enter milestone name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={milestoneFormData.description}
                      onChange={(e) => setMilestoneFormData({ ...milestoneFormData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                      placeholder="Describe the milestone"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Status
                      </label>
                      <select
                        value={milestoneFormData.status}
                        onChange={(e) => setMilestoneFormData({ ...milestoneFormData, status: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                      >
                        <option value="not-started">Not Started</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="at-risk">At Risk</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={milestoneFormData.dueDate}
                        onChange={(e) => setMilestoneFormData({ ...milestoneFormData, dueDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateMilestoneModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Deliverable Modal */}
        {showCreateDeliverableModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Deliverable</h2>
                <button
                  onClick={() => setShowCreateDeliverableModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateDeliverable}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={deliverableFormData.name}
                      onChange={(e) => setDeliverableFormData({ ...deliverableFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                      placeholder="Enter deliverable name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={deliverableFormData.description}
                      onChange={(e) => setDeliverableFormData({ ...deliverableFormData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                      placeholder="Describe the deliverable"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Status
                      </label>
                      <select
                        value={deliverableFormData.status}
                        onChange={(e) => setDeliverableFormData({ ...deliverableFormData, status: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="in-review">In Review</option>
                        <option value="done">Done</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Type
                      </label>
                      <input
                        type="text"
                        value={deliverableFormData.type}
                        onChange={(e) => setDeliverableFormData({ ...deliverableFormData, type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                        placeholder="e.g., Feature, Bug, Design"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Assignee
                      </label>
                      <input
                        type="text"
                        value={deliverableFormData.assignee}
                        onChange={(e) => setDeliverableFormData({ ...deliverableFormData, assignee: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                        placeholder="Assigned to"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        JIRA Issue Key
                      </label>
                      <input
                        type="text"
                        value={deliverableFormData.jiraIssueKey}
                        onChange={(e) => setDeliverableFormData({ ...deliverableFormData, jiraIssueKey: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                        placeholder="e.g., PROJ-123"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateDeliverableModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
