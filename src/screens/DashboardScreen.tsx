import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Transaction } from '../types';

export default function DashboardScreen() {
  // Mock data - we'll replace with real data later
  const transactions: Transaction[] = [
    {
      id: '1',
      title: 'Coffee Shop',
      amount: -4.50,
      category: 'Food',
      date: 'Today, 2:30 PM',
      wallet: 'Main Wallet',
      type: 'expense'
    },
    {
      id: '2',
      title: 'Freelance Project',
      amount: 250.00,
      category: 'Income',
      date: 'Today, 10:00 AM',
      wallet: 'Main Wallet',
      type: 'income'
    },
    {
      id: '3',
      title: 'Groceries',
      amount: -45.80,
      category: 'Food',
      date: 'Yesterday, 6:15 PM',
      wallet: 'Cash',
      type: 'expense'
    }
  ];

  // Calculate totals from transactions
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalBalance = totalIncome - totalExpense;

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Header with Teal Background */}
      <View className="bg-primary pt-16 pb-8 px-6 rounded-b-[30px]">
        {/* App Name */}
        <Text className="text-white text-3xl font-bold mb-1">
          Expen$ense
        </Text>
        <Text className="text-white/80 text-sm mb-6">
          January 2026
        </Text>

        {/* Total Balance Card */}
        <View className="mb-5">
          <Text className="text-white/80 text-sm mb-1">
            Total Balance
          </Text>
          <Text className="text-white text-4xl font-bold">
            ${totalBalance.toFixed(2)}
          </Text>
        </View>

        {/* Income and Expense Summary Row */}
        <View className="flex-row gap-3">
          {/* Income Card */}
          <View className="flex-1 bg-white/15 p-4 rounded-xl">
            <Text className="text-white/80 text-xs mb-1">Income</Text>
            <Text className="text-white text-lg font-semibold">
              ${totalIncome.toFixed(2)}
            </Text>
          </View>

          {/* Expense Card */}
          <View className="flex-1 bg-white/15 p-4 rounded-xl">
            <Text className="text-white/80 text-xs mb-1">Expenses</Text>
            <Text className="text-white text-lg font-semibold">
              ${totalExpense.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Recent Transactions Section */}
      <View className="p-6">
        <Text className="text-textPrimary text-lg font-semibold mb-4">
          Recent Transactions
        </Text>

        {/* Transaction List */}
        {transactions.map((transaction) => (
          <View 
            key={transaction.id}
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
            <View>
              <Text className="text-textPrimary font-medium text-base mb-1">
                {transaction.title}
              </Text>
              <Text className="text-textSecondary text-xs">
                {transaction.date}
              </Text>
            </View>
            
            {/* Right Side: Amount */}
            <Text 
              className={`text-base font-semibold ${
                transaction.type === 'income' ? 'text-income' : 'text-expense'
              }`}
            >
              {transaction.type === 'income' ? '+' : ''}
              ${Math.abs(transaction.amount).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      {/* Floating Action Button (Add Transaction) */}
      <TouchableOpacity 
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
        onPress={() => console.log('Add transaction pressed')}
      >
        <Text className="text-white text-3xl font-light">+</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}