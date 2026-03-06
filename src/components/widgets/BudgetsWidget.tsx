// src/components/BudgetsWidget.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBudgets } from '../../contexts/BudgetContext';
import { useSettings } from '../../contexts/SettingsContext';

export default function BudgetsWidget() {
  const navigation = useNavigation<any>();
  const { budgets, getAllBudgetsProgress } = useBudgets();
  const { currency } = useSettings();

  if (budgets.length === 0) return null;

  const budgetsProgress = getAllBudgetsProgress();

  // Over-budget alerts sorted by overage amount
  const overBudgetGoals = budgetsProgress
    .filter(({ percentage }) => percentage > 100)
    .sort((a, b) => b.spent - b.budget.targetAmount - (a.spent - a.budget.targetAmount));

  const totalBudget = budgets.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSpent = budgetsProgress.reduce((sum, p) => sum + p.spent, 0);

  return (
    <View className="px-6 pt-4 pb-2">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-textPrimary text-lg font-semibold">📊 Budgets</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Hub')}>
          <Text className="text-primary font-medium text-sm">View All →</Text>
        </TouchableOpacity>
      </View>

      <View
        className="bg-card rounded-2xl overflow-hidden"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 3,
        }}
      >
        {/* Summary */}
        <View className="p-4 border-b border-border">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wide">
              This Month
            </Text>
            <Text className="text-textSecondary text-xs">
              {budgetsProgress.filter(p => p.percentage > 100).length} over budget
            </Text>
          </View>
          <View className="flex-row justify-between items-baseline mb-3">
            <Text className="text-textPrimary font-bold text-base">
              {currency.symbol}
              {totalSpent.toFixed(0)}
            </Text>
            <Text className="text-textSecondary text-sm">
              of {currency.symbol}
              {totalBudget.toFixed(0)} budgeted
            </Text>
          </View>
          <View className="h-2 bg-border rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min((totalSpent / Math.max(totalBudget, 1)) * 100, 100)}%`,
                backgroundColor: totalSpent > totalBudget ? '#EF4444' : '#8B5CF6',
              }}
            />
          </View>
        </View>

        {/* Over-budget alerts */}
        {overBudgetGoals.length > 0 ? (
          <View className="p-4">
            {overBudgetGoals.slice(0, 2).map(({ budget, spent }) => (
              <View
                key={budget.id}
                className="bg-expense/10 p-3 rounded-xl mb-2 flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-xl mr-2">⚠️</Text>
                  <View className="flex-1">
                    <Text className="text-textPrimary font-medium text-sm">{budget.name}</Text>
                    <Text className="text-expense text-xs">
                      {currency.symbol}
                      {(spent - budget.targetAmount).toFixed(0)} over
                    </Text>
                  </View>
                </View>
                <Text className="text-expense font-semibold text-xs">
                  {currency.symbol}
                  {spent.toFixed(0)}/{currency.symbol}
                  {budget.targetAmount.toFixed(0)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View className="p-4 items-center">
            <Text className="text-textSecondary text-sm">All budgets on track ✓</Text>
          </View>
        )}
      </View>
    </View>
  );
}
