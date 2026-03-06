// src/components/SavingsGoalModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Goal } from '../types';
import { useSavings } from '../contexts/SavingsContext';
import { useSettings } from '../contexts/SettingsContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SAVINGS_ICONS = ['💰', '✈️', '🏠', '🚗', '🏖️', '💍', '🎓', '📱', '🎮', '🎸'];
const SAVINGS_COLORS = [
  '#22C55E',
  '#10B981',
  '#14B8A6',
  '#0891B2',
  '#06B6D4',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F97316',
];

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

interface SavingsGoalModalProps {
  visible: boolean;
  onClose: () => void;
  editGoal?: Goal | null;
}

export default function SavingsGoalModal({ visible, onClose, editGoal }: SavingsGoalModalProps) {
  const { addSavingsGoal, updateSavingsGoal } = useSavings();
  const { currency } = useSettings();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('💰');
  const [selectedColor, setSelectedColor] = useState('#22C55E');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(tomorrow());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editGoal && editGoal.type === 'savings') {
      setName(editGoal.name);
      setTargetAmount(editGoal.targetAmount.toString());
      setSelectedIcon(editGoal.icon);
      setSelectedColor(editGoal.color);
      if (editGoal.deadline) {
        setDeadline(new Date(editGoal.deadline));
        setTempDate(new Date(editGoal.deadline));
      }
    } else {
      resetForm();
    }
  }, [editGoal, visible]);

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setSelectedIcon('💰');
    setSelectedColor('#22C55E');
    setDeadline(null);
    setTempDate(tomorrow());
    setShowDatePicker(false);
  };

  const formatDeadlineDisplay = (date: Date) => {
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const formatted = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (diffDays <= 14) return `${formatted} · 🔴 ${diffDays} days`;
    if (diffDays <= 30) return `${formatted} · 🟡 ${diffDays} days`;
    const weeks = Math.ceil(diffDays / 7);
    return `${formatted} · 🟢 ${weeks} weeks`;
  };

  const handleDateChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setTempDate(selectedDate);
      if (Platform.OS === 'android') {
        setDeadline(selectedDate);
      }
    }
  };

  const handleDateConfirm = () => {
    setDeadline(tempDate);
    setShowDatePicker(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a goal name');
      return;
    }

    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }

    if (!deadline) {
      Alert.alert('Error', 'Please set a deadline');
      return;
    }

    setIsLoading(true);
    try {
      const goalData: Omit<Goal, 'id' | 'createdAt'> = {
        type: 'savings',
        name: name.trim(),
        targetAmount: parseFloat(targetAmount),
        deadline: deadline.toISOString(),
        icon: selectedIcon,
        color: selectedColor,
      };

      if (editGoal) {
        await updateSavingsGoal(editGoal.id, goalData);
      } else {
        await addSavingsGoal(goalData as any);
      }

      resetForm();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save goal. Please try again.');
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
              {editGoal ? 'Edit Savings Goal' : 'New Savings Goal'}
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
            {/* Goal Name */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
                GOAL NAME
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g., Hawaii Trip, New MacBook, Car Fund"
                placeholderTextColor="#94A3B8"
                style={{
                  backgroundColor: '#FFF',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  color: '#0F172A',
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
              />
            </View>

            {/* Target Amount */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
                TARGET AMOUNT ({currency.code})
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

            {/* Deadline */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
                DEADLINE
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setTempDate(deadline || tomorrow());
                  setShowDatePicker(true);
                }}
                style={{
                  backgroundColor: deadline ? 'rgba(34,197,94,0.1)' : '#FFF',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: deadline ? '#22C55E' : '#E2E8F0',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text
                  style={{
                    color: deadline ? '#0F172A' : '#94A3B8',
                    fontSize: 16,
                    fontWeight: deadline ? '500' : '400',
                  }}
                >
                  {deadline ? formatDeadlineDisplay(deadline) : 'Select date'}
                </Text>
                <Ionicons name="calendar" size={20} color={deadline ? '#22C55E' : '#94A3B8'} />
              </TouchableOpacity>

              {/* iOS Date Picker Modal */}
              {Platform.OS === 'ios' && (
                <Modal
                  visible={showDatePicker}
                  transparent
                  animationType="slide"
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <Pressable
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Pressable
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: '#FFF',
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                      }}
                      onPress={e => e.stopPropagation()}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingHorizontal: 24,
                          paddingVertical: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: '#E2E8F0',
                        }}
                      >
                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                          <Text style={{ color: '#64748B', fontSize: 16 }}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={{ color: '#0F172A', fontSize: 16, fontWeight: '600' }}>
                          Achieve By
                        </Text>
                        <TouchableOpacity onPress={handleDateConfirm}>
                          <Text style={{ color: '#22C55E', fontSize: 16, fontWeight: '600' }}>
                            Done
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View style={{ backgroundColor: '#FFF', paddingBottom: 24 }}>
                        <DateTimePicker
                          value={tempDate}
                          mode="date"
                          minimumDate={tomorrow()}
                          display="spinner"
                          textColor="#1E293B"
                          onChange={handleDateChange}
                        />
                      </View>
                    </Pressable>
                  </Pressable>
                </Modal>
              )}

              {/* Android Date Picker */}
              {Platform.OS === 'android' && showDatePicker && (
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  minimumDate={tomorrow()}
                  display="default"
                  onChange={handleDateChange}
                />
              )}
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
                {SAVINGS_ICONS.map(icon => (
                  <TouchableOpacity
                    key={icon}
                    onPress={() => setSelectedIcon(icon)}
                    style={{
                      width: '20%',
                      aspectRatio: 1,
                      borderRadius: 12,
                      backgroundColor: selectedIcon === icon ? '#22C55E' : '#FFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: selectedIcon === icon ? '#22C55E' : '#E2E8F0',
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
                {SAVINGS_COLORS.map(color => (
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
                backgroundColor: '#22C55E',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 16 }}>
                {isLoading ? 'Saving...' : editGoal ? 'Update' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
