const axios = require('axios');

class JiraService {
  constructor() {
    this.host = process.env.JIRA_HOST;
    this.email = process.env.JIRA_EMAIL;
    this.apiToken = process.env.JIRA_API_TOKEN;
    this.baseURL = `https://${this.host}/rest/api/3`;
  }

  isConfigured() {
    return !!(this.host && this.email && this.apiToken);
  }

  getAuthHeader() {
    const auth = Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');
    return `Basic ${auth}`;
  }

  async makeRequest(method, endpoint, data = null) {
    if (!this.isConfigured()) {
      throw new Error('JIRA is not configured. Please set JIRA_HOST, JIRA_EMAIL, and JIRA_API_TOKEN in .env');
    }

    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error('JIRA API Error:', error.response?.data || error.message);
      throw new Error(`JIRA API Error: ${error.response?.data?.errorMessages?.[0] || error.message}`);
    }
  }

  async getIssue(issueKey) {
    return this.makeRequest('GET', `/issue/${issueKey}`);
  }

  async searchIssues(jql, fields = ['summary', 'status', 'assignee', 'description']) {
    const queryParams = new URLSearchParams({
      jql,
      fields: fields.join(','),
    });
    return this.makeRequest('GET', `/search?${queryParams}`);
  }

  async createIssue(projectKey, issueData) {
    const payload = {
      fields: {
        project: { key: projectKey },
        summary: issueData.summary,
        description: issueData.description || '',
        issuetype: { name: issueData.issueType || 'Task' },
        ...issueData.fields,
      },
    };

    return this.makeRequest('POST', '/issue', payload);
  }

  async updateIssue(issueKey, updates) {
    const payload = {
      fields: updates,
    };

    return this.makeRequest('PUT', `/issue/${issueKey}`, payload);
  }

  async getProjects() {
    return this.makeRequest('GET', '/project');
  }

  async getIssueTypes(projectKey) {
    const project = await this.makeRequest('GET', `/project/${projectKey}`);
    return project.issueTypes || [];
  }

  async linkIssue(issueKey, linkType, inwardIssueKey) {
    const payload = {
      type: { name: linkType },
      inwardIssue: { key: inwardIssueKey },
      outwardIssue: { key: issueKey },
    };

    return this.makeRequest('POST', '/issueLink', payload);
  }

  async addComment(issueKey, comment) {
    const payload = {
      body: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: comment,
              },
            ],
          },
        ],
      },
    };

    return this.makeRequest('POST', `/issue/${issueKey}/comment`, payload);
  }

  async transitionIssue(issueKey, transitionId) {
    const payload = {
      transition: { id: transitionId },
    };

    return this.makeRequest('POST', `/issue/${issueKey}/transitions`, payload);
  }

  async getTransitions(issueKey) {
    return this.makeRequest('GET', `/issue/${issueKey}/transitions`);
  }
}

module.exports = new JiraService();
