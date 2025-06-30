import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import database from '../database/init.js';
import aiService from '../services/aiService.js';

const router = express.Router();

// All expense routes require authentication
router.use(authenticateToken);

// Get all expenses with filters
router.get('/', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    category, 
    startDate, 
    endDate, 
    minAmount, 
    maxAmount,
    search 
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `
    SELECT 
      e.id, e.amount, e.description, e.date, e.receipt_url, 
      e.tags, e.ai_analysis, e.location, e.created_at, e.updated_at,
      c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = ?
  `;
  
  const params = [req.user.id];

  // Add filters
  if (category) {
    query += ' AND c.name = ?';
    params.push(category);
  }

  if (startDate) {
    query += ' AND e.date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND e.date <= ?';
    params.push(endDate);
  }

  if (minAmount) {
    query += ' AND e.amount >= ?';
    params.push(parseFloat(minAmount));
  }

  if (maxAmount) {
    query += ' AND e.amount <= ?';
    params.push(parseFloat(maxAmount));
  }

  if (search) {
    query += ' AND (e.description LIKE ? OR c.name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY e.date DESC, e.created_at DESC';
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const expenses = await database.all(query, params);

  // Get total count for pagination
  let countQuery = `
    SELECT COUNT(*) as total
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = ?
  `;
  
  const countParams = [req.user.id];
  
  // Add same filters to count query
  if (category) {
    countQuery += ' AND c.name = ?';
    countParams.push(category);
  }
  if (startDate) {
    countQuery += ' AND e.date >= ?';
    countParams.push(startDate);
  }
  if (endDate) {
    countQuery += ' AND e.date <= ?';
    countParams.push(endDate);
  }
  if (minAmount) {
    countQuery += ' AND e.amount >= ?';
    countParams.push(parseFloat(minAmount));
  }
  if (maxAmount) {
    countQuery += ' AND e.amount <= ?';
    countParams.push(parseFloat(maxAmount));
  }
  if (search) {
    countQuery += ' AND (e.description LIKE ? OR c.name LIKE ?)';
    countParams.push(`%${search}%`, `%${search}%`);
  }

  const { total } = await database.get(countQuery, countParams);

  // Parse tags and AI analysis
  const processedExpenses = expenses.map(expense => ({
    ...expense,
    tags: expense.tags ? JSON.parse(expense.tags) : [],
    ai_analysis: expense.ai_analysis ? JSON.parse(expense.ai_analysis) : null
  }));

  res.json({
    success: true,
    data: {
      expenses: processedExpenses,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    }
  });
}));

// Get expense by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const expense = await database.get(`
    SELECT 
      e.*, 
      c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.id = ? AND e.user_id = ?
  `, [id, req.user.id]);

  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  // Parse JSON fields
  expense.tags = expense.tags ? JSON.parse(expense.tags) : [];
  expense.ai_analysis = expense.ai_analysis ? JSON.parse(expense.ai_analysis) : null;

  res.json({
    success: true,
    data: { expense }
  });
}));

// Create new expense
router.post('/', asyncHandler(async (req, res) => {
  const { 
    category_id, 
    amount, 
    description, 
    date, 
    tags = [], 
    location 
  } = req.body;

  // Validation
  if (!category_id || !amount || !description || !date) {
    throw new AppError('Category, amount, description, and date are required', 400);
  }

  if (amount <= 0) {
    throw new AppError('Amount must be greater than 0', 400);
  }

  if (!Date.parse(date)) {
    throw new AppError('Invalid date format', 400);
  }

  // Verify category exists and user has access
  const category = await database.get(
    'SELECT * FROM categories WHERE id = ? AND (user_id = ? OR is_default = 1)',
    [category_id, req.user.id]
  );

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  // AI analysis if enabled
  let aiAnalysis = null;
  try {
    const expenseData = {
      category: category.name,
      amount: parseFloat(amount),
      description,
      date
    };
    aiAnalysis = await aiService.analyzeExpense(expenseData);
  } catch (error) {
    console.log('AI analysis failed:', error.message);
  }

  // Create expense
  const result = await database.run(`
    INSERT INTO expenses (
      user_id, category_id, amount, description, date, 
      tags, ai_analysis, location
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    req.user.id,
    category_id,
    parseFloat(amount),
    description.trim(),
    date,
    JSON.stringify(tags),
    aiAnalysis ? JSON.stringify(aiAnalysis) : null,
    location || null
  ]);

  // Get the created expense with category info
  const newExpense = await database.get(`
    SELECT 
      e.*, 
      c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.id = ?
  `, [result.id]);

  // Parse JSON fields
  newExpense.tags = newExpense.tags ? JSON.parse(newExpense.tags) : [];
  newExpense.ai_analysis = newExpense.ai_analysis ? JSON.parse(newExpense.ai_analysis) : null;

  res.status(201).json({
    success: true,
    message: 'Expense created successfully',
    data: { expense: newExpense }
  });
}));

