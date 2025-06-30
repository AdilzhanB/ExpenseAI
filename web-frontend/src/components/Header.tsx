import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Menu, 
  Search, 
  Bell, 
  Sun, 
  Moon,
  Plus,
  TrendingUp,
  Zap,
  User,
  MessageSquare,
  BarChart3,
  Receipt,
  LayoutDashboard,
  Settings
} from 'lucide-react';
import { useUIStore, useExpenseStore } from '../store';

const Header: React.FC = () => {
  const { sidebarOpen, setSidebarOpen, theme, setTheme, setActiveModal, notifications } = useUIStore();
  const { totalAmount } = useExpenseStore();
  const location = useLocation();

  const getViewInfo = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
        return { 
          title: 'Dashboard', 
          subtitle: 'Overview of your financial activity',
          icon: <LayoutDashboard className="w-6 h-6 text-blue-600" />
        };
      case '/expenses':
        return { 
          title: 'Expenses', 
          subtitle: 'Manage and track your expenses',
          icon: <Receipt className="w-6 h-6 text-green-600" />
        };
      case '/analytics':
        return { 
          title: 'Analytics', 
          subtitle: 'Detailed insights and reports',
          icon: <BarChart3 className="w-6 h-6 text-purple-600" />
        };
      case '/ai-insights':
        return { 
          title: 'AI Insights', 
          subtitle: 'AI-powered financial recommendations',
          icon: <Zap className="w-6 h-6 text-pink-600" />
        };
      case '/ai-chat':
        return { 
          title: 'AI Chat', 
          subtitle: 'Chat with your AI financial assistant',
          icon: <MessageSquare className="w-6 h-6 text-indigo-600" />
        };
      case '/profile':
        return { 
          title: 'Profile', 
          subtitle: 'Manage your account settings',
          icon: <User className="w-6 h-6 text-orange-600" />
        };
      case '/settings':
        return { 
          title: 'Settings', 
          subtitle: 'Customize your experience',
          icon: <Settings className="w-6 h-6 text-slate-600" />
        };
      default:
        return { 
          title: 'Dashboard', 
          subtitle: 'Overview of your financial activity',
          icon: <LayoutDashboard className="w-6 h-6 text-blue-600" />
        };
    }
  };

  const viewInfo = getViewInfo();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-card border-b border-white/20 px-4 lg:px-6 py-4 shadow-lg"
    >
      <div className="flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-xl transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </motion.button>

          {/* View Title */}
          <div className="flex items-center space-x-3">
            {viewInfo.icon}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{viewInfo.title}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 hidden sm:block">
                {viewInfo.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Center - Search (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search expenses, categories..."
              className="w-full pl-12 pr-4 py-3 bg-white/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm transition-all"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Total Amount (Desktop) */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="hidden lg:flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-4 py-2 rounded-xl border border-blue-200"
          >
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <div className="text-right">
              <p className="text-xs text-slate-600">This Month</p>
              <p className="font-bold text-slate-900">${totalAmount?.toFixed(2) || '0.00'}</p>
            </div>
          </motion.div>

          {/* Quick Add Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveModal('add-expense')}
            className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Add</span>
          </motion.button>

          {/* Mobile Quick Add */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveModal('add-expense')}
            className="sm:hidden p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg"
          >
            <Plus className="w-5 h-5" />
          </motion.button>

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              // Toggle notifications panel or navigate to notifications page
              console.log('Notifications clicked');
            }}
            className="relative p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-xl transition-colors"
          >
            <Bell className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            {notifications.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
              >
                {notifications.length}
              </motion.span>
            )}
          </motion.button>

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-xl transition-colors"
          >
            {theme === 'light' ? (
              <Moon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            ) : (
              <Sun className="w-6 h-6 text-yellow-500" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Mobile Search */}
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        className="md:hidden mt-4"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-12 pr-4 py-3 bg-white/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
          />
        </div>
      </motion.div>
    </motion.header>
  );
};

export default Header;
