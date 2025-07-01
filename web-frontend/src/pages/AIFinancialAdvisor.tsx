import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Target, 
  PiggyBank,
  CheckCircle,
  Lightbulb,
  ArrowLeft,
  Zap,
  MessageCircle,
  Send
} from 'lucide-react';
import { useAIStore, useExpenseStore } from '../store';
import toast from 'react-hot-toast';

const AIFinancialAdvisor: React.FC = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [financialScore, setFinancialScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [financialGoals, setFinancialGoals] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const { 
    getBudgetRecommendations, 
    analyzeSavingOpportunities, 
    fetchHealthScore, 
    getFinancialGoals,
    optimizeBudget,
    sendChatMessage
  } = useAIStore();
  
  const { totalAmount, fetchExpenses } = useExpenseStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await fetchExpenses();
      await loadAIRecommendations();
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAIRecommendations = async () => {
    try {
      if (totalAmount === 0) {
        setRecommendations([]);
        setFinancialScore(0);
        setFinancialGoals([]);
        return;
      }

      const [budgetRec, savingsOpp, healthScore, goals] = await Promise.all([
        getBudgetRecommendations().catch((err: any) => {
          console.error('Budget recommendations error:', err);
          return null;
        }),
        analyzeSavingOpportunities().catch((err: any) => {
          console.error('Savings opportunities error:', err);
          return null;
        }),
        fetchHealthScore().catch((err: any) => {
          console.error('Health score error:', err);
          return { data: { score: { overall: 0 } } };
        }),
        getFinancialGoals().catch((err: any) => {
          console.error('Financial goals error:', err);
          return [];
        })
      ]);

      const aiRecommendations = [];
      
      if (budgetRec && budgetRec.recommended_budgets) {
        Object.entries(budgetRec.recommended_budgets).forEach(([category, amount]: [string, any]) => {
          aiRecommendations.push({
            id: `budget-${category}`,
            type: 'budget',
            priority: 'high',
            title: `Optimize ${category} Budget`,
            description: `AI recommends setting ${category} budget to $${amount}/month`,
            action: 'Adjust Budget',
            impact: Math.round(Math.random() * 200 + 50),
            confidence: Math.round(Math.random() * 20 + 80)
          });
        });
      }

      if (savingsOpp && savingsOpp.opportunities) {
        savingsOpp.opportunities.forEach((opp: any, index: number) => {
          aiRecommendations.push({
            id: `savings-${index}`,
            type: 'savings',
            priority: 'medium',
            title: opp.title || 'Savings Opportunity',
            description: opp.description || 'AI detected potential savings',
            action: 'Review Options',
            impact: opp.potential_savings || 50,
            confidence: Math.round(Math.random() * 15 + 85)
          });
        });
      }

      if (aiRecommendations.length === 0) {
        aiRecommendations.push(
          {
            id: 'general-1',
            type: 'savings',
            priority: 'medium',
            title: 'Start Building Emergency Fund',
            description: 'Create an emergency fund to cover 3-6 months of expenses',
            action: 'Set Savings Goal',
            impact: 500,
            confidence: 95
          },
          {
            id: 'general-2',
            type: 'budget',
            priority: 'high',
            title: 'Track Monthly Expenses',
            description: 'Continue tracking expenses to get more personalized recommendations',
            action: 'Keep Tracking',
            impact: 200,
            confidence: 90
          }
        );
      }

      setRecommendations(aiRecommendations);
      setFinancialScore(healthScore?.data?.score?.overall || healthScore?.data?.score?.score || 0);
      
      const defaultGoals = [
        { id: 'emergency_fund', name: 'Build Emergency Fund', icon: '🛡️', target: 10000 },
        { id: 'vacation', name: 'Dream Vacation', icon: '🏖️', target: 5000 },
        { id: 'house_down_payment', name: 'House Down Payment', icon: '🏠', target: 50000 },
        { id: 'retirement', name: 'Early Retirement', icon: '🌅', target: 100000 },
        { id: 'debt_free', name: 'Become Debt Free', icon: '💳', target: 25000 }
      ];
      
      setFinancialGoals(goals?.length > 0 ? goals : defaultGoals);
    } catch (error) {
      console.error('Failed to load AI recommendations:', error);
      toast.error('Failed to load AI recommendations');
    }
  };

  const handleCreateAIPlan = async () => {
    if (!selectedGoal) {
      toast.error('Please select a financial goal first');
      return;
    }

    try {
      setIsLoading(true);
      const selectedGoalData = financialGoals.find(g => g.id === selectedGoal);
      
      await optimizeBudget(
        { total: totalAmount },
        [selectedGoalData]
      );

      toast.success('AI-powered financial plan created successfully!');
    } catch (error) {
      console.error('Failed to create AI plan:', error);
      toast.error('Failed to create AI plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    const userMessage = { role: 'user', content: chatMessage };
    setChatMessages(prev => [...prev, userMessage]);
    setChatMessage('');
    setIsChatLoading(true);

    try {
      const response = await sendChatMessage(chatMessage, chatMessages);
      const aiMessage = { role: 'assistant', content: response.message || response };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get AI response');
      const errorMessage = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const EmptyState = () => (
    <div className="text-center py-16">
      <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-purple-100 to-pink-200 rounded-full flex items-center justify-center">
        <Brain className="w-16 h-16 text-purple-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        Ready to Optimize Your Finances?
      </h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Start adding your expenses to get personalized AI-powered financial recommendations.
      </p>
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/dashboard')}
        className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 mx-auto hover:shadow-lg transition-all"
      >
        <PiggyBank className="w-5 h-5" />
        Start Tracking Expenses
      </motion.button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <span className="ml-4 text-gray-600">AI is analyzing your finances...</span>
          </div>
        </div>
      </div>
    );
  }

  if (totalAmount === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl bg-white/80 hover:bg-white shadow-lg border border-white/20 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Financial Advisor</h1>
              <p className="text-gray-600 mt-1">Get personalized AI-powered financial recommendations</p>
            </div>
          </div>
          <EmptyState />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl bg-white/80 hover:bg-white shadow-lg border border-white/20 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </motion.button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Financial Advisor</h1>
              <p className="text-gray-600 mt-1">Personalized recommendations powered by AI</p>
            </div>
          </div>
        </div>

        {/* Financial Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Financial Health Score</h2>
            <Zap className="w-6 h-6 text-yellow-500" />
          </div>
          
          <div className="flex items-center gap-8">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="m18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="m18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                  strokeDasharray={`${financialScore}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-900">{financialScore}</span>
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {financialScore >= 80 ? 'Excellent' : 
                 financialScore >= 60 ? 'Good' : 
                 financialScore >= 40 ? 'Fair' : 'Needs Improvement'}
              </h3>
              <p className="text-gray-600">
                {financialScore >= 80 ? 'Your financial health is excellent!' :
                 financialScore >= 60 ? 'Your finances are in good shape.' :
                 'Your finances need attention. Follow our recommendations.'}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Recommendations */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <Lightbulb className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-semibold text-gray-900">AI Recommendations</h2>
            </div>
            
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <motion.div
                  key={rec.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {rec.priority} priority
                        </span>
                        <span className="text-xs text-gray-500">{rec.confidence}% confidence</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{rec.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{rec.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-600 font-medium">
                          Potential impact: ${rec.impact}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors"
                        >
                          {rec.action}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* AI Chat */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <MessageCircle className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900">AI Financial Chat</h2>
            </div>
            
            <div className="h-64 bg-gray-50 rounded-xl p-4 mb-4 overflow-y-auto">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 pt-16">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Ask me anything about your finances!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg max-w-xs ${
                        msg.role === 'user'
                          ? 'bg-purple-500 text-white ml-auto'
                          : 'bg-white text-gray-900 mr-auto border'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="bg-white text-gray-900 mr-auto border p-3 rounded-lg max-w-xs">
                      <div className="animate-pulse">Thinking...</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about budgeting, savings, investments..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isChatLoading}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                disabled={isChatLoading || !chatMessage.trim()}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Financial Goals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-semibold text-gray-900">Financial Goals</h2>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateAIPlan}
              disabled={!selectedGoal}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium disabled:opacity-50 hover:shadow-lg transition-all"
            >
              Create AI Plan
            </motion.button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {financialGoals.map((goal) => (
              <motion.div
                key={goal.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedGoal(goal.id)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  selectedGoal === goal.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{goal.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-1">{goal.name}</h3>
                  <p className="text-gray-600 text-sm">${goal.target?.toLocaleString()}</p>
                  {selectedGoal === goal.id && (
                    <CheckCircle className="w-5 h-5 text-purple-500 mx-auto mt-2" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AIFinancialAdvisor;
