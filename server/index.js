const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const initiativesRouter = require('./routes/initiatives');
const projectsRouter = require('./routes/projects');
const milestonesRouter = require('./routes/milestones');
const deliverablesRouter = require('./routes/deliverables');
const jiraRouter = require('./routes/jira');

// Use routes
app.use('/api/initiatives', initiativesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/milestones', milestonesRouter);
app.use('/api/deliverables', deliverablesRouter);
app.use('/api/jira', jiraRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
