const express = require('express');
const router = express.Router();
const Initiative = require('../models/Initiative');
const Project = require('../models/Project');

// Get all initiatives
router.get('/', (req, res) => {
  try {
    const initiatives = Initiative.getAll();
    res.json(initiatives);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single initiative
router.get('/:id', (req, res) => {
  try {
    const initiative = Initiative.getById(req.params.id);
    if (!initiative) {
      return res.status(404).json({ error: 'Initiative not found' });
    }
    res.json(initiative);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get initiative with projects
router.get('/:id/with-projects', (req, res) => {
  try {
    const initiative = Initiative.getById(req.params.id);
    if (!initiative) {
      return res.status(404).json({ error: 'Initiative not found' });
    }

    const projects = Project.getByInitiative(req.params.id);
    res.json({ ...initiative, projects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create initiative
router.post('/', (req, res) => {
  try {
    const initiative = Initiative.create(req.body);
    res.status(201).json(initiative);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update initiative
router.put('/:id', (req, res) => {
  try {
    const initiative = Initiative.update(req.params.id, req.body);
    if (!initiative) {
      return res.status(404).json({ error: 'Initiative not found' });
    }
    res.json(initiative);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete initiative
router.delete('/:id', (req, res) => {
  try {
    const success = Initiative.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Initiative not found' });
    }
    res.json({ message: 'Initiative deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
