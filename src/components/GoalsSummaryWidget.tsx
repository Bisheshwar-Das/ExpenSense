// components/GoalsSummaryWidget.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGoals } from '../contexts/GoalContext';
import { useTransactions } from '../contexts/TransactionContext';
import { useSettings } from '../contexts/SettingsContext';
import { TabNavigationProp } from '../navigation/types';

export default function GoalsSummaryWidget() {
  const navigation = useNavigation<TabNavigationProp>();
  const { goals } = useGoals();
  const { transactions } = useTransactions();
  const { currency } = useSettings();

  if (goals.length === 0) return null;

  // Derive savings progress from transfers
  const getSavingsProgress = (goalId: string) =>
    transactions
      .filter(t => t.type === 'transfer' && t.toGoalId === goalId)
      .reduce((sum, t) => sum + t.amount, 0);

  // Budget spending for current month respecting period
  const getBudgetSpending = (category: string, period?: string) => {
    const now = new Date();
    let startDate: Date;
    if (period === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return transactions
      .filter(t => t.type === 'expense' && t.category === category && new Date(t.date) >= startDate)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const savingsGoals = goals.filter(g => g.type === 'savings');
  const budgetGoals = goals.filter(g => g.type === 'budget');

  // Combined savings totals
  const totalSaved = savingsGoals.reduce((sum, g) => sum + getSavingsProgress(g.id), 0);
  const totalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  // Over-budget alerts
  const overBudgetGoals = budgetGoals
    .map(goal => ({ goal, spent: getBudgetSpending(goal.category || '', goal.period) }))
    .filter(({ goal, spent }) => spent > goal.targetAmount)
    .sort((a, b) => b.spent - b.goal.targetAmount - (a.spent - a.goal.targetAmount));

  // Urgency for individual goals
  const getUrgencyColor = (goal: (typeof savingsGoals)[0]) => {
    if (!goal.deadline) return '#64748B';
    const daysLeft = Math.ceil(
      (new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft < 14) return '#EF4444';
    if (daysLeft < 30) return '#F59E0B';
    return '#10B981';
  };

  return (
    <View className="px-6 p-4">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-textPrimary text-lg font-semibold">🎯 Goals Overview</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
          <Text className="text-primary font-medium text-sm">View All →</Text>
        </TouchableOpacity>
      </View>

      <View
        className="bg-card rounded-2xl"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 3,
        }}
      >
        {/* Over-budget alerts */}
        {overBudgetGoals.length > 0 && (
          <View className="p-4 border-b border-border">
            {overBudgetGoals.slice(0, 2).map(({ goal, spent }) => (
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
                      {currency.symbol}
                      {(spent - goal.targetAmount).toFixed(0)} over budget
                    </Text>
                  </View>
                </View>
                <Text className="text-expense font-semibold text-sm">
                  {currency.symbol}
                  {spent.toFixed(0)}/{currency.symbol}
                  {goal.targetAmount.toFixed(0)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Combined savings summary */}
        {savingsGoals.length > 0 && (
          <View className="p-4">
            {/* Total progress */}
            <View className="flex-row justify-between items-baseline mb-2">
              <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wide">
                Savings Progress
              </Text>
              <Text className="text-textSecondary text-xs">
                {overallProgress.toFixed(0)}% of total
              </Text>
            </View>

            <View className="flex-row justify-between items-baseline mb-3">
              <Text className="text-income font-bold text-xl">
                {currency.symbol}
                {totalSaved.toFixed(0)}
              </Text>
              <Text className="text-textSecondary text-sm">
                of {currency.symbol}
                {totalTarget.toFixed(0)} needed
              </Text>
            </View>

            {/* Combined progress bar */}
            <View className="h-2 bg-border rounded-full overflow-hidden mb-4">
              <View
                className="h-full rounded-full bg-income"
                style={{ width: `${Math.min(overallProgress, 100)}%` }}
              />
            </View>

            {/* Individual goal rows */}
            {savingsGoals.map((goal, index) => {
              const saved = getSavingsProgress(goal.id);
              const progress = goal.targetAmount > 0 ? (saved / goal.targetAmount) * 100 : 0;
              const urgencyColor = getUrgencyColor(goal);
              const isComplete = saved >= goal.targetAmount;

              return (
                <View
                  key={goal.id}
                  className={`flex-row items-center ${index < savingsGoals.length - 1 ? 'mb-3' : ''}`}
                >
                  <View
                    className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                    style={{ backgroundColor: goal.color + '20' }}
                  >
                    <Text style={{ fontSize: 14 }}>{goal.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-textPrimary text-sm font-medium" numberOfLines={1}>
                        {goal.name}
                      </Text>
                      <Text className="text-textSecondary text-xs ml-2">
                        {isComplete
                          ? '🎉 Done'
                          : `${currency.symbol}${saved.toFixed(0)}/${currency.symbol}${goal.targetAmount.toFixed(0)}`}
                      </Text>
                    </View>
                    <View className="h-1.5 bg-border rounded-full overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(progress, 100)}%`,
                          backgroundColor: isComplete ? '#10B981' : urgencyColor,
                        }}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* No savings goals but has budgets */}
        {savingsGoals.length === 0 && overBudgetGoals.length === 0 && (
          <View className="p-4 items-center">
            <Text className="text-textSecondary text-sm">
              {budgetGoals.length} budget{budgetGoals.length !== 1 ? 's' : ''} on track ✓
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
