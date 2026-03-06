// screens/ReportsScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useTransactions } from '../../contexts/TransactionContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import AppHeader from '../../components/AppHeader';

const SCREEN_WIDTH = Dimensions.get('window').width;

const EXPENSE_COLORS = [
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
  '#6366F1',
  '#84CC16',
];

const INCOME_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#14B8A6', '#6366F1', '#22C55E'];

// ─── Mini Donut Chart (pure RN, no SVG lib needed) ───────────────────────────
function DonutChart({
  data,
  colors,
  size = 140,
}: {
  data: { name: string; amount: number; percentage: number }[];
  colors: string[];
  size?: number;
}) {
  // We draw overlapping arcs using View rotation trick
  // Each segment is a half-circle (View with overflow:hidden) rotated to correct position
  const total = data.reduce((s, d) => s + d.percentage, 0);
  if (total === 0) return null;

  const radius = size / 2;
  const strokeWidth = size * 0.18;
  const innerRadius = radius - strokeWidth;

  // Build conic segments using Views
  // We use a stacked approach: each segment is a colored arc
  // Implemented as SVG-style via multiple rotated views
  let cumulativeDeg = 0;

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {/* Background circle */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: '#F1F5F9',
        }}
      />

      {data.map((segment, i) => {
        const deg = (segment.percentage / 100) * 360;
        const startDeg = cumulativeDeg;
        cumulativeDeg += deg;

        // For segments > 180deg we need two half-arc Views
        const color = colors[i % colors.length];

        if (deg <= 180) {
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: radius,
                overflow: 'hidden',
                transform: [{ rotate: `${startDeg}deg` }],
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  width: size,
                  height: size,
                  borderRadius: radius,
                  overflow: 'hidden',
                  transform: [{ rotate: `${deg - 180}deg` }],
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: radius,
                    height: size,
                    backgroundColor: color,
                  }}
                />
              </View>
            </View>
          );
        } else {
          // Two halves
          return (
            <View key={i}>
              {/* First half (180deg) */}
              <View
                style={{
                  position: 'absolute',
                  width: size,
                  height: size,
                  borderRadius: radius,
                  overflow: 'hidden',
                  transform: [{ rotate: `${startDeg}deg` }],
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: radius,
                    height: size,
                    backgroundColor: color,
                  }}
                />
              </View>
              {/* Second half (remainder) */}
              <View
                style={{
                  position: 'absolute',
                  width: size,
                  height: size,
                  borderRadius: radius,
                  overflow: 'hidden',
                  transform: [{ rotate: `${startDeg + 180}deg` }],
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    width: size,
                    height: size,
                    borderRadius: radius,
                    overflow: 'hidden',
                    transform: [{ rotate: `${deg - 360}deg` }],
                  }}
                >
                  <View
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: radius,
                      height: size,
                      backgroundColor: color,
                    }}
                  />
                </View>
              </View>
            </View>
          );
        }
      })}

      {/* Inner white circle to make donut hole */}
      <View
        style={{
          position: 'absolute',
          top: strokeWidth,
          left: strokeWidth,
          width: innerRadius * 2,
          height: innerRadius * 2,
          borderRadius: innerRadius,
          backgroundColor: 'white',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 10, color: '#94A3B8', textAlign: 'center' }}>
          {data.length} {'\n'}categories
        </Text>
      </View>
    </View>
  );
}

