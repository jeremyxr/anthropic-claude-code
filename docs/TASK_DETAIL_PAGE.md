# Task Detail Page - Technical Documentation

## Overview
The task detail page (`/tasks/[id]`) provides a dedicated view for individual tasks (deliverables) with comprehensive editing capabilities, context navigation, and activity tracking.

## Data Model

### Deliverable (Task)
```typescript
interface Deliverable {
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
```

### Related Entities
- **Milestone**: Parent milestone containing the task
- **Project**: Project containing the milestone
- **Initiative**: Top-level initiative containing the project
- **TeamMember**: Team members available for assignment

## API Endpoints

### Primary Endpoints
```typescript
// Get task with full context (initiative -> project -> milestone -> task)
api.getDeliverableWithContext(id: string): Promise<{
  deliverable: Deliverable;
  milestone: Milestone;
  project: Project;
  initiative: Initiative;
}>

// Get single task
api.getDeliverable(id: string): Promise<Deliverable>

// Update task field
api.updateDeliverable(id: string, data: Partial<Deliverable>): Promise<Deliverable>

// Delete task
api.deleteDeliverable(id: string): Promise<void>

// Get team members for assignee dropdown
api.getTeamMembers(teamId: string): Promise<TeamMember[]>
```

## Failure Cases & Error Handling

### 1. Task Not Found (404)
**Scenario**: User navigates to `/tasks/invalid-id` or task was deleted

**Error Detection**:
```typescript
if (err.code === 'PGRST116') {
  setError('Task not found. It may have been deleted.');
}
```

**User Experience**:
- Display error message with explanation
- Provide "Go Back" button
- Provide "Retry" button in case of transient error

**Prevention**:
- Validate task ID before navigation
- Handle deleted tasks gracefully in list views

### 2. Permission Denied (403)
**Scenario**: User doesn't have access to the task/project/initiative

**Error Detection**:
```typescript
if (err.message?.includes('permission')) {
  setError('You do not have permission to view this task.');
}
```

