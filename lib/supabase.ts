import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Debug logging
if (typeof window !== 'undefined') {
  console.log('Supabase Config:', {
    url: supabaseUrl || 'MISSING',
    hasKey: !!supabaseAnonKey,
    keyLength: supabaseAnonKey?.length || 0
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
  throw new Error('Supabase environment variables are not set. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type Initiative = {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  owner: string | null;
  target_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  initiative_id: string;
  name: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'on-hold';
  lead: string | null;
  created_at: string;
  updated_at: string;
};

export type Milestone = {
  id: string;
  project_id: string;
  name: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'at-risk';
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Deliverable = {
  id: string;
  milestone_id: string;
  name: string;
  description: string;
  status: 'todo' | 'in-progress' | 'in-review' | 'done' | 'blocked';
  type: string;
  assignee: string | null;
  jira_issue_key: string | null;
  jira_issue_id: string | null;
  tags: string[];
  custom_fields: Record<string, any>;
  created_at: string;
  updated_at: string;
};
