// components/GoalsSummaryWidget.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGoals } from '../contexts/GoalContext';
import { useTransactions } from '../contexts/TransactionContext';
import { TabNavigationProp } from '../navigation/types';

export default function GoalsSummaryWidget() {
  const navigation = useNavigation<TabNavigationProp>();
  const { goals } = useGoals();
  const { transactions } = useTransactions();

  // Calculate budget spending for current month
  const getBudgetSpending = (category: string) => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return transactions
      .filter(t => 
        t.type === 'expense' && 
        t.category === category &&
        new Date(t.date) >= firstDay
      )
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  // Get budget goals
  const budgetGoals = goals.filter(g => g.type === 'budget');
  
  // Find over-budget categories
  const overBudgetGoals = budgetGoals
    .map(goal => ({
      goal,
      spent: getBudgetSpending(goal.category || ''),
    }))
    .filter(({ goal, spent }) => spent > goal.targetAmount)
    .sort((a, b) => (b.spent - b.goal.targetAmount) - (a.spent - a.goal.targetAmount));

  // Get savings goals sorted by progress
  const savingsGoals = goals
    .filter(g => g.type === 'savings')
    .map(goal => ({
      goal,
      progress: ((goal.currentAmount || 0) / goal.targetAmount) * 100,
    }))
    .sort((a, b) => b.progress - a.progress);

  const topSavingsGoal = savingsGoals[0];

  // If no goals, don't show widget
  if (goals.length === 0) {
    return null;
  }

  return (
    <View className="px-6 pb-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-textPrimary text-lg font-semibold">
          🎯 Goals Overview
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
          <Text className="text-primary font-medium text-sm">View All →</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-card rounded-2xl p-4" style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}>
        {/* Over Budget Alerts */}
        {overBudgetGoals.length > 0 && (
          <View className="mb-3">
            {overBudgetGoals.slice(0, 2).map(({ goal, spent }) => {
              const over = spent - goal.targetAmount;
              return (
                <View 
                  key={goal.id}
                  className="bg-expense/10 p-3 rounded-xl mb-2 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1">
                    <Text className="text-xl mr-2">⚠️</Text>
                    <View className="flex-1">
                      <Text className="text-textPrimary font-medium text-sm">
                        {goal.category} Budget
                      </Text>
                      <Text className="text-expense text-xs">
                        ${over.toFixed(0)} over budget
                      </Text>
                    </View>
                  </View>
                  <Text className="text-expense font-semibold">
                    ${spent.toFixed(0)}/${goal.targetAmount.toFixed(0)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Top Savings Goal */}
        {topSavingsGoal && (
          <View className="bg-income/10 p-3 rounded-xl">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center flex-1">
                <View 
                  className="w-8 h-8 rounded-lg items-center justify-center mr-2"
                  style={{ backgroundColor: topSavingsGoal.goal.color + '30' }}
                >
                  <Text className="text-lg">{topSavingsGoal.goal.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-textPrimary font-medium text-sm">
                    {topSavingsGoal.goal.name}
                  </Text>
                  <Text className="text-textSecondary text-xs">
                    {topSavingsGoal.progress.toFixed(0)}% saved
                  </Text>
                </View>
              </View>
              <Text className="text-income font-semibold text-sm">
                ${(topSavingsGoal.goal.currentAmount || 0).toFixed(0)}/${topSavingsGoal.goal.targetAmount.toFixed(0)}
              </Text>
            </View>
            
            {/* Progress Bar */}
            <View className="h-1.5 bg-border rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(topSavingsGoal.progress, 100)}%`,
                  backgroundColor: topSavingsGoal.goal.color,
                }}
              />
            </View>
          </View>
        )}

        {/* Summary Stats */}
        {overBudgetGoals.length === 0 && !topSavingsGoal && (
          <View className="items-center py-2">
            <Text className="text-textSecondary text-sm">
              {budgetGoals.length} budget{budgetGoals.length !== 1 ? 's' : ''}, {savingsGoals.length} savings goal{savingsGoals.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}