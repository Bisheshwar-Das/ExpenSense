// src/components/TransferToPicker.tsx
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallets } from '../../contexts/WalletContext';
import { useBudgets } from '../../contexts/BudgetContext';
import { useSavings } from '../../contexts/SavingsContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { useSettings } from '../../contexts/SettingsContext';
import { SAVINGS_WALLET_TYPES } from '@/types';
interface TransferToPickerProps {
  selectedWalletId: string;
  selectedGoalId: string;
  excludeWalletId: string;
  onSelectWallet: (walletId: string) => void;
  onSelectGoal: (goalId: string) => void;
}

type Step = 'destination' | 'goal';

export default function TransferToPicker({
  selectedWalletId,
  selectedGoalId,
  excludeWalletId,
  onSelectWallet,
  onSelectGoal,
}: TransferToPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState<Step>('destination');

  const { wallets } = useWallets();
  const { savingsGoals, getSavingsProgress } = useSavings();
  const { transactions } = useTransactions();
  const { currency } = useSettings();
  const insets = useSafeAreaInsets();

  const availableWallets = wallets.filter(w => w.id !== excludeWalletId);
  const selectedWallet = wallets.find(w => w.id === selectedWalletId);
  const selectedGoal = savingsGoals.find(g => g.id === selectedGoalId);
  const hasSelection = selectedWalletId !== '';
  const pendingWalletId = useRef('');

  const isSavingsWallet = (walletId: string) => {
    const w = wallets.find(w => w.id === walletId);
    return w ? SAVINGS_WALLET_TYPES.includes(w.type ?? 'checking') : false;
  };

  const handleSelectWallet = (walletId: string) => {
    pendingWalletId.current = walletId;
    onSelectWallet(walletId);
    if (isSavingsWallet(walletId) && savingsGoals.length > 0) {
      setStep('goal');
    } else {
      setModalVisible(false);
      setStep('destination');
    }
  };

  const handleSelectGoal = (goalId: string) => {
    onSelectGoal(goalId);
    setModalVisible(false);
    setStep('destination');
  };

  const handleSkipGoal = () => {
    onSelectGoal('');
    setModalVisible(false);
    setStep('destination');
  };

  const handleClose = () => {
    setModalVisible(false);
    setStep('destination');
  };

  const getDisplayLabel = () => {
    if (selectedWallet) {
      if (selectedGoal) return `${selectedWallet.name} → ${selectedGoal.name}`;
      return selectedWallet.name;
    }
    return 'Select destination';
  };

  const getDisplayIcon = () =>
    selectedGoal ? selectedGoal.icon : selectedWallet ? selectedWallet.icon : '→';
  const getDisplayColor = () => (selectedWallet ? selectedWallet.color : '#64748B');

  return (
    <View>
      <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-2">
        To{' '}
        <Text className="text-textSecondary font-normal normal-case" style={{ letterSpacing: 0 }}>
          (optional)
        </Text>
      </Text>

      <TouchableOpacity
        onPress={() => {
          setStep('destination');
          setModalVisible(true);
        }}
        activeOpacity={0.7}
        className="bg-card rounded-2xl px-4 flex-row items-center gap-3"
        style={{
          paddingVertical: 13,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 1,
        }}
      >
        <View
          className="w-7 h-7 rounded-lg items-center justify-center"
          style={{ backgroundColor: getDisplayColor() + '20' }}
        >
          <Text style={{ fontSize: 15 }}>{getDisplayIcon()}</Text>
        </View>
        <View className="flex-1">
          <Text
            className={`text-base font-medium ${hasSelection ? 'text-textPrimary' : 'text-slate-400'}`}
          >
            {getDisplayLabel()}
          </Text>
          {selectedGoal && (
            <Text className="text-textSecondary text-xs mt-0.5">
              Earmarked for {selectedGoal.name}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={16} color="#CBD5E1" />
      </TouchableOpacity>

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={handleClose}>
        <Pressable className="flex-1 bg-black/50" onPress={handleClose}>
          <Pressable
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl"
            onPress={e => e.stopPropagation()}
          >
            <View className="items-center pt-3 pb-1">
              <View className="w-8 h-1 rounded-full bg-slate-300" />
            </View>

            {/* Step 1: Destination — flat list, ALL wallet types */}
            {step === 'destination' && (
              <>
                <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
                  <Text
                    className="text-textPrimary text-lg font-bold"
                    style={{ letterSpacing: -0.3 }}
                  >
                    Transfer To
                  </Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    className="w-8 h-8 rounded-full bg-slate-200 items-center justify-center"
                  >
                    <Ionicons name="close" size={16} color="#475569" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: 420 }}
                  contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingBottom: insets.bottom + 20,
                    gap: 8,
                  }}
                >
                  {availableWallets.length === 0 ? (
                    <View className="items-center py-10">
                      <Text style={{ fontSize: 36, marginBottom: 10 }}>🏦</Text>
                      <Text className="text-slate-600 text-base font-medium">
                        No destinations available
                      </Text>
                      <Text className="text-slate-400 text-sm mt-1">Add another wallet first</Text>
                    </View>
                  ) : (
                    availableWallets.map(wallet => {
                      const isSelected = selectedWalletId === wallet.id;
                      const isSavings = isSavingsWallet(wallet.id);
                      return (
                        <TouchableOpacity
                          key={wallet.id}
                          onPress={() => handleSelectWallet(wallet.id)}
                          activeOpacity={0.65}
                          className={`flex-row items-center px-4 rounded-2xl ${isSelected ? 'bg-teal-100 border-2 border-teal-300' : 'bg-card'}`}
                          style={{ paddingVertical: 12, gap: 14 }}
                        >
                          <View
                            className="w-10 h-10 rounded-xl items-center justify-center"
                            style={{
                              backgroundColor: isSelected ? '#99F6E4' : wallet.color + '20',
                            }}
                          >
                            <Text style={{ fontSize: 21 }}>{wallet.icon}</Text>
                          </View>
                          <View className="flex-1">
                            <Text
                              className={`text-base ${isSelected ? 'text-teal-700 font-semibold' : 'text-textPrimary'}`}
                            >
                              {wallet.name}
                            </Text>
                            <Text className="text-textSecondary text-xs capitalize mt-0.5">
                              {wallet.type ?? 'checking'} wallet
                              {isSavings && savingsGoals.length > 0 && ' · can link to goal'}
                            </Text>
                          </View>
                          {isSelected ? (
                            <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                              <Ionicons name="checkmark" size={13} color="#fff" />
                            </View>
                          ) : isSavings && savingsGoals.length > 0 ? (
                            <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
                          ) : null}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </>
            )}

            {/* Step 2: Goal — optional, always skippable */}
            {step === 'goal' && (
              <>
                <View className="flex-row items-center justify-between px-6 pt-2 pb-2">
                  <TouchableOpacity
                    onPress={() => setStep('destination')}
                    className="w-8 h-8 rounded-full bg-slate-200 items-center justify-center"
                  >
                    <Ionicons name="chevron-back" size={16} color="#475569" />
                  </TouchableOpacity>
                  <View className="items-center">
                    <Text
                      className="text-textPrimary text-lg font-bold"
                      style={{ letterSpacing: -0.3 }}
                    >
                      Which Goal?
                    </Text>
                    <Text className="text-textSecondary text-xs mt-0.5">
                      Saving toward something specific?
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleSkipGoal}>
                    <Text className="text-primary text-sm font-semibold">Skip</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: 420 }}
                  contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingBottom: insets.bottom + 20,
                    gap: 8,
                    paddingTop: 8,
                  }}
                >
                  {/* No specific goal — first option, most prominent */}
                  <TouchableOpacity
                    onPress={handleSkipGoal}
                    activeOpacity={0.65}
                    className={`flex-row items-center px-4 rounded-2xl ${hasSelection && !selectedGoalId ? 'bg-teal-100 border-2 border-teal-300' : 'bg-card'}`}
                    style={{ paddingVertical: 12, gap: 14 }}
                  >
                    <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center">
                      <Text style={{ fontSize: 21 }}>💰</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-textPrimary text-base font-medium">
                        No specific goal
                      </Text>
                      <Text className="text-textSecondary text-xs mt-0.5">
                        Just saving generally
                      </Text>
                    </View>
                    {hasSelection && !selectedGoalId && (
                      <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                        <Ionicons name="checkmark" size={13} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>

                  {savingsGoals.map(goal => {
                    const saved = getSavingsProgress(goal.id).saved;
                    const remaining = goal.targetAmount - saved;
                    const progress = Math.min((saved / goal.targetAmount) * 100, 100);
                    const isComplete = saved >= goal.targetAmount;
                    const isSelected = selectedGoalId === goal.id;
                    return (
                      <TouchableOpacity
                        key={goal.id}
                        onPress={() => handleSelectGoal(goal.id)}
                        activeOpacity={0.65}
                        className={`flex-row items-center px-4 rounded-2xl ${isSelected ? 'bg-teal-100 border-2 border-teal-300' : 'bg-card'}`}
                        style={{ paddingVertical: 12, gap: 14 }}
                      >
                        <View
                          className="w-10 h-10 rounded-xl items-center justify-center"
                          style={{ backgroundColor: isSelected ? '#99F6E4' : goal.color + '20' }}
                        >
                          <Text style={{ fontSize: 21 }}>{goal.icon}</Text>
                        </View>
                        <View className="flex-1 gap-1">
                          <Text
                            className={`text-base ${isSelected ? 'text-teal-700 font-semibold' : 'text-textPrimary'}`}
                          >
                            {goal.name}
                          </Text>
                          <View className="flex-row items-center gap-2">
                            <View className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                              <View
                                className="h-full rounded-full"
                                style={{ width: `${progress}%`, backgroundColor: goal.color }}
                              />
                            </View>
                            <Text className="text-textSecondary text-xs">
                              {isComplete
                                ? '🎉 Done'
                                : `${currency.symbol}${remaining.toFixed(0)} left`}
                            </Text>
                          </View>
                        </View>
                        {isSelected && (
                          <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                            <Ionicons name="checkmark" size={13} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
