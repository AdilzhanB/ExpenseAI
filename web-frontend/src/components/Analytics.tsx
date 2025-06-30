import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  PieChart as PieChartIcon,
  BarChart3,
  Target,
  AlertCircle
} from 'lucide-react';
import { useExpenseStore, useCategoryStore } from '../store';
import toast from 'react-hot-toast';

const Analytics: React.FC = () => {
  const { expenses, fetchExpenses, analytics, fetchAnalytics } = useExpenseStore();
  const { categories, fetchCategories } = useCategoryStore();
  
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchExpenses(),
          fetchCategories(),
          fetchAnalytics({ period: selectedPeriod })
        ]);
      } catch (error) {
        console.error('Failed to load analytics:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchExpenses, fetchCategories, fetchAnalytics, selectedPeriod]);

  // Process data for charts
  const categoryData = useMemo(() => {
    const categoryTotals = new Map();
    
    expenses.forEach((expense: any) => {
      const category = categories.find((cat: any) => cat.id === expense.category_id);
      const categoryName = category ? category.name : 'Uncategorized';
      const currentTotal = categoryTotals.get(categoryName) || 0;
      categoryTotals.set(categoryName, currentTotal + expense.amount);
    });

    return Array.from(categoryTotals.entries()).map(([name, value]) => ({
      name,
      value,
      percentage: (value as number / expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0) * 100).toFixed(1)
    })).sort((a, b) => b.value - a.value);
  }, [expenses, categories]);

  const monthlyData = useMemo(() => {
    const monthlyTotals = new Map();
    
    expenses.forEach((expense: any) => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const currentTotal = monthlyTotals.get(monthKey) || 0;
      monthlyTotals.set(monthKey, currentTotal + expense.amount);
    });

    return Array.from(monthlyTotals.entries()).map(([month, amount]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      amount
    })).sort((a, b) => a.month.localeCompare(b.month));
  }, [expenses]);

  const weeklyTrend = useMemo(() => {
    const weeklyTotals = new Map();
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().split('T')[0];
      weeklyTotals.set(dayKey, 0);
    }

    expenses.forEach((expense: any) => {
      const expenseDate = expense.date;
      if (weeklyTotals.has(expenseDate)) {
        weeklyTotals.set(expenseDate, weeklyTotals.get(expenseDate) + expense.amount);
      }
    });

    return Array.from(weeklyTotals.entries()).map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      amount
    }));
  }, [expenses]);

  const totalSpent = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
  const averageDaily = totalSpent / 30; // Rough daily average
  const thisMonth = expenses.filter((exp: any) => {
    const expDate = new Date(exp.date);
    const now = new Date();
    return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
  }).reduce((sum: number, exp: any) => sum + exp.amount, 0);

  const lastMonth = expenses.filter((exp: any) => {
    const expDate = new Date(exp.date);
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return expDate.getMonth() === lastMonth.getMonth() && expDate.getFullYear() === lastMonth.getFullYear();
  }).reduce((sum: number, exp: any) => sum + exp.amount, 0);

  const monthlyGrowth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100) : 0;

  const COLORS = [
    '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', 
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="glass-card p-8 rounded-2xl text-center">
          <div className="loading-dots">
            <div style={{ '--delay': '0s' } as any} />
            <div style={{ '--delay': '0.2s' } as any} />
            <div style={{ '--delay': '0.4s' } as any} />
          </div>
          <p className="text-slate-600 mt-4">Loading analytics...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Analytics</h2>
            <p className="text-slate-600">Insights into your spending patterns</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-600">Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="border border-slate-200 rounded-lg px-3 py-1 bg-white text-sm"
            >
              <option value="week">Last Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">This Month</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(thisMonth)}</p>
              <div className="flex items-center mt-1">
                {monthlyGrowth >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                )}
                <span className={`text-sm ${monthlyGrowth >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {Math.abs(monthlyGrowth).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Daily Average</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(averageDaily)}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Total Transactions</p>
              <p className="text-2xl font-bold text-slate-900">{expenses.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center space-x-2 mb-6">
            <PieChartIcon className="w-5 h-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900">Spending by Category</h3>
          </div>
          
          {categoryData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="mt-4 space-y-2">
                {categoryData.slice(0, 5).map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-slate-700">{item.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-900 font-medium">{formatCurrency(item.value)}</span>
                      <span className="text-slate-500">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-slate-500">
              No data available
            </div>
          )}
        </motion.div>

        {/* Monthly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="w-5 h-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900">Monthly Trend</h3>
          </div>
          
          {monthlyData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(value), 'Amount']}
                    labelStyle={{ color: '#1e293b' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#3B82F6"
                    fill="url(#colorAmount)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-slate-500">
              No data available
            </div>
          )}
        </motion.div>
      </div>

      {/* Weekly Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass-card p-6 rounded-2xl"
      >
        <div className="flex items-center space-x-2 mb-6">
          <BarChart3 className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">Last 7 Days</h3>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                formatter={(value: any) => [formatCurrency(value), 'Amount']}
                labelStyle={{ color: '#1e293b' }}
              />
              <Bar 
                dataKey="amount" 
                fill="url(#colorBar)"
                radius={[4, 4, 0, 0]}
              />
              <defs>
                <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="glass-card p-6 rounded-2xl"
      >
        <div className="flex items-center space-x-2 mb-6">
          <AlertCircle className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">Quick Insights</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-blue-900 font-medium mb-1">Top Category</p>
            <p className="text-blue-700 text-sm">
              {categoryData[0]?.name || 'N/A'} - {formatCurrency(categoryData[0]?.value || 0)}
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <p className="text-green-900 font-medium mb-1">Budget Status</p>
            <p className="text-green-700 text-sm">
              {monthlyGrowth < 0 ? 'Under budget this month 👍' : 'Consider reducing spending 📊'}
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
            <p className="text-purple-900 font-medium mb-1">Spending Frequency</p>
            <p className="text-purple-700 text-sm">
              {(expenses.length / 30).toFixed(1)} transactions per day
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Analytics;
