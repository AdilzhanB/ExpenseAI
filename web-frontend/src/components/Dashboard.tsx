import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  Brain,
  Calendar,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  CreditCard,
  Wallet,
  ShoppingBag,
  BarChart3
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { useExpenseStore, useCategoryStore, useAIStore, useUIStore } from '../store';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { fetchStats, fetchExpenses, totalAmount, categoryBreakdown, expenses } = useExpenseStore();
  const { fetchCategories } = useCategoryStore();
  const { getSpendingInsights, fetchHealthScore, insights, healthScore } = useAIStore();
  const { setActiveModal, addNotification } = useUIStore();
  const [timeframe, setTimeframe] = useState('month');
  const [stats, setStats] = useState({
    totalSpending: 0,
    budgetRemaining: 0,
    transactionCount: 0,
    recentTransactions: []
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Fetch stats and expenses
        await fetchStats(timeframe);
        const expensesResponse = await fetchExpenses({ limit: 5 }); // Get recent 5 expenses
        await fetchCategories();
        await getSpendingInsights();
        await fetchHealthScore();

        // Calculate real stats
        const transactionCount = expenses ? expenses.length : 0;
        setStats({
          totalSpending: totalAmount || 0,
          budgetRemaining: Math.max(0, 3000 - (totalAmount || 0)), // Default budget of $3000
          transactionCount,
          recentTransactions: expenses ? expenses.slice(0, 4) : []
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };

    loadDashboardData();
  }, [timeframe]);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'Add Expense':
        setActiveModal('add-expense');
        break;
      case 'Set Budget':
        navigate('/budget-planner');
        addNotification({
          type: 'info',
          title: 'Budget Planner',
          message: 'Redirected to Smart Budget Planner for AI-powered budget optimization.'
        });
        break;
      case 'AI Analysis':
        navigate('/health-dashboard');
        addNotification({
          type: 'info',
          title: 'AI Analysis',
          message: 'Redirected to Financial Health Dashboard for comprehensive AI analysis.'
        });
        break;
      case 'Schedule':
        navigate('/predictions');
        addNotification({
          type: 'info',
          title: 'Financial Planning',
          message: 'Redirected to Expense Predictions for future planning insights.'
        });
        break;
      default:
        break;
    }
  };

  const handleViewAllTransactions = () => {
    navigate('/expenses');
    addNotification({
      type: 'info',
      title: 'Expense History',
      message: 'Viewing all your expenses and transactions.'
    });
  };

  // Create chart data from actual data or show empty state
  const hasData = totalAmount > 0 || (categoryBreakdown && categoryBreakdown.length > 0);
  
  const trendData = hasData ? [
    { name: 'Last Week', amount: totalAmount * 0.8, budget: totalAmount * 1.2 },
    { name: 'This Week', amount: totalAmount, budget: totalAmount * 1.2 },
  ] : [];

  const pieColors = ['#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#EC4899'];

  const pieData = hasData && categoryBreakdown ? categoryBreakdown.map((cat: any, index: number) => ({
    name: cat.name,
    value: cat.total,
    fill: pieColors[index % pieColors.length]
  })) : [];

  const StatCard = ({ title, value, change, icon: Icon, color, trend }: any) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="glass-card p-6 rounded-2xl shadow-lg border border-white/20 card-hover"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? (
                <ArrowUpRight className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 mr-1" />
              )}
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-2xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  const AIInsightCard = ({ insight }: any) => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card p-6 rounded-2xl shadow-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50"
    >
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900 mb-2">AI Insight</h4>
          <p className="text-slate-700 text-sm leading-relaxed">
            {insight || "Your spending pattern shows you're doing great with budgeting. Consider allocating more towards savings this month."}
          </p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6 h-full overflow-y-auto">
      {/* Header with Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Financial Overview</h2>
          <p className="text-slate-600 mt-1">Track your spending and get AI-powered insights</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-white/50 p-1 rounded-xl border border-white/20">
          {['week', 'month', 'year'].map((period) => (
            <motion.button
              key={period}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTimeframe(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeframe === period
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Spending"
          value={`$${stats.totalSpending.toFixed(2)}`}
          change={stats.totalSpending > 0 ? "Updated today" : "No spending yet"}
          icon={DollarSign}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          trend={stats.totalSpending > 0 ? "up" : null}
        />
        <StatCard
          title="Budget Remaining"
          value={`$${stats.budgetRemaining.toFixed(2)}`}
          change={stats.budgetRemaining > 0 ? `${((stats.budgetRemaining / 3000) * 100).toFixed(0)}% remaining` : "Budget exceeded"}
          icon={Target}
          color="bg-gradient-to-br from-green-500 to-green-600"
          trend={stats.budgetRemaining > 0 ? "up" : "down"}
        />
        <StatCard
          title="Transactions"
          value={stats.transactionCount.toString()}
          change={stats.transactionCount > 0 ? `${stats.transactionCount} this ${timeframe}` : "No transactions"}
          icon={CreditCard}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          trend={stats.transactionCount > 0 ? "up" : null}
        />
        <StatCard
          title="AI Health Score"
          value={`${healthScore?.overall || 0}/100`}
          change={healthScore?.overall >= 80 ? "Excellent" : healthScore?.overall >= 60 ? "Good" : "Needs Improvement"}
          icon={Brain}
          color="bg-gradient-to-br from-pink-500 to-pink-600"
          trend={healthScore?.overall >= 70 ? "up" : "down"}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-card p-6 rounded-2xl shadow-lg border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Spending Trend</h3>
              <p className="text-slate-600 text-sm">Monthly overview with budget comparison</p>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-600 font-medium">+12%</span>
            </div>
          </div>
          
          {hasData ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" />
                <YAxis stroke="#64748B" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="budget" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-gray-500">
              <BarChart3 className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No spending data available</p>
              <p className="text-sm text-center">You haven't added any expenses yet.<br />Start tracking your finances to see trends!</p>
            </div>
          )}
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 rounded-2xl shadow-lg border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Categories</h3>
              <p className="text-slate-600 text-sm">Spending breakdown</p>
            </div>
            <PieChart className="w-5 h-5 text-blue-500" />
          </div>
          
          <ResponsiveContainer width="100%" height={200}>
            <RechartsPieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => [`$${value.toFixed(2)}`, 'Amount']}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  border: 'none', 
                  borderRadius: '12px'
                }} 
              />
            </RechartsPieChart>
          </ResponsiveContainer>
          
          <div className="space-y-2 mt-4">
            {pieData.slice(0, 4).map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-sm text-slate-700">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-slate-900">
                  ${item.value.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* AI Insights & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-slate-900">AI Insights</h3>
          </div>
          
          {insights?.recommendations && insights.recommendations.length > 0 ? (
            <>
              <AIInsightCard insight={insights.recommendations[0]} />
              {insights.recommendations[1] && (
                <AIInsightCard insight={insights.recommendations[1]} />
              )}
            </>
          ) : (
            <>
              <AIInsightCard insight="Start tracking your expenses to get personalized AI insights and recommendations." />
              <AIInsightCard insight="Add your first expense to begin your financial journey with AI-powered analysis." />
            </>
          )}
        </motion.div>

        {/* Recent Transactions Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 rounded-2xl shadow-lg border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handleViewAllTransactions}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </motion.button>
          </div>
          
          <div className="space-y-4">
            {stats.recentTransactions.length > 0 ? (
              stats.recentTransactions.map((transaction: any, index: number) => {
                const timeAgo = new Date(transaction.date || transaction.created_at).toLocaleDateString();
                return (
                  <motion.div
                    key={transaction.id || index}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between p-3 hover:bg-white/50 rounded-xl transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-lg">
                        {transaction.category_name === 'Food' ? '🍽️' : 
                         transaction.category_name === 'Transport' ? '🚗' :
                         transaction.category_name === 'Shopping' ? '🛒' :
                         transaction.category_name === 'Entertainment' ? '🎉' :
                         transaction.category_name === 'Bills' ? '📄' : '💰'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{transaction.description}</p>
                        <p className="text-xs text-slate-600">{timeAgo}</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">
                      -${parseFloat(transaction.amount).toFixed(2)}
                    </span>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No recent transactions</p>
                <p className="text-sm">Your recent expenses will appear here</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6 rounded-2xl shadow-lg border border-white/20"
      >
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Quick Actions</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Wallet, label: 'Add Expense', color: 'from-blue-500 to-blue-600', description: 'Quick expense entry' },
            { icon: Target, label: 'Set Budget', color: 'from-green-500 to-green-600', description: 'AI budget planning' },
            { icon: Brain, label: 'AI Analysis', color: 'from-purple-500 to-purple-600', description: 'Financial health check' },
            { icon: Calendar, label: 'Schedule', color: 'from-pink-500 to-pink-600', description: 'Future predictions' },
          ].map((action, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleQuickAction(action.label)}
              className={`p-4 bg-gradient-to-br ${action.color} text-white rounded-xl shadow-lg hover:shadow-xl transition-all group`}
            >
              <action.icon className="w-6 h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium">{action.label}</p>
              <p className="text-xs opacity-80 mt-1">{action.description}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
