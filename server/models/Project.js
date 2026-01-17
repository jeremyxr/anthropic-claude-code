const Database = require('./database');

class Project extends Database {
  constructor() {
    super('projects.json');
  }

  validate(data) {
    const errors = [];

    if (!data.name || data.name.trim() === '') {
      errors.push('Name is required');
    }

    if (!data.initiativeId) {
      errors.push('Initiative ID is required');
    }

    if (!data.status) {
      errors.push('Status is required');
    }

    if (data.status && !['planning', 'active', 'on-hold', 'completed', 'cancelled'].includes(data.status)) {
      errors.push('Invalid status');
    }

    return errors;
  }

  create(data) {
    const errors = this.validate(data);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    const project = {
      name: data.name,
      description: data.description || '',
      initiativeId: data.initiativeId,
      status: data.status || 'planning',
      startDate: data.startDate || null,
      targetDate: data.targetDate || null,
      owner: data.owner || null,
      tags: data.tags || [],
      customFields: data.customFields || {},
    };

    return super.create(project);
  }

  getByInitiative(initiativeId) {
    return this.query(project => project.initiativeId === initiativeId);
  }
}

module.exports = new Project();
