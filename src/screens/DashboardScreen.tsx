import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
//   IMPORT our custom hook
import { useTransactions } from '../contexts/TransactionContext';

export default function DashboardScreen() {
  //   GET transactions from Context
  const { transactions, isLoading } = useTransactions();

  //   Show loading spinner while data loads from AsyncStorage
  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#0891B2" />
        <Text className="text-textSecondary mt-4">Loading transactions...</Text>
      </View>
    );
  }

  // Calculate totals from REAL transactions
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalBalance = totalIncome - totalExpense;

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if today
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      })}`;
    }
    
    // Check if yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      })}`;
    }
    
    // Otherwise show date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

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

        {/*   Show message if no transactions */}
        {transactions.length === 0 ? (
          <View className="bg-card p-8 rounded-xl items-center">
            <Text className="text-4xl mb-3">📊</Text>
            <Text className="text-textPrimary font-medium text-base mb-1">
              No transactions yet
            </Text>
            <Text className="text-textSecondary text-sm text-center">
              Tap the + button to add your first transaction
            </Text>
          </View>
        ) : (
          /*   Transaction List with REAL data */
          transactions.map((transaction) => (
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
              <View className="flex-1">
                <Text className="text-textPrimary font-medium text-base mb-1">
                  {transaction.title}
                </Text>
                <Text className="text-textSecondary text-xs">
                  {formatDate(transaction.date)}
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
          ))
        )}
      </View>
    </ScrollView>
  );
}