# Product Development Collaboration App

A comprehensive product development management application built on top of JIRA, enabling teams to track initiatives, projects, milestones, and deliverables with seamless design collaboration.

## Features

- **Hierarchical Work Management**: Organize work in a four-level hierarchy:
  - **Initiatives** - Strategic high-level goals
  - **Projects** - Specific projects nested under initiatives
  - **Milestones** - Key milestones within projects
  - **Deliverables** - Individual work items that map to milestones

- **JIRA Integration**:
  - Link deliverables to JIRA issues
  - Sync status updates from JIRA
  - Create JIRA issues directly from deliverables
  - Support for JIRA Cloud REST API

- **Interactive Dashboard**: View all work at a glance with status tracking and progress metrics

- **Modern UI**: Built with Next.js, React, and Tailwind CSS for a responsive, beautiful interface

## Tech Stack

- **Frontend**: Next.js 14 with React 19 and TypeScript
- **Backend**: Node.js with Express
- **Styling**: Tailwind CSS
- **Data Storage**: JSON file-based storage (easily replaceable with a database)
- **API Integration**: JIRA Cloud REST API

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn
- JIRA Cloud account (optional, for JIRA integration features)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd anthropic-claude-code
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` file with JIRA credentials (optional):
   ```
   JIRA_HOST=your-domain.atlassian.net
   JIRA_EMAIL=your-email@example.com
   JIRA_API_TOKEN=your-api-token
   ```

   To get a JIRA API token:
   - Go to https://id.atlassian.com/manage-profile/security/api-tokens
   - Click "Create API token"
   - Copy the token to your `.env` file

### Running the Application

#### Development Mode

Run both the Next.js frontend and Express backend:

```bash
npm run dev:all
```

Or run them separately:

```bash
# Terminal 1 - Frontend (port 3000)
npm run dev

# Terminal 2 - Backend (port 3001)
npm run server
```

#### Production Mode

```bash
# Build the Next.js app
npm run build

# Start the production server
npm start

# Don't forget to also run the backend server
npm run server
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Usage

### Creating an Initiative

1. Navigate to the Initiatives page
2. Click "New Initiative"
3. Fill in the details (name, description, status, owner, target date)
4. Click "Create Initiative"

### Managing the Hierarchy

1. Click on an initiative to view its details
2. The hierarchical view shows:
   - Projects nested under the initiative
   - Milestones nested under each project
   - Deliverables nested under each milestone
3. Click on the arrows to expand/collapse each level

### JIRA Integration

#### Linking a Deliverable to JIRA

Use the API endpoint to link a deliverable:

```bash
curl -X POST http://localhost:3001/api/jira/link-deliverable \
  -H "Content-Type: application/json" \
  -d '{
    "deliverableId": "your-deliverable-id",
    "jiraIssueKey": "PROJ-123"
  }'
```

#### Syncing Status from JIRA

```bash
curl -X POST http://localhost:3001/api/jira/sync-from-jira/your-deliverable-id
```

#### Creating a JIRA Issue from a Deliverable

```bash
curl -X POST http://localhost:3001/api/jira/create-issue \
  -H "Content-Type: application/json" \
  -d '{
    "deliverableId": "your-deliverable-id",
    "projectKey": "PROJ",
    "issueType": "Task"
  }'
```

## API Documentation

### Initiatives

- `GET /api/initiatives` - Get all initiatives
- `GET /api/initiatives/:id` - Get a single initiative
- `GET /api/initiatives/:id/with-projects` - Get initiative with nested projects
- `POST /api/initiatives` - Create a new initiative
- `PUT /api/initiatives/:id` - Update an initiative
- `DELETE /api/initiatives/:id` - Delete an initiative

### Projects

- `GET /api/projects` - Get all projects
- `GET /api/projects?initiativeId=:id` - Get projects by initiative
- `GET /api/projects/:id` - Get a single project
- `GET /api/projects/:id/with-milestones` - Get project with nested milestones
- `POST /api/projects` - Create a new project
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project

### Milestones

- `GET /api/milestones` - Get all milestones
- `GET /api/milestones?projectId=:id` - Get milestones by project
- `GET /api/milestones/:id` - Get a single milestone
- `GET /api/milestones/:id/with-deliverables` - Get milestone with nested deliverables
- `POST /api/milestones` - Create a new milestone
- `PUT /api/milestones/:id` - Update a milestone
- `DELETE /api/milestones/:id` - Delete a milestone

### Deliverables

- `GET /api/deliverables` - Get all deliverables
- `GET /api/deliverables?milestoneId=:id` - Get deliverables by milestone
- `GET /api/deliverables/:id` - Get a single deliverable
- `POST /api/deliverables` - Create a new deliverable
- `PUT /api/deliverables/:id` - Update a deliverable
- `DELETE /api/deliverables/:id` - Delete a deliverable

### JIRA Integration

- `GET /api/jira/config` - Check if JIRA is configured
- `GET /api/jira/projects` - Get all JIRA projects
- `GET /api/jira/issue/:issueKey` - Get a JIRA issue
- `POST /api/jira/search` - Search JIRA issues
- `POST /api/jira/link-deliverable` - Link a deliverable to a JIRA issue
- `POST /api/jira/sync-from-jira/:deliverableId` - Sync deliverable status from JIRA
- `POST /api/jira/create-issue` - Create a JIRA issue from a deliverable

## Project Structure

```
.
├── app/                          # Next.js app directory
│   ├── dashboard/                # Dashboard page
│   ├── initiatives/              # Initiatives pages
│   │   └── [id]/                 # Individual initiative detail page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # React components
│   ├── InitiativeCard.tsx        # Initiative card component
│   └── StatusBadge.tsx           # Status badge component
├── lib/                          # Utility libraries
│   └── api.ts                    # API client and types
├── server/                       # Express backend
│   ├── index.js                  # Server entry point
│   ├── models/                   # Data models
│   │   ├── database.js           # Database abstraction
│   │   ├── Initiative.js         # Initiative model
│   │   ├── Project.js            # Project model
│   │   ├── Milestone.js          # Milestone model
│   │   └── Deliverable.js        # Deliverable model
│   ├── routes/                   # API routes
│   │   ├── initiatives.js        # Initiative routes
│   │   ├── projects.js           # Project routes
│   │   ├── milestones.js         # Milestone routes
│   │   ├── deliverables.js       # Deliverable routes
│   │   └── jira.js               # JIRA integration routes
│   └── services/                 # Business logic services
│       └── jiraService.js        # JIRA API client
├── data/                         # JSON data storage
├── .env.example                  # Environment variables template
├── next.config.js                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Project dependencies
```

## Customization

### Using a Database

The current implementation uses JSON files for data storage. To use a real database:

1. Install your preferred database client (e.g., `pg` for PostgreSQL, `mysql2` for MySQL)
2. Modify `server/models/database.js` to connect to your database
3. Update the model methods to use SQL queries instead of JSON operations

### Extending the Hierarchy

To add more levels or custom fields:

1. Create a new model in `server/models/`
2. Add corresponding routes in `server/routes/`
3. Update the frontend components and API client in `lib/api.ts`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC