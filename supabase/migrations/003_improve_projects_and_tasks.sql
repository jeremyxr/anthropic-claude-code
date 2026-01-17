-- Add target_delivery_date to projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS target_delivery_date DATE;

-- Add priority and due_date to deliverables (tasks)
ALTER TABLE deliverables
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS due_date DATE;

-- Update deliverables to make fields optional (they already are, but let's be explicit)
ALTER TABLE deliverables
  ALTER COLUMN description DROP NOT NULL,
  ALTER COLUMN type DROP NOT NULL;

-- Create index for performance on new fields
CREATE INDEX IF NOT EXISTS idx_projects_target_delivery_date ON projects(target_delivery_date);
CREATE INDEX IF NOT EXISTS idx_deliverables_priority ON deliverables(priority);
CREATE INDEX IF NOT EXISTS idx_deliverables_due_date ON deliverables(due_date);
