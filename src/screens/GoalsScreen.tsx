// screens/GoalsScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useGoals } from '../contexts/GoalContext';
import { useTransactions } from '../contexts/TransactionContext';
import { Goal } from '../types';
import GoalModal from '../components/GoalModal';

export default function GoalsScreen() {
  const { goals, deleteGoal } = useGoals();
  const { transactions } = useTransactions();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedTab, setSelectedTab] = useState<'savings' | 'budget'>('savings');

  // Filter goals by type
  const savingsGoals = goals.filter(g => g.type === 'savings');
  const budgetGoals = goals.filter(g => g.type === 'budget');

  // Calculate budget spending for current month
  const getBudgetSpending = (category: string) => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

    return transactions
      .filter(t => t.type === 'expense' && t.category === category && new Date(t.date) >= firstDay)
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
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteGoal(goal.id),
      },
    ]);
  };

  const renderSavingsGoal = (goal: Goal) => {
    const progress = ((goal.currentAmount || 0) / goal.targetAmount) * 100;
    const remaining = goal.targetAmount - (goal.currentAmount || 0);

    return (
      <TouchableOpacity
        key={goal.id}
        onPress={() => handleEditGoal(goal)}
        onLongPress={() => handleDeleteGoal(goal)}
        className="bg-card p-5 rounded-2xl mb-3"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        {/* Header */}
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
              <Text className="text-textSecondary text-xs">${remaining.toFixed(0)} remaining</Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View className="mb-3">
          <View className="h-2 bg-border rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: goal.color,
              }}
            />
          </View>
        </View>

        {/* Amount */}
        <View className="flex-row justify-between items-center">
          <Text className="text-textSecondary text-sm">
            ${(goal.currentAmount || 0).toFixed(2)} / ${goal.targetAmount.toFixed(2)}
          </Text>
          <Text className="text-textSecondary text-sm font-medium">{progress.toFixed(0)}%</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderBudgetGoal = (goal: Goal) => {
    const spent = getBudgetSpending(goal.category || '');
    const remaining = goal.targetAmount - spent;
    const progress = (spent / goal.targetAmount) * 100;
    const isOverBudget = spent > goal.targetAmount;

    return (
      <TouchableOpacity
        key={goal.id}
        onPress={() => handleEditGoal(goal)}
        onLongPress={() => handleDeleteGoal(goal)}
        className="bg-card p-5 rounded-2xl mb-3"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        {/* Header */}
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

        {/* Progress Bar */}
        <View className="mb-3">
          <View className="h-2 bg-border rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: isOverBudget ? '#EF4444' : goal.color,
              }}
            />
          </View>
        </View>

        {/* Amount */}
        <View className="flex-row justify-between items-center">
          <Text className="text-textSecondary text-sm">
            Spent ${spent.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
          </Text>
          <Text className={`text-sm font-medium ${isOverBudget ? 'text-expense' : 'text-income'}`}>
            {isOverBudget ? '-' : ''}${Math.abs(remaining).toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <ScrollView className="flex-1 bg-background">
        {/* Header */}
        <View className="bg-primary pt-16 pb-8 px-6 rounded-b-[30px]">
          <Text className="text-white text-3xl font-bold mb-1">🎯 Goals</Text>
          <Text className="text-white/80 text-sm mb-6">Track savings & budgets</Text>

          {/* Tab Selector */}
          <View className="bg-white/15 p-2 rounded-2xl flex-row gap-2">
            <TouchableOpacity
              onPress={() => setSelectedTab('savings')}
              className={`flex-1 py-3 rounded-xl ${
                selectedTab === 'savings' ? 'bg-white' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  selectedTab === 'savings' ? 'text-primary' : 'text-white'
                }`}
              >
                Savings ({savingsGoals.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedTab('budget')}
              className={`flex-1 py-3 rounded-xl ${
                selectedTab === 'budget' ? 'bg-white' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  selectedTab === 'budget' ? 'text-primary' : 'text-white'
                }`}
              >
                Budgets ({budgetGoals.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Goals List */}
        <View className="p-6">
          {selectedTab === 'savings' ? (
            savingsGoals.length === 0 ? (
              <View className="bg-card p-8 rounded-xl items-center">
                <Text className="text-4xl mb-3">💰</Text>
                <Text className="text-textPrimary font-medium text-base mb-1">
                  No savings goals yet
                </Text>
                <Text className="text-textSecondary text-sm text-center">
                  Set a goal to save for something special
                </Text>
              </View>
            ) : (
              savingsGoals.map(renderSavingsGoal)
            )
          ) : budgetGoals.length === 0 ? (
            <View className="bg-card p-8 rounded-xl items-center">
              <Text className="text-4xl mb-3">📊</Text>
              <Text className="text-textPrimary font-medium text-base mb-1">No budgets set</Text>
              <Text className="text-textSecondary text-sm text-center">
                Create budgets to control your spending
              </Text>
            </View>
          ) : (
            budgetGoals.map(renderBudgetGoal)
          )}

          {/* Add Goal Button */}
          <TouchableOpacity
            className="bg-white border-2 border-dashed border-border p-5 rounded-2xl items-center mt-3"
            onPress={handleAddGoal}
          >
            <Text className="text-4xl mb-2">➕</Text>
            <Text className="text-textPrimary font-medium text-base">
              Add New {selectedTab === 'savings' ? 'Savings Goal' : 'Budget'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add/Edit Goal Modal */}
      <GoalModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        editGoal={editingGoal}
        defaultType={selectedTab}
      />
    </>
  );
}
