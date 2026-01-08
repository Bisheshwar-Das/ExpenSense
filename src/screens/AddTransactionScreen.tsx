// screens/AddTransactionScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  TransactionType,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  Category,
} from '../types';
import { useTransactions } from '../contexts/TransactionContext';
import CategoryPicker from '../components/CategoryPicker';
import WalletPicker from '../components/WalletPicker';
import DatePickerField from '../components/DatePicker';

export default function AddTransactionScreen() {
  const navigation = useNavigation();
  const { addTransaction } = useTransactions();

  // Form state
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string>('Main Wallet');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());

  // Get categories based on type
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  // Validation
  const isValid = amount !== '' && parseFloat(amount) > 0 && selectedCategory !== null;

  const handleSave = async () => {
    if (!isValid) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      // Format the amount based on type
      const numericAmount = parseFloat(amount);
      const finalAmount = type === 'expense' ? -numericAmount : numericAmount;

      // Save transaction using Context
      await addTransaction({
        title: selectedCategory?.name || 'Transaction',
        amount: finalAmount,
        type,
        category: selectedCategory?.name || '',
        date: date.toISOString(),
        wallet: selectedWallet,
        notes,
      });

      // Success feedback
      Alert.alert('Success', 'Transaction saved! ✅', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-border">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-primary text-lg">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-textPrimary text-xl font-semibold">
            Add Transaction
          </Text>
          <View style={{ width: 60 }} />
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Amount Input - BIG and centered */}
        <View className="bg-white px-6 py-8 items-center">
          <Text className="text-textSecondary text-sm mb-2">Amount</Text>
          <View className="flex-row items-center">
            <Text className="text-4xl text-textSecondary mr-2">$</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              className="text-5xl font-bold text-textPrimary"
              style={{ minWidth: 150 }}
              autoFocus
            />
          </View>
        </View>

        {/* Type Toggle */}
        <View className="px-6 py-4">
          <Text className="text-textSecondary text-sm mb-3">Type</Text>
          <View className="bg-white rounded-2xl p-2 flex-row gap-2">
            <TouchableOpacity
              onPress={() => {
                setType('expense');
                setSelectedCategory(null);
              }}
              className={`flex-1 py-4 rounded-xl ${
                type === 'expense' ? 'bg-expense' : 'bg-transparent'
              }`}
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
              onPress={() => {
                setType('income');
                setSelectedCategory(null);
              }}
              className={`flex-1 py-4 rounded-xl ${
                type === 'income' ? 'bg-income' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-center font-semibold text-base ${
                  type === 'income' ? 'text-white' : 'text-textSecondary'
                }`}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Picker Component */}
        <CategoryPicker
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Wallet Picker Component */}
        <WalletPicker
          selectedWallet={selectedWallet}
          onSelectWallet={setSelectedWallet}
        />

        {/* Date Picker Component */}
        <DatePickerField
          date={date}
          onDateChange={setDate}
        />

        {/* Notes */}
        <View className="px-6 py-4">
          <Text className="text-textSecondary text-sm mb-3">
            Notes (Optional)
          </Text>
          <View className="bg-white rounded-2xl p-4">
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add a note..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={3}
              className="text-textPrimary text-base"
              style={{ minHeight: 80 }}
            />
          </View>
        </View>

        {/* Spacer for button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button - Fixed at bottom */}
      <View className="bg-white px-6 py-4 border-t border-border">
        <TouchableOpacity
          onPress={handleSave}
          disabled={!isValid}
          className={`py-4 rounded-2xl ${
            isValid ? 'bg-primary' : 'bg-border'
          }`}
        >
          <Text
            className={`text-center font-semibold text-lg ${
              isValid ? 'text-white' : 'text-textSecondary'
            }`}
          >
            Save Transaction
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}