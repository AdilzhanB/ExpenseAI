import React, { useEffect, useState } from 'react';
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
  ShoppingBag
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
import { useExpenseStore, useCategoryStore, useAIStore } from '../store';

const Dashboard: React.FC = () => {
  const { fetchStats, totalAmount, categoryBreakdown } = useExpenseStore();
  const { fetchCategories } = useCategoryStore();
  const { getSpendingInsights, fetchHealthScore, insights, healthScore } = useAIStore();
  const [timeframe, setTimeframe] = useState('month');

  useEffect(() => {
    fetchStats(timeframe);
    fetchCategories();
    getSpendingInsights();
    fetchHealthScore();
  }, [timeframe]);

  // Mock data for demo - in real app this would come from API
  const trendData = [
    { name: 'Jan', amount: 1200, budget: 1500 },
    { name: 'Feb', amount: 1350, budget: 1500 },
    { name: 'Mar', amount: 980, budget: 1500 },
    { name: 'Apr', amount: 1600, budget: 1500 },
    { name: 'May', amount: 1420, budget: 1500 },
    { name: 'Jun', amount: 1180, budget: 1500 },
  ];

  const pieColors = ['#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#EC4899'];

  const pieData = categoryBreakdown?.map((cat: any, index: number) => ({
    name: cat.name,
    value: cat.total,
    color: pieColors[index % pieColors.length]
  })) || [];

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
          value={`$${totalAmount?.toFixed(2) || '0.00'}`}
          change="12% from last month"
          icon={DollarSign}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          trend="up"
        />
        <StatCard
          title="Budget Remaining"
          value="$750.00"
          change="25% remaining"
          icon={Target}
          color="bg-gradient-to-br from-green-500 to-green-600"
          trend="down"
        />
        <StatCard
          title="Transactions"
          value="42"
          change="8 more than last month"
          icon={CreditCard}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          trend="up"
        />
        <StatCard
          title="AI Health Score"
          value={`${healthScore?.overall || 85}/100`}
          change="Excellent"
          icon={Brain}
          color="bg-gradient-to-br from-pink-500 to-pink-600"
          trend="up"
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
                  <Cell key={`cell-${index}`} fill={entry.color} />
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
                    style={{ backgroundColor: item.color }}
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
          
          <AIInsightCard insight={insights?.recommendations?.[0]} />
          <AIInsightCard insight="You're spending 15% more on dining out compared to last month. Consider meal planning to save money." />
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
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </motion.button>
          </div>
          
          <div className="space-y-4">
            {[
              { name: 'Grocery Store', amount: -85.50, category: '🛒', time: '2 hours ago' },
              { name: 'Coffee Shop', amount: -12.99, category: '☕', time: '5 hours ago' },
              { name: 'Salary Deposit', amount: 3200.00, category: '💰', time: '1 day ago' },
              { name: 'Gas Station', amount: -45.20, category: '⛽', time: '2 days ago' },
            ].map((transaction, index) => (
              <motion.div
                key={index}
                whileHover={{ x: 4 }}
                className="flex items-center justify-between p-3 hover:bg-white/50 rounded-xl transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-lg">
                    {transaction.category}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{transaction.name}</p>
                    <p className="text-xs text-slate-600">{transaction.time}</p>
                  </div>
                </div>
                <span className={`font-bold ${
                  transaction.amount > 0 ? 'text-green-600' : 'text-slate-900'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                </span>
              </motion.div>
            ))}
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
            { icon: Wallet, label: 'Add Expense', color: 'from-blue-500 to-blue-600' },
            { icon: Target, label: 'Set Budget', color: 'from-green-500 to-green-600' },
            { icon: Brain, label: 'AI Analysis', color: 'from-purple-500 to-purple-600' },
            { icon: Calendar, label: 'Schedule', color: 'from-pink-500 to-pink-600' },
          ].map((action, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`p-4 bg-gradient-to-br ${action.color} text-white rounded-xl shadow-lg hover:shadow-xl transition-all`}
            >
              <action.icon className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">{action.label}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
