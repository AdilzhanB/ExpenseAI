import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { useAuthStore, useUIStore } from './store';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ExpenseList from './components/ExpenseList';
import Analytics from './components/Analytics';
import AIInsights from './components/AIInsights';
import Settings from './components/Settings';
import Profile from './components/Profile';
import AIChat from './components/AIChat';
import AuthModal from './components/AuthModal';
import AddExpenseModal from './components/AddExpenseModal';
import NotificationContainer from './components/NotificationContainer';
import LoadingScreen from './components/LoadingScreen';
import AIFinancialAdvisor from './pages/AIFinancialAdvisor';
import SmartBudgetPlanner from './pages/SmartBudgetPlanner';
import SmartReceiptScanner from './pages/SmartReceiptScanner';
import FinancialHealthDashboard from './pages/FinancialHealthDashboard';
import ExpensePredictionCenter from './pages/ExpensePredictionCenter';
import './App.css';

const App: React.FC = () => {
  const { user, token, isLoading, fetchUser } = useAuthStore();
  const { activeModal, sidebarOpen, theme } = useUIStore();

  useEffect(() => {
    if (token && !user) {
      fetchUser();
    }
  }, [token, user, fetchUser]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <AuthModal />
        <Toaster position="top-right" />
      </div>
    );
  }

  return (
    <Router>
      <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
        <div className="flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen">
          {/* Sidebar - Always visible on desktop, toggleable on mobile */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>
          
          {/* Mobile Sidebar Overlay */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed lg:hidden z-30"
              >
                <Sidebar />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-screen">
            {/* Header */}
            <Header />

            {/* Content */}
            <main className="flex-1 p-4 lg:p-6 overflow-hidden">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <Dashboard />
                  </motion.div>
                } />
                <Route path="/expenses" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <ExpenseList />
                  </motion.div>
                } />
                <Route path="/analytics" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <Analytics />
                  </motion.div>
                } />
                <Route path="/ai-insights" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <AIInsights />
                  </motion.div>
                } />
                <Route path="/ai-chat" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <AIChat />
                  </motion.div>
                } />
                <Route path="/profile" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <Profile />
                  </motion.div>
                } />
                <Route path="/settings" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <Settings />
                  </motion.div>
                } />
                <Route path="/ai-advisor" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <AIFinancialAdvisor />
                  </motion.div>
                } />
                <Route path="/budget-planner" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <SmartBudgetPlanner />
                  </motion.div>
                } />
                <Route path="/receipt-scanner" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <SmartReceiptScanner />
                  </motion.div>
                } />
                <Route path="/health-dashboard" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <FinancialHealthDashboard />
                  </motion.div>
                } />
                <Route path="/predictions" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <ExpensePredictionCenter />
                  </motion.div>
                } />
              </Routes>
            </main>
          </div>

          {/* Mobile Sidebar Overlay */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden"
                onClick={() => useUIStore.getState().setSidebarOpen(false)}
              />
            )}
          </AnimatePresence>

          {/* Modals */}
          <AnimatePresence>
            {activeModal === 'add-expense' && <AddExpenseModal />}
          </AnimatePresence>

          {/* Background Effects */}
          <div className="fixed inset-0 -z-10">
            <div className="absolute top-0 left-0 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute top-1/3 right-0 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-pulse-slow delay-1000" />
            <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-pink-300/20 rounded-full blur-3xl animate-pulse-slow delay-2000" />
          </div>

          {/* Notifications */}
          <NotificationContainer />
          
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'glass-card',
              duration: 4000,
            }}
          />
        </div>
      </div>
    </Router>
  );
};

export default App;
