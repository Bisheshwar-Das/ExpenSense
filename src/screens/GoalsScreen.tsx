// screens/GoalsScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useGoals } from '../contexts/GoalContext';
import { useTransactions } from '../contexts/TransactionContext';
import { useSettings } from '../contexts/SettingsContext';
import { Goal } from '../types';
import GoalModal from '../components/GoalModal';
import { RootNavigationProp } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '@/components/AppHeader';

export default function GoalsScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const { goals, deleteGoal } = useGoals();
  const { transactions } = useTransactions();
  const { currency } = useSettings();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedTab, setSelectedTab] = useState<'savings' | 'budget'>('savings');

  type SavingsSort = 'urgency' | 'progress' | 'amount';
  type BudgetSort = 'overspend' | 'amount' | 'name';
  const [savingsSort, setSavingsSort] = useState<SavingsSort>('urgency');
  const [budgetSort, setBudgetSort] = useState<BudgetSort>('overspend');
  const [sortAsc, setSortAsc] = useState(false);

  const savingsGoals = goals.filter(g => g.type === 'savings');
  const budgetGoals = goals.filter(g => g.type === 'budget');

  // Derive savings progress purely from transfer transactions
  const getSavingsProgress = (goalId: string) => {
    return transactions
      .filter(t => t.type === 'transfer' && t.toGoalId === goalId)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getSavingsRecommendation = (goal: Goal) => {
    if (!goal.deadline || goal.type !== 'savings') return null;

    const now = new Date();
    const deadline = new Date(goal.deadline);
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const weeksLeft = Math.ceil(daysLeft / 7);
    const currentAmount = getSavingsProgress(goal.id);
    const remaining = goal.targetAmount - currentAmount;

    if (daysLeft <= 0 || remaining <= 0) return null;

    const weeklyTarget = remaining / Math.max(weeksLeft, 1);

    return {
      weeklyTarget,
      monthlyTarget: weeklyTarget * 4.33,
      daysRemaining: daysLeft,
      weeksRemaining: weeksLeft,
      isUrgent: daysLeft < 30,
      isVeryUrgent: daysLeft < 14,
    };
  };

  const getTotalSavingsNeeded = () => {
    const activeGoals = savingsGoals.filter(g => {
      const current = getSavingsProgress(g.id);
      return g.targetAmount - current > 0 && g.deadline;
    });

    const totalWeekly = activeGoals.reduce((sum, g) => {
      const rec = getSavingsRecommendation(g);
      return sum + (rec?.weeklyTarget || 0);
    }, 0);

    const totalSaved = savingsGoals.reduce((sum, g) => sum + getSavingsProgress(g.id), 0);
    const totalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalRemaining = activeGoals.reduce(
      (sum, g) => sum + (g.targetAmount - getSavingsProgress(g.id)),
      0
    );

    return {
      weeklyTarget: totalWeekly,
      monthlyTarget: totalWeekly * 4.33,
      totalRemaining,
      totalSaved,
      totalTarget,
      goalCount: activeGoals.length,
    };
  };

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

  const handleAddGoal = () => {
    setEditingGoal(null);
    setModalVisible(true);
  };
  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setModalVisible(true);
  };
  const handleDeleteGoal = (goal: Goal) => {
    Alert.alert('Delete Goal', `Are you sure you want to delete "${goal.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(goal.id) },
    ]);
  };

  // Urgency config
  const getUrgencyConfig = (rec: NonNullable<ReturnType<typeof getSavingsRecommendation>>) => {
    if (rec.isVeryUrgent)
      return {
        color: '#EF4444',
        bg: 'bg-expense/5',
        label: '🔴 Urgent',
        textColor: 'text-expense',
      };
    if (rec.isUrgent)
      return {
        color: '#F59E0B',
        bg: 'bg-amber-500/5',
        label: '🟡 On track',
        textColor: 'text-amber-600',
      };
    return {
      color: '#10B981',
      bg: 'bg-income/5',
      label: '🟢 Plenty of time',
      textColor: 'text-income',
    };
  };

  const renderSavingsGoal = (goal: Goal) => {
    const currentAmount = getSavingsProgress(goal.id);
    const progress = (currentAmount / goal.targetAmount) * 100;
    const remaining = goal.targetAmount - currentAmount;
    const recommendation = getSavingsRecommendation(goal);
    const urgency = recommendation ? getUrgencyConfig(recommendation) : null;

    return (
      <TouchableOpacity
        key={goal.id}
        onPress={() => handleEditGoal(goal)}
        onLongPress={() => handleDeleteGoal(goal)}
        className="bg-card rounded-2xl mb-3 overflow-hidden border border-border"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <View className="p-5">
          {/* Header row */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1">
              <View
                className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: goal.color + '20' }}
              >
                <Text className="text-2xl">{goal.icon}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-textPrimary font-semibold text-base">{goal.name}</Text>
                {goal.deadline && (
                  <Text className="text-textSecondary text-xs">
                    Deadline:{' '}
                    {new Date(goal.deadline).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                )}
              </View>
            </View>
            {urgency && (
              <View className="ml-2">
                <Text className="text-xs font-semibold">{urgency.label}</Text>
              </View>
            )}
          </View>

          {/* Progress bar */}
          <View className="h-2 bg-border rounded-full overflow-hidden mb-3">
            <View
              className="h-full rounded-full"
              style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: goal.color }}
            />
          </View>

          {/* Amount row */}
          <View className="flex-row justify-between items-center">
            <Text className="text-textSecondary text-sm">
              {currency.symbol}
              {currentAmount.toFixed(2)} / {currency.symbol}
              {goal.targetAmount.toFixed(2)}
            </Text>
            <Text className="text-textSecondary text-sm font-medium">{progress.toFixed(0)}%</Text>
          </View>
        </View>

        {/* Recommendation footer */}
        {recommendation && urgency && (
          <View className={`${urgency.bg} border-t border-border px-5 py-4`}>
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-textSecondary text-xs mb-1">Save per week</Text>
                <Text className={`font-bold text-lg ${urgency.textColor}`}>
                  {currency.symbol}
                  {recommendation.weeklyTarget.toFixed(0)}
                </Text>
                <Text className="text-textSecondary text-xs">
                  or {currency.symbol}
                  {recommendation.monthlyTarget.toFixed(0)}/month
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-textSecondary text-xs mb-1">Time left</Text>
                <Text className="text-textPrimary font-semibold text-base">
                  {recommendation.weeksRemaining}w
                </Text>
                <Text className="text-textSecondary text-xs">
                  {currency.symbol}
                  {remaining.toFixed(0)} to go
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Completed state */}
        {progress >= 100 && (
          <View className="bg-income/10 border-t border-border px-5 py-3">
            <Text className="text-income font-semibold text-center">🎉 Goal reached!</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderBudgetGoal = (goal: Goal) => {
    const spent = getBudgetSpending(goal.category || '', goal.period);
    const remaining = goal.targetAmount - spent;
    const progress = (spent / goal.targetAmount) * 100;
    const isOverBudget = spent > goal.targetAmount;

    return (
      <TouchableOpacity
        key={goal.id}
        onPress={() => handleEditGoal(goal)}
        onLongPress={() => handleDeleteGoal(goal)}
        className="bg-card p-5 rounded-2xl mb-3 border border-border"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <View
              className="w-12 h-12 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: goal.color + '20' }}
            >
              <Text className="text-2xl">{goal.icon}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-textPrimary font-semibold text-base">{goal.category}</Text>
              <Text className="text-textSecondary text-xs capitalize">{goal.period} budget</Text>
            </View>
          </View>
          {isOverBudget && (
            <View className="bg-expense/10 px-3 py-1 rounded-full">
              <Text className="text-expense text-xs font-semibold">Over Budget!</Text>
            </View>
          )}
        </View>

        <View className="h-2 bg-border rounded-full overflow-hidden mb-3">
          <View
            className="h-full rounded-full"
            style={{
              width: `${Math.min(progress, 100)}%`,
              backgroundColor: isOverBudget ? '#EF4444' : goal.color,
            }}
          />
        </View>

        <View className="flex-row justify-between items-center">
          <Text className="text-textSecondary text-sm">
            Spent {currency.symbol}
            {spent.toFixed(2)} / {currency.symbol}
            {goal.targetAmount.toFixed(2)}
          </Text>
          <Text className={`text-sm font-medium ${isOverBudget ? 'text-expense' : 'text-income'}`}>
            {isOverBudget ? '-' : ''}
            {currency.symbol}
            {Math.abs(remaining).toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSavingsSummary = () => {
    const summary = getTotalSavingsNeeded();
    if (savingsGoals.length === 0) return null;

    return (
      <View className="px-6 pt-6">
        <View
          className="bg-card rounded-2xl mb-4 overflow-hidden border border-border"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          {/* Summary header */}
          <View className="bg-primary/5 border-b border-border px-5 py-4">
            <View className="flex-row items-center mb-3">
              <Text className="text-2xl mr-2">🎯</Text>
              <Text className="text-textPrimary font-bold text-lg">All Goals Summary</Text>
            </View>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-textSecondary text-xs mb-1">Total Target</Text>
                <Text className="text-textPrimary font-semibold text-base">
                  {currency.symbol}
                  {summary.totalTarget.toFixed(0)}
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-textSecondary text-xs mb-1">Already Saved</Text>
                <Text className="text-income font-semibold text-base">
                  {currency.symbol}
                  {summary.totalSaved.toFixed(0)}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-textSecondary text-xs mb-1">Still Need</Text>
                <Text className="text-expense font-semibold text-base">
                  {currency.symbol}
                  {summary.totalRemaining.toFixed(0)}
                </Text>
              </View>
            </View>
          </View>

          {/* Recommended savings */}
          {summary.goalCount > 0 && (
            <View className="px-5 py-4 border-b border-border">
              <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wide mb-3">
                💡 Recommended Savings
              </Text>
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-textPrimary text-2xl font-bold">
                    {currency.symbol}
                    {summary.weeklyTarget.toFixed(0)}
                    <Text className="text-textSecondary text-base font-normal">/week</Text>
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-textSecondary text-sm">
                    or {currency.symbol}
                    {summary.monthlyTarget.toFixed(0)}/month
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Per-goal breakdown */}
          <View className="px-5 py-4">
            <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wide mb-3">
              Breakdown
            </Text>
            {savingsGoals.map(goal => {
              const rec = getSavingsRecommendation(goal);
              const current = getSavingsProgress(goal.id);
              const urgency = rec ? getUrgencyConfig(rec) : null;
              const isComplete = current >= goal.targetAmount;

              return (
                <View key={goal.id} className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center flex-1">
                    <Text className="text-lg mr-2">{goal.icon}</Text>
                    <Text className="text-textPrimary text-sm font-medium flex-1" numberOfLines={1}>
                      {goal.name}
                    </Text>
                  </View>
                  <View className="items-end ml-3">
                    {isComplete ? (
                      <Text className="text-income text-xs font-semibold">🎉 Done</Text>
                    ) : rec ? (
                      <>
                        <Text className={`text-sm font-bold ${urgency?.textColor}`}>
                          {currency.symbol}
                          {rec.weeklyTarget.toFixed(0)}/week
                        </Text>
                        <Text className="text-textSecondary text-xs">{urgency?.label}</Text>
                      </>
                    ) : (
                      <Text className="text-textSecondary text-xs">No deadline</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <ScrollView className="flex-1 bg-background">
        <AppHeader icon="🎯" title="Goals" subtitle="Track savings & budgets">
          <View className="bg-white/15 p-2 rounded-2xl flex-row gap-2">
            <TouchableOpacity
              onPress={() => setSelectedTab('savings')}
              className={`flex-1 py-3 rounded-xl ${selectedTab === 'savings' ? 'bg-white' : 'bg-transparent'}`}
            >
              <Text
                className={`text-center font-semibold ${selectedTab === 'savings' ? 'text-primary' : 'text-white'}`}
              >
                Savings ({savingsGoals.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedTab('budget')}
              className={`flex-1 py-3 rounded-xl ${selectedTab === 'budget' ? 'bg-white' : 'bg-transparent'}`}
            >
              <Text
                className={`text-center font-semibold ${selectedTab === 'budget' ? 'text-primary' : 'text-white'}`}
              >
                Budgets ({budgetGoals.length})
              </Text>
            </TouchableOpacity>
          </View>
        </AppHeader>

        {/* Summary — savings tab only */}
        {selectedTab === 'savings' && renderSavingsSummary()}

        <View className="px-6 pb-6">
          {/* Inline add row */}
          <TouchableOpacity
            onPress={handleAddGoal}
            className="flex-row items-center bg-card rounded-2xl px-4 py-3 mb-4 mt-4 border border-dashed border-primary"
          >
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
              <Text className="text-primary text-xl font-bold">＋</Text>
            </View>
            <Text className="text-primary font-semibold text-base">
              Add {selectedTab === 'savings' ? 'Savings Goal' : 'Budget'}
            </Text>
          </TouchableOpacity>

          {/* List header + sort pills + direction arrow */}
          {((selectedTab === 'savings' && savingsGoals.length > 0) ||
            (selectedTab === 'budget' && budgetGoals.length > 0)) && (
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-textPrimary font-semibold text-base">
                {selectedTab === 'savings' ? 'Savings Goals' : 'Budgets'}
              </Text>
              <View className="flex-row items-center gap-2">
                {/* Sort pills */}
                {(selectedTab === 'savings'
                  ? ([
                      { key: 'urgency', label: 'Urgency' },
                      { key: 'progress', label: 'Progress' },
                      { key: 'amount', label: 'Amount' },
                    ] as { key: SavingsSort; label: string }[])
                  : ([
                      { key: 'overspend', label: 'Overspend' },
                      { key: 'amount', label: 'Amount' },
                      { key: 'name', label: 'Name' },
                    ] as { key: BudgetSort; label: string }[])
                ).map(opt => {
                  const isActive =
                    selectedTab === 'savings'
                      ? savingsSort === opt.key
                      : budgetSort === (opt.key as BudgetSort);
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => {
                        if (selectedTab === 'savings') setSavingsSort(opt.key as SavingsSort);
                        else setBudgetSort(opt.key as BudgetSort);
                      }}
                      className={`px-2 py-1 rounded-full ${isActive ? 'bg-primary' : 'bg-border'}`}
                    >
                      <Text
                        className={`text-xs font-medium ${isActive ? 'text-white' : 'text-textSecondary'}`}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {/* Direction toggle */}
                <TouchableOpacity
                  onPress={() => setSortAsc(v => !v)}
                  className="w-7 h-7 rounded-full bg-border items-center justify-center"
                >
                  <Text className="text-textSecondary text-xs">{sortAsc ? '↑' : '↓'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Goals list */}
          {selectedTab === 'savings' ? (
            savingsGoals.length === 0 ? (
              <View className="bg-card p-8 rounded-xl items-center border border-border">
                <Text className="text-4xl mb-3">💰</Text>
                <Text className="text-textPrimary font-medium text-base mb-1">
                  No savings goals yet
                </Text>
                <Text className="text-textSecondary text-sm text-center">
                  Tap above to set your first goal
                </Text>
              </View>
            ) : (
              [...savingsGoals]
                .sort((a, b) => {
                  const aProgress = getSavingsProgress(a.id);
                  const bProgress = getSavingsProgress(b.id);
                  const aComplete = aProgress >= a.targetAmount;
                  const bComplete = bProgress >= b.targetAmount;
                  // Completed always sink to bottom regardless of sort
                  if (aComplete && !bComplete) return 1;
                  if (!aComplete && bComplete) return -1;

                  let result = 0;
                  if (savingsSort === 'urgency') {
                    if (!a.deadline && !b.deadline) result = 0;
                    else if (!a.deadline) result = 1;
                    else if (!b.deadline) result = -1;
                    else result = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                  } else if (savingsSort === 'progress') {
                    const aPct = aProgress / a.targetAmount;
                    const bPct = bProgress / b.targetAmount;
                    result = aPct - bPct;
                  } else if (savingsSort === 'amount') {
                    result = a.targetAmount - b.targetAmount;
                  }
                  return sortAsc ? result : -result;
                })
                .map(renderSavingsGoal)
            )
          ) : budgetGoals.length === 0 ? (
            <View className="bg-card p-8 rounded-xl items-center border border-border">
              <Text className="text-4xl mb-3">📊</Text>
              <Text className="text-textPrimary font-medium text-base mb-1">No budgets set</Text>
              <Text className="text-textSecondary text-sm text-center">
                Tap above to create your first budget
              </Text>
            </View>
          ) : (
            [...budgetGoals]
              .sort((a, b) => {
                const aSpent = getBudgetSpending(a.category || '', a.period);
                const bSpent = getBudgetSpending(b.category || '', b.period);
                let result = 0;
                if (budgetSort === 'overspend') {
                  result = bSpent / b.targetAmount - aSpent / a.targetAmount;
                } else if (budgetSort === 'amount') {
                  result = a.targetAmount - b.targetAmount;
                } else if (budgetSort === 'name') {
                  result = (a.category || '').localeCompare(b.category || '');
                }
                return sortAsc ? -result : result;
              })
              .map(renderBudgetGoal)
          )}
        </View>
      </ScrollView>

      <GoalModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        editGoal={editingGoal}
        defaultType={selectedTab}
      />
    </>
  );
}
