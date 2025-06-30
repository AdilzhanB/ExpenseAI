import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  Target, 
  Lightbulb,
  PieChart,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  MessageSquare,
  Camera,
  FileText,
  Zap
} from 'lucide-react';
import { useAIStore, useExpenseStore, useCategoryStore } from '../store';
import toast from 'react-hot-toast';

const AIInsights: React.FC = () => {
  const { 
    getSpendingInsights, 
    getBudgetRecommendations, 
    analyzeSavingOpportunities,
    predictNextMonthSpending,
    categorizExpense 
  } = useAIStore();
  const { expenses } = useExpenseStore();
  const { categories } = useCategoryStore();
  
  const [insights, setInsights] = useState<any>(null);
  const [budgetRecommendations, setBudgetRecommendations] = useState<any>(null);
  const [savingOpportunities, setSavingOpportunities] = useState<any>(null);
  const [monthlyPrediction, setMonthlyPrediction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'insights' | 'budget' | 'savings' | 'predictions'>('insights');
  const [askAI, setAskAI] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    loadAIData();
  }, []);

  const loadAIData = async () => {
    setIsLoading(true);
    try {
      const [insightsData, budgetData, savingsData, predictionData] = await Promise.all([
        getSpendingInsights(),
        getBudgetRecommendations(),
        analyzeSavingOpportunities(),
        predictNextMonthSpending()
      ]);
      
      setInsights(insightsData);
      setBudgetRecommendations(budgetData);
      setSavingOpportunities(savingsData);
      setMonthlyPrediction(predictionData);
    } catch (error) {
      console.error('Failed to load AI data:', error);
      toast.error('Failed to load AI insights');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskAI = async () => {
    if (!askAI.trim()) return;
    
    setIsAsking(true);
    try {
      // For now, we'll simulate an AI response
      // In a real implementation, you'd call your AI service
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAiResponse(`Based on your spending patterns, here's what I found about "${askAI}": This is a simulated AI response that would normally come from Google Gemini API analyzing your financial data.`);
      toast.success('AI analysis complete!');
    } catch (error) {
      toast.error('Failed to get AI response');
    } finally {
      setIsAsking(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center"
          >
            <Brain className="w-8 h-8 text-white" />
          </motion.div>
          <p className="text-slate-600">AI is analyzing your financial data...</p>
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
      <div className="glass-card p-6 rounded-2xl text-center">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center"
        >
          <Brain className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-3xl font-bold text-gradient mb-2">AI Financial Insights</h2>
        <p className="text-slate-600">Powered by Google Gemini AI</p>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={loadAIData}
          className="mt-4 btn-primary flex items-center space-x-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Insights</span>
        </motion.button>
      </div>

      {/* Ask AI */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center space-x-2 mb-4">
          <MessageSquare className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-slate-900">Ask AI About Your Finances</h3>
        </div>
        
        <div className="flex space-x-3">
          <input
            type="text"
            value={askAI}
            onChange={(e) => setAskAI(e.target.value)}
            placeholder="Ask anything about your spending patterns..."
            className="input-field flex-1"
            onKeyPress={(e) => e.key === 'Enter' && handleAskAI()}
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAskAI}
            disabled={isAsking || !askAI.trim()}
            className="btn-primary px-6"
          >
            {isAsking ? (
              <div className="loading-dots">
                <div style={{ '--delay': '0s' } as any} />
                <div style={{ '--delay': '0.2s' } as any} />
                <div style={{ '--delay': '0.4s' } as any} />
              </div>
            ) : (
              'Ask AI'
            )}
          </motion.button>
        </div>
        
        {aiResponse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl"
          >
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <p className="text-slate-700 leading-relaxed">{aiResponse}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Tabs */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex border-b border-slate-200">
          {[
            { id: 'insights', label: 'Smart Insights', icon: Lightbulb },
            { id: 'budget', label: 'Budget Tips', icon: Target },
            { id: 'savings', label: 'Save Money', icon: PieChart },
            { id: 'predictions', label: 'Predictions', icon: TrendingUp }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.05)' }}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 p-4 flex items-center justify-center space-x-2 transition-colors ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-purple-500' 
                  : 'hover:bg-slate-50'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-purple-600' : 'text-slate-600'}`} />
              <span className={`font-medium ${activeTab === tab.id ? 'text-purple-900' : 'text-slate-700'}`}>
                {tab.label}
              </span>
            </motion.button>
          ))}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'insights' && (
              <motion.div
                key="insights"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-bold text-slate-900 mb-4">Smart Spending Insights</h3>
                
                {insights?.patterns?.map((pattern: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">{pattern.title}</h4>
                        <p className="text-blue-700 text-sm">{pattern.description}</p>
                        {pattern.amount && (
                          <p className="text-blue-600 font-medium mt-2">{formatCurrency(pattern.amount)}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )) || (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No specific patterns detected yet. Add more expenses to get insights!</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'budget' && (
              <motion.div
                key="budget"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-bold text-slate-900 mb-4">AI Budget Recommendations</h3>
                
                {budgetRecommendations?.suggestions?.map((suggestion: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-900 mb-1">{suggestion.category}</h4>
                        <p className="text-green-700 text-sm mb-2">{suggestion.recommendation}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-green-600">
                            Current: {formatCurrency(suggestion.current)}
                          </span>
                          <span className="text-green-800 font-medium">
                            Suggested: {formatCurrency(suggestion.suggested)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )) || (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No budget recommendations available yet. Add more spending data!</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'savings' && (
              <motion.div
                key="savings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-bold text-slate-900 mb-4">Money Saving Opportunities</h3>
                
                {savingOpportunities?.opportunities?.map((opportunity: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-amber-900 mb-1">{opportunity.title}</h4>
                        <p className="text-amber-700 text-sm mb-2">{opportunity.description}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-amber-800 font-medium">
                            Potential Savings: {formatCurrency(opportunity.potential_savings)}
                          </span>
                          <span className="text-amber-600 text-sm">
                            per {opportunity.frequency}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )) || (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No saving opportunities identified yet. Keep tracking your expenses!</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'predictions' && (
              <motion.div
                key="predictions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-bold text-slate-900 mb-4">AI Spending Predictions</h3>
                
                {monthlyPrediction && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-purple-900 mb-2">Next Month Prediction</h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-purple-700 text-sm">Predicted Spending</p>
                            <p className="text-2xl font-bold text-purple-900">
                              {formatCurrency(monthlyPrediction.predicted_amount || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-purple-700 text-sm">Confidence Level</p>
                            <p className="text-2xl font-bold text-purple-900">
                              {monthlyPrediction.confidence || 'N/A'}%
                            </p>
                          </div>
                        </div>
                        <p className="text-purple-700 text-sm">
                          {monthlyPrediction.explanation || 'Based on your historical spending patterns, this is our best estimate for next month.'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <h4 className="font-semibold text-emerald-900">Likely to Stay Under Budget</h4>
                    </div>
                    <p className="text-emerald-700 text-sm">
                      Categories where you're predicted to stay within your typical spending range.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <h4 className="font-semibold text-red-900">Watch Out For</h4>
                    </div>
                    <p className="text-red-700 text-sm">
                      Categories where spending might exceed your usual patterns.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* AI Features Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="glass-card p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Smart Receipt Scanning</h3>
          <p className="text-slate-600 text-sm">Take a photo of your receipt and AI will automatically extract and categorize the expense.</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="glass-card p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Expense Reports</h3>
          <p className="text-slate-600 text-sm">Generate AI-powered financial reports with insights and recommendations.</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="glass-card p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Auto-Categorization</h3>
          <p className="text-slate-600 text-sm">AI automatically categorizes your expenses as you add them, learning from your patterns.</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AIInsights;
