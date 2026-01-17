const Database = require('./database');

class Milestone extends Database {
  constructor() {
    super('milestones.json');
  }

  validate(data) {
    const errors = [];

    if (!data.name || data.name.trim() === '') {
      errors.push('Name is required');
    }

    if (!data.projectId) {
      errors.push('Project ID is required');
    }

    if (!data.status) {
      errors.push('Status is required');
    }

    if (data.status && !['not-started', 'in-progress', 'completed', 'blocked'].includes(data.status)) {
      errors.push('Invalid status');
    }

    return errors;
  }

  create(data) {
    const errors = this.validate(data);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    const milestone = {
      name: data.name,
      description: data.description || '',
      projectId: data.projectId,
      status: data.status || 'not-started',
      dueDate: data.dueDate || null,
      owner: data.owner || null,
      tags: data.tags || [],
      customFields: data.customFields || {},
    };

    return super.create(milestone);
  }

  getByProject(projectId) {
    return this.query(milestone => milestone.projectId === projectId);
  }
}

module.exports = new Milestone();
