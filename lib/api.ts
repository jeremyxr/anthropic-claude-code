import { supabase } from './supabase';

export interface Initiative {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  targetDate: string | null;
  owner: string | null;
  teamId?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  initiativeId: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'on-hold';
  lead: string | null;
  targetDeliveryDate: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  projectId: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'at-risk';
  dueDate: string | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deliverable {
  id: string;
  name: string;
  description?: string;
  milestoneId: string;
  status: 'todo' | 'in-progress' | 'in-review' | 'done' | 'blocked';
  type?: string;
  assignee: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string | null;
  jiraIssueKey: string | null;
  jiraIssueId: string | null;
  tags: string[];
  customFields: Record<string, any>;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  createdAt: string;
  user?: User;
}

// Helper functions to convert between snake_case (DB) and camelCase (Frontend)
const toCamelCase = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);

  return Object.keys(obj).reduce((acc: any, key: string) => {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    acc[camelKey] = toCamelCase(obj[key]);
    return acc;
  }, {});
};

const toSnakeCase = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);

  return Object.keys(obj).reduce((acc: any, key: string) => {
    // Convert camelCase to snake_case properly (targetDate -> target_date)
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = toSnakeCase(obj[key]);
    return acc;
  }, {});
};

// API client functions using Supabase
export const api = {
  // Initiatives
  getInitiatives: async (): Promise<Initiative[]> => {
    const { data, error } = await supabase
      .from('initiatives')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data) || [];
  },

  getInitiative: async (id: string): Promise<Initiative> => {
    const { data, error } = await supabase
      .from('initiatives')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  getInitiativeWithProjects: async (id: string): Promise<Initiative & { projects: Project[] }> => {
    const { data: initiative, error: initError } = await supabase
      .from('initiatives')
      .select('*')
      .eq('id', id)
      .single();

    if (initError) throw initError;

    const { data: projects, error: projError } = await supabase
      .from('projects')
      .select('*')
      .eq('initiative_id', id)
      .order('created_at', { ascending: false });

    if (projError) throw projError;

    return {
      ...toCamelCase(initiative),
      projects: toCamelCase(projects) || [],
    };
  },

  createInitiative: async (data: Partial<Initiative>): Promise<Initiative> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('initiatives')
      .insert([snakeData])
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  updateInitiative: async (id: string, data: Partial<Initiative>): Promise<Initiative> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('initiatives')
      .update(snakeData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  deleteInitiative: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('initiatives')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Projects
  getProjects: async (initiativeId?: string): Promise<Project[]> => {
    let query = supabase.from('projects').select('*');

    if (initiativeId) {
      query = query.eq('initiative_id', initiativeId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data) || [];
  },

  createProject: async (data: Partial<Project>): Promise<Project> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('projects')
      .insert([snakeData])
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  updateProject: async (id: string, data: Partial<Project>): Promise<Project> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('projects')
      .update(snakeData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  // Milestones
  getMilestones: async (projectId?: string): Promise<Milestone[]> => {
    let query = supabase.from('milestones').select('*');

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data) || [];
  },

  createMilestone: async (data: Partial<Milestone>): Promise<Milestone> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('milestones')
      .insert([snakeData])
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  updateMilestone: async (id: string, data: Partial<Milestone>): Promise<Milestone> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('milestones')
      .update(snakeData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  // Deliverables
  getDeliverables: async (milestoneId?: string): Promise<Deliverable[]> => {
    let query = supabase.from('deliverables').select('*');

    if (milestoneId) {
      query = query.eq('milestone_id', milestoneId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data) || [];
  },

  createDeliverable: async (data: Partial<Deliverable>): Promise<Deliverable> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('deliverables')
      .insert([snakeData])
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  updateDeliverable: async (id: string, data: Partial<Deliverable>): Promise<Deliverable> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('deliverables')
      .update(snakeData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data) || [];
  },

  getUser: async (id: string): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  getUserByEmail: async (email: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data ? toCamelCase(data) : null;
  },

  createUser: async (data: Partial<User>): Promise<User> => {
    console.log('API createUser - Input data:', data);
    const snakeData = toSnakeCase(data);
    console.log('API createUser - Snake case data:', snakeData);
    const { data: result, error } = await supabase
      .from('users')
      .insert([snakeData])
      .select()
      .single();

    if (error) {
      console.error('API createUser - Supabase error:', error);
      throw error;
    }
    console.log('API createUser - Result:', result);
    return toCamelCase(result);
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('users')
      .update(snakeData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  // Teams
  getTeams: async (): Promise<Team[]> => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data) || [];
  },

  getTeam: async (id: string): Promise<Team> => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  createTeam: async (data: Partial<Team>): Promise<Team> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('teams')
      .insert([snakeData])
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  updateTeam: async (id: string, data: Partial<Team>): Promise<Team> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('teams')
      .update(snakeData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  deleteTeam: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Team Members
  getTeamMembers: async (teamId: string): Promise<TeamMember[]> => {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        user:users(*)
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return toCamelCase(data) || [];
  },

  addTeamMember: async (data: Partial<TeamMember>): Promise<TeamMember> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('team_members')
      .insert([snakeData])
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  updateTeamMember: async (id: string, data: Partial<TeamMember>): Promise<TeamMember> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('team_members')
      .update(snakeData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  removeTeamMember: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  getUserTeams: async (userId: string): Promise<Team[]> => {
    const { data, error } = await supabase
      .from('team_members')
      .select('team:teams(*)')
      .eq('user_id', userId);

    if (error) throw error;
    return toCamelCase(data?.map((item: any) => item.team) || []);
  },

  // JIRA integration (kept for future implementation)
  linkDeliverableToJira: async (deliverableId: string, jiraIssueKey: string) => {
    // This would call your JIRA API endpoints
    // For now, just update the deliverable with JIRA info
    return api.updateDeliverable(deliverableId, { jiraIssueKey });
  },

  syncFromJira: async (deliverableId: string) => {
    // This would sync from JIRA
    // Implementation depends on your JIRA integration setup
    throw new Error('JIRA sync not yet implemented with Supabase');
  },
};
