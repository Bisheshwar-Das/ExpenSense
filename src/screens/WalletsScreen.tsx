// screens/WalletScreen.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTransactions } from '../contexts/TransactionContext';
import { DEFAULT_WALLETS } from '../types';

export default function WalletsScreen() {
  const { transactions } = useTransactions();

  // Calculate balance for each wallet
  const getWalletBalance = (walletName: string) => {
    return transactions
      .filter(t => t.wallet === walletName)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Calculate total across all wallets
  const totalBalance = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-primary pt-16 pb-8 px-6 rounded-b-[30px]">
        <Text className="text-white text-3xl font-bold mb-1">
          💰 Wallets
        </Text>
        <Text className="text-white/80 text-sm mb-6">
          Manage your accounts
        </Text>

        {/* Total Balance Card */}
        <View className="bg-white/15 p-5 rounded-2xl">
          <Text className="text-white/80 text-sm mb-1">
            Total Balance
          </Text>
          <Text className="text-white text-3xl font-bold">
            ${totalBalance.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Wallet List */}
      <View className="p-6">
        <Text className="text-textPrimary text-lg font-semibold mb-4">
          My Wallets
        </Text>

        {DEFAULT_WALLETS.map((wallet) => {
          const balance = getWalletBalance(wallet.name);
          const transactionCount = transactions.filter(
            t => t.wallet === wallet.name
          ).length;

          return (
            <TouchableOpacity
              key={wallet.id}
              className="bg-card p-5 rounded-2xl mb-3"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {/* Wallet Header */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  {/* Icon with colored background */}
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: wallet.color + '20' }}
                  >
                    <Text className="text-2xl">{wallet.icon}</Text>
                  </View>
                  
                  {/* Wallet Name */}
                  <View>
                    <Text className="text-textPrimary font-semibold text-base">
                      {wallet.name}
                    </Text>
                    <Text className="text-textSecondary text-xs">
                      {transactionCount} {transactionCount === 1 ? 'transaction' : 'transactions'}
                    </Text>
                  </View>
                </View>

                {/* Arrow */}
                <Text className="text-textSecondary text-xl">›</Text>
              </View>

              {/* Balance */}
              <View className="border-t border-border pt-3">
                <Text className="text-textSecondary text-xs mb-1">
                  Balance
                </Text>
                <Text
                  className={`text-2xl font-bold ${
                    balance >= 0 ? 'text-income' : 'text-expense'
                  }`}
                >
                  {balance >= 0 ? '+' : ''}${balance.toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Add Wallet Button (Placeholder for now) */}
        <TouchableOpacity
          className="bg-white border-2 border-dashed border-border p-5 rounded-2xl items-center"
          onPress={() => alert('Coming soon! 🚀')}
        >
          <Text className="text-4xl mb-2">➕</Text>
          <Text className="text-textPrimary font-medium text-base">
            Add New Wallet
          </Text>
          <Text className="text-textSecondary text-xs">
            Create a custom wallet
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}