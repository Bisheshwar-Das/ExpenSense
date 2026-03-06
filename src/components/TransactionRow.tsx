// src/components/TransactionRow.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Transaction } from '../types';
import { useWallets } from '../contexts/WalletContext';
import { useBudgets } from '../contexts/BudgetContext';
import { useSavings } from '../contexts/SavingsContext';
import { useSettings } from '../contexts/SettingsContext';
import { useCategories } from '../contexts/CategoryContext';

interface TransactionRowProps {
  transaction: Transaction;
  onPress: (id: string) => void;
}

export default function TransactionRow({ transaction, onPress }: TransactionRowProps) {
  const { wallets } = useWallets();
  const { budgets } = useBudgets();
  const { savingsGoals } = useSavings();
  const { currency } = useSettings();
  const { getCategoryById } = useCategories();

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (date.toDateString() === now.toDateString()) {
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

  // Resolve category — prefer id lookup
  const resolveCategory = () => {
    if (transaction.categoryId) return getCategoryById(transaction.categoryId);
    return null;
  };

  const getSubtitle = () => {
    if (transaction.type === 'transfer') {
      const fromWallet = transaction.walletId
        ? wallets.find(w => w.id === transaction.walletId)
        : null;
      const toWallet = transaction.toWalletId
        ? wallets.find(w => w.id === transaction.toWalletId)
        : null;
      const toGoal = transaction.toGoalId
        ? budgets.find(g => g.id === transaction.toGoalId) ||
          savingsGoals.find(g => g.id === transaction.toGoalId)
        : null;
      const toLabel = toWallet ? toWallet.name : toGoal ? toGoal.name : 'Unknown';
      const fromLabel = fromWallet ? fromWallet.name : 'Unknown';
      return `${fromLabel} → ${toLabel}`;
    }
    const wallet = transaction.walletId ? wallets.find(w => w.id === transaction.walletId) : null;
    return wallet ? wallet.name : 'Unknown';
  };

  const getRightLabel = () => {
    if (transaction.type === 'transfer') {
      const toGoal = transaction.toGoalId
        ? budgets.find(g => g.id === transaction.toGoalId) ||
          savingsGoals.find(g => g.id === transaction.toGoalId)
        : null;
      const toWallet = transaction.toWalletId
        ? wallets.find(w => w.id === transaction.toWalletId)
        : null;
      if (toGoal) return `${toGoal.icon} ${toGoal.name}`;
      if (toWallet) return `${toWallet.icon} ${toWallet.name}`;
      return null;
    }
    const cat = resolveCategory();
    return cat ? `${cat.icon} ${cat.name}` : null;
  };

  const amountColor =
    transaction.type === 'income'
      ? '#22C55E'
      : transaction.type === 'transfer'
        ? '#14B8A6'
        : '#EF4444';
  const amountPrefix =
    transaction.type === 'income' ? '+' : transaction.type === 'transfer' ? '⇄ ' : '-';
  const rightLabel = getRightLabel();

  return (
    <TouchableOpacity
      onPress={() => onPress(transaction.id)}
      className="bg-card p-4 rounded-xl mb-3 flex-row justify-between items-center border border-border"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
      }}
    >
      <View className="flex-1 mr-3">
        <Text className="text-textPrimary font-semibold text-base mb-0.5" numberOfLines={1}>
          {transaction.title}
        </Text>
        <Text className="text-textSecondary text-xs mb-0.5">{formatDate(transaction.date)}</Text>
        <Text className="text-textSecondary text-xs" numberOfLines={1}>
          {getSubtitle()}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-base font-bold" style={{ color: amountColor }}>
          {amountPrefix}
          {currency.symbol}
          {Math.abs(transaction.amount).toFixed(2)}
        </Text>
        {rightLabel && (
          <Text className="text-textSecondary text-xs mt-0.5" numberOfLines={1}>
            {rightLabel}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
