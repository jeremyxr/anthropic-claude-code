'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/user-context';
import { useSettings } from '@/lib/settings-context';
import { api, TeamStatus, TeamLabel, TeamPriority } from '@/lib/api';

export default function WorkspaceSettings() {
  const { currentTeam } = useUser();
  const { statuses, labels, priorities, refreshStatuses, refreshLabels, refreshPriorities } = useSettings();

  const [activeSection, setActiveSection] = useState<'statuses' | 'labels' | 'priorities'>('statuses');
  const [selectedEntityType, setSelectedEntityType] = useState<'initiative' | 'project' | 'milestone' | 'deliverable'>('project');

  // Status form state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingStatus, setEditingStatus] = useState<TeamStatus | null>(null);
  const [statusForm, setStatusForm] = useState({
    statusValue: '',
    label: '',
    color: '#6B7280',
    position: 0,
  });

  // Label form state
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState<TeamLabel | null>(null);
  const [labelForm, setLabelForm] = useState({
    name: '',
    description: '',
    color: '#6B7280',
  });

  // Priority form state
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [editingPriority, setEditingPriority] = useState<TeamPriority | null>(null);
  const [priorityForm, setPriorityForm] = useState({
    priorityValue: '',
    label: '',
    color: '#6B7280',
    position: 0,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Get current entity statuses
  const currentStatuses = statuses[selectedEntityType] || [];

  // Status handlers
  const handleCreateStatus = () => {
    setEditingStatus(null);
    setStatusForm({
      statusValue: '',
      label: '',
      color: '#6B7280',
      position: currentStatuses.length,
    });
    setShowStatusModal(true);
  };

  const handleEditStatus = (status: TeamStatus) => {
    setEditingStatus(status);
    setStatusForm({
      statusValue: status.statusValue,
      label: status.label,
      color: status.color,
      position: status.position,
    });
    setShowStatusModal(true);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeam) {
      console.error('No current team available');
      alert('Error: No team selected. Please refresh the page.');
      return;
    }

    console.log('Saving status:', { teamId: currentTeam.id, entityType: selectedEntityType, statusForm });
    setIsLoading(true);
    try {
      if (editingStatus) {
        await api.updateTeamStatus(editingStatus.id, statusForm);
      } else {
        await api.createTeamStatus({
          teamId: currentTeam.id,
          entityType: selectedEntityType,
          ...statusForm,
        });
      }
      await refreshStatuses(selectedEntityType);
      setShowStatusModal(false);
    } catch (error) {
      console.error('Failed to save status:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to save status: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStatus = async (id: string) => {
    if (!confirm('Are you sure you want to delete this status?')) return;

    try {
      await api.deleteTeamStatus(id);
      await refreshStatuses(selectedEntityType);
    } catch (error) {
      console.error('Failed to delete status:', error);
      alert('Failed to delete status');
    }
  };

  // Label handlers
  const handleCreateLabel = () => {
    setEditingLabel(null);
    setLabelForm({
      name: '',
      description: '',
      color: '#6B7280',
    });
    setShowLabelModal(true);
  };

  const handleEditLabel = (label: TeamLabel) => {
    setEditingLabel(label);
    setLabelForm({
      name: label.name,
      description: label.description || '',
      color: label.color,
    });
    setShowLabelModal(true);
  };

  const handleSaveLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeam) {
      console.error('No current team available');
      alert('Error: No team selected. Please refresh the page.');
      return;
    }

    console.log('Saving label:', { teamId: currentTeam.id, labelForm });
    setIsLoading(true);
    try {
      if (editingLabel) {
        await api.updateTeamLabel(editingLabel.id, labelForm);
      } else {
        await api.createTeamLabel({
          teamId: currentTeam.id,
          ...labelForm,
        });
      }
      await refreshLabels();
      setShowLabelModal(false);
    } catch (error) {
      console.error('Failed to save label:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to save label: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLabel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this label?')) return;

    try {
      await api.deleteTeamLabel(id);
      await refreshLabels();
    } catch (error) {
      console.error('Failed to delete label:', error);
      alert('Failed to delete label');
    }
  };

  // Priority handlers
  const handleCreatePriority = () => {
    setEditingPriority(null);
    setPriorityForm({
      priorityValue: '',
      label: '',
      color: '#6B7280',
      position: priorities.length,
    });
    setShowPriorityModal(true);
  };

  const handleEditPriority = (priority: TeamPriority) => {
    setEditingPriority(priority);
    setPriorityForm({
      priorityValue: priority.priorityValue,
      label: priority.label,
      color: priority.color,
      position: priority.position,
    });
    setShowPriorityModal(true);
  };

  const handleSavePriority = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeam) {
      console.error('No current team available');
      alert('Error: No team selected. Please refresh the page.');
      return;
    }

    console.log('Saving priority:', { teamId: currentTeam.id, priorityForm });
    setIsLoading(true);
    try {
      if (editingPriority) {
        await api.updateTeamPriority(editingPriority.id, priorityForm);
      } else {
        await api.createTeamPriority({
          teamId: currentTeam.id,
          ...priorityForm,
        });
      }
      await refreshPriorities();
      setShowPriorityModal(false);
    } catch (error) {
      console.error('Failed to save priority:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to save priority: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePriority = async (id: string) => {
    if (!confirm('Are you sure you want to delete this priority?')) return;

    try {
      await api.deleteTeamPriority(id);
      await refreshPriorities();
    } catch (error) {
      console.error('Failed to delete priority:', error);
      alert('Failed to delete priority');
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Section Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveSection('statuses')}
          className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeSection === 'statuses'
              ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Project Statuses
        </button>
        <button
          onClick={() => setActiveSection('labels')}
          className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeSection === 'labels'
              ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Labels
        </button>
        <button
          onClick={() => setActiveSection('priorities')}
          className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeSection === 'priorities'
              ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Priorities
        </button>
      </div>

      {/* Project Statuses Section */}
      {activeSection === 'statuses' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Project Statuses</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Customize the workflow statuses for your team
              </p>
            </div>
            <button
              onClick={handleCreateStatus}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Status</span>
            </button>
          </div>

          {/* Entity Type Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Entity Type
            </label>
            <select
              value={selectedEntityType}
              onChange={(e) => setSelectedEntityType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="initiative">Initiatives</option>
              <option value="project">Projects</option>
              <option value="milestone">Milestones</option>
              <option value="deliverable">Tasks/Deliverables</option>
            </select>
          </div>

          {/* Statuses List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {currentStatuses.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No statuses defined for this entity type yet.
              </div>
            ) : (
              currentStatuses.map((status) => (
                <div
                  key={status.id}
                  className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {status.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Value: {status.statusValue}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditStatus(status)}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteStatus(status.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Labels Section */}
      {activeSection === 'labels' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Labels</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Create labels that can be applied to all projects and tasks
              </p>
            </div>
            <button
              onClick={handleCreateLabel}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Label</span>
            </button>
          </div>

          {/* Labels List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {labels.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No labels defined yet.
              </div>
            ) : (
              labels.map((label) => (
                <div
                  key={label.id}
                  className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {label.name}
                      </p>
                      {label.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {label.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditLabel(label)}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteLabel(label.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Priorities Section */}
      {activeSection === 'priorities' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Priorities</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Define priority levels for tasks
              </p>
            </div>
            <button
              onClick={handleCreatePriority}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Priority</span>
            </button>
          </div>

          {/* Priorities List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {priorities.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No priorities defined yet.
              </div>
            ) : (
              priorities.map((priority) => (
                <div
                  key={priority.id}
                  className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: priority.color }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {priority.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Value: {priority.priorityValue}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditPriority(priority)}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeletePriority(priority.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingStatus ? 'Edit Status' : 'Add Status'}
              </h2>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveStatus}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Status Value (slug)
                  </label>
                  <input
                    type="text"
                    required
                    value={statusForm.statusValue}
                    onChange={(e) => setStatusForm({ ...statusForm, statusValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    placeholder="e.g., in-progress"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Display Label
                  </label>
                  <input
                    type="text"
                    required
                    value={statusForm.label}
                    onChange={(e) => setStatusForm({ ...statusForm, label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    placeholder="e.g., In Progress"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Color
                  </label>
                  <input
                    type="color"
                    value={statusForm.color}
                    onChange={(e) => setStatusForm({ ...statusForm, color: e.target.value })}
                    className="w-full h-10 px-1 py-1 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Label Modal */}
      {showLabelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingLabel ? 'Edit Label' : 'Add Label'}
              </h2>
              <button
                onClick={() => setShowLabelModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveLabel}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={labelForm.name}
                    onChange={(e) => setLabelForm({ ...labelForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    placeholder="e.g., bug, feature"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={labelForm.description}
                    onChange={(e) => setLabelForm({ ...labelForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    placeholder="Optional description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Color
                  </label>
                  <input
                    type="color"
                    value={labelForm.color}
                    onChange={(e) => setLabelForm({ ...labelForm, color: e.target.value })}
                    className="w-full h-10 px-1 py-1 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowLabelModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Priority Modal */}
      {showPriorityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingPriority ? 'Edit Priority' : 'Add Priority'}
              </h2>
              <button
                onClick={() => setShowPriorityModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSavePriority}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Priority Value (slug)
                  </label>
                  <input
                    type="text"
                    required
                    value={priorityForm.priorityValue}
                    onChange={(e) => setPriorityForm({ ...priorityForm, priorityValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    placeholder="e.g., high"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Display Label
                  </label>
                  <input
                    type="text"
                    required
                    value={priorityForm.label}
                    onChange={(e) => setPriorityForm({ ...priorityForm, label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    placeholder="e.g., High"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Color
                  </label>
                  <input
                    type="color"
                    value={priorityForm.color}
                    onChange={(e) => setPriorityForm({ ...priorityForm, color: e.target.value })}
                    className="w-full h-10 px-1 py-1 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPriorityModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
