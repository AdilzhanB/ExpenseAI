import { GoogleGenerativeAI } from '@google/generative-ai';
import database from '../database/init.js';
import { AppError } from '../middleware/errorHandler.js';

class AIService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.isEnabled = process.env.AI_ENABLED === 'true';
    this.init();
  }

  init() {
    if (!this.isEnabled) {
      console.log('🤖 AI features disabled');
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      console.log('⚠️ Gemini API key not found, AI features disabled');
      this.isEnabled = false;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      console.log('🤖 AI service initialized with Gemini Pro');
    } catch (error) {
      console.error('❌ Failed to initialize AI service:', error);
      this.isEnabled = false;
    }
  }

  async analyzeExpense(expense, userExpenses = []) {
    if (!this.isEnabled) {
      throw new AppError('AI service is not available', 503);
    }

    try {
      const prompt = this.buildExpenseAnalysisPrompt(expense, userExpenses);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysis = response.text();

      // Parse the AI response
      return this.parseExpenseAnalysis(analysis);
    } catch (error) {
      console.error('AI analysis error:', error);
      throw new AppError('Failed to analyze expense', 503);
    }
  }

  async generateFinancialInsights(userId) {
    if (!this.isEnabled) {
      throw new AppError('AI service is not available', 503);
    }

    try {
      // Get user's recent expenses and patterns
      const expenses = await this.getUserExpenseData(userId);
      const budgets = await this.getUserBudgetData(userId);
      
      const prompt = this.buildInsightsPrompt(expenses, budgets);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const insights = response.text();

      // Store insights in database
      await this.storeInsights(userId, 'financial_overview', insights);

      return this.parseInsights(insights);
    } catch (error) {
      console.error('Financial insights error:', error);
      throw new AppError('Failed to generate insights', 503);
    }
  }

  async generateBudgetRecommendations(userId) {
    if (!this.isEnabled) {
      throw new AppError('AI service is not available', 503);
    }

    try {
      const expenses = await this.getUserExpenseData(userId);
      const currentBudgets = await this.getUserBudgetData(userId);
      
      const prompt = this.buildBudgetRecommendationPrompt(expenses, currentBudgets);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const recommendations = response.text();

      await this.storeInsights(userId, 'budget_recommendations', recommendations);

      return this.parseBudgetRecommendations(recommendations);
    } catch (error) {
      console.error('Budget recommendations error:', error);
      throw new AppError('Failed to generate budget recommendations', 503);
    }
  }

  async analyzeSavingsOpportunities(userId) {
    if (!this.isEnabled) {
      throw new AppError('AI service is not available', 503);
    }

    try {
      const expenses = await this.getUserExpenseData(userId);
      const patterns = await this.analyzeSpendingPatterns(expenses);
      
      const prompt = this.buildSavingsPrompt(expenses, patterns);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const opportunities = response.text();

      await this.storeInsights(userId, 'savings_opportunities', opportunities);

      return this.parseSavingsOpportunities(opportunities);
    } catch (error) {
      console.error('Savings analysis error:', error);
      throw new AppError('Failed to analyze savings opportunities', 503);
    }
  }

  async categorizeExpenseFromDescription(description, amount) {
    if (!this.isEnabled) {
      return null;
    }

    try {
      const categories = await this.getAvailableCategories();
      const prompt = this.buildCategorizationPrompt(description, amount, categories);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const suggestion = response.text();

      return this.parseCategorySuggestion(suggestion, categories);
    } catch (error) {
      console.error('Categorization error:', error);
      return null;
    }
  }

  async generateExpenseFromReceipt(receiptText) {
    if (!this.isEnabled) {
      throw new AppError('AI service is not available', 503);
    }

    try {
      const prompt = this.buildReceiptPrompt(receiptText);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const extractedData = response.text();

      return this.parseReceiptData(extractedData);
    } catch (error) {
      console.error('Receipt analysis error:', error);
      throw new AppError('Failed to analyze receipt', 503);
    }
  }

  // Helper methods for building prompts
  buildExpenseAnalysisPrompt(expense, userExpenses) {
    const recentExpenses = userExpenses.slice(-20).map(e => 
      `${e.date}: $${e.amount} - ${e.description} (${e.category})`
    ).join('\n');

    return `
Analyze this expense and provide insights:

Current Expense:
- Amount: $${expense.amount}
- Description: ${expense.description}
- Category: ${expense.category}
- Date: ${expense.date}

Recent spending history:
${recentExpenses}

Please provide:
1. Spending pattern analysis
2. Comparison to usual spending
3. Potential savings suggestions
4. Category optimization
5. Overall financial health impact

Format as JSON with keys: pattern, comparison, suggestions, category_feedback, impact_score (1-10)
`;
  }

  buildInsightsPrompt(expenses, budgets) {
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const categoryBreakdown = this.getCategoryBreakdown(expenses);
    
    return `
Generate comprehensive financial insights based on this data:

Total Monthly Spending: $${totalSpent}
Category Breakdown: ${JSON.stringify(categoryBreakdown)}
Active Budgets: ${JSON.stringify(budgets)}

Provide insights on:
1. Spending trends and patterns
2. Budget performance
3. Top spending categories
4. Unusual expenses or patterns
5. Financial health score
6. Actionable recommendations

Format as JSON with keys: trends, budget_performance, top_categories, anomalies, health_score, recommendations
`;
  }

  buildBudgetRecommendationPrompt(expenses, currentBudgets) {
    const monthlySpending = this.getMonthlySpending(expenses);
    
    return `
Recommend optimal budget allocations based on spending data:

Monthly spending by category: ${JSON.stringify(monthlySpending)}
Current budgets: ${JSON.stringify(currentBudgets)}

Provide recommendations for:
1. Budget amounts per category
2. Areas to reduce spending
3. Emergency fund allocation
4. Savings targets
5. Budget adjustment tips

Format as JSON with keys: recommended_budgets, reduction_areas, emergency_fund, savings_target, tips
`;
  }

  buildSavingsPrompt(expenses, patterns) {
    return `
Identify savings opportunities from spending data:

Expense patterns: ${JSON.stringify(patterns)}

Analyze and suggest:
1. Subscription optimizations
2. Recurring expense reductions
3. Alternative spending options
4. Seasonal saving opportunities
5. Long-term financial goals

Format as JSON with keys: subscriptions, recurring_savings, alternatives, seasonal_tips, long_term_goals
`;
  }

  buildCategorizationPrompt(description, amount, categories) {
    const categoryList = categories.map(c => `${c.name} (${c.icon})`).join(', ');
    
    return `
Categorize this expense:
Description: "${description}"
Amount: $${amount}

Available categories: ${categoryList}

Return only the category name that best matches this expense.
`;
  }

  buildReceiptPrompt(receiptText) {
    return `
Extract expense information from this receipt text:

${receiptText}

Extract and return JSON with:
{
  "merchant": "store name",
  "amount": "total amount as number",
  "date": "date in YYYY-MM-DD format",
  "items": ["list of purchased items"],
  "category_suggestion": "suggested expense category"
}
`;
  }

  // Helper methods for data processing
  async getUserExpenseData(userId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await database.all(`
      SELECT e.*, c.name as category_name 
      FROM expenses e 
      JOIN categories c ON e.category_id = c.id 
      WHERE e.user_id = ? AND e.date >= ?
      ORDER BY e.date DESC
    `, [userId, thirtyDaysAgo.toISOString().split('T')[0]]);
  }

  async getUserBudgetData(userId) {
    return await database.all(`
      SELECT b.*, c.name as category_name 
      FROM budgets b 
      LEFT JOIN categories c ON b.category_id = c.id 
      WHERE b.user_id = ?
    `, [userId]);
  }

  async getAvailableCategories() {
    return await database.all('SELECT * FROM categories WHERE is_default = 1');
  }

  getCategoryBreakdown(expenses) {
    const breakdown = {};
    expenses.forEach(expense => {
      const category = expense.category_name || 'Other';
      breakdown[category] = (breakdown[category] || 0) + expense.amount;
    });
    return breakdown;
  }

  getMonthlySpending(expenses) {
    // Group by month and category
    const monthly = {};
    expenses.forEach(expense => {
      const month = expense.date.substring(0, 7); // YYYY-MM
      const category = expense.category_name || 'Other';
      
      if (!monthly[month]) monthly[month] = {};
      monthly[month][category] = (monthly[month][category] || 0) + expense.amount;
    });
    return monthly;
  }

  async analyzeSpendingPatterns(expenses) {
    // Simple pattern analysis
    const patterns = {
      weeklyAverage: 0,
      monthlyTrend: 'stable',
      topCategories: [],
      recurringExpenses: []
    };

    // Calculate weekly average
    const weeks = {};
    expenses.forEach(expense => {
      const week = this.getWeekNumber(new Date(expense.date));
      weeks[week] = (weeks[week] || 0) + expense.amount;
    });
    
    const weeklyAmounts = Object.values(weeks);
    patterns.weeklyAverage = weeklyAmounts.reduce((a, b) => a + b, 0) / weeklyAmounts.length;

    // Find top categories
    const categoryTotals = this.getCategoryBreakdown(expenses);
    patterns.topCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    return patterns;
  }

  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  async storeInsights(userId, type, content, metadata = {}) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + parseInt(process.env.AI_CACHE_TTL || 24));

    await database.run(`
      INSERT INTO ai_insights (user_id, type, content, metadata, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, type, content, JSON.stringify(metadata), expiresAt.toISOString()]);
  }

  // Response parsing methods
  parseExpenseAnalysis(analysis) {
    try {
      // Try to parse as JSON first
      return JSON.parse(analysis);
    } catch {
      // Fallback to text parsing
      return {
        pattern: 'Analysis generated',
        comparison: analysis.substring(0, 200),
        suggestions: ['Review spending in this category'],
        category_feedback: 'Category seems appropriate',
        impact_score: 5
      };
    }
  }

  parseInsights(insights) {
    try {
      return JSON.parse(insights);
    } catch {
      return {
        trends: 'Spending patterns analyzed',
        budget_performance: 'Performance tracked',
        top_categories: [],
        anomalies: [],
        health_score: 7,
        recommendations: [insights.substring(0, 100)]
      };
    }
  }

  parseBudgetRecommendations(recommendations) {
    try {
      return JSON.parse(recommendations);
    } catch {
      return {
        recommended_budgets: {},
        reduction_areas: [],
        emergency_fund: 'Consider building emergency fund',
        savings_target: '20% of income',
        tips: [recommendations.substring(0, 100)]
      };
    }
  }

  parseSavingsOpportunities(opportunities) {
    try {
      return JSON.parse(opportunities);
    } catch {
      return {
        subscriptions: [],
        recurring_savings: [],
        alternatives: [],
        seasonal_tips: [],
        long_term_goals: [opportunities.substring(0, 100)]
      };
    }
  }

  parseCategorySuggestion(suggestion, categories) {
    const categoryName = suggestion.trim().toLowerCase();
    const matchedCategory = categories.find(c => 
      c.name.toLowerCase().includes(categoryName) || 
      categoryName.includes(c.name.toLowerCase())
    );
    return matchedCategory || null;
  }

  parseReceiptData(extractedData) {
    try {
      return JSON.parse(extractedData);
    } catch {
      return {
        merchant: 'Unknown',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        items: [],
        category_suggestion: 'Other'
      };
    }
  }
}

export default new AIService();