// Update expense
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    category_id, 
    amount, 
    description, 
    date, 
    tags, 
    location 
  } = req.body;

  // Check if expense exists and belongs to user
  const expense = await database.get(
    'SELECT * FROM expenses WHERE id = ? AND user_id = ?',
    [id, req.user.id]
  );

  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  // Build update query
  const updates = [];
  const values = [];

  if (category_id !== undefined) {
    // Verify category exists
    const category = await database.get(
      'SELECT * FROM categories WHERE id = ? AND (user_id = ? OR is_default = 1)',
      [category_id, req.user.id]
    );
    if (!category) {
      throw new AppError('Category not found', 404);
    }
    updates.push('category_id = ?');
    values.push(category_id);
  }

  if (amount !== undefined) {
    if (amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400);
    }
    updates.push('amount = ?');
    values.push(parseFloat(amount));
  }

  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description.trim());
  }

  if (date !== undefined) {
    if (!Date.parse(date)) {
      throw new AppError('Invalid date format', 400);
    }
    updates.push('date = ?');
    values.push(date);
  }

  if (tags !== undefined) {
    updates.push('tags = ?');
    values.push(JSON.stringify(tags));
  }

  if (location !== undefined) {
    updates.push('location = ?');
    values.push(location);
  }

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id, req.user.id);

  await database.run(
    `UPDATE expenses SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
    values
  );

  // Get updated expense
  const updatedExpense = await database.get(`
    SELECT 
      e.*, 
      c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.id = ?
  `, [id]);

  // Parse JSON fields
  updatedExpense.tags = updatedExpense.tags ? JSON.parse(updatedExpense.tags) : [];
  updatedExpense.ai_analysis = updatedExpense.ai_analysis ? JSON.parse(updatedExpense.ai_analysis) : null;

  res.json({
    success: true,
    message: 'Expense updated successfully',
    data: { expense: updatedExpense }
  });
}));

// Delete expense
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await database.run(
    'DELETE FROM expenses WHERE id = ? AND user_id = ?',
    [id, req.user.id]
  );

  if (result.changes === 0) {
    throw new AppError('Expense not found', 404);
  }

  res.json({
    success: true,
    message: 'Expense deleted successfully'
  });
}));

// Bulk operations
router.post('/bulk', asyncHandler(async (req, res) => {
  const { action, expense_ids } = req.body;

  if (!action || !expense_ids || !Array.isArray(expense_ids)) {
    throw new AppError('Action and expense_ids array are required', 400);
  }

  if (expense_ids.length === 0) {
    throw new AppError('At least one expense ID is required', 400);
  }

  const placeholders = expense_ids.map(() => '?').join(',');
  
  switch (action) {
    case 'delete':
      const result = await database.run(
        `DELETE FROM expenses WHERE id IN (${placeholders}) AND user_id = ?`,
        [...expense_ids, req.user.id]
      );

      res.json({
        success: true,
        message: `${result.changes} expenses deleted successfully`,
        data: { deleted_count: result.changes }
      });
      break;

    case 'export':
      const expenses = await database.all(`
        SELECT 
          e.amount, e.description, e.date,
          c.name as category_name
        FROM expenses e
        JOIN categories c ON e.category_id = c.id
        WHERE e.id IN (${placeholders}) AND e.user_id = ?
        ORDER BY e.date DESC
      `, [...expense_ids, req.user.id]);

      res.json({
        success: true,
        data: { expenses }
      });
      break;

    default:
      throw new AppError('Invalid action', 400);
  }
}));

// Get expense statistics
router.get('/stats/summary', asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  
  let dateFilter = '';
  const now = new Date();
  
  switch (period) {
    case 'week':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = `AND e.date >= '${weekAgo.toISOString().split('T')[0]}'`;
      break;
    case 'month':
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = `AND e.date >= '${monthAgo.toISOString().split('T')[0]}'`;
      break;
    case 'year':
      const yearAgo = new Date(now.getFullYear(), 0, 1);
      dateFilter = `AND e.date >= '${yearAgo.toISOString().split('T')[0]}'`;
      break;
  }

  // Total spending
  const { total } = await database.get(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM expenses e
    WHERE e.user_id = ? ${dateFilter}
  `, [req.user.id]);

  // Category breakdown
  const categoryBreakdown = await database.all(`
    SELECT 
      c.name, c.icon, c.color,
      COUNT(*) as count,
      SUM(e.amount) as total,
      AVG(e.amount) as average
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = ? ${dateFilter}
    GROUP BY c.id, c.name, c.icon, c.color
    ORDER BY total DESC
  `, [req.user.id]);

  // Recent trends
  const trends = await database.all(`
    SELECT 
      DATE(e.date) as date,
      SUM(e.amount) as daily_total
    FROM expenses e
    WHERE e.user_id = ? ${dateFilter}
    GROUP BY DATE(e.date)
    ORDER BY date DESC
    LIMIT 30
  `, [req.user.id]);

  res.json({
    success: true,
    data: {
      total_amount: total,
      category_breakdown: categoryBreakdown,
      daily_trends: trends,
      period
    }
  });
}));

export default router;
