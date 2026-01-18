-- Create project_updates table for status updates on projects
CREATE TABLE IF NOT EXISTS project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('on-track', 'at-risk', 'off-track')),
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_updates_project_id ON project_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_project_updates_created_by ON project_updates(created_by);

-- Create trigger for updated_at
CREATE TRIGGER update_project_updates_updated_at BEFORE UPDATE ON project_updates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;

-- Create policy (allow all for now - customize based on your needs)
CREATE POLICY "Allow all operations on project_updates" ON project_updates FOR ALL USING (true) WITH CHECK (true);
