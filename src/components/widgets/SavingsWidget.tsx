// src/components/SavingsWidget.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSavings } from '../../contexts/SavingsContext';
import { useSettings } from '../../contexts/SettingsContext';

export default function SavingsWidget() {
  const navigation = useNavigation<any>();
  const { savingsGoals, getAllSavingsProgress } = useSavings();
  const { currency } = useSettings();

  if (savingsGoals.length === 0) return null;

  const savingsProgress = getAllSavingsProgress();

  // Combined savings totals
  const totalSaved = savingsProgress.reduce((sum, p) => sum + p.saved, 0);
  const totalTarget = savingsProgress.reduce((sum, p) => sum + p.goal.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  // Urgency color based on deadline
  const getUrgencyColor = (daysLeft: number | null) => {
    if (!daysLeft) return '#64748B';
    if (daysLeft < 14) return '#EF4444';
    if (daysLeft < 30) return '#F59E0B';
    return '#10B981';
  };

  return (
    <View className="px-6 pt-4 pb-2">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-textPrimary text-lg font-semibold">💰 Savings Goals</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Hub')}>
          <Text className="text-primary font-medium text-sm">View All →</Text>
        </TouchableOpacity>
      </View>

      <View
        className="bg-card rounded-2xl overflow-hidden"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 3,
        }}
      >
        {/* Combined savings summary */}
        <View className="p-4 border-b border-border">
          <View className="flex-row justify-between items-baseline mb-2">
            <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wide">
              Total Progress
            </Text>
            <Text className="text-textSecondary text-xs">
              {overallProgress.toFixed(0)}% complete
            </Text>
          </View>
          <View className="flex-row justify-between items-baseline mb-3">
            <Text className="text-income font-bold text-base">
              {currency.symbol}
              {totalSaved.toFixed(0)}
            </Text>
            <Text className="text-textSecondary text-sm">
              of {currency.symbol}
              {totalTarget.toFixed(0)} needed
            </Text>
          </View>
          <View className="h-2 bg-border rounded-full overflow-hidden">
            <View
              className="h-full rounded-full bg-income"
              style={{ width: `${Math.min(overallProgress, 100)}%` }}
            />
          </View>
        </View>

        {/* Individual goal rows */}
        <View className="p-4">
          {savingsProgress.map((p, index) => {
            const { goal, saved, percentage, daysLeft } = p;
            const isComplete = saved >= goal.targetAmount;
            const urgencyColor = getUrgencyColor(daysLeft);

            return (
              <View
                key={goal.id}
                className={`flex-row items-center ${index < savingsProgress.length - 1 ? 'mb-3' : ''}`}
              >
                <View
                  className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                  style={{ backgroundColor: goal.color + '20' }}
                >
                  <Text style={{ fontSize: 14 }}>{goal.icon}</Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-textPrimary text-sm font-medium" numberOfLines={1}>
                      {goal.name}
                    </Text>
                    <Text className="text-textSecondary text-xs ml-2">
                      {isComplete
                        ? '🎉 Done'
                        : `${currency.symbol}${saved.toFixed(0)}/${currency.symbol}${goal.targetAmount.toFixed(0)}`}
                    </Text>
                  </View>
                  <View className="h-1.5 bg-border rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: isComplete ? '#10B981' : urgencyColor,
                      }}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
