// src/screens/hub/SavingsScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSavings } from '../../contexts/SavingsContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Goal } from '../../types';
import SavingsGoalModal from '../../components/SavingsModal';
import AppHeader from '../../components/AppHeader';

type SavingsSort = 'urgency' | 'progress' | 'amount';

export default function SavingsScreen() {
  const navigation = useNavigation<any>();
  const { savingsGoals, deleteSavingsGoal, getSavingsProgress } = useSavings();
  const { currency } = useSettings();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [sortBy, setSortBy] = useState<SavingsSort>('urgency');
  const [sortAsc, setSortAsc] = useState(false);

  const handleAdd = () => {
    setEditingGoal(null);
    setModalVisible(true);
  };
  const handleEdit = (g: Goal) => {
    setEditingGoal(g);
    setModalVisible(true);
  };
  const handleDelete = (g: Goal) => {
    Alert.alert('Delete Goal', `Delete "${g.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteSavingsGoal(g.id) },
    ]);
  };

  const getRecommendation = (goal: Goal) => {
    if (!goal.deadline) return null;
    const now = new Date();
    const daysLeft = Math.ceil(
      (new Date(goal.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const { saved } = getSavingsProgress(goal.id);
    const remaining = goal.targetAmount - saved;
    if (daysLeft <= 0 || remaining <= 0) return null;
    const weeksLeft = Math.ceil(daysLeft / 7);
    const weeklyTarget = remaining / Math.max(weeksLeft, 1);
    return {
      weeklyTarget,
      monthlyTarget: weeklyTarget * 4.33,
      daysLeft,
      weeksLeft,
      isUrgent: daysLeft < 30,
      isVeryUrgent: daysLeft < 14,
    };
  };

  const urgencyConfig = (rec: NonNullable<ReturnType<typeof getRecommendation>>) => {
    if (rec.isVeryUrgent)
      return {
        color: '#EF4444',
        bgColor: 'rgba(239,68,68,0.05)',
        label: '🔴 Urgent',
        textColor: '#EF4444',
      };
    if (rec.isUrgent)
      return {
        color: '#F59E0B',
        bgColor: 'rgba(245,158,11,0.05)',
        label: '🟡 On track',
        textColor: '#D97706',
      };
    return {
      color: '#22C55E',
      bgColor: 'rgba(34,197,94,0.05)',
      label: '🟢 Plenty of time',
      textColor: '#16A34A',
    };
  };

  // Summary
  const totalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = savingsGoals.reduce((sum, g) => sum + getSavingsProgress(g.id).saved, 0);
  const activeGoals = savingsGoals.filter(g => {
    const { saved } = getSavingsProgress(g.id);
    return g.targetAmount - saved > 0 && g.deadline;
  });
  const totalWeekly = activeGoals.reduce(
    (sum, g) => sum + (getRecommendation(g)?.weeklyTarget ?? 0),
    0
  );
  const totalRemaining = activeGoals.reduce(
    (sum, g) => sum + (g.targetAmount - getSavingsProgress(g.id).saved),
    0
  );

  const sorted = [...savingsGoals].sort((a, b) => {
    const aP = getSavingsProgress(a.id);
    const bP = getSavingsProgress(b.id);
    const aComplete = aP.saved >= a.targetAmount;
    const bComplete = bP.saved >= b.targetAmount;
    if (aComplete && !bComplete) return 1;
    if (!aComplete && bComplete) return -1;
    let result = 0;
    if (sortBy === 'urgency') {
      if (!a.deadline && !b.deadline) result = 0;
      else if (!a.deadline) result = 1;
      else if (!b.deadline) result = -1;
      else result = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    } else if (sortBy === 'progress') {
      result = aP.saved / a.targetAmount - bP.saved / b.targetAmount;
    } else {
      result = a.targetAmount - b.targetAmount;
    }
    return sortAsc ? result : -result;
  });

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <AppHeader
          title="Savings Goals"
          subtitle={`${savingsGoals.length} ${savingsGoals.length === 1 ? 'goal' : 'goals'}`}
          onBack={() => navigation.goBack()}
          onEdit={handleAdd}
          editLabel="+ Add"
          hideMenu
          backgroundColor="#22C55E"
        />

        <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
          {/* Summary card */}
          {savingsGoals.length > 0 && (
            <View
              style={{
                backgroundColor: '#FFF',
                borderRadius: 16,
                marginTop: 16,
                marginBottom: 16,
                overflow: 'hidden',
                shadowColor: '#22C55E',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View style={{ padding: 16 }}>
                <Text
                  style={{
                    color: '#64748B',
                    fontSize: 11,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    marginBottom: 12,
                  }}
                >
                  Overall Progress
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <View>
                    <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 2 }}>Target</Text>
                    <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 16 }}>
                      {currency.symbol}
                      {totalTarget.toFixed(0)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 2 }}>Saved</Text>
                    <Text style={{ color: '#22C55E', fontWeight: '700', fontSize: 16 }}>
                      {currency.symbol}
                      {totalSaved.toFixed(0)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 2 }}>
                      Remaining
                    </Text>
                    <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 16 }}>
                      {currency.symbol}
                      {totalRemaining.toFixed(0)}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    height: 8,
                    backgroundColor: '#E2E8F0',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      height: '100%',
                      borderRadius: 4,
                      backgroundColor: '#22C55E',
                      width: `${Math.min((totalSaved / Math.max(totalTarget, 1)) * 100, 100)}%`,
                    }}
                  />
                </View>
              </View>
              {activeGoals.length > 0 && (
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: '#E2E8F0',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#64748B', fontSize: 12 }}>💡 Recommended to save</Text>
                  <Text style={{ color: '#22C55E', fontWeight: '700', fontSize: 13 }}>
                    {currency.symbol}
                    {totalWeekly.toFixed(0)}/week
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Sort bar */}
          {savingsGoals.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Text
                style={{
                  color: '#94A3B8',
                  fontSize: 11,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  flex: 1,
                }}
              >
                Goals
              </Text>
              {(['urgency', 'progress', 'amount'] as SavingsSort[]).map(opt => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setSortBy(opt)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 20,
                    backgroundColor: sortBy === opt ? '#22C55E' : '#E2E8F0',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '600',
                      color: sortBy === opt ? '#FFF' : '#64748B',
                      textTransform: 'capitalize',
                    }}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setSortAsc(v => !v)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: '#E2E8F0',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={sortAsc ? 'arrow-up' : 'arrow-down'} size={13} color="#64748B" />
              </TouchableOpacity>
            </View>
          )}

          {/* Empty state */}
          {savingsGoals.length === 0 ? (
            <View
              style={{
                backgroundColor: '#FFF',
                borderRadius: 16,
                padding: 32,
                alignItems: 'center',
                marginTop: 16,
              }}
            >
              <Text style={{ fontSize: 36, marginBottom: 12 }}>💰</Text>
              <Text style={{ color: '#0F172A', fontWeight: '600', fontSize: 16, marginBottom: 4 }}>
                No savings goals yet
              </Text>
              <Text
                style={{ color: '#64748B', fontSize: 14, textAlign: 'center', marginBottom: 16 }}
              >
                Set a target and track your progress
              </Text>
              <TouchableOpacity
                onPress={handleAdd}
                style={{
                  backgroundColor: '#22C55E',
                  borderRadius: 12,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>Create First Goal</Text>
              </TouchableOpacity>
            </View>
          ) : (
            sorted.map(goal => {
              const { saved } = getSavingsProgress(goal.id);
              const progress = (saved / goal.targetAmount) * 100;
              const remaining = goal.targetAmount - saved;
              const rec = getRecommendation(goal);
              const urgency = rec ? urgencyConfig(rec) : null;
              const isComplete = progress >= 100;

              return (
                <TouchableOpacity
                  key={goal.id}
                  onPress={() => handleEdit(goal)}
                  onLongPress={() => handleDelete(goal)}
                  style={{
                    backgroundColor: '#FFF',
                    borderRadius: 16,
                    marginBottom: 12,
                    overflow: 'hidden',
                    shadowColor: goal.color,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.12,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View style={{ padding: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                          backgroundColor: goal.color + '20',
                        }}
                      >
                        <Text style={{ fontSize: 22 }}>{goal.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#0F172A', fontWeight: '600', fontSize: 16 }}>
                          {goal.name}
                        </Text>
                        {goal.deadline && (
                          <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                            Due{' '}
                            {new Date(goal.deadline).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </Text>
                        )}
                      </View>
                      {urgency && !isComplete && (
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '600',
                            marginLeft: 8,
                            color: urgency.textColor,
                          }}
                        >
                          {urgency.label}
                        </Text>
                      )}
                    </View>

                    <View
                      style={{
                        height: 8,
                        backgroundColor: '#E2E8F0',
                        borderRadius: 4,
                        overflow: 'hidden',
                        marginBottom: 12,
                      }}
                    >
                      <View
                        style={{
                          height: '100%',
                          borderRadius: 4,
                          width: `${Math.min(progress, 100)}%`,
                          backgroundColor: goal.color,
                        }}
                      />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#64748B', fontSize: 13 }}>
                        {currency.symbol}
                        {saved.toFixed(0)} / {currency.symbol}
                        {goal.targetAmount.toFixed(0)}
                      </Text>
                      <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '600' }}>
                        {Math.min(progress, 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>

                  {rec && urgency && !isComplete && (
                    <View
                      style={{
                        borderTopWidth: 1,
                        borderTopColor: '#E2E8F0',
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: urgency.bgColor,
                      }}
                    >
                      <View>
                        <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 2 }}>
                          Save per week
                        </Text>
                        <Text style={{ color: urgency.textColor, fontWeight: '700', fontSize: 18 }}>
                          {currency.symbol}
                          {rec.weeklyTarget.toFixed(0)}
                        </Text>
                        <Text style={{ color: '#94A3B8', fontSize: 11 }}>
                          or {currency.symbol}
                          {rec.monthlyTarget.toFixed(0)}/mo
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 2 }}>
                          Time left
                        </Text>
                        <Text style={{ color: '#0F172A', fontWeight: '600', fontSize: 16 }}>
                          {rec.weeksLeft}w
                        </Text>
                        <Text style={{ color: '#94A3B8', fontSize: 11 }}>
                          {currency.symbol}
                          {remaining.toFixed(0)} to go
                        </Text>
                      </View>
                    </View>
                  )}

                  {isComplete && (
                    <View
                      style={{
                        borderTopWidth: 1,
                        borderTopColor: '#E2E8F0',
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        backgroundColor: 'rgba(34,197,94,0.05)',
                      }}
                    >
                      <Text style={{ color: '#22C55E', fontWeight: '600', textAlign: 'center' }}>
                        🎉 Goal reached!
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <SavingsGoalModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        editGoal={editingGoal}
      />
    </>
  );
}
