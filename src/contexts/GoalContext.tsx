// contexts/GoalContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal } from '../types';

interface GoalContextType {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  isLoading: boolean;
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

export function GoalProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const STORAGE_KEY = '@expensense_goals';

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);

      if (savedData) {
        const parsed = JSON.parse(savedData);
        setGoals(parsed);
        console.log('✅ Loaded goals:', parsed.length);
      } else {
        console.log('📝 No saved goals found');
      }
    } catch (error) {
      console.error('❌ Error loading goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGoals = async (newGoals: Goal[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newGoals));
      console.log('💾 Saved goals:', newGoals.length);
    } catch (error) {
      console.error('❌ Error saving goals:', error);
    }
  };

  const addGoal = async (goalData: Omit<Goal, 'id' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updatedGoals = [newGoal, ...goals];
    setGoals(updatedGoals);
    await saveGoals(updatedGoals);
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    const updatedGoals = goals.map(g => (g.id === id ? { ...g, ...updates } : g));
    setGoals(updatedGoals);
    await saveGoals(updatedGoals);
  };

  const deleteGoal = async (id: string) => {
    const updatedGoals = goals.filter(g => g.id !== id);
    setGoals(updatedGoals);
    await saveGoals(updatedGoals);
  };

  const value = {
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    isLoading,
  };

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>;
}

export function useGoals() {
  const context = useContext(GoalContext);

  if (!context) {
    throw new Error('useGoals must be used within GoalProvider');
  }

  return context;
}
