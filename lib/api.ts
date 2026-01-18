import { supabase } from './supabase';

export interface Initiative {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  targetDate: string | null;
  owner: string | null;
  labels: string[];
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
  assignee: string | null;
  labels: string[];
  targetDeliveryDate: string | null;
  teamId?: string;
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
  labels: string[];
  teamId?: string;
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
  labels: string[];
  customFields: Record<string, any>;
  teamId?: string;
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

export interface Comment {
  id: string;
  deliverableId: string;
  userId: string;
  content: string;
  mentions: string[];
  parentCommentId: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  replies?: Comment[];
}

export interface Notification {
  id: string;
  userId: string;
  type: 'mention' | 'comment' | 'task_assigned';
  title: string;
  message: string | null;
  relatedCommentId: string | null;
  relatedDeliverableId: string | null;
  relatedUserId: string | null;
  isRead: boolean;
  createdAt: string;
  user?: User;
  relatedUser?: User;
  relatedDeliverable?: Deliverable;
  relatedComment?: Comment;
}

export interface TeamStatus {
  id: string;
  teamId: string;
  entityType: 'initiative' | 'project' | 'milestone' | 'deliverable';
  statusValue: string;
  label: string;
  color: string;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamLabel {
  id: string;
  teamId: string;
  name: string;
  description: string | null;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamPriority {
  id: string;
  teamId: string;
  priorityValue: string;
  label: string;
  color: string;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectUpdate {
  id: string;
  projectId: string;
  status: 'on-track' | 'at-risk' | 'off-track';
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Favorite {
  id: string;
  userId: string;
  entityType: 'initiative' | 'project' | 'milestone' | 'deliverable';
  entityId: string;
  teamId: string | null;
  createdAt: string;
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

  getProject: async (id: string): Promise<Project> => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return toCamelCase(data);
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

  deleteProject: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
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

  deleteMilestone: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', id);

    if (error) throw error;
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

  getDeliverable: async (id: string): Promise<Deliverable> => {
    const { data, error } = await supabase
      .from('deliverables')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  getDeliverableWithContext: async (id: string): Promise<{
    deliverable: Deliverable;
    milestone: Milestone;
    project: Project;
    initiative: Initiative;
  }> => {
    // Get the deliverable
    const { data: deliverable, error: deliverableError } = await supabase
      .from('deliverables')
      .select('*')
      .eq('id', id)
      .single();

    if (deliverableError) throw deliverableError;

    // Get the milestone
    const { data: milestone, error: milestoneError } = await supabase
      .from('milestones')
      .select('*')
      .eq('id', deliverable.milestone_id)
      .single();

    if (milestoneError) throw milestoneError;

    // Get the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', milestone.project_id)
      .single();

    if (projectError) throw projectError;

    // Get the initiative
    const { data: initiative, error: initiativeError } = await supabase
      .from('initiatives')
      .select('*')
      .eq('id', project.initiative_id)
      .single();

    if (initiativeError) throw initiativeError;

    return {
      deliverable: toCamelCase(deliverable),
      milestone: toCamelCase(milestone),
      project: toCamelCase(project),
      initiative: toCamelCase(initiative),
    };
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

  deleteDeliverable: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('deliverables')
      .delete()
      .eq('id', id);

    if (error) throw error;
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

  // Comments
  getComments: async (deliverableId: string): Promise<Comment[]> => {
    // Fetch all comments for the deliverable
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:users(*)
      `)
      .eq('deliverable_id', deliverableId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const allComments = toCamelCase(data) || [];

    // Organize comments into a hierarchical structure
    // Top-level comments (parent_comment_id is null) with nested replies
    const topLevelComments = allComments.filter((c: Comment) => !c.parentCommentId);
    const repliesMap = new Map<string, Comment[]>();

    // Group replies by their parent comment ID
    allComments
      .filter((c: Comment) => c.parentCommentId)
      .forEach((reply: Comment) => {
        const parentId = reply.parentCommentId!;
        if (!repliesMap.has(parentId)) {
          repliesMap.set(parentId, []);
        }
        repliesMap.get(parentId)!.push(reply);
      });

    // Attach replies to their parent comments
    topLevelComments.forEach((comment: Comment) => {
      comment.replies = repliesMap.get(comment.id) || [];
    });

    return topLevelComments;
  },

  createComment: async (data: Partial<Comment>): Promise<Comment> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('comments')
      .insert([snakeData])
      .select(`
        *,
        user:users(*)
      `)
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  updateComment: async (id: string, data: Partial<Comment>): Promise<Comment> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('comments')
      .update(snakeData)
      .eq('id', id)
      .select(`
        *,
        user:users(*)
      `)
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  deleteComment: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Notifications
  getNotifications: async (userId: string): Promise<Notification[]> => {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        user:users!notifications_user_id_fkey(*),
        related_user:users!notifications_related_user_id_fkey(*),
        related_deliverable:deliverables(*),
        related_comment:comments(*, user:users(*))
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data) || [];
  },

  getUnreadNotifications: async (userId: string): Promise<Notification[]> => {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        user:users!notifications_user_id_fkey(*),
        related_user:users!notifications_related_user_id_fkey(*),
        related_deliverable:deliverables(*),
        related_comment:comments(*, user:users(*))
      `)
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data) || [];
  },

  createNotification: async (data: Partial<Notification>): Promise<Notification> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('notifications')
      .insert([snakeData])
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  markNotificationAsRead: async (id: string): Promise<Notification> => {
    const { data: result, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  markAllNotificationsAsRead: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  },

  deleteNotification: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Team Statuses
  getTeamStatuses: async (teamId: string, entityType?: 'initiative' | 'project' | 'milestone' | 'deliverable'): Promise<TeamStatus[]> => {
    let query = supabase
      .from('team_statuses')
      .select('*')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return toCamelCase(data) || [];
  },

  createTeamStatus: async (data: Partial<TeamStatus>): Promise<TeamStatus> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('team_statuses')
      .insert([snakeData])
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  updateTeamStatus: async (id: string, data: Partial<TeamStatus>): Promise<TeamStatus> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('team_statuses')
      .update(snakeData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  deleteTeamStatus: async (id: string): Promise<void> => {
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('team_statuses')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  // Team Labels
  getTeamLabels: async (teamId: string): Promise<TeamLabel[]> => {
    const { data, error } = await supabase
      .from('team_labels')
      .select('*')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return toCamelCase(data) || [];
  },

  createTeamLabel: async (data: Partial<TeamLabel>): Promise<TeamLabel> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('team_labels')
      .insert([snakeData])
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  updateTeamLabel: async (id: string, data: Partial<TeamLabel>): Promise<TeamLabel> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('team_labels')
      .update(snakeData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  deleteTeamLabel: async (id: string): Promise<void> => {
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('team_labels')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  // Team Priorities
  getTeamPriorities: async (teamId: string): Promise<TeamPriority[]> => {
    const { data, error } = await supabase
      .from('team_priorities')
      .select('*')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (error) throw error;
    return toCamelCase(data) || [];
  },

  createTeamPriority: async (data: Partial<TeamPriority>): Promise<TeamPriority> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('team_priorities')
      .insert([snakeData])
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  updateTeamPriority: async (id: string, data: Partial<TeamPriority>): Promise<TeamPriority> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('team_priorities')
      .update(snakeData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  deleteTeamPriority: async (id: string): Promise<void> => {
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('team_priorities')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  // Project Updates
  getProjectUpdates: async (projectId: string): Promise<ProjectUpdate[]> => {
    const { data, error } = await supabase
      .from('project_updates')
      .select(`
        *,
        user:users(*)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data) || [];
  },

  createProjectUpdate: async (data: Partial<ProjectUpdate>): Promise<ProjectUpdate> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('project_updates')
      .insert([snakeData])
      .select(`
        *,
        user:users(*)
      `)
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  updateProjectUpdate: async (id: string, data: Partial<ProjectUpdate>): Promise<ProjectUpdate> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('project_updates')
      .update(snakeData)
      .eq('id', id)
      .select(`
        *,
        user:users(*)
      `)
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  deleteProjectUpdate: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('project_updates')
      .delete()
      .eq('id', id);

    if (error) throw error;
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

  // Favorites
  getFavorites: async (userId: string): Promise<Favorite[]> => {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data) || [];
  },

  getFavoritesByType: async (userId: string, entityType: 'initiative' | 'project' | 'milestone' | 'deliverable'): Promise<Favorite[]> => {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('entity_type', entityType)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data) || [];
  },

  isFavorite: async (userId: string, entityType: string, entityId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  addFavorite: async (data: Partial<Favorite>): Promise<Favorite> => {
    const snakeData = toSnakeCase(data);
    const { data: result, error } = await supabase
      .from('favorites')
      .insert([snakeData])
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(result);
  },

  removeFavorite: async (userId: string, entityType: string, entityId: string): Promise<void> => {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId);

    if (error) throw error;
  },
};
