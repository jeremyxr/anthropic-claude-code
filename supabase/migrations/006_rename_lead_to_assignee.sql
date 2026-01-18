-- Rename projects.lead column to projects.assignee for consistency
-- This makes all entities (projects and deliverables) use the same "assignee" terminology

ALTER TABLE projects
RENAME COLUMN lead TO assignee;
