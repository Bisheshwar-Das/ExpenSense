// screens/SavingsScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useGoals } from '../../contexts/GoalContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Goal } from '../../types';
import GoalModal from '@/components/GoalModal';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '@/components/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SavingsSort = 'urgency' | 'progress' | 'amount';

export default function SavingsScreen() {
  const navigation = useNavigation<any>();
  const { goals, deleteGoal } = useGoals();
  const { transactions } = useTransactions();
  const { currency } = useSettings();
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [sortBy, setSortBy] = useState<SavingsSort>('urgency');
  const [sortAsc, setSortAsc] = useState(false);

  const savingsGoals = goals.filter(g => g.type === 'savings');

  const getSavingsProgress = (goalId: string) =>
    transactions
      .filter(t => t.type === 'transfer' && t.toGoalId === goalId)
      .reduce((sum, t) => sum + t.amount, 0);

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

  const getTotalSavingsNeeded = () => {
    const activeGoals = savingsGoals.filter(g => {
      const current = getSavingsProgress(g.id);
      return g.targetAmount - current > 0 && g.deadline;
    });
    const totalWeekly = activeGoals.reduce(
      (sum, g) => sum + (getSavingsRecommendation(g)?.weeklyTarget || 0),
      0
    );
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

  const handleAddGoal = () => {
    setEditingGoal(null);
    setModalVisible(true);
  };
  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setModalVisible(true);
  };
  const handleDeleteGoal = (goal: Goal) => {
    Alert.alert('Delete Goal', `Delete "${goal.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(goal.id) },
    ]);
  };

  const summary = getTotalSavingsNeeded();

  const sortedGoals = [...savingsGoals].sort((a, b) => {
    const aProgress = getSavingsProgress(a.id);
    const bProgress = getSavingsProgress(b.id);
    const aComplete = aProgress >= a.targetAmount;
    const bComplete = bProgress >= b.targetAmount;
    if (aComplete && !bComplete) return 1;
    if (!aComplete && bComplete) return -1;
    let result = 0;
    if (sortBy === 'urgency') {
      if (!a.deadline && !b.deadline) result = 0;
      else if (!a.deadline) result = 1;
      else if (!b.deadline) result = -1;
      else result = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    } else if (sortBy === 'progress') {
      result = aProgress / a.targetAmount - bProgress / b.targetAmount;
    } else if (sortBy === 'amount') {
      result = a.targetAmount - b.targetAmount;
    }
    return sortAsc ? result : -result;
  });

  return (
    <>
      <ScrollView className="flex-1 bg-background">
        <AppHeader
          title="Savings Goals"
          subtitle={`${savingsGoals.length} ${savingsGoals.length === 1 ? 'goal' : 'goals'}`}
          onBack={() => navigation.goBack()}
          onEdit={handleAddGoal}
          editLabel="+ Add"
          hideMenu
          backgroundColor="#22C55E"
        />

        <View className="px-4 pb-8">
          {/* Summary card */}
          {savingsGoals.length > 0 && (
            <View
              className="bg-card rounded-2xl mt-4 mb-4 overflow-hidden"
              style={{
                shadowColor: '#22C55E',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View className="px-4 pt-4 pb-3">
                <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-3">
                  Overall Progress
                </Text>
                <View className="flex-row justify-between mb-3">
                  <View>
                    <Text className="text-textSecondary text-xs mb-0.5">Target</Text>
                    <Text className="text-textPrimary font-bold text-base">
                      {currency.symbol}
                      {summary.totalTarget.toFixed(0)}
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-textSecondary text-xs mb-0.5">Saved</Text>
                    <Text className="text-income font-bold text-base">
                      {currency.symbol}
                      {summary.totalSaved.toFixed(0)}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-textSecondary text-xs mb-0.5">Remaining</Text>
                    <Text className="text-expense font-bold text-base">
                      {currency.symbol}
                      {summary.totalRemaining.toFixed(0)}
                    </Text>
                  </View>
                </View>
                {/* Overall progress bar */}
                <View className="h-2 bg-border rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full bg-income"
                    style={{
                      width: `${Math.min((summary.totalSaved / Math.max(summary.totalTarget, 1)) * 100, 100)}%`,
                    }}
                  />
                </View>
              </View>
              {summary.goalCount > 0 && (
                <View className="border-t border-border px-4 py-3 flex-row justify-between items-center">
                  <Text className="text-textSecondary text-xs">💡 Recommended to save</Text>
                  <Text className="text-income font-bold text-sm">
                    {currency.symbol}
                    {summary.weeklyTarget.toFixed(0)}/week
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Sort controls */}
          {savingsGoals.length > 0 && (
            <View className="flex-row items-center gap-2 mb-3">
              <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wider flex-1">
                Goals
              </Text>
              {(
                [
                  { key: 'urgency', label: 'Urgency' },
                  { key: 'progress', label: 'Progress' },
                  { key: 'amount', label: 'Amount' },
                ] as { key: SavingsSort; label: string }[]
              ).map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setSortBy(opt.key)}
                  className={`px-2.5 py-1 rounded-full ${sortBy === opt.key ? 'bg-income' : 'bg-border'}`}
                >
                  <Text
                    className={`text-xs font-medium ${sortBy === opt.key ? 'text-white' : 'text-textSecondary'}`}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setSortAsc(v => !v)}
                className="w-7 h-7 rounded-full bg-border items-center justify-center"
              >
                <Ionicons name={sortAsc ? 'arrow-up' : 'arrow-down'} size={13} color="#64748B" />
              </TouchableOpacity>
            </View>
          )}

          {/* Goals list */}
          {savingsGoals.length === 0 ? (
            <View
              className="bg-card rounded-2xl p-8 items-center mt-4"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <Text style={{ fontSize: 36, marginBottom: 12 }}>💰</Text>
              <Text className="text-textPrimary font-semibold text-base mb-1">
                No savings goals yet
              </Text>
              <Text className="text-textSecondary text-sm text-center mb-4">
                Set a target and track your progress
              </Text>
              <TouchableOpacity onPress={handleAddGoal} className="bg-income rounded-2xl px-6 py-3">
                <Text className="text-white font-semibold">Create First Goal</Text>
              </TouchableOpacity>
            </View>
          ) : (
            sortedGoals.map(goal => {
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
                  className="bg-card rounded-2xl mb-3 overflow-hidden"
                  style={{
                    shadowColor: goal.color,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.12,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View className="p-4">
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center flex-1">
                        <View
                          className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                          style={{ backgroundColor: goal.color + '20' }}
                        >
                          <Text style={{ fontSize: 22 }}>{goal.icon}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-textPrimary font-semibold text-base">
                            {goal.name}
                          </Text>
                          {goal.deadline && (
                            <Text className="text-textSecondary text-xs">
                              Due{' '}
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
                        <Text className="text-xs font-semibold ml-2">{urgency.label}</Text>
                      )}
                    </View>

                    <View className="h-2 bg-border rounded-full overflow-hidden mb-3">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(progress, 100)}%`,
                          backgroundColor: goal.color,
                        }}
                      />
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="text-textSecondary text-sm">
                        {currency.symbol}
                        {currentAmount.toFixed(0)} / {currency.symbol}
                        {goal.targetAmount.toFixed(0)}
                      </Text>
                      <Text className="text-textSecondary text-sm font-semibold">
                        {progress.toFixed(0)}%
                      </Text>
                    </View>
                  </View>

                  {recommendation && urgency && (
                    <View
                      className={`${urgency.bg} border-t border-border px-4 py-3 flex-row justify-between items-center`}
                    >
                      <View>
                        <Text className="text-textSecondary text-xs mb-0.5">Save per week</Text>
                        <Text className={`font-bold text-lg ${urgency.textColor}`}>
                          {currency.symbol}
                          {recommendation.weeklyTarget.toFixed(0)}
                        </Text>
                        <Text className="text-textSecondary text-xs">
                          or {currency.symbol}
                          {recommendation.monthlyTarget.toFixed(0)}/mo
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-textSecondary text-xs mb-0.5">Time left</Text>
                        <Text className="text-textPrimary font-semibold text-base">
                          {recommendation.weeksRemaining}w
                        </Text>
                        <Text className="text-textSecondary text-xs">
                          {currency.symbol}
                          {remaining.toFixed(0)} to go
                        </Text>
                      </View>
                    </View>
                  )}

                  {progress >= 100 && (
                    <View className="bg-income/10 border-t border-border px-4 py-3">
                      <Text className="text-income font-semibold text-center">
                        🎉 Goal reached!
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <GoalModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        editGoal={editingGoal}
        defaultType="savings"
      />
    </>
  );
}
