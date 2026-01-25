// screens/TransactionDetailsScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTransactions } from '../contexts/TransactionContext';
import { RootNavigationProp, TransactionDetailsRouteProp } from '../navigation/types';

export default function TransactionDetailsScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const route = useRoute<TransactionDetailsRouteProp>();
  const { transactions, deleteTransaction } = useTransactions();

  // Get transaction ID from route params
  const { transactionId } = route.params;

  // Find the transaction
  const transaction = transactions.find(t => t.id === transactionId);

  // If transaction not found
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

  // Format date
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
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(transaction.id);
              Alert.alert('Success', 'Transaction deleted', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete transaction');
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('EditTransaction', { transactionId: transaction.id });
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-border">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-primary text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-textPrimary text-xl font-semibold">Transaction Details</Text>
          <View style={{ width: 60 }} />
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Amount Card */}
        <View className="bg-white px-6 py-8 items-center border-b border-border">
          <Text className="text-textSecondary text-sm mb-2">Amount</Text>
          <Text
            className={`text-5xl font-bold ${
              transaction.type === 'income' ? 'text-income' : 'text-expense'
            }`}
          >
            {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
          </Text>
          <View
            className={`mt-3 px-4 py-1 rounded-full ${
              transaction.type === 'income' ? 'bg-income/10' : 'bg-expense/10'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                transaction.type === 'income' ? 'text-income' : 'text-expense'
              }`}
            >
              {transaction.type === 'income' ? 'Income' : 'Expense'}
            </Text>
          </View>
        </View>

        {/* Details Section */}
        <View className="p-6">
          {/* Title */}
          <DetailRow label="Description" value={transaction.title} />

          {/* Category */}
          <DetailRow label="Category" value={transaction.category} />

          {/* Wallet */}
          <DetailRow label="Wallet" value={transaction.wallet} />

          {/* Date */}
          <DetailRow label="Date & Time" value={formatDate(transaction.date)} />

          {/* Notes */}
          {transaction.notes && (
            <View className="bg-white p-4 rounded-2xl mb-3">
              <Text className="text-textSecondary text-sm mb-2">Notes</Text>
              <Text className="text-textPrimary text-base leading-6">{transaction.notes}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons - Fixed at bottom */}
      <View className="bg-white px-6 py-4 border-t border-border">
        <View className="flex-row gap-3">
          {/* Delete Button */}
          <TouchableOpacity
            onPress={handleDelete}
            className="flex-1 py-4 rounded-2xl bg-expense/10 border border-expense/20"
          >
            <Text className="text-center font-semibold text-lg text-expense">🗑️ Delete</Text>
          </TouchableOpacity>

          {/* Edit Button */}
          <TouchableOpacity onPress={handleEdit} className="flex-1 py-4 rounded-2xl bg-primary">
            <Text className="text-center font-semibold text-lg text-white">✏️ Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Helper component for detail rows
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="bg-white p-4 rounded-2xl mb-3">
      <Text className="text-textSecondary text-sm mb-1">{label}</Text>
      <Text className="text-textPrimary text-base font-medium">{value}</Text>
    </View>
  );
}
