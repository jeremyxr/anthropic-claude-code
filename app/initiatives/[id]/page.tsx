'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, Initiative, Project, TeamMember } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import { useUser } from '@/lib/user-context';

export default function InitiativeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { currentUser, currentTeam } = useUser();

  const [initiative, setInitiative] = useState<Initiative | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
    status: 'not-started' as const,
    lead: '',
    targetDeliveryDate: '',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    status: 'planning' as Initiative['status'],
    owner: '',
    targetDate: '',
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

      if (currentTeam) {
        const members = await api.getTeamMembers(currentTeam.id);
        setTeamMembers(members);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProject({
        ...projectFormData,
        initiativeId: id,
        targetDeliveryDate: projectFormData.targetDeliveryDate || null,
        createdBy: currentUser?.id
      });
      setShowCreateProjectModal(false);
      setProjectFormData({
        name: '',
        description: '',
        status: 'not-started',
        lead: '',
        targetDeliveryDate: '',
      });
      loadData();
    } catch (err) {
      console.error('Failed to create project:', err);
      alert('Failed to create project');
    }
  };

  const handleEditInitiative = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateInitiative(id, {
        ...editFormData,
        targetDate: editFormData.targetDate || null,
        updatedBy: currentUser?.id
      });
      setShowEditModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to update initiative:', err);
      alert('Failed to update initiative');
    }
  };

  const handleDeleteInitiative = async () => {
    if (!confirm('Are you sure you want to delete this initiative? This action cannot be undone.')) {
      return;
    }
    try {
      await api.deleteInitiative(id);
      router.push('/initiatives');
    } catch (err) {
      console.error('Failed to delete initiative:', err);
      alert('Failed to delete initiative');
    }
  };

  const openEditModal = () => {
    if (initiative) {
      setEditFormData({
        name: initiative.name,
        description: initiative.description,
        status: initiative.status,
        owner: initiative.owner || '',
        targetDate: initiative.targetDate ? initiative.targetDate.split('T')[0] : '',
      });
      setShowEditModal(true);
    }
  };

  const getOwnerName = (userId: string | null) => {
    if (!userId) return null;
    const member = teamMembers.find(m => m.userId === userId);
    return member?.user?.name || member?.user?.email || userId;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'planning': 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
      'active': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      'on-hold': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
      'completed': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      'cancelled': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      'not-started': 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
      'in-progress': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    };
    return colors[status] || colors['planning'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (!initiative) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-950">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Initiative not found</p>
          <Link href="/initiatives" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            Back to Initiatives
          </Link>
        </div>
      </div>
    );
  }

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

          {/* Initiative Title and Properties */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{initiative.name}</h1>
              {initiative.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{initiative.description}</p>
              )}

              {/* Inline Properties */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(initiative.status)}`}>
                  {initiative.status.replace('-', ' ')}
                </span>
                {initiative.owner && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    👤 {initiative.owner}
                  </span>
                )}
                {initiative.targetDate && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    📅 {new Date(initiative.targetDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={openEditModal}
                className="px-2.5 py-1 border border-gray-200 dark:border-gray-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Edit
              </button>
              <button
                onClick={handleDeleteInitiative}
                className="px-2.5 py-1 border border-red-200 dark:border-red-800 rounded text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-6">
          {/* Projects Section */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Projects ({projects.length})</h2>
            <button
              onClick={() => setShowCreateProjectModal(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Project</span>
            </button>
          </div>

          {/* Projects List */}
          {projects.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">No projects yet</p>
              <button
                onClick={() => setShowCreateProjectModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create Project</span>
              </button>
            </div>
          ) : (
            <div className="space-y-px border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800/50 last:border-0 group"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {project.lead && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {getOwnerName(project.lead)}
                      </span>
                    )}
                    {project.targetDeliveryDate && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(project.targetDeliveryDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status.replace('-', ' ')}
                    </span>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-lg w-full p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Create Project</h2>
              <button
                onClick={() => setShowCreateProjectModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateProject}>
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={projectFormData.name}
                    onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    placeholder="Enter project name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={projectFormData.description}
                    onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    placeholder="Describe the project"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      Status
                    </label>
                    <select
                      value={projectFormData.status}
                      onChange={(e) => setProjectFormData({ ...projectFormData, status: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    >
                      <option value="not-started">Not Started</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="on-hold">On Hold</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      Lead
                    </label>
                    <select
                      value={projectFormData.lead}
                      onChange={(e) => setProjectFormData({ ...projectFormData, lead: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    >
                      <option value="">No lead</option>
                      {teamMembers.map((member) => (
                        <option key={member.userId} value={member.userId}>
                          {member.user?.name || member.user?.email || 'Unknown'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={projectFormData.targetDeliveryDate}
                      onChange={(e) => setProjectFormData({ ...projectFormData, targetDeliveryDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-5 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCreateProjectModal(false)}
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

      {/* Edit Initiative Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-lg w-full p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Edit Initiative</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditInitiative}>
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    placeholder="Enter initiative name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    placeholder="Describe the initiative"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      Status
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="on-hold">On Hold</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      Owner
                    </label>
                    <input
                      type="text"
                      value={editFormData.owner}
                      onChange={(e) => setEditFormData({ ...editFormData, owner: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                      placeholder="Owner"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={editFormData.targetDate}
                      onChange={(e) => setEditFormData({ ...editFormData, targetDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-5 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
