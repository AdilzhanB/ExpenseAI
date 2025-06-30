import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import database from '../database/init.js';

const router = express.Router();

// Get all categories (including user's custom categories)
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  
  let query = 'SELECT * FROM categories WHERE is_default = 1';
  const params = [];

  if (userId) {
    query += ' OR user_id = ?';
    params.push(userId);
  }

  query += ' ORDER BY is_default DESC, name ASC';

  const categories = await database.all(query, params);

  res.json({
    success: true,
    data: { categories }
  });
}));

// Create custom category (requires authentication)
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { name, icon, color } = req.body;

  // Validation
  if (!name || !icon || !color) {
    throw new AppError('Name, icon, and color are required', 400);
  }

  if (name.trim().length < 2) {
    throw new AppError('Category name must be at least 2 characters', 400);
  }

  // Check if category already exists for this user
  const existing = await database.get(
    'SELECT id FROM categories WHERE name = ? AND (user_id = ? OR is_default = 1)',
    [name.trim(), req.user.id]
  );

  if (existing) {
    throw new AppError('Category with this name already exists', 409);
  }

  // Create category
  const result = await database.run(
    'INSERT INTO categories (name, icon, color, user_id) VALUES (?, ?, ?, ?)',
    [name.trim(), icon, color, req.user.id]
  );

  const category = await database.get(
    'SELECT * FROM categories WHERE id = ?',
    [result.id]
  );

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: { category }
  });
}));

// Update custom category
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, icon, color } = req.body;

  // Check if category exists and belongs to user
  const category = await database.get(
    'SELECT * FROM categories WHERE id = ? AND user_id = ?',
    [id, req.user.id]
  );

  if (!category) {
    throw new AppError('Category not found or not owned by user', 404);
  }

  // Build update query
  const updates = [];
  const values = [];

  if (name !== undefined) {
    if (name.trim().length < 2) {
      throw new AppError('Category name must be at least 2 characters', 400);
    }
    
    // Check for duplicate name
    const existing = await database.get(
      'SELECT id FROM categories WHERE name = ? AND id != ? AND (user_id = ? OR is_default = 1)',
      [name.trim(), id, req.user.id]
    );

    if (existing) {
      throw new AppError('Category with this name already exists', 409);
    }

    updates.push('name = ?');
    values.push(name.trim());
  }

  if (icon !== undefined) {
    updates.push('icon = ?');
    values.push(icon);
  }

  if (color !== undefined) {
    updates.push('color = ?');
    values.push(color);
  }

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  values.push(id);

  await database.run(
    `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  // Get updated category
  const updatedCategory = await database.get(
    'SELECT * FROM categories WHERE id = ?',
    [id]
  );

  res.json({
    success: true,
    message: 'Category updated successfully',
    data: { category: updatedCategory }
  });
}));

// Delete custom category
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if category exists and belongs to user
  const category = await database.get(
    'SELECT * FROM categories WHERE id = ? AND user_id = ?',
    [id, req.user.id]
  );

  if (!category) {
    throw new AppError('Category not found or not owned by user', 404);
  }

  // Check if category is being used by any expenses
  const expenseCount = await database.get(
    'SELECT COUNT(*) as count FROM expenses WHERE category_id = ?',
    [id]
  );

  if (expenseCount.count > 0) {
    throw new AppError('Cannot delete category that is being used by expenses', 400);
  }

  await database.run('DELETE FROM categories WHERE id = ?', [id]);

  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
}));

// Get category statistics
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { period = 'month' } = req.query;
  const userId = req.user?.id;

  // Verify category exists and user has access
  const category = await database.get(
    'SELECT * FROM categories WHERE id = ? AND (is_default = 1 OR user_id = ?)',
    [id, userId || null]
  );

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  if (!userId) {
    throw new AppError('Authentication required for category statistics', 401);
  }

  // Calculate date range
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

  // Get statistics
  const stats = await database.get(`
    SELECT 
      COUNT(*) as transaction_count,
      COALESCE(SUM(amount), 0) as total_amount,
      COALESCE(AVG(amount), 0) as average_amount,
      COALESCE(MIN(amount), 0) as min_amount,
      COALESCE(MAX(amount), 0) as max_amount
    FROM expenses e
    WHERE e.category_id = ? AND e.user_id = ? ${dateFilter}
  `, [id, userId]);

  // Get spending trend
  const trend = await database.all(`
    SELECT 
      DATE(e.date) as date,
      SUM(e.amount) as daily_total
    FROM expenses e
    WHERE e.category_id = ? AND e.user_id = ? ${dateFilter}
    GROUP BY DATE(e.date)
    ORDER BY date DESC
    LIMIT 30
  `, [id, userId]);

  res.json({
    success: true,
    data: {
      category,
      statistics: stats,
      spending_trend: trend,
      period
    }
  });
}));

// Get popular categories based on usage
router.get('/popular', asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new AppError('Authentication required', 401);
  }

  const popularCategories = await database.all(`
    SELECT 
      c.*,
      COUNT(e.id) as usage_count,
      SUM(e.amount) as total_spent
    FROM categories c
    LEFT JOIN expenses e ON c.id = e.category_id AND e.user_id = ?
    WHERE c.is_default = 1 OR c.user_id = ?
    GROUP BY c.id
    ORDER BY usage_count DESC, total_spent DESC
    LIMIT 10
  `, [userId, userId]);

  res.json({
    success: true,
    data: { categories: popularCategories }
  });
}));

export default router;
