const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class Database {
  constructor(filename) {
    this.filepath = path.join(DATA_DIR, filename);
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filepath)) {
        const content = fs.readFileSync(this.filepath, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error(`Error loading ${this.filepath}:`, error);
    }
    return [];
  }

  save() {
    try {
      fs.writeFileSync(this.filepath, JSON.stringify(this.data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`Error saving ${this.filepath}:`, error);
      return false;
    }
  }

  getAll() {
    return this.data;
  }

  getById(id) {
    return this.data.find(item => item.id === id);
  }

  create(item) {
    const newItem = {
      ...item,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.push(newItem);
    this.save();
    return newItem;
  }

  update(id, updates) {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return null;

    this.data[index] = {
      ...this.data[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data[index];
  }

  delete(id) {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return false;

    this.data.splice(index, 1);
    this.save();
    return true;
  }

  query(predicate) {
    return this.data.filter(predicate);
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = Database;
