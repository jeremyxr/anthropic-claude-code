const express = require('express');
const router = express.Router();
const Deliverable = require('../models/Deliverable');

// Get all deliverables
router.get('/', (req, res) => {
  try {
    const { milestoneId } = req.query;
    let deliverables;

    if (milestoneId) {
      deliverables = Deliverable.getByMilestone(milestoneId);
    } else {
      deliverables = Deliverable.getAll();
    }

    res.json(deliverables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single deliverable
router.get('/:id', (req, res) => {
  try {
    const deliverable = Deliverable.getById(req.params.id);
    if (!deliverable) {
      return res.status(404).json({ error: 'Deliverable not found' });
    }
    res.json(deliverable);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create deliverable
router.post('/', (req, res) => {
  try {
    const deliverable = Deliverable.create(req.body);
    res.status(201).json(deliverable);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update deliverable
router.put('/:id', (req, res) => {
  try {
    const deliverable = Deliverable.update(req.params.id, req.body);
    if (!deliverable) {
      return res.status(404).json({ error: 'Deliverable not found' });
    }
    res.json(deliverable);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete deliverable
router.delete('/:id', (req, res) => {
  try {
    const success = Deliverable.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Deliverable not found' });
    }
    res.json({ message: 'Deliverable deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
