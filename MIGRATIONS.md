# Database Migrations

This document explains how to apply database migrations to your Supabase instance.

## Overview

The application uses Supabase as the database backend. Migration files are located in the `supabase/migrations/` directory and need to be applied to your Supabase instance to create the necessary tables and schema.

## Current Migrations

1. `001_initial_schema.sql` - Creates initial tables for initiatives, projects, milestones, and deliverables
2. `002_users_and_teams.sql` - Adds users and teams tables
3. `003_improve_projects_and_tasks.sql` - Improvements to projects and tasks
4. `004_comments_and_notifications.sql` - **Creates comments and notifications tables**

## How to Apply Migrations

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard at https://app.supabase.com
2. Navigate to the **SQL Editor** in the left sidebar
3. Open each migration file in order (001 through 004)
4. Copy the SQL content from each file
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

**Important:** Run migrations in order (001, 002, 003, 004) to avoid dependency issues.

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link to your project
supabase link --project-ref qswyrmuycuuymovebmzep

# Push migrations to remote database
supabase db push
```

### Option 3: Manual SQL Execution

If you prefer to connect directly to the database:

1. Get your database connection string from Supabase Dashboard → Settings → Database
2. Connect using your preferred PostgreSQL client (psql, pgAdmin, etc.)
3. Execute each migration file in order

## Current Issue: Missing Comments Table

If you're seeing an error like:
```
Could not find the table 'public.comments' in the schema cache
```

This means migration `004_comments_and_notifications.sql` has not been applied to your database yet.

**Solution:** Apply migration 004 using one of the methods above.

## Graceful Degradation

The application has been updated to handle missing comments gracefully:
- If the comments table doesn't exist, tasks will still load normally
- Comment functionality will be hidden/disabled until the migration is applied
- No error will prevent the task page from loading

## Verifying Migrations

After applying migrations, you can verify they were successful by:

1. Go to Supabase Dashboard → Table Editor
2. Check that these tables exist:
   - `initiatives`
   - `projects`
   - `milestones`
   - `deliverables`
   - `users`
   - `teams`
   - `team_members`
   - `comments` ← Should be present after migration 004
   - `notifications` ← Should be present after migration 004

3. Or run this SQL query:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

## Future Migrations

When adding new migrations:
1. Create a new file with the next number (e.g., `005_new_feature.sql`)
2. Apply it using one of the methods above
3. Update this document with the new migration details
