// screens/EditTransactionScreen.tsx
import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  TransactionType,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  Category,
} from '../types';
import { useTransactions } from '../contexts/TransactionContext';
import { useWallets } from '../contexts/WalletContext';
import { RootNavigationProp, EditTransactionRouteProp } from '../navigation/types';
import CategoryPicker from '../components/CategoryPicker';
import WalletPicker from '../components/WalletPicker';
import DatePickerField from '../components/DatePicker';

export default function EditTransactionScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const route = useRoute<EditTransactionRouteProp>();
  const { transactions, updateTransaction } = useTransactions();
  const { wallets } = useWallets();

  const { transactionId } = route.params;
  const transaction = transactions.find(t => t.id === transactionId);

  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());

  // Pre-fill form with transaction data
  useEffect(() => {
    if (transaction) {
      setTitle(transaction.title);
      setAmount(Math.abs(transaction.amount).toString());
      setType(transaction.type);
      setNotes(transaction.notes || '');
      setSelectedWallet(transaction.wallet);
      setDate(new Date(transaction.date));

      // Find and set category
      const categories = transaction.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
      const category = categories.find(c => c.name === transaction.category);
      setSelectedCategory(category || null);
    }
  }, [transaction]);

  if (!transaction) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-textSecondary text-lg">Transaction not found</Text>
      </View>
    );
  }

  // Parse amount for display
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

  const isValid = 
    title.trim() !== '' && 
    amount !== '' && 
    parseFloat(amount) > 0 && 
    selectedCategory !== null &&
    selectedWallet !== '';

  const handleSave = async () => {
    if (!isValid) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const numericAmount = parseFloat(amount);
      const finalAmount = type === 'expense' ? -numericAmount : numericAmount;

      await updateTransaction(transaction.id, {
        title: title.trim(),
        amount: finalAmount,
        type,
        category: selectedCategory?.name || '',
        date: date.toISOString(),
        wallet: selectedWallet,
        notes,
      });

      Alert.alert('Success', 'Transaction updated! ✅', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      
    } catch (error) {
      console.error('Error updating transaction:', error);
      Alert.alert('Error', 'Failed to update transaction. Please try again.');
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
            Edit Transaction
          </Text>
          <View style={{ width: 60 }} />
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Amount Input */}
        <View className="bg-white px-6 py-8 items-center">
          <Text className="text-textSecondary text-sm mb-2">Amount</Text>
          <View className="flex-row items-center justify-center">
            <Text className="text-5xl font-bold text-textSecondary mr-1">$</Text>
            <View className="flex-row items-baseline">
              <View style={{ position: 'relative' }}>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder=""
                  keyboardType="decimal-pad"
                  className="text-5xl font-bold text-textPrimary"
                  style={{ 
                    position: 'absolute',
                    opacity: 0,
                    width: 200,
                  }}
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
          </View>
        </View>

        {/* Title/Description Input */}
        <View className="px-6 py-4">
          <Text className="text-textSecondary text-sm mb-3">
            Description <Text className="text-expense">*</Text>
          </Text>
          <View className="bg-white rounded-2xl p-4">
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Lunch at Subway, Monthly salary, etc."
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

        <CategoryPicker
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <WalletPicker
          selectedWallet={selectedWallet}
          onSelectWallet={setSelectedWallet}
        />

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
          className={`py-4 rounded-2xl ${
            isValid ? 'bg-primary' : 'bg-border'
          }`}
        >
          <Text
            className={`text-center font-semibold text-lg ${
              isValid ? 'text-white' : 'text-textSecondary'
            }`}
          >
            Save Changes
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}