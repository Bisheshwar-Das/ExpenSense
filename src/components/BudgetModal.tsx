// src/components/BudgetModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal } from '../types';
import { useBudgets } from '../contexts/BudgetContext';
import { useSettings } from '../contexts/SettingsContext';
import { useCategories } from '../contexts/CategoryContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BUDGET_ICONS = ['📊', '🍔', '🚗', '🎬', '💊', '🎓', '💼', '🛍️', '📚', '🏥'];
const BUDGET_COLORS = [
  '#8B5CF6',
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#10B981',
  '#14B8A6',
  '#0891B2',
  '#06B6D4',
  '#6366F1',
  '#EC4899',
];

interface BudgetModalProps {
  visible: boolean;
  onClose: () => void;
  editBudget?: Goal | null;
}

export default function BudgetModal({ visible, onClose, editBudget }: BudgetModalProps) {
  const { addBudget, updateBudget } = useBudgets();
  const { expenseCategories } = useCategories();
  const { currency } = useSettings();
  const insets = useSafeAreaInsets();

  const [targetAmount, setTargetAmount] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📊');
  const [selectedColor, setSelectedColor] = useState('#8B5CF6');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editBudget) {
      setTargetAmount(editBudget.targetAmount.toString());
      setSelectedIcon(editBudget.icon);
      setSelectedColor(editBudget.color);
      if (editBudget.categoryId) {
        setSelectedCategory(editBudget.categoryId);
      }
      if (editBudget.period) {
        setPeriod(editBudget.period);
      }
    } else {
      resetForm();
    }
  }, [editBudget, visible]);

  const resetForm = () => {
    setTargetAmount('');
    setSelectedIcon('📊');
    setSelectedColor('#8B5CF6');
    setSelectedCategory('');
    setPeriod('monthly');
  };

  const handleSave = async () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }

    setIsLoading(true);
    try {
      const selectedCat = expenseCategories.find(c => c.id === selectedCategory);
      const budgetName = selectedCat ? `${selectedCat.name} Budget` : 'Budget';

      const budgetData: Omit<Goal, 'id' | 'createdAt'> = {
        type: 'budget',
        name: budgetName,
        targetAmount: parseFloat(targetAmount),
        categoryId: selectedCategory,
        period,
        icon: selectedIcon,
        color: selectedColor,
      };

      if (editBudget) {
        await updateBudget(editBudget.id, budgetData);
      } else {
        await addBudget(budgetData as any);
      }

      resetForm();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save budget. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: '#F8FAFC',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            paddingTop: 20,
            maxHeight: '90%',
            paddingBottom: insets.bottom + 20,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 24,
              marginBottom: 20,
            }}
          >
            <Text style={{ color: '#0F172A', fontSize: 20, fontWeight: '800' }}>
              {editBudget ? 'Edit Budget' : 'New Budget'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ paddingHorizontal: 24 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Category Selection */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
                CATEGORY
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
                style={{ marginBottom: 4 }}
              >
                {expenseCategories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat.id)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      backgroundColor: selectedCategory === cat.id ? cat.color + '20' : '#FFF',
                      borderWidth: 1,
                      borderColor: selectedCategory === cat.id ? cat.color : '#E2E8F0',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 18, marginBottom: 2 }}>{cat.icon}</Text>
                    <Text
                      style={{
                        color: selectedCategory === cat.id ? cat.color : '#0F172A',
                        fontSize: 11,
                        fontWeight: '500',
                      }}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Budget Amount */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
                BUDGET LIMIT ({currency.code})
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FFF',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  paddingHorizontal: 12,
                }}
              >
                <Text style={{ color: '#0F172A', fontSize: 18, fontWeight: '600', marginRight: 4 }}>
                  {currency.symbol}
                </Text>
                <TextInput
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                  style={{
                    flex: 1,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    color: '#0F172A',
                    fontSize: 16,
                  }}
                />
              </View>
            </View>

            {/* Period Selection */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
                PERIOD
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['weekly', 'monthly', 'yearly'] as const).map(p => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPeriod(p)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      alignItems: 'center',
                      backgroundColor: period === p ? '#8B5CF6' : '#FFF',
                      borderWidth: 1,
                      borderColor: period === p ? '#8B5CF6' : '#E2E8F0',
                    }}
                  >
                    <Text
                      style={{
                        color: period === p ? '#FFF' : '#0F172A',
                        fontWeight: '600',
                        fontSize: 13,
                        textTransform: 'capitalize',
                      }}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Icon Selection */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
                ICON
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                {BUDGET_ICONS.map(icon => (
                  <TouchableOpacity
                    key={icon}
                    onPress={() => setSelectedIcon(icon)}
                    style={{
                      width: '20%',
                      aspectRatio: 1,
                      borderRadius: 12,
                      backgroundColor: selectedIcon === icon ? '#8B5CF6' : '#FFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: selectedIcon === icon ? '#8B5CF6' : '#E2E8F0',
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Color Selection */}
            <View style={{ marginBottom: 30 }}>
              <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
                COLOR
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                {BUDGET_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    style={{
                      width: '20%',
                      aspectRatio: 1,
                      borderRadius: 12,
                      backgroundColor: color,
                      borderWidth: 3,
                      borderColor: selectedColor === color ? '#0F172A' : 'transparent',
                    }}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              paddingHorizontal: 24,
              borderTopWidth: 1,
              borderTopColor: '#E2E8F0',
              paddingTop: 16,
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              disabled={isLoading}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: '#E2E8F0',
              }}
            >
              <Text style={{ color: '#0F172A', fontWeight: '600', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: '#8B5CF6',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 16 }}>
                {isLoading ? 'Saving...' : editBudget ? 'Update' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
