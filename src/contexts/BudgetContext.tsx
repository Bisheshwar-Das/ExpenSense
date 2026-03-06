// src/contexts/BudgetContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal } from '../types';
import { useTransactions } from './TransactionContext';

interface BudgetContextType {
  budgets: Goal[];
  addBudget: (budget: Omit<Goal, 'id' | 'createdAt'>) => Promise<Goal>;
  updateBudget: (id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  isLoading: boolean;
  // Helpers
  getBudgetById: (id: string) => Goal | undefined;
  getBudgetProgress: (budgetId: string) => {
    spent: number;
    target: number;
    percentage: number;
    remaining: number;
  };
  getAllBudgetsProgress: () => Array<{
    budget: Goal;
    spent: number;
    percentage: number;
    remaining: number;
  }>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

const STORAGE_KEY = '@expensense_budgets';

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [budgets, setBudgets] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { transactions } = useTransactions();

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);

      if (savedData) {
        const parsed = JSON.parse(savedData);
        setBudgets(parsed);
        console.log('✅ Loaded budgets:', parsed.length);
      } else {
        console.log('📝 No saved budgets found');
      }
    } catch (error) {
      console.error('❌ Error loading budgets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBudgets = async (newBudgets: Goal[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newBudgets));
      console.log('💾 Saved budgets:', newBudgets.length);
    } catch (error) {
      console.error('❌ Error saving budgets:', error);
      throw error;
    }
  };

  const addBudget = async (budgetData: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal> => {
    const newBudget: Goal = {
      ...budgetData,
      type: 'budget',
      id: `budget_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updatedBudgets = [newBudget, ...budgets];
    setBudgets(updatedBudgets);
    await saveBudgets(updatedBudgets);
    return newBudget;
  };

  const updateBudget = async (id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>) => {
    const updatedBudgets = budgets.map(b => (b.id === id ? { ...b, ...updates } : b));
    setBudgets(updatedBudgets);
    await saveBudgets(updatedBudgets);
  };

  const deleteBudget = async (id: string) => {
    const updatedBudgets = budgets.filter(b => b.id !== id);
    setBudgets(updatedBudgets);
    await saveBudgets(updatedBudgets);
  };

  // ─── Helper Methods ──────────────────────────────────────────────────────

  const getBudgetById = (id: string): Goal | undefined => {
    return budgets.find(b => b.id === id);
  };

  const getBudgetProgress = (budgetId: string) => {
    const budget = getBudgetById(budgetId);
    if (!budget || !budget.categoryId) {
      return { spent: 0, target: budget?.targetAmount || 0, percentage: 0, remaining: 0 };
    }

    // Calculate spent amount for this budget's category
    const spent = transactions
      .filter(t => t.categoryId === budget.categoryId && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const percentage = (spent / budget.targetAmount) * 100;
    const remaining = Math.max(0, budget.targetAmount - spent);

    return {
      spent,
      target: budget.targetAmount,
      percentage: Math.min(100, percentage),
      remaining,
    };
  };

  const getAllBudgetsProgress = () => {
    return budgets.map(budget => {
      const progress = getBudgetProgress(budget.id);
      return {
        budget,
        spent: progress.spent,
        percentage: progress.percentage,
        remaining: progress.remaining,
      };
    });
  };

  const value = {
    budgets,
    addBudget,
    updateBudget,
    deleteBudget,
    isLoading,
    getBudgetById,
    getBudgetProgress,
    getAllBudgetsProgress,
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudgets() {
  const context = useContext(BudgetContext);

  if (!context) {
    throw new Error('useBudgets must be used within BudgetProvider');
  }

  return context;
}
