const express = require('express');
const router = express.Router();
const Milestone = require('../models/Milestone');
const Deliverable = require('../models/Deliverable');

// Get all milestones
router.get('/', (req, res) => {
  try {
    const { projectId } = req.query;
    let milestones;

    if (projectId) {
      milestones = Milestone.getByProject(projectId);
    } else {
      milestones = Milestone.getAll();
    }

    res.json(milestones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single milestone
router.get('/:id', (req, res) => {
  try {
    const milestone = Milestone.getById(req.params.id);
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }
    res.json(milestone);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get milestone with deliverables
router.get('/:id/with-deliverables', (req, res) => {
  try {
    const milestone = Milestone.getById(req.params.id);
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const deliverables = Deliverable.getByMilestone(req.params.id);
    res.json({ ...milestone, deliverables });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create milestone
router.post('/', (req, res) => {
  try {
    const milestone = Milestone.create(req.body);
    res.status(201).json(milestone);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update milestone
router.put('/:id', (req, res) => {
  try {
    const milestone = Milestone.update(req.params.id, req.body);
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }
    res.json(milestone);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete milestone
router.delete('/:id', (req, res) => {
  try {
    const success = Milestone.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Milestone not found' });
    }
    res.json({ message: 'Milestone deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
