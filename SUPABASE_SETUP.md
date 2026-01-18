# Supabase Setup Guide

This guide will help you set up Supabase as the database for your Product Development Collaboration App.

## Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Enter your project details:
   - Name: `product-dev-collab` (or your preferred name)
   - Database Password: Choose a strong password (save this!)
   - Region: Choose the region closest to you
4. Click "Create new project" and wait for it to initialize (takes ~2 minutes)

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll find two important values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: A long JWT token

## Step 3: Configure Environment Variables

1. Create a `.env.local` file in the root of your project:

```bash
cp .env.example .env.local
```

2. Update the `.env.local` file with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://qswyrmuycuuymovebmzep.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here

# JIRA Configuration (optional)
JIRA_HOST=your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token
```

**Important**: Replace `your-actual-anon-key-here` with the actual anon key from your Supabase dashboard.

## Step 4: Create Database Tables

You need to run all migration files in order. In your Supabase project:

### Migration 1: Initial Schema
1. Go to **SQL Editor** → Click "New Query"
2. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and click "Run"

Creates: `initiatives`, `projects`, `milestones`, `deliverables` tables

### Migration 2: Users and Teams
1. Create another new query
2. Copy the contents of `supabase/migrations/002_users_and_teams.sql`
3. Paste and click "Run"

Creates: `users`, `teams`, `team_members` tables

### Migration 3: Improvements
1. Create another new query
2. Copy the contents of `supabase/migrations/003_improve_projects_and_tasks.sql`
3. Paste and click "Run"

Adds: `target_delivery_date` to projects, `priority` and `due_date` to deliverables

### Migration 4: Comments and Notifications
1. Create another new query
2. Copy the contents of `supabase/migrations/004_comments_and_notifications.sql`
3. Paste and click "Run"

Creates: `comments`, `notifications` tables with @mention support

**Note**: If you skip migration 4, the task detail pages and inbox will still work but comments/notifications features will be disabled.

## Step 5: Verify the Setup

1. Go to **Table Editor** in your Supabase dashboard
2. You should see these tables:
   - `initiatives`, `projects`, `milestones`, `deliverables` (from migration 1)
   - `users`, `teams`, `team_members` (from migration 2)
   - `comments`, `notifications` (from migration 4, if you ran it)
3. Click on each table to verify the schema

## Step 6: Test the Application

1. Start your Next.js development server:

```bash
npm run dev
```

2. Open http://localhost:3000
3. Try creating an initiative to test the database connection

## Database Schema

Here's the structure of the database:

```
initiatives
├── id (UUID, primary key)
├── name (text)
├── description (text)
├── status (enum: planning, active, on-hold, completed, cancelled)
├── owner (text)
├── target_date (timestamp)
├── created_at (timestamp)
└── updated_at (timestamp)

projects
├── id (UUID, primary key)
├── initiative_id (UUID, foreign key → initiatives.id)
├── name (text)
├── description (text)
├── status (enum: not-started, in-progress, completed, on-hold)
├── lead (text)
├── created_at (timestamp)
└── updated_at (timestamp)

milestones
├── id (UUID, primary key)
├── project_id (UUID, foreign key → projects.id)
├── name (text)
├── description (text)
├── status (enum: not-started, in-progress, completed, at-risk)
├── due_date (timestamp)
├── created_at (timestamp)
└── updated_at (timestamp)

deliverables
├── id (UUID, primary key)
├── milestone_id (UUID, foreign key → milestones.id)
├── name (text)
├── description (text)
├── status (enum: todo, in-progress, in-review, done, blocked)
├── type (text)
├── assignee (text)
├── jira_issue_key (text)
├── jira_issue_id (text)
├── tags (text[])
├── custom_fields (jsonb)
├── created_at (timestamp)
└── updated_at (timestamp)
```

## Row Level Security (RLS)

The migration script includes RLS policies that allow all operations for now. You can customize these later by:

1. Going to **Authentication** → **Policies** in Supabase
2. Editing the policies for each table
3. Adding user-specific rules (e.g., users can only see their own initiatives)

Example custom policy:
```sql
-- Only allow users to see initiatives they own
CREATE POLICY "Users can view own initiatives"
ON initiatives FOR SELECT
USING (auth.uid() = owner_user_id);
```

## Troubleshooting

### Issue: "Invalid API key"
- Make sure you copied the **anon** key, not the service_role key
- Check that there are no extra spaces in your .env.local file

### Issue: "relation does not exist"
- Make sure you ran the migration SQL in the SQL Editor
- Verify the tables exist in the Table Editor

### Issue: "Row Level Security policy violation"
- Check that the RLS policies are created correctly
- For development, the default policies allow all operations

### Issue: Environment variables not loading
- Make sure your file is named `.env.local` (not `.env`)
- Restart your development server after changing .env.local
- Verify the variable names start with `NEXT_PUBLIC_`

## Next Steps

- **Seed Data**: You can add sample data through the Table Editor
- **Backups**: Set up automatic backups in Project Settings → Database
- **Monitor**: Use the Dashboard to monitor your database usage
- **Auth**: Consider adding Supabase Auth for user authentication

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
