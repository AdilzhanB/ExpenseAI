import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  Tag, 
  MapPin, 
  DollarSign, 
  Edit2, 
  Trash2, 
  Eye,
  ChevronDown,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useUIStore, useExpenseStore, useCategoryStore } from '../store';
import toast from 'react-hot-toast';

const ExpenseList: React.FC = () => {
  const { setActiveModal } = useUIStore();
  const { expenses, fetchExpenses, deleteExpense } = useExpenseStore();
  const { categories, fetchCategories } = useCategoryStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchExpenses(), fetchCategories()]);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load expenses');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchExpenses, fetchCategories]);

  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = expenses.filter((expense: any) => {
      const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          expense.location?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || expense.category_id.toString() === selectedCategory;
      const matchesDateRange = (!dateRange.start || expense.date >= dateRange.start) &&
                              (!dateRange.end || expense.date <= dateRange.end);
      
      return matchesSearch && matchesCategory && matchesDateRange;
    });

    // Sort expenses
    filtered.sort((a: any, b: any) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'amount':
          aVal = a.amount;
          bVal = b.amount;
          break;
        case 'description':
          aVal = a.description.toLowerCase();
          bVal = b.description.toLowerCase();
          break;
        case 'date':
        default:
          aVal = new Date(a.date);
          bVal = new Date(b.date);
          break;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [expenses, searchTerm, selectedCategory, sortBy, sortOrder, dateRange]);

  const getCategoryById = (id: number) => {
    return categories.find((cat: any) => cat.id === id);
  };

  const handleDeleteExpense = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id);
        toast.success('Expense deleted successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete expense');
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
          <p className="text-slate-600 mt-4">Loading expenses...</p>
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
            <h2 className="text-2xl font-bold text-slate-900">Expenses</h2>
            <p className="text-slate-600">Manage and track your spending</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveModal('addExpense')}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </motion.button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search expenses..."
            className="input-field pl-12 w-full"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </motion.button>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1 bg-white"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="description">Description</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 hover:bg-slate-100 rounded"
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">All Categories</option>
                  {categories.map((category: any) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expense List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {filteredAndSortedExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No expenses found</h3>
            <p className="text-slate-600 mb-6">
              {searchTerm || selectedCategory || dateRange.start || dateRange.end
                ? 'Try adjusting your filters or search terms.'
                : 'Start by adding your first expense.'}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveModal('addExpense')}
              className="btn-primary"
            >
              Add Your First Expense
            </motion.button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            <AnimatePresence>
              {filteredAndSortedExpenses.map((expense: any, index: number) => {
                const category = getCategoryById(expense.category_id);
                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 hover:bg-slate-50/50 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl">
                          {category?.icon || '💰'}
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-slate-900">{expense.description}</h3>
                          <div className="flex items-center space-x-4 text-sm text-slate-600 mt-1">
                            <div className="flex items-center space-x-1">
                              <Tag className="w-3 h-3" />
                              <span>{category?.name || 'Uncategorized'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(expense.date)}</span>
                            </div>
                            {expense.location && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3" />
                                <span>{expense.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-lg font-semibold text-slate-900">
                            {formatCurrency(expense.amount)}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit Expense"
                          >
                            <Edit2 className="w-4 h-4" />
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredAndSortedExpenses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {filteredAndSortedExpenses.length}
              </div>
              <div className="text-sm text-slate-600">Total Expenses</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(
                  filteredAndSortedExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0)
                )}
              </div>
              <div className="text-sm text-slate-600">Total Amount</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(
                  filteredAndSortedExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0) / 
                  filteredAndSortedExpenses.length
                )}
              </div>
              <div className="text-sm text-slate-600">Average</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {new Set(filteredAndSortedExpenses.map((exp: any) => exp.category_id)).size}
              </div>
              <div className="text-sm text-slate-600">Categories</div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ExpenseList;
