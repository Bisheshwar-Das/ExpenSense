// screens/TransactionsScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { useTransactions } from '../contexts/TransactionContext';
import { useWallets } from '../contexts/WalletContext';
import { useGoals } from '../contexts/GoalContext';
import { useSettings } from '../contexts/SettingsContext';
import { RootNavigationProp } from '../navigation/types';
import AppHeader from '../components/AppHeader';

type FilterType = 'all' | 'income' | 'expense' | 'transfer';

export default function TransactionsScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const { transactions, deleteTransaction } = useTransactions();
  const { wallets } = useWallets();
  const { goals } = useGoals();
  const { currency } = useSettings();

  const [filterType, setFilterType] = useState<FilterType>('all');

  const filteredTransactions =
    filterType === 'all' ? transactions : transactions.filter(t => t.type === filterType);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getTransferSubtitle = (toWalletId?: string, toGoalId?: string) => {
    if (toGoalId) {
      const goal = goals.find(g => g.id === toGoalId);
      const wallet = toWalletId ? wallets.find(w => w.id === toWalletId) : null;
      if (goal && wallet) return `${wallet.name} → ${goal.name}`;
      if (goal) return `→ ${goal.name}`;
    }
    if (toWalletId) {
      const wallet = wallets.find(w => w.id === toWalletId);
      return wallet ? `→ ${wallet.name}` : '→ Wallet';
    }
    return 'Transfer';
  };

  const handleTransactionPress = (transactionId: string) => {
    navigation.navigate('TransactionDetails', { transactionId });
  };

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

  const renderRightActions = (transactionId: string, title: string) => (
    <TouchableOpacity
      onPress={() => handleDelete(transactionId, title)}
      className="bg-expense justify-center items-center px-6 p-4 mb-3 rounded-xl ml-2"
    >
      <Text className="text-white text-2xl">🗑️</Text>
      <Text className="text-white text-xs font-semibold mt-1">Delete</Text>
    </TouchableOpacity>
  );

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'income', label: 'Income' },
    { key: 'expense', label: 'Expense' },
    { key: 'transfer', label: '⇄ Transfer' },
  ];

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        title="All Transactions"
        subtitle={`${filteredTransactions.length} ${filteredTransactions.length === 1 ? 'transaction' : 'transactions'}`}
      >
        <View className="bg-white/15 p-2 rounded-2xl flex-row gap-2">
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilterType(f.key)}
              className={`flex-1 py-3 rounded-xl ${filterType === f.key ? 'bg-white' : 'bg-transparent'}`}
            >
              <Text
                className={`text-center font-semibold text-xs ${filterType === f.key ? 'text-primary' : 'text-white'}`}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </AppHeader>

      <ScrollView className="flex-1 pt-8 px-6">
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
                <View className="flex-1">
                  <Text className="text-textPrimary font-medium text-base mb-1">
                    {transaction.title}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-textSecondary text-xs">
                      {formatDate(transaction.date)}
                    </Text>
                    <Text className="text-textSecondary text-xs">•</Text>
                    <Text className="text-textSecondary text-xs">
                      {transaction.type === 'transfer'
                        ? getTransferSubtitle(transaction.toWalletId, transaction.toGoalId)
                        : transaction.category}
                    </Text>
                  </View>
                </View>

                <Text
                  className={`text-base font-semibold ${
                    transaction.type === 'income'
                      ? 'text-income'
                      : transaction.type === 'transfer'
                        ? 'text-primary'
                        : 'text-expense'
                  }`}
                >
                  {transaction.type === 'income'
                    ? '+'
                    : transaction.type === 'transfer'
                      ? '⇄ '
                      : '-'}
                  {currency.symbol}
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
