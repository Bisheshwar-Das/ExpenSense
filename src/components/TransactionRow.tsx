// components/TransactionRow.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Transaction } from '../types';
import { useWallets } from '../contexts/WalletContext';
import { useGoals } from '../contexts/GoalContext';
import { useSettings } from '../contexts/SettingsContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types';

interface TransactionRowProps {
  transaction: Transaction;
  onPress: (id: string) => void;
}

export default function TransactionRow({ transaction, onPress }: TransactionRowProps) {
  const { wallets } = useWallets();
  const { goals } = useGoals();
  const { currency } = useSettings();

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

  // ── Left side bottom line ───────────────────────────────────────────────
  const getSubtitle = () => {
    if (transaction.type === 'transfer') {
      const toWallet = transaction.toWalletId
        ? wallets.find(w => w.id === transaction.toWalletId)
        : null;
      const toGoal = transaction.toGoalId ? goals.find(g => g.id === transaction.toGoalId) : null;
      const toLabel = toWallet ? toWallet.name : toGoal ? toGoal.name : 'Unknown';
      return `${transaction.wallet} → ${toLabel}`;
    }
    return transaction.wallet;
  };

  // ── Right side bottom label ─────────────────────────────────────────────
  const getRightLabel = () => {
    if (transaction.type === 'transfer') {
      const toGoal = transaction.toGoalId ? goals.find(g => g.id === transaction.toGoalId) : null;
      const toWallet = transaction.toWalletId
        ? wallets.find(w => w.id === transaction.toWalletId)
        : null;
      if (toGoal) return `${toGoal.icon} ${toGoal.name}`;
      if (toWallet) return `${toWallet.icon} ${toWallet.name}`;
      return null;
    }
    // Look up category icon
    const cats = transaction.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const cat = cats.find(c => c.name === transaction.category);
    return cat ? `${cat.icon} ${cat.name}` : transaction.category || null;
  };

  const amountColor =
    transaction.type === 'income'
      ? 'text-income'
      : transaction.type === 'transfer'
        ? 'text-primary'
        : 'text-expense';

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
      {/* Left — title, date, from/to or wallet */}
      <View className="flex-1 mr-3">
        <Text className="text-textPrimary font-semibold text-base mb-0.5" numberOfLines={1}>
          {transaction.title}
        </Text>
        <Text className="text-textSecondary text-xs mb-0.5">{formatDate(transaction.date)}</Text>
        <Text className="text-textSecondary text-xs" numberOfLines={1}>
          {getSubtitle()}
        </Text>
      </View>

      {/* Right — amount + category or goal */}
      <View className="items-end">
        <Text className={`text-base font-bold ${amountColor}`}>
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
