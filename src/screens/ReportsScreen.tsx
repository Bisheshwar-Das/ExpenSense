// screens/ReportsScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useTransactions } from '../contexts/TransactionContext';
import { EXPENSE_CATEGORIES } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ReportsScreen() {
  const { transactions } = useTransactions();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Get date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    let startDate = new Date();

    switch (selectedPeriod) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return { startDate, endDate: now };
  };

  const { startDate, endDate } = getDateRange();

  // Filter transactions by date range
  const filteredTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate >= startDate && tDate <= endDate;
  });

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Group expenses by category
  const categoryData = EXPENSE_CATEGORIES.map(category => {
    const categoryTotal = filteredTransactions
      .filter(t => t.type === 'expense' && t.category === category.name)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      name: category.name,
      icon: category.icon,
      amount: categoryTotal,
      percentage: totalExpense > 0 ? (categoryTotal / totalExpense) * 100 : 0,
    };
  }).filter(cat => cat.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Get daily spending for chart
  const getDailySpending = () => {
    const days = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 365;
    const dailyData: { date: Date; amount: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayExpenses = transactions
        .filter(t => {
          const tDate = new Date(t.date);
          tDate.setHours(0, 0, 0, 0);
          return t.type === 'expense' && tDate.getTime() === date.getTime();
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      dailyData.push({ date, amount: dayExpenses });
    }

    return dailyData;
  };

  const dailySpending = getDailySpending();
  const maxSpending = Math.max(...dailySpending.map(d => d.amount), 1);

  // Color palette for categories
  const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-primary pt-16 pb-8 px-6 rounded-b-[30px]">
        <Text className="text-white text-3xl font-bold mb-1">
          📊 Reports
        </Text>
        <Text className="text-white/80 text-sm mb-6">
          Analyze your spending
        </Text>

        {/* Period Selector */}
        <View className="bg-white/15 p-2 rounded-2xl flex-row gap-2">
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              onPress={() => setSelectedPeriod(period)}
              className={`flex-1 py-3 rounded-xl ${
                selectedPeriod === period ? 'bg-white' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-center font-semibold capitalize ${
                  selectedPeriod === period ? 'text-primary' : 'text-white'
                }`}
              >
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="p-6">
        {/* Summary Cards */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-income/10 p-4 rounded-2xl">
            <Text className="text-income/70 text-xs mb-1">Income</Text>
            <Text className="text-income text-xl font-bold">
              ${totalIncome.toFixed(0)}
            </Text>
          </View>

          <View className="flex-1 bg-expense/10 p-4 rounded-2xl">
            <Text className="text-expense/70 text-xs mb-1">Expenses</Text>
            <Text className="text-expense text-xl font-bold">
              ${totalExpense.toFixed(0)}
            </Text>
          </View>
        </View>

        {/* Spending Trend Chart */}
        <View className="bg-card p-5 rounded-2xl mb-6" style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text className="text-textPrimary font-semibold text-base mb-4">
            Spending Trend
          </Text>

          {/* Simple Bar Chart */}
          <View className="flex-row items-end justify-between h-40">
            {dailySpending
              .filter((_, i) => {
                // Show fewer bars for better visibility
                if (selectedPeriod === 'year') return i % 30 === 0;
                if (selectedPeriod === 'month') return i % 3 === 0;
                return true;
              })
              .map((day, index) => {
                const height = maxSpending > 0 ? (day.amount / maxSpending) * 100 : 0;
                return (
                  <View key={index} className="flex-1 items-center mx-0.5">
                    <View
                      className="w-full bg-expense rounded-t"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    {selectedPeriod === 'week' && (
                      <Text className="text-textSecondary text-[10px] mt-1">
                        {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </Text>
                    )}
                  </View>
                );
              })}
          </View>

          <Text className="text-textSecondary text-xs text-center mt-3">
            {selectedPeriod === 'week' ? 'Last 7 days' : 
             selectedPeriod === 'month' ? 'Last 30 days' : 'Last 12 months'}
          </Text>
        </View>

        {/* Category Breakdown */}
        <View className="bg-card p-5 rounded-2xl mb-6" style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text className="text-textPrimary font-semibold text-base mb-4">
            Spending by Category
          </Text>

          {categoryData.length === 0 ? (
            <View className="py-8 items-center">
              <Text className="text-4xl mb-2">💸</Text>
              <Text className="text-textSecondary text-sm">No expenses in this period</Text>
            </View>
          ) : (
            <>
              {/* Progress bars for each category */}
              {categoryData.map((category, index) => (
                <View key={category.name} className="mb-4">
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-row items-center flex-1">
                      <Text className="text-xl mr-2">{category.icon}</Text>
                      <Text className="text-textPrimary font-medium text-sm">
                        {category.name}
                      </Text>
                    </View>
                    <Text className="text-textPrimary font-semibold">
                      ${category.amount.toFixed(0)}
                    </Text>
                  </View>

                  {/* Progress Bar */}
                  <View className="flex-row items-center gap-2">
                    <View className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${category.percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </View>
                    <Text className="text-textSecondary text-xs w-12 text-right">
                      {category.percentage.toFixed(0)}%
                    </Text>
                  </View>
                </View>
              ))}

              {/* Top 3 categories summary */}
              <View className="mt-4 pt-4 border-t border-border">
                <Text className="text-textSecondary text-xs mb-2">Top Spending</Text>
                <View className="flex-row flex-wrap gap-2">
                  {categoryData.slice(0, 3).map((cat, index) => (
                    <View
                      key={cat.name}
                      className="px-3 py-2 rounded-lg"
                      style={{ backgroundColor: COLORS[index] + '20' }}
                    >
                      <Text className="text-textPrimary text-xs font-medium">
                        {cat.icon} {cat.name}: ${cat.amount.toFixed(0)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </View>

        {/* Insights */}
        {totalExpense > 0 && (
          <View className="bg-card p-5 rounded-2xl" style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <Text className="text-textPrimary font-semibold text-base mb-3">
              💡 Insights
            </Text>

            <View className="space-y-3">
              {/* Average daily spending */}
              <View className="bg-background p-3 rounded-xl">
                <Text className="text-textSecondary text-xs">Average Daily Spending</Text>
                <Text className="text-textPrimary text-lg font-bold mt-1">
                  ${(totalExpense / (selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 365)).toFixed(2)}
                </Text>
              </View>

              {/* Biggest category */}
              {categoryData[0] && (
                <View className="bg-background p-3 rounded-xl">
                  <Text className="text-textSecondary text-xs">Biggest Expense Category</Text>
                  <Text className="text-textPrimary text-lg font-bold mt-1">
                    {categoryData[0].icon} {categoryData[0].name} (${categoryData[0].amount.toFixed(0)})
                  </Text>
                </View>
              )}

              {/* Net savings */}
              <View className={`p-3 rounded-xl ${totalIncome - totalExpense >= 0 ? 'bg-income/10' : 'bg-expense/10'}`}>
                <Text className="text-textSecondary text-xs">Net {totalIncome - totalExpense >= 0 ? 'Savings' : 'Loss'}</Text>
                <Text className={`text-lg font-bold mt-1 ${totalIncome - totalExpense >= 0 ? 'text-income' : 'text-expense'}`}>
                  ${Math.abs(totalIncome - totalExpense).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}