// components/GoalModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Goal, GoalType, EXPENSE_CATEGORIES } from '../types';
import { useGoals } from '../contexts/GoalContext';

interface GoalModalProps {
  visible: boolean;
  onClose: () => void;
  editGoal: Goal | null;
  defaultType: 'savings' | 'budget';
}

const GOAL_ICONS = [
  '💰',
  '🎯',
  '🏠',
  '🚗',
  '✈️',
  '🎓',
  '💍',
  '📱',
  '🎮',
  '🍔',
  '💻',
  '🏖️',
  '🎸',
  '👟',
  '🐾',
];
const GOAL_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

// Minimum deadline — tomorrow
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

export default function GoalModal({ visible, onClose, editGoal, defaultType }: GoalModalProps) {
  const { addGoal, updateGoal } = useGoals();

  const [type, setType] = useState<GoalType>(defaultType);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [category, setCategory] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [selectedIcon, setSelectedIcon] = useState(GOAL_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(GOAL_COLORS[0]);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (editGoal) {
      setType(editGoal.type);
      setName(editGoal.name);
      setTargetAmount(editGoal.targetAmount.toString());
      setCategory(editGoal.category || '');
      setPeriod(editGoal.period || 'monthly');
      setSelectedIcon(editGoal.icon);
      setSelectedColor(editGoal.color);
      setDeadline(editGoal.deadline ? new Date(editGoal.deadline) : undefined);
    } else {
      resetForm();
      setType(defaultType);
    }
  }, [editGoal, visible, defaultType]);

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setCategory('');
    setPeriod('monthly');
    setSelectedIcon(GOAL_ICONS[0]);
    setSelectedColor(GOAL_COLORS[0]);
    setDeadline(undefined);
    setShowDatePicker(false);
  };

  const formatDeadline = (date: Date) => {
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const formatted = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (diffDays <= 14) return `${formatted} · 🔴 ${diffDays} days left`;
    if (diffDays <= 30) return `${formatted} · 🟡 ${diffDays} days left`;
    const weeks = Math.ceil(diffDays / 7);
    return `${formatted} · 🟢 ${weeks} weeks away`;
  };

  const handleSave = async () => {
    if (type === 'savings' && !name.trim()) {
      Alert.alert('Missing Info', 'Please enter a goal name');
      return;
    }
    if (type === 'savings' && !deadline) {
      Alert.alert(
        'Missing Deadline',
        'Please set a target date so we can calculate how much you need to save each week.'
      );
      return;
    }
    if (type === 'budget' && !category) {
      Alert.alert('Missing Info', 'Please select a category');
      return;
    }
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      Alert.alert('Missing Info', 'Please enter a valid target amount');
      return;
    }

    try {
      const goalData = {
        type,
        name: type === 'savings' ? name.trim() : `${category} Budget`,
        targetAmount: parseFloat(targetAmount),
        currentAmount: 0, // always 0 — derived from transfers in UI
        ...(type === 'savings' && deadline ? { deadline: deadline.toISOString() } : {}),
        ...(type === 'budget' && { category, period }),
        icon: selectedIcon,
        color: selectedColor,
      };

      if (editGoal) {
        await updateGoal(editGoal.id, goalData);
        Alert.alert('Success', 'Goal updated!');
      } else {
        await addGoal(goalData);
        Alert.alert('Success', 'Goal created!');
      }

      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save goal');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[90%]">
          {/* Header */}
          <View className="px-6 py-4 border-b border-border flex-row justify-between items-center">
            <Text className="text-textPrimary text-xl font-semibold">
              {editGoal ? 'Edit Goal' : 'New Goal'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-primary text-lg font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="px-6 py-4">
            {/* Type Toggle — new goals only */}
            {!editGoal && (
              <View className="mb-6">
                <Text className="text-textSecondary text-sm mb-3">Goal Type</Text>
                <View className="bg-background rounded-2xl p-2 flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setType('savings')}
                    className={`flex-1 py-3 rounded-xl ${type === 'savings' ? 'bg-primary' : 'bg-transparent'}`}
                  >
                    <Text
                      className={`text-center font-semibold ${type === 'savings' ? 'text-white' : 'text-textSecondary'}`}
                    >
                      💰 Savings
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setType('budget')}
                    className={`flex-1 py-3 rounded-xl ${type === 'budget' ? 'bg-primary' : 'bg-transparent'}`}
                  >
                    <Text
                      className={`text-center font-semibold ${type === 'budget' ? 'text-white' : 'text-textSecondary'}`}
                    >
                      📊 Budget
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Goal Name (savings) */}
            {type === 'savings' && (
              <View className="mb-4">
                <Text className="text-textSecondary text-sm mb-3">
                  Goal Name <Text className="text-expense">*</Text>
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., New MacBook, Vacation, iPhone..."
                  placeholderTextColor="#94A3B8"
                  className="bg-background rounded-2xl p-4 text-textPrimary"
                />
              </View>
            )}

            {/* Category (budget) */}
            {type === 'budget' && (
              <View className="mb-4">
                <Text className="text-textSecondary text-sm mb-3">
                  Category <Text className="text-expense">*</Text>
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row -mx-1"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat.name}
                      onPress={() => setCategory(cat.name)}
                      className={`mx-1 px-4 py-3 rounded-xl ${category === cat.name ? 'bg-primary' : 'bg-background'}`}
                    >
                      <Text className={category === cat.name ? 'text-white' : 'text-textPrimary'}>
                        {cat.icon} {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Target Amount */}
            <View className="mb-4">
              <Text className="text-textSecondary text-sm mb-3">
                {type === 'savings' ? 'Target Amount' : 'Budget Limit'}{' '}
                <Text className="text-expense">*</Text>
              </Text>
              <View className="bg-background rounded-2xl p-4 flex-row items-center">
                <Text className="text-textPrimary text-lg mr-2">$</Text>
                <TextInput
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#94A3B8"
                  className="flex-1 text-textPrimary text-lg"
                />
              </View>
            </View>

            {/* Deadline — required for savings */}
            {type === 'savings' && (
              <View className="mb-4">
                <Text className="text-textSecondary text-sm mb-3">
                  Achieve By <Text className="text-expense">*</Text>
                  <Text className="text-textSecondary text-xs">
                    {' '}
                    — needed to calculate weekly savings
                  </Text>
                </Text>

                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className={`rounded-2xl p-4 flex-row items-center justify-between ${
                    deadline
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-background border-2 border-dashed border-border'
                  }`}
                >
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-3">{deadline ? '📅' : '📆'}</Text>
                    <Text
                      className={deadline ? 'text-textPrimary font-medium' : 'text-textSecondary'}
                    >
                      {deadline ? formatDeadline(deadline) : 'Set a target date'}
                    </Text>
                  </View>
                  {deadline && (
                    <TouchableOpacity
                      onPress={e => {
                        e.stopPropagation();
                        setDeadline(undefined);
                      }}
                      className="ml-2"
                    >
                      <Text className="text-textSecondary text-lg">✕</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={deadline || tomorrow()}
                    mode="date"
                    minimumDate={tomorrow()}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (selectedDate) setDeadline(selectedDate);
                    }}
                  />
                )}
              </View>
            )}

            {/* Period (budget only) */}
            {type === 'budget' && (
              <View className="mb-4">
                <Text className="text-textSecondary text-sm mb-3">Period</Text>
                <View className="bg-background rounded-2xl p-2 flex-row gap-2">
                  {(['weekly', 'monthly', 'yearly'] as const).map(p => (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setPeriod(p)}
                      className={`flex-1 py-3 rounded-xl ${period === p ? 'bg-primary' : 'bg-transparent'}`}
                    >
                      <Text
                        className={`text-center font-medium capitalize ${period === p ? 'text-white' : 'text-textSecondary'}`}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Icon Picker */}
            <View className="mb-4">
              <Text className="text-textSecondary text-sm mb-3">Icon</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row -mx-1"
              >
                {GOAL_ICONS.map(icon => (
                  <TouchableOpacity
                    key={icon}
                    onPress={() => setSelectedIcon(icon)}
                    className={`mx-1 w-12 h-12 rounded-xl items-center justify-center ${
                      selectedIcon === icon ? 'bg-primary' : 'bg-background'
                    }`}
                  >
                    <Text className="text-2xl">{icon}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Color Picker */}
            <View className="mb-6">
              <Text className="text-textSecondary text-sm mb-3">Color</Text>
              <View className="flex-row flex-wrap gap-2">
                {GOAL_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    className="w-12 h-12 rounded-xl items-center justify-center"
                    style={{ backgroundColor: color }}
                  >
                    {selectedColor === color && <Text className="text-white text-xl">✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Save Button */}
          <View className="px-6 py-4 border-t border-border">
            <TouchableOpacity onPress={handleSave} className="bg-primary py-4 rounded-2xl">
              <Text className="text-white text-center font-semibold text-lg">
                {editGoal ? 'Save Changes' : 'Create Goal'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
