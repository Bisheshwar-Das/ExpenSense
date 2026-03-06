// src/screens/hub/BudgetsScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useBudgets } from '../../contexts/BudgetContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useCategories } from '../../contexts/CategoryContext';
import { Goal } from '../../types';
import BudgetModal from '../../components/BudgetModal';
import AppHeader from '../../components/AppHeader';

type BudgetSort = 'overspend' | 'amount' | 'name';

export default function BudgetsScreen() {
  const navigation = useNavigation<any>();
  const { budgets, deleteBudget, getBudgetProgress } = useBudgets();
  const { currency } = useSettings();
  const { getCategoryById } = useCategories();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Goal | null>(null);
  const [sortBy, setSortBy] = useState<BudgetSort>('overspend');
  const [sortAsc, setSortAsc] = useState(false);

  const handleAdd = () => {
    setEditingBudget(null);
    setModalVisible(true);
  };
  const handleEdit = (b: Goal) => {
    setEditingBudget(b);
    setModalVisible(true);
  };
  const handleDelete = (b: Goal) => {
    Alert.alert('Delete Budget', `Delete "${b.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteBudget(b.id) },
    ]);
  };

  // Summary
  const totalBudget = budgets.reduce((sum, b) => sum + b.targetAmount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + getBudgetProgress(b.id).spent, 0);
  const overCount = budgets.filter(b => getBudgetProgress(b.id).spent > b.targetAmount).length;

  const sorted = [...budgets].sort((a, b) => {
    const aP = getBudgetProgress(a.id);
    const bP = getBudgetProgress(b.id);
    let result = 0;
    if (sortBy === 'overspend') result = bP.spent / b.targetAmount - aP.spent / a.targetAmount;
    else if (sortBy === 'amount') result = a.targetAmount - b.targetAmount;
    else if (sortBy === 'name') result = a.name.localeCompare(b.name);
    return sortAsc ? -result : result;
  });

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <AppHeader
          title="Budgets"
          subtitle={`${budgets.length} ${budgets.length === 1 ? 'budget' : 'budgets'}`}
          onBack={() => navigation.goBack()}
          onEdit={handleAdd}
          editLabel="+ Add"
          hideMenu
          backgroundColor="#8B5CF6"
        />

        <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
          {/* Summary card */}
          {budgets.length > 0 && (
            <View
              style={{
                backgroundColor: '#FFF',
                borderRadius: 16,
                marginTop: 16,
                marginBottom: 16,
                overflow: 'hidden',
                shadowColor: '#8B5CF6',
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
                  This Period
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <View>
                    <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 2 }}>Budget</Text>
                    <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 16 }}>
                      {currency.symbol}
                      {totalBudget.toFixed(0)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 2 }}>Spent</Text>
                    <Text
                      style={{
                        color: totalSpent > totalBudget ? '#EF4444' : '#0F172A',
                        fontWeight: '700',
                        fontSize: 16,
                      }}
                    >
                      {currency.symbol}
                      {totalSpent.toFixed(0)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 2 }}>
                      Remaining
                    </Text>
                    <Text
                      style={{
                        color: totalBudget - totalSpent < 0 ? '#EF4444' : '#22C55E',
                        fontWeight: '700',
                        fontSize: 16,
                      }}
                    >
                      {currency.symbol}
                      {Math.abs(totalBudget - totalSpent).toFixed(0)}
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
                      width: `${Math.min((totalSpent / Math.max(totalBudget, 1)) * 100, 100)}%`,
                      backgroundColor: totalSpent > totalBudget ? '#EF4444' : '#8B5CF6',
                    }}
                  />
                </View>
              </View>
              {overCount > 0 && (
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: '#E2E8F0',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Ionicons name="warning-outline" size={14} color="#EF4444" />
                  <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>
                    {overCount} {overCount === 1 ? 'budget' : 'budgets'} over limit
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Sort bar */}
          {budgets.length > 0 && (
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
                Budgets
              </Text>
              {(['overspend', 'amount', 'name'] as BudgetSort[]).map(opt => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setSortBy(opt)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 20,
                    backgroundColor: sortBy === opt ? '#8B5CF6' : '#E2E8F0',
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
          {budgets.length === 0 ? (
            <View
              style={{
                backgroundColor: '#FFF',
                borderRadius: 16,
                padding: 32,
                alignItems: 'center',
                marginTop: 16,
              }}
            >
              <Text style={{ fontSize: 36, marginBottom: 12 }}>📊</Text>
              <Text style={{ color: '#0F172A', fontWeight: '600', fontSize: 16, marginBottom: 4 }}>
                No budgets set
              </Text>
              <Text
                style={{ color: '#64748B', fontSize: 14, textAlign: 'center', marginBottom: 16 }}
              >
                Control your spending by category
              </Text>
              <TouchableOpacity
                onPress={handleAdd}
                style={{
                  backgroundColor: '#8B5CF6',
                  borderRadius: 12,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>Create First Budget</Text>
              </TouchableOpacity>
            </View>
          ) : (
            sorted.map(budget => {
              const { spent, percentage } = getBudgetProgress(budget.id);
              const remaining = budget.targetAmount - spent;
              const isOver = spent > budget.targetAmount;
              const cat = budget.categoryId ? getCategoryById(budget.categoryId) : null;

              return (
                <TouchableOpacity
                  key={budget.id}
                  onPress={() => handleEdit(budget)}
                  onLongPress={() => handleDelete(budget)}
                  style={{
                    backgroundColor: '#FFF',
                    borderRadius: 16,
                    marginBottom: 12,
                    overflow: 'hidden',
                    shadowColor: budget.color,
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
                          backgroundColor: budget.color + '20',
                        }}
                      >
                        <Text style={{ fontSize: 22 }}>{budget.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#0F172A', fontWeight: '600', fontSize: 16 }}>
                          {cat ? cat.name : budget.name}
                        </Text>
                        <Text
                          style={{ color: '#94A3B8', fontSize: 12, textTransform: 'capitalize' }}
                        >
                          {budget.period} budget
                        </Text>
                      </View>
                      {isOver && (
                        <View
                          style={{
                            backgroundColor: 'rgba(239,68,68,0.1)',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 20,
                          }}
                        >
                          <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>
                            Over!
                          </Text>
                        </View>
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
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: isOver ? '#EF4444' : budget.color,
                        }}
                      />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#64748B', fontSize: 13 }}>
                        {currency.symbol}
                        {spent.toFixed(0)} of {currency.symbol}
                        {budget.targetAmount.toFixed(0)}
                      </Text>
                      <Text
                        style={{
                          color: isOver ? '#EF4444' : '#22C55E',
                          fontSize: 13,
                          fontWeight: '600',
                        }}
                      >
                        {isOver ? '−' : ''}
                        {currency.symbol}
                        {Math.abs(remaining).toFixed(0)} {isOver ? 'over' : 'left'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <BudgetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        editBudget={editingBudget}
      />
    </>
  );
}
