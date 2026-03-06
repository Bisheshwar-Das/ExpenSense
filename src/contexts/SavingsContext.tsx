// src/contexts/SavingsContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal } from '../types';
import { useTransactions } from './TransactionContext';
import { useWallets } from './WalletContext';

interface SavingsContextType {
  savingsGoals: Goal[];
  addSavingsGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<Goal>;
  updateSavingsGoal: (
    id: string,
    updates: Partial<Omit<Goal, 'id' | 'createdAt'>>
  ) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  isLoading: boolean;
  // Helpers
  getSavingsGoalById: (id: string) => Goal | undefined;
  getSavingsProgress: (goalId: string) => {
    saved: number;
    target: number;
    percentage: number;
    remaining: number;
    daysLeft: number | null;
  };
  getAllSavingsProgress: () => Array<{
    goal: Goal;
    saved: number;
    percentage: number;
    remaining: number;
    daysLeft: number | null;
  }>;
}

const SavingsContext = createContext<SavingsContextType | undefined>(undefined);

const STORAGE_KEY = '@expensense_savings_goals';

export function SavingsProvider({ children }: { children: React.ReactNode }) {
  const [savingsGoals, setSavingsGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { transactions } = useTransactions();
  const { wallets } = useWallets();

  useEffect(() => {
    loadSavingsGoals();
  }, []);

  const loadSavingsGoals = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);

      if (savedData) {
        const parsed = JSON.parse(savedData);
        setSavingsGoals(parsed);
        console.log('✅ Loaded savings goals:', parsed.length);
      } else {
        console.log('📝 No saved savings goals found');
      }
    } catch (error) {
      console.error('❌ Error loading savings goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSavingsGoals = async (newGoals: Goal[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newGoals));
      console.log('💾 Saved savings goals:', newGoals.length);
    } catch (error) {
      console.error('❌ Error saving savings goals:', error);
      throw error;
    }
  };

  const addSavingsGoal = async (goalData: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal> => {
    const newGoal: Goal = {
      ...goalData,
      type: 'savings',
      id: `savings_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updatedGoals = [newGoal, ...savingsGoals];
    setSavingsGoals(updatedGoals);
    await saveSavingsGoals(updatedGoals);
    return newGoal;
  };

  const updateSavingsGoal = async (
    id: string,
    updates: Partial<Omit<Goal, 'id' | 'createdAt'>>
  ) => {
    const updatedGoals = savingsGoals.map(g => (g.id === id ? { ...g, ...updates } : g));
    setSavingsGoals(updatedGoals);
    await saveSavingsGoals(updatedGoals);
  };

  const deleteSavingsGoal = async (id: string) => {
    const updatedGoals = savingsGoals.filter(g => g.id !== id);
    setSavingsGoals(updatedGoals);
    await saveSavingsGoals(updatedGoals);
  };

  // ─── Helper Methods ──────────────────────────────────────────────────────

  const getSavingsGoalById = (id: string): Goal | undefined => {
    return savingsGoals.find(g => g.id === id);
  };

  const getSavingsProgress = (goalId: string) => {
    const goal = getSavingsGoalById(goalId);
    if (!goal || !goal.walletId) {
      return {
        saved: 0,
        target: goal?.targetAmount || 0,
        percentage: 0,
        remaining: 0,
        daysLeft: null,
      };
    }

    // Calculate saved amount from wallet (income transfers to goal)
    const saved = transactions
      .filter(t => t.toGoalId === goal.id)
      .reduce((sum, t) => sum + t.amount, 0);

    const percentage = (saved / goal.targetAmount) * 100;
    const remaining = Math.max(0, goal.targetAmount - saved);

    // Calculate days remaining
    let daysLeft: number | null = null;
    if (goal.deadline) {
      const today = new Date();
      const deadline = new Date(goal.deadline);
      const diffTime = deadline.getTime() - today.getTime();
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      saved,
      target: goal.targetAmount,
      percentage: Math.min(100, percentage),
      remaining,
      daysLeft,
    };
  };

  const getAllSavingsProgress = () => {
    return savingsGoals.map(goal => {
      const progress = getSavingsProgress(goal.id);
      return {
        goal,
        saved: progress.saved,
        percentage: progress.percentage,
        remaining: progress.remaining,
        daysLeft: progress.daysLeft,
      };
    });
  };

  const value = {
    savingsGoals,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    isLoading,
    getSavingsGoalById,
    getSavingsProgress,
    getAllSavingsProgress,
  };

  return <SavingsContext.Provider value={value}>{children}</SavingsContext.Provider>;
}

export function useSavings() {
  const context = useContext(SavingsContext);

  if (!context) {
    throw new Error('useSavings must be used within SavingsProvider');
  }

  return context;
}
