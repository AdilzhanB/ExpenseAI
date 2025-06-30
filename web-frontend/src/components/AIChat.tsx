import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  TrendingUp, 
  DollarSign,
  Calendar,
  PieChart,
  BarChart3,
  Lightbulb,
  RefreshCw,
  Copy,
  ThumbsUp,
  ThumbsDown,
  MessageSquare
} from 'lucide-react';
import { useAIStore, useExpenseStore } from '../store';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm your AI financial assistant. I can help you analyze your spending patterns, provide budgeting advice, and answer questions about your finances. What would you like to know?",
      timestamp: new Date(),
      suggestions: [
        "What are my biggest spending categories?",
        "How can I save more money?",
        "Analyze my spending trends",
        "Give me budget recommendations"
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { analyzeExpense } = useAIStore();
  const { expenses } = useExpenseStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simulate AI response based on the message content
      const aiResponse = await generateAIResponse(inputMessage);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse.content,
        timestamp: new Date(),
        suggestions: aiResponse.suggestions
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast.error('Failed to get AI response');
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I apologize, but I'm having trouble connecting to my AI services right now. Please try again later or check if your API key is properly configured.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = async (userInput: string): Promise<{ content: string; suggestions?: string[] }> => {
    // Simulate AI analysis based on user input and expense data
    const input = userInput.toLowerCase();
    
    if (input.includes('spending') || input.includes('categories')) {
      return {
        content: `Based on your recent expenses, here's your spending breakdown:

🛒 **Groceries**: $450 (32%)
🍕 **Dining Out**: $280 (20%)
⛽ **Transportation**: $190 (14%)
🎬 **Entertainment**: $150 (11%)
🏠 **Utilities**: $130 (9%)
👕 **Shopping**: $120 (8%)
💊 **Healthcare**: $80 (6%)

Your top spending category is groceries, which is generally a good sign as it indicates essential spending. However, dining out accounts for 20% of your budget - you could potentially save $100-150 monthly by cooking more meals at home.`,
        suggestions: [
          "How can I reduce dining expenses?",
          "Show me my monthly trends",
          "What's my average weekly spending?",
          "Give me saving tips"
        ]
      };
    }

    if (input.includes('save') || input.includes('budget')) {
      return {
        content: `Here are personalized saving recommendations based on your spending patterns:

💡 **Immediate Savings (This Month)**
• Reduce dining out by 30% → Save $84
• Use coupons for groceries → Save $45
• Cancel unused subscriptions → Save $25

📊 **Long-term Strategies**
• Set up automatic savings of 20% → $300/month
• Create category budgets with alerts
• Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings

🎯 **Smart Tips**
• Cook meals in batches on weekends
• Use cashback credit cards for groceries
• Review and negotiate recurring bills quarterly

With these changes, you could potentially save $454 per month!`,
        suggestions: [
          "Create a budget plan",
          "Track my progress",
          "More saving tips",
          "Set spending alerts"
        ]
      };
    }

    if (input.includes('trend') || input.includes('analysis')) {
      return {
        content: `📈 **Your Financial Trends Analysis**

**Monthly Overview:**
• This month: $1,405 (↑ 12% from last month)
• 3-month average: $1,285
• Highest category growth: Entertainment (+25%)
• Best improvement: Utilities (-15%)

**Spending Patterns:**
• You spend 40% more on weekends
• Tuesday is your lowest spending day
• Peak spending time: 6-8 PM
• Most frequent purchases: Coffee ($4.50 avg)

**Insights:**
✅ Great job reducing utility costs!
⚠️ Entertainment spending is trending upward
💡 Consider meal planning to reduce weekend food costs

Your spending is generally consistent with good habits, but there's room for weekend budget optimization.`,
        suggestions: [
          "Weekend spending tips",
          "Set entertainment budget",
          "Track daily patterns",
          "Compare with last year"
        ]
      };
    }

    if (input.includes('prediction') || input.includes('forecast')) {
      return {
        content: `🔮 **Spending Prediction for Next Month**

Based on your patterns, I predict you'll spend approximately **$1,320** next month.

**Breakdown:**
• Groceries: $435 (seasonal increase expected)
• Dining: $260 (assuming current trends)
• Transportation: $195 (gas price fluctuations)
• Entertainment: $180 (holiday season increase)
• Other categories: $250

**Confidence Level:** 85%

**Recommendations:**
• Budget an extra $50 for holiday entertainment
• Stock up on non-perishables to save on groceries
• Consider carpooling to reduce transportation costs

Would you like me to create a detailed budget plan for next month?`,
        suggestions: [
          "Create next month's budget",
          "Holiday spending tips",
          "Set up alerts",
          "Track predictions"
        ]
      };
    }

    // Default response
    return {
      content: `I understand you're asking about "${userInput}". While I can provide general financial advice, I work best when analyzing your specific spending data.

Here's what I can help you with:

💰 **Expense Analysis**
• Categorize and analyze your spending
• Identify unusual patterns or trends
• Compare spending across time periods

📊 **Budgeting & Planning**
• Create personalized budget recommendations
• Set up spending alerts and goals
• Predict future expenses

🎯 **Savings Optimization**
• Find areas to cut costs
• Suggest money-saving strategies
• Track your progress toward financial goals

Would you like me to analyze any specific aspect of your finances?`,
      suggestions: [
        "Analyze my spending patterns",
        "Help me create a budget",
        "Find ways to save money",
        "Show spending trends"
      ]
    };
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Message copied to clipboard');
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Financial Assistant
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Get personalized insights about your spending and financial habits
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 glass-card p-6 mb-6 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : ''}`}
              >
                {message.type === 'ai' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div className={`max-w-2xl ${message.type === 'user' ? 'order-first' : ''}`}>
                  <div className={`p-4 rounded-2xl ${
                    message.type === 'user' 
                      ? 'bg-primary-500 text-white ml-12' 
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                    
                    {message.type === 'ai' && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => copyMessage(message.content)}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </button>
                        <button className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          Helpful
                        </button>
                        <button className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
                          <ThumbsDown className="w-3 h-3" />
                          Not helpful
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>

                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-primary-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Analyzing your financial data...
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me anything about your finances..."
              className="flex-1 input-field"
              disabled={isLoading}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Quick Insights
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleSuggestionClick("What are my biggest spending categories?")}
            className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-left"
          >
            <PieChart className="w-5 h-5 text-blue-500 mb-2" />
            <div className="text-sm font-medium text-gray-900 dark:text-white">Categories</div>
          </button>
          <button
            onClick={() => handleSuggestionClick("Analyze my spending trends")}
            className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors text-left"
          >
            <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
            <div className="text-sm font-medium text-gray-900 dark:text-white">Trends</div>
          </button>
          <button
            onClick={() => handleSuggestionClick("How can I save more money?")}
            className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors text-left"
          >
            <DollarSign className="w-5 h-5 text-purple-500 mb-2" />
            <div className="text-sm font-medium text-gray-900 dark:text-white">Savings</div>
          </button>
          <button
            onClick={() => handleSuggestionClick("Give me budget recommendations")}
            className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors text-left"
          >
            <BarChart3 className="w-5 h-5 text-orange-500 mb-2" />
            <div className="text-sm font-medium text-gray-900 dark:text-white">Budget</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
