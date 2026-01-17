'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, Initiative, Project, Milestone, Deliverable } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';

export default function InitiativeDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [initiative, setInitiative] = useState<Initiative | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Record<string, Milestone[]>>({});
  const [deliverables, setDeliverables] = useState<Record<string, Deliverable[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());

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
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
              Product Dev Hub
            </Link>
            <div className="flex space-x-4">
              <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">
                Dashboard
              </Link>
              <Link href="/initiatives" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">
                Initiatives
              </Link>
            </div>
          </div>
        </div>
      </nav>

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
      </div>
    </div>
  );
}
