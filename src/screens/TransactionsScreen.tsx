// screens/TransactionsScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { useTransactions } from '../contexts/TransactionContext';
import { RootNavigationProp } from '../navigation/types';
import { TransactionType } from '../types';

export default function TransactionsScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const { transactions, deleteTransaction } = useTransactions();

  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');

  // Filter transactions based on selected type
  const filteredTransactions =
    filterType === 'all' ? transactions : transactions.filter(t => t.type === filterType);

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

  // Handle transaction tap
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
        className="bg-expense justify-center items-center px-6 p-4 mb-3 rounded-xl ml-2"
      >
        <Text className="text-white text-2xl">🗑️</Text>
        <Text className="text-white text-xs font-semibold mt-1">Delete</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-primary pt-16 pb-6 px-6 rounded-b-[30px]">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <Text className="text-white text-2xl">←</Text>
          </TouchableOpacity>
          <Text className="text-white text-3xl font-bold">All Transactions</Text>
        </View>

        {/* Filter Tabs */}
        <View className="bg-white/15 p-2 rounded-2xl flex-row gap-2">
          {(['all', 'income', 'expense'] as const).map(type => (
            <TouchableOpacity
              key={type}
              onPress={() => setFilterType(type)}
              className={`flex-1 py-3 rounded-xl ${
                filterType === type ? 'bg-white' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-center font-semibold capitalize ${
                  filterType === type ? 'text-primary' : 'text-white'
                }`}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Transaction Count */}
      <View className="px-6 py-3">
        <Text className="text-textSecondary text-sm">
          {filteredTransactions.length}{' '}
          {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
        </Text>
      </View>

      {/* Transactions List */}
      <ScrollView className="flex-1 px-6">
        {filteredTransactions.length === 0 ? (
          <View className="bg-card p-8 rounded-xl items-center mt-4">
            <Text className="text-4xl mb-3">📊</Text>
            <Text className="text-textPrimary font-medium text-base mb-1">
              No {filterType === 'all' ? '' : filterType} transactions
            </Text>
            <Text className="text-textSecondary text-sm text-center">
              {filterType === 'all'
                ? 'Tap the + button to add your first transaction'
                : `No ${filterType} transactions found`}
            </Text>
          </View>
        ) : (
          filteredTransactions.map(transaction => (
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
                  <View className="flex-row items-center gap-2">
                    <Text className="text-textSecondary text-xs">
                      {formatDate(transaction.date)}
                    </Text>
                    <Text className="text-textSecondary text-xs">•</Text>
                    <Text className="text-textSecondary text-xs">{transaction.category}</Text>
                  </View>
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

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}
