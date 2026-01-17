const express = require('express');
const router = express.Router();
const jiraService = require('../services/jiraService');
const Deliverable = require('../models/Deliverable');

// Check JIRA configuration
router.get('/config', (req, res) => {
  res.json({ configured: jiraService.isConfigured() });
});

// Get JIRA projects
router.get('/projects', async (req, res) => {
  try {
    const projects = await jiraService.getProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get issue by key
router.get('/issue/:issueKey', async (req, res) => {
  try {
    const issue = await jiraService.getIssue(req.params.issueKey);
    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search issues
router.post('/search', async (req, res) => {
  try {
    const { jql, fields } = req.body;
    const results = await jiraService.searchIssues(jql, fields);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Link deliverable to JIRA issue
router.post('/link-deliverable', async (req, res) => {
  try {
    const { deliverableId, jiraIssueKey } = req.body;

    if (!deliverableId || !jiraIssueKey) {
      return res.status(400).json({ error: 'deliverableId and jiraIssueKey are required' });
    }

    // Fetch JIRA issue to validate
    const jiraIssue = await jiraService.getIssue(jiraIssueKey);

    // Update deliverable with JIRA info
    const deliverable = Deliverable.update(deliverableId, {
      jiraIssueKey: jiraIssue.key,
      jiraIssueId: jiraIssue.id,
    });

    if (!deliverable) {
      return res.status(404).json({ error: 'Deliverable not found' });
    }

    res.json({ deliverable, jiraIssue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync deliverable status from JIRA
router.post('/sync-from-jira/:deliverableId', async (req, res) => {
  try {
    const deliverable = Deliverable.getById(req.params.deliverableId);

    if (!deliverable) {
      return res.status(404).json({ error: 'Deliverable not found' });
    }

    if (!deliverable.jiraIssueKey) {
      return res.status(400).json({ error: 'Deliverable is not linked to a JIRA issue' });
    }

    const jiraIssue = await jiraService.getIssue(deliverable.jiraIssueKey);

    // Map JIRA status to our status
    const statusMap = {
      'To Do': 'todo',
      'In Progress': 'in-progress',
      'In Review': 'in-review',
      'Done': 'done',
      'Blocked': 'blocked',
    };

    const newStatus = statusMap[jiraIssue.fields.status.name] || deliverable.status;

    const updatedDeliverable = Deliverable.update(req.params.deliverableId, {
      status: newStatus,
      assignee: jiraIssue.fields.assignee?.displayName || deliverable.assignee,
    });

    res.json({ deliverable: updatedDeliverable, jiraIssue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create JIRA issue from deliverable
router.post('/create-issue', async (req, res) => {
  try {
    const { deliverableId, projectKey, issueType } = req.body;

    if (!deliverableId || !projectKey) {
      return res.status(400).json({ error: 'deliverableId and projectKey are required' });
    }

    const deliverable = Deliverable.getById(deliverableId);

    if (!deliverable) {
      return res.status(404).json({ error: 'Deliverable not found' });
    }

    const issueData = {
      summary: deliverable.name,
      description: deliverable.description,
      issueType: issueType || 'Task',
    };

    const jiraIssue = await jiraService.createIssue(projectKey, issueData);

    // Update deliverable with JIRA info
    const updatedDeliverable = Deliverable.update(deliverableId, {
      jiraIssueKey: jiraIssue.key,
      jiraIssueId: jiraIssue.id,
    });

    res.json({ deliverable: updatedDeliverable, jiraIssue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
