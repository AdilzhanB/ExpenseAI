import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Receipt, 
  BarChart3, 
  Brain, 
  Settings, 
  LogOut,
  Plus,
  Sparkles,
  User,
  MessageSquare
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../store';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { setActiveModal, setSidebarOpen } = useUIStore();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-600', path: '/dashboard' },
    { id: 'expenses', label: 'Expenses', icon: Receipt, color: 'text-green-600', path: '/expenses' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-purple-600', path: '/analytics' },
    { id: 'ai-insights', label: 'AI Insights', icon: Brain, color: 'text-pink-600', path: '/ai-insights' },
    { id: 'ai-chat', label: 'AI Chat', icon: MessageSquare, color: 'text-indigo-600', path: '/ai-chat' },
    { id: 'profile', label: 'Profile', icon: User, color: 'text-orange-600', path: '/profile' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-slate-600', path: '/settings' },
  ];

  const handleAddExpense = () => {
    setActiveModal('add-expense');
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
  };

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      exit={{ x: -300 }}
      className="w-80 h-screen glass-card rounded-r-3xl border-r border-white/20 shadow-2xl flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold text-gradient">ExpenseAI</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Smart Financial Tracking</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-lg">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <div className="p-6 border-b border-white/10">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddExpense}
          className="w-full btn-primary flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Expense</span>
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 dark:text-blue-300 shadow-lg border border-blue-200 dark:border-blue-800'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                >
                  <motion.div
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center space-x-3"
                  >
                    <Icon 
                      className={`w-5 h-5 ${isActive ? item.color : 'text-slate-500 dark:text-slate-400'}`} 
                    />
                    <span className="font-medium">{item.label}</span>
                    
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="ml-auto w-2 h-2 bg-blue-500 rounded-full"
                      />
                    )}
                  </motion.div>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-white/10">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </motion.button>

        {/* AI Status */}
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-4 flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400"
        >
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>AI Assistant Online</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
