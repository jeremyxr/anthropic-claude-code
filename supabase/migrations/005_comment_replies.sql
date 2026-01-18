-- Add support for comment replies (threaded comments)
-- Comments can have a parent_comment_id to create one level of threading

-- Add parent_comment_id column to comments table
ALTER TABLE comments
ADD COLUMN parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- Add index for efficient querying of replies
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);

-- Add comment to describe the column
COMMENT ON COLUMN comments.parent_comment_id IS 'References the parent comment ID for replies. Null for top-level comments.';
