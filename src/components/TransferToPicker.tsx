// components/TransferToPicker.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import { useWallets } from '../contexts/WalletContext';
import { useGoals } from '../contexts/GoalContext';
import { useTransactions } from '../contexts/TransactionContext';
import { useSettings } from '../contexts/SettingsContext';
import { SAVINGS_WALLET_TYPES } from '../types';

interface TransferToPickerProps {
  selectedWalletId: string;
  selectedGoalId: string;
  excludeWalletName: string;
  onSelectWallet: (walletId: string) => void;
  onSelectGoal: (goalId: string) => void;
}

type Step = 'destination' | 'goal';

export default function TransferToPicker({
  selectedWalletId,
  selectedGoalId,
  excludeWalletName,
  onSelectWallet,
  onSelectGoal,
}: TransferToPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState<Step>('destination');

  const { wallets } = useWallets();
  const { goals } = useGoals();
  const { transactions } = useTransactions();
  const { currency } = useSettings();

  const savingsGoals = goals.filter(g => g.type === 'savings');
  const availableWallets = wallets.filter(w => w.name !== excludeWalletName);

  const selectedWallet = wallets.find(w => w.id === selectedWalletId);
  const selectedGoal = goals.find(g => g.id === selectedGoalId);

  const isSavingsWallet = (walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet ? SAVINGS_WALLET_TYPES.includes(wallet.type ?? 'checking') : false;
  };

  // Derive goal progress from transactions
  const getGoalProgress = (goalId: string) => {
    return transactions
      .filter(t => t.type === 'transfer' && t.toGoalId === goalId)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleSelectWallet = (walletId: string) => {
    onSelectWallet(walletId);
    if (isSavingsWallet(walletId) && savingsGoals.length > 0) {
      setStep('goal');
    } else {
      onSelectGoal('');
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

  const getDisplayIcon = () => {
    if (selectedGoal) return selectedGoal.icon;
    if (selectedWallet) return selectedWallet.icon;
    return '→';
  };

  const getDisplayColor = () => {
    if (selectedWallet) return selectedWallet.color;
    return '#64748B';
  };

  const hasSelection = selectedWalletId !== '';

  return (
    <View className="px-6 py-4">
      <Text className="text-textSecondary text-sm mb-3">To</Text>

      <TouchableOpacity
        className="bg-white rounded-2xl p-4 flex-row items-center justify-between"
        onPress={() => {
          setStep('destination');
          setModalVisible(true);
        }}
      >
        <View className="flex-row items-center flex-1">
          <View
            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: getDisplayColor() + '20' }}
          >
            <Text className="text-xl">{getDisplayIcon()}</Text>
          </View>
          <View className="flex-1">
            <Text
              className={`font-medium text-base ${hasSelection ? 'text-textPrimary' : 'text-textSecondary'}`}
            >
              {getDisplayLabel()}
            </Text>
            {selectedGoal && (
              <Text className="text-textSecondary text-xs">Earmarked for {selectedGoal.name}</Text>
            )}
          </View>
        </View>
        <Text className="text-textSecondary">›</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleClose}
      >
        <Pressable className="flex-1 bg-black/50" onPress={handleClose}>
          <Pressable
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
            onPress={e => e.stopPropagation()}
          >
            {/* STEP 1: Pick destination wallet */}
            {step === 'destination' && (
              <>
                <View className="px-6 py-4 border-b border-border">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-textPrimary text-xl font-semibold">Transfer To</Text>
                    <TouchableOpacity onPress={handleClose}>
                      <Text className="text-primary text-lg font-medium">Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView className="max-h-96">
                  <View className="px-6 py-4">
                    {availableWallets.length === 0 ? (
                      <View className="py-8 items-center">
                        <Text className="text-4xl mb-3">🏦</Text>
                        <Text className="text-textPrimary font-medium text-base mb-2">
                          No destinations available
                        </Text>
                        <Text className="text-textSecondary text-sm text-center">
                          Add another wallet first
                        </Text>
                      </View>
                    ) : (
                      <>
                        {/* Savings wallets section */}
                        {availableWallets.filter(w =>
                          SAVINGS_WALLET_TYPES.includes(w.type ?? 'checking')
                        ).length > 0 && (
                          <>
                            <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wide mb-3">
                              Savings Wallets
                            </Text>
                            {availableWallets
                              .filter(w => SAVINGS_WALLET_TYPES.includes(w.type ?? 'checking'))
                              .map(wallet => (
                                <TouchableOpacity
                                  key={wallet.id}
                                  onPress={() => handleSelectWallet(wallet.id)}
                                  className={`flex-row items-center p-4 rounded-2xl mb-3 ${
                                    selectedWalletId === wallet.id
                                      ? 'bg-primary/10 border-2 border-primary'
                                      : 'bg-background'
                                  }`}
                                >
                                  <View
                                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                                    style={{ backgroundColor: wallet.color + '20' }}
                                  >
                                    <Text className="text-2xl">{wallet.icon}</Text>
                                  </View>
                                  <View className="flex-1">
                                    <Text className="text-textPrimary font-semibold text-base">
                                      {wallet.name}
                                    </Text>
                                    <Text className="text-textSecondary text-xs capitalize">
                                      {wallet.type ?? 'savings'} wallet
                                    </Text>
                                  </View>
                                  {savingsGoals.length > 0 && (
                                    <Text className="text-textSecondary text-xs mr-2">
                                      Pick goal ›
                                    </Text>
                                  )}
                                </TouchableOpacity>
                              ))}
                          </>
                        )}

                        {/* Other wallets section */}
                        {availableWallets.filter(
                          w => !SAVINGS_WALLET_TYPES.includes(w.type ?? 'checking')
                        ).length > 0 && (
                          <>
                            <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wide mb-3 mt-2">
                              Other Wallets
                            </Text>
                            {availableWallets
                              .filter(w => !SAVINGS_WALLET_TYPES.includes(w.type ?? 'checking'))
                              .map(wallet => (
                                <TouchableOpacity
                                  key={wallet.id}
                                  onPress={() => handleSelectWallet(wallet.id)}
                                  className={`flex-row items-center p-4 rounded-2xl mb-3 ${
                                    selectedWalletId === wallet.id
                                      ? 'bg-primary/10 border-2 border-primary'
                                      : 'bg-background'
                                  }`}
                                >
                                  <View
                                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                                    style={{ backgroundColor: wallet.color + '20' }}
                                  >
                                    <Text className="text-2xl">{wallet.icon}</Text>
                                  </View>
                                  <View className="flex-1">
                                    <Text className="text-textPrimary font-semibold text-base">
                                      {wallet.name}
                                    </Text>
                                    <Text className="text-textSecondary text-xs capitalize">
                                      {wallet.type ?? 'checking'} wallet
                                    </Text>
                                  </View>
                                  {selectedWalletId === wallet.id && (
                                    <Text className="text-primary text-2xl">✓</Text>
                                  )}
                                </TouchableOpacity>
                              ))}
                          </>
                        )}
                      </>
                    )}
                  </View>
                </ScrollView>
              </>
            )}

            {/* STEP 2: Pick goal for savings wallets */}
            {step === 'goal' && (
              <>
                <View className="px-6 py-4 border-b border-border">
                  <View className="flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => setStep('destination')}>
                      <Text className="text-primary text-lg">‹ Back</Text>
                    </TouchableOpacity>
                    <Text className="text-textPrimary text-xl font-semibold">Which Goal?</Text>
                    <TouchableOpacity onPress={handleSkipGoal}>
                      <Text className="text-textSecondary text-lg">Skip</Text>
                    </TouchableOpacity>
                  </View>
                  <Text className="text-textSecondary text-sm text-center mt-2">
                    Is this saving toward a specific goal?
                  </Text>
                </View>

                <ScrollView className="max-h-96">
                  <View className="px-6 py-4">
                    {savingsGoals.map(goal => {
                      const saved = getGoalProgress(goal.id);
                      const remaining = goal.targetAmount - saved;
                      const progress = Math.min((saved / goal.targetAmount) * 100, 100);
                      const isComplete = saved >= goal.targetAmount;

                      return (
                        <TouchableOpacity
                          key={goal.id}
                          onPress={() => handleSelectGoal(goal.id)}
                          className={`flex-row items-center p-4 rounded-2xl mb-3 ${
                            selectedGoalId === goal.id
                              ? 'bg-primary/10 border-2 border-primary'
                              : 'bg-background'
                          }`}
                        >
                          <View
                            className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                            style={{ backgroundColor: goal.color + '20' }}
                          >
                            <Text className="text-2xl">{goal.icon}</Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-textPrimary font-semibold text-base">
                              {goal.name}
                            </Text>
                            <View className="flex-row items-center gap-2 mt-1">
                              {/* Mini progress bar */}
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
                          {selectedGoalId === goal.id && (
                            <Text className="text-primary text-2xl ml-2">✓</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}

                    {/* No specific goal option */}
                    <TouchableOpacity
                      onPress={handleSkipGoal}
                      className={`flex-row items-center p-4 rounded-2xl mb-3 ${
                        hasSelection && !selectedGoalId
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-background'
                      }`}
                    >
                      <View className="w-12 h-12 rounded-xl items-center justify-center mr-3 bg-border">
                        <Text className="text-2xl">💰</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-textPrimary font-semibold text-base">
                          No specific goal
                        </Text>
                        <Text className="text-textSecondary text-xs">Just saving generally</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
