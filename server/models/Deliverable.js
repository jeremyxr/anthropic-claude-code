const Database = require('./database');

class Deliverable extends Database {
  constructor() {
    super('deliverables.json');
  }

  validate(data) {
    const errors = [];

    if (!data.name || data.name.trim() === '') {
      errors.push('Name is required');
    }

    if (!data.milestoneId) {
      errors.push('Milestone ID is required');
    }

    if (!data.status) {
      errors.push('Status is required');
    }

    if (data.status && !['todo', 'in-progress', 'in-review', 'done', 'blocked'].includes(data.status)) {
      errors.push('Invalid status');
    }

    return errors;
  }

  create(data) {
    const errors = this.validate(data);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    const deliverable = {
      name: data.name,
      description: data.description || '',
      milestoneId: data.milestoneId,
      status: data.status || 'todo',
      type: data.type || 'feature',
      assignee: data.assignee || null,
      jiraIssueKey: data.jiraIssueKey || null,
      jiraIssueId: data.jiraIssueId || null,
      tags: data.tags || [],
      customFields: data.customFields || {},
    };

    return super.create(deliverable);
  }

  getByMilestone(milestoneId) {
    return this.query(deliverable => deliverable.milestoneId === milestoneId);
  }

  getByJiraIssue(jiraIssueKey) {
    return this.data.find(deliverable => deliverable.jiraIssueKey === jiraIssueKey);
  }
}

module.exports = new Deliverable();
