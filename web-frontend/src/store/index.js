import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// API base URL
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// API helper
const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  },

  // Auth endpoints
  auth: {
    login: (credentials) => api.request('/auth/login', {
      method: 'POST',
      body: credentials,
    }),
    register: (userData) => api.request('/auth/register', {
      method: 'POST',
      body: userData,
    }),
    me: () => api.request('/auth/me'),
    updateProfile: (data) => api.request('/auth/profile', {
      method: 'PUT',
      body: data,
    }),
  },

  // Expense endpoints
  expenses: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.request(`/expenses${query ? `?${query}` : ''}`);
    },
    getById: (id) => api.request(`/expenses/${id}`),
    create: (expense) => api.request('/expenses', {
      method: 'POST',
      body: expense,
    }),
    update: (id, expense) => api.request(`/expenses/${id}`, {
      method: 'PUT',
      body: expense,
    }),
    delete: (id) => api.request(`/expenses/${id}`, {
      method: 'DELETE',
    }),
    getStats: (period = 'month') => api.request(`/expenses/stats/summary?period=${period}`),
    bulk: (action, ids) => api.request('/expenses/bulk', {
      method: 'POST',
      body: { action, expense_ids: ids },
    }),
  },

  // Category endpoints
  categories: {
    getAll: () => api.request('/categories'),
    create: (category) => api.request('/categories', {
      method: 'POST',
      body: category,
    }),
    update: (id, category) => api.request(`/categories/${id}`, {
      method: 'PUT',
      body: category,
    }),
    delete: (id) => api.request(`/categories/${id}`, {
      method: 'DELETE',
    }),
    getStats: (id, period = 'month') => api.request(`/categories/${id}/stats?period=${period}`),
  },

  // AI endpoints
  ai: {
    analyzeExpense: (expense) => api.request('/ai/analyze-expense', {
      method: 'POST',
      body: { expense },
    }),
    getInsights: () => api.request('/ai/insights'),
    getBudgetRecommendations: () => api.request('/ai/budget-recommendations'),
    getSavingsOpportunities: () => api.request('/ai/savings-opportunities'),
    categorize: (description, amount) => api.request('/ai/categorize', {
      method: 'POST',
      body: { description, amount },
    }),
    analyzeReceipt: (receiptText) => api.request('/ai/analyze-receipt', {
      method: 'POST',
      body: { receiptText },
    }),
    getHealthScore: () => api.request('/ai/health-score'),
  },
};

// Auth store
export const useAuthStore = create(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: localStorage.getItem('token'),
        isLoading: false,
        error: null,

        // Actions
        login: async (credentials) => {
          set({ isLoading: true, error: null });
          try {
            const response = await api.auth.login(credentials);
            const { user, token } = response.data;
            
            localStorage.setItem('token', token);
            set({ user, token, isLoading: false });
            return response;
          } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
          }
        },

        register: async (userData) => {
          set({ isLoading: true, error: null });
          try {
            const response = await api.auth.register(userData);
            const { user, token } = response.data;
            
            localStorage.setItem('token', token);
            set({ user, token, isLoading: false });
            return response;
          } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
          }
        },

        logout: () => {
          localStorage.removeItem('token');
          set({ user: null, token: null, error: null });
        },

        fetchUser: async () => {
          const { token } = get();
          if (!token) return;

          set({ isLoading: true });
          try {
            const response = await api.auth.me();
            set({ user: response.data.user, isLoading: false });
          } catch (error) {
            set({ error: error.message, isLoading: false });
            // If token is invalid, logout
            if (error.message.includes('token')) {
              get().logout();
            }
          }
        },

        updateProfile: async (data) => {
          set({ isLoading: true, error: null });
          try {
            const response = await api.auth.updateProfile(data);
            set({ user: response.data.user, isLoading: false });
            return response;
          } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
          }
        },

        clearError: () => set({ error: null }),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ token: state.token }),
      }
    ),
    { name: 'auth-store' }
  )
);

