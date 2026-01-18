'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, TeamStatus, TeamLabel, TeamPriority } from './api';
import { useUser } from './user-context';

interface SettingsContextType {
  statuses: Record<string, TeamStatus[]>; // key: entityType
  labels: TeamLabel[];
  priorities: TeamPriority[];
  isLoading: boolean;
  refreshStatuses: (entityType?: 'initiative' | 'project' | 'milestone' | 'deliverable') => Promise<void>;
  refreshLabels: () => Promise<void>;
  refreshPriorities: () => Promise<void>;
  refreshAll: () => Promise<void>;
  getStatusesByEntity: (entityType: 'initiative' | 'project' | 'milestone' | 'deliverable') => TeamStatus[];
  getStatusColor: (entityType: string, statusValue: string) => string;
  getStatusLabel: (entityType: string, statusValue: string) => string;
  getPriorityColor: (priorityValue: string) => string;
  getPriorityLabel: (priorityValue: string) => string;
  getLabelColor: (labelName: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { currentTeam } = useUser();
  const [statuses, setStatuses] = useState<Record<string, TeamStatus[]>>({});
  const [labels, setLabels] = useState<TeamLabel[]>([]);
  const [priorities, setPriorities] = useState<TeamPriority[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshStatuses = useCallback(async (entityType?: 'initiative' | 'project' | 'milestone' | 'deliverable') => {
    if (!currentTeam) return;

    try {
      setIsLoading(true);
      const data = await api.getTeamStatuses(currentTeam.id, entityType);

      if (entityType) {
        setStatuses(prev => ({ ...prev, [entityType]: data }));
      } else {
        // Fetch all entity types
        const initiatives = await api.getTeamStatuses(currentTeam.id, 'initiative');
        const projects = await api.getTeamStatuses(currentTeam.id, 'project');
        const milestones = await api.getTeamStatuses(currentTeam.id, 'milestone');
        const deliverables = await api.getTeamStatuses(currentTeam.id, 'deliverable');

        setStatuses({
          initiative: initiatives,
          project: projects,
          milestone: milestones,
          deliverable: deliverables,
        });
      }
    } catch (error) {
      console.error('Failed to refresh statuses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);

  const refreshLabels = useCallback(async () => {
    if (!currentTeam) return;

    try {
      setIsLoading(true);
      const data = await api.getTeamLabels(currentTeam.id);
      setLabels(data);
    } catch (error) {
      console.error('Failed to refresh labels:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);

  const refreshPriorities = useCallback(async () => {
    if (!currentTeam) return;

    try {
      setIsLoading(true);
      const data = await api.getTeamPriorities(currentTeam.id);
      setPriorities(data);
    } catch (error) {
      console.error('Failed to refresh priorities:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);

  const refreshAll = useCallback(async () => {
    if (!currentTeam) return;

    setIsLoading(true);
    await Promise.all([
      refreshStatuses(),
      refreshLabels(),
      refreshPriorities(),
    ]);
    setIsLoading(false);
  }, [currentTeam, refreshStatuses, refreshLabels, refreshPriorities]);

  // Load settings when team changes
  useEffect(() => {
    if (currentTeam) {
      refreshAll();
    }
  }, [currentTeam?.id]); // Only refresh when team ID changes

  const getStatusesByEntity = useCallback((entityType: 'initiative' | 'project' | 'milestone' | 'deliverable'): TeamStatus[] => {
    return statuses[entityType] || [];
  }, [statuses]);

  const getStatusColor = useCallback((entityType: string, statusValue: string): string => {
    const entityStatuses = statuses[entityType] || [];
    const status = entityStatuses.find(s => s.statusValue === statusValue);
    return status?.color || '#6B7280'; // Default gray
  }, [statuses]);

  const getStatusLabel = useCallback((entityType: string, statusValue: string): string => {
    const entityStatuses = statuses[entityType] || [];
    const status = entityStatuses.find(s => s.statusValue === statusValue);
    return status?.label || statusValue;
  }, [statuses]);

  const getPriorityColor = useCallback((priorityValue: string): string => {
    const priority = priorities.find(p => p.priorityValue === priorityValue);
    return priority?.color || '#6B7280'; // Default gray
  }, [priorities]);

  const getPriorityLabel = useCallback((priorityValue: string): string => {
    const priority = priorities.find(p => p.priorityValue === priorityValue);
    return priority?.label || priorityValue;
  }, [priorities]);

  const getLabelColor = useCallback((labelName: string): string => {
    const label = labels.find(l => l.name === labelName);
    return label?.color || '#6B7280'; // Default gray
  }, [labels]);

  return (
    <SettingsContext.Provider
      value={{
        statuses,
        labels,
        priorities,
        isLoading,
        refreshStatuses,
        refreshLabels,
        refreshPriorities,
        refreshAll,
        getStatusesByEntity,
        getStatusColor,
        getStatusLabel,
        getPriorityColor,
        getPriorityLabel,
        getLabelColor,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
