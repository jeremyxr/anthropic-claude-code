'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/lib/user-context';
import { api, User, Team, TeamMember } from '@/lib/api';
import WorkspaceSettings from '@/components/WorkspaceSettings';

export default function SettingsPage() {
  const { currentUser, currentTeam, userTeams, setCurrentUser, setCurrentTeam, refreshUserTeams } = useUser();

  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'workspace'>('profile');
  const [isLoading, setIsLoading] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    avatarUrl: '',
  });

  // Team form state
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
  });

  // Team members state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  // Add member state
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member'>('member');

  // Initialize forms when user/team loads
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name,
        email: currentUser.email,
        avatarUrl: currentUser.avatarUrl || '',
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentTeam) {
      setTeamForm({
        name: currentTeam.name,
        description: currentTeam.description,
      });
      loadTeamMembers();
    }
  }, [currentTeam]);

  const loadTeamMembers = async () => {
    if (!currentTeam) return;
    try {
      const members = await api.getTeamMembers(currentTeam.id);
      setTeamMembers(members);
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const updatedUser = await api.updateUser(currentUser.id, {
        name: profileForm.name,
        avatarUrl: profileForm.avatarUrl || null,
      });
      setCurrentUser(updatedUser);
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeam) return;

    // Check if user is owner
    const currentMember = teamMembers.find(m => m.userId === currentUser?.id);
    if (currentMember?.role !== 'owner') {
      alert('Only team owners can update team settings');
      return;
    }

    setIsLoading(true);
    try {
      const updatedTeam = await api.updateTeam(currentTeam.id, {
        name: teamForm.name,
        description: teamForm.description,
      });
      setCurrentTeam(updatedTeam);
      await refreshUserTeams();
      alert('Team updated successfully');
    } catch (error) {
      console.error('Failed to update team:', error);
      alert('Failed to update team');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const newTeam = await api.createTeam({
        name: newTeamName,
        description: newTeamDescription,
        createdBy: currentUser.id,
      });

      // Add current user as owner
      await api.addTeamMember({
        teamId: newTeam.id,
        userId: currentUser.id,
        role: 'owner',
      });

      await refreshUserTeams();
      setCurrentTeam(newTeam);
      setShowCreateTeamModal(false);
      setNewTeamName('');
      setNewTeamDescription('');
      alert('Team created successfully');
    } catch (error) {
      console.error('Failed to create team:', error);
      alert('Failed to create team');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeam) return;

    // Check if user is owner or admin
    const currentMember = teamMembers.find(m => m.userId === currentUser?.id);
    if (currentMember?.role !== 'owner' && currentMember?.role !== 'admin') {
      alert('Only team owners and admins can add members');
      return;
    }

    setIsLoading(true);
    try {
      // Find user by email
      const user = await api.getUserByEmail(newMemberEmail);
      if (!user) {
        alert('User not found. They need to create an account first.');
        return;
      }

      // Add to team
      await api.addTeamMember({
        teamId: currentTeam.id,
        userId: user.id,
        role: newMemberRole,
      });

      await loadTeamMembers();
      setShowAddMemberModal(false);
      setNewMemberEmail('');
      setNewMemberRole('member');
      alert('Member added successfully');
    } catch (error) {
      console.error('Failed to add member:', error);
      alert('Failed to add member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    // Check if user is owner or admin
    const currentMember = teamMembers.find(m => m.userId === currentUser?.id);
    if (currentMember?.role !== 'owner' && currentMember?.role !== 'admin') {
      alert('Only team owners and admins can remove members');
      return;
    }

    try {
      await api.removeTeamMember(memberId);
      await loadTeamMembers();
      alert('Member removed successfully');
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Failed to remove member');
    }
  };

  const currentMemberRole = teamMembers.find(m => m.userId === currentUser?.id)?.role;
  const isTeamOwner = currentMemberRole === 'owner';

  // Show onboarding if no user
  if (!currentUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Welcome to JaneFlow
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Let's get started by creating your profile
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsLoading(true);
              try {
                console.log('Creating user with data:', {
                  email: profileForm.email,
                  name: profileForm.name,
                  avatarUrl: profileForm.avatarUrl || null
                });
                const user = await api.createUser({
                  email: profileForm.email,
                  name: profileForm.name,
                  avatarUrl: profileForm.avatarUrl || null,
                });
                console.log('User created successfully:', user);
                setCurrentUser(user);

                // Auto-create a default team for the user
                console.log('Creating default team for user');
                const defaultTeam = await api.createTeam({
                  name: `${user.name}'s Team`,
                  description: 'My personal workspace',
                  createdBy: user.id,
                });
                console.log('Team created successfully:', defaultTeam);

                // Add user as team owner
                await api.addTeamMember({
                  teamId: defaultTeam.id,
                  userId: user.id,
                  role: 'owner',
                });
                console.log('User added as team owner');

                // Set the team as current team
                setCurrentTeam(defaultTeam);
                await refreshUserTeams();
              } catch (error: any) {
                console.error('Failed to create user:', error);
                const errorMessage = error?.message || error?.error_description || JSON.stringify(error);
                alert(`Failed to create user: ${errorMessage}`);
              } finally {
                setIsLoading(false);
              }
            }}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="your.email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="Your Name"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Profile'}
            </button>
          </form>
        </div>
      </div>
    );
  }


  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'team'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Team
            </button>
            <button
              onClick={() => setActiveTab('workspace')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'workspace'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Workspace
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'profile' ? (
          <div className="max-w-2xl">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Profile Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-gray-800 dark:text-gray-400 text-sm cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Email cannot be changed
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Avatar URL
                    </label>
                    <input
                      type="url"
                      value={profileForm.avatarUrl}
                      onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        ) : activeTab === 'team' ? (
          <div className="max-w-4xl">
            {!currentTeam ? (
              <div className="text-center py-12">
                <div className="mb-6">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Team Yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Create a team to collaborate with others and manage workspace settings.
                </p>
                <button
                  onClick={() => setShowCreateTeamModal(true)}
                  className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
                >
                  Create Team
                </button>
              </div>
            ) : (
              <>
                {/* Team Info */}
                <form onSubmit={handleUpdateTeam} className="space-y-6 mb-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Team Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={teamForm.name}
                      onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                      disabled={!isTeamOwner}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={teamForm.description}
                      onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                      disabled={!isTeamOwner}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {isTeamOwner && (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </form>

            {/* Team Members */}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Team Members
                </h3>
                {(isTeamOwner || currentMemberRole === 'admin') && (
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Member</span>
                  </button>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {member.user?.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.user?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {member.user?.email || ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-2 py-1 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {member.role}
                      </span>
                      {(isTeamOwner || currentMemberRole === 'admin') && member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
              </>
            )}
          </div>
        ) : activeTab === 'workspace' ? (
          !currentTeam ? (
            <div className="max-w-4xl text-center py-12">
              <div className="mb-6">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Team Available
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                You need to create or join a team to manage workspace settings.
              </p>
              <button
                onClick={() => {
                  setActiveTab('team');
                  setShowCreateTeamModal(true);
                }}
                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100"
              >
                Create Team
              </button>
            </div>
          ) : (
            <WorkspaceSettings />
          )
        ) : null}
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Team Member</h2>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddMember}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    placeholder="member@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Role
                  </label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as 'admin' | 'member')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50"
                >
                  {isLoading ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Team</h2>
              <button
                onClick={() => setShowCreateTeamModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateTeam}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    placeholder="My Team"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                    placeholder="Optional team description"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
