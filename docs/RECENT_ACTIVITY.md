# Recent Activity Feature Documentation

## Overview
The Recent Activity feature provides comprehensive activity logging and display functionality for the Lines Liaison application. It tracks user actions across the platform and displays them in a centralized Reports page.

## Architecture

### Backend Components

#### Activity API Endpoints
- **GET /api/activities** - Retrieve activity logs with filtering and pagination
- **POST /api/activities** - Create new activity log entries

#### Database Schema
```sql
activities (
  id: UUID PRIMARY KEY,
  event_type: VARCHAR(100) NOT NULL,
  actor_email: VARCHAR(255),
  target_id: VARCHAR(255),
  target_type: VARCHAR(100),
  metadata: JSONB,
  occurred_at: TIMESTAMP DEFAULT NOW()
)
```

### Frontend Components

#### Services
- **nodeApiService.ts** - API service methods for activity operations
  - `getActivities(params)` - Fetch activities with filtering
  - `createActivity(eventType, targetId, targetType, metadata)` - Log new activity

#### Hooks
- **useRecentActivity.ts** - Hook for fetching and managing activity data
  - Provides: `activities`, `loading`, `error`, `refresh`
  - Includes utility functions: `formatActivityMessage`, `formatTimeAgo`

- **useActivityLogger.ts** - Hook for logging various user actions
  - Provides logging methods for: login, logout, profile updates, project operations, file operations, task management

#### Components
- **Reports.tsx** - Main page displaying activity logs with filtering and export capabilities

## Activity Types

### User Activities
- `user_login` - User authentication
- `user_logout` - User session termination
- `profile_update` - Profile information changes

### Project Activities
- `project_create` - New project creation
- `project_update` - Project modifications
- `project_delete` - Project removal

### File Activities
- `file_upload` - File uploads
- `file_download` - File downloads

### Task Activities
- `task_create` - New task creation
- `task_update` - Task modifications
- `task_complete` - Task completion

## Usage Examples

### Logging Activities
```typescript
import { useActivityLogger } from '../hooks/useActivityLogger';

const { logProjectCreate, logFileUpload } = useActivityLogger();

// Log project creation
logProjectCreate('project-123', 'New Website Project');

// Log file upload
logFileUpload('design.pdf', 2048576, 'project-123');
```

### Displaying Activities
```typescript
import { useRecentActivity } from '../hooks/useRecentActivity';

const { activities, loading, error, refresh } = useRecentActivity({ limit: 50 });

if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error}</div>;

return (
  <div>
    {activities.map(activity => (
      <div key={activity.id}>
        {formatActivityMessage(activity)}
        <span>{formatTimeAgo(activity.occurred_at)}</span>
      </div>
    ))}
  </div>
);
```

## Features

### Filtering
- Date range filtering
- Activity type filtering
- User filtering
- Text search across activity descriptions

### Export
- CSV export functionality
- Customizable export fields
- Filtered data export

### Real-time Updates
- Automatic refresh capabilities
- Live activity tracking
- Responsive UI updates

## Configuration

### Environment Variables
Ensure the following environment variables are configured:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key

### Database Setup
Run the following migration to create the activities table:
```sql
CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  actor_email VARCHAR(255),
  target_id VARCHAR(255),
  target_type VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activities_occurred_at ON activities(occurred_at DESC);
CREATE INDEX idx_activities_event_type ON activities(event_type);
CREATE INDEX idx_activities_actor_email ON activities(actor_email);
```

## Security Considerations

- Activity logs may contain sensitive information - ensure proper access controls
- Implement rate limiting on activity creation endpoints
- Sanitize user inputs in metadata fields
- Consider data retention policies for activity logs

## Performance Optimization

- Use pagination for large activity datasets
- Implement proper database indexing
- Consider archiving old activity logs
- Use efficient filtering queries

## Troubleshooting

### Common Issues
1. **Activities not appearing** - Check backend API connectivity and authentication
2. **Slow loading** - Verify database indexes and query optimization
3. **Export failures** - Check CSV generation and file permissions

### Debug Mode
Enable debug logging by setting `DEBUG=true` in environment variables.