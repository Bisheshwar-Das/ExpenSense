// screens/DashboardScreen.tsx
import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { useTransactions } from '../../contexts/TransactionContext';
import { useWallets } from '../../contexts/WalletContext';
import { useSettings } from '../../contexts/SettingsContext';
import { RootNavigationProp } from '../../navigation/types';
import AppHeader from '../../components/AppHeader';
import TransactionRow from '../../components/TransactionRow';

export default function DashboardScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const { transactions, isLoading, deleteTransaction } = useTransactions();
  const { wallets } = useWallets();
  const { currency } = useSettings();

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#0891B2" />
        <Text className="text-textSecondary mt-4">Loading...</Text>
      </View>
    );
  }

  const now = new Date();

  // ── All-time wallet balance (non-credit) ─────────────────────────────────
  const getWalletBalance = (walletId: string) => {
    return transactions.reduce((sum, t) => {
      if (t.type === 'transfer') {
        if (t.walletId === walletId) return sum - t.amount;
        if (t.toWalletId === walletId) return sum + t.amount;
        return sum;
      }
      if (t.walletId === walletId) return sum + t.amount;
      return sum;
    }, 0);
  };

  const nonCreditWallets = wallets.filter(w => (w.type ?? 'checking') !== 'credit');
  const creditWallets = wallets.filter(w => (w.type ?? 'checking') === 'credit');
  const totalBalance = nonCreditWallets.reduce((sum, w) => sum + getWalletBalance(w.id), 0);

  // ── This month income / expense ──────────────────────────────────────────
  const currentMonthTxns = transactions.filter(t => {
    const d = new Date(t.date);
    return (
      t.type !== 'transfer' &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  });

  const totalIncome = currentMonthTxns
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = currentMonthTxns
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // ── Today's date label ───────────────────────────────────────────────────
  const todayLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleTransactionPress = (id: string) =>
    navigation.navigate('TransactionDetails', { transactionId: id });

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete Transaction', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(id);
          } catch {
            Alert.alert('Error', 'Failed to delete transaction');
          }
        },
      },
    ]);
  };

  const renderRightActions = (id: string, title: string) => (
    <TouchableOpacity
      onPress={() => handleDelete(id, title)}
      className="bg-expense justify-center items-center px-6 p-4 mb-3 rounded-xl ml-2"
    >
      <Text className="text-white text-2xl">🗑️</Text>
      <Text className="text-white text-xs font-semibold mt-1">Delete</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-background">
      <AppHeader title="Expen$ense" subtitle={todayLabel} titleAlign="left">
        {/* Row 1 — Total Balance + Credit Owed side by side (no backgrounds) */}
        <View className="flex-row items-end justify-between mb-5">
          <View>
            <Text className="text-white/70 text-xs mb-1 uppercase tracking-wide">
              Total Balance
            </Text>
            <Text className="text-white text-4xl font-bold">
              {currency.symbol}
              {totalBalance.toFixed(2)}
            </Text>
          </View>
          {creditWallets.length > 0 &&
            (() => {
              const totalOwed = creditWallets.reduce(
                (sum, w) => sum + Math.abs(getWalletBalance(w.id)),
                0
              );
              const totalAvailable = creditWallets.reduce((sum, w) => {
                const b = getWalletBalance(w.id);
                return sum + (w.creditLimit ? Math.max(w.creditLimit + b, 0) : 0);
              }, 0);
              return (
                <View className="items-end">
                  <Text className="text-white/70 text-xs mb-1 uppercase tracking-wide">
                    Credit Owed{creditWallets.length > 1 ? ` (${creditWallets.length})` : ''}
                  </Text>
                  <Text className="text-white text-xl font-semibold">
                    {currency.symbol}
                    {totalOwed.toFixed(2)}
                  </Text>
                  {totalAvailable > 0 && (
                    <Text className="text-white/50 text-xs mt-0.5">
                      {currency.symbol}
                      {totalAvailable.toFixed(0)} avail.
                    </Text>
                  )}
                </View>
              );
            })()}
        </View>

        {/* Row 2 — This month income / expense */}
        <Text className="text-white/50 text-xs mb-2 uppercase tracking-wide">{monthLabel}</Text>
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white/15 p-4 rounded-2xl">
            <Text className="text-white/70 text-xs mb-1">↑ Income</Text>
            <Text className="text-white text-lg font-bold">
              {currency.symbol}
              {totalIncome.toFixed(2)}
            </Text>
          </View>
          <View className="flex-1 bg-white/15 p-4 rounded-2xl">
            <Text className="text-white/70 text-xs mb-1">↓ Expenses</Text>
            <Text className="text-lg font-bold" style={{ color: '#ff0808' }}>
              {currency.symbol}
              {totalExpense.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Credit card detail rows — only if multiple cards */}
        {creditWallets.length > 1 && (
          <View className="mt-3 pt-3 border-t border-white/20">
            {creditWallets.map(wallet => {
              const balance = getWalletBalance(wallet.id);
              const owed = Math.abs(balance);
              const available = wallet.creditLimit
                ? Math.max(wallet.creditLimit + balance, 0)
                : null;
              return (
                <View key={wallet.id} className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-2">
                    <Text style={{ fontSize: 14 }}>{wallet.icon}</Text>
                    <Text className="text-white/90 text-sm font-medium">{wallet.name}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-white text-sm font-semibold">
                      {currency.symbol}
                      {owed.toFixed(2)} owed
                    </Text>
                    {available !== null && (
                      <Text className="text-white/60 text-xs">
                        {currency.symbol}
                        {available.toFixed(0)} available
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </AppHeader>

      {/* Recent transactions */}
      <View className="px-6 pb-6">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-textPrimary text-lg font-semibold">Recent Transactions</Text>
          {transactions.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text className="text-primary text-sm font-medium">See All →</Text>
            </TouchableOpacity>
          )}
        </View>

        {transactions.length === 0 ? (
          <View className="bg-card p-8 rounded-xl items-center">
            <Text className="text-4xl mb-3">📊</Text>
            <Text className="text-textPrimary font-medium text-base mb-1">No transactions yet</Text>
            <Text className="text-textSecondary text-sm text-center">
              Tap the + button to add your first transaction
            </Text>
          </View>
        ) : (
          transactions.slice(0, 5).map(transaction => (
            <Swipeable
              key={transaction.id}
              renderRightActions={() => renderRightActions(transaction.id, transaction.title)}
              overshootRight={false}
            >
              <TransactionRow transaction={transaction} onPress={handleTransactionPress} />
            </Swipeable>
          ))
        )}
      </View>
    </ScrollView>
  );
}
