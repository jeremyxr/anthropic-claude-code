const Database = require('./database');

class Initiative extends Database {
  constructor() {
    super('initiatives.json');
  }

  validate(data) {
    const errors = [];

    if (!data.name || data.name.trim() === '') {
      errors.push('Name is required');
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

    const initiative = {
      name: data.name,
      description: data.description || '',
      status: data.status || 'planning',
      startDate: data.startDate || null,
      targetDate: data.targetDate || null,
      owner: data.owner || null,
      tags: data.tags || [],
      customFields: data.customFields || {},
    };

    return super.create(initiative);
  }

  update(id, data) {
    if (data.status && !['planning', 'active', 'on-hold', 'completed', 'cancelled'].includes(data.status)) {
      throw new Error('Invalid status');
    }

    return super.update(id, data);
  }
}

module.exports = new Initiative();
