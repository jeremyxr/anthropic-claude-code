const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Initiative {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  startDate: string | null;
  targetDate: string | null;
  owner: string | null;
  tags: string[];
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  initiativeId: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  startDate: string | null;
  targetDate: string | null;
  owner: string | null;
  tags: string[];
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  projectId: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
  dueDate: string | null;
  owner: string | null;
  tags: string[];
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Deliverable {
  id: string;
  name: string;
  description: string;
  milestoneId: string;
  status: 'todo' | 'in-progress' | 'in-review' | 'done' | 'blocked';
  type: string;
  assignee: string | null;
  jiraIssueKey: string | null;
  jiraIssueId: string | null;
  tags: string[];
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// API client functions
export const api = {
  // Initiatives
  getInitiatives: async (): Promise<Initiative[]> => {
    const res = await fetch(`${API_BASE}/initiatives`);
    if (!res.ok) throw new Error('Failed to fetch initiatives');
    return res.json();
  },

  getInitiative: async (id: string): Promise<Initiative> => {
    const res = await fetch(`${API_BASE}/initiatives/${id}`);
    if (!res.ok) throw new Error('Failed to fetch initiative');
    return res.json();
  },

  getInitiativeWithProjects: async (id: string): Promise<Initiative & { projects: Project[] }> => {
    const res = await fetch(`${API_BASE}/initiatives/${id}/with-projects`);
    if (!res.ok) throw new Error('Failed to fetch initiative with projects');
    return res.json();
  },

  createInitiative: async (data: Partial<Initiative>): Promise<Initiative> => {
    const res = await fetch(`${API_BASE}/initiatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create initiative');
    return res.json();
  },

  updateInitiative: async (id: string, data: Partial<Initiative>): Promise<Initiative> => {
    const res = await fetch(`${API_BASE}/initiatives/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update initiative');
    return res.json();
  },

  deleteInitiative: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/initiatives/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete initiative');
  },

  // Projects
  getProjects: async (initiativeId?: string): Promise<Project[]> => {
    const url = initiativeId
      ? `${API_BASE}/projects?initiativeId=${initiativeId}`
      : `${API_BASE}/projects`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  createProject: async (data: Partial<Project>): Promise<Project> => {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  updateProject: async (id: string, data: Partial<Project>): Promise<Project> => {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update project');
    return res.json();
  },

  // Milestones
  getMilestones: async (projectId?: string): Promise<Milestone[]> => {
    const url = projectId
      ? `${API_BASE}/milestones?projectId=${projectId}`
      : `${API_BASE}/milestones`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch milestones');
    return res.json();
  },

  createMilestone: async (data: Partial<Milestone>): Promise<Milestone> => {
    const res = await fetch(`${API_BASE}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create milestone');
    return res.json();
  },

  updateMilestone: async (id: string, data: Partial<Milestone>): Promise<Milestone> => {
    const res = await fetch(`${API_BASE}/milestones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update milestone');
    return res.json();
  },

  // Deliverables
  getDeliverables: async (milestoneId?: string): Promise<Deliverable[]> => {
    const url = milestoneId
      ? `${API_BASE}/deliverables?milestoneId=${milestoneId}`
      : `${API_BASE}/deliverables`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch deliverables');
    return res.json();
  },

  createDeliverable: async (data: Partial<Deliverable>): Promise<Deliverable> => {
    const res = await fetch(`${API_BASE}/deliverables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create deliverable');
    return res.json();
  },

  updateDeliverable: async (id: string, data: Partial<Deliverable>): Promise<Deliverable> => {
    const res = await fetch(`${API_BASE}/deliverables/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update deliverable');
    return res.json();
  },

  // JIRA
  linkDeliverableToJira: async (deliverableId: string, jiraIssueKey: string) => {
    const res = await fetch(`${API_BASE}/jira/link-deliverable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliverableId, jiraIssueKey }),
    });
    if (!res.ok) throw new Error('Failed to link deliverable to JIRA');
    return res.json();
  },

  syncFromJira: async (deliverableId: string) => {
    const res = await fetch(`${API_BASE}/jira/sync-from-jira/${deliverableId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to sync from JIRA');
    return res.json();
  },
};
