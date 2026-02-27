// screens/AddTransactionScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES, Category } from '../types';
import { useTransactions } from '../contexts/TransactionContext';
import { useWallets } from '../contexts/WalletContext';
import { useGoals } from '../contexts/GoalContext';
import { useSettings } from '../contexts/SettingsContext';
import CategoryPicker from '../components/CategoryPicker';
import WalletPicker from '../components/WalletPicker';
import TransferToPicker from '../components/TransferToPicker';
import DatePickerField from '../components/DatePicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FullTransactionType = TransactionType | 'transfer';

export default function AddTransactionScreen() {
  const navigation = useNavigation();
  const { addTransaction } = useTransactions();
  const { wallets } = useWallets();
  const { goals } = useGoals();
  const { currency } = useSettings();
  const amountInputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<FullTransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [toWalletId, setToWalletId] = useState<string>('');
  const [toGoalId, setToGoalId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    if (wallets.length > 0 && !selectedWallet) {
      setSelectedWallet(wallets[0].name);
    }
  }, [wallets]);

  const getAmountParts = () => {
    if (!amount) return { dollars: '', cents: '.00', hasDecimal: false };
    const parts = amount.split('.');
    const dollars = parts[0];
    const cents = parts[1];
    if (cents !== undefined) {
      const centDisplay = cents.padEnd(3, '0').slice(0, 2);
      return { dollars, cents: '.' + centDisplay, hasDecimal: true };
    }
    return { dollars, cents: '.00', hasDecimal: false };
  };

  const displayAmount = getAmountParts();
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const isValid = (() => {
    const baseValid =
      title.trim() !== '' && amount !== '' && parseFloat(amount) > 0 && selectedWallet !== '';
    if (type === 'transfer') {
      return baseValid && (toWalletId !== '' || toGoalId !== '');
    }
    return baseValid && selectedCategory !== null;
  })();

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setType('expense');
    setSelectedCategory(null);
    setSelectedWallet(wallets.length > 0 ? wallets[0].name : '');
    setToWalletId('');
    setToGoalId('');
    setNotes('');
    setDate(new Date());
  };

  const handleTypeChange = (newType: FullTransactionType) => {
    setType(newType);
    setSelectedCategory(null);
    setToWalletId('');
    setToGoalId('');
  };

  const handleSave = async () => {
    if (!isValid) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (wallets.length === 0) {
      Alert.alert('No Wallets', 'Please create a wallet first in the Wallets screen.');
      return;
    }

    // Prevent transferring to the same wallet
    if (type === 'transfer' && toWalletId) {
      const fromWallet = wallets.find(w => w.name === selectedWallet);
      if (fromWallet?.id === toWalletId) {
        Alert.alert('Invalid Transfer', 'Cannot transfer to the same wallet.');
        return;
      }
    }

    try {
      const numericAmount = parseFloat(amount);
      // Transfers and expenses go out as negative, income as positive
      const finalAmount = type === 'expense' ? -numericAmount : numericAmount;

      await addTransaction({
        title: title.trim(),
        amount: type === 'transfer' ? numericAmount : finalAmount,
        type: type === 'transfer' ? 'transfer' : type,
        category: type === 'transfer' ? 'Transfer' : selectedCategory?.name || '',
        date: date.toISOString(),
        wallet: selectedWallet,
        notes,
        ...(type === 'transfer' && toWalletId ? { toWalletId } : {}),
        ...(type === 'transfer' && toGoalId ? { toGoalId } : {}),
      });

      resetForm();

      Alert.alert('Success', 'Transaction saved! ✅', [
        { text: 'Add Another' },
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      {/* Header */}
      <View
        className="bg-primary px-6 py-4 border-b border-border"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-white text-lg">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-semibold">Add Transaction</Text>
          <View style={{ width: 60 }} />
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Amount Input */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => amountInputRef.current?.focus()}
          className="bg-white px-6 py-8 items-center"
        >
          <Text className="text-textSecondary text-sm mb-2">Amount</Text>
          <View className="flex-row items-center justify-center">
            <Text className="text-5xl font-bold text-textSecondary mr-1">{currency.symbol}</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                ref={amountInputRef}
                value={amount}
                onChangeText={setAmount}
                placeholder=""
                keyboardType="decimal-pad"
                style={{ position: 'absolute', opacity: 0, width: 200, height: '100%' }}
                autoFocus
              />
              <View className="flex-row items-baseline">
                <Text className="text-5xl font-bold text-textPrimary">
                  {displayAmount.dollars || '0'}
                </Text>
                <Text
                  className={`text-5xl font-bold ${
                    displayAmount.hasDecimal ? 'text-textPrimary' : 'text-textSecondary/40'
                  }`}
                >
                  {displayAmount.cents}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Description */}
        <View className="px-6 py-4">
          <Text className="text-textSecondary text-sm mb-3">
            Description <Text className="text-expense">*</Text>
          </Text>
          <View className="bg-white rounded-2xl p-4">
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={
                type === 'transfer'
                  ? 'e.g., Move to vacation fund...'
                  : 'e.g., Lunch at Subway, Monthly salary...'
              }
              placeholderTextColor="#94A3B8"
              className="text-textPrimary text-base"
              style={{ minHeight: 44 }}
            />
          </View>
        </View>

        {/* Type Toggle */}
        <View className="px-6 py-4">
          <Text className="text-textSecondary text-sm mb-3">Type</Text>
          <View className="bg-white rounded-2xl p-2 flex-row gap-2">
            <TouchableOpacity
              onPress={() => handleTypeChange('expense')}
              className={`flex-1 py-4 rounded-xl ${type === 'expense' ? 'bg-expense' : 'bg-transparent'}`}
            >
              <Text
                className={`text-center font-semibold text-base ${
                  type === 'expense' ? 'text-white' : 'text-textSecondary'
                }`}
              >
                Expense
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleTypeChange('income')}
              className={`flex-1 py-4 rounded-xl ${type === 'income' ? 'bg-income' : 'bg-transparent'}`}
            >
              <Text
                className={`text-center font-semibold text-base ${
                  type === 'income' ? 'text-white' : 'text-textSecondary'
                }`}
              >
                Income
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleTypeChange('transfer')}
              className={`flex-1 py-4 rounded-xl ${type === 'transfer' ? 'bg-primary' : 'bg-transparent'}`}
            >
              <Text
                className={`text-center font-semibold text-base ${
                  type === 'transfer' ? 'text-white' : 'text-textSecondary'
                }`}
              >
                ⇄ Transfer
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Picker — hidden for transfers */}
        {type !== 'transfer' && (
          <CategoryPicker
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        )}

        {/* From Wallet */}
        <WalletPicker
          label={type === 'transfer' ? 'From' : 'Wallet'}
          selectedWallet={selectedWallet}
          onSelectWallet={setSelectedWallet}
        />

        {/* To Picker — only for transfers */}
        {type === 'transfer' && (
          <TransferToPicker
            selectedWalletId={toWalletId}
            selectedGoalId={toGoalId}
            excludeWalletName={selectedWallet}
            onSelectWallet={id => setToWalletId(id)}
            onSelectGoal={id => setToGoalId(id)}
          />
        )}

        {/* Date Picker */}
        <DatePickerField date={date} onDateChange={setDate} />

        {/* Notes */}
        <View className="px-6 py-4">
          <Text className="text-textSecondary text-sm mb-3">Notes (Optional)</Text>
          <View className="bg-white rounded-2xl p-4">
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add additional notes..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              className="text-textPrimary text-base"
              style={{ minHeight: 80 }}
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View className="bg-white px-6 py-4 border-t border-border">
        <TouchableOpacity
          onPress={handleSave}
          disabled={!isValid}
          className={`py-4 rounded-2xl ${isValid ? 'bg-primary' : 'bg-border'}`}
        >
          <Text
            className={`text-center font-semibold text-lg ${
              isValid ? 'text-white' : 'text-textSecondary'
            }`}
          >
            {type === 'transfer' ? 'Save Transfer' : 'Save Transaction'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
