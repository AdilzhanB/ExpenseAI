import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import aiService from '../services/aiService.js';
import database from '../database/init.js';

const router = express.Router();

router.use(authenticateToken);

// Analyze expense with AI
router.post('/analyze-expense', asyncHandler(async (req, res) => {
  const { expense } = req.body;

  if (!expense || !expense.amount || !expense.description) {
    throw new AppError('Expense data with amount and description required', 400);
  }

  // Get user's recent expenses for context
  const userExpenses = await database.all(`
    SELECT e.*, c.name as category 
    FROM expenses e 
    JOIN categories c ON e.category_id = c.id 
    WHERE e.user_id = ? 
    ORDER BY e.date DESC 
    LIMIT 50
  `, [req.user.id]);

  const analysis = await aiService.analyzeExpense(expense, userExpenses);

  res.json({
    success: true,
    data: { analysis }
  });
}));

// Generate financial insights
router.get('/insights', asyncHandler(async (req, res) => {
  const insights = await aiService.generateFinancialInsights(req.user.id);

  res.json({
    success: true,
    data: { insights }
  });
}));

// Get budget recommendations
router.get('/budget-recommendations', asyncHandler(async (req, res) => {
  const recommendations = await aiService.generateBudgetRecommendations(req.user.id);

  res.json({
    success: true,
    data: { recommendations }
  });
}));

// Analyze savings opportunities
router.get('/savings-opportunities', asyncHandler(async (req, res) => {
  const opportunities = await aiService.analyzeSavingsOpportunities(req.user.id);

  res.json({
    success: true,
    data: { opportunities }
  });
}));

// Smart categorization
router.post('/categorize', asyncHandler(async (req, res) => {
  const { description, amount } = req.body;

  if (!description) {
    throw new AppError('Description is required', 400);
  }

  const suggestion = await aiService.categorizeExpenseFromDescription(
    description, 
    amount || 0
  );

  res.json({
    success: true,
    data: { 
      suggestion: suggestion ? {
        category_id: suggestion.id,
        category_name: suggestion.name,
        confidence: 0.8
      } : null
    }
  });
}));

// Analyze receipt
router.post('/analyze-receipt', asyncHandler(async (req, res) => {
  const { receiptText } = req.body;

  if (!receiptText) {
    throw new AppError('Receipt text is required', 400);
  }

  const extractedData = await aiService.generateExpenseFromReceipt(receiptText);

  res.json({
    success: true,
    data: { extractedData }
  });
}));

// Get AI-powered spending predictions
router.get('/spending-predictions', asyncHandler(async (req, res) => {
  const { timeframe = 'month' } = req.query;

  // Get historical spending data
  const monthsBack = timeframe === 'year' ? 12 : 3;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - monthsBack);

  const expenses = await database.all(`
    SELECT 
      DATE(e.date) as date,
      SUM(e.amount) as daily_total,
      c.name as category
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = ? AND e.date >= ?
    GROUP BY DATE(e.date), c.name
    ORDER BY e.date
  `, [req.user.id, startDate.toISOString().split('T')[0]]);

  // Simple prediction based on averages and trends
  const predictions = await aiService.generateSpendingPredictions(expenses, timeframe);

  res.json({
    success: true,
    data: { predictions }
  });
}));

// Smart expense suggestions
router.get('/expense-suggestions', asyncHandler(async (req, res) => {
  const { location, time } = req.query;

  // Get user's spending patterns
  const patterns = await database.all(`
    SELECT 
      c.name as category,
      AVG(e.amount) as avg_amount,
      COUNT(*) as frequency
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = ?
    GROUP BY c.name
    ORDER BY frequency DESC
  `, [req.user.id]);

  const suggestions = await aiService.generateExpenseSuggestions(patterns, { location, time });

  res.json({
    success: true,
    data: { suggestions }
  });
}));

// Financial health score
router.get('/health-score', asyncHandler(async (req, res) => {
  const score = await aiService.calculateFinancialHealthScore(req.user.id);

  res.json({
    success: true,
    data: { score }
  });
}));

// Get cached insights
router.get('/cached-insights/:type', asyncHandler(async (req, res) => {
  const { type } = req.params;
  
  const insights = await database.get(`
    SELECT content, created_at, expires_at
    FROM ai_insights 
    WHERE user_id = ? AND type = ? AND expires_at > datetime('now')
    ORDER BY created_at DESC
    LIMIT 1
  `, [req.user.id, type]);

  if (!insights) {
    return res.json({
      success: true,
      data: { insights: null }
    });
  }

  res.json({
    success: true,
    data: { 
      insights: JSON.parse(insights.content),
      cached_at: insights.created_at,
      expires_at: insights.expires_at
    }
  });
}));

// Generate financial goals
router.get('/financial-goals', asyncHandler(async (req, res) => {
  const goals = await aiService.generateFinancialGoals(req.user.id);

  res.json({
    success: true,
    data: { goals }
  });
}));

// Smart budget optimization
router.post('/optimize-budget', asyncHandler(async (req, res) => {
  const { current_budget, financial_goals } = req.body;

  // Get user's expense data for context
  const expenses = await database.all(`
    SELECT e.*, c.name as category 
    FROM expenses e 
    JOIN categories c ON e.category_id = c.id 
    WHERE e.user_id = ? 
    ORDER BY e.date DESC 
    LIMIT 100
  `, [req.user.id]);

  const optimizedBudget = await aiService.optimizeBudget(expenses, current_budget, financial_goals);

  res.json({
    success: true,
    data: { optimizedBudget }
  });
}));

// AI chat conversation
router.post('/chat', asyncHandler(async (req, res) => {
  const { message, conversation_history } = req.body;

  if (!message) {
    throw new AppError('Message is required', 400);
  }

  // Get user's financial context
  const userContext = await aiService.getUserFinancialContext(req.user.id);
  
  const response = await aiService.generateChatResponse(message, conversation_history, userContext);

  res.json({
    success: true,
    data: { response }
  });
}));

// Upload and analyze receipt image
router.post('/analyze-receipt-image', asyncHandler(async (req, res) => {
  const { image_data } = req.body;

  if (!image_data) {
    throw new AppError('Image data is required', 400);
  }

  try {
    // Convert base64 to buffer
    const base64Data = image_data.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    const extractedData = await aiService.analyzeReceiptImage(imageBuffer);

    res.json({
      success: true,
      data: { extractedData }
    });
  } catch (error) {
    console.error('Receipt image analysis error:', error);
    throw new AppError('Failed to analyze receipt image', 500);
  }
}));

// Get financial trends analysis
router.get('/trends-analysis', asyncHandler(async (req, res) => {
  const { period = '6months' } = req.query;

  const trends = await aiService.analyzeTrends(req.user.id, period);

  res.json({
    success: true,
    data: { trends }
  });
}));

export default router;