**User Experience**:
- Clear error message about permissions
- Option to go back
- No retry option (won't help)

**Prevention**:
- Implement Row Level Security (RLS) in Supabase
- Check permissions before rendering links

### 3. Network Failure
**Scenario**: Network disconnection, timeout, or server unavailable

**Error Detection**:
```typescript
if (err.message?.includes('Network')) {
  setError('Network error. Please check your connection and try again.');
}
```

**User Experience**:
- Friendly error message
- Retry button with exponential backoff
- Offline indicator

**Prevention**:
- Implement retry logic with exponential backoff
- Cache data when possible
- Service worker for offline support (future)

### 4. Concurrent Edit Conflicts (409)
**Scenario**: Two users edit the same task simultaneously

**Error Detection**:
```typescript
if (err.message?.includes('conflict') || err.code === '409') {
  alert('This task was modified by someone else. Reloading latest version...');
  await loadData();
}
```

**User Experience**:
- Alert user about conflict
- Automatically reload latest data
- User's changes are lost (last-write-wins)

**Prevention**:
- Implement optimistic locking with version numbers
- Real-time updates via Supabase subscriptions
- Show "Someone else is editing" indicator

### 5. Missing Related Entities
**Scenario**: Milestone, project, or initiative was deleted

**Error Detection**:
```typescript
// getDeliverableWithContext will throw if any parent is missing
if (milestoneError) throw milestoneError;
if (projectError) throw projectError;
if (initiativeError) throw initiativeError;
```

**User Experience**:
- Error message indicating broken relationships
- Option to orphan task or delete it
- Navigate to safe location

**Prevention**:
- Database CASCADE DELETE constraints
- Prevent deletion of entities with children
- Archive instead of delete

### 6. Invalid Field Updates
**Scenario**: User tries to set invalid data (e.g., invalid status)

**Error Detection**:
```typescript
// Type validation at TypeScript level
// Runtime validation in API
```

**User Experience**:
- Inline error under field
- Revert to previous value
- Show validation message

**Prevention**:
- TypeScript types
- Form validation
- Database constraints

### 7. Authentication Failures
**Scenario**: User session expires or user logs out

**Error Detection**:
```typescript
if (!currentUser) {
  alert('You must be logged in to edit tasks');
  throw new Error('Not authenticated');
}
```

**User Experience**:
- Redirect to login page
- Preserve return URL
- Show session expired message

**Prevention**:
- Check auth before operations
- Refresh tokens automatically
- Handle auth state changes

## Production Concerns

### Performance

#### Query Optimization
```typescript
// Current: 4 sequential queries (task -> milestone -> project -> initiative)
// Impact: 200-400ms latency
// Solution: Use Supabase join query
const { data } = await supabase
  .from('deliverables')
  .select(`
    *,
    milestone:milestones(*,
      project:projects(*,
        initiative:initiatives(*)
      )
    )
  `)
  .eq('id', id)
  .single();
```

**Benefit**: Single query, 50-100ms latency

#### Data Caching
- Cache task data in React state
- Use SWR or React Query for automatic revalidation
- Cache team members list (rarely changes)

#### Lazy Loading
- Load activity/comments only when needed
- Paginate activity feed for old tasks
- Defer loading non-critical data

### Scalability

#### Database Indexes
```sql
-- Critical indexes for task detail page
CREATE INDEX idx_deliverables_milestone_id ON deliverables(milestone_id);
CREATE INDEX idx_milestones_project_id ON milestones(project_id);
CREATE INDEX idx_projects_initiative_id ON projects(initiative_id);
CREATE INDEX idx_deliverables_assignee ON deliverables(assignee);
CREATE INDEX idx_deliverables_status ON deliverables(status);
```

#### Connection Pooling
- Use Supabase connection pooling
- Limit concurrent requests
- Implement request queuing

### Security

#### Row Level Security (RLS)
```sql
-- Only team members can view tasks
CREATE POLICY "Team members can view tasks" ON deliverables
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN milestones m ON m.id = deliverables.milestone_id
      JOIN projects p ON p.id = m.project_id
      JOIN initiatives i ON i.id = p.initiative_id
      WHERE tm.user_id = auth.uid()
        AND tm.team_id = i.team_id
    )
  );
```

#### Input Sanitization
- Validate all user inputs
- Escape HTML in descriptions
- Prevent XSS attacks
- Rate limit updates

### Monitoring & Observability

#### Key Metrics
- Page load time (target: < 1s)
- API response time (target: < 200ms)
- Error rate (target: < 1%)
- User actions (edits, deletes, navigations)

#### Error Tracking
```typescript
// Integrate Sentry or similar
Sentry.captureException(error, {
  tags: {
    page: 'task-detail',
    taskId: id,
    action: 'update'
  },
  user: { id: currentUser?.id }
});
```

#### Logging
- Log all task updates with user ID and timestamp
- Log permission failures
- Log performance metrics
- Create audit trail

### Data Consistency

#### Transaction Management
```typescript
// Use Supabase transactions for multi-table updates
const { data, error } = await supabase.rpc('update_task_with_audit', {
  task_id: id,
  updates: { name: 'New name' },
  user_id: currentUser.id
});
```

#### Eventual Consistency
- Real-time subscriptions may lag
- Handle stale data gracefully
- Show "outdated" indicator
- Implement conflict resolution

### Backup & Recovery

#### Data Retention
- Keep audit log of all changes
- Soft delete tasks (don't hard delete)
- Point-in-time recovery for database

#### Disaster Recovery
- Database backups every 6 hours
- Test restore procedures monthly
- Document recovery steps

## Testing Strategy

### Unit Tests
- Test data fetching functions
- Test error handling logic
- Test update functions
- Mock API calls

### Integration Tests
- Test full page load flow
- Test update operations
- Test navigation
- Test error states

### E2E Tests
```typescript
describe('Task Detail Page', () => {
  it('should load task with full context', async () => {
    await page.goto('/tasks/task-id');
    await expect(page.locator('h1')).toContainText('Task name');
    await expect(page.locator('.breadcrumb')).toContainText('Initiative');
  });

  it('should update task name inline', async () => {
    await page.click('[data-testid="task-name"]');
    await page.fill('input[type="text"]', 'New name');
    await page.press('Enter');
    await expect(page.locator('h1')).toContainText('New name');
  });

  it('should handle task not found', async () => {
    await page.goto('/tasks/invalid-id');
    await expect(page.locator('.error')).toContainText('Task not found');
  });
});
```

### Load Testing
- Simulate 100 concurrent users
- Test with large task counts (1000+ tasks)
- Test slow network conditions
- Test with large descriptions/comments

## Future Enhancements

### Comments & Activity
- Add comment system
- Track all field changes
- Show who made changes
- @mention team members

### Real-time Collaboration
- Show who's viewing the task
- Live cursor positions
- Conflict-free editing (CRDT)
- WebSocket updates

### Attachments
- Upload files to tasks
- Image previews
- File size limits
- Storage quotas

### Subtasks
- Add subtasks to tasks
- Nested task hierarchy
- Roll-up progress
- Dependency tracking

### Templates
- Create task templates
- Quick task creation
- Recurring tasks
- Copy task with subtasks

### Mobile Optimization
- Responsive design
- Touch-friendly controls
- Offline mode
- Push notifications

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Indexes created
- [ ] RLS policies enabled
- [ ] Environment variables set
- [ ] Error tracking configured
- [ ] Monitoring dashboards created
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Documentation updated
- [ ] Team trained on new feature
