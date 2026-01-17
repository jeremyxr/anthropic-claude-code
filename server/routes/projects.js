const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Milestone = require('../models/Milestone');

// Get all projects
router.get('/', (req, res) => {
  try {
    const { initiativeId } = req.query;
    let projects;

    if (initiativeId) {
      projects = Project.getByInitiative(initiativeId);
    } else {
      projects = Project.getAll();
    }

    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single project
router.get('/:id', (req, res) => {
  try {
    const project = Project.getById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get project with milestones
router.get('/:id/with-milestones', (req, res) => {
  try {
    const project = Project.getById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const milestones = Milestone.getByProject(req.params.id);
    res.json({ ...project, milestones });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create project
router.post('/', (req, res) => {
  try {
    const project = Project.create(req.body);
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update project
router.put('/:id', (req, res) => {
  try {
    const project = Project.update(req.params.id, req.body);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete project
router.delete('/:id', (req, res) => {
  try {
    const success = Project.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
