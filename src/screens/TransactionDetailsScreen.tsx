// screens/TransactionDetailsScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTransactions } from '../contexts/TransactionContext';
import { useWallets } from '../contexts/WalletContext';
import { useGoals } from '../contexts/GoalContext';
import { useSettings } from '../contexts/SettingsContext';
import { RootNavigationProp, TransactionDetailsRouteProp } from '../navigation/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TransactionDetailsScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const route = useRoute<TransactionDetailsRouteProp>();
  const { transactions, deleteTransaction } = useTransactions();
  const { wallets } = useWallets();
  const { goals } = useGoals();
  const { currency } = useSettings();
  const insets = useSafeAreaInsets();

  const { transactionId } = route.params;
  const transaction = transactions.find(t => t.id === transactionId);

  if (!transaction) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-textSecondary text-lg">Transaction not found</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-4 bg-primary px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isTransfer = transaction.type === 'transfer';

  const fromWallet = wallets.find(w => w.name === transaction.wallet);
  const toWallet = transaction.toWalletId
    ? wallets.find(w => w.id === transaction.toWalletId)
    : null;
  const toGoal = transaction.toGoalId ? goals.find(g => g.id === transaction.toGoalId) : null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleDelete = () => {
    Alert.alert('Delete Transaction', 'Are you sure? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(transaction.id);
            Alert.alert('Deleted', 'Transaction deleted', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete transaction');
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    navigation.navigate('EditTransaction', { transactionId: transaction.id });
  };

  // Amount display config based on type
  const amountColor = isTransfer
    ? 'text-primary'
    : transaction.type === 'income'
      ? 'text-income'
      : 'text-expense';

  const amountPrefix = isTransfer ? '⇄ ' : transaction.type === 'income' ? '+' : '-';

  const typeBadgeColor = isTransfer
    ? 'bg-primary/10'
    : transaction.type === 'income'
      ? 'bg-income/10'
      : 'bg-expense/10';

  const typeBadgeText = isTransfer
    ? 'text-primary'
    : transaction.type === 'income'
      ? 'text-income'
      : 'text-expense';

  const typeLabel = isTransfer ? 'Transfer' : transaction.type === 'income' ? 'Income' : 'Expense';

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="bg-primary px-6 py-4 border-b border-border"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-white text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-semibold">Transaction Details</Text>
          <View style={{ width: 60 }} />
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Amount Card */}
        <View className="bg-white px-6 py-8 items-center border-b border-border">
          <Text className="text-textSecondary text-sm mb-2">Amount</Text>
          <Text className={`text-5xl font-bold ${amountColor}`}>
            {amountPrefix}
            {currency.symbol}
            {Math.abs(transaction.amount).toFixed(2)}
          </Text>
          <View className={`mt-3 px-4 py-1 rounded-full ${typeBadgeColor}`}>
            <Text className={`text-sm font-medium ${typeBadgeText}`}>{typeLabel}</Text>
          </View>
        </View>

        <View className="p-6">
          <DetailRow label="Description" value={transaction.title} />
          <DetailRow label="Date & Time" value={formatDate(transaction.date)} />

          {/* Transfer-specific rows */}
          {isTransfer ? (
            <>
              <DetailRow
                label="From"
                value={fromWallet ? `${fromWallet.icon} ${fromWallet.name}` : transaction.wallet}
              />
              {toWallet && (
                <DetailRow label="To Wallet" value={`${toWallet.icon} ${toWallet.name}`} />
              )}
              {toGoal && (
                <DetailRow label="Earmarked For" value={`${toGoal.icon} ${toGoal.name}`} />
              )}
              {!toWallet && !toGoal && <DetailRow label="To" value="Unknown destination" />}
            </>
          ) : (
            <>
              <DetailRow label="Category" value={transaction.category} />
              <DetailRow label="Wallet" value={transaction.wallet} />
            </>
          )}

          {transaction.notes && (
            <View className="bg-white p-4 rounded-2xl mb-3">
              <Text className="text-textSecondary text-sm mb-2">Notes</Text>
              <Text className="text-textPrimary text-base leading-6">{transaction.notes}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="bg-white px-6 py-4 border-t border-border">
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={handleDelete}
            className="flex-1 py-4 rounded-2xl bg-expense/10 border border-expense/20"
          >
            <Text className="text-center font-semibold text-lg text-expense">🗑️ Delete</Text>
          </TouchableOpacity>
          {/* Only show edit for non-transfers — editing transfers is complex */}
          {!isTransfer && (
            <TouchableOpacity onPress={handleEdit} className="flex-1 py-4 rounded-2xl bg-primary">
              <Text className="text-center font-semibold text-lg text-white">✏️ Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="bg-white p-4 rounded-2xl mb-3">
      <Text className="text-textSecondary text-sm mb-1">{label}</Text>
      <Text className="text-textPrimary text-base font-medium">{value}</Text>
    </View>
  );
}
