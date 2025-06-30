import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Calendar, Tag, MapPin, Camera, Brain } from 'lucide-react';
import { useUIStore, useExpenseStore, useCategoryStore, useAIStore } from '../store';
import toast from 'react-hot-toast';

const AddExpenseModal: React.FC = () => {
  const { setActiveModal } = useUIStore();
  const { createExpense } = useExpenseStore();
  const { categories } = useCategoryStore();
  const { categorizExpense } = useAIStore();
  
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    tags: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // AI categorization on description change
    if (name === 'description' && value.length > 3) {
      handleAICategorization(value);
    }
  };

  const handleAICategorization = async (description: string) => {
    try {
      const suggestion = await categorizExpense(description, parseFloat(formData.amount) || 0);
      if (suggestion) {
        setAiSuggestion(suggestion);
      }
    } catch (error) {
      console.error('AI categorization failed:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description || !formData.category_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await createExpense({
        ...formData,
        amount: parseFloat(formData.amount),
        category_id: parseInt(formData.category_id),
      });
      
      toast.success('Expense added successfully! 🎉');
      setActiveModal(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add expense');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyAISuggestion = () => {
    if (aiSuggestion) {
      setFormData(prev => ({ ...prev, category_id: aiSuggestion.category_id.toString() }));
      setAiSuggestion(null);
      toast.success('AI suggestion applied!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && setActiveModal(null)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-white/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Add Expense</h2>
              <p className="text-sm text-slate-600">Track your spending with AI assistance</p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveModal(null)}
            className="p-2 hover:bg-white/50 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </motion.button>
        </div>

        {/* AI Suggestion */}
        <AnimatePresence>
          {aiSuggestion && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-purple-900">AI Suggestion</p>
                    <p className="text-sm text-purple-700">Category: {aiSuggestion.category_name}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleApplyAISuggestion}
                  className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Apply
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="input-field pl-12"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="What did you spend on?"
              rows={3}
              className="input-field resize-none"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Category *
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className="input-field pl-12 appearance-none"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="input-field pl-12"
                required
              />
            </div>
          </div>

          {/* Location (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Where was this expense?"
                className="input-field pl-12"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveModal(null)}
              className="flex-1 btn-secondary"
            >
              Cancel
            </motion.button>
            
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="flex-1 btn-primary relative overflow-hidden"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-dots">
                    <div style={{ '--delay': '0s' } as any} />
                    <div style={{ '--delay': '0.2s' } as any} />
                    <div style={{ '--delay': '0.4s' } as any} />
                  </div>
                </div>
              ) : (
                'Add Expense'
              )}
            </motion.button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500">
            💡 Tip: AI will automatically suggest the best category for your expense
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddExpenseModal;
