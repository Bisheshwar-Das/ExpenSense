// screens/BudgetsScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useGoals } from '../../contexts/GoalContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Goal } from '../../types';
import GoalModal from '../../components/GoalModal';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '@/components/AppHeader';
import { Ionicons } from '@expo/vector-icons';

type BudgetSort = 'overspend' | 'amount' | 'name';

export default function BudgetsScreen() {
  const navigation = useNavigation<any>();
  const { goals, deleteGoal } = useGoals();
  const { transactions } = useTransactions();
  const { currency } = useSettings();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [sortBy, setSortBy] = useState<BudgetSort>('overspend');
  const [sortAsc, setSortAsc] = useState(false);

  const budgetGoals = goals.filter(g => g.type === 'budget');

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
    Alert.alert('Delete Budget', `Delete "${goal.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(goal.id) },
    ]);
  };

  // Summary figures
  const totalBudget = budgetGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSpent = budgetGoals.reduce(
    (sum, g) => sum + getBudgetSpending(g.category || '', g.period),
    0
  );
  const overBudgetCount = budgetGoals.filter(
    g => getBudgetSpending(g.category || '', g.period) > g.targetAmount
  ).length;

  const sortedGoals = [...budgetGoals].sort((a, b) => {
    const aSpent = getBudgetSpending(a.category || '', a.period);
    const bSpent = getBudgetSpending(b.category || '', b.period);
    let result = 0;
    if (sortBy === 'overspend') result = bSpent / b.targetAmount - aSpent / a.targetAmount;
    else if (sortBy === 'amount') result = a.targetAmount - b.targetAmount;
    else if (sortBy === 'name') result = (a.category || '').localeCompare(b.category || '');
    return sortAsc ? -result : result;
  });

  return (
    <>
      <ScrollView className="flex-1 bg-background">
        <AppHeader
          title="Budgets"
          subtitle={`${budgetGoals.length} ${budgetGoals.length === 1 ? 'budget' : 'budgets'}`}
          onBack={() => navigation.goBack()}
          onEdit={handleAddGoal}
          editLabel="+ Add"
          hideMenu
          backgroundColor="#8B5CF6"
        />

        <View className="px-4 pb-8">
          {/* Summary card */}
          {budgetGoals.length > 0 && (
            <View
              className="bg-card rounded-2xl mt-4 mb-4 overflow-hidden"
              style={{
                shadowColor: '#8B5CF6',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View className="px-4 pt-4 pb-3">
                <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-3">
                  This Period
                </Text>
                <View className="flex-row justify-between mb-3">
                  <View>
                    <Text className="text-textSecondary text-xs mb-0.5">Total Budget</Text>
                    <Text className="text-textPrimary font-bold text-base">
                      {currency.symbol}
                      {totalBudget.toFixed(0)}
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-textSecondary text-xs mb-0.5">Spent</Text>
                    <Text
                      className={`font-bold text-base ${totalSpent > totalBudget ? 'text-expense' : 'text-textPrimary'}`}
                    >
                      {currency.symbol}
                      {totalSpent.toFixed(0)}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-textSecondary text-xs mb-0.5">Remaining</Text>
                    <Text
                      className={`font-bold text-base ${totalBudget - totalSpent < 0 ? 'text-expense' : 'text-income'}`}
                    >
                      {currency.symbol}
                      {Math.abs(totalBudget - totalSpent).toFixed(0)}
                    </Text>
                  </View>
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
              {overBudgetCount > 0 && (
                <View className="border-t border-border px-4 py-2.5 flex-row items-center gap-2">
                  <Ionicons name="warning-outline" size={14} color="#EF4444" />
                  <Text className="text-expense text-xs font-semibold">
                    {overBudgetCount} {overBudgetCount === 1 ? 'budget' : 'budgets'} over limit
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Sort controls */}
          {budgetGoals.length > 0 && (
            <View className="flex-row items-center gap-2 mb-3">
              <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wider flex-1">
                Budgets
              </Text>
              {(
                [
                  { key: 'overspend', label: 'Overspend' },
                  { key: 'amount', label: 'Amount' },
                  { key: 'name', label: 'Name' },
                ] as { key: BudgetSort; label: string }[]
              ).map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setSortBy(opt.key)}
                  className={`px-2.5 py-1 rounded-full ${sortBy === opt.key ? 'bg-violet-500' : 'bg-border'}`}
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

          {/* Budget list */}
          {budgetGoals.length === 0 ? (
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
              <Text style={{ fontSize: 36, marginBottom: 12 }}>📊</Text>
              <Text className="text-textPrimary font-semibold text-base mb-1">No budgets set</Text>
              <Text className="text-textSecondary text-sm text-center mb-4">
                Control your spending by category
              </Text>
              <TouchableOpacity
                onPress={handleAddGoal}
                className="rounded-2xl px-6 py-3"
                style={{ backgroundColor: '#8B5CF6' }}
              >
                <Text className="text-white font-semibold">Create First Budget</Text>
              </TouchableOpacity>
            </View>
          ) : (
            sortedGoals.map(goal => {
              const spent = getBudgetSpending(goal.category || '', goal.period);
              const remaining = goal.targetAmount - spent;
              const progress = (spent / goal.targetAmount) * 100;
              const isOverBudget = spent > goal.targetAmount;

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
                            {goal.category}
                          </Text>
                          <Text className="text-textSecondary text-xs capitalize">
                            {goal.period} budget
                          </Text>
                        </View>
                      </View>
                      {isOverBudget && (
                        <View className="bg-expense/10 px-2.5 py-1 rounded-full">
                          <Text className="text-expense text-xs font-semibold">Over!</Text>
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
                        {currency.symbol}
                        {spent.toFixed(0)} of {currency.symbol}
                        {goal.targetAmount.toFixed(0)}
                      </Text>
                      <Text
                        className={`text-sm font-semibold ${isOverBudget ? 'text-expense' : 'text-income'}`}
                      >
                        {isOverBudget ? '−' : ''}
                        {currency.symbol}
                        {Math.abs(remaining).toFixed(0)} {isOverBudget ? 'over' : 'left'}
                      </Text>
                    </View>
                  </View>
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
        defaultType="budget"
      />
    </>
  );
}
