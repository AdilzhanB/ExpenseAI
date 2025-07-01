import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenseStore, useAIStore, useUIStore } from '../store';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  DollarSign,
  PieChart,
  Calculator,
  Settings,
  Lightbulb,
  Plus,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

interface CategoryBudget {
  category: string;
  budget: number;
  spent: number;
  prediction: number;
  status: 'safe' | 'warning' | 'danger';
}

interface BudgetOptimization {
  category: string;
  currentBudget: number;
  recommendedBudget: number;
  reasoning: string;
  potentialSavings: number;
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

const SmartBudgetPlanner: React.FC = () => {
  const navigate = useNavigate();
  const { 
    expenses, 
    fetchExpenses,
    fetchStats
  } = useExpenseStore();
  
  const {
    getBudgetRecommendations,
    optimizeBudget,
    predictNextMonthSpending
  } = useAIStore();
  
  const { addNotification } = useUIStore();

  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [optimizations, setOptimizations] = useState<BudgetOptimization[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [newCategoryBudget, setNewCategoryBudget] = useState({ category: '', amount: '' });
  const [activeTab, setActiveTab] = useState('budgets');

  useEffect(() => {
    loadBudgetData();
  }, [selectedPeriod]);

  const loadBudgetData = async () => {
    setIsLoading(true);
    try {
      await fetchExpenses();
      await calculateCategoryBudgets();
      await generateOptimizations();
    } catch (error) {
      console.error('Error loading budget data:', error);
      addNotification({
        type: 'error',
        title: 'Failed to Load Budget Data',
        message: 'Please try again later'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCategoryBudgets = async () => {
    if (!expenses || !expenses.length) {
      setCategoryBudgets([]);
      return;
    }

    try {
      // Get expense predictions for the period
      const predictions = await predictNextMonthSpending(selectedPeriod, 'all');
      
      // Calculate current spending by category
      const categorySpending = expenses.reduce((acc: Record<string, number>, expense: Expense) => {
        const category = expense.category || 'Other';
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
      }, {});

      // Create category budgets with predictions
      const budgets: CategoryBudget[] = Object.entries(categorySpending).map(([category, spent]) => {
        const spentAmount = spent as number;
        const prediction = Array.isArray(predictions) 
          ? predictions.find((p: any) => p.category === category)?.predicted_amount || spentAmount * 1.1
          : spentAmount * 1.1;
        const savedBudget = localStorage.getItem(`budget_${category}`) || (spentAmount * 1.2).toString();
        const budget = parseFloat(savedBudget);
        
        let status: 'safe' | 'warning' | 'danger' = 'safe';
        const spentPercentage = (spentAmount / budget) * 100;
        const predictedPercentage = (prediction / budget) * 100;
        
        if (spentPercentage > 90 || predictedPercentage > 100) {
          status = 'danger';
        } else if (spentPercentage > 70 || predictedPercentage > 85) {
          status = 'warning';
        }

        return {
          category,
          budget,
          spent: spentAmount,
          prediction,
          status
        };
      });

      setCategoryBudgets(budgets);
      setTotalBudget(budgets.reduce((sum, b) => sum + b.budget, 0));
    } catch (error) {
      console.error('Error calculating budgets:', error);
      // Fallback to basic calculation without predictions
      const categorySpending = expenses.reduce((acc: Record<string, number>, expense: Expense) => {
        const category = expense.category || 'Other';
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
      }, {});

      const budgets: CategoryBudget[] = Object.entries(categorySpending).map(([category, spent]) => {
        const spentAmount = spent as number;
        const savedBudget = localStorage.getItem(`budget_${category}`) || (spentAmount * 1.2).toString();
        const budget = parseFloat(savedBudget);
        
        return {
          category,
          budget,
          spent: spentAmount,
          prediction: spentAmount * 1.1,
          status: (spentAmount / budget) > 0.8 ? 'warning' : 'safe' as 'safe' | 'warning' | 'danger'
        };
      });

      setCategoryBudgets(budgets);
      setTotalBudget(budgets.reduce((sum, b) => sum + b.budget, 0));
    }
  };

  const generateOptimizations = async () => {
    try {
      setIsLoading(true);
      const currentBudgets = categoryBudgets.reduce((acc, budget) => {
        acc[budget.category] = budget.budget;
        return acc;
      }, {} as Record<string, number>);

      const optimizationResult = await optimizeBudget(currentBudgets, []);
      
      // Handle different response formats
      const optimizations: BudgetOptimization[] = [];
      
      if (optimizationResult?.optimized_budget) {
        Object.entries(optimizationResult.optimized_budget).forEach(([category, amount]: [string, any]) => {
          const currentBudget = currentBudgets[category] || 0;
          const recommendedBudget = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
          
          if (Math.abs(currentBudget - recommendedBudget) > 1) {
            optimizations.push({
              category,
              currentBudget,
              recommendedBudget,
              reasoning: `AI recommends ${recommendedBudget > currentBudget ? 'increasing' : 'reducing'} budget based on spending patterns`,
              potentialSavings: Math.max(0, currentBudget - recommendedBudget)
            });
          }
        });
      }

      // Add some default optimizations if AI doesn't return any
      if (optimizations.length === 0 && categoryBudgets.length > 0) {
        categoryBudgets.forEach(budget => {
          if (budget.status === 'warning' || budget.status === 'danger') {
            optimizations.push({
              category: budget.category,
              currentBudget: budget.budget,
              recommendedBudget: budget.spent * 1.15,
              reasoning: 'Adjust budget based on actual spending patterns',
              potentialSavings: Math.max(0, budget.budget - (budget.spent * 1.15))
            });
          }
        });
      }

      setOptimizations(optimizations);
    } catch (error) {
      console.error('Error generating optimizations:', error);
      setOptimizations([]);
      addNotification({
        type: 'warning',
        title: 'AI Optimization Unavailable',
        message: 'Continue tracking expenses for better AI recommendations'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategoryBudget = (category: string, newBudget: number) => {
    localStorage.setItem(`budget_${category}`, newBudget.toString());
    setCategoryBudgets(prev => 
      prev.map(budget => 
        budget.category === category 
          ? { ...budget, budget: newBudget }
          : budget
      )
    );
    addNotification({
      type: 'success',
      title: 'Budget Updated',
      message: `${category} budget updated to $${newBudget.toFixed(2)}`
    });
  };

  const addNewCategoryBudget = () => {
    if (newCategoryBudget.category && newCategoryBudget.amount) {
      const amount = parseFloat(newCategoryBudget.amount);
      updateCategoryBudget(newCategoryBudget.category, amount);
      setNewCategoryBudget({ category: '', amount: '' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'danger': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'danger': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  const applyOptimization = (opt: BudgetOptimization) => {
    updateCategoryBudget(opt.category, opt.recommendedBudget);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading budget data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!expenses || !expenses.length) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <PieChart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Expenses Found</h2>
            <p className="text-gray-600 mb-6">
              Start tracking your expenses to create smart budget plans and get AI-powered recommendations.
            </p>
            <button 
              onClick={() => window.location.href = '/add-expense'} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Add Your First Expense
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors border border-gray-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Calculator className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Smart Budget Planner</h1>
                <p className="text-gray-600 mt-1">AI-powered budget optimization and spending predictions</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
            <button 
              onClick={loadBudgetData} 
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
            >
              <Settings className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900">${totalBudget.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div 
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${categoryBudgets.reduce((sum, b) => sum + b.spent, 0).toFixed(2)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </motion.div>

          <motion.div 
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Predicted Spend</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${categoryBudgets.reduce((sum, b) => sum + b.prediction, 0).toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'budgets', label: 'Category Budgets', icon: PieChart },
                { id: 'optimizations', label: 'AI Optimizations', icon: Lightbulb },
                { id: 'settings', label: 'Budget Settings', icon: Settings }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'budgets' && (
              <div className="space-y-4">
                {categoryBudgets.map((budget, index) => (
                  <motion.div 
                    key={budget.category}
                    className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(budget.status)}
                        <div>
                          <h3 className="font-semibold text-gray-900">{budget.category}</h3>
                          <p className="text-sm text-gray-600">
                            ${budget.spent.toFixed(2)} of ${budget.budget.toFixed(2)} spent
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        budget.status === 'safe' ? 'bg-green-100 text-green-800' :
                        budget.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {budget.status}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Current Spending</span>
                          <span>{((budget.spent / budget.budget) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((budget.spent / budget.budget) * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Predicted Total</span>
                          <span>{((budget.prediction / budget.budget) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((budget.prediction / budget.budget) * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-sm text-gray-600">
                          Predicted: ${budget.prediction.toFixed(2)}
                        </span>
                        <input
                          type="number"
                          value={budget.budget}
                          onChange={(e) => updateCategoryBudget(budget.category, parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'optimizations' && (
              <div className="space-y-4">
                {optimizations.length > 0 ? (
                  optimizations.map((opt, index) => (
                    <motion.div 
                      key={index}
                      className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-start gap-4">
                        <Lightbulb className="h-6 w-6 text-yellow-500 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">{opt.category}</h3>
                          <p className="text-sm text-gray-600 mb-3">{opt.reasoning}</p>
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-sm">
                                Current: <span className="font-medium">${opt.currentBudget.toFixed(2)}</span>
                              </p>
                              <p className="text-sm">
                                Recommended: <span className="font-medium text-green-600">${opt.recommendedBudget.toFixed(2)}</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Potential Savings</p>
                              <p className="font-semibold text-green-600">${opt.potentialSavings.toFixed(2)}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => applyOptimization(opt)}
                            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Apply Recommendation
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Optimizations Available</h3>
                    <p className="text-gray-600">
                      Your budget appears to be well-optimized! Keep tracking your expenses for more insights.
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Category Budget</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <input
                        id="category"
                        type="text"
                        value={newCategoryBudget.category}
                        onChange={(e) => setNewCategoryBudget(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="e.g., Entertainment"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                        Budget Amount
                      </label>
                      <input
                        id="amount"
                        type="number"
                        value={newCategoryBudget.amount}
                        onChange={(e) => setNewCategoryBudget(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={addNewCategoryBudget} 
                    disabled={!newCategoryBudget.category || !newCategoryBudget.amount}
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <Plus className="h-4 w-4 inline mr-2" />
                    Add Category Budget
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartBudgetPlanner;
