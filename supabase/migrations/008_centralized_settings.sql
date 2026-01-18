-- Create team_statuses table for customizable status workflows
CREATE TABLE IF NOT EXISTS team_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('initiative', 'project', 'milestone', 'deliverable')),
  status_value TEXT NOT NULL,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280', -- Default gray color
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, entity_type, status_value)
);

-- Create team_labels table for centralized label management
CREATE TABLE IF NOT EXISTS team_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#6B7280', -- Default gray color
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, name)
);

-- Create team_priorities table for custom priority levels
CREATE TABLE IF NOT EXISTS team_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  priority_value TEXT NOT NULL,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280', -- Default gray color
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, priority_value)
);

-- Add labels column to initiatives, projects, and milestones (deliverables already has tags)
ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS labels TEXT[] DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS labels TEXT[] DEFAULT '{}';
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS labels TEXT[] DEFAULT '{}';

-- Rename tags to labels in deliverables for consistency
ALTER TABLE deliverables RENAME COLUMN tags TO labels;

-- Remove old database CHECK constraints on status columns to allow custom statuses
-- (We'll validate in the application layer instead)
ALTER TABLE initiatives DROP CONSTRAINT IF EXISTS initiatives_status_check;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE milestones DROP CONSTRAINT IF EXISTS milestones_status_check;
ALTER TABLE deliverables DROP CONSTRAINT IF EXISTS deliverables_status_check;

-- Add team_id to initiatives, projects, milestones (they need to reference a team for settings)
ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_statuses_team_id ON team_statuses(team_id);
CREATE INDEX IF NOT EXISTS idx_team_statuses_entity_type ON team_statuses(team_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_team_labels_team_id ON team_labels(team_id);
CREATE INDEX IF NOT EXISTS idx_team_priorities_team_id ON team_priorities(team_id);

-- Create triggers for updated_at
CREATE TRIGGER update_team_statuses_updated_at BEFORE UPDATE ON team_statuses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_labels_updated_at BEFORE UPDATE ON team_labels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_priorities_updated_at BEFORE UPDATE ON team_priorities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE team_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_priorities ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - customize based on your needs)
CREATE POLICY "Allow all operations on team_statuses" ON team_statuses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on team_labels" ON team_labels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on team_priorities" ON team_priorities FOR ALL USING (true) WITH CHECK (true);

-- Insert default statuses for all teams (matching current hardcoded values)
-- For initiatives
INSERT INTO team_statuses (team_id, entity_type, status_value, label, color, position)
SELECT
  t.id as team_id,
  'initiative' as entity_type,
  status_value,
  label,
  color,
  position
FROM teams t
CROSS JOIN (
  VALUES
    ('planning', 'Planning', '#6B7280', 1),
    ('active', 'Active', '#3B82F6', 2),
    ('on-hold', 'On Hold', '#EF4444', 3),
    ('completed', 'Completed', '#10B981', 4),
    ('cancelled', 'Cancelled', '#9CA3AF', 5)
) AS defaults(status_value, label, color, position)
ON CONFLICT (team_id, entity_type, status_value) DO NOTHING;

-- For projects
INSERT INTO team_statuses (team_id, entity_type, status_value, label, color, position)
SELECT
  t.id as team_id,
  'project' as entity_type,
  status_value,
  label,
  color,
  position
FROM teams t
CROSS JOIN (
  VALUES
    ('not-started', 'Not Started', '#6B7280', 1),
    ('in-progress', 'In Progress', '#3B82F6', 2),
    ('completed', 'Completed', '#10B981', 3),
    ('on-hold', 'On Hold', '#EF4444', 4)
) AS defaults(status_value, label, color, position)
ON CONFLICT (team_id, entity_type, status_value) DO NOTHING;

-- For milestones
INSERT INTO team_statuses (team_id, entity_type, status_value, label, color, position)
SELECT
  t.id as team_id,
  'milestone' as entity_type,
  status_value,
  label,
  color,
  position
FROM teams t
CROSS JOIN (
  VALUES
    ('not-started', 'Not Started', '#6B7280', 1),
    ('in-progress', 'In Progress', '#3B82F6', 2),
    ('completed', 'Completed', '#10B981', 3),
    ('at-risk', 'At Risk', '#EF4444', 4)
) AS defaults(status_value, label, color, position)
ON CONFLICT (team_id, entity_type, status_value) DO NOTHING;

-- For deliverables
INSERT INTO team_statuses (team_id, entity_type, status_value, label, color, position)
SELECT
  t.id as team_id,
  'deliverable' as entity_type,
  status_value,
  label,
  color,
  position
FROM teams t
CROSS JOIN (
  VALUES
    ('todo', 'To Do', '#6B7280', 1),
    ('in-progress', 'In Progress', '#3B82F6', 2),
    ('in-review', 'In Review', '#8B5CF6', 3),
    ('done', 'Done', '#10B981', 4),
    ('blocked', 'Blocked', '#EF4444', 5)
) AS defaults(status_value, label, color, position)
ON CONFLICT (team_id, entity_type, status_value) DO NOTHING;

-- Insert default priorities for all teams
INSERT INTO team_priorities (team_id, priority_value, label, color, position)
SELECT
  t.id as team_id,
  priority_value,
  label,
  color,
  position
FROM teams t
CROSS JOIN (
  VALUES
    ('low', 'Low', '#10B981', 1),
    ('medium', 'Medium', '#F59E0B', 2),
    ('high', 'High', '#F97316', 3),
    ('critical', 'Critical', '#EF4444', 4)
) AS defaults(priority_value, label, color, position)
ON CONFLICT (team_id, priority_value) DO NOTHING;

-- Insert some example default labels for all teams (teams can customize these)
INSERT INTO team_labels (team_id, name, description, color)
SELECT
  t.id as team_id,
  name,
  description,
  color
FROM teams t
CROSS JOIN (
  VALUES
    ('bug', 'Bug or defect that needs fixing', '#EF4444'),
    ('feature', 'New feature or enhancement', '#3B82F6'),
    ('documentation', 'Documentation updates', '#8B5CF6'),
    ('technical-debt', 'Technical debt or refactoring', '#F59E0B')
) AS defaults(name, description, color)
ON CONFLICT (team_id, name) DO NOTHING;

-- Update existing initiatives, projects, milestones, deliverables to have team_id
-- We'll set team_id based on the team that created them (via created_by or owner)
UPDATE initiatives i
SET team_id = (
  SELECT tm.team_id
  FROM team_members tm
  WHERE tm.user_id = i.created_by
  LIMIT 1
)
WHERE team_id IS NULL AND created_by IS NOT NULL;

-- For projects, get team_id from their initiative
UPDATE projects p
SET team_id = (
  SELECT i.team_id
  FROM initiatives i
  WHERE i.id = p.initiative_id
  LIMIT 1
)
WHERE team_id IS NULL;

-- For milestones, get team_id from their project
UPDATE milestones m
SET team_id = (
  SELECT p.team_id
  FROM projects p
  WHERE p.id = m.project_id
  LIMIT 1
)
WHERE team_id IS NULL;

-- For deliverables, get team_id from their milestone
UPDATE deliverables d
SET team_id = (
  SELECT m.team_id
  FROM milestones m
  WHERE m.id = d.milestone_id
  LIMIT 1
)
WHERE team_id IS NULL;