// ─── Animated Bar ─────────────────────────────────────────────────────────────
function AnimatedBar({
  heightPercent,
  color,
  maxHeightPx,
}: {
  heightPercent: number;
  color: string;
  maxHeightPx: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: heightPercent,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [heightPercent]);

  const animatedHeight = anim.interpolate({
    inputRange: [0, 100],
    outputRange: [0, maxHeightPx],
  });

  return (
    <Animated.View
      style={{
        width: '100%',
        height: animatedHeight,
        backgroundColor: color,
        borderRadius: 3,
      }}
    />
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ReportsScreen() {
  const { transactions } = useTransactions();
  const { currency } = useSettings();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [activeTab, setActiveTab] = useState<'expenses' | 'income'>('expenses');

  // ── Date range ──────────────────────────────────────────────────────────────
  const getDateRange = () => {
    const now = new Date();
    const startDate = new Date();
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

  // ── Previous period date range (for comparison) ─────────────────────────────
  const getPrevDateRange = () => {
    const startDate = new Date();
    const endDate = new Date();
    switch (selectedPeriod) {
      case 'week':
        endDate.setDate(endDate.getDate() - 7);
        startDate.setDate(startDate.getDate() - 14);
        break;
      case 'month':
        endDate.setMonth(endDate.getMonth() - 1);
        startDate.setMonth(startDate.getMonth() - 2);
        break;
      case 'year':
        endDate.setFullYear(endDate.getFullYear() - 1);
        startDate.setFullYear(startDate.getFullYear() - 2);
        break;
    }
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();
  const { startDate: prevStart, endDate: prevEnd } = getPrevDateRange();

  const filteredTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= startDate && d <= endDate;
  });

  const prevTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= prevStart && d <= prevEnd;
  });

  // ── Totals ──────────────────────────────────────────────────────────────────
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const prevExpense = prevTransactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const prevIncome = prevTransactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const expenseChange = prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense) * 100 : null;
  const incomeChange = prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : null;

  // ── Category breakdowns ─────────────────────────────────────────────────────
  const buildCategoryData = (type: 'expense' | 'income', total: number) => {
    const cats = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    return cats
      .map(cat => {
        const amount = filteredTransactions
          .filter(t => t.type === type && t.category === cat.name)
          .reduce((s, t) => s + Math.abs(t.amount), 0);
        return {
          name: cat.name,
          icon: cat.icon,
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
        };
      })
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  };

  const expenseCategoryData = buildCategoryData('expense', totalExpense);
  const incomeCategoryData = buildCategoryData('income', totalIncome);
  const activeCategoryData = activeTab === 'expenses' ? expenseCategoryData : incomeCategoryData;
  const activeTotal = activeTab === 'expenses' ? totalExpense : totalIncome;
  const activeColors = activeTab === 'expenses' ? EXPENSE_COLORS : INCOME_COLORS;

  // ── Bar chart data ──────────────────────────────────────────────────────────
  const getChartData = () => {
    const periodDays = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 12;
    const data: { label: string; expense: number; income: number }[] = [];

    if (selectedPeriod === 'year') {
      // Monthly buckets
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const month = d.getMonth();
        const year = d.getFullYear();
        const bucket = transactions.filter(t => {
          const td = new Date(t.date);
          return td.getMonth() === month && td.getFullYear() === year;
        });
        data.push({
          label: d.toLocaleDateString('en-US', { month: 'short' }),
          expense: bucket
            .filter(t => t.type === 'expense')
            .reduce((s, t) => s + Math.abs(t.amount), 0),
          income: bucket.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        });
      }
    } else {
      for (let i = periodDays - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const bucket = transactions.filter(t => {
          const td = new Date(t.date);
          td.setHours(0, 0, 0, 0);
          return td.getTime() === d.getTime();
        });
        data.push({
          label:
            selectedPeriod === 'week'
              ? d.toLocaleDateString('en-US', { weekday: 'short' })
              : d.getDate().toString(),
          expense: bucket
            .filter(t => t.type === 'expense')
            .reduce((s, t) => s + Math.abs(t.amount), 0),
          income: bucket.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        });
      }
    }
    return data;
  };

  const chartData = getChartData();

  // Thin out bars for month view for readability
  const visibleBars = chartData.filter((_, i) => {
    if (selectedPeriod === 'month') return i % 3 === 0;
    return true;
  });

  const maxBarValue = Math.max(...visibleBars.map(d => Math.max(d.expense, d.income)), 1);
  const BAR_AREA_HEIGHT = 120; // px

  // ── Largest single transaction ──────────────────────────────────────────────
  const largestExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0];

  // ── Period label ────────────────────────────────────────────────────────────
  const periodLabel =
    selectedPeriod === 'week'
      ? 'Last 7 days'
      : selectedPeriod === 'month'
        ? 'Last 30 days'
        : 'Last 12 months';
  const daysInPeriod = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 365;

  const hasAnyData = filteredTransactions.length > 0;

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <AppHeader icon="📊" title="Reports" subtitle="Analyze your finances">
        <View className="bg-white/15 p-2 rounded-2xl flex-row" style={{ gap: 8 }}>
          {(['week', 'month', 'year'] as const).map(period => (
            <TouchableOpacity
              key={period}
              onPress={() => setSelectedPeriod(period)}
              className={`flex-1 py-3 rounded-xl ${selectedPeriod === period ? 'bg-white' : 'bg-transparent'}`}
            >
              <Text
                className={`text-center font-semibold capitalize ${selectedPeriod === period ? 'text-primary' : 'text-white'}`}
              >
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </AppHeader>

      <View className="p-6" style={{ gap: 16 }}>
        {/* ── Summary Cards ─────────────────────────────────────────────────── */}
        <View className="flex-row" style={{ gap: 12 }}>
          {/* Income card */}
          <View
            className="flex-1 bg-white p-4 rounded-2xl"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text className="text-textSecondary text-xs mb-1">Income</Text>
            <Text className="text-income text-xl font-bold">
              {currency.symbol}
              {totalIncome.toFixed(0)}
            </Text>
            {incomeChange !== null && (
              <View className="flex-row items-center mt-1">
                <Text style={{ fontSize: 11, color: incomeChange >= 0 ? '#10B981' : '#EF4444' }}>
                  {incomeChange >= 0 ? '▲' : '▼'} {Math.abs(incomeChange).toFixed(0)}% vs prev
                </Text>
              </View>
            )}
          </View>

          {/* Expense card */}
          <View
            className="flex-1 bg-white p-4 rounded-2xl"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text className="text-textSecondary text-xs mb-1">Expenses</Text>
            <Text className="text-expense text-xl font-bold">
              {currency.symbol}
              {totalExpense.toFixed(0)}
            </Text>
            {expenseChange !== null && (
              <View className="flex-row items-center mt-1">
                <Text style={{ fontSize: 11, color: expenseChange <= 0 ? '#10B981' : '#EF4444' }}>
                  {expenseChange >= 0 ? '▲' : '▼'} {Math.abs(expenseChange).toFixed(0)}% vs prev
                </Text>
              </View>
            )}
          </View>

          {/* Net card */}
          <View
            className="flex-1 bg-white p-4 rounded-2xl"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text className="text-textSecondary text-xs mb-1">Net</Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: totalIncome - totalExpense >= 0 ? '#10B981' : '#EF4444',
              }}
            >
              {totalIncome - totalExpense >= 0 ? '+' : '-'}
              {currency.symbol}
              {Math.abs(totalIncome - totalExpense).toFixed(0)}
            </Text>
            <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
              {totalIncome - totalExpense >= 0 ? 'saved' : 'deficit'}
            </Text>
          </View>
        </View>

        {/* ── Bar Chart ─────────────────────────────────────────────────────── */}
        <View
          className="bg-white p-5 rounded-2xl"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-textPrimary font-semibold text-base">Spending Trend</Text>
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <View className="flex-row items-center" style={{ gap: 4 }}>
                <View
                  style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }}
                />
                <Text className="text-textSecondary" style={{ fontSize: 11 }}>
                  Expense
                </Text>
              </View>
              <View className="flex-row items-center" style={{ gap: 4 }}>
                <View
                  style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }}
                />
                <Text className="text-textSecondary" style={{ fontSize: 11 }}>
                  Income
                </Text>
              </View>
            </View>
          </View>

          {!hasAnyData ? (
            <View className="py-10 items-center">
              <Text className="text-3xl mb-2">📭</Text>
              <Text className="text-textSecondary text-sm">No data for this period</Text>
            </View>
          ) : (
            <>
              {/* Bars */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  height: BAR_AREA_HEIGHT,
                  gap: 3,
                }}
              >
                {visibleBars.map((bar, i) => {
                  const expenseH = (bar.expense / maxBarValue) * 100;
                  const incomeH = (bar.income / maxBarValue) * 100;
                  return (
                    <View
                      key={i}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        height: BAR_AREA_HEIGHT,
                        gap: 2,
                        flexDirection: 'row',
                      }}
                    >
                      {/* Expense bar */}
                      <View
                        style={{ flex: 1, justifyContent: 'flex-end', height: BAR_AREA_HEIGHT }}
                      >
                        <AnimatedBar
                          heightPercent={Math.max(expenseH, bar.expense > 0 ? 2 : 0)}
                          color="#EF4444"
                          maxHeightPx={BAR_AREA_HEIGHT}
                        />
                      </View>
                      {/* Income bar */}
                      <View
                        style={{ flex: 1, justifyContent: 'flex-end', height: BAR_AREA_HEIGHT }}
                      >
                        <AnimatedBar
                          heightPercent={Math.max(incomeH, bar.income > 0 ? 2 : 0)}
                          color="#10B981"
                          maxHeightPx={BAR_AREA_HEIGHT}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* X-axis labels */}
              <View style={{ flexDirection: 'row', marginTop: 6, gap: 3 }}>
                {visibleBars.map((bar, i) => (
                  <View key={i} style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9, color: '#94A3B8', textAlign: 'center' }}>
                      {bar.label}
                    </Text>
                  </View>
                ))}
              </View>

              <Text className="text-textSecondary text-xs text-center mt-2">{periodLabel}</Text>
            </>
          )}
        </View>

        {/* ── Category Breakdown ────────────────────────────────────────────── */}
        <View
          className="bg-white p-5 rounded-2xl"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          {/* Tab toggle */}
          <View className="flex-row bg-background rounded-xl p-1 mb-5" style={{ gap: 4 }}>
            {(['expenses', 'income'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor:
                    activeTab === tab
                      ? tab === 'expenses'
                        ? '#EF4444'
                        : '#10B981'
                      : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontWeight: '600',
                    fontSize: 13,
                    color: activeTab === tab ? 'white' : '#64748B',
                    textTransform: 'capitalize',
                  }}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeCategoryData.length === 0 ? (
            <View className="py-10 items-center">
              <Text className="text-4xl mb-2">{activeTab === 'expenses' ? '💸' : '💰'}</Text>
              <Text className="text-textSecondary text-sm">No {activeTab} in this period</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 16 }}>
              {/* Donut chart */}
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <DonutChart data={activeCategoryData} colors={activeColors} size={130} />
              </View>

              {/* Category list */}
              <View style={{ flex: 1, gap: 10 }}>
                {activeCategoryData.slice(0, 5).map((cat, i) => (
                  <View key={cat.name}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: activeColors[i % activeColors.length],
                          }}
                        />
                        <Text style={{ fontSize: 12, color: '#1E293B', flex: 1 }} numberOfLines={1}>
                          {cat.icon} {cat.name}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B' }}>
                        {cat.percentage.toFixed(0)}%
                      </Text>
                    </View>
                    {/* Progress bar */}
                    <View
                      style={{
                        height: 4,
                        backgroundColor: '#F1F5F9',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          height: '100%',
                          width: `${cat.percentage}%`,
                          backgroundColor: activeColors[i % activeColors.length],
                          borderRadius: 2,
                        }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Full list if more than 5 */}
          {activeCategoryData.length > 5 && (
            <View
              style={{
                marginTop: 16,
                borderTopWidth: 1,
                borderTopColor: '#F1F5F9',
                paddingTop: 16,
                gap: 8,
              }}
            >
              {activeCategoryData.slice(5).map((cat, i) => (
                <View
                  key={cat.name}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                    <Text style={{ fontSize: 13, color: '#475569' }}>{cat.name}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E293B' }}>
                      {currency.symbol}
                      {cat.amount.toFixed(0)}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#94A3B8' }}>
                      {cat.percentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Insights ──────────────────────────────────────────────────────── */}
        {hasAnyData && (
          <View
            className="bg-white p-5 rounded-2xl"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text className="text-textPrimary font-semibold text-base mb-4">💡 Insights</Text>

            <View style={{ gap: 10 }}>
              {/* Avg daily spending */}
              {totalExpense > 0 && (
                <View className="bg-background p-4 rounded-xl">
                  <Text style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>
                    Avg Daily Spending
                  </Text>
                  <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1E293B' }}>
                    {currency.symbol}
                    {(totalExpense / daysInPeriod).toFixed(2)}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>per day</Text>
                </View>
              )}

              {/* Biggest expense category */}
              {expenseCategoryData[0] && (
                <View className="bg-background p-4 rounded-xl">
                  <Text style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>
                    Top Expense Category
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1E293B' }}>
                    {expenseCategoryData[0].icon} {expenseCategoryData[0].name}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#EF4444', marginTop: 2 }}>
                    {currency.symbol}
                    {expenseCategoryData[0].amount.toFixed(2)} ·{' '}
                    {expenseCategoryData[0].percentage.toFixed(0)}% of spending
                  </Text>
                </View>
              )}

              {/* Largest single transaction */}
              {largestExpense && (
                <View className="bg-background p-4 rounded-xl">
                  <Text style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>
                    Largest Single Expense
                  </Text>
                  <Text
                    style={{ fontSize: 16, fontWeight: '600', color: '#1E293B' }}
                    numberOfLines={1}
                  >
                    {largestExpense.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#EF4444', marginTop: 2 }}>
                    {currency.symbol}
                    {Math.abs(largestExpense.amount).toFixed(2)} ·{' '}
                    {new Date(largestExpense.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              )}

              {/* Period-over-period comparison */}
              {expenseChange !== null && (
                <View
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: expenseChange <= 0 ? '#ECFDF5' : '#FEF2F2',
                  }}
                >
                  <Text style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>
                    vs Previous Period
                  </Text>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      color: expenseChange <= 0 ? '#10B981' : '#EF4444',
                    }}
                  >
                    {expenseChange <= 0 ? '🎉' : '⚠️'}{' '}
                    {expenseChange <= 0 ? 'Spending down' : 'Spending up'}{' '}
                    {Math.abs(expenseChange).toFixed(0)}%
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                    {expenseChange <= 0
                      ? `You saved ${currency.symbol}${(prevExpense - totalExpense).toFixed(0)} compared to last ${selectedPeriod}`
                      : `You spent ${currency.symbol}${(totalExpense - prevExpense).toFixed(0)} more than last ${selectedPeriod}`}
                  </Text>
                </View>
              )}

              {/* Savings rate */}
              {totalIncome > 0 && (
                <View className="bg-background p-4 rounded-xl">
                  <Text style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>
                    Savings Rate
                  </Text>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: 'bold',
                      color: totalIncome > totalExpense ? '#10B981' : '#EF4444',
                    }}
                  >
                    {totalIncome > 0
                      ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(0)
                      : '0'}
                    %
                  </Text>
                  <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                    of income saved this {selectedPeriod}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Global empty state ────────────────────────────────────────────── */}
        {!hasAnyData && (
          <View className="bg-white p-10 rounded-2xl items-center" style={{ gap: 8 }}>
            <Text style={{ fontSize: 48 }}>📭</Text>
            <Text
              style={{ fontSize: 16, fontWeight: '600', color: '#1E293B', textAlign: 'center' }}
            >
              No transactions yet
            </Text>
            <Text style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>
              Add some transactions to see your spending analysis here.
            </Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </View>
    </ScrollView>
  );
}
