import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Target,
  AlertTriangle,
  CheckCircle,
  Brain,
  DollarSign,
  PieChart,
  BarChart3,
  Sparkles,
  RefreshCw,
  Calendar,
  Award,
  Activity,
  ArrowLeft
} from 'lucide-react';
import { 
  CircularProgressbar, 
  CircularProgressbarWithChildren,
  buildStyles 
} from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useAIStore, useExpenseStore } from '../store';

interface HealthMetric {
  name: string;
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  trend: 'up' | 'down' | 'stable';
  description: string;
}

const FinancialHealthDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const { fetchHealthScore, healthScore } = useAIStore();
  const { fetchStats } = useExpenseStore();

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    setLoading(true);
    try {
      // Fetch real AI-powered health score
      const healthResponse = await fetch('/api/ai/health-score', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!healthResponse.ok) {
        throw new Error('Failed to fetch health score');
      }
      
      const healthResult = await healthResponse.json();
      const healthScore = healthResult.data?.score?.score || 0;
      const breakdown = healthResult.data?.score?.breakdown || {};
      
      // Fetch financial insights
      const insightsResponse = await fetch('/api/ai/insights', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      let insights = null;
      if (insightsResponse.ok) {
        const insightsResult = await insightsResponse.json();
        insights = insightsResult.data?.insights;
      }
      
      // Build health data from real API responses
      const realHealthData = {
        overallScore: healthScore,
        metrics: [
          {
            name: 'Spending Control',
            score: breakdown.spending_control || 0,
            status: (breakdown.spending_control || 0) >= 80 ? 'excellent' as const : 
                   (breakdown.spending_control || 0) >= 60 ? 'good' as const : 
                   (breakdown.spending_control || 0) >= 40 ? 'fair' as const : 'poor' as const,
            trend: 'stable' as const,
            description: 'Based on your budget adherence and spending patterns'
          },
          {
            name: 'Budget Adherence',
            score: breakdown.budget_adherence || 0,
            status: (breakdown.budget_adherence || 0) >= 80 ? 'excellent' as const : 
                   (breakdown.budget_adherence || 0) >= 60 ? 'good' as const : 
                   (breakdown.budget_adherence || 0) >= 40 ? 'fair' as const : 'poor' as const,
            trend: 'stable' as const,
            description: 'How well you stick to your planned budgets'
          },
          {
            name: 'Data Quality',
            score: breakdown.data_quality || 50,
            status: (breakdown.data_quality || 50) >= 80 ? 'excellent' as const : 'fair' as const,
            trend: 'up' as const,
            description: 'Completeness and consistency of your financial data'
          }
        ],
        insights: insights ? [
          {
            type: 'info',
            title: 'Financial Analysis',
            description: insights.trends || 'Your financial data is being analyzed',
            action: insights.recommendations?.[0] || 'Continue tracking expenses'
          },
          {
            type: healthScore >= 70 ? 'success' : 'warning',
            title: 'Health Score',
            description: `Your financial health score is ${healthScore}`,
            action: healthScore >= 70 ? 'Keep up the good work!' : 'Focus on budget adherence'
          }
        ] : [
          {
            type: 'info',
            title: 'Getting Started',
            description: 'Add more expense data to get detailed AI insights',
            action: 'Start tracking your daily expenses'
          }
        ],
        recommendations: insights?.recommendations || [
          'Add more expense data for better analysis',
          'Set up budget categories for your spending',
          'Review your expenses weekly for better control',
          'Consider using the AI features for personalized advice'
        ]
      };
      
      setHealthData(realHealthData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load health data:', error);
      
      // Show error state instead of mock data
      setHealthData({
        overallScore: 0,
        metrics: [],
        insights: [
          {
            type: 'warning',
            title: 'Data Unavailable',
            description: 'Unable to load financial health data',
            action: 'Please try again or add some expense data first'
          }
        ],
        recommendations: [
          'Check your internet connection',
          'Add some expenses to get started',
          'Try refreshing the page'
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#F59E0B'; // Yellow
    if (score >= 40) return '#EF4444'; // Red
    return '#DC2626'; // Dark Red
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      excellent: { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle },
      good: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', icon: TrendingUp },
      fair: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', icon: AlertTriangle },
      poor: { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: TrendingDown }
    };
    
    const config = configs[status as keyof typeof configs];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-100 dark:from-gray-900 dark:via-emerald-900 dark:to-blue-900 p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Brain className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Analyzing Your Financial Health
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            AI is processing your financial data...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-100 dark:from-gray-900 dark:via-emerald-900 dark:to-blue-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors border border-gray-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <Heart className="w-6 w-6 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Financial Health Dashboard
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              AI-powered comprehensive analysis of your financial wellness with personalized insights and recommendations.
            </p>
            {lastUpdated && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center justify-center">
                <Calendar className="w-4 h-4 mr-1" />
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            )}
          </div>
        </motion.div>

        {!healthData ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Health Data Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add some expenses and income data to generate your financial health report.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadHealthData}
              className="button-primary flex items-center mx-auto"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Health Report
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Overall Score */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-8 rounded-2xl text-center mb-8"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="w-32 h-32">
                  <CircularProgressbarWithChildren
                    value={healthData.overallScore}
                    styles={buildStyles({
                      pathColor: getScoreColor(healthData.overallScore),
                      trailColor: '#E5E7EB',
                      textColor: '#1F2937'
                    })}
                  >
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {healthData.overallScore}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Health Score
                      </div>
                    </div>
                  </CircularProgressbarWithChildren>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {healthData.overallScore >= 80 ? 'Excellent' : 
                 healthData.overallScore >= 60 ? 'Good' : 
                 healthData.overallScore >= 40 ? 'Fair' : 'Needs Attention'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your overall financial health is{' '}
                {healthData.overallScore >= 80 ? 'in excellent condition' : 
                 healthData.overallScore >= 60 ? 'in good shape with room for improvement' : 
                 healthData.overallScore >= 40 ? 'fair but needs attention' : 'concerning and requires immediate action'}
              </p>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadHealthData}
                className="button-secondary flex items-center mx-auto"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Analysis
              </motion.button>
            </motion.div>

            {/* Health Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
            >
              {healthData.metrics.map((metric: HealthMetric, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="glass-card p-6 rounded-2xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {metric.name}
                    </h3>
                    {getTrendIcon(metric.trend)}
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 mr-4">
                      <CircularProgressbar
                        value={metric.score}
                        text={`${metric.score}`}
                        styles={buildStyles({
                          pathColor: getScoreColor(metric.score),
                          textColor: getScoreColor(metric.score),
                          trailColor: '#E5E7EB',
                          textSize: '24px'
                        })}
                      />
                    </div>
                    <div className="flex-1">
                      {getStatusBadge(metric.status)}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {metric.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6 rounded-2xl mb-8"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Sparkles className="w-5 h-5 mr-2" />
                AI Insights
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {healthData.insights.map((insight: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={`p-4 rounded-xl border-l-4 ${
                      insight.type === 'warning' ? 'bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20' :
                      insight.type === 'success' ? 'bg-green-50 border-green-400 dark:bg-green-900/20' :
                      'bg-blue-50 border-blue-400 dark:bg-blue-900/20'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        insight.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/40' :
                        insight.type === 'success' ? 'bg-green-100 dark:bg-green-900/40' :
                        'bg-blue-100 dark:bg-blue-900/40'
                      }`}>
                        {insight.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        ) : insight.type === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Brain className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                          {insight.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {insight.description}
                        </p>
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-300">
                          💡 {insight.action}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-card p-6 rounded-2xl"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                AI Recommendations
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {healthData.recommendations.map((recommendation: string, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-start space-x-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl"
                  >
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {recommendation}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default FinancialHealthDashboard;
