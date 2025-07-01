import { GoogleGenerativeAI } from '@google/generative-ai';
import database from '../database/init.js';
import { AppError } from '../middleware/errorHandler.js';
import ocrService from './ocrService.js';

class AIService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.isEnabled = false;
    // Don't initialize immediately - wait for explicit init call
  }

  init() {
    // Check if AI is enabled
    this.isEnabled = process.env.AI_ENABLED === 'true';
    
    if (!this.isEnabled) {
      console.log('🤖 AI features disabled (AI_ENABLED=false)');
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      console.log('⚠️ Gemini API key not found, AI features disabled');
      this.isEnabled = false;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log('🤖 AI service initialized with Gemini Pro');
      this.isEnabled = true;
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
      // Return mock data when AI is disabled, but still functional
      return {
        trends: 'AI features disabled - showing basic analysis',
        budget_performance: 'Unable to analyze without AI',
        top_categories: [],
        anomalies: [],
        health_score: 75,
        recommendations: ['Enable AI features for detailed insights']
      };
    }

    try {
      // Get user's recent expenses and patterns
      const expenses = await this.getUserExpenseData(userId);
      const budgets = await this.getUserBudgetData(userId);
      
      if (expenses.length === 0) {
        return {
          trends: 'No expense data available',
          budget_performance: 'No budget data to analyze',
          top_categories: [],
          anomalies: [],
          health_score: 0,
          recommendations: ['Start tracking expenses to get AI insights']
        };
      }
      
      const prompt = this.buildInsightsPrompt(expenses, budgets);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const insights = response.text();

      // Store insights in database
      await this.storeInsights(userId, 'financial_overview', insights);

      return this.parseInsights(insights);
    } catch (error) {
      console.error('Financial insights error:', error);
      return {
        trends: 'Error generating insights',
        budget_performance: 'Unable to analyze',
        top_categories: [],
        anomalies: [],
        health_score: 0,
        recommendations: ['Please try again later']
      };
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
      // Use basic parsing when AI is disabled
      return this.parseReceiptBasic(receiptText);
    }

    try {
      const prompt = this.buildReceiptPrompt(receiptText);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const extractedData = response.text();

      return this.parseReceiptData(extractedData);
    } catch (error) {
      console.error('Receipt analysis error:', error);
      // Fallback to basic parsing
      return this.parseReceiptBasic(receiptText);
    }
  }

  async analyzeReceiptImage(imageBuffer) {
    try {
      // Use OCR to extract text from image
      const extractedText = await ocrService.processReceiptImage(imageBuffer);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new AppError('No text could be extracted from the image', 400);
      }

      // Parse the extracted text to structured data
      const receiptData = await ocrService.extractReceiptData(extractedText);
      
      // Use AI to enhance and categorize the extracted data
      if (this.isEnabled && receiptData.items.length > 0) {
        for (let item of receiptData.items) {
          const category = await this.categorizeExpenseFromDescription(item.description, item.amount);
          if (category) {
            item.category_id = category.id;
            item.category_name = category.name;
          }
        }
      }

      return receiptData;
    } catch (error) {
      console.error('Receipt image analysis error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to analyze receipt image', 503);
    }
  }

  async generateFinancialGoals(userId) {
    if (!this.isEnabled) {
      throw new AppError('AI service is not available', 503);
    }

    try {
      const expenses = await this.getUserExpenseData(userId);
      const income = await this.getUserIncomeData(userId);
      
      const prompt = this.buildGoalsPrompt(expenses, income);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const goals = response.text();

      await this.storeInsights(userId, 'financial_goals', goals);

      return this.parseFinancialGoals(goals);
    } catch (error) {
      console.error('Financial goals error:', error);
      throw new AppError('Failed to generate financial goals', 503);
    }
  }

  async generateSpendingPredictions(expenses, timeframe = 'month') {
    if (!this.isEnabled) {
      return this.generateMockPredictions(timeframe);
    }

    try {
      const prompt = this.buildPredictionPrompt(expenses, timeframe);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const predictions = response.text();

      return this.parsePredictions(predictions);
    } catch (error) {
      console.error('Predictions error:', error);
      return this.generateMockPredictions(timeframe);
    }
  }

  async generateExpenseSuggestions(patterns, context = {}) {
    if (!this.isEnabled) {
      return [];
    }

    try {
      const prompt = this.buildSuggestionsPrompt(patterns, context);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const suggestions = response.text();

      return this.parseSuggestions(suggestions);
    } catch (error) {
      console.error('Suggestions error:', error);
      return [];
    }
  }

  async calculateFinancialHealthScore(userId) {
    if (!this.isEnabled) {
      // Calculate basic score without AI
      const expenses = await this.getUserExpenseData(userId);
      const budgets = await this.getUserBudgetData(userId);
      
      if (expenses.length === 0) {
        return { score: 0, breakdown: { message: 'No data available' } };
      }
      
      // Simple score calculation
      const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
      const budgetTotal = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
      const budgetUsage = budgetTotal > 0 ? (totalSpent / budgetTotal) * 100 : 50;
      const score = Math.max(0, Math.min(100, 100 - budgetUsage + 25));
      
      return { 
        score: Math.round(score), 
        breakdown: {
          spending_control: Math.round(100 - budgetUsage),
          budget_adherence: budgetTotal > 0 ? Math.round((1 - totalSpent / budgetTotal) * 100) : 50,
          data_quality: expenses.length > 10 ? 90 : 50
        }
      };
    }

    try {
      const expenses = await this.getUserExpenseData(userId);
      const budgets = await this.getUserBudgetData(userId);
      const savings = await this.getUserSavingsData(userId);
      
      if (expenses.length === 0) {
        return { score: 0, breakdown: { message: 'No expense data available' } };
      }
      
      const prompt = this.buildHealthScorePrompt(expenses, budgets, savings);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const healthData = response.text();

      return this.parseHealthScore(healthData);
    } catch (error) {
      console.error('Health score error:', error);
      return { score: 0, breakdown: { error: 'Failed to calculate score' } };
    }
  }

  parseReceiptBasic(receiptText) {
    // Basic receipt parsing without AI
    const lines = receiptText.split('\n').filter(line => line.trim().length > 0);
    const items = [];
    let total = 0;
    
    for (const line of lines) {
      const amountMatch = line.match(/\$?(\d+\.\d{2})/);
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1]);
        const description = line.replace(/\$?\d+\.\d{2}/, '').trim();
        
        if (description.length > 0 && amount > 0) {
          items.push({
            description,
            amount,
            category_id: 1,
            date: new Date().toISOString().split('T')[0]
          });
          total += amount;
        }
      }
    }
    
    return {
      store: { name: 'Unknown Store' },
      date: new Date().toISOString().split('T')[0],
      items,
      totals: { total },
      paymentMethod: 'Unknown'
    };
  }

  async optimizeBudget(expenses, currentBudget, goals) {
    if (!this.isEnabled) {
      throw new AppError('AI service is not available', 503);
    }

    try {
      const prompt = this.buildBudgetOptimizationPrompt(expenses, currentBudget, goals);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const optimization = response.text();

      return this.parseBudgetOptimization(optimization);
    } catch (error) {
      console.error('Budget optimization error:', error);
      throw new AppError('Failed to optimize budget', 503);
    }
  }

  async generateChatResponse(message, conversationHistory, userContext) {
    if (!this.isEnabled) {
      throw new AppError('AI service is not available', 503);
    }

    try {
      const prompt = this.buildChatPrompt(message, conversationHistory, userContext);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return {
        message: response.text(),
        timestamp: new Date().toISOString(),
        suggestions: this.extractSuggestions(response.text())
      };
    } catch (error) {
      console.error('Chat response error:', error);
      throw new AppError('Failed to generate chat response', 503);
    }
  }

  extractSuggestions(responseText) {
    // Extract actionable suggestions from AI response
    const suggestions = [];
    const lines = responseText.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('suggest') || 
          line.toLowerCase().includes('recommend') ||
          line.toLowerCase().includes('consider')) {
        suggestions.push(line.trim());
      }
    }
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  async getUserFinancialContext(userId) {
    try {
      const expenses = await this.getUserExpenseData(userId);
      const budgets = await this.getUserBudgetData(userId);
      const recentInsights = await database.get(`
        SELECT content 
        FROM ai_insights 
        WHERE user_id = ? AND type = 'financial_overview'
        ORDER BY created_at DESC 
        LIMIT 1
      `, [userId]);

      return {
        monthly_spending: expenses.reduce((sum, e) => sum + e.amount, 0),
        top_categories: this.getCategoryBreakdown(expenses),
        budget_status: budgets,
        recent_insights: recentInsights ? JSON.parse(recentInsights.content) : null
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return {};
    }
  }

  async getExpensesByPeriod(userId, period) {
    let daysBack = 180; // Default 6 months
    
    switch (period) {
      case '3months':
        daysBack = 90;
        break;
      case '6months':
        daysBack = 180;
        break;
      case '1year':
        daysBack = 365;
        break;
      case '2years':
        daysBack = 730;
        break;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    try {
      return await database.all(`
        SELECT e.*, c.name as category_name 
        FROM expenses e 
        JOIN categories c ON e.category_id = c.id 
        WHERE e.user_id = ? AND e.date >= ?
        ORDER BY e.date DESC
      `, [userId, startDate.toISOString().split('T')[0]]);
    } catch (error) {
      console.error('Error fetching expenses by period:', error);
      return [];
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

  buildGoalsPrompt(expenses, income) {
    return `
Generate personalized financial goals based on spending and income:

Monthly Expenses: ${JSON.stringify(expenses)}
Monthly Income: ${JSON.stringify(income)}

Generate goals for:
1. Short-term savings targets (3-6 months)
2. Medium-term financial milestones (1-2 years)
3. Long-term wealth building (5+ years)
4. Emergency fund recommendations
5. Investment allocation suggestions

Format as JSON with keys: short_term, medium_term, long_term, emergency_fund, investments
`;
  }

  buildPredictionPrompt(expenses, timeframe) {
    return `
Predict future spending based on historical data:

Historical Expenses: ${JSON.stringify(expenses)}
Prediction Timeframe: ${timeframe}

Analyze patterns and predict:
1. Total spending for the period
2. Category-wise breakdown
3. Seasonal variations
4. Potential overspending alerts
5. Confidence levels for predictions

Format as JSON with keys: total_prediction, category_breakdown, seasonal_factors, alerts, confidence
`;
  }

  buildSuggestionsPrompt(patterns, context) {
    return `
Generate actionable suggestions to optimize finances:

Spending Patterns: ${JSON.stringify(patterns)}
User Context: ${JSON.stringify(context)}

Suggestions should include:
1. Specific areas to cut back on
2. Alternative, cost-effective options
3. Tips for optimizing savings
4. Recommendations for investment opportunities
5. Strategies for debt reduction

Format as JSON with keys: cuts, alternatives, savings_tips, investment_recommendations, debt_reduction_strategies
`;
  }

  buildHealthScorePrompt(expenses, budgets, savings) {
    return `
Calculate a comprehensive financial health score:

Expenses: ${JSON.stringify(expenses)}
Budgets: ${JSON.stringify(budgets)}
Savings: ${JSON.stringify(savings)}

Consider:

1. Expense-to-income ratio
2. Savings rate
3. Budget variance
4. Debt-to-income ratio
5. Investment diversification

Provide a score (1-100) and a breakdown of the key factors affecting the score.

Format as JSON with keys: score, breakdown
`;
  }

  buildReceiptVisionPrompt() {
    return `
Analyze this receipt image and extract structured expense data:

Extract:
1. Store name and location
2. Date and time of purchase
3. Individual items with prices
4. Subtotal, tax, and total amounts
5. Payment method
6. Suggested expense categories for each item

Format as JSON with keys: store, date, time, items, totals, payment_method, suggested_categories
`;
  }

  buildBudgetOptimizationPrompt(expenses, currentBudget, goals) {
    return `
Optimize this budget based on spending patterns and financial goals:

Current Spending: ${JSON.stringify(expenses.slice(-30))}
Current Budget: ${JSON.stringify(currentBudget)}
Financial Goals: ${JSON.stringify(goals)}

Provide optimized budget recommendations that:
1. Align with financial goals
2. Account for spending patterns
3. Suggest realistic adjustments
4. Identify potential savings
5. Balance needs vs wants

Format as JSON with keys: optimized_budget, adjustments, savings_opportunities, goal_alignment
`;
  }

  buildChatPrompt(message, history, context) {
    const recentHistory = (history || []).slice(-5).map(h => `${h.role}: ${h.content}`).join('\n');
    
    return `
You are a friendly AI financial advisor. Help the user with their financial question.

User's Financial Context:
${JSON.stringify(context)}

Recent Conversation:
${recentHistory}

Current Question: ${message}

Provide helpful, personalized advice based on their financial situation. Be encouraging and practical.
`;
  }

  buildTrendsPrompt(expenses, period) {
    return `
Analyze spending trends over ${period}:

Expense Data: ${JSON.stringify(expenses)}

Identify:
1. Spending trends by category
2. Seasonal patterns
3. Unusual spikes or drops
4. Growth rates
5. Predictive insights

Format as JSON with keys: category_trends, seasonal_patterns, anomalies, predictions
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

  async getUserIncomeData(userId) {
    try {
      const result = await database.get(`
        SELECT SUM(amount) as total_income
        FROM income 
        WHERE user_id = ? AND date >= date('now', '-30 days')
      `, [userId]);
      
      return { 
        monthly_income: result?.total_income || 0,
        sources: await database.all(`
          SELECT source, SUM(amount) as amount
          FROM income 
          WHERE user_id = ? AND date >= date('now', '-30 days')
          GROUP BY source
        `, [userId])
      };
    } catch (error) {
      console.error('Error fetching income data:', error);
      return { monthly_income: 0, sources: [] };
    }
  }

  async getUserSavingsGoals() {
    // Mock implementation, replace with real data retrieval
    return [
      { type: 'emergency_fund', target: 5000, current: 1200 },
      { type: 'retirement', target: 200000, current: 15000 },
      { type: 'vacation', target: 3000, current: 500 }
    ];
  }

  async getUserSavingsData(userId) {
    try {
      const savingsResult = await database.get(`
        SELECT SUM(amount) as total_savings
        FROM savings 
        WHERE user_id = ? AND date >= date('now', '-30 days')
      `, [userId]);

      const goalsResult = await database.all(`
        SELECT * FROM financial_goals 
        WHERE user_id = ? AND is_achieved = 0
        ORDER BY priority DESC
      `, [userId]);

      return { 
        emergency_fund: savingsResult?.total_savings || 0,
        investments: 0, // This would come from an investments table
        savings_rate: 0.15, // Calculate based on income vs expenses
        goals: goalsResult || []
      };
    } catch (error) {
      console.error('Error fetching savings data:', error);
      return { 
        emergency_fund: 0,
        investments: 0,
        savings_rate: 0,
        goals: []
      };
    }
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

  groupExpensesByTimeframe(expenses, timeframe) {
    const grouped = {};
    expenses.forEach(expense => {
      const key = this.getTimeframeKey(expense.date, timeframe);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(expense);
    });
    return grouped;
  }

  getTimeframeKey(dateString, timeframe) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    let key = `${year}-`;
    
    if (timeframe === 'month') {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      key += `${month}`;
    } else if (timeframe === 'week') {
      const week = this.getWeekNumber(date);
      key += `W${week}`;
    } else {
      throw new Error('Invalid timeframe');
    }
    
    return key;
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

  parsePredictions(predictions) {
    try {
      return JSON.parse(predictions);
    } catch {
      return {
        total_prediction: 0,
        category_breakdown: {},
        overspending_alert: false,
        recommendations: []
      };
    }
  }

  parseSuggestions(suggestions) {
    try {
      return JSON.parse(suggestions);
    } catch {
      return {
        cuts: [],
        alternatives: [],
        savings_tips: [],
        investment_recommendations: [],
        debt_reduction_strategies: []
      };
    }
  }

  parseHealthScore(healthData) {
    try {
      return JSON.parse(healthData);
    } catch {
      return {
        score: 75,
        breakdown: {}
      };
    }
  }

  parseFinancialGoals(goalsText) {
    try {
      return JSON.parse(goalsText);
    } catch (error) {
      return {
        short_term: ['Build emergency fund of $1000', 'Reduce dining out by 20%'],
        medium_term: ['Save $5000 for vacation', 'Pay off credit card debt'],
        long_term: ['Save for house down payment', 'Build retirement fund'],
        emergency_fund: 'Aim for 3-6 months of expenses',
        investments: 'Consider index funds and retirement accounts'
      };
    }
  }

  generateMockPredictions(timeframe) {
    // Return mock predictions when AI is disabled
    const baseAmount = 2500;
    const multiplier = timeframe === 'year' ? 12 : timeframe === 'quarter' ? 3 : 1;
    
    return {
      total_prediction: baseAmount * multiplier,
      category_breakdown: {
        groceries: (baseAmount * 0.3) * multiplier,
        transportation: (baseAmount * 0.2) * multiplier,
        entertainment: (baseAmount * 0.15) * multiplier,
        utilities: (baseAmount * 0.25) * multiplier,
        other: (baseAmount * 0.1) * multiplier
      },
      confidence: 75,
      alerts: ['Monitor grocery spending - trending upward']
    };
  }

  async analyzeTrends(userId, period) {
    if (!this.isEnabled) {
      return { trends: [], analysis: 'AI analysis not available' };
    }

    try {
      const expenses = await this.getExpensesByPeriod(userId, period);
      
      if (expenses.length === 0) {
        return { 
          trends: [], 
          analysis: 'No expense data available for trend analysis',
          recommendations: ['Start tracking expenses to enable trend analysis']
        };
      }

      const prompt = this.buildTrendsPrompt(expenses, period);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const trends = response.text();

      return this.parseTrends(trends);
    } catch (error) {
      console.error('Trends analysis error:', error);
      return { trends: [], analysis: 'Failed to analyze trends' };
    }
  }

  parseTrends(trends) {
    try {
      return JSON.parse(trends);
    } catch {
      return {
        category_trends: [],
        seasonal_patterns: [],
        anomalies: [],
        predictions: [],
        analysis: trends.substring(0, 200)
      };
    }
  }
}

export default new AIService();