// Expense store
export const useExpenseStore = create(
  devtools(
    (set, get) => ({
      expenses: [],
      currentExpense: null,
      totalAmount: 0,
      categoryBreakdown: [],
      isLoading: false,
      error: null,
      pagination: {
        current_page: 1,
        total_pages: 1,
        total_items: 0,
        items_per_page: 20,
      },
      filters: {
        page: 1,
        limit: 20,
        category: '',
        startDate: '',
        endDate: '',
        search: '',
      },

      // Actions
      fetchExpenses: async (params = {}) => {
        set({ isLoading: true, error: null });
        try {
          const filters = { ...get().filters, ...params };
          const response = await api.expenses.getAll(filters);
          
          set({
            expenses: response.data.expenses,
            pagination: response.data.pagination,
            filters,
            isLoading: false,
          });
          return response;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      fetchExpenseById: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.expenses.getById(id);
          set({ currentExpense: response.data.expense, isLoading: false });
          return response;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      createExpense: async (expense) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.expenses.create(expense);
          const newExpense = response.data.expense;
          
          set((state) => ({
            expenses: [newExpense, ...state.expenses],
            isLoading: false,
          }));
          
          // Refresh stats
          get().fetchStats();
          return response;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateExpense: async (id, expense) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.expenses.update(id, expense);
          const updatedExpense = response.data.expense;
          
          set((state) => ({
            expenses: state.expenses.map((exp) =>
              exp.id === id ? updatedExpense : exp
            ),
            currentExpense: state.currentExpense?.id === id ? updatedExpense : state.currentExpense,
            isLoading: false,
          }));
          
          return response;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      deleteExpense: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await api.expenses.delete(id);
          
          set((state) => ({
            expenses: state.expenses.filter((exp) => exp.id !== id),
            isLoading: false,
          }));
          
          // Refresh stats
          get().fetchStats();
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      fetchStats: async (period = 'month') => {
        try {
          const response = await api.expenses.getStats(period);
          set({
            totalAmount: response.data.total_amount,
            categoryBreakdown: response.data.category_breakdown,
          });
          return response;
        } catch (error) {
          console.error('Failed to fetch stats:', error);
        }
      },

      fetchAnalytics: async (params = {}) => {
        try {
          const response = await api.expenses.getStats(params.period || 'month');
          return response;
        } catch (error) {
          console.error('Failed to fetch analytics:', error);
          return { data: { analytics: null } };
        }
      },

      bulkDelete: async (ids) => {
        set({ isLoading: true, error: null });
        try {
          await api.expenses.bulk('delete', ids);
          
          set((state) => ({
            expenses: state.expenses.filter((exp) => !ids.includes(exp.id)),
            isLoading: false,
          }));
          
          get().fetchStats();
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'expense-store' }
  )
);

// Category store
export const useCategoryStore = create(
  devtools(
    (set, get) => ({
      categories: [],
      isLoading: false,
      error: null,

      // Actions
      fetchCategories: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.categories.getAll();
          set({ categories: response.data.categories, isLoading: false });
          return response;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      createCategory: async (category) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.categories.create(category);
          const newCategory = response.data.category;
          
          set((state) => ({
            categories: [...state.categories, newCategory],
            isLoading: false,
          }));
          
          return response;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateCategory: async (id, category) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.categories.update(id, category);
          const updatedCategory = response.data.category;
          
          set((state) => ({
            categories: state.categories.map((cat) =>
              cat.id === id ? updatedCategory : cat
            ),
            isLoading: false,
          }));
          
          return response;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      deleteCategory: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await api.categories.delete(id);
          
          set((state) => ({
            categories: state.categories.filter((cat) => cat.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'category-store' }
  )
);

// AI store
export const useAIStore = create(
  devtools(
    (set, get) => ({
      insights: null,
      budgetRecommendations: null,
      savingsOpportunities: null,
      healthScore: null,
      isLoading: false,
      error: null,

      // Actions
      analyzeExpense: async (expense) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.ai.analyzeExpense(expense);
          set({ isLoading: false });
          return response.data.analysis;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      getSpendingInsights: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.ai.getInsights();
          set({ insights: response.data.insights, isLoading: false });
          return response.data.insights;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          // Return mock data for demo
          const mockInsights = {
            patterns: [
              {
                title: "High Coffee Shop Spending",
                description: "You spend 23% more on coffee than average users. Consider brewing at home to save $45/month.",
                amount: 127.50
              },
              {
                title: "Weekend Dining Trend",
                description: "Your dining expenses are 40% higher on weekends. Budget planning recommended.",
                amount: 89.20
              }
            ]
          };
          set({ insights: mockInsights, isLoading: false });
          return mockInsights;
        }
      },

      getBudgetRecommendations: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.ai.getBudgetRecommendations();
          set({ budgetRecommendations: response.data.recommendations, isLoading: false });
          return response.data.recommendations;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          // Return mock data for demo
          const mockRecommendations = {
            suggestions: [
              {
                category: "Food & Dining",
                recommendation: "Reduce dining out by 20% to save $80/month",
                current: 400,
                suggested: 320
              },
              {
                category: "Entertainment",
                recommendation: "Set a monthly limit of $150 for entertainment expenses",
                current: 220,
                suggested: 150
              }
            ]
          };
          set({ budgetRecommendations: mockRecommendations, isLoading: false });
          return mockRecommendations;
        }
      },

      analyzeSavingOpportunities: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.ai.getSavingsOpportunities();
          set({ savingsOpportunities: response.data.opportunities, isLoading: false });
          return response.data.opportunities;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          // Return mock data for demo
          const mockOpportunities = {
            opportunities: [
              {
                title: "Subscription Optimization",
                description: "Cancel unused streaming services to reduce monthly expenses",
                potential_savings: 35.99,
                frequency: "month"
              },
              {
                title: "Grocery Savings",
                description: "Shopping at discount stores could save money on weekly groceries",
                potential_savings: 25.00,
                frequency: "week"
              }
            ]
          };
          set({ savingsOpportunities: mockOpportunities, isLoading: false });
          return mockOpportunities;
        }
      },

      predictNextMonthSpending: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.ai.getInsights(); // Using insights endpoint for now
          const prediction = response.data.prediction || {
            predicted_amount: 1250.00,
            confidence: 85,
            explanation: "Based on your recent spending patterns and historical data."
          };
          set({ isLoading: false });
          return prediction;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          // Return mock data for demo
          const mockPrediction = {
            predicted_amount: 1250.00,
            confidence: 85,
            explanation: "Based on your recent spending patterns and historical data."
          };
          return mockPrediction;
        }
      },

      categorizExpense: async (description, amount) => {
        try {
          const response = await api.ai.categorize(description, amount);
          return response.data.suggestion;
        } catch (error) {
          console.error('Categorization failed:', error);
          return null;
        }
      },

      analyzeReceipt: async (receiptText) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.ai.analyzeReceipt(receiptText);
          set({ isLoading: false });
          return response.data.extractedData;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      fetchHealthScore: async () => {
        try {
          const response = await api.ai.getHealthScore();
          set({ healthScore: response.data.score });
          return response;
        } catch (error) {
          console.error('Health score fetch failed:', error);
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'ai-store' }
  )
);

// UI store for global app state
export const useUIStore = create(
  devtools(
    (set) => ({
      theme: 'light',
      sidebarOpen: false,
      activeModal: null,
      notifications: [],

      // Actions
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActiveModal: (modal) => set({ activeModal: modal }),
      
      addNotification: (notification) => {
        const id = Date.now();
        set((state) => ({
          notifications: [...state.notifications, { ...notification, id }],
        }));
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }));
        }, 5000);
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },
    }),
    { name: 'ui-store' }
  )
);

export { api };
