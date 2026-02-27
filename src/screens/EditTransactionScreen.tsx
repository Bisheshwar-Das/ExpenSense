// screens/EditTransactionScreen.tsx
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES, Category } from '../types';
import { useTransactions } from '../contexts/TransactionContext';
import { useWallets } from '../contexts/WalletContext';
import { useGoals } from '../contexts/GoalContext';
import { RootNavigationProp, EditTransactionRouteProp } from '../navigation/types';
import CategoryPicker from '../components/CategoryPicker';
import WalletPicker from '../components/WalletPicker';
import TransferToPicker from '../components/TransferToPicker';
import DatePickerField from '../components/DatePicker';
import { useSettings } from '../contexts/SettingsContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EditTransactionScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const route = useRoute<EditTransactionRouteProp>();
  const { transactions, updateTransaction } = useTransactions();
  const { wallets } = useWallets();
  const { goals } = useGoals();
  const { currency } = useSettings();
  const insets = useSafeAreaInsets();
  const amountInputRef = useRef<TextInput>(null);

  const { transactionId } = route.params;
  const transaction = transactions.find(t => t.id === transactionId);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType | 'transfer'>('expense');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [toGoalId, setToGoalId] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    if (transaction) {
      setTitle(transaction.title);
      setAmount(Math.abs(transaction.amount).toString());
      setType(transaction.type);
      setNotes(transaction.notes || '');
      setSelectedWallet(transaction.wallet);
      setDate(new Date(transaction.date));
      setToWalletId(transaction.toWalletId || '');
      setToGoalId(transaction.toGoalId || '');

      if (transaction.type !== 'transfer') {
        const cats = transaction.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
        setSelectedCategory(cats.find(c => c.name === transaction.category) || null);
      }
    }
  }, [transaction]);

  if (!transaction) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-textSecondary text-lg">Transaction not found</Text>
      </View>
    );
  }

  const getAmountParts = () => {
    if (!amount) return { dollars: '', cents: '.00', hasDecimal: false };
    const parts = amount.split('.');
    const dollars = parts[0];
    const cents = parts[1];
    if (cents !== undefined) {
      return { dollars, cents: '.' + cents.padEnd(3, '0').slice(0, 2), hasDecimal: true };
    }
    return { dollars, cents: '.00', hasDecimal: false };
  };

  const displayAmount = getAmountParts();
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const isValid = (() => {
    const base =
      title.trim() !== '' && amount !== '' && parseFloat(amount) > 0 && selectedWallet !== '';
    if (type === 'transfer') return base && (toWalletId !== '' || toGoalId !== '');
    return base && selectedCategory !== null;
  })();

  const handleTypeChange = (newType: typeof type) => {
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

    try {
      const numericAmount = parseFloat(amount);
      const finalAmount = type === 'expense' ? -numericAmount : numericAmount;

      await updateTransaction(transaction.id, {
        title: title.trim(),
        amount: type === 'transfer' ? numericAmount : finalAmount,
        type,
        category: type === 'transfer' ? 'Transfer' : selectedCategory?.name || '',
        date: date.toISOString(),
        wallet: selectedWallet,
        notes,
        toWalletId: type === 'transfer' ? toWalletId || undefined : undefined,
        toGoalId: type === 'transfer' ? toGoalId || undefined : undefined,
      });

      Alert.alert('Success', 'Transaction updated! ✅', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update transaction. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 8 }}
    >
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-border">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-primary text-lg">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-textPrimary text-xl font-semibold">Edit Transaction</Text>
          <View style={{ width: 60 }} />
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Amount */}
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
                keyboardType="decimal-pad"
                style={{ position: 'absolute', opacity: 0, width: 200, height: '100%' }}
              />
              <View className="flex-row items-baseline">
                <Text className="text-5xl font-bold text-textPrimary">
                  {displayAmount.dollars || '0'}
                </Text>
                <Text
                  className={`text-5xl font-bold ${displayAmount.hasDecimal ? 'text-textPrimary' : 'text-textSecondary/40'}`}
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
              placeholder="e.g., Lunch at Subway, Monthly salary..."
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
                className={`text-center font-semibold text-base ${type === 'expense' ? 'text-white' : 'text-textSecondary'}`}
              >
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleTypeChange('income')}
              className={`flex-1 py-4 rounded-xl ${type === 'income' ? 'bg-income' : 'bg-transparent'}`}
            >
              <Text
                className={`text-center font-semibold text-base ${type === 'income' ? 'text-white' : 'text-textSecondary'}`}
              >
                Income
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleTypeChange('transfer')}
              className={`flex-1 py-4 rounded-xl ${type === 'transfer' ? 'bg-primary' : 'bg-transparent'}`}
            >
              <Text
                className={`text-center font-semibold text-base ${type === 'transfer' ? 'text-white' : 'text-textSecondary'}`}
              >
                ⇄ Transfer
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category — hidden for transfers */}
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

        {/* To — only for transfers */}
        {type === 'transfer' && (
          <TransferToPicker
            selectedWalletId={toWalletId}
            selectedGoalId={toGoalId}
            excludeWalletName={selectedWallet}
            onSelectWallet={setToWalletId}
            onSelectGoal={setToGoalId}
          />
        )}

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
            className={`text-center font-semibold text-lg ${isValid ? 'text-white' : 'text-textSecondary'}`}
          >
            Save Changes
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
