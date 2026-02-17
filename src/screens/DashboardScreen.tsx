import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '../contexts/TransactionContext';
import { RootNavigationProp } from '../navigation/types';
import GoalsSummaryWidget from '../components/GoalsSummaryWidget';

export default function DashboardScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const { transactions, isLoading, deleteTransaction } = useTransactions();

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#0891B2" />
        <Text className="text-textSecondary mt-4">Loading transactions...</Text>
      </View>
    );
  }

  // Filter to current month only
  const now = new Date();
  const currentMonthTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
  });

  const totalIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalBalance = totalIncome - totalExpense;

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })}`;
    }

    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })}`;
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Handle transaction tap - navigate to details
  const handleTransactionPress = (transactionId: string) => {
    navigation.navigate('TransactionDetails', { transactionId });
  };

  // Handle delete with confirmation
  const handleDelete = (transactionId: string, title: string) => {
    Alert.alert('Delete Transaction', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(transactionId);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete transaction');
          }
        },
      },
    ]);
  };

  // Right swipe action - Delete button
  const renderRightActions = (transactionId: string, title: string) => {
    return (
      <TouchableOpacity
        onPress={() => handleDelete(transactionId, title)}
        className="bg-expense justify-center items-center px-6 p-4 mb-3  rounded-xl ml-2"
      >
        <Text className="text-white text-2xl">🗑️</Text>
        <Text className="text-white text-xs font-semibold mt-1">Delete</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Header with Teal Background */}
      <View className="bg-primary pt-16 pb-6 px-6 mb-3 rounded-b-[30px]">
        <View className="flex-row justify-between items-start mb-4">
          <View>
            <Text className="text-white text-3xl font-bold mb-1">Expen$ense</Text>
            <Text className="text-white/80 text-md">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
          </View>

          {/* Settings Icon */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            className="bg-white/20 p-2 rounded-xl"
          >
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Total Balance Card */}
        <View className="mb-5">
          <Text className="text-white/80 text-sm mb-1">Total Balance</Text>
          <Text className="text-white text-4xl font-bold">${totalBalance.toFixed(2)}</Text>
        </View>

        {/* Income and Expense Summary Row */}
        <View className="flex-row gap-3">
          {/* Income Card */}
          <View className="flex-1 bg-white/15 p-4 rounded-xl">
            <Text className="text-white/80 text-xs mb-1">Income</Text>
            <Text className="text-white text-lg font-semibold">${totalIncome.toFixed(2)}</Text>
          </View>

          {/* Expense Card */}
          <View className="flex-1 bg-white/15 p-4 rounded-xl">
            <Text className="text-white/80 text-xs mb-1">Expenses</Text>
            <Text className="text-white text-lg font-semibold">${totalExpense.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Goals Summary Widget */}
      <GoalsSummaryWidget />

      {/* Recent Transactions Section */}
      <View className="px-6 pb-6">
        <Text className="text-textPrimary text-lg font-semibold mb-4">Recent Transactions</Text>

        {transactions.length === 0 ? (
          <View className="bg-card p-8 rounded-xl items-center">
            <Text className="text-4xl mb-3">📊</Text>
            <Text className="text-textPrimary font-medium text-base mb-1">No transactions yet</Text>
            <Text className="text-textSecondary text-sm text-center">
              Tap the + button to add your first transaction
            </Text>
          </View>
        ) : (
          transactions.map(transaction => (
            <Swipeable
              key={transaction.id}
              renderRightActions={() => renderRightActions(transaction.id, transaction.title)}
              overshootRight={false}
            >
              <TouchableOpacity
                onPress={() => handleTransactionPress(transaction.id)}
                className="bg-card p-4 rounded-xl mb-3 flex-row justify-between items-center"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                {/* Left Side: Transaction Info */}
                <View className="flex-1">
                  <Text className="text-textPrimary font-medium text-base mb-1">
                    {transaction.title}
                  </Text>
                  <Text className="text-textSecondary text-xs">{formatDate(transaction.date)}</Text>
                </View>

                {/* Right Side: Amount */}
                <Text
                  className={`text-base font-semibold ${
                    transaction.type === 'income' ? 'text-income' : 'text-expense'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : ''}$
                  {Math.abs(transaction.amount).toFixed(2)}
                </Text>
              </TouchableOpacity>
            </Swipeable>
          ))
        )}
      </View>
    </ScrollView>
  );
}
