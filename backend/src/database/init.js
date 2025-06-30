import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DB_PATH || join(__dirname, '../../database/expenses.db');

// Create database directory if it doesn't exist
async function ensureDbDirectory() {
  const dbDir = dirname(DB_PATH);
  try {
    await fs.access(dbDir);
  } catch {
    await fs.mkdir(dbDir, { recursive: true });
  }
}

// Database connection pool
class Database {
  constructor() {
    this.db = null;
  }

  async connect() {
    await ensureDbDirectory();
    
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`📁 Connected to SQLite database at ${DB_PATH}`);
          // Enable foreign keys
          this.db.run('PRAGMA foreign_keys = ON');
          resolve();
        }
      });
    });
  }

  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('📁 Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

// Singleton instance
const database = new Database();

export default database;

// Initialize database with tables
export async function initDatabase() {
  await database.connect();

  // Users table
  await database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT,
      preferences TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Categories table
  await database.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      user_id INTEGER,
      is_default BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Expenses table
  await database.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      receipt_url TEXT,
      tags TEXT,
      ai_analysis TEXT,
      location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    )
  `);

  // Budgets table
  await database.run(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER,
      amount DECIMAL(10, 2) NOT NULL,
      period TEXT NOT NULL DEFAULT 'monthly',
      start_date DATE NOT NULL,
      end_date DATE,
      alert_threshold DECIMAL(3, 2) DEFAULT 0.8,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    )
  `);

  // AI insights table
  await database.run(`
    CREATE TABLE IF NOT EXISTS ai_insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      confidence DECIMAL(3, 2),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Recurring expenses table
  await database.run(`
    CREATE TABLE IF NOT EXISTS recurring_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      description TEXT,
      frequency TEXT NOT NULL,
      next_date DATE NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    )
  `);

  // Financial goals table
  await database.run(`
    CREATE TABLE IF NOT EXISTS financial_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      target_amount DECIMAL(10, 2) NOT NULL,
      current_amount DECIMAL(10, 2) DEFAULT 0,
      target_date DATE,
      category TEXT,
      priority INTEGER DEFAULT 1,
      is_achieved BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  await database.run('CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date)');
  await database.run('CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id)');
  await database.run('CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id)');
  await database.run('CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON ai_insights(user_id)');
  await database.run('CREATE INDEX IF NOT EXISTS idx_goals_user ON financial_goals(user_id)');

  // Insert default categories if they don't exist
  await insertDefaultCategories();

  console.log('✅ Database tables created successfully');
}

async function insertDefaultCategories() {
  const defaultCategories = [
    { name: 'Food & Dining', icon: '🍽️', color: '#FF6B6B' },
    { name: 'Transportation', icon: '🚗', color: '#4ECDC4' },
    { name: 'Shopping', icon: '🛍️', color: '#45B7D1' },
    { name: 'Entertainment', icon: '🎬', color: '#96CEB4' },
    { name: 'Bills & Utilities', icon: '💡', color: '#FFEAA7' },
    { name: 'Healthcare', icon: '🏥', color: '#DDA0DD' },
    { name: 'Travel', icon: '✈️', color: '#98D8C8' },
    { name: 'Education', icon: '📚', color: '#F7DC6F' },
    { name: 'Groceries', icon: '🛒', color: '#85C1E9' },
    { name: 'Fitness', icon: '💪', color: '#F8C471' },
    { name: 'Home & Garden', icon: '🏠', color: '#A9DFBF' },
    { name: 'Personal Care', icon: '💄', color: '#F1948A' },
    { name: 'Investment', icon: '📈', color: '#82E0AA' },
    { name: 'Income', icon: '💰', color: '#5DADE2' },
    { name: 'Other', icon: '📋', color: '#BDC3C7' }
  ];

  for (const category of defaultCategories) {
    const existing = await database.get(
      'SELECT id FROM categories WHERE name = ? AND is_default = 1',
      [category.name]
    );

    if (!existing) {
      await database.run(
        'INSERT INTO categories (name, icon, color, is_default) VALUES (?, ?, ?, 1)',
        [category.name, category.icon, category.color]
      );
    }
  }
}
